import {
  BoxGeometry, BufferGeometry, CanvasTexture, CatmullRomCurve3, Float32BufferAttribute, Color, CylinderGeometry, Group, InstancedMesh, Matrix4, Mesh, MeshStandardMaterial,
  SphereGeometry, SRGBColorSpace, TubeGeometry, Vector3, type Object3D,
} from 'three';

/**
 * The beige keyboard and two-button ball mouse that came with Sam's computer, built to real sizes,
 * on a worn mouse mat, with matching cables that run round the case into the back.
 */

const BEIGE = '#d9d1bd';
const KEYCAP = '#e8e1cf';
const MODIFIER = '#d2cab4';
const CABLE = '#cfc6ad';
const CABLE_R = 0.0024;

const solid = (color: string, roughness = 0.7) => new MeshStandardMaterial({ color: new Color(color), roughness });

function cast<T extends Object3D>(o: T): T {
  o.traverse((m) => { m.castShadow = true; m.receiveShadow = true; });
  return o;
}

/** One key unit (the width of a letter key), in metres. */
const U = 0.019;
/**
 * A full 104-key layout, row by row, in key units. A number is a key that wide; a negative number is a gap;
 * [w, h] is a key that's also h rows tall (numpad + and Enter).
 */
const ROWS: (number | [number, number])[][] = [
  [1, -1, 1, 1, 1, 1, -0.5, 1, 1, 1, 1, -0.5, 1, 1, 1, 1, -0.25, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, -0.25, 1, 1, 1, -0.25, 1, 1, 1, 1],
  [1.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5, -0.25, 1, 1, 1, -0.25, 1, 1, 1, [1, 2]],
  [1.75, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.25, -3.5, 1, 1, 1],
  [2.25, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.75, -1.25, 1, -1.25, 1, 1, 1, [1, 2]],
  [1.25, 1.25, 1.25, 6.25, 1.25, 1.25, 1.25, 1.25, -0.25, 1, 1, 1, -0.25, 2, 1],
];
/** Where each row starts, front to back, in key units: the function row sits half a key apart. */
const ROW_AT = [0, 1.5, 2.5, 3.5, 4.5, 5.5];
const LAYOUT_W = 22.5;

/** A beige 104-key keyboard, back raised on its little feet. About 45 x 17 cm. */
export function keyboard(): Object3D {
  const g = new Group();
  const w = LAYOUT_W * U + 0.022;
  const d = 6.5 * U + 0.042;
  const body = new Mesh(new BoxGeometry(w, 0.022, d), solid(BEIGE, 0.6));
  body.position.y = 0.011;
  g.add(body);
  // A darker tray the keys sit in, so there's a shadow line round them.
  const well = new Mesh(new BoxGeometry(LAYOUT_W * U + 0.004, 0.002, 6.5 * U + 0.004), solid('#a39b86', 0.9));
  well.position.set(0, 0.0225, -0.008);
  g.add(well);

  const keys: { x: number; z: number; w: number; h: number; mod: boolean }[] = [];
  ROWS.forEach((row, r) => {
    let x = 0;
    for (const k of row) {
      const [kw, kh] = typeof k === 'number' ? [k, 1] : k;
      if (kw < 0) { x -= kw; continue; }
      const nav = x >= 15;
      keys.push({ x: x + kw / 2, z: (ROW_AT[r] ?? 0) + kh / 2, w: kw, h: kh, mod: r === 0 || kw !== 1 || (nav && x < 18.5) });
      x += kw;
    }
  });
  const caps = new InstancedMesh(new BoxGeometry(1, 1, 1), solid('#ffffff', 0.55), keys.length);
  const m = new Matrix4();
  keys.forEach((k, i) => {
    const kx = (k.x - LAYOUT_W / 2) * U;
    // Rows run from the back (function keys) to the front (space bar).
    const kz = (k.z - 3.25) * U - 0.008;
    m.makeScale(k.w * U - 0.0032, 0.008, k.h * U - 0.0032).setPosition(kx, 0.027, kz);
    caps.setMatrixAt(i, m);
    caps.setColorAt(i, new Color(k.mod ? MODIFIER : KEYCAP));
  });
  g.add(caps);
  // Num, Caps and Scroll Lock lights above the number pad. Num Lock is on, as it always was.
  [0, 1, 2].forEach((i) => {
    const on = i === 0;
    const led = new Mesh(new BoxGeometry(0.004, 0.002, 0.003), new MeshStandardMaterial({
      color: new Color(on ? '#3a6b3a' : '#4a5a48'), emissive: new Color('#7fdc7f'), emissiveIntensity: on ? 0.8 : 0,
    }));
    led.position.set((19.2 + i * 1.1 - LAYOUT_W / 2) * U, 0.0245, -d / 2 + 0.012);
    g.add(led);
  });
  // Tilted: the feet at the back are flicked out.
  g.rotation.x = 0.05;
  return cast(g);
}

/** Half an egg: the mouse's body, 6 cm wide, 3.4 cm tall and 11 cm long. */
const MOUSE = { w: 0.031, h: 0.034, l: 0.056 };
/** Height of the mouse's shell above (x, z), so lines can be drawn on it. */
const shell = (x: number, z: number) => MOUSE.h * Math.sqrt(Math.max(0, 1 - (x / MOUSE.w) ** 2 - (z / MOUSE.l) ** 2));

function lineOn(points: [number, number][], color = '#8e8672'): Mesh {
  const curve = new CatmullRomCurve3(points.map(([x, z]) => new Vector3(x, shell(x, z) + 0.0004, z)));
  return new Mesh(new TubeGeometry(curve, 24, 0.0006, 4, false), solid(color, 0.9));
}

