import {
  BOND, MESSY_SLIPS, VILLAGERS, type VillagerId,
  DAILY_COST, DAYS, DAY_SCRIPTS, GOAL_VOUCHER, JOBS, MAX_PUSHES, RUNBOOK, START_SAVINGS, TICKETS,
  WORKAROUND_RETURNS_AFTER, XP,
} from './data.ts';
import { MOODS, type Clue, type Job, type Mood, type PageStatus, type Relation, type Skill, type Ticket } from './types.ts';

export type Phase = 'boot' | 'desktop' | 'desk' | 'dayEnd' | 'ending';
export type Ending = 'hired' | 'burnout' | 'stay';

export interface TicketProgress {
  mood: Mood;
  /** Times you cost them patience on this ticket. Zero slips on a fix makes a friend. */
  slips: number;
  asked: string[];
  pushes: number;
  workedAround: boolean;
  found: boolean;
  tried: string[];
}

export interface Outcome {
  ticketId: string;
  kind: 'fix' | 'workaround' | 'push' | 'storm';
  xp: number;
}

export interface Today {
  closed: number;
  pushed: number;
  wrongFixes: number;
  complaints: number;
  xp: number;
  voucher: boolean;
  /** Who became a friend or nemesis today, or stopped being one. */
  bonds: { who: VillagerId; now: Relation }[];
}

export interface GameState {
  version: 3;
  /** 1..DAYS while working; DAYS + 1 once the week is over. */
  day: number;
  phase: Phase;
  queue: string[];
  returning: { id: string; day: number }[];
  progress: Record<string, TicketProgress>;
  bonds: Record<VillagerId, number>;
  xp: Record<Skill, number>;
  savings: number;
  today: Today;
  runbook: Record<string, PageStatus>;
  /** The "why" card for the ticket just finished; cleared by next(). */
  outcome?: Outcome;
  /** One-line feedback on the current ticket, e.g. a wrong fix. */
  notice?: string;
  ending?: Ending;
  jobId?: string;
}

export const ticketById = (id: string): Ticket => {
  const t = TICKETS.find((x) => x.id === id);
  if (!t) throw new Error(`Unknown ticket: ${id}`);
  return t;
};

export function scriptFor(day: number) {
  const script = DAY_SCRIPTS[Math.min(day, DAYS) - 1];
  if (!script) throw new Error(`No script for day ${day}`);
  return script;
}
export const isWeekOver = (s: GameState) => s.day > DAYS;
export const currentTicket = (s: GameState): Ticket | undefined =>
  s.queue[0] === undefined ? undefined : ticketById(s.queue[0]);

export function relation(s: GameState, who: VillagerId): Relation {
  const bond = s.bonds[who];
  return bond >= 1 ? 'friend' : bond <= -1 ? 'nemesis' : 'neutral';
}

export const peopleWho = (s: GameState, r: Relation): VillagerId[] =>
  (Object.keys(s.bonds) as VillagerId[]).filter((who) => relation(s, who) === r);

/** Friends turn up a step calmer, nemeses a step angrier (never already Furious). */
function startingMood(s: GameState, t: Ticket): Mood {
  const r = relation(s, t.who);
  return Math.max(0, Math.min(t.mood + (r === 'nemesis' ? 1 : r === 'friend' ? -1 : 0), 2)) as Mood;
}

export const progressOf = (s: GameState, id: string): TicketProgress =>
  s.progress[id] ?? { mood: startingMood(s, ticketById(id)), slips: 0, asked: [], pushes: 0, workedAround: false, found: false, tried: [] };

/** What's on the desk: clues shown from the start, plus whatever your questions revealed. */
export function visibleClues(s: GameState, t: Ticket): Clue[] {
  const asked = progressOf(s, t.id).asked;
  const revealed = new Set(t.questions.filter((q) => asked.includes(q.id)).map((q) => q.reveals));
  return t.clues.filter((c) => !c.hidden || revealed.has(c.id));
}

export const moodName = (m: Mood) => MOODS[m];

