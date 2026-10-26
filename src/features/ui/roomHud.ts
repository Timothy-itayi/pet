import { CLOSE, COMPANY, DAYS, TOOLS } from '../game/data.ts';
import { drawerSlots, handOver, held, phoneName, putDown, requestReplacement, takeBroken, takePhone, visitor } from '../game/phones.ts';
import { whereIs } from '../game/people.ts';
import { portrait } from './portrait.ts';
import { canClockOut, clockOut, weekday, weekOf, type GameState } from '../game/rules.ts';
import { ON_THE_WALL, ROOM_ITEMS, SIPS } from '../room3d/items.ts';
import { closeInspect, goTo, inspectItem, isInspecting, pressMouse, sipMug, spinChair, swayPlant, turnInspected } from '../room3d/view.ts';
import type { App } from './app.ts';
import { closeBook, flipBook, openBook } from './book.ts';
import { announceArrival } from './desktop.ts';
import { clockText, h } from './dom.ts';
import { powerAway } from './power.ts';
import { isMuted, setMuted } from './sound.ts';


/** What an item says, including loot in the tray. */
function describe(app: App, id: string): { label: string; says: string } | undefined {
  if (id === 'tool') {
    const tool = TOOLS.find((t) => app.state.tools.includes(t.id));
    return tool && { label: tool.name, says: tool.gift };
  }
  const item = ROOM_ITEMS.find((i) => i.id === id);
  return item && { label: item.label, says: item.says(app.state.day) };
}

/** The power button on the case toggles it: off, it starts its long boot and you pull your chair in; on, it shuts down. */
export function pressPower(app: App): void {
  const { ui } = app;
  if (ui.power !== 'off') {
    ui.power = 'off';
    ui.note = 'Click. The fan winds down and the screen goes dark.';
    app.rerender();
    return;
  }
  ui.power = 'booting';
  sitAtComputer(app);
}

/** Sit down at the computer: the camera pushes straight in until the screen fills your view. */
export function sitAtComputer(app: App): void {
  const { ui } = app;
  if (ui.view === 'computer') return;
  if (ui.power === 'off') {
    ui.note = 'The screen is dark. The power button is on the beige case under the monitor.';
    app.rerender();
    return;
  }
  ui.note = undefined;
  closeInspect();
  ui.inspecting = undefined;
  ui.view = 'computer';
  ui.flying = true;
  ui.power = powerAway(ui.power, ui.leftAt, performance.now());
  ui.leftAt = undefined;
  app.rerender();
  void goTo('computer').then(() => { ui.flying = false; app.rerender(); });
}

/** Stand up from the computer: it stays on, counting the time until it locks, and the camera pulls back to the whole desk. */
export function leaveComputer(app: App): void {
  const { ui } = app;
  ui.view = 'room';
  ui.shot = 'overview';
  ui.startOpen = false;
  ui.leftAt ??= performance.now();
  app.rerender();
}

/**
 * Something new has turned up. Burrow Chat pops up a notification on the computer, and if you're away from it,
 * the room's caption says who it's from, so you know when to head back.
 */
export function announce(app: App, before: GameState, after: GameState): void {
  const line = announceArrival(app, before, after);
  if (line && app.ui.view !== 'computer') app.ui.note = line;
}

/** Tap the mouse from where you stand: the left button clicks, and a sleeping computer wakes up. The camera stays put. */
export function tapMouse(app: App): void {
  const { ui } = app;
  pressMouse();
  ui.note = ui.power === 'asleep' ? 'Click. The screen flickers back to life.'
    : ui.power === 'off' ? 'Click. Nothing. The computer is off.'
    : ui.power === 'locked' || ui.power === 'waking' ? 'Click. It\u2019s locked. Sit down to log in.'
    : 'Click.';
  if (ui.power === 'asleep') ui.power = 'waking';
  // A click counts as using it, so its count to locking and sleeping starts again.
  if (ui.power !== 'off') ui.leftAt = performance.now();
  app.rerender();
}

