/**
 * Staff portraits for the intranet: painted faces of the men and women who work at Burrow (made by scripts/art.ts,
 * so nobody real is pictured). Until someone's painting exists, they get a face drawn in code with the same skin
 * tone, hair and look.
 */
import { artFor, faceId } from '../game/art.ts';

type Hair = 'short' | 'long' | 'bun' | 'curly' | 'bald' | 'bob';

interface Look {
  skin: string;
  hair: Hair;
  hairColour: string;
  shirt: string;
  beard?: boolean;
  moustache?: boolean;
  glasses?: boolean;
}

const LOOKS: Record<string, Look> = {
  'Mr. Grisby': { skin: '#f1c9a5', hair: 'bald', hairColour: '#b8b8b8', shirt: '#2b3a55', moustache: true, glasses: true },
  Dot: { skin: '#8d5a3b', hair: 'curly', hairColour: '#2a1a12', shirt: '#c8453b', glasses: true },
  Otis: { skin: '#e8b98f', hair: 'short', hairColour: '#c9c4bb', shirt: '#5b6b4a', beard: true, glasses: true },
  Juniper: { skin: '#f3d2b3', hair: 'long', hairColour: '#7a4a24', shirt: '#3a6ea5' },
  Wren: { skin: '#c68e63', hair: 'bun', hairColour: '#3b2416', shirt: '#7a5aa0' },
  Basil: { skin: '#e2b48c', hair: 'short', hairColour: '#2e2a26', shirt: '#2f6b5a', beard: true },
  Marlo: { skin: '#a8714b', hair: 'short', hairColour: '#1c1612', shirt: '#1d3f6e' },
  Biscuit: { skin: '#f0c6a0', hair: 'curly', hairColour: '#c98d52', shirt: '#e0a33a' },
  Pip: { skin: '#5e3b26', hair: 'short', hairColour: '#120c08', shirt: '#4e8a3a', glasses: true },
  Fern: { skin: '#f6dcc4', hair: 'bob', hairColour: '#b5452b', shirt: '#2f8a6b' },
  Clover: { skin: '#b9794f', hair: 'bun', hairColour: '#6b3a1e', shirt: '#c06a2b' },
  Moss: { skin: '#e6b88f', hair: 'curly', hairColour: '#4a3a24', shirt: '#6a7f3a', beard: true },
  Tansy: { skin: '#7a4a30', hair: 'bob', hairColour: '#1a1210', shirt: '#b3265a' },
  Hector: { skin: '#f1cfae', hair: 'short', hairColour: '#8a8a8a', shirt: '#44546a', glasses: true },
  Sam: { skin: '#d9a77f', hair: 'short', hairColour: '#5a3a22', shirt: '#555', beard: true },
  IT: { skin: '#e9bf98', hair: 'short', hairColour: '#3a2a1e', shirt: '#3a6ea5' },
};

