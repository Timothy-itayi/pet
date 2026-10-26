import { describe, expect, it } from 'vitest';
import { duckLine, methodStars, standing } from './notebook.ts';
import { LOCKUP } from './data.ts';
import { ask, clockTime, goTo, newGame, next, recordClue, resolve, ruleOut, suggest, tick, ticketById, ticketState, type GameState } from './rules.ts';

/** Day 1, Juniper's "the internet is down" ticket just in (9:50): it's airplane mode on her laptop. */
function juniper(): GameState {
  let s = goTo(newGame(1), 'desk');
  s = tick(s, clockTime('9:51') - s.clock);
  return s;
}
/** Let the caller get back to you. */
function wait(s: GameState, id: string): GameState {
  while (s.tickets[id]?.caller && s.tickets[id]?.caller?.doing !== 'confirmed' && s.clock < LOCKUP) s = tick(s, 1);
  return s;
}
const T = 't102';
const t = ticketById(T);

describe('Sam’s method and the notebook', () => {
  it('an answer rules suspects out: "is anyone else affected?" clears the router and the provider', () => {
    let s = wait(ask(juniper(), T, 'others'), T);
    expect(ticketState(s, T).crossed).toEqual(['router', 'isp']);
    expect(standing(t, ticketState(s, T)).map((f) => f.id)).toEqual(['offon', 'airplane']);
    // A sensible test that wasn't it rules that one out too.
    s = wait(suggest(s, T, 'offon'), T);
    expect(ticketState(s, T).crossed).toContain('offon');
  });

  it('you can rule a suspect out yourself, and put it back', () => {
    let s = ruleOut(juniper(), T, 'isp');
    expect(ticketState(s, T).crossed).toEqual(['isp']);
    s = ruleOut(s, T, 'isp');
    expect(ticketState(s, T).crossed).toEqual([]);
  });

  it('three stars for Sam’s way: ask, rule out, then the simplest test', () => {
    let s = wait(ask(juniper(), T, 'others'), T);
    s = wait(suggest(s, T, 'airplane'), T);
    s = resolve(s, T);
    expect(s.outcomes.find((o) => o.ticketId === T)?.stars).toEqual({ got: 3, max: 3, missed: [] });
    expect(s.today.stars).toBe(3);
  });

  it('jumping straight to the drastic fix loses the stars, each with a reason', () => {
    let s = wait(suggest(juniper(), T, 'router'), T);
    s = wait(suggest(s, T, 'airplane'), T);
    const stars = methodStars(t, ticketState(s, T));
    expect(stars.got).toBe(0);
    expect(stars.missed.join(' ')).toMatch(/tested before asking.*Nothing was ruled out.*wasn’t the simplest/);
  });

  it('"How did you know?": picking the clue makes the runbook page yours, with what you ruled out', () => {
    let s = wait(ask(juniper(), T, 'others'), T);
    s = wait(ask(s, T, 'settings'), T);
    s = resolve(wait(suggest(s, T, 'airplane'), T), T);
    while (s.outcomes[0]?.ticketId !== T) s = next(s);
    expect(recordClue(s, 'Nonsense')).toBe(s);
    s = recordClue(s, 'Juniper’s laptop: Airplane mode: ON');
    expect(s.runbook['airplane-mode']).toBe('yours');
    expect(s.clues?.['airplane-mode']).toEqual({ clue: 'Juniper’s laptop: Airplane mode: ON', ruledOut: ['The office router is down', 'The internet provider is down'], fix: 'Turn off airplane mode' });
    expect(s.written['airplane-mode']).toMatch(/^Turn off airplane mode\. How I knew: Juniper’s laptop: Airplane mode: ON/);
  });

  it('the duck asks, by where you are, and gets more specific if you ask again; it never names the fix', () => {
    let s = juniper();
    expect(duckLine(s, t, 0)).toMatch(/What changed since it last worked/);
    expect(duckLine(s, t, 1)).toMatch(/Sam would start with/);
    s = wait(ask(s, T, 'settings'), T);
    expect(duckLine(s, t, 0)).toMatch(/cut this in half/);
    expect(duckLine(s, t, 1)).toMatch(/Is anyone near you/);
    s = wait(ask(s, T, 'others'), T);
    expect(duckLine(s, t, 0)).toMatch(/quickest to check/);
    for (const n of [0, 1]) expect(duckLine(s, t, n)).not.toMatch(/Airplane mode is on/);
  });
});
