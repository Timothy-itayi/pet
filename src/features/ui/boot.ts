import { COMPANY, DAYS } from '../game/data.ts';
import { goTo, isWeekOver, newGame } from '../game/rules.ts';
import type { App } from './app.ts';
import { h } from './dom.ts';

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const linesFor = (day: number) => [
  'BurrowOS 98  (c) Not Really Supported',
  'Checking memory... 640K (should be enough)',
  'Loading drivers............ some',
  'Fan noise: LOUD',
  `Welcome to ${COMPANY}`,
  day > DAYS ? 'Saturday? The office is open? Of course it is.' : `${WEEKDAYS[day - 1]} · Day ${day} of ${DAYS}`,
];

export function bootScreen(app: App): HTMLElement {
  const { state } = app;
  const log = h('pre', { class: 'boot-log', 'aria-live': 'polite' });
  const login = h('div', { class: 'login', hidden: true });
  const root = h('main', { class: 'screen boot', 'data-testid': 'boot' }, log, login);

  const enter = (next = state) => {
    app.ui.booted = true;
    app.set(next.phase === 'boot' ? goTo(next, 'desktop') : next);
  };

  const showLogin = () => {
    if (!login.hidden) return;
    log.textContent = linesFor(state.day).join('\n');
    const firstLoad = !app.ui.booted && app.hasSave;
    login.append(
      h('p', { class: 'login-title' }, 'Log on to BurrowOS'),
      h('p', {}, 'User: intern'),
      h('p', {}, 'Password: •••••• (it’s “password”, nobody changed it)'),
      firstLoad
        ? h('div', { class: 'row' },
            h('button', { class: 'btn primary', 'data-autofocus': true, onclick: () => enter() },
              isWeekOver(state) || state.phase === 'ending' ? 'Continue' : `Continue (Day ${state.day})`),
            h('button', { class: 'btn', onclick: () => enter(goTo(newGame(), 'desktop')) }, 'New game'))
        : h('button', { class: 'btn primary', 'data-autofocus': true, onclick: () => enter() }, 'Log in'),
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
    }, 350 * i + 200));
    root.append(h('p', { class: 'hint' }, 'Press Enter to skip'));
  }
  return root;
}
