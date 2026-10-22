import { COMPANY, DAYS } from '../game/data.ts';
import { goTo, isWeekOver, newGame } from '../game/rules.ts';
import type { App } from './app.ts';
import { h } from './dom.ts';

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** An old machine's boot, line by line, with how long each one takes (ms). About ten seconds in all. */
const bootFor = (day: number): [string, number][] => [
  ['Award Modular BIOS v4.51PG, An Energy Star Ally', 600],
  ['Main Processor : Pentium III 450MHz', 500],
  ['Memory Test : 131072K OK', 1600],
  ['Detecting IDE Primary Master ... QUANTUM FIREBALL 8.4GB', 1400],
  ['Detecting IDE Primary Slave  ... None', 700],
  ['Starting BurrowOS 2000...', 900],
  ['Loading drivers ......................... some', 1600],
  ['Applying computer settings...', 1500],
  [`Welcome to ${COMPANY}. ${day > DAYS ? 'Saturday. Of course.' : `${WEEKDAYS[day - 1]}, day ${day} of ${DAYS}.`}`, 800],
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
    if (power === 'booting') log.textContent = bootFor(state.day).map(([line]) => line).join('\n');
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
  };

  if (power !== 'booting' || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // Locked: the password screen is already there. Waking: the same, as the screen fades up from black.
    queueMicrotask(showLogin);
    return root;
  }
  // It's old. It takes its time, and there's no hurrying it.
  let at = 300;
  for (const [i, [line, wait]] of bootFor(state.day).entries()) {
    setTimeout(() => { if (login.hidden) log.textContent += (i ? '\n' : '') + line; }, at);
    at += wait;
  }
  setTimeout(showLogin, at);
  return root;
}
