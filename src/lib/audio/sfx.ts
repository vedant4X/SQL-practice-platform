/**
 * ============================================================================
 * RETRO SYNTH AUDIO HOOK ENGINE (Pure Web Audio API - Zero External Dependencies)
 * ============================================================================
 * Generates arcade-style FM synth chords, laser triggers, and victory arpeggios.
 * Muted by default to respect user audio preferences.
 */

class SoundFxEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = true;

  constructor() {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("sqljudge_sfx_muted");
        // Muted by default unless user explicitly turned it ON ('false')
        this.isMuted = stored === "false" ? false : true;
      } catch {
        this.isMuted = true;
      }
    }
  }

  private initContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem("sqljudge_sfx_muted", this.isMuted ? "true" : "false");
    } catch {}
    if (!this.isMuted) {
      // Play a quick test blip when unmuting
      this.playTriggerChirp();
    }
    return this.isMuted;
  }

  /**
   * Arcade Trigger Micro-Interaction Click
   */
  public playTriggerChirp() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  /**
   * Retro Synth Victory Chord Arpeggio (Query Solved!)
   */
  public playSuccessArpeggio(combo: number = 1) {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    // Base scale frequencies: C5, E5, G5, C6 (shifted up with combo)
    const baseFreqs = [523.25, 659.25, 783.99, 1046.5];
    const comboShift = Math.min(combo * 40, 240);

    baseFreqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = idx % 2 === 0 ? "triangle" : "square";
      const start = ctx.currentTime + idx * 0.055;
      const targetFreq = freq + comboShift;

      osc.frequency.setValueAtTime(targetFreq, start);

      gain.gain.setValueAtTime(0.15 / (idx + 1), start);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + 0.3);
    });
  }

  /**
   * Error / Syntax Glitch Sound
   */
  public playErrorBuzz() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sawtooth";
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.linearRampToValueAtTime(70, now + 0.18);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.18);
  }
}

export const sfx = new SoundFxEngine();
