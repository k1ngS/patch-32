// ─────────────────────────────────────────────────────────────
// Patch_32 — Grid Engine (Stateless Service)
// ─────────────────────────────────────────────────────────────

import type {
  GridPosition,
  DataNode,
  NodeState,
  NeonCable,
  Parasite,
  CoreState,
  Direction,
} from '@/types/game';

import {
  GRID_SIZE,
  CORE_POS,
  CABLE_LENGTHS,
  INFECTION_PRESSURE_PER_NEIGHBOR,
  UNSTABLE_THRESHOLD,
  CORRUPTED_THRESHOLD,
  INFECTION_DECAY_RATE,
  INFECTION_USE_8_CONNECTED,
  PURGE_RADIUSES,
  PURGE_CHAIN_BASE_PROBABILITIES,
  PURGE_CHAIN_DECAY_PER_CELL,
  PURGE_IMMUNITY_MS,
  PURGE_PARASITE_DAMAGE,
} from '@/constants/gameConfig';

// ── Pre-computed Neighbor Offset Tables
const CARDINAL_OFFSETS: readonly [number, number][] = [
  [0, -1], [1, 0], [0, 1], [-1, 0],
];

const ALL_OFFSETS: readonly [number, number][] = [
  [0, -1], [1, -1], [1, 0], [1, 1],
  [0, 1], [-1, 1], [-1, 0], [-1, -1],
];

const NEIGHBOR_OFFSETS = INFECTION_USE_8_CONNECTED ? ALL_OFFSETS : CARDINAL_OFFSETS;

export function posToIndex(x: number, y: number): number {
  return y * GRID_SIZE + x;
}

export function indexToPos(index: number): GridPosition {
  return {
    x: index % GRID_SIZE,
    y: (index / GRID_SIZE) | 0,
  };
}

export function isInBounds(x: number, y: number): boolean {
  return x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE;
}

export function manhattanDistance(a: GridPosition, b: GridPosition): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function chebyshevDistance(a: GridPosition, b: GridPosition): number {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

// Any edge cell triggers neighbor plot synergy
export function isBorderPosition(x: number, y: number): boolean {
  return x === 0 || x === GRID_SIZE - 1 || y === 0 || y === GRID_SIZE - 1;
}

export function isCorePosition(x: number, y: number): boolean {
  return x === CORE_POS.x && y === CORE_POS.y;
}

export function getNeighborIndices(x: number, y: number, outIndices: number[]): number {
  let count = 0;
  for (let i = 0; i < NEIGHBOR_OFFSETS.length; i++) {
    const nx = x + NEIGHBOR_OFFSETS[i][0];
    const ny = y + NEIGHBOR_OFFSETS[i][1];
    if (isInBounds(nx, ny)) {
      outIndices[count++] = posToIndex(nx, ny);
    }
  }
  return count;
}

export function createGrid(): DataNode[] {
  const grid: DataNode[] = new Array(GRID_SIZE * GRID_SIZE);
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const index = posToIndex(x, y);
      grid[index] = {
        pos: { x, y },
        state: 'clean',
        infectionLevel: 0,
        purgeImmunityMs: 0,
        isBorderNode: isBorderPosition(x, y),
        isCoreNode: isCorePosition(x, y),
        isDeadMemory: false,
        stabilityWeight: isCorePosition(x, y) ? 5.0 : 1.0,
        auraSpreadBuff: 0,
      };
    }
  }
  return grid;
}

export interface CableValidationResult {
  valid: boolean;
  reason: string;
  distance: number;
  isBorderLink: boolean;
}

export function validateCableLink(
  source: GridPosition,
  target: GridPosition,
  grid: readonly DataNode[],
  cableLengthUpgradeLevel: number,
  activeCableCount: number,
  maxActiveCables: number,
): CableValidationResult {
  const fail = (reason: string) => ({ valid: false, reason, distance: 0, isBorderLink: false });

  if (!isInBounds(source.x, source.y) || !isInBounds(target.x, target.y)) {
    return fail('Out of bounds.');
  }

  if (source.x === target.x && source.y === target.y) {
    return fail('Cannot self link.');
  }

  if (activeCableCount >= maxActiveCables) {
    return fail('Max cables reached.');
  }

  const sourceNode = grid[posToIndex(source.x, source.y)];
  const targetNode = grid[posToIndex(target.x, target.y)];

  if (sourceNode.state !== 'clean') {
    return fail('Source must be clean.');
  }

  const isBorder = isBorderPosition(target.x, target.y);
  if (targetNode.state === 'clean' && !isBorder) {
    return fail('Target must be unstable/corrupted or border edge.');
  }

  const dist = manhattanDistance(source, target);
  const maxLen = CABLE_LENGTHS[cableLengthUpgradeLevel];

  if (dist > maxLen) {
    return fail('Exceeds max length.');
  }

  return { valid: true, reason: 'OK', distance: dist, isBorderLink: isBorder };
}

