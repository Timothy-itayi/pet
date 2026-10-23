import { DAYS, MANAGER, VILLAGERS } from '../game/data.ts';
import { newsFor } from '../game/news.ts';
import { isWeekOver, readNews, scriptFor, ticketById, type GameState } from '../game/rules.ts';
import type { App, AppId, Toast, Win } from './app.ts';
import { chatApp } from './chat.ts';
import { outcomeCard, pausedCard, serviceDesk } from './desk.ts';
import { clockText, h } from './dom.ts';
import { BODIES } from './panels.ts';
import { leaveComputer } from './roomHud.ts';
import { chime } from './sound.ts';

/**
 * BurrowOS: the computer's desktop for the whole working day. Programs open in windows you can drag, minimise
 * to the taskbar, maximise and close; the Start menu has everything else; notifications pop up in the corner.
 */

const APPS: Record<AppId, { title: string; label: string; glyph: string; w: number; h: number; max?: boolean }> = {
  desk: { title: 'Burrow Service Desk — Incidents', label: 'Service Desk', glyph: '\u{1F3AB}', w: 900, h: 620, max: true },
  chat: { title: 'Burrow Chat', label: 'Burrow Chat', glyph: '\u{1F4AC}', w: 780, h: 520 },
  directory: { title: 'Active Directory Users and Computers', label: 'Active Directory', glyph: '\u{1F5C2}', w: 860, h: 480 },
  browser: { title: 'Burrow Intranet — Ridge', label: 'Ridge', glyph: '\u{1F310}', w: 920, h: 620, max: true },
  mail: { title: 'Burrow Mail', label: 'Mail', glyph: '✉', w: 640, h: 420 },
  runbook: { title: 'The Runbook', label: 'Runbook', glyph: '\u{1F4D6}', w: 560, h: 500 },
  resume: { title: 'resume.doc — WordPad', label: 'resume.doc', glyph: '\u{1F4C4}', w: 560, h: 480 },
  jobs: { title: 'Job Board', label: 'Job Board', glyph: '\u{1F4CC}', w: 600, h: 500 },
  trash: { title: 'Recycle Bin', label: 'Recycle Bin', glyph: '\u{1F5D1}', w: 560, h: 360 },
};
const ON_DESKTOP: AppId[] = ['desk', 'chat', 'directory', 'browser', 'trash'];
const PROGRAMS: AppId[] = ['desk', 'chat', 'directory', 'browser', 'mail'];
const DOCUMENTS: AppId[] = ['resume', 'runbook', 'jobs'];
const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const front = (app: App) => app.ui.windows.at(-1);

/** Open a program, or bring its window back to the front if it's already open. */
export function openApp(app: App, id: AppId): void {
  const { ui } = app;
  ui.startOpen = false;
  const open = ui.windows.find((w) => w.id === id);
  const win: Win = open ?? { id, x: 60 + 26 * ui.windows.length, y: 30 + 22 * ui.windows.length, max: APPS[id].max };
  win.min = false;
  ui.windows = [...ui.windows.filter((w) => w !== win), win];
  // Opening the browser is reading the news.
  if (id === 'browser') app.set(readNews(app.state, newsFor(app.state.day).length));
  else app.rerender();
}

function closeApp(app: App, id: AppId): void {
  app.ui.windows = app.ui.windows.filter((w) => w.id !== id);
  app.rerender();
}

/**
 * Bring a window to the front as you press on it, without redrawing anything, so the click you're in the middle
 * of still lands on the button you pressed.
 */
function raise(app: App, win: Win, screen: Element | null): void {
  if (front(app) === win) return;
  app.ui.windows = [...app.ui.windows.filter((w) => w !== win), win];
  app.ui.windows.forEach((w, i) => {
    const el = screen?.querySelector<HTMLElement>(`[data-win="${w.id}"]`);
    if (el) { el.style.zIndex = String(i + 2); el.classList.toggle('front', w === win); }
  });
}

/** Drag a window by its title bar. The screen is drawn at an angle in 3D, so pointer movement is scaled back to screen pixels. */
function drag(win: Win, el: HTMLElement, e: PointerEvent): void {
  if (win.max || (e.target as Element).closest('button')) return;
  const scale = el.getBoundingClientRect().width / el.offsetWidth || 1;
  const [sx, sy, ox, oy] = [e.clientX, e.clientY, win.x, win.y];
  const move = (m: PointerEvent) => {
    win.x = Math.round(ox + (m.clientX - sx) / scale);
    win.y = Math.max(0, Math.round(oy + (m.clientY - sy) / scale));
    el.style.left = `${win.x}px`;
    el.style.top = `${win.y}px`;
  };
  const up = () => { removeEventListener('pointermove', move); removeEventListener('pointerup', up); };
  addEventListener('pointermove', move);
  addEventListener('pointerup', up);
}

