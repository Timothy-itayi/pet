import {
  CanvasTexture, Color, CylinderGeometry, DoubleSide, Group, IcosahedronGeometry, Mesh, MeshStandardMaterial, RepeatWrapping, SphereGeometry,
  SRGBColorSpace, TorusGeometry, type Object3D,
} from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

/** The furniture on the floor round Sam's desk: the chair, a steel filing cabinet, the bin and a cardboard box. */

function painted(w: number, h: number, paint: (ctx: CanvasRenderingContext2D) => void): CanvasTexture {
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

function seeded(seed: number): () => number {
  let x = seed;
  return () => { x = (x * 16807) % 2147483647; return (x - 1) / 2147483646; };
}

const solid = (color: string, roughness = 0.6, metalness = 0) => new MeshStandardMaterial({ color: new Color(color), roughness, metalness });

function rounded(w: number, h: number, d: number, material: MeshStandardMaterial, at: [number, number, number], radius = 0.01): Mesh {
  const m = new Mesh(new RoundedBoxGeometry(w, h, d, 4, radius), material);
  m.position.set(...at);
  return m;
}

function castAll<T extends Object3D>(o: T): T {
  o.traverse((m) => { m.castShadow = true; m.receiveShadow = true; });
  return o;
}

/** Sam's worn mesh office chair: five-star base on castors, gas lift, padded seat, mesh back and armrests. Faces +z. */
export function officeChair(): Object3D {
  const g = new Group();
  const plasticBlack = solid('#1d1b1a', 0.55);
  const metal = solid('#5d5f63', 0.35, 0.7);
  // Five legs and castors.
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const leg = rounded(0.3, 0.035, 0.05, plasticBlack, [Math.cos(a) * 0.15, 0.075, Math.sin(a) * 0.15], 0.012);
    leg.rotation.y = -a;
    leg.rotation.z = 0.08;
    const wheel = new Mesh(new CylinderGeometry(0.025, 0.025, 0.022, 24), plasticBlack);
    wheel.rotation.x = Math.PI / 2;
    wheel.rotation.y = -a;
    wheel.position.set(Math.cos(a) * 0.29, 0.025, Math.sin(a) * 0.29);
    const fork = rounded(0.03, 0.035, 0.03, plasticBlack, [Math.cos(a) * 0.29, 0.055, Math.sin(a) * 0.29], 0.006);
    g.add(leg, wheel, fork);
  }
  const hub = new Mesh(new CylinderGeometry(0.05, 0.06, 0.06, 32), plasticBlack);
  hub.position.y = 0.09;
  const shroud = new Mesh(new CylinderGeometry(0.035, 0.04, 0.12, 24), plasticBlack);
  shroud.position.y = 0.17;
  g.add(hub, shroud);
  // Everything from the gas lift up turns: the seat, back and arms.
  const swivel = new Group();
  swivel.name = 'swivel';
  g.add(swivel);
  const lift = new Mesh(new CylinderGeometry(0.022, 0.022, 0.24, 24), metal);
  lift.position.y = 0.24;
  swivel.add(lift);
  // A padded seat, its fabric bobbled and shiny at the front edge.
  const fabric = painted(128, 128, (ctx) => {
    ctx.fillStyle = '#2b2a2c';
    ctx.fillRect(0, 0, 128, 128);
    const rand = seeded(9);
    for (let i = 0; i < 1400; i++) { ctx.fillStyle = `rgba(${rand() < 0.5 ? '70, 68, 72' : '15, 14, 16'}, 0.6)`; ctx.fillRect(rand() * 128, rand() * 128, 1, 1); }
  });
  fabric.wrapS = fabric.wrapT = RepeatWrapping;
  fabric.repeat.set(3, 3);
  const seat = rounded(0.48, 0.07, 0.46, new MeshStandardMaterial({ map: fabric, roughness: 0.95 }), [0, 0.4, 0], 0.03);
  swivel.add(seat, rounded(0.3, 0.025, 0.3, plasticBlack, [0, 0.36, 0], 0.008));
  // The back: a frame with see-through mesh stretched across it.
  const mesh = painted(128, 128, (ctx) => {
    ctx.clearRect(0, 0, 128, 128);
    ctx.strokeStyle = '#2a292b';
    ctx.lineWidth = 2;
    for (let i = -128; i < 256; i += 8) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + 128, 128); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(i + 128, 0); ctx.lineTo(i, 128); ctx.stroke();
    }
  });
  mesh.wrapS = mesh.wrapT = RepeatWrapping;
  mesh.repeat.set(4, 5);
  const backMesh = new Mesh(new RoundedBoxGeometry(0.42, 0.5, 0.01, 2, 0.004), new MeshStandardMaterial({ map: mesh, transparent: true, alphaTest: 0.3, side: DoubleSide, roughness: 0.9 }));
  backMesh.position.set(0, 0.76, -0.22);
  backMesh.rotation.x = -0.12;
  const frame = new Group();
  for (const [w, h, x, y] of [[0.46, 0.03, 0, 0.25], [0.46, 0.03, 0, -0.25], [0.03, 0.5, -0.22, 0], [0.03, 0.5, 0.22, 0]] as const) {
    frame.add(rounded(w, h, 0.03, plasticBlack, [x, y, 0], 0.012));
  }
  frame.position.set(0, 0.76, -0.22);
  frame.rotation.x = -0.12;
  const spine = rounded(0.06, 0.32, 0.03, plasticBlack, [0, 0.52, -0.23], 0.01);
  swivel.add(backMesh, frame, spine);
  // Armrests on posts.
  for (const x of [-0.25, 0.25]) {
    swivel.add(rounded(0.04, 0.2, 0.04, plasticBlack, [x, 0.52, -0.02], 0.01));
    swivel.add(rounded(0.07, 0.03, 0.26, plasticBlack, [x, 0.63, 0.0], 0.012));
  }
  return castAll(g);
}

