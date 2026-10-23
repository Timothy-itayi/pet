import { describe, expect, it } from 'vitest';
import { CLOSE, DAILY_COST, LOCKUP, DAYS, GOAL_VOUCHER, ISSUES, REPLIES, START_SAVINGS, THANKS, TICKETS, TOOLS, VILLAGERS } from './data.ts';
import { addApp, addGroup, addRule, assignApp, createFromHr, resetMfa, setActive, updateFromHr } from './identity.ts';
import { appsOf, groupsOf, newOkta } from './oktopus.ts';
import {
  accountProblem, acceptOffer, apply, ask, askForTicket, clockOut, clockTime, fixFor, goHome, goTo, issueOf, newGame, next, noteProblem, noteTarget, parseSave,
  pushBack, relation, reply, resetPassword, resolve, setEnabled, suggest, tick, ticketById, ticketState, unlockAccount, workaround, writeNote, type GameState,
} from './rules.ts';

type Act = (s: GameState, id: string) => GameState;
const atDesk = () => goTo(newGame(), 'desk');
/** Let the office clock run to a given time. */
const until = (s: GameState, hm: string) => tick(s, clockTime(hm) - s.clock);
const correct = (id: string) => (issueOf(ticketById(id)).console ? 'console' : fixFor(ticketById(id)));
/** Let the clock run until the caller is done with what you asked, or a card comes up. */
function waitForCaller(s: GameState, id: string): GameState {
  while (s.tickets[id]?.caller && s.tickets[id]?.caller?.doing !== 'confirmed' && s.clock < LOCKUP && !s.outcomes.length) s = tick(s, 1);
  return s;
}
/** Suggest something and wait to hear how it went. */
const tryIt = (s: GameState, id: string, fixId: string) => waitForCaller(suggest(s, id, fixId), id);
/** Suggest something and, if they say it worked, resolve it. */
const fix = (s: GameState, id: string, fixId: string) => resolve(tryIt(s, id, fixId), id);
/** Marketing on Oktopus the right way: people from HR, a department group filled by a rule. */
function setUpMarketing(s: GameState): GameState {
  for (const login of ['juniper', 'wren', 'basil']) s = createFromHr(s, login);
  s = addGroup(s, 'DEPT-Marketing');
  return s.okta.rules.length ? s : addRule(s, { group: 'DEPT-Marketing', dept: 'Marketing' });
}
/** Hootsweet the right way: its own APP- group, filled from Marketing's group, and the app assigned to that. */
function giveMarketingHootsweet(s: GameState): GameState {
  s = addGroup(addApp(setUpMarketing(s), 'hootsweet'), 'APP-Hootsweet-Users');
  if (!s.okta.rules.some((r) => r.group === 'APP-Hootsweet-Users')) s = addRule(s, { group: 'APP-Hootsweet-Users', memberOf: 'DEPT-Marketing' });
  return assignApp(s, 'hootsweet', 'APP-Hootsweet-Users');
}
/** For tickets fixed in an admin console, do the work there first, the right way. */
function admin(s: GameState, id: string): GameState {
  const t = ticketById(id);
  switch (issueOf(t).console) {
    case 'unlock': return unlockAccount(s, t.who);
    case 'reset': return resetPassword(s, t.who, { mustChange: true, unlock: true });
    case 'disable': return setEnabled(s, 'sam', false);
    case 'okta-setup': return setUpMarketing(s);
    case 'okta-app': return giveMarketingHootsweet(s);
    case 'joiner': return createFromHr(giveMarketingHootsweet(s), 'fern');
    case 'mover': return updateFromHr(s, 'basil');
    case 'leaver': return setActive(s, 'wren', false);
    case 'mfa': return resetMfa(s, t.who);
    case undefined: return s;
  }
}
/** Do something about a ticket. A chat request gets "please log a ticket" first; you deal with it when it lands. */
function handle(s: GameState, id: string, act: Act): GameState {
  return next(s.chats.includes(id) ? askForTicket(s, id) : act(s, id));
}
/** Day 1: Dot's printer ticket, submitted at 9:05. */
const dotsTicket = (s = atDesk()) => until(s, '9:06');
/** The same morning, with Dot already your friend: friends message you on chat instead. */
const dotAsFriend = () => { const s = atDesk(); return { ...s, bonds: { ...s.bonds, dot: 1 } }; };
const solve = (s: GameState, id: string) => handle(s, id, (x, i) => fix(admin(x, i), i, correct(i)));
/** Run the clock to a time, dealing with everything that turns up on the way except the one under test. */
function serveUntil(s: GameState, hm: string, except?: string): GameState {
  const target = clockTime(hm);
  while (s.phase === 'desk' && s.clock < target) {
    const id = s.queue.find((x) => x !== except) ?? s.chats.find((x) => x !== except);
    s = s.outcomes.length ? next(s) : id ? solve(s, id) : tick(s, Math.min(1, target - s.clock));
  }
  return s;
}
/** Deal with everyone until 5pm, then go home on time. */
function workDay(s: GameState): GameState {
  s = serveUntil(goTo(s, 'desk'), '17:00');
  while (s.outcomes.length) s = next(s);
  return goHome(clockOut(s));
}
/** Deal with everyone the moment they turn up, then go home and come back for the next day. */
function playDay(s: GameState, each: Act = solve): GameState {
  s = goTo(s, 'desk');
  while (s.phase === 'desk') {
    const id = s.queue[0] ?? s.chats[0];
    s = s.outcomes.length ? next(s) : id ? each(s, id) : tick(s, 5);
  }
  return goHome(s);
}
/** Put everything off: pending while you can, then a workaround; failing all that, fix it. Chats get "log a ticket". */
const pushAll: Act = (s, id) => {
  return handle(s, id, (x, i) => {
    const pushed = pushBack(x, i);
    if (pushed !== x) return pushed;
    const worked = workaround(x, i);
    return worked !== x ? worked : fix(x, i, correct(i));
  });
};

