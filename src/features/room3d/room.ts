import {
  AmbientLight, BoxGeometry, CanvasTexture, Color, CylinderGeometry, EdgesGeometry, Group, HemisphereLight, LineBasicMaterial,
  LineSegments, Mesh, MeshBasicMaterial, MeshStandardMaterial, NoBlending, PlaneGeometry, PointLight, RepeatWrapping, Scene, SpotLight, SRGBColorSpace, TorusGeometry,
  type Material, type Object3D,
} from 'three';
import { mess } from './mess.ts';
import { model, type ModelName } from './models.ts';

/** Kenney's models are about half real size; this makes the desk 1.5 m wide and 77 cm high. */
const SCALE = 2;
export const DESK_TOP = 0.384 * SCALE;
const WALL_Z = -0.82;

const mat = (color: string, extra: Partial<{ roughness: number; metalness: number; transparent: boolean; opacity: number }> = {}) =>
  new MeshStandardMaterial({ color: new Color(color), roughness: 0.8, ...extra });

function box(w: number, h: number, d: number, color: string, at: [number, number, number]): Mesh {
  const m = new Mesh(new BoxGeometry(w, h, d), mat(color));
  m.position.set(...at);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/** Draw on a small canvas and use it as a texture. */
function painted(w: number, h: number, paint: (ctx: CanvasRenderingContext2D) => void): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx) paint(ctx);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

function shadows(object: Object3D): Object3D {
  object.traverse((o) => {
    if (o instanceof Mesh) { o.castShadow = true; o.receiveShadow = true; }
  });
  return object;
}

async function place(name: ModelName, at: [number, number, number], { scale = SCALE, turn = 0 } = {}): Promise<Object3D> {
  const m = shadows(await model(name));
  m.scale.setScalar(scale);
  m.position.set(...at);
  m.rotation.y = turn;
  return m;
}

/** An outline of an empty spot: where something you're given will go. */
function emptySpot(w: number, h: number, d: number, at: [number, number, number]): LineSegments {
  const lines = new LineSegments(new EdgesGeometry(new BoxGeometry(w, h, d)), new LineBasicMaterial({ color: '#e8dcc0', transparent: true, opacity: 0.1 }));
  lines.position.set(...at);
  return lines;
}

