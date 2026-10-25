import { describe, expect, it } from 'vitest';
import { VILLAGERS } from './data.ts';
import { hrOn } from './oktopus.ts';
import { dayMood, moodWords, PEOPLE, sayNow, statusText, whereIs } from './people.ts';
import { clockTime } from './rules.ts';

const at = (hm: string) => clockTime(hm);

describe('where people are', () => {
  it('follows their routine through the day', () => {
    expect(whereIs('biscuit', 2, at('8:30')).doing).toBe('home');
    expect(whereIs('biscuit', 2, at('12:45'))).toMatchObject({ doing: 'lunch', where: 'Kitchen, with whoever’s there', until: at('13:15') });
    expect(statusText('biscuit', 2, at('12:45'))).toBe('At lunch · Kitchen, with whoever’s there');
    expect(whereIs('biscuit', 2, at('17:45')).where).toBe('Gone home');
  });

  it('only while they work at Burrow, going by HR', () => {
    expect(statusText('sam', 1, at('10:00'))).toBe('Not at Burrow & Co.');
    expect(whereIs('fern', 6, at('10:00')).doing).toBe('home');
    expect(whereIs('fern', 7, at('10:00')).doing).toBe('desk');
    expect(whereIs('wren', 8, at('10:00')).doing).toBe('desk');
    expect(whereIs('wren', 9, at('10:00')).doing).toBe('home');
  });
});

describe('moods from the day', () => {
  it('weather, weekday and events land differently for different people', () => {
    expect(dayMood('basil', 1)).toEqual({ mood: 'low', why: ['rain', 'monday'] });
    expect(dayMood('biscuit', 3)).toEqual({ mood: 'bright', why: ['birthday'] });
    expect(dayMood('pip', 1).mood).toBe('bright'); // Pip loves the rain
    expect(moodWords('basil', 1)).toBe('Having a rough day: Rain. Monday.');
  });
});

describe('what people say', () => {
  it('stays the same until they move on to the next thing', () => {
    const s = { day: 2, seed: 7 };
    expect(sayNow('dot', { ...s, clock: at('9:30') })).toBe(sayNow('dot', { ...s, clock: at('10:15') }));
    expect(sayNow('dot', { ...s, clock: at('12:10') })).not.toBe('');
  });

  it('everyone who works at Burrow, or brings you tickets, has a personality and plenty to say', () => {
    const everyone = new Set([...Object.keys(VILLAGERS), ...hrOn(10).map((r) => r.login).filter((l) => l !== 'intern')]);
    for (const login of everyone) {
      const p = PEOPLE[login];
      expect(p, login).toBeDefined();
      for (const mood of ['bright', 'usual', 'low'] as const) expect(p?.says[mood].length, `${login} ${mood}`).toBeGreaterThan(0);
      if (login !== 'sam') expect(Object.values(p?.says ?? {}).flat().length, login).toBeGreaterThanOrEqual(20);
    }
  });
});
