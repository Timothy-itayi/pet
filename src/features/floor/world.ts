import { VILLAGERS } from '../game/data.ts';
import { arriveOnSite, ticketById, ticketState, walk, type GameState } from '../game/rules.ts';
import type { Villager } from '../game/types.ts';
import { face } from '../art/sprites.ts';
import type { App } from '../ui/app.ts';
import { h } from '../ui/dom.ts';
import { BESIDE_DESK, COLS, DESK_SPOT, ROWS, SPOTS, areaAt, besideOf, distance, path, sameTile, tileAt, walkable, type Pos } from './map.ts';

const TILE = 16;
const STEP_MS = 140;
const LEADER_STEP_MS = 320;
/** The leader walks on while you're this close, and waits for you otherwise. */
const KEEP_UP = 3;

const YOU: Villager = { name: 'You', species: 'cat', ears: 'pointy', fur: '#e8a86a', fond: '', grudge: '' };

/** Screen-only: where everyone is standing. Not saved; after a reload you start back at your desk. */
const world = {
  app: undefined as App | undefined,
  me: { ...DESK_SPOT },
  drawn: { x: DESK_SPOT.x * TILE, y: DESK_SPOT.y * TILE },
  leader: undefined as { id: string; pos: Pos; route: Pos[]; drawn: Pos } | undefined,
  /** Walking somewhere by itself after you picked a place to go. */
  route: [] as Pos[],
  then: undefined as (() => void) | undefined,
  following: false,
  lastMove: 0,
  lastPlace: 'computer' as GameState['place'],
  canvas: undefined as HTMLCanvasElement | undefined,
  prompt: undefined as HTMLElement | undefined,
  started: false,
};

const images = new Map<string, HTMLImageElement>();
function sprite(url: string): HTMLImageElement {
  let img = images.get(url);
  if (!img) { img = new Image(); img.src = url; images.set(url, img); }
  return img;
}

const SHIRTS = ['#5b8fd6', '#d65b7a', '#6fbf73', '#e0a84a', '#9b7fd6', '#4fb3b8', '#d6735b'];
const shirtOf = (name: string) => SHIRTS[[...name].reduce((n, c) => n + c.charCodeAt(0), 0) % SHIRTS.length] ?? '#888';

/** Everyone standing on the floor right now, with where they stand. */
function people(s: GameState): { id: string; pos: Pos }[] {
  const seen = new Map<string, number>();
  return s.floor.map((id) => {
    const where = ticketById(id).where ?? 'Open office';
    const n = seen.get(where) ?? 0;
    seen.set(where, n + 1);
    return { id, pos: { x: SPOTS[where].x + n, y: SPOTS[where].y } };
  });
}

const occupied = (s: GameState, p: Pos) =>
  people(s).some((x) => sameTile(x.pos, p)) || Boolean(world.leader && sameTile(world.leader.pos, p));

function frozen(): boolean {
  const app = world.app;
  return !app || !world.canvas?.isConnected || app.ui.paused || app.state.outcomes.length > 0 || app.state.phase !== 'desk';
}

function moveTo(p: Pos): void {
  world.me = { ...p };
  updatePrompt();
  const app = world.app;
  // Caught up with whoever is leading you, and they've got where they were going.
  if (app?.state.escort && world.leader && !world.leader.route.length && distance(world.me, world.leader.pos) <= 1
    && !ticketState(app.state, app.state.escort).onSite) {
    world.following = false;
    app.set(arriveOnSite(app.state));
  }
}

function step(dx: number, dy: number): void {
  const app = world.app;
  if (!app || frozen()) return;
  const next = { x: world.me.x + dx, y: world.me.y + dy };
  if (!walkable(next.x, next.y) || occupied(app.state, next)) return;
  moveTo(next);
}

/** Walk somewhere on your own, then do something when you get there. */
function travel(to: Pos, then?: () => void): void {
  const app = world.app;
  if (!app) return;
  world.following = false;
  world.route = path(world.me, to, (p) => occupied(app.state, p));
  world.then = then;
  if (!world.route.length) { world.then = undefined; then?.(); }
}

