/**
 * Oktopus Flows: automation built from cards, like Okta Workflows. A flow starts from an HR event (someone joins,
 * moves or leaves), from the morning schedule, or from another flow (a helper, like a function). Each card after the
 * first takes fields from earlier cards (a wire) or typed text, and does one thing.
 *
 * Every field has a type: text, one person, a list of people, or a list of text. A wire has to fit: a list of people
 * can't go where one Login is wanted; For Each or Map runs a helper flow once per person instead. Wiring is the puzzle:
 * a flow never asks whether you meant it, so Title wired into Department makes someone nobody's rules recognise.
 */
import { MINUTES_A_DAY } from './directory.ts';
import { addUser, copyFromHr, switchUser } from './identity.ts';
import { groupsOf, hrOn, type HrRow } from './oktopus.ts';
import type { GameState } from './rules.ts';

export type Trigger = 'hr.joined' | 'hr.moved' | 'hr.left' | 'schedule' | 'helper';
/** What a Workflows ticket asks for: a flow for an HR change, the leaver sweep, or the Voyago report. */
export type FlowTask = 'hr.joined' | 'hr.moved' | 'hr.left' | 'sweep' | 'report';
export type CardKind =
  | 'event' | 'schedule' | 'helper-input' | 'assign' | 'hr-person' | 'hr-list' | 'okta-read' | 'okta-members' | 'concat' | 'join'
  | 'okta-create' | 'okta-update' | 'okta-update-user' | 'okta-deactivate' | 'ad-disable' | 'chat-post'
  | 'foreach' | 'map' | 'call' | 'return';
export type CardGroup = 'Event' | 'Object' | 'Function' | 'Action' | 'List' | 'Flow control';
export type FieldType = 'text' | 'person' | 'people' | 'texts';

export type Input = { wire: { card: string; field: string } } | { text: string };
export interface Card {
  id: string;
  kind: CardKind;
  inputs: Record<string, Input>;
  /** For Each, Map and Call flow: the helper flow they run. */
  helper?: string;
  /** Assign: what you called the value. */
  label?: string;
}
export interface Flow { id: string; name: string; trigger: Trigger; cards: Card[]; on: boolean }
export interface Step { card: string; values: Record<string, string>; error?: string; note?: string; calls?: FlowRun[] }
export interface FlowRun { flow: string; at: number; subject: string; steps: Step[]; test?: true; result?: string }

/** The fields a person object has: HR's row, or Oktopus's profile. Open the object to wire one of them. */
export const PERSON = ['Login', 'Employee ID', 'Name', 'Department', 'Title', 'Manager'] as const;
export type Person = Record<(typeof PERSON)[number], string>;
type Value = string | Person | Person[] | string[];

export const TRIGGERS: Record<Trigger, string> = {
  'hr.joined': 'HR: someone joins',
  'hr.moved': 'HR: someone moves team',
  'hr.left': 'HR: someone leaves',
  schedule: 'Every morning at 9:00',
  helper: 'Called by another flow (helper)',
};
export const TASKS: Record<FlowTask, string> = {
  'hr.joined': TRIGGERS['hr.joined'], 'hr.moved': TRIGGERS['hr.moved'], 'hr.left': TRIGGERS['hr.left'],
  sweep: 'the leaver sweep', report: 'the Voyago report',
};

/** The words for each type, in the hint line and the refusals. */
export const TYPE_WORDS: Record<FieldType, string> = { text: 'text', person: 'one person', people: 'a list of people', texts: 'a list of text' };

interface Field { name: string; type: FieldType; required?: true }
interface Spec { group: CardGroup; title: string; inputs: Field[]; outputs: Field[]; hidden?: true; helper?: true }
const t = (name: string, required?: true): Field => ({ name, type: 'text', ...(required && { required }) });

