import { describe, expect, it } from 'vitest';
import day8 from '../../../scripts/saves/day8.json?raw';
import { COST, ISSUES, LOCKUP } from './data.ts';
import { duckLine } from './notebook.ts';
import { askKind, BANK, questionsFor, usesBank } from './questions.ts';
import { clockTime, goTo, newGame, parseSave, tick, ticketById, ticketState, type GameState } from './rules.ts';

/** Day 8 (week 2), 9:31: Marlo's ticket about Basil moving to Sales has just come in. */
function week2(): GameState {
  const saved = parseSave(day8);
  if (!saved) throw new Error('No save for day 8');
  const s = goTo(saved, 'desk');
  return tick(s, clockTime('9:31') - s.clock);
}
const T = 't801';
const wait = (s: GameState) => {
  while (s.tickets[T]?.caller && s.clock < LOCKUP) s = tick(s, 1);
  return s;
};

describe('the question bank', () => {
  it('every question on every kind of problem is one of the bank’s', () => {
    for (const issue of ISSUES) for (const a of issue.asks) expect(a.kind && BANK[a.kind], `${issue.id}: ${a.id}`).toBeDefined();
  });

  it('is only used from week 2', () => {
    expect(usesBank(newGame())).toBe(false);
    expect(usesBank(week2())).toBe(true);
  });

  it('a question that fits gets the problem’s own answer; one that doesn’t gets a shrug and costs time', () => {
    const s = week2();
    const fits = wait(askKind(s, T, 'change'));
    expect(ticketState(fits, T).heard).toEqual(['hr']);
    expect(questionsFor(fits, ticketById(T)).find((q) => q.kind === 'change')?.asked).toBe(true);

    const dud = askKind(s, T, 'power');
    const st = ticketState(dud, T);
    expect(dud.clock).toBe(s.clock + COST.ask);
    expect(st.heard).toEqual([]);
    expect(st.duds).toEqual(['power']);
    expect(st.messages.at(-1)).toMatchObject({ from: 'them', text: BANK.power.none });
    expect(askKind(dud, T, 'power')).toBe(dud); // asked once is enough
  });

  it('the duck quotes the bank, never the problem’s own question', () => {
    const line = duckLine(week2(), ticketById(T), 1);
    expect(line).toContain(BANK.who.text);
  });
});
