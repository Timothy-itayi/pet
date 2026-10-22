/**
 * Sam's computer, like a real one: off first thing in the morning, still on when you step away,
 * locked if you're gone a little while, and asleep if you're gone a long while. 'booting' and 'waking'
 * are the moments in between: after you press the power button, and after you nudge the mouse.
 */
export type Power = 'off' | 'booting' | 'asleep' | 'waking' | 'locked' | 'on';

// The computer keeps its own time, in real milliseconds: it doesn't know or care about the office clock.
/** Away from the computer this long (1 minute), it locks itself. */
export const LOCK_AFTER = 60_000;
/** Away from the computer this long (3 minutes), it goes to sleep. */
export const SLEEP_AFTER = 180_000;

/** What the computer has done on its own since you left it at `leftAt`. */
export function powerAway(power: Power, leftAt: number | undefined, now: number): Power {
  if (leftAt === undefined || (power !== 'on' && power !== 'locked' && power !== 'waking')) return power;
  if (now - leftAt >= SLEEP_AFTER) return 'asleep';
  if (now - leftAt >= LOCK_AFTER) return 'locked';
  return power;
}
