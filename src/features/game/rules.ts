import {
  BOND, CALLER, CLOSE, COST, LOCKUP, DAILY_COST, DAYS, DAY_SCRIPTS, DROP_DAY, TOOLS, GOAL_VOUCHER, ISSUES, JOBS, MAX_PUSHES,
  MESSY_SLIPS, OPEN, REPLIES, START_SAVINGS, THANKS, TICKET_LANDS_AFTER, TICKETS, VILLAGERS,
  WORKAROUND_RETURNS_AFTER, XP, type VillagerId,
} from './data.ts';
import { MINUTES_A_DAY, newAccounts, type Account } from './directory.ts';
import { flowProblem, runToday, TASKS, TRIGGERS, upgradeFlow } from './flows.ts';
import { cluesFor, crossedBy, firstTest, methodStars, suspectsOf, type Stars } from './notebook.ts';
import { BREAK, breakPhone, newPhones, PHONES_DAY, replacedSince, replaceProblem, settleRequests, verifyProblem, type HardwareRequest, type Phone } from './phones.ts';
import { awayLine, backAt, dayMood } from './people.ts';
import { appsOf, CATALOG, hrOn, needsMfa, newOkta, type Okta } from './oktopus.ts';
import { MOODS, type ConsoleFix, type Fix, type Issue, type Note, type Job, type Mood, type PageStatus, type Relation, type Skill, type Ticket, type Tool } from './types.ts';

export type Phase = 'boot' | 'desktop' | 'desk' | 'dayEnd' | 'ending';
export type Ending = 'hired' | 'burnout' | 'stay';
/** A ticket's life, like a real service desk: new, open (you've replied), pending (pushed back), resolved. */
export type Status = 'new' | 'open' | 'pending' | 'resolved';
/** At your computer, or away from it helping someone in person. */

export interface Message {
  from: 'them' | 'you';
  text: string;
  at: number;
}

export interface TicketState {
  status: Status;
  mood: Mood;
  /** Times you let them down: fixes that didn't work. Zero on a fix makes a friend. */
  slips: number;
  pushes: number;
  workedAround: boolean;
  tried: string[];
  messages: Message[];
  /** It's a real ticket (submitted, or logged after you asked on chat), so it comes through your queue and counts. */
  logged?: boolean;
  /** It started as a chat message, and you asked them to log a ticket. */
  asked?: boolean;
  /** They've already been to Mr. Grisby about this one. */
  complained?: boolean;
  /** Questions they've answered. What they said is in the messages. */
  heard: string[];
  /**
   * What the caller is doing for you: answering a question or trying a suggestion, until they reply at `until`;
   * or done, having confirmed a suggestion works. Nothing: it's your move. One thing at a time, like a real call.
   */
  caller?: { doing: 'answer' | 'try'; id: string; until: number } | { doing: 'confirmed'; id: string };
  /** Your notebook page for it: the suspects ruled out (fix ids), and how you went about your first test. */
  crossed?: string[];
  first?: { fix: string; asked: number; crossed: number; simplest: boolean };
}

export interface Outcome {
  ticketId: string;
  kind: 'fix' | 'workaround' | 'push' | 'complaint' | 'asked';
  /** A complaint about a grave mistake, rather than about waiting. */
  grave?: boolean;
  xp: number;
  /** After a fix: whether you wrote the work note, and what was wrong with your last try at it. */
  noted?: boolean;
  noteMiss?: string;
  /** Fixed with a tool from your desk: its runbook page is the note to write. */
  tool?: string;
  /** Sam's method, scored: how you went about it. And the clue you picked as the one that proved it. */
  stars?: Stars;
  clue?: string;
}

export interface Today {
  /** Tickets resolved: the only number Mr. Grisby counts. */
  resolved: number;
  pushed: number;
  wrongFixes: number;
  complaints: number;
  notes: number;
  xp: number;
  voucher: boolean;
  /** Minutes you stayed past 5pm, unpaid. */
  overtime: number;
  /** Who became a friend or nemesis today, or stopped being one. */
  bonds: { who: VillagerId; now: Relation }[];
  /** Sam's method stars earned today, out of how many there were. */
  stars?: number;
  maxStars?: number;
}

export interface GameState {
  version: 11;
  /** 1..DAYS while working; DAYS + 1 once the week is over. */
  day: number;
  phase: Phase;
  /** Office clock, minutes since midnight. */
  clock: number;
  /** Tickets waiting on you right now, oldest first. */
  queue: string[];
  /** People who messaged you on chat instead of logging a ticket, waiting for an answer. */
  chats: string[];
  /** Tickets still to arrive today. */
  arriving: { id: string; at: number }[];
  /** Tickets coming back on a later day. */
  returning: { id: string; day: number }[];
  tickets: Record<string, TicketState>;
  bonds: Record<VillagerId, number>;
  xp: Record<Skill, number>;
  savings: number;
  today: Today;
  /** Runbook pages: one per issue, plus 'tool:<id>' for each tool you own. */
  runbook: Record<string, PageStatus>;
  /** The runbook pages you've written, in your own words, by page. */
  written: Record<string, string>;
  /** Your notebook: for each page, the clue that proved it and what you ruled out on the way. */
  clues?: Record<string, { clue: string; ruledOut: string[]; fix: string }>;
  /** Tools on your desk. */
  tools: string[];
  /** Everyone's account in Active Directory, by login. */
  accounts: Record<string, Account>;
  /** How many Burrow Intranet posts you've read. */
  newsRead: number;
  /** Oktopus, from week 2: people, groups, rules and apps. */
  okta: Okta;
  /** Company phones, from week 4: in your desk drawer, in your hand, or given to someone. */
  phones: Phone[];
  /** Replacement phones asked for, and whether Mr. Grisby has approved them yet. */
  requests: HardwareRequest[];
  /** The day you last approved Oktopus Verify's push to sign in to Oktopus Admin yourself. */
  pushOk?: number;
  /** What you did with the sign-in push you didn't start, on day 18. */
  rogue?: 'approved' | 'denied';
  /** A tool that turned up on your desk this morning, to show you when you sit down. */
  drop?: string;
  /** Fixed when the game starts, so the same choices give the same loot. */
  seed: number;
  /** Cards to show, oldest first: a "why" card after a fix, someone storming off, and so on. The clock stops while one is up. */
  outcomes: Outcome[];
  /** One-line feedback on a ticket, e.g. a wrong fix. */
  notice?: { ticketId: string; text: string };
  ending?: Ending;
  jobId?: string;
}

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
/** The day of the week for a game day: Monday to Friday each week, Saturday once it's all over. */
export const weekday = (day: number) => (day > DAYS ? 'Saturday' : WEEKDAYS[(day - 1) % WEEKDAYS.length] ?? 'Monday');
/** Which week a game day is in, from 1. */
export const weekOf = (day: number) => Math.ceil(Math.min(day, DAYS) / WEEKDAYS.length);

