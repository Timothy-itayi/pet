import { DAYS, ISSUES, MANAGER, MAX_PUSHES, POLICY, REPLIES, TICKETS, VILLAGERS, WORKAROUND_RETURNS_AFTER } from '../game/data.ts';
import { OKTOPUS_DAY } from '../game/oktopus.ts';
import { sayNow, statusText } from '../game/people.ts';
import {
  ask, canPush, canWorkaround, fixFor, isKnown, issueOf, moodName, next, noteTarget, pushBack, relation, reply, resolve,
  scriptFor, suggest, suggestions, ticketById, ticketState, workaround, writeNote, type GameState, type Outcome, type Status, type TicketState,
} from '../game/rules.ts';
import type { ConsoleFix, Ticket } from '../game/types.ts';
import { portrait } from './portrait.ts';
import type { App } from './app.ts';
import { openApp } from './desktop.ts';
import { clockText, h } from './dom.ts';
import { SKILL_NAMES } from './panels.ts';

/**
 * ServiceSoon: the service desk platform, laid out like the one real IT teams use. An application navigator on the
 * left; on the right, a list of incidents or one incident's form, with its notes, knowledge and resolution.
 */

const STATE: Record<Status, string> = { new: 'New', open: 'In Progress', pending: 'On Hold', resolved: 'Resolved' };
/** The State field, as the platform shows it while the caller is off answering or trying something. */
const stateOf = (st: TicketState) => (st.caller && st.caller.doing !== 'confirmed' ? 'Awaiting Caller' : STATE[st.status]);
const PRIORITY = { high: '2 - High', normal: '3 - Moderate', low: '4 - Low' } as const;
const IMPACT = { high: '2 - Medium', normal: '3 - Low', low: '3 - Low' } as const;
const CATEGORY = { devices: 'Hardware', networks: 'Network', access: 'Account access' } as const;

/** The incident number for a ticket, e.g. INC0010004. */
export const incidentNumber = (t: Ticket) => `INC${String(10000 + TICKETS.indexOf(t)).padStart(7, '0')}`;
/** The knowledge article number for a runbook page. */
const articleNumber = (issueId: string) => `KB${String(10 + ISSUES.findIndex((i) => i.id === issueId)).padStart(7, '0')}`;

/** Keeps the office clock moving between full redraws. */
export function refreshTimes(root: HTMLElement, s: GameState): void {
  root.querySelectorAll<HTMLElement>('[data-clock]').forEach((el) => { el.textContent = clockText(s.clock); });
  // Where people are and what they're saying move on with the clock, without redrawing the page.
  const day = Math.min(s.day, DAYS);
  root.querySelectorAll<HTMLElement>('[data-now]').forEach((el) => { el.textContent = statusText(el.dataset.now ?? '', day, s.clock); });
  root.querySelectorAll<HTMLElement>('[data-say]').forEach((el) => { el.textContent = `\u201C${sayNow(el.dataset.say ?? '', s)}\u201D`; });
}

/** The ServiceSoon wordmark: lowercase, with a green dot for the last "o". */
function wordmark(): HTMLElement {
  return h('span', { class: 'sn-logo' }, 'servicesoo', h('span', { class: 'sn-dot' }, 'n'));
}

function header(app: App): HTMLElement {
  const { state } = app;
  return h('header', { class: 'sn-header' },
    wordmark(),
    h('span', { class: 'sn-app' }, 'Service Desk'),
    h('span', { class: 'sn-search', 'aria-hidden': 'true' }, '\u{1F50D} Search'),
    h('span', { class: 'sn-goal', 'data-testid': 'goal' }, `Resolved today ${state.today.resolved}/${scriptFor(state.day).goal}`),
    h('span', { class: 'sn-clock', 'data-clock': true, 'data-testid': 'clock' }, clockText(state.clock)),
    h('span', { class: 'sn-user' }, h('span', { class: 'sn-avatar', 'aria-hidden': 'true' }, 'I'), 'intern'));
}

/** Resolved tickets this week, newest first: what the Resolved list shows. */
const resolved = (s: GameState) => Object.keys(s.tickets).filter((id) => s.tickets[id]?.status === 'resolved').map(ticketById).reverse();

