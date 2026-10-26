import './style.css';
import { CLOSE, CLOSING_SOON, COMPANY, GAME_MINUTES_PER_SECOND, LOCKUP } from './features/game/data.ts';
import { newGame, SELF, tick, type GameState } from './features/game/rules.ts';
import { ROOM_ITEMS, SIPS } from './features/room3d/items.ts';
import { goTo, holdPhone, lowerPhone, mountRoom, openDrawer, phoneGlassElement, screenElement, setAtComputer, setLamp, setMug, setPhones, setScreen, setTools, showRoom, snapTo } from './features/room3d/view.ts';
import { drawerSlots, held, needsPush, onMyWay, phoneName, roguePending } from './features/game/phones.ts';
import { dayMood } from './features/game/people.ts';
import { phoneScreen } from './features/ui/phone.ts';
import { loadGame, saveGame } from './features/save/save.ts';
import type { App } from './features/ui/app.ts';
import { asleepScreen, computerScreen, darkScreen } from './features/ui/boot.ts';
import { refreshTimes } from './features/ui/desk.ts';
import { powerAway } from './features/ui/power.ts';
import { desktopScreen, notify } from './features/ui/desktop.ts';
import { dayEndScreen, endingScreen } from './features/ui/endings.ts';
import { announce, computerHud, deskVisitor, pickInRoom, roomHud, roomKeys } from './features/ui/roomHud.ts';
import { ambience, chime, click, keystroke, wake } from './features/ui/sound.ts';

const page = document.querySelector<HTMLDivElement>('#app');
if (!page) throw new Error('Missing #app');
const saved = loadGame();
const state = saved ?? newGame();
/** What's on the monitor while it isn't logged in, kept between redraws so a boot doesn't restart. */
let shown: { key: string; el: HTMLElement } | undefined;

/** A scrolled area, recognised again after a redraw: by its window, its class, and what it's showing. */
const scrollKey = (el: Element) =>
  `${/window-\w+/.exec(el.closest('.win')?.className ?? '')?.[0] ?? ''}|${el.className}|${(el as HTMLElement).dataset.scrollKey ?? ''}`;

/** Put a screen in a container, keeping focus on the same control, and every scrolled area where it was. */
function mount(into: HTMLElement, screen: HTMLElement, focus: boolean): void {
  const was = (document.activeElement as HTMLElement | null)?.dataset.testid;
  if (into.firstElementChild !== screen) {
    const scrolled = new Map<string, [number, number]>();
    for (const el of into.querySelectorAll('*')) if (el.scrollTop || el.scrollLeft) scrolled.set(scrollKey(el), [el.scrollTop, el.scrollLeft]);
    into.replaceChildren(screen);
    if (scrolled.size) for (const el of screen.querySelectorAll('*')) {
      const at = scrolled.get(scrollKey(el));
      if (at) [el.scrollTop, el.scrollLeft] = at;
    }
  }
  if (!focus) return;
  const same = was ? screen.querySelector<HTMLElement>(`[data-testid="${was}"]:not(:disabled)`) : null;
  const dialog = screen.querySelector<HTMLElement>('[role="dialog"] [data-autofocus]');
  (dialog ?? same ?? screen.querySelector<HTMLElement>('[data-autofocus]'))?.focus({ preventScroll: true });
}

