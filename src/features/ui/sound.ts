let audio: AudioContext | undefined;
/** Every sound goes through here, so one switch turns them all off. */
let master: GainNode | undefined;
/** The room's sound, faded in and out; and whether it should be playing. */
let room: GainNode | undefined;
let roomOn = false;

const MUTE_KEY = 'pet:muted';
let muted = (() => {
  try { return localStorage.getItem(MUTE_KEY) === '1'; } catch { return false; }
})();

/** The sound system, made the first time it's needed. */
function out(): { a: AudioContext; to: GainNode } {
  audio ??= new AudioContext();
  if (!master) {
    master = audio.createGain();
    master.gain.value = muted ? 0 : 1;
    master.connect(audio.destination);
  }
  return { a: audio, to: master };
}

export const isMuted = () => muted;

/** Turn every sound in the game off or on, and remember it for next time. */
export function setMuted(on: boolean): void {
  muted = on;
  try { localStorage.setItem(MUTE_KEY, on ? '1' : '0'); } catch { /* Not remembered: it still applies now. */ }
  if (audio && master) master.gain.setTargetAtTime(on ? 0 : 1, audio.currentTime, 0.05);
}

/** A soft two-note ding, made on the spot (no sound files). Quiet, and silent if the browser won't play sound yet. */
export function chime(): void {
  try {
    const { a, to } = out();
    const now = a.currentTime;
    for (const [i, pitch] of [880, 1320].entries()) {
      const tone = a.createOscillator();
      const volume = a.createGain();
      tone.type = 'sine';
      tone.frequency.value = pitch;
      const at = now + i * 0.12;
      volume.gain.setValueAtTime(0.0001, at);
      volume.gain.exponentialRampToValueAtTime(0.05, at + 0.02);
      volume.gain.exponentialRampToValueAtTime(0.0001, at + 0.5);
      tone.connect(volume).connect(to);
      tone.start(at);
      tone.stop(at + 0.55);
    }
  } catch {
    // No sound here: the caption in the room still says what arrived.
  }
}

/** Pink noise, which loops without a seam you can hear. */
function noise(a: BaseAudioContext, seconds: number): AudioBuffer {
  const buf = a.createBuffer(1, a.sampleRate * seconds, a.sampleRate);
  const data = buf.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0;
  for (let i = 0; i < data.length; i++) {
    const w = Math.random() * 2 - 1;
    b0 = 0.99765 * b0 + w * 0.099046;
    b1 = 0.963 * b1 + w * 0.2965164;
    b2 = 0.57 * b2 + w * 1.0526913;
    data[i] = (b0 + b1 + b2 + w * 0.1848) * 0.2;
  }
  return buf;
}

/** A sound that plays once and stops: a tone or a noise, shaped by a filter and a volume curve. */
interface Hit {
  at: number;
  /** A pitch for a tone, or 'noise'. */
  source: number | 'noise';
  wave?: OscillatorType;
  filter: BiquadFilterType;
  /** Filter frequency at the start and, if it sweeps, at the end. */
  hz: [number, number?];
  q?: number;
  peak: number;
  attack: number;
  length: number;
}

function hit(a: BaseAudioContext, to: AudioNode, x: Hit): void {
  const src = x.source === 'noise' ? a.createBufferSource() : a.createOscillator();
  if (src instanceof AudioBufferSourceNode) src.buffer = noise(a, x.length + 0.05);
  else { src.type = x.wave ?? 'sine'; src.frequency.value = x.source as number; }
  const shape = a.createBiquadFilter();
  shape.type = x.filter;
  shape.Q.value = x.q ?? 1;
  shape.frequency.setValueAtTime(x.hz[0], x.at);
  if (x.hz[1]) shape.frequency.linearRampToValueAtTime(x.hz[1], x.at + x.length);
  const volume = a.createGain();
  volume.gain.setValueAtTime(0.0001, x.at);
  volume.gain.exponentialRampToValueAtTime(x.peak, x.at + x.attack);
  volume.gain.exponentialRampToValueAtTime(0.0001, x.at + x.length);
  src.connect(shape).connect(volume).connect(to);
  src.start(x.at);
  src.stop(x.at + x.length + 0.05);
}

/** Things heard from somewhere else in the empty building, now and then. Each gets the time it starts. */
const FAR: ((t: number) => Hit[])[] = [
  // A door swinging shut down the corridor.
  (t) => [{ at: t, source: 'noise', filter: 'lowpass', hz: [260], peak: 0.9, attack: 0.004, length: 0.5 },
    { at: t + 0.06, source: 'noise', filter: 'bandpass', hz: [1800], q: 3, peak: 0.25, attack: 0.002, length: 0.05 }],
  // Footsteps somewhere, that stop.
  (t) => [0, 0.62, 1.22, 1.86].map((d, i) => ({ at: t + d, source: 'noise' as const, filter: 'lowpass' as const, hz: [380] as [number], peak: 0.5 - i * 0.08, attack: 0.006, length: 0.16 })),
  // A phone ringing at an empty desk. Nobody picks up.
  (t) => [0, 0.6, 3, 3.6].map((d) => ({ at: t + d, source: 440, wave: 'square' as const, filter: 'bandpass' as const, hz: [900] as [number], q: 2, peak: 0.035, attack: 0.02, length: 0.4 })),
  // Something creaks: a chair, or the building settling.
  (t) => [{ at: t, source: 38, wave: 'sawtooth', filter: 'bandpass', hz: [520, 880], q: 9, peak: 0.12, attack: 0.25, length: 1.4 }],
  // The lift arrives on another floor.
  (t) => [{ at: t, source: 660, filter: 'lowpass', hz: [1400], peak: 0.05, attack: 0.01, length: 2.2 },
    { at: t + 0.45, source: 524, filter: 'lowpass', hz: [1400], peak: 0.045, attack: 0.01, length: 2.6 }],
];

