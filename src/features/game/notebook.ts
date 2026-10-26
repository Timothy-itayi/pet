/**
 * Sam's method, and your notebook. Sam never guessed. Every time, three things: 1. gather context, 2. isolate and
 * divide, 3. test the simplest fix. On a ticket, the notebook page lists the suspects (what it could be: one per
 * possible fix), the clues you've heard, and which suspects those clues rule out. Afterwards you pick the clue that
 * proved it, and that's your notebook entry for next time.
 */
import type { Fix, Ticket } from './types.ts';
import { fixFor, issueOf, type GameState, type TicketState } from './rules.ts';

export type Step = 'context' | 'isolate';

/** The three steps, as Sam wrote them. */
export const SAMS_METHOD = ['Gather context', 'Isolate & divide', 'Test the simplest fix'] as const;

/** What it could be: one suspect per possible fix, in plain words. */
export const suspectsOf = (t: Ticket): Fix[] => issueOf(t).fixes;
export const suspectText = (f: Fix) => f.suspect ?? f.label;
export const effortOf = (f: Fix) => f.effort ?? 2;

/** The suspects an answer rules out. Never the real cause of this ticket, whatever the issue usually is. */
export function crossedBy(t: Ticket, askId: string): string[] {
  const ask = issueOf(t).asks.find((a) => a.id === askId);
  return (ask?.rulesOut ?? []).filter((id) => id !== fixFor(t));
}

/** Suspects still standing. */
export const standing = (t: Ticket, st: TicketState) => suspectsOf(t).filter((f) => !(st.crossed ?? []).includes(f.id));

/**
 * Remember how you started testing, the first time you suggest something: how many questions you'd asked, how many
 * suspects you'd ruled out, and whether it was the simplest test left (or simply the right one).
 */
export function firstTest(t: Ticket, st: TicketState, fixId: string): NonNullable<TicketState['first']> {
  const left = standing(t, st);
  const cheapest = Math.min(...left.map(effortOf), 3);
  const chosen = suspectsOf(t).find((f) => f.id === fixId);
  const simplest = fixId === fixFor(t) || fixId === 'console' || fixId === 'tool' || (chosen !== undefined && effortOf(chosen) <= cheapest);
  return { fix: fixId, asked: st.heard.length, crossed: (st.crossed ?? []).length, simplest };
}

export interface Stars { got: number; max: number; missed: string[] }

/** Sam's three steps, scored on how you went about a ticket. Never blocks anything; it's how you'd explain it. */
export function methodStars(t: Ticket, st: TicketState): Stars {
  const first = st.first;
  const missed: string[] = [];
  const narrowing = suspectsOf(t).length >= 2;
  if (!first || first.asked === 0) missed.push('You tested before asking anything. Sam always gathered context first.');
  if (narrowing && (!first || first.crossed === 0)) missed.push('Nothing was ruled out before your first test. Ask the question that cuts it in half.');
  if (!first?.simplest) missed.push('Your first test wasn’t the simplest one left. Cheap checks first.');
  const max = narrowing ? 3 : 2;
  return { got: max - missed.length, max, missed };
}

/** The clues you could pick as the one that proved it: what you heard, plus anything IT could already see. */
export function cluesFor(t: Ticket, st: TicketState): string[] {
  return t.details.filter((d) => !d.ask || st.heard.includes(d.ask)).map((d) => `${d.label}: ${d.text}`);
}

/**
 * The duck. It asks; it never answers. The first question on a ticket is about the method (what step you're on);
 * ask again and it gets a little more specific (a question to ask, a test to try), never the answer itself.
 */
export function duckLine(s: GameState, t: Ticket, times: number): string {
  const st = s.tickets[t.id];
  if (!st) return 'Quack?';
  const issue = issueOf(t);
  const unasked = (step: Step) => issue.asks.find((a) => a.step === step && !st.heard.includes(a.id));
  const left = standing(t, st).filter((f) => !st.tried.includes(f.id));
  if (!st.heard.length) {
    const q = unasked('context');
    return times === 0 || !q ? 'Quack. What do you actually know so far? What changed since it last worked?' : `Quack. Sam would start with something like: “${q.text}”`;
  }
  if ((st.crossed ?? []).length === 0 && suspectsOf(t).length >= 2) {
    const q = unasked('isolate');
    return times === 0 || !q ? 'Quack. What would cut this in half? One person, or everyone? This device, or all of them?' : `Quack. What about: “${q.text}”`;
  }
  if (left.length > 1) {
    const cheapest = [...left].sort((a, b) => effortOf(a) - effortOf(b))[0];
    return times === 0 || !cheapest ? 'Quack. Which of what’s left is quickest to check?' : `Quack. Of what’s left, “${suspectText(cheapest)}” is the cheapest to rule in or out.`;
  }
  return 'Quack. Sounds like you know what it is. Test it.';
}
