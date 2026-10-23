import type { Department } from './directory.ts';

/**
 * Oktopus: the modern sign-on Burrow buys in week 2, starting with Marketing. People come from the HR file
 * (the source of truth), groups are filled by rules, and apps are assigned to groups, never to people one by one.
 */

/** Week 2 starts on day 6: the morning Oktopus arrives. */
export const OKTOPUS_DAY = 6;

/** The HR file: one row per person, as it stands on a given day. Only HR changes it; IT follows. */
export interface HrRow {
  employeeId: string;
  login: string;
  name: string;
  dept: Department;
  title: string;
  manager: string;
  status: 'active' | 'terminated';
}

const BASE: HrRow[] = [
  { employeeId: 'EMP-1001', login: 'grisby', name: 'Mr. Grisby', dept: 'Management', title: 'Managing Director', manager: '—', status: 'active' },
  { employeeId: 'EMP-1002', login: 'dot', name: 'Dot', dept: 'Finance', title: 'Accounts Clerk', manager: 'EMP-1003', status: 'active' },
  { employeeId: 'EMP-1003', login: 'otis', name: 'Otis', dept: 'Finance', title: 'Company Secretary', manager: 'EMP-1001', status: 'active' },
  { employeeId: 'EMP-1004', login: 'juniper', name: 'Juniper', dept: 'Marketing', title: 'Marketing Coordinator', manager: 'EMP-1001', status: 'active' },
  { employeeId: 'EMP-1005', login: 'wren', name: 'Wren', dept: 'Marketing', title: 'Content Writer', manager: 'EMP-1004', status: 'active' },
  { employeeId: 'EMP-1006', login: 'basil', name: 'Basil', dept: 'Marketing', title: 'Designer', manager: 'EMP-1004', status: 'active' },
  { employeeId: 'EMP-1007', login: 'marlo', name: 'Marlo', dept: 'Sales', title: 'Sales Lead', manager: 'EMP-1001', status: 'active' },
  { employeeId: 'EMP-1008', login: 'biscuit', name: 'Biscuit', dept: 'Operations', title: 'Office Assistant', manager: 'EMP-1001', status: 'active' },
  { employeeId: 'EMP-1009', login: 'pip', name: 'Pip', dept: 'Operations', title: 'Operations Assistant', manager: 'EMP-1001', status: 'active' },
  { employeeId: 'EMP-0042', login: 'sam', name: 'Sam', dept: 'IT', title: 'IT Administrator', manager: 'EMP-1001', status: 'terminated' },
  { employeeId: 'EMP-1010', login: 'intern', name: 'Intern (you)', dept: 'IT', title: 'IT Intern', manager: 'EMP-1001', status: 'active' },
];

/** What changes in HR during week 2: a joiner, a mover and a leaver. */
const CHANGES: { day: number; row: HrRow }[] = [
  { day: 7, row: { employeeId: 'EMP-1011', login: 'fern', name: 'Fern', dept: 'Marketing', title: 'Social Media Assistant', manager: 'EMP-1004', status: 'active' } },
  { day: 8, row: { employeeId: 'EMP-1006', login: 'basil', name: 'Basil', dept: 'Sales', title: 'Sales Designer', manager: 'EMP-1007', status: 'active' } },
  { day: 9, row: { employeeId: 'EMP-1005', login: 'wren', name: 'Wren', dept: 'Marketing', title: 'Content Writer', manager: 'EMP-1004', status: 'terminated' } },
];

/** The HR file on a given day. */
export function hrOn(day: number): HrRow[] {
  const rows = new Map(BASE.map((r) => [r.employeeId, r]));
  for (const c of CHANGES) if (c.day <= day) rows.set(c.row.employeeId, c.row);
  return [...rows.values()];
}

export interface OktaUser {
  employeeId: string;
  name: string;
  dept: Department;
  title: string;
  manager: string;
  status: 'active' | 'deactivated';
  /** When IT last reset their sign-in methods (a lost phone), as day * minutes + clock. */
  mfaResetAt?: number;
}

/** A group rule: everyone who matches goes into the group, and comes out again when they stop matching. */
export type GroupRule = { group: string } & ({ dept: Department } | { memberOf: string });

export interface Okta {
  /** By login. */
  users: Record<string, OktaUser>;
  groups: string[];
  rules: GroupRule[];
  /** Apps added from the catalog, and the groups each is assigned to. */
  apps: Record<string, string[]>;
  /** The System Log: what was done, newest last. */
  log: { at: number; event: string; target: string }[];
}

export const newOkta = (): Okta => ({ users: {}, groups: ['Everyone'], rules: [], apps: {}, log: [] });

/** Apps in the Oktopus catalog. Hootsweet is Marketing's social media scheduler. */
export const CATALOG = [
  { id: 'hootsweet', name: 'Hootsweet', glyph: '\u{1F989}', about: 'Schedule social media posts. Marketing’s favourite.' },
  { id: 'voyago', name: 'Voyago', glyph: '✈', about: 'Business travel and expenses. Finance wants it next.' },
  { id: 'canvass', name: 'Canvass', glyph: '\u{1F3A8}', about: 'Design anything. Basil has opinions.' },
] as const;

/** Which groups someone is in: Everyone, plus every group a rule puts them in (rules can build on other groups). */
export function groupsOf(okta: Okta, login: string): string[] {
  const user = okta.users[login];
  if (!user) return [];
  const groups = new Set(['Everyone']);
  for (let pass = 0; pass < okta.rules.length + 1; pass++) {
    for (const rule of okta.rules) {
      if ('dept' in rule ? user.dept === rule.dept : groups.has(rule.memberOf)) groups.add(rule.group);
    }
  }
  return [...groups];
}

/** The app tiles someone sees when they sign in: apps assigned to any of their groups. Nothing, if they're deactivated. */
export function appsOf(okta: Okta, login: string): string[] {
  if (okta.users[login]?.status !== 'active') return [];
  const groups = groupsOf(okta, login);
  return Object.entries(okta.apps).filter(([, assigned]) => assigned.some((g) => groups.includes(g))).map(([app]) => app);
}

/** How someone's Oktopus profile differs from HR, in words; empty when they match. */
export function differences(user: OktaUser, row: HrRow): string[] {
  const out: string[] = [];
  if (user.dept !== row.dept) out.push(`Department: Oktopus says ${user.dept}, HR says ${row.dept}`);
  if (user.title !== row.title) out.push(`Title: Oktopus says ${user.title}, HR says ${row.title}`);
  if (user.manager !== row.manager) out.push(`Manager: Oktopus says ${user.manager}, HR says ${row.manager}`);
  return out;
}
