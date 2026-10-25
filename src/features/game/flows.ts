/**
 * Oktopus Flows: automation built from cards, like Okta Workflows. A flow starts from an HR event (someone joins,
 * moves or leaves), and each card after it takes fields from earlier cards (a wire) or typed text, and does one thing.
 * Wiring is the puzzle: wire Title into Department and the flow will happily create someone in a department that
 * doesn't exist, and no rule will give them anything.
 */
import { MINUTES_A_DAY } from './directory.ts';
import { addUser, copyFromHr, switchUser } from './identity.ts';
import { hrOn, type HrRow } from './oktopus.ts';
import type { GameState } from './rules.ts';

export type Trigger = 'hr.joined' | 'hr.moved' | 'hr.left';
export type CardKind = 'event' | 'hr-person' | 'concat' | 'okta-create' | 'okta-update' | 'okta-deactivate' | 'ad-disable' | 'chat-post' | 'return';
export type CardGroup = 'Event' | 'Object' | 'Function' | 'Action' | 'Flow control';

export type Input = { wire: { card: string; field: string } } | { text: string };
export interface Card { id: string; kind: CardKind; inputs: Record<string, Input> }
export interface Flow { id: string; name: string; trigger: Trigger; cards: Card[]; on: boolean }
export interface Step { card: string; values: Record<string, string>; error?: string; note?: string }
export interface FlowRun { flow: string; at: number; subject: string; steps: Step[]; test?: true }

/** The fields an HR row gives a flow: what the event card and the HR card put out. */
export const PERSON = ['Login', 'Employee ID', 'Name', 'Department', 'Title', 'Manager'] as const;

export const TRIGGERS: Record<Trigger, string> = {
  'hr.joined': 'HR: someone joins',
  'hr.moved': 'HR: someone moves team',
  'hr.left': 'HR: someone leaves',
};

/** Every kind of card: where it sits in the palette, what it's called, what it needs and what it gives. */
export const CARDS: Record<CardKind, { group: CardGroup; title: string; inputs: { name: string; required?: true }[]; outputs: readonly string[] }> = {
  event: { group: 'Event', title: 'HR event', inputs: [], outputs: PERSON },
  'hr-person': { group: 'Object', title: 'HR: Get person', inputs: [{ name: 'Employee ID', required: true }], outputs: PERSON },
  concat: { group: 'Function', title: 'Text: Concatenate', inputs: [{ name: 'First', required: true }, { name: 'Separator' }, { name: 'Second', required: true }], outputs: ['Combined'] },
  'okta-create': {
    group: 'Action', title: 'Oktopus: Create user',
    inputs: [{ name: 'Login', required: true }, { name: 'Employee ID' }, { name: 'Name', required: true }, { name: 'Department', required: true }, { name: 'Title' }, { name: 'Manager' }],
    outputs: ['Login'],
  },
  'okta-update': { group: 'Action', title: 'Oktopus: Update profile from HR', inputs: [{ name: 'Login', required: true }], outputs: ['Login'] },
  'okta-deactivate': { group: 'Action', title: 'Oktopus: Deactivate user', inputs: [{ name: 'Login', required: true }], outputs: ['Login'] },
  'ad-disable': { group: 'Action', title: 'Active Directory: Disable account', inputs: [{ name: 'Login', required: true }], outputs: [] },
  'chat-post': { group: 'Action', title: 'Burrow Chat: Post to #general', inputs: [{ name: 'Message', required: true }], outputs: [] },
  return: { group: 'Flow control', title: 'Return', inputs: [{ name: 'Result' }], outputs: [] },
};

const personOf = (row: HrRow): Record<string, string> => ({
  Login: row.login, 'Employee ID': row.employeeId, Name: row.name, Department: row.dept, Title: row.title, Manager: row.manager,
});

/**
 * Run a flow for one HR row, changing the state in place (pass a copy). Cards run in order; each reads earlier cards'
 * outputs through its wires. A required input left empty stops the flow at that card.
 */
