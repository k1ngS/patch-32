class AudioEngine {
  private bgm: HTMLAudioElement | null = null;
  private audioCtx: AudioContext | null = null;
  private sfxMap: Record<string, string> = {
    purge: "/audio/sfx_purge.mp3",
    overclock: "/audio/sfx_overclock.mp3",
    throttle: "/audio/sfx_throttle.mp3",
    breach: "/audio/sfx_breach.mp3",
  };

  private getAudioContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  init() {
    if (typeof window !== "undefined") {
      this.bgm = new Audio("/audio/bgm_cyber_industrial.mp3");
      this.bgm.loop = true;
      this.bgm.volume = 0.3;
    }
  }

  playBgm() {
    if (this.bgm) {
      this.bgm.play().catch(() => {
        // Ignore autoplay restrictions
      });
    }
  }

  stopBgm() {
    if (this.bgm) {
      this.bgm.pause();
      this.bgm.currentTime = 0;
    }
  }

  playSfx(type: "purge" | "overclock" | "throttle" | "breach") {
    if (typeof window !== "undefined" && this.sfxMap[type]) {
      const sfx = new Audio(this.sfxMap[type]);
      sfx.volume = type === "breach" ? 0.7 : 0.5;
      sfx.play().catch(() => {
        // Fallback to web audio synth if audio file fails
        this.playUiClick();
      });
    }
  }

  playUiClick() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch {
      // Ignore audio errors
    }
  }

  playBootChime() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(660, now + 0.1);
      osc.frequency.setValueAtTime(880, now + 0.2);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    } catch {
      // Ignore audio errors
    }
  }

  playCrtShutdown() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.4);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    } catch {
      // Ignore audio errors
    }
  }
}

export const audioEngine = new AudioEngine();
