import {
  BoxGeometry, CanvasTexture, CatmullRomCurve3, Color, CylinderGeometry, Group, Mesh, MeshStandardMaterial,
  PlaneGeometry, SRGBColorSpace, TubeGeometry, Vector3, type Object3D,
} from 'three';

/**
 * Six years of Sam: the wear and clutter that make the desk feel lived in.
 * Nothing here is clickable; it's just character.
 */

/** A seeded random, so the mess is the same every time you load the game. */
function seeded(seed: number): () => number {
  let x = seed;
  return () => { x = (x * 16807) % 2147483647; return (x - 1) / 2147483646; };
}

function texture(w: number, h: number, paint: (ctx: CanvasRenderingContext2D) => void): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx) paint(ctx);
  const t = new CanvasTexture(canvas);
  t.colorSpace = SRGBColorSpace;
  return t;
}

const solid = (color: string, roughness = 0.85) => new MeshStandardMaterial({ color: new Color(color), roughness });

function cast(m: Mesh): Mesh {
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/** Wear on the desktop itself: coffee rings, a spill, scratches, a pen mark. Drawn once, laid flat on the wood. */
function deskWear(width: number, depth: number): Mesh {
  const rand = seeded(7);
  const map = texture(1024, 540, (ctx) => {
    // Wood grain: long, faint, wavy lines along the desk.
    for (let i = 0; i < 70; i++) {
      const y = rand() * 540;
      ctx.strokeStyle = `rgba(${rand() < 0.5 ? '70, 40, 18' : '200, 150, 100'}, ${0.04 + rand() * 0.06})`;
      ctx.lineWidth = 1 + rand() * 3;
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x <= 1024; x += 64) ctx.lineTo(x, y + Math.sin(x / 140 + i) * 6);
      ctx.stroke();
    }
    // Coffee rings, mostly where a right-handed person puts a mug down.
    for (const [x, y, r] of [[790, 250, 38], [835, 300, 36], [760, 330, 40], [420, 440, 34], [880, 120, 37]] as const) {
      ctx.strokeStyle = `rgba(70, 40, 18, ${0.25 + rand() * 0.2})`;
      ctx.lineWidth = 3 + rand() * 3;
      ctx.beginPath();
      ctx.arc(x, y, r, rand() * 0.8, Math.PI * 2 - rand() * 0.6);
      ctx.stroke();
    }
    // An old spill that was never quite cleaned up.
    ctx.fillStyle = 'rgba(60, 34, 14, 0.22)';
    ctx.beginPath();
    ctx.ellipse(170, 420, 70, 34, 0.3, 0, Math.PI * 2);
    ctx.ellipse(230, 450, 40, 20, -0.2, 0, Math.PI * 2);
    ctx.fill();
    // Scratches and scuffs along the front edge, where wrists and elbows go.
    for (let i = 0; i < 60; i++) {
      const x = rand() * 1024;
      const y = 380 + rand() * 160;
      ctx.strokeStyle = `rgba(40, 24, 10, ${0.08 + rand() * 0.15})`;
      ctx.lineWidth = 1 + rand();
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (rand() - 0.5) * 70, y + (rand() - 0.5) * 12);
      ctx.stroke();
    }
    // A pen line that went off the edge of a page.
    ctx.strokeStyle = 'rgba(30, 50, 120, 0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(300, 360);
    ctx.bezierCurveTo(330, 350, 360, 375, 400, 362);
    ctx.stroke();
  });
  const wear = new Mesh(new PlaneGeometry(width, depth), new MeshStandardMaterial({ map, transparent: true, roughness: 0.9, depthWrite: false }));
  wear.rotation.x = -Math.PI / 2;
  wear.receiveShadow = true;
  return wear;
}

function paper(w: number, d: number, color = '#f1ece0'): Mesh {
  return cast(new Mesh(new BoxGeometry(w, 0.002, d), solid(color, 1)));
}

function pen(length: number, color: string): Group {
  const g = new Group();
  const body = cast(new Mesh(new CylinderGeometry(0.004, 0.004, length, 24), solid(color, 0.5)));
  const cap = cast(new Mesh(new CylinderGeometry(0.0045, 0.0045, length * 0.25, 24), solid('#1f1712', 0.5)));
  cap.position.y = length * 0.4;
  // The clip on the cap, and the writing tip.
  const clip = cast(new Mesh(new BoxGeometry(0.0015, length * 0.2, 0.003), solid('#b9bcc2', 0.3)));
  clip.position.set(0.005, length * 0.4, 0);
  const tip = cast(new Mesh(new CylinderGeometry(0.0008, 0.004, 0.012, 24), solid('#c9ccd1', 0.3)));
  tip.position.y = -length / 2 - 0.006;
  g.add(body, cap, clip, tip);
  g.rotation.z = Math.PI / 2;
  return g;
}

