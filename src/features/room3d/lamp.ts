import {
  BackSide, BoxGeometry, CanvasTexture, Color, ConeGeometry, CylinderGeometry, Group, Mesh, MeshStandardMaterial, PointLight, Quaternion,
  SphereGeometry, SpotLight, SRGBColorSpace, Vector3,
} from 'three';

/**
 * Sam's desk lamp: an old brass one with a jointed arm and a cone shade with a few holes punched in it.
 * It's the room's main light, so its lights live here, coming out of the bulb.
 * Built facing +z; turn the group to aim it.
 */

const BRASS = '#a88a4f';
const brass = (roughness = 0.45) => new MeshStandardMaterial({ color: new Color(BRASS), metalness: 0.35, roughness });

/** A brass rod from a to b. */
function rod(a: Vector3, b: Vector3, r: number): Mesh {
  const length = a.distanceTo(b);
  const m = new Mesh(new CylinderGeometry(r, r, length, 12), brass(0.4));
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), b.clone().sub(a).normalize());
  return m;
}

const knuckle = (at: Vector3, r: number) => {
  const m = new Mesh(new SphereGeometry(r, 16, 12), brass(0.35));
  m.position.copy(at);
  return m;
};

/** The shade's outside: tarnished brass, with a ring of punched holes that the bulb shines through. */
function shadeTexture(): { map: CanvasTexture; glow: CanvasTexture } {
  const paint = (holesOnly: boolean) => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = holesOnly ? '#000' : BRASS;
      ctx.fillRect(0, 0, 256, 128);
      if (!holesOnly) {
        // Tarnish and fingerprints.
        for (let i = 0; i < 140; i++) {
          ctx.fillStyle = `rgba(${i % 3 ? '60, 45, 20' : '230, 200, 140'}, ${0.05 + (i % 5) * 0.02})`;
          ctx.beginPath();
          ctx.arc((i * 67) % 256, (i * 29) % 128, 2 + (i % 7), 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.fillStyle = holesOnly ? '#fff' : '#1a1206';
      for (let i = 0; i < 18; i++) {
        ctx.beginPath();
        ctx.arc(7 + i * 14, 34 + (i % 2) * 9, 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    const t = new CanvasTexture(canvas);
    t.colorSpace = SRGBColorSpace;
    return t;
  };
  return { map: paint(false), glow: paint(true) };
}

export interface DeskLamp {
  group: Group;
  /** Where its cable leaves the base, in the group's own space. */
  cableFrom: Vector3;
}

export function deskLamp(): DeskLamp {
  const g = new Group();
  // A heavy stepped base.
  const base = new Mesh(new CylinderGeometry(0.068, 0.078, 0.016, 32), brass(0.5));
  base.position.y = 0.008;
  const step = new Mesh(new CylinderGeometry(0.044, 0.058, 0.02, 32), brass(0.45));
  step.position.y = 0.026;
  const collar = new Mesh(new CylinderGeometry(0.014, 0.018, 0.03, 16), brass(0.4));
  collar.position.y = 0.05;
  g.add(base, step, collar);

  // Two arms with knuckles: the lower one leaning back, the upper one reaching forward over the desk.
  const hip = new Vector3(0, 0.068, 0);
  const elbow = new Vector3(0, 0.068 + 0.24 * Math.cos(0.3), -0.24 * Math.sin(0.3));
  const wrist = elbow.clone().add(new Vector3(0, 0.2 * Math.cos(1.05), 0.2 * Math.sin(1.05)));
  g.add(knuckle(hip, 0.015), rod(hip, elbow, 0.007), knuckle(elbow, 0.013), rod(elbow, wrist, 0.007), knuckle(wrist, 0.013));
  const wingNut = new Mesh(new BoxGeometry(0.004, 0.014, 0.022), brass(0.4));
  wingNut.position.copy(elbow).add(new Vector3(0.016, 0, 0));
  g.add(wingNut);

  // The cone shade, pointing down and forward, open end towards the desk.
  const aim = new Vector3(0, -1, 0.7).normalize();
  const depth = 0.12;
  const { map, glow } = shadeTexture();
  const outside = new Mesh(new ConeGeometry(0.072, depth, 40, 1, true), new MeshStandardMaterial({
    map, metalness: 0.35, roughness: 0.45, emissive: new Color('#ffcf8a'), emissiveMap: glow, emissiveIntensity: 2,
  }));
  // Lit from inside: warm and bright.
  const inside = new Mesh(new ConeGeometry(0.07, depth * 0.98, 40, 1, true), new MeshStandardMaterial({
    color: new Color('#f3e2bd'), emissive: new Color('#ffd79a'), emissiveIntensity: 0.7, side: BackSide,
  }));
  const shade = new Group();
  shade.add(outside, inside);
  // A cone's point is up (+y); turn it so the point is at the wrist and the opening faces `aim`.
  shade.quaternion.copy(new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), aim.clone().negate()));
  shade.position.copy(wrist).addScaledVector(aim, depth / 2 + 0.004);
  g.add(shade);

  const bulbAt = wrist.clone().addScaledVector(aim, depth * 0.72);
  const bulb = new Mesh(new SphereGeometry(0.024, 20, 14), new MeshStandardMaterial({
    color: new Color('#fff4dc'), emissive: new Color('#ffe2b0'), emissiveIntensity: 3,
  }));
  bulb.position.copy(bulbAt);
  g.add(bulb);

  g.traverse((o) => { o.castShadow = true; o.receiveShadow = true; });
  // The shade and bulb are where the light comes from; they mustn't shadow their own light.
  shade.traverse((o) => { o.castShadow = false; });
  bulb.castShadow = false;

  // The pool of light on the desk, shaped by the shade.
  const spot = new SpotLight('#ffc77a', 7, 3, Math.PI / 4.2, 0.7, 1.6);
  spot.position.copy(bulbAt);
  spot.target.position.copy(bulbAt).addScaledVector(aim, 1);
  spot.castShadow = true;
  spot.shadow.mapSize.set(2048, 2048);
  spot.shadow.camera.near = 0.03;
  spot.shadow.bias = -0.0003;
  spot.shadow.normalBias = 0.01;
  // The warm light bouncing back up off the pool on the desk, onto the pegboard and the shade's underside.
  const bounce = new PointLight('#ffb866', 0.3, 1.0, 1.8);
  bounce.position.copy(bulbAt).add(new Vector3(0, -0.12, 0.05));
  g.add(spot, spot.target, bounce);

  return { group: g, cableFrom: new Vector3(0, 0.008, -0.07) };
}
