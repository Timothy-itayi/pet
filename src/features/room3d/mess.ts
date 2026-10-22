import {
  BoxGeometry, CanvasTexture, CatmullRomCurve3, Color, CylinderGeometry, Group, IcosahedronGeometry, Mesh, MeshStandardMaterial,
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

function crumpled(size: number): Mesh {
  const m = cast(new Mesh(new IcosahedronGeometry(size, 0), solid('#ece6d6', 1)));
  m.rotation.set(1.1, 0.4, 2.3);
  return m;
}

function pen(length: number, color: string): Group {
  const g = new Group();
  const body = cast(new Mesh(new CylinderGeometry(0.004, 0.004, length, 8), solid(color, 0.5)));
  const cap = cast(new Mesh(new CylinderGeometry(0.0045, 0.0045, length * 0.25, 8), solid('#1f1712', 0.5)));
  cap.position.y = length * 0.4;
  g.add(body, cap);
  g.rotation.z = Math.PI / 2;
  return g;
}

/** A tangle of cable from one point to another, sagging along the way. */
function cable(points: [number, number, number][], radius = 0.006, color = '#14100c'): Mesh {
  const curve = new CatmullRomCurve3(points.map((p) => new Vector3(...p)));
  return cast(new Mesh(new TubeGeometry(curve, 48, radius, 6, false), solid(color, 0.6)));
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

  // Papers: a pile by the keyboard, one sliding off the edge, a couple crumpled.
  const pile = new Group();
  for (const [i, turn] of [0.1, -0.15, 0.35, -0.05].entries()) {
    const sheet = paper(0.21, 0.29, i === 2 ? '#f7e27a' : '#f1ece0');
    sheet.position.y = i * 0.003;
    sheet.rotation.y = turn;
    pile.add(sheet);
  }
  pile.position.set(-0.62, top + 0.002, -0.14);
  const sliding = paper(0.21, 0.29);
  sliding.position.set(0.66, top + 0.002, -0.06);
  sliding.rotation.y = 0.5;
  const ball1 = crumpled(0.03);
  ball1.position.set(0.42, top + 0.025, -0.02);
  const ball2 = crumpled(0.025);
  ball2.position.set(-1.0, 0.025, 0.3);
  const ball3 = crumpled(0.028);
  ball3.position.set(-1.12, 0.45, -0.2); // missed the bin, landed on the rim
  g.add(pile, sliding, ball1, ball2, ball3);

  // Pens that don't work, a chewed pencil, crumbs.
  const pen1 = pen(0.14, '#2f4c7c');
  pen1.position.set(0.12, top + 0.005, 0.02);
  pen1.rotation.y = 0.3;
  const pen2 = pen(0.13, '#c8453b');
  pen2.position.set(-0.5, top + 0.014, -0.12);
  pen2.rotation.y = -1.1;
  const pencil = pen(0.16, '#e0b84a');
  pencil.position.set(0.55, top + 0.005, -0.3);
  pencil.rotation.y = 1.4;
  g.add(pen1, pen2, pencil);
  const rand = seeded(3);
  for (let i = 0; i < 18; i++) {
    const crumb = new Mesh(new BoxGeometry(0.004, 0.003, 0.004), solid('#b5874a'));
    crumb.position.set(0.05 + rand() * 0.3, top + 0.0015, -0.12 + rand() * 0.12);
    g.add(crumb);
  }

  // A takeaway menu half under the keyboard, and an old mug with a tea bag string hanging out.
  const menu = takeawayMenu();
  menu.position.set(0.32, top + 0.002, -0.16);
  menu.rotation.y = -0.6;
  const oldMug = cast(new Mesh(new CylinderGeometry(0.036, 0.034, 0.09, 16), solid('#7a9bb5', 0.5)));
  oldMug.position.set(-0.58, top + 0.045, -0.55);
  const string = new Mesh(new BoxGeometry(0.001, 0.07, 0.001), solid('#efe9dc'));
  string.position.set(-0.545, top + 0.06, -0.55);
  const tag = new Mesh(new BoxGeometry(0.016, 0.02, 0.001), solid('#f2c94c'));
  tag.position.set(-0.545, top + 0.025, -0.548);
  g.add(menu, oldMug, string, tag);

  // Cables: from the computer down the back of the desk, and a loose one coiled on the floor.
  g.add(cable([[0.2, top + 0.05, -0.5], [0.35, top - 0.02, -0.7], [0.3, top - 0.35, -0.74], [0.5, 0.05, -0.6], [0.9, 0.01, -0.5]]));
  g.add(cable([[-0.15, top + 0.05, -0.5], [-0.3, top - 0.1, -0.72], [-0.6, 0.2, -0.7], [-0.9, 0.01, -0.45], [-0.8, 0.01, -0.2]]));
  g.add(cable([[-0.2, top + 0.01, 0.02], [-0.05, top + 0.01, 0.1], [-0.1, top - 0.03, 0.05], [-0.1, 0.3, 0.06], [0.0, 0.01, 0.2]], 0.004, '#d8cdb3'));
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
  const tape = cast(new Mesh(new CylinderGeometry(0.035, 0.035, 0.02, 20), solid('#9a9a93', 0.6)));
  tape.rotation.x = Math.PI / 2;
  tape.position.set(0.82, 1.4, wallZ + 0.03);
  g.add(p, lanyard, badge, tape);
  return g;
}
