import { BoxGeometry, CanvasTexture, Color, Group, Mesh, MeshStandardMaterial, SRGBColorSpace, type Object3D } from 'three';

/**
 * Paper on the wall: Sam's pile of old forms and receipts taped up above the monitor, sticky notes in small
 * handwriting on top, and the lever-arch binders on the shelf. Everything is drawn on canvases, sized so the
 * writing is readable when you walk up to the wall.
 */

const HAND = '"Bradley Hand", "Segoe Print", "Ink Free", "Marker Felt", "Comic Sans MS", cursive';
const PRINT = '"Courier New", monospace';

function texture(w: number, h: number, paint: (ctx: CanvasRenderingContext2D) => void): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx) paint(ctx);
  const t = new CanvasTexture(canvas);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** A thin sheet: printed on the front, plain paper on the back and edges. */
function sheet(w: number, h: number, color: string, map: CanvasTexture, depth = 0.0015): Mesh {
  const plain = new MeshStandardMaterial({ color: new Color(color), roughness: 1 });
  const m = new Mesh(new BoxGeometry(w, h, depth), [plain, plain, plain, plain, new MeshStandardMaterial({ map, roughness: 1 }), plain]);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/** A square sticky note in someone's handwriting, slightly darker where it's started to curl. */
export function stickyNote(color: string, lines: string[], size = 0.075, ink = '#22305c'): Mesh {
  const map = texture(256, 256, (ctx) => {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 256, 256);
    const curl = ctx.createLinearGradient(0, 180, 0, 256);
    curl.addColorStop(0, 'rgba(0, 0, 0, 0)');
    curl.addColorStop(1, 'rgba(60, 40, 0, 0.18)');
    ctx.fillStyle = curl;
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.fillRect(0, 0, 256, 34);
    ctx.fillStyle = ink;
    const px = lines.length > 4 ? 32 : 38;
    ctx.font = `${px}px ${HAND}`;
    lines.forEach((line, i) => {
      ctx.save();
      ctx.translate(18, 58 + i * (px + 8));
      ctx.rotate(-0.02 + (i % 2) * 0.025);
      ctx.fillText(line, 0, 0, 222);
      ctx.restore();
    });
  });
  return sheet(size, size, color, map, 0.001);
}

/** An old multi-part form: a printed heading, a ruled table, tractor-feed holes, a stamp and some scrawl. */
function form(w: number, h: number, color: string, title: string, scrawl: string[], stamp?: string): Mesh {
  const W = 320;
  const H = Math.round((W * h) / w);
  const map = texture(W, H, (ctx) => {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, W, H);
    // Faded where the sun got it.
    ctx.fillStyle = 'rgba(255, 250, 235, 0.25)';
    ctx.fillRect(0, 0, W, H * 0.4);
    // Tractor-feed holes down both edges.
    ctx.fillStyle = 'rgba(80, 70, 60, 0.45)';
    for (let y = 14; y < H; y += 22) for (const x of [9, W - 9]) { ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#3a3f4a';
    ctx.font = `bold 22px ${PRINT}`;
    ctx.fillText(title, 26, 34);
    ctx.font = `11px ${PRINT}`;
    ctx.fillText('BURROW & CO. • ACCOUNTS PAYABLE', 26, 52);
    ctx.fillText(`NO. ${String((title.length * 7919) % 90000 + 10000)}`, W - 110, 34);
    // The printed table: ruled rows, a few columns.
    ctx.strokeStyle = 'rgba(58, 63, 74, 0.55)';
    ctx.lineWidth = 1;
    const top = 66;
    for (let y = top; y < H - 20; y += 18) { ctx.beginPath(); ctx.moveTo(22, y); ctx.lineTo(W - 22, y); ctx.stroke(); }
    for (const x of [22, 70, W * 0.62, W - 22]) { ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, H - 20); ctx.stroke(); }
    ctx.font = `bold 10px ${PRINT}`;
    ctx.fillStyle = '#3a3f4a';
    ctx.fillText('QTY', 30, top + 13);
    ctx.fillText('DESCRIPTION', 80, top + 13);
    ctx.fillText('AMOUNT', W * 0.62 + 8, top + 13);
    // Somebody's handwriting in the boxes.
    ctx.fillStyle = '#1f2f6b';
    ctx.font = `17px ${HAND}`;
    scrawl.forEach((line, i) => ctx.fillText(line, 30, top + 33 + i * 18, W - 60));
    if (stamp) {
      ctx.save();
      ctx.translate(W * 0.55, H * 0.72);
      ctx.rotate(-0.22);
      ctx.strokeStyle = 'rgba(168, 40, 52, 0.75)';
      ctx.fillStyle = 'rgba(168, 40, 52, 0.75)';
      ctx.lineWidth = 3;
      ctx.strokeRect(-70, -22, 140, 40);
      ctx.font = `bold 21px ${PRINT}`;
      ctx.fillText(stamp, -62, 6, 124);
      ctx.restore();
    }
  });
  return sheet(w, h, color, map);
}

/** A strip of black tape holding paper to the wall. */
function tape(x: number, y: number, z: number, turn: number): Mesh {
  const t = new Mesh(new BoxGeometry(0.012, 0.03, 0.0008), new MeshStandardMaterial({ color: new Color('#16130f'), roughness: 0.4 }));
  t.position.set(x, y, z);
  t.rotation.z = turn;
  return t;
}