function wall(): Object3D {
  const g = new Group();
  const pegboard = painted(64, 64, (ctx) => {
    ctx.fillStyle = '#6a4f36';
    ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = '#3f2f21';
    for (let y = 8; y < 64; y += 16) for (let x = 8; x < 64; x += 16) { ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2); ctx.fill(); }
  });
  pegboard.wrapS = pegboard.wrapT = RepeatWrapping;
  pegboard.repeat.set(16, 10);
  const back = new Mesh(new PlaneGeometry(5, 3), new MeshStandardMaterial({ map: pegboard, roughness: 0.95 }));
  back.position.set(0, 1.5, WALL_Z);
  back.receiveShadow = true;
  g.add(back);
  const floor = new Mesh(new PlaneGeometry(6, 4), mat('#3b2a1e', { roughness: 0.9 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, 1);
  floor.receiveShadow = true;
  g.add(floor);
  // Shelves on brackets, with Sam's dusty binders on the left one.
  for (const x of [-0.75, 0.75]) {
    g.add(box(0.9, 0.03, 0.22, '#9c6b3f', [x, 1.62, WALL_Z + 0.11]));
    g.add(box(0.02, 0.1, 0.18, '#6b4527', [x - 0.38, 1.56, WALL_Z + 0.1]));
    g.add(box(0.02, 0.1, 0.18, '#6b4527', [x + 0.38, 1.56, WALL_Z + 0.1]));
  }
  return g;
}

function wallBits(): { notes: Object3D; calendar: Object3D; binders: Object3D } {
  const notes = new Group();
  for (const [x, y, color, tilt] of [[-0.06, 1.3, '#f7e27a', 0.06], [0.08, 1.27, '#f2b8c6', -0.05], [0.0, 1.16, '#f7e27a', 0.02]] as const) {
    const tex = painted(32, 32, (ctx) => {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#3b2f2a99';
      for (const row of [9, 14, 19, 24]) ctx.fillRect(5, row, 18 + ((row * 7) % 6), 1.5);
    });
    // A thin card: printed front, plain paper back and edges, so it looks right from every side.
    const paper = new MeshStandardMaterial({ color: new Color(color), roughness: 1 });
    const note = new Mesh(new BoxGeometry(0.1, 0.1, 0.002), [paper, paper, paper, paper, new MeshStandardMaterial({ map: tex, roughness: 1 }), paper]);
    note.position.set(x, y, WALL_Z + 0.005);
    note.rotation.z = tilt;
    notes.add(note);
  }
  const calTex = painted(96, 80, (ctx) => {
    ctx.fillStyle = '#f4efe2'; ctx.fillRect(0, 0, 96, 80);
    ctx.fillStyle = '#c8453b'; ctx.fillRect(0, 0, 96, 16);
    for (let row = 0; row < 4; row++) for (let col = 0; col < 6; col++) {
      ctx.fillStyle = '#cfc6b2'; ctx.fillRect(6 + col * 15, 22 + row * 14, 11, 10);
      if (row * 6 + col < 20) { ctx.strokeStyle = '#c8453b'; ctx.beginPath(); ctx.moveTo(6 + col * 15, 22 + row * 14); ctx.lineTo(17 + col * 15, 32 + row * 14); ctx.stroke(); }
    }
    ctx.strokeStyle = '#c8453b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(37, 69, 8, 0, Math.PI * 2); ctx.stroke();
  });
  const card = new MeshStandardMaterial({ color: new Color('#e8e2d2'), roughness: 1 });
  const calendar = new Mesh(new BoxGeometry(0.3, 0.25, 0.004), [card, card, card, card, new MeshStandardMaterial({ map: calTex, roughness: 1 }), card]);
  calendar.position.set(0.36, 1.27, WALL_Z + 0.005);
  const binders = new Group();
  for (const [x, h, color] of [[-1.12, 0.3, '#6b5a4b'], [-1.06, 0.27, '#7a6a58'], [-1.0, 0.3, '#4f5d6b'], [-0.94, 0.24, '#8a7a62']] as const) {
    binders.add(box(0.05, h, 0.2, color, [x, 1.635 + h / 2, WALL_Z + 0.11]));
  }
  return { notes, calendar, binders };
}

/** The CRT's glass: where the game's computer screen shows through. Width and height in metres. */
export const GLASS = { w: 0.32, h: 0.24 } as const;

/**
 * Sam's computer, built to measure: a beige desktop case with a power button and a light,
 * and a chunky CRT monitor on top. The glass is a "hole": it draws nothing, so the real
 * screen (a web page, placed in 3D behind the canvas) shows through exactly there.
 */
function computerSet(top: number): { group: Group; glass: Mesh; powerButton: Mesh; led: MeshStandardMaterial } {
  const group = new Group();
  const beige = '#d8cdb3';
  const shade = '#bdb194';
  // The desktop case, lying flat, with a floppy slot, a power button and a light.
  const caseBox = box(0.48, 0.1, 0.4, beige, [0, top + 0.05, -0.32]);
  const slot = box(0.12, 0.01, 0.005, '#3b3427', [-0.1, top + 0.06, -0.118]);
  const powerButton = new Mesh(new CylinderGeometry(0.016, 0.016, 0.012, 20), mat('#a8a08c', { roughness: 0.5 }));
  powerButton.rotation.x = Math.PI / 2;
  powerButton.position.set(0.17, top + 0.05, -0.116);
  const led = new MeshStandardMaterial({ color: new Color('#203a24'), emissive: new Color('#7fdc7f'), emissiveIntensity: 0 });
  const ledMesh = new Mesh(new BoxGeometry(0.012, 0.006, 0.004), led);
  ledMesh.position.set(0.12, top + 0.05, -0.118);
  group.add(caseBox, slot, powerButton, ledMesh);
  // The monitor: a deep back, a thick bezel, and the glass set into it.
  const base = top + 0.1;
  group.add(box(0.2, 0.03, 0.18, shade, [0, base + 0.015, -0.33]));
  group.add(box(0.34, 0.3, 0.26, shade, [0, base + 0.2, -0.38]));
  const bezelW = GLASS.w + 0.08;
  const bezelH = GLASS.h + 0.08;
  const bezelZ = -0.22;
  const cy = base + 0.03 + bezelH / 2;
  for (const [w, h, x, y] of [
    [bezelW, 0.04, 0, cy + GLASS.h / 2 + 0.02], [bezelW, 0.04, 0, cy - GLASS.h / 2 - 0.02],
    [0.04, GLASS.h, -GLASS.w / 2 - 0.02, cy], [0.04, GLASS.h, GLASS.w / 2 + 0.02, cy],
  ] as const) group.add(box(w, h, 0.05, beige, [x, y, bezelZ]));
  group.add(box(GLASS.w, GLASS.h, 0.02, '#050505', [0, cy, bezelZ - 0.03]));
  // The hole: writes "see-through" into the picture, so the page behind it is the screen.
  const glass = new Mesh(new PlaneGeometry(GLASS.w, GLASS.h), new MeshBasicMaterial({ color: new Color('#000000'), opacity: 0, blending: NoBlending }));
  glass.position.set(0, cy, bezelZ - 0.005);
  group.add(glass);
  return { group, glass, powerButton, led };
}

function mug(): Object3D {
  const g = new Group();
  const body = new Mesh(new CylinderGeometry(0.04, 0.038, 0.1, 20), mat('#efe9dc', { roughness: 0.5 }));
  body.position.y = 0.05;
  const band = new Mesh(new CylinderGeometry(0.0405, 0.0405, 0.02, 20), mat('#c8453b'));
  band.position.y = 0.06;
  const handle = new Mesh(new TorusGeometry(0.025, 0.007, 8, 16, Math.PI), mat('#efe9dc'));
  handle.position.set(0.04, 0.05, 0);
  handle.rotation.z = -Math.PI / 2;
  g.add(body, band, handle);
  return shadows(g);
}

function tray(): Object3D {
  const g = new Group();
  g.add(box(0.32, 0.01, 0.24, '#8b8b84', [0, 0.005, 0]));
  for (const [w, d, x, z] of [[0.32, 0.01, 0, 0.115], [0.32, 0.01, 0, -0.115], [0.01, 0.24, 0.155, 0], [0.01, 0.24, -0.155, 0]] as const) {
    g.add(box(w, 0.04, d, '#a3a39b', [x, 0.02, z]));
  }
  return g;
}

/** Loot, as little objects sitting in the ticket tray. */
export function toolObject(id: string): Object3D {
  const g = new Group();
  switch (id) {
    case 'tweezers':
      for (const z of [-0.006, 0.006]) { const arm = box(0.16, 0.004, 0.008, '#c9c9c9', [0, 0.01, z]); arm.rotation.y = z * 4; g.add(arm); }
      break;
    case 'wifi-card': {
      const qr = painted(32, 32, (ctx) => { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 32, 32); ctx.fillStyle = '#111'; for (let i = 0; i < 40; i++) ctx.fillRect(((i * 7) % 28) + 2, ((i * 11) % 28) + 2, 3, 3); });
      const card = new Mesh(new BoxGeometry(0.09, 0.003, 0.06), new MeshStandardMaterial({ map: qr }));
      card.position.y = 0.01;
      g.add(card);
      break;
    }
    case 'hdmi-labels':
      for (const [x, label] of [[-0.04, '#f2b8c6'], [0.04, '#f7e27a']] as const) {
        const coil = new Mesh(new TorusGeometry(0.035, 0.006, 8, 24), mat('#1f1712'));
        coil.rotation.x = Math.PI / 2;
        coil.position.set(x, 0.01, 0);
        g.add(coil, box(0.02, 0.012, 0.012, label, [x + 0.035, 0.015, 0]));
      }
      break;
    case 'cable-tester':
      g.add(box(0.08, 0.03, 0.05, '#f2c94c', [0, 0.02, 0]));
      for (const [x, c] of [[-0.02, '#7fdc7f'], [0, '#7fdc7f'], [0.02, '#c8453b']] as const) g.add(box(0.008, 0.004, 0.008, c, [x, 0.036, 0]));
      break;
    case 'restart-stickers': {
      const roll = new Mesh(new CylinderGeometry(0.03, 0.03, 0.03, 20), mat('#c8453b'));
      roll.position.y = 0.02;
      g.add(roll);
      break;
    }
    case 'batteries': {
      const jar = new Mesh(new CylinderGeometry(0.04, 0.04, 0.1, 20), mat('#cfe6f5', { transparent: true, opacity: 0.35, roughness: 0.1 }));
      jar.position.y = 0.05;
      g.add(jar);
      for (let i = 0; i < 5; i++) {
        const cell = new Mesh(new CylinderGeometry(0.007, 0.007, 0.05, 8), mat(i % 2 ? '#c8453b' : '#3b2f2a'));
        cell.position.set(Math.cos(i) * 0.02, 0.03, Math.sin(i) * 0.02);
        g.add(cell);
      }
      break;
    }
    case 'cheat-sheet':
      g.add(box(0.1, 0.003, 0.14, '#f4efe2', [0, 0.008, 0]));
      break;
  }
  return shadows(g);
}