function windowEl(app: App, win: Win, z: number): HTMLElement {
  const meta = APPS[win.id];
  const toggleMax = () => { win.max = !win.max; app.rerender(); };
  const body = win.id === 'desk' ? serviceDesk(app) : win.id === 'chat' ? chatApp(app) : BODIES[win.id]?.(app) ?? h('p', {}, '');
  const el: HTMLElement = h('section', {
    class: `win window window-${win.id}${win.max ? ' max' : ''}${front(app) === win ? ' front' : ''}`,
    role: 'dialog', 'aria-label': meta.title, 'data-testid': `win-${win.id}`, 'data-win': win.id, hidden: win.min,
    style: win.max ? `z-index:${z}` : `left:${win.x}px;top:${win.y}px;width:${meta.w}px;height:${meta.h}px;z-index:${z}`,
    onpointerdown: () => raise(app, win, el.closest('.desktop')),
    onkeydown: (e) => { if ((e as KeyboardEvent).key === 'Escape') { e.stopPropagation(); closeApp(app, win.id); } },
  },
    h('header', { class: 'titlebar', ondblclick: toggleMax, onpointerdown: (e) => drag(win, el, e as PointerEvent) },
      h('span', { class: 'win-title' }, h('span', { class: 'win-glyph', 'aria-hidden': 'true' }, meta.glyph), meta.title),
      h('span', { class: 'win-controls' },
        h('button', { class: 'close', 'aria-label': `Minimise ${meta.label}`, 'data-testid': `min-${win.id}`, onclick: () => { win.min = true; app.rerender(); } }, '–'),
        h('button', { class: 'close', 'aria-label': `${win.max ? 'Restore' : 'Maximise'} ${meta.label}`, 'data-testid': `max-${win.id}`, onclick: toggleMax }, win.max ? '❐' : '□'),
        h('button', { class: 'close', 'aria-label': `Close ${meta.label}`, 'data-testid': `close-${win.id}`, onclick: () => closeApp(app, win.id) }, '×'))),
    h('div', { class: 'window-body' }, body));
  return el;
}

// ---- Notifications -------------------------------------------------------------------------------------------

let toastCount = 0;

/** Pop up a notification in the corner. It goes by itself after a few seconds. */
export function notify(app: App, toast: Omit<Toast, 'id'>): void {
  const id = ++toastCount;
  app.ui.toasts = [...app.ui.toasts, { ...toast, id }].slice(-3);
  setTimeout(() => dismiss(app, id), 9000);
}

function dismiss(app: App, id: number): void {
  if (!app.ui.toasts.some((t) => t.id === id)) return;
  app.ui.toasts = app.ui.toasts.filter((t) => t.id !== id);
  app.rerender();
}

function openToast(app: App, t: Toast): void {
  app.ui.toasts = app.ui.toasts.filter((x) => x.id !== t.id);
  if (t.ticket && t.app === 'desk') app.ui.selected = t.ticket;
  if (t.ticket && t.app === 'chat') { app.ui.chat = t.ticket; app.ui.channel = undefined; }
  openApp(app, t.app);
}

/** Something new has turned up: Burrow Chat announces a ticket, or someone messages you directly. */
export function announceArrival(app: App, before: GameState, after: GameState): string | undefined {
  const seen = new Set([...before.queue, ...before.chats]);
  const id = [...after.queue, ...after.chats].findLast((x) => !seen.has(x));
  if (!id) return undefined;
  chime();
  const t = ticketById(id);
  const who = VILLAGERS[t.who].name;
  const direct = after.chats.includes(id);
  notify(app, direct
    ? { app: 'chat', from: `Burrow Chat · ${who}`, text: ticketStateText(after, id) ?? 'Sent you a message', ticket: id }
    : { app: 'desk', from: 'Burrow Chat · #service-desk', text: `New ticket from ${who}: ${t.title}`, ticket: id });
  return direct ? `Ping. ${who} sent you a message on Burrow Chat.` : `Ding. New ticket from ${who}: “${t.title}”.`;
}

/** What they said first: on chat, people start by being friendly, not with the problem. */
const ticketStateText = (s: GameState, id: string) => s.tickets[id]?.messages[0]?.text;

/** First thing after you log in: Mr. Grisby's memo, and any company news. */
export function morningNotes(app: App, s: GameState): void {
  notify(app, { app: 'mail', from: `Burrow Mail · ${MANAGER}`, text: isWeekOver(s) ? 'The Conversation' : scriptFor(s.day).memo });
  const latest = newsFor(s.day)[0];
  if (latest && newsFor(s.day).length > s.newsRead) notify(app, { app: 'browser', from: 'Burrow Intranet', text: latest.title });
}

function toasts(app: App): HTMLElement {
  return h('div', { class: 'toasts', 'aria-live': 'polite' }, ...app.ui.toasts.map((t) => h('div', { class: 'toast', 'data-testid': 'toast' },
    h('button', { class: 'toast-body', onclick: () => openToast(app, t) }, h('span', { class: 'meta' }, t.from), h('span', {}, t.text)),
    h('button', { class: 'toast-close', 'aria-label': 'Dismiss', onclick: () => dismiss(app, t.id) }, '×'))));
}

// ---- Start menu ----------------------------------------------------------------------------------------------