/** The pile above the monitor: forms taped up over six years, with Sam's sticky notes stuck on top. Centred on the group's origin. */
export function noteCollage(): Object3D {
  const g = new Group();
  let z = 0;
  const layer = () => (z += 0.0016);
  const forms: [number, number, number, number, number, string, string, string[], string?][] = [
    [0.13, 0.17, -0.11, 0.03, 0.03, '#cfe6d4', 'PACKING LIST', ['2  toner cart. (blk)', '1  mouse balls??', '40 CAT5 patch'], 'RECEIVED'],
    [0.11, 0.15, 0.0, 0.05, -0.02, '#f2d3ab', 'INVOICE', ['1  printer repair', '   (again)', '   $220 - DISPUTED']],
    [0.12, 0.14, 0.1, 0.01, 0.04, '#d6e4f1', 'WORK ORDER', ['3F printer jam', 'fixed - kicked it', 'see note'], 'CLOSED'],
    [0.12, 0.1, -0.07, -0.08, -0.05, '#f5e6a2', 'RECEIPT', ['keyboard x2', 'beige (only kind', 'they had)']],
    [0.1, 0.09, 0.06, -0.09, 0.025, '#f2c7d1', 'DELIVERY', ['server fan', 'signed: S.'], 'PAID'],
  ];
  for (const [w, h, x, y, turn, color, title, scrawl, stamp] of forms) {
    const f = form(w, h, color, title, scrawl, stamp);
    f.position.set(x, y, layer());
    f.rotation.z = turn;
    g.add(f, tape(x - w * 0.3, y + h / 2 - 0.004, z + 0.001, turn + 0.08), tape(x + w * 0.3, y + h / 2 - 0.004, z + 0.001, turn - 0.06));
  }
  const notes: [number, number, number, string, string[]][] = [
    [-0.115, -0.04, 0.06, '#f7e27a', ['Printer 3F:', 'jams? kick', 'left side']],
    [0.0, -0.065, -0.05, '#f2b8c6', ['Dot = x214', 'be nice!!']],
    [0.115, 0.075, 0.04, '#f7e27a', ['DON’T', 'reboot srv', 'on Tues']],
    [-0.035, 0.1, -0.03, '#bfe3c0', ['VPN resets', 'every Fri', '(why??)']],
    [0.09, -0.06, 0.08, '#f7e27a', ['pw: password', 'change it??', '- never']],
  ];
  for (const [x, y, turn, color, lines] of notes) {
    const n = stickyNote(color, lines);
    n.position.set(x, y, layer());
    n.rotation.z = turn;
    g.add(n);
  }
  return g;
}

/** A grey lever-arch binder, spine out: an orange label with a title and year, and the finger hole near the bottom. */
function binder(title: string, year: string, h: number): Mesh {
  const W = 64;
  const H = Math.round((W * h) / 0.055);
  const spine = texture(W, H, (ctx) => {
    ctx.fillStyle = '#3b3f45';
    ctx.fillRect(0, 0, W, H);
    // Scuffed card.
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    for (let i = 0; i < 40; i++) ctx.fillRect((i * 17) % W, (i * 53) % H, 6, 1);
    const top = H * 0.05;
    const labelH = H * 0.62;
    ctx.fillStyle = '#ee7a3a';
    ctx.fillRect(7, top, W - 14, labelH);
    ctx.fillStyle = 'rgba(255, 240, 220, 0.18)';
    ctx.fillRect(7, top, W - 14, labelH * 0.3);
    ctx.fillStyle = '#1d1b19';
    ctx.fillRect(W / 2 - 6, top + 8, 12, 8);
    ctx.save();
    ctx.translate(W / 2 + 7, top + labelH - 34);
    ctx.rotate(-Math.PI / 2);
    ctx.font = `bold 20px ${PRINT}`;
    ctx.fillText(title, 0, 0, labelH - 60);
    ctx.restore();
    ctx.font = `14px ${PRINT}`;
    ctx.fillText(year, W / 2 - 18, top + labelH - 10, W - 18);
    // The finger hole, with its metal rim.
    ctx.fillStyle = '#c9ccd1';
    ctx.beginPath(); ctx.arc(W / 2, H * 0.82, 15, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#111214';
    ctx.beginPath(); ctx.arc(W / 2, H * 0.82, 11, 0, Math.PI * 2); ctx.fill();
  });
  const card = new MeshStandardMaterial({ color: new Color('#3b3f45'), roughness: 0.8 });
  const edge = new MeshStandardMaterial({ color: new Color('#e9e3d2'), roughness: 1 });
  const b = new Mesh(new BoxGeometry(0.055, h, 0.2), [card, card, edge, edge, new MeshStandardMaterial({ map: spine, roughness: 0.7 }), card]);
  b.castShadow = true;
  b.receiveShadow = true;
  return b;
}

/** Sam's binders, standing on a shelf whose top is at `shelfTop`, the last one slumped against the rest. */
export function binders(shelfTop: number, z: number): Object3D {
  const g = new Group();
  const row: [string, string, number][] = [
    ['PRINTERS', '2016', 0.3], ['PRINTERS', '2017', 0.3], ['PRINTERS (OTHER)', '????', 0.3], ['NETWORK', '2019', 0.29], ['MISC', '-', 0.28],
  ];
  row.forEach(([title, year, h], i) => {
    const b = binder(title, year, h);
    const last = i === row.length - 1;
    b.position.set(-1.14 + i * 0.058 + (last ? 0.03 : 0), shelfTop + h / 2 - (last ? 0.012 : 0), z);
    if (last) b.rotation.z = 0.26;
    g.add(b);
  });
  return g;
}

/** Sam's note on the monitor, in Sam's handwriting. */
export function monitorNote(): Mesh {
  return stickyNote('#f7e27a', ['Power btn:', 'the case,', 'bottom right.', 'Takes AGES.', '- S'], 0.07, '#2b2420');
}