export interface Room {
  scene: Scene;
  /** Clickable things, by item id. */
  pickables: Map<string, Object3D>;
  /** The monitor's glass, where the game's screen appears. */
  glass: Mesh;
  /** The light on the case: green when it's on. */
  led: MeshStandardMaterial;
  screenLight: PointLight;
  /** Where loot goes: the ticket tray. */
  traySpot: Group;
}

export async function buildRoom(): Promise<Room> {
  const scene = new Scene();
  scene.background = new Color('#120d0a');
  scene.add(new AmbientLight('#ffe6c7', 0.35));
  scene.add(new HemisphereLight('#ffe2b0', '#2a1d14', 0.5));

  const pickables = new Map<string, Object3D>();
  const add = (id: string | undefined, object: Object3D) => {
    scene.add(object);
    if (id) pickables.set(id, object);
    return object;
  };

  add('wall', wall());
  const { notes, calendar, binders } = wallBits();
  add('notes', notes);
  add('calendar', calendar);
  add('binders', binders);
  scene.add(emptySpot(0.8, 0.28, 0.2, [0.75, 1.78, WALL_Z + 0.11]));
  scene.add(emptySpot(0.45, 0.32, 0.02, [-0.42, 1.25, WALL_Z + 0.02]));

  // The desk, centred, with its front edge at z = 0.
  add(undefined, await place('desk', [-0.72, 0, 0]));
  const top = DESK_TOP;
  // Sam's CRT, a little off-centre, with its glass facing you.
  const set = computerSet(top);
  set.group.remove(set.powerButton);
  add('computer', set.group);
  add('power', set.powerButton);
  const screenLight = new PointLight('#d6f2d6', 0.4, 0.7);
  screenLight.position.set(0, set.glass.position.y, 0.05);
  scene.add(screenLight);

  add(undefined, await place('computerKeyboard', [-0.22, top, 0.02], { scale: 1.6 }));
  add(undefined, await place('computerMouse', [0.22, top, -0.03], { scale: 1.6 }));
  // Desk lamp, left, throwing warm light over everything.
  add(undefined, await place('lampSquareTable', [-0.68, top, -0.42], { scale: 1.8 }));
  const lamp = new SpotLight('#ffcf8a', 18, 4, Math.PI / 4, 0.6, 1.6);
  lamp.position.set(-0.55, top + 0.6, -0.3);
  lamp.target.position.set(0.1, top, -0.1);
  lamp.castShadow = true;
  lamp.shadow.mapSize.set(1024, 1024);
  scene.add(lamp, lamp.target);

  const runbook = box(0.05, 0.28, 0.22, '#3f63a0', [-0.36, top + 0.14, -0.4]);
  add('runbook', runbook);
  const mugObj = mug();
  mugObj.position.set(0.3, top, -0.32);
  add('mug', mugObj);
  const trayObj = tray();
  trayObj.position.set(0.48, top, -0.12);
  add('tray', trayObj);
  const traySpot = new Group();
  traySpot.position.set(0.48, top + 0.01, -0.12);
  scene.add(traySpot);
  const pad = box(0.08, 0.012, 0.08, '#f7e27a', [-0.55, top + 0.006, -0.05]);
  scene.add(pad);
  // A clean rectangle in the dust where the phone used to be.
  const dust = new Mesh(new PlaneGeometry(0.2, 0.14), mat('#b07a48', { roughness: 1 }));
  dust.rotation.x = -Math.PI / 2;
  dust.position.set(0.15, top + 0.002, -0.55);
  add('phone', dust);
  scene.add(emptySpot(0.3, 0.25, 0.2, [0.38, top + 0.125, -0.55]));
  const plant = await place('plantSmall1', [0.62, top, -0.5], { scale: 2 });
  add('plant', plant);

  // Sam's chair, pushed out to the side as if someone just stood up, darkened like a worn mesh office chair.
  const chair = await place('chairDesk', [0.95, 0, 0.55], { turn: Math.PI + 0.6 });
  chair.traverse((o) => {
    if (o instanceof Mesh && o.material instanceof MeshStandardMaterial) { o.material = o.material.clone(); o.material.color.multiplyScalar(0.28); }
  });
  add('chair', chair);
  scene.add(mess(top, WALL_Z));
  add(undefined, await place('sideTableDrawers', [0.78, 0, -0.02], { scale: 1.4 }));
  add(undefined, await place('trashcan', [-1.05, 0, -0.2], { scale: 1.3 }));
  add(undefined, await place('pottedPlant', [1.45, 0, -0.62], { scale: 1.9 }));
  add(undefined, await place('cardboardBoxClosed', [-1.6, 0, -0.55], { scale: 1.6 }));

  return { scene, pickables, glass: set.glass, led: set.led, screenLight, traySpot };
}

/** Every material inside something, so it can glow when you point at it. */
export function materialsOf(object: Object3D): MeshStandardMaterial[] {
  const found: MeshStandardMaterial[] = [];
  object.traverse((o) => {
    if (!(o instanceof Mesh)) return;
    // Give each clickable thing its own materials, so highlighting one doesn't light up another.
    const own = (Array.isArray(o.material) ? o.material : [o.material]).map((m: Material) => m.clone());
    o.material = own.length === 1 ? own[0] : own;
    for (const m of own) if (m instanceof MeshStandardMaterial) found.push(m);
  });
  return found;
}