function navigator(app: App): HTMLElement {
  const { state, ui } = app;
  const view = ui.snView ?? 'list';
  const module = (label: string, on: boolean, onclick: () => void, testid: string, count?: number) =>
    h('button', { class: `sn-module${on ? ' on' : ''}`, 'aria-current': on ? 'page' : 'false', 'data-testid': testid, onclick },
      label, count !== undefined && h('span', { class: 'sn-count' }, String(count)));
  const show = (to: 'list' | 'resolved') => () => { ui.snView = to; app.rerender(); };
  return h('nav', { class: 'sn-nav', 'aria-label': 'Application navigator' },
    h('div', { class: 'sn-filter', 'aria-hidden': 'true' }, 'Filter navigator'),
    h('p', { class: 'sn-app-title' }, 'Incident'),
    module('Assigned to me', view !== 'resolved', show('list'), 'sn-assigned', state.queue.length),
    module('Resolved', view === 'resolved', show('resolved'), 'sn-resolved', resolved(state).length),
    h('p', { class: 'sn-app-title' }, 'Knowledge'),
    module('Runbook articles', false, () => openApp(app, 'runbook'), 'sn-kb'),
    module('IT Service Policy', false, () => openApp(app, 'policy'), 'sn-policy'),
    h('p', { class: 'sn-app-title' }, 'Admin tools'),
    module('Active Directory', false, () => openApp(app, 'directory'), 'open-directory'),
    state.day >= OKTOPUS_DAY && module('Oktopus', false, () => openApp(app, 'okta'), 'sn-okta'));
}

/** A list of incidents: the queue (assigned to you) or the ones you've resolved. */
function list(app: App, ids: string[], title: string, open: boolean): HTMLElement {
  const { state, ui } = app;
  const rows = ids.map((id) => {
    const t = ticketById(id);
    const st = ticketState(state, id);
    return h('tr', {},
      h('td', {}, open
        ? h('button', { class: 'sn-link', 'data-testid': `queue-${id}`, onclick: () => { ui.selected = id; ui.snView = 'form'; ui.snTab = 'notes'; app.rerender(); } }, incidentNumber(t))
        : incidentNumber(t)),
      h('td', {}, clockText(st.messages[0]?.at ?? state.clock)),
      h('td', {}, t.title),
      h('td', {}, VILLAGERS[t.who].name),
      h('td', { class: `sn-priority p-${t.priority}` }, PRIORITY[t.priority]),
      h('td', {}, stateOf(st)),
      h('td', {}, CATEGORY[issueOf(t).skill]));
  });
  return h('section', { class: 'sn-list', 'aria-label': title },
    h('div', { class: 'sn-list-head' }, h('strong', {}, 'Incidents'), h('span', { class: 'sn-crumb' }, title)),
    h('table', { class: 'sn-table' },
      h('thead', {}, h('tr', {}, ...['Number', 'Opened', 'Short description', 'Caller', 'Priority', 'State', 'Category'].map((c) => h('th', {}, c)))),
      h('tbody', {}, ...(rows.length ? rows : [h('tr', {}, h('td', { colspan: 7, class: 'sn-empty' }, open ? 'No records to display. The printer hums ominously.' : 'Nothing resolved yet today.'))]))));
}

const field = (label: string, value: HTMLElement | string, wide = false) =>
  h('div', { class: `sn-field${wide ? ' wide' : ''}` }, h('label', {}, label), h('div', { class: 'sn-value' }, value));

/** The runbook page for this problem, shown the way the platform suggests knowledge articles. */
function knowledge(s: GameState, t: Ticket): HTMLElement {
  const issue = issueOf(t);
  const status = s.runbook[issue.id];
  const yours = status === 'yours';
  const text = yours ? s.written[issue.id] ?? issue.note.example : issue.page.text;
  const badge = yours ? 'Verified: your note' : status === 'missing' ? 'Missing page' : status === 'outdated' ? 'Old runbook' : 'Runbook';
  return h('aside', { class: 'sn-kb-panel', 'data-testid': 'runbook-box' },
    h('p', { class: 'sn-panel-title' }, 'Knowledge'),
    h('article', { class: `sn-kb${yours ? ' yours' : ''}` },
      h('p', { class: 'meta' }, `${articleNumber(issue.id)} \u00b7 ${badge}`),
      h('h3', {}, issue.title),
      h('p', {}, text ?? '')),
    h('p', { class: 'sn-panel-title' }, 'Policy'),
    h('p', { class: 'policy-line', 'data-testid': 'policy-line' }, h('strong', {}, `Rule ${issue.rule}: `), POLICY[issue.rule - 1] ?? ''));
}

