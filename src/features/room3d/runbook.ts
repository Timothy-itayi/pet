import {
  BoxGeometry, CanvasTexture, Color, Group, Mesh, MeshStandardMaterial, SRGBColorSpace, TorusGeometry, type Object3D,
} from 'three';

/**
 * The runbook: a fat off-white ring binder, like an old flight manual. A boxed label on the cover, three metal
 * rings down the spine, index tabs sticking out of the side, and six years of coffee on it. Lies flat, spine on the left.
 */

const W = 0.22;
const D = 0.28;
const PAGES = 0.03;
const BOARD = 0.003;
const PAPER = '#ece6d6';
const PRINT = '"Courier New", monospace';
const TABS = ['PRINTERS', 'EMAIL', 'PASSWORDS', 'NETWORK', 'PHONES', 'MISC'];

function canvasTexture(w: number, h: number, paint: (ctx: CanvasRenderingContext2D) => void): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx) paint(ctx);
  const t = new CanvasTexture(canvas);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** The front cover, seen from above: label box, a coffee ring, a scribble, and grubby edges. */
function cover(): CanvasTexture {
  return canvasTexture(440, 560, (ctx) => {
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, 440, 560);
    const grime = ctx.createRadialGradient(220, 280, 120, 220, 280, 360);
    grime.addColorStop(0, 'rgba(120, 100, 70, 0)');
    grime.addColorStop(1, 'rgba(120, 100, 70, 0.3)');
    ctx.fillStyle = grime;
    ctx.fillRect(0, 0, 440, 560);
    // The label, ruled into boxes.
    ctx.strokeStyle = '#2b2b2b';
    ctx.lineWidth = 2;
    const x = 110;
    const y = 150;
    ctx.strokeRect(x, y, 260, 160);
    for (const ly of [y + 34, y + 96, y + 128]) { ctx.beginPath(); ctx.moveTo(x, ly); ctx.lineTo(x + 260, ly); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(x + 190, y + 96); ctx.lineTo(x + 190, y + 160); ctx.stroke();
    ctx.fillStyle = '#2b2b2b';
    ctx.textAlign = 'center';
    ctx.font = `bold 20px ${PRINT}`;
    ctx.fillText('BURROW & CO.', x + 130, y + 24);
    ctx.font = `bold 24px ${PRINT}`;
    ctx.fillText('IT RUNBOOK', x + 130, y + 72);
    ctx.font = `16px ${PRINT}`;
    ctx.fillText('PART NO', x + 95, y + 118);
    ctx.fillText('S/N', x + 225, y + 118);
    ctx.fillText('BC-IT-0001-REV 7', x + 95, y + 150);
    ctx.fillText('0001', x + 225, y + 150);
    // A coffee ring, and Sam's last word on it.
    ctx.strokeStyle = 'rgba(95, 55, 25, 0.4)';
    ctx.lineWidth = 7;
    ctx.beginPath(); ctx.arc(300, 420, 46, 0.4, Math.PI * 1.85); ctx.stroke();
    ctx.fillStyle = '#1f2f6b';
    ctx.textAlign = 'left';
    ctx.font = '26px "Bradley Hand", "Segoe Print", "Marker Felt", cursive';
    ctx.fillText('mostly wrong - S.', 90, 380);
  });
}

/** Page edges: fine stripes, with the tab dividers showing as darker card. */
function edges(): CanvasTexture {
  return canvasTexture(256, 32, (ctx) => {
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, 256, 32);
    for (let y = 0; y < 32; y += 2) { ctx.fillStyle = `rgba(110, 100, 80, ${0.12 + ((y * 7) % 5) * 0.03})`; ctx.fillRect(0, y, 256, 1); }
  });
}

/** One index tab sticking out of the side, its label written along it. */
function tab(label: string): Mesh {
  // The tab is short across (x) and long along the edge (z), so the label runs down the canvas.
  const map = canvasTexture(48, 256, (ctx) => {
    ctx.fillStyle = '#ddd5c0';
    ctx.fillRect(0, 0, 48, 256);
    ctx.fillStyle = '#2b2b2b';
    ctx.font = `bold 26px ${PRINT}`;
    ctx.textAlign = 'center';
    ctx.translate(15, 128);
    ctx.rotate(Math.PI / 2);
    ctx.fillText(label, 0, 0, 236);
  });
  const card = new MeshStandardMaterial({ color: new Color('#ddd5c0'), roughness: 0.9 });
  // Top face is +y: put the label there.
  return new Mesh(new BoxGeometry(0.012, 0.0012, 0.04), [card, card, new MeshStandardMaterial({ map, roughness: 0.9 }), card, card, card]);
}

export function runbook(): Object3D {
  const g = new Group();
  const edgeMat = new MeshStandardMaterial({ map: edges(), roughness: 1 });
  const pages = new Mesh(new BoxGeometry(W - 0.012, PAGES, D - 0.01), edgeMat);
  pages.position.set(0.004, BOARD + PAGES / 2, 0);
  const board = new MeshStandardMaterial({ color: new Color(PAPER), roughness: 0.75 });
  const backCover = new Mesh(new BoxGeometry(W, BOARD, D), board);
  backCover.position.y = BOARD / 2;
  const frontCover = new Mesh(new BoxGeometry(W, BOARD, D), [board, board, new MeshStandardMaterial({ map: cover(), roughness: 0.75 }), board, board, board]);
  frontCover.position.y = BOARD * 1.5 + PAGES;
  const spine = new Mesh(new BoxGeometry(BOARD, PAGES + BOARD * 2, D), board);
  spine.position.set(-W / 2, BOARD + PAGES / 2, 0);
  g.add(pages, backCover, frontCover, spine);
  // Three D-rings through the spine, catching the light.
  const steel = new MeshStandardMaterial({ color: new Color('#b9bcc2'), metalness: 0.8, roughness: 0.3 });
  for (const z of [-0.1, 0, 0.1]) {
    const ring = new Mesh(new TorusGeometry(PAGES / 2 + 0.006, 0.0022, 10, 24), steel);
    ring.position.set(-W / 2 + 0.014, BOARD + PAGES / 2, z);
    g.add(ring);
  }
  // Index tabs down the right edge, peeking out, each a little further along.
  TABS.forEach((label, i) => {
    const t = tab(label);
    t.position.set(W / 2 + 0.002, BOARD + 0.004 + (i * PAGES) / TABS.length, -D / 2 + 0.03 + i * 0.044);
    g.add(t);
  });
  g.traverse((o) => { o.castShadow = true; o.receiveShadow = true; });
  return g;
}
