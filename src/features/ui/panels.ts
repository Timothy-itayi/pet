import { DAYS, DAY_SCRIPTS, JOBS, MANAGER, policyOn, VILLAGERS } from '../game/data.ts';
import { runbookPages } from '../game/pages.ts';
import { acceptOffer, apply, isWeekOver, missingFor, peopleWho } from '../game/rules.ts';
import { SKILLS, type Skill } from '../game/types.ts';
import type { App, AppId } from './app.ts';
import { browser } from './browser.ts';
import { openApp } from './desktop.ts';
import { directoryConsole } from './directory.ts';
import { h } from './dom.ts';
import { oktopus } from './oktopus.ts';

export const SKILL_NAMES: Record<Skill, string> = { devices: 'Devices', networks: 'Networks', access: 'Access' };
/** Burrow Mail: Mr. Grisby's memo each morning, newest first. At the end of the week, his offer. */
/** Sam's goodbye email, at the bottom of the inbox: why people liked Sam, and how Sam went about every problem. */
export const SAMS_MAIL = -1;
const samsMail = () => h('div', { class: 'sams-mail' },
  h('p', { class: 'meta' }, 'From: Sam · Subject: Read this first'),
  h('p', {}, 'Hi. If you’re reading this, you’re me now. Sorry.'),
  h('p', {}, 'People here will tell you I was good at computers. I wasn’t, especially. What I was good at was not guessing. Everyone else guesses: they restart the router, order a new laptop, blame the internet. I asked three things, every time:'),
  h('ol', {},
    h('li', {}, h('strong', {}, 'Gather context. '), 'What exactly does it say? What changed? When did it last work?'),
    h('li', {}, h('strong', {}, 'Isolate & divide. '), 'One person, or everyone? This laptop, or all of them? Each answer cuts the problem in half.'),
    h('li', {}, h('strong', {}, 'Test the simplest fix. '), 'The cheapest thing that’s still possible. Not the most dramatic.')),
  h('p', {}, 'Then write down how you knew. The runbook’s mostly wrong, so make your own. Next time it’ll take you a minute.'),
  h('p', {}, 'And talk to the duck. Seriously. Say the problem out loud to it and half the time you’ll hear the answer yourself. It’s on the desk.'),
  h('p', {}, '– S'));

function mail(app: App): HTMLElement {
  const { state, ui } = app;
  const weekOver = isWeekOver(state);
  const days = Array.from({ length: Math.min(state.day, DAYS) }, (_, i) => Math.min(state.day, DAYS) - i);
  const open = weekOver ? 0 : ui.mailDay ?? days[0] ?? 1;
  const memo = DAY_SCRIPTS[open - 1];
  const item = (day: number, subject: string) => h('button', {
    class: `mail-item${day === open ? ' on' : ''}`, 'aria-current': day === open ? 'true' : 'false', onclick: () => { ui.mailDay = day; app.rerender(); },
  }, h('strong', {}, MANAGER), h('span', {}, subject));
  return h('div', { class: 'mail', 'data-testid': 'mail' },
    h('nav', { class: 'mail-list', 'aria-label': 'Inbox' },
      weekOver && item(0, 'The Conversation'),
      ...days.map((d) => item(d, `Day ${d}`)),
      h('button', {
        class: `mail-item${open === SAMS_MAIL ? ' on' : ''}`, 'data-testid': 'mail-sam', onclick: () => { ui.mailDay = SAMS_MAIL; app.rerender(); },
      }, h('strong', {}, 'Sam'), h('span', {}, 'Read this first'))),
    h('article', { class: 'mail-read' },
      open === SAMS_MAIL ? samsMail()
      : open === 0
        ? h('div', {},
          h('p', { class: 'meta' }, `From: ${MANAGER} \u00b7 Subject: The Conversation`),
          h('p', {}, 'Great news! I can offer you a PAID position. Minimum wage. Same desk. Still no phone.'),
          h('div', { class: 'row' },
            h('button', { class: 'btn', 'data-testid': 'accept-offer', onclick: () => app.set(acceptOffer(state)) }, 'Accept the offer'),
            h('button', { class: 'btn primary', onclick: () => openApp(app, 'jobs') }, 'Check the job board first')))
        : memo && h('div', {},
          h('p', { class: 'meta' }, `From: ${MANAGER} \u00b7 Subject: Day ${open}`),
          h('p', {}, memo.memo),
          memo.rule && h('p', { class: 'rule' }, `NEW RULE: ${memo.rule}`))),
  );
}

/** The IT Service Policy: the house rules every ticket is handled by. Each ticket says which one applies. */
const policy = (app: App) => h('div', { class: 'policy', 'data-testid': 'policy' },
  h('p', { class: 'meta' }, 'Burrow & Co. IT Service Policy. Rev 1 (written by you, because Sam never did).'),
  h('ol', { class: 'policy-list' }, ...policyOn(app.state.day).map((rule) => h('li', {}, rule))));

/** Sam's Recycle Bin: what Sam deleted on the way out, until you empty it. */
const BINNED: [string, string, string][] = [
  ['\u{1F4C4}', 'passwords_FINAL_v2.txt', 'Never store passwords in a file. Sam knew. Sam did it anyway.'],
  ['\u2699', 'backup_DO_NOT_DELETE.bat', 'The server backup script. It ran every night. Until Sam deleted it.'],
  ['\u{1F4DD}', 'resignation_letter_draft7.doc', 'Draft seven. The first six were angrier.'],
  ['\u{1F4CA}', 'budget_2019_REAL.xls', 'Next to budget_2019.xls. Different numbers.'],
  ['\u{1F431}', 'cat.gif', 'A cat falling off a printer.'],
];

function trash(app: App): HTMLElement {
  const { ui } = app;
  if (ui.trashEmptied) return h('p', { class: 'meta', 'data-testid': 'trash' }, 'The Recycle Bin is empty.');
  return h('div', { class: 'trash', 'data-testid': 'trash' },
    h('ul', { class: 'trash-list' }, ...BINNED.map(([glyph, name, about]) => h('li', {},
      h('span', { class: 'glyph', 'aria-hidden': 'true' }, glyph), h('strong', {}, name), h('span', { class: 'meta' }, about)))),
    h('div', { class: 'row' },
      h('span', { class: 'meta' }, `${BINNED.length} objects`),
      h('button', { class: 'btn', 'data-testid': 'empty-trash', onclick: () => { ui.trashEmptied = true; app.rerender(); } }, 'Empty Recycle Bin')));
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

/** What's inside each document and program window, apart from the Service Desk and Burrow Chat. */
export const BODIES: Partial<Record<AppId, (app: App) => HTMLElement>> = { mail, runbook, policy, resume, jobs, directory: directoryConsole, okta: oktopus, browser, trash };