function backToDesk(app: App): void {
  if (app.state.escort) return;
  travel(DESK_SPOT, () => app.set(walk(app.state, 'computer')));
}

function talkTo(app: App, id: string): void {
  app.ui.selected = id;
  app.rerender();
}

/** What's in front of you: someone to talk to, your desk, or the person you're following. */
function nearby(s: GameState): { label: string; act: () => void } | undefined {
  const app = world.app;
  if (!app) return undefined;
  const person = people(s).find((x) => distance(x.pos, world.me) <= 1);
  if (person) {
    const v = VILLAGERS[ticketById(person.id).who];
    return { label: `Talk to ${v.name}`, act: () => talkTo(app, person.id) };
  }
  if (!s.escort && distance(world.me, DESK_SPOT) <= 1) return { label: 'Sit back down at your desk', act: () => app.set(walk(s, 'computer')) };
  return undefined;
}

function updatePrompt(): void {
  const app = world.app;
  if (!app || !world.prompt) return;
  const s = app.state;
  let text: string;
  if (s.escort && world.leader) {
    const v = VILLAGERS[ticketById(s.escort).who];
    const where = ticketById(s.escort).where?.toLowerCase() ?? 'office';
    text = ticketState(s, s.escort).onSite ? `${v.name}: Here. Look at it.`
      : distance(world.me, world.leader.pos) > KEEP_UP ? `${v.name}: Keep up!`
      : `${v.name}: Follow me! It’s over in the ${where}.`;
  } else {
    const near = nearby(s);
    const area = areaAt(world.me);
    text = near ? `${near.label}: press Enter.` : `You’re in ${area === 'Your desk' ? 'front of your desk' : `the ${area.toLowerCase()}`}.`;
  }
  if (world.prompt.textContent !== text) world.prompt.textContent = text;
}

function onKey(e: KeyboardEvent): void {
  if (!world.canvas?.isConnected || !world.app) return;
  const target = e.target as HTMLElement | null;
  if (target?.closest('input, textarea, select, [role="dialog"]')) return;
  const moves: Record<string, [number, number]> = {
    ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
    w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0], W: [0, -1], S: [0, 1], A: [-1, 0], D: [1, 0],
  };
  const move = moves[e.key];
  const onMap = target?.closest('[data-map]') !== null || target === document.body;
  if (move && onMap) {
    e.preventDefault();
    world.route = [];
    world.following = false;
    const now = performance.now();
    if (now - world.lastMove < STEP_MS) return;
    world.lastMove = now;
    step(move[0], move[1]);
  } else if ((e.key === 'Enter' || e.key === ' ') && onMap) {
    e.preventDefault();
    nearby(world.app.state)?.act();
  }
}

/** Timers for walking: yours along a chosen route, and whoever is leading you. */
function startLoops(): void {
  if (world.started) return;
  world.started = true;
  addEventListener('keydown', onKey);
  setInterval(() => {
    const app = world.app;
    if (!app || frozen()) return;
    if (world.following && world.leader) {
      const goal = besideOf(world.leader.pos, world.me);
      if (distance(world.me, world.leader.pos) > 1) world.route = path(world.me, goal, (p) => occupied(app.state, p));
    }
    const next = world.route.shift();
    if (next) {
      if (occupied(app.state, next)) { world.route = []; return; }
      moveTo(next);
      if (!world.route.length && world.then) { const then = world.then; world.then = undefined; then(); }
    }
  }, STEP_MS);
  setInterval(() => {
    const leader = world.leader;
    if (!leader || frozen()) return;
    if (leader.route.length && distance(world.me, leader.pos) <= KEEP_UP) {
      const next = leader.route[0];
      if (next && !sameTile(next, world.me)) { leader.pos = next; leader.route.shift(); }
    }
    updatePrompt();
    // They got there and you're already beside them.
    moveTo(world.me);
  }, LEADER_STEP_MS);
  requestAnimationFrame(draw);
}

