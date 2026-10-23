import './style.css';
import { GAME_MINUTES_PER_SECOND } from './features/game/data.ts';
import { newGame, tick, type GameState } from './features/game/rules.ts';
import { ROOM_ITEMS, SIPS } from './features/room3d/items.ts';
import { goTo, mountRoom, screenElement, setAtComputer, setLamp, setMug, setScreen, setTools, showRoom, snapTo } from './features/room3d/view.ts';
import { loadGame, saveGame } from './features/save/save.ts';
import type { App } from './features/ui/app.ts';
import { asleepScreen, computerScreen, darkScreen } from './features/ui/boot.ts';
import { refreshTimes } from './features/ui/desk.ts';
import { powerAway } from './features/ui/power.ts';
import { desktopScreen, tickRealClock } from './features/ui/desktop.ts';
import { dayEndScreen, endingScreen } from './features/ui/endings.ts';
import { announce, computerHud, pickInRoom, roomHud, roomKeys } from './features/ui/roomHud.ts';

const page = document.querySelector<HTMLDivElement>('#app');
if (!page) throw new Error('Missing #app');
const saved = loadGame();
const state = saved ?? newGame();
/** What's on the monitor while it isn't logged in, kept between redraws so a boot doesn't restart. */
let shown: { key: string; el: HTMLElement } | undefined;

/** Put a screen in a container, keeping focus on the same control if it's still there. */
function mount(into: HTMLElement, screen: HTMLElement, focus: boolean): void {
  const was = (document.activeElement as HTMLElement | null)?.dataset.testid;
  if (into.firstElementChild !== screen) into.replaceChildren(screen);
  if (!focus) return;
  const same = was ? screen.querySelector<HTMLElement>(`[data-testid="${was}"]:not(:disabled)`) : null;
  const dialog = screen.querySelector<HTMLElement>('[role="dialog"] [data-autofocus]');
  (dialog ?? same ?? screen.querySelector<HTMLElement>('[data-autofocus]'))?.focus({ preventScroll: true });
}

const app: App = {
  state,
  // You start each visit looking at the desk. Mid-day, the computer is locked where you left it.
  ui: { booted: false, view: 'room', shot: 'overview', windows: [], toasts: [], power: state.phase === 'boot' ? 'off' : 'locked', paused: false },
  hasSave: saved !== undefined,
  set(next) {
    const { ui } = app;
    // A new day starts with a fresh desktop.
    if (next.phase === 'boot' && app.state.phase !== 'boot') { ui.windows = []; ui.toasts = []; ui.startOpen = false; }
    // A new day starts at your desk with the computer off.
    if (next.phase === 'boot' && app.state.phase !== 'boot') { ui.view = 'room'; ui.shot = 'overview'; ui.power = 'off'; }
    // Walking away leaves it on, counting the time until it locks; walking back means sitting down at it again.
    app.state = next;
    saveGame(next);
    app.rerender();
  },
  rerender() {
    const { phase } = app.state;
    const { ui } = app;
    const fullPage = phase === 'dayEnd' || phase === 'ending';
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
    const top = phase === 'dayEnd' ? dayEndScreen(app)
      : phase === 'ending' ? endingScreen(app)
      : ui.view === 'room' ? roomHud(app)
      : computerHud(app);
    mount(page, top, !atComputer);

    document.body.classList.toggle('in-room', !fullPage);
    showRoom(!fullPage);
    setAtComputer(atComputer && !ui.flying);
    void goTo(atComputer ? 'computer' : ui.shot);
    setScreen(p === 'off' ? 'off' : p === 'asleep' ? 'asleep' : 'on');
    setTools(app.state.tools);
    setLamp(!ui.lampOff);
    setMug(1 - (ui.sips ?? 0) / SIPS.length);
  },
  refreshTimes() {
    refreshTimes(screenElement(), app.state);
    refreshTimes(page, app.state);
  },
};

/** Did this tick change more than the clock? Then redraw; otherwise just move the times on. */
const bigChange = (a: GameState, b: GameState) =>
  a.phase !== b.phase || a.outcomes.length !== b.outcomes.length || a.queue.join() !== b.queue.join() ||
  a.chats.join() !== b.chats.join();

// The office clock: it runs from when you log in until 5pm, and stops while paused, holding something, or in another tab.
setInterval(() => {
  const { ui } = app;
  // The computer's own clock runs regardless: left on while you're away, it locks itself and then sleeps, right there on the monitor.
  const power = powerAway(ui.power, ui.leftAt, performance.now());
  if (power !== ui.power) { ui.power = power; app.rerender(); }
  if (!ui.booted || ui.paused || ui.inspecting || document.hidden) return;
  const next = tick(app.state, GAME_MINUTES_PER_SECOND);
  if (next === app.state) return;
  if (bigChange(app.state, next)) { announce(app, app.state, next); app.set(next); return; }
  app.state = next;
  saveGame(next);
  app.refreshTimes();
}, 1000);

addEventListener('keydown', (e) => roomKeys(app, e));
// The taskbar clock is your real one: keep it ticking.
setInterval(tickRealClock, 5000);

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
    if (label) label.textContent = id === 'tool' ? 'Something in the tray' : ROOM_ITEMS.find((i) => i.id === id)?.label ?? '';
  },
}).then(() => app.rerender());
app.rerender();
