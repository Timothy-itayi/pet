import { describe, expect, it } from 'vitest';
import { CHAT_LATER, CLOSE, DAILY_COST, DAYS, GOAL_VOUCHER, REPLIES, START_SAVINGS, VILLAGERS } from './data.ts';
import {
  accountProblem, acceptOffer, apply, askForTicket, clockTime, fix, goHome, goNow, goTo, issueOf, later, newGame, next, noteTarget, parseSave,
  pushBack, relation, reply, resetPassword, setEnabled, tick, ticketById, ticketState, unlockAccount, workaround, writeNote, type GameState,
} from './rules.ts';

type Act = (s: GameState, id: string) => GameState;
const atDesk = () => goTo(newGame(), 'desk');
/** Let the office clock run to a given time. */
const until = (s: GameState, hm: string) => tick(s, clockTime(hm) - s.clock);
const correct = (id: string) => issueOf(ticketById(id)).correctFix;
/** For tickets fixed in Active Registry, do the account work first, the right way. */
function admin(s: GameState, id: string): GameState {
  const t = ticketById(id);
  const by = issueOf(t).console;
  return by === 'unlock' ? unlockAccount(s, t.who) : by === 'reset' ? resetPassword(s, t.who, { mustChange: true, unlock: true }) : s;
}
/** Do something about a ticket or chat: for a chat, say "on my way" first and go over in person. */
function handle(s: GameState, id: string, act: Act): GameState {
  if (s.chats.includes(id)) s = goNow(s, id);
  return next(act(s, id));
}
const solve = (s: GameState, id: string) => handle(s, id, (x, i) => fix(admin(x, i), i, correct(i)));
/** Run the clock to a time, dealing with everything that turns up on the way except the one under test. */
function serveUntil(s: GameState, hm: string, except?: string): GameState {
  const target = clockTime(hm);
  while (s.phase === 'desk' && s.clock < target) {
    const id = s.escort ?? s.queue.find((x) => x !== except) ?? s.chats.find((x) => x !== except);
    s = s.outcomes.length ? next(s) : id ? solve(s, id) : tick(s, Math.min(1, target - s.clock));
  }
  return s;
}
/** Deal with everyone the moment they turn up, then go home and come back for the next day. */
function playDay(s: GameState, each: Act = solve): GameState {
  s = goTo(s, 'desk');
  while (s.phase === 'desk') {
    const id = s.escort ?? s.queue[0] ?? s.chats[0];
    s = s.outcomes.length ? next(s) : id ? each(s, id) : tick(s, 5);
  }
  return goHome(s);
}
/** Put everything off: pending or "can it wait?"; once that's used up, a workaround or a ticket; failing all that, fix it. */
const pushAll: Act = (s, id) => {
  if (s.chats.includes(id)) {
    const waited = later(s, id);
    if (waited !== s) return next(waited);
    const asked = askForTicket(s, id);
    return asked !== s ? next(asked) : solve(s, id);
  }
  return handle(s, id, (x, i) => {
    const pushed = pushBack(x, i);
    if (pushed !== x) return pushed;
    const worked = workaround(x, i);
    return worked !== x ? worked : fix(x, i, correct(i));
  });
};

/** Never resolve anything: put things off while you can, otherwise just let time pass. */
const lazy: Act = (s, id) => {
  const off = s.chats.includes(id) ? later(s, id) : pushBack(s, id);
  return off !== s ? next(off) : tick(s, 5);
};

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
    const s = fix(goNow(until(atDesk(), '9:05'), 't101'), 't101', 'jam');
    expect(tick(s, 30)).toBe(s);
  });

  it('ends the day at 5pm and carries anything unresolved over, a step grumpier', () => {
    let s = reply(serveUntil(atDesk(), '9:50'), 't102');
    while (s.phase === 'desk') s = s.outcomes.length ? next(s) : tick(reply(s, 't102'), 50); // keep her updated all day
    expect(s.clock).toBe(CLOSE);
    s = goTo(goHome(s), 'desk');
    expect(s.queue[0]).toBe('t102');
    expect(ticketState(s, 't102').messages[0]?.text).toMatch(/^Still waiting from yesterday/);
  });
});

