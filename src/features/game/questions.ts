/**
 * The question bank: from week 2 there's no menu of the right questions for each problem. You get the same eight
 * questions on every ticket, the way IT people think, and have to work out which ones fit.
 */
import { COST } from './data.ts';
import { act, advance, ask, issueOf, ticketState, weekOf, yourMove, type GameState } from './rules.ts';
import type { Ticket } from './types.ts';

export type Kind = 'scope' | 'change' | 'symptom' | 'power' | 'repeat' | 'tried' | 'where' | 'who';

/** The question bank: the same questions on every ticket, the way IT people think. `none`: their answer when it doesn't fit. */
export const BANK: Record<Kind, { step: 'context' | 'isolate'; text: string; none: string }> = {
  symptom: { step: 'context', text: 'What exactly do you see? Any message, lights or sounds?', none: 'It just… doesn’t work. Nothing useful on the screen.' },
  change: { step: 'context', text: 'Has anything changed since it last worked? Updates, moves, new kit?', none: 'Nothing I can think of.' },
  tried: { step: 'context', text: 'Have you tried anything already?', none: 'Not really. I called you.' },
  where: { step: 'context', text: 'Where are you, and which machine is this on?', none: 'At my desk, on my usual one.' },
  who: { step: 'context', text: 'Who is this for, what do they need, and by when?', none: 'Me. I’m just trying to do my job.' },
  scope: { step: 'isolate', text: 'Is it just you, or is anyone else having this?', none: 'Just me, as far as I know.' },
  power: { step: 'isolate', text: 'Is it plugged in and switched on? Any lights?', none: 'Yes, it’s on. Lights are on.' },
  repeat: { step: 'isolate', text: 'Does it happen every time, or only sometimes?', none: 'Every time, today anyway.' },
};

/** Week 1 is the worked example: three questions that fit. From week 2, the bank. */
export const usesBank = (s: GameState) => weekOf(s.day) >= 2;

/**
 * The bank, as it stands on this ticket: for each question, the first of the problem's own questions it gets an
 * answer to (if any), and whether it's used up (every answer heard, or asked and it didn't fit).
 */
export function questionsFor(s: GameState, t: Ticket): { kind: Kind; step: 'context' | 'isolate'; text: string; askId?: string; asked: boolean }[] {
  const st = ticketState(s, t.id);
  const asks = issueOf(t).asks;
  return (Object.keys(BANK) as Kind[]).map((kind) => {
    const these = asks.filter((a) => a.kind === kind);
    const askId = these.find((a) => !st.heard.includes(a.id))?.id;
    return { kind, step: BANK[kind].step, text: BANK[kind].text, askId, asked: (these.length > 0 && !askId) || (st.duds ?? []).includes(kind) };
  });
}

/**
 * Ask a question from the bank. If it fits, it's the problem's own question: they go and look, as ever. If it doesn't,
 * they say so straight away; it cost you a minute or two and told you nothing.
 */
export function askKind(s: GameState, id: string, kind: Kind): GameState {
  const t = yourMove(s, id);
  const q = t && questionsFor(s, t).find((x) => x.kind === kind);
  if (!t || !q || q.asked) return s;
  if (q.askId) return ask(s, id, q.askId);
  return act(s, (d) => {
    const st = ticketState(d, id);
    st.status = 'open';
    st.messages.push({ from: 'you', text: BANK[kind].text, at: d.clock }, { from: 'them', text: BANK[kind].none, at: d.clock });
    st.duds = [...(st.duds ?? []), kind];
    advance(d, COST.ask);
  });
}
