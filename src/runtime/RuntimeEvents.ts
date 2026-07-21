// ─────────────────────────────────────────────────────────────
// PATCH32 — Immutable System Facts (RuntimeEvents)
// ─────────────────────────────────────────────────────────────

export type RuntimeEventType =
  | "RUN_STARTED"
  | "RUN_GAMEOVER"
  | "RUN_VICTORY"
  | "SECTOR_CHANGED"
  | "CORE_HEALTH_NORMAL"
  | "CORE_HEALTH_LOW"
  | "CORE_HEALTH_CRITICAL"
  | "CORE_BREACH_IMPACT"
  | "MEMORY_CORRUPTION_ELEVATED"
  | "OVERCLOCK_STARTED"
  | "OVERHEAT_THROTTLE"
  | "OVERCLOCK_COOLDOWN_COMPLETE"
  | "MODULE_MOUNTED"
  | "PURGE_EXECUTED"
  | "SYSTEM_HEARTBEAT_TICK";

export interface RuntimeEvent {
  type: RuntimeEventType;
  payload?: Record<string, unknown>;
  timestampMs: number;
}