/** Where the buttons end and the palm rest begins: a gentle curve across the front third. */
const seamZ = (x: number) => -0.016 - 0.004 * (1 - (x / MOUSE.w) ** 2);

/** The shell, cut along the seams into the palm rest, the left button and the right button. */
function shellParts(): [BufferGeometry, BufferGeometry, BufferGeometry] {
  const whole = new SphereGeometry(1, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2).toNonIndexed();
  whole.scale(MOUSE.w, MOUSE.h, MOUSE.l);
  const pos = whole.getAttribute('position');
  const nor = whole.getAttribute('normal');
  const parts = [0, 1, 2].map(() => ({ p: [] as number[], n: [] as number[] }));
  for (let t = 0; t < pos.count; t += 3) {
    const cx = (pos.getX(t) + pos.getX(t + 1) + pos.getX(t + 2)) / 3;
    const cz = (pos.getZ(t) + pos.getZ(t + 1) + pos.getZ(t + 2)) / 3;
    // The front points away from you (-z), so your left is -x.
    const part = parts[cz > seamZ(cx) ? 0 : cx < 0 ? 1 : 2];
    if (!part) continue;
    for (let k = t; k < t + 3; k++) {
      part.p.push(pos.getX(k), pos.getY(k), pos.getZ(k));
      part.n.push(nor.getX(k), nor.getY(k), nor.getZ(k));
    }
  }
  const [palm, left, right] = parts.map(({ p, n }) => {
    const geo = new BufferGeometry();
    geo.setAttribute('position', new Float32BufferAttribute(p, 3));
    geo.setAttribute('normal', new Float32BufferAttribute(n, 3));
    return geo;
  });
  if (!palm || !left || !right) throw new Error('Mouse shell did not split');
  return [palm, left, right];
}

/**
 * A two-button ball mouse, front pointing at the computer. Its cable comes out of the front.
 * The left button is its own piece, so it can be pressed.
 */
export function mouse(): { group: Group; leftButton: Mesh } {
  const g = new Group();
  const [palm, left, right] = shellParts();
  const leftButton = new Mesh(left, solid(BEIGE, 0.5));
  g.add(new Mesh(palm, solid(BEIGE, 0.5)), leftButton, new Mesh(right, solid(BEIGE, 0.5)));
  // A darker skirt round the bottom edge, where the top shell meets the base.
  const skirt = new Mesh(new CylinderGeometry(1, 1, 1, 32), solid('#b8af98', 0.8));
  skirt.scale.set(MOUSE.w + 0.0006, 0.004, MOUSE.l + 0.0006);
  skirt.position.y = 0.002;
  g.add(skirt);
  // The two buttons: a line across the front third, and a split down the middle.
  const across: [number, number][] = [];
  for (let i = 0; i <= 12; i++) {
    const x = -MOUSE.w * 0.94 + (i / 12) * MOUSE.w * 1.88;
    across.push([x, seamZ(x)]);
  }
  g.add(lineOn(across), lineOn([[0, -MOUSE.l * 0.98], [0, -0.04], [0, -0.03], [0, -0.02]]));
  // The little logo, embossed on the left side of the back.
  const badge = new Mesh(new BoxGeometry(0.012, 0.0008, 0.003), solid('#6e6756', 0.9));
  badge.position.set(-0.012, shell(-0.012, 0.004) - 0.0002, 0.004);
  badge.rotation.set(0.1, 0.35, -0.3);
  g.add(badge);
  // A ridged rubber sleeve where the cable leaves the mouse.
  for (let i = 0; i < 4; i++) {
    const ring = new Mesh(new CylinderGeometry(0.0036 - i * 0.0003, 0.0036 - i * 0.0003, 0.0022, 12), solid('#bfb69f', 0.8));
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, 0.008, -MOUSE.l - 0.0005 - i * 0.0026);
    g.add(ring);
  }
  cast(g);
  return { group: g, leftButton };
}

/** A cloth mouse mat, shiny where six years of wrist went round and round on it. */
export function mouseMat(): Object3D {
  const canvas = document.createElement('canvas');
  canvas.width = 230;
  canvas.height = 190;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#2c3646'; ctx.fillRect(0, 0, 230, 190);
    const worn = ctx.createRadialGradient(120, 100, 4, 120, 100, 80);
    worn.addColorStop(0, 'rgba(150, 160, 175, 0.35)'); worn.addColorStop(1, 'rgba(150, 160, 175, 0)');
    ctx.fillStyle = worn; ctx.fillRect(0, 0, 230, 190);
    ctx.fillStyle = 'rgba(232, 220, 192, 0.55)'; ctx.font = 'italic bold 15px Georgia, serif';
    ctx.fillText('Burrow & Co.', 12, 176);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)'; ctx.lineWidth = 3; ctx.strokeRect(1.5, 1.5, 227, 187);
  }
  const map = new CanvasTexture(canvas);
  map.colorSpace = SRGBColorSpace;
  const edge = solid('#1f2733', 0.95);
  const mat = new Mesh(new BoxGeometry(0.23, 0.003, 0.19), [edge, edge, new MeshStandardMaterial({ map, roughness: 0.95 }), edge, edge, edge]);
  mat.position.y = 0.0015;
  return cast(mat);
}

/** One beige cable lying on the desk and running to the back of the case. */
export function lead(points: [number, number, number][], color = CABLE): Mesh {
  const curve = new CatmullRomCurve3(points.map((p) => new Vector3(...p)));
  return cast(new Mesh(new TubeGeometry(curve, 96, CABLE_R, 6, false), solid(color, 0.6)));
}

/** Where a cable lies on a surface at height y: just resting on it. */
export const onDesk = (y: number) => y + CABLE_R;