/** '9:05' -> minutes since midnight. */
export function clockTime(hm: string): number {
  const [h, m] = hm.split(':').map(Number);
  if (h === undefined || m === undefined || Number.isNaN(h) || Number.isNaN(m)) throw new Error(`Bad clock time: ${hm}`);
  return h * 60 + m;
}

export const ticketById = (id: string): Ticket => {
  const t = TICKETS.find((x) => x.id === id);
  if (!t) throw new Error(`Unknown ticket: ${id}`);
  return t;
};

export const issueOf = (t: Ticket): Issue => {
  const issue = ISSUES.find((x) => x.id === t.issue);
  if (!issue) throw new Error(`Unknown issue: ${t.issue}`);
  return issue;
};

export function ticketState(s: GameState, id: string): TicketState {
  const st = s.tickets[id];
  if (!st) throw new Error(`Ticket ${id} hasn't arrived`);
  return st;
}

export function scriptFor(day: number) {
  const script = DAY_SCRIPTS[Math.min(day, DAYS) - 1];
  if (!script) throw new Error(`No script for day ${day}`);
  return script;
}

export const isWeekOver = (s: GameState) => s.day > DAYS;
export const moodName = (m: Mood) => MOODS[m];

export function relation(s: GameState, who: VillagerId): Relation {
  const bond = s.bonds[who];
  return bond >= 1 ? 'friend' : bond <= -1 ? 'nemesis' : 'neutral';
}

export const peopleWho = (s: GameState, r: Relation): VillagerId[] =>
  (Object.keys(s.bonds) as VillagerId[]).filter((who) => relation(s, who) === r);

/** Has your own note rewritten the runbook page for this ticket's problem? */
export const isKnown = (s: GameState, t: Ticket) => s.runbook[t.issue] === 'yours';

export const canWorkaround = (s: GameState, id: string) => !ticketState(s, id).workedAround;
export const canPush = (s: GameState, id: string) => ticketState(s, id).pushes < MAX_PUSHES;
/** Only real tickets count for the manager: tray tickets, or chats you got logged as tickets. */
const isTicket = (s: GameState, t: Ticket) => t.via === 'tray' || Boolean(s.tickets[t.id]?.logged);
/** Asks that come by chat rather than the ticket system: everyone who'd walk up or catch you in the office. */
const byChat = (t: Ticket) => t.via !== 'tray';

const emptyToday = (): Today => ({
  resolved: 0, pushed: 0, wrongFixes: 0, complaints: 0, notes: 0, xp: 0, voucher: false, bonds: [], overtime: 0,
});

/** Each action copies the state, so the caller can keep or drop the old one. */
function act(s: GameState, fn: (d: GameState) => void): GameState {
  const d = structuredClone(s);
  fn(d);
  return d;
}


function arrive(d: GameState, id: string, at: number): void {
  const t = ticketById(id);
  const v = VILLAGERS[t.who];
  const before = d.tickets[id];
  const r = relation(d, t.who);
  // First visit: their usual mood, a step calmer for friends or angrier for nemeses, and a step either way for how
  // the day has left them (sunshine and cake, or rain and auditors).
  // Waiting is normal in IT, so coming back doesn't make anyone crosser, unless you said it was sorted and it
  // broke again (a workaround wearing off). Never already Furious.
  const asked = before?.asked && before.status === 'pending' && byChat(t);
  const brokeAgain = before?.status === 'resolved';
  const today = { bright: -1, usual: 0, low: 1 }[dayMood(t.who, d.day).mood];
  const base = before ? before.mood + (brokeAgain ? 1 : 0) : t.mood + (r === 'nemesis' ? 1 : r === 'friend' ? -1 : 0) + today;
  const mood = Math.max(0, Math.min(base, 2)) as Mood;
  const greeting = r === 'friend' ? `${v.fond} ` : r === 'nemesis' ? `${v.grudge} ` : '';
  // Only friends message you directly. Everyone else submits a ticket, as they should.
  const onChat = byChat(t) && !before?.logged && r === 'friend';
  const again = !before ? '' : asked ? 'Here\u2019s the ticket you asked for. '
    : brokeAgain ? 'It\u2019s broken again. ' : before.status === 'pending' ? 'Back, as you said. ' : 'Still waiting from yesterday. ';
  // On chat they never start with the problem. They start by being friendly.
  const opener = onChat && !before ? [{ from: 'them' as const, text: v.opener, at }] : [];
  // A lockout is real: their account in Active Directory is locked until you unlock it.
  const account = d.accounts[t.who];
  if (!before && account && issueOf(t).console === 'unlock') account.locked = true;
  d.tickets[id] = {
    status: 'new',
    mood,
    slips: before?.slips ?? 0,
    pushes: before?.pushes ?? 0,
    workedAround: before?.workedAround ?? false,
    tried: before?.tried ?? [],
    heard: before?.heard ?? [],
    // Anything they were in the middle of is forgotten overnight; a confirmed fix stays confirmed.
    caller: before?.caller?.doing === 'confirmed' ? before.caller : undefined,
    messages: [...opener, { from: 'them', text: greeting + again + t.message, at }],
    logged: before?.logged || !onChat,
    asked: before?.asked,
  };
  if (onChat) d.chats.push(id);
  else d.queue.push(id);
}

function changeBond(d: GameState, who: VillagerId, by: number): void {
  const before = relation(d, who);
  d.bonds[who] = Math.max(BOND.min, Math.min(d.bonds[who] + by, BOND.max));
  const now = relation(d, who);
  if (now !== before) d.today.bonds = [...d.today.bonds.filter((b) => b.who !== who), { who, now }];
}

/** Take a ticket off your queue and record how it went. */
function close(d: GameState, t: Ticket, kind: Outcome['kind'], xp: number): void {
  const st = ticketState(d, t.id);
  if (kind === 'fix') changeBond(d, t.who, st.slips === 0 ? BOND.clean : st.slips >= MESSY_SLIPS ? BOND.messy : 0);
  const counted = isTicket(d, t);
  st.status = kind === 'push' || kind === 'asked' ? 'pending' : 'resolved';
  st.caller = undefined;
  d.queue = d.queue.filter((id) => id !== t.id);
  d.chats = d.chats.filter((id) => id !== t.id);
  const skill = issueOf(t).skill;
  d.xp[skill] += xp;
  d.today.xp += xp;
  if ((kind === 'fix' || kind === 'workaround') && counted) d.today.resolved += 1;
  d.outcomes.push({ ticketId: t.id, kind, xp });
  if (d.notice?.ticketId === t.id) d.notice = undefined;
}

