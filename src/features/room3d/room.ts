import {
  BoxGeometry, CanvasTexture, Color, CylinderGeometry, DirectionalLight, EdgesGeometry, Fog, Group, HemisphereLight, LineBasicMaterial,
  LineSegments, Mesh, MeshBasicMaterial, MeshStandardMaterial, PlaneGeometry, PointLight, RepeatWrapping, Scene,
  SRGBColorSpace, TorusGeometry,
  type Material, type Object3D,
} from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mess } from './mess.ts';
import { COMPUTER_Z, computerSet } from './computer.ts';
import { desk, wood } from './desk.ts';
import { cardboardBox, filingCabinet, officeChair, snakePlant, wasteBin } from './furniture.ts';
import { deskLamp } from './lamp.ts';
import { mug } from './mug.ts';
import { runbook } from './runbook.ts';
import { binders, noteCollage } from './notes.ts';
import { keyboard, lead, mouse, mouseMat, onDesk } from './peripherals.ts';
import { moneyPlant } from './plant.ts';

/** The desk top's height: 77 cm. */
export const DESK_TOP = 0.768;
const WALL_Z = -0.82;
export { COMPUTER_Z, GLASS } from './computer.ts';

const mat = (color: string, extra: Partial<{ roughness: number; metalness: number; transparent: boolean; opacity: number }> = {}) =>
  new MeshStandardMaterial({ color: new Color(color), roughness: 0.8, ...extra });

