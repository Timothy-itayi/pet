import { artFor, iconId } from '../game/art.ts';
import { DEPARTMENTS, MINUTES_A_DAY, type Department } from '../game/directory.ts';
import { addApp, addGroup, addRule, assignApp, createFromHr, removeRule, requireMfa, resetMfa, setActive, unassignApp, updateFromHr } from '../game/identity.ts';
import { appsOf, CATALOG, differences, groupsOf, hrOn, needsMfa, type HrRow, type Okta } from '../game/oktopus.ts';
import type { GameState } from '../game/rules.ts';
import type { App } from './app.ts';
import { clockText, h } from './dom.ts';

/**
 * The Oktopus Admin Console, laid out like the real thing: Dashboard, Directory (People, Groups, Import from HR),
 * Applications and the System Log down the side, the page on the right.
 */

export type OktaPage = 'dashboard' | 'people' | 'groups' | 'import' | 'apps' | 'security' | 'log';

/**
 * The Oktopus wordmark: lowercase and clean like the real sign-on brand it nods to, with the "o" drawn as a thick ring
 * and four little tentacles curling out from under it, so it's its own thing.
 */
export function oktopusLogo(height = 26): SVGSVGElement {
  const ns = 'http://www.w3.org/2000/svg';
  const mark = document.createElementNS(ns, 'svg');
  for (const [k, v] of Object.entries({ viewBox: '0 0 150 40', height: String(height), class: 'oktopus-logo', role: 'img', 'aria-label': 'oktopus' })) mark.setAttribute(k, v);
  const ring = document.createElementNS(ns, 'circle');
  for (const [k, v] of Object.entries({ cx: '15', cy: '18', r: '10', fill: 'none', stroke: 'currentColor', 'stroke-width': '6' })) ring.setAttribute(k, v);
  mark.append(ring);
  for (const d of ['M8 27 q-3 6 -7 6', 'M13 28 q-1 6 -4 9', 'M18 28 q1 6 4 9', 'M23 27 q3 6 7 6']) {
    const arm = document.createElementNS(ns, 'path');
    for (const [k, v] of Object.entries({ d, fill: 'none', stroke: 'currentColor', 'stroke-width': '3', 'stroke-linecap': 'round' })) arm.setAttribute(k, v);
    mark.append(arm);
  }
  const word = document.createElementNS(ns, 'text');
  for (const [k, v] of Object.entries({ x: '30', y: '28', fill: 'currentColor', 'font-family': '"Segoe UI", "Helvetica Neue", Arial, sans-serif', 'font-size': '29', 'font-weight': '600', 'letter-spacing': '-1' })) word.setAttribute(k, v);
  word.textContent = 'ktopus';
  mark.append(word);
  return mark;
}

const appName = (id: string) => CATALOG.find((c) => c.id === id)?.name ?? id;
/** An app's painted icon, or its emoji until one's been made. */
function appIcon(id: string, size = 20): HTMLElement {
  const painted = artFor(iconId(id));
  if (!painted) return h('span', { class: 'okta-app-icon', 'aria-hidden': 'true' }, CATALOG.find((c) => c.id === id)?.glyph ?? '□');
  return h('img', { class: 'okta-app-icon', src: import.meta.env.BASE_URL + painted.image, alt: '', width: size, height: size });
}
const stamp = (at: number) => `Day ${Math.floor(at / MINUTES_A_DAY)}, ${clockText(at % MINUTES_A_DAY)}`;
const field = (form: HTMLFormElement, name: string) => String(new FormData(form).get(name) ?? '');

