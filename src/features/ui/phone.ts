/**
 * The company phone's screens ("BurrowOS mobile"), drawn onto its glass while you hold it up: the "Hello" setup
 * with its passcode, the home screen, the App Store, Settings and Oktopus Verify. Pushes slide down over whatever's
 * open. Everything here changes the game through `phones.ts`; the phone itself remembers only where you are on it.
 */
import { MINUTES_A_DAY } from '../game/directory.ts';
import {
  addPasscode, answerPush, answerRogue, held, installApp, needsPush, ROGUE, roguePending, scan, setUpPhone, VERIFY, verifyCode, type Phone,
} from '../game/phones.ts';
import { SELF } from '../game/rules.ts';
import type { App, PhoneScreen } from './app.ts';
import { clockText, h } from './dom.ts';
import { qr } from './oktopus.ts';

/** The tick in a navy circle: Oktopus Verify's icon, drawn rather than painted. */
const verifyIcon = (size: number) => h('span', { class: 'pv-icon', style: `--s:${size}px`, 'aria-hidden': 'true' }, '✓');

/** Whatever Oktopus is showing an enrolment QR code for on the monitor right now, if its window is up. */
const qrOnMonitor = (app: App) => {
  const okta = app.ui.windows.find((w) => w.id === 'okta');
  return okta && !okta.min && app.ui.oktaPage === 'people' ? app.ui.oktaEnrol : undefined;
};

function bar(app: App): HTMLElement {
  return h('div', { class: 'pv-status' }, h('span', {}, 'Burrow'), h('strong', {}, clockText(app.state.clock)), h('span', {}, '▮ 87%'));
}

function go(app: App, to: PhoneScreen): void {
  app.ui.phoneScreen = to;
  app.ui.phoneSaid = undefined;
  app.rerender();
}

/** A new phone: "Hello", then a passcode (which you can skip, and shouldn't). */
function setup(app: App, phone: Phone): HTMLElement {
  const { ui } = app;
  if (ui.phoneScreen !== 'passcode') {
    return h('button', { class: 'pv-hello', 'data-testid': 'phone-hello', 'data-autofocus': true, onclick: () => { ui.phoneCode = ''; go(app, 'passcode'); } },
      h('span', { class: 'pv-hello-word' }, 'Hello'), h('span', { class: 'pv-hint' }, 'Tap to set up'));
  }
  const typed = ui.phoneCode ?? '';
  const press = (digit: string) => {
    const next = typed + digit;
    if (next.length < 4) { ui.phoneCode = next; app.rerender(); return; }
    ui.phoneCode = undefined;
    ui.phoneScreen = 'home';
    app.set(setUpPhone(app.state, phone.id, true));
  };
  return h('div', { class: 'pv-page pv-passcode' },
    h('p', { class: 'pv-title' }, 'Create a passcode'),
    h('p', { class: 'pv-dots', 'aria-label': `${typed.length} of 4 digits` }, ...[0, 1, 2, 3].map((i) => h('span', { class: i < typed.length ? 'on' : '' }))),
    h('div', { class: 'pv-keys' }, ...['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0'].map((k) => (k
      ? h('button', { class: 'pv-key', 'data-testid': `phone-key-${k}`, onclick: () => press(k) }, k)
      : h('span', {})))),
    h('button', { class: 'pv-link', 'data-testid': 'phone-skip-passcode', onclick: () => { ui.phoneScreen = 'home'; app.set(setUpPhone(app.state, phone.id, false)); } }, 'Don’t use a passcode'));
}

function home(app: App, phone: Phone): HTMLElement {
  const tile = (to: PhoneScreen, label: string, icon: HTMLElement | string, cls: string) =>
    h('button', { class: 'pv-app', 'data-testid': `phone-app-${to}`, onclick: () => go(app, to) }, h('span', { class: `pv-app-icon ${cls}` }, icon), h('span', {}, label));
  return h('div', { class: 'pv-home' },
    h('div', { class: 'pv-grid' },
      tile('store', 'App Store', 'A', 'store'),
      tile('settings', 'Settings', '⚙', 'settings'),
      phone.apps.includes(VERIFY) && tile('verify', 'Verify', verifyIcon(30), 'verify')),
    h('p', { class: 'pv-wallpaper-note' }, 'Burrow & Co. company phone'));
}