/** Never resolve anything: put tickets off while you can, otherwise just let time pass. */
const lazy: Act = (s, id) => {
  const off = s.queue.includes(id) ? pushBack(s, id) : s;
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

  it('lets people wait: in IT, waiting is normal, so leaving a ticket a while doesn\u2019t make anyone crosser', () => {
    const s = until(serveUntil(atDesk(), '9:50'), '13:00');
    expect(ticketState(s, 't102').mood).toBe(2);
    expect(s.queue).toContain('t102');
    expect(s.outcomes).toEqual([]);
  });

  it('a nemesis let down while Furious complains to the manager, once, and the ticket is still yours', () => {
    const start = atDesk();
    let s = serveUntil({ ...start, bonds: { ...start.bonds, juniper: -2 } }, '9:51', 't102');
    s = tryIt(s, 't102', 'router');
    expect(ticketState(s, 't102').mood).toBe(3);
    s = tryIt(s, 't102', 'isp');
    expect(s.outcomes).toEqual([{ ticketId: 't102', kind: 'complaint', xp: 0, grave: false }]);
    expect(s.today.complaints).toBe(1);
    expect(next(s).queue).toContain('t102');
  });

  it('replying marks the ticket open and tells them it\u2019s in hand', () => {
    const s = reply(serveUntil(atDesk(), '9:50'), 't102');
    expect(ticketState(s, 't102').status).toBe('open');
    expect(ticketState(s, 't102').messages.at(-1)).toMatchObject({ from: 'you', text: REPLIES.first });
  });

  it('stops the clock while a card is up', () => {
    const s = fix(dotsTicket(), 't101', 'jam');
    expect(tick(s, 30)).toBe(s);
  });

  it('ends the day when the building locks at 6 and carries anything unresolved over to tomorrow, no crosser', () => {
    let s = reply(serveUntil(atDesk(), '9:50'), 't102');
    while (s.phase === 'desk') s = s.outcomes.length ? next(s) : tick(reply(s, 't102'), 50); // keep her updated all day
    expect(s.clock).toBe(LOCKUP);
    expect(s.today.overtime).toBe(60);
    s = goTo(goHome(s), 'desk');
    expect(s.queue[0]).toBe('t102');
    expect(ticketState(s, 't102').messages[0]?.text).toMatch(/^Still waiting from yesterday/);
    expect(ticketState(s, 't102').mood).toBe(2);
  });
});

