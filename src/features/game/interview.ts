/**
 * The job interview: "a customer says their screen is black, what do you do?". Each stage is one question from the
 * interviewer; you pick an answer (or two). The good ones ask before they answer, test the cheapest thing first and
 * write it down. A bad answer comes with one line of why, shown at the end.
 */
import { JOBS } from './data.ts';
import { act, missingFor, type GameState } from './rules.ts';

/** `why`: one line of feedback, shown when they went with someone else. */
export interface Option { id: string; text: string; good: boolean; why: string }
/** `pick: 2` means choose two. */
export interface Stage { prompt: string; pick: 1 | 2; options: Option[] }
export interface Scenario { id: string; opener: string; stages: Stage[] }
export interface InterviewState { jobId: string; scenario: string; stage: number; picks: string[]; attempt: 1 | 2 }

const good = (id: string, text: string): Option => ({ id, text, good: true, why: '' });
const bad = (id: string, text: string, why: string): Option => ({ id, text, good: false, why });

/** Two of them: if the first goes badly, the second interview asks the other. */
export const SCENARIOS: [Scenario, Scenario] = [
  {
    id: 'black-screen',
    opener: 'A customer rings. “My screen’s gone black.” Talk me through it.',
    stages: [
      { prompt: 'Where do you start?', pick: 2, options: [
        bad('restart', 'Tell them to restart the computer.', 'You haven’t asked anything yet. A restart on a locked PC loses their work, and it may just be a monitor switched off.'),
        good('see', 'Ask what exactly they see: any lights, a cursor, anything on the screen at all.'),
        good('changed', 'Ask what changed, or what they were doing when it went black.'),
        bad('replace', 'Say you’ll bring a replacement monitor over.', 'Replacing before you know the cause is the expensive guess.'),
        good('kind', 'Ask if it’s a laptop, or a desktop with a separate monitor.'),
      ] },
      { prompt: 'What’s your first theory?', pick: 1, options: [
        bad('gpu', 'The graphics card has failed.', 'Start with the simplest thing that fits.'),
        good('off', 'The monitor is off, asleep or unplugged: the cheapest thing that fits.'),
        bad('user', 'They’ve done something wrong.', 'Blaming them isn’t a theory.'),
      ] },
      { prompt: 'How do you test it, and what do you expect to see?', pick: 1, options: [
        bad('swap', 'Swap the monitor for a spare.', 'A test should be quick and cheap first.'),
        bad('reinstall', 'Reinstall Windows.', 'Drastic, and nothing has pointed to software.'),
        good('wake', 'Have them press a key or move the mouse and check the monitor’s power light. I’d expect it to wake, or the light to come on.'),
      ] },
      { prompt: 'And if that’s not it?', pick: 1, options: [
        good('split', 'Try the monitor on another computer, or with another cable, to tell a monitor problem from a computer one.'),
        bad('escalate', 'Escalate it to second line.', 'You’ve barely started.'),
        bad('newpc', 'Order them a new PC.', 'Still guessing, now with money.'),
      ] },
      { prompt: 'How do you know it’s fixed?', pick: 1, options: [
        bad('quiet', 'They stop calling.', 'Silence isn’t a fix.'),
        good('confirm', 'Have them open what they were working on, and confirm it shows.'),
      ] },
      { prompt: 'What do you write down?', pick: 1, options: [
        good('ticket', 'The symptom, the cause and the fix, in the ticket, so next time is quicker.'),
        bad('nothing', 'Nothing. It was simple.', 'The next person starts from zero.'),
      ] },
    ],
  },
  {
    id: 'wifi-no-internet',
    opener: 'Someone says, “The Wi-Fi says connected, but there’s no internet.” Go.',
    stages: [
      { prompt: 'Where do you start?', pick: 2, options: [
        good('scope', 'Ask if it’s just them, or everyone near them too.'),
        bad('router', 'Go and restart the office router.', 'If it’s only them, you’ve just knocked everyone else offline for nothing.'),
        good('what', 'Ask what exactly they see when a page fails: any message?'),
        bad('provider', 'Ring the internet provider.', 'You don’t know yet it’s anything to do with them.'),
        good('changed', 'Ask what changed since it last worked: a move, an update, a new network?'),
      ] },
      { prompt: 'It’s only them. What do you check first?', pick: 1, options: [
        good('address', 'Whether the laptop has a real address. One starting 169.254 means it never got one.'),
        bad('newlaptop', 'Whether their laptop is too old for the Wi-Fi.', 'Start with the simplest thing that fits.'),
        bad('blame', 'Whether they’ve been downloading something they shouldn’t.', 'Accusing them isn’t a check.'),
      ] },
      { prompt: 'It has a real address. What next?', pick: 1, options: [
        bad('reinstall', 'Reinstall the Wi-Fi driver.', 'Drastic, and nothing points to the driver yet.'),
        good('gateway', 'See if it can reach the office gateway, the router it goes out through.'),
        bad('forget', 'Forget the network and join it again, and see.', 'That’s a guess, not a test: it tells you nothing either way.'),
      ] },
      { prompt: 'The gateway answers. Then?', pick: 1, options: [
        good('outside', 'Try an outside address by its number, then a website by name. If only names fail, it’s the name server (DNS).'),
        bad('escalate', 'Escalate it: the network’s fine, so it’s not ours.', 'You’ve split it in half once. Keep going.'),
        bad('newrouter', 'Ask for a new router.', 'The router just answered you. Still guessing, now with money.'),
      ] },
      { prompt: 'Outside numbers work, but names still don’t, and only for them. What else could be in the way?', pick: 1, options: [
        bad('virus', 'A virus, probably.', 'Nothing has pointed to one. Look for the ordinary thing first.'),
        good('vpn', 'A VPN left switched on, or a sign-in page waiting in the browser, or a name server someone changed by hand.'),
      ] },
      { prompt: 'Fixed. What do you write down?', pick: 1, options: [
        bad('nothing', 'Nothing. It works now.', 'The next person starts from zero.'),
        good('ticket', 'What they saw, what you checked in order, the cause and the fix, in the ticket.'),
      ] },
    ],
  },
];

