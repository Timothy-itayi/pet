/**
 * Generated pictures for Burrow Hub: what each one shows, in words. `scripts/art.ts` turns these into images
 * (Atlas Cloud) and short looping clips (LTX), saved in public/art/ and listed in art.json. Until a picture
 * exists, the intranet shows the emoji scene instead.
 */
import made from './art.json' with { type: 'json' };
import { NEWS, type NewsPost } from './news.ts';
import { SOCIAL, type SocialPost } from './social.ts';

/** The look every picture shares, so they read as one set. */
export const STYLE = 'Cozy painted illustration, soft gouache texture, muted warm palette with cool blue shadows, a small run-down 1990s British office supplies company, after hours, dim and slightly eerie, quiet and empty, no people, no text, no logos';

export interface Art {
  id: string;
  /** A square head-and-shoulders portrait, in place of the scene style. */
  face?: true;
  /** A square app icon, in place of the scene style. */
  icon?: true;
  /** Its own look, in place of the shared one for its kind. */
  style?: string;
  /** What the picture shows. */
  shows: string;
  /** How it moves, for a looping clip. Without it, it's a still. */
  moves?: string;
}

/** The band across the top of every Burrow Hub page. */
export const BANNER: Art = {
  id: 'banner',
  shows: 'Wide view across a small open-plan office at dusk, rows of beige computers on wooden desks, a water cooler, a pinboard, rolling hills through the windows, fluorescent ceiling lights',
  moves: 'Static camera. One ceiling light flickers, dust drifts in the light from the windows, a screen glows faintly. Nothing else moves.',
};

export const slug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** What's been made so far for this picture: its image, its loop if it moves, and a large copy for faces. */
export function artFor(id: string): { image: string; loop?: string; large?: string } | undefined {
  const done = (made as Record<string, { image?: boolean; loop?: boolean; large?: boolean }>)[id];
  if (!done?.image) return undefined;
  return { image: `art/${id}.jpg`, loop: done.loop ? `art/${id}.mp4` : undefined, large: done.large ? `art/${id}-large.jpg` : undefined };
}

/** The look for staff portraits: the same paint as the scenes, but a person this time. */
export const FACE_STYLE = 'Cozy painted portrait illustration, soft gouache texture, muted warm palette, head and shoulders, facing the viewer, plain soft blue-grey background, 1990s British office worker, no text, no logos';

/** How each person at Burrow looks, matching their drawn face: the same hair, skin, glasses and shirt. */
const FACES: Record<string, string> = {
  'Mr. Grisby': 'Older managing director, pale skin, bald with grey tufts at the sides, bushy grey moustache, round glasses, navy suit and tie, a slightly pompous smile',
  Dot: 'Accounts clerk, dark brown skin, curly black hair, glasses, red cardigan, a warm no-nonsense look',
  Otis: 'Company secretary, light skin, short silver hair, neat grey beard, glasses, olive tweed jacket, calm and wise',
  Juniper: 'Marketing coordinator, fair skin, long chestnut-brown hair, blue blouse, a bright eager smile',
  Wren: 'Content writer, tan skin, dark brown hair in a bun, purple jumper, thoughtful',
  Basil: 'Designer, light tan skin, short dark hair, trimmed dark beard, teal shirt, quietly stylish',
  Marlo: 'Sales lead, brown skin, short black hair, navy blazer, a confident grin',
  Biscuit: 'Office assistant, fair skin, curly golden-ginger hair, mustard-yellow jumper, a beaming cheerful smile',
  Pip: 'Operations assistant, deep brown skin, short black hair, glasses, green shirt, a curious smile',
  Fern: 'Social media assistant, very fair skin, copper-red bob, green top, friendly',
  Hazel: 'New accounts assistant, warm brown skin, neat dark hair tied back, small round glasses, cream blouse under a grey cardigan, polite and slightly nervous',
  Rowan: 'New sales executive, light olive skin, short wavy dark hair, a neat navy jumper over a collared shirt, a confident easy smile',
  Sam: 'IT administrator, tan skin, short brown hair, beard, grey hoodie, tired kind eyes',
  IT: 'Young IT intern, light skin, short dark brown hair, blue shirt with a staff lanyard, a hopeful nervous smile',
};

/** The look for app icons: one simple object on a rounded square, like a 1990s software box, painted. */
export const ICON_STYLE = 'App icon, a single simple bold object centred on a rounded square tile with a soft gradient, cozy painted gouache texture, chunky 1990s software feel, strong silhouette readable when tiny, no text, no letters, no logos';

/** The apps in Oktopus, and Oktopus itself: what each icon shows. */
const ICONS: Record<string, string> = {
  hootsweet: 'A friendly round owl with big eyes holding a tiny paper speech bubble, on a teal tile',
  voyago: 'A small paper aeroplane over a suitcase with a luggage tag, on a sky-blue tile',
  canvass: 'A paint palette with a fat brush and three bright blobs of paint, on a warm coral tile',
  oktopus: 'A thick bold ring like the letter O, drawn as one octopus tentacle curled round until its tip meets its base, small round suckers along the inside edge',
};

/** Oktopus is a big modern sign-on company: its icon is a clean flat mark, like the real ones, not a painting. */
const ICON_LOOKS: Record<string, string> = {
  oktopus: 'Flat modern tech company logo mark, minimal vector style, solid royal blue on a plain white rounded square tile, crisp edges, generous margin, no gradients, no text, no letters other than the ring shape',
};

export const iconId = (app: string) => `icon-${app}`;

/** Whose painted face to show for a name. Anyone not on the list (like "Intern (you)") is the intern. */
export const faceId = (name: string) => `face-${slug(name in FACES ? name : 'IT')}`;

export const newsArt = (p: NewsPost): Art => ({ id: `news-${slug(p.title)}`, shows: p.shows, moves: p.moves });
export const feedArt = (p: SocialPost): Art | undefined => (p.shows ? { id: `feed-${p.day}-${slug(p.from)}`, shows: p.shows } : undefined);

/** Every picture to make: the banner, each news story (with a loop, as any can be the lead), feed posts with a picture, and everyone's face. */
export const ALL_ART: Art[] = [
  BANNER, ...NEWS.map(newsArt), ...SOCIAL.flatMap((p) => feedArt(p) ?? []),
  ...Object.entries(FACES).map(([name, shows]): Art => ({ id: faceId(name), shows, face: true })),
  ...Object.entries(ICONS).map(([app, shows]): Art => ({ id: iconId(app), shows, icon: true, style: ICON_LOOKS[app] })),
];