/**
 * They go to Mr. Grisby. It's on your day report and they like you less, but they still need it fixed:
 * you're the only IT there is, so the ticket stays yours.
 */
function complain(d: GameState, t: Ticket, grave = false): void {
  const st = ticketState(d, t.id);
  st.complained = true;
  d.today.complaints += 1;
  changeBond(d, t.who, BOND.complaint);
  d.outcomes.push({ ticketId: t.id, kind: 'complaint', xp: 0, grave });
}

/** A step crosser, up to Furious. */
function annoy(d: GameState, t: Ticket): void {
  const st = ticketState(d, t.id);
  if (st.mood + 1 < MOODS.length) st.mood = (st.mood + 1) as Mood;
}

/**
 * You let them down: a fix that didn't work. They get crosser, up to Furious, but they stay: it still needs
 * fixing. Only a nemesis, let down again while Furious, goes to the manager about it.
 */
function slip(d: GameState, t: Ticket): void {
  const st = ticketState(d, t.id);
  st.slips += 1;
  if (st.mood + 1 < MOODS.length) annoy(d, t);
  else if (relation(d, t.who) === 'nemesis' && !st.complained) complain(d, t);
}

/** Run the office clock forward: people's tickets and messages arrive on time. */
function advance(d: GameState, minutes: number): void {
  d.clock = Math.min(d.clock + minutes, LOCKUP);
  settleRequests(d);
  for (const id of [...d.queue]) {
    const c = d.tickets[id]?.caller;
    if (c && c.doing !== 'confirmed' && c.until <= d.clock) hear(d, ticketById(id), c);
  }
  for (const a of d.arriving.filter((x) => x.at <= d.clock).sort((x, y) => x.at - y.at)) arrive(d, a.id, a.at);
  d.arriving = d.arriving.filter((x) => x.at > d.clock);
  // When the building locks, the day ends, unless a card is still up; dismissing the last card ends it.
  if (d.clock >= LOCKUP && !d.outcomes.length) finishDay(d);
}

function startDay(d: GameState): void {
  // Anything still open comes back first thing tomorrow.
  const carried = [...d.queue, ...d.chats];
  d.queue = [];
  d.chats = [];
  d.clock = OPEN;
  d.today = emptyToday();
  d.outcomes = [];
  d.notice = undefined;
  d.drop = undefined;
  if (d.day > DAYS) { d.arriving = []; return; }
  if (d.day === DROP_DAY) dropLoot(d);
  // The budget's up: a box of company phones turns up in your desk drawer.
  if (d.day >= PHONES_DAY && !d.phones.length) d.phones = newPhones();
  if (d.day === BREAK.day) breakPhone(d, BREAK.who);
  const back = d.returning.filter((r) => r.day === d.day).map((r) => r.id);
  d.returning = d.returning.filter((r) => r.day !== d.day);
  d.arriving = [
    ...[...carried, ...back].map((id) => ({ id, at: OPEN })),
    ...TICKETS.filter((t) => t.day === d.day).map((t) => ({ id: t.id, at: clockTime(t.at) })),
  ];
  // First thing, before anyone's in: your flows handle today's joiners, movers and leavers.
  runToday(d);
  advance(d, 0);
}

/** One of your friends, picked at random, leaves you their tool. No friends: you find Sam's. The manager gives you nothing. */
function dropLoot(d: GameState): void {
  const friends = peopleWho(d, 'friend').filter((who) => TOOLS.some((t) => t.from === who));
  const from = friends.length ? friends[d.seed % friends.length] : 'sam';
  const tool = TOOLS.find((t) => t.from === from);
  if (!tool || d.tools.includes(tool.id)) return;
  d.tools.push(tool.id);
  d.runbook[`tool:${tool.id}`] = 'missing';
  d.drop = tool.id;
}

/** A tool on your desk that helps with this ticket's problem, if you have one. */
export const toolFor = (s: GameState, t: Ticket): Tool | undefined =>
  TOOLS.find((tool) => tool.issue === t.issue && s.tools.includes(tool.id));

function finishDay(d: GameState): void {
  d.phase = 'dayEnd';
  d.today.overtime = Math.max(0, d.clock - CLOSE);
  d.today.voucher = d.today.resolved >= scriptFor(d.day).goal;
  d.savings += (d.today.voucher ? GOAL_VOUCHER : 0) - DAILY_COST;
}

export function newGame(seed = Math.floor(Math.random() * 2 ** 31)): GameState {
  const s: GameState = {
    seed,
    tools: [],
    written: {},
    accounts: newAccounts(),
    newsRead: 0,
    okta: newOkta(),
    phones: [],
    requests: [],
    version: 11,
    day: 1,
    phase: 'boot',
    clock: OPEN,
    queue: [],
    chats: [],
    arriving: [],
    returning: [],
    tickets: {},
    bonds: Object.fromEntries(Object.keys(VILLAGERS).map((k) => [k, 0])) as Record<VillagerId, number>,
    xp: { devices: 0, networks: 0, access: 0 },
    savings: START_SAVINGS,
    today: emptyToday(),
    runbook: Object.fromEntries(ISSUES.map((i) => [i.id, i.page.status])),
    outcomes: [],
  };
  startDay(s);
  return s;
}

export const goTo = (s: GameState, phase: Phase) => act(s, (d) => { d.phase = phase; });

/** Real time passing at the desk. The clock stops while a card is up or you're elsewhere. */
export function tick(s: GameState, minutes: number): GameState {
  if (s.phase !== 'desk' || s.outcomes.length || s.clock >= LOCKUP) return s;
  return act(s, (d) => advance(d, minutes));
}

/** You can only work on tickets in your queue, and not while a card is up. Chat requests have to be logged first. */
function workable(s: GameState, id: string): Ticket | undefined {
  return s.phase === 'desk' && !s.outcomes.length && s.queue.includes(id) ? ticketById(id) : undefined;
}
const ticketWork = workable;
/** A chat you can answer: no card is up. */
function answerable(s: GameState, id: string): Ticket | undefined {
  return s.phase === 'desk' && !s.outcomes.length && s.chats.includes(id) ? ticketById(id) : undefined;
}

/** Send a standard reply or update, so they know where it's at. Good manners; nobody's counting the minutes. */
export function reply(s: GameState, id: string): GameState {
  const t = workable(s, id);
  if (!t) return s;
  return act(s, (d) => {
    const st = ticketState(d, id);
    st.messages.push({ from: 'you', text: st.status === 'new' ? REPLIES.first : REPLIES.update, at: d.clock });
    st.status = 'open';
    advance(d, COST.update);
  });
}

