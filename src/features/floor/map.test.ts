import { describe, expect, it } from 'vitest';
import { AREAS } from '../game/types.ts';
import { BESIDE_DESK, COLS, DESK_SPOT, MAP, SPOTS, areaAt, path, walkable } from './map.ts';

describe('the office map', () => {
  it('is a tidy rectangle', () => {
    expect(MAP.every((row) => row.length === COLS)).toBe(true);
  });

  it('can reach every area from your desk, and each spot is in its own area', () => {
    for (const area of AREAS) {
      const spot = SPOTS[area];
      expect(walkable(spot.x, spot.y)).toBe(true);
      expect(areaAt(spot)).toBe(area);
      expect(path(DESK_SPOT, spot).length).toBeGreaterThan(0);
    }
    expect(path(BESIDE_DESK, SPOTS.Kitchen).at(-1)).toEqual(SPOTS.Kitchen);
  });

  it('walks around things in the way', () => {
    const from = { x: 6, y: 10 };
    const to = { x: 6, y: 12 };
    const blocked = { x: 6, y: 11 };
    const steps = path(from, to, (p) => p.x === blocked.x && p.y === blocked.y);
    expect(steps.some((p) => p.x === blocked.x && p.y === blocked.y)).toBe(false);
    expect(steps.at(-1)).toEqual(to);
    expect(steps.length).toBe(4);
  });
});