describe('staying late', () => {
  it('after 5pm nothing new comes in, but you can finish what you were on, and it counts', () => {
    let s = until(serveUntil(atDesk(), '16:50', 't102'), '17:00');
    expect(s.phase).toBe('desk');
    const waiting = s.queue.length + s.chats.length + s.arriving.length;
    s = fix(s, 't102', correct('t102'));
    expect(s.clock).toBeGreaterThan(CLOSE);
    expect(s.today.resolved).toBeGreaterThan(0);
    s = next(s);
    expect(s.queue.length + s.chats.length + s.arriving.length).toBe(waiting - 1);
  });

  it('you can only go home after 5, and the summary counts your unpaid overtime', () => {
    let s = until(atDesk(), '16:59');
    expect(clockOut(s)).toBe(s);
    s = clockOut(tick(s, 21));
    expect(s.phase).toBe('dayEnd');
    expect(s.today.overtime).toBe(20);
  });
});

describe('chat', () => {
  it('is only for friends: everyone else submits a ticket', () => {
    expect(until(atDesk(), '9:05')).toMatchObject({ queue: ['t101'], chats: [] });
    const s = until(dotAsFriend(), '9:05');
    expect(s).toMatchObject({ queue: [], chats: ['t101'] });
    expect(ticketState(s, 't101').messages[0]?.text).toBe(VILLAGERS.dot.opener);
    expect(ticketState(s, 't101').messages[1]?.text).toContain(ticketById('t101').message);
    expect(fix(s, 't101', 'jam')).toBe(s); // a chat isn't a ticket: you can't fix it until it's logged
  });

  it('"Please log a ticket" annoys a friend, but it\u2019s the rule, not your fault: it lands in your queue and counts', () => {
    let s = next(askForTicket(until(dotAsFriend(), '9:05'), 't101'));
    expect(s.chats).toEqual([]);
    s = until(s, '9:40');
    expect(s.queue).toContain('t101');
    expect(ticketState(s, 't101')).toMatchObject({ mood: 1, logged: true, asked: true, slips: 0 });
    expect(ticketState(s, 't101').messages.at(-1)?.text).toMatch(/ticket you asked for/);
    s = next(fix(s, 't101', 'jam'));
    expect(s.today.resolved).toBe(1);
    expect(relation(s, 'dot')).toBe('friend');
  });

  it('waiting on chat doesn\u2019t upset them either', () => {
    const s = until(dotAsFriend(), '12:00');
    expect(s.chats).toContain('t101');
    expect(ticketState(s, 't101').mood).toBe(0);
  });
});

