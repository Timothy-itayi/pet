import { describe, expect, it } from 'vitest';
import { CLOSE, DAILY_COST, DAYS, GOAL_VOUCHER, REPLIES, START_SAVINGS } from './data.ts';
import {
  acceptOffer, apply, arriveOnSite, askForTicket, clockTime, fix, goHome, goTo, issueOf, newGame, next, parseSave,
  noteTarget, pushBack, relation, reply, tick, ticketById, ticketState, wait, walk, workaround, writeNote, type GameState,
} from './rules.ts';

type Act = (s: GameState, id: string) => GameState;
const atDesk = () => goTo(newGame(), 'desk');
/** Let the office clock run to a given time. */
const until = (s: GameState, hm: string) => tick(s, clockTime(hm) - s.clock);
const correct = (id: string) => issueOf(ticketById(id)).correctFix;
/** Do something about a ticket: follow a walk-up to the problem first, and head back to the desk afterwards. */
function handle(s: GameState, id: string, act: Act): GameState {
  if (s.escort === id) s = arriveOnSite(s);
  s = next(act(s, id));
  return s.escort ? s : walk(s, 'computer');
}
const solve = (s: GameState, id: string) => handle(s, id, (x, i) => fix(x, i, correct(i)));
/** Run the clock to a time, fixing every ticket that turns up on the way except the one under test. */
function serveUntil(s: GameState, hm: string, except?: string): GameState {
  const target = clockTime(hm);
  while (s.phase === 'desk' && s.clock < target) {
    const id = s.escort ?? s.queue.find((x) => x !== except);
    s = s.outcomes.length ? next(s) : id ? solve(s, id) : tick(s, Math.min(1, target - s.clock));
  }
  return s;
}
/** Deal with everyone the moment they arrive, then go home and come back for the next day. */
function playDay(s: GameState, each: Act = solve): GameState {
  s = goTo(s, 'desk');
  while (s.phase === 'desk') {
    const id = s.escort ?? s.queue[0];
    s = id ? each(s, id) : s.place === 'floor' ? walk(s, 'computer') : wait(s);
  }
  return goHome(s);
}
/** Set everything to pending; once that's used up, a workaround; once that's used up too, fix it. */
const pushAll: Act = (s, id) => handle(s, id, (x, i) => {
  const pushed = pushBack(x, i);
  if (pushed !== x) return pushed;
  const worked = workaround(x, i);
  return worked !== x ? worked : fix(x, i, correct(i));
});

describe('the queue and the clock', () => {
  it('opens at 9am, and tickets arrive at their time without warning', () => {
    let s = atDesk();
    expect(s.clock).toBe(9 * 60);
    expect(s.queue).toEqual([]);
    s = serveUntil(s, '9:50');
    expect(s.queue).toEqual(['t102']);
    expect(ticketState(s, 't102')).toMatchObject({ status: 'new', mood: 2 });
  });

  it('upsets people you leave without a reply, and they storm off if it goes on', () => {
    let s = until(serveUntil(atDesk(), '9:50'), '10:10'); // Juniper's high-priority ticket: reply within 20 minutes
    expect(ticketState(s, 't102')).toMatchObject({ mood: 3, slips: 1 });
    expect(s.today.missed).toBe(1);
    s = until(s, '10:40');
    expect(s.outcomes).toEqual([{ ticketId: 't102', kind: 'storm', xp: 0 }]);
    expect(s.today.complaints).toBe(1);
    expect(relation(s, 'juniper')).toBe('nemesis');
  });

  it('sends a standard update that buys time', () => {
    let s = reply(serveUntil(atDesk(), '9:50'), 't102');
    expect(ticketState(s, 't102')).toMatchObject({ status: 'open', due: clockTime('10:52') });
    expect(ticketState(s, 't102').messages.at(-1)).toMatchObject({ from: 'you', text: REPLIES.first });
    s = until(s, '10:51');
    expect(ticketState(s, 't102').mood).toBe(2);
  });

  it('stops the clock while a card is up', () => {
    const s = fix(arriveOnSite(until(atDesk(), '9:05')), 't101', 'jam');
    expect(tick(s, 30)).toBe(s);
  });

  it('ends the day at 5pm and carries unresolved tickets over, a step grumpier', () => {
    let s = reply(serveUntil(atDesk(), '9:50'), 't102');
    while (s.phase === 'desk') s = tick(reply(s, 't102'), 50); // keep her updated all day
    expect(s.clock).toBe(CLOSE);
    s = goTo(goHome(s), 'desk');
    expect(s.queue[0]).toBe('t102');
    expect(ticketState(s, 't102').messages[0]?.text).toMatch(/^Still waiting from yesterday/);
  });
});

