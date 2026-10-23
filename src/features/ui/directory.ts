import { DEPARTMENTS, type Account, type Department } from '../game/directory.ts';
import { resetPassword, setEnabled, unlockAccount } from '../game/rules.ts';
import type { App } from './app.ts';
import { h } from './dom.ts';

/**
 * Active Registry Users and Computers: the office's old directory console, laid out like the real thing.
 * Folders on the left, accounts on the right, and the jobs IT does every day on the toolbar.
 */

const standing = (a: Account) => (!a.enabled ? 'Disabled' : a.locked ? 'Locked out' : 'Active');

function resetBox(app: App, login: string, a: Account, opts: { mustChange: boolean; unlock: boolean }): HTMLElement {
  const { state, ui } = app;
  const done = () => {
    ui.dirReset = undefined;
    ui.dirSaid = `The password for ${a.name} has been changed.`;
    app.set(resetPassword(state, login, opts));
  };
  return h('section', { class: 'ad-dialog', role: 'dialog', 'aria-labelledby': 'ad-reset-title', 'data-testid': 'ad-reset-box' },
    h('h3', { id: 'ad-reset-title', class: 'ad-dialog-title' }, 'Reset Password'),
    h('label', {}, 'New password', h('input', { type: 'password', value: 'Temp-4821!', readonly: true })),
    h('label', {}, 'Confirm password', h('input', { type: 'password', value: 'Temp-4821!', readonly: true })),
    h('label', { class: 'tick' }, h('input', {
      type: 'checkbox', checked: opts.mustChange, 'data-testid': 'ad-must-change',
      onchange: (e) => { opts.mustChange = (e.target as HTMLInputElement).checked; },
    }), 'User must change password at next logon'),
    h('p', { class: 'ad-lockout' }, 'Account Lockout Status: ', h('strong', {}, a.locked ? 'Locked' : 'Unlocked')),
    h('label', { class: 'tick' }, h('input', {
      type: 'checkbox', checked: opts.unlock, disabled: !a.locked, 'data-testid': 'ad-unlock-too',
      onchange: (e) => { opts.unlock = (e.target as HTMLInputElement).checked; },
    }), 'Unlock the user’s account'),
    h('div', { class: 'row' },
      h('button', { class: 'btn primary', 'data-testid': 'ad-reset-ok', onclick: done }, 'OK'),
      h('button', { class: 'btn', onclick: () => { ui.dirReset = undefined; app.rerender(); } }, 'Cancel')),
  );
}

export function directoryConsole(app: App): HTMLElement {
  const { state, ui } = app;
  const shown = Object.entries(state.accounts)
    .filter(([, a]) => !ui.dirOu || a.dept === ui.dirOu)
    .sort(([, x], [, y]) => x.name.localeCompare(y.name));
  const login = ui.dirUser && state.accounts[ui.dirUser] ? ui.dirUser : undefined;
  const picked = login ? state.accounts[login] : undefined;
  const open = (ou?: Department) => () => { ui.dirOu = ou; ui.dirUser = undefined; ui.dirReset = undefined; ui.dirSaid = undefined; app.rerender(); };
  const select = (l: string) => () => { ui.dirUser = l; ui.dirReset = undefined; ui.dirSaid = undefined; app.rerender(); };
  const doing = (said: string, next: typeof state) => { ui.dirSaid = said; app.set(next); };
  const folder = (label: string, on: boolean, onclick: () => void, testid: string) =>
    h('button', { class: `ad-node${on ? ' on' : ''}`, 'aria-current': on ? 'true' : 'false', 'data-testid': testid, onclick }, label);

  return h('div', { class: 'ad' },
    h('div', { class: 'ad-menu', 'aria-hidden': 'true' }, ...['File', 'Action', 'View', 'Help'].map((m) => h('span', {}, m))),
    h('div', { class: 'ad-toolbar', role: 'toolbar', 'aria-label': 'Account actions' },
      h('button', {
        class: 'btn', 'data-testid': 'ad-reset', disabled: !picked,
        onclick: () => { ui.dirReset = { mustChange: false, unlock: Boolean(picked?.locked) }; ui.dirSaid = undefined; app.rerender(); },
      }, 'Reset Password…'),
      h('button', {
        class: 'btn', 'data-testid': 'ad-unlock', disabled: !picked?.locked,
        onclick: () => { if (login && picked) doing(`${picked.name}’s account has been unlocked.`, unlockAccount(state, login)); },
      }, 'Unlock Account'),
      h('button', {
        class: 'btn', 'data-testid': 'ad-enable', disabled: !picked,
        onclick: () => { if (login && picked) doing(`${picked.name}’s account has been ${picked.enabled ? 'disabled' : 'enabled'}.`, setEnabled(state, login, !picked.enabled)); },
      }, picked && !picked.enabled ? 'Enable Account' : 'Disable Account')),
    h('div', { class: 'ad-panes' },
      h('nav', { class: 'ad-tree', 'aria-label': 'Folders' },
        folder('\u{1F5A7} burrow.local', !ui.dirOu, open(), 'ou-all'),
        h('div', { class: 'ad-ous' }, ...DEPARTMENTS.map((d) => folder(`\u{1F4C1} ${d}`, ui.dirOu === d, open(d), `ou-${d}`)))),
      h('table', { class: 'ad-list' },
        h('thead', {}, h('tr', {}, ...['Name', 'Logon name', 'Description', 'Status'].map((c) => h('th', {}, c)))),
        h('tbody', {}, ...shown.map(([l, a]) => h('tr', { class: `${l === login ? 'on' : ''}${a.enabled ? '' : ' off'}` },
          h('td', {}, h('button', { class: 'ad-user', 'aria-pressed': l === login ? 'true' : 'false', 'data-testid': `user-${l}`, onclick: select(l) },
            `${a.enabled ? '\u{1F464}' : '⛔'} ${a.name}`)),
          h('td', {}, l),
          h('td', {}, a.title),
          h('td', { class: a.locked || !a.enabled ? 'warn' : '' }, standing(a))))))),
    login && picked && ui.dirReset && resetBox(app, login, picked, ui.dirReset),
    h('p', { class: 'ad-status', role: 'status', 'data-testid': 'ad-status' },
      ui.dirSaid ?? `${shown.length} objects${state.phase === 'desk' ? '. Each change takes a few minutes of the office clock.' : ''}`),
  );
}
