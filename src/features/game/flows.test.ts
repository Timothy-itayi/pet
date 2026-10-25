import { describe, expect, it } from 'vitest';
import { flowProblem, hrEvents, runToday, testFlow, type Card, type Flow } from './flows.ts';
import { addApp, addGroup, addRule, assignApp, createFromHr } from './identity.ts';
import { appsOf, hrOn } from './oktopus.ts';
import { goTo, newGame, type GameState } from './rules.ts';

const wire = (card: string, field: string) => ({ wire: { card, field } });
const PERSON_WIRES = { Login: wire('e', 'Login'), Name: wire('e', 'Name'), Department: wire('e', 'Department'), Title: wire('e', 'Title'), Manager: wire('e', 'Manager'), 'Employee ID': wire('e', 'Employee ID') };
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
    expect(flowProblem(financeOn(13), 'hr.joined')).toMatch(/no joins flow/);
    expect(flowProblem({ ...financeOn(13), okta: { ...financeOn(13).okta, flows: [joiner()] } }, 'hr.joined')).toBeUndefined();
  });

  it('wired wrong, it does the wrong thing without complaint: Title into Department means no rule matches, so no apps', () => {
    const wrong = joiner({ ...PERSON_WIRES, Department: wire('e', 'Title') });
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
    const leaver = flow('hr.left', [event, { id: 'x', kind: 'okta-deactivate', inputs: { Login: wire('e', 'Login') } }, { id: 'a', kind: 'ad-disable', inputs: { Login: wire('e', 'Login') } }]);
    const d = morning(s, [leaver]);
    expect(d.okta.users.wren?.status).toBe('deactivated');
    expect(d.accounts.wren?.enabled).toBe(false);
  });

  it('builds text with Concatenate, like Login and "@burrow.co"', () => {
    const f = flow('hr.joined', [event, { id: 't', kind: 'concat', inputs: { First: wire('e', 'Login'), Separator: { text: '@' }, Second: { text: 'burrow.co' } } }]);
    expect(testFlow(financeOn(13), f).run.steps.at(-1)?.values.Combined).toBe('sam.sample@burrow.co');
  });

  it('testing a flow never touches the real game', () => {
    const s = { ...financeOn(13), okta: { ...financeOn(13).okta, flows: [joiner()] } };
    const before = JSON.stringify(s);
    const { run, after } = testFlow(s, joiner());
    expect(run.test).toBe(true);
    expect(after.okta.users['sam.sample']).toBeDefined();
    expect(JSON.stringify(s)).toBe(before);
  });
});