/** Every kind of card: where it sits in the palette, what it's called, what it needs and what it gives. */
export const CARDS: Record<CardKind, Spec> = {
  event: { group: 'Event', title: 'HR event', inputs: [], outputs: [{ name: 'Person', type: 'person' }], hidden: true },
  schedule: { group: 'Event', title: 'Schedule', inputs: [], outputs: [], hidden: true },
  'helper-input': { group: 'Event', title: 'Helper input', inputs: [], outputs: [{ name: 'User', type: 'person' }], hidden: true },
  assign: { group: 'Flow control', title: 'Assign', inputs: [t('Value', true)], outputs: [{ name: 'Value', type: 'text' }] },
  'hr-person': { group: 'Object', title: 'HR: Get person', inputs: [t('Employee ID', true)], outputs: [{ name: 'Person', type: 'person' }], hidden: true },
  'hr-list': { group: 'Object', title: 'HR: List people', inputs: [t('Status', true)], outputs: [{ name: 'People', type: 'people' }] },
  'okta-read': { group: 'Object', title: 'Oktopus: Read user', inputs: [t('Login', true)], outputs: [{ name: 'User', type: 'person' }] },
  'okta-members': { group: 'Object', title: 'Oktopus: List group members', inputs: [t('Group', true)], outputs: [{ name: 'Users', type: 'people' }] },
  concat: { group: 'Function', title: 'Text: Concatenate', inputs: [t('First', true), t('Second'), t('Third'), t('Fourth')], outputs: [{ name: 'Combined', type: 'text' }] },
  join: { group: 'Function', title: 'Text: Join list', inputs: [{ name: 'List', type: 'texts', required: true }, t('Separator')], outputs: [{ name: 'Text', type: 'text' }] },
  'okta-create': {
    group: 'Action', title: 'Oktopus: Create user',
    inputs: [t('Login', true), t('Employee ID'), t('Name', true), t('Department', true), t('Title'), t('Manager')],
    outputs: [{ name: 'Login', type: 'text' }],
  },
  'okta-update': { group: 'Action', title: 'Oktopus: Update profile from HR', inputs: [t('Login', true)], outputs: [{ name: 'Login', type: 'text' }], hidden: true },
  'okta-update-user': { group: 'Action', title: 'Oktopus: Update user', inputs: [t('Login', true), t('Department'), t('Title'), t('Manager')], outputs: [{ name: 'Login', type: 'text' }] },
  'okta-deactivate': { group: 'Action', title: 'Oktopus: Deactivate user', inputs: [t('Login', true)], outputs: [{ name: 'Login', type: 'text' }] },
  'ad-disable': { group: 'Action', title: 'Active Directory: Disable account', inputs: [t('Login', true)], outputs: [] },
  'chat-post': { group: 'Action', title: 'Burrow Chat: Post to #general', inputs: [t('Message', true)], outputs: [] },
  foreach: { group: 'List', title: 'For Each', inputs: [{ name: 'List', type: 'people', required: true }], outputs: [], helper: true },
  map: { group: 'List', title: 'Map', inputs: [{ name: 'List', type: 'people', required: true }], outputs: [{ name: 'Results', type: 'texts' }], helper: true },
  call: { group: 'Flow control', title: 'Call flow', inputs: [{ name: 'User', type: 'person', required: true }], outputs: [{ name: 'Result', type: 'text' }], helper: true },
  return: { group: 'Flow control', title: 'Return', inputs: [t('Result')], outputs: [] },
};

/** What a flow's first card is: what starts it, and what it hands the rest. */
const FIRST: Record<Trigger, CardKind> = { 'hr.joined': 'event', 'hr.moved': 'event', 'hr.left': 'event', schedule: 'schedule', helper: 'helper-input' };

/** The type of an output a wire reads: a field inside a person (Person.Department) is text. */
export function outputType(kind: CardKind, field: string): FieldType | undefined {
  const [head, sub] = field.split('.');
  const out = CARDS[kind].outputs.find((o) => o.name === head);
  if (!out || !sub) return out?.type;
  return out.type === 'person' && (PERSON as readonly string[]).includes(sub) ? 'text' : undefined;
}

const personOf = (row: HrRow): Person => ({
  Login: row.login, 'Employee ID': row.employeeId, Name: row.name, Department: row.dept, Title: row.title, Manager: row.manager,
});
const personInOkta = (d: GameState, login: string): Person | undefined => {
  const u = d.okta.users[login];
  return u && { Login: login, 'Employee ID': u.employeeId, Name: u.name, Department: u.dept, Title: u.title, Manager: u.manager };
};

/** How a value reads under a card: a person by their login, a list by its length and contents. */
function show(v: Value): string {
  if (typeof v === 'string') return v;
  if (!Array.isArray(v)) return `${v.Name} (${v.Login})`;
  const items = v.map((x) => (typeof x === 'string' ? `“${x}”` : x.Login));
  return `${v.length} ${v.length === 1 ? 'item' : 'items'}${items.length ? `: ${items.join(', ')}` : ''}`;
}

/** Helpers calling helpers stop here: a helper that calls itself would go on for ever. */
const MAX_DEPTH = 3;

/**
 * Run a flow, changing the state in place (pass a copy). Cards run in order; each reads earlier cards' outputs through
 * its wires. A required input left empty stops the flow at that card. `person` is who it's for: the HR event's person,
 * or the User a helper was called with.
 */
