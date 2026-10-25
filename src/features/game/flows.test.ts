import { describe, expect, it } from 'vitest';
import { addCard, flowProblem, goodFlows, hrEvents, inputProblem, newFlow, removeCard, runToday, setInput, testFlow, upgradeFlow, withGoodFlows, type Card, type Flow } from './flows.ts';
import { addApp, addGroup, addRule, assignApp, createFromHr } from './identity.ts';
import { runNow } from './flows.ts';
import { appsOf, hrOn } from './oktopus.ts';
import { goTo, newGame, type GameState } from './rules.ts';

const wire = (card: string, field: string) => ({ wire: { card, field } });
const p = (f: string) => wire('e', `Person.${f}`);
const PERSON_WIRES = { Login: p('Login'), Name: p('Name'), Department: p('Department'), Title: p('Title'), Manager: p('Manager'), 'Employee ID': p('Employee ID') };
const event: Card = { id: 'e', kind: 'event', inputs: {} };
const flow = (trigger: Flow['trigger'], cards: Card[], on = true): Flow => ({ id: trigger, name: trigger, trigger, cards, on });
const joiner = (inputs: Card['inputs'] = PERSON_WIRES) => flow('hr.joined', [event, { id: 'c', kind: 'okta-create', inputs }]);

/** A morning with Finance on Oktopus the right way (as HR had them the day before), Voyago going to Finance through its group. */
function financeOn(day: number): GameState {
  let s = goTo(newGame(1), 'desk');
  s = { ...s, day: day - 1 };
  for (const r of hrOn(day - 1).filter((x) => x.dept === 'Finance' && x.status === 'active')) s = createFromHr(s, r.login);
  s = addRule(addGroup(s, 'DEPT-Finance'), { group: 'DEPT-Finance', dept: 'Finance' });
  s = addRule(addGroup(addApp(s, 'voyago'), 'APP-Voyago-Users'), { group: 'APP-Voyago-Users', memberOf: 'DEPT-Finance' });
  return { ...assignApp(s, 'voyago', 'APP-Voyago-Users'), day };
}
/** Run the morning's flows on a copy, as the start of the day does. */
const morning = (s: GameState, flows: Flow[]) => { const d = structuredClone({ ...s, okta: { ...s.okta, flows } }); runToday(d); return d; };

describe('HR events', () => {
  it('finds each day’s joiners, movers and leavers by comparing HR with the day before', () => {
    expect(hrEvents(7).map((e) => [e.trigger, e.row.login])).toEqual([['hr.joined', 'fern']]);
    expect(hrEvents(8).map((e) => [e.trigger, e.row.login])).toEqual([['hr.moved', 'basil']]);
    expect(hrEvents(9).map((e) => [e.trigger, e.row.login])).toEqual([['hr.left', 'wren']]);
    expect(hrEvents(13).map((e) => [e.trigger, e.row.login])).toEqual([['hr.joined', 'hazel']]);
    expect(hrEvents(14).map((e) => [e.trigger, e.row.login])).toEqual([['hr.moved', 'pip']]);
    expect(hrEvents(15).map((e) => [e.trigger, e.row.login])).toEqual([['hr.left', 'hazel']]);
    expect(hrEvents(12)).toEqual([]);
  });
});