const emptyToday = (): Today => ({ closed: 0, pushed: 0, wrongFixes: 0, complaints: 0, xp: 0, voucher: false, bonds: [] });
/** People who were sent away come back grumpier, but never already furious. */
const RETURN_MOOD_CAP: Mood = 2;

/** Returning tickets come first: they've been waiting. */
function startDay(s: GameState): void {
  const back = s.returning.filter((r) => r.day === s.day).map((r) => r.id);
  s.returning = s.returning.filter((r) => r.day !== s.day);
  s.queue = [...back, ...TICKETS.filter((t) => t.day === s.day).map((t) => t.id)];
  s.today = emptyToday();
  s.outcome = undefined;
  s.notice = undefined;
}

export function newGame(): GameState {
  const s: GameState = {
    version: 3,
    day: 1,
    phase: 'boot',
    queue: [],
    returning: [],
    progress: {},
    bonds: Object.fromEntries(Object.keys(VILLAGERS).map((k) => [k, 0])) as Record<VillagerId, number>,
    xp: { devices: 0, networks: 0, access: 0 },
    savings: START_SAVINGS,
    today: emptyToday(),
    runbook: Object.fromEntries(RUNBOOK.map((p) => [p.id, p.status])),
  };
  startDay(s);
  return s;
}

/** Each action copies the state, so the caller can keep or drop the old one. */
function act(s: GameState, fn: (d: GameState) => void): GameState {
  const d = structuredClone(s);
  fn(d);
  return d;
}

const setProgress = (d: GameState, id: string, patch: Partial<TicketProgress>) => {
  d.progress[id] = { ...progressOf(d, id), ...patch };
};

export const goTo = (s: GameState, phase: Phase) => act(s, (d) => { d.phase = phase; });

/**
 * Compare two clues on the desk. The right pair unlocks the fixes.
 * A wrong pair costs a step of patience, unless they're your friend.
 */
export function inspect(s: GameState, a: string, b: string): { state: GameState; found: boolean } {
  const t = currentTicket(s);
  const onDesk = t ? visibleClues(s, t).map((c) => c.id) : [];
  if (!t || s.outcome || a === b || !onDesk.includes(a) || !onDesk.includes(b)) return { state: s, found: false };
  const found = t.mismatch.includes(a) && t.mismatch.includes(b);
  return {
    state: act(s, (d) => {
      if (found) {
        setProgress(d, t.id, { found: true });
        d.notice = undefined;
        return;
      }
      d.notice = 'Those two add up fine.';
      if (relation(d, t.who) === 'friend') d.notice += ' Luckily, friends don\u2019t mind a wrong guess.';
      else slip(d, t);
    }),
    found,
  };
}

function changeBond(d: GameState, who: VillagerId, by: number): void {
  const before = relation(d, who);
  d.bonds[who] = Math.max(BOND.min, Math.min(d.bonds[who] + by, BOND.max));
  const now = relation(d, who);
  if (now !== before) d.today.bonds = [...d.today.bonds.filter((b) => b.who !== who), { who, now }];
}

function close(d: GameState, t: Ticket, kind: Outcome['kind'], xp: number): void {
  const { slips } = progressOf(d, t.id);
  if (kind === 'fix') changeBond(d, t.who, slips === 0 ? BOND.clean : slips >= MESSY_SLIPS ? BOND.messy : 0);
  if (kind === 'storm') changeBond(d, t.who, BOND.storm);
  d.queue.shift();
  d.xp[t.skill] += xp;
  d.today.xp += xp;
  if (kind === 'fix' || kind === 'workaround') d.today.closed += 1;
  if (kind === 'storm') d.today.complaints += 1;
  d.outcome = { ticketId: t.id, kind, xp };
  d.notice = undefined;
}

/** You cost them patience: mood gets a step worse. Pushed past Furious, they storm off to the manager. */
function slip(d: GameState, t: Ticket): void {
  const p = progressOf(d, t.id);
  setProgress(d, t.id, { slips: p.slips + 1 });
  if (p.mood + 1 >= MOODS.length) close(d, t, 'storm', 0);
  else setProgress(d, t.id, { mood: (p.mood + 1) as Mood });
}

