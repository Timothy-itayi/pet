import { describe, expect, it } from 'vitest';
import { DAYS, TICKETS, VILLAGERS } from './data.ts';
import { newAccounts } from './directory.ts';
import { NEW_STAFF_TICKETS } from './newStaff.ts';
import { atBurrow, PEOPLE } from './people.ts';
import { clockTime } from './rules.ts';

const at = clockTime;

describe('every morning has something to do', () => {
  it('starts with a tray ticket at 9:02 to 9:10, then at least three before noon, never 40 minutes apart', () => {
    for (let day = 1; day <= DAYS; day++) {
      const arrivals = TICKETS.filter((t) => t.day === day).sort((a, b) => at(a.at) - at(b.at));
      const first = arrivals[0];
      expect(first?.via, `day ${day}: the first ticket is a chat or a walk-up`).toBe('tray');
      expect(at(first?.at ?? '0:00'), `day ${day}: the first ticket's time`).toBeGreaterThanOrEqual(at('9:02'));
      expect(at(first?.at ?? '0:00'), `day ${day}: the first ticket's time`).toBeLessThanOrEqual(at('9:10'));
      const morning = arrivals.map((t) => at(t.at)).filter((m) => m >= at('9:00') && m <= at('12:00'));
      expect(morning.length, `day ${day}: tickets before noon`).toBeGreaterThanOrEqual(3);
      morning.slice(1).forEach((m, i) => expect(m - (morning[i] ?? m), `day ${day}: wait before ${m}`).toBeLessThanOrEqual(40));
    }
  });

  it('is gentle: day 1 gets one simple extra after ten, and nothing new is urgent or turns up by chat', () => {
    expect(NEW_STAFF_TICKETS.filter((t) => t.day === 1).map((t) => t.id)).toEqual(['t111']);
    expect(at(NEW_STAFF_TICKETS.find((t) => t.id === 't111')?.at ?? '0:00')).toBeGreaterThan(at('10:00'));
    expect(NEW_STAFF_TICKETS.every((t) => t.via === 'tray' && t.priority !== 'high')).toBe(true);
  });
});

describe('Clover, Moss, Tansy and Hector', () => {
  it('work at Burrow from before the first day, with an account, a way of talking and tickets of their own', () => {
    for (const login of ['clover', 'moss', 'tansy', 'hector']) {
      expect(atBurrow(login, 1), login).toBe(true);
      expect(newAccounts()[login], login).toMatchObject({ enabled: true });
      expect(PEOPLE[login]?.routine.length, login).toBeGreaterThan(0);
      expect(VILLAGERS[login as keyof typeof VILLAGERS].name, login).toBeTruthy();
      expect(TICKETS.some((t) => t.who === login), login).toBe(true);
    }
  });
});