const TILE_COLOURS: Record<string, [string, string]> = {
  '#': ['#6b5a4b', '#54463a'],
  '.': ['#e8dcc0', '#dccfae'],
  c: ['#9fb7c9', '#8ea7ba'],
  k: ['#c9c2b4', '#8f877a'],
  f: ['#f4f4f0', '#b9b9b2'],
  t: ['#b98a5a', '#9c7047'],
  d: ['#c49a6c', '#9c7047'],
  p: ['#d9d9d4', '#7a7a74'],
  P: ['#e8dcc0', '#dccfae'],
  Y: ['#c49a6c', '#9c7047'],
};

function drawTile(ctx: CanvasRenderingContext2D, ch: string, x: number, y: number): void {
  const [base, edge] = TILE_COLOURS[ch] ?? ['#000', '#000'];
  const px = x * TILE;
  const py = y * TILE;
  ctx.fillStyle = base;
  ctx.fillRect(px, py, TILE, TILE);
  ctx.fillStyle = edge;
  if (ch === '.' || ch === 'c') { ctx.fillRect(px, py + TILE - 1, TILE, 1); ctx.fillRect(px + TILE - 1, py, 1, TILE); }
  else if (ch === '#') ctx.fillRect(px, py + TILE - 4, TILE, 4);
  else ctx.fillRect(px, py + TILE - 3, TILE, 3);
  if (ch === 'd' || ch === 'Y') { ctx.fillStyle = '#3b2f2a'; ctx.fillRect(px + 4, py + 2, 8, 6); ctx.fillStyle = '#9be39b'; ctx.fillRect(px + 5, py + 3, 6, 4); }
  if (ch === 'Y') { ctx.fillStyle = '#f2d68a'; ctx.fillRect(px + 1, py + 9, 3, 3); ctx.fillRect(px + 12, py + 8, 3, 3); }
  if (ch === 'p') { ctx.fillStyle = '#fff'; ctx.fillRect(px + 4, py + 1, 8, 4); ctx.fillStyle = '#3b2f2a'; ctx.fillRect(px + 3, py + 6, 10, 2); }
  if (ch === 'P') { ctx.fillStyle = '#9c7047'; ctx.fillRect(px + 5, py + 10, 6, 5); ctx.fillStyle = '#5c9a3d'; ctx.fillRect(px + 3, py + 3, 10, 8); }
  if (ch === 'f') { ctx.fillStyle = '#b9b9b2'; ctx.fillRect(px + 12, py + 4, 2, 4); }
}

function drawPerson(ctx: CanvasRenderingContext2D, v: Villager, mood: 0 | 1 | 2 | 3, at: Pos, bubble?: string): void {
  const img = sprite(face(v, mood));
  ctx.fillStyle = shirtOf(v.name);
  ctx.fillRect(at.x + 3, at.y + 9, 10, 7);
  ctx.fillStyle = '#3b2f2a';
  ctx.fillRect(at.x + 3, at.y + 15, 10, 1);
  if (img.complete) ctx.drawImage(img, at.x + 1, at.y - 5, 14, 14);
  if (bubble) {
    ctx.fillStyle = '#fff';
    ctx.fillRect(at.x + 9, at.y - 14, 8, 9);
    ctx.strokeStyle = '#3b2f2a';
    ctx.strokeRect(at.x + 9.5, at.y - 13.5, 7, 8);
    ctx.fillStyle = '#c8453b';
    ctx.fillRect(at.x + 12, at.y - 12, 2, 4);
    ctx.fillRect(at.x + 12, at.y - 7, 2, 1);
  }
}

/** Glide a drawn position a little closer to where someone actually stands. */
const glide = (drawn: Pos, to: Pos) => {
  drawn.x += (to.x * TILE - drawn.x) * 0.35;
  drawn.y += (to.y * TILE - drawn.y) * 0.35;
};

