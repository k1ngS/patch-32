// ─────────────────────────────────────────────────────────────
// PATCH32 — EventBus (Pub/Sub System Facts Bus)
// ─────────────────────────────────────────────────────────────

import type { RuntimeEvent, RuntimeEventType } from "./RuntimeEvents";

type EventCallback = (event: RuntimeEvent) => void;

class EventBus {
  private listeners: Map<RuntimeEventType | "*", Set<EventCallback>> = new Map();

  public subscribe(eventType: RuntimeEventType | "*", callback: EventCallback): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);

    // Return unsubscribe cleanup function
    return () => {
      this.listeners.get(eventType)?.delete(callback);
    };
  }

  public publish(event: RuntimeEvent): void {
    // Specific listeners
    const specific = this.listeners.get(event.type);
    if (specific) {
      specific.forEach((cb) => cb(event));
    }
    // Wildcard listeners
    const wildcard = this.listeners.get("*");
    if (wildcard) {
      wildcard.forEach((cb) => cb(event));
    }
  }
}

export const eventBus = new EventBus();