describe('troubleshooting with the caller', () => {
  it('asking a question gets their answer a few office minutes later, and you can work on other things meanwhile', () => {
    const before = dotsTicket(goTo(newGame(0), 'desk')); // a game where Dot takes 5 minutes to answer
    let s = ask(before, 't101', 'screen');
    expect(s.clock - before.clock).toBe(2);
    expect(ticketState(s, 't101')).toMatchObject({ status: 'open', caller: { doing: 'answer', id: 'screen' } });
    expect(ask(s, 't101', 'tray')).toBe(s); // one thing at a time
    s = waitForCaller(s, 't101');
    expect(s.clock - before.clock).toBeGreaterThanOrEqual(2);
    expect(s.clock - before.clock).toBeLessThanOrEqual(5);
    expect(ticketState(s, 't101').messages.at(-1)).toMatchObject({ from: 'them', text: 'PAPER JAM \u2013 TRAY 2. Ink: 70%' });
    expect(ticketState(s, 't101').heard).toEqual(['screen']);
    s = waitForCaller(ask(s, 't101', 'tray'), 't101'); // nothing to find in Dot's trays: she says so
    expect(ticketState(s, 't101').messages.at(-1)?.text).toBe('Paper in both trays. Nothing stuck that I can see.');
  });

  it('someone with an urgent ticket gets back to you quicker', () => {
    const s = ask(serveUntil(atDesk(), '9:50'), 't102', 'others'); // Juniper's is high priority
    expect(ticketState(s, 't102').caller).toBeUndefined();
    expect(ticketState(s, 't102').messages.at(-1)).toMatchObject({ from: 'them', text: 'Everyone else is happily online.' });
  });

  it('every runbook example would pass as a typed note', () => {
    for (const { note } of [...ISSUES, ...TOOLS]) expect(noteProblem(note, note.example), note.example).toBeUndefined();
  });

  it('resolves only once they confirm it works, and earns experience', () => {
    let s = suggest(dotsTicket(), 't101', 'jam');
    expect(resolve(s, 't101')).toBe(s);
    s = waitForCaller(s, 't101');
    expect(ticketState(s, 't101').caller).toEqual({ doing: 'confirmed', id: 'jam' });
    expect(ticketState(s, 't101').messages.at(-1)?.text).toBe(THANKS[1]);
    s = resolve(s, 't101');
    expect(s.xp.devices).toBe(2);
    expect(s.outcomes[0]).toMatchObject({ ticketId: 't101', kind: 'fix', xp: 2 });
  });

  it('costs patience for a wrong suggestion', () => {
    const s = tryIt(dotsTicket(), 't101', 'ink');
    expect(s.notice?.text).toMatch(/still jammed/);
    expect(ticketState(s, 't101')).toMatchObject({ mood: 2, tried: ['ink'] });
  });

  it('turning it off and on again is always worth a go: when it isn\u2019t that, no harm done', () => {
    const s = tryIt(dotsTicket(), 't101', 'offon');
    expect(ticketState(s, 't101')).toMatchObject({ mood: 1, slips: 0, tried: ['offon'] });
    expect(ticketState(s, 't101').messages.at(-1)?.text).toMatch(/beeped cheerfully/);
    expect(s.today.wrongFixes).toBe(0);
    expect(s.notice).toBeUndefined();
  });

  it('a dead mouse: fresh batteries first; when that doesn\u2019t do it, it\u2019s broken, so a spare', () => {
    let s = goTo(playDay(newGame()), 'desk');
    s = serveUntil(s, '11:21', 't205');
    s = waitForCaller(ask(s, 't205', 'kind'), 't205');
    expect(ticketState(s, 't205').messages.at(-1)?.text).toMatch(/^Wireless/);
    s = tryIt(s, 't205', 'battery');
    expect(ticketState(s, 't205').messages.at(-1)?.text).toMatch(/Fresh batteries in. Still nothing/);
    expect(ticketState(s, 't205').slips).toBe(0);
    s = resolve(tryIt(s, 't205', 'spare'), 't205');
    expect(s.outcomes.at(-1)).toMatchObject({ ticketId: 't205', kind: 'fix' });
  });

  it('a grave mistake goes to the manager whoever it was for, and still has to be put right', () => {
    let s = newGame();
    while (s.day < 3) s = playDay(s);
    s = tryIt(serveUntil(goTo(s, 'desk'), '14:01', 't304'), 't304', 'set'); // reading out Dot's new password
    expect(s.outcomes.at(-1)).toMatchObject({ ticketId: 't304', kind: 'complaint', grave: true });
    expect(s.today.complaints).toBe(1);
    expect(s.queue).toContain('t304');
  });

  it('turns a work note you type into a runbook page, if it says what was really wrong', () => {
    let s = fix(dotsTicket(), 't101', 'jam');
    s = writeNote(s, 'fixed');
    expect(s.outcomes[0]?.noteMiss).toMatch(/Write a sentence/);
    s = writeNote(s, 'It was out of ink, ordered more.');
    expect(s.outcomes[0]?.noteMiss).toMatch(/doesn\u2019t say what was really wrong/);
    expect(s.runbook['paper-jam']).toBe('ok');
    s = next(writeNote(s, '  Paper JAMMED in tray 2, the screen said so. Cleared it.  '));
    expect(s.runbook['paper-jam']).toBe('yours');
    expect(s.written['paper-jam']).toBe('Paper JAMMED in tray 2, the screen said so. Cleared it.');
    expect(s.xp.devices).toBe(3);
  });

  it('every clue can be found with a question, and every ticket\u2019s real fix can be suggested', () => {
    for (const t of TICKETS) {
      const issue = issueOf(t);
      expect(issue.asks.length, issue.id).toBeGreaterThanOrEqual(3);
      for (const d of t.details) if (d.ask) expect(issue.asks.map((a) => a.id), t.id).toContain(d.ask);
      if (!issue.console) expect(issue.fixes.map((f) => f.id), t.id).toContain(fixFor(t));
    }
  });

  it('loads a save from before you could ask questions', () => {
    const s = dotsTicket();
    const old = JSON.parse(JSON.stringify(s)) as { tickets: Record<string, { heard?: string[] }> };
    delete old.tickets.t101?.heard;
    expect(parseSave(JSON.stringify(old))?.tickets.t101?.heard).toEqual([]);
  });
});

