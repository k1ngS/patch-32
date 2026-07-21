// ─────────────────────────────────────────────────────────────
// Patch_32 — Zustand Game Store
// ─────────────────────────────────────────────────────────────

import { create } from "zustand";
import { audioEngine } from "@/utils/audioEngine";
import { runtimeEngine } from "@/runtime/RuntimeEngine";
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
  SECTOR_CONFIGS,
  PURGE_PARASITE_DAMAGE,
  RHYTHM_PATTERN,
  SCORE_PER_CHAIN_NODE,
  SCORE_PER_PURGE,
  SHIELD_BUFF_CONFIG,
  SYNTHETIC_NEIGHBORS,
  UPGRADE_CONFIGS,
  EMITTER_COST,
  EMITTER_FIRST_FREE,
  MAX_EMITTERS,
  EMITTER_COOLDOWN_MS,
  EMITTER_BOOT_MS,
  VISUAL_EVENT_TTL_MS,
  AUTO_CABLE_EXTEND_MS,
  AUTO_CABLE_ACTIVE_MS,
  AUTO_CABLE_RETRACT_MS,
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
  manhattanDistance,
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
  EmitterNode,
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
  VisualEvent,
} from "@/types/game";

function createInitialState(): GameState {
  const upgrades = new Map<UpgradeId, UpgradeLevel>();
  for (const cfg of UPGRADE_CONFIGS) {
    upgrades.set(cfg.id, { id: cfg.id, level: 0, maxLevel: cfg.maxLevel });
  }

  return {
    activeScreen: "menu",
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
      thermalThrottleMs: 0,
    },
    score: {
      total: 0,
      multiplier: 1,
      comboCount: 0,
      comboTimerMs: 0,
      currency: 0,
      displayedCurrency: 0,
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
    emitterNodes: [],
    visualEvents: [],
    nextEmitterId: 1,
    nextVisualEventId: 1,
    input: {
      moveVector: { x: 0, y: 0 },
      linkHeld: false,
      linkJustPressed: false,
      linkJustReleased: false,
      overclockJustPressed: false,
      pulseJustPressed: false,
    },
    activeEntityCount: 0,
    syntheticNeighborIndex: 0,
    syntheticNeighborTimerMs: 0,
    logs: [],
    nextLogId: 1,
    runId: Math.random().toString(16).slice(2, 8).toUpperCase(),
    trauma: 0,
    freezeFrames: 0,
    sector02Triggered: false,
    lastSectorChangeMs: 0,
    currentSectorIndex: 0,
    lastThrottleMs: 0,
    saturation: 0,
    firstKillDone: false,
    firstBitsTimeMs: -1,
    hasAppliedPatch: false,
    hasTriggeredLockEvent: false,
    isPrivilegeSuspended: false,
    isOverrideActive: false,
    osAlertBanner: null,
    osToastMessage: null,
    isInputLocked: false,
    inputLockRemainingMs: 0,
    sectorBanner: null,
    dronePulseCooldownMs: 0,
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

  setActiveScreen: (screen) => set({ activeScreen: screen }),
  initGame: () => set((state) => ({ ...createInitialState(), phase: "ready", hasAppliedPatch: state.hasAppliedPatch })),
  startGame: () =>
    set((state) => {
      if (state.phase === "ready") {
        audioEngine.init();
        audioEngine.playBgm();
        return { phase: "playing" };
      }
      return {};
    }),
  pauseGame: () =>
    set((state) => (state.phase === "playing" ? { phase: "paused" } : {})),
  resumeGame: () =>
    set((state) => (state.phase === "paused" ? { phase: "playing" } : {})),
  resetGame: () => set(createInitialState()),

  updateGameTick: (deltaMs: number) => {
    const state = get();
    if (state.phase !== "playing") return;

    let dt = Math.min(deltaMs, MAX_DELTA_MS);
    const realDt = dt;
    let freezeFrames = state.freezeFrames;
    let trauma = state.trauma;
    let lastSectorChangeMs = state.lastSectorChangeMs;
    let currentSectorIndex = state.currentSectorIndex;
    let lastThrottleMs = state.lastThrottleMs;

    if (freezeFrames > 0) {
      freezeFrames--;
      dt = 0;
    }
    trauma = Math.max(0, trauma - realDt * 0.0025);

    const newElapsed = state.elapsedMs + dt;
    const newRemaining = Math.max(0, GAME_DURATION_MS - newElapsed);

    if (newRemaining <= 0) {
      set({ activeScreen: "gameover", phase: "victory", elapsedMs: newElapsed, remainingMs: 0, hasAppliedPatch: true });
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
    let logs = state.logs.slice();
    let nextLogId = state.nextLogId;
    let firstKillDone = state.firstKillDone;
    let firstBitsTimeMs = state.firstBitsTimeMs;

    // Smooth bits increment
    if (score.displayedCurrency < score.currency) {
      score.displayedCurrency += (score.currency - score.displayedCurrency) * (dt / 100);
      if (score.currency - score.displayedCurrency < 0.5) {
        score.displayedCurrency = score.currency;
      }
    }

    const pushLog = (type: "PURGE" | "CHAIN" | "PATCH" | "BREACH" | "HALT", message: string) => {
      logs.push({ id: nextLogId++, timeMs: newElapsed, type, message });
      if (logs.length > 30) logs.shift();
    };

    // ── Global Saturation Damage (excluding inert Dead Memory blocks)
    let corruptedCount = 0;
    for (let i = 0; i < grid.length; i++) {
      if (grid[i].state === "corrupted" && !grid[i].isDeadMemory) corruptedCount++;
    }
    const saturation = corruptedCount / grid.length;
    
    // Sector 03 (Gateway) Fourth Wall Break Lock Event
    if (currentSectorIndex === 2 && saturation > 0.10 && !state.hasTriggeredLockEvent) {
      setTimeout(() => {
        get().triggerPrivilegeLockEvent();
      }, 0);
    }

    if (saturation > 0.5) {
      if (saturation >= 0.8) {
        // Exponential meltdown
        core.health -= (dt / 1000) * 40;
        if (Math.random() < 0.05) pushLog("BREACH", "[CRITICAL] // KERNEL MELTDOWN IN PROGRESS");
      } else {
        // Linear damage
        core.health -= (dt / 1000) * 8;
      }
    }

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
    if (core.thermalThrottleMs > 0) {
      core.thermalThrottleMs = Math.max(0, core.thermalThrottleMs - dt);
    }
    if (core.overclockCooldownMs > 0) core.overclockCooldownMs -= dt;
    if (core.overclockDurationMs > 0) {
      core.overclockDurationMs -= dt;
      if (core.overclockDurationMs <= 0) {
        core.overclockActive = false;
        core.thermalThrottleMs = getUpgradeLevel(upgrades, "overclock_dampener") > 0 ? 2000 : 4000;
        lastThrottleMs = newElapsed;
        pushLog("HALT", "[SYSTEM] // OVERHEAT DETECTION: THERMAL THROTTLE ENGAGED");
        audioEngine.playSfx("throttle");
      }
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
      audioEngine.playSfx("overclock");
      core.shieldDurationMs = Math.max(
        core.shieldDurationMs,
        ocConfig.duration,
      );
    }

    // ── Emitter Auto-Fire ──────────────────────────────────
    const cableLengthLevel = getUpgradeLevel(upgrades, "cable_length");
    const purgeLevel = getUpgradeLevel(upgrades, "purge_radius");
    let emitterNodes = state.emitterNodes.map(e => ({...e})); // shallow clone to mutate safely
    let visualEvents = state.visualEvents.slice();
    let nextEmitterId = state.nextEmitterId;
    let nextVisualEventId = state.nextVisualEventId;

    for (const emitter of emitterNodes) {
      if (emitter.isOverheated || emitter.state === "overheated") continue;

      if (emitter.state === "booting") {
        emitter.cooldownMs -= dt;
        if (emitter.cooldownMs <= 0) {
          emitter.cooldownMs = 0;
          emitter.state = "ready";
        }
        continue;
      }

      if (emitter.state === "cooldown") {
        let cdMultiplier = 1;
        if (core.overclockActive) cdMultiplier = 2;
        else if (core.thermalThrottleMs > 0) cdMultiplier = 0.5;

        emitter.cooldownMs -= dt * cdMultiplier;
        if (emitter.cooldownMs <= 0) {
          emitter.cooldownMs = 0;
          emitter.state = "ready";
        }
        continue;
      }

      // State is 'ready' — scan for closest corrupted/unstable cell
      const reach = CABLE_LENGTHS[cableLengthLevel];
      const targetingLevel = getUpgradeLevel(upgrades, "targeting_subroutines");
      let bestDist = Infinity;
      let bestIndex = -1;

      for (let gi = 0; gi < grid.length; gi++) {
        const node = grid[gi];
        if (node.state !== "corrupted" && node.state !== "unstable") continue;
        if (node.purgeImmunityMs > 0) continue;
        if (node.isDeadMemory) continue; // Cannot target dead memory
        
        let dist = manhattanDistance(node.pos, emitter.pos);
        if (dist > reach) continue;

        // Apply targeting heuristics if upgraded
        if (targetingLevel > 0) {
          const pOnNode = parasites.find(p => p.pos.x === node.pos.x && p.pos.y === node.pos.y && !p.markedForRemoval);
          if (pOnNode) {
            if (targetingLevel === 1) {
              if (pOnNode.variant === "storm_flitter") dist -= 1000;
            } else if (targetingLevel >= 2) {
              if (pOnNode.variant === "siege_bloc") dist -= 2000;
              else if (pOnNode.variant === "storm_flitter") dist -= 1000;
            }
          }
        }

        if (dist >= bestDist) continue;
        bestDist = dist;
        bestIndex = gi;
      }

      if (bestIndex < 0) continue; // no target in range

      const targetNode = grid[bestIndex];
      const targetPos = targetNode.pos;
      const isBorder = isBorderPosition(targetPos.x, targetPos.y);

      // Resolve purge
      const purgeResult = resolveChainPurge(
        bestIndex,
        grid,
        parasites,
        purgeLevel,
        isBorder,
      );

      let eventBits = 0;
      if (purgeResult.cleansedIndices.length > 0) {
        // Score payout
        let baseScore =
          SCORE_PER_PURGE +
          (purgeResult.cleansedIndices.length - 1) * SCORE_PER_CHAIN_NODE;

        const scavengerLvl = getUpgradeLevel(upgrades, "bit_scavenger");
        if (purgeResult.chainLength > 1 && scavengerLvl > 0) {
          if (Math.random() < scavengerLvl * 0.15) {
            baseScore *= 2; // Proc Bit Scavenger
            pushLog("PATCH", "[SYS] // BIT SCAVENGER PROC: x2 BITS EXTRACTED");
          }
        }

        const bits = Math.ceil(baseScore * score.multiplier);
        eventBits = bits;
        score.currency += bits;
        score.total += bits;
        score.totalPurges += purgeResult.cleansedIndices.length;
        if (purgeResult.chainLength > score.longestChain) {
          score.longestChain = purgeResult.chainLength;
        }

        if (bits > 0 && firstBitsTimeMs < 0) {
          firstBitsTimeMs = newElapsed;
          visualEvents.push({
            id: nextVisualEventId++,
            type: "first_bits",
            x: targetPos.x,
            y: targetPos.y,
            bits: bits,
            bornAt: newElapsed,
          });
          eventBits = 0; // Prevent duplicate floating text for this event
        }

        trauma = Math.min(1.0, trauma + purgeResult.chainLength * 0.08);
        if (purgeResult.chainLength >= 4) {
          freezeFrames = 4;
        }

        pushLog("PURGE", `> PURGE EXECUTED // METRIC: ${purgeResult.cleansedIndices.length} CELLS DELETED`);
        audioEngine.playSfx("purge");
        if (purgeResult.chainLength > 1) {
          pushLog("CHAIN", `> CASCADE CLIMAX // REACTION EXPONENT: ${purgeResult.chainLength}`);
        }

        // Combo
        score.comboCount++;
        score.comboTimerMs = COMBO_WINDOW_MS;
        score.multiplier = Math.min(
          COMBO_MAX_MULTIPLIER,
          1 + score.comboCount * COMBO_MULTIPLIER_STEP,
        );

        // Shield buff on border links
        if (isBorder) {
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
          const buff = SHIELD_BUFF_CONFIG[comboKey as keyof typeof SHIELD_BUFF_CONFIG];
          if (buff) {
            const shieldLvl = getUpgradeLevel(upgrades, "shield_buffer");
            core.shieldPoints += buff.hp + (shieldLvl * 40); // Upgrade gives +40 flat per level
            core.shieldDurationMs = Math.max(core.shieldDurationMs, buff.duration);
          }
        }
      }

      // Damage parasites in purge radius
      for (const pid of purgeResult.damagedParasiteIds) {
        const p = parasites.find((par) => par.id === pid);
        if (p) {
          p.hp -= PURGE_PARASITE_DAMAGE;
          if (p.hp <= 0) {
            p.markedForRemoval = true;
            score.currency += PARASITE_CONFIGS[p.variant].bitsDrop;

            if (!firstKillDone) {
              firstKillDone = true;
              visualEvents.push({
                id: nextVisualEventId++,
                type: "first_kill",
                x: p.pos.x,
                y: p.pos.y,
                text: "FIRST PURGE",
                bornAt: newElapsed,
              });
            }
          }
        }
      }

      // Create visual cable (extending state for snappy animation)
      cables.push({
        id: nextCableId++,
        sourcePos: emitter.pos,
        targetPos,
        state: "extending",
        progress: 0,
        length: bestDist,
        ttlMs: AUTO_CABLE_ACTIVE_MS,
        createdAtMs: newElapsed,
        isBorderLink: isBorder,
      });

      // Register visual event
      visualEvents.push({
        id: nextVisualEventId++,
        type: "purge",
        x: targetPos.x,
        y: targetPos.y,
        bits: eventBits,
        bornAt: newElapsed,
      });

      // Increment shots fired & check overheat
      emitter.shotsFired = (emitter.shotsFired || 0) + 1;
      if (emitter.shotsFired >= 6) {
        emitter.isOverheated = true;
        emitter.state = "overheated";
        pushLog("BREACH", `> EMITTER_${emitter.id} OVERHEATED // REBOOT REQUIRED`);
      } else {
        emitter.state = "cooldown";
        emitter.cooldownMs = EMITTER_COOLDOWN_MS;
      }
    }

    // ── Cables Tick
    for (let i = cables.length - 1; i >= 0; i--) {
      const c = cables[i];
      if (c.state === "extending") {
        c.progress += dt / AUTO_CABLE_EXTEND_MS;
        if (c.progress >= 1) {
          c.progress = 1;
          c.state = "completed"; // maps to static glowing phase
          c.ttlMs = AUTO_CABLE_ACTIVE_MS;
        }
      } else if (c.state === "completed") {
        c.ttlMs -= dt;
        if (c.ttlMs <= 0) c.state = "retracting";
      } else if (c.state === "retracting") {
        c.progress -= dt / AUTO_CABLE_RETRACT_MS;
        if (c.progress <= 0) {
          c.progress = -1; // sentinel for removal
        }
      }
    }

    for (let i = cables.length - 1; i >= 0; i--) {
      if (cables[i].progress < 0) {
        cables[i] = cables[cables.length - 1];
        cables.pop();
      }
    }

    // ── Sector & Spawning
    // Find current sector
    let currentSector = SECTOR_CONFIGS[SECTOR_CONFIGS.length - 1];
    let timeAccum = 0;
    let sectorIndex = 0;
    for (let i = 0; i < SECTOR_CONFIGS.length; i++) {
      timeAccum += SECTOR_CONFIGS[i].duration;
      if (newElapsed <= timeAccum) {
        currentSector = SECTOR_CONFIGS[i];
        sectorIndex = i;
        break;
      }
    }

    if (sectorIndex > currentSectorIndex) {
      currentSectorIndex = sectorIndex;
      lastSectorChangeMs = newElapsed;
      if (sectorIndex === 1) {
        get().showSectorBanner("SECTOR 02: CACHE BREACH", "10 BLOCKS OF DEAD MEMORY DETECTED // INFESTATION RATE ELEVATED", true);
        pushLog("BREACH", "> SECTOR 02 REACHED // CACHE MEMORY CORRUPTED");
      } else if (sectorIndex === 2) {
        get().showSectorBanner("SECTOR 03: GATEWAY INVASION", "CRITICAL INFESTATION SURGE // KERNEL INTEGRITY AT EXTREME RISK", true);
        pushLog("BREACH", "> SECTOR 03 REACHED // GATEWAY INVASION IN PROGRESS");
      }
    }

    // Trigger Sector 02 Dead Memory Injection
    let sector02Triggered = state.sector02Triggered;
    if (sectorIndex >= 1 && !sector02Triggered) {
      sector02Triggered = true;
      let injected = 0;
      let attempts = 0;
      while (injected < 10 && attempts < 200) {
        attempts++;
        const rx = Math.floor(Math.random() * GRID_SIZE);
        const ry = Math.floor(Math.random() * GRID_SIZE);
        const idx = posToIndex(rx, ry);
        const node = grid[idx];
        if (node.state === "clean" && !node.isCoreNode && !node.isBorderNode) {
          node.isDeadMemory = true;
          node.state = "corrupted"; // Turn visually red/blocked
          node.purgeImmunityMs = 99999999; // Permanent immunity
          injected++;
        }
      }
      pushLog("BREACH", `> SECTOR 02 REACHED // ${injected} BLOCKS OF DEAD MEMORY DETECTED`);
    }

    // Spawn logic based on rhythm
    while (spawnAcc >= currentSector.spawnInterval) {
      spawnAcc -= currentSector.spawnInterval;
      const spawns = Math.floor(currentSector.spawnsPerInterval);
      const isExtra = Math.random() < currentSector.spawnsPerInterval - spawns;
      const totalSpawns = spawns + (isExtra ? 1 : 0);

      for (let i = 0; i < totalSpawns; i++) {
        const r = Math.random();
        let variant: ParasiteVariant = "pulse_worm";
        if (r < currentSector.composition.pulse_worm) variant = "pulse_worm";
        else if (
          r <
          currentSector.composition.pulse_worm +
            currentSector.composition.storm_flitter
        )
          variant = "storm_flitter";
        else variant = "siege_bloc";

        const br = Math.random();
        let edge: Direction = "N";
        let sum = 0;
        for (const [k, v] of Object.entries(currentSector.borders)) {
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

        p.prevPos = { ...p.pos };

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
            const dx = CORE_POS.x - p.pos.x;
            const dy = CORE_POS.y - p.pos.y;
            let stepX = Math.sign(dx);
            let stepY = Math.sign(dy);

            // Apply erratic jitter only when further than 1 cell away from Kernel
            if (Math.abs(dx) > 1 && Math.random() < 0.3) {
              stepX = -stepX;
            }
            if (Math.abs(dy) > 1 && Math.random() < 0.3) {
              stepY = -stepY;
            }

            const nx = p.pos.x + stepX;
            const ny = p.pos.y + stepY;
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
            const damage = PARASITE_CONFIGS[p.variant].coreDamage;
            core.health -= damage;
            p.markedForRemoval = true;
            score.parasitesLeaked++;
            trauma = Math.min(1.0, trauma + 0.55);
            pushLog("BREACH", "> WARNING // KERNEL BREACH INTERACTION DETECTED");
            audioEngine.playSfx("breach");
            
            visualEvents.push({
              id: nextVisualEventId++,
              type: "core_damage",
              x: CORE_POS.x,
              y: CORE_POS.y,
              text: `-${damage} HP`,
              bornAt: newElapsed,
            });
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

    // ── Parasite-Emitter Collision
    for (const p of parasites) {
      if (p.markedForRemoval) continue;
      for (const emitter of emitterNodes) {
        if (p.pos.x === emitter.pos.x && p.pos.y === emitter.pos.y) {
          emitter.state = "booting";
          emitter.cooldownMs = EMITTER_BOOT_MS;
        }
      }
    }

    for (let i = parasites.length - 1; i >= 0; i--) {
      if (parasites[i].markedForRemoval) {
        parasites[i] = parasites[parasites.length - 1];
        parasites.pop();
      }
    }

    // Prune expired visual events
    for (let i = visualEvents.length - 1; i >= 0; i--) {
      if (newElapsed - visualEvents[i].bornAt > VISUAL_EVENT_TTL_MS) {
        visualEvents[i] = visualEvents[visualEvents.length - 1];
        visualEvents.pop();
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
      pushLog("HALT", "CRITICAL FAILURE. Kernel compromised.");
      set({
        activeScreen: "gameover",
        phase: "gameover",
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
        emitterNodes,
        visualEvents,
        nextEmitterId,
        nextVisualEventId,
        input: {
          ...input,
          linkJustPressed: false,
          linkJustReleased: false,
          overclockJustPressed: false,
        },
        logs,
        nextLogId,
        trauma,
        freezeFrames,
        sector02Triggered,
        lastSectorChangeMs,
        currentSectorIndex,
        lastThrottleMs,
        saturation,
        firstKillDone,
        firstBitsTimeMs,
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
      emitterNodes,
      visualEvents,
      nextEmitterId,
      nextVisualEventId,
      input: {
        ...input,
        linkJustPressed: false,
        linkJustReleased: false,
        overclockJustPressed: false,
      },
      logs,
      nextLogId,
      trauma,
      freezeFrames,
      sector02Triggered,
      lastSectorChangeMs,
      currentSectorIndex,
      saturation,
      firstKillDone,
      firstBitsTimeMs,
    });

    runtimeEngine.observe(get());
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
  snapDroneToGrid: () => {},
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
    const { score, upgrades, addLog } = get();
    const upg = upgrades.get(id);
    if (!upg) return false;
    if (upg.level >= upg.maxLevel) return false;

    const cost = UPGRADE_CONFIGS.find((c) => c.id === id)?.costs[upg.level];
    if (cost === undefined || score.currency < cost) return false;

    set((state) => {
      const newScore = { ...state.score, currency: state.score.currency - cost };
      const newUpgrades = new Map(state.upgrades);
      newUpgrades.set(id, { ...upg, level: upg.level + 1 });
      
      return {
        score: newScore,
        upgrades: newUpgrades,
      };
    });
    addLog("PATCH", `Firmware injected: ${id.toUpperCase()}`);

    return true;
  },

  addLog: (type, message) => set((state) => {
    const newLogs = [...state.logs, { id: state.nextLogId, timeMs: state.elapsedMs, type, message }].slice(-30);
    return { logs: newLogs, nextLogId: state.nextLogId + 1 };
  }),

  addScore: (pts: number) =>
    set((s) => ({ score: { ...s.score, total: s.score.total + pts } })),
  updateCombo: () => {},

  placeEmitter: (gridX: number, gridY: number) => {
    const state = get();
    if (state.phase !== "playing") return false;
    if (!isInBounds(gridX, gridY)) return false;

    const idx = posToIndex(gridX, gridY);
    const node = state.grid[idx];
    if (node.state !== "clean") return false;
    if (node.isCoreNode) return false;

    if (state.emitterNodes.some((e) => e.pos.x === gridX && e.pos.y === gridY)) return false;

    const cost = state.emitterNodes.length < EMITTER_FIRST_FREE ? 0 : EMITTER_COST;
    if (state.score.currency < cost) return false;

    let currentNodes = state.emitterNodes;
    let currentCables = state.cables;

    // Node Cap (Limite de 6 nós ativos). Ao exceder 6, remove o nó mais antigo e seus cabos.
    if (currentNodes.length >= 6) {
      const oldestNode = currentNodes[0];
      currentNodes = currentNodes.slice(1);
      currentCables = currentCables.filter(
        (c) => !(c.sourcePos.x === oldestNode.pos.x && c.sourcePos.y === oldestNode.pos.y)
      );
    }

    const cableLengthLevel = getUpgradeLevel(state.upgrades, "cable_length");

    set({
      emitterNodes: [
        ...currentNodes,
        {
          id: state.nextEmitterId,
          pos: { x: gridX, y: gridY },
          length: CABLE_LENGTHS[cableLengthLevel],
          state: "ready",
          cooldownMs: 0,
          shotsFired: 0,
          isOverheated: false,
        },
      ],
      cables: currentCables,
      nextEmitterId: state.nextEmitterId + 1,
      score: { ...state.score, currency: state.score.currency - cost },
    });
    return true;
  },

  setPulsePressed: () =>
    set((s) => ({ input: { ...s.input, pulseJustPressed: true } })),

  rebootEmitter: (emitterId: number) => {
    const state = get();
    const nodeIndex = state.emitterNodes.findIndex((e) => e.id === emitterId);
    if (nodeIndex === -1) return;

    const updatedNodes = [...state.emitterNodes];
    const targetNode = { ...updatedNodes[nodeIndex] };

    targetNode.shotsFired = 0;
    targetNode.isOverheated = false;
    targetNode.state = "cooldown";
    targetNode.cooldownMs = 500;
    updatedNodes[nodeIndex] = targetNode;

    const newVisualEvents = [
      ...state.visualEvents,
      {
        id: state.nextVisualEventId,
        type: "reboot" as const,
        x: targetNode.pos.x,
        y: targetNode.pos.y,
        text: "[FLUSHED & REBOOTED]",
        bornAt: state.elapsedMs,
      },
    ];

    state.addLog("PATCH", `> EMITTER_${targetNode.id} THERMAL FLUSH COMPLETED. SYSTEM READY.`);

    set({
      emitterNodes: updatedNodes,
      visualEvents: newVisualEvents,
      nextVisualEventId: state.nextVisualEventId + 1,
    });
  },

  fireDronePulse: () => {
    const state = get();
    if (state.dronePulseCooldownMs > 0 || state.isInputLocked || state.phase !== "playing") return;

    const { drone, grid, parasites, addLog, visualEvents, nextVisualEventId } = state;
    const center = drone.gridPos;

    // Purge 3x3 cells around drone
    let purgedCount = 0;
    const newGrid = [...grid];
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const gx = center.x + dx;
        const gy = center.y + dy;
        if (gx >= 0 && gx < GRID_SIZE && gy >= 0 && gy < GRID_SIZE) {
          const idx = posToIndex(gx, gy);
          const cell = newGrid[idx];
          if (cell && cell.state !== "clean" && !cell.isCoreNode && !cell.isDeadMemory) {
            newGrid[idx] = { ...cell, state: "clean", infectionLevel: 0 };
            purgedCount++;
          }
        }
      }
    }

    // Damage parasites in 3x3
    let killedCount = 0;
    for (const p of parasites) {
      if (Math.abs(p.pos.x - center.x) <= 1 && Math.abs(p.pos.y - center.y) <= 1) {
        p.hp -= 60;
        if (p.hp <= 0) {
          p.markedForRemoval = true;
          killedCount++;
        }
      }
    }

    addLog("PURGE", `> EMP PULSE FIRED @ (${center.x}, ${center.y}) // ${purgedCount} NODES CLEANSED`);

    const newVisualEvents = [
      ...visualEvents,
      {
        id: nextVisualEventId,
        type: "emp_pulse" as const,
        x: center.x,
        y: center.y,
        text: "⚡ EMP PULSE",
        bornAt: state.elapsedMs,
      },
    ];

    set({
      grid: newGrid,
      dronePulseCooldownMs: 4000,
      trauma: Math.min(1.0, state.trauma + 0.4),
      visualEvents: newVisualEvents,
      nextVisualEventId: nextVisualEventId + 1,
    });
  },

  showSectorBanner: (title: string, subtitle: string, isWarning = false) => {
    set({ sectorBanner: { title, subtitle, isWarning } });
    setTimeout(() => {
      set({ sectorBanner: null });
    }, 3500);
  },

  clearSectorBanner: () => set({ sectorBanner: null }),

  showOsToast: (msg: string) => {
    set({ osToastMessage: msg });
    setTimeout(() => {
      set({ osToastMessage: null });
    }, 3000);
  },
  clearOsToast: () => set({ osToastMessage: null }),

  triggerPrivilegeLockEvent: () => {
    const state = get();
    if (state.hasTriggeredLockEvent) return;

    // 1. Trigger flags & Alert modal text
    set({
      hasTriggeredLockEvent: true,
      isOverrideActive: true,
      isPrivilegeSuspended: true,
      isInputLocked: true,
      inputLockRemainingMs: 3500,
      osAlertBanner: "[ WARNING: CRITICAL KERNEL BREACH DETECTED ]",
    });

    state.addLog("HALT", "[ WARNING: CRITICAL KERNEL BREACH DETECTED ]");
    state.addLog("BREACH", "User privileges temporarily suspended for emergency system override.");
    audioEngine.playSfx("breach");

    // 2. Position 4 strategic Emitters around Kernel in matrix formation
    const matrixPositions = [
      { x: 14, y: 14 },
      { x: 18, y: 14 },
      { x: 14, y: 18 },
      { x: 18, y: 18 },
    ];

    const currentNodes = [...state.emitterNodes];
    let nextId = state.nextEmitterId;

    for (const pos of matrixPositions) {
      if (!currentNodes.some((e) => e.pos.x === pos.x && e.pos.y === pos.y)) {
        currentNodes.push({
          id: nextId++,
          pos,
          length: 6,
          state: "ready",
          cooldownMs: 0,
          shotsFired: 0,
          isOverheated: false,
        });
      }
    }

    // 3. Clear central infection around Kernel
    const newGrid = [...state.grid];
    const center = CORE_POS;
    let purgedCount = 0;

    for (let dx = -4; dx <= 4; dx++) {
      for (let dy = -4; dy <= 4; dy++) {
        const gx = center.x + dx;
        const gy = center.y + dy;
        if (gx >= 0 && gx < GRID_SIZE && gy >= 0 && gy < GRID_SIZE) {
          const idx = posToIndex(gx, gy);
          const cell = newGrid[idx];
          if (cell && cell.state !== "clean" && !cell.isCoreNode && !cell.isDeadMemory) {
            newGrid[idx] = { ...cell, state: "clean", infectionLevel: 0 };
            purgedCount++;
          }
        }
      }
    }

    // Damage parasites in central matrix area
    for (const p of state.parasites) {
      if (Math.abs(p.pos.x - center.x) <= 4 && Math.abs(p.pos.y - center.y) <= 4) {
        p.hp -= 80;
        if (p.hp <= 0) p.markedForRemoval = true;
      }
    }

    const newVisualEvents = [
      ...state.visualEvents,
      {
        id: state.nextVisualEventId,
        type: "emp_pulse" as const,
        x: center.x,
        y: center.y,
        text: "⚡ OVERRIDE MATRIX DISPATCHED",
        bornAt: state.elapsedMs,
      },
    ];

    set({
      grid: newGrid,
      emitterNodes: currentNodes,
      nextEmitterId: nextId,
      visualEvents: newVisualEvents,
      nextVisualEventId: state.nextVisualEventId + 1,
      trauma: 0.8,
    });

    // 4. After 3.5 seconds, restore privileges & log exact required text
    setTimeout(() => {
      set({
        isOverrideActive: false,
        isInputLocked: false,
        isPrivilegeSuspended: false,
        osAlertBanner: null,
      });
      get().addLog("PATCH", "Privileges restored.");
      get().showOsToast("Privileges restored. Finalizing patch...");
    }, 3500);
  },
}));
