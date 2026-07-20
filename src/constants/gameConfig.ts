// ─────────────────────────────────────────────────────────────
// Patch_32 — Gameplay Configuration
// ─────────────────────────────────────────────────────────────

import type { Direction, ParasiteVariant, UpgradeId } from '@/types/game';

// ── Grid ────────────────────────────────────────────────────
export const GRID_SIZE = 32;
export const TILE_SIZE = 24;
export const CANVAS_SIZE = GRID_SIZE * TILE_SIZE;
export const CORE_POS = { x: 16, y: 16 } as const;

// ── Timing ──────────────────────────────────────────────────
export const GAME_DURATION_S = 180;
export const GAME_DURATION_MS = GAME_DURATION_S * 1000;
export const TARGET_FRAME_MS = 1000 / 60;
export const MAX_DELTA_MS = 50;

// ── Drone ───────────────────────────────────────────────────
export const DRONE_SPEEDS = [4, 6, 9, 13, 18]; // T0 to T4
export const DRONE_STUN_DURATION_MS = 800;
export const DRONE_SNAP_THRESHOLD = 0.15;

// ── Neon Cables ─────────────────────────────────────────────
export const CABLE_LENGTHS = [8, 11, 14, 17, 22]; // T0 to T4
export const CABLE_BASE_TTL_MS = 4000;
export const CABLE_EXTEND_SPEED = 2.5;
export const CABLE_RETRACT_SPEED = 4.0;
export const MAX_ACTIVE_CABLES = 3;

// ── Emitter Nodes ─────────────────────────────────────────
export const EMITTER_COST = 15;
export const EMITTER_FIRST_FREE = 1;
export const MAX_EMITTERS = 6;
export const EMITTER_COOLDOWN_MS = 1200;
export const EMITTER_BOOT_MS = 5000;
export const VISUAL_EVENT_TTL_MS = 500;

// ── Auto-Cable Animations ─────────────────────────────────
export const AUTO_CABLE_EXTEND_MS = 100;
export const AUTO_CABLE_ACTIVE_MS = 100;
export const AUTO_CABLE_RETRACT_MS = 100;

// ── Infection Engine ────────────────────────────────────────
export const INFECTION_TICK_RATE_MS = 1000; // 1 tick = 1 second for enemies moving 1 cell/tick
export const INFECTION_PRESSURE_PER_NEIGHBOR = 0.25;
export const UNSTABLE_THRESHOLD = 0.4;
export const CORRUPTED_THRESHOLD = 0.85;
export const INFECTION_DECAY_RATE = 0.05;
export const PURGE_IMMUNITY_MS = 3000;
export const INFECTION_USE_8_CONNECTED = false;

// ── Core ────────────────────────────────────────────────────
export const CORE_MAX_HEALTH = 2000;

// ── Chain Reaction / Purge ──────────────────────────────────
export const PURGE_RADIUSES = [1, 2, 3, 4, 6]; // T0 to T4
export const PURGE_CHAIN_BASE_PROBABILITIES = [0, 0.25, 0.50, 0.75, 1.0]; // T0 to T4
export const PURGE_CHAIN_DECAY_PER_CELL = 0.30;
export const PURGE_PARASITE_DAMAGE = 50; // Instakill most except siege bloc which needs 2 or overclock

// ── Scoring & Economy ───────────────────────────────────────
export const SCORE_PER_PURGE = 10;
export const SCORE_PER_CHAIN_NODE = 15;
export const COMBO_WINDOW_MS = 3000;
export const COMBO_MULTIPLIER_STEP = 0.25;
export const COMBO_MAX_MULTIPLIER = 5.0;

export const SHIELD_BUFF_CONFIG = {
  1: { hp: 50, duration: 10000 },
  2: { hp: 100, duration: 12000 },
  3: { hp: 175, duration: 14000 },
  5: { hp: 300, duration: 18000 }, // x5+
} as const;