/**
 * What's still wrong with someone's account for an Active Directory ticket, in a sentence; undefined once it's sorted.
 * Asked when you tell them to try signing in again.
 */
export function accountProblem(s: GameState, t: Ticket): string | undefined {
  const fixBy = issueOf(t).console;
  if (!fixBy) return undefined;
  if (fixBy === 'disable') {
    const on = (t.subjects ?? ['sam']).filter((l) => s.accounts[l]?.enabled);
    return on.length ? `${named(s, on)}${on.length > 1 ? '\u2019s accounts are' : '\u2019s account is'} still enabled in Active Directory. Anyone with the old password can still get in.` : undefined;
  }
  if (fixBy === 'flow') return t.flow && flowProblem(s, t.flow, t.everywhere);
  if (fixBy === 'replace') { const who = t.subject ?? t.who; return replaceProblem(s, who, named(s, [who]), t.day * MINUTES_A_DAY + clockTime(t.at)); }
  if (fixBy === 'verify') { const who = t.subject ?? t.who; return verifyProblem(s, who, named(s, [who])); }
  if (fixBy !== 'unlock' && fixBy !== 'reset') {
    const person = oktaProblem(s, t, fixBy);
    if (person || !t.automate) return person;
    // Fixed, but by hand: from week 3 HR changes come too often for that. Is the flow on for next time?
    const trigger = ({ joiner: 'hr.joined', mover: 'hr.moved', leaver: 'hr.left' } as const)[fixBy as 'joiner' | 'mover' | 'leaver'];
    return trigger && !s.okta.flows.some((f) => f.on && f.trigger === trigger)
      ? `${nameList([t.subject ?? t.who])} is sorted now, by hand. HR won\u2019t wait next time: switch on a flow for \u201C${TRIGGERS[trigger]}\u201D in Oktopus Workflows.` : undefined;
  }
  const a = s.accounts[t.who];
  if (!a) return undefined;
  if (!a.enabled) return 'Their account is disabled, so nothing will let them in. Enable it again in Active Directory.';
  if (fixBy === 'unlock') return a.locked ? 'Still locked out. Find their account in Active Directory and unlock it.' : undefined;
  const resetSinceTheyAsked = (a.resetAt ?? -1) >= t.day * MINUTES_A_DAY + clockTime(t.at);
  if (!resetSinceTheyAsked) return 'They still don\u2019t have a password that works. Reset it in Active Directory.';
  if (!a.mustChange) return 'You reset it, but didn\u2019t tick \u201CUser must change password at next logon\u201D. Now you know their password and they\u2019ll keep it. Reset it again so they choose their own.';
  if (a.locked) return 'The new password won\u2019t work while the account is locked out.';
  return undefined;
}

/** Everyone in some departments, as HR has them today. */
const staffIn = (s: GameState, team: readonly string[]) => hrOn(s.day).filter((r) => team.includes(r.dept) && r.status === 'active');
const named = (s: GameState, logins: string[]) => logins.map((l) => hrOn(s.day).find((r) => r.login === l)?.name ?? l).join(', ');
/** People's names from their logins, as a list: "Wren and Sam". Anyone who's ever been on the HR file. */
const nameList = (logins: string[]) => teamWords(logins.map((l) => hrOn(DAYS).find((r) => r.login === l)?.name ?? l));
const isAre = (n: number) => (n > 1 ? 'aren\u2019t' : 'isn\u2019t');
const teamWords = (team: readonly string[]) => new Intl.ListFormat('en', { type: 'conjunction' }).format(team);

/** What's still wrong in Oktopus for a ticket, in a sentence; undefined once it's right. */
function oktaProblem(s: GameState, t: Ticket, fixBy: Exclude<NonNullable<Issue['console']>, 'unlock' | 'reset' | 'disable'>): string | undefined {
  const { okta } = s;
  const has = (login: string, app: string) => appsOf(okta, login).includes(app);
  const who = t.subject ?? t.who;
  const name = named(s, [who]);
  const user = okta.users[who];
  const row = hrOn(s.day).find((r) => r.login === who);
  /** Apps someone else on the same team gets: what a joiner or mover should end up with too. */
  const teamApps = (dept: string) => Object.keys(okta.apps).filter((app) =>
    Object.keys(okta.users).some((l) => l !== who && okta.users[l]?.dept === dept && has(l, app)));
  switch (fixBy) {
    case 'okta-setup': {
      const team = t.team ?? ['Marketing'];
      const missing = staffIn(s, team).filter((r) => !okta.users[r.login]).map((r) => r.login);
      if (missing.length) return `${named(s, missing)} ${isAre(missing.length)} in Oktopus yet. Import them from the HR file.`;
      const loose = team.filter((dept) => !okta.rules.some((rule) => 'dept' in rule && rule.dept === dept));
      return loose.length ? `${teamWords(loose)} need${loose.length > 1 ? '' : 's'} a group of ${loose.length > 1 ? 'their' : 'its'} own, filled by a rule on department.` : undefined;
    }
    case 'okta-app': {
      const app = t.app ?? 'hootsweet';
      const team = t.team ?? ['Marketing'];
      const appName = CATALOG.find((c) => c.id === app)?.name ?? app;
      if (!okta.apps[app]) return `${appName} isn\u2019t in Oktopus. Add it from the App Catalog.`;
      const without = staffIn(s, team).filter((r) => !has(r.login, app)).map((r) => r.login);
      if (without.length) return `${named(s, without)} still can\u2019t see ${appName}. Assign it to a group that\u2019s filled with ${teamWords(team)}.`;
      const extra = Object.keys(okta.users).filter((l) => has(l, app) && !staffIn(s, team).some((r) => r.login === l));
      return extra.length ? `${named(s, extra)} can see ${appName} too, and ${extra.length > 1 ? 'they\u2019re' : 'they\u2019re'} not in ${teamWords(team)}. Only ${teamWords(team)} should have it.` : undefined;
    }
    case 'joiner': {
      if (!user) return `${name} isn\u2019t in Oktopus. HR added them this morning: create them from the HR file.`;
      const missing = teamApps(user.dept).filter((app) => !has(who, app));
      return missing.length ? `${name} is in Oktopus but can\u2019t see what the rest of ${user.dept} can. Their group rules should do that: is their department right?` : undefined;
    }
    case 'mover': {
      if (!user) return `${name} isn\u2019t in Oktopus at all.`;
      if (user.status !== 'active') return `${name} can\u2019t sign in at all now. They moved; they didn\u2019t leave. Activate them again.`;
      if (row && user.dept !== row.dept) return `Oktopus still thinks ${name} is in ${user.dept}. Update their profile from the HR file.`;
      const kept = appsOf(okta, who).filter((app) => !teamApps(user.dept).includes(app));
      if (kept.length) return `${name} is in ${user.dept} now but can still see ${named(s, kept)}, which the rest of ${user.dept} can\u2019t. Old access should go with the old team.`;
      const missing = teamApps(user.dept).filter((app) => !has(who, app));
      return missing.length ? `${name} can\u2019t see what the rest of ${user.dept} can yet.` : undefined;
    }
    case 'leaver':
      return user?.status === 'active' ? `${name} can still sign in to Oktopus and everything in it. Deactivate them.` : undefined;
    case 'mfa-policy': {
      const loose = Object.keys(okta.users).filter((l) => okta.users[l]?.status === 'active' && !needsMfa(okta, l));
      if (!loose.length) {
        // From week 4 phone sign-in means Oktopus Verify, and nobody's setting up eleven phones by hand.
        return t.day >= PHONES_DAY && !okta.selfEnroll ? 'Everyone needs Oktopus Verify now, but only the phones you set up by hand have it. Turn on self-enrolment on the Security page, so everyone else can set up their own.' : undefined;
      }
      return loose.length > 3 ? `${loose.length} people can still sign in with just a password. A sign-on policy on a group covers everyone in it: which group has everyone?`
        : `${named(s, loose)} can still sign in with just a password.`;
    }
    case 'mfa': {
      const asked = t.day * MINUTES_A_DAY + clockTime(t.at);
      if ((okta.users[t.who]?.mfaResetAt ?? -1) < asked) return 'Their old phone is still the only way in. Reset their sign-in methods in Oktopus, once you\u2019ve checked it\u2019s really them.';
      // From week 4 a lost company phone needs replacing: a spare from the drawer, set up, enrolled to them and handed over.
      return issueOf(t).id === 'mfa' && t.day >= PHONES_DAY && !replacedSince(s, t.who, asked)
        ? `${named(s, [t.who])}\u2019s sign-in methods are reset, but they\u2019ve no phone to sign in with. Set up a spare from your drawer, enrol it to them and hand it over.` : undefined;
    }
  }
}

