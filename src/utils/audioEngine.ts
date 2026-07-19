class AudioEngine {
  private bgm: HTMLAudioElement | null = null;
  private sfxMap: Record<string, string> = {
    purge: "/audio/sfx_purge.mp3",
    overclock: "/audio/sfx_overclock.mp3",
    throttle: "/audio/sfx_throttle.mp3",
    breach: "/audio/sfx_breach.mp3",
  };

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
        // Ignore errors
      });
    }
  }
}

export const audioEngine = new AudioEngine();