/** A tangle of cable from one point to another, sagging along the way. */
function cable(points: [number, number, number][], radius = 0.006, color = '#14100c'): Mesh {
  const curve = new CatmullRomCurve3(points.map((p) => new Vector3(...p)));
  return cast(new Mesh(new TubeGeometry(curve, 144, radius, 16, false), solid(color, 0.6)));
}

function takeawayMenu(): Mesh {
  const map = texture(128, 180, (ctx) => {
    ctx.fillStyle = '#c8453b';
    ctx.fillRect(0, 0, 128, 180);
    ctx.fillStyle = '#f7e27a';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('WOK', 10, 36);
    ctx.fillText('N ROLL', 10, 62);
    ctx.fillStyle = '#f4efe2';
    for (let y = 80; y < 170; y += 12) ctx.fillRect(10, y, 70 + ((y * 13) % 40), 4);
  });
  const menu = cast(new Mesh(new BoxGeometry(0.1, 0.002, 0.14), [solid('#c8453b'), solid('#c8453b'), new MeshStandardMaterial({ map, roughness: 1 }), solid('#c8453b'), solid('#c8453b'), solid('#c8453b')]));
  return menu;
}

function poster(): Mesh {
  const map = texture(160, 220, (ctx) => {
    ctx.fillStyle = '#e9e1c8';
    ctx.fillRect(0, 0, 160, 220);
    ctx.fillStyle = '#2f4c7c';
    ctx.fillRect(0, 0, 160, 54);
    ctx.fillStyle = '#f4efe2';
    ctx.font = 'bold 17px sans-serif';
    ctx.fillText('SECURITY IS', 14, 24);
    ctx.fillText('EVERYONE’S JOB', 8, 44);
    ctx.fillStyle = '#3b2f2a';
    ctx.font = '13px sans-serif';
    for (const [i, line] of ['Lock your screen.', 'Never share passwords.', 'Report odd emails.'].entries()) ctx.fillText(line, 12, 90 + i * 26);
    // Faded by six years of lamp light, and someone drew a moustache on the logo.
    ctx.fillStyle = 'rgba(255, 240, 200, 0.25)';
    ctx.fillRect(0, 0, 160, 220);
    ctx.strokeStyle = '#1f1712';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(80, 182, 10, 0.2, Math.PI - 0.2);
    ctx.stroke();
  });
  const card = solid('#e0d8bf', 1);
  const m = new Mesh(new BoxGeometry(0.24, 0.33, 0.002), [card, card, card, card, new MeshStandardMaterial({ map, roughness: 1 }), card]);
  m.rotation.z = -0.04; // never hung straight
  return m;
}

