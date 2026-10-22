/**
 * Sam's desk, drawn as pixel art on a 320x200 canvas and scaled up.
 * Layout follows a real, lived-in IT desk: pegboard wall and shelves above, monitor in the middle,
 * the desk itself, a tower PC and filing cabinet underneath, and the chair in front.
 * Empty spots are outlined: they fill in as people give you things.
 */
export const W = 320;
export const H = 200;

type Ctx = CanvasRenderingContext2D;
const rect = (ctx: Ctx, x: number, y: number, w: number, h: number, c: string) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };

const C = {
  peg: '#5a4430', pegHole: '#3f2f21', shelf: '#9c6b3f', shelfEdge: '#6b4527',
  deskHi: '#a8703f', desk: '#8f5e36', deskFront: '#6b4527', under: '#1f1712',
  crt: '#d8cdb3', crtShade: '#b5a98e', screen: '#13241a', glow: '#9be39b',
  note: '#f7e27a', pink: '#f2b8c6', ink: '#3b2f2a', chair: '#4a4650', chairHi: '#625d6b', chairEdge: '#1a171c',
};

/** A spot where something could go: a faint dashed outline. */
function slot(ctx: Ctx, x: number, y: number, w: number, h: number): void {
  ctx.fillStyle = '#e8dcc055';
  for (let i = x; i < x + w; i += 4) { ctx.fillRect(i, y, 2, 1); ctx.fillRect(i, y + h - 1, 2, 1); }
  for (let j = y; j < y + h; j += 4) { ctx.fillRect(x, j, 1, 2); ctx.fillRect(x + w - 1, j, 1, 2); }
}

function wall(ctx: Ctx): void {
  rect(ctx, 0, 0, W, 118, C.peg);
  for (let y = 3; y < 118; y += 6) for (let x = 3; x < W; x += 6) rect(ctx, x, y, 1, 1, C.pegHole);
}

function shelves(ctx: Ctx): void {
  for (const x of [8, 200]) {
    rect(ctx, x, 30, 112, 4, C.shelf);
    rect(ctx, x, 34, 112, 2, C.shelfEdge);
    rect(ctx, x + 8, 36, 3, 6, C.shelfEdge);
    rect(ctx, x + 100, 36, 3, 6, C.shelfEdge);
  }
  // Sam's old binders, gathering dust.
  rect(ctx, 14, 13, 7, 17, '#6b5a4b');
  rect(ctx, 22, 15, 7, 15, '#7a6a58');
  rect(ctx, 30, 18, 12, 12, '#8a7a62');
  rect(ctx, 14, 13, 28, 1, '#ffffff22');
}

function pegboardNotes(ctx: Ctx): void {
  rect(ctx, 134, 42, 14, 12, C.note);
  rect(ctx, 152, 46, 12, 12, C.pink);
  for (const [x, y, w] of [[136, 46, 10], [136, 49, 8], [154, 50, 8], [154, 53, 6]] as const) rect(ctx, x, y, w, 1, '#3b2f2a88');
  rect(ctx, 140, 41, 2, 2, '#c8453b');
  rect(ctx, 157, 45, 2, 2, '#4a6fa5');
}

function crt(ctx: Ctx): void {
  rect(ctx, 96, 64, 76, 50, C.crt);
  rect(ctx, 96, 110, 76, 4, C.crtShade);
  rect(ctx, 103, 70, 62, 38, C.screen);
  for (const [y, w] of [[76, 30], [82, 42], [88, 22]] as const) rect(ctx, 108, y, w, 2, C.glow);
  rect(ctx, 108, 94, 4, 2, C.glow);
  rect(ctx, 122, 114, 24, 4, C.crtShade);
  rect(ctx, 164, 66, 7, 7, C.note); // a sticky note on the monitor, of course
}

function desk(ctx: Ctx): void {
  rect(ctx, 0, 118, W, 5, C.deskHi);
  rect(ctx, 0, 123, W, 9, C.desk);
  rect(ctx, 0, 132, W, 8, C.deskFront);
  rect(ctx, 0, 140, W, 60, C.under);
}

function underDesk(ctx: Ctx): void {
  // Old beige tower.
  rect(ctx, 16, 146, 26, 52, '#cfc4a8');
  rect(ctx, 20, 152, 18, 2, '#9a8f75');
  rect(ctx, 20, 156, 18, 2, '#9a8f75');
  rect(ctx, 36, 190, 2, 2, '#7fdc7f');
  // Dented filing cabinet.
  rect(ctx, 262, 142, 48, 58, '#5d5f63');
  for (const y of [161, 180]) rect(ctx, 262, y, 48, 1, '#3a3b3e');
  for (const y of [150, 169, 188]) rect(ctx, 280, y, 12, 2, '#c9c9c9');
  rect(ctx, 300, 164, 6, 3, '#4a4c50');
}

function onDesk(ctx: Ctx): void {
  // Keyboard.
  rect(ctx, 104, 120, 60, 5, '#e6dcc6');
  for (let x = 106; x < 162; x += 4) rect(ctx, x, 121, 2, 1, '#b5a98e');
  // The old runbook, standing up.
  rect(ctx, 44, 94, 11, 25, '#3f63a0');
  rect(ctx, 44, 94, 3, 25, '#2f4c7c');
  rect(ctx, 48, 102, 6, 3, '#e8dcc0');
  // Pad of sticky notes.
  rect(ctx, 66, 116, 16, 4, C.note);
  rect(ctx, 66, 115, 16, 1, '#f2c94c');
  // Mug.
  rect(ctx, 184, 106, 11, 12, '#efe9dc');
  rect(ctx, 195, 109, 3, 6, '#efe9dc');
  rect(ctx, 186, 109, 7, 2, '#c8453b');
  // Ticket tray (empty).
  rect(ctx, 204, 113, 30, 5, '#8b8b84');
  rect(ctx, 204, 111, 30, 2, '#a3a39b');
  // Where the phone used to be.
  ctx.fillStyle = '#5a3d22';
  for (let x = 242; x < 262; x += 3) { ctx.fillRect(x, 113, 2, 1); ctx.fillRect(x, 118, 2, 1); }
  // A mostly-alive plant.
  rect(ctx, 282, 106, 14, 12, '#b56a3c');
  rect(ctx, 278, 94, 22, 13, '#5c9a3d');
  rect(ctx, 284, 88, 10, 8, '#6fae4f');
  rect(ctx, 296, 98, 4, 6, '#a59b3d'); // one brown leaf
}