/** Where the conversation stands, in a line: whose move it is. */
function callerLine(app: App, t: Ticket): HTMLElement {
  const st = ticketState(app.state, t.id);
  const name = VILLAGERS[t.who].name;
  const c = st.caller;
  if (c?.doing === 'confirmed') {
    return h('div', { class: 'sn-info ok', 'data-testid': 'caller-line' }, `\u2714 ${name}: \u201C${st.messages.at(-1)?.text ?? 'It works.'}\u201D `,
      h('button', { class: 'sn-btn primary', 'data-testid': 'resolve-now', onclick: () => app.set(resolve(app.state, t.id)) }, 'Resolve'));
  }
  if (c) {
    return h('p', { class: 'sn-info waiting', 'data-testid': 'caller-line' },
      c.doing === 'answer' ? `\u23F3 Waiting for ${name} to reply\u2026` : `\u23F3 ${name} is trying it\u2026`,
      h('span', { class: 'meta' }, ' Work on another ticket meanwhile; you\u2019ll get a notification.'));
  }
  const said = st.heard.length || st.tried.length ? st.messages.at(-1) : undefined;
  return h('div', { class: 'sn-info said', 'data-testid': 'caller-line' }, said?.from === 'them'
    ? h('p', { class: 'sn-said' }, h('strong', {}, `${name}: `), `\u201C${said.text}\u201D`)
    : h('p', {}, `Find out what\u2019s really going on: ask ${name} a question, or suggest something to try.`));
}

/** Questions to ask and things to suggest: one at a time, and they reply after a few office minutes. */
function troubleshoot(app: App, t: Ticket): HTMLElement {
  const { state } = app;
  const st = ticketState(state, t.id);
  const issue = issueOf(t);
  const busy = Boolean(st.caller);
  const known = isKnown(state, t);
  const asks = issue.asks.filter((a) => !st.heard.includes(a.id));
  // Alphabetical, so the right answer isn't always in the same spot; your tool and the console check first.
  const [extra, usual] = [suggestions(state, t).filter((f) => f.id === 'tool' || f.id === 'console'), issue.fixes];
  const options = [...extra, ...usual.filter((f) => !st.tried.includes(f.id)).sort((a, b) => a.label.localeCompare(b.label))];
  const hint = (id: string) => id === 'tool' ? 'Your tool'
    : known && (id === fixFor(t) || id === issue.correctFix || id === 'console') ? 'Your note says this' : undefined;
  const chip = (label: string, testid: string, onclick: () => void, tag?: string) => h('button', { class: `sn-chip${tag ? ' hinted' : ''}`, 'data-testid': testid, disabled: busy, onclick },
    label, tag && h('span', { class: 'from-note-tag' }, tag));
  return h('div', { class: 'sn-troubleshoot', 'data-testid': 'troubleshoot' },
    h('p', { class: 'sn-panel-title' }, `Troubleshoot with ${VILLAGERS[t.who].name}`),
    callerLine(app, t),
    st.caller?.doing !== 'confirmed' && h('div', { class: 'sn-chips' },
      asks.length > 0 && h('div', { role: 'group', 'aria-label': 'Ask' },
        h('p', { class: 'sn-chip-title' }, 'Ask'),
        ...asks.map((a) => chip(a.text, `ask-${a.id}`, () => app.set(ask(state, t.id, a.id))))),
      h('div', { role: 'group', 'aria-label': 'Suggest' },
        h('p', { class: 'sn-chip-title' }, 'Suggest'),
        issue.console && h('button', { class: 'sn-btn', 'data-testid': 'open-registry', onclick: () => consoleFor(issue.console ?? 'unlock').open(app, t) },
          `Open ${consoleFor(issue.console).name}`),
        ...options.map((f) => chip(f.label, `fix-${f.id}`, () => app.set(suggest(state, t.id, f.id)), hint(f.id))))));
}

