import {
  BoxGeometry, CanvasTexture, Color, CylinderGeometry, ExtrudeGeometry, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, NoBlending,
  Path, PlaneGeometry, Shape, SRGBColorSpace,
} from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { monitorNote as samsNote } from './notes.ts';

/** The CRT's glass: where the game's computer screen shows through. Width and height in metres. */
export const GLASS = { w: 0.32, h: 0.24 } as const;
/** How far back from its old spot the computer sits, to leave room for the keyboard. */
export const COMPUTER_Z = -0.12;

const BEIGE = '#d8cdb3';
const SHADE = '#c4b99e';

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

/** Old beige plastic: faintly mottled, yellowed where the sun's been at it. */
function plastic(color: string, seed: number): MeshStandardMaterial {
  const map = painted(128, 128, (ctx) => {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 900; i++) {
      const v = (i * 7919 + seed * 104729) % 997;
      ctx.fillStyle = `rgba(${v % 2 ? '120, 100, 60' : '255, 250, 235'}, ${0.012 + (v % 7) * 0.004})`;
      ctx.fillRect(v % 128, (v * 13) % 128, 2, 2);
    }
  });
  return new MeshStandardMaterial({ map, roughness: 0.55 });
}

function rounded(w: number, h: number, d: number, material: MeshStandardMaterial, at: [number, number, number], radius = 0.006): Mesh {
  const m = new Mesh(new RoundedBoxGeometry(w, h, d, 4, radius), material);
  m.position.set(...at);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function flat(w: number, h: number, d: number, color: string, at: [number, number, number], roughness = 0.6): Mesh {
  const m = new Mesh(new BoxGeometry(w, h, d), new MeshStandardMaterial({ color: new Color(color), roughness }));
  m.position.set(...at);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/** A small printed badge: a word or two on a plate. */
function badge(text: string, w: number, h: number, ink = '#4a4436', plate = '#cfc4a8'): Mesh {
  const map = painted(256, Math.round((256 * h) / w), (ctx) => {
    ctx.fillStyle = plate;
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = ink;
    ctx.font = `bold ${Math.round((256 * h) / w) * 0.62}px Helvetica, Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, Math.round((128 * h) / w) + 1, 240);
  });
  return new Mesh(new PlaneGeometry(w, h), new MeshStandardMaterial({ map, roughness: 0.5 }));
}

/** The monitor's back: a deep box that narrows towards the wall, with vent slots along the top. */
function crtBack(w: number, h: number, d: number): Mesh {
  const geo = new BoxGeometry(w, h, d, 6, 6, 10);
  const pos = geo.getAttribute('position');
  for (let i = 0; i < pos.count; i++) {
    const t = (pos.getZ(i) + d / 2) / d; // 0 at the back, 1 at the front
    const k = 0.62 + 0.38 * t;
    pos.setXY(i, pos.getX(i) * k, pos.getY(i) * k + (1 - k) * h * 0.12);
  }
  geo.computeVertexNormals();
  const vents = painted(256, 256, (ctx) => {
    ctx.fillStyle = SHADE;
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = '#2a261e';
    for (let x = 40; x < 216; x += 12) ctx.fillRect(x, 60, 5, 120);
  });
  const shell = plastic(SHADE, 2);
  return new Mesh(geo, [shell, shell, new MeshStandardMaterial({ map: vents, roughness: 0.55 }), shell, shell, shell]);
}

/**
 * Sam's computer, built to measure: a beige desktop case with drive bays, a power button and a light,
 * and a chunky CRT monitor on a swivel base. The glass is a "hole": it draws nothing, so the real
 * screen (a web page, placed in 3D behind the canvas) shows through exactly there.
 */
export function computerSet(top: number): { group: Group; glass: Mesh; powerButton: Mesh; led: MeshStandardMaterial; note: Mesh } {
  const group = new Group();
  const z = COMPUTER_Z;
  const front = z - 0.12;
  const beige = plastic(BEIGE, 1);

  // The case: rounded, with a seam round the front panel, two drive bays, a badge, and vents on top.
  group.add(rounded(0.48, 0.1, 0.4, beige, [0, top + 0.05, z - 0.32], 0.008));
  group.add(flat(0.46, 0.0015, 0.002, '#9c917a', [0, top + 0.012, front + 0.0005]));
  group.add(flat(0.0015, 0.08, 0.002, '#9c917a', [0.06, top + 0.05, front + 0.0005]));
  // 5.25" bay with its eject button, and the 3.5" floppy below with its own button and light.
  group.add(rounded(0.15, 0.036, 0.006, plastic('#cbc0a4', 3), [-0.12, top + 0.072, front + 0.001], 0.002));
  group.add(flat(0.12, 0.004, 0.003, '#2b2720', [-0.13, top + 0.074, front + 0.004]));
  group.add(rounded(0.016, 0.008, 0.006, beige, [-0.03, top + 0.064, front + 0.004], 0.002));
  group.add(flat(0.1, 0.008, 0.004, '#2b2720', [-0.13, top + 0.034, front + 0.002]));
  group.add(rounded(0.014, 0.008, 0.006, beige, [-0.055, top + 0.03, front + 0.003], 0.002));
  group.add(flat(0.006, 0.003, 0.003, '#5a3a1e', [-0.055, top + 0.042, front + 0.002]));
  const caseBadge = badge('BURROW PC 450', 0.07, 0.012);
  caseBadge.position.set(0.15, top + 0.082, front + 0.0012);
  group.add(caseBadge);
  for (let i = 0; i < 10; i++) group.add(flat(0.004, 0.002, 0.09, '#3a352b', [0.08 + i * 0.012, top + 0.1005, z - 0.42]));
  const powerButton = new Mesh(new CylinderGeometry(0.016, 0.016, 0.012, 48), new MeshStandardMaterial({ color: new Color('#a8a08c'), roughness: 0.5 }));
  powerButton.rotation.x = Math.PI / 2;
  powerButton.position.set(0.17, top + 0.05, z - 0.116);
  const led = new MeshStandardMaterial({ color: new Color('#203a24'), emissive: new Color('#7fdc7f'), emissiveIntensity: 0 });
  const ledMesh = new Mesh(new BoxGeometry(0.012, 0.006, 0.004), led);
  ledMesh.position.set(0.12, top + 0.05, z - 0.118);
  group.add(powerButton, ledMesh);

  // The monitor: a swivel base, a deep tapered back, and a thick bevelled bezel round the glass.
  const base = top + 0.1;
  const stand = new Mesh(new CylinderGeometry(0.1, 0.115, 0.018, 64), plastic(SHADE, 4));
  stand.position.set(0, base + 0.009, z - 0.34);
  const neck = new Mesh(new CylinderGeometry(0.05, 0.07, 0.025, 48), plastic(SHADE, 5));
  neck.position.set(0, base + 0.03, z - 0.34);
  group.add(stand, neck);
  const bezelW = GLASS.w + 0.08;
  const bezelH = GLASS.h + 0.08;
  const bezelZ = z - 0.22;
  const cy = base + 0.03 + bezelH / 2;
  const back = crtBack(0.36, 0.31, 0.27);
  back.position.set(0, cy - 0.005, z - 0.38);
  group.add(back);

  const bevel = 0.006;
  const outline = new Shape();
  const r = 0.02;
  const [hw, hh] = [bezelW / 2 - bevel, bezelH / 2 - bevel];
  outline.moveTo(-hw + r, -hh);
  outline.lineTo(hw - r, -hh);
  outline.quadraticCurveTo(hw, -hh, hw, -hh + r);
  outline.lineTo(hw, hh - r);
  outline.quadraticCurveTo(hw, hh, hw - r, hh);
  outline.lineTo(-hw + r, hh);
  outline.quadraticCurveTo(-hw, hh, -hw, hh - r);
  outline.lineTo(-hw, -hh + r);
  outline.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
  // The hole is the glass plus the bevel, so the bevel slopes in to meet the glass exactly.
  const [gw, gh] = [GLASS.w / 2 + bevel, GLASS.h / 2 + bevel];
  const hole = new Path();
  hole.moveTo(-gw, -gh);
  hole.lineTo(-gw, gh);
  hole.lineTo(gw, gh);
  hole.lineTo(gw, -gh);
  hole.lineTo(-gw, -gh);
  outline.holes.push(hole);
  const depth = 0.05 - bevel * 2;
  const bezel = new Mesh(new ExtrudeGeometry(outline, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 4, curveSegments: 12 }), beige);
  bezel.position.set(0, cy, bezelZ - 0.025 + bevel);
  bezel.castShadow = true;
  bezel.receiveShadow = true;
  group.add(bezel);
  group.add(flat(GLASS.w + 0.02, GLASS.h + 0.02, 0.02, '#050505', [0, cy, bezelZ - 0.03]));
  // Under the glass: the maker's name, a row of little adjustment buttons and the power light.
  const maker = badge('BurrowVision 14', 0.09, 0.012, '#5a5242', BEIGE);
  maker.position.set(0, cy - GLASS.h / 2 - 0.021, bezelZ + 0.0252);
  group.add(maker);
  for (let i = 0; i < 4; i++) group.add(rounded(0.012, 0.006, 0.004, plastic(SHADE, 6), [0.09 + i * 0.016, cy - GLASS.h / 2 - 0.021, bezelZ + 0.026], 0.0015));
  group.add(flat(0.005, 0.005, 0.003, '#3a8a3a', [0.17, cy - GLASS.h / 2 - 0.021, bezelZ + 0.026], 0.3));

  // The hole: writes "see-through" into the picture, so the page behind it is the screen.
  const glass = new Mesh(new PlaneGeometry(GLASS.w, GLASS.h), new MeshBasicMaterial({ color: new Color('#000000'), opacity: 0, blending: NoBlending }));
  glass.position.set(0, cy, bezelZ - 0.005);
  group.add(glass);
  // Sam's note, stuck to the top of the bezel and hanging over its edge, clear of the glass so it never hides the screen.
  const monitorNote = samsNote();
  monitorNote.position.set(bezelW / 2 - 0.05, cy + GLASS.h / 2 + 0.052, bezelZ + 0.027);
  monitorNote.rotation.z = -0.12;
  group.add(monitorNote);
  group.traverse((o) => { if (o !== glass) { o.castShadow = true; o.receiveShadow = true; } });
  glass.castShadow = false;
  return { group, glass, powerButton, led, note: monitorNote };
}
