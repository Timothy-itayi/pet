import {
  CanvasTexture, CatmullRomCurve3, CircleGeometry, Color, CylinderGeometry, DoubleSide, Group, Mesh, MeshStandardMaterial, SRGBColorSpace,
  TorusGeometry, TubeGeometry, Vector3, type Object3D,
} from 'three';

/** Sam's desk plant: a Chinese money plant, all round coin leaves on thin stems, in a weathered terracotta pot. */

function seeded(seed: number): () => number {
  let x = seed;
  return () => { x = (x * 16807) % 2147483647; return (x - 1) / 2147483646; };
}

function painted(w: number, h: number, paint: (ctx: CanvasRenderingContext2D) => void): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx) paint(ctx);
  const t = new CanvasTexture(canvas);
  t.colorSpace = SRGBColorSpace;
  return t;
}

/** Terracotta, with white mineral bloom and a darker band where it's been overwatered. */
function potTexture(): CanvasTexture {
  const rand = seeded(11);
  return painted(256, 128, (ctx) => {
    ctx.fillStyle = '#b8653c';
    ctx.fillRect(0, 0, 256, 128);
    const damp = ctx.createLinearGradient(0, 70, 0, 128);
    damp.addColorStop(0, 'rgba(70, 30, 15, 0)');
    damp.addColorStop(1, 'rgba(70, 30, 15, 0.45)');
    ctx.fillStyle = damp;
    ctx.fillRect(0, 0, 256, 128);
    for (let i = 0; i < 26; i++) {
      ctx.fillStyle = `rgba(235, 225, 205, ${0.08 + rand() * 0.18})`;
      ctx.beginPath();
      ctx.ellipse(rand() * 256, 20 + rand() * 90, 4 + rand() * 18, 2 + rand() * 7, rand(), 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

/** A round leaf, paler in the middle where the stem joins, with fine veins running out. */
function leafTexture(): CanvasTexture {
  return painted(64, 64, (ctx) => {
    const g = ctx.createRadialGradient(32, 32, 2, 32, 32, 32);
    g.addColorStop(0, '#9cc77a');
    g.addColorStop(0.25, '#5f9a45');
    g.addColorStop(1, '#3f7a30');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    ctx.strokeStyle = 'rgba(170, 210, 140, 0.45)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      ctx.beginPath(); ctx.moveTo(32, 32); ctx.lineTo(32 + Math.cos(a) * 28, 32 + Math.sin(a) * 28); ctx.stroke();
    }
  });
}

export function moneyPlant(): Object3D {
  const g = new Group();
  const rand = seeded(5);
  const potH = 0.09;
  const pot = new Mesh(new CylinderGeometry(0.058, 0.044, potH, 28, 1, true), new MeshStandardMaterial({ map: potTexture(), roughness: 0.95, side: DoubleSide }));
  pot.position.y = potH / 2;
  const rim = new Mesh(new TorusGeometry(0.059, 0.006, 8, 32), new MeshStandardMaterial({ color: new Color('#c4724a'), roughness: 0.9 }));
  rim.rotation.x = Math.PI / 2;
  rim.position.y = potH;
  const bottom = new Mesh(new CircleGeometry(0.044, 24), new MeshStandardMaterial({ color: new Color('#8f4a2b') }));
  bottom.rotation.x = -Math.PI / 2;
  bottom.position.y = 0.001;
  const soil = new Mesh(new CircleGeometry(0.055, 24), new MeshStandardMaterial({ color: new Color('#2a1c12'), roughness: 1 }));
  soil.rotation.x = -Math.PI / 2;
  soil.position.y = potH - 0.012;
  g.add(pot, rim, bottom, soil);

  // Stems arch up and out from the middle, each ending in a coin leaf held flat to the light.
  const leafMat = new MeshStandardMaterial({ map: leafTexture(), roughness: 0.6, side: DoubleSide });
  const stemMat = new MeshStandardMaterial({ color: new Color('#6f9a4a'), roughness: 0.7 });
  const base = new Vector3(0, potH - 0.012, 0);
  // Stems and leaves in one group, so the whole plant can sway when you touch it.
  const foliage = new Group();
  foliage.name = 'foliage';
  g.add(foliage);
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + rand() * 0.4;
    const reach = 0.05 + rand() * 0.09;
    const rise = 0.07 + rand() * 0.12;
    const tip = new Vector3(Math.cos(a) * reach, potH + rise, Math.sin(a) * reach);
    const mid = new Vector3(Math.cos(a) * reach * 0.35, potH + rise * 0.8, Math.sin(a) * reach * 0.35);
    foliage.add(new Mesh(new TubeGeometry(new CatmullRomCurve3([base, mid, tip]), 24, 0.0018, 8, false), stemMat));
    const leaf = new Mesh(new CircleGeometry(0.018 + rand() * 0.016, 20), leafMat);
    leaf.position.copy(tip);
    // Face mostly up, tipped outward a little, like it's reaching for the lamp.
    leaf.rotation.set(-Math.PI / 2 + Math.sin(a) * 0.5, Math.cos(a) * 0.5, rand() * Math.PI);
    leaf.name = 'leaf';
    leaf.userData.rest = leaf.rotation.x;
    foliage.add(leaf);
  }
  g.traverse((o) => { o.castShadow = true; o.receiveShadow = true; });
  return g;
}