/**
 * What a console shows right now, for a fact on a ticket that comes from one: so "No user called Fern" doesn't stay
 * true after you've created her. Undefined for anything the caller told you, which doesn't change.
 */
export function liveFact(s: GameState, t: Ticket, label: string): string | undefined {
  if (label === 'Active Directory') {
    const logins = issueOf(t).console === 'disable' ? t.subjects ?? ['sam'] : [t.who];
    return logins.map((l) => { const a = s.accounts[l]; return a ? `${l}: ${a.enabled ? 'enabled' : 'disabled'}${a.locked ? ', locked out' : ''}.` : ''; }).join(' ') || undefined;
  }
  if (label !== 'Oktopus') return undefined;
  const { okta } = s;
  if (issueOf(t).console === 'verify') {
    const who = t.subject ?? t.who;
    return `${named(s, [who])}: ${okta.verify[who] ? `on Oktopus Verify, ${okta.verify[who].replace('phone-', 'Burrow phone ')}` : 'not on Oktopus Verify yet'}.`;
  }
  const who = t.subject;
  if (who) {
    const user = okta.users[who];
    const name = named(s, [who]);
    if (!user) return `No user called ${name}.`;
    const apps = appsOf(okta, who).map((a) => CATALOG.find((c) => c.id === a)?.name ?? a);
    return `${name}: ${user.status}, ${user.dept}. Apps: ${apps.length ? apps.join(', ') : 'none'}.`;
  }
  const people = Object.values(okta.users).filter((u) => u.status === 'active').length;
  return Object.keys(okta.users).length ? `${people} active ${people === 1 ? 'person' : 'people'} in Oktopus, ${okta.groups.length} groups, ${Object.keys(okta.apps).length} apps.` : 'A brand-new org. Nobody in it yet.';
}

/**
 * Text as it reads on this ticket: "{who}" is whoever it's about, "{app}" its app and "{team}" its departments, so
 * one kind of problem can be about Fern and Hootsweet one week and Hazel and Voyago the next.
 */
export function fill(t: Ticket, text: string): string {
  const team = t.team ?? ['Marketing'];
  return text
    .replaceAll('{who}', nameList(t.subjects ?? (t.subject ? [t.subject] : issueOf(t).console === 'disable' ? ['sam'] : [])) || 'them')
    .replaceAll('{app}', CATALOG.find((c) => c.id === (t.app ?? 'hootsweet'))?.name ?? t.app ?? '')
    .replaceAll('{team}', team.length >= 5 ? 'everyone' : teamWords(team))
    .replaceAll('{flow}', t.flow ? TASKS[t.flow] : '');
}

/** The suggestion that really fixes this ticket: usually the issue's fix, unless this one's cause is different. */
export const fixFor = (t: Ticket) => t.fixedBy ?? issueOf(t).correctFix;

/** After work in a console, the move is to check with the caller that it's sorted. */
const CONSOLE_CHECK: Record<ConsoleFix, string> = {
  unlock: 'Ask them to try signing in again',
  reset: 'Ask them to sign in with the temporary password and choose their own',
  mfa: 'Ask them to sign in and set up their new phone',
  disable: 'Ask them to check nobody can sign in as {who} now',
  'mfa-policy': 'Ask them to check everyone is asked for their phone',
  flow: 'Ask them to check the flow does the job',
  verify: 'Ask them to sign in with the phone',
  replace: 'Ask them to sign in with the new phone',
  'okta-setup': 'Ask them to check {team} are all set up',
  'okta-app': 'Ask them to check {app} is on the right dashboards',
  joiner: 'Ask them to check {who} can sign in',
  mover: 'Ask them to check {who} has the right access',
  leaver: 'Ask them to check {who} can\u2019t sign in',
};

/** Everything you could suggest on a ticket: your tool, a check after console work, and the usual fixes. */
export function suggestions(s: GameState, t: Ticket): Fix[] {
  const issue = issueOf(t);
  const tool = toolFor(s, t);
  return [
    ...(tool ? [{ id: 'tool', label: tool.fixLabel }] : []),
    ...(issue.console ? [{ id: 'console', label: fill(t, CONSOLE_CHECK[issue.console]) }] : []),
    ...issue.fixes,
  ];
}

/** How long the caller takes, between lo and hi minutes: fixed by the game's seed, so a replay is the same. */
function callerMinutes(d: GameState, t: Ticket, [lo, hi]: readonly [number, number]): number {
  const n = [...`${t.id}${ticketState(d, t.id).messages.length}`].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 9973, d.seed % 9973);
  return lo + (n % (hi - lo + 1));
}

