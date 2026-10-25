import { describe, expect, it } from 'vitest';
import { createFromHr, requireMfa, resetMfa } from './identity.ts';
import { hrOn } from './oktopus.ts';
import {
  addPasscode, answerPush, answerRogue, handOver, held, installApp, needsPush, newPhones, phoneFor, PHONES_DAY, putDown, roguePending,
  ROGUE, scan, setUpPhone, takePhone, verifyCode, verifyProblem, VERIFY,
} from './phones.ts';
import { goTo, newGame, parseSave, SELF, type GameState } from './rules.ts';

/** Day 16 with everyone on Oktopus and the box of phones in the drawer. */
function day16(): GameState {
  let s: GameState = { ...goTo(newGame(1), 'desk'), day: PHONES_DAY, phones: newPhones() };
  for (const r of hrOn(PHONES_DAY).filter((x) => x.status === 'active')) s = createFromHr(s, r.login);
  return s;
}
/** Phone 1 out of the drawer, through setup (with or without a passcode) and with Oktopus Verify on it. */
const ready = (s: GameState, passcode = true) => installApp(setUpPhone(takePhone(s, 'phone-1'), 'phone-1', passcode), 'phone-1', VERIFY);

describe('company phones', () => {
  it('arrive in the drawer at the start of day 16, and old saves get them too', () => {
    expect(newGame(1).phones).toEqual([]);
    const old = { ...day16(), phones: undefined, okta: { ...day16().okta, verify: undefined, selfEnroll: undefined }, day: 17 };
    const up = parseSave(JSON.stringify(old));
    expect(up?.phones).toHaveLength(6);
    expect(up?.okta.verify).toEqual({});
  });

  it('only one phone in your hand at a time', () => {
    let s = takePhone(day16(), 'phone-1');
    s = takePhone(s, 'phone-2');
    expect(held(s)?.id).toBe('phone-2');
    expect(s.phones.find((p) => p.id === 'phone-1')?.where).toBe('drawer');
    expect(held(putDown(s))).toBeUndefined();
  });

  it('scanning only enrols while Oktopus is showing that person’s code, and never without a passcode', () => {
    const noCode = scan(ready(day16(), false), 'phone-1', 'dot');
    expect(noCode.said).toMatch(/requires a passcode/);
    expect(noCode.state.okta.verify).toEqual({});
    const nothingShown = scan(ready(day16()), 'phone-1', undefined);
    expect(nothingShown.said).toMatch(/No code in view/);
    const s = scan(addPasscode(ready(day16(), false), 'phone-1'), 'phone-1', 'dot');
    expect(s.said).toMatch(/Account added: Dot/);
    expect(s.state.okta.verify.dot).toBe('phone-1');
    expect(s.state.okta.log.at(-1)).toMatchObject({ event: 'user.mfa.factor.activate', target: 'dot' });
  });

  it('a phone for someone else isn’t done until it’s handed over; yours stays with you', () => {
    const s = scan(ready(day16()), 'phone-1', 'dot').state;
    expect(verifyProblem(s, 'dot', 'Dot')).toMatch(/still in your hand\. Hand it over/);
    expect(verifyProblem(handOver(s, 'phone-1'), 'dot', 'Dot')).toBeUndefined();
    const mine = scan(ready(day16()), 'phone-1', SELF).state;
    expect(handOver(mine, 'phone-1')).toBe(mine);
    expect(verifyProblem(mine, SELF, 'Intern (you)')).toBeUndefined();
    expect(verifyProblem(day16(), SELF, 'Intern (you)')).toMatch(/^You aren’t on Oktopus Verify/);
  });

  it('resetting someone’s sign-in methods takes their phone off their account', () => {
    const s = resetMfa(phoneFor(day16(), 'otis'), 'otis');
    expect(s.okta.verify.otis).toBeUndefined();
    expect(s.phones.find((p) => p.id === 'phone-1')?.owner).toBeUndefined();
    expect(phoneFor(s, 'otis').okta.verify.otis).toBe('phone-2'); // a spare from the drawer
  });

  it('the six-digit code is the same for the same phone, person and half hour, and changes after', () => {
    expect(verifyCode('phone-1', 'dot', 600)).toMatch(/^\d{6}$/);
    expect(verifyCode('phone-1', 'dot', 610)).toBe(verifyCode('phone-1', 'dot', 600));
    expect(verifyCode('phone-1', 'dot', 630)).not.toBe(verifyCode('phone-1', 'dot', 600));
  });

  it('once you’re enrolled and the policy covers you, Oktopus asks your phone once a day', () => {
    let s = phoneFor(day16(), SELF);
    expect(needsPush(s)).toBe(false); // no policy yet
    s = requireMfa(s, 'Everyone', true);
    expect(needsPush(s)).toBe(true);
    expect(needsPush(answerPush(s, false))).toBe(true);
    expect(needsPush(answerPush(s, true))).toBe(false);
  });

  it('on day 18 someone else tries to sign in as you: the phone asks, once', () => {
    const s = { ...phoneFor(day16(), SELF), day: ROGUE.day, clock: ROGUE.at };
    expect(roguePending(s)).toBe(true);
    const denied = answerRogue(s, false);
    expect(denied.rogue).toBe('denied');
    expect(roguePending(denied)).toBe(false);
  });
});