// ── Pulse Worm / Siege Bloc Logic ───────────────────────────

export function applySiegeBlocAuras(grid: DataNode[], parasites: Parasite[]): void {
  // Reset buffs
  for (let i = 0; i < grid.length; i++) grid[i].auraSpreadBuff = 0;
  for (let i = 0; i < parasites.length; i++) parasites[i].auraSpeedBuff = 0;

  // Apply aura (1-cell radius Chebyshev)
  for (let i = 0; i < parasites.length; i++) {
    const p = parasites[i];
    if (p.variant === 'siege_bloc' && !p.markedForRemoval) {
      // Buff nearby parasites
      for (let j = 0; j < parasites.length; j++) {
        if (i !== j && !parasites[j].markedForRemoval) {
          if (chebyshevDistance(p.pos, parasites[j].pos) <= 1) {
            parasites[j].auraSpeedBuff += 1; // +1 movement speed (wait, moves every 1 tick instead of 2? We'll handle this in store)
          }
        }
      }
      // Buff nearby corrupted nodes (increases spread range by 1)
      for (let y = Math.max(0, p.pos.y - 1); y <= Math.min(GRID_SIZE - 1, p.pos.y + 1); y++) {
        for (let x = Math.max(0, p.pos.x - 1); x <= Math.min(GRID_SIZE - 1, p.pos.x + 1); x++) {
          grid[posToIndex(x, y)].auraSpreadBuff += 1;
        }
      }
    }
  }
}

const _neighborScratch = new Array<number>(8);
const _pressureScratch = new Float32Array(GRID_SIZE * GRID_SIZE);

export interface InfectionMutation {
  index: number;
  newState: NodeState;
  newInfectionLevel: number;
}

export function computeInfectionTick(
  grid: readonly DataNode[],
): InfectionMutation[] {
  const mutations: InfectionMutation[] = [];

  for (let i = 0; i < grid.length; i++) {
    const node = grid[i];
    if (node.purgeImmunityMs > 0 || node.state === 'corrupted' || node.isCoreNode) continue;

    // A node receives pressure from corrupted neighbors.
    // Siege Bloc aura adds spread range to corrupted nodes, but standard is 1 cell (adjacent).
    // So if a corrupted node has auraSpreadBuff > 0, it reaches further.
    // To do this purely, it's easier to iterate from corrupted nodes outwards and accumulate pressure.
    // But since we want to avoid double-counting or allocating, we can just check distance.
    // Let's stick to the simple neighbor check for now, and handle aura spread:
    // If we iterate clean nodes, we'd have to search wider if there's an aura.
    // So let's flip it: we map pressure per node in a temporary array.
  }
  return []; // We'll do a better approach below for performance
}

export function applyInfectionsFromSpread(grid: DataNode[]): void {
  // Temporary array to hold pressure
  const pressures = _pressureScratch;
  pressures.fill(0);
  
  for (let i = 0; i < grid.length; i++) {
    const node = grid[i];
    if (node.state === 'corrupted') {
      const spreadRange = 1 + node.auraSpreadBuff; // 1 means adjacent, 2 means dist=2
      for (let dy = -spreadRange; dy <= spreadRange; dy++) {
        for (let dx = -spreadRange; dx <= spreadRange; dx++) {
          const nx = node.pos.x + dx;
          const ny = node.pos.y + dy;
          if (Math.abs(dx) + Math.abs(dy) <= spreadRange) { // Manhattan distance
            if (isInBounds(nx, ny) && (dx !== 0 || dy !== 0)) {
              pressures[posToIndex(nx, ny)] += INFECTION_PRESSURE_PER_NEIGHBOR;
            }
          }
        }
      }
    }
  }

  // Apply pressures
  for (let i = 0; i < grid.length; i++) {
    const node = grid[i];
    if (node.purgeImmunityMs > 0 || node.state === 'corrupted' || node.isCoreNode) continue;

    let newLevel = node.infectionLevel;
    if (pressures[i] > 0) {
      newLevel += pressures[i];
    } else if (node.state === 'clean' && newLevel > 0) {
      newLevel = Math.max(0, newLevel - INFECTION_DECAY_RATE);
    }
    newLevel = Math.min(1, Math.max(0, newLevel));

    let newState: 'clean' | 'unstable' | 'corrupted' = node.state;
    if (newLevel >= CORRUPTED_THRESHOLD) newState = 'corrupted';
    else if (newLevel >= UNSTABLE_THRESHOLD) newState = 'unstable';
    else newState = 'clean';

    node.state = newState;
    node.infectionLevel = newLevel;
  }
}

