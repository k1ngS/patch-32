// ─────────────────────────────────────────────────────────────
// PATCH32 — RuntimeEngine (Single State Observer)
// ─────────────────────────────────────────────────────────────

import { eventBus } from "./EventBus";
import type { GameState } from "@/types/game";
import { CORE_MAX_HEALTH } from "@/constants/gameConfig";

class RuntimeEngine {
  private lastHeartbeatMs: number = 0;
  private prevHealthState: "normal" | "low" | "critical" = "normal";
  private prevSectorIndex: number = 0;
  private prevOverclockActive: boolean = false;
  private prevThermalThrottleMs: number = 0;
  private prevUpgradeLevels: Map<string, number> = new Map();
  private prevScreen: string = "menu";

  public observe(state: GameState): void {
    const now = state.elapsedMs;

    // 1. Run / Phase State Facts
    if (state.activeScreen !== this.prevScreen) {
      if (state.activeScreen === "game") {
        eventBus.publish({ type: "RUN_STARTED", timestampMs: now });
      } else if (state.activeScreen === "gameover") {
        eventBus.publish({ type: "RUN_GAMEOVER", timestampMs: now });
      }
      this.prevScreen = state.activeScreen;
    }

    if (state.phase === "victory") {
      eventBus.publish({ type: "RUN_VICTORY", timestampMs: now });
    }

    // 2. Sector Transition Facts
    if (state.currentSectorIndex !== this.prevSectorIndex) {
      eventBus.publish({
        type: "SECTOR_CHANGED",
        payload: { sectorIndex: state.currentSectorIndex },
        timestampMs: now,
      });
      this.prevSectorIndex = state.currentSectorIndex;
    }

    // 3. Core Health Facts
    const hpRatio = state.core.health / CORE_MAX_HEALTH;
    let currentHealthState: "normal" | "low" | "critical" = "normal";
    if (hpRatio < 0.2) currentHealthState = "critical";
    else if (hpRatio < 0.4) currentHealthState = "low";

    if (currentHealthState !== this.prevHealthState) {
      if (currentHealthState === "critical") {
        eventBus.publish({ type: "CORE_HEALTH_CRITICAL", timestampMs: now });
      } else if (currentHealthState === "low") {
        eventBus.publish({ type: "CORE_HEALTH_LOW", timestampMs: now });
      } else {
        eventBus.publish({ type: "CORE_HEALTH_NORMAL", timestampMs: now });
      }
      this.prevHealthState = currentHealthState;
    }

    // 4. Overclock & Power Facts
    if (state.core.overclockActive && !this.prevOverclockActive) {
      eventBus.publish({ type: "OVERCLOCK_STARTED", timestampMs: now });
    }
    this.prevOverclockActive = state.core.overclockActive;

    if (state.core.thermalThrottleMs > 0 && this.prevThermalThrottleMs <= 0) {
      eventBus.publish({ type: "OVERHEAT_THROTTLE", timestampMs: now });
    }
    this.prevThermalThrottleMs = state.core.thermalThrottleMs;

    // 5. Driver / Module Mount Facts
    state.upgrades.forEach((upg, id) => {
      const prevLvl = this.prevUpgradeLevels.get(id) ?? 0;
      if (upg.level > prevLvl) {
        eventBus.publish({
          type: "MODULE_MOUNTED",
          payload: { moduleId: id, level: upg.level },
          timestampMs: now,
        });
      }
      this.prevUpgradeLevels.set(id, upg.level);
    });

    // 6. Memory Saturation Facts
    if (state.saturation > 0.35) {
      eventBus.publish({
        type: "MEMORY_CORRUPTION_ELEVATED",
        payload: { saturation: state.saturation },
        timestampMs: now,
      });
    }

    // 7. System Heartbeat (Paced silence governor: 4s interval)
    if (now - this.lastHeartbeatMs > 4500 && state.phase === "playing") {
      this.lastHeartbeatMs = now;
      eventBus.publish({ type: "SYSTEM_HEARTBEAT_TICK", timestampMs: now });
    }
  }
}

export const runtimeEngine = new RuntimeEngine();
