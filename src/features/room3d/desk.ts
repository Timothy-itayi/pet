import {
  CanvasTexture, Color, CylinderGeometry, ExtrudeGeometry, Group, Mesh, MeshStandardMaterial, RepeatWrapping, Shape, SphereGeometry,
  SRGBColorSpace, type Object3D,
} from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

/**
 * Sam's desk: an old dark-stained oak desk. Three drawers with round knobs on the left, open shelves on the right,
 * and an arched rail across the front of the knee space. The same size as before: 1.47 m wide, 76 cm deep,
 * its top at `top`, front edge at z = 0.
 */

function seeded(seed: number): () => number {
  let x = seed;
  return () => { x = (x * 16807) % 2147483647; return (x - 1) / 2147483646; };
}

/** Oak grain: long wavy streaks, darker cathedral arches, and the odd fleck. `along` is which way the grain runs. */
function oak(seed: number, along: 'x' | 'y'): CanvasTexture {
  const rand = seeded(seed);
  const W = 1024;
  const H = 256;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#6c4228';
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 160; i++) {
      const y = rand() * H;
      ctx.strokeStyle = `rgba(${rand() < 0.55 ? '38, 20, 10' : '130, 84, 50'}, ${0.08 + rand() * 0.16})`;
      ctx.lineWidth = 0.6 + rand() * 2.4;
      ctx.beginPath();
      ctx.moveTo(0, y);
      const wobble = 2 + rand() * 5;
      for (let x = 0; x <= W; x += 32) ctx.lineTo(x, y + Math.sin(x / (90 + rand() * 40) + i) * wobble);
      ctx.stroke();
    }
    // Cathedral grain: nested arches where the saw cut across the rings.
    for (let k = 0; k < 4; k++) {
      const cx = rand() * W;
      const cy = rand() * H;
      for (let r = 6; r < 70; r += 5 + rand() * 4) {
        ctx.strokeStyle = `rgba(36, 18, 8, ${0.12 + rand() * 0.12})`;
        ctx.lineWidth = 1 + rand() * 1.5;
        ctx.beginPath();
        ctx.ellipse(cx, cy, r * 4, r, 0, Math.PI * 1.05, Math.PI * 1.95);
        ctx.stroke();
      }
    }
    // Open pores: oak's little dark flecks.
    for (let i = 0; i < 1800; i++) {
      ctx.fillStyle = `rgba(28, 14, 6, ${0.15 + rand() * 0.25})`;
      ctx.fillRect(rand() * W, rand() * H, 1 + rand() * 3, 0.8);
    }
  }
  const t = new CanvasTexture(canvas);
  t.colorSpace = SRGBColorSpace;
  t.wrapS = t.wrapT = RepeatWrapping;
  t.anisotropy = 8;
  if (along === 'y') { t.center.set(0.5, 0.5); t.rotation = Math.PI / 2; }
  return t;
}

export function wood(seed: number, along: 'x' | 'y', repeat: [number, number] = [1, 1], roughness = 0.55): MeshStandardMaterial {
  const map = oak(seed, along);
  map.repeat.set(...repeat);
  return new MeshStandardMaterial({ map, roughness, color: new Color('#ffffff') });
}

