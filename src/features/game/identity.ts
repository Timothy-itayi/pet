import { COST } from './data.ts';
import { MINUTES_A_DAY } from './directory.ts';
import { CATALOG, hrOn, type GroupRule, type Okta } from './oktopus.ts';
import { officeWork, type GameState } from './rules.ts';

/**
 * Work in the Oktopus admin console. Each change takes a few minutes and goes in the System Log,
 * under the same kind of event names the real thing uses.
 */

function oktaWork(s: GameState, event: string, target: string, change: (okta: Okta, d: GameState) => false | undefined): GameState {
  let changed = true;
  const next = officeWork(s, COST.unlock, (d) => {
    changed = change(d.okta, d) !== false;
    if (changed) d.okta.log.push({ at: d.day * MINUTES_A_DAY + d.clock, event, target });
  });
  return changed ? next : s;
}

const hrRow = (s: GameState, login: string) => hrOn(s.day).find((r) => r.login === login);

/** Create someone in Oktopus from their HR row: a joiner, or the first import. */
export const createFromHr = (s: GameState, login: string) => oktaWork(s, 'user.lifecycle.create', login, (okta, d) => {
  const row = hrRow(d, login);
  if (!row || okta.users[login]) return false;
  const { employeeId, name, dept, title, manager } = row;
  okta.users[login] = { employeeId, name, dept, title, manager, status: 'active' };
});

/** Copy someone's department, title and manager from HR: what a mover needs. */
export const updateFromHr = (s: GameState, login: string) => oktaWork(s, 'user.account.update_profile', login, (okta, d) => {
  const row = hrRow(d, login);
  const user = okta.users[login];
  if (!row || !user) return false;
  Object.assign(user, { dept: row.dept, title: row.title, manager: row.manager });
});

export const setActive = (s: GameState, login: string, active: boolean) =>
  oktaWork(s, active ? 'user.lifecycle.activate' : 'user.lifecycle.deactivate', login, (okta) => {
    const user = okta.users[login];
    if (!user || (user.status === 'active') === active) return false;
    user.status = active ? 'active' : 'deactivated';
  });

/** Remove someone's sign-in methods after a lost phone. They set them up again on their next sign-in. */
export const resetMfa = (s: GameState, login: string) => oktaWork(s, 'user.mfa.factor.deactivate', login, (okta, d) => {
  const user = okta.users[login];
  if (!user) return false;
  user.mfaResetAt = d.day * MINUTES_A_DAY + d.clock;
});

/** Add a group. Names are kept exactly as typed (rules match them exactly); blank and duplicate names are refused. */
export const addGroup = (s: GameState, name: string) => oktaWork(s, 'group.lifecycle.create', name.trim(), (okta) => {
  const clean = name.trim();
  if (!clean || okta.groups.includes(clean)) return false;
  okta.groups.push(clean);
});

export const addRule = (s: GameState, rule: GroupRule) => oktaWork(s, 'group.rule.activate', rule.group, (okta) => {
  if (!okta.groups.includes(rule.group) || ('memberOf' in rule && rule.memberOf === rule.group)) return false;
  okta.rules.push(rule);
});

export const removeRule = (s: GameState, index: number) => oktaWork(s, 'group.rule.delete', String(index), (okta) => {
  if (!okta.rules[index]) return false;
  okta.rules.splice(index, 1);
});

export const addApp = (s: GameState, app: string) => oktaWork(s, 'application.lifecycle.create', app, (okta) => {
  if (!CATALOG.some((c) => c.id === app) || okta.apps[app]) return false;
  okta.apps[app] = [];
});

/** Assign an app to a group. Apps go to groups, never to people one at a time. */
export const assignApp = (s: GameState, app: string, group: string) => oktaWork(s, 'application.user_membership.add', `${app} → ${group}`, (okta) => {
  const assigned = okta.apps[app];
  if (!assigned || !okta.groups.includes(group) || assigned.includes(group)) return false;
  assigned.push(group);
});

export const unassignApp = (s: GameState, app: string, group: string) => oktaWork(s, 'application.user_membership.remove', `${app} → ${group}`, (okta) => {
  const assigned = okta.apps[app];
  if (!assigned?.includes(group)) return false;
  okta.apps[app] = assigned.filter((g) => g !== group);
});
