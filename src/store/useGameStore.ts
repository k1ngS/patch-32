// ─────────────────────────────────────────────────────────────
// Patch_32 — Zustand Game Store
// ─────────────────────────────────────────────────────────────

import { create } from "zustand";
import {
  CABLE_BASE_TTL_MS,
  CABLE_EXTEND_SPEED,
  CABLE_LENGTHS,
  CABLE_RETRACT_SPEED,
  COMBO_MAX_MULTIPLIER,
  COMBO_MULTIPLIER_STEP,
  COMBO_WINDOW_MS,
  CORE_MAX_HEALTH,
  CORE_POS,
  DRONE_SPEEDS,
  DRONE_STUN_DURATION_MS,
  GAME_DURATION_MS,
  GRID_SIZE,
  INFECTION_TICK_RATE_MS,
  MAX_ACTIVE_CABLES,
  MAX_DELTA_MS,
  NEIGHBOR_BONUS_POINTS,
  OVERCLOCK_CONFIGS,
  PARASITE_CONFIGS,
  PHASE_CONFIGS,
  PURGE_PARASITE_DAMAGE,
  RHYTHM_PATTERN,
  SCORE_PER_CHAIN_NODE,
  SCORE_PER_PURGE,
  SHIELD_BUFF_CONFIG,
  SYNTHETIC_NEIGHBORS,
  UPGRADE_CONFIGS,
} from "@/constants/gameConfig";
import {
  applyInfectionsFromSpread,
  applySiegeBlocAuras,
  checkDroneParasiteCollision,
  createGrid,
  decayImmunityTimers,
  generateSpawnPosition,
  isBorderPosition,
  isInBounds,
  posToIndex,
  pulseWormInfections,
  resolveChainPurge,
  validateCableLink,
} from "@/services/gridEngine";
import type {
  CoreState,
  DataNode,
  Direction,
  Drone,
  GamePhase,
  GameState,
  GameStore,
  GridPosition,
  InputState,
  NeonCable,
  Parasite,
  ParasiteVariant,
  ScoreState,
  SpawnWave,
  UpgradeId,
  UpgradeLevel,
} from "@/types/game";

function createInitialState(): GameState {
  const upgrades = new Map<UpgradeId, UpgradeLevel>();
  for (const cfg of UPGRADE_CONFIGS) {
    upgrades.set(cfg.id, { id: cfg.id, level: 0, maxLevel: cfg.maxLevel });
  }

  return {
    phase: "boot",
    elapsedMs: 0,
    remainingMs: GAME_DURATION_MS,
    grid: createGrid(),
    drone: {
      worldPos: { x: CORE_POS.x, y: CORE_POS.y },
      gridPos: { x: CORE_POS.x, y: CORE_POS.y },
      targetPos: null,
      speed: DRONE_SPEEDS[0],
      state: "idle",
      stunTimerMs: 0,
      moveDir: { x: 0, y: 0 },
    },
    cables: [],
    parasites: [],
    core: {
      health: CORE_MAX_HEALTH,
      shieldPoints: 0,
      shieldDurationMs: 0,
      underAttack: false,
      overclockActive: false,
      overclockDurationMs: 0,
      overclockCooldownMs: 0,
    },
    score: {
      total: 0,
      multiplier: 1,
      comboCount: 0,
      comboTimerMs: 0,
      currency: 0,
      totalPurges: 0,
      longestChain: 0,
      parasitesLeaked: 0,
      neighborBonuses: 0,
    },
    upgrades,
    waves: [],
    nextParasiteId: 1,
    nextCableId: 1,
    infectionAccumulatorMs: 0,
    spawnAccumulatorMs: 0,
    input: {
      moveVector: { x: 0, y: 0 },
      linkHeld: false,
      linkJustPressed: false,
      linkJustReleased: false,
      overclockJustPressed: false,
    },
    activeEntityCount: 0,
    syntheticNeighborIndex: 0,
    syntheticNeighborTimerMs: 0,
  };
}