/** A sip of Sam's cold coffee, until there's none left. */
function sip(app: App): string {
  const { ui } = app;
  const taken = ui.sips ?? 0;
  if (taken >= SIPS.length) return 'Empty. Just a brown ring at the bottom.';
  sipMug();
  ui.sips = taken + 1;
  return SIPS[taken] ?? '';
}

/** Click something in the room. Some things you pick up; most you use where they are. */
export function pickInRoom(app: App, id: string): void {
  const { ui } = app;
  // The day is over: nothing to do at the desk until tomorrow.
  if (app.state.phase === 'dayEnd') return;
  ui.note = undefined;
  // A company phone in the drawer: pick it up, and it comes up to your face.
  if (id.startsWith('phone-')) {
    ui.phoneUp = true;
    ui.phoneScreen = undefined;
    ui.phoneSaid = undefined;
    app.set(takePhone(app.state, id));
    return;
  }
  const item = ROOM_ITEMS.find((i) => i.id === id);
  const says = item?.says(app.state.day);
  switch (item?.kind) {
    case 'computer': return sitAtComputer(app);
    case 'power': return pressPower(app);
    case 'mouse': return tapMouse(app);
    case 'wall': ui.shot = 'wall'; break;
    case 'drawer': ui.shot = 'drawer'; ui.note = says; break;
    case 'look': ui.note = says; break;
    case 'spin': spinChair(); ui.note = says; break;
    case 'sway': swayPlant(); ui.note = says; break;
    case 'lamp':
      ui.lampOff = !ui.lampOff;
      ui.note = ui.lampOff ? 'Click. The lamp goes off.' : 'Click. Warm light pools on the desk again.';
      break;
    case 'sip': ui.note = sip(app); break;
    default:
      // Things you pick up and turn over, including whatever's turned up in the ticket tray.
      if (!describe(app, id)) return;
      ui.inspecting = id;
      inspectItem(id);
  }
  app.rerender();
}

function putBack(app: App): void {
  closeInspect();
  app.ui.inspecting = undefined;
  app.ui.book = undefined;
  app.rerender();
}

/** Sound on or off, in the same corner wherever you are. */
function soundChip(app: App): HTMLElement {
  const off = isMuted();
  return h('button', {
    class: 'back-chip sound-chip', 'data-testid': 'sound', 'aria-label': 'Sound', 'aria-pressed': String(!off),
    title: off ? 'Sound off' : 'Sound on', onclick: () => { setMuted(!off); app.rerender(); },
  }, off ? '\u{1F507}' : '\u{1F50A}');
}

/**
 * The phone in your hand: a button to bring it up, and once it's up, ways to lower it, put it back in the drawer, or
 * give it to whoever it's set up for.
 */
function phoneChips(app: App): HTMLElement | false {
  const { state, ui } = app;
  const phone = held(state);
  if (!phone) return false;
  const lower = () => { ui.phoneUp = false; app.rerender(); };
  if (!ui.phoneUp) {
    return h('button', { class: 'back-chip phone-chip', 'data-testid': 'phone-raise', 'aria-label': 'Raise your phone', title: 'Your phone', onclick: () => { ui.phoneUp = true; app.rerender(); } }, '\u{1F4F1}');
  }
  const request = state.requests.find((r) => r.phone === phone.id);
  return h('div', { class: 'phone-actions', role: 'group', 'aria-label': 'Your phone' },
    phone.broken && (request
      ? h('p', { class: 'phone-request', role: 'status' }, request.refusedAt !== undefined ? 'Mr. Grisby said no: budget freeze. Use a spare from the drawer.' : 'Replacement requested. Waiting for Mr. Grisby to approve it.')
      : h('button', { class: 'btn primary', 'data-testid': 'phone-request', onclick: () => app.set(requestReplacement(state, phone.id)) }, 'Request a replacement (Mr. Grisby approves)')),
    h('button', { class: 'btn', 'data-testid': 'phone-lower', onclick: lower }, 'Lower it'),
    ui.view === 'room' && h('button', { class: 'btn', 'data-testid': 'phone-put-back', onclick: () => { ui.phoneUp = false; app.set(putDown(state)); } }, 'Put it back in the drawer'));
}

