import { describe, expect, it } from 'vitest';
import { CLOSE, DAILY_COST, DAYS, GOAL_VOUCHER, REPLIES, START_SAVINGS } from './data.ts';
import {
  acceptOffer, apply, askForTicket, clockTime, fix, goHome, goTo, issueOf, newGame, next, parseSave, pushBack, relation,
  reply, tick, ticketById, ticketState, wait, walk, workaround, writeNote, type GameState,
} from './rules.ts';

const atDesk = () => goTo(newGame(), 'desk');
/** Let the office clock run to a given time. */
const until = (s: GameState, hm: string) => tick(s, clockTime(hm) - s.clock);
const solve = (s: GameState, id: string) => next(fix(s, id, issueOf(ticketById(id)).correctFix));
/** Run the clock to a time, fixing every ticket that turns up on the way except the one under test. */
function serveUntil(s: GameState, hm: string, except?: string): GameState {
  const target = clockTime(hm);
  while (s.phase === 'desk' && s.clock < target) {
    const id = s.queue.find((x) => x !== except);
    s = s.outcomes.length ? next(s) : id ? solve(s, id) : tick(s, Math.min(1, target - s.clock));
  }
  return s;
}
/** Deal with everyone the moment they arrive, then go home and come back for the next day. */
function playDay(s: GameState, each = solve): GameState {
  s = goTo(s, 'desk');
  while (s.phase === 'desk') {
    const id = s.queue[0];
    s = id ? each(s, id) : wait(s);
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
    let s = until(atDesk(), '9:20'); // Dot walked up at 9:05 and expects a reply within 15 minutes
    expect(ticketState(s, 't101')).toMatchObject({ mood: 2, slips: 1 });
    expect(s.today.missed).toBe(1);
    s = until(s, '9:50');
    expect(ticketState(s, 't101').mood).toBe(3);
    s = until(s, '10:20');
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
    let s = reply(until(atDesk(), '9:05'), 't101');
    s = reply(until(s, '9:50'), 't102');
    while (s.phase === 'desk') s = tick(reply(reply(s, 't101'), 't102'), 50); // keep them updated all day
    expect(s.phase).toBe('dayEnd');
    expect(s.clock).toBe(CLOSE);
    s = goTo(goHome(s), 'desk');
    expect(s.queue.slice(0, 2)).toEqual(['t101', 't102']);
    expect(ticketState(s, 't101').messages[0]?.text).toMatch(/^Still waiting from yesterday/);
  });
});

describe('the office floor', () => {
  it('has people with no ticket, who you only see if you walk over, and who give up after an hour', () => {
    let s = serveUntil(atDesk(), '11:30');
    expect(s.queue).not.toContain('f101');
    expect(s.floor).toEqual(['f101']);
    expect(fix(s, 'f101', 'battery')).toBe(s); // you're at your computer
    s = until(s, '12:30');
    expect(s.floor).toEqual([]);
    expect(s.today.gaveUp).toBe(1);
  });

  it('helping on the floor earns experience and friends, but the manager doesn\u2019t count it', () => {
    let s = walk(serveUntil(atDesk(), '11:30'), 'floor');
    expect(s.clock).toBe(clockTime('11:33'));
    expect(reply(s, 't101')).toBe(s); // no ticket system on the floor
    s = next(fix(s, 'f101', 'battery'));
    expect(s.today).toMatchObject({ helped: 1, resolved: 2 }); // the morning's two tickets, not Biscuit
    expect(s.xp.devices).toBe(4); // Dot's printer this morning, plus Biscuit's mouse
    expect(relation(s, 'biscuit')).toBe('friend');
  });

  it('asking for a ticket annoys them once, then it lands in your queue and counts', () => {
    let s = walk(serveUntil(atDesk(), '11:30'), 'floor');
    s = next(askForTicket(s, 'f101'));
    expect(s.floor).toEqual([]);
    s = walk(s, 'computer');
    s = until(s, '12:10');
    expect(s.queue).toContain('f101');
    expect(ticketState(s, 'f101')).toMatchObject({ mood: 1, logged: true });
    expect(ticketState(s, 'f101').messages[0]?.text).toMatch(/ticket you asked for/);
    s = next(fix(s, 'f101', 'battery'));
    expect(s.today).toMatchObject({ resolved: 3, helped: 0 }); // the morning's two, plus Biscuit's ticket
  });

  it('can\u2019t see or work your queue while you\u2019re away from the computer, and the clock keeps running', () => {
    let s = walk(until(atDesk(), '9:05'), 'floor');
    expect(fix(s, 't101', 'jam')).toBe(s);
    s = until(s, '9:20');
    expect(ticketState(s, 't101').mood).toBe(2);
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
    const pip = serveUntil(goTo(s, 'desk'), '13:31', 't203'); // Pip's printer: same problem
    const done = fix(pip, 't203', 'jam');
    expect(done.clock - pip.clock).toBe(5);
  });
});

describe('friends and nemeses', () => {
  it('a fix with no slips makes a friend, who is calmer, more patient and forgiving next time', () => {
    let s = solve(until(atDesk(), '9:05'), 't101');
    expect(relation(s, 'dot')).toBe('friend');
    s = playDay(playDay(s));
    s = serveUntil(goTo(s, 'desk'), '14:00', 't304'); // Dot's email on day 3; usually Annoyed, normal priority
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
