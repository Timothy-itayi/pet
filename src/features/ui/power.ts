/**
 * Sam's computer, like a real one: off first thing in the morning, locked the moment you step away,
 * and asleep if you've been gone a while. 'booting' and 'waking' are the moments in between:
 * after you press the power button, and after you nudge the mouse.
 */
export type Power = 'off' | 'booting' | 'asleep' | 'waking' | 'locked' | 'on';

/** Game minutes away from the computer before it goes to sleep. */
export const SLEEP_AFTER = 20;

/** What you find when you sit back down. */
export function powerOnReturn(power: Power, leftAt: number | undefined, now: number): Power {
  if (power === 'locked' && leftAt !== undefined && now - leftAt >= SLEEP_AFTER) return 'asleep';
  return power;
}