export const SYNTHETIC_NEIGHBORS = ['NODE42', 'VOIDREACH', 'COREBLEED'];
export const NEIGHBOR_BONUS_POINTS = 5;

// ── Upgrades ────────────────────────────────────────────────
export interface UpgradeConfig {
  readonly id: UpgradeId;
  readonly maxLevel: number;
  readonly costs: number[];
}

export const UPGRADE_CONFIGS: readonly UpgradeConfig[] = [
  { id: 'drone_speed', maxLevel: 4, costs: [15, 40, 90, 200] },
  { id: 'cable_length', maxLevel: 4, costs: [15, 40, 90, 200] },
  { id: 'purge_radius', maxLevel: 4, costs: [15, 40, 90, 200] },
  { id: 'core_overclock', maxLevel: 4, costs: [15, 40, 90, 200] },
  { id: 'overclock_dampener', maxLevel: 1, costs: [250] },
  { id: 'bit_scavenger', maxLevel: 3, costs: [50, 120, 250] },
  { id: 'shield_buffer', maxLevel: 3, costs: [30, 80, 150] },
  { id: 'targeting_subroutines', maxLevel: 2, costs: [100, 250] },
];

export const OVERCLOCK_CONFIGS = [
  { hp: 0, mult: 1.0, duration: 0, cd: 0 },
  { hp: 50, mult: 1.25, duration: 3000, cd: 30000 },
  { hp: 100, mult: 1.35, duration: 4000, cd: 28000 },
  { hp: 150, mult: 1.50, duration: 5000, cd: 25000 },
  { hp: 250, mult: 1.75, duration: 6000, cd: 20000 },
];

// ── Parasite Stats ──────────────────────────────────────────
export interface ParasiteConfig {
  readonly variant: ParasiteVariant;
  readonly speed: number;         // ticks per movement
  readonly hp: number;
  readonly bitsDrop: number;
  readonly coreDamage: number;
}

export const PARASITE_CONFIGS: Record<ParasiteVariant, ParasiteConfig> = {
  pulse_worm: { variant: 'pulse_worm', speed: 1, hp: 30, bitsDrop: 1, coreDamage: 10 },
  siege_bloc: { variant: 'siege_bloc', speed: 2, hp: 80, bitsDrop: 6, coreDamage: 35 },
  storm_flitter: { variant: 'storm_flitter', speed: 0.5, hp: 20, bitsDrop: 2, coreDamage: 5 },
};

// ── Spawn System Data ───────────────────────────────────────
export const RHYTHM_PATTERN: Direction[] = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

export const SECTOR_CONFIGS = [
  // Sector 01: Root (0-60s)
  {
    duration: 60000,
    spawnInterval: 2500,
    spawnsPerInterval: 1,
    composition: { pulse_worm: 0.8, storm_flitter: 0.2, siege_bloc: 0 },
    borders: { N: 0.25, E: 0.25, S: 0.25, W: 0.25, NE: 0, SE: 0, SW: 0, NW: 0 }
  },
  // Sector 02: Cache (60-120s) - Dead memory is injected at start of this sector
  {
    duration: 60000,
    spawnInterval: 1500,
    spawnsPerInterval: 1.2,
    composition: { pulse_worm: 0.55, storm_flitter: 0.25, siege_bloc: 0.20 },
    borders: { N: 0.35, E: 0.25, S: 0.25, W: 0.15, NE: 0, SE: 0, SW: 0, NW: 0 }
  },
  // Sector 03: Gateway (120-180s) - Aggressive spawn
  {
    duration: 60000,
    spawnInterval: 800,
    spawnsPerInterval: 1.5,
    composition: { pulse_worm: 0.25, storm_flitter: 0.35, siege_bloc: 0.40 },
    borders: { N: 0.125, E: 0.125, S: 0.125, W: 0.125, NE: 0.125, SE: 0.125, SW: 0.125, NW: 0.125 } 
  }
];
