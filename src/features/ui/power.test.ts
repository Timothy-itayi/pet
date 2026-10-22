import { describe, expect, it } from 'vitest';
import { SLEEP_AFTER, powerOnReturn } from './power.ts';

describe('the computer when you come back to it', () => {
  it('is still locked after a short break, and asleep after a long one', () => {
    expect(powerOnReturn('locked', 600, 600 + SLEEP_AFTER - 1)).toBe('locked');
    expect(powerOnReturn('locked', 600, 600 + SLEEP_AFTER)).toBe('asleep');
  });

  it('stays off until you turn it on', () => {
    expect(powerOnReturn('off', 600, 900)).toBe('off');
  });
});
