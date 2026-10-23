import {
  BOND, CLOSE, COST, DAILY_COST, DAYS, DAY_SCRIPTS, DROP_DAY, TOOLS, CHAT_LATER, GOAL_VOUCHER, GRACE_AFTER_MISS, ISSUES, JOBS, MAX_PUSHES,
  MESSY_SLIPS, OPEN, PATIENCE, REPLIES, REPLY_WITHIN, START_SAVINGS, TICKET_LANDS_AFTER, TICKETS, UPDATE_EVERY, VILLAGERS,
  WORKAROUND_RETURNS_AFTER, XP, type VillagerId,
} from './data.ts';
import { MINUTES_A_DAY, newAccounts, type Account } from './directory.ts';
import { MOODS, type Issue, type Job, type Mood, type PageStatus, type Relation, type Skill, type Ticket, type Tool } from './types.ts';

export type Phase = 'boot' | 'desktop' | 'desk' | 'dayEnd' | 'ending';
export type Ending = 'hired' | 'burnout' | 'stay';
/** A ticket's life, like a real service desk: new, open (you've replied), pending (pushed back), resolved. */
export type Status = 'new' | 'open' | 'pending' | 'resolved';
/** At your computer, or away from it helping someone in person. */
export type Place = 'computer' | 'floor';

export interface Message {
  from: 'them' | 'you';
  text: string;
  at: number;
}

export interface TicketState {
  status: Status;
  mood: Mood;
  /** Times you cost them patience: missed reply-by times and wrong fixes. Zero on a fix makes a friend. */
  slips: number;
  pushes: number;
  workedAround: boolean;
  tried: string[];
  /** Clock time by which they expect to hear from you. */
  due: number;
  messages: Message[];
  /** A chat request you asked to log a ticket: it now comes through your queue. */
  logged?: boolean;
  /** You've gone over to help them in person and can work on it. */
  onSite?: boolean;
}

export interface Outcome {
  ticketId: string;
  kind: 'fix' | 'workaround' | 'push' | 'storm' | 'asked';
  xp: number;
  /** After a fix: whether you wrote the internal note, and which wrong one you tried last. */
  noted?: boolean;
  wrongNote?: number;
  /** Fixed with a tool from your desk: its runbook page is the note to write. */
  tool?: string;
}

export interface Today {
  /** Tickets resolved: the only number Mr. Grisby counts. */
  resolved: number;
  /** People helped in person off the back of a chat, with no ticket. Real work, invisible to the manager. */
  helped: number;
  pushed: number;
  wrongFixes: number;
  missed: number;
  complaints: number;
  notes: number;
  xp: number;
  voucher: boolean;
  /** Who became a friend or nemesis today, or stopped being one. */
  bonds: { who: VillagerId; now: Relation }[];
}

export interface GameState {
  version: 9;
  /** 1..DAYS while working; DAYS + 1 once the week is over. */
  day: number;
  phase: Phase;
  /** Office clock, minutes since midnight. */
  clock: number;
  place: Place;
  /** Tickets waiting on you right now, oldest first. */
  queue: string[];
  /** People who messaged you on chat instead of logging a ticket, waiting for an answer. */
  chats: string[];
  /** Someone you're helping in person, after telling them you're on your way. */
  escort?: string;
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
  /** Tools on your desk. */
  tools: string[];
  /** Everyone's account in Active Registry, by login. */
  accounts: Record<string, Account>;
  /** How many Burrow Intranet posts you've read. */
  newsRead: number;
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
export const minutesLeft = (s: GameState, id: string) => Math.ceil(ticketState(s, id).due - s.clock);

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
  resolved: 0, helped: 0, pushed: 0, wrongFixes: 0, missed: 0, complaints: 0, notes: 0, xp: 0, voucher: false, bonds: [],
});

/** Each action copies the state, so the caller can keep or drop the old one. */
function act(s: GameState, fn: (d: GameState) => void): GameState {
  const d = structuredClone(s);
  fn(d);
  return d;
}

const patience = (d: GameState, t: Ticket) => PATIENCE[relation(d, t.who)];