/** The four steps of Marketing's pilot, and whether each is done. */
function pilotSteps(s: GameState): [string, boolean, string][] {
  const { okta } = s;
  const marketing = hrOn(s.day).filter((r) => r.dept === 'Marketing' && r.status === 'active');
  const deptRule = okta.rules.find((r) => 'dept' in r && r.dept === 'Marketing');
  const allHave = marketing.length > 0 && marketing.every((r) => appsOf(okta, r.login).includes('hootsweet'));
  return [
    ['Import Marketing from the HR file', marketing.every((r) => okta.users[r.login]), 'Directory › Import from HR'],
    ['Give Marketing a group, filled by a rule', Boolean(deptRule), 'Directory › Groups: e.g. DEPT-Marketing, rule: department is Marketing'],
    ['Add Hootsweet from the App Catalog', Boolean(okta.apps.hootsweet), 'Applications › Browse App Catalog'],
    ['Assign Hootsweet to a group, so all of Marketing get it', allHave, 'Applications › Hootsweet: e.g. APP-Hootsweet-Users, filled from DEPT-Marketing'],
  ];
}

function dashboard(app: App): HTMLElement {
  const { okta } = app.state;
  const active = Object.values(okta.users).filter((u) => u.status === 'active').length;
  return h('div', { class: 'okta-page' },
    h('h1', {}, 'Dashboard'),
    h('div', { class: 'okta-stats' },
      h('div', {}, h('strong', {}, String(active)), h('span', {}, 'Active people')),
      h('div', {}, h('strong', {}, String(okta.groups.length)), h('span', {}, 'Groups')),
      h('div', {}, h('strong', {}, String(Object.keys(okta.apps).length)), h('span', {}, 'Applications'))),
    // The pilot checklist helps in week 2; once every step's done it gets out of the way.
    pilotSteps(app.state).some(([, done]) => !done) && h('section', { class: 'okta-card', 'data-testid': 'okta-pilot' },
      h('h2', {}, 'Getting started: the Marketing pilot'),
      h('ol', { class: 'okta-steps' }, ...pilotSteps(app.state).map(([step, done, where]) => h('li', { class: done ? 'done' : '' },
        h('span', { class: 'okta-tick', 'aria-label': done ? 'Done' : 'Not done' }, done ? '✔' : '○'),
        h('div', {}, h('strong', {}, step), h('p', { class: 'meta' }, where)))))),
  );
}

/** Someone's page: their profile against HR, their groups and apps, and what IT can do to their account. */
function person(app: App, login: string): HTMLElement {
  const { state, ui } = app;
  const user = state.okta.users[login];
  if (!user) return h('p', {}, 'No such person.');
  const row = hrOn(state.day).find((r) => r.login === login);
  const diffs = row ? differences(user, row) : [];
  const verifying = ui.oktaVerify === login;
  return h('div', { class: 'okta-page' },
    h('button', { class: 'okta-back', onclick: () => { ui.oktaUser = undefined; app.rerender(); } }, '← People'),
    h('h1', {}, user.name, h('span', { class: `okta-pill ${user.status}` }, user.status === 'active' ? 'Active' : 'Deactivated')),
    h('div', { class: 'okta-actions' },
      diffs.length > 0 && h('button', { class: 'okta-btn primary', 'data-testid': 'okta-update', onclick: () => app.set(updateFromHr(state, login)) }, 'Update profile from HR'),
      h('button', { class: 'okta-btn', 'data-testid': 'okta-activate', onclick: () => app.set(setActive(state, login, user.status !== 'active')) },
        user.status === 'active' ? 'Deactivate' : 'Activate'),
      user.status === 'active' && h('button', { class: 'okta-btn', 'data-testid': 'okta-reset-mfa', onclick: () => { ui.oktaVerify = login; app.rerender(); } }, 'Reset Authenticators')),
    verifying && row && h('section', { class: 'okta-card warn', role: 'dialog', 'aria-label': 'Check it’s really them', 'data-testid': 'okta-verify' },
      h('h2', {}, 'Check it’s really them'),
      h('p', {}, 'Before you reset anything, check the request against what HR has. Not against what the request says.'),
      h('dl', { class: 'okta-dl' }, ...[['Employee ID', row.employeeId], ['Department', row.dept], ['Title', row.title], ['Manager', row.manager]]
        .flatMap(([k, v]) => [h('dt', {}, k ?? ''), h('dd', {}, v ?? '')])),
      h('div', { class: 'okta-actions' },
        h('button', { class: 'okta-btn primary', 'data-testid': 'okta-verified', onclick: () => { ui.oktaVerify = undefined; app.set(resetMfa(state, login)); } }, 'It matches. Reset'),
        h('button', { class: 'okta-btn', onclick: () => { ui.oktaVerify = undefined; app.rerender(); } }, 'Cancel'))),
    diffs.length > 0 && h('section', { class: 'okta-card warn' }, h('h2', {}, 'Different from HR'), h('ul', {}, ...diffs.map((d) => h('li', {}, d)))),
    h('section', { class: 'okta-card' },
      h('h2', {}, 'Profile'),
      h('dl', { class: 'okta-dl' }, ...[['Login', `${login}@burrow.co`], ['Employee ID', user.employeeId], ['Department', user.dept], ['Title', user.title], ['Manager', user.manager]]
        .flatMap(([k, v]) => [h('dt', {}, k ?? ''), h('dd', {}, v ?? '')]))),
    h('section', { class: 'okta-card' },
      h('h2', {}, 'Groups'),
      h('p', {}, groupsOf(state.okta, login).join(', ')),
      h('h2', {}, 'Their dashboard'),
      h('div', { class: 'okta-tiles' }, ...(appsOf(state.okta, login).length
        ? appsOf(state.okta, login).map((a) => h('span', { class: 'okta-tile' }, appIcon(a, 36), appName(a)))
        : [h('p', { class: 'meta' }, user.status === 'active' ? 'No apps yet.' : 'Deactivated: they can’t sign in.')]))),
  );
}

