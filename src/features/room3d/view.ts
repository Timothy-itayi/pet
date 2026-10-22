import {
  ACESFilmicToneMapping, AmbientLight, Box3, DirectionalLight, DoubleSide, Group, Mesh, PCFSoftShadowMap, PerspectiveCamera, Quaternion,
  Raycaster, Scene, SRGBColorSpace, Vector2, Vector3, WebGLRenderer, type Material, type MeshStandardMaterial, type Object3D,
} from 'three';
import { CSS3DObject, CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import { COMPUTER_Z, DESK_TOP, GLASS, buildRoom, materialsOf, toolObject, type Room } from './room.ts';
import { cameraAt, type Pose } from './camera.ts';
import { setLampOn } from './lamp.ts';
import { setCoffee } from './mug.ts';

export type Shot = 'overview' | 'wall' | 'computer';
/** What the CRT shows. */
export type ScreenState = 'off' | 'asleep' | 'on';

/** Centre of the monitor's glass (see computerSet in room.ts). */
const SCREEN_Y = DESK_TOP + 0.29;
const SCREEN_Z = -0.225 + COMPUTER_Z;
/** The screen page is laid out at this size, then shrunk onto the glass. */
export const SCREEN_PX = { w: 1024, h: 768 } as const;
/** Where the camera sits for each view: [position, point it looks at]. */
const SHOTS: Record<Shot, Pose> = {
  // Looking straight at the monitor, so sitting down is one simple push in.
  overview: { pos: [0, 1.5, 1.95], look: [0, SCREEN_Y, SCREEN_Z] },
  wall: { pos: [0, 1.48, 0.5], look: [0, 1.16, -0.82] },
  // Close enough that the glass fills the view, with a little bezel showing round the edge.
  computer: { pos: [0, SCREEN_Y, SCREEN_Z + 0.36], look: [0, SCREEN_Y, SCREEN_Z] },
};
const MOVE_MS = 1500;
/** How far the camera drifts as you move the mouse, so the room never feels like a still picture. */
const DRIFT = { overview: 0.035, wall: 0.015, computer: 0 } as const;

interface Handlers { pick: (id: string) => void; hover: (id: string | undefined) => void }

const v = {
  renderer: undefined as WebGLRenderer | undefined,
  camera: new PerspectiveCamera(40, 1, 0.05, 30),
  room: undefined as Room | undefined,
  shot: 'overview' as Shot,
  from: SHOTS.overview,
  to: SHOTS.overview,
  started: 0,
  pointer: new Vector2(),
  drift: new Vector2(),
  hovered: undefined as string | undefined,
  glow: new Map<string, MeshStandardMaterial[]>(),
  handlers: undefined as Handlers | undefined,
  tools: [] as string[],
  inspect: undefined as { renderer: WebGLRenderer; scene: Scene; camera: PerspectiveCamera; item: Group; aim: Quaternion; born: number } | undefined,
  reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
  css: undefined as CSS3DRenderer | undefined,
  cssScene: new Scene(),
  /** The page that is the computer's screen. The game draws its screens into this. */
  screen: document.createElement('div'),
};

const raycaster = new Raycaster();

/** Which clickable thing an object belongs to. */
function idOf(object: Object3D | null): string | undefined {
  for (let o: Object3D | null = object; o; o = o.parent) {
    for (const [id, root] of v.room?.pickables ?? []) if (root === o) return id;
  }
  return undefined;
}

function pickAt(x: number, y: number): string | undefined {
  if (!v.room || v.inspect || moving()) return undefined;
  raycaster.setFromCamera(new Vector2(x, y), v.camera);
  // The first solid thing under the pointer decides, so the desk blocks the wall behind it.
  const hit = raycaster.intersectObject(v.room.scene, true).find((h) => h.object instanceof Mesh);
  return idOf(hit?.object ?? null);
}

const moving = () => performance.now() - v.started < (v.reduced ? 0 : MOVE_MS);

function setHover(id: string | undefined): void {
  if (id === v.hovered) return;
  for (const m of v.glow.get(v.hovered ?? '') ?? []) m.emissiveIntensity = 0;
  v.hovered = id;
  for (const m of v.glow.get(id ?? '') ?? []) { m.emissive.set('#ffffff'); m.emissiveIntensity = 0.1; }
  if (v.renderer) v.renderer.domElement.style.cursor = id ? 'pointer' : '';
  v.handlers?.hover(id);
}

function resize(): void {
  const r = v.renderer;
  if (!r) return;
  r.setSize(innerWidth, innerHeight);
  v.css?.setSize(innerWidth, innerHeight);
  v.camera.aspect = innerWidth / innerHeight;
  v.camera.updateProjectionMatrix();
  if (v.inspect) {
    v.inspect.renderer.setSize(innerWidth, innerHeight);
    v.inspect.camera.aspect = innerWidth / innerHeight;
    v.inspect.camera.updateProjectionMatrix();
  }
}

/** Small one-off movements in the room (a chair turning, leaves swaying), each given how far through it is, 0 to 1. */
const moves = new Set<{ start: number; ms: number; step: (k: number) => void }>();

function play(ms: number, step: (k: number) => void): void {
  if (v.reduced) { step(1); return; }
  moves.add({ start: performance.now(), ms, step });
}

function frame(): void {
  requestAnimationFrame(frame);
  const r = v.renderer;
  if (!r || !v.room || r.domElement.hidden) return;
  const now = performance.now();
  for (const m of moves) {
    const k = Math.min(1, (now - m.start) / m.ms);
    m.step(k);
    if (k === 1) moves.delete(m);
  }
  // Ease the drift towards the pointer, then place the camera along its current move.
  v.drift.lerp(v.pointer, 0.05);
  const t = v.reduced ? 1 : Math.min(1, (performance.now() - v.started) / MOVE_MS);
  const pose = cameraAt(v.from, v.to, t, [v.drift.x * DRIFT[v.shot], v.drift.y * DRIFT[v.shot] * 0.5]);
  v.camera.position.set(...pose.pos);
  v.camera.lookAt(...pose.look);
  r.render(v.room.scene, v.camera);
  v.css?.render(v.cssScene, v.camera);
  const ins = v.inspect;
  if (ins) {
    // It only turns when you turn it, and eases towards where you've turned it.
    ins.item.quaternion.slerp(ins.aim, 0.2);
    const grow = v.reduced ? 1 : Math.min(1, (performance.now() - ins.born) / 450);
    ins.item.scale.setScalar(1 - (1 - grow) ** 3);
    ins.renderer.render(ins.scene, ins.camera);
  }
}

/** Create the 3D room behind the page. Safe to call more than once. */
export async function mountRoom(handlers: Handlers): Promise<void> {
  v.handlers = handlers;
  if (v.renderer) return;
  // See-through where the glass is, so the screen page behind the picture shows through.
  const renderer = new WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;
  renderer.domElement.className = 'room-canvas';
  renderer.domElement.setAttribute('aria-hidden', 'true');
  document.body.prepend(renderer.domElement);
  v.renderer = renderer;
  const css = new CSS3DRenderer();
  css.domElement.className = 'screen-layer';
  document.body.prepend(css.domElement);
  v.css = css;
  v.room = await buildRoom();
  // Put the screen page exactly where the glass is, scaled from pixels to metres.
  v.screen.className = 'crt-screen';
  v.screen.style.width = `${SCREEN_PX.w}px`;
  v.screen.style.height = `${SCREEN_PX.h}px`;
  const onGlass = new CSS3DObject(v.screen);
  v.room.glass.updateWorldMatrix(true, false);
  v.room.glass.getWorldPosition(onGlass.position);
  onGlass.scale.setScalar(GLASS.w / SCREEN_PX.w);
  v.cssScene.add(onGlass);
  for (const [id, object] of v.room.pickables) if (id !== 'wall') v.glow.set(id, materialsOf(object));
  setTools(v.tools);
  resize();
  addEventListener('resize', resize);
  renderer.domElement.addEventListener('pointermove', (e) => {
    v.pointer.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    setHover(pickAt(v.pointer.x, v.pointer.y));
  });
  renderer.domElement.addEventListener('click', (e) => {
    const id = pickAt((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    if (id) v.handlers?.pick(id);
  });
  requestAnimationFrame(frame);
}

export const roomReady = () => Boolean(v.room);

export function showRoom(on: boolean): void {
  if (v.renderer) v.renderer.domElement.hidden = !on;
}

/** Glide the camera to a view. Resolves when it arrives. */
export function goTo(shot: Shot): Promise<void> {
  if (shot === v.shot) return Promise.resolve();
  const now = performance.now();
  const t = v.reduced ? 1 : Math.min(1, (now - v.started) / MOVE_MS);
  v.from = cameraAt(v.from, v.to, t, [0, 0]);
  v.to = SHOTS[shot];
  v.shot = shot;
  v.started = now;
  setHover(undefined);
  return new Promise((done) => setTimeout(done, v.reduced ? 0 : MOVE_MS));
}

/** Jump straight to a view, no glide (on page load). */
export function snapTo(shot: Shot): void {
  v.from = v.to = SHOTS[shot];
  v.shot = shot;
  v.started = 0;
}

/** The page that is the computer's screen. */
export const screenElement = () => v.screen;

/** At the computer, clicks go to the screen; in the room, they go to the 3D things. */
export function setAtComputer(on: boolean): void {
  if (v.renderer) v.renderer.domElement.style.pointerEvents = on ? 'none' : '';
  v.screen.inert = !on;
}

/** The case light and the glow off the glass. */
export function setScreen(state: ScreenState): void {
  const room = v.room;
  if (!room) return;
  room.led.emissiveIntensity = state === 'off' ? 0 : state === 'asleep' ? 0.4 : 1.4;
  room.screenLight.intensity = state === 'off' ? 0 : state === 'asleep' ? 0.03 : 0.18;
}

/** Click the mouse's left button: down, and back up a moment later. */
export function pressMouse(): void {
  const button = v.room?.mouseButton;
  if (!button) return;
  button.position.y = -0.0012;
  setTimeout(() => { button.position.y = 0; }, 140);
}

/** Give Sam's chair a push: the seat swings round a bit, overshoots, and settles. */
export function spinChair(): void {
  const swivel = v.room?.pickables.get('chair')?.getObjectByName('swivel');
  if (!swivel) return;
  const from = swivel.rotation.y;
  const by = (Math.random() < 0.5 ? -1 : 1) * (0.5 + Math.random() * 0.5);
  // Out a little past where it ends up, then back: the overshoot of a real swivel chair.
  const overshoot = (k: number) => 1 + 2.7 * (k - 1) ** 3 + 1.7 * (k - 1) ** 2;
  play(1200, (k) => { swivel.rotation.y = from + by * overshoot(k); });
}

/** Brush the plant: it sways and settles, and each leaf bobs a little on its own. */
export function swayPlant(): void {
  const foliage = v.room?.pickables.get('plant')?.getObjectByName('foliage');
  if (!foliage) return;
  const leaves = foliage.children.filter((o) => o.name === 'leaf');
  play(2600, (k) => {
    const t = k * 2.6;
    const fade = Math.exp(-t * 1.5) * (1 - k);
    foliage.rotation.z = 0.07 * fade * Math.sin(t * 8);
    foliage.rotation.x = 0.04 * fade * Math.sin(t * 6 + 1);
    leaves.forEach((leaf, i) => { leaf.rotation.x = Number(leaf.userData.rest) + 0.18 * fade * Math.sin(t * 11 + i); });
  });
}

/** Pick the mug up for a sip and put it back down. */
export function sipMug(): void {
  const cup = v.room?.pickables.get('mug');
  if (!cup) return;
  const rest = (cup.userData.rest ??= { y: cup.position.y, x: cup.rotation.x }) as { y: number; x: number };
  play(1100, (k) => {
    const s = Math.sin(k * Math.PI);
    cup.position.y = rest.y + 0.07 * s;
    cup.rotation.x = rest.x + 0.5 * s * s;
  });
}

/** The desk lamp, on or off. */
export function setLamp(on: boolean): void {
  const lamp = v.room?.pickables.get('lamp');
  if (lamp) setLampOn(lamp, on);
}

/** How much coffee is left in the mug, 0 to 1. */
export function setMug(level: number): void {
  const cup = v.room?.pickables.get('mug');
  if (cup) setCoffee(cup, level);
}

/** Put loot in the ticket tray. */
export function setTools(ids: string[]): void {
  v.tools = ids;
  const spot = v.room?.traySpot;
  if (!spot) return;
  spot.clear();
  ids.forEach((id, i) => {
    const object = toolObject(id);
    object.position.z = (i - (ids.length - 1) / 2) * 0.08;
    spot.add(object);
  });
  if (ids.length) v.room?.pickables.set('tool', spot);
}

/** Lift an item towards you, Last of Us style: the room blurs behind it, and you can drag to turn it. */
export function inspectItem(id: string): void {
  const source = v.room?.pickables.get(id);
  if (!source || v.inspect) return;
  const renderer = new WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.domElement.className = 'inspect-canvas';
  renderer.domElement.setAttribute('aria-hidden', 'true');
  document.body.append(renderer.domElement);
  const scene = new Scene();
  scene.add(new AmbientLight('#ffffff', 0.9));
  const key = new DirectionalLight('#ffe2b0', 2.2);
  key.position.set(1, 2, 2);
  scene.add(key);
  const copy = source.clone(true);
  copy.position.set(0, 0, 0);
  copy.rotation.set(0, 0, 0);
  // Show both sides of everything, so paper and thin things don't vanish when you turn them round.
  copy.traverse((o) => {
    if (!(o instanceof Mesh)) return;
    const own = (Array.isArray(o.material) ? o.material : [o.material]).map((m: Material) => { const c = m.clone(); c.side = DoubleSide; return c; });
    o.material = own.length === 1 ? own[0] : own;
  });
  // Flat things, like a book lying on the desk, are held up to face you rather than shown edge-on.
  const lying = new Box3().setFromObject(copy).getSize(new Vector3());
  if (lying.y < 0.3 * Math.min(lying.x, lying.z)) copy.rotation.x = Math.PI / 2;
  // Centre it and scale it to fill the view, whatever its real size.
  const box = new Box3().setFromObject(copy);
  const size = box.getSize(new Vector3()).length() || 1;
  const centre = box.getCenter(new Vector3());
  copy.position.sub(centre);
  const item = new Group();
  const fit = new Group();
  fit.scale.setScalar(0.9 / size);
  fit.add(copy);
  item.add(fit);
  scene.add(item);
  const camera = new PerspectiveCamera(35, innerWidth / innerHeight, 0.01, 10);
  camera.position.set(0.25, 0, 1.6); // sits a little right, leaving room for the words on the left
  camera.lookAt(0.25, 0, 0);
  item.position.x = 0.45;
  const aim = new Quaternion();
  item.quaternion.copy(aim);
  v.inspect = { renderer, scene, camera, item, aim, born: performance.now() };
  resize();
  v.renderer?.domElement.classList.add('blurred');
  setHover(undefined);
  let last: Vector2 | undefined;
  renderer.domElement.addEventListener('pointerdown', (e) => { last = new Vector2(e.clientX, e.clientY); renderer.domElement.setPointerCapture(e.pointerId); });
  renderer.domElement.addEventListener('pointermove', (e) => {
    if (!last) return;
    turnInspected((e.clientX - last.x) * 0.012, (e.clientY - last.y) * 0.012);
    last.set(e.clientX, e.clientY);
  });
  renderer.domElement.addEventListener('pointerup', () => { last = undefined; });
}

export const isInspecting = () => Boolean(v.inspect);

export function closeInspect(): void {
  const ins = v.inspect;
  if (!ins) return;
  ins.renderer.domElement.remove();
  ins.renderer.dispose();
  v.inspect = undefined;
  v.renderer?.domElement.classList.remove('blurred');
}

const UP = new Vector3(0, 1, 0);
const RIGHT = new Vector3(1, 0, 0);

/**
 * Turn the item you're holding, all the way round in any direction: sideways spins it about the up axis,
 * up and down tips it towards or away from you. Turns are about the screen's axes, so it never locks up.
 */
export function turnInspected(dx: number, dy: number): void {
  if (!v.inspect) return;
  const turn = new Quaternion().setFromAxisAngle(UP, dx).multiply(new Quaternion().setFromAxisAngle(RIGHT, dy));
  v.inspect.aim.premultiply(turn).normalize();
}