export function runIn(d: GameState, flow: Flow, person: Person | undefined, hr: HrRow[], depth = 0): FlowRun {
  const out: Record<string, Record<string, Value>> = {};
  const steps: Step[] = [];
  const at = d.day * MINUTES_A_DAY + d.clock;
  const log = (event: string, target: string) => d.okta.log.push({ at, event, target, by: `flow: ${flow.name}` });
  let result: string | undefined;
  for (const card of flow.cards) {
    const spec = CARDS[card.kind];
    const got: Record<string, Value> = {};
    for (const { name } of spec.inputs) {
      const input = card.inputs[name];
      if (!input) continue;
      if ('text' in input) { got[name] = input.text; continue; }
      const [head = '', sub] = input.wire.field.split('.');
      const v = out[input.wire.card]?.[head];
      const value = sub ? (v && typeof v === 'object' && !Array.isArray(v) ? v[sub as keyof Person] : undefined) : v;
      if (value !== undefined && value !== '') got[name] = value;
    }
    const values = Object.fromEntries(Object.entries(got).map(([k, v]) => [k, show(v)]));
    const step: Step = { card: card.id, values };
    const missing = spec.inputs.find((i) => i.required && got[i.name] === undefined);
    if (missing) {
      step.error = `${missing.name} is empty. Wire it from an earlier card${missing.type === 'text' ? ', or type it in' : ''}.`;
      steps.push(step);
      break;
    }
    const text = (name: string) => (typeof got[name] === 'string' ? got[name] : '');
    const give = (outputs: Record<string, Value>) => {
      out[card.id] = outputs;
      for (const [k, v] of Object.entries(outputs)) values[`→ ${card.kind === 'assign' ? card.label ?? k : k}`] = show(v);
    };
    const login = text('Login');
    const callHelper = (who: Person): FlowRun | string => {
      const helper = d.okta.flows.find((f) => f.id === card.helper && f.trigger === 'helper');
      if (!helper) return 'Pick a helper flow for it to run.';
      if (depth + 1 >= MAX_DEPTH) return `Helpers calling helpers went ${MAX_DEPTH} deep. Does a helper call itself?`;
      return runIn(d, helper, who, hr, depth + 1);
    };
    switch (card.kind) {
      case 'event': if (person) give({ Person: person }); break;
      case 'helper-input': if (person) give({ User: person }); break;
      case 'schedule': break;
      case 'assign': give({ Value: text('Value') }); break;
      case 'hr-person': {
        const found = hr.find((r) => r.employeeId === text('Employee ID'));
        if (!found) step.error = `Nobody in the HR file has employee ID ${text('Employee ID')}.`;
        else give({ Person: personOf(found) });
        break;
      }
      case 'hr-list': {
        const status = text('Status').trim().toLowerCase();
        if (status !== 'active' && status !== 'terminated') step.error = `HR marks everyone as “active” or “terminated”, not “${text('Status')}”.`;
        else give({ People: hr.filter((r) => r.status === status).map(personOf) });
        break;
      }
      case 'okta-read': {
        const found = personInOkta(d, login);
        if (!found) step.error = `There’s nobody called ${login} in Oktopus.`;
        else give({ User: found });
        break;
      }
      case 'okta-members': {
        const group = text('Group');
        if (!d.okta.groups.includes(group)) {
          const near = d.okta.groups.find((g) => g.toLowerCase().replace(/s$/, '') === group.trim().toLowerCase().replace(/s$/, ''));
          step.error = `There’s no group called “${group}” in Oktopus. Group names have to match exactly${near ? `: did you mean “${near}”?` : '.'}`;
        }
        else give({ Users: Object.keys(d.okta.users).filter((l) => d.okta.users[l]?.status === 'active' && groupsOf(d.okta, l).includes(group)).flatMap((l) => personInOkta(d, l) ?? []) });
        break;
      }
      case 'concat': give({ Combined: ['First', 'Second', 'Third', 'Fourth'].map(text).join('') }); break;
      case 'join': give({ Text: (got.List as string[]).join(text('Separator')) }); break;
      case 'okta-create': {
        const details = { employeeId: text('Employee ID'), name: text('Name'), dept: text('Department'), title: text('Title'), manager: text('Manager') };
        if (addUser(d.okta, login, details)) { log('user.lifecycle.create', login); give({ Login: login }); }
        else step.error = `${login} is already in Oktopus.`;
        break;
      }
      case 'okta-update':
        if (copyFromHr(d.okta, login, hr.find((r) => r.login === login))) { log('user.account.update_profile', login); give({ Login: login }); }
        else step.error = `Couldn’t update ${login}: they need to be in Oktopus and in the HR file.`;
        break;
      case 'okta-update-user': {
        const user = d.okta.users[login];
        if (!user) { step.error = `There’s nobody called ${login} in Oktopus to update.`; break; }
        const before = { dept: user.dept, title: user.title, manager: user.manager };
        Object.assign(user, Object.fromEntries(([['dept', 'Department'], ['title', 'Title'], ['manager', 'Manager']] as const).filter(([, f]) => got[f] !== undefined).map(([k, f]) => [k, text(f)])));
        const changed = (['dept', 'title', 'manager'] as const).filter((k) => before[k] !== user[k]).map((k) => `${k === 'dept' ? 'Department' : k === 'title' ? 'Title' : 'Manager'}: ${before[k]} → ${user[k]}`);
        step.note = changed.length ? changed.join('. ') : 'Nothing changed: every field was already what it was given.';
        if (changed.length) log('user.account.update_profile', login);
        give({ Login: login });
        break;
      }
      case 'okta-deactivate': {
        const user = d.okta.users[login];
        if (!user) step.note = `${login} isn’t in Oktopus. Nothing to deactivate.`;
        else if (switchUser(d.okta, login, false)) log('user.lifecycle.deactivate', login);
        else step.note = user.status === 'deactivated' ? `${login} was already deactivated.` : 'A flow can’t switch off your own account.';
        give({ Login: login });
        break;
      }
      case 'ad-disable': {
        const account = d.accounts[login];
        if (!account) step.note = `${login} has no Active Directory account. Nothing to disable.`;
        else if (login === 'intern') step.error = 'A flow can’t switch off your own account either.';
        else if (!account.enabled) step.note = `${login} was already disabled.`;
        else account.enabled = false;
        break;
      }
      case 'chat-post': step.note = 'Posted to #general.'; break;
      case 'foreach':
      case 'map': {
        const runs: FlowRun[] = [];
        for (const who of got.List as Person[]) {
          const r = callHelper(who);
          if (typeof r === 'string') { step.error = r; break; }
          runs.push(r);
        }
        step.calls = runs;
        if (card.kind === 'map' && !step.error) give({ Results: runs.map((r) => r.result ?? '') });
        else if (!step.error) step.note = `Ran the helper ${runs.length} ${runs.length === 1 ? 'time' : 'times'}. For Each doesn’t give anything back.`;
        break;
      }
      case 'call': {
        const r = callHelper(got.User as Person);
        if (typeof r === 'string') step.error = r;
        else { step.calls = [r]; give({ Result: r.result ?? '' }); }
        break;
      }
      case 'return': result = text('Result'); break;
    }
    steps.push(step);
    if (step.error) break;
  }
  return { flow: flow.id, at, subject: person?.Login ?? '', steps, ...(result !== undefined && { result }) };
}

