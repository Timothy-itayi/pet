import { describe, expect, it } from 'vitest';
import { DAILY_COST, DAYS, GOAL_VOUCHER, START_SAVINGS } from './data.ts';
import {
  acceptOffer, apply, ask, endDay, fix, goHome, goTo, inspect, newGame, next, parseSave, progressOf, pushBack, ticketById,
  relation, visibleClues, workaround,
  type GameState,
} from './rules.ts';

const atDesk = () => goTo(newGame(), 'desk');
/** Ask only the questions that uncover the problem, then compare and fix. */
const investigate = (s: GameState) => {
  const t = ticketById(s.queue[0] ?? '');
  return t.questions.filter((q) => q.reveals && t.mismatch.includes(q.reveals)).reduce((x, q) => ask(x, q.id), s);
};
const solveCurrent = (s: GameState) => {
  const t = ticketById(s.queue[0] ?? '');
  return next(fix(inspect(investigate(s), ...t.mismatch).state, t.correctFix));
};

describe('a ticket', () => {
  it('keeps clues hidden until a question reveals them, and locks comparing until then', () => {
    let s = atDesk();
    expect(visibleClues(s, ticketById('out-of-ink')).map((c) => c.id)).toEqual(['said']);
    expect(inspect(s, 'said', 'panel').state).toBe(s);
    s = ask(s, 'screen');
    expect(visibleClues(s, ticketById('out-of-ink')).map((c) => c.id)).toEqual(['said', 'panel']);
    expect(inspect(s, 'said', 'panel').found).toBe(true);
  });

  it('gets angrier with annoying questions and wrong fixes, then storms off to the manager', () => {
    let s = atDesk(); // Dot starts Annoyed
    s = ask(s, 'restart');
    expect(progressOf(s, 'out-of-ink').mood).toBe(2);
    s = ask(ask(s, 'screen'), 'sent'); // useful questions don't upset anyone
    expect(progressOf(s, 'out-of-ink').mood).toBe(2);
    s = fix(inspect(s, 'said', 'panel').state, 'ink');
    expect(progressOf(s, 'out-of-ink').mood).toBe(3);
    s = fix(s, 'driver');
    expect(s.outcome).toEqual({ ticketId: 'out-of-ink', kind: 'storm', xp: 0 });
    expect(s.today).toMatchObject({ complaints: 1, closed: 0 });
    expect(s.queue[0]).toBe('internet-down');
  });

  it('brings people back grumpier after a push-back, but not already furious', () => {
    let s = ask(atDesk(), 'restart'); // Dot: Upset
    s = next(pushBack(s));
    expect(progressOf(s, 'out-of-ink').mood).toBe(2);
    s = next(pushBack({ ...s, queue: ['internet-down'] })); // Juniper: Upset -> stays Upset
    expect(progressOf(s, 'internet-down').mood).toBe(2);
  });

  it('only unlocks fixes once the real mismatch is spotted', () => {
    let s = investigate(atDesk());
    expect(fix(s, 'jam')).toBe(s);
    const wrong = inspect(s, 'said', 'queue');
    expect(wrong.found).toBe(false);
    s = inspect(s, 'panel', 'said').state;
    expect(s.progress['out-of-ink']?.found).toBe(true);
  });

  it('gives full experience for the right fix and nothing for a wrong one', () => {
    let s = inspect(investigate(atDesk()), 'said', 'panel').state;
    s = fix(s, 'ink');
    expect(s.queue[0]).toBe('out-of-ink');
    expect(s.notice).toMatch(/70%/);
    expect(s.xp.devices).toBe(0);
    s = fix(s, 'jam');
    expect(s.queue[0]).toBe('internet-down');
    expect(s.xp.devices).toBe(2);
    expect(s.outcome).toEqual({ ticketId: 'out-of-ink', kind: 'fix', xp: 2 });
  });

  it('repairs its runbook page when fixed', () => {
    let s = solveCurrent(solveCurrent(atDesk()));
    s = goTo(goHome(endDay(s)), 'desk');
    expect(s.runbook['slow-laptop']).toBe('outdated');
    s = solveCurrent(s);
    expect(s.runbook['slow-laptop']).toBe('updated');
  });

  it('comes back two days after a workaround, and the workaround cannot be used twice', () => {
    let s = next(workaround(atDesk()));
    expect(s.xp.devices).toBe(1);
    expect(s.returning).toEqual([{ id: 'out-of-ink', day: 3 }]);
    for (let day = 1; day < 3; day++) {
      while (s.queue.length) s = solveCurrent(s);
      s = goTo(goHome(endDay(s)), 'desk');
    }
    expect(s.queue[0]).toBe('out-of-ink');
    expect(workaround(s)).toBe(s);
  });

  it('can be pushed back twice, then must be dealt with', () => {
    let s = atDesk();
    for (let i = 0; i < 2; i++) {
      s = next(pushBack(s));
      while (s.queue.length) s = solveCurrent(s);
      s = goTo(goHome(endDay(s)), 'desk');
      expect(s.queue[0]).toBe('out-of-ink');
    }
    expect(pushBack(s)).toBe(s);
  });
});

