import type { Area } from '../game/types.ts';

/**
 * The office, one character per tile.
 * # wall  . floor  c carpet  k counter  f fridge  t table  d desk  p printer  P plant  Y your desk
 */
export const MAP = [
  '##########################',
  '#kkkkf#...#cccccccc#ddp..#',
  '#.....#...#cttttttc#.....#',
  '#.....#...#cttttttc#dd...#',
  '#P....#...#cccccccc#.....#',
  '###.###...####.#####..####',
  '#........................#',
  '#..dd..dd..dd..dd........#',
  '#........................#',
  '#..dd..dd..dd..dd....P...#',
  '#........................#',
  '#YY......................#',
  '#........................#',
  '##########################',
];

export const COLS = MAP[0]?.length ?? 0;
export const ROWS = MAP.length;

export interface Pos { x: number; y: number }

export const tileAt = (x: number, y: number) => MAP[y]?.[x] ?? '#';
export const walkable = (x: number, y: number) => '.cD'.includes(tileAt(x, y));
export const sameTile = (a: Pos, b: Pos) => a.x === b.x && a.y === b.y;
/** Steps apart if you can only move up, down, left or right. */
export const distance = (a: Pos, b: Pos) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

/** Where you stand to sit back down at your desk. */
export const DESK_SPOT: Pos = { x: 2, y: 12 };
/** Where a walk-up waits for you, right beside your desk. */
export const BESIDE_DESK: Pos = { x: 4, y: 12 };

/** Where someone with a problem in each area stands. */
export const SPOTS: Record<Area, Pos> = {
  Kitchen: { x: 3, y: 2 },
  'Meeting room': { x: 14, y: 4 },
  'Finance corner': { x: 22, y: 2 },
  'Open office': { x: 9, y: 8 },
};

export function areaAt({ x, y }: Pos): Area | 'Your desk' {
  if (y <= 4 && x <= 5) return 'Kitchen';
  if (y <= 4 && x >= 11 && x <= 18) return 'Meeting room';
  if (y <= 4 && x >= 20) return 'Finance corner';
  if (distance({ x, y }, DESK_SPOT) <= 2) return 'Your desk';
  return 'Open office';
}

/** Shortest walk between two tiles, not counting the start. Empty if there's no way through. */
export function path(from: Pos, to: Pos, blocked: (p: Pos) => boolean = () => false): Pos[] {
  const key = (p: Pos) => p.y * COLS + p.x;
  const came = new Map<number, Pos | null>([[key(from), null]]);
  const queue: Pos[] = [from];
  while (queue.length) {
    const at = queue.shift() as Pos;
    if (sameTile(at, to)) {
      const steps: Pos[] = [];
      for (let p: Pos | null | undefined = at; p && !sameTile(p, from); p = came.get(key(p))) steps.unshift(p);
      return steps;
    }
    for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]] as const) {
      const n = { x: at.x + dx, y: at.y + dy };
      if (came.has(key(n)) || !walkable(n.x, n.y) || (blocked(n) && !sameTile(n, to))) continue;
      came.set(key(n), at);
      queue.push(n);
    }
  }
  return [];
}

/** The nearest free tile next to someone, to stand at while you talk to them. */
export function besideOf(p: Pos, from: Pos): Pos {
  const options = [[0, 1], [1, 0], [-1, 0], [0, -1]]
    .map(([dx, dy]) => ({ x: p.x + (dx ?? 0), y: p.y + (dy ?? 0) }))
    .filter((n) => walkable(n.x, n.y));
  options.sort((a, b) => distance(a, from) - distance(b, from));
  return options[0] ?? p;
}
