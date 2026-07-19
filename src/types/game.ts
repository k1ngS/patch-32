// ─────────────────────────────────────────────────────────────
// Patch_32 — Core Type Definitions
// ─────────────────────────────────────────────────────────────

export interface GridPosition {
  readonly x: number;
  readonly y: number;
}

export interface WorldPosition {
  x: number;
  y: number;
}

export type Direction = "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW";
export type CardinalDirection = "N" | "E" | "S" | "W";

export type NodeState = "clean" | "unstable" | "corrupted";

export interface DataNode {
  readonly pos: GridPosition;
  state: NodeState;
  infectionLevel: number;
  purgeImmunityMs: number;
  readonly isBorderNode: boolean;
  readonly isCoreNode: boolean;
  stabilityWeight: number;
  // Aura buff applied by Siege Blocs
  auraSpreadBuff: number;
}

export type DroneState = "idle" | "moving" | "linking" | "stunned";

export interface Drone {
  worldPos: WorldPosition;
  gridPos: GridPosition;
  targetPos: GridPosition | null;
  speed: number;
  state: DroneState;
  stunTimerMs: number;
  moveDir: WorldPosition;
}

export type CableState = "extending" | "active" | "retracting" | "completed";

export interface NeonCable {
  readonly id: number;
  readonly sourcePos: GridPosition;
  targetPos: GridPosition | null;
  state: CableState;
  progress: number;
  length: number;
  ttlMs: number;
  readonly createdAtMs: number;
  isBorderLink: boolean;
}

export type ParasiteVariant = "pulse_worm" | "siege_bloc" | "storm_flitter";

export interface Parasite {
  readonly id: number;
  pos: GridPosition;
  moveDir: WorldPosition;
  speed: number;
  infectionPower: number;
  readonly variant: ParasiteVariant;
  hp: number;
  markedForRemoval: boolean;

  // Specific behaviors
  ticksSincePulse?: number; // for pulse_worm
  ticksSinceMove?: number; // for siege_bloc
  diagIndex?: number; // for storm_flitter (0:NW, 1:NE, 2:SW, 3:SE)

  // Buffs
  auraSpeedBuff: number;
}

export interface CoreState {
  health: number;
  shieldPoints: number;
  shieldDurationMs: number;
  underAttack: boolean;
  // Overclock
  overclockActive: boolean;
  overclockDurationMs: number;
  overclockCooldownMs: number;
}

export interface ScoreState {
  total: number;
  multiplier: number;
  comboCount: number;
  comboTimerMs: number;
  currency: number; // Bits
  totalPurges: number;
  longestChain: number;
  parasitesLeaked: number; // for final score calculation
  neighborBonuses: number;
}

export type UpgradeId =
  | "drone_speed"
  | "cable_length"
  | "purge_radius"
  | "core_overclock";

export interface UpgradeLevel {
  readonly id: UpgradeId;
  level: number;
  readonly maxLevel: number;
}

export interface SpawnWave {
  readonly triggerAtMs: number;
  readonly count: number;
  readonly variant: ParasiteVariant;
  readonly spawnEdge: CardinalDirection | null;
  dispatched: boolean;
}

export interface InputState {
  moveVector: WorldPosition;
  linkHeld: boolean;
  linkJustPressed: boolean;
  linkJustReleased: boolean;
  overclockJustPressed: boolean;
}

export type GamePhase =
  | "boot"
  | "ready"
  | "playing"
  | "paused"
  | "victory"
  | "gameover";

export interface GameState {
  phase: GamePhase;
  elapsedMs: number;
  remainingMs: number;
  grid: DataNode[];
  drone: Drone;
  cables: NeonCable[];
  parasites: Parasite[];
  core: CoreState;
  score: ScoreState;
  upgrades: Map<UpgradeId, UpgradeLevel>;
  waves: SpawnWave[];
  nextParasiteId: number;
  nextCableId: number;
  infectionAccumulatorMs: number;
  input: InputState;
  activeEntityCount: number;
  syntheticNeighborIndex: number;
  syntheticNeighborTimerMs: number;
  spawnAccumulatorMs: number;
}

export interface GameActions {
  initGame: () => void;
  startGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  resetGame: () => void;
  updateGameTick: (deltaMs: number) => void;
  setMoveVector: (x: number, y: number) => void;
  setLinkHeld: (held: boolean) => void;
  setOverclockPressed: () => void;
  processInputEdges: () => void;
  moveDrone: (deltaMs: number) => void;
  snapDroneToGrid: () => void;
  initiateCable: () => void;
  completeCable: () => void;
  cancelCable: () => void;
  updateCables: (deltaMs: number) => void;
  tickInfection: () => void;
  spawnParasites: (wave: SpawnWave) => void;
  updateParasites: (deltaMs: number) => void;
  removeDeadParasites: () => void;
  resolvePurge: (cableId: number) => void;
  purchaseUpgrade: (id: UpgradeId) => boolean;
  addScore: (points: number) => void;
  updateCombo: (deltaMs: number) => void;
}

export type GameStore = GameState & GameActions;
