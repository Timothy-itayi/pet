import { DAYS, ISSUES, MANAGER, MAX_PUSHES, policyOn, REPLIES, TICKETS, VILLAGERS, WORKAROUND_RETURNS_AFTER } from '../game/data.ts';
import { MINUTES_A_DAY } from '../game/directory.ts';
import { OKTOPUS_DAY } from '../game/oktopus.ts';
import { sayNow, statusText } from '../game/people.ts';
import {
  ask, canPush, canWorkaround, clockTime, fixFor, isKnown, issueOf, fill, knownDetails, liveFact, lookUp, LOOKED_UP, moodName, next, noteTarget, pushBack, relation, reply, resolve,
  recordClue, ruleOut, scriptFor, suggest, suggestions, ticketById, ticketState, weekOf, workaround, writeNote, type GameState, type Outcome, type Status, type TicketState,
} from '../game/rules.ts';
import { cluesFor, duckLine, effortOf, SAMS_METHOD, suspectsOf, suspectText } from '../game/notebook.ts';
import type { ConsoleFix, Fix, Ticket } from '../game/types.ts';
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
/** Tickets in the order they arrive, which is the order they're numbered in. */
const ARRIVAL = [...TICKETS].sort((a, b) => a.day - b.day || clockTime(a.at) - clockTime(b.at));
export const incidentNumber = (t: Ticket) => `INC${String(10000 + ARRIVAL.indexOf(t)).padStart(7, '0')}`;
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
  const goal = scriptFor(state.day).goal;
  const met = goal > 0 && state.today.resolved >= goal;
  return h('header', { class: 'sn-header' },
    wordmark(),
    h('span', { class: 'sn-app' }, 'Service Desk'),
    h('span', { class: 'sn-search', 'aria-hidden': 'true' }, '\u{1F50D} Search'),
    h('span', { class: `sn-goal${met ? ' met' : ''}`, 'data-testid': 'goal' }, met ? `Goal met ✓ ${state.today.resolved}/${goal}` : `Resolved today ${state.today.resolved}/${goal}`),
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
    h('p', { class: 'policy-line', 'data-testid': 'policy-line' }, h('strong', {}, `Rule ${issue.rule}: `), policyOn(s.day)[issue.rule - 1] ?? ''));
}

/** Where the conversation stands, in a line: whose move it is. */
/** The lesson when your flow did a joiner, mover or leaver before anyone asked. */
const AUTOMATED = 'HR changed, and your flow did the rest at 9:00, before anyone asked: the same job, the same way, every time. Checking with the person afterwards is still part of the job, because a flow never asks if you meant it.';
/** Did one of your flows handle this ticket's person this morning? */
const flowRanFor = (s: GameState, t: Ticket) => s.okta.runs.some((r) => !r.test && r.subject === t.subject && Math.floor(r.at / MINUTES_A_DAY) === t.day);

/** Someone's words in quotes, unless they already are. */
const quoted = (text: string) => (text.startsWith('\u201C') ? text : `\u201C${text}\u201D`);

function callerLine(app: App, t: Ticket): HTMLElement {
  const st = ticketState(app.state, t.id);
  const name = VILLAGERS[t.who].name;
  const c = st.caller;
  if (c?.doing === 'confirmed') {
    return h('div', { class: 'sn-info ok', 'data-testid': 'caller-line' }, `\u2714 ${name}: ${quoted(st.messages.at(-1)?.text ?? 'It works.')} `,
      h('button', { class: 'sn-btn primary', 'data-testid': 'resolve-now', onclick: () => app.set(resolve(app.state, t.id)) }, 'Resolve'));
  }
  if (c) {
    return h('p', { class: 'sn-info waiting', 'data-testid': 'caller-line' },
      c.doing === 'answer' ? `\u23F3 Waiting for ${name} to reply\u2026` : `\u23F3 ${name} is trying it\u2026`,
      h('span', { class: 'meta' }, ' Work on another ticket meanwhile; you\u2019ll get a notification.'));
  }
  const said = st.heard.length || st.tried.length ? st.messages.at(-1) : undefined;
  return h('div', { class: 'sn-info said', 'data-testid': 'caller-line' }, said?.from === 'them'
    ? h('p', { class: 'sn-said' }, h('strong', {}, `${name}: `), quoted(said.text))
    : h('p', {}, `Find out what\u2019s really going on: ask ${name} a question, or suggest something to try.`));
}

/** Effort to test, as dots: ● a quick check, ●●● drastic. */
const dots = (f: Fix) => '●'.repeat(effortOf(f));

/**
 * Sam's method, as the controls: 1. gather context and 2. isolate & divide are questions to ask; 3. test the simplest
 * fix is what to suggest, cheapest first. One thing at a time; they reply after a few office minutes.
 */
