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

/**
 * The office around you: air conditioning that drifts slowly, and the hum of the ceiling lights.
 * Pitched high enough for laptop speakers, which can't play a real low rumble.
 */
function startRoom(a: BaseAudioContext, to: AudioNode): GainNode {
  const level = a.createGain();
  level.gain.value = 0;
  level.connect(to);

  const air = a.createBufferSource();
  air.buffer = noise(a, 4);
  air.loop = true;
  const muffle = a.createBiquadFilter();
  muffle.type = 'lowpass';
  muffle.frequency.value = 900;
  const drift = a.createOscillator();
  const depth = a.createGain();
  drift.frequency.value = 0.07;
  depth.gain.value = 250;
  drift.connect(depth).connect(muffle.frequency);
  const airLevel = a.createGain();
  airLevel.gain.value = 0.18;
  air.connect(muffle).connect(airLevel).connect(level);

  for (const [pitch, loud] of [[240, 0.012], [360, 0.006], [480, 0.004]] as const) {
    const hum = a.createOscillator();
    const humLevel = a.createGain();
    hum.frequency.value = pitch;
    humLevel.gain.value = loud;
    hum.connect(humLevel).connect(level);
    hum.start();
  }
  air.start();
  drift.start();
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
