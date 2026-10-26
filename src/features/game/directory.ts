/**
 * Burrow & Co.'s staff directory, as Sam left it in Active Directory (the office's old on-site directory).
 * One account per person, keyed by login. Sam's account is still switched on: nobody ever turned it off.
 */

export const DEPARTMENTS = ['Management', 'Finance', 'Marketing', 'Sales', 'Operations', 'IT'] as const;
export type Department = (typeof DEPARTMENTS)[number];

export interface Account {
  name: string;
  dept: Department;
  title: string;
  enabled: boolean;
  /** Too many wrong passwords: nobody gets in until IT unlocks it. */
  locked: boolean;
  /** "User must change password at next logon": the next sign-in makes them pick their own. */
  mustChange: boolean;
  /** When IT last reset the password, as day * MINUTES_A_DAY + office clock. */
  resetAt?: number;
}

export const MINUTES_A_DAY = 24 * 60;

const STAFF: Record<string, Pick<Account, 'name' | 'dept' | 'title'>> = {
  grisby: { name: 'Mr. Grisby', dept: 'Management', title: 'Managing Director' },
  dot: { name: 'Dot', dept: 'Finance', title: 'Accounts Clerk' },
  otis: { name: 'Otis', dept: 'Finance', title: 'Company Secretary' },
  juniper: { name: 'Juniper', dept: 'Marketing', title: 'Marketing Coordinator' },
  wren: { name: 'Wren', dept: 'Marketing', title: 'Content Writer' },
  basil: { name: 'Basil', dept: 'Marketing', title: 'Designer' },
  marlo: { name: 'Marlo', dept: 'Sales', title: 'Sales Lead' },
  biscuit: { name: 'Biscuit', dept: 'Operations', title: 'Office Assistant' },
  pip: { name: 'Pip', dept: 'Operations', title: 'Operations Assistant' },
  clover: { name: 'Clover', dept: 'Operations', title: 'Warehouse Supervisor' },
  moss: { name: 'Moss', dept: 'Operations', title: 'Delivery Driver' },
  tansy: { name: 'Tansy', dept: 'Sales', title: 'Account Manager' },
  hector: { name: 'Hector', dept: 'Finance', title: 'Payroll Officer' },
  sam: { name: 'Sam', dept: 'IT', title: 'IT Administrator' },
  intern: { name: 'Intern (you)', dept: 'IT', title: 'IT Intern' },
};

export function newAccounts(): Record<string, Account> {
  return Object.fromEntries(Object.entries(STAFF).map(([login, a]) => [login, { ...a, enabled: true, locked: false, mustChange: false }]));
}