describe('friends and nemeses', () => {
  it('a fix with no slips makes a friend, who is calmer, more patient and forgiving next time', () => {
    let s = next(fix(dotsTicket(), 't101', 'jam'));
    expect(relation(s, 'dot')).toBe('friend');
    s = playDay(s);
    s = serveUntil(goTo(s, 'desk'), '11:20', 't205'); // Dot's mouse on day 2; usually Annoyed, normal priority
    expect(ticketState(s, 't205').mood).toBe(0);
    s = tryIt(s, 't205', 'driver');
    expect(s.notice?.text).toMatch(/encouraging smile/);
    expect(ticketState(s, 't205').mood).toBe(0);
  });
});

describe('workarounds and pending', () => {
  it('a workaround resolves for now, but it comes back in two days and only works once', () => {
    let s = next(workaround(dotsTicket(), 't101'));
    expect(s.xp.devices).toBe(1);
    expect(s.returning).toEqual([{ id: 't101', day: 3 }]);
    s = goTo(playDay(playDay(s)), 'desk');
    s = until(s, '9:01');
    expect(s.queue).toContain('t101'); // Dot's ticket is back first thing: it broke again, so she's crosser
    expect(ticketState(s, 't101').messages.at(-1)?.text).toMatch(/broken again/);
    expect(workaround(s, 't101')).toBe(s);
  });

  it('pending sends them away until tomorrow, at most twice', () => {
    let s = next(pushBack(dotsTicket(), 't101'));
    expect(ticketState(s, 't101').status).toBe('pending');
    const pushDot: Act = (x, id) => (id === 't101' ? handle(x, id, pushBack) : solve(x, id));
    s = until(goTo(playDay(playDay(s), pushDot), 'desk'), '9:01');
    expect(s.queue).toContain('t101');
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
    s = dotsTicket(s);
    const before = s.clock;
    s = fix(s, 't101', 'tool');
    expect(s.clock - before).toBeLessThanOrEqual(8);
    const card = s.outcomes[0];
    expect(card?.tool).toBe('tweezers');
    expect(card && noteTarget(s, card)?.title).toMatch(/tweezers/);
    s = writeNote(s, 'The tweezers reach paper deep in the tray.');
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

  it('two good weeks get you hired by the library; Big Ocean also wants you to have written up what you learned', () => {
    const play = (each: Act) => { let s = newGame(); while (s.day <= DAYS) s = playDay(s, each); return s; };
    const fixesOnly = play((x, id) => handle(x, id, (y, i) => fix(admin(y, i), i, correct(i))));
    expect(apply(fixesOnly, 'ocean')).toBe(fixesOnly);
    expect(apply(fixesOnly, 'library').ending).toBe('hired');
    expect(acceptOffer(fixesOnly).ending).toBe('stay');
    const withNotes = play((x, id) => handle(x, id, (y, i) => writeNote(fix(admin(y, i), i, correct(i)), noteTarget(y, { ticketId: i, kind: 'fix', xp: 0 })?.note.example ?? '')));
    expect(apply(withNotes, 'ocean').ending).toBe('hired');
  });
});

describe('Active Directory', () => {
  /** Day 3, with Otis's lockout ticket in the queue. */
  const otisLocked = () => {
    let s = newGame();
    while (s.day < 3) s = workDay(s);
    return serveUntil(goTo(s, 'desk'), '15:41', 't306');
  };

  it('locks the account for real when a lockout ticket arrives, and only unlocking fixes it', () => {
    let s = otisLocked();
    expect(s.accounts.otis?.locked).toBe(true);
    s = tryIt(s, 't306', 'console');
    expect(s.notice?.text).toMatch(/Still locked out/);
    expect(ticketState(s, 't306').status).toBe('open');
    s = fix(unlockAccount(s, 'otis'), 't306', 'console');
    expect(s.outcomes.at(-1)).toMatchObject({ ticketId: 't306', kind: 'fix' });
  });

  it('a forgotten password needs a reset that makes them choose their own', () => {
    let s = newGame();
    s = workDay(s);
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

describe('Oktopus', () => {
  /** A given morning in week 2, with everything before it done properly. */
  function morningOf(day: number): GameState {
    let s = newGame();
    while (s.day < day) s = workDay(s);
    return goTo(s, 'desk');
  }

  it('gives an app to everyone a rule puts in its group, and to nobody else', () => {
    const s = giveMarketingHootsweet(morningOf(6));
    expect(groupsOf(s.okta, 'juniper')).toEqual(['Everyone', 'DEPT-Marketing', 'APP-Hootsweet-Users']);
    expect(appsOf(s.okta, 'basil')).toEqual(['hootsweet']);
    expect(appsOf(s.okta, 'marlo')).toEqual([]);
    // Assigning it to Everyone works for Marketing, and gives it to the whole company.
    const loose = createFromHr(assignApp(s, 'hootsweet', 'Everyone'), 'marlo');
    expect(accountProblem(loose, ticketById('t602'))).toMatch(/Marlo can see Hootsweet too/);
  });

  it('a mover keeps their account, and the rules take their old team\u2019s app away', () => {
    let s = serveUntil(morningOf(8), '9:31', 't801');
    expect(accountProblem(s, ticketById('t801'))).toMatch(/still thinks Basil is in Marketing/);
    expect(accountProblem(setActive(s, 'basil', false), ticketById('t801'))).toMatch(/he didn\u2019t leave/);
    s = updateFromHr(s, 'basil');
    expect(s.okta.users.basil).toMatchObject({ dept: 'Sales', status: 'active' });
    expect(appsOf(s.okta, 'basil')).toEqual([]);
    expect(accountProblem(s, ticketById('t801'))).toBeUndefined();
  });

  it('a joiner comes from HR and gets their apps from the rules; a leaver loses everything at once', () => {
    let s = serveUntil(morningOf(7), '9:16', 't701');
    expect(accountProblem(s, ticketById('t701'))).toMatch(/Fern isn\u2019t in Oktopus/);
    s = createFromHr(s, 'fern');
    expect(appsOf(s.okta, 'fern')).toEqual(['hootsweet']);
    expect(createFromHr(s, 'nobody')).toBe(s);
    s = setActive(s, 'fern', false);
    expect(appsOf(s.okta, 'fern')).toEqual([]);
    expect(s.okta.log.at(-1)).toMatchObject({ event: 'user.lifecycle.deactivate', target: 'fern' });
  });

  it('refuses groups with no name or the same name twice', () => {
    const s = addGroup(newGame(), 'DEPT-Marketing');
    expect(addGroup(s, '  ')).toBe(s);
    expect(addGroup(s, 'DEPT-Marketing')).toBe(s);
  });
});

describe('saves', () => {
  it('round-trips a real game and rejects junk', () => {
    const s = solve(until(atDesk(), '9:05'), 't101');
    expect(parseSave(JSON.stringify(s))).toEqual(s);
    expect(parseSave('{nope')).toBeUndefined();
    expect(parseSave(JSON.stringify({ ...s, version: 7 }))).toBeUndefined();
    expect(parseSave(JSON.stringify({ ...s, queue: ['not-a-ticket'] }))).toBeUndefined();
    // A save from before Active Directory still loads, with everyone's accounts as Sam left them.
    const older: Omit<Partial<GameState>, 'version'> & { version: number } = { ...s, version: 8 };
    delete older.accounts;
    delete older.newsRead;
    expect(parseSave(JSON.stringify(older))).toMatchObject({ version: 11, newsRead: 0, accounts: newGame().accounts, okta: newOkta() });
    // A save from when you could go over in person, mid-visit, with someone storming off: back at your desk, waiting on chat.
    const visiting = { ...s, version: 10, place: 'floor', escort: 't101', chats: [], outcomes: [{ ticketId: 't102', kind: 'storm', xp: 0 }] };
    const loaded = parseSave(JSON.stringify(visiting));
    expect(loaded).toMatchObject({ version: 11, chats: ['t101'], outcomes: [] });
    expect(loaded && 'escort' in loaded).toBe(false);
  });
});