export function runIn(d: GameState, flow: Flow, row: HrRow, hr: HrRow[]): FlowRun {
  const out: Record<string, Record<string, string>> = {};
  const steps: Step[] = [];
  const at = d.day * MINUTES_A_DAY + d.clock;
  const log = (event: string, target: string) => d.okta.log.push({ at, event, target, by: `flow: ${flow.name}` });
  for (const card of flow.cards) {
    const spec = CARDS[card.kind];
    const values: Record<string, string> = {};
    for (const { name } of spec.inputs) {
      const input = card.inputs[name];
      const value = !input ? undefined : 'text' in input ? input.text : out[input.wire.card]?.[input.wire.field];
      if (value) values[name] = value;
    }
    const missing = spec.inputs.find((i) => i.required && !values[i.name]);
    if (missing) {
      steps.push({ card: card.id, values, error: `${missing.name} is empty. Wire it from an earlier card, or type it in.` });
      break;
    }
    const step: Step = { card: card.id, values };
    const login = values.Login ?? '';
    switch (card.kind) {
      case 'event': out[card.id] = personOf(row); Object.assign(values, out[card.id]); break;
      case 'hr-person': {
        const found = hr.find((r) => r.employeeId === values['Employee ID']);
        if (!found) step.error = `Nobody in the HR file has employee ID ${values['Employee ID']}.`;
        else { out[card.id] = personOf(found); Object.assign(values, out[card.id]); }
        break;
      }
      case 'concat': out[card.id] = { Combined: `${values.First ?? ''}${values.Separator ?? ''}${values.Second ?? ''}` }; values.Combined = out[card.id]?.Combined ?? ''; break;
      case 'okta-create': {
        const details = { employeeId: values['Employee ID'] ?? '', name: values.Name ?? '', dept: values.Department ?? '', title: values.Title ?? '', manager: values.Manager ?? '' };
        if (addUser(d.okta, login, details)) { log('user.lifecycle.create', login); out[card.id] = { Login: login }; }
        else step.error = `${login} is already in Oktopus.`;
        break;
      }
      case 'okta-update':
        if (copyFromHr(d.okta, login, hr.find((r) => r.login === login))) { log('user.account.update_profile', login); out[card.id] = { Login: login }; }
        else step.error = `Couldn’t update ${login}: they need to be in Oktopus and in the HR file.`;
        break;
      case 'okta-deactivate':
        if (switchUser(d.okta, login, false)) { log('user.lifecycle.deactivate', login); out[card.id] = { Login: login }; }
        else step.error = `Couldn’t deactivate ${login}: they aren’t an active Oktopus user.`;
        break;
      case 'ad-disable': {
        const account = d.accounts[login];
        if (!account) step.note = `${login} has no Active Directory account. Nothing to disable.`;
        else if (login === 'intern') step.error = 'A flow can’t switch off your own account either.';
        else account.enabled = false;
        break;
      }
      case 'chat-post': step.note = 'Posted to #general.'; break;
      case 'return': break;
    }
    steps.push(step);
    if (step.error) break;
  }
  return { flow: flow.id, at, subject: row.login, steps };
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

/** Run every switched-on flow for every HR event today (in place: pass a copy). The runs go in the flow history. */
export function runToday(d: GameState): void {
  for (const { trigger, row } of hrEvents(d.day)) {
    for (const flow of d.okta.flows.filter((f) => f.on && f.trigger === trigger)) d.okta.runs.push(runIn(d, flow, row, hrOn(d.day)));
  }
}

/** A made-up person to test flows on, so nobody real is hurt by a broken one. */
export const SAMPLE: HrRow = { employeeId: 'EMP-9999', login: 'sam.sample', name: 'Sam Sample', dept: 'Finance', title: 'Sample Clerk', manager: 'EMP-1002', status: 'active' };

/**
 * Try a flow on Sam Sample without touching anything real: a copy of today, with Sam set up as the trigger needs
 * (already in Oktopus in Marketing to move, or active to leave). Returns what happened, and the copy to inspect.
 */
export function testFlow(s: GameState, flow: Flow): { run: FlowRun; after: GameState } {
  const d = structuredClone(s);
  const row = flow.trigger === 'hr.left' ? { ...SAMPLE, status: 'terminated' as const } : SAMPLE;
  if (flow.trigger !== 'hr.joined') addUser(d.okta, SAMPLE.login, { employeeId: SAMPLE.employeeId, name: SAMPLE.name, dept: flow.trigger === 'hr.moved' ? 'Marketing' : SAMPLE.dept, title: SAMPLE.title, manager: SAMPLE.manager });
  const run = { ...runIn(d, flow, row, [...hrOn(d.day), row]), test: true as const };
  return { run, after: d };
}

/**
 * What a flow for a trigger should leave Sam Sample as, in a sentence when it doesn't; undefined when it's right.
 * `everywhere`: a leaver flow must also switch them off in Active Directory.
 */
export function flowProblem(s: GameState, trigger: Trigger, everywhere = false): string | undefined {
  const flow = s.okta.flows.find((f) => f.on && f.trigger === trigger);
  if (!flow) return `There’s no flow for \u201C${TRIGGERS[trigger]}\u201D switched on in Oktopus Workflows.`;
  if (everywhere && !flow.cards.some((c) => c.kind === 'ad-disable' && c.inputs.Login)) {
    return 'Your leaver flow switches them off in Oktopus, but not in Active Directory. Add an Active Directory: Disable account card, with their Login wired in.';
  }
  const { run, after } = testFlow(s, flow);
  const failed = run.steps.find((x) => x.error);
  if (failed) return `Your flow stops at a card: ${failed.error}`;
  const sam = after.okta.users[SAMPLE.login];
  if (trigger === 'hr.left') return sam?.status === 'active' ? 'Run on a leaver, your flow leaves them able to sign in. It needs to deactivate them.' : undefined;
  if (!sam) return 'Run on a new starter, your flow doesn’t create them in Oktopus.';
  const wrong = (['dept', 'title', 'manager', 'name'] as const).filter((k) => sam[k] !== { dept: SAMPLE.dept, title: SAMPLE.title, manager: SAMPLE.manager, name: SAMPLE.name }[k]);
  if (wrong.length) {
    const words: Record<string, string> = { dept: 'department', title: 'title', manager: 'manager', name: 'name' };
    return `Run on Sam Sample (${SAMPLE.dept}, ${SAMPLE.title}), your flow gives them ${wrong.map((k) => `the ${words[k]} “${sam[k]}”`).join(' and ')}. Check which field is wired into which.`;
  }
  return undefined;
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
  flows.push({ id: nextId(flows.map((f) => f.id), 'flow-'), name: name.trim() || TRIGGERS[trigger], trigger, on: false, cards: [{ id: 'c1', kind: 'event', inputs: {} }] });
});

