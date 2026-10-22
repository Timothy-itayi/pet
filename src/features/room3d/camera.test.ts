import { describe, expect, it } from 'vitest';
import { cameraAt, easeInOut, type Pose } from './camera.ts';

const A: Pose = { pos: [0, 1, 2], look: [0, 0, 0] };
const B: Pose = { pos: [2, 1, 0], look: [1, 1, -1] };

describe('camera moves', () => {
  it('start at the first view, end exactly at the second, and are halfway at the midpoint', () => {
    expect(cameraAt(A, B, 0, [0, 0])).toEqual(A);
    expect(cameraAt(A, B, 1, [0, 0])).toEqual(B);
    expect(cameraAt(A, B, 0.5, [0, 0]).pos).toEqual([1, 1, 1]);
  });

  it('ease in and out, and never overshoot', () => {
    expect(easeInOut(0.1)).toBeLessThan(0.1);
    expect(easeInOut(0.9)).toBeGreaterThan(0.9);
    expect(cameraAt(A, B, 1.5, [0, 0])).toEqual(B);
    expect(cameraAt(A, B, -1, [0, 0])).toEqual(A);
  });

  it('drift nudges where the camera sits, not what it looks at', () => {
    const p = cameraAt(A, B, 1, [0.1, 0.2]);
    expect(p.pos).toEqual([2.1, 1.2, 0]);
    expect(p.look).toEqual(B.look);
  });
});