function people(app: App): HTMLElement {
  const { state, ui } = app;
  if (ui.oktaUser) return person(app, ui.oktaUser);
  const users = Object.entries(state.okta.users).sort(([, a], [, b]) => a.name.localeCompare(b.name));
  return h('div', { class: 'okta-page' },
    h('h1', {}, 'People'),
    users.length === 0
      ? h('p', { class: 'okta-empty' }, 'Nobody here yet. People come in from the HR file: Directory › Import from HR.')
      : h('table', { class: 'okta-table' },
        h('thead', {}, h('tr', {}, ...['Person', 'Department', 'Title', 'Status'].map((c) => h('th', {}, c)))),
        h('tbody', {}, ...users.map(([login, u]) => h('tr', {},
          h('td', {}, h('button', { class: 'okta-link', 'data-testid': `okta-person-${login}`, onclick: () => { ui.oktaUser = login; app.rerender(); } }, u.name),
            h('span', { class: 'meta' }, ` ${login}@burrow.co`)),
          h('td', {}, u.dept), h('td', {}, u.title),
          h('td', {}, h('span', { class: `okta-pill ${u.status}` }, u.status === 'active' ? 'Active' : 'Deactivated')))))),
  );
}

/** How an HR row compares with Oktopus: the thing to look at when deciding joiner, mover or leaver. */
function hrStatus(okta: Okta, row: HrRow): string {
  const user = okta.users[row.login];
  if (!user) return row.status === 'terminated' ? 'Terminated in HR. Not in Oktopus.' : 'Not in Oktopus';
  if (row.status === 'terminated') return user.status === 'active' ? 'Terminated in HR, still active here' : 'Terminated in HR. Deactivated here.';
  const diffs = differences(user, row);
  if (diffs.length) return diffs.join('. ');
  return user.status === 'active' ? 'In sync' : 'Active in HR, deactivated here';
}