/** A grey steel three-drawer filing cabinet, a bit dented, with a lock at the top. Front faces +z. */
export function filingCabinet(): Object3D {
  const g = new Group();
  const W = 0.42;
  const H = 0.64;
  const D = 0.5;
  const steel = new MeshStandardMaterial({
    map: painted(128, 128, (ctx) => {
      ctx.fillStyle = '#8e9296';
      ctx.fillRect(0, 0, 128, 128);
      const rand = seeded(4);
      for (let i = 0; i < 60; i++) { ctx.fillStyle = `rgba(${rand() < 0.5 ? '40, 42, 45' : '200, 205, 210'}, 0.08)`; ctx.fillRect(rand() * 128, rand() * 128, 6 + rand() * 20, 1); }
    }),
    roughness: 0.45, metalness: 0.55,
  });
  g.add(rounded(W, H, D, steel, [0, H / 2, -D / 2], 0.01));
  const heights = [0.17, 0.2, 0.2];
  let y = H - 0.025;
  heights.forEach((h, i) => {
    const cy = y - h / 2;
    g.add(rounded(W - 0.03, h - 0.012, 0.016, steel, [0, cy, 0.006], 0.006));
    // A recessed pull handle and a little label holder.
    g.add(rounded(0.14, 0.022, 0.02, solid('#3c3f43', 0.35, 0.8), [0, cy + h * 0.15, 0.016], 0.006));
    g.add(rounded(0.06, 0.03, 0.004, solid(i === 0 ? '#f1ece0' : '#d9d4c6', 0.9), [0, cy - h * 0.15, 0.016], 0.002));
    y -= h + 0.006;
  });
  const lock = new Mesh(new CylinderGeometry(0.009, 0.009, 0.01, 24), solid('#c9ccd1', 0.3, 0.9));
  lock.rotation.x = Math.PI / 2;
  lock.position.set(W / 2 - 0.04, H - 0.018, 0.006);
  g.add(lock);
  return castAll(g);
}