describe('chat', () => {
  it('is how people skip the ticket system: friendly first, then the real reason', () => {
    const s = until(atDesk(), '9:05');
    expect(s.chats).toEqual(['t101']);
    expect(s.queue).toEqual([]);
    expect(ticketState(s, 't101').messages.map((m) => m.text)).toEqual([VILLAGERS.dot.opener, ticketById('t101').message]);
    expect(fix(s, 't101', 'jam')).toBe(s); // you can't fix it from your desk
  });

  it('"On my way" takes you to them; fixing it helps, but the manager doesn’t count it', () => {
    let s = goNow(until(atDesk(), '9:05'), 't101');
    expect(s).toMatchObject({ escort: 't101', place: 'floor', chats: [] });
    expect(s.clock).toBe(clockTime('9:10'));
    s = until(s, '10:00');
    expect(ticketState(s, 't101').mood).toBe(1); // they're with you, so no reply-by time
    s = next(fix(s, 't101', 'jam'));
    expect(s).toMatchObject({ escort: undefined, place: 'computer' });
    expect(s.today).toMatchObject({ helped: 1, resolved: 0 });
    expect(relation(s, 'dot')).toBe('friend');
  });

  it('"Can it wait?" annoys them and they ask again in an hour, at most twice', () => {
    let s = later(until(atDesk(), '9:05'), 't101');
    expect(ticketState(s, 't101')).toMatchObject({ mood: 2, pushes: 1, due: clockTime('9:05') + CHAT_LATER });
    s = later(s, 't101');
    expect(ticketState(s, 't101').pushes).toBe(2);
    expect(later(s, 't101')).toBe(s);
  });

  it('"Please log a ticket" annoys them once, then it lands in your queue and counts', () => {
    let s = next(askForTicket(until(atDesk(), '9:05'), 't101'));
    expect(s.chats).toEqual([]);
    s = until(s, '9:40');
    expect(s.queue).toContain('t101');
    expect(ticketState(s, 't101')).toMatchObject({ mood: 2, logged: true });
    expect(ticketState(s, 't101').messages[0]?.text).toMatch(/ticket you asked for/);
    s = next(fix(s, 't101', 'jam'));
    expect(s.today).toMatchObject({ resolved: 1, helped: 0 });
  });

  it('left unanswered, they get upset and eventually storm off', () => {
    let s = until(atDesk(), '9:20'); // Dot expects an answer within 15 minutes
    expect(ticketState(s, 't101').mood).toBe(2);
    s = until(s, '10:20');
    expect(s.outcomes).toEqual([{ ticketId: 't101', kind: 'storm', xp: 0 }]);
    expect(relation(s, 'dot')).toBe('nemesis');
  });

  it('can’t be answered while you’re off helping someone else', () => {
    const s = goNow(serveUntil(atDesk(), '11:30', 'f101'), 'f101');
    const busy = { ...s, chats: ['t101'] };
    expect(goNow(busy, 't101')).toBe(busy);
  });
});

describe('fixing', () => {
  it('resolves on the right fix and earns experience', () => {
    const s = fix(goNow(until(atDesk(), '9:05'), 't101'), 't101', 'jam');
    expect(s.xp.devices).toBe(2);
    expect(s.outcomes[0]).toMatchObject({ ticketId: 't101', kind: 'fix', xp: 2 });
    expect(s.clock).toBe(clockTime('9:25'));
  });

  it('costs patience for a wrong fix', () => {
    const s = fix(goNow(until(atDesk(), '9:05'), 't101'), 't101', 'ink');
    expect(s.notice?.text).toMatch(/still jammed/);
    expect(ticketState(s, 't101')).toMatchObject({ mood: 2, tried: ['ink'] });
  });

  it('turns the right internal note into a runbook page that makes the same problem quicker next time', () => {
    let s = fix(goNow(until(atDesk(), '9:05'), 't101'), 't101', 'jam');
    s = writeNote(s, 1);
    expect(s.outcomes[0]?.wrongNote).toBe(1);
    expect(s.runbook['paper-jam']).toBe('ok');
    s = next(writeNote(s, 0));
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
    expect(s.chats[0]).toBe('t101'); // Dot's back on chat first thing
    s = goNow(s, 't101');
    expect(workaround(s, 't101')).toBe(s);
  });

  it('pending sends them away until tomorrow, at most twice', () => {
    let s = handle(until(atDesk(), '9:05'), 't101', pushBack);
    expect(ticketState(s, 't101').status).toBe('pending');
    const pushDot: Act = (x, id) => (id === 't101' ? handle(x, id, pushBack) : solve(x, id));
    s = goTo(playDay(playDay(s), pushDot), 'desk');
    expect(s.chats[0]).toBe('t101');
    s = goNow(s, 't101');
    expect(pushBack(s, 't101')).toBe(s);
  });
});

