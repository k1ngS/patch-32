// ─────────────────────────────────────────────────────────────
// PATCH32 — FrameConsumer (Subscribes to facts -> Chassis Stance)
// ─────────────────────────────────────────────────────────────

import { eventBus } from "../EventBus";
import type { RuntimeEvent } from "../RuntimeEvents";

export type MachineStance = "nominal" | "anxious" | "overclock" | "collapse";

class FrameConsumerStore {
  private stance: MachineStance = "nominal";
  private listeners: Set<() => void> = new Set();

  constructor() {
    eventBus.subscribe("*", (event) => this.handleEvent(event));
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  public getStance(): MachineStance {
    return this.stance;
  }

  private setStance(newStance: MachineStance): void {
    if (this.stance !== newStance) {
      this.stance = newStance;
      this.listeners.forEach((cb) => cb());
    }
  }

  private handleEvent(event: RuntimeEvent): void {
    switch (event.type) {
      case "RUN_GAMEOVER":
        this.setStance("collapse");
        break;
      case "OVERCLOCK_STARTED":
        this.setStance("overclock");
        break;
      case "CORE_HEALTH_CRITICAL":
      case "CORE_HEALTH_LOW":
      case "MEMORY_CORRUPTION_ELEVATED":
        if (this.stance !== "collapse" && this.stance !== "overclock") {
          this.setStance("anxious");
        }
        break;
      case "CORE_HEALTH_NORMAL":
        if (this.stance !== "collapse" && this.stance !== "overclock") {
          this.setStance("nominal");
        }
        break;
    }
  }
}

export const frameConsumer = new FrameConsumerStore();