/** Joiners, movers and leavers on a day: what changed in HR since the day before. */
export function hrEvents(day: number): { trigger: Trigger; row: HrRow }[] {
  const before = new Map(hrOn(day - 1).map((r) => [r.employeeId, r]));
  return hrOn(day).flatMap((row): { trigger: Trigger; row: HrRow }[] => {
    const was = before.get(row.employeeId);
    if (!was) return row.status === 'active' ? [{ trigger: 'hr.joined', row }] : [];
    if (was.status === 'active' && row.status === 'terminated') return [{ trigger: 'hr.left', row }];
    return was.dept !== row.dept && row.status === 'active' ? [{ trigger: 'hr.moved', row }] : [];
  });
}

/** Run every switched-on flow for the morning (in place: pass a copy): the schedule's, then one per HR event today. */
export function runToday(d: GameState): void {
  const hr = hrOn(d.day);
  for (const flow of d.okta.flows.filter((f) => f.on && f.trigger === 'schedule')) d.okta.runs.push(runIn(d, flow, undefined, hr));
  for (const { trigger, row } of hrEvents(d.day)) {
    for (const flow of d.okta.flows.filter((f) => f.on && f.trigger === trigger)) d.okta.runs.push(runIn(d, flow, personOf(row), hr));
  }
}

/** Made-up people to test flows on, so nobody real is hurt by a broken one. Pat only turns up for list flows. */
export const SAMPLE: HrRow = { employeeId: 'EMP-9999', login: 'sam.sample', name: 'Sam Sample', dept: 'Finance', title: 'Sample Clerk', manager: 'EMP-1002', status: 'active' };
const SAMPLE_2: HrRow = { employeeId: 'EMP-9998', login: 'pat.sample', name: 'Pat Sample', dept: 'Sales', title: 'Sample Seller', manager: 'EMP-1007', status: 'active' };