describe('the day-3 loot drop', () => {
  /** Fix only these people's tickets and chats; put off everyone else. */
  const onlyHelp = (...who: string[]): Act => (s, id) => (who.includes(ticketById(id).who) ? solve(s, id) : pushAll(s, id));
  const toDay3 = (s: GameState, each: Act) => goTo(playDay(playDay(s, each), pushAll), 'desk');

  it('with no friends, you find Sam’s cheat sheet in the drawer', () => {
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

  it('gives a faster fix that isn’t in the runbook, until you write its page', () => {
    let s: GameState = { ...atDesk(), tools: ['tweezers'], runbook: { ...atDesk().runbook, 'tool:tweezers': 'missing' } };
    s = goNow(until(s, '9:05'), 't101');
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
    expect(playDay(newGame(), lazy).savings).toBe(START_SAVINGS - DAILY_COST);
  });

  it('burns out when savings run out', () => {
    expect(playDay({ ...newGame(), savings: DAILY_COST }, lazy).ending).toBe('burnout');
  });

  it('a good week can get you hired by the library, but not Big Ocean yet', () => {
    let s = newGame();
    const fixAndNote: Act = (x, id) => handle(x, id, (y, i) => writeNote(fix(admin(y, i), i, correct(i)), 0));
    while (s.day <= DAYS) s = playDay(s, fixAndNote);
    expect(apply(s, 'ocean')).toBe(s);
    expect(apply(s, 'library').ending).toBe('hired');
    expect(acceptOffer(s).ending).toBe('stay');
  });
});

describe('Active Registry', () => {
  /** Day 3, with Otis's lockout ticket in the queue. */
  const otisLocked = () => {
    let s = newGame();
    while (s.day < 3) s = goHome(serveUntil(goTo(s, 'desk'), '17:00'));
    return serveUntil(goTo(s, 'desk'), '15:41', 't306');
  };

  it('locks the account for real when a lockout ticket arrives, and only unlocking fixes it', () => {
    let s = otisLocked();
    expect(s.accounts.otis?.locked).toBe(true);
    s = fix(s, 't306', 'console');
    expect(s.notice?.text).toMatch(/Still locked out/);
    expect(ticketState(s, 't306').status).toBe('open');
    s = fix(unlockAccount(s, 'otis'), 't306', 'console');
    expect(s.outcomes.at(-1)).toMatchObject({ ticketId: 't306', kind: 'fix' });
  });

  it('a forgotten password needs a reset that makes them choose their own', () => {
    let s = newGame();
    s = goHome(serveUntil(goTo(s, 'desk'), '17:00'));
    s = serveUntil(goTo(s, 'desk'), '16:01', 't206');
    expect(accountProblem(s, ticketById('t206'))).toMatch(/Reset it/);
    s = resetPassword(s, 'biscuit', { mustChange: false, unlock: true });
    expect(accountProblem(s, ticketById('t206'))).toMatch(/must change password at next logon/);
    s = resetPassword(s, 'biscuit', { mustChange: true, unlock: true });
    expect(accountProblem(s, ticketById('t206'))).toBeUndefined();
    expect(setEnabled(s, 'biscuit', false).accounts.biscuit?.enabled).toBe(false);
    expect(accountProblem(setEnabled(s, 'biscuit', false), ticketById('t206'))).toMatch(/disabled/);
  });

  it('starts with Sam\u2019s old account still switched on', () => {
    expect(newGame().accounts.sam).toMatchObject({ enabled: true, title: 'IT Administrator' });
  });
});

describe('saves', () => {
  it('round-trips a real game and rejects junk', () => {
    const s = solve(until(atDesk(), '9:05'), 't101');
    expect(parseSave(JSON.stringify(s))).toEqual(s);
    expect(parseSave('{nope')).toBeUndefined();
    expect(parseSave(JSON.stringify({ ...s, version: 7 }))).toBeUndefined();
    expect(parseSave(JSON.stringify({ ...s, queue: ['not-a-ticket'] }))).toBeUndefined();
    // A save from before Active Registry still loads, with everyone's accounts as Sam left them.
    const older: Omit<Partial<GameState>, 'version'> & { version: number } = { ...s, version: 8 };
    delete older.accounts;
    delete older.newsRead;
    expect(parseSave(JSON.stringify(older))).toMatchObject({ version: 9, newsRead: 0, accounts: newGame().accounts });
  });
});