export function pulseWormInfections(grid: DataNode[], parasites: Parasite[]): void {
  for (let i = 0; i < parasites.length; i++) {
    const p = parasites[i];
    if (p.variant === 'pulse_worm' && !p.markedForRemoval) {
      if ((p.ticksSincePulse || 0) >= 3) {
        // Pulse 4 cardinal
        for (let o = 0; o < CARDINAL_OFFSETS.length; o++) {
          const nx = p.pos.x + CARDINAL_OFFSETS[o][0];
          const ny = p.pos.y + CARDINAL_OFFSETS[o][1];
          if (isInBounds(nx, ny)) {
            const idx = posToIndex(nx, ny);
            const n = grid[idx];
            if (n.purgeImmunityMs <= 0 && !n.isCoreNode && n.state !== 'corrupted') {
              n.infectionLevel += p.infectionPower;
              if (n.infectionLevel >= CORRUPTED_THRESHOLD) n.state = 'corrupted';
              else if (n.infectionLevel >= UNSTABLE_THRESHOLD) n.state = 'unstable';
            }
          }
        }
        p.ticksSincePulse = 0;
      }
    }
  }
}

// ── Chain Reaction Purge ────────────────────────────────────

export interface PurgeResult {
  cleansedIndices: number[];
  chainLength: number;
  isBorderLink: boolean;
  damagedParasiteIds: number[];
}

export function resolveChainPurge(
  targetIndex: number,
  grid: DataNode[],
  parasites: readonly Parasite[],
  purgeRadiusUpgradeLevel: number,
  isBorderLink: boolean,
  rng: () => number = Math.random,
): PurgeResult {
  const result: PurgeResult = {
    cleansedIndices: [],
    chainLength: 0,
    isBorderLink,
    damagedParasiteIds: [],
  };

  const targetNode = grid[targetIndex];
  const targetPos = targetNode.pos;
  const purgeRadius = PURGE_RADIUSES[purgeRadiusUpgradeLevel];
  const baseProb = PURGE_CHAIN_BASE_PROBABILITIES[purgeRadiusUpgradeLevel];

  const queue: [number, number][] = [[targetIndex, 0]];
  const visited = new Set<number>();
  visited.add(targetIndex);
  let queueHead = 0;

  while (queueHead < queue.length) {
    const [currentIndex, dist] = queue[queueHead++];
    const currentNode = grid[currentIndex];

    // Node can be cleansed if corrupted/unstable or if it's the edge target itself
    if (currentNode.state === 'corrupted' || currentNode.state === 'unstable' || dist === 0) {
      let probability = 1.0;
      if (dist > 0) {
        probability = Math.max(0, baseProb - (dist - 1) * PURGE_CHAIN_DECAY_PER_CELL);
      }

      if (rng() <= probability) {
        currentNode.state = 'clean';
        currentNode.infectionLevel = 0;
        currentNode.purgeImmunityMs = PURGE_IMMUNITY_MS;
        result.cleansedIndices.push(currentIndex);
        result.chainLength = Math.max(result.chainLength, dist + 1);
      }
    }

    if (dist < purgeRadius) {
      const neighborCount = getNeighborIndices(currentNode.pos.x, currentNode.pos.y, _neighborScratch);
      for (let n = 0; n < neighborCount; n++) {
        const ni = _neighborScratch[n];
        if (!visited.has(ni)) {
          visited.add(ni);
          queue.push([ni, dist + 1]);
        }
      }
    }
  }

  for (let p = 0; p < parasites.length; p++) {
    const parasite = parasites[p];
    if (parasite.markedForRemoval) continue;
    if (manhattanDistance(targetPos, parasite.pos) <= purgeRadius) {
      result.damagedParasiteIds.push(parasite.id);
    }
  }

  return result;
}

export function generateSpawnPosition(
  direction: Direction,
  rng: () => number = Math.random,
): GridPosition {
  const randomCoord = () => (rng() * (GRID_SIZE - 2) + 1) | 0;
  
  if (direction === 'N') return { x: randomCoord(), y: 0 };
  if (direction === 'S') return { x: randomCoord(), y: GRID_SIZE - 1 };
  if (direction === 'E') return { x: GRID_SIZE - 1, y: randomCoord() };
  if (direction === 'W') return { x: 0, y: randomCoord() };
  if (direction === 'NE') return { x: GRID_SIZE - 1, y: 0 };
  if (direction === 'NW') return { x: 0, y: 0 };
  if (direction === 'SE') return { x: GRID_SIZE - 1, y: GRID_SIZE - 1 };
  if (direction === 'SW') return { x: 0, y: GRID_SIZE - 1 };
  
  return { x: 0, y: 0 };
}

export function checkDroneParasiteCollision(
  droneGridPos: GridPosition,
  parasites: readonly Parasite[],
): number {
  for (let i = 0; i < parasites.length; i++) {
    const p = parasites[i];
    if (p.markedForRemoval) continue;
    if (p.pos.x === droneGridPos.x && p.pos.y === droneGridPos.y) return p.id;
  }
  return -1;
}

export function decayImmunityTimers(grid: DataNode[], deltaMs: number): void {
  for (let i = 0; i < grid.length; i++) {
    if (grid[i].purgeImmunityMs > 0) {
      grid[i].purgeImmunityMs = Math.max(0, grid[i].purgeImmunityMs - deltaMs);
    }
  }
}