/**
 * When the caller will get back to you, `minutes` after they start: straight away if they're at their desk, or once
 * they're back from a meeting, lunch or wherever they are, which they tell you.
 */
function replyAt(d: GameState, t: Ticket, minutes: number): number {
  const away = backAt(t.who, d.day, d.clock);
  if (!away) return d.clock + minutes;
  ticketState(d, t.id).messages.push({ from: 'them', text: awayLine(away), at: d.clock });
  return away.until + minutes;
}

/** It's your move on this ticket: it's in your queue and the caller isn't busy with something you asked. */
function yourMove(s: GameState, id: string): Ticket | undefined {
  const t = workable(s, id);
  return t && !ticketState(s, id).caller ? t : undefined;
}

/** Ask the caller a question. They reply in a few minutes; work on something else meanwhile. */
export function ask(s: GameState, id: string, askId: string): GameState {
  const t = yourMove(s, id);
  const q = t && issueOf(t).asks.find((a) => a.id === askId);
  if (!t || !q || ticketState(s, id).heard.includes(askId)) return s;
  return act(s, (d) => {
    const st = ticketState(d, id);
    st.status = 'open';
    st.messages.push({ from: 'you', text: fill(t, q.text), at: d.clock });
    st.caller = { doing: 'answer', id: askId, until: replyAt(d, t, callerMinutes(d, t, CALLER[t.priority].answer)) };
    advance(d, COST.ask);
  });
}

/** Suggest something for them to try. They go and try it, and tell you how it went. */
export function suggest(s: GameState, id: string, fixId: string): GameState {
  const t = yourMove(s, id);
  const f = t && suggestions(s, t).find((x) => x.id === fixId);
  // A check after console work can be repeated; anything else, once is enough.
  if (!t || !f || (fixId !== 'console' && ticketState(s, id).tried.includes(fixId))) return s;
  return act(s, (d) => {
    const st = ticketState(d, id);
    st.status = 'open';
    st.first ??= firstTest(t, st, fixId);
    const text = fixId === 'console' ? 'I\u2019ve made the change on my side. Could you check it\u2019s working now?' : `Suggested: ${f.label}.`;
    st.messages.push({ from: 'you', text, at: d.clock });
    st.caller = { doing: 'try', id: fixId, until: replyAt(d, t, callerMinutes(d, t, CALLER[t.priority][fixId === 'tool' ? 'tool' : 'tryIt'])) };
    advance(d, COST.suggest);
  });
}

/**
 * The caller gets back to you: an answer to your question, or how your suggestion went. It worked; it was worth a
 * try but wasn't it (no harm done); or it was the wrong call, and they're let down.
 */
function hear(d: GameState, t: Ticket, c: { doing: 'answer' | 'try'; id: string; until: number }): void {
  const st = ticketState(d, t.id);
  const issue = issueOf(t);
  const said = (text: string) => st.messages.push({ from: 'them', text, at: c.until });
  st.caller = undefined;
  if (c.doing === 'answer') {
    st.heard.push(c.id);
    st.crossed = [...new Set([...(st.crossed ?? []), ...crossedBy(t, c.id)])];
    said(t.details.filter((x) => x.ask === c.id).map((x) => x.text).join(' ') || (issue.asks.find((a) => a.id === c.id)?.none ?? '\u2026'));
    return;
  }
  const f = suggestions(d, t).find((x) => x.id === c.id);
  const problem = c.id === 'console' ? accountProblem(d, t) : undefined;
  if (c.id === 'tool' || (c.id === 'console' ? !problem : c.id === fixFor(t))) {
    if (d.notice?.ticketId === t.id) d.notice = undefined;
    st.caller = { doing: 'confirmed', id: c.id };
    said(f?.works ?? THANKS[st.mood]);
    return;
  }
  // You can check again after more console work, so that one never gets used up.
  if (c.id !== 'console') st.tried.push(c.id);
  if (f?.ruledOut || (c.id !== 'console' && c.id === issue.correctFix)) {
    // A sensible test that wasn't it: one less suspect.
    st.crossed = [...new Set([...(st.crossed ?? []), c.id])];
    said(f?.ruledOut ?? 'Tried that. Still not working.');
    return;
  }
  d.today.wrongFixes += 1;
  said('Hmm. That didn\u2019t sort it.');
  d.notice = { ticketId: t.id, text: problem ?? f?.fail ?? 'That didn\u2019t work.' };
  if (relation(d, t.who) === 'friend') d.notice.text += ` ${VILLAGERS[t.who].name} gives you an encouraging smile anyway.`;
  else slip(d, t);
  // Some mistakes are too serious to keep quiet, whoever it was for.
  if (f?.grave) complain(d, t, true);
}

/** Once they've confirmed it works, resolve it. */
export function resolve(s: GameState, id: string): GameState {
  const t = workable(s, id);
  const c = t && ticketState(s, id).caller;
  if (!t || c?.doing !== 'confirmed') return s;
  // Console work can be undone after they've said it works: check it's still right before closing.
  const undone = issueOf(t).console ? accountProblem(s, t) : undefined;
  if (undone) {
    return act(s, (d) => {
      const st = ticketState(d, id);
      st.caller = undefined;
      st.messages.push({ from: 'them', text: 'Wait. It\u2019s stopped working again.', at: d.clock });
      d.notice = { ticketId: id, text: `Not fixed any more: ${undone}` };
    });
  }
  return act(s, (d) => {
    close(d, t, 'fix', XP.fix);
    const card = d.outcomes.at(-1);
    const tool = c.id === 'tool' ? toolFor(d, t) : undefined;
    if (tool && card) card.tool = tool.id;
    // Sam's method: how you went about it, for the card and the day's tally.
    const stars = methodStars(t, ticketState(d, id));
    if (card) card.stars = stars;
    d.today.stars = (d.today.stars ?? 0) + stars.got;
    d.today.maxStars = (d.today.maxStars ?? 0) + stars.max;
    advance(d, COST.resolve);
  });
}

/** Admin work in a console. On the office clock, it takes a few minutes. */
export function officeWork(s: GameState, minutes: number, change: (d: GameState) => void): GameState {
  return act(s, (d) => {
    change(d);
    if (d.phase === 'desk') advance(d, minutes);
  });
}

/** Work in Active Directory on someone's account. On the office clock, it takes a few minutes. */
function administer(s: GameState, login: string, minutes: number, change: (a: Account, d: GameState) => void): GameState {
  if (!s.accounts[login]) return s;
  return act(s, (d) => {
    const a = d.accounts[login];
    if (!a) return;
    change(a, d);
    if (d.phase === 'desk') advance(d, minutes);
  });
}

