import type { Mood, Villager } from '../game/types.ts';

const SIZE = 16;
const OUTLINE = '#3b2f2a';
const cache = new Map<string, string>();

/** One colour per pixel, row by row; undefined is transparent. */
type Grid = (string | undefined)[];
const at = (x: number, y: number) => (x >= 0 && x < SIZE && y >= 0 && y < SIZE ? y * SIZE + x : -1);

const rect = (g: Grid, x0: number, y0: number, x1: number, y1: number, c: string) => {
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g[at(x, y)] = c;
};

const disc = (g: Grid, cx: number, cy: number, rx: number, ry: number, c: string) => {
  for (let y = 0; y < SIZE; y++)
    for (let x = 0; x < SIZE; x++)
      if (((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1) g[at(x, y)] = c;
};

function ears(g: Grid, v: Villager): void {
  const c = v.fur;
  switch (v.ears) {
    case 'pointy':
      for (let i = 0; i < 4; i++) { rect(g, 3, 1 + i, 3 + i, 1 + i, c); rect(g, 12 - i, 1 + i, 12, 1 + i, c); }
      break;
    case 'round':
      disc(g, 4.5, 4.5, 2, 2, c); disc(g, 11.5, 4.5, 2, 2, c);
      break;
    case 'long':
      rect(g, 4, 0, 5, 5, c); rect(g, 10, 0, 11, 5, c);
      rect(g, 5, 1, 5, 4, '#f3b8c4'); rect(g, 10, 1, 10, 4, '#f3b8c4');
      break;
    case 'floppy':
      rect(g, 1, 5, 3, 11, c); rect(g, 12, 5, 14, 11, c);
      break;
    case 'none':
      break;
  }
}

const BLUSH = '#f19aa8';
const ANGRY = '#d6453b';

/** Eyebrows and mouth for each mood, drawn over the base face. */
function expression(g: Grid, v: Villager, mood: Mood): void {
  if (mood === 1) { rect(g, 4, 6, 6, 6, OUTLINE); rect(g, 9, 6, 11, 6, OUTLINE); }
  if (mood >= 2) {
    // Brows slanting down towards the middle.
    rect(g, 4, 6, 4, 6, OUTLINE); rect(g, 5, 7, 6, 7, OUTLINE);
    rect(g, 11, 6, 11, 6, OUTLINE); rect(g, 9, 7, 10, 7, OUTLINE);
  }
  if (!v.beak) {
    if (mood === 0) { rect(g, 6, 12, 6, 12, OUTLINE); rect(g, 7, 13, 8, 13, OUTLINE); rect(g, 9, 12, 9, 12, OUTLINE); }
    if (mood >= 2) { rect(g, 7, 12, 8, 12, OUTLINE); rect(g, 6, 13, 6, 13, OUTLINE); rect(g, 9, 13, 9, 13, OUTLINE); }
  }
  if (mood === 3) {
    rect(g, 3, 10, 4, 11, ANGRY); rect(g, 11, 10, 12, 11, ANGRY);
    // Cartoon anger mark in the corner.
    rect(g, 13, 1, 13, 3, ANGRY); rect(g, 12, 2, 14, 2, ANGRY);
  }
}

/** Draws a villager's face from one shared template, so every animal matches in style. */
export function face(v: Villager, mood: Mood = 0): string {
  const key = JSON.stringify([v, mood]);
  const hit = cache.get(key);
  if (hit) return hit;

  const g: Grid = Array<string | undefined>(SIZE * SIZE).fill(undefined);
  ears(g, v);
  disc(g, 8, 9.5, 6, 5.5, v.fur);

  // Outline every filled pixel that touches empty space.
  const filled = (x: number, y: number) => g[at(x, y)] !== undefined;
  const edges: number[] = [];
  for (let y = 0; y < SIZE; y++)
    for (let x = 0; x < SIZE; x++)
      if (filled(x, y) && !(filled(x + 1, y) && filled(x - 1, y) && filled(x, y + 1) && filled(x, y - 1))) edges.push(at(x, y));
  for (const i of edges) g[i] = OUTLINE;

  rect(g, 5, 8, 5, 9, OUTLINE);
  rect(g, 10, 8, 10, 9, OUTLINE);
  rect(g, 3, 11, 4, 11, BLUSH);
  rect(g, 11, 11, 12, 11, BLUSH);
  if (v.beak) rect(g, 6, 11, 9, 12, v.beak);
  else rect(g, 7, 11, 8, 11, OUTLINE);
  expression(g, v, mood);

  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  g.forEach((c, i) => {
    if (!c) return;
    ctx.fillStyle = c;
    ctx.fillRect(i % SIZE, Math.floor(i / SIZE), 1, 1);
  });
  const url = canvas.toDataURL();
  cache.set(key, url);
  return url;
}