function draw(): void {
  requestAnimationFrame(draw);
  const canvas = world.canvas;
  const app = world.app;
  if (!canvas?.isConnected || !app) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const s = app.state;
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) drawTile(ctx, tileAt(x, y), x, y);
  const figures: { y: number; paint: () => void }[] = [];
  for (const p of people(s)) {
    const t = ticketById(p.id);
    figures.push({ y: p.pos.y, paint: () => drawPerson(ctx, VILLAGERS[t.who], ticketState(s, p.id).mood, { x: p.pos.x * TILE, y: p.pos.y * TILE }, '!') });
  }
  const leader = world.leader;
  if (leader && s.escort) {
    glide(leader.drawn, leader.pos);
    figures.push({ y: leader.pos.y, paint: () => drawPerson(ctx, VILLAGERS[ticketById(leader.id).who], ticketState(s, leader.id).mood, leader.drawn) });
  }
  glide(world.drawn, world.me);
  figures.push({ y: world.me.y + 0.1, paint: () => drawPerson(ctx, YOU, 0, world.drawn) });
  // People lower down the screen stand in front.
  figures.sort((a, b) => a.y - b.y).forEach((f) => f.paint());
}

/** Line up the screen-only world with the saved game: where you start, and who is leading you. */
function sync(s: GameState): void {
  if (s.place === 'floor' && world.lastPlace !== 'floor') {
    world.me = { ...DESK_SPOT };
    world.drawn = { x: DESK_SPOT.x * TILE, y: DESK_SPOT.y * TILE };
    world.route = [];
  }
  world.lastPlace = s.place;
  if (!s.escort) { world.leader = undefined; world.following = false; return; }
  if (world.leader?.id === s.escort) return;
  const t = ticketById(s.escort);
  const start = BESIDE_DESK;
  world.leader = {
    id: s.escort,
    pos: { ...start },
    drawn: { x: start.x * TILE, y: start.y * TILE },
    route: path(start, SPOTS[t.where ?? 'Open office']),
  };
  // If you'd already been out and come back, you're at your desk when they grab you.
  world.me = { ...DESK_SPOT };
  world.drawn = { x: DESK_SPOT.x * TILE, y: DESK_SPOT.y * TILE };
}

/** The office floor: a map you walk around, plus buttons that walk you there for you. */
export function worldMap(app: App): HTMLElement {
  world.app = app;
  sync(app.state);
  startLoops();
  if (!world.canvas) {
    world.canvas = document.createElement('canvas');
    world.canvas.width = COLS * TILE;
    world.canvas.height = ROWS * TILE;
    world.canvas.className = 'map-canvas';
    world.canvas.setAttribute('aria-hidden', 'true');
  }
  const s = app.state;
  world.prompt = h('p', { class: 'map-prompt', 'aria-live': 'polite', 'data-testid': 'map-prompt' });
  updatePrompt();
  const escortName = s.escort ? VILLAGERS[ticketById(s.escort).who].name : '';
  const onSite = s.escort ? ticketState(s, s.escort).onSite : false;
  const goTo = (id: string, pos: Pos) => travel(besideOf(pos, world.me), () => talkTo(app, id));
  return h('section', { class: 'map', 'aria-label': 'Office floor' },
    h('div', {
      class: 'map-frame', tabindex: 0, 'data-map': true, 'data-testid': 'map', 'data-autofocus': true,
      'aria-label': 'Office map. Arrow keys or WASD to walk, Enter to talk.',
    }, world.canvas),
    world.prompt,
    h('div', { class: 'map-actions', role: 'group', 'aria-label': 'Walk somewhere' },
      s.escort && !onSite && h('button', {
        class: 'btn primary', 'data-testid': 'follow',
        onclick: () => { world.following = true; },
      }, `Follow ${escortName}`),
      ...(!s.escort ? people(s).map(({ id, pos }) => {
        const t = ticketById(id);
        return h('button', { class: 'btn small', 'data-testid': `go-${id}`, onclick: () => goTo(id, pos) },
          `Go to ${VILLAGERS[t.who].name} (${(t.where ?? 'Open office').toLowerCase()})`);
      }) : []),
      !s.escort && h('button', { class: 'btn small', 'data-testid': 'go-desk', onclick: () => backToDesk(app) }, 'Back to my desk')),
    h('p', { class: 'meta map-help' }, 'Arrow keys or WASD to walk. Enter to talk. Or use the buttons.'),
  );
}
