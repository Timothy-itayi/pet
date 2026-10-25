/**
 * Makes Burrow Hub's pictures: stills from Atlas Cloud, then looping clips from LTX for those that move.
 * Keys come from .env (ATLAS_CLOUD_API_KEY, LTX_API_KEY), which git ignores.
 *
 *   node scripts/art.ts                 what would be made, and what it would cost
 *   node scripts/art.ts --go            make it
 *   node scripts/art.ts --go --only=banner,news-budget-freeze --redo
 *
 * Every finished picture is written to public/art/ and recorded in src/features/game/art.json straight away, so a
 * run that stops halfway picks up where it left off. Spending is logged in scripts/art-spend.json and capped.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { ALL_ART, FACE_STYLE, STYLE, type Art } from '../src/features/game/art.ts';

const BUDGET_USD = 15;
const IMAGE_MODEL = 'bytedance/seedream-v5.0-pro/text-to-image';
const IMAGE_SIZE = { size: '2048*1152', output_format: 'jpeg' };
/** Atlas Cloud's listed price for IMAGE_MODEL, October 2026. */
const IMAGE_USD = 0.036;
/** Atlas Cloud's upscaler, for the big portrait on someone's profile: the same face, four times the size. */
const UPSCALE = { model: 'atlascloud/image-upscaler', outscale: 4, output_format: 'jpeg' } as const;
const UPSCALE_USD = 0.01;
const LOOP = { model: 'ltx-2-3-fast', duration: 6, resolution: '1280x720', fps: 24, generate_audio: false, camera_motion: 'static' } as const;
const LOOP_USD = LOOP.duration * 0.06;

const OUT = 'public/art';
const MADE = 'src/features/game/art.json';
const SPEND = 'scripts/art-spend.json';

type Kind = 'image' | 'loop' | 'large';
type Made = Record<string, Partial<Record<Kind, boolean>>>;
type Spend = { id: string; kind: Kind | 'upscale'; usd: number; at: string }[];

const args = process.argv.slice(2);
const go = args.includes('--go');
const redo = args.includes('--redo');
const only = args.find((a) => a.startsWith('--only='))?.slice('--only='.length).split(',');

const read = <T>(file: string, empty: T): T => (existsSync(file) ? (JSON.parse(readFileSync(file, 'utf8')) as T) : empty);
const made = read<Made>(MADE, {});
const spend = read<Spend>(SPEND, []);
const spent = () => spend.reduce((sum, s) => sum + s.usd, 0);

function charge(id: string, kind: Spend[number]['kind'], usd: number): void {
  if (spent() + usd > BUDGET_USD) throw new Error(`Stopping: ${kind} for ${id} would take spending past $${BUDGET_USD} (spent $${spent().toFixed(2)}).`);
  spend.push({ id, kind, usd, at: new Date().toISOString() });
  writeFileSync(SPEND, `${JSON.stringify(spend, null, 2)}\n`);
}

function record(id: string, what: Kind): void {
  made[id] = { ...made[id], [what]: true };
  writeFileSync(MADE, `${JSON.stringify(made, null, 2)}\n`);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function call(url: string, key: string, body?: unknown): Promise<Record<string, unknown>> {
  const res = await fetch(url, {
    method: body ? 'POST' : 'GET',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} from ${url}: ${text.slice(0, 400)}`);
  return JSON.parse(text) as Record<string, unknown>;
}

async function download(url: string, to: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} downloading ${url}`);
  writeFileSync(to, Buffer.from(await res.arrayBuffer()));
}

const ffmpeg = (...a: string[]) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...a]);

/** Run an Atlas Cloud job and save its picture as public/art/<file>.jpg, resized by `scale` (an ffmpeg filter). */
async function atlas(key: string, body: Record<string, unknown>, file: string, scale?: string): Promise<void> {
  const job = await call('https://api.atlascloud.ai/api/v1/model/generateImage', key, body);
  const jobId = (job.data as { id?: string } | undefined)?.id;
  if (!jobId) throw new Error(`No prediction id for ${file}: ${JSON.stringify(job).slice(0, 300)}`);
  for (let tries = 0; tries < 90; tries++) {
    await sleep(2000);
    const r = (await call(`https://api.atlascloud.ai/api/v1/model/prediction/${jobId}`, key)).data as { status?: string; outputs?: string[]; error?: string };
    if (r.status === 'failed') throw new Error(`${file} failed: ${r.error ?? 'no reason given'}`);
    const url = r.outputs?.[0];
    if (r.status === 'completed' && url) {
      const raw = `${OUT}/${file}.download`;
      await download(url, raw);
      ffmpeg('-i', raw, ...(scale ? ['-vf', scale] : []), '-q:v', '3', `${OUT}/${file}.jpg`);
      rmSync(raw);
      return;
    }
  }
  throw new Error(`${file} took too long`);
}