function importPage(app: App): HTMLElement {
  const { state } = app;
  const rows = hrOn(state.day);
  return h('div', { class: 'okta-page' },
    h('h1', {}, 'Import from HR'),
    h('p', {}, 'The HR file is the source of truth. Compare it with Oktopus and bring Oktopus in line, one person at a time.'),
    h('table', { class: 'okta-table' },
      h('thead', {}, h('tr', {}, ...['Employee', 'HR says', 'Compared with Oktopus', ''].map((c) => h('th', {}, c)))),
      h('tbody', {}, ...rows.map((r) => {
        const user = state.okta.users[r.login];
        const status = hrStatus(state.okta, r);
        return h('tr', { class: status === 'In sync' ? 'quiet' : '' },
          h('td', {}, h('strong', {}, r.name), h('span', { class: 'meta' }, ` ${r.employeeId}`)),
          h('td', {}, `${r.dept}, ${r.title}${r.status === 'terminated' ? ' (terminated)' : ''}`),
          h('td', {}, status),
          h('td', { class: 'okta-row-actions' },
            !user && r.status === 'active' && h('button', { class: 'okta-btn small primary', 'data-testid': `okta-create-${r.login}`, onclick: () => app.set(createFromHr(state, r.login)) }, 'Create'),
            user && status !== 'In sync' && differences(user, r).length > 0 && h('button', { class: 'okta-btn small', 'data-testid': `okta-sync-${r.login}`, onclick: () => app.set(updateFromHr(state, r.login)) }, 'Update profile'),
            user?.status === 'active' && status !== 'In sync' && h('button', { class: 'okta-btn small', 'data-testid': `okta-deactivate-${r.login}`, onclick: () => app.set(setActive(state, r.login, false)) }, 'Deactivate')));
      }))),
  );
}

function groupsPage(app: App): HTMLElement {
  const { state } = app;
  const { okta } = state;
  const members = (g: string) => Object.keys(okta.users).filter((l) => groupsOf(okta, l).includes(g)).length;
  const options = (values: readonly string[]) => values.map((v) => h('option', { value: v }, v));
  const newGroup = h('form', { class: 'okta-form', onsubmit: (e) => {
    e.preventDefault();
    app.set(addGroup(state, field(e.target as HTMLFormElement, 'name')));
  } },
    h('label', {}, 'Group name ', h('input', { name: 'name', placeholder: 'DEPT-Marketing', required: true, autocomplete: 'off', 'data-testid': 'okta-group-name' })),
    h('button', { class: 'okta-btn primary', type: 'submit', 'data-testid': 'okta-add-group' }, 'Add group'));
  const targets = okta.groups.filter((g) => g !== 'Everyone');
  const deptRule = h('form', { class: 'okta-form', onsubmit: (e) => {
    e.preventDefault();
    const f = e.target as HTMLFormElement;
    app.set(addRule(state, { group: field(f, 'group'), dept: field(f, 'dept') as Department }));
  } },
    h('span', {}, 'Everyone whose department is'),
    h('select', { name: 'dept', 'data-testid': 'okta-rule-dept' }, ...options(DEPARTMENTS)),
    h('span', {}, 'goes in'),
    h('select', { name: 'group', 'data-testid': 'okta-rule-dept-group' }, ...options(targets)),
    h('button', { class: 'okta-btn primary', type: 'submit', disabled: targets.length === 0, 'data-testid': 'okta-add-dept-rule' }, 'Add rule'));
  const groupRule = h('form', { class: 'okta-form', onsubmit: (e) => {
    e.preventDefault();
    const f = e.target as HTMLFormElement;
    app.set(addRule(state, { group: field(f, 'group'), memberOf: field(f, 'from') }));
  } },
    h('span', {}, 'Everyone in'),
    h('select', { name: 'from', 'data-testid': 'okta-rule-from' }, ...options(okta.groups)),
    h('span', {}, 'goes in'),
    h('select', { name: 'group', 'data-testid': 'okta-rule-group' }, ...options(targets)),
    h('button', { class: 'okta-btn primary', type: 'submit', disabled: targets.length === 0, 'data-testid': 'okta-add-group-rule' }, 'Add rule'));
  return h('div', { class: 'okta-page' },
    h('h1', {}, 'Groups'),
    h('table', { class: 'okta-table' },
      h('thead', {}, h('tr', {}, h('th', {}, 'Group'), h('th', {}, 'People'))),
      h('tbody', {}, ...okta.groups.map((g) => h('tr', {}, h('td', {}, g), h('td', {}, String(members(g))))))),
    newGroup,
    h('h2', {}, 'Rules'),
    h('p', { class: 'meta' }, 'Rules fill groups for you. When HR changes someone, the rules move them.'),
    okta.rules.length === 0 ? h('p', { class: 'okta-empty' }, 'No rules yet.')
      : h('ul', { class: 'okta-rules' }, ...okta.rules.map((r, i) => h('li', {},
        h('span', {}, 'dept' in r ? `Department is ${r.dept}` : `Member of ${r.memberOf}`, ' → ', h('strong', {}, r.group)),
        h('button', { class: 'okta-btn small', onclick: () => app.set(removeRule(state, i)) }, 'Delete')))),
    deptRule,
    groupRule,
  );
}