describe('flows', () => {
  it('a joiner flow wired right creates the new starter exactly as HR has them, and the rules give them their apps', () => {
    const d = morning(financeOn(13), [joiner()]);
    expect(d.okta.users.hazel).toMatchObject({ dept: 'Finance', title: 'Accounts Assistant', manager: 'EMP-1002', status: 'active' });
    expect(appsOf(d.okta, 'hazel')).toEqual(['voyago']);
    expect(d.okta.runs.at(-1)).toMatchObject({ flow: 'hr.joined', subject: 'hazel' });
    expect(d.okta.log.at(-1)).toMatchObject({ event: 'user.lifecycle.create', target: 'hazel', by: 'flow: hr.joined' });
    expect(flowProblem(financeOn(13), 'hr.joined')).toMatch(/no flow for “HR: someone joins” switched on/);
    expect(flowProblem({ ...financeOn(13), okta: { ...financeOn(13).okta, flows: [joiner()] } }, 'hr.joined')).toBeUndefined();
  });

  it('wired wrong, it does the wrong thing without complaint: Title into Department means no rule matches, so no apps', () => {
    const wrong = joiner({ ...PERSON_WIRES, Department: p('Title') });
    const d = morning(financeOn(13), [wrong]);
    expect(d.okta.users.hazel?.dept).toBe('Accounts Assistant');
    expect(appsOf(d.okta, 'hazel')).toEqual([]);
    const s = financeOn(13);
    expect(flowProblem({ ...s, okta: { ...s.okta, flows: [wrong] } }, 'hr.joined')).toMatch(/the department “Sample Clerk”/);
  });

  it('a flow that’s switched off does nothing', () => {
    const d = morning(financeOn(13), [{ ...joiner(), on: false }]);
    expect(d.okta.users.hazel).toBeUndefined();
    expect(d.okta.runs).toEqual([]);
  });

  it('stops at a card whose required input is empty, and says which', () => {
    const noDept: Card['inputs'] = { ...PERSON_WIRES };
    delete noDept.Department;
    const d = morning(financeOn(13), [joiner(noDept)]);
    expect(d.okta.users.hazel).toBeUndefined();
    expect(d.okta.runs.at(-1)?.steps.at(-1)).toMatchObject({ card: 'c', error: expect.stringMatching(/Department is empty/) });
  });

  it('a leaver flow deactivates them in Oktopus, and with an Active Directory card switches them off there too', () => {
    let s = financeOn(9);
    s = createFromHr({ ...s, day: 8 }, 'wren');
    s = { ...s, day: 9 };
    const leaver = flow('hr.left', [event, { id: 'x', kind: 'okta-deactivate', inputs: { Login: p('Login') } }, { id: 'a', kind: 'ad-disable', inputs: { Login: p('Login') } }]);
    const d = morning(s, [leaver]);
    expect(d.okta.users.wren?.status).toBe('deactivated');
    expect(d.accounts.wren?.enabled).toBe(false);
  });

  it('builds text with Concatenate, like Login and "@burrow.co"', () => {
    const f = flow('hr.joined', [event, { id: 't', kind: 'concat', inputs: { First: p('Login'), Second: { text: '@' }, Third: { text: 'burrow.co' } } }]);
    expect(testFlow(financeOn(13), f).run.steps.at(-1)?.values['→ Combined']).toBe('sam.sample@burrow.co');
  });

  it('testing a flow never touches the real game', () => {
    const s = { ...financeOn(13), okta: { ...financeOn(13).okta, flows: [joiner()] } };
    const before = JSON.stringify(s);
    const { run, after } = testFlow(s, joiner());
    expect(run.test).toBe(true);
    expect(after.okta.users['sam.sample']).toBeDefined();
    expect(JSON.stringify(s)).toBe(before);
  });

  it('building: wires only run left to right, and removing a card takes its wires with it', () => {
    let s = newFlow(financeOn(13), 'hr.joined', 'New starters');
    s = addCard(addCard(s, 'flow-1', 1, 'concat'), 'flow-1', 2, 'okta-create');
    const [, concat, create] = s.okta.flows[0]?.cards ?? [];
    expect([concat?.kind, create?.kind]).toEqual(['concat', 'okta-create']);
    s = setInput(s, 'flow-1', create?.id ?? '', 'Login', wire(concat?.id ?? '', 'Combined'));
    expect(s.okta.flows[0]?.cards[2]?.inputs.Login).toBeDefined();
    expect(setInput(s, 'flow-1', concat?.id ?? '', 'First', wire(create?.id ?? '', 'Login'))).toBe(s); // right to left: refused
    expect(setInput(s, 'flow-1', create?.id ?? '', 'Login', wire('c1', 'Nonsense'))).toBe(s); // no such output: refused
    s = removeCard(s, 'flow-1', concat?.id ?? '');
    expect(s.okta.flows[0]?.cards.find((c) => c.kind === 'okta-create')?.inputs).toEqual({});
    expect(removeCard(s, 'flow-1', 'c1')).toBe(s); // the event stays
  });

  it('types: a whole person or a list can\u2019t go where one piece of text is wanted, and the refusal says what to do', () => {
    const f = flow('schedule', [{ id: 's', kind: 'schedule', inputs: {} }, { id: 'l', kind: 'hr-list', inputs: {} }, { id: 'r', kind: 'okta-read', inputs: {} }, { id: 'c', kind: 'call', inputs: {} }]);
    expect(inputProblem(f, 'r', 'Login', wire('l', 'People'))).toMatch(/People is a list of people, and Login wants text\. For Each or Map/);
    expect(inputProblem(f, 'c', 'User', wire('l', 'People'))).toMatch(/Use For Each or Map/);
    expect(inputProblem(f, 'c', 'User', wire('r', 'User.Login'))).toMatch(/Wire the whole person/);
    expect(inputProblem(f, 'c', 'User', wire('r', 'User'))).toBeUndefined();
    expect(inputProblem(f, 'c', 'User', { text: 'hazel' })).toMatch(/can\u2019t type/);
    const j = flow('hr.joined', [event, { id: 'c', kind: 'okta-create', inputs: {} }]);
    expect(inputProblem(j, 'c', 'Login', wire('e', 'Person'))).toMatch(/Open the person/);
    expect(inputProblem(j, 'c', 'Login', wire('e', 'Person.Login'))).toBeUndefined();
  });

  it('a mover flow that wires the old department (from Oktopus) instead of the new one (from HR) changes nothing', () => {
    const wrong = flow('hr.moved', [event, { id: 'r', kind: 'okta-read', inputs: { Login: p('Login') } },
      { id: 'u', kind: 'okta-update-user', inputs: { Login: p('Login'), Department: wire('r', 'User.Department'), Title: p('Title'), Manager: p('Manager') } }]);
    const s = financeOn(14);
    expect(flowProblem({ ...s, okta: { ...s.okta, flows: [wrong] } }, 'hr.moved')).toMatch(/left them with the department \u201CMarketing\u201D/);
    expect(flowProblem(withGoodFlows(s, 'hr.moved'), 'hr.moved')).toBeUndefined();
  });

  it('a leaver flow should hand the person to a helper, and the helper\u2019s steps show under the card that called it', () => {
    const s = financeOn(15);
    const inline = flow('hr.left', [event, { id: 'x', kind: 'okta-deactivate', inputs: { Login: p('Login') } }]);
    expect(flowProblem({ ...s, okta: { ...s.okta, flows: [inline] } }, 'hr.left')).toMatch(/helper flow/);
    const good = withGoodFlows(s, 'hr.left');
    expect(flowProblem(good, 'hr.left')).toBeUndefined();
    const run = testFlow(good, good.okta.flows.find((f) => f.trigger === 'hr.left') as Flow).run;
    expect(run.steps[1]?.calls?.[0]?.steps.map((x) => x.values.Login)).toEqual([undefined, 'sam.sample']);
  });

  it('the morning sweep runs the helper for every leaver in HR, switching each off in Oktopus and Active Directory', () => {
    const s = withGoodFlows(financeOn(17), 'sweep');
    expect(flowProblem(s, 'sweep')).toBeUndefined();
    const d = morning(s, s.okta.flows);
    expect(d.accounts.wren?.enabled).toBe(false);
    expect(d.accounts.sam?.enabled).toBe(false);
    // A sweep whose helper only does Oktopus leaves Active Directory on.
    const halfway = { ...s, okta: { ...s.okta, flows: s.okta.flows.map((f) => (f.trigger === 'helper' ? { ...f, cards: f.cards.filter((c) => c.kind !== 'ad-disable') } : f)) } };
    expect(flowProblem(halfway, 'sweep')).toMatch(/leaves Sam Sample and Pat Sample able to sign in/);
  });

  it('a helper that calls itself stops, rather than running for ever', () => {
    const loop: Flow = { id: 'h', name: 'Loop', trigger: 'helper', on: true, cards: [{ id: 'c1', kind: 'helper-input', inputs: {} }, { id: 'c2', kind: 'call', helper: 'h', inputs: { User: wire('c1', 'User') } }] };
    const caller = flow('hr.left', [event, { id: 'c', kind: 'call', helper: 'h', inputs: { User: wire('e', 'Person') } }]);
    const s = financeOn(15);
    expect(flowProblem({ ...s, okta: { ...s.okta, flows: [loop, caller] } }, 'hr.left')).toMatch(/went 3 deep/);
  });

  it('the Voyago report: Map collects what the helper returns; For Each in its place gives nothing to post', () => {
    let s = financeOn(23);
    s = withGoodFlows(s, 'report');
    expect(flowProblem(s, 'report')).toBeUndefined();
    const posted = s.okta.runs.at(-1)?.steps.at(-1)?.values.Message;
    expect(posted).toContain('Dot (Accounts Clerk)');
    const forEach = { ...s, okta: { ...s.okta, runs: [], flows: s.okta.flows.map((f) => ({ ...f, cards: f.cards.map((c) => (c.kind === 'map' ? { ...c, kind: 'foreach' as const } : c)) })) } };
    const after = runNow(forEach, 'flow-report');
    expect(after.okta.runs.at(-1)?.steps.at(-1)?.error).toMatch(/List is empty/);
    expect(flowProblem(after, 'report')).toMatch(/hasn\u2019t seen anything/);
  });

  it('flows saved before types upgrade: event fields move inside the Person, and Concatenate keeps its parts in order', () => {
    const old = flow('hr.joined', [event, { id: 't', kind: 'concat', inputs: { First: wire('e', 'Login'), Separator: { text: '@' }, Second: { text: 'burrow.co' } } }]);
    const up = upgradeFlow(structuredClone(old));
    expect(up.cards[1]?.inputs).toEqual({ First: p('Login'), Second: { text: '@' }, Third: { text: 'burrow.co' } });
    expect(goodFlows('hr.joined')[0]?.cards[1]?.inputs.Login).toEqual(wire('c1', 'Person.Login'));
  });

  it('the morning gives everyone in HR, leavers too: a report that forgets to filter out leavers names Hazel, who left', () => {
    const s = withGoodFlows(financeOn(23), 'report');
    const noStatus = { ...s, okta: { ...s.okta, runs: [], flows: s.okta.flows.map((f) => (f.id === 'flow-report' ? { ...f, cards: f.cards.map((c) => (c.id === 'c3' ? { ...c, inputs: { ...c.inputs, List: wire('c1', 'People') } } : c)) } : f)) } };
    expect(flowProblem(runNow(noStatus, 'flow-report'), 'report')).toMatch(/Hazel shouldn\u2019t be on it: they\u2019ve left/);
    const typo = { ...s, okta: { ...s.okta, flows: s.okta.flows.map((f) => ({ ...f, cards: f.cards.map((c) => (c.id === 'c2' && f.id === 'flow-report' ? { ...c, inputs: { ...c.inputs, Field: { text: 'Stauts' } } } : c)) })) } };
    expect(runNow(typo, 'flow-report').okta.runs.at(-1)?.steps.at(-1)?.error).toMatch(/no field called \u201CStauts\u201D/);
  });
});