function powerDown(app: App, to: 'off' | 'asleep' | 'locked'): void {
  const { ui } = app;
  ui.startOpen = false;
  ui.power = to;
  if (to !== 'asleep') ui.windows = [];
  if (to === 'off') {
    ui.note = 'The computer shuts down. The fan winds down with a sigh.';
    leaveComputer(app);
    return;
  }
  app.rerender();
}

function startMenu(app: App): HTMLElement {
  const item = (id: AppId) => h('button', { class: 'start-item', 'data-testid': `start-${id}`, onclick: () => openApp(app, id) },
    h('span', { class: 'glyph', 'aria-hidden': 'true' }, APPS[id].glyph), APPS[id].label);
  return h('nav', { class: 'start-menu', 'aria-label': 'Start menu', 'data-testid': 'start-menu' },
    h('div', { class: 'start-banner', 'aria-hidden': 'true' }, h('span', {}, 'BurrowOS 2000')),
    h('div', { class: 'start-items' },
      h('p', { class: 'start-user' }, '\u{1F464} intern'),
      h('p', { class: 'start-heading' }, 'Programs'), ...PROGRAMS.map(item),
      h('p', { class: 'start-heading' }, 'Documents'), ...DOCUMENTS.map(item),
      h('hr', {}),
      h('button', { class: 'start-item', 'data-testid': 'log-off', onclick: () => powerDown(app, 'locked') }, h('span', { class: 'glyph', 'aria-hidden': 'true' }, '\u{1F511}'), 'Log Off intern…'),
      h('button', { class: 'start-item', 'data-testid': 'sleep', onclick: () => powerDown(app, 'asleep') }, h('span', { class: 'glyph', 'aria-hidden': 'true' }, '\u{1F319}'), 'Sleep'),
      h('button', { class: 'start-item', 'data-testid': 'shut-down', onclick: () => powerDown(app, 'off') }, h('span', { class: 'glyph', 'aria-hidden': 'true' }, '⏻'), 'Shut Down…')));
}

// ---- The desktop ---------------------------------------------------------------------------------------------

/** How many things are waiting in an app, for the little red count on its icon. */
function waiting(app: App, id: AppId): number {
  const { state } = app;
  if (id === 'desk') return state.phase === 'desk' ? state.queue.length : 0;
  if (id === 'chat') return state.chats.length;
  if (id === 'browser') return newsFor(state.day).length - state.newsRead;
  return 0;
}

function taskbar(app: App): HTMLElement {
  const { state, ui } = app;
  const taskClick = (win: Win) => () => {
    if (win.min || front(app) !== win) { openApp(app, win.id); return; }
    win.min = true;
    app.rerender();
  };
  const working = state.phase === 'desk';
  return h('footer', { class: 'taskbar' },
    h('button', {
      class: `start${ui.startOpen ? ' on' : ''}`, 'aria-expanded': ui.startOpen ? 'true' : 'false', 'data-testid': 'start',
      onclick: () => { ui.startOpen = !ui.startOpen; app.rerender(); },
    }, h('span', { class: 'start-logo' }), 'Start'),
    h('div', { class: 'task-buttons' }, ...ui.windows.map((w) => h('button', {
      class: `task${front(app) === w && !w.min ? ' on' : ''}`, 'data-testid': `task-${w.id}`, onclick: taskClick(w),
    }, h('span', { 'aria-hidden': 'true' }, APPS[w.id].glyph), APPS[w.id].label))),
    h('span', { class: 'tray' },
      h('span', { class: 'tray-clock', 'data-clock': working, 'data-testid': 'tray-clock' }, working ? clockText(state.clock) : ''),
      h('span', { class: 'tray-day' }, WEEKDAYS[Math.min(state.day, DAYS + 1) - 1] ?? '')));
}

export function desktopScreen(app: App): HTMLElement {
  const { state, ui } = app;
  const outcome = state.outcomes[0];
  const screen = h('main', { class: 'screen desktop', 'data-testid': 'desktop' },
    h('nav', { class: 'icons', 'aria-label': 'Desktop' }, ...ON_DESKTOP.map((id) => {
      const count = waiting(app, id);
      return h('button', { class: 'icon', 'data-testid': `icon-${id}`, onclick: () => openApp(app, id) },
        h('span', { class: 'glyph', 'aria-hidden': 'true' }, id === 'trash' && ui.trashEmptied ? '\u{1F5D1}' : APPS[id].glyph), APPS[id].label,
        count > 0 && h('span', { class: 'unread', 'aria-label': `${count} waiting` }, String(count)));
    })),
    ...ui.windows.map((w, i) => windowEl(app, w, i + 2)),
    toasts(app),
    ui.startOpen && startMenu(app),
    taskbar(app),
    outcome ? outcomeCard(app, outcome) : ui.paused && state.phase === 'desk' && pausedCard(app),
  );
  // Clicking anywhere else closes the Start menu, like it does on a real computer.
  screen.addEventListener('pointerdown', (e) => {
    if (ui.startOpen && !(e.target as Element).closest('.start-menu, .start')) { ui.startOpen = false; app.rerender(); }
  });
  return screen;
}