/** A box with softly rounded edges, so nothing in the room has a razor-sharp corner. */
function box(w: number, h: number, d: number, color: string, at: [number, number, number]): Mesh {
  const m = new Mesh(new RoundedBoxGeometry(w, h, d, 3, Math.min(0.004, Math.min(w, h, d) * 0.45)), mat(color));
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

/** An outline of an empty spot: where something you're given will go. */
function emptySpot(w: number, h: number, d: number, at: [number, number, number]): LineSegments {
  const lines = new LineSegments(new EdgesGeometry(new BoxGeometry(w, h, d)), new LineBasicMaterial({ color: '#e8dcc0', transparent: true, opacity: 0.1 }));
  lines.position.set(...at);
  return lines;
}

function wall(): { wall: Object3D; floor: Object3D } {
  const g = new Group();
  const pegboard = painted(64, 64, (ctx) => {
    ctx.fillStyle = '#6a4f36';
    ctx.fillRect(0, 0, 64, 64);
    // Board grain and a bit of grime, so it isn't a flat colour.
    for (let i = 0; i < 90; i++) {
      ctx.fillStyle = `rgba(${i % 2 ? '40, 26, 14' : '120, 90, 60'}, 0.08)`;
      ctx.fillRect((i * 37) % 64, (i * 23) % 64, 1 + (i % 3), 1);
    }
    ctx.fillStyle = '#3f2f21';
    for (let y = 8; y < 64; y += 16) for (let x = 8; x < 64; x += 16) { ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2); ctx.fill(); }
  });
  pegboard.wrapS = pegboard.wrapT = RepeatWrapping;
  pegboard.repeat.set(16, 10);
  const back = new Mesh(new PlaneGeometry(5, 3), new MeshStandardMaterial({ map: pegboard, bumpMap: pegboard, bumpScale: 2, roughness: 0.95 }));
  back.position.set(0, 1.5, WALL_Z);
  back.receiveShadow = true;
  // Clicking the wall only counts above the desk (see `reach` below), never through the desk or under it.
  back.raycast = () => {};
  g.add(back);
  const reach = new Mesh(new PlaneGeometry(5, 3 - DESK_TOP), new MeshBasicMaterial({ colorWrite: false, depthWrite: false }));
  reach.position.set(0, DESK_TOP + (3 - DESK_TOP) / 2, WALL_Z + 0.0055);
  g.add(reach);
  // Tired office carpet tiles: flecked, with one tile slightly off-colour.
  const carpet = painted(128, 128, (ctx) => {
    ctx.fillStyle = '#3a3532'; ctx.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 2600; i++) {
      const v = (i * 7919) % 255;
      ctx.fillStyle = `rgba(${v % 3 ? '90, 82, 74' : '24, 22, 20'}, 0.5)`;
      ctx.fillRect((i * 53) % 128, (i * 97) % 128, 1, 1);
    }
    ctx.strokeStyle = '#2a2624'; ctx.lineWidth = 1; ctx.strokeRect(0.5, 0.5, 127, 127);
  });
  carpet.wrapS = carpet.wrapT = RepeatWrapping;
  carpet.repeat.set(10, 7);
  const floor = new Mesh(new PlaneGeometry(6, 4), new MeshStandardMaterial({ map: carpet, bumpMap: carpet, bumpScale: 3, roughness: 1 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, 1);
  floor.receiveShadow = true;
  // Shelves on brackets, with Sam's dusty binders on the left one.
  for (const x of [-0.75, 0.75]) {
    const board = box(0.9, 0.03, 0.22, '#9c6b3f', [x, 1.62, WALL_Z + 0.11]);
    board.material = wood(31 + Math.round(x * 10), 'x', [0.6, 0.3]);
    g.add(board);
    g.add(box(0.02, 0.1, 0.18, '#6b4527', [x - 0.38, 1.56, WALL_Z + 0.1]));
    g.add(box(0.02, 0.1, 0.18, '#6b4527', [x + 0.38, 1.56, WALL_Z + 0.1]));
  }
  return { wall: g, floor };
}

function wallBits(): { notes: Object3D; calendar: Object3D; binders: Object3D } {
  // Sam's pile of forms and sticky notes, taped up above the monitor.
  const notes = noteCollage();
  notes.position.set(-0.02, 1.4, WALL_Z + 0.003);
  // A proper month on the wall: Sam crossed off every working day, and circled the last one.
  const calTex = painted(480, 400, (ctx) => {
    ctx.fillStyle = '#f4efe2'; ctx.fillRect(0, 0, 480, 400);
    ctx.fillStyle = '#c8453b'; ctx.fillRect(0, 0, 480, 64);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 34px Georgia, serif'; ctx.fillText('OCTOBER', 24, 44);
    ctx.font = '18px Georgia, serif'; ctx.fillText('Burrow & Co. \u2022 2026', 290, 42);
    ctx.fillStyle = '#6e5e52'; ctx.font = 'bold 15px sans-serif';
    ['M', 'T', 'W', 'T', 'F', 'S', 'S'].forEach((d, c) => ctx.fillText(d, 30 + c * 64, 88));
    ctx.font = '17px sans-serif';
    for (let day = 1; day <= 31; day++) {
      const cell = day + 2; // the 1st is a Wednesday
      const c = cell % 7;
      const r = Math.floor(cell / 7);
      const x = 14 + c * 64;
      const y = 100 + r * 56;
      ctx.strokeStyle = '#d8cfbb'; ctx.lineWidth = 1; ctx.strokeRect(x, y, 62, 54);
      ctx.fillStyle = c >= 5 ? '#c8453b' : '#3b2f2a'; ctx.fillText(String(day), x + 6, y + 20);
      if (day <= 23 && c < 5) {
        ctx.strokeStyle = '#c8453bcc'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(x + 8, y + 10); ctx.lineTo(x + 54, y + 48); ctx.moveTo(x + 54, y + 10); ctx.lineTo(x + 8, y + 48); ctx.stroke();
      }
      if (day === 23) {
        ctx.strokeStyle = '#c8453b'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.ellipse(x + 31, y + 27, 36, 30, -0.1, 0, Math.PI * 2); ctx.stroke();
        ctx.font = '17px sans-serif';
      }
    }
    // Someone scribbled a reminder, and a mug left a ring.
    // In the empty squares before the 1st: Sam's last word on the matter, and a reminder that never got done.
    ctx.fillStyle = '#c8453b'; ctx.font = 'italic bold 26px Georgia, serif'; ctx.fillText('FREEDOM!', 22, 140);
    ctx.fillStyle = '#2f4c7c'; ctx.font = 'italic 14px Georgia, serif'; ctx.fillText('printer guy Thu??', 30, 386);
    ctx.strokeStyle = 'rgba(90, 55, 25, 0.35)'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(390, 330, 34, 0.5, Math.PI * 1.8); ctx.stroke();
  });
  const card = new MeshStandardMaterial({ color: new Color('#e8e2d2'), roughness: 1 });
  const calendar = new Mesh(new BoxGeometry(0.36, 0.3, 0.004), [card, card, card, card, new MeshStandardMaterial({ map: calTex, roughness: 1 }), card]);
  calendar.position.set(0.36, 1.27, WALL_Z + 0.005);
  const pin = new Mesh(new CylinderGeometry(0.008, 0.008, 0.012, 32), mat('#c8453b', { roughness: 0.4 }));
  pin.rotation.x = Math.PI / 2;
  calendar.add(pin);
  pin.position.set(0, 0.14, 0.007);
  const shelves = binders(1.635, WALL_Z + 0.11);
  return { notes, calendar, binders: shelves };
}

/** A four-socket power board lying on the carpet, with an illuminated switch and two plugs in it. */
function powerBoard(): Object3D {
  const g = new Group();
  g.add(box(0.3, 0.035, 0.06, '#e9e4d6', [0, 0.0175, 0]));
  for (let i = 0; i < 4; i++) g.add(box(0.036, 0.002, 0.026, '#cfc8b6', [-0.06 + i * 0.055, 0.036, 0]));
  for (const x of [-0.06, -0.005]) g.add(box(0.032, 0.028, 0.03, '#1f1a16', [x, 0.05, 0]));
  const lit = new Mesh(new BoxGeometry(0.03, 0.012, 0.022), new MeshStandardMaterial({ color: '#ff8a3d', emissive: new Color('#ff6a1a'), emissiveIntensity: 1.2 }));
  lit.position.set(-0.125, 0.04, 0);
  g.add(lit);
  return shadows(g);
}

/** A narrow wire-grey ticket tray, long side front to back, tucked in at the right of the desk. */
function tray(): Object3D {
  const g = new Group();
  g.add(box(0.18, 0.008, 0.28, '#8b8b84', [0, 0.004, 0]));
  for (const [w, d, x, z] of [[0.18, 0.008, 0, 0.136], [0.18, 0.008, 0, -0.136], [0.008, 0.28, 0.086, 0], [0.008, 0.28, -0.086, 0]] as const) {
    g.add(box(w, 0.03, d, '#a3a39b', [x, 0.015, z]));
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
        const coil = new Mesh(new TorusGeometry(0.035, 0.006, 16, 64), mat('#1f1712'));
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
      const roll = new Mesh(new CylinderGeometry(0.03, 0.03, 0.03, 48), mat('#c8453b'));
      roll.position.y = 0.02;
      g.add(roll);
      break;
    }
    case 'batteries': {
      const jar = new Mesh(new CylinderGeometry(0.04, 0.04, 0.1, 48), mat('#cfe6f5', { transparent: true, opacity: 0.35, roughness: 0.1 }));
      jar.position.y = 0.05;
      g.add(jar);
      for (let i = 0; i < 5; i++) {
        const cell = new Mesh(new CylinderGeometry(0.007, 0.007, 0.05, 24), mat(i % 2 ? '#c8453b' : '#3b2f2a'));
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
  /** The mouse's left button, which goes down when you click the mouse. */
  mouseButton: Mesh;
}

export async function buildRoom(): Promise<Room> {
  const scene = new Scene();
  scene.background = new Color('#120d0a');
  // The far end of the room fades into the dark, so the desk reads as near and the wall as further away.
  scene.fog = new Fog('#120d0a', 2.6, 7);
  // Every light here comes from something: the office's overhead tubes behind you, Sam's lamp, and the monitor.
  // A little bounce off the ceiling and carpet, so shadows are dark but never black.
  scene.add(new HemisphereLight('#d9c9ad', '#1e150e', 0.5));
  // The overhead tubes, behind and above you: soft, and the reason it's dark under the desk.
  const overhead = new DirectionalLight('#f1e6d2', 0.55);
  overhead.position.set(0.5, 3.2, 2.4);
  overhead.target.position.set(0, 0, -0.3);
  overhead.castShadow = true;
  overhead.shadow.mapSize.set(2048, 2048);
  Object.assign(overhead.shadow.camera, { left: -2.2, right: 2.2, top: 2, bottom: -2, near: 0.5, far: 7 });
  overhead.shadow.bias = -0.0004;
  overhead.shadow.normalBias = 0.02;
  scene.add(overhead, overhead.target);

  const pickables = new Map<string, Object3D>();
  const add = (id: string | undefined, object: Object3D) => {
    scene.add(object);
    if (id) pickables.set(id, object);
    return object;
  };

  const room = wall();
  add('wall', room.wall);
  add(undefined, room.floor);
  const { notes, calendar, binders } = wallBits();
  add('notes', notes);
  add('calendar', calendar);
  add('binders', binders);
  scene.add(emptySpot(0.8, 0.28, 0.2, [0.75, 1.78, WALL_Z + 0.11]));
  scene.add(emptySpot(0.45, 0.32, 0.02, [-0.42, 1.25, WALL_Z + 0.02]));

  // The desk, centred, with its front edge at z = 0.
  add(undefined, desk(DESK_TOP));
  const top = DESK_TOP;
  // Sam's CRT, a little off-centre, with its glass facing you.
  const set = computerSet(top);
  set.group.remove(set.powerButton);
  set.group.remove(set.note);
  add('monitor-note', set.note);
  add('computer', set.group);
  add('power', set.powerButton);
  // The glow off the glass: cool blue, like the desktop, falling on the keyboard and your hands.
  const screenLight = new PointLight('#a9c1ea', 0.4, 0.9, 1.5);
  screenLight.position.set(0, set.glass.position.y - 0.04, set.glass.position.z + 0.12);
  scene.add(screenLight);

  // Keyboard square in front of the screen; the mouse on its mat to the right, with room to move.
  const kb = keyboard();
  kb.position.set(-0.04, top, -0.09);
  add(undefined, kb);
  const pad = mouseMat();
  pad.position.set(0.34, top, -0.1);
  add(undefined, pad);
  const rodent = mouse();
  rodent.group.position.set(0.33, top + 0.003, -0.07);
  rodent.group.rotation.y = -0.12;
  add('mouse', rodent.group);
  // Both cables beige, the same thickness, lying on the desk and round the sides of the case into the back.
  const y = onDesk(top);
  const back = COMPUTER_Z - 0.52;
  add(undefined, lead([[-0.04, top + 0.012, -0.172], [-0.06, y, -0.2], [-0.2, y, -0.205], [-0.272, y, -0.26], [-0.275, y, -0.45], [-0.22, y, back - 0.03], [-0.1, top + 0.03, back - 0.02], [-0.06, top + 0.05, back + 0.005]]));
  add(undefined, lead([[0.327, top + 0.011, -0.135], [0.32, y + 0.003, -0.16], [0.3, y, -0.21], [0.272, y, -0.27], [0.275, y, -0.45], [0.22, y, back - 0.03], [0.1, top + 0.03, back - 0.02], [0.06, top + 0.05, back + 0.005]]));

  // Sam's brass desk lamp, back left, leaning over the desk: the main light, pooled warm on the papers and keyboard.
  const lampObj = deskLamp();
  lampObj.group.position.set(-0.6, top, -0.56);
  lampObj.group.rotation.y = 0.75;
  add('lamp', lampObj.group);

  // The runbook, lying in the lamp's pool of light where Sam left it.
  const book = runbook();
  book.position.set(-0.43, top, -0.38);
  book.rotation.y = 0.22;
  add('runbook', book);
  const mugObj = mug();
  mugObj.position.set(0.41, top, -0.38);
  mugObj.rotation.y = -0.35;
  add('mug', mugObj);
  const trayObj = tray();
  trayObj.position.set(0.6, top, -0.22);
  add('tray', trayObj);
  const traySpot = new Group();
  traySpot.position.set(0.6, top + 0.01, -0.22);
  scene.add(traySpot);
  // A pad of sticky notes, the top sheet curling up.
  const stickies = new Group();
  for (let i = 0; i < 6; i++) stickies.add(box(0.076, 0.002, 0.076, i % 2 ? '#f3dc6e' : '#f7e27a', [0, 0.001 + i * 0.002, 0]));
  const curl = box(0.076, 0.0015, 0.03, '#f7e27a', [0, 0.014, 0.025]);
  curl.rotation.x = -0.35;
  stickies.add(curl);
  stickies.position.set(-0.55, top, -0.05);
  stickies.rotation.y = 0.2;
  scene.add(shadows(stickies));
  // A clean rectangle in the dust where the phone used to be.
  const dust = new Mesh(new PlaneGeometry(0.2, 0.14), mat('#b07a48', { roughness: 1 }));
  dust.rotation.x = -Math.PI / 2;
  dust.position.set(0.38, top + 0.002, -0.55);
  add('phone', dust);
  scene.add(emptySpot(0.3, 0.25, 0.2, [0.38, top + 0.125, -0.55]));
  const plant = moneyPlant();
  plant.position.set(0.62, top, -0.52);
  add('plant', plant);

  // Sam's chair, pushed out to the side as if someone just stood up.
  const chair = officeChair();
  chair.position.set(0.95, 0, 0.55);
  chair.rotation.y = -0.9;
  add('chair', chair);
  scene.add(mess(top, WALL_Z));
  // The lamp's flex, off the back of the desk to join the rest of the wiring behind it.
  lampObj.group.updateMatrixWorld(true);
  const lampFrom = lampObj.group.localToWorld(lampObj.cableFrom.clone());
  add(undefined, lead([[lampFrom.x, lampFrom.y, lampFrom.z], [lampFrom.x - 0.03, onDesk(top), -0.7], [-0.64, onDesk(top), -0.755], [-0.65, top - 0.04, -0.785], [-0.55, top - 0.2, -0.79]], '#1c1814'));
  // Under the desk: the power board everything plugs into, its switch glowing orange in the dark.
  const board = powerBoard();
  board.position.set(0.32, 0, -0.52);
  scene.add(board);
  const switchGlow = new PointLight('#ff7a2e', 0.04, 0.35, 2);
  switchGlow.position.set(0.195, 0.05, -0.49);
  scene.add(switchGlow);
  const cabinet = filingCabinet();
  cabinet.position.set(1.0, 0, -0.04);
  add(undefined, cabinet);
  // Sam's box of things, pushed up against the desk, with the bin balanced on top of it.
  const carton = cardboardBox();
  carton.position.set(-1.06, 0, -0.42);
  carton.rotation.y = 0.08;
  add(undefined, carton);
  const bin = wasteBin();
  bin.position.set(-1.06, 0.36, -0.44);
  add(undefined, bin);
  const tallPlant = snakePlant();
  tallPlant.position.set(1.45, 0, -0.62);
  add(undefined, tallPlant);


  return { scene, pickables, glass: set.glass, led: set.led, screenLight, traySpot, mouseButton: rodent.leftButton };
}

/** Every material inside something, so it can glow when you point at it. */
export function materialsOf(object: Object3D): MeshStandardMaterial[] {
  const found: MeshStandardMaterial[] = [];
  object.traverse((o) => {
    if (!(o instanceof Mesh)) return;
    // Give each clickable thing its own materials, so highlighting one doesn't light up another.
    const own = (Array.isArray(o.material) ? o.material : [o.material]).map((m: Material) => m.clone());
    o.material = own.length === 1 ? own[0] : own;
    // Parts that glow by themselves (a bulb, a power light) keep their own glow, not the highlight.
    for (const m of own) if (m instanceof MeshStandardMaterial && m.emissive.getHex() === 0) found.push(m);
  });
  return found;
}
