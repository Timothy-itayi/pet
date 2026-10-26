import { COMPANY, DAYS } from '../game/data.ts';
import { goTo, isWeekOver, newGame, weekday, weekOf } from '../game/rules.ts';
import type { App } from './app.ts';
import { morningNotes, openApp } from './desktop.ts';
import { h } from './dom.ts';


/** An old machine's BIOS, line by line, with how long each one takes (ms). */
const BIOS: [string, number][] = [
  ['Award Modular BIOS v4.51PG, An Energy Star Ally', 600],
  ['Main Processor : Pentium III 450MHz', 500],
  ['Memory Test : 131072K OK', 1400],
  ['Detecting IDE Primary Master ... QUANTUM FIREBALL 8.4GB', 1200],
  ['Detecting IDE Primary Slave  ... None', 700],
  ['Starting BurrowOS 2000...', 900],
];
/** Then the splash screen's progress bar, with what it says it's doing. Adds up to the bar's 4s in style.css. */
const SPLASH: [string, number][] = [
  ['Starting up...', 1400],
  ['Loading drivers ......... some', 1400],
  ['Applying computer settings...', 1200],
];
/** Then the smooth "welcome" animation, before the login. Matches the animations in style.css. */
const REVEAL_MS = 3200;

const dayLine = (day: number) => (day > DAYS ? 'Saturday. Of course.' : `${weekday(day)}, week ${weekOf(day)}`);

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
 * The monitor once it has power. After the power button: BIOS text, a splash screen with a progress bar,
 * a smooth welcome, then the login in the middle of the screen. Locked or just woken: straight to the login.
 * Enter logs you in.
 */
export function computerScreen(app: App): HTMLElement {
  const { state, ui } = app;
  const power = ui.power;
  const log = h('pre', { class: 'boot-log', 'aria-live': 'polite' });
  const status = h('p', { class: 'splash-status', 'aria-live': 'polite' });
  const splash = h('div', { class: 'splash' },
    h('div', { class: 'os-logo', 'aria-hidden': 'true' }),
    h('p', { class: 'splash-name' }, 'BurrowOS ', h('b', {}, '2000')),
    h('p', { class: 'splash-edition' }, 'Professional'),
    h('div', { class: 'splash-bar', 'aria-hidden': 'true' }, h('span')),
    status);
  const reveal = h('div', { class: 'reveal', 'aria-hidden': 'true' },
    h('div', { class: 'os-logo' }),
    h('p', { class: 'reveal-hello' }, 'Welcome'),
    h('p', { class: 'reveal-day' }, dayLine(state.day)));
  const login = h('form', { class: 'login', 'data-testid': 'login' });
  const root = h('main', { class: `screen boot${power === 'waking' ? ' waking' : ''}`, 'data-testid': 'boot', 'data-stage': 'bios' },
    log, splash, reveal, login);
  const stage = (s: 'splash' | 'reveal' | 'login') => { root.dataset.stage = s; };
  const firstLoad = !ui.booted && app.hasSave;

  // Logging in starts the working day (the office clock runs from now), except at the weekend. The game as it is now,
  // not as it was when this screen was drawn: a locked screen stays up while the day goes on behind it.
  const enter = (next = app.state) => {
    ui.booted = true;
    ui.power = 'on';
    const starting = next.phase === 'boot' || (next.phase === 'desktop' && !isWeekOver(next));
    const s = starting ? goTo(next, isWeekOver(next) ? 'desktop' : 'desk') : next;
    if (starting) morningNotes(app, s);
    app.set(s);
    // The last Saturday: Mr. Grisby's email about The Conversation is waiting, open, so nobody misses the ending.
    if (isWeekOver(s) && s.phase === 'desktop') openApp(app, 'mail');
  };
  login.addEventListener('submit', (e) => { e.preventDefault(); enter(); });

  const showLogin = () => {
    if (root.dataset.stage === 'login') return;
    stage('login');
    login.append(
      h('div', { class: 'login-avatar', 'aria-hidden': 'true' }),
      h('h1', { class: 'login-name' }, 'intern'),
      h('p', { class: 'login-title' }, power === 'booting' ? 'Log on to BurrowOS' : 'This computer is locked'),
      h('input', {
        name: 'password', type: 'password', value: 'password', 'aria-label': 'Password',
        'data-autofocus': true, 'data-testid': 'password', autocomplete: 'off',
      }),
      h('p', { class: 'hint' }, 'Press Enter to log in.'),
      h('div', { class: 'row' },
        h('button', { class: 'btn primary', type: 'submit', 'data-testid': 'log-in' },
          firstLoad ? (isWeekOver(state) || state.phase === 'ending' ? 'Continue' : `Continue (Day ${state.day})`) : 'Log in'),
        firstLoad && h('button', { class: 'btn', type: 'button', onclick: () => enter(newGame()) }, 'New game')),
    );
    // Outside the form: the form's fade-in would otherwise pin this to the form instead of the bottom of the screen.
    root.append(h('p', { class: 'login-foot' }, `${COMPANY} \u00b7 ${dayLine(state.day)}`));
    login.querySelector<HTMLElement>('[data-autofocus]')?.focus();
  };

  if (power !== 'booting' || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // Locked: the password screen is already there. Waking: the same, as the screen fades up from black.
    queueMicrotask(showLogin);
    return root;
  }
  // It's old. It takes its time, and there's no hurrying it.
  let at = 300;
  for (const [i, [line, wait]] of BIOS.entries()) {
    setTimeout(() => { log.textContent += (i ? '\n' : '') + line; }, at);
    at += wait;
  }
  setTimeout(() => stage('splash'), at);
  for (const [line, wait] of SPLASH) {
    setTimeout(() => { status.textContent = line; }, at);
    at += wait;
  }
  setTimeout(() => stage('reveal'), at);
  setTimeout(showLogin, at + REVEAL_MS);
  return root;
}