/** Who's in the office right now, as far as coming over to your desk goes: not out, at lunch, in a meeting or gone home. */
const inOffice = (s: GameState) => (login: string) => ['desk', 'coffee', 'arriving'].includes(whereIs(login, s.day, s.clock).doing);

/** Someone at your desk about a phone, if anyone: the room shows them; at the computer, a line says they're waiting. */
export const deskVisitor = (s: GameState) => (s.phase === 'desk' ? visitor(s, inOffice(s)) : undefined);

function visitorCard(app: App): HTMLElement | false {
  const { state, ui } = app;
  const visit = deskVisitor(state);
  if (!visit) return false;
  const name = state.okta.users[visit.login]?.name ?? visit.login;
  const inHand = held(state)?.id === visit.phone;
  const give = () => { ui.phoneUp = false; ui.note = `You hand ${name} the phone. ${name} wanders off, already poking at it.`; app.set(handOver(state, visit.phone)); };
  const take = () => { ui.phoneUp = true; ui.phoneScreen = undefined; ui.note = `${name} hands over what\u2019s left of the phone, with an apology.`; app.set(takeBroken(state, visit.phone)); };
  return h('aside', { class: 'visitor', role: 'dialog', 'aria-label': `${name} is at your desk`, 'data-testid': 'visitor' },
    portrait(name, 72),
    h('div', {},
      h('p', {}, h('strong', {}, name), visit.why === 'pickup' ? ' is at your desk to pick up the phone you set up.' : ' is at your desk with the broken phone.'),
      visit.why === 'dropoff'
        ? h('button', { class: 'btn primary', 'data-testid': 'visitor-take', onclick: take }, 'Take the broken phone')
        : inHand ? h('button', { class: 'btn primary', 'data-testid': 'visitor-give', onclick: give }, `Hand it to ${name}`)
        : h('p', { class: 'meta' }, `Their phone\u2019s in the top drawer. Pick it up, then hand it over.`)));
}

/** While you're at the computer: a way to stand up again, and the sound switch. Everything else is on the screen itself. */
export function computerHud(app: App): HTMLElement {
  const visit = deskVisitor(app.state);
  return h('main', { class: 'room-hud computer-hud' },
    h('button', { class: 'back-chip', 'data-testid': 'stand-up', 'aria-label': 'Stand up', title: 'Stand up', onclick: () => leaveComputer(app) }, '\u2190'),
    soundChip(app),
    visit && h('p', { class: 'visitor-waiting', role: 'status' }, `${app.state.okta.users[visit.login]?.name ?? visit.login} is coming to your desk. Stand up to see them.`),
    phoneChips(app));
}

/** Keys in the room: Esc puts things back or steps back; arrows turn what you're holding. */
export function roomKeys(app: App, e: KeyboardEvent): void {
  const { ui } = app;
  if (ui.view !== 'room') return;
  // Reading the runbook: arrows turn the pages, Esc closes it (you're still holding it).
  if (ui.book !== undefined) {
    if (e.key === 'Escape') closeBook(app);
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); flipBook(app, e.key === 'ArrowLeft' ? -1 : 1); }
    return;
  }
  if (e.key === 'Escape') {
    if (ui.phoneUp) { ui.phoneUp = false; app.rerender(); } else if (isInspecting()) putBack(app);
    else if (ui.shot !== 'overview') { ui.shot = 'overview'; app.rerender(); }
    return;
  }
  const turns: Record<string, [number, number]> = { ArrowLeft: [-0.3, 0], ArrowRight: [0.3, 0], ArrowUp: [0, -0.3], ArrowDown: [0, 0.3] };
  const turn = turns[e.key];
  if (turn && isInspecting()) { e.preventDefault(); turnInspected(...turn); }
}

