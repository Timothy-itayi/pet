import { JOBS } from '../game/data.ts';
import { finishInterview, INTERVIEWERS, interviewScore, isScored, pick, scenarioOf, secondJob, stageOf } from '../game/interview.ts';
import type { App } from './app.ts';
import { h } from './dom.ts';
import { portrait } from './portrait.ts';

/** The job interview: the interviewer asks, you pick an answer (or two). At the end, how it went. */
export function interviewScreen(app: App): HTMLElement {
  const { state } = app;
  const i = state.interview;
  const job = JOBS.find((j) => j.id === i?.jobId);
  const name = INTERVIEWERS[i?.jobId ?? ''] ?? 'The interviewer';
  const scenario = i && scenarioOf(i);
  const stage = i && stageOf(i);
  const done = () => app.set(finishInterview(app.state));
  return h('main', { class: 'screen interview', 'data-testid': 'interview' },
    h('h1', {}, `Interview: ${job?.title ?? 'a real job'}, ${job?.company ?? ''}`),
    h('div', { class: 'toast inline' },
      portrait(name, 64),
      h('div', {},
        h('p', { class: 'meta' }, `${name}, ${job?.company ?? ''}`),
        scenario && h('p', { 'data-testid': 'interview-opener' }, scenario.opener),
        stage && h('p', { class: 'interview-prompt' }, h('strong', {}, stage.prompt), stage.pick === 2 ? ' (Choose two.)' : ''))),
    stage && i && h('div', { class: 'interview-options', role: 'group', 'aria-label': stage.prompt },
      ...stage.options.map((o, n) => i.picks.includes(o.id)
        ? h('button', { class: 'btn', 'data-testid': `picked-${o.id}`, disabled: true }, '✓ ', o.text)
        : h('button', { class: 'btn', 'data-testid': `pick-${o.id}`, 'data-autofocus': n === stage.options.findIndex((x) => !i.picks.includes(x.id)), onclick: () => app.set(pick(app.state, o.id)) }, o.text))),
    stage && i && scenario && h('p', { class: 'meta', 'data-testid': 'interview-progress' }, `Question ${i.stage + 1} of ${scenario.stages.length}`),
    i && isScored(i) && result(app, done));
}

/** How it went: an offer, or a no with every reason why, and what happens next. */
function result(app: App, done: () => void): HTMLElement {
  const { state } = app;
  const score = interviewScore(state);
  const again = state.interview?.attempt === 1;
  const next = JOBS.find((j) => j.id === secondJob(state));
  const button = (label: string) => h('button', { class: 'btn primary', 'data-testid': 'interview-continue', 'data-autofocus': true, onclick: done }, label);
  if (score.pass) {
    return h('div', { class: 'interview-result', role: 'status', 'data-testid': 'interview-result' },
      h('h2', {}, 'We’d like to offer you the job.'), button('Continue'));
  }
  return h('div', { class: 'interview-result', role: 'status', 'data-testid': 'interview-result' },
    h('h2', {}, 'Thanks for coming in.'),
    h('p', {}, 'What they wrote down:'),
    h('ul', { 'data-testid': 'interview-feedback' }, ...score.feedback.map((why) => h('li', {}, why))),
    again && h('p', {}, `You get one more interview, at ${next?.company ?? 'another company'}.`),
    button(again ? 'Go to the interview' : 'Continue'));
}