function getUpgradeLevel(
  upgrades: Map<UpgradeId, UpgradeLevel>,
  id: UpgradeId,
): number {
  return upgrades.get(id)?.level ?? 0;
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...createInitialState(),

  initGame: () => set({ ...createInitialState(), phase: "ready" }),
  startGame: () =>
    set((state) => (state.phase === "ready" ? { phase: "playing" } : {})),
  pauseGame: () =>
    set((state) => (state.phase === "playing" ? { phase: "paused" } : {})),
  resumeGame: () =>
    set((state) => (state.phase === "paused" ? { phase: "playing" } : {})),
  resetGame: () => set(createInitialState()),

  updateGameTick: (deltaMs: number) => {
    const state = get();
    if (state.phase !== "playing") return;

    const dt = Math.min(deltaMs, MAX_DELTA_MS);
    const newElapsed = state.elapsedMs + dt;
    const newRemaining = Math.max(0, GAME_DURATION_MS - newElapsed);

    if (newRemaining <= 0) {
      set({ phase: "victory", elapsedMs: newElapsed, remainingMs: 0 });
      return;
    }

    const drone = { ...state.drone };
    const core = { ...state.core };
    const score = { ...state.score };
    const grid = state.grid;
    let cables = state.cables;
    let parasites = state.parasites;
    let nextParasiteId = state.nextParasiteId;
    let nextCableId = state.nextCableId;
    let infectionAccumulatorMs = state.infectionAccumulatorMs;
    let spawnAcc = state.spawnAccumulatorMs + dt;
    const upgrades = state.upgrades;
    const input = state.input;

    // ── Synthetic Neighbor Loop
    let neighborTimer = state.syntheticNeighborTimerMs + dt;
    let neighborIndex = state.syntheticNeighborIndex;
    if (neighborTimer > 60000) {
      neighborTimer -= 60000;
      neighborIndex = (neighborIndex + 1) % SYNTHETIC_NEIGHBORS.length;
      score.neighborBonuses += NEIGHBOR_BONUS_POINTS; // Milestone generated
    }

    // ── Overclock
    const ocLevel = getUpgradeLevel(upgrades, "core_overclock");
    const ocConfig = OVERCLOCK_CONFIGS[ocLevel];
    if (core.overclockCooldownMs > 0) core.overclockCooldownMs -= dt;
    if (core.overclockDurationMs > 0) {
      core.overclockDurationMs -= dt;
      if (core.overclockDurationMs <= 0) core.overclockActive = false;
    }

    if (
      input.overclockJustPressed &&
      ocLevel > 0 &&
      core.overclockCooldownMs <= 0
    ) {
      core.overclockActive = true;
      core.overclockDurationMs = ocConfig.duration;
      core.overclockCooldownMs = ocConfig.cd;
      core.shieldPoints += ocConfig.hp;
      core.shieldDurationMs = Math.max(
        core.shieldDurationMs,
        ocConfig.duration,
      );
    }

    // ── Drone Movement
    if (drone.state === "stunned") {
      drone.stunTimerMs -= dt;
      if (drone.stunTimerMs <= 0) {
        drone.state = "idle";
        drone.stunTimerMs = 0;
      }
    }

    if (drone.state !== "stunned") {
      const moveX = input.moveVector.x;
      const moveY = input.moveVector.y;
      if (Math.abs(moveX) > 0.01 || Math.abs(moveY) > 0.01) {
        let droneSpeed = DRONE_SPEEDS[getUpgradeLevel(upgrades, "drone_speed")];
        droneSpeed = Math.min(20, droneSpeed); // hard cap 20
        const moveDist = droneSpeed * (dt / 1000);
        const len = Math.sqrt(moveX * moveX + moveY * moveY);
        let newX = drone.worldPos.x + (moveX / len) * moveDist;
        let newY = drone.worldPos.y + (moveY / len) * moveDist;

        newX = Math.max(0, Math.min(GRID_SIZE - 1, newX));
        newY = Math.max(0, Math.min(GRID_SIZE - 1, newY));

        drone.worldPos.x = newX;
        drone.worldPos.y = newY;
        drone.gridPos = { x: Math.round(newX), y: Math.round(newY) };
        drone.moveDir = { x: moveX / len, y: moveY / len };

        if (drone.state !== "linking") {
          drone.state = "moving";
        }
      } else {
        if (drone.state !== "linking") {
          drone.state = "idle";
        }
        drone.moveDir = { x: 0, y: 0 };
      }
    }

    // ── Cables
    const fireRateMult = core.overclockActive ? ocConfig.mult : 1.0;

    if (input.linkJustPressed && drone.state !== "stunned") {
      const active = cables.filter(
        (c) => c.state === "extending" || c.state === "active",
      ).length;
      if (
        active < MAX_ACTIVE_CABLES &&
        grid[posToIndex(drone.gridPos.x, drone.gridPos.y)].state === "clean"
      ) {
        cables.push({
          id: nextCableId++,
          sourcePos: { ...drone.gridPos },
          targetPos: null,
          state: "extending",
          progress: 0,
          length: 0,
          ttlMs: CABLE_BASE_TTL_MS,
          createdAtMs: newElapsed,
          isBorderLink: false,
        });
        drone.state = "linking";
      }
    }

    if (input.linkJustReleased && drone.state === "linking") {
      const ext = cables.find((c) => c.state === "extending");
      if (ext) {
        const val = validateCableLink(
          ext.sourcePos,
          drone.gridPos,
          grid,
          getUpgradeLevel(upgrades, "cable_length"),
          cables.filter((c) => c.state === "active").length,
          MAX_ACTIVE_CABLES,
        );

        if (val.valid) {
          ext.targetPos = { ...drone.gridPos };
          ext.state = "active";
          ext.progress = 1;
          ext.length = val.distance;
          ext.isBorderLink = val.isBorderLink;

          const targetIndex = posToIndex(drone.gridPos.x, drone.gridPos.y);
          const pRadius = getUpgradeLevel(upgrades, "purge_radius");
          const pResult = resolveChainPurge(
            targetIndex,
            grid,
            parasites,
            pRadius,
            val.isBorderLink,
          );

          if (pResult.cleansedIndices.length > 0) {
            const pts =
              SCORE_PER_PURGE +
              (pResult.cleansedIndices.length - 1) * SCORE_PER_CHAIN_NODE;
            score.currency += pResult.cleansedIndices.length * 2; // Assuming ~2 bits per node avg? "Bits currency"
            score.totalPurges += pResult.cleansedIndices.length;
            score.longestChain = Math.max(
              score.longestChain,
              pResult.chainLength,
            );

            score.comboCount++;
            score.comboTimerMs = COMBO_WINDOW_MS;
            score.multiplier = Math.min(
              COMBO_MAX_MULTIPLIER,
              1 + score.comboCount * COMBO_MULTIPLIER_STEP,
            );

            // Edge link neighbor bonus
            if (val.isBorderLink) {
              const keys = Object.keys(SHIELD_BUFF_CONFIG)
                .map(Number)
                .sort((a, b) => b - a);
              let comboKey = 1;
              for (const k of keys) {
                if (score.comboCount >= k) {
                  comboKey = k;
                  break;
                }
              }
              const buff =
                SHIELD_BUFF_CONFIG[comboKey as keyof typeof SHIELD_BUFF_CONFIG];
              core.shieldPoints += buff.hp;
              core.shieldDurationMs = Math.max(
                core.shieldDurationMs,
                buff.duration,
              );
            }

            score.total += pts * score.multiplier;
          }

          for (const pid of pResult.damagedParasiteIds) {
            const p = parasites.find((p) => p.id === pid);
            if (p) {
              p.hp -= PURGE_PARASITE_DAMAGE;
              if (p.hp <= 0) {
                p.markedForRemoval = true;
                score.currency += PARASITE_CONFIGS[p.variant].bitsDrop;
              }
            }
          }
          ext.state = "completed";
        } else {
          ext.state = "retracting";
        }
      }
      drone.state = "idle";
    }

    for (let i = cables.length - 1; i >= 0; i--) {
      const c = cables[i];
      if (c.state === "extending")
        c.progress = Math.min(
          1,
          c.progress + CABLE_EXTEND_SPEED * fireRateMult * (dt / 1000),
        );
      else if (c.state === "active") {
        c.ttlMs -= dt;
        if (c.ttlMs <= 0) c.state = "retracting";
      } else if (c.state === 'retracting') {
        c.progress -= CABLE_RETRACT_SPEED * (dt / 1000);
        if (c.progress <= 0) {
          c.progress = -1; // sentinel
        }
      }
      else if (c.state === 'completed') {
        c.ttlMs -= dt;
        if (c.ttlMs <= 0) c.state = 'retracting';
      }
    }

    for (let i = cables.length - 1; i >= 0; i--) {
      if (cables[i].progress < 0) {
        cables[i] = cables[cables.length - 1];
        cables.pop();
      }
    }

    // ── Phase & Spawning
    // Find current phase
    let currentPhase = PHASE_CONFIGS[3]; // default to 4
    let timeAccum = 0;
    for (let i = 0; i < PHASE_CONFIGS.length; i++) {
      timeAccum += PHASE_CONFIGS[i].duration;
      if (newElapsed <= timeAccum) {
        currentPhase = PHASE_CONFIGS[i];
        break;
      }
    }

    // Spawn logic based on rhythm (simplified interval check)
    // For a real rhythm we should track the spawn ticks, but time-based is fine.
    // Assuming `state.waves` is repurposed as the rhythm index or we can just pick probabilistically.
    while (spawnAcc >= currentPhase.spawnInterval) {
      spawnAcc -= currentPhase.spawnInterval;
      const spawns = Math.floor(currentPhase.spawnsPerInterval);
      const isExtra = Math.random() < currentPhase.spawnsPerInterval - spawns;
      const totalSpawns = spawns + (isExtra ? 1 : 0);

      for (let i = 0; i < totalSpawns; i++) {
        const r = Math.random();
        let variant: ParasiteVariant = "pulse_worm";
        if (r < currentPhase.composition.pulse_worm) variant = "pulse_worm";
        else if (
          r <
          currentPhase.composition.pulse_worm +
            currentPhase.composition.storm_flitter
        )
          variant = "storm_flitter";
        else variant = "siege_bloc";

        const br = Math.random();
        let edge: Direction = "N";
        let sum = 0;
        for (const [k, v] of Object.entries(currentPhase.borders)) {
          sum += v;
          if (br <= sum) {
            edge = k as Direction;
            break;
          }
        }

        const pos = generateSpawnPosition(edge);
        const config = PARASITE_CONFIGS[variant];
        parasites.push({
          id: nextParasiteId++,
          pos,
          moveDir: { x: 0, y: 0 },
          speed: config.speed,
          infectionPower: 1, // handled by engine now
          variant,
          hp: config.hp,
          markedForRemoval: false,
          ticksSincePulse: 0,
          ticksSinceMove: 0,
          diagIndex: 0,
          auraSpeedBuff: 0,
        });
      }
    }

    // ── Infection Tick (1 second interval generally)
    infectionAccumulatorMs += dt;
    if (infectionAccumulatorMs >= INFECTION_TICK_RATE_MS) {
      infectionAccumulatorMs -= INFECTION_TICK_RATE_MS;

      applySiegeBlocAuras(grid, parasites);
      applyInfectionsFromSpread(grid);
      pulseWormInfections(grid, parasites);

      // Parasite movement
      for (let i = 0; i < parasites.length; i++) {
        const p = parasites[i];
        if (p.markedForRemoval) continue;

        let moveAmount = 0;
        if (p.variant === "pulse_worm") {
          p.ticksSincePulse = (p.ticksSincePulse || 0) + 1;
          moveAmount = 1 + p.auraSpeedBuff;
        } else if (p.variant === "siege_bloc") {
          p.ticksSinceMove = (p.ticksSinceMove || 0) + 1;
          if (p.ticksSinceMove >= 2) {
            moveAmount = 1 + p.auraSpeedBuff;
            p.ticksSinceMove = 0;
          }
        } else if (p.variant === "storm_flitter") {
          moveAmount = 2 + p.auraSpeedBuff;
        }

        for (let step = 0; step < moveAmount; step++) {
          if (p.variant === 'storm_flitter') {
            const toCoreX = Math.sign(CORE_POS.x - p.pos.x);
            const toCoreY = Math.sign(CORE_POS.y - p.pos.y);
            const jitterX = Math.random() < 0.3 ? -toCoreX : toCoreX;
            const jitterY = Math.random() < 0.3 ? -toCoreY : toCoreY;
            const nx = p.pos.x + (jitterX || (Math.random() < 0.5 ? -1 : 1));
            const ny = p.pos.y + (jitterY || (Math.random() < 0.5 ? -1 : 1));
            p.pos = {
              x: Math.max(0, Math.min(GRID_SIZE - 1, nx)),
              y: Math.max(0, Math.min(GRID_SIZE - 1, ny)),
            };
          } else {
            // move toward core
            const dx = CORE_POS.x - p.pos.x;
            const dy = CORE_POS.y - p.pos.y;
            if (Math.abs(dx) > Math.abs(dy)) {
              p.pos = { x: p.pos.x + Math.sign(dx), y: p.pos.y };
            } else if (dy !== 0) {
              p.pos = { x: p.pos.x, y: p.pos.y + Math.sign(dy) };
            }
          }

          if (p.pos.x === CORE_POS.x && p.pos.y === CORE_POS.y) {
            core.health -= PARASITE_CONFIGS[p.variant].coreDamage;
            p.markedForRemoval = true;
            score.parasitesLeaked++;
            break;
          }
        }
      }
    }

    decayImmunityTimers(grid, dt);

    if (core.shieldDurationMs > 0) {
      core.shieldDurationMs -= dt;
      if (core.shieldDurationMs <= 0) {
        core.shieldPoints = 0;
      }
    }

    if (drone.state !== "stunned") {
      const colId = checkDroneParasiteCollision(drone.gridPos, parasites);
      if (colId >= 0) {
        drone.state = "stunned";
        drone.stunTimerMs = DRONE_STUN_DURATION_MS;
        for (let c = cables.length - 1; c >= 0; c--) {
          if (cables[c].state === "extending") cables[c].state = "retracting";
        }
      }
    }

    for (let i = parasites.length - 1; i >= 0; i--) {
      if (parasites[i].markedForRemoval) {
        parasites[i] = parasites[parasites.length - 1];
        parasites.pop();
      }
    }

    if (score.comboTimerMs > 0) {
      score.comboTimerMs -= dt;
      if (score.comboTimerMs <= 0) {
        score.comboCount = 0;
        score.multiplier = 1;
        score.comboTimerMs = 0;
      }
    }

    cables = cables.slice();
    parasites = parasites.slice();

    if (core.health <= 0) {
      core.health = 0;
      set({
        phase: 'gameover',
        elapsedMs: newElapsed,
        remainingMs: newRemaining,
        drone,
        core,
        score,
        cables,
        parasites,
        nextParasiteId,
        nextCableId,
        infectionAccumulatorMs,
        spawnAccumulatorMs: spawnAcc,
        activeEntityCount: parasites.length + cables.length,
        syntheticNeighborIndex: neighborIndex,
        syntheticNeighborTimerMs: neighborTimer,
        input: {
          ...input,
          linkJustPressed: false,
          linkJustReleased: false,
          overclockJustPressed: false,
        }
      });
      return;
    }

    set({
      elapsedMs: newElapsed,
      remainingMs: newRemaining,
      drone,
      core,
      score,
      cables,
      parasites,
      nextParasiteId,
      nextCableId,
      infectionAccumulatorMs,
      spawnAccumulatorMs: spawnAcc,
      activeEntityCount: parasites.length + cables.length,
      syntheticNeighborIndex: neighborIndex,
      syntheticNeighborTimerMs: neighborTimer,
      input: {
        ...input,
        linkJustPressed: false,
        linkJustReleased: false,
        overclockJustPressed: false,
      }
    });
  },

  setMoveVector: (x, y) =>
    set((s) => ({ input: { ...s.input, moveVector: { x, y } } })),
  setLinkHeld: (held) => set(s => {
    const wasHeld = s.input.linkHeld;
    return {
      input: {
        ...s.input,
        linkHeld: held,
        linkJustPressed: s.input.linkJustPressed || (held && !wasHeld),
        linkJustReleased: s.input.linkJustReleased || (!held && wasHeld),
      }
    };
  }),
  setOverclockPressed: () =>
    set((s) => ({ input: { ...s.input, overclockJustPressed: true } })),
  processInputEdges: () =>
    set((s) => ({
      input: {
        ...s.input,
        linkJustPressed: false,
        linkJustReleased: false,
        overclockJustPressed: false,
      },
    })),

  moveDrone: () => {},
  snapDroneToGrid: () =>
    set((s) => ({ drone: { ...s.drone, worldPos: { ...s.drone.gridPos } } })),
  initiateCable: () => {},
  completeCable: () => {},
  cancelCable: () =>
    set((s) => ({
      cables: s.cables.map((c) =>
        c.state === "extending" ? { ...c, state: "retracting" } : c,
      ),
      drone: {
        ...s.drone,
        state: s.drone.state === "linking" ? "idle" : s.drone.state,
      },
    })),
  updateCables: () => {},
  tickInfection: () => {},
  spawnParasites: () => {},
  updateParasites: () => {},
  removeDeadParasites: () => {},
  resolvePurge: () => {},

  purchaseUpgrade: (id: UpgradeId) => {
    const s = get();
    const upg = s.upgrades.get(id);
    if (!upg || upg.level >= upg.maxLevel) return false;

    const cost = UPGRADE_CONFIGS.find((c) => c.id === id)!.costs[upg.level];
    if (s.score.currency < cost) return false;

    const newUpgrades = new Map(s.upgrades);
    newUpgrades.set(id, { ...upg, level: upg.level + 1 });

    set({
      upgrades: newUpgrades,
      score: { ...s.score, currency: s.score.currency - cost },
    });
    return true;
  },

  addScore: (pts) =>
    set((s) => ({ score: { ...s.score, total: s.score.total + pts } })),
  updateCombo: () => {},
}));