function troubleshoot(app: App, t: Ticket): HTMLElement {
  const { state } = app;
  const st = ticketState(state, t.id);
  const issue = issueOf(t);
  const busy = Boolean(st.caller);
  const known = isKnown(state, t);
  const asks = issue.asks;
  // Your tool and the console check, then every untried fix: simplest first, alphabetical within that.
  const extra = suggestions(state, t).filter((f) => f.id === 'tool');
  const fixes = issue.fixes.filter((f) => !st.tried.includes(f.id)).sort((a, b) => effortOf(a) - effortOf(b) || a.label.localeCompare(b.label));
  const hint = (id: string) => id === 'tool' ? 'Your tool'
    : known && (id === fixFor(t) || id === issue.correctFix || id === 'console') ? 'Your notebook says this' : undefined;
  const chip = (label: string | HTMLElement[], testid: string, onclick: () => void, tag?: string) => h('button', { class: `sn-chip${tag ? ' hinted' : ''}`, 'data-testid': testid, disabled: busy, onclick },
    ...(Array.isArray(label) ? label : [label]), tag && h('span', { class: 'from-note-tag' }, tag));
  const askGroup = (step: 'context' | 'isolate', title: string) => {
    const these = asks.filter((a) => (a.step ?? 'context') === step);
    return these.length > 0 && h('div', { role: 'group', 'aria-label': title },
      h('p', { class: 'sn-chip-title' }, title),
      // Asked ones stay, ticked, so the list never shifts under the pointer.
      ...these.map((a) => st.heard.includes(a.id)
        ? h('button', { class: 'sn-chip asked', 'data-testid': `asked-${a.id}`, disabled: true }, '✓ ', fill(t, a.text))
        : chip(fill(t, a.text), `ask-${a.id}`, () => app.set(ask(state, t.id, a.id)))));
  };
  const consoleCheck = suggestions(state, t).find((f) => f.id === 'console');
  return h('div', { class: 'sn-troubleshoot', 'data-testid': 'troubleshoot' },
    h('p', { class: 'sn-panel-title' }, `Troubleshoot with ${VILLAGERS[t.who].name}`, duckButton(app, t)),
    duckBubble(app, t),
    callerLine(app, t),
    st.caller?.doing !== 'confirmed' && h('div', { class: 'sn-chips' },
      askGroup('context', `1. ${SAMS_METHOD[0]}`),
      askGroup('isolate', `2. ${SAMS_METHOD[1]}`),
      h('div', { role: 'group', 'aria-label': SAMS_METHOD[2] },
        h('p', { class: 'sn-chip-title' }, `3. ${SAMS_METHOD[2]}`),
        issue.console && h('button', { class: 'sn-btn', 'data-testid': 'open-registry', onclick: () => { app.set(lookUp(app.state, t.id)); consoleFor(issue.console ?? 'unlock').open(app, t); } },
          `Open ${consoleFor(issue.console).name}`),
        consoleCheck && chip(consoleCheck.label, 'fix-console', () => app.set(suggest(state, t.id, 'console')), hint('console')),
        ...extra.map((f) => chip(f.label, `fix-${f.id}`, () => app.set(suggest(state, t.id, f.id)), hint(f.id))),
        ...fixes.map((f) => chip([h('span', { class: 'effort', title: `Effort: ${effortOf(f)} of 3`, 'aria-label': `effort ${effortOf(f)} of 3` }, dots(f)), h('span', {}, f.label)],
          `fix-${f.id}`, () => app.set(suggest(state, t.id, f.id)), hint(f.id))))));
}

/** The duck: ask it to talk it through, and it asks you a question back. Never the answer. */
function duckButton(app: App, t: Ticket): HTMLElement {
  return h('button', {
    class: 'duck-btn', 'data-testid': 'duck', title: 'Talk it through with Sam’s duck',
    onclick: () => {
      const was = app.ui.duck?.ticket === t.id ? app.ui.duck.times + 1 : 0;
      app.ui.duck = { ticket: t.id, times: was };
      app.rerender();
    },
  }, h('span', { 'aria-hidden': 'true' }, '\u{1F986}'), ' Talk it through');
}

