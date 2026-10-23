let audio: AudioContext | undefined;

/** A soft two-note ding, made on the spot (no sound files). Quiet, and silent if the browser won't play sound yet. */
export function chime(): void {
  try {
    audio ??= new AudioContext();
    const now = audio.currentTime;
    for (const [i, pitch] of [880, 1320].entries()) {
      const tone = audio.createOscillator();
      const volume = audio.createGain();
      tone.type = 'sine';
      tone.frequency.value = pitch;
      const at = now + i * 0.12;
      volume.gain.setValueAtTime(0.0001, at);
      volume.gain.exponentialRampToValueAtTime(0.05, at + 0.02);
      volume.gain.exponentialRampToValueAtTime(0.0001, at + 0.5);
      tone.connect(volume).connect(audio.destination);
      tone.start(at);
      tone.stop(at + 0.55);
    }
  } catch {
    // No sound here: the caption in the room still says what arrived.
  }
}