const ns = 'http://www.w3.org/2000/svg';
function shape(tag: string, attrs: Record<string, string>): SVGElement {
  const el = document.createElementNS(ns, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

/** A round portrait of someone, by name: their painting, or their drawn face. Anyone without a look is the intern. */
export function portrait(name: string, size = 40): Element {
  const painted = artFor(faceId(name));
  if (painted) {
    const img = document.createElement('img');
    Object.assign(img, { src: import.meta.env.BASE_URL + painted.image, alt: name, width: size, height: size, className: 'portrait painted' });
    return img;
  }
  return drawn(name, size);
}

function drawn(name: string, size: number): SVGSVGElement {
  const look = LOOKS[name] ?? LOOKS.IT ?? { skin: '#e9bf98', hair: 'short', hairColour: '#3a2a1e', shirt: '#3a6ea5' };
  const svg = shape('svg', { viewBox: '0 0 64 64', width: String(size), height: String(size), class: 'portrait', role: 'img', 'aria-label': name }) as SVGSVGElement;
  const clip = `clip-${name.replace(/\W/g, '')}`;
  const defs = shape('defs', {});
  const cp = shape('clipPath', { id: clip });
  cp.append(shape('circle', { cx: '32', cy: '32', r: '32' }));
  defs.append(cp);
  const g = shape('g', { 'clip-path': `url(#${clip})` });
  const { skin, hairColour: hc } = look;
  g.append(shape('rect', { width: '64', height: '64', fill: '#dfe7ef' }));
  // Long hair falls behind the shoulders.
  if (look.hair === 'long') g.append(shape('path', { d: 'M14 30 Q14 10 32 10 Q50 10 50 30 L52 58 L12 58 Z', fill: hc }));
  if (look.hair === 'bob') g.append(shape('path', { d: 'M15 30 Q15 11 32 11 Q49 11 49 30 L49 42 L15 42 Z', fill: hc }));
  g.append(
    shape('path', { d: 'M8 64 Q10 46 32 46 Q54 46 56 64 Z', fill: look.shirt }),
    shape('rect', { x: '27', y: '38', width: '10', height: '10', fill: skin }),
    shape('ellipse', { cx: '18', cy: '31', rx: '3', ry: '4', fill: skin }),
    shape('ellipse', { cx: '46', cy: '31', rx: '3', ry: '4', fill: skin }),
    shape('ellipse', { cx: '32', cy: '29', rx: '14', ry: '16', fill: skin }),
  );
  switch (look.hair) {
    case 'short': g.append(shape('path', { d: 'M18 26 Q18 12 32 12 Q46 12 46 26 Q42 18 32 18 Q22 18 18 26 Z', fill: hc })); break;
    case 'long': g.append(shape('path', { d: 'M18 28 Q17 12 32 12 Q47 12 46 28 Q40 17 32 18 Q24 17 18 28 Z', fill: hc })); break;
    case 'bob': g.append(shape('path', { d: 'M17 30 Q16 12 32 12 Q48 12 47 30 Q44 19 32 18 Q20 19 17 30 Z', fill: hc })); break;
    case 'bun': g.append(
      shape('circle', { cx: '32', cy: '9', r: '6', fill: hc }),
      shape('path', { d: 'M18 26 Q18 13 32 13 Q46 13 46 26 Q41 19 32 19 Q23 19 18 26 Z', fill: hc }),
    ); break;
    case 'curly': for (const [x, y] of [[20, 20], [25, 15], [32, 13], [39, 15], [44, 20], [18, 27], [46, 27]]) g.append(shape('circle', { cx: String(x), cy: String(y), r: '6', fill: hc })); break;
    case 'bald': g.append(
      shape('path', { d: 'M17 30 Q17 22 21 20 L21 30 Z', fill: hc }),
      shape('path', { d: 'M47 30 Q47 22 43 20 L43 30 Z', fill: hc }),
    ); break;
  }
  // Eyes, brows, nose and a smile.
  g.append(
    shape('circle', { cx: '26', cy: '29', r: '1.8', fill: '#2a1d16' }),
    shape('circle', { cx: '38', cy: '29', r: '1.8', fill: '#2a1d16' }),
    shape('path', { d: 'M23 25 Q26 23.5 29 25', stroke: '#3a2a20', 'stroke-width': '1.3', fill: 'none' }),
    shape('path', { d: 'M35 25 Q38 23.5 41 25', stroke: '#3a2a20', 'stroke-width': '1.3', fill: 'none' }),
    shape('path', { d: 'M32 30 Q30.5 35 33 35', stroke: '#00000044', 'stroke-width': '1.2', fill: 'none' }),
    shape('path', { d: 'M27 38 Q32 42 37 38', stroke: '#7a3a2a', 'stroke-width': '1.6', fill: 'none', 'stroke-linecap': 'round' }),
  );
  if (look.beard) g.append(shape('path', { d: 'M19 32 Q20 46 32 47 Q44 46 45 32 Q42 40 37 41 Q32 37 27 41 Q22 40 19 32 Z', fill: look.hairColour }));
  if (look.moustache) g.append(shape('path', { d: 'M26 36 Q32 33 38 36 Q32 37.5 26 36 Z', fill: look.hairColour }));
  if (look.glasses) g.append(
    shape('circle', { cx: '26', cy: '29', r: '4.6', fill: 'none', stroke: '#2a2a2a', 'stroke-width': '1.3' }),
    shape('circle', { cx: '38', cy: '29', r: '4.6', fill: 'none', stroke: '#2a2a2a', 'stroke-width': '1.3' }),
    shape('line', { x1: '30.6', y1: '29', x2: '33.4', y2: '29', stroke: '#2a2a2a', 'stroke-width': '1.3' }),
  );
  svg.append(defs, g);
  return svg;
}