function appsPage(app: App): HTMLElement {
  const { state, ui } = app;
  const { okta } = state;
  const open = ui.oktaApp && okta.apps[ui.oktaApp] ? ui.oktaApp : undefined;
  if (open) {
    const assigned = okta.apps[open] ?? [];
    const using = Object.keys(okta.users).filter((l) => appsOf(okta, l).includes(open));
    return h('div', { class: 'okta-page' },
      h('button', { class: 'okta-back', onclick: () => { ui.oktaApp = undefined; app.rerender(); } }, '← Applications'),
      h('h1', { class: 'okta-app-title' }, appIcon(open, 32), appName(open)),
      h('section', { class: 'okta-card' },
        h('h2', {}, 'Assignments'),
        h('p', { class: 'meta' }, 'Apps are assigned to groups. People get them through their groups.'),
        assigned.length === 0 ? h('p', { class: 'okta-empty' }, 'Not assigned to any group yet.')
          : h('ul', { class: 'okta-rules' }, ...assigned.map((g) => h('li', {}, h('strong', {}, g),
            h('button', { class: 'okta-btn small', onclick: () => app.set(unassignApp(state, open, g)) }, 'Remove')))),
        h('form', { class: 'okta-form', onsubmit: (e) => { e.preventDefault(); app.set(assignApp(state, open, field(e.target as HTMLFormElement, 'group'))); } },
          h('span', {}, 'Assign to group'),
          h('select', { name: 'group', 'data-testid': 'okta-assign-group' }, ...okta.groups.map((g) => h('option', { value: g }, g))),
          h('button', { class: 'okta-btn primary', type: 'submit', 'data-testid': 'okta-assign' }, 'Assign'))),
      h('section', { class: 'okta-card' },
        h('h2', {}, `Who can sign in to it (${using.length})`),
        h('p', {}, using.length ? using.map((l) => okta.users[l]?.name ?? l).join(', ') : 'Nobody yet.')));
  }
  return h('div', { class: 'okta-page' },
    h('h1', {}, 'Applications'),
    Object.keys(okta.apps).length === 0 ? h('p', { class: 'okta-empty' }, 'No applications yet.')
      : h('div', { class: 'okta-tiles' }, ...Object.keys(okta.apps).map((a) => h('button', {
        class: 'okta-tile', 'data-testid': `okta-app-${a}`, onclick: () => { ui.oktaApp = a; app.rerender(); },
      }, appIcon(a, 36), appName(a)))),
    h('h2', {}, 'Browse App Catalog'),
    h('ul', { class: 'okta-catalog' }, ...CATALOG.map((c) => h('li', {},
      h('span', { class: 'okta-catalog-name' }, appIcon(c.id, 24), h('strong', {}, c.name), h('span', { class: 'meta' }, ` ${c.about}`)),
      okta.apps[c.id] ? h('span', { class: 'meta' }, 'Added') : h('button', { class: 'okta-btn small', 'data-testid': `okta-add-app-${c.id}`, onclick: () => app.set(addApp(state, c.id)) }, 'Add')))),
  );
}

function logPage(app: App): HTMLElement {
  const { log } = app.state.okta;
  return h('div', { class: 'okta-page' },
    h('h1', {}, 'System Log'),
    log.length === 0 ? h('p', { class: 'okta-empty' }, 'Nothing has happened yet.')
      : h('table', { class: 'okta-table' },
        h('thead', {}, h('tr', {}, ...['When', 'Event', 'Target', 'Actor'].map((c) => h('th', {}, c)))),
        h('tbody', {}, ...[...log].reverse().map((e) => h('tr', {}, h('td', {}, stamp(e.at)), h('td', {}, h('code', {}, e.event)), h('td', {}, e.target), h('td', {}, 'intern'))))),
  );
}