/** Who interviews you at each company. */
export const INTERVIEWERS: Record<string, string> = { library: 'Ms. Hale', ocean: 'Mr. Okafor', lighthouse: 'Ms. Marr' };

export const scenarioOf = (i: InterviewState): Scenario => SCENARIOS.find((x) => x.id === i.scenario) ?? SCENARIOS[0];
export const stageOf = (i: InterviewState): Stage | undefined => scenarioOf(i).stages[i.stage];

/** Sit down at the interview for a job you've applied for. */
export const interviewFor = (jobId: string, attempt: 1 | 2 = 1, scenario = SCENARIOS[0].id): InterviewState =>
  ({ jobId, scenario, stage: 0, picks: [], attempt });

/** Pick an answer. Once the stage has all its picks, on to the next question; after the last, it's scored. */
export function pick(s: GameState, optionId: string): GameState {
  const i = s.interview;
  const stage = i && s.phase === 'interview' ? stageOf(i) : undefined;
  if (!i || !stage || !stage.options.some((o) => o.id === optionId) || i.picks.includes(optionId)) return s;
  return act(s, (d) => {
    if (!d.interview) return;
    d.interview.picks.push(optionId);
    if (stage.options.filter((o) => d.interview?.picks.includes(o.id)).length >= stage.pick) d.interview.stage += 1;
  });
}

/** The answers you gave, as options. Option ids are unique within a scenario. */
const picked = (i: InterviewState): Option[] => scenarioOf(i).stages.flatMap((x) => x.options).filter((o) => i.picks.includes(o.id));

export const isScored = (i: InterviewState) => i.stage >= scenarioOf(i).stages.length;

/** How it went: good answers out of how many there were to give, and why each bad one was bad. */
export function interviewScore(s: GameState): { good: number; max: number; feedback: string[]; pass: boolean } {
  const i = s.interview;
  if (!i) return { good: 0, max: 0, feedback: [], pass: false };
  const answers = picked(i);
  const good = answers.filter((o) => o.good).length;
  const max = scenarioOf(i).stages.reduce((n, x) => n + x.pick, 0);
  return { good, max, feedback: answers.filter((o) => !o.good).map((o) => o.why), pass: good >= max - 2 };
}

/**
 * The second chance: another company that would have you, or the same one again if none would. A different question
 * either way, so it's the method that's tested, not your memory.
 */
export function secondJob(s: GameState): string {
  const first = s.interview?.jobId ?? '';
  return JOBS.find((j) => j.id !== first && missingFor(s, j).length === 0)?.id ?? first;
}

/** After the result: hired; or a second interview; or, after two no's, passed over. */
export function finishInterview(s: GameState): GameState {
  const i = s.interview;
  if (s.phase !== 'interview' || !i || !isScored(i)) return s;
  const { pass } = interviewScore(s);
  return act(s, (d) => {
    if (pass || i.attempt === 2) {
      d.ending = pass ? 'hired' : 'passedOver';
      if (pass) d.jobId = i.jobId;
      d.phase = 'ending';
      return;
    }
    const other = SCENARIOS.find((x) => x.id !== i.scenario) ?? SCENARIOS[0];
    d.interview = interviewFor(secondJob(s), 2, other.id);
  });
}
