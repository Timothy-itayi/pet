import { describe, expect, it } from 'vitest';
import { CLOSE, DAILY_COST, DAYS, GOAL_VOUCHER, REPLIES, START_SAVINGS } from './data.ts';
import {
  acceptOffer, apply, clockOut, clockTime, fix, goHome, goTo, issueOf, newGame, next, parseSave, pushBack, relation,
  reply, tick, ticketById, ticketState, workaround, writeNote, type GameState,
} from './rules.ts';

const atDesk = () => goTo(newGame(), 'desk');
/** Let the office clock run to a given time. */
const until = (s: GameState, hm: string) => tick(s, clockTime(hm) - s.clock);
const solve = (s: GameState, id: string) => next(fix(s, id, issueOf(ticketById(id)).correctFix));
/** Deal with everyone the moment they arrive, then go home and come back for the next day. */
function playDay(s: GameState, each = solve): GameState {
  s = goTo(s, 'desk');
  while (s.phase === 'desk') {
    const id = s.queue[0];
    s = id ? each(s, id) : s.arriving.length ? tick(s, 5) : clockOut(s);
  }
  return goHome(s);
}

describe('the queue and the clock', () => {
  it('opens at 9am and tickets arrive at their time', () => {
    let s = atDesk();
    expect(s.clock).toBe(9 * 60);
    expect(s.queue).toEqual([]);
    s = until(s, '9:05');
    expect(s.queue).toEqual(['t101']);
    expect(ticketState(s, 't101')).toMatchObject({ status: 'new', mood: 1 });
  });

  it('upsets people you leave without a reply, and they storm off if it goes on', () => {
    let s = until(atDesk(), '9:15'); // Dot walked up at 9:05 and expects a reply within 10 minutes
    expect(ticketState(s, 't101')).toMatchObject({ mood: 2, slips: 1 });
    expect(s.today.missed).toBe(1);
    s = until(s, '9:45');
    expect(ticketState(s, 't101').mood).toBe(3);
    s = until(s, '10:15');
    expect(s.outcomes).toEqual([{ ticketId: 't101', kind: 'storm', xp: 0 }]);
    expect(s.today.complaints).toBe(1);
    expect(relation(s, 'dot')).toBe('nemesis');
  });

  it('sends a standard update that buys time', () => {
    let s = reply(until(atDesk(), '9:06'), 't101');
    expect(ticketState(s, 't101')).toMatchObject({ status: 'open', due: clockTime('10:08') });
    expect(ticketState(s, 't101').messages.at(-1)).toMatchObject({ from: 'you', text: REPLIES.first });
    expect(s.clock).toBe(clockTime('9:08'));
    s = until(s, '10:07');
    expect(ticketState(s, 't101').mood).toBe(1);
  });

  it('stops the clock while a card is up', () => {
    const s = fix(until(atDesk(), '9:05'), 't101', 'jam');
    expect(tick(s, 30)).toBe(s);
  });

  it('ends the day at 5pm and carries unresolved tickets over, a step grumpier', () => {
    let s = reply(reply(until(atDesk(), '9:50'), 't101'), 't102');
    s = tick(s, CLOSE);
    expect(s.phase).toBe('dayEnd');
    s = goTo(goHome(s), 'desk');
    expect(s.queue.slice(0, 2)).toEqual(['t101', 't102']);
    expect(ticketState(s, 't101').messages[0]?.text).toMatch(/^Still waiting from yesterday/);
  });
});