function arrive(d: GameState, id: string, at: number): void {
  const t = ticketById(id);
  const v = VILLAGERS[t.who];
  const before = d.tickets[id];
  const r = relation(d, t.who);
  // First visit: their usual mood, a step calmer for friends or angrier for nemeses.
  // Coming back: a step grumpier than they left. Never already Furious.
  // Being asked to submit a ticket already cost them a step, so that doesn't count twice.
  const asked = before?.logged && before.status === 'pending' && byChat(t);
  const base = before ? before.mood + (asked ? 0 : 1) : t.mood + (r === 'nemesis' ? 1 : r === 'friend' ? -1 : 0);
  const mood = Math.max(0, Math.min(base, 2)) as Mood;
  const greeting = r === 'friend' ? `${v.fond} ` : r === 'nemesis' ? `${v.grudge} ` : '';
  const onChat = byChat(t) && !before?.logged;
  const again = !before ? '' : asked ? 'Here\u2019s the ticket you asked for. '
    : before.status === 'new' || before.status === 'open' ? 'Still waiting from yesterday. ' : 'It\u2019s me again. ';
  const window = !onChat ? REPLY_WITHIN[t.priority] : t.via === 'walkup' ? REPLY_WITHIN.walkup : REPLY_WITHIN.chat;
  // On chat they never start with the problem. They start by being friendly.
  const opener = onChat && !before ? [{ from: 'them' as const, text: v.opener, at }] : [];
  // A lockout is real: their account in Active Registry is locked until you unlock it.
  const account = d.accounts[t.who];
  if (!before && account && issueOf(t).console === 'unlock') account.locked = true;
  d.tickets[id] = {
    status: 'new',
    mood,
    slips: before?.slips ?? 0,
    pushes: before?.pushes ?? 0,
    workedAround: before?.workedAround ?? false,
    tried: before?.tried ?? [],
    due: at + window * patience(d, t),
    messages: [...opener, { from: 'them', text: greeting + again + t.message, at }],
    logged: before?.logged,
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
  if (kind === 'storm') changeBond(d, t.who, BOND.storm);
  const counted = isTicket(d, t);
  st.status = kind === 'push' || kind === 'asked' ? 'pending' : 'resolved';
  d.queue = d.queue.filter((id) => id !== t.id);
  d.chats = d.chats.filter((id) => id !== t.id);
  // Done helping in person. You head back to your desk once you've taken in how it went (see next()).
  if (d.escort === t.id) { d.escort = undefined; st.onSite = false; }
  const skill = issueOf(t).skill;
  d.xp[skill] += xp;
  d.today.xp += xp;
  if ((kind === 'fix' || kind === 'workaround') && counted) d.today.resolved += 1;
  if (kind === 'fix' && !counted) d.today.helped += 1;
  if (kind === 'storm') d.today.complaints += 1;
  d.outcomes.push({ ticketId: t.id, kind, xp });
  if (d.notice?.ticketId === t.id) d.notice = undefined;
}

/** You cost them patience: mood gets a step worse. Pushed past Furious, they storm off to the manager. */
function slip(d: GameState, t: Ticket): void {
  const st = ticketState(d, t.id);
  st.slips += 1;
  if (st.mood + 1 >= MOODS.length) close(d, t, 'storm', 0);
  else st.mood = (st.mood + 1) as Mood;
}

/** Run the office clock forward: people arrive, and anyone you haven't updated in time gets upset. */
function advance(d: GameState, minutes: number): void {
  const target = Math.min(d.clock + minutes, CLOSE);
  // A minute at a time, so a long wait can't skip past several missed reply-by times.
  for (;;) {
    d.clock = Math.min(d.clock + 1, target);
    for (const a of d.arriving.filter((x) => x.at <= d.clock)) arrive(d, a.id, a.at);
    d.arriving = d.arriving.filter((x) => x.at > d.clock);
    for (const id of [...d.queue, ...d.chats]) {
      if (ticketState(d, id).due > d.clock) continue;
      const t = ticketById(id);
      d.today.missed += 1;
      slip(d, t);
      if (d.queue.includes(id) || d.chats.includes(id)) ticketState(d, id).due = d.clock + GRACE_AFTER_MISS * patience(d, t);
    }
    if (d.clock >= target) break;
  }
  // At closing time the day ends, unless a card is still up; dismissing the last card ends it.
  if (d.clock >= CLOSE && !d.outcomes.length) finishDay(d);
}

/** Whatever you just did for this ticket counts as contact, so it can't miss its reply-by time while you do it. */
function work(d: GameState, t: Ticket, minutes: number): void {
  const st = d.tickets[t.id];
  if (st && (d.queue.includes(t.id) || d.chats.includes(t.id))) st.due = Math.max(st.due, d.clock + minutes + 1);
  advance(d, minutes);
}

function startDay(d: GameState): void {
  // Anything unanswered comes back first thing tomorrow, a step grumpier.
  const carried = [...d.queue, ...d.chats];
  d.queue = [];
  d.chats = [];
  d.place = 'computer';
  d.escort = undefined;
  d.clock = OPEN;
  d.today = emptyToday();
  d.outcomes = [];
  d.notice = undefined;
  d.drop = undefined;
  if (d.day > DAYS) { d.arriving = []; return; }
  if (d.day === DROP_DAY) dropLoot(d);
  const back = d.returning.filter((r) => r.day === d.day).map((r) => r.id);
  d.returning = d.returning.filter((r) => r.day !== d.day);
  d.arriving = [
    ...[...carried, ...back].map((id) => ({ id, at: OPEN })),
    ...TICKETS.filter((t) => t.day === d.day).map((t) => ({ id: t.id, at: clockTime(t.at) })),
  ];
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
  // Still helping someone at five? They'll be back on chat tomorrow.
  if (d.escort) {
    ticketState(d, d.escort).onSite = false;
    if (d.day + 1 <= DAYS) d.returning.push({ id: d.escort, day: d.day + 1 });
    d.escort = undefined;
    d.place = 'computer';
  }
  d.phase = 'dayEnd';
  d.today.voucher = d.today.resolved >= scriptFor(d.day).goal;
  d.savings += (d.today.voucher ? GOAL_VOUCHER : 0) - DAILY_COST;
}

export function newGame(seed = Math.floor(Math.random() * 2 ** 31)): GameState {
  const s: GameState = {
    seed,
    tools: [],
    accounts: newAccounts(),
    newsRead: 0,
    version: 9,
    day: 1,
    phase: 'boot',
    clock: OPEN,
    place: 'computer',
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
  if (s.phase !== 'desk' || s.outcomes.length || s.clock >= CLOSE) return s;
  return act(s, (d) => advance(d, minutes));
}

/** You can only fix what's in front of you: your queue at the computer, or the person you've gone to help. Not while a card is up. */
function workable(s: GameState, id: string): Ticket | undefined {
  if (s.phase !== 'desk' || s.outcomes.length) return undefined;
  const here = s.place === 'computer' ? s.queue.includes(id) : id === s.escort && Boolean(s.tickets[id]?.onSite);
  return here ? ticketById(id) : undefined;
}
const ticketWork = workable;
/** A chat you can answer: you're at your computer, not off helping someone, and no card is up. */
function answerable(s: GameState, id: string): Ticket | undefined {
  return s.phase === 'desk' && !s.outcomes.length && s.place === 'computer' && !s.escort && s.chats.includes(id) ? ticketById(id) : undefined;
}

/** Send a standard update: it buys you time before they expect to hear from you again. */
export function reply(s: GameState, id: string): GameState {
  const t = s.place === 'computer' ? workable(s, id) : undefined;
  if (!t) return s;
  return act(s, (d) => {
    const st = ticketState(d, id);
    st.messages.push({ from: 'you', text: st.status === 'new' ? REPLIES.first : REPLIES.update, at: d.clock });
    st.status = 'open';
    st.due = d.clock + COST.update + UPDATE_EVERY * patience(d, t);
    advance(d, COST.update);
  });
}

/**
 * What's still wrong with someone's account for an Active Registry ticket, in a sentence; undefined once it's sorted.
 * Asked when you tell them to try signing in again.
 */
export function accountProblem(s: GameState, t: Ticket): string | undefined {
  const fixBy = issueOf(t).console;
  const a = s.accounts[t.who];
  if (!fixBy || !a) return undefined;
  if (!a.enabled) return 'Their account is disabled, so nothing will let them in. Enable it again in Active Registry.';
  if (fixBy === 'unlock') return a.locked ? 'Still locked out. Find their account in Active Registry and unlock it.' : undefined;
  const resetSinceTheyAsked = (a.resetAt ?? -1) >= t.day * MINUTES_A_DAY + clockTime(t.at);
  if (!resetSinceTheyAsked) return 'They still don\u2019t have a password that works. Reset it in Active Registry.';
  if (!a.mustChange) return 'You reset it, but didn\u2019t tick \u201CUser must change password at next logon\u201D. Now you know their password and they\u2019ll keep it. Reset it again so they choose their own.';
  if (a.locked) return 'The new password won\u2019t work while the account is locked out.';
  return undefined;
}

export function fix(s: GameState, id: string, fixId: string): GameState {
  const t = workable(s, id);
  if (!t || ticketState(s, id).tried.includes(fixId)) return s;
  const issue = issueOf(t);
  const tool = fixId === 'tool' ? toolFor(s, t) : undefined;
  // An Active Registry ticket has one move here: ask them to try again. The account itself says if it worked.
  const problem = issue.console && fixId === 'console' ? accountProblem(s, t) : undefined;
  const chosen = tool ? { id: 'tool', label: tool.fixLabel, fail: undefined }
    : issue.console ? (fixId === 'console' ? { id: 'console', label: 'Asked them to try signing in again', fail: problem } : undefined)
    : issue.fixes.find((f) => f.id === fixId);
  if (!chosen) return s;
  return act(s, (d) => {
    const st = ticketState(d, id);
    st.status = 'open';
    st.messages.push({ from: 'you', text: `${chosen.label}.`, at: d.clock });
    if (tool || (issue.console ? !problem : fixId === issue.correctFix)) {
      // The real work happened in Active Registry; checking it takes a moment.
      const minutes = tool ? COST.toolFix : issue.console || isKnown(d, t) ? COST.knownFix : COST.fix;
      close(d, t, 'fix', XP.fix);
      const card = d.outcomes.at(-1);
      if (tool && card) card.tool = tool.id;
      advance(d, minutes);
      return;
    }
    // You can ask again after fixing the account, so that move never gets used up.
    if (!issue.console) st.tried.push(fixId);
    d.today.wrongFixes += 1;
    st.messages.push({ from: 'them', text: 'It’s still not working.', at: d.clock });
    d.notice = { ticketId: id, text: chosen.fail ?? 'That didn’t work.' };
    if (relation(d, t.who) === 'friend') d.notice.text += ' They give you an encouraging smile anyway.';
    else slip(d, t);
    work(d, t, COST.wrongFix);
  });
}

/** Work in Active Registry on someone's account. On the office clock, it takes a few minutes. */
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

export const setEnabled = (s: GameState, login: string, enabled: boolean) => administer(s, login, COST.unlock, (a) => { a.enabled = enabled; });

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
export function noteTarget(s: GameState, o: Outcome): { page: string; title: string; notes: Issue['notes'] } | undefined {
  if (o.kind !== 'fix' || o.noted) return undefined;
  const tool = TOOLS.find((x) => x.id === o.tool);
  if (tool && s.runbook[`tool:${tool.id}`] !== 'yours') return { page: `tool:${tool.id}`, title: tool.name, notes: tool.notes };
  const issue = issueOf(ticketById(o.ticketId));
  if (s.runbook[issue.id] !== 'yours') return { page: issue.id, title: issue.title, notes: issue.notes };
  return undefined;
}

/** After a fix, record the cause. The right note rewrites the runbook page, so next time it's a known issue. */
export function writeNote(s: GameState, noteIndex: number): GameState {
  const o = s.outcomes[0];
  if (!o || o.kind !== 'fix' || o.noted) return s;
  const t = ticketById(o.ticketId);
  const issue = issueOf(t);
  const target = noteTarget(s, o);
  const note = target?.notes[noteIndex];
  if (!target || !note) return s;
  return act(s, (d) => {
    const first = d.outcomes[0];
    if (!first) return;
    if (!note.right) { first.wrongNote = noteIndex; return; }
    d.runbook[target.page] = 'yours';
    d.xp[issue.skill] += XP.note;
    d.today.xp += XP.note;
    d.today.notes += 1;
    first.xp += XP.note;
    first.noted = true;
    first.wrongNote = undefined;
    d.clock = Math.min(d.clock + COST.note, CLOSE);
  });
}

/** Dismiss the card on top. If the day ran out meanwhile, it ends now. */
export const next = (s: GameState) => act(s, (d) => {
  d.outcomes.shift();
  if (!d.outcomes.length && d.place === 'floor' && !d.escort) d.place = 'computer';
  if (!d.outcomes.length && d.clock >= CLOSE && d.phase === 'desk') finishDay(d);
});

/** "On my way": you get up and go to help them in person. Whatever's in your queue keeps waiting. */
export function goNow(s: GameState, id: string): GameState {
  const t = answerable(s, id);
  if (!t) return s;
  return act(s, (d) => {
    const st = ticketState(d, id);
    st.messages.push({ from: 'you', text: 'On my way.', at: d.clock }, { from: 'them', text: 'You\u2019re a lifesaver. Come to my desk.', at: d.clock });
    st.status = 'open';
    st.onSite = true;
    st.due = Number.MAX_SAFE_INTEGER; // they're with you now
    d.chats = d.chats.filter((x) => x !== id);
    d.escort = id;
    d.place = 'floor';
    advance(d, COST.goOver);
  });
}

/** "Can it wait?": they're put out, and they'll message you again in an hour. At most twice. */
export function later(s: GameState, id: string): GameState {
  const t = answerable(s, id);
  if (!t || !canPush(s, id)) return s;
  return act(s, (d) => {
    const st = ticketState(d, id);
    st.pushes += 1;
    d.today.pushed += 1;
    st.messages.push({ from: 'you', text: 'Can it wait? I\u2019m up to my neck in tickets.', at: d.clock }, { from: 'them', text: '\u2026fine. An hour.', at: d.clock });
    slip(d, t);
    if (d.chats.includes(id)) st.due = d.clock + CHAT_LATER * patience(d, t);
    advance(d, COST.push);
  });
}

/** The classic IT line. It annoys them, but the request comes back through your queue, where it counts. */
export function askForTicket(s: GameState, id: string): GameState {
  const t = answerable(s, id);
  if (!t) return s;
  return act(s, (d) => {
    const st = ticketState(d, id);
    st.messages.push({ from: 'you', text: 'Could you log a ticket for this, please?', at: d.clock }, { from: 'them', text: 'Seriously? \u2026fine.', at: d.clock });
    slip(d, t);
    if (!d.chats.includes(id)) return; // that was the last straw: they stormed off
    st.logged = true;
    const lands = d.clock + TICKET_LANDS_AFTER;
    if (lands < CLOSE) d.arriving.push({ id, at: lands });
    else if (d.day + 1 <= DAYS) d.returning.push({ id, day: d.day + 1 });
    close(d, t, 'asked', 0);
    advance(d, COST.askForTicket);
  });
}

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
export function parseSave(raw: string | null): GameState | undefined {
  if (!raw) return undefined;
  try {
    const s = JSON.parse(raw) as Partial<GameState>;
    // Saves from before Active Registry and the intranet: same game, with a fresh directory.
    if ((s.version as number) === 8) Object.assign(s, { version: 9, accounts: newAccounts(), newsRead: 0 });
    const known = new Set(TICKETS.map((t) => t.id));
    const isObject = (x: unknown) => typeof x === 'object' && x !== null;
    const ok =
      s.version === 9 && typeof s.seed === 'number' && typeof s.newsRead === 'number' && Array.isArray(s.tools) && (s.place === 'computer' || s.place === 'floor') &&
      (s.escort === undefined || known.has(s.escort)) &&
      Array.isArray(s.chats) && s.chats.every((id) => known.has(id) && isObject(s.tickets?.[id])) &&
      typeof s.day === 'number' && s.day >= 1 && s.day <= DAYS + 1 &&
      typeof s.clock === 'number' && typeof s.savings === 'number' &&
      Array.isArray(s.queue) && s.queue.every((id) => known.has(id) && isObject(s.tickets?.[id])) &&
      Array.isArray(s.arriving) && s.arriving.every((a) => known.has(a.id)) &&
      Array.isArray(s.returning) && s.returning.every((r) => known.has(r.id)) &&
      Array.isArray(s.outcomes) &&
      [s.tickets, s.bonds, s.xp, s.runbook, s.today, s.accounts].every(isObject);
    return ok ? (s as GameState) : undefined;
  } catch {
    return undefined;
  }
}
