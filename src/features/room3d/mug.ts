import {
  CanvasTexture, CatmullRomCurve3, CircleGeometry, Color, CylinderGeometry, DoubleSide, Group, LatheGeometry, Mesh, MeshStandardMaterial,
  SRGBColorSpace, TubeGeometry, Vector2, Vector3, type Object3D,
} from 'three';

/**
 * Sam's mug: a cream stacking mug with a squared-off handle and WELL, SHIT. on the front in blackletter,
 * still half full of cold coffee. Handle on the left, words facing +z.
 */

const CREAM = '#efe5cf';

/** The mug's outline, bottom to rim and back down the inside: a narrow foot, a step, then the wide cup. */
const PROFILE: [number, number][] = [
  [0, 0], [0.031, 0], [0.0335, 0.002], [0.0345, 0.006], [0.0345, 0.026], [0.036, 0.029], [0.041, 0.031],
  [0.0425, 0.034], [0.0425, 0.084], [0.0418, 0.0866], [0.04, 0.0868], [0.0388, 0.085], [0.0388, 0.04], [0.033, 0.034], [0, 0.034],
];

function words(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#141210';
    ctx.textAlign = 'center';
    ctx.font = 'bold 92px "Old English Text MT", "UnifrakturCook", Luminari, "Blackadder ITC", Georgia, serif';
    ctx.fillText('WELL,', 256, 112);
    ctx.fillText('SHIT.', 256, 210);
  }
  const t = new CanvasTexture(canvas);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export function mug(): Object3D {
  const g = new Group();
  const glaze = new MeshStandardMaterial({ color: new Color(CREAM), roughness: 0.22, side: DoubleSide });
  const body = new Mesh(new LatheGeometry(PROFILE.map(([r, y]) => new Vector2(r, y)), 64), glaze);
  g.add(body);
  // The print, wrapped round the front of the cup.
  const print = new Mesh(new CylinderGeometry(0.0427, 0.0427, 0.042, 48, 1, true, -0.75, 1.5), new MeshStandardMaterial({
    map: words(), transparent: true, roughness: 0.3, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2,
  }));
  print.position.y = 0.061;
  g.add(print);
  // Cold coffee, a little way down.
  const coffee = new Mesh(new CircleGeometry(0.0386, 40), new MeshStandardMaterial({ color: new Color('#2b170c'), roughness: 0.08 }));
  coffee.rotation.x = -Math.PI / 2;
  coffee.position.y = 0.07;
  coffee.name = 'coffee';
  g.add(coffee);
  // A squared-off handle with rounded corners, on the left.
  const loop = new CatmullRomCurve3([
    [-0.041, 0.078], [-0.058, 0.079], [-0.066, 0.074], [-0.067, 0.05], [-0.062, 0.042], [-0.041, 0.041],
  ].map(([x, y]) => new Vector3(x, y, 0)), false, 'centripetal');
  const handle = new Mesh(new TubeGeometry(loop, 40, 0.0065, 12, false), glaze);
  handle.scale.z = 1.25;
  g.add(handle);
  g.traverse((o) => { o.castShadow = true; o.receiveShadow = true; });
  print.castShadow = false;
  return g;
}

/** How full the mug is, from 1 (as Sam left it) to 0 (empty): the coffee's surface sinks towards the bottom. */
export function setCoffee(mugObject: Object3D, level: number): void {
  const coffee = mugObject.getObjectByName('coffee');
  if (!coffee) return;
  coffee.visible = level > 0;
  coffee.position.y = 0.042 + 0.028 * level;
}