const app: App = {
  state,
  // You start each visit looking at the desk. Mid-day, the computer is locked where you left it.
  ui: { booted: false, view: 'room', shot: 'overview', windows: [], toasts: [], power: state.phase === 'boot' ? 'off' : 'locked' },
  hasSave: saved !== undefined,
  set(next) {
    const { ui } = app;
    // A new day starts with a fresh desktop.
    if (next.phase === 'boot' && app.state.phase !== 'boot') { ui.windows = []; ui.toasts = []; ui.startOpen = false; }
    // A new day starts at your desk with the computer off.
    if (next.phase === 'boot' && app.state.phase !== 'boot') { ui.view = 'room'; ui.shot = 'overview'; ui.power = 'off'; }
    // The day's over: shut the computer down and pull back to the desk, then show the summary.
    if (next.phase === 'dayEnd' && app.state.phase === 'desk') windDown(next);
    // Walking away leaves it on, counting the time until it locks; walking back means sitting down at it again.
    app.state = next;
    saveGame(next);
    app.rerender();
  },
  rerender() {
    const { phase } = app.state;
    const { ui } = app;
    const fullPage = (phase === 'dayEnd' && !ui.windingDown) || phase === 'ending';
    const atComputer = ui.view === 'computer' && !fullPage;

    // The monitor: logged in, it's the game's computer; otherwise dark, asleep, booting or locked.
    const p = ui.power;
    let screen: HTMLElement;
    if (p === 'on' && !fullPage) {
      shown = undefined;
      screen = phase === 'desktop' || phase === 'desk' ? desktopScreen(app) : darkScreen();
    } else {
      const key = p === 'on' ? 'locked' : p === 'asleep' ? `asleep:${atComputer}` : p;
      if (shown?.key !== key) shown = { key, el: p === 'off' ? darkScreen() : p === 'asleep' ? asleepScreen(app, atComputer) : computerScreen(app) };
      screen = shown.el;
    }
    mount(screenElement(), screen, atComputer && !ui.flying);

    // The page over the 3D: full screens, the room's caption and buttons, or a way to stand up from the computer.
    const top = phase === 'ending' ? endingScreen(app)
      : fullPage ? dayEndScreen(app)
      : ui.view === 'room' ? roomHud(app)
      : computerHud(app);
    mount(page, top, !atComputer);

    document.body.classList.toggle('in-room', !fullPage);
    // The day's summary sits over the desk, dimmed; an ending gets the whole page.
    showRoom(phase !== 'ending');
    document.body.classList.toggle('day-over', fullPage);
    setAtComputer(atComputer && !ui.flying);
    // The room is heard from the desk, and fades out once you sit down at the computer.
    ambience(!atComputer && phase !== 'ending');
    void goTo(atComputer ? 'computer' : ui.shot);
    setScreen(p === 'off' ? 'off' : p === 'asleep' ? 'asleep' : 'on');
    setTools(app.state.tools);
    // The top drawer, open while you're looking into it, with whatever phones are still in it.
    openDrawer(ui.view === 'room' && ui.shot === 'drawer' && !fullPage);
    const buzzing = roguePending(app.state) || (needsPush(app.state) && ui.windows.some((w) => w.id === 'okta'));
    const wanted = deskVisitor(app.state)?.phone;
    void setPhones(drawerSlots(app.state.phones).map(({ id, slot }) => {
      const x = app.state.phones.find((p) => p.id === id);
      return { id, slot, glow: (x?.owner === SELF && buzzing) || id === wanted ? 2 : x?.setUp ? 1 : 0 };
    }), app.state.phones.length > 0);
    // The phone in your hand, held up to your face, its screen drawn on its glass.
    const phoneUp = Boolean(ui.phoneUp && held(app.state)) && !fullPage;
    if (phoneUp) void holdPhone(); else lowerPhone();
    mount(phoneGlassElement(), phoneScreen(app), false);
    setLamp(!ui.lampOff);
    setMug(1 - (ui.sips ?? 0) / SIPS.length);
  },
  refreshTimes() {
    refreshTimes(screenElement(), app.state);
    refreshTimes(page, app.state);
  },
};

/** Long enough for the camera to pull back and to read the caption. */
const WIND_DOWN_MS = 3200;

function windDown(s: GameState): void {
  const { ui } = app;
  Object.assign(ui, { power: 'off', windows: [], toasts: [], startOpen: false, view: 'room', shot: 'overview', leftAt: undefined, windingDown: true });
  ui.note = s.clock >= LOCKUP
    ? '6pm. Security is locking up. You shut the computer down and head for the bus.'
    : 'You shut the computer down and head for the bus.';
  setTimeout(() => { ui.windingDown = false; ui.note = undefined; app.rerender(); }, WIND_DOWN_MS);
}

/** Half an hour's warning, then closing time: said on the computer, and in the room if you're away from it. */
function closingTime(before: GameState, after: GameState): void {
  const line = before.clock < CLOSE && after.clock >= CLOSE
    ? '5pm. The office is closed: no new tickets. Finish what you\u2019re on, then go home. Security locks up at 6.'
    : before.clock < CLOSING_SOON && after.clock >= CLOSING_SOON ? 'Half an hour to go. The office closes at 5.' : undefined;
  if (!line) return;
  chime();
  notify(app, { app: 'desk', from: `${COMPANY} \u00b7 Facilities`, text: line });
  if (app.ui.view !== 'computer') app.ui.note = line;
  app.rerender();
}

/** Did this tick change more than the clock? Then redraw; otherwise just move the times on. */
const visitKey = (s: GameState) => { const v = deskVisitor(s); return v ? `${v.login}:${v.why}` : ''; };
const approvals = (s: GameState) => s.requests.filter((r) => r.approvedAt !== undefined).length;
const bigChange = (a: GameState, b: GameState) =>
  visitKey(a) !== visitKey(b) || approvals(a) !== approvals(b) || a.phase !== b.phase || a.outcomes.length !== b.outcomes.length || a.queue.join() !== b.queue.join() ||
  a.chats.join() !== b.chats.join() || a.notice !== b.notice ||
  b.queue.some((id) => a.tickets[id]?.messages.length !== b.tickets[id]?.messages.length);

