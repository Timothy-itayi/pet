import { COMPANY, DAYS, TOOLS } from '../game/data.ts';
import { ROOM_ITEMS } from '../room3d/items.ts';
import { closeInspect, goTo, inspectItem, isInspecting, turnInspected } from '../room3d/view.ts';
import type { App } from './app.ts';
import { clockText, h } from './dom.ts';
import { powerOnReturn } from './power.ts';

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** What an item says, including loot in the tray. */
function describe(app: App, id: string): { label: string; says: string } | undefined {
  if (id === 'tool') {
    const tool = TOOLS.find((t) => app.state.tools.includes(t.id));
    return tool && { label: tool.name, says: tool.gift };
  }
  const item = ROOM_ITEMS.find((i) => i.id === id);
  return item && { label: item.label, says: item.says(app.state.day) };
}

/** Press the power button on the case: it starts booting, and you pull your chair in while it does. */
export function pressPower(app: App): void {
  const { ui } = app;
  if (ui.power !== 'off') { ui.note = 'It\u2019s already on. The light on the case is green.'; app.rerender(); return; }
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
  ui.power = powerOnReturn(ui.power, ui.leftAt, app.state.clock);
  app.rerender();
  void goTo('computer').then(() => { ui.flying = false; app.rerender(); });
}

/** Stand up from the computer: it locks, and the camera pulls back to the whole desk. */
export function leaveComputer(app: App): void {
  const { ui } = app;
  ui.view = 'room';
  ui.shot = 'overview';
  ui.panel = undefined;
  if (ui.power === 'on') { ui.power = 'locked'; ui.leftAt = app.state.clock; }
  app.rerender();
}

export function pickInRoom(app: App, id: string): void {
  const { ui } = app;
  ui.note = undefined;
  const item = ROOM_ITEMS.find((i) => i.id === id);
  if (id === 'computer') return sitAtComputer(app);
  if (id === 'power') return pressPower(app);
  if (id === 'wall' || item?.kind === 'wall') { ui.shot = 'wall'; app.rerender(); return; }
  if (!describe(app, id)) return;
  ui.inspecting = id;
  inspectItem(id);
  app.rerender();
}

function putBack(app: App): void {
  closeInspect();
  app.ui.inspecting = undefined;
  app.rerender();
}

/** Keys in the room: Esc puts things back or steps back; arrows turn what you're holding. */
/** While you're at the computer: a way to stand up again. Everything else is on the screen itself. */
export function computerHud(app: App): HTMLElement {
  return h('main', { class: 'room-hud computer-hud' },
    h('button', { class: 'btn small stand-up', 'data-testid': 'stand-up', onclick: () => leaveComputer(app) }, '\u2190 Stand up'));
}

export function roomKeys(app: App, e: KeyboardEvent): void {
  const { ui } = app;
  if (ui.view !== 'room' || ui.panel) return;
  if (e.key === 'Escape') {
    if (isInspecting()) putBack(app);
    else if (ui.shot !== 'overview') { ui.shot = 'overview'; app.rerender(); }
    return;
  }
  const turns: Record<string, [number, number]> = { ArrowLeft: [-0.3, 0], ArrowRight: [0.3, 0], ArrowUp: [0, -0.3], ArrowDown: [0, 0.3] };
  const turn = turns[e.key];
  if (turn && isInspecting()) { e.preventDefault(); turnInspected(...turn); }
}

/** Shown over the 3D room: where you are, what you're looking at, and a button for everything you can click. */
export function roomHud(app: App): HTMLElement {
  const { state, ui } = app;
  const day = state.day > DAYS ? 'Saturday' : `${WEEKDAYS[state.day - 1]}, day ${state.day}`;
  const dropped = TOOLS.find((t) => t.id === state.drop);
  const held = ui.inspecting ? describe(app, ui.inspecting) : undefined;
  const intro = ui.note ?? (dropped ? `Something new in your ticket tray. ${dropped.gift}`
    : state.day === 1 && state.phase === 'boot' ? 'Your first day. This was Sam’s desk. Click around, or use the buttons below.'
    : 'Sam\u2019s desk. Well, yours now.');
  const things = [
    ...ROOM_ITEMS.filter((i) => i.kind === 'inspect' && (ui.shot === 'wall') === ['notes', 'calendar', 'binders'].includes(i.id)),
    ...(state.tools.length && ui.shot === 'overview' ? [{ id: 'tool', label: describe(app, 'tool')?.label ?? 'Tool' }] : []),
  ];
  return h('main', { class: 'room-hud', 'data-testid': 'room' },
    h('header', { class: 'room-top' },
      h('p', {}, `${COMPANY} IT Help Desk`),
      h('p', {}, state.phase === 'desk' ? `${day}, ${clockText(state.clock)}` : day)),
    held && h('section', { class: 'inspect-panel', role: 'dialog', 'aria-labelledby': 'held-name', 'data-testid': 'inspect' },
      h('h2', { id: 'held-name' }, held.label),
      h('p', {}, held.says),
      h('p', { class: 'meta' }, 'Drag it, or use the arrow keys, to turn it over.'),
      h('button', { class: 'btn', 'data-testid': 'put-back', 'data-autofocus': true, onclick: () => putBack(app) }, 'Put it back (Esc)')),
    !held && h('section', { class: 'room-bottom' },
      h('p', { class: 'caption', 'aria-live': 'polite', 'data-testid': 'caption' }, intro),
      h('p', { class: 'hover-label', 'aria-hidden': 'true', 'data-hover': true }),
      h('div', { class: 'room-actions' },
        ui.power === 'off'
          ? h('button', { class: 'btn primary', 'data-testid': 'press-power', 'data-autofocus': true, onclick: () => pressPower(app) }, 'Press the power button')
          : h('button', { class: 'btn primary', 'data-testid': 'use-computer', 'data-autofocus': true, onclick: () => sitAtComputer(app) }, 'Sit at the computer'),
        ui.shot === 'overview'
          ? h('button', { class: 'btn', 'data-testid': 'look-wall', onclick: () => pickInRoom(app, 'wall') }, 'Look at the wall')
          : h('button', { class: 'btn', 'data-testid': 'step-back', onclick: () => { ui.shot = 'overview'; app.rerender(); } }, 'Step back (Esc)'),
        ...things.map((t) => h('button', {
          class: `btn small${t.id === 'tool' && dropped ? ' new' : ''}`, 'data-testid': `item-${t.id}`, onclick: () => pickInRoom(app, t.id),
        }, t.label)))),
  );
}