describe('walk-ups', () => {
  it('lead you away from your desk; you can only fix it once you’ve followed them there', () => {
    let s = until(atDesk(), '9:05');
    expect(s).toMatchObject({ escort: 't101', place: 'floor' });
    expect(fix(s, 't101', 'jam')).toBe(s);
    expect(walk(s, 'computer')).toBe(s);
    s = until(s, '10:00');
    expect(ticketState(s, 't101').mood).toBe(1); // they're with you, so no reply-by time
    s = next(fix(arriveOnSite(s), 't101', 'jam'));
    expect(s).toMatchObject({ escort: undefined, place: 'floor' });
    expect(walk(s, 'computer').place).toBe('computer');
  });

  it('wait at your desk if you’re out on the floor, and grab you when you get back', () => {
    let s = until(walk(atDesk(), 'floor'), '9:10');
    expect(s.escort).toBeUndefined();
    expect(s.queue).toEqual(['t101']);
    s = walk(s, 'computer');
    expect(s).toMatchObject({ escort: 't101', place: 'floor' });
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

  it('helping on the floor earns experience and friends, but the manager doesn’t count it', () => {
    let s = walk(serveUntil(atDesk(), '11:30'), 'floor');
    expect(reply(s, 'f101')).toBe(s); // no ticket system on the floor
    s = next(fix(s, 'f101', 'battery'));
    expect(s.today).toMatchObject({ helped: 1, resolved: 2 }); // the morning's two tickets, not Biscuit
    expect(relation(s, 'biscuit')).toBe('friend');
  });

  it('asking for a ticket annoys them once, then it lands in your queue and counts', () => {
    let s = walk(serveUntil(atDesk(), '11:30'), 'floor');
    s = walk(next(askForTicket(s, 'f101')), 'computer');
    expect(s.floor).toEqual([]);
    s = until(s, '12:10');
    expect(s.queue).toContain('f101');
    expect(ticketState(s, 'f101')).toMatchObject({ mood: 1, logged: true });
    expect(ticketState(s, 'f101').messages[0]?.text).toMatch(/ticket you asked for/);
    s = next(fix(s, 'f101', 'battery'));
    expect(s.today).toMatchObject({ resolved: 3, helped: 0 });
  });

  it('can’t work your queue while you’re away from the computer, and its clock keeps running', () => {
    let s = walk(serveUntil(atDesk(), '9:50'), 'floor');
    expect(reply(s, 't102')).toBe(s);
    s = until(s, '10:10');
    expect(ticketState(s, 't102').mood).toBe(3);
  });
});

describe('fixing', () => {
  it('resolves on the right fix and earns experience', () => {
    const s = fix(arriveOnSite(until(atDesk(), '9:05')), 't101', 'jam');
    expect(s.queue).toEqual([]);
    expect(s.xp.devices).toBe(2);
    expect(s.outcomes[0]).toMatchObject({ ticketId: 't101', kind: 'fix', xp: 2 });
    expect(s.clock).toBe(clockTime('9:20'));
  });

  it('costs patience for a wrong fix', () => {
    const s = fix(arriveOnSite(until(atDesk(), '9:05')), 't101', 'ink');
    expect(s.notice?.text).toMatch(/still jammed/);
    expect(ticketState(s, 't101')).toMatchObject({ mood: 2, tried: ['ink'] });
  });

  it('turns the right internal note into a runbook page that makes the same problem quicker next time', () => {
    let s = fix(arriveOnSite(until(atDesk(), '9:05')), 't101', 'jam');
    s = writeNote(s, 1);
    expect(s.outcomes[0]?.wrongNote).toBe(1);
    expect(s.runbook['paper-jam']).toBe('ok');
    s = walk(next(writeNote(s, 0)), 'computer');
    expect(s.runbook['paper-jam']).toBe('yours');
    expect(s.xp.devices).toBe(3);
    s = playDay(s);
    const pip = serveUntil(goTo(s, 'desk'), '13:31', 't203'); // Pip's printer: same problem
    expect(fix(pip, 't203', 'jam').clock - pip.clock).toBe(5);
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

describe('workarounds and pending', () => {
  it('a workaround resolves for now, but it comes back in two days and only works once', () => {
    let s = handle(until(atDesk(), '9:05'), 't101', workaround);
    expect(s.xp.devices).toBe(1);
    expect(s.returning).toEqual([{ id: 't101', day: 3 }]);
    s = goTo(playDay(playDay(s)), 'desk');
    expect(s.escort).toBe('t101'); // Dot's back first thing
    s = arriveOnSite(s);
    expect(workaround(s, 't101')).toBe(s);
  });

  it('pending sends them away until tomorrow, at most twice', () => {
    let s = handle(until(atDesk(), '9:05'), 't101', pushBack);
    expect(ticketState(s, 't101').status).toBe('pending');
    const pushDot: Act = (x, id) => (id === 't101' ? pushAll(x, id) : solve(x, id));
    s = goTo(playDay(playDay(s), pushDot), 'desk');
    expect(s.escort).toBe('t101');
    s = arriveOnSite(s);
    expect(pushBack(s, 't101')).toBe(s);
  });
});

describe('the day-3 loot drop', () => {
  /** Fix only these people's tickets; set everyone else's to pending. */
  const onlyHelp = (...who: string[]): Act => (s, id) => (who.includes(ticketById(id).who) ? solve(s, id) : pushAll(s, id));
  const toDay3 = (s: GameState, each: Act) => goTo(playDay(playDay(s, each), pushAll), 'desk');

  it('with no friends, you find Sam\u2019s cheat sheet in the drawer', () => {
    const s = toDay3(newGame(0), pushAll);
    expect(s).toMatchObject({ tools: ['cheat-sheet'], drop: 'cheat-sheet' });
    expect(s.runbook['tool:cheat-sheet']).toBe('missing');
  });

  it('comes from one of your friends, picked at random, and never from the manager', () => {
    expect(toDay3(newGame(0), onlyHelp('dot')).tools).toEqual(['tweezers']);
    expect(toDay3(newGame(0), onlyHelp('dot', 'juniper')).tools).toEqual(['tweezers']);
    expect(toDay3(newGame(1), onlyHelp('dot', 'juniper')).tools).toEqual(['hdmi-labels']);
    const grisbyOnly = { ...newGame(0), bonds: { ...newGame(0).bonds, grisby: 3 } };
    expect(toDay3(grisbyOnly, pushAll).tools).toEqual(['cheat-sheet']);
  });

  it('is only a one-off: nothing new turns up the next day', () => {
    const s = goTo(playDay(toDay3(newGame(0), pushAll), pushAll), 'desk');
    expect(s).toMatchObject({ day: 4, tools: ['cheat-sheet'], drop: undefined });
  });

  it('gives a faster fix that isn\u2019t in the runbook, until you write its page', () => {
    let s: GameState = { ...atDesk(), tools: ['tweezers'], runbook: { ...atDesk().runbook, 'tool:tweezers': 'missing' } };
    s = arriveOnSite(until(s, '9:05'));
    const before = s.clock;
    s = fix(s, 't101', 'tool');
    expect(s.clock - before).toBe(5);
    const card = s.outcomes[0];
    expect(card?.tool).toBe('tweezers');
    expect(card && noteTarget(s, card)?.title).toMatch(/tweezers/);
    s = writeNote(s, 0);
    expect(s.runbook['tool:tweezers']).toBe('yours');
    expect(s.runbook['paper-jam']).toBe('ok'); // one note per fix
  });
});

describe('money and endings', () => {
  it('pays a voucher only when the goal is met, and always costs bus fare and food', () => {
    expect(playDay(newGame()).savings).toBe(START_SAVINGS + GOAL_VOUCHER - DAILY_COST);
    expect(playDay(newGame(), pushAll).savings).toBe(START_SAVINGS - DAILY_COST);
  });

  it('burns out when savings run out', () => {
    expect(playDay({ ...newGame(), savings: DAILY_COST }, pushAll).ending).toBe('burnout');
  });

  it('a good week can get you hired by the library, but not Big Ocean yet', () => {
    let s = newGame();
    const fixAndNote: Act = (x, id) => handle(x, id, (y, i) => writeNote(fix(y, i, correct(i)), 0));
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
    expect(parseSave(JSON.stringify({ ...s, version: 5 }))).toBeUndefined();
    expect(parseSave(JSON.stringify({ ...s, queue: ['not-a-ticket'] }))).toBeUndefined();
  });
});