export const unlockAccount = (s: GameState, login: string) => administer(s, login, COST.unlock, (a) => { a.locked = false; });

/** You're the only one in IT: switch your own account off and nobody is left who could switch it back on. */
export const SELF = 'intern';
export const OWN_ACCOUNT = 'You can\u2019t switch off your own account. You\u2019re the only one in IT: nobody could switch it back on.';

export const setEnabled = (s: GameState, login: string, enabled: boolean) =>
  login === SELF && !enabled ? s : administer(s, login, COST.unlock, (a) => { a.enabled = enabled; });

/** Reset someone's password to a temporary one, as the Reset Password box does. */
export const resetPassword = (s: GameState, login: string, { mustChange, unlock }: { mustChange: boolean; unlock: boolean }) =>
  administer(s, login, COST.reset, (a, d) => {
    a.resetAt = d.day * MINUTES_A_DAY + d.clock;
    a.mustChange = mustChange;
    if (unlock) a.locked = false;
  });

/** Mark every post on the Burrow Intranet up to today as read. */
export const readNews = (s: GameState, posts: number): GameState => (s.newsRead >= posts ? s : { ...s, newsRead: posts });

export function workaround(s: GameState, id: string): GameState {
  const t = ticketWork(s, id);
  if (!t || !canWorkaround(s, id)) return s;
  return act(s, (d) => {
    ticketState(d, id).workedAround = true;
    const back = d.day + WORKAROUND_RETURNS_AFTER;
    if (back <= DAYS) d.returning.push({ id, day: back });
    close(d, t, 'workaround', XP.workaround);
    advance(d, COST.workaround);
  });
}

/** Set it to pending: they'll come back tomorrow. At most twice per ticket. */
export function pushBack(s: GameState, id: string): GameState {
  const t = ticketWork(s, id);
  if (!t || !canPush(s, id)) return s;
  return act(s, (d) => {
    const st = ticketState(d, id);
    st.pushes += 1;
    st.messages.push({ from: 'you', text: REPLIES.pending, at: d.clock });
    if (d.day + 1 <= DAYS) d.returning.push({ id, day: d.day + 1 });
    d.today.pushed += 1;
    close(d, t, 'push', 0);
    advance(d, COST.push);
  });
}

/**
 * What the note after a fix is about: the tool you used, if its runbook page isn't written yet;
 * otherwise the problem itself, if you haven't written that page. Undefined if there's nothing left to write.
 */
export function noteTarget(s: GameState, o: Outcome): { page: string; title: string; note: Note } | undefined {
  if (o.kind !== 'fix' || o.noted) return undefined;
  const tool = TOOLS.find((x) => x.id === o.tool);
  if (tool && s.runbook[`tool:${tool.id}`] !== 'yours') return { page: `tool:${tool.id}`, title: tool.name, note: tool.note };
  const issue = issueOf(ticketById(o.ticketId));
  // Not yours yet; or you've just picked the clue, and can put it in your own words too.
  if (s.runbook[issue.id] !== 'yours' || o.clue) return { page: issue.id, title: issue.title, note: issue.note };
  return undefined;
}

/**
 * "How did you know?" After a fix, pick the clue that proved it. That, the fix and what you ruled out on the way
 * become your notebook entry for this kind of problem, and its runbook page is yours.
 */
export function recordClue(s: GameState, clue: string): GameState {
  const o = s.outcomes[0];
  if (o?.kind !== 'fix' || o.clue) return s;
  const t = ticketById(o.ticketId);
  const st = ticketState(s, t.id);
  if (!cluesFor(t, st).includes(clue)) return s;
  const issue = issueOf(t);
  return act(s, (d) => {
    const card = d.outcomes[0];
    if (!card) return;
    card.clue = clue;
    const ruledOut = suspectsOf(t).filter((f) => (st.crossed ?? []).includes(f.id)).map((f) => f.suspect ?? f.label);
    const fix = suggestions(d, t).find((x) => x.id === fixFor(t))?.label ?? issue.title;
    d.clues = { ...d.clues, [issue.id]: { clue, ruledOut, fix } };
    if (d.runbook[issue.id] === 'yours') return;
    d.runbook[issue.id] = 'yours';
    d.written[issue.id] = `${fix}. How I knew: ${clue}${ruledOut.length ? ` Ruled out: ${ruledOut.join('; ')}.` : ''}`;
    d.xp[issue.skill] += XP.note;
    d.today.xp += XP.note;
    d.today.notes += 1;
    card.xp += XP.note;
  });
}

/** Rule a suspect out yourself, or put it back: your notebook, your call. Free; it's thinking, not doing. */
export function ruleOut(s: GameState, id: string, fixId: string): GameState {
  const t = workable(s, id);
  if (!t || !suspectsOf(t).some((f) => f.id === fixId)) return s;
  return act(s, (d) => {
    const st = ticketState(d, id);
    const crossed = st.crossed ?? [];
    st.crossed = crossed.includes(fixId) ? crossed.filter((x) => x !== fixId) : [...crossed, fixId];
  });
}

