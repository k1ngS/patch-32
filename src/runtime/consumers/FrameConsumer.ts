// ─────────────────────────────────────────────────────────────
// PATCH32 — FrameConsumer (System States Observer & Publisher)
// ─────────────────────────────────────────────────────────────

import { eventBus } from "../EventBus";
import type { RuntimeEvent } from "../RuntimeEvents";

export type SystemStance =
  | "stable"
  | "under_load"
  | "critical"
  | "recovery"
  | "overclock"
  | "collapse";

// Alias MachineStance to SystemStance for backward compatibility
export type MachineStance = SystemStance;

class FrameConsumerStore {
  private stance: SystemStance = "stable";
  private healthState: "normal" | "low" | "critical" = "normal";
  private memoryElevated: boolean = false;
  private recoveryTimeout: ReturnType<typeof setTimeout> | null = null;
  private listeners: Set<() => void> = new Set();

  constructor() {
    eventBus.subscribe("*", (event) => this.handleEvent(event));
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  public getStance(): SystemStance {
    return this.stance;
  }

  private setStance(newStance: SystemStance): void {
    if (this.stance !== newStance) {
      this.stance = newStance;
      this.listeners.forEach((cb) => cb());
    }
  }

  private recomputeStance(): void {
    if (this.stance === "collapse" || this.stance === "overclock") {
      return;
    }

    if (this.healthState === "critical") {
      this.clearRecoveryTimeout();
      this.setStance("critical");
    } else if (this.healthState === "low" || this.memoryElevated) {
      this.clearRecoveryTimeout();
      this.setStance("under_load");
    } else {
      // System has normalized (health === "normal" && !memoryElevated)
      if (this.stance === "critical" || this.stance === "under_load") {
        this.setStance("recovery");
        this.clearRecoveryTimeout();
        this.recoveryTimeout = setTimeout(() => {
          this.setStance("stable");
        }, 500);
      } else if (this.stance !== "recovery") {
        this.setStance("stable");
      }
    }
  }

  private clearRecoveryTimeout(): void {
    if (this.recoveryTimeout) {
      clearTimeout(this.recoveryTimeout);
      this.recoveryTimeout = null;
    }
  }

  private handleEvent(event: RuntimeEvent): void {
    switch (event.type) {
      case "RUN_STARTED":
        this.healthState = "normal";
        this.memoryElevated = false;
        this.clearRecoveryTimeout();
        this.setStance("stable");
        break;

      case "RUN_GAMEOVER":
        this.clearRecoveryTimeout();
        this.setStance("collapse");
        break;

      case "OVERCLOCK_STARTED":
        this.clearRecoveryTimeout();
        this.setStance("overclock");
        break;

      case "CORE_HEALTH_CRITICAL":
        this.healthState = "critical";
        this.recomputeStance();
        break;

      case "CORE_HEALTH_LOW":
        this.healthState = "low";
        this.recomputeStance();
        break;

      case "CORE_HEALTH_NORMAL":
        this.healthState = "normal";
        this.memoryElevated = false; // Reset memory warning when core normalizes
        this.recomputeStance();
        break;

      case "MEMORY_CORRUPTION_ELEVATED":
        this.memoryElevated = true;
        this.recomputeStance();
        break;
    }
  }
}

export const frameConsumer = new FrameConsumerStore();
