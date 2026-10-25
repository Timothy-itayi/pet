import { Box3, Color, Group, Mesh, MeshStandardMaterial, type Object3D } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

/**
 * The company phones: an iPhone 4S model (real size, in metres: 5.9 cm by 11.5 cm, its glass facing +z, its bottom
 * edge at y = 0). Loaded once, then copied for each phone in the drawer and for the one in your hand.
 */

let model: Promise<Object3D> | undefined;

export function phoneModel(): Promise<Object3D> {
  model ??= new GLTFLoader().loadAsync(`${import.meta.env.BASE_URL}models/iphone-4s.glb`).then((gltf) => {
    gltf.scene.traverse((o) => { if (o instanceof Mesh) { o.castShadow = true; o.receiveShadow = true; } });
    return gltf.scene;
  });
  return model;
}

/** The glass of a phone, from its own model: where the phone's screen page goes, as corners in the model's space. */
export function glassBox(phone: Object3D): Box3 {
  const glass = phone.getObjectByName('IP4S_Screen');
  return new Box3().setFromObject(glass ?? phone);
}

/**
 * A phone's glass: black while it's brand new and off, a dim lock screen once it's set up, and lit up when it's
 * buzzing with a push for you. So you can tell yours from the new ones at a glance.
 */
export function switchGlass(phone: Object3D, glow: number): void {
  const glass = phone.getObjectByName('IP4S_Screen');
  if (!(glass instanceof Mesh)) return;
  glass.material = new MeshStandardMaterial({ color: new Color('#050608'), roughness: 0.15, metalness: 0.2, emissive: new Color('#1b2a4a'), emissiveIntensity: [0, 0.6, 2.2][glow] ?? 0 });
}

/** What's in the drawer: before the budget, a takeaway menu and some rubber bands; after it, the box of phones. */
export function fillDrawer(inside: Object3D, phones: { id: string; copy: Object3D; glow: number }[], pickables: Map<string, Object3D>): void {
  for (const old of [...inside.children]) {
    inside.remove(old);
    for (const [id, o] of pickables) if (o === old) pickables.delete(id);
  }
  if (!phones.length) {
    const menu = new Mesh(new RoundedBoxGeometry(0.15, 0.002, 0.21, 2, 0.001), new MeshStandardMaterial({ color: new Color('#e8dcc0'), roughness: 0.9 }));
    menu.position.set(-0.05, 0.001, -0.17);
    menu.rotation.y = 0.2;
    const bands = new Mesh(new RoundedBoxGeometry(0.03, 0.006, 0.03, 2, 0.01), new MeshStandardMaterial({ color: new Color('#b0412b'), roughness: 0.7 }));
    bands.position.set(0.1, 0.003, -0.1);
    inside.add(menu, bands);
    return;
  }
  // The phones lie face up in the box's cardboard tray, two rows of three, tops away from you.
  const tray = new Mesh(new RoundedBoxGeometry(0.3, 0.012, 0.29, 2, 0.003), new MeshStandardMaterial({ color: new Color('#c9a878'), roughness: 0.95 }));
  tray.position.set(0, 0.006, -0.17);
  inside.add(tray);
  phones.forEach(({ id, copy, glow }, i) => {
    switchGlass(copy, glow);
    const holder = new Group();
    copy.rotation.x = -Math.PI / 2;
    holder.add(copy);
    holder.position.set(-0.085 + (i % 3) * 0.085, 0.017, -0.03 - Math.floor(i / 3) * 0.135);
    inside.add(holder);
    pickables.set(id, holder);
  });
}