/**
 * Try a flow on Sam Sample without touching anything real: a copy of today, with Sam set up as the flow needs. A
 * new starter isn't anywhere yet; a mover is in Oktopus in Marketing; anyone else is signed in everywhere (Oktopus and
 * Active Directory). For a leaver, a helper or the schedule, HR has Sam (and Pat, for lists) as terminated.
 */
export function testFlow(s: GameState, flow: Flow): { run: FlowRun; after: GameState } {
  const d = structuredClone(s);
  const leaving = flow.trigger !== 'hr.joined' && flow.trigger !== 'hr.moved';
  const samples = flow.trigger === 'schedule' ? [SAMPLE, SAMPLE_2] : [SAMPLE];
  for (const r of flow.trigger === 'hr.joined' ? [] : samples) {
    const moving = flow.trigger === 'hr.moved';
    addUser(d.okta, r.login, { employeeId: r.employeeId, name: r.name, dept: moving ? 'Marketing' : r.dept, title: moving ? 'Marketing Clerk' : r.title, manager: moving ? 'EMP-1004' : r.manager });
    if (leaving) d.accounts[r.login] = { name: r.name, dept: r.dept, title: r.title, enabled: true, locked: false, mustChange: false };
  }
  const rows = samples.map((r) => (leaving ? { ...r, status: 'terminated' as const } : r));
  const hr = [...hrOn(d.day), ...rows];
  const run = { ...runIn(d, flow, flow.trigger === 'schedule' ? undefined : personOf(rows[0] ?? SAMPLE), hr), test: true as const };
  return { run, after: d };
}

/** Run a flow for real, now, rather than waiting for the morning: what the Run now button does for a schedule flow. */
export const runNow = (s: GameState, id: string) => edit(s, (flows, d) => {
  const flow = flows.find((f) => f.id === id);
  if (!flow || flow.trigger !== 'schedule') return false;
  d.okta.runs.push(runIn(d, flow, undefined, hrOn(d.day)));
});

/** The first error anywhere in a run, helpers included: helpers can fail too, deep down. */
export function firstError(steps: Step[]): string | undefined {
  for (const x of steps) {
    const inner = x.error ?? firstError((x.calls ?? []).flatMap((r) => r.steps));
    if (inner) return inner;
  }
  return undefined;
}

const off = (d: GameState, login: string) => d.okta.users[login]?.status !== 'active' && d.accounts[login]?.enabled === false;
const callsHelper = (flow: Flow) => flow.cards.some((c) => c.kind === 'call' || c.kind === 'foreach' || c.kind === 'map');

/**
 * What's wrong with the flow for a Workflows ticket, in a sentence, judged by what it does to the samples; undefined
 * when it does the job. `everywhere`: leavers must be off in Active Directory too, not just Oktopus.
 */
export function flowProblem(s: GameState, task: FlowTask, everywhere = false): string | undefined {
  if (task === 'report') return reportProblem(s);
  const trigger = task === 'sweep' ? 'schedule' : task;
  const flow = s.okta.flows.find((f) => f.on && f.trigger === trigger);
  if (!flow) return `There’s no flow for “${TRIGGERS[trigger]}” switched on in Oktopus Workflows.`;
  const { run, after } = testFlow(s, flow);
  const failed = firstError(run.steps);
  if (failed) return `Your flow stops at a card: ${failed}`;
  const sam = after.okta.users[SAMPLE.login];
  if (task === 'sweep') {
    const left = [SAMPLE, SAMPLE_2].filter((r) => !off(after, r.login));
    if (left.length) return `Tested with Sam and Pat Sample both left, your morning flow leaves ${left.map((r) => r.name).join(' and ')} able to sign in to Oktopus or Active Directory. Every leaver should end up off in both.`;
    return flowProblem(s, 'hr.left', true) && 'The sweep works, but your “HR: someone leaves” flow still leaves people on in Active Directory. If both use the same helper, fixing the helper fixes both.';
  }
  if (task === 'hr.left') {
    if (sam?.status === 'active') return 'Run on a leaver, your flow leaves them able to sign in. It needs to deactivate them.';
    if (!callsHelper(flow)) return 'It deactivates them, but all in the one flow. Otis wants the leaver steps in a helper flow, so the morning sweep can use the same steps later.';
    if (everywhere && after.accounts[SAMPLE.login]?.enabled) return 'Your leaver flow switches them off in Oktopus, but not in Active Directory.';
    return undefined;
  }
  if (!sam) return 'Run on a new starter, your flow doesn’t create them in Oktopus.';
  const wrong = (['dept', 'title', 'manager', 'name'] as const).filter((k) => sam[k] !== { dept: SAMPLE.dept, title: SAMPLE.title, manager: SAMPLE.manager, name: SAMPLE.name }[k]);
  if (wrong.length) {
    const words: Record<string, string> = { dept: 'department', title: 'title', manager: 'manager', name: 'name' };
    const start = task === 'hr.moved' ? `Sam Sample moved from Marketing to ${SAMPLE.dept} as ${SAMPLE.title}, but your flow left them with` : `Run on Sam Sample (${SAMPLE.dept}, ${SAMPLE.title}), your flow gives them`;
    return `${start} ${wrong.map((k) => `the ${words[k]} “${sam[k]}”`).join(' and ')}. Check which field is wired into which.`;
  }
  return undefined;
}