/**
 * The office after everyone's gone: air conditioning that drifts, ceiling lights that buzz and sometimes flicker,
 * a low drone that never quite settles, and now and then something far off. Pitched for laptop speakers, which
 * can't play a real low rumble.
 */
function startRoom(a: BaseAudioContext, to: AudioNode): GainNode {
  const level = a.createGain();
  level.gain.value = 0;
  level.connect(to);
  const loop = (node: AudioScheduledSourceNode) => { node.start(); return node; };

  const air = a.createBufferSource();
  air.buffer = noise(a, 4);
  air.loop = true;
  const muffle = a.createBiquadFilter();
  muffle.type = 'lowpass';
  muffle.frequency.value = 650;
  const drift = a.createOscillator();
  const depth = a.createGain();
  drift.frequency.value = 0.05;
  depth.gain.value = 220;
  loop(drift).connect(depth).connect(muffle.frequency);
  const airLevel = a.createGain();
  airLevel.gain.value = 0.16;
  loop(air).connect(muffle).connect(airLevel).connect(level);

  // The lights: a thin electric buzz. A flicker cuts it in and out for a moment.
  const buzz = a.createOscillator();
  buzz.type = 'sawtooth';
  buzz.frequency.value = 120;
  const thin = a.createBiquadFilter();
  thin.type = 'bandpass';
  thin.frequency.value = 1300;
  thin.Q.value = 0.8;
  const lights = a.createGain();
  lights.gain.value = 0.006;
  loop(buzz).connect(thin).connect(lights).connect(level);

  // Two tones a hair apart, so the drone slowly beats against itself.
  for (const [pitch, loud] of [[220, 0.01], [221.2, 0.01], [329.3, 0.004]] as const) {
    const tone = a.createOscillator();
    const toneLevel = a.createGain();
    tone.frequency.value = pitch;
    toneLevel.gain.value = loud;
    loop(tone).connect(toneLevel).connect(level);
  }

  // Far-off sounds come through a corridor: muffled, with an echo.
  const far = a.createBiquadFilter();
  far.type = 'lowpass';
  far.frequency.value = 1600;
  const echo = a.createDelay(1);
  echo.delayTime.value = 0.32;
  const tail = a.createGain();
  tail.gain.value = 0.42;
  far.connect(level);
  far.connect(echo).connect(tail).connect(echo);
  tail.connect(level);

  const flicker = (t: number) => {
    for (let i = 0; i < 6; i++) lights.gain.setValueAtTime(i % 2 ? 0.006 : 0.0005, t + i * 0.07 + Math.random() * 0.05);
    lights.gain.setValueAtTime(0.006, t + 0.6);
  };
  // Only while you can hear the room, so nothing piles up while you're at the computer.
  const later = () => setTimeout(() => {
    if (roomOn && !muted) {
      const t = a.currentTime + 0.05;
      if (Math.random() < 0.3) flicker(t);
      else for (const x of FAR[Math.floor(Math.random() * FAR.length)]?.(t) ?? []) hit(a, far, x);
    }
    later();
  }, 9000 + Math.random() * 16000);
  later();
  return level;
}

/** Hear the room, or not: sat at the computer you're focused on the screen. Fades rather than cuts. */
export function ambience(on: boolean): void {
  roomOn = on;
  if (!audio || !room) return;
  room.gain.setTargetAtTime(on ? 1 : 0, audio.currentTime, 0.35);
}

/** Browsers only allow sound after the player does something, so the room starts on the first click or key. */
export function wake(): void {
  try {
    const { a, to } = out();
    if (a.state === 'suspended') void a.resume();
    room ??= startRoom(a, to);
    ambience(roomOn);
  } catch {
    // No sound here: the game plays the same without it.
  }
}

/** A mouse button's click: a very short, bright tick. */
export function click(): void {
  if (!audio) return;
  const { a, to } = out();
  const at = a.currentTime;
  const tick = a.createBufferSource();
  tick.buffer = noise(a, 0.03);
  const bright = a.createBiquadFilter();
  bright.type = 'bandpass';
  bright.frequency.value = 3200;
  bright.Q.value = 1.5;
  const volume = a.createGain();
  volume.gain.setValueAtTime(0.9, at);
  volume.gain.exponentialRampToValueAtTime(0.0001, at + 0.025);
  tick.connect(bright).connect(volume).connect(to);
  tick.start(at);
}