/** A wire-mesh office bin, with crumpled paper in it. */
export function wasteBin(): Object3D {
  const g = new Group();
  const H = 0.34;
  const wire = painted(256, 128, (ctx) => {
    ctx.clearRect(0, 0, 256, 128);
    ctx.fillStyle = '#2f3134';
    for (let x = 0; x < 256; x += 8) ctx.fillRect(x, 0, 2, 128);
    for (let y = 0; y < 128; y += 8) ctx.fillRect(0, y, 256, 2);
  });
  wire.wrapS = wire.wrapT = RepeatWrapping;
  wire.repeat.set(6, 4);
  const body = new Mesh(new CylinderGeometry(0.15, 0.115, H, 64, 1, true), new MeshStandardMaterial({
    map: wire, transparent: true, alphaTest: 0.4, side: DoubleSide, roughness: 0.4, metalness: 0.6,
  }));
  body.position.y = H / 2;
  const rim = new Mesh(new TorusGeometry(0.15, 0.005, 10, 64), solid('#2f3134', 0.35, 0.7));
  rim.rotation.x = Math.PI / 2;
  rim.position.y = H;
  const foot = new Mesh(new TorusGeometry(0.115, 0.005, 10, 64), solid('#2f3134', 0.35, 0.7));
  foot.rotation.x = Math.PI / 2;
  foot.position.y = 0.004;
  const floor = new Mesh(new CylinderGeometry(0.115, 0.115, 0.004, 48), solid('#2f3134', 0.4, 0.6));
  floor.position.y = 0.002;
  g.add(body, rim, foot, floor);
  // Crumpled paper inside, piled up nearly halfway.
  const rand = seeded(21);
  for (let i = 0; i < 13; i++) {
    const ball = new Mesh(crumple(0.035 + rand() * 0.015, i), solid(i % 3 ? '#ece6d6' : '#f2e3a0', 1));
    const a = rand() * Math.PI * 2;
    const r = rand() * 0.07;
    ball.position.set(Math.cos(a) * r, 0.04 + i * 0.009 + rand() * 0.03, Math.sin(a) * r);
    g.add(ball);
  }
  return castAll(g);
}

/** A ball of crumpled paper: a lumpy, faceted sphere. */
export function crumple(size: number, seed: number): IcosahedronGeometry {
  const geo = new IcosahedronGeometry(size, 2);
  const pos = geo.getAttribute('position');
  // Every copy of the same corner must move the same way, or the ball tears open: so the bump comes from the position.
  const bump = (x: number, y: number, z: number) => {
    const n = Math.sin(x * 412.9898 + y * 778.233 + z * 337.719 + seed * 19.19) * 43758.5453;
    return n - Math.floor(n);
  };
  for (let i = 0; i < pos.count; i++) {
    const k = 0.8 + bump(pos.getX(i), pos.getY(i), pos.getZ(i)) * 0.35;
    pos.setXYZ(i, pos.getX(i) * k, pos.getY(i) * k, pos.getZ(i) * k);
  }
  geo.computeVertexNormals();
  return geo;
}

