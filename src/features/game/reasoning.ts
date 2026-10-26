/**
 * Sam's method, written into every kind of problem: which of Sam's steps each question is (gather context, or
 * isolate and divide), which suspects its answer usually rules out, what each fix would mean is wrong (the suspect),
 * and how much it costs to test (1 a quick check, 3 drastic). Applied onto ISSUES in tickets.ts.
 */
import type { Ask, Fix } from './types.ts';

type Asks = Record<string, Pick<Ask, 'step' | 'rulesOut'>>;
type Fixes = Record<string, Pick<Fix, 'suspect' | 'effort'>>;
const C = 'context' as const;
const I = 'isolate' as const;

export const REASONING: Record<string, { asks: Asks; fixes: Fixes }> = {
  'airplane-mode': {
    asks: { settings: { step: C }, others: { step: I, rulesOut: ['router', 'isp'] }, changed: { step: C } },
    fixes: {
      offon: { suspect: 'It just needs a restart', effort: 1 },
      airplane: { suspect: 'Airplane mode is on', effort: 1 },
      router: { suspect: 'The office router is down', effort: 3 },
      isp: { suspect: 'The internet provider is down', effort: 3 },
    },
  },
};