/** What's wrong with a typed note, in a sentence; undefined if it's a good one. */
export function noteProblem(note: Note, text: string): string | undefined {
  if (text.trim().split(/\s+/).length < 3) return 'Write a sentence or two: what was really wrong, and what fixed it.';
  const says = (key: string) => new RegExp(`\\b${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i').test(text);
  return note.keys.some(says) ? undefined : 'That doesn\u2019t say what was really wrong. Look back at what they told you and what fixed it.';
}

/** After a fix, write down what happened. A good note becomes the runbook page, so next time it's a known issue. */
export function writeNote(s: GameState, text: string): GameState {
  const o = s.outcomes[0];
  const target = o && noteTarget(s, o);
  if (!o || !target) return s;
  const issue = issueOf(ticketById(o.ticketId));
  return act(s, (d) => {
    const first = d.outcomes[0];
    if (!first) return;
    first.noteMiss = noteProblem(target.note, text);
    if (first.noteMiss) return;
    d.runbook[target.page] = 'yours';
    d.written[target.page] = text.trim();
    d.xp[issue.skill] += XP.note;
    d.today.xp += XP.note;
    d.today.notes += 1;
    first.xp += XP.note;
    first.noted = true;
    d.clock = Math.min(d.clock + COST.note, LOCKUP);
  });
}

/** Dismiss the card on top. If the day ran out meanwhile, it ends now. */
export const next = (s: GameState) => act(s, (d) => {
  d.outcomes.shift();
  if (!d.outcomes.length && d.clock >= LOCKUP && d.phase === 'desk') finishDay(d);
});

/** The rule: every request is a ticket. It annoys them, but the request comes back through your queue, where it counts. */
export function askForTicket(s: GameState, id: string): GameState {
  const t = answerable(s, id);
  if (!t) return s;
  return act(s, (d) => {
    const st = ticketState(d, id);
    st.messages.push({ from: 'you', text: 'Could you log a ticket for this, please? That\u2019s how it gets fixed.', at: d.clock }, { from: 'them', text: 'Seriously? \u2026fine. \u{1F644}', at: d.clock });
    // It's company policy, not your failing: it annoys them, but doesn't count against you.
    annoy(d, t);
    st.logged = true;
    st.asked = true;
    const lands = d.clock + TICKET_LANDS_AFTER;
    if (lands < CLOSE) d.arriving.push({ id, at: lands });
    else if (d.day + 1 <= DAYS) d.returning.push({ id, day: d.day + 1 });
    close(d, t, 'asked', 0);
    advance(d, COST.askForTicket);
  });
}

/** After 5pm, once no card is up: stop for the day, whatever's left waits until tomorrow. */
export const canClockOut = (s: GameState) => s.phase === 'desk' && s.clock >= CLOSE && !s.outcomes.length;
export const clockOut = (s: GameState) => (canClockOut(s) ? act(s, finishDay) : s);

/** Leave the day-end screen: either an ending, or tomorrow's boot-up. */
export function goHome(s: GameState): GameState {
  if (s.phase !== 'dayEnd') return s;
  return act(s, (d) => {
    if (d.savings <= 0) {
      d.ending = 'burnout';
      d.phase = 'ending';
      return;
    }
    d.day += 1;
    startDay(d);
    d.phase = 'boot';
  });
}

export const missingFor = (s: GameState, job: Job): { skill: Skill; need: number; have: number }[] =>
  (Object.entries(job.needs) as [Skill, number][])
    .filter(([skill, need]) => s.xp[skill] < need)
    .map(([skill, need]) => ({ skill, need, have: s.xp[skill] }));

export function apply(s: GameState, jobId: string): GameState {
  const job = JOBS.find((j) => j.id === jobId);
  if (!job || missingFor(s, job).length > 0) return s;
  return act(s, (d) => {
    d.ending = 'hired';
    d.jobId = jobId;
    d.phase = 'ending';
  });
}

export function acceptOffer(s: GameState): GameState {
  if (!isWeekOver(s)) return s;
  return act(s, (d) => {
    d.ending = 'stay';
    d.phase = 'ending';
  });
}

/** Parse a saved game. Returns undefined for anything that isn't a save this version can play. */
/** Someone you were helping in person goes back to waiting on chat; storm cards (people walking off) are dropped. */
function normaliseV10(s: Partial<GameState> & { escort?: string; place?: string }): void {
  const helping = s.escort;
  const st = helping ? s.tickets?.[helping] : undefined;
  if (helping && st && s.chats && !s.chats.includes(helping)) {
    s.chats.push(helping);
    delete (st as { onSite?: boolean }).onSite;
  }
  delete s.escort;
  delete s.place;
  s.outcomes = (s.outcomes ?? []).filter((o) => (o.kind as string) !== 'storm');
  s.version = 11;
}

export function parseSave(raw: string | null): GameState | undefined {
  if (!raw) return undefined;
  try {
    const s = JSON.parse(raw) as Partial<GameState>;
    // Saves from before Active Directory and the intranet: same game, with a fresh directory.
    if ((s.version as number) === 8) Object.assign(s, { version: 9, accounts: newAccounts(), newsRead: 0 });
    // Saves from before Oktopus: same game, Oktopus not set up yet.
    if ((s.version as number) === 9) Object.assign(s, { version: 10, okta: newOkta() });
    // Saves from when you could go over in person, and people stormed off: back at your desk, nobody stormed off.
    if ((s.version as number) === 10) normaliseV10(s as Partial<GameState> & { escort?: string; place?: string });
    // Saves from before you could ask questions: nothing asked yet.
    for (const st of Object.values(s.tickets ?? {})) st.heard ??= [];
    // Saves from before you typed your notes: the pages you wrote show the example text.
    s.written ??= {};
    // Saves from before you couldn't switch your own account off: switched back on.
    if (s.accounts?.[SELF]) s.accounts[SELF].enabled = true;
    const you = s.okta?.users[SELF];
    if (you) you.status = 'active';
    // Saves from before Oktopus had sign-on policies: none set yet.
    if (s.okta) s.okta.mfa ??= [];
    // Saves from before Workflows: no flows built yet.
    if (s.okta) { s.okta.flows ??= []; s.okta.runs ??= []; }
    // Saves from before company phones: none yet (they turn up at the start of day 16), nobody on Oktopus Verify.
    s.phones ??= [];
    s.requests ??= [];
    // Saves from before phones kept their place in the tray: the first six go back where they came from.
    for (const p of s.phones) if (p.slot === undefined && Number(p.id.slice(6)) <= 6) p.slot = Number(p.id.slice(6)) - 1;
    if (s.okta) { s.okta.verify ??= {}; s.okta.selfEnroll ??= false; }
    if ((s.day ?? 0) > PHONES_DAY && !s.phones.length) s.phones = newPhones();
    // Saves from before fields had types: the event's fields move inside its Person.
    s.okta?.flows.forEach(upgradeFlow);
    // Saves from before you could stay late: no overtime yet.
    if (s.today) s.today.overtime ??= 0;
    const known = new Set(TICKETS.map((t) => t.id));
    const isObject = (x: unknown) => typeof x === 'object' && x !== null;
    const ok =
      s.version === 11 && typeof s.seed === 'number' && typeof s.newsRead === 'number' && Array.isArray(s.tools) &&
      Array.isArray(s.chats) && s.chats.every((id) => known.has(id) && isObject(s.tickets?.[id])) &&
      typeof s.day === 'number' && s.day >= 1 && s.day <= DAYS + 1 &&
      typeof s.clock === 'number' && typeof s.savings === 'number' &&
      Array.isArray(s.queue) && s.queue.every((id) => known.has(id) && isObject(s.tickets?.[id])) &&
      Array.isArray(s.arriving) && s.arriving.every((a) => known.has(a.id)) &&
      Array.isArray(s.returning) && s.returning.every((r) => known.has(r.id)) &&
      Array.isArray(s.outcomes) &&
      [s.tickets, s.bonds, s.xp, s.runbook, s.today, s.accounts, s.okta].every(isObject);
    return ok ? (s as GameState) : undefined;
  } catch {
    return undefined;
  }
}