function store(app: App, phone: Phone): HTMLElement {
  const has = phone.apps.includes(VERIFY);
  return h('div', { class: 'pv-page' },
    h('header', { class: 'pv-head' }, h('button', { class: 'pv-back', onclick: () => go(app, 'home') }, '‹'), h('span', {}, 'App Store')),
    h('div', { class: 'pv-search' }, 'oktopus verify'),
    h('div', { class: 'pv-listing' },
      verifyIcon(54),
      h('div', {}, h('strong', {}, 'Oktopus Verify'), h('span', { class: 'pv-sub' }, 'Oktopus, Inc. · Business'), h('span', { class: 'pv-sub' }, '★★★★★ 4.7')),
      h('button', {
        class: 'pv-get', 'data-testid': 'phone-get-verify',
        onclick: () => (has ? go(app, 'verify') : app.set(installApp(app.state, phone.id, VERIFY))),
      }, has ? 'Open' : 'Get')),
    h('p', { class: 'pv-blurb' }, 'Sign in to work with a tap. Oktopus Verify sends a push to this phone, or shows a code that changes, so a stolen password isn’t enough.'));
}

function settings(app: App, phone: Phone): HTMLElement {
  return h('div', { class: 'pv-page' },
    h('header', { class: 'pv-head' }, h('button', { class: 'pv-back', onclick: () => go(app, 'home') }, '‹'), h('span', {}, 'Settings')),
    h('ul', { class: 'pv-rows' },
      h('li', {}, h('span', {}, 'Passcode'), phone.passcode ? h('span', { class: 'pv-sub' }, 'On')
        : h('button', { class: 'pv-link', 'data-testid': 'phone-passcode-on', onclick: () => app.set(addPasscode(app.state, phone.id)) }, 'Turn Passcode On')),
      h('li', {}, h('span', {}, 'Name'), h('span', { class: 'pv-sub' }, phone.id.replace('phone-', 'Burrow phone '))),
      h('li', {}, h('span', {}, 'Managed by'), h('span', { class: 'pv-sub' }, 'Burrow & Co. IT'))));
}

