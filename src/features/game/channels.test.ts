import { describe, expect, it } from 'vitest';
import { CHANNEL_POSTS, CHANNELS, newPosts, personName, stampOf, unreadCount, visiblePosts } from './channels.ts';
import { DAYS } from './data.ts';
import { atBurrow, PEOPLE } from './people.ts';
import { clockTime, newGame, ping } from './rules.ts';
import { SOCIAL } from './social.ts';

const at = clockTime;

describe('what a channel shows', () => {
  it('is yesterday and today up to the clock, oldest first', () => {
    const who = (day: number, hm: string) => visiblePosts(day, at(hm), 'random').map((p) => p.from);
    expect(who(1, '9:21')).toEqual(['biscuit', 'basil', 'biscuit', 'marlo']);
    expect(who(1, '9:24')).toEqual(['biscuit', 'basil', 'biscuit', 'marlo', 'grisby', 'pip']);
    // Two days on, the first morning's chat is out of sight.
    expect(visiblePosts(3, at('9:00'), 'random').every((p) => p.day >= 2)).toBe(true);
  });

  it('puts the day’s company news in #general before the office opens', () => {
    expect(visiblePosts(1, at('9:00'), 'general').map((p) => p.title)).toEqual(['Welcome our new IT intern!', 'Farewell, Sam']);
  });

  it('counts what is new since you last looked, and only what has been posted', () => {
    expect(unreadCount(1, at('9:25'), 'random', stampOf(1, at('9:21')))).toBe(2);
    expect(unreadCount(1, at('9:25'), 'random', stampOf(1, at('9:24')))).toBe(0);
    // Until you look, yesterday's chat is old news, not unread.
    expect(unreadCount(2, at('9:00'), 'random')).toBe(0);
  });
});

describe('new posts as the clock moves', () => {
  it('are the ones passed since the last tick, none twice', () => {
    expect(newPosts(1, at('9:19'), at('9:24')).map((p) => p.from)).toEqual(['marlo', 'grisby', 'pip']);
    expect(newPosts(1, at('9:20'), at('9:23')).map((p) => p.from)).toEqual(['grisby']);
    expect(newPosts(1, at('9:24'), at('9:30'))).toEqual([]);
  });
});

describe('the script', () => {
  it('has only real people, working at Burrow on the day they speak', () => {
    for (const p of CHANNEL_POSTS) {
      expect(PEOPLE[p.from], `${p.from} on day ${p.day}`).toBeDefined();
      expect(atBurrow(p.from, p.day), `${p.from} on day ${p.day}`).toBe(true);
    }
    expect([personName('grisby'), personName('hazel'), personName('nobody')]).toEqual(['Mr. Grisby', 'Hazel', 'nobody']);
  });

  it('keeps to real channels and office hours (8:30 to 17:00), on days 0 to 25', () => {
    for (const p of CHANNEL_POSTS) {
      expect(CHANNELS).toContain(p.channel);
      expect(p.channel).not.toBe('service-desk');
      expect(at(p.at)).toBeGreaterThanOrEqual(at('8:30'));
      expect(at(p.at)).toBeLessThanOrEqual(at('17:00'));
      expect(p.day).toBeGreaterThanOrEqual(0);
      expect(p.day).toBeLessThanOrEqual(DAYS);
    }
  });

  it('is busy: a handful of posts every working day', () => {
    for (let day = 1; day <= DAYS; day++) {
      const n = CHANNEL_POSTS.filter((p) => p.day === day).length;
      expect(n, `day ${day}`).toBeGreaterThanOrEqual(4);
      expect(n, `day ${day}`).toBeLessThanOrEqual(10);
    }
  });

  it('has Pip in #operations before the move and #finance after it, and never the other way round', () => {
    const pip = CHANNEL_POSTS.filter((p) => p.from === 'pip');
    expect(pip.filter((p) => p.channel === 'finance').every((p) => p.day >= 14)).toBe(true);
    expect(pip.filter((p) => p.channel === 'operations').every((p) => p.day < 14)).toBe(true);
    expect(pip.some((p) => p.channel === 'finance')).toBe(true);
  });
});

describe('the Burrow Feed', () => {
  it('is thin: two or three posts in every week', () => {
    for (let week = 0; week < DAYS / 5; week++) {
      const n = SOCIAL.filter((p) => p.day > week * 5 && p.day <= week * 5 + 5).length;
      expect(n, `week ${week + 1}`).toBeGreaterThanOrEqual(2);
      expect(n, `week ${week + 1}`).toBeLessThanOrEqual(3);
    }
  });
});

describe('direct pings', () => {
  it('are kept with the day and time they came, and only today’s are kept', () => {
    const s = { ...newGame(1), clock: at('10:30') };
    const one = ping(s, 'Mr. Grisby', 'Approved.');
    expect(one.pings).toEqual([{ day: 1, at: at('10:30'), from: 'Mr. Grisby', text: 'Approved.' }]);
    expect(ping(one, 'Dot', 'On my way').pings.map((p) => p.from)).toEqual(['Mr. Grisby', 'Dot']);
    expect(ping({ ...one, day: 2 }, 'Dot', 'On my way').pings.map((p) => p.from)).toEqual(['Dot']);
  });
});
