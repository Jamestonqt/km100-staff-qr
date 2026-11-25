// Web Audio API Synthesizer for Gate Access Feedback

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    const saved = localStorage.getItem('km100_audio_muted');
    if (saved !== null) {
      this.isMuted = saved === 'true';
    }
  }

  private initCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    localStorage.setItem('km100_audio_muted', String(muted));
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  /**
   * Harmonious two-tone success chime (Access Granted)
   * Plays C5 (523Hz) followed smoothly by G5 (784Hz) with warm sine wave
   */
  public playSuccessChime(): void {
    if (this.isMuted) return;
    try {
      const ctx = this.initCtx();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Note 1: 523.25 Hz (C5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now);
      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.exponentialRampToValueAtTime(0.3, now + 0.04);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.25);

      // Note 2: 783.99 Hz (G5)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(783.99, now + 0.12);
      gain2.gain.setValueAtTime(0.001, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.35, now + 0.16);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.6);
    } catch (e) {
      console.warn('Audio playback not supported or blocked:', e);
    }
  }

  /**
   * Harsh low double-buzz for Denied / Inactive / Invalid Access
   */
  public playDeniedBuzzer(): void {
    if (this.isMuted) return;
    try {
      const ctx = this.initCtx();
      if (!ctx) return;

      const now = ctx.currentTime;

      const playBuzz = (startTime: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, startTime);
        osc.frequency.linearRampToValueAtTime(110, startTime + duration);

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.exponentialRampToValueAtTime(0.35, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + duration + 0.05);
      };

      playBuzz(now, 0.18);
      playBuzz(now + 0.22, 0.24);
    } catch (e) {
      console.warn('Audio playback not supported or blocked:', e);
    }
  }

  /**
   * Short double warning pulse for duplicate scan within cooldown
   */
  public playWarningBeep(): void {
    if (this.isMuted) return;
    try {
      const ctx = this.initCtx();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } catch (e) {
      console.warn('Audio playback not supported or blocked:', e);
    }
  }
}

export const soundManager = new SoundManager();
