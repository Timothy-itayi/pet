import { COMPANY, DAYS } from '../game/data.ts';
import { goTo, isWeekOver, newGame } from '../game/rules.ts';
import type { App } from './app.ts';
import { h } from './dom.ts';
import { panel } from './panels.ts';

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

/** Things on the desk you inherited. Each one says something when you pick it up. */
const ITEMS: { id: string; label: string; says: (day: number) => string }[] = [
  { id: 'notes', label: 'Sticky notes', says: (day) => (day === 1 ? SAM_NOTE.join(' ') : `Sam’s notes, now with coffee rings. ${SAM_NOTE[3]}`) },
  { id: 'tray', label: 'Ticket tray', says: () => 'The ticket tray. Empty for now. It won’t stay that way.' },
  { id: 'mug', label: 'Mug', says: () => 'WORLD’S OKAYEST IT PERSON. Sam left it behind. It’s yours now.' },
  { id: 'plant', label: 'Plant', says: () => 'A plant. Mostly alive. Sam watered it on Fridays.' },
  { id: 'phone', label: 'Where the phone was', says: () => 'A clean rectangle in the dust where a phone used to be. Budget cuts.' },
];

/** Monday morning at someone else's desk: their things, their notes, and a computer that takes a while to wake up. */
function deskScene(app: App, turnOn: () => void): HTMLElement {
  const caption = h('p', { class: 'caption', 'aria-live': 'polite', 'data-testid': 'caption' },
    app.state.day === 1 ? 'Your first day. This was Sam’s desk.' : 'Back at your desk. Well, Sam’s desk.');
  const pick = (says: string) => () => { caption.textContent = says; };
  return h('main', { class: 'screen room', 'data-testid': 'room' },
    h('div', { class: 'wall' }, h('p', { class: 'wall-sign' }, `${COMPANY} IT Help Desk. Please take a ticket.`)),
    h('div', { class: 'desktop-surface' },
      h('button', { class: 'item monitor', 'data-testid': 'turn-on', 'data-autofocus': true, onclick: turnOn },
        h('span', { class: 'crt', 'aria-hidden': 'true' }, h('span', { class: 'crt-glass' }, 'Press Enter')),
        h('span', { class: 'item-label' }, 'Turn on the computer')),
      h('button', { class: 'item binder', 'data-testid': 'item-runbook', onclick: () => { app.ui.panel = 'runbook'; app.rerender(); } },
        h('span', { class: 'shape', 'aria-hidden': 'true' }), h('span', { class: 'item-label' }, 'The old runbook')),
      ...ITEMS.map((item) => h('button', { class: `item ${item.id}`, 'data-testid': `item-${item.id}`, onclick: pick(item.says(app.state.day)) },
        h('span', { class: 'shape', 'aria-hidden': 'true' }), h('span', { class: 'item-label' }, item.label)))),
    caption,
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
