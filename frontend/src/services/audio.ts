/**
 * Web Audio Synthesizer for tactile board game sound effects.
 * Synthesizes organic wooden clacks, cowrie rattles, capture chimes, and victory fanfares.
 */

class SoundService {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  /**
   * Crisp, hollow wooden clack sound for sowing seeds into a carved pit
   */
  public playSeedClack(pitchMod: number = 1.0) {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320 * pitchMod, t);
    osc.frequency.exponentialRampToValueAtTime(80 * pitchMod, t + 0.06);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.07);
  }

  /**
   * Resonant reward chime when capturing 2 or 3 seeds
   */
  public playCaptureChime(seedCount: number = 2) {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const freqs = seedCount > 2 ? [523.25, 659.25, 783.99, 1046.5] : [587.33, 880.0];

    freqs.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.05);

      gain.gain.setValueAtTime(0, t + idx * 0.05);
      gain.gain.linearRampToValueAtTime(0.3, t + idx * 0.05 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.05 + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t + idx * 0.05);
      osc.stop(t + idx * 0.05 + 0.4);
    });
  }

  /**
   * Dramatic victory fanfare
   */
  public playVictoryFanfare() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const chords = [
      { f: 440, delay: 0 },
      { f: 554.37, delay: 0.1 },
      { f: 659.25, delay: 0.2 },
      { f: 880, delay: 0.35 },
    ];

    chords.forEach(({ f, delay }) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, t + delay);

      gain.gain.setValueAtTime(0.35, t + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.6);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t + delay);
      osc.stop(t + delay + 0.65);
    });
  }

  /**
   * Low wooden thud on turn end or resign
   */
  public playThud() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.15);

    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.16);
  }
}

export const sound = new SoundService();
