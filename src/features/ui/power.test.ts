import { describe, expect, it } from 'vitest';
import { LOCK_AFTER, SLEEP_AFTER, powerAway } from './power.ts';

describe('the computer while you are away from it', () => {
  it('stays logged in for a short break, locks after a while, and sleeps after a long one', () => {
    expect(powerAway('on', 6000, 6000 + LOCK_AFTER - 1)).toBe('on');
    expect(powerAway('on', 6000, 6000 + LOCK_AFTER)).toBe('locked');
    expect(powerAway('on', 6000, 6000 + SLEEP_AFTER)).toBe('asleep');
    expect(powerAway('locked', 6000, 6000 + SLEEP_AFTER)).toBe('asleep');
    // Woken by a tap on the mouse, then left alone again.
    expect(powerAway('waking', 6000, 6000 + SLEEP_AFTER)).toBe('asleep');
  });

  it('does nothing on its own while you are sitting at it, or while it is off', () => {
    expect(powerAway('on', undefined, 9000)).toBe('on');
    expect(powerAway('off', 6000, 600000)).toBe('off');
  });
});