const cooled = (d: GameState, t: Ticket): Mood => Math.min(progressOf(d, t.id).mood + 1, RETURN_MOOD_CAP) as Mood;

export function ask(s: GameState, questionId: string): GameState {
  const t = currentTicket(s);
  const q = t?.questions.find((x) => x.id === questionId);
  if (!t || !q || s.outcome || progressOf(s, t.id).asked.includes(q.id)) return s;
  return act(s, (d) => {
    setProgress(d, t.id, { asked: [...progressOf(d, t.id).asked, q.id] });
    d.notice = undefined;
    if (q.annoys) slip(d, t);
  });
}

export function fix(s: GameState, fixId: string): GameState {
  const t = currentTicket(s);
  if (!t || !progressOf(s, t.id).found || s.outcome) return s;
  const p = progressOf(s, t.id);
  if (p.tried.includes(fixId)) return s;
  return act(s, (d) => {
    if (fixId === t.correctFix) {
      if (t.runbookPage) d.runbook[t.runbookPage] = 'updated';
      close(d, t, 'fix', XP.fix);
      return;
    }
    setProgress(d, t.id, { tried: [...p.tried, fixId] });
    d.today.wrongFixes += 1;
    d.notice = t.fixes.find((f) => f.id === fixId)?.fail ?? 'That didn’t work.';
    if (relation(d, t.who) === 'friend') d.notice += ' They give you an encouraging smile anyway.';
    else slip(d, t);
  });
}

export const canWorkaround = (s: GameState, id: string) => !progressOf(s, id).workedAround;
export const canPush = (s: GameState, id: string) => progressOf(s, id).pushes < MAX_PUSHES;

export function workaround(s: GameState): GameState {
  const t = currentTicket(s);
  if (!t || s.outcome || !canWorkaround(s, t.id)) return s;
  return act(s, (d) => {
    setProgress(d, t.id, { workedAround: true, mood: cooled(d, t) });
    const back = d.day + WORKAROUND_RETURNS_AFTER;
    if (back <= DAYS) d.returning.push({ id: t.id, day: back });
    close(d, t, 'workaround', XP.workaround);
  });
}

export function pushBack(s: GameState): GameState {
  const t = currentTicket(s);
  if (!t || s.outcome || !canPush(s, t.id)) return s;
  return act(s, (d) => {
    setProgress(d, t.id, { pushes: progressOf(d, t.id).pushes + 1, mood: cooled(d, t) });
    if (d.day + 1 <= DAYS) d.returning.push({ id: t.id, day: d.day + 1 });
    d.today.pushed += 1;
    close(d, t, 'push', 0);
  });
}

export const next = (s: GameState) => act(s, (d) => { d.outcome = undefined; });

export function endDay(s: GameState): GameState {
  if (s.queue.length > 0 || s.phase !== 'desk') return s;
  return act(s, (d) => {
    d.outcome = undefined;
    d.today.voucher = d.today.closed >= scriptFor(d.day).goal;
    d.savings += (d.today.voucher ? GOAL_VOUCHER : 0) - DAILY_COST;
    d.phase = 'dayEnd';
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
    const known = new Set(TICKETS.map((t) => t.id));
    const ok =
      s.version === 3 &&
      typeof s.bonds === 'object' && s.bonds !== null &&
      typeof s.day === 'number' && s.day >= 1 && s.day <= DAYS + 1 &&
      typeof s.savings === 'number' &&
      Array.isArray(s.queue) && s.queue.every((id) => known.has(id)) &&
      Array.isArray(s.returning) && s.returning.every((r) => known.has(r.id)) &&
      typeof s.xp === 'object' && s.xp !== null &&
      typeof s.progress === 'object' && s.progress !== null &&
      typeof s.runbook === 'object' && s.runbook !== null &&
      typeof s.today === 'object' && s.today !== null;
    return ok ? (s as GameState) : undefined;
  } catch {
    return undefined;
  }
}
