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
  day > DAYS ? 'Saturday? The office is open? Of course it is.' : `${WEEKDAYS[day - 1]}, day ${day} of ${DAYS}`,
];

/** Off: just dark glass. The power button is on the case. */
export function darkScreen(): HTMLElement {
  return h('main', { class: 'screen boot dark', 'data-testid': 'screen-off' });
}

/** Asleep: dark, until you nudge the mouse or press a key at the computer. Then it fades up to the lock screen. */
export function asleepScreen(app: App, atComputer: boolean): HTMLElement {
  const wake = () => {
    removeEventListener('pointermove', wake);
    removeEventListener('keydown', wake);
    app.ui.power = 'waking';
    app.rerender();
  };
  // Only listen once you're sitting at it, and wait a moment so the move that got you here doesn't count.
  if (atComputer) setTimeout(() => { addEventListener('pointermove', wake, { once: true }); addEventListener('keydown', wake, { once: true }); }, 400);
  return h('main', { class: 'screen boot dark', 'data-testid': 'boot' },
    h('div', { class: 'dark-centre' },
      h('p', { class: 'sleep-z', 'aria-hidden': 'true' }, 'z Z z'),
      h('p', { class: 'dark-hint', 'data-testid': 'asleep' }, 'Asleep. Move the mouse or press any key to wake it.')));
}

/**
 * The monitor once it has power: booting (after the power button on the case) then the login,
 * or straight to the lock screen if it was only locked or just woke up. Enter logs you in.
 */
export function computerScreen(app: App): HTMLElement {
  const { state, ui } = app;
  const power = ui.power;
  const log = h('pre', { class: 'boot-log', 'aria-live': 'polite' });
  const login = h('form', { class: 'login', hidden: true, 'data-testid': 'login' });
  const root = h('main', { class: `screen boot${power === 'waking' ? ' waking' : ''}`, 'data-testid': 'boot' }, log, login);
  const firstLoad = !ui.booted && app.hasSave;

  const enter = (next = state) => {
    ui.booted = true;
    ui.power = 'on';
    app.set(next.phase === 'boot' ? goTo(next, 'desktop') : next);
  };
  login.addEventListener('submit', (e) => { e.preventDefault(); enter(); });

  const showLogin = () => {
    if (!login.hidden) return;
    if (power === 'booting') log.textContent = linesFor(state.day).join('\n');
    login.append(
      h('p', { class: 'login-title' }, power === 'booting' ? 'Log on to BurrowOS' : 'This computer is locked'),
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

  if (power !== 'booting' || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // Locked: the password screen is already there. Waking: the same, as the screen fades up from black.
    queueMicrotask(showLogin);
    return root;
  }
  root.addEventListener('click', () => { if (login.hidden) showLogin(); });
  addEventListener('keydown', skip);
  const lines = linesFor(state.day);
  lines.forEach((line, i) => setTimeout(() => {
    if (!login.hidden) return;
    log.textContent += (i ? '\n' : '') + line;
    if (i === lines.length - 1) setTimeout(showLogin, 500);
  }, 300 * i + 200));
  return root;
}