/** What you know so far: what IT can see for itself, and what the caller has told you. */
function whatYouKnow(t: Ticket, st: TicketState): HTMLElement | false {
  const facts = t.details.filter((d) => !d.ask || st.heard.includes(d.ask));
  return facts.length > 0 && h('div', { class: 'sn-investigation', 'data-testid': 'details' },
    h('p', { class: 'sn-panel-title' }, 'What you know'),
    h('dl', {}, ...facts.flatMap((d) => [h('dt', {}, d.label), h('dd', {}, d.text)])));
}

/** The Notes tab: troubleshooting with the caller, what you know, and everything said so far. */
function notesTab(app: App, t: Ticket): HTMLElement {
  const { state } = app;
  const st = ticketState(state, t.id);
  const v = VILLAGERS[t.who];
  const reply1 = st.status === 'new' ? REPLIES.first : REPLIES.update;
  return h('div', { class: 'sn-tab-body' },
    troubleshoot(app, t),
    whatYouKnow(t, st),
    h('div', { class: 'sn-compose' },
      h('label', { for: 'sn-comment' }, 'Additional comments (Customer visible)'),
      h('textarea', { id: 'sn-comment', rows: 1, readonly: true }, reply1),
      h('button', { class: 'sn-btn', 'data-testid': 'reply', onclick: () => app.set(reply(state, t.id)) }, 'Post')),
    h('p', { class: 'sn-panel-title' }, 'Activity'),
    h('ol', { class: 'sn-activity', 'data-testid': 'conversation' }, ...[...st.messages].reverse().map((m) => h('li', { class: m.from },
      h('p', { class: 'meta' }, `${m.from === 'you' ? 'intern' : v.name} \u00b7 ${clockText(m.at)} \u00b7 Additional comments`),
      h('p', {}, m.text)))));
}

/** The Resolution Information tab: what fixed it, once the caller has confirmed, then Resolve. Or put it on hold. */
function resolutionTab(app: App, t: Ticket): HTMLElement {
  const { state, ui } = app;
  const st = ticketState(state, t.id);
  const name = VILLAGERS[t.who].name;
  const workaroundCode = ui.snCode === 'workaround';
  const confirmed = st.caller?.doing === 'confirmed' ? suggestions(state, t).find((f) => f.id === st.caller?.id) : undefined;
  const notes = workaroundCode
    ? h('p', {}, canWorkaround(state, t.id) ? `Work around: ${t.workaround}` : 'They won\u2019t take a workaround again.')
    : confirmed ? h('p', { 'data-testid': 'resolution-notes' }, `${confirmed.label}. ${name} confirmed it works.`)
    : h('p', { class: 'meta', 'data-testid': 'resolution-notes' }, `Fills in once ${name} confirms it\u2019s working. Troubleshoot with them in the Notes tab.`);
  const resolveIt = () => app.set(workaroundCode ? workaround(state, t.id) : resolve(state, t.id));
  return h('div', { class: 'sn-tab-body' },
    field('Resolution code', h('select', {
      'data-testid': 'resolution-code', onchange: (e) => { ui.snCode = (e.target as HTMLSelectElement).value === 'workaround' ? 'workaround' : 'fix'; app.rerender(); },
    },
      h('option', { value: 'fix', selected: !workaroundCode }, 'Solved (Permanently)'),
      h('option', { value: 'workaround', selected: workaroundCode, disabled: !canWorkaround(state, t.id) }, 'Solved (Work Around)'))),
    field('Resolution notes', notes, true),
    h('div', { class: 'sn-actions' },
      h('button', { class: 'sn-btn primary', 'data-testid': 'resolve', disabled: workaroundCode ? !canWorkaround(state, t.id) : !confirmed, onclick: resolveIt }, 'Resolve'),
      h('button', { class: 'sn-btn', 'data-testid': 'push', disabled: !canPush(state, t.id), onclick: () => app.set(pushBack(state, t.id)) },
        canPush(state, t.id) ? `On Hold: back tomorrow (${MAX_PUSHES - st.pushes} left)` : 'On Hold: not again')));
}