/** What the duck said, if it's said something about this ticket. In weeks 1 and 2 it pipes up once if you're stuck. */
function duckBubble(app: App, t: Ticket): HTMLElement | false {
  const { ui, state } = app;
  const st = ticketState(state, t.id);
  const stuck = st.slips >= 2 && !st.caller && weekOf(state.day) <= 2 && !duckMuted() && !(ui.duckSpoke ?? []).includes(issueOf(t).id);
  if (stuck && ui.duck?.ticket !== t.id) {
    ui.duck = { ticket: t.id, times: 0 };
    ui.duckSpoke = [...(ui.duckSpoke ?? []), issueOf(t).id];
  }
  // Quiet while the caller is busy; afterwards the question follows where you are now, so it's never stale.
  if (ui.duck?.ticket !== t.id || st.caller) return false;
  return h('div', { class: 'duck-bubble', role: 'status', 'data-testid': 'duck-says' },
    h('span', { class: 'duck-face', 'aria-hidden': 'true' }, '\u{1F986}'),
    h('p', {}, duckLine(state, t, ui.duck.times)),
    h('span', { class: 'duck-actions' },
      h('button', { class: 'sn-link', onclick: () => { ui.duck = undefined; app.rerender(); } }, 'Thanks, duck'),
      weekOf(state.day) <= 2 && h('button', { class: 'sn-link', 'data-testid': 'duck-mute', onclick: () => { muteDuck(); ui.duck = undefined; app.rerender(); } }, 'Got it, don’t pipe up')));
}

/** The duck only pipes up on its own until you tell it not to. Remembered in this browser. */
const DUCK_KEY = 'pet-duck-quiet';
function duckMuted(): boolean {
  try { return localStorage.getItem(DUCK_KEY) === '1'; } catch { return false; }
}
function muteDuck(): void {
  try { localStorage.setItem(DUCK_KEY, '1'); } catch { /* private window: it'll just pipe up again */ }
}

/**
 * Your notebook page for this ticket: what it could be (suspects, ruled out as you learn), what you know (the clues),
 * and, if you've seen this kind of problem before, your own entry from last time.
 */
function notebook(app: App, t: Ticket, st: TicketState): HTMLElement {
  const { state, ui } = app;
  const issue = issueOf(t);
  const facts = knownDetails(t, st);
  const unlooked = !st.looked && t.details.some((d) => !d.ask && LOOKED_UP.includes(d.label));
  const crossed = st.crossed ?? [];
  const last = state.clues?.[issue.id];
  const seen = new Set(ui.stamped ?? []);
  const confirmed = st.caller?.doing === 'confirmed' ? st.caller.id : undefined;
  const card = (f: Fix) => {
    const out = crossed.includes(f.id);
    if (f.id === confirmed) {
      return h('li', { class: 'suspect confirmed', 'data-testid': `suspect-${f.id}` },
        h('span', {}, suspectText(f)), h('span', { class: 'it-was', 'aria-label': 'confirmed' }, 'IT WAS THIS'));
    }
    const key = `${t.id}:${f.id}`;
    const fresh = out && !seen.has(key);
    if (out) seen.add(key);
    return h('li', { class: `suspect${out ? ' out' : ''}${fresh ? ' stamping' : ''}`, 'data-testid': `suspect-${f.id}` },
      h('span', {}, suspectText(f)),
      out && h('span', { class: 'ruled-out', 'aria-label': 'ruled out' }, 'RULED OUT'),
      h('button', { class: 'sn-link', 'data-testid': `rule-out-${f.id}`, onclick: () => app.set(ruleOut(state, t.id, f.id)) }, out ? 'Put back' : 'Rule out'));
  };
  const suspects = suspectsOf(t);
  const nodes = h('div', { class: 'sn-investigation notebook', 'data-testid': 'details' },
    h('p', { class: 'sn-panel-title' }, 'Your notebook'),
    last && h('p', { class: 'notebook-last', 'data-testid': 'notebook-last' }, h('strong', {}, 'Seen this before. '), `Last time: ${last.fix}. How you knew: ${last.clue}`),
    suspects.length > 0 && h('div', {},
      h('p', { class: 'sn-chip-title' }, 'What could it be?'),
      h('ul', { class: 'suspects' }, ...[...suspects.filter((f) => !crossed.includes(f.id)), ...suspects.filter((f) => crossed.includes(f.id))].map(card))),
    h('p', { class: 'sn-chip-title' }, 'What you know'),
    facts.length ? h('dl', {}, ...facts.flatMap((d) => [h('dt', {}, d.label), h('dd', {}, liveFact(state, t, d.label) ?? d.text)]))
      : h('p', { class: 'meta' }, 'Nothing yet. Sam would start by gathering context.'),
    unlooked && issue.console && h('p', { class: 'meta', 'data-testid': 'look-it-up' }, `Some of this you can look up yourself: open ${consoleFor(issue.console).name}.`));
  ui.stamped = [...seen];
  return nodes;
}