function chair(ctx: Ctx): void {
  // Mesh back, seen from behind, with a dark outline so it reads against the shadow under the desk.
  rect(ctx, 123, 149, 74, 40, C.chairEdge);
  rect(ctx, 125, 151, 70, 36, C.chair);
  for (let y = 154; y < 186; y += 3) rect(ctx, 128, y, 64, 1, C.chairHi);
  rect(ctx, 113, 185, 94, 12, C.chairEdge);
  rect(ctx, 115, 187, 90, 8, C.chair);
  rect(ctx, 109, 171, 10, 18, C.chairEdge);
  rect(ctx, 111, 173, 6, 14, C.chairHi);
  rect(ctx, 201, 171, 10, 18, C.chairEdge);
  rect(ctx, 203, 173, 6, 14, C.chairHi);
  rect(ctx, 156, 195, 8, 5, C.chairEdge);
  rect(ctx, 125, 151, 70, 1, '#8a8494'); // lamp light catching the top edge
}

function calendar(ctx: Ctx): void {
  rect(ctx, 100, 38, 26, 22, '#f4efe2');
  rect(ctx, 100, 38, 26, 5, '#c8453b');
  for (let row = 0; row < 3; row++) for (let col = 0; col < 5; col++) rect(ctx, 102 + col * 5, 45 + row * 5, 3, 3, '#cfc6b2');
  // Sam crossed off the days. The last one is circled.
  for (let col = 0; col < 4; col++) rect(ctx, 102 + col * 5, 50, 3, 1, '#c8453b');
  rect(ctx, 121, 49, 5, 5, '#c8453b');
  rect(ctx, 122, 50, 3, 3, '#f4efe2');
}

/** Cables from the computer, down behind the desk, to a power strip and the tower. */
function cables(ctx: Ctx): void {
  const c = '#0f0b08';
  rect(ctx, 90, 140, 2, 10, c);
  rect(ctx, 60, 149, 32, 2, c);
  rect(ctx, 42, 160, 20, 2, c);
  rect(ctx, 60, 151, 2, 10, c);
  rect(ctx, 214, 140, 2, 22, c);
  rect(ctx, 214, 161, 30, 2, c);
  // Power strip, every socket used.
  rect(ctx, 226, 176, 30, 7, '#d9d4c4');
  for (let x = 229; x < 254; x += 6) rect(ctx, x, 178, 3, 3, '#3b2f2a');
  rect(ctx, 242, 163, 2, 13, c);
}

/** A warm, dim office: light from the left, falling off into the corners. */
function light(ctx: Ctx): void {
  const g = ctx.createRadialGradient(130, 70, 10, 150, 100, 230);
  g.addColorStop(0, '#ffcf8a22');
  g.addColorStop(1, '#00000066');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

/** Where gifts will go. Outlined until something fills them. */
export const SLOTS = {
  shelf: { x: 206, y: 10, w: 92, h: 20 },
  lamp: { x: 236, y: 38, w: 26, h: 30 },
  monitor: { x: 178, y: 72, w: 52, h: 38 },
  pegboard: { x: 14, y: 50, w: 70, h: 36 },
} as const;

export function drawDesk(ctx: Ctx): void {
  ctx.imageSmoothingEnabled = false;
  wall(ctx);
  shelves(ctx);
  pegboardNotes(ctx);
  calendar(ctx);
  for (const s of Object.values(SLOTS)) slot(ctx, s.x, s.y, s.w, s.h);
  desk(ctx);
  crt(ctx);
  onDesk(ctx);
  underDesk(ctx);
  cables(ctx);
  chair(ctx);
  light(ctx);
}

/** Things you can click, in canvas pixels. Buttons sit over these spots so they work with a keyboard too. */
export const HOTSPOTS = [
  { id: 'turn-on', label: 'Turn on the computer', x: 96, y: 62, w: 76, h: 58 },
  { id: 'item-runbook', label: 'The old runbook', x: 40, y: 90, w: 18, h: 30 },
  { id: 'item-notes', label: 'Sam’s sticky notes', x: 130, y: 38, w: 38, h: 22 },
  { id: 'item-tray', label: 'Ticket tray', x: 202, y: 108, w: 34, h: 12 },
  { id: 'item-mug', label: 'Mug', x: 182, y: 104, w: 18, h: 16 },
  { id: 'item-plant', label: 'Plant', x: 276, y: 86, w: 26, h: 34 },
  { id: 'item-phone', label: 'Where the phone was', x: 240, y: 110, w: 24, h: 10 },
  { id: 'item-chair', label: 'Sam’s chair', x: 110, y: 148, w: 100, h: 52 },
  { id: 'item-shelves', label: 'Sam\u2019s old binders', x: 10, y: 10, w: 40, h: 22 },
  { id: 'item-calendar', label: 'Calendar', x: 98, y: 36, w: 30, h: 26 },
  { id: 'item-space', label: 'Empty spaces', x: 176, y: 70, w: 56, h: 42 },
] as const;
