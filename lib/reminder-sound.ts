let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!audioContext) {
    audioContext = new AudioContext();
  }

  return audioContext;
}

/** Call on first user gesture so scheduled reminders can play audio later. */
export function primeReminderAudio(): void {
  const ctx = getAudioContext();
  if (ctx?.state === 'suspended') {
    void ctx.resume();
  }
}

/**
 * Soft two-note chime — noticeable but gentle (peak ~12% volume).
 * Safe to call when a habit reminder fires.
 */
export async function playReminderSound(): Promise<void> {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    const start = ctx.currentTime;
    const notes = [
      { freq: 659.25, at: 0, duration: 0.35 },
      { freq: 783.99, at: 0.42, duration: 0.45 },
    ];

    for (const note of notes) {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(note.freq, start + note.at);

      const noteStart = start + note.at;
      const peakGain = 0.12;

      gain.gain.setValueAtTime(0.0001, noteStart);
      gain.gain.exponentialRampToValueAtTime(peakGain, noteStart + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + note.duration);

      oscillator.connect(gain);
      gain.connect(ctx.destination);

      oscillator.start(noteStart);
      oscillator.stop(noteStart + note.duration + 0.05);
    }
  } catch {
    // Autoplay policy or unsupported environment — visual reminder still shows
  }
}
