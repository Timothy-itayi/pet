import { ISSUES, JOBS, MANAGER, TOOLS, VILLAGERS } from '../game/data.ts';
import { apply, isWeekOver, missingFor, peopleWho, scriptFor, type GameState } from '../game/rules.ts';
import { SKILLS, type PageStatus, type Skill } from '../game/types.ts';
import type { App, Panel } from './app.ts';
import { directoryConsole } from './directory.ts';
import { h } from './dom.ts';
import { intranet } from './intranet.ts';

export const SKILL_NAMES: Record<Skill, string> = { devices: 'Devices', networks: 'Networks', access: 'Access' };
const TITLES: Record<Panel, string> = {
  inbox: 'Inbox', runbook: 'The Runbook', resume: 'resume.doc', jobs: 'Job Board',
  directory: 'Active Registry Users and Computers', intranet: 'Burrow Intranet',
};

function inbox(app: App): HTMLElement {
  const { state } = app;
  if (isWeekOver(state)) return h('div', {}, h('p', {}, `From: ${MANAGER}`), h('p', {}, 'See my offer. You’ll love it.'));
  const day = scriptFor(state.day);
  return h('div', {},
    h('p', { class: 'meta' }, `From: ${MANAGER} · Subject: Day ${state.day}`),
    h('p', {}, day.memo),
    day.rule && h('p', { class: 'rule' }, `NEW RULE: ${day.rule}`),
  );
}

/** One page of the runbook as it stands now: the old page, or yours if you've rewritten it. */
export interface RunbookPage {
  title: string;
  status: PageStatus;
  text: string;
  /** What the old runbook said, before your note replaced it. */
  old?: string;
  /** A page for one of your tools (it starts blank), not one of the old problems. */
  tool?: string;
}

/** Every page, in order: the old problems first, then a page for each tool you've been given. It grows as you go. */
export function runbookPages(state: GameState): RunbookPage[] {
  const right = (notes: { text: string; right?: true }[]) => notes.find((n) => n.right)?.text ?? '';
  return [
    ...ISSUES.map((issue) => {
      const status = state.runbook[issue.id] ?? issue.page.status;
      return { title: issue.title, status, text: status === 'yours' ? right(issue.notes) : issue.page.text, old: issue.page.text };
    }),
    ...TOOLS.filter((tool) => state.tools.includes(tool.id)).map((tool): RunbookPage => {
      const yours = state.runbook[`tool:${tool.id}`] === 'yours';
      return { title: tool.name, status: yours ? 'yours' : 'missing', text: yours ? right(tool.notes) : '(No page yet. Use it once, then write it up.)', tool: tool.id };
    }),
  ];
}

function runbook(app: App): HTMLElement {
  return h('ol', { class: 'runbook' }, ...runbookPages(app.state).map((page) => h('li', {
    class: `page ${page.status}`, 'data-testid': page.tool && `page-tool-${page.tool}`,
  },
    h('h3', {}, page.title),
    h('p', {}, page.text),
    page.status === 'yours' && h('p', { class: 'stamp' }, page.tool ? '\u270E Your page' : '\u270E Your note'),
  )));
}

const names = (ids: (keyof typeof VILLAGERS)[]) => ids.length ? ids.map((id) => VILLAGERS[id].name).join(', ') : undefined;

function resume(app: App): HTMLElement {
  return h('div', {},
    h('p', {}, 'Experience: IT Intern (unpaid), Burrow & Co.'),
    h('ul', { class: 'skills' }, ...SKILLS.map((s) => h('li', {},
      h('span', { class: 'skill-name' }, SKILL_NAMES[s]),
      h('meter', { min: 0, max: Math.max(...JOBS.map((j) => j.needs[s] ?? 0)), value: app.state.xp[s], 'aria-label': `${SKILL_NAMES[s]} experience` }),
      h('span', {}, `${app.state.xp[s]} XP`),
    ))),
    h('h3', {}, 'References'),
    h('p', { 'data-testid': 'references' }, names(peopleWho(app.state, 'friend'))
      ?? 'None yet. Fix someone\u2019s problem without upsetting them and they\u2019ll vouch for you.'),
    peopleWho(app.state, 'nemesis').length > 0 &&
      h('p', { class: 'meta' }, `Holding a grudge: ${names(peopleWho(app.state, 'nemesis'))}. Fix their next problem cleanly to win them back.`),
  );
}

function jobs(app: App): HTMLElement {
  return h('ul', { class: 'jobs' }, ...JOBS.map((job) => {
    const missing = missingFor(app.state, job);
    return h('li', { class: 'job' },
      h('h3', {}, job.title),
      h('p', { class: 'meta' }, job.company),
      h('p', {}, job.blurb),
      h('p', { class: 'needs' }, 'Needs: ', (Object.entries(job.needs) as [Skill, number][])
        .map(([s, n]) => `${SKILL_NAMES[s]} ${Math.min(app.state.xp[s], n)}/${n}`).join(' · ')),
      h('button', {
        class: 'btn primary',
        disabled: missing.length > 0,
        'data-testid': `apply-${job.id}`,
        onclick: () => app.set(apply(app.state, job.id)),
      }, missing.length ? 'Not qualified yet' : 'Apply'),
    );
  }));
}

const BODIES: Record<Panel, (app: App) => HTMLElement> = { inbox, runbook, resume, jobs, directory: directoryConsole, intranet };

export function panel(app: App, which: Panel): HTMLElement {
  const close = () => { app.ui.panel = undefined; app.rerender(); };
  return h('section', {
    class: `window window-${which}`, role: 'dialog', 'aria-label': TITLES[which], 'data-testid': `panel-${which}`,
    onkeydown: (e) => { if ((e as KeyboardEvent).key === 'Escape') close(); },
  },
    h('header', { class: 'titlebar' },
      h('span', {}, TITLES[which]),
      h('button', { class: 'close', 'aria-label': 'Close', 'data-autofocus': true, onclick: close }, '×')),
    h('div', { class: 'window-body' }, BODIES[which](app)),
  );
}