describe('fixing', () => {
  it('resolves on the right fix and earns experience', () => {
    const s = fix(until(atDesk(), '9:05'), 't101', 'jam');
    expect(s.queue).toEqual([]);
    expect(s.xp.devices).toBe(2);
    expect(s.outcomes[0]).toMatchObject({ ticketId: 't101', kind: 'fix', xp: 2 });
    expect(s.clock).toBe(clockTime('9:20'));
  });

  it('costs patience for a wrong fix', () => {
    const s = fix(until(atDesk(), '9:05'), 't101', 'ink');
    expect(s.queue).toEqual(['t101']);
    expect(s.notice?.text).toMatch(/still jammed/);
    expect(ticketState(s, 't101')).toMatchObject({ mood: 2, tried: ['ink'] });
  });

  it('turns the right internal note into a runbook page that makes the same problem quicker next time', () => {
    let s = fix(until(atDesk(), '9:05'), 't101', 'jam');
    s = writeNote(s, 1);
    expect(s.outcomes[0]?.wrongNote).toBe(1);
    expect(s.runbook['paper-jam']).toBe('ok');
    s = next(writeNote(s, 0));
    expect(s.runbook['paper-jam']).toBe('yours');
    expect(s.xp.devices).toBe(3);
    s = playDay(s);
    const pip = until(goTo(s, 'desk'), '13:30'); // Pip's printer: same problem
    const done = fix(pip, 't203', 'jam');
    expect(done.clock - pip.clock).toBe(5);
  });
});

describe('friends and nemeses', () => {
  it('a fix with no slips makes a friend, who is calmer, more patient and forgiving next time', () => {
    let s = solve(until(atDesk(), '9:05'), 't101');
    expect(relation(s, 'dot')).toBe('friend');
    s = playDay(playDay(s));
    s = until(goTo(s, 'desk'), '14:00'); // Dot's email on day 3; usually Annoyed, normal priority
    expect(ticketState(s, 't304')).toMatchObject({ mood: 0, due: clockTime('15:00') });
    s = fix(s, 't304', 'set');
    expect(s.notice?.text).toMatch(/encouraging smile/);
    expect(ticketState(s, 't304').mood).toBe(0);
  });
});

describe('workarounds and pushing back', () => {
  it('a workaround resolves for now, but it comes back in two days and only works once', () => {
    let s = next(workaround(until(atDesk(), '9:05'), 't101'));
    expect(s.xp.devices).toBe(1);
    expect(s.returning).toEqual([{ id: 't101', day: 3 }]);
    s = goTo(playDay(playDay(s)), 'desk');
    expect(s.queue[0]).toBe('t101');
    expect(workaround(s, 't101')).toBe(s);
  });

  it('pushing back sets it to pending until tomorrow, at most twice', () => {
    let s = next(pushBack(until(atDesk(), '9:05'), 't101'));
    expect(ticketState(s, 't101').status).toBe('pending');
    const pushDot = (x: GameState, id: string) => (id === 't101' ? next(pushBack(x, id)) : solve(x, id));
    s = goTo(playDay(playDay(s), pushDot), 'desk');
    expect(s.queue[0]).toBe('t101');
    expect(pushBack(s, 't101')).toBe(s);
  });
});

describe('money and endings', () => {
  it('pays a voucher only when the goal is met, and always costs bus fare and food', () => {
    expect(playDay(newGame()).savings).toBe(START_SAVINGS + GOAL_VOUCHER - DAILY_COST);
    const lazy = playDay(newGame(), (x, id) => next(pushBack(x, id)));
    expect(lazy.savings).toBe(START_SAVINGS - DAILY_COST);
  });

  it('burns out when savings run out', () => {
    const s = { ...newGame(), savings: DAILY_COST };
    expect(playDay(s, (x, id) => next(pushBack(x, id))).ending).toBe('burnout');
  });

  it('a good week can get you hired by the library, but not Big Ocean yet', () => {
    let s = newGame();
    const fixAndNote = (x: GameState, id: string) => next(writeNote(fix(x, id, issueOf(ticketById(id)).correctFix), 0));
    while (s.day <= DAYS) s = playDay(s, fixAndNote);
    expect(apply(s, 'ocean')).toBe(s);
    expect(apply(s, 'library').ending).toBe('hired');
    expect(acceptOffer(s).ending).toBe('stay');
  });
});

describe('saves', () => {
  it('round-trips a real game and rejects junk', () => {
    const s = solve(until(atDesk(), '9:05'), 't101');
    expect(parseSave(JSON.stringify(s))).toEqual(s);
    expect(parseSave('{nope')).toBeUndefined();
    expect(parseSave(JSON.stringify({ ...s, version: 3 }))).toBeUndefined();
    expect(parseSave(JSON.stringify({ ...s, queue: ['not-a-ticket'] }))).toBeUndefined();
  });
});