/** The Voyago report Otis wants: posted today, by a flow, naming everyone in the Voyago group as Name (Title). */
export const REPORT_GROUP = 'APP-Voyago-Users';
function reportProblem(s: GameState): string | undefined {
  const today = s.day * MINUTES_A_DAY;
  const posted = s.okta.runs.filter((r) => !r.test && r.at >= today)
    .flatMap((r) => r.steps.filter((x) => !x.error && s.okta.flows.find((f) => f.id === r.flow)?.cards.find((c) => c.id === x.card)?.kind === 'chat-post'))
    .at(-1)?.values.Message;
  if (posted === undefined) return 'Otis hasn’t seen anything from a flow in #general today. Build the flow, then press Run now.';
  const expected = Object.entries(s.okta.users).filter(([l, u]) => u.status === 'active' && groupsOf(s.okta, l).includes(REPORT_GROUP)).map(([, u]) => `${u.name} (${u.title})`);
  const missing = expected.find((e) => !posted.includes(e));
  if (missing) return `The flow posted “${posted}”. Otis wanted everyone in ${REPORT_GROUP} as Name (Title), and ${missing} isn’t there.`;
  const extra = Object.values(s.okta.users).find((u) => posted.includes(u.name) && !expected.includes(`${u.name} (${u.title})`));
  return extra ? `The flow posted “${posted}”, but ${extra.name} doesn’t have Voyago.` : undefined;
}

// ---- Building flows ------------------------------------------------------------------------------------------

/** Workflows arrives in week 3, when HR changes start coming faster than one intern can keep up with by hand. */
export const FLOWS_DAY = 11;

/** A change to the flows, on a copy. Building takes thought, not office minutes, so the clock doesn't move. */
function edit(s: GameState, change: (flows: Flow[], d: GameState) => false | undefined): GameState {
  const d = structuredClone(s);
  return change(d.okta.flows, d) === false ? s : d;
}

const nextId = (ids: string[], prefix: string) => `${prefix}${Math.max(0, ...ids.map((id) => Number(id.slice(prefix.length)) || 0)) + 1}`;

export const newFlow = (s: GameState, trigger: Trigger, name: string) => edit(s, (flows) => {
  // Helpers don't wait for HR or the morning: they run when they're called, so they're never switched on or off.
  flows.push({ id: nextId(flows.map((f) => f.id), 'flow-'), name: name.trim() || TRIGGERS[trigger], trigger, on: trigger === 'helper', cards: [{ id: 'c1', kind: FIRST[trigger], inputs: {} }] });
});

export const deleteFlow = (s: GameState, id: string) => edit(s, (flows, d) => {
  const i = flows.findIndex((f) => f.id === id);
  if (i < 0) return false;
  flows.splice(i, 1);
  for (const card of flows.flatMap((f) => f.cards)) if (card.helper === id) delete card.helper;
  d.okta.runs = d.okta.runs.filter((r) => r.flow !== id);
});

export const renameFlow = (s: GameState, id: string, name: string) => edit(s, (flows) => {
  const flow = flows.find((f) => f.id === id);
  if (!flow || !name.trim() || flow.name === name.trim()) return false;
  flow.name = name.trim();
});

/** Switch a flow on or off. Only a flow that's on runs when HR changes. Goes in the System Log. */
export const switchFlow = (s: GameState, id: string, on: boolean) => edit(s, (flows, d) => {
  const flow = flows.find((f) => f.id === id);
  if (!flow || flow.on === on || flow.trigger === 'helper') return false;
  flow.on = on;
  d.okta.log.push({ at: d.day * MINUTES_A_DAY + d.clock, event: on ? 'workflows.flow.activate' : 'workflows.flow.deactivate', target: flow.name });
});