/**
 * Shown over the 3D room: just a line of text and, when you've moved in close, a small way back.
 * No buttons telling you what to do: Sam's notes do that. The things you can click are also listed for keyboard
 * and screen-reader players, hidden until you Tab to them.
 */
export function roomHud(app: App): HTMLElement {
  const { state, ui } = app;
  const day = state.day > DAYS ? 'Saturday' : `${weekday(state.day)}, week ${weekOf(state.day)}`;
  const dropped = TOOLS.find((t) => t.id === state.drop);
  const held = ui.inspecting ? describe(app, ui.inspecting) : undefined;
  const intro = ui.note ?? (dropped ? `Something new in your ticket tray. ${dropped.gift}`
    : state.day === 1 && state.phase === 'boot' ? 'Your first day. This was Sam\u2019s desk. Sam left notes.'
    : 'Sam\u2019s desk. Well, yours now.');
  const here = ui.shot === 'drawer'
    ? drawerSlots(state.phones).sort((a, b) => a.slot - b.slot).map(({ id }) => ({ id, label: phoneName(state, id) }))
    : ROOM_ITEMS.filter((i) => ON_THE_WALL.includes(i.id) === (ui.shot === 'wall'));
  const things = [...here, ...(state.tools.length && ui.shot === 'overview' ? [{ id: 'tool', label: describe(app, 'tool')?.label ?? 'Tool' }] : [])];
  return h('main', { class: 'room-hud', 'data-testid': 'room' },
    soundChip(app),
    phoneChips(app),
    visitorCard(app),
    h('header', { class: 'room-top' },
      h('p', {}, `${COMPANY} IT Help Desk`),
      h('p', {}, state.phase === 'desk' ? `${day}, ${clockText(state.clock)}` : day)),
    h('nav', { class: 'skip-list', 'aria-label': 'Things you can look at' }, ...things.map((t) => h('button', {
      class: 'skip-item', 'data-testid': `item-${t.id}`, onclick: () => pickInRoom(app, t.id),
    }, t.label))),
    held && ui.inspecting === 'runbook' && ui.book !== undefined ? openBook(app) : held && h('section', { class: 'inspect-panel', role: 'dialog', 'aria-labelledby': 'held-name', 'data-testid': 'inspect' },
      h('h2', { id: 'held-name' }, held.label),
      h('p', {}, held.says),
      h('p', { class: 'meta' }, ui.inspecting === 'runbook' ? 'Drag to turn it over. Open it to read it. Esc to put it back.' : 'Drag to turn it over. Esc to put it back.'),
      ui.inspecting === 'runbook' && h('button', {
        class: 'btn primary', 'data-testid': 'open-book', 'data-autofocus': true, onclick: () => { ui.book = 0; app.rerender(); },
      }, 'Open it'),
      h('button', { class: 'back-chip', 'data-testid': 'put-back', 'data-autofocus': true, 'aria-label': 'Put it back', onclick: () => putBack(app) }, '\u2190')),
    !held && ui.shot !== 'overview' && h('button', {
      class: 'back-chip corner', 'data-testid': 'step-back', 'aria-label': 'Step back', onclick: () => { ui.shot = 'overview'; app.rerender(); },
    }, '\u2190'),
    !held && h('section', { class: 'room-bottom' },
      h('p', { class: 'hover-label', 'aria-hidden': 'true', 'data-hover': true }),
      h('p', { class: 'caption', 'aria-live': 'polite', 'data-testid': 'caption' }, intro),
      state.phase === 'desk' && state.clock >= CLOSE && h('div', { class: 'room-actions' }, h('button', {
        class: 'btn primary', 'data-testid': 'clock-out', disabled: !canClockOut(state), onclick: () => app.set(clockOut(state)),
      }, 'Go home'))),
  );
}
