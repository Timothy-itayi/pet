/**
 * The question bank: from week 2 there's no menu of the right questions for each problem. You get the same eight
 * questions on every ticket, the way IT people think, and have to work out which ones fit.
 */
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