/**
 * Security: the sign-on policy. Turn on phone sign-in (MFA) for a group, and everyone in it must use their phone as
 * well as their password. It shows who can still get in with a password alone.
 */
function securityPage(app: App): HTMLElement {
  const { state } = app;
  const { okta } = state;
  const active = Object.keys(okta.users).filter((l) => okta.users[l]?.status === 'active');
  const loose = active.filter((l) => !needsMfa(okta, l));
  return h('div', { class: 'okta-page' },
    h('h1', {}, 'Security: sign-on policy'),
    h('p', { class: 'meta' }, 'Require phone sign-in for a group, and everyone in it must use their phone as well as their password. Policies go on groups, like apps.'),
    h('section', { class: 'okta-card' },
      h('h2', {}, 'Require phone sign-in'),
      h('ul', { class: 'okta-rules' }, ...okta.groups.map((g) => {
        const on = okta.mfa.includes(g);
        return h('li', {}, h('label', { class: 'okta-switch' },
          h('input', { type: 'checkbox', checked: on, 'data-testid': `okta-mfa-${g}`, onchange: () => app.set(requireMfa(state, g, !on)) }),
          h('strong', {}, g), h('span', { class: 'meta' }, ` ${Object.keys(okta.users).filter((l) => groupsOf(okta, l).includes(g)).length} people`)));
      }))),
    h('section', { class: 'okta-card' },
      h('h2', {}, `Password only (${loose.length} of ${active.length})`),
      h('p', {}, loose.length ? loose.map((l) => okta.users[l]?.name ?? l).join(', ') : 'Nobody. Everyone has to use their phone to sign in.')));
}

const PAGES: [OktaPage, string, string][] = [
  ['dashboard', 'Dashboard', '\u{1F3E0}'], ['people', 'People', '\u{1F464}'], ['groups', 'Groups', '\u{1F465}'],
  ['import', 'Import from HR', '\u{1F4E5}'], ['apps', 'Applications', '\u{1F9E9}'], ['security', 'Security', '\u{1F512}'], ['log', 'System Log', '\u{1F4DC}'],
];

export function oktopus(app: App): HTMLElement {
  const { ui } = app;
  const page = ui.oktaPage ?? 'dashboard';
  const go = (to: OktaPage) => () => { ui.oktaPage = to; ui.oktaUser = undefined; ui.oktaApp = undefined; ui.oktaVerify = undefined; app.rerender(); };
  const body = { dashboard, people, groups: groupsPage, import: importPage, apps: appsPage, security: securityPage, log: logPage }[page](app);
  return h('div', { class: 'okta', 'data-testid': 'oktopus' },
    h('div', { class: 'ridge-bar' },
      h('span', { class: 'ridge-nav', 'aria-hidden': 'true' }, '← → ↻'),
      h('span', { class: 'ridge-address', 'aria-label': 'Address' }, 'https://burrow-admin.oktopus.com/admin')),
    h('header', { class: 'okta-top' },
      h('span', { class: 'okta-brand' }, oktopusLogo()),
      h('span', { class: 'okta-search', 'aria-hidden': 'true' }, 'Search people, apps and groups'),
      h('span', { class: 'meta' }, 'intern · Super Administrator')),
    h('div', { class: 'okta-body' },
      h('nav', { class: 'okta-nav', 'aria-label': 'Oktopus admin' },
        ...PAGES.map(([id, label, glyph]) => h('button', {
          class: `okta-nav-item${page === id ? ' on' : ''}`, 'aria-current': page === id ? 'page' : 'false', 'data-testid': `okta-nav-${id}`, onclick: go(id),
        }, h('span', { 'aria-hidden': 'true' }, glyph), label))),
      h('section', { class: 'okta-main' }, body)),
  );
}