/** Add a card at a position. The first card (what starts the flow) always stays first. */
export const addCard = (s: GameState, id: string, at: number, kind: CardKind) => edit(s, (flows) => {
  const flow = flows.find((f) => f.id === id);
  if (!flow || CARDS[kind].group === 'Event') return false;
  flow.cards.splice(Math.max(1, Math.min(at, flow.cards.length)), 0, { id: nextId(flow.cards.map((c) => c.id), 'c'), kind, inputs: {} });
});

/** Remove a card, and any wires that came from it. The first card can't be removed. */
export const removeCard = (s: GameState, id: string, cardId: string) => edit(s, (flows) => {
  const flow = flows.find((f) => f.id === id);
  const i = flow?.cards.findIndex((c) => c.id === cardId) ?? -1;
  if (!flow || i < 1) return false;
  flow.cards.splice(i, 1);
  for (const card of flow.cards) card.inputs = Object.fromEntries(Object.entries(card.inputs).filter(([, input]) => !('wire' in input && input.wire.card === cardId)));
});

/** Pick the helper a For Each, Map or Call flow card runs; empty to clear it. */
export const setHelper = (s: GameState, id: string, cardId: string, helper: string) => edit(s, (flows) => {
  const card = flows.find((f) => f.id === id)?.cards.find((c) => c.id === cardId);
  if (!card || !CARDS[card.kind].helper || (helper && !flows.some((f) => f.id === helper && f.trigger === 'helper'))) return false;
  if (helper) card.helper = helper; else delete card.helper;
});

/** Name an Assign card's value, so its output pill says what it is. */
export const setLabel = (s: GameState, id: string, cardId: string, label: string) => edit(s, (flows) => {
  const card = flows.find((f) => f.id === id)?.cards.find((c) => c.id === cardId);
  if (card?.kind !== 'assign') return false;
  if (label.trim()) card.label = label.trim(); else delete card.label;
});

/**
 * Why a wire or typed text can't go into an input, in a sentence the hint line shows; undefined when it can. Wires only
 * run left to right, and the types have to fit: this is where the flow teaches what a list, a person and text are.
 */
export function inputProblem(flow: Flow, cardId: string, name: string, input: Input): string | undefined {
  const at = flow.cards.findIndex((c) => c.id === cardId);
  const card = flow.cards[at];
  const want = card && CARDS[card.kind].inputs.find((i) => i.name === name);
  if (!card || !want) return 'That card has no input by that name.';
  if ('text' in input) return want.type === 'text' ? undefined : `${name} wants ${TYPE_WORDS[want.type]}, which you can’t type. Wire it from a card that gives one.`;
  const from = flow.cards.findIndex((c) => c.id === input.wire.card);
  const source = flow.cards[from];
  const got = source && outputType(source.kind, input.wire.field);
  if (!source || !got) return 'That output isn’t there any more.';
  if (from >= at) return 'Wires only go left to right: from a card’s output to a card after it.';
  if (got === want.type) return undefined;
  const label = input.wire.field.split('.').at(-1) ?? input.wire.field;
  const tips: Partial<Record<string, string>> = {
    'person>text': 'Open the person (▸) and wire one of their fields instead.',
    'people>text': 'For Each or Map can run a helper flow once for each of them.',
    'people>person': 'Use For Each or Map: they run a helper flow once for each person in the list.',
    'text>person': 'Wire the whole person, not one of their fields.',
    'texts>text': 'Text: Join list turns a list of text into one piece of text.',
  };
  const tip = tips[`${got}>${want.type}`] ?? '';
  return `${label} is ${TYPE_WORDS[got]}, and ${name} wants ${TYPE_WORDS[want.type]}. ${tip}`.trim();
}

/** Wire an input from an earlier card's output, type text into it, or clear it. Refused when `inputProblem` says why. */
export const setInput = (s: GameState, id: string, cardId: string, name: string, input: Input | undefined) => edit(s, (flows) => {
  const flow = flows.find((f) => f.id === id);
  const card = flow?.cards.find((c) => c.id === cardId);
  if (!flow || !card || !CARDS[card.kind].inputs.some((i) => i.name === name)) return false;
  if (input && inputProblem(flow, cardId, name, input)) return false;
  card.inputs = Object.fromEntries([...Object.entries(card.inputs).filter(([k]) => k !== name), ...(input ? [[name, input] as const] : [])]);
});

/**
 * Flows saved before fields had types: the event gave flat fields (Department), now it gives a Person to open
 * (Person.Department); Concatenate's Separator became its Second part.
 */
