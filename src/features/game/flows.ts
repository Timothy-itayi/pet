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
    inputs: [{ name: 'Login', required: true }, { name: 'Name', required: true }, { name: 'Department', required: true }, { name: 'Title' }, { name: 'Manager' }, { name: 'Employee ID' }],
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

/** What a flow for a trigger should leave Sam Sample as, in a sentence when it doesn't; undefined when it's right. */
export function flowProblem(s: GameState, trigger: Trigger): string | undefined {
  const flow = s.okta.flows.find((f) => f.on && f.trigger === trigger);
  if (!flow) return `There’s no ${TRIGGERS[trigger].replace('HR: ', '').replace('someone ', '')} flow switched on in Oktopus Workflows.`;
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