/** A closed cardboard box: corrugated brown, taped shut, with Sam's marker on the side. Front faces +z. */
export function cardboardBox(): Object3D {
  const W = 0.5;
  const H = 0.36;
  const D = 0.4;
  const side = (label: string[]) => painted(256, 192, (ctx) => {
    ctx.fillStyle = '#b48a5a';
    ctx.fillRect(0, 0, 256, 192);
    for (let x = 0; x < 256; x += 3) { ctx.fillStyle = 'rgba(90, 60, 30, 0.08)'; ctx.fillRect(x, 0, 1, 192); }
    ctx.fillStyle = 'rgba(70, 45, 20, 0.15)';
    ctx.fillRect(0, 0, 256, 6);
    ctx.fillStyle = '#1a1612';
    ctx.font = 'bold 28px "Marker Felt", "Segoe Print", "Comic Sans MS", cursive';
    label.forEach((line, i) => ctx.fillText(line, 24, 70 + i * 36, 210));
  });
  const top = painted(256, 192, (ctx) => {
    ctx.fillStyle = '#b48a5a';
    ctx.fillRect(0, 0, 256, 192);
    // Where the flaps meet, and the parcel tape over it.
    ctx.fillStyle = 'rgba(60, 40, 20, 0.5)';
    ctx.fillRect(0, 95, 256, 2);
    ctx.fillStyle = 'rgba(205, 170, 110, 0.85)';
    ctx.fillRect(0, 78, 256, 36);
    ctx.fillStyle = 'rgba(255, 245, 220, 0.25)';
    ctx.fillRect(0, 80, 256, 6);
  });
  const plain = new MeshStandardMaterial({ map: side([]), roughness: 1 });
  const box = new Mesh(new RoundedBoxGeometry(W, H, D, 3, 0.006), [
    plain, plain, new MeshStandardMaterial({ map: top, roughness: 0.95 }), plain,
    new MeshStandardMaterial({ map: side(['SAM -', 'PERSONAL', 'DO NOT BIN']), roughness: 1 }), plain,
  ]);
  box.position.y = H / 2;
  const g = new Group();
  g.add(box);
  return castAll(g);
}

/** A tall snake plant in a speckled white pot: stiff sword leaves, banded dark and light green, yellow edges. */
export function snakePlant(): Object3D {
  const g = new Group();
  const potH = 0.32;
  const speckle = painted(256, 128, (ctx) => {
    ctx.fillStyle = '#e6e1d8';
    ctx.fillRect(0, 0, 256, 128);
    const rand = seeded(13);
    for (let i = 0; i < 700; i++) { ctx.fillStyle = `rgba(40, 36, 32, ${0.3 + rand() * 0.5})`; ctx.beginPath(); ctx.arc(rand() * 256, rand() * 128, 0.5 + rand() * 1.4, 0, Math.PI * 2); ctx.fill(); }
  });
  const pot = new Mesh(new CylinderGeometry(0.17, 0.14, potH, 64), new MeshStandardMaterial({ map: speckle, roughness: 0.85 }));
  pot.position.y = potH / 2;
  const soil = new Mesh(new CylinderGeometry(0.16, 0.16, 0.01, 48), solid('#2a1c12', 1));
  soil.position.y = potH - 0.02;
  g.add(pot, soil);
  const leafTex = painted(64, 256, (ctx) => {
    ctx.fillStyle = '#2f5a2a';
    ctx.fillRect(0, 0, 64, 256);
    for (let y = 0; y < 256; y += 14) {
      ctx.fillStyle = 'rgba(150, 190, 120, 0.35)';
      ctx.beginPath();
      ctx.moveTo(0, y); ctx.quadraticCurveTo(32, y - 8, 64, y); ctx.lineTo(64, y + 4); ctx.quadraticCurveTo(32, y - 4, 0, y + 4);
      ctx.fill();
    }
    ctx.fillStyle = '#d8c25a';
    ctx.fillRect(0, 0, 4, 256);
    ctx.fillRect(60, 0, 4, 256);
  });
  const leafMat = new MeshStandardMaterial({ map: leafTex, side: DoubleSide, roughness: 0.6 });
  const rand = seeded(17);
  for (let i = 0; i < 11; i++) {
    const h = 0.45 + rand() * 0.4;
    const w = 0.05 + rand() * 0.03;
    const geo = new SphereGeometry(1, 8, 16, 0, Math.PI, 0, Math.PI);
    // Squash a half-sphere into a long, thin, slightly cupped blade that comes to a point.
    geo.scale(w / 2, h / 2, 0.012);
    geo.translate(0, h / 2, 0);
    const leaf = new Mesh(geo, leafMat);
    const a = rand() * Math.PI * 2;
    const r = rand() * 0.08;
    leaf.position.set(Math.cos(a) * r, potH - 0.02, Math.sin(a) * r);
    leaf.rotation.set((rand() - 0.5) * 0.35, a, (rand() - 0.5) * 0.35);
    g.add(leaf);
  }
  return castAll(g);
}