function verify(app: App, phone: Phone): HTMLElement {
  const { state, ui } = app;
  const head = (title: string, back: PhoneScreen, plus = false) => h('header', { class: 'pv-head navy' },
    h('button', { class: 'pv-back', onclick: () => go(app, back) }, '‹'), h('span', {}, title),
    plus && h('button', { class: 'pv-plus', 'aria-label': 'Add account', 'data-testid': 'phone-verify-add', onclick: () => go(app, 'verify-add') }, '+'));
  if (ui.phoneScreen === 'verify-add') {
    return h('div', { class: 'pv-page' }, head('Add Account', 'verify'),
      h('p', { class: 'pv-title' }, 'Choose account type'),
      h('button', { class: 'pv-choice', 'data-testid': 'phone-verify-org', onclick: () => go(app, 'scan') }, h('strong', {}, 'Organisation'), h('span', { class: 'pv-sub' }, 'Work, school, company')),
      h('button', { class: 'pv-choice', onclick: () => { ui.phoneSaid = 'This is a company phone. Work accounts only.'; app.rerender(); } }, h('strong', {}, 'Other'), h('span', { class: 'pv-sub' }, 'Facebook, Google, etc')),
      ui.phoneSaid && h('p', { class: 'pv-said', role: 'status' }, ui.phoneSaid));
  }
  if (ui.phoneScreen === 'scan') {
    const showing = qrOnMonitor(app);
    return h('div', { class: 'pv-page pv-scan' }, head('Scan QR Code', 'verify-add'),
      h('div', { class: `pv-viewfinder${showing ? ' found' : ''}` }, showing ? qr(showing) : h('span', { class: 'pv-sub' }, 'Point the camera at the QR code')),
      h('button', {
        class: 'pv-get wide', 'data-testid': 'phone-scan',
        onclick: () => {
          const { state: next, said } = scan(app.state, phone.id, showing);
          ui.phoneSaid = said;
          if (next !== app.state) { ui.phoneScreen = 'verify'; app.set(next); } else app.rerender();
        },
      }, 'Scan'),
      ui.phoneSaid && h('p', { class: 'pv-said', role: 'status', 'data-testid': 'phone-said' }, ui.phoneSaid));
  }
  const at = state.day * MINUTES_A_DAY + state.clock;
  const left = 30 - (state.clock % 30);
  return h('div', { class: 'pv-page' }, head('Oktopus Verify', 'home', true),
    ui.phoneSaid && h('p', { class: 'pv-said ok', role: 'status', 'data-testid': 'phone-said' }, ui.phoneSaid),
    phone.owner
      ? h('div', { class: 'pv-account', 'data-testid': 'phone-account' },
        h('span', { class: 'pv-org' }, 'B'),
        h('div', {}, h('strong', {}, 'burrow.oktopus.com'), h('span', { class: 'pv-sub' }, `${phone.owner}@burrow.co`),
          h('span', { class: 'pv-code', 'data-testid': 'phone-code' }, verifyCode(phone.id, phone.owner, at).replace(/(\d{3})/, '$1 ')),
          h('span', { class: 'pv-timer', style: `--left:${left / 30}` })))
      : h('p', { class: 'pv-empty' }, 'No accounts yet. Tap + to add your work account.'));
}

/** A push that's waiting on this phone: your own sign-in to Oktopus Admin, or someone else's attempt as you. */
function pushSheet(app: App, phone: Phone): HTMLElement | undefined {
  const { state } = app;
  if (phone.owner !== SELF) return undefined;
  const rogue = roguePending(state);
  const yours = needsPush(state) && app.ui.windows.some((w) => w.id === 'okta');
  if (!rogue && !yours) return undefined;
  const answer = (yes: boolean) => app.set(rogue ? answerRogue(state, yes) : answerPush(state, yes));
  return h('div', { class: 'pv-push', role: 'alertdialog', 'aria-label': 'Sign-in request', 'data-testid': 'phone-push' },
    h('div', { class: 'pv-push-head' }, verifyIcon(22), h('strong', {}, 'Oktopus Verify')),
    h('p', { class: 'pv-push-title' }, 'Are you trying to sign in?'),
    h('dl', {},
      h('dt', {}, 'App'), h('dd', {}, 'Oktopus Admin'),
      h('dt', {}, 'From'), h('dd', {}, rogue ? ROGUE.where : 'Burrow office, Sam’s old PC'),
      h('dt', {}, 'Time'), h('dd', {}, clockText(state.clock))),
    h('button', { class: 'pv-push-no', 'data-testid': 'phone-push-no', onclick: () => answer(false) }, 'No, it’s not me'),
    h('button', { class: 'pv-push-yes', 'data-testid': 'phone-push-yes', onclick: () => answer(true) }, 'Yes, it’s me'));
}

/** The whole phone screen, for the phone in your hand. */
export function phoneScreen(app: App): HTMLElement {
  const phone = held(app.state);
  if (!phone) return h('div', { class: 'pv' });
  const screen = !phone.setUp ? setup(app, phone)
    : app.ui.phoneScreen === 'store' ? store(app, phone)
    : app.ui.phoneScreen === 'settings' ? settings(app, phone)
    : app.ui.phoneScreen && ['verify', 'verify-add', 'scan'].includes(app.ui.phoneScreen) ? verify(app, phone)
    : home(app, phone);
  return h('div', { class: 'pv', 'data-testid': 'phone' }, bar(app), screen, pushSheet(app, phone));
}
