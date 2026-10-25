import { COST } from './data.ts';
import { MINUTES_A_DAY } from './directory.ts';
import { CATALOG, hrOn, type GroupRule, type HrRow, type Okta, type OktaUser } from './oktopus.ts';
import { officeWork, SELF, type GameState } from './rules.ts';

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

/*
 * What each change does to Oktopus, on its own, so the console (which takes your time) and a flow (which runs by
 * itself) make exactly the same change. Each returns false when there's nothing it can do.
 */

/** Add someone, with whatever details they're given: from HR by hand, or wired up by a flow, rightly or wrongly. */
export function addUser(okta: Okta, login: string, details: Omit<OktaUser, 'status'>): boolean {
  if (!login || okta.users[login]) return false;
  okta.users[login] = { ...details, status: 'active' };
  return true;
}

/** Copy someone's department, title and manager from their HR row. */
export function copyFromHr(okta: Okta, login: string, row: HrRow | undefined): boolean {
  const user = okta.users[login];
  if (!row || !user) return false;
  Object.assign(user, { dept: row.dept, title: row.title, manager: row.manager });
  return true;
}

export function switchUser(okta: Okta, login: string, active: boolean): boolean {
  const user = okta.users[login];
  // The only IT admin can't lock themselves out.
  if (!user || (user.status === 'active') === active || (login === SELF && !active)) return false;
  user.status = active ? 'active' : 'deactivated';
  return true;
}

/** Create someone in Oktopus from their HR row: a joiner, or the first import. */
export const createFromHr = (s: GameState, login: string) => oktaWork(s, 'user.lifecycle.create', login, (okta, d) => {
  const row = hrRow(d, login);
  if (!row) return false;
  const { employeeId, name, dept, title, manager } = row;
  return addUser(okta, login, { employeeId, name, dept, title, manager }) ? undefined : false;
});

/** Copy someone's department, title and manager from HR: what a mover needs. */
export const updateFromHr = (s: GameState, login: string) => oktaWork(s, 'user.account.update_profile', login, (okta, d) =>
  (copyFromHr(okta, login, hrRow(d, login)) ? undefined : false));

export const setActive = (s: GameState, login: string, active: boolean) =>
  oktaWork(s, active ? 'user.lifecycle.activate' : 'user.lifecycle.deactivate', login, (okta) => (switchUser(okta, login, active) ? undefined : false));

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

/** Require phone sign-in (MFA) for a group, or stop requiring it. A policy on a group covers everyone in it. */
export const requireMfa = (s: GameState, group: string, on: boolean) =>
  oktaWork(s, on ? 'policy.rule.add_mfa' : 'policy.rule.remove_mfa', group, (okta) => {
    if (!okta.groups.includes(group) || okta.mfa.includes(group) === on) return false;
    okta.mfa = on ? [...okta.mfa, group] : okta.mfa.filter((g) => g !== group);
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