describe('comparing clues', () => {
  it('works any time both clues are on the desk, but a wrong guess costs patience', () => {
    let s = ask(ask(atDesk(), 'screen'), 'sent'); // Dot: Annoyed
    s = inspect(s, 'said', 'queue').state;
    expect(s.notice).toMatch(/add up fine/);
    expect(progressOf(s, 'out-of-ink').mood).toBe(2);
    expect(inspect(s, 'said', 'panel').found).toBe(true);
  });
});

describe('friends and nemeses', () => {
  const at = (s: GameState, id: string): GameState => ({ ...s, queue: [id] });

  it('a clean fix makes a friend, who comes back calmer and forgives wrong guesses', () => {
    let s = solveCurrent(solveCurrent(atDesk())); // Dot and Juniper, no slips
    expect(relation(s, 'juniper')).toBe('friend');
    expect(s.today.bonds).toEqual([{ who: 'dot', now: 'friend' }, { who: 'juniper', now: 'friend' }]);
    s = at(s, 'monitor'); // Juniper usually arrives Upset
    expect(progressOf(s, 'monitor').mood).toBe(1);
    s = inspect(ask(ask(s, 'message'), 'back'), 'said', 'screen').state;
    expect(s.notice).toMatch(/friends don.t mind/);
    expect(progressOf(s, 'monitor').mood).toBe(1);
  });

  it('storming off makes a nemesis, who comes back angrier', () => {
    let s = at(atDesk(), 'slow-laptop'); // Marlo: Annoyed
    s = ask(ask(s, 'tabs'), 'spill');
    s = fix(inspect(ask(s, 'new'), 'runbook', 'memo').state, 'new');
    expect(s.outcome?.kind).toBe('storm');
    expect(relation(s, 'marlo')).toBe('nemesis');
    expect(progressOf(at(s, 'admin'), 'admin').mood).toBe(1); // usually Calm
  });

  it('a messy fix holds a grudge, and a clean fix wins them back', () => {
    let s = at(atDesk(), 'charger'); // Biscuit: Calm
    s = ask(ask(s, 'drop'), 'charger');
    s = inspect(ask(s, 'bottom'), 'said', 'charger').state; // second slip
    s = next(fix(inspect(s, 'charger', 'sticker').state, 'swap'));
    expect(relation(s, 'biscuit')).toBe('nemesis');
    s = solveCurrent(at({ ...s, today: { ...s.today, bonds: [] } }, 'wrong-printer'));
    expect(relation(s, 'biscuit')).toBe('neutral');
    expect(s.today.bonds).toEqual([{ who: 'biscuit', now: 'neutral' }]);
  });
});

describe('a day', () => {
  it('cannot end while people are waiting', () => {
    const s = atDesk();
    expect(endDay(s)).toBe(s);
  });

  it('pays a voucher only when the goal is met, and always costs bus fare and food', () => {
    let met = atDesk();
    while (met.queue.length) met = solveCurrent(met);
    expect(endDay(met).savings).toBe(START_SAVINGS + GOAL_VOUCHER - DAILY_COST);

    let missed = atDesk();
    while (missed.queue.length) missed = next(pushBack(missed));
    expect(endDay(missed).savings).toBe(START_SAVINGS - DAILY_COST);
  });
});

describe('endings', () => {
  const playWeek = (play: (s: GameState) => GameState) => {
    let s = newGame();
    while (s.phase !== 'ending' && s.day <= DAYS) {
      s = goTo(s, 'desk');
      while (s.queue.length) s = play(s);
      s = goHome(endDay(s));
    }
    return s;
  };

  it('burns out when savings run out', () => {
    let s: GameState = { ...atDesk(), savings: DAILY_COST };
    while (s.queue.length) s = next(pushBack(s));
    expect(goHome(endDay(s)).ending).toBe('burnout');
  });

  it('can get hired by the library after a good week, but not by Big Ocean yet', () => {
    const s = playWeek(solveCurrent);
    expect(s.day).toBe(DAYS + 1);
    expect(apply(s, 'ocean')).toBe(s);
    expect(apply(s, 'library').ending).toBe('hired');
  });

  it('can stay for minimum wage once the week is over', () => {
    expect(acceptOffer(newGame())).toEqual(newGame());
    expect(acceptOffer(playWeek(solveCurrent)).ending).toBe('stay');
  });
});

describe('saves', () => {
  it('round-trips a real game and rejects junk', () => {
    const s = solveCurrent(atDesk());
    expect(parseSave(JSON.stringify(s))).toEqual(s);
    expect(parseSave('{nope')).toBeUndefined();
    expect(parseSave(JSON.stringify({ ...s, version: 2 }))).toBeUndefined();
    expect(parseSave(JSON.stringify({ ...s, queue: ['not-a-ticket'] }))).toBeUndefined();
  });
});