/** The Notes tab: troubleshooting with the caller, what you know, and everything said so far. */
function notesTab(app: App, t: Ticket): HTMLElement {
  const { state } = app;
  const st = ticketState(state, t.id);
  const v = VILLAGERS[t.who];
  const reply1 = st.status === 'new' ? REPLIES.first : REPLIES.update;
  return h('div', { class: 'sn-tab-body' },
    troubleshoot(app, t),
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
      // Your notebook alongside, so the suspects and stamps stay in view while you ask and test.
      h('div', { class: 'sn-side' }, tab === 'notes' && notebook(app, t, st), knowledge(state, t))));
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
    fix: 'Resolved!', workaround: 'Resolved with a work around', push: 'On Hold', complaint: v.name === MANAGER ? `${MANAGER} is not pleased` : `${v.name} goes to ${MANAGER}`,
    asked: 'Please log a ticket',
  }[o.kind];
  const body = {
    fix: fill(ticketById(o.ticketId), ticketById(o.ticketId).automate && flowRanFor(state, ticketById(o.ticketId)) ? AUTOMATED : issue.why),
    workaround: `${v.name} is happy for now. It’ll probably come back in ${WORKAROUND_RETURNS_AFTER} days. Fix it properly to learn what was really wrong.`,
    push: `On hold until tomorrow. ${v.name} understands: these things take time.`,
    asked: `${v.name} sighs, and goes off to fill one in. It\u2019ll land in your queue soon, a bit grumpier, and this time it counts.`,
    complaint: o.grave
      ? `${v.name === MANAGER ? `That one was serious, and ${MANAGER} noticed personally` : `That one was serious enough that ${v.name} went straight to ${MANAGER}`}. It\u2019s on your day report. It still needs fixing properly, and it\u2019s still in your queue.`
      : `${v.name} has had enough of waiting and complains to ${MANAGER}. They still need it fixed, so it\u2019s still in your queue. Send updates so people know you haven\u2019t forgotten them.`,
  }[o.kind];
  const target = noteTarget(state, o);
  // "How did you know?": after a fix (not a tool's), pick the clue that proved it. That's your notebook entry.
  const clues = o.kind === 'fix' && !o.tool ? cluesFor(t, ticketState(state, t.id)) : [];
  const debrief = clues.length > 0 && !o.clue;
  // Typing it up yourself: for a tool's new page, when there are no clues to pick, or as a bonus once you have.
  const typing = Boolean(target) && (o.tool !== undefined || clues.length === 0 || (o.clue !== undefined && app.ui.ownWords === true));
  const canNote = debrief || typing;
  return h('div', { class: 'overlay' },
    h('section', { class: `outcome ${o.kind}`, role: 'dialog', 'aria-labelledby': 'outcome-title', 'data-testid': 'outcome' },
      h('h2', { id: 'outcome-title' }, headline),
      o.xp > 0 && h('p', { class: 'xp' }, `+${o.xp} ${SKILL_NAMES[issue.skill]} XP`),
      h('p', {}, body),
      o.stars && h('div', { class: 'method-stars', 'data-testid': 'stars' },
        h('p', {}, h('strong', {}, 'Sam’s method: '), h('span', { class: 'stars', 'aria-label': `${o.stars.got} of ${o.stars.max} stars` },
          '★'.repeat(o.stars.got), h('span', { class: 'dim' }, '☆'.repeat(o.stars.max - o.stars.got)))),
        ...o.stars.missed.map((m) => h('p', { class: 'meta' }, m))),
      debrief && h('div', { class: 'debrief', role: 'group', 'aria-labelledby': 'debrief-heading' },
        h('h3', { id: 'debrief-heading' }, 'How did you know?'),
        h('p', { class: 'meta' }, 'Pick the clue that proved it. It goes in your notebook, so next time you’ll know.'),
        ...clues.map((c, i) => h('button', { class: 'clue', 'data-testid': `clue-${i}`, 'data-autofocus': i === 0, onclick: () => app.set(recordClue(state, c)) }, c))),
      o.clue && h('p', { class: 'stamp', 'data-testid': 'noted' }, `✎ In your notebook: ${o.clue}`),
      o.clue && target && !typing && !o.noted && h('p', {}, h('button', { class: 'sn-link', 'data-testid': 'own-words', onclick: () => { app.ui.ownWords = true; app.rerender(); } }, 'Put it in your own words too (+1 XP)')),
      typing && target && h('form', {
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
      o.noted && h('p', { class: 'stamp', 'data-testid': 'noted-words' }, '✎ Saved to your runbook, in your own words.'),
      h('button', {
        class: `btn${canNote ? '' : ' primary'}`, 'data-testid': 'next', 'data-autofocus': !canNote,
        onclick: () => { app.ui.noteDraft = undefined; app.ui.ownWords = undefined; app.set(next(state)); },
      }, debrief ? 'Skip' : canNote ? 'Skip the note' : 'Next')),
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