// The office clock: it runs from when you log in until security locks up at 6pm, and stops while you're holding something or in another tab.
setInterval(() => {
  const { ui } = app;
  // The computer's own clock runs regardless: left on while you're away, it locks itself and then sleeps, right there on the monitor.
  const power = powerAway(ui.power, ui.leftAt, performance.now());
  if (power !== ui.power) { ui.power = power; app.rerender(); }
  if (!ui.booted || ui.inspecting || document.hidden) return;
  const next = tick(app.state, GAME_MINUTES_PER_SECOND);
  if (next === app.state) return;
  const before = app.state;
  if (bigChange(before, next)) { announce(app, before, next); app.set(next); }
  else { app.state = next; saveGame(next); app.refreshTimes(); }
  closingTime(before, next);
  phoneNews(before, next);
}, 1000);

/** Someone turning up at your desk about a phone, or Mr. Grisby approving a replacement: said wherever you are. */
function phoneNews(before: GameState, after: GameState): void {
  const visit = deskVisitor(after);
  const lines: [string, string][] = [];
  if (visit && visitKey(before) !== visitKey(after)) {
    // In their own words, and their own mood: on their way over.
    lines.push([after.okta.users[visit.login]?.name ?? visit.login, onMyWay(after, visit, dayMood(visit.login, after.day).mood)]);
  }
  if (approvals(after) > approvals(before)) lines.push(['Mr. Grisby', 'Approved. The replacement phone is in your top drawer. Try not to let anyone put it on a car roof.']);
  for (const [from, text] of lines) {
    chime();
    notify(app, { app: 'chat', from, text });
    if (app.ui.view !== 'computer') app.ui.note = `${from}: \u201C${text}\u201D`;
  }
  if (lines.length) app.rerender();
}

addEventListener('keydown', (e) => roomKeys(app, e));
addEventListener('keydown', wake);
// At the computer, the first Tab goes into the screen, not to the "stand up" arrow beside it.
addEventListener('keydown', (e) => {
  if (e.key !== 'Tab' || e.shiftKey || app.ui.view !== 'computer' || app.ui.flying || document.activeElement !== document.body) return;
  const first = screenElement().querySelector<HTMLElement>('[data-autofocus], input, button, [href], [tabindex]:not([tabindex="-1"])');
  if (first) { e.preventDefault(); first.focus(); }
});
// On the lock screen, Enter logs in wherever focus has wandered (it can land on the page after the camera moves).
addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' || app.ui.view !== 'computer' || e.target instanceof HTMLButtonElement || e.target instanceof HTMLInputElement) return;
  const login = screenElement().querySelector<HTMLFormElement>('form.login');
  if (login) { e.preventDefault(); login.requestSubmit(); }
});
addEventListener('pointerdown', () => { wake(); if (app.ui.view === 'computer') click(); });
// Typing at the computer: every key you press in a text box, notes included, clacks on the old keyboard.
addEventListener('keydown', (e) => {
  const typing = e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement;
  if (app.ui.view === 'computer' && typing && !e.repeat && (e.key.length === 1 || ['Backspace', 'Enter', 'Delete'].includes(e.key))) keystroke(e.key === ' ' || e.key === 'Enter');
});

/** A small tile of static for the CRT look, made once. */
function staticTile(): string {
  const c = document.createElement('canvas');
  c.width = c.height = 96;
  const ctx = c.getContext('2d');
  if (!ctx) return '';
  const img = ctx.createImageData(96, 96);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.random() * 255;
    img.data.set([v, v, v, Math.random() < 0.5 ? 22 : 0], i);
  }
  ctx.putImageData(img, 0, 0);
  return c.toDataURL();
}
document.documentElement.style.setProperty('--static', `url(${staticTile()})`);

snapTo('overview');
void mountRoom({
  pick: (id) => pickInRoom(app, id),
  hover: (id) => {
    const label = page.querySelector<HTMLElement>('[data-hover]');
    if (label) label.textContent = id === 'tool' ? 'Something in the tray' : id?.startsWith('phone-') ? phoneName(app.state, id) : ROOM_ITEMS.find((i) => i.id === id)?.label ?? '';
  },
}).then(() => app.rerender());
app.rerender();
