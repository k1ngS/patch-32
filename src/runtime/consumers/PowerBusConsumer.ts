// ─────────────────────────────────────────────────────────────
// PATCH32 — PowerBusConsumer (Subscribes to facts -> Socket States)
// ─────────────────────────────────────────────────────────────

import { eventBus } from "../EventBus";
import type { RuntimeEvent } from "../RuntimeEvents";

export type ModuleSocketState = "LOCKED" | "UNMOUNTED" | "MOUNTED" | "STRESS";

class PowerBusConsumerStore {
  private socketStates: Map<string, ModuleSocketState> = new Map();
  private listeners: Set<() => void> = new Set();

  constructor() {
    eventBus.subscribe("*", (event) => this.handleEvent(event));
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  public getSocketState(moduleId: string, level: number): ModuleSocketState {
    if (level === 0) return "UNMOUNTED";
    return this.socketStates.get(moduleId) ?? "MOUNTED";
  }

  private handleEvent(event: RuntimeEvent): void {
    if (event.type === "MODULE_MOUNTED") {
      const modId = event.payload?.moduleId as string;
      if (modId) {
        this.socketStates.set(modId, "MOUNTED");
        this.listeners.forEach((cb) => cb());
      }
    } else if (event.type === "OVERHEAT_THROTTLE") {
      this.socketStates.forEach((_, key) => this.socketStates.set(key, "STRESS"));
      this.listeners.forEach((cb) => cb());
    }
  }
}

export const powerBusConsumer = new PowerBusConsumerStore();
