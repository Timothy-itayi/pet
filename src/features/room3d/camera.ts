/** A camera position and the point it looks at, in metres. */
export interface Pose {
  pos: [number, number, number];
  look: [number, number, number];
}

/** Slow start, slow finish: how film cameras move. */
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);

const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Where the camera is, part-way (t from 0 to 1) through a move between two poses,
 * nudged sideways and up by `drift` so the room reacts to the mouse.
 */
export function cameraAt(from: Pose, to: Pose, t: number, drift: [number, number]): Pose {
  const k = easeInOut(Math.max(0, Math.min(1, t)));
  const pos = from.pos.map((p, i) => mix(p, to.pos[i] ?? p, k)) as Pose['pos'];
  const look = from.look.map((p, i) => mix(p, to.look[i] ?? p, k)) as Pose['look'];
  return { pos: [pos[0] + drift[0], pos[1] + drift[1], pos[2]], look };
}
