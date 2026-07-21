// ─────────────────────────────────────────────────────────────
// PATCH32 — ConsoleConsumer (Subscribes to facts -> formats logs)
// ─────────────────────────────────────────────────────────────

import { eventBus } from "../EventBus";
import type { RuntimeEvent } from "../RuntimeEvents";

export interface LogEntry {
  id: number;
  timeMs: number;
  type: "PURGE" | "CHAIN" | "PATCH" | "BREACH" | "HALT" | "INFO";
  message: string;
}

class ConsoleConsumerStore {
  private logs: LogEntry[] = [];
  private nextId: number = 1;
  private listeners: Set<() => void> = new Set();
  private recentMessages: Set<string> = new Set();

  constructor() {
    eventBus.subscribe("*", (event) => this.handleEvent(event));
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  public getLogs(): LogEntry[] {
    return this.logs;
  }

  private notify(): void {
    this.listeners.forEach((cb) => cb());
  }

  private pushLog(type: LogEntry["type"], message: string, timeMs: number): void {
    if (this.recentMessages.has(message)) return; // Ring buffer deduplication

    this.logs.push({ id: this.nextId++, timeMs, type, message });
    if (this.logs.length > 30) this.logs.shift();

    this.recentMessages.add(message);
    if (this.recentMessages.size > 15) {
      const first = Array.from(this.recentMessages)[0];
      this.recentMessages.delete(first);
    }

    this.notify();
  }

  private handleEvent(event: RuntimeEvent): void {
    const t = event.timestampMs;

    switch (event.type) {
      case "RUN_STARTED":
        this.pushLog("INFO", "[BOOT] // KERNEL RUNTIME INITIALIZED", t);
        break;
      case "SECTOR_CHANGED":
        const sec = (event.payload?.sectorIndex as number ?? 0) + 1;
        this.pushLog("INFO", `[SECTOR] // ISOLATION SECTOR 0${sec} ACTIVE`, t);
        break;
      case "CORE_HEALTH_LOW":
        this.pushLog("BREACH", "[WARN] // CONTAINMENT INTEGRITY DEGRADING // Kernel latency detected...", t);
        break;
      case "CORE_HEALTH_CRITICAL":
        this.pushLog("BREACH", "[ALERT] // CRITICAL KERNEL INTEGRITY FAILURE // System in Critical state", t);
        break;
      case "CORE_HEALTH_NORMAL":
        this.pushLog("PATCH", "[SYS_RECOVERY] // KERNEL PRESSURE STABILIZED // System restored to Stable", t);
        break;
      case "OVERCLOCK_STARTED":
        this.pushLog("PATCH", "[POWER] // EMERGENCY OVERRIDE ENGAGED", t);
        break;
      case "OVERHEAT_THROTTLE":
        this.pushLog("HALT", "[HALT] // THERMAL PROTECTION THROTTLE ENGAGED", t);
        break;
      case "MODULE_MOUNTED":
        const modId = (event.payload?.moduleId as string ?? "MOD").toUpperCase();
        this.pushLog("PATCH", `[DRIVER] // HARDWARE ${modId} MOUNTED // BUS OK`, t);
        break;
      case "MEMORY_CORRUPTION_ELEVATED":
        this.pushLog("BREACH", "[MEM_AUDIT] // ELEVATED CORRUPTION DETECTED // Memory pressure increasing...", t);
        break;
      case "SYSTEM_HEARTBEAT_TICK":
        const heartLogs = [
          "[SCAN] // SECTOR PERIMETER STABLE",
          "[MEM_AUDIT] // PAGE TABLES VERIFIED",
          "[DIAG] // THERMAL MATRIX NOMINAL",
          "[WATCHDOG] // SUBSYSTEMS RESPONSIVE",
        ];
        const randomMsg = heartLogs[Math.floor(Math.random() * heartLogs.length)];
        this.pushLog("INFO", randomMsg, t);
        break;
    }
  }
}

export const consoleConsumer = new ConsoleConsumerStore();
