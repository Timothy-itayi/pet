import { describe, expect, it } from 'vitest';
import { finishInterview, interviewScore, isScored, pick, SCENARIOS, stageOf } from './interview.ts';
import { apply, newGame, type GameState } from './rules.ts';

/** Qualified for every job, and just applied to the library. */
const applied = () => apply({ ...newGame(1), xp: { devices: 999, networks: 999, access: 999 } }, 'library');

/** Answer every question: all good answers, or all bad (topped up with good ones if a question hasn't enough bad). */
function answer(s: GameState, good: boolean): GameState {
  for (let stage = s.interview && stageOf(s.interview); stage; stage = s.interview && stageOf(s.interview)) {
    const options = [...stage.options].sort((a, b) => Number(b.good === good) - Number(a.good === good));
    for (const o of options.slice(0, stage.pick)) s = pick(s, o.id);
  }
  return s;
}

describe('the job interview', () => {
  it('applying opens the interview, and good answers get you hired', () => {
    let s = applied();
    expect(s.phase).toBe('interview');
    expect(s.interview).toMatchObject({ jobId: 'library', scenario: 'black-screen', stage: 0, attempt: 1 });
    s = answer(s, true);
    expect(s.interview && isScored(s.interview)).toBe(true);
    expect(interviewScore(s)).toMatchObject({ good: 7, max: 7, feedback: [], pass: true });
    expect(finishInterview(s)).toMatchObject({ phase: 'ending', ending: 'hired', jobId: 'library' });
  });

  it('a bad interview tells you why and gets you one more; a second bad one and you’re passed over', () => {
    /** Every answer was bad, so there's a why for each of the seven, each from that interview's bad answers. */
    const allWhys = (g: GameState, id: string) => {
      const whys = SCENARIOS.find((x) => x.id === id)?.stages.flatMap((x) => x.options.filter((o) => !o.good).map((o) => o.why));
      const { feedback, good, pass } = interviewScore(g);
      expect({ good, pass, n: feedback.length }).toEqual({ good: 0, pass: false, n: 7 });
      for (const w of feedback) expect(whys).toContain(w);
    };
    let s = answer(applied(), false);
    allWhys(s, 'black-screen');
    s = finishInterview(s);
    expect(s.phase).toBe('interview');
    expect(s.interview).toMatchObject({ scenario: 'wifi-no-internet', stage: 0, picks: [], attempt: 2 });
    expect(s.interview?.jobId).not.toBe('library'); // another company that would have you
    s = answer(s, false);
    allWhys(s, 'wifi-no-internet');
    expect(finishInterview(s)).toMatchObject({ phase: 'ending', ending: 'passedOver' });
  });

  it('a bad first interview and a good second one still gets you hired', () => {
    const s = answer(finishInterview(answer(applied(), false)), true);
    expect(s.interview?.attempt).toBe(2);
    expect(finishInterview(s)).toMatchObject({ ending: 'hired', jobId: s.interview?.jobId });
  });

  it('a choose-two question waits for the second answer, and an answer only counts once', () => {
    let s = pick(applied(), 'see');
    expect(pick(s, 'see')).toBe(s);
    expect(pick(s, 'gpu')).toBe(s); // not on this question
    expect(s.interview?.stage).toBe(0);
    s = pick(s, 'kind');
    expect(s.interview?.stage).toBe(1);
  });

  it('answers are told apart by id within each interview, and every bad one says why', () => {
    for (const x of SCENARIOS) {
      const options = x.stages.flatMap((st) => st.options);
      expect(new Set(options.map((o) => o.id)).size, x.id).toBe(options.length);
      for (const o of options) expect(Boolean(o.why), `${x.id}: ${o.id}`).toBe(!o.good);
      for (const st of x.stages) expect(st.options.filter((o) => o.good).length, st.prompt).toBeGreaterThanOrEqual(st.pick);
    }
  });
});