/** Everything messy, positioned around a desk whose top is at `top`, front edge at z = 0, wall at `wallZ`. */
export function mess(top: number, wallZ: number): Object3D {
  const g = new Group();
  const wear = deskWear(1.46, 0.76);
  wear.position.set(-0.01, top + 0.001, -0.38);
  g.add(wear);

  // Papers: a pile by the lamp. Everything Sam screwed up is in the bin.
  const pile = new Group();
  for (const [i, turn] of [0.1, -0.15, 0.35, -0.05].entries()) {
    const sheet = paper(0.21, 0.29, i === 2 ? '#f7e27a' : '#f1ece0');
    sheet.position.y = i * 0.003;
    sheet.rotation.y = turn;
    pile.add(sheet);
  }
  pile.position.set(-0.62, top + 0.002, -0.14);
  g.add(pile);

  // Pens that don't work, a chewed pencil, crumbs.
  const pen1 = pen(0.14, '#2f4c7c');
  pen1.position.set(0.12, top + 0.005, 0.02);
  pen1.rotation.y = 0.3;
  const pen2 = pen(0.13, '#c8453b');
  pen2.position.set(-0.5, top + 0.014, -0.12);
  pen2.rotation.y = -1.1;
  const pencil = pen(0.16, '#e0b84a');
  pencil.position.set(0.47, top + 0.005, -0.52);
  pencil.rotation.y = 1.4;
  g.add(pen1, pen2, pencil);
  const rand = seeded(3);
  for (let i = 0; i < 18; i++) {
    const crumb = new Mesh(new BoxGeometry(0.003, 0.002, 0.003), solid('#7a5a34'));
    crumb.position.set(0.32 + rand() * 0.16, top + 0.0015, -0.3 + rand() * 0.1);
    g.add(crumb);
  }

  // A takeaway menu half under the keyboard.
  const menu = takeawayMenu();
  menu.position.set(-0.34, top + 0.002, -0.17);
  menu.rotation.y = -0.6;
  g.add(menu);

  // Cables: from the computer down the back of the desk, and a loose one coiled on the floor.
  g.add(cable([[0.2, top + 0.05, -0.55], [0.35, top - 0.02, -0.7], [0.3, top - 0.35, -0.74], [0.3, 0.12, -0.6], [0.295, 0.064, -0.52]]));
  g.add(cable([[0.47, 0.018, -0.52], [0.6, 0.006, -0.55], [0.8, 0.006, -0.7], [0.95, 0.2, -0.8]]));
  g.add(cable([[-0.15, top + 0.05, -0.5], [-0.3, top - 0.1, -0.72], [-0.6, 0.2, -0.7], [-0.9, 0.01, -0.45], [-0.8, 0.01, -0.2]]));
  // Under the desk: everything runs along the back, zip-tied to the underside of the top, with one loop
  // that's come loose and hangs down where you can see it, before it all drops to the power board.
  const under = top - 0.035;
  for (const [dz, color] of [[0, '#14100c'], [0.012, '#3a3632'], [-0.01, '#cfc6ad']] as const) {
    g.add(cable([
      [-0.62, under, -0.74 + dz], [-0.35, under, -0.73 + dz], [-0.2, top - 0.2 + dz, -0.68 + dz], [-0.02, under - 0.005, -0.7 + dz],
      [0.12, top - 0.26 - dz * 2, -0.64 + dz], [0.24, under, -0.69 + dz], [0.27, top - 0.3, -0.66], [0.255, 0.07, -0.56 + dz], [0.24, 0.025, -0.52 + dz],
    ], 0.0045, color));
  }
  // The zip ties holding it up, one of them snapped.
  for (const x of [-0.35, -0.02, 0.24]) {
    const tie = cast(new Mesh(new BoxGeometry(0.008, 0.012, 0.045), solid('#0f0d0b', 0.5)));
    tie.position.set(x, under + 0.002, -0.71);
    g.add(tie);
  }
  const snapped = cast(new Mesh(new BoxGeometry(0.006, 0.05, 0.004), solid('#0f0d0b', 0.5)));
  snapped.position.set(0.12, under - 0.02, -0.66);
  snapped.rotation.z = 0.4;
  g.add(snapped);

  const coil = new Group();
  for (let i = 0; i < 3; i++) {
    const loop = cable([[0.09, 0, 0], [0, 0, 0.08 + i * 0.01], [-0.09, 0, 0], [0, 0, -0.08 - i * 0.01], [0.09, 0.004 * i, 0]], 0.005, '#2a2a2a');
    loop.position.y = 0.006 + i * 0.008;
    coil.add(loop);
  }
  coil.position.set(-1.35, 0, 0.1);
  g.add(coil);

  // On the wall: a faded security poster, a lanyard and a roll of tape hanging off hooks.
  const p = poster();
  p.position.set(-0.95, 1.2, wallZ + 0.004);
  const lanyard = cable([[0.6, 1.42, wallZ + 0.02], [0.57, 1.25, wallZ + 0.03], [0.6, 1.17, wallZ + 0.03], [0.63, 1.25, wallZ + 0.03], [0.6, 1.42, wallZ + 0.02]], 0.004, '#c8453b');
  const badge = cast(new Mesh(new BoxGeometry(0.05, 0.07, 0.003), solid('#f4efe2')));
  badge.position.set(0.6, 1.14, wallZ + 0.035);
  const tape = cast(new Mesh(new CylinderGeometry(0.035, 0.035, 0.02, 48), solid('#9a9a93', 0.6)));
  tape.rotation.x = Math.PI / 2;
  tape.position.set(0.82, 1.4, wallZ + 0.03);
  g.add(p, lanyard, badge, tape);
  return g;
}
