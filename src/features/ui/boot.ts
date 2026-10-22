import { COMPANY, DAYS } from '../game/data.ts';
import { goTo, isWeekOver, newGame } from '../game/rules.ts';
import type { App } from './app.ts';
import { h } from './dom.ts';
import { panel } from './panels.ts';
import { H, HOTSPOTS, TOOL_SPOT, W, drawDesk } from '../room/scene.ts';
import { TOOLS } from '../game/data.ts';

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const linesFor = (day: number) => [
  'BurrowOS 98  (c) Not Really Supported',
  'Checking memory... 640K (should be enough)',
  'Loading drivers............ some',
  'Fan noise: LOUD',
  `Welcome to ${COMPANY}`,
  day > DAYS ? 'Saturday? The office is open? Of course it is.' : `${WEEKDAYS[day - 1]}, day ${day} of ${DAYS}`,
];

const SAM_NOTE = [
  'Hi. I’m Sam. I kept this place running for six years. I quit. Sorry.',
  'Password is “password”. Nobody ever changed it.',
  'The runbook is mostly wrong. Fix it as you go.',
  'Send people updates, or they will come and find you.',
  'Grisby will say you’ll get paid. Get it in writing.',
  'Be nice to Dot. Good luck.',
];

/** What each thing on the desk says when you look at it. */
const SAYS: Record<string, (day: number) => string> = {
  'item-notes': (day) => (day === 1 ? SAM_NOTE.join(' ') : `Sam\u2019s notes, now with coffee rings. ${SAM_NOTE[3]}`),
  'item-tray': () => 'The ticket tray. Empty for now. It won\u2019t stay that way.',
  'item-mug': () => 'WORLD\u2019S OKAYEST IT PERSON. Sam left it behind. It\u2019s yours now.',
  'item-plant': () => 'A plant. Mostly alive. Sam watered it on Fridays.',
  'item-phone': () => 'A clean rectangle in the dust where a phone used to be. Budget cuts.',
  'item-chair': () => 'Sam\u2019s chair. It squeaks, and it leans slightly to the left.',
  'item-shelves': () => 'Sam\u2019s old binders: \u201CPrinters 2016\u201D, \u201CPrinters 2017\u201D, \u201CPrinters (other)\u201D.',
  'item-calendar': () => 'Sam crossed off every day this month. The last one is circled in red: \u201CFREEDOM\u201D.',
  'item-space': () => 'Empty spaces on the shelf, the pegboard and the desk. Sam\u2019s things went home with Sam. Maybe people will help you fill them.',
};

/** Morning at the desk you inherited: Sam's leftovers, empty spaces, and a computer that takes a while to wake up. */
function deskScene(app: App, turnOn: () => void): HTMLElement {
  const tool = TOOLS.find((t) => app.state.tools.includes(t.id));
  const dropped = TOOLS.find((t) => t.id === app.state.drop);
  const caption = h('p', { class: 'caption', 'aria-live': 'polite', 'data-testid': 'caption' },
    dropped ? `Something new on your desk. ${dropped.gift}`
      : app.state.day === 1 ? 'Your first day. This was Sam\u2019s desk.' : 'Back at your desk. Well, Sam\u2019s desk.');
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  canvas.className = 'desk-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  const ctx = canvas.getContext('2d');
  if (ctx) drawDesk(ctx, app.state.tools);
  const pct = (n: number, of: number) => `${(n / of) * 100}%`;
  const spots = tool ? [...HOTSPOTS, { id: 'item-tool', label: tool.name, ...TOOL_SPOT }] : HOTSPOTS;
  const act = (id: string) => () => {
    if (id === 'turn-on') return turnOn();
    if (id === 'item-tool' && tool) { caption.textContent = `${tool.name}. ${tool.gift}`; return; }
    if (id === 'item-runbook') { app.ui.panel = 'runbook'; app.rerender(); return; }
    caption.textContent = SAYS[id]?.(app.state.day) ?? '';
  };
  return h('main', { class: `screen room${dropped ? ' new-drop' : ''}`, 'data-testid': 'room' },
    h('div', { class: 'desk-art' }, canvas,
      ...spots.map((spot) => h('button', {
        class: 'hotspot', 'data-testid': spot.id, 'aria-label': spot.label, title: spot.label,
        style: `left:${pct(spot.x, W)};top:${pct(spot.y, H)};width:${pct(spot.w, W)};height:${pct(spot.h, H)}`,
        onclick: act(spot.id),
      }, h('span', { class: 'hotspot-label' }, spot.label)))),
    h('div', { class: 'room-bar' },
      caption,
      h('button', { class: 'btn primary', 'data-autofocus': true, onclick: turnOn }, 'Turn on the computer')),
    app.ui.panel && panel(app, app.ui.panel),
  );
}

/** The computer: a slow boot, then the login screen with the password already filled in. Enter logs you in. */
function computer(app: App): HTMLElement {
  const { state } = app;
  const log = h('pre', { class: 'boot-log', 'aria-live': 'polite' });
  const login = h('form', { class: 'login', hidden: true, 'data-testid': 'login' });
  const root = h('main', { class: 'screen boot', 'data-testid': 'boot' }, log, login);
  const firstLoad = !app.ui.booted && app.hasSave;

  const enter = (next = state) => {
    app.ui.booted = true;
    app.ui.atDesk = false;
    app.set(next.phase === 'boot' ? goTo(next, 'desktop') : next);
  };
  login.addEventListener('submit', (e) => { e.preventDefault(); enter(); });

  const showLogin = () => {
    if (!login.hidden) return;
    log.textContent = linesFor(state.day).join('\n');
    login.append(
      h('p', { class: 'login-title' }, 'Log on to BurrowOS'),
      h('label', {}, 'User ', h('input', { name: 'user', value: 'intern', readonly: true, autocomplete: 'off' })),
      h('label', {}, 'Password ', h('input', {
        name: 'password', type: 'password', value: 'password', 'data-autofocus': true, 'data-testid': 'password', autocomplete: 'off',
      })),
      h('p', { class: 'hint' }, 'Press Enter to log in.'),
      h('div', { class: 'row' },
        h('button', { class: 'btn primary', type: 'submit', 'data-testid': 'log-in' },
          firstLoad ? (isWeekOver(state) || state.phase === 'ending' ? 'Continue' : `Continue (Day ${state.day})`) : 'Log in'),
        firstLoad && h('button', { class: 'btn', type: 'button', onclick: () => enter(goTo(newGame(), 'desktop')) }, 'New game')),
    );
    login.hidden = false;
    login.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    removeEventListener('keydown', skip);
  };

  const skip = (e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showLogin(); } };
  root.addEventListener('click', () => { if (login.hidden) showLogin(); });
  addEventListener('keydown', skip);

  const lines = linesFor(state.day);
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    queueMicrotask(showLogin);
  } else {
    lines.forEach((line, i) => setTimeout(() => {
      if (!login.hidden) return;
      log.textContent += (i ? '\n' : '') + line;
      if (i === lines.length - 1) setTimeout(showLogin, 500);
    }, 300 * i + 200));
  }
  return root;
}

export function bootScreen(app: App): HTMLElement {
  if (app.ui.atDesk) return deskScene(app, () => { app.ui.atDesk = false; app.rerender(); });
  return computer(app);
}