/** A still, saved as public/art/<id>.jpg. Faces show small, in a circle, so they're kept small. */
async function image(art: Art, key: string): Promise<void> {
  charge(art.id, 'image', IMAGE_USD);
  await atlas(key, { model: IMAGE_MODEL, ...IMAGE_SIZE, prompt: `${art.face ? FACE_STYLE : STYLE}. ${art.shows}`, ...(art.face && { size: '2048*2048' }) },
    art.id, art.face ? 'scale=256:256' : 'scale=1280:-2');
  record(art.id, 'image');
}

/** A face upscaled from its small portrait, so it's the same person: public/art/<id>-large.jpg. */
async function large(art: Art, key: string): Promise<void> {
  charge(art.id, 'upscale', UPSCALE_USD);
  const small = `data:image/jpeg;base64,${readFileSync(`${OUT}/${art.id}.jpg`).toString('base64')}`;
  await atlas(key, { ...UPSCALE, image: small }, `${art.id}-large`);
  record(art.id, 'large');
}

/** A clip from LTX that starts and ends on the still, so it loops without a jump. Saved as public/art/<id>.mp4. */
async function loop(art: Art, key: string): Promise<void> {
  charge(art.id, 'loop', LOOP_USD);
  const still = `data:image/jpeg;base64,${readFileSync(`${OUT}/${art.id}.jpg`).toString('base64')}`;
  const job = await call('https://api.ltx.io/v2/image-to-video', key, { ...LOOP, prompt: `${STYLE}. ${art.moves}`, image_uri: still, last_frame_uri: still });
  for (let tries = 0; tries < 120; tries++) {
    await sleep(5000);
    const r = await call(`https://api.ltx.io/v2/image-to-video/${String(job.id)}`, key) as { status?: string; result?: Record<string, string>; error?: unknown };
    if (r.status === 'failed') throw new Error(`Loop for ${art.id} failed: ${JSON.stringify(r.error ?? r).slice(0, 300)}`);
    const url = r.result?.video_url ?? Object.values(r.result ?? {}).find((v) => v.startsWith('http'));
    if (r.status === 'completed' && url) {
      const raw = `${OUT}/${art.id}.download.mp4`;
      await download(url, raw);
      // Small enough to sit in the repo: no sound, 960 wide, starts playing before it's fully loaded.
      ffmpeg('-i', raw, '-an', '-vf', 'scale=960:-2', '-c:v', 'libx264', '-crf', '30', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', `${OUT}/${art.id}.mp4`);
      rmSync(raw);
      record(art.id, 'loop');
      return;
    }
  }
  throw new Error(`Loop for ${art.id} took too long`);
}

const todo = ALL_ART.filter((a) => !only || only.includes(a.id)).map((a) => ({
  art: a,
  image: redo || !made[a.id]?.image,
  loop: Boolean(a.moves) && (redo || !made[a.id]?.loop),
  large: Boolean(a.face) && (redo || !made[a.id]?.large),
})).filter((t) => t.image || t.loop || t.large);

const cost = todo.reduce((sum, t) => sum + (t.image ? IMAGE_USD : 0) + (t.loop ? LOOP_USD : 0) + (t.large ? UPSCALE_USD : 0), 0);
for (const t of todo) console.log(`${t.art.id}: ${[t.image && 'image', t.loop && 'loop', t.large && 'large'].filter(Boolean).join(' + ')}`);
console.log(`\n${todo.length} to make, about $${cost.toFixed(2)}. Spent so far $${spent().toFixed(2)} of $${BUDGET_USD}.`);
if (only) for (const id of only) if (!ALL_ART.some((a) => a.id === id)) console.log(`No picture called "${id}".`);

if (go && todo.length) {
  process.loadEnvFile('.env');
  const atlasKey = process.env.ATLAS_CLOUD_API_KEY;
  const ltx = process.env.LTX_API_KEY;
  if (!atlasKey || !ltx) throw new Error('Put ATLAS_CLOUD_API_KEY and LTX_API_KEY in .env first.');
  mkdirSync(OUT, { recursive: true });
  for (const t of todo) {
    if (t.image) { await image(t.art, atlasKey); console.log(`made ${t.art.id}.jpg`); }
    if (t.loop) { await loop(t.art, ltx); console.log(`made ${t.art.id}.mp4`); }
    if (t.large) { await large(t.art, atlasKey); console.log(`made ${t.art.id}-large.jpg`); }
  }
  console.log(`Done. Spent $${spent().toFixed(2)} of $${BUDGET_USD}.`);
} else if (todo.length) {
  console.log('Run with --go to make them.');
}