export const deleteFlow = (s: GameState, id: string) => edit(s, (flows, d) => {
  const i = flows.findIndex((f) => f.id === id);
  if (i < 0) return false;
  flows.splice(i, 1);
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
  if (!flow || flow.on === on) return false;
  flow.on = on;
  d.okta.log.push({ at: d.day * MINUTES_A_DAY + d.clock, event: on ? 'workflows.flow.activate' : 'workflows.flow.deactivate', target: flow.name });
});

/** Add a card at a position. The event always stays first. */
export const addCard = (s: GameState, id: string, at: number, kind: CardKind) => edit(s, (flows) => {
  const flow = flows.find((f) => f.id === id);
  if (!flow || kind === 'event') return false;
  flow.cards.splice(Math.max(1, Math.min(at, flow.cards.length)), 0, { id: nextId(flow.cards.map((c) => c.id), 'c'), kind, inputs: {} });
});

/** Remove a card, and any wires that came from it. The event can't be removed. */
export const removeCard = (s: GameState, id: string, cardId: string) => edit(s, (flows) => {
  const flow = flows.find((f) => f.id === id);
  const i = flow?.cards.findIndex((c) => c.id === cardId) ?? -1;
  if (!flow || i < 1) return false;
  flow.cards.splice(i, 1);
  for (const card of flow.cards) card.inputs = Object.fromEntries(Object.entries(card.inputs).filter(([, input]) => !('wire' in input && input.wire.card === cardId)));
});

/** Wire an input from an earlier card's output, type text into it, or clear it. Wires only run left to right. */
export const setInput = (s: GameState, id: string, cardId: string, name: string, input: Input | undefined) => edit(s, (flows) => {
  const flow = flows.find((f) => f.id === id);
  const at = flow?.cards.findIndex((c) => c.id === cardId) ?? -1;
  const card = flow?.cards[at];
  if (!flow || !card || !CARDS[card.kind].inputs.some((i) => i.name === name)) return false;
  if (input && 'wire' in input) {
    const from = flow.cards.findIndex((c) => c.id === input.wire.card);
    if (from < 0 || from >= at || !CARDS[flow.cards[from]?.kind ?? 'return'].outputs.includes(input.wire.field)) return false;
  }
  card.inputs = Object.fromEntries([...Object.entries(card.inputs).filter(([k]) => k !== name), ...(input ? [[name, input] as const] : [])]);
});

/** A flow that does the job, built the right way: what the save script and tests use, and what a good answer looks like. */
export function goodFlow(trigger: Trigger, everywhere = false): Flow {
  const login = { wire: { card: 'c1', field: 'Login' } };
  const field = (f: string) => ({ wire: { card: 'c1', field: f } });
  const cards: Card[] = [{ id: 'c1', kind: 'event', inputs: {} }];
  if (trigger === 'hr.joined') {
    cards.push({ id: 'c2', kind: 'okta-create', inputs: { Login: login, Name: field('Name'), Department: field('Department'), Title: field('Title'), Manager: field('Manager'), 'Employee ID': field('Employee ID') } });
  } else if (trigger === 'hr.moved') {
    cards.push({ id: 'c2', kind: 'okta-update', inputs: { Login: login } });
  } else {
    cards.push({ id: 'c2', kind: 'okta-deactivate', inputs: { Login: login } });
    if (everywhere) cards.push({ id: 'c3', kind: 'ad-disable', inputs: { Login: login } });
  }
  return { id: `flow-${trigger}`, name: TRIGGERS[trigger], trigger, on: true, cards };
}