/** One incident, as a form: the record at the top, then its tabs, with knowledge alongside. */
export function ticketView(app: App, t: Ticket): HTMLElement {
  const { state, ui } = app;
  const st = ticketState(state, t.id);
  const v = VILLAGERS[t.who];
  const bond = relation(state, t.who);
  const tab = ui.snTab ?? 'notes';
  const caller = h('span', { class: 'sn-caller' },
    portrait(v.name, 40),
    `${v.name} `,
    h('span', { class: `mood mood-${st.mood}`, 'data-testid': 'mood' }, moodName(st.mood)),
    bond !== 'neutral' && h('span', { class: `bond ${bond}`, 'data-testid': 'bond' }, bond === 'friend' ? '\u2665 Friend' : 'Nemesis'));
  const tabButton = (id: 'notes' | 'resolution', label: string) => h('button', {
    class: `sn-tab${tab === id ? ' on' : ''}`, role: 'tab', 'aria-selected': tab === id ? 'true' : 'false', 'data-testid': `tab-${id}`,
    onclick: () => { ui.snTab = id; app.rerender(); },
  }, label);
  return h('article', { class: 'sn-form', 'aria-label': `Incident ${incidentNumber(t)}` },
    h('div', { class: 'sn-form-head' },
      h('button', { class: 'sn-back', 'aria-label': 'Back to the list', onclick: () => { ui.snView = 'list'; app.rerender(); } }, '\u2039'),
      h('strong', {}, 'Incident'), h('span', {}, incidentNumber(t)),
      h('span', { class: 'sn-form-actions' },
        h('button', { class: 'sn-btn', onclick: () => { ui.snTab = 'resolution'; app.rerender(); } }, 'Resolve\u2026'))),
    state.notice?.ticketId === t.id && h('p', { class: 'sn-error', role: 'alert', 'data-testid': 'notice' }, `Reopened by ${v.name}: ${state.notice.text}`),
    h('div', { class: 'sn-form-body' },
      h('div', { class: 'sn-record' },
        h('div', { class: 'sn-fields' },
          field('Number', incidentNumber(t)), field('State', h('span', { 'data-testid': 'status' }, stateOf(st))),
          field('Caller', caller), field('Impact', IMPACT[t.priority]),
          field('Category', CATEGORY[issueOf(t).skill]), field('Priority', PRIORITY[t.priority]),
          field('Subcategory', issueOf(t).title), field('Assignment group', 'Service Desk'),
          field('Contact type', st.asked ? 'Chat' : 'Self-service'), field('Assigned to', 'intern'),
          field('Short description', t.title, true),
          field('Description', h('p', { 'data-testid': 'opening' }, t.message), true)),
        h('div', { class: 'sn-tabs', role: 'tablist' }, tabButton('notes', 'Notes'), tabButton('resolution', 'Resolution Information')),
        tab === 'notes' ? notesTab(app, t) : resolutionTab(app, t)),
      knowledge(state, t)));
}

/** Which admin console a ticket's work is done in, and how to open it at the right place. */
function consoleFor(fixBy: ConsoleFix): { name: string; open: (app: App, t: Ticket) => void } {
  if (fixBy === 'unlock' || fixBy === 'reset' || fixBy === 'disable') {
    return { name: 'Active Directory', open: (app, t) => {
      Object.assign(app.ui, { dirOu: undefined, dirUser: fixBy === 'disable' ? 'sam' : t.who, dirReset: undefined, dirSaid: undefined });
      openApp(app, 'directory');
    } };
  }
  const page = fixBy === 'okta-setup' || fixBy === 'okta-app' ? 'dashboard' : fixBy === 'mfa' ? 'people' : 'import';
  return { name: 'Oktopus', open: (app, t) => {
    Object.assign(app.ui, { oktaPage: page, oktaUser: fixBy === 'mfa' ? t.who : undefined, oktaApp: undefined, oktaVerify: undefined });
    openApp(app, 'okta');
  } };
}

