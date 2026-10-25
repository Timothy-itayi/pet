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

/** What's been made so far for this picture: its image, and its loop if it has one. */
export function artFor(id: string): { image: string; loop?: string } | undefined {
  const done = (made as Record<string, { image?: boolean; loop?: boolean }>)[id];
  if (!done?.image) return undefined;
  return { image: `art/${id}.jpg`, loop: done.loop ? `art/${id}.mp4` : undefined };
}

export const newsArt = (p: NewsPost): Art => ({ id: `news-${slug(p.title)}`, shows: p.shows, moves: p.moves });
export const feedArt = (p: SocialPost): Art | undefined => (p.shows ? { id: `feed-${p.day}-${slug(p.from)}`, shows: p.shows } : undefined);

/** Every picture to make: the banner, each news story (with a loop, as any can be the lead), and feed posts with a picture. */
export const ALL_ART: Art[] = [BANNER, ...NEWS.map(newsArt), ...SOCIAL.flatMap((p) => feedArt(p) ?? [])];