function panel(w: number, h: number, d: number, material: MeshStandardMaterial, at: [number, number, number], radius = 0.004): Mesh {
  const m = new Mesh(new RoundedBoxGeometry(w, h, d, 3, radius), material);
  m.position.set(...at);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/** A round wooden knob, a shade lighter, with the varnish worn off where fingers go. */
function knob(at: [number, number, number]): Object3D {
  const g = new Group();
  const stem = new Mesh(new CylinderGeometry(0.006, 0.008, 0.014, 16), new MeshStandardMaterial({ color: new Color('#6e4429'), roughness: 0.5 }));
  stem.rotation.x = Math.PI / 2;
  stem.position.z = 0.007;
  const head = new Mesh(new SphereGeometry(0.016, 24, 16), new MeshStandardMaterial({ color: new Color('#b98a52'), roughness: 0.35 }));
  head.scale.z = 0.7;
  head.position.z = 0.018;
  g.add(stem, head);
  g.position.set(...at);
  g.traverse((o) => { o.castShadow = true; });
  return g;
}

export function desk(top: number): Object3D {
  const g = new Group();
  const left = -0.74;
  const right = 0.73;
  const back = -0.76;
  const slab = 0.032;
  const under = top - slab;

  const topWood = wood(3, 'x', [1.6, 1], 0.45);
  g.add(panel(right - left, slab, -back, topWood, [(left + right) / 2, top - slab / 2, back / 2], 0.008));

  // Left pedestal: a carcass, a recessed kick plate, and three drawers. The top one's been left open a crack.
  const side = wood(5, 'y', [0.6, 1]);
  const ped = { l: left + 0.02, r: -0.3, front: -0.02 };
  const pw = ped.r - ped.l;
  g.add(panel(pw, under, 0.72, side, [(ped.l + ped.r) / 2, under / 2, ped.front - 0.36]));
  g.add(panel(pw - 0.02, 0.06, 0.02, new MeshStandardMaterial({ color: new Color('#2a170c'), roughness: 0.8 }), [(ped.l + ped.r) / 2, 0.03, ped.front - 0.02]));
  const drawerWood = wood(9, 'x', [0.45, 0.3]);
  const gap = 0.012;
  const space = under - 0.06 - gap * 4;
  const heights = [space * 0.28, space * 0.34, space * 0.38];
  let y = under - gap;
  heights.forEach((h, i) => {
    const cy = y - h / 2;
    y -= h + gap;
    if (i > 0) {
      g.add(panel(pw - 0.024, h, 0.02, drawerWood, [(ped.l + ped.r) / 2, cy, ped.front + 0.01], 0.005));
      g.add(knob([(ped.l + ped.r) / 2, cy, ped.front + 0.02]));
      return;
    }
    // The top drawer is a real drawer: a box behind its front that slides out, with whatever's kept in it inside.
    const drawer = new Group();
    drawer.name = 'drawer';
    drawer.position.set((ped.l + ped.r) / 2, cy, ped.front + 0.012);
    drawer.add(panel(pw - 0.024, h, 0.02, drawerWood, [0, 0, 0.01], 0.005));
    drawer.add(knob([0, 0, 0.02]));
    const inner = new MeshStandardMaterial({ color: new Color('#5b3a22'), roughness: 0.85 });
    const depth = 0.42;
    const iw = pw - 0.06;
    drawer.add(panel(iw, 0.008, depth, inner, [0, -h / 2 + 0.012, -depth / 2]));
    for (const x of [-iw / 2, iw / 2]) drawer.add(panel(0.012, h - 0.03, depth, inner, [x, -0.008, -depth / 2]));
    drawer.add(panel(iw, h - 0.03, 0.012, inner, [0, -0.008, -depth]));
    const inside = new Group();
    inside.name = 'drawer-inside';
    inside.position.y = -h / 2 + 0.016;
    drawer.add(inside);
    g.add(drawer);
  });

  // Right end: open shelves between two sides, with a back.
  const shelf = { l: 0.5, r: right - 0.01 };
  const sw = shelf.r - shelf.l;
  const endWood = wood(13, 'y', [0.5, 1]);
  for (const x of [shelf.l + 0.01, shelf.r - 0.01]) g.add(panel(0.02, under, 0.72, endWood, [x, under / 2, -0.38]));
  g.add(panel(sw - 0.04, under - 0.02, 0.012, endWood, [(shelf.l + shelf.r) / 2, under / 2, -0.735]));
  const shelfWood = wood(17, 'x', [0.3, 1]);
  for (const sy of [0.05, 0.3, 0.53]) g.add(panel(sw - 0.04, 0.02, 0.68, shelfWood, [(shelf.l + shelf.r) / 2, sy, -0.38]));
  // A couple of old manuals nobody will read again, lying on the shelves.
  for (const [sy, color, h] of [[0.06, '#8a3b2e', 0.04], [0.31, '#2f4c7c', 0.03], [0.345, '#d8cfb8', 0.025]] as const) {
    g.add(panel(sw - 0.08, h, 0.26, new MeshStandardMaterial({ color: new Color(color), roughness: 0.8 }), [(shelf.l + shelf.r) / 2, sy + h / 2, -0.2], 0.003));
  }

  // The knee space: a modesty panel at the back, and an arched rail along the front.
  const kneeL = ped.r;
  const kneeR = shelf.l;
  const kw = kneeR - kneeL;
  g.add(panel(kw, under - 0.22, 0.016, side, [(kneeL + kneeR) / 2, 0.22 + (under - 0.22) / 2, -0.72]));
  const apron = new Shape();
  const ah = 0.075;
  apron.moveTo(0, 0);
  apron.lineTo(0, ah);
  apron.lineTo(kw, ah);
  apron.lineTo(kw, 0);
  apron.lineTo(kw - 0.03, 0);
  apron.quadraticCurveTo(kw / 2, ah * 0.75, 0.03, 0);
  apron.lineTo(0, 0);
  const rail = new Mesh(new ExtrudeGeometry(apron, { depth: 0.02, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.003, bevelSegments: 2, curveSegments: 32 }), wood(21, 'x', [1.2, 1]));
  rail.position.set(kneeL, under - ah, -0.024);
  rail.castShadow = true;
  rail.receiveShadow = true;
  g.add(rail);
  return g;
}