export function outcomeCard(app: App, o: Outcome): HTMLElement {
  const { state } = app;
  const t = ticketById(o.ticketId);
  const v = VILLAGERS[t.who];
  const issue = issueOf(t);
  const headline = {
    fix: 'Resolved!', workaround: 'Resolved with a work around', push: 'On Hold', complaint: `${v.name} goes to ${MANAGER}`,
    asked: 'Please log a ticket',
  }[o.kind];
  const body = {
    fix: issue.why,
    workaround: `${v.name} is happy for now. It’ll probably come back in ${WORKAROUND_RETURNS_AFTER} days. Fix it properly to learn what was really wrong.`,
    push: `On hold until tomorrow. ${v.name} understands: these things take time.`,
    asked: `${v.name} rolls their eyes and heads back to their desk to fill one in. It\u2019ll land in your queue soon, a bit grumpier, and this time Mr. Grisby will count it.`,
    complaint: o.grave
      ? `That one was serious enough that ${v.name} went straight to ${MANAGER}. It\u2019s on your day report. It still needs fixing properly, and it\u2019s still in your queue.`
      : `${v.name} has had enough of waiting and complains to ${MANAGER}. They still need it fixed, so it\u2019s still in your queue. Send updates so people know you haven\u2019t forgotten them.`,
  }[o.kind];
  const target = noteTarget(state, o);
  const canNote = Boolean(target);
  return h('div', { class: 'overlay' },
    h('section', { class: `outcome ${o.kind}`, role: 'dialog', 'aria-labelledby': 'outcome-title', 'data-testid': 'outcome' },
      h('h2', { id: 'outcome-title' }, headline),
      o.xp > 0 && h('p', { class: 'xp' }, `+${o.xp} ${SKILL_NAMES[issue.skill]} XP`),
      h('p', {}, body),
      target && h('form', {
        class: 'note-pick', 'aria-labelledby': 'note-heading',
        onsubmit: (e) => { e.preventDefault(); app.set(writeNote(state, app.ui.noteDraft ?? '')); },
      },
        h('h3', { id: 'note-heading' }, o.tool ? `New runbook page: ${target.title}. What does it do?` : 'Work note: what happened?'),
        h('p', { class: 'meta' }, o.tool
          ? 'It isn\u2019t in the runbook. Write it up so the next person knows.'
          : 'Work notes are internal. A good one becomes a knowledge article, so next time it\u2019s a known issue.'),
        h('textarea', {
          class: 'note-input', rows: 3, 'data-testid': 'note-text', 'data-autofocus': true, 'aria-labelledby': 'note-heading',
          placeholder: o.tool ? 'What does it do, and when would you use it?' : 'What was really wrong, and what fixed it?',
          oninput: (e) => {
            const box = e.target as HTMLTextAreaElement;
            app.ui.noteDraft = box.value;
            box.form?.querySelector('[data-testid=note-miss]')?.remove(); // you're fixing it
          },
        }, app.ui.noteDraft ?? ''),
        o.noteMiss && h('p', { class: 'notice', role: 'alert', 'data-testid': 'note-miss' }, o.noteMiss),
        h('button', { class: 'btn primary', type: 'submit', 'data-testid': 'save-note' }, 'Save to runbook')),
      o.noted && h('p', { class: 'stamp', 'data-testid': 'noted' }, '✎ Saved to your runbook.'),
      h('button', {
        class: `btn${canNote ? '' : ' primary'}`, 'data-testid': 'next', 'data-autofocus': !canNote,
        onclick: () => { app.ui.noteDraft = undefined; app.set(next(state)); },
      }, canNote ? 'Skip the note' : 'Next')),
  );
}

/** Open the Service Desk on one incident's form. */
export function openIncident(app: App, id: string): void {
  Object.assign(app.ui, { selected: id, snView: 'form', snTab: 'notes', snCode: undefined });
  openApp(app, 'desk');
}

/** The Service Desk app, in its window: the navigator on the left, a list or an incident on the right. */
export function serviceDesk(app: App): HTMLElement {
  const { state, ui } = app;
  if (state.phase !== 'desk') return h('div', { class: 'desk-closed' }, h('p', {}, 'The service desk is closed. Nobody\u2019s in on a Saturday. Not even Mr. Grisby.'));
  if (ui.selected && !state.queue.includes(ui.selected)) { ui.selected = undefined; if (ui.snView === 'form') ui.snView = 'list'; }
  const view = ui.snView ?? 'list';
  const main = view === 'form' && ui.selected ? ticketView(app, ticketById(ui.selected))
    : view === 'resolved' ? list(app, resolved(state).map((t) => t.id), 'Resolved', false)
    : list(app, state.queue, 'Assigned to me', true);
  return h('div', { class: 'desk sn', 'data-testid': 'desk' }, header(app), h('div', { class: 'sn-body' }, navigator(app), main));
}