export function upgradeFlow(flow: Flow): Flow {
  for (const card of flow.cards) {
    for (const input of Object.values(card.inputs)) {
      if (!('wire' in input)) continue;
      const source = flow.cards.find((c) => c.id === input.wire.card);
      if ((source?.kind === 'event' || source?.kind === 'hr-person') && (PERSON as readonly string[]).includes(input.wire.field)) input.wire.field = `Person.${input.wire.field}`;
    }
    const { Separator, Second } = card.inputs;
    if (card.kind === 'concat' && Separator) {
      card.inputs = { ...card.inputs, Second: Separator, ...(Second && { Third: Second }) };
      delete card.inputs.Separator;
    }
  }
  return flow;
}

// ---- Right answers -------------------------------------------------------------------------------------------

const w = (card: string, field: string) => ({ wire: { card, field } });
const flowOf = (id: string, name: string, trigger: Trigger, cards: Card[]): Flow => ({ id, name, trigger, on: true, cards });
const DEPROVISION = 'flow-deprovision';

/**
 * The flows that do a ticket's job, built the right way: what the save script and tests use, and what a good answer
 * looks like. Each replaces any flow with the same id.
 */
export function goodFlows(task: FlowTask, everywhere = false): Flow[] {
  const person = (f: string) => w('c1', `Person.${f}`);
  const helper = flowOf(DEPROVISION, 'Deprovision_helper', 'helper', [
    { id: 'c1', kind: 'helper-input', inputs: {} },
    { id: 'c2', kind: 'okta-deactivate', inputs: { Login: w('c1', 'User.Login') } },
    ...(everywhere || task === 'sweep' ? [{ id: 'c3', kind: 'ad-disable' as const, inputs: { Login: w('c1', 'User.Login') } }] : []),
  ]);
  switch (task) {
    case 'hr.joined': return [flowOf('flow-hr.joined', 'New starters', 'hr.joined', [
      { id: 'c1', kind: 'event', inputs: {} },
      { id: 'c2', kind: 'okta-create', inputs: Object.fromEntries(PERSON.map((f) => [f, person(f)])) },
    ])];
    case 'hr.moved': return [flowOf('flow-hr.moved', 'Movers', 'hr.moved', [
      { id: 'c1', kind: 'event', inputs: {} },
      { id: 'c2', kind: 'okta-update-user', inputs: { Login: person('Login'), Department: person('Department'), Title: person('Title'), Manager: person('Manager') } },
    ])];
    case 'hr.left': return [helper, flowOf('flow-hr.left', 'Leavers', 'hr.left', [
      { id: 'c1', kind: 'event', inputs: {} },
      { id: 'c2', kind: 'call', helper: DEPROVISION, inputs: { User: w('c1', 'Person') } },
    ])];
    case 'sweep': return [...goodFlows('hr.left', true), flowOf('flow-sweep', 'Leaver sweep', 'schedule', [
      { id: 'c1', kind: 'schedule', inputs: {} },
      { id: 'c2', kind: 'hr-list', inputs: { Status: { text: 'terminated' } } },
      { id: 'c3', kind: 'foreach', helper: DEPROVISION, inputs: { List: w('c2', 'People') } },
    ])];
    case 'report': return [
      flowOf('flow-name', 'Name_helper', 'helper', [
        { id: 'c1', kind: 'helper-input', inputs: {} },
        { id: 'c2', kind: 'concat', inputs: { First: w('c1', 'User.Name'), Second: { text: ' (' }, Third: w('c1', 'User.Title'), Fourth: { text: ')' } } },
        { id: 'c3', kind: 'return', inputs: { Result: w('c2', 'Combined') } },
      ]),
      { ...flowOf('flow-report', 'Voyago report', 'schedule', [
        { id: 'c1', kind: 'schedule', inputs: {} },
        { id: 'c2', kind: 'assign', label: 'Group', inputs: { Value: { text: REPORT_GROUP } } },
        { id: 'c3', kind: 'okta-members', inputs: { Group: w('c2', 'Value') } },
        { id: 'c4', kind: 'map', helper: 'flow-name', inputs: { List: w('c3', 'Users') } },
        { id: 'c5', kind: 'join', inputs: { List: w('c4', 'Results'), Separator: { text: ', ' } } },
        { id: 'c6', kind: 'chat-post', inputs: { Message: w('c5', 'Text') } },
      ]), on: false },
    ];
  }
}

/** Put a ticket's right-answer flows in, replacing any with the same ids; the report is also run, as Otis asked. */
export function withGoodFlows(s: GameState, task: FlowTask, everywhere = false): GameState {
  const good = goodFlows(task, everywhere);
  const next = { ...s, okta: { ...s.okta, flows: [...s.okta.flows.filter((f) => !good.some((g) => g.id === f.id || (g.trigger.startsWith('hr.') && g.trigger === f.trigger && f.on))), ...good] } };
  return task === 'report' ? runNow(next, 'flow-report') : next;
}
