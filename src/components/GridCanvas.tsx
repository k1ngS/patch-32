"use client";

// ─────────────────────────────────────────────────────────────
// Patch_32 — GridCanvas
// Self-contained Canvas 2D renderer + input handler.
// Reads state imperatively via getState() — zero React re-renders.
// ─────────────────────────────────────────────────────────────

import { useCallback, useEffect, useRef } from "react";
import {
  CANVAS_SIZE,
  CORE_MAX_HEALTH,
  CORE_POS,
  GRID_SIZE,
  SYNTHETIC_NEIGHBORS,
  TILE_SIZE,
} from "@/constants/gameConfig";
import { useGameStore } from "@/store/useGameStore";

import type {
  CoreState,
  DataNode,
  Drone,
  GamePhase,
  GridPosition,
  NeonCable,
  Parasite,
  ParasiteVariant,
  ScoreState,
} from "@/types/game";

// ── Color Palette ───────────────────────────────────────────

const COL = {
  bg: "#0a0a10",
  gridLine: "rgba(30, 40, 60, 0.35)",
  gridDot: "rgba(50, 70, 100, 0.25)",

  // Node states
  nodeClean: "rgba(20, 35, 55, 0.4)",
  nodeUnstable: "#d4a017",
  nodeUnstableGlow: "rgba(212, 160, 23, 0.3)",
  nodeCorrupted: "#cc2233",
  nodeCorruptedGlow: "rgba(204, 34, 51, 0.25)",
  nodeImmune: "rgba(0, 255, 180, 0.15)",

  // Core
  coreHealthy: "#00ffc8",
  coreDamaged: "#ff4444",
  coreShield: "#4488ff",
  coreShieldGlow: "rgba(68, 136, 255, 0.4)",
  coreOverclock: "#ffaa00",

  // Drone
  droneFill: "#00e5ff",
  droneGlow: "rgba(0, 229, 255, 0.6)",
  droneTrail: "rgba(0, 229, 255, 0.12)",
  droneStunned: "#ff4444",

  // Cables
  cableCyan: "#00ffd5",
  cableGlow: "rgba(0, 255, 213, 0.5)",
  cableBorder: "#44ff88",
  cableBorderGlow: "rgba(68, 255, 136, 0.5)",

  // Parasites
  pulseWorm: "#ff2244",
  pulseWormGlow: "rgba(255, 34, 68, 0.5)",
  siegeBloc: "#991122",
  siegeBlocCross: "#ff6666",
  stormFlitter: "#ff44ff",
  stormFlitterGlow: "rgba(255, 68, 255, 0.6)",

  // HUD / Border
  borderText: "#44ffaa",
  borderTextGlow: "rgba(68, 255, 170, 0.6)",
  hudText: "#88ccff",
} as const;

// ── Helper: Lerp color between two hex colors ───────────────

const _colorCache = new Map<string, string>();
function lerpColor(c1: string, c2: string, t: number): string {
  const step = Math.round(t * 20); // 20 steps of precision
  const key = `${c1}-${c2}-${step}`;
  let cached = _colorCache.get(key);
  if (cached) return cached;

  // ultra simple hex lerp
  const hex1 = parseInt(c1.slice(1), 16);
  const hex2 = parseInt(c2.slice(1), 16);
  
  const r1 = (hex1 >> 16) & 255, g1 = (hex1 >> 8) & 255, b1 = hex1 & 255;
  const r2 = (hex2 >> 16) & 255, g2 = (hex2 >> 8) & 255, b2 = hex2 & 255;
  
  const realT = step / 20;
  const r = Math.round(r1 + (r2 - r1) * realT);
  const g = Math.round(g1 + (g2 - g1) * realT);
  const b = Math.round(b1 + (b2 - b1) * realT);
  
  cached = `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
  _colorCache.set(key, cached);
  return cached;
}

// ── Key State Tracker (outside React lifecycle) ─────────────

const keysDown = new Set<string>();

// ── Trail History (ring buffer) ─────────────────────────────

const TRAIL_LENGTH = 8;
const trailBuffer: { x: number; y: number }[] = [];
let trailWriteIndex = 0;

function pushTrail(x: number, y: number): void {
  if (trailBuffer.length < TRAIL_LENGTH) {
    trailBuffer.push({ x, y });
  } else {
    trailBuffer[trailWriteIndex] = { x, y };
  }
  trailWriteIndex = (trailWriteIndex + 1) % TRAIL_LENGTH;
}

// ═════════════════════════════════════════════════════════════
// COMPONENT
// ═════════════════════════════════════════════════════════════

export default function GridCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const trailTickRef = useRef<number>(0);
  const activeKeys = useRef<Set<string>>(new Set());

  // ── Input: Keyboard ─────────────────────────────────────

  const handleKeyDown = (e: KeyboardEvent) => {
    const state = useGameStore.getState();
    if (state.phase !== 'playing') return;
    if (['w', 'a', 's', 'd', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      activeKeys.current.add(e.key);
    }
    if (e.code === 'Space') {
      state.setLinkHeld(true);
    }
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
      state.setOverclockPressed();
    }
    updateMoveVector();
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    const state = useGameStore.getState();
    if (state.phase !== 'playing') return;
    if (['w', 'a', 's', 'd', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      activeKeys.current.delete(e.key);
    }
    if (e.code === 'Space') {
      state.setLinkHeld(false);
    }
    updateMoveVector();
  };

  // ── Compute move vector from held keys ──────────────────

  function updateMoveVector(): void {
    let x = 0;
    let y = 0;

    if (activeKeys.current.has("w") || activeKeys.current.has("ArrowUp")) y -= 1;
    if (activeKeys.current.has("s") || activeKeys.current.has("ArrowDown")) y += 1;
    if (activeKeys.current.has("a") || activeKeys.current.has("ArrowLeft")) x -= 1;
    if (activeKeys.current.has("d") || activeKeys.current.has("ArrowRight")) x += 1;

    useGameStore.getState().setMoveVector(x, y);
  }

  // ── Input: Mouse (cable on canvas click) ────────────────

  const handlePointerDown = (e: PointerEvent) => {
    const state = useGameStore.getState();
    if (state.phase !== 'playing') return;
    if (e.button === 0) {
      state.setLinkHeld(true);
    }
  };
  
  const handlePointerUp = (e: PointerEvent) => {
    const state = useGameStore.getState();
    if (state.phase !== 'playing') return;
    if (e.button === 0) {
      state.setLinkHeld(false);
    }
  };

  // ── Main Effect: Setup & RAF Loop ───────────────────────

  useEffect(() => {
    useGameStore.getState().initGame();
    useGameStore.getState().startGame();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    // Set canvas resolution
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;

    // Attach input listeners
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointerup", handlePointerUp);

    // Reset trail
    trailBuffer.length = 0;
    trailWriteIndex = 0;

    // ── RAF Loop ────────────────────────────────────────

    function loop(timestamp: number): void {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const deltaMs = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      // Advance game state (imperative — no React involvement)
      const store = useGameStore.getState();
      store.updateGameTick(deltaMs);

      // Re-read after tick
      const state = useGameStore.getState();

      // Draw
      draw(ctx!, state, timestamp);

      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);

    // Cleanup
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("pointerup", handlePointerUp);
      keysDown.clear();
    };
  }, []);

  // ═════════════════════════════════════════════════════════
  // DRAW FUNCTION (runs every frame, reads state imperatively)
  // ═════════════════════════════════════════════════════════

  function draw(
    ctx: CanvasRenderingContext2D,
    state: ReturnType<typeof useGameStore.getState>,
    time: number,
  ): void {
    const { grid, drone, cables, parasites, core, score, phase } = state;

    // ── 0. Clear
    ctx.fillStyle = COL.bg;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // ── 1. Grid
    drawGrid(ctx, grid, time);

    // ── 2. Cables
    drawCables(ctx, cables, drone, time);

    // ── 3. Core
    drawCore(ctx, core, time);

    // ── 4. Parasites
    drawParasites(ctx, parasites, time);

    // ── 5. Drone
    drawDrone(ctx, drone, time);

    // ── 6. Border Neighbor Overlays
    drawBorderOverlays(ctx, cables, state.syntheticNeighborIndex, score, time);

    // ── 7. Phase Overlays (boot, gameover, victory)
    drawPhaseOverlay(ctx, phase, score, state.remainingMs, time);
  }

  // ─────────────────────────────────────────────────────────
  // DRAW: Grid Cells
  // ─────────────────────────────────────────────────────────

  function drawGrid(
    ctx: CanvasRenderingContext2D,
    grid: DataNode[],
    time: number,
  ): void {
    // Grid lines (very subtle)
    ctx.strokeStyle = COL.gridLine;
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID_SIZE; i++) {
      const pos = i * TILE_SIZE;
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, CANVAS_SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, pos);
      ctx.lineTo(CANVAS_SIZE, pos);
      ctx.stroke();
    }

    // Node state fills
    for (let i = 0; i < grid.length; i++) {
      const node = grid[i];
      const px = node.pos.x * TILE_SIZE;
      const py = node.pos.y * TILE_SIZE;

      if (node.state === "corrupted") {
        // Pulsing corrupted fill
        const pulse = 0.7 + Math.sin(time * 0.004 + i * 0.1) * 0.3;
        ctx.fillStyle = `rgba(204, 34, 51, ${0.35 * pulse})`;
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

        // Glow
        ctx.shadowColor = COL.nodeCorruptedGlow;
        ctx.shadowBlur = 6;
        ctx.fillStyle = `rgba(255, 50, 50, ${0.15 * pulse})`;
        ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        ctx.shadowBlur = 0;
      } else if (node.state === "unstable") {
        const flicker = 0.5 + Math.sin(time * 0.006 + i * 0.3) * 0.5;
        ctx.fillStyle = `rgba(212, 160, 23, ${0.25 * flicker})`;
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

        // Warning crosshatch (subtle)
        ctx.strokeStyle = `rgba(212, 160, 23, ${0.15 * flicker})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + TILE_SIZE, py + TILE_SIZE);
        ctx.moveTo(px + TILE_SIZE, py);
        ctx.lineTo(px, py + TILE_SIZE);
        ctx.stroke();
      } else if (node.purgeImmunityMs > 0) {
        // Recently purged — soft teal glow
        const fade = Math.min(1, node.purgeImmunityMs / 1500);
        ctx.fillStyle = `rgba(0, 255, 180, ${0.08 * fade})`;
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      }

      // Aura spread buff indicator (siege bloc nearby)
      if (node.auraSpreadBuff > 0 && node.state !== "corrupted") {
        ctx.fillStyle = `rgba(150, 30, 30, ${0.1 * node.auraSpreadBuff})`;
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      }
    }
  }

  // ─────────────────────────────────────────────────────────
  // DRAW: Core Node
  // ─────────────────────────────────────────────────────────

  function drawCore(
    ctx: CanvasRenderingContext2D,
    core: CoreState,
    time: number,
  ): void {
    const cx = CORE_POS.x * TILE_SIZE + TILE_SIZE / 2;
    const cy = CORE_POS.y * TILE_SIZE + TILE_SIZE / 2;
    const healthPct = Math.max(0, core.health / CORE_MAX_HEALTH);

    // Pulsing radius based on health
    const basePulse = 0.85 + Math.sin(time * 0.003) * 0.15;
    const radius = TILE_SIZE * 0.6 * basePulse;

    // Health color interpolation
    const coreColor = lerpColor("#cc2233", "#00ffc8", healthPct);

    // Outer glow
    ctx.shadowColor = coreColor;
    ctx.shadowBlur = 20 + (1 - healthPct) * 15;

    // Main core circle
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = coreColor;
    ctx.globalAlpha = 0.8;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    // Inner ring
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.55, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 + healthPct * 0.4})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Rotating hash marks (data processing visualization)
    const rotSpeed = core.overclockActive ? 0.008 : 0.002;
    const rot = time * rotSpeed;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    for (let i = 0; i < 4; i++) {
      ctx.rotate(Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(radius * 0.7, 0);
      ctx.lineTo(radius * 1.1, 0);
      ctx.strokeStyle = `rgba(255, 255, 255, 0.4)`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.restore();

    // ── Shield ring
    if (core.shieldPoints > 0) {
      const shieldPulse = 0.6 + Math.sin(time * 0.005) * 0.4;
      const shieldRadius = TILE_SIZE * 1.1;

      ctx.shadowColor = COL.coreShieldGlow;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(cx, cy, shieldRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(68, 136, 255, ${0.5 * shieldPulse})`;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Shield HP text
      ctx.font = "7px monospace";
      ctx.fillStyle = COL.coreShield;
      ctx.textAlign = "center";
      ctx.fillText(
        `⛨${Math.ceil(core.shieldPoints)}`,
        cx,
        cy + shieldRadius + 10,
      );
    }

    // ── Overclock indicator
    if (core.overclockActive) {
      const ocPulse = 0.5 + Math.sin(time * 0.01) * 0.5;
      ctx.shadowColor = COL.coreOverclock;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(cx, cy, TILE_SIZE * 1.35, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 170, 0, ${0.4 * ocPulse})`;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.shadowBlur = 0;
    }
  }

  // ─────────────────────────────────────────────────────────
  // DRAW: Drone (Player)
  // ─────────────────────────────────────────────────────────

  function drawDrone(
    ctx: CanvasRenderingContext2D,
    drone: Drone,
    time: number,
  ): void {
    const dx = drone.worldPos.x * TILE_SIZE + TILE_SIZE / 2;
    const dy = drone.worldPos.y * TILE_SIZE + TILE_SIZE / 2;

    // ── Trail effect
    trailTickRef.current++;
    if (trailTickRef.current % 2 === 0) {
      pushTrail(dx, dy);
    }

    for (let i = 0; i < trailBuffer.length; i++) {
      const age = (trailWriteIndex - i + TRAIL_LENGTH) % TRAIL_LENGTH;
      const alpha = Math.max(0, 0.25 - age * 0.03);
      const size = Math.max(2, TILE_SIZE * 0.35 - age * 1.5);
      ctx.fillStyle =
        drone.state === "stunned"
          ? `rgba(255, 68, 68, ${alpha})`
          : `rgba(0, 229, 255, ${alpha})`;
      ctx.fillRect(
        trailBuffer[i].x - size / 2,
        trailBuffer[i].y - size / 2,
        size,
        size,
      );
    }

    // ── Main drone body
    const isStunned = drone.state === "stunned";
    const bodyColor = isStunned ? COL.droneStunned : COL.droneFill;
    const glowColor = isStunned ? "rgba(255, 68, 68, 0.6)" : COL.droneGlow;

    const breathe = 0.9 + Math.sin(time * 0.006) * 0.1;
    const halfSize = TILE_SIZE * 0.4 * breathe;

    // Glow
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = isStunned ? 8 + Math.sin(time * 0.02) * 6 : 12;

    // Rotated diamond shape
    ctx.save();
    ctx.translate(dx, dy);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = bodyColor;
    ctx.fillRect(-halfSize, -halfSize, halfSize * 2, halfSize * 2);

    // Inner highlight
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    ctx.fillRect(
      -halfSize * 0.4,
      -halfSize * 0.4,
      halfSize * 0.8,
      halfSize * 0.8,
    );
    ctx.restore();

    ctx.shadowBlur = 0;

    // Linking indicator
    if (drone.state === "linking") {
      const linkPulse = 0.5 + Math.sin(time * 0.01) * 0.5;
      ctx.strokeStyle = `rgba(0, 255, 213, ${0.6 * linkPulse})`;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.arc(dx, dy, TILE_SIZE * 0.7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  // ─────────────────────────────────────────────────────────
  // DRAW: Parasites
  // ─────────────────────────────────────────────────────────

  function drawParasites(
    ctx: CanvasRenderingContext2D,
    parasites: Parasite[],
    time: number,
  ): void {
    for (let i = 0; i < parasites.length; i++) {
      const p = parasites[i];
      if (p.markedForRemoval) continue;

      const px = p.pos.x * TILE_SIZE + TILE_SIZE / 2;
      const py = p.pos.y * TILE_SIZE + TILE_SIZE / 2;

      switch (p.variant) {
        case "pulse_worm":
          drawPulseWorm(ctx, px, py, p, time);
          break;
        case "siege_bloc":
          drawSiegeBloc(ctx, px, py, p, time);
          break;
        case "storm_flitter":
          drawStormFlitter(ctx, px, py, p, time);
          break;
      }
    }
  }

  // Pulse Worm: Pulsing crimson triangle ▲
  function drawPulseWorm(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    p: Parasite,
    time: number,
  ): void {
    const pulse = 0.7 + Math.sin(time * 0.008 + p.id * 1.7) * 0.3;
    const size = TILE_SIZE * 0.4 * pulse;

    ctx.shadowColor = COL.pulseWormGlow;
    ctx.shadowBlur = 8 * pulse;

    ctx.beginPath();
    ctx.moveTo(cx, cy - size); // Top
    ctx.lineTo(cx - size * 0.87, cy + size * 0.5); // Bottom-left
    ctx.lineTo(cx + size * 0.87, cy + size * 0.5); // Bottom-right
    ctx.closePath();
    ctx.fillStyle = COL.pulseWorm;
    ctx.globalAlpha = 0.7 + pulse * 0.3;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    // Pulse tick indicator (tiny dot when about to pulse)
    if ((p.ticksSincePulse || 0) >= 2) {
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(cx, cy - size - 3, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Siege Bloc: Solid dark red square with crosshair ■
  function drawSiegeBloc(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    p: Parasite,
    time: number,
  ): void {
    const halfSize = TILE_SIZE * 0.4;

    // Body
    ctx.fillStyle = COL.siegeBloc;
    ctx.fillRect(cx - halfSize, cy - halfSize, halfSize * 2, halfSize * 2);

    // Border
    ctx.strokeStyle = "#cc3344";
    ctx.lineWidth = 1;
    ctx.strokeRect(cx - halfSize, cy - halfSize, halfSize * 2, halfSize * 2);

    // Crosshair overlay
    ctx.strokeStyle = COL.siegeBlocCross;
    ctx.lineWidth = 1;
    ctx.beginPath();
    // Horizontal
    ctx.moveTo(cx - halfSize * 0.7, cy);
    ctx.lineTo(cx + halfSize * 0.7, cy);
    // Vertical
    ctx.moveTo(cx, cy - halfSize * 0.7);
    ctx.lineTo(cx, cy + halfSize * 0.7);
    ctx.stroke();

    // Small center dot
    ctx.fillStyle = COL.siegeBlocCross;
    ctx.beginPath();
    ctx.arc(cx, cy, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Aura ring (if buffing nearby)
    const auraVisible = Math.sin(time * 0.004) * 0.5 + 0.5;
    ctx.strokeStyle = `rgba(150, 30, 30, ${0.25 * auraVisible})`;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.arc(cx, cy, TILE_SIZE * 1.2, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Storm Flitter: Electric magenta diamond ◆ with flash
  function drawStormFlitter(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    p: Parasite,
    time: number,
  ): void {
    const flash = Math.sin(time * 0.015 + p.id * 2.3) > 0.7 ? 1.3 : 1.0;
    const size = TILE_SIZE * 0.35 * flash;

    ctx.shadowColor = COL.stormFlitterGlow;
    ctx.shadowBlur = 10 * flash;

    // Diamond
    ctx.beginPath();
    ctx.moveTo(cx, cy - size); // Top
    ctx.lineTo(cx + size, cy); // Right
    ctx.lineTo(cx, cy + size); // Bottom
    ctx.lineTo(cx - size, cy); // Left
    ctx.closePath();
    ctx.fillStyle = COL.stormFlitter;
    ctx.globalAlpha = 0.6 + flash * 0.3;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    // Electric spark effect (random small lines)
    if (flash > 1.1) {
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 0.5;
      for (let s = 0; s < 3; s++) {
        const angle = (time * 0.01 + s * 2.09) % (Math.PI * 2);
        const len = size * 0.8;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len);
        ctx.stroke();
      }
    }
  }

  // ─────────────────────────────────────────────────────────
  // DRAW: Neon Cables
  // ─────────────────────────────────────────────────────────

  function drawCables(
    ctx: CanvasRenderingContext2D,
    cables: NeonCable[],
    drone: Drone,
    time: number,
  ): void {
    for (let i = 0; i < cables.length; i++) {
      const cable = cables[i];
      const sx = cable.sourcePos.x * TILE_SIZE + TILE_SIZE / 2;
      const sy = cable.sourcePos.y * TILE_SIZE + TILE_SIZE / 2;

      let ex: number, ey: number;

      if (cable.state === "extending") {
        // Cable follows drone while extending
        ex = drone.worldPos.x * TILE_SIZE + TILE_SIZE / 2;
        ey = drone.worldPos.y * TILE_SIZE + TILE_SIZE / 2;
      } else if (cable.targetPos) {
        ex = cable.targetPos.x * TILE_SIZE + TILE_SIZE / 2;
        ey = cable.targetPos.y * TILE_SIZE + TILE_SIZE / 2;
      } else {
        continue;
      }

      // Interpolate based on progress for retracting cables
      if (cable.state === "retracting") {
        const t = cable.progress;
        ex = sx + (ex - sx) * t;
        ey = sy + (ey - sy) * t;
      }

      const isBorder = cable.isBorderLink;
      const glowCol = isBorder ? COL.cableBorderGlow : COL.cableGlow;
      const lineCol = isBorder ? COL.cableBorder : COL.cableCyan;

      // Energy flow animation along cable
      const flowPhase = (time * 0.003) % 1;

      // Glow shadow
      ctx.shadowColor = glowCol;
      ctx.shadowBlur = 8;

      // Main line
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.strokeStyle = lineCol;
      ctx.lineWidth = 2;
      ctx.globalAlpha =
        cable.state === "completed" ? 0.6 + Math.sin(time * 0.005) * 0.2 : 0.85;
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      // Energy particle flowing along the cable
      if (cable.state === "active" || cable.state === "completed") {
        const particleT = flowPhase;
        const ppx = sx + (ex - sx) * particleT;
        const ppy = sy + (ey - sy) * particleT;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(ppx, ppy, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Source node indicator (small circle)
      ctx.fillStyle = lineCol;
      ctx.beginPath();
      ctx.arc(sx, sy, 3, 0, Math.PI * 2);
      ctx.fill();

      // Target node indicator
      if (cable.targetPos) {
        const tx = cable.targetPos.x * TILE_SIZE + TILE_SIZE / 2;
        const ty = cable.targetPos.y * TILE_SIZE + TILE_SIZE / 2;
        ctx.beginPath();
        ctx.arc(tx, ty, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // ─────────────────────────────────────────────────────────
  // DRAW: Border Neighbor Overlays
  // ─────────────────────────────────────────────────────────

  function drawBorderOverlays(
    ctx: CanvasRenderingContext2D,
    cables: NeonCable[],
    neighborIndex: number,
    score: ScoreState,
    time: number,
  ): void {
    // Check if any cable touches a border
    const borderHits = { N: false, S: false, E: false, W: false };

    for (const cable of cables) {
      if (cable.state !== "active" && cable.state !== "completed") continue;
      if (!cable.isBorderLink || !cable.targetPos) continue;

      const t = cable.targetPos;
      if (t.y === 0) borderHits.N = true;
      if (t.y === GRID_SIZE - 1) borderHits.S = true;
      if (t.x === GRID_SIZE - 1) borderHits.E = true;
      if (t.x === 0) borderHits.W = true;
    }

    const neighborName =
      SYNTHETIC_NEIGHBORS[neighborIndex % SYNTHETIC_NEIGHBORS.length];
    const displayScore = Math.floor(score.total).toLocaleString();
    const pulse = 0.5 + Math.sin(time * 0.004 * Math.PI) * 0.5; // 2Hz pulse
    const alpha = 0.4 + pulse * 0.6;

    ctx.font = "bold 8px monospace";
    ctx.textAlign = "center";

    if (borderHits.N) {
      ctx.shadowColor = COL.borderTextGlow;
      ctx.shadowBlur = 6;
      ctx.fillStyle = `rgba(68, 255, 170, ${alpha})`;
      ctx.fillText(`↑ ${neighborName} · ${displayScore}`, CANVAS_SIZE / 2, 10);
      ctx.shadowBlur = 0;
    }

    if (borderHits.S) {
      ctx.shadowColor = COL.borderTextGlow;
      ctx.shadowBlur = 6;
      ctx.fillStyle = `rgba(68, 255, 170, ${alpha})`;
      ctx.fillText(
        `↓ ${neighborName} · ${displayScore}`,
        CANVAS_SIZE / 2,
        CANVAS_SIZE - 4,
      );
      ctx.shadowBlur = 0;
    }

    if (borderHits.W) {
      ctx.save();
      ctx.shadowColor = COL.borderTextGlow;
      ctx.shadowBlur = 6;
      ctx.fillStyle = `rgba(68, 255, 170, ${alpha})`;
      ctx.translate(10, CANVAS_SIZE / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(`← ${neighborName} · ${displayScore}`, 0, 0);
      ctx.restore();
    }

    if (borderHits.E) {
      ctx.save();
      ctx.shadowColor = COL.borderTextGlow;
      ctx.shadowBlur = 6;
      ctx.fillStyle = `rgba(68, 255, 170, ${alpha})`;
      ctx.translate(CANVAS_SIZE - 4, CANVAS_SIZE / 2);
      ctx.rotate(Math.PI / 2);
      ctx.fillText(`→ ${neighborName} · ${displayScore}`, 0, 0);
      ctx.restore();
    }
  }

  // ─────────────────────────────────────────────────────────
  // DRAW: Phase Overlay (Boot, Game Over, Victory)
  // ─────────────────────────────────────────────────────────

  function drawPhaseOverlay(
    ctx: CanvasRenderingContext2D,
    phase: GamePhase,
    score: ScoreState,
    remainingMs: number,
    time: number,
  ): void {
    if (phase === "playing") {
      // In-game HUD elements
      drawHUD(ctx, score, remainingMs, time);
      return;
    }

    // Darken overlay
    ctx.fillStyle = "rgba(5, 5, 10, 0.75)";
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    ctx.textAlign = "center";

    if (phase === "boot") {
      // Title screen
      const titlePulse = 0.7 + Math.sin(time * 0.003) * 0.3;

      ctx.shadowColor = COL.droneFill;
      ctx.shadowBlur = 20;
      ctx.font = "bold 28px monospace";
      ctx.fillStyle = `rgba(0, 229, 255, ${titlePulse})`;
      ctx.fillText("PATCH_32", CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 40);
      ctx.shadowBlur = 0;

      ctx.font = "10px monospace";
      ctx.fillStyle = COL.hudText;
      ctx.fillText(
        "DEFEND THE CORE  ·  180 SECONDS",
        CANVAS_SIZE / 2,
        CANVAS_SIZE / 2,
      );

      const enterPulse = 0.3 + Math.sin(time * 0.005) * 0.7;
      ctx.fillStyle = `rgba(0, 255, 200, ${enterPulse})`;
      ctx.font = "11px monospace";
      ctx.fillText(
        "[ ENTER TO DEPLOY ]",
        CANVAS_SIZE / 2,
        CANVAS_SIZE / 2 + 30,
      );

      // Controls hint
      ctx.font = "7px monospace";
      ctx.fillStyle = "rgba(136, 204, 255, 0.5)";
      ctx.fillText(
        "WASD: MOVE  ·  SPACE: LINK  ·  E: OVERCLOCK",
        CANVAS_SIZE / 2,
        CANVAS_SIZE / 2 + 55,
      );
    } else if (phase === "ready") {
      ctx.shadowColor = COL.coreHealthy;
      ctx.shadowBlur = 15;
      ctx.font = "bold 22px monospace";
      ctx.fillStyle = COL.coreHealthy;
      ctx.fillText("DEPLOYING...", CANVAS_SIZE / 2, CANVAS_SIZE / 2);
      ctx.shadowBlur = 0;
    } else if (phase === "paused") {
      ctx.font = "bold 20px monospace";
      ctx.fillStyle = COL.hudText;
      ctx.fillText("‖ PAUSED", CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 10);

      ctx.font = "9px monospace";
      ctx.fillStyle = "rgba(136, 204, 255, 0.6)";
      ctx.fillText("[ P TO RESUME ]", CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 15);
    } else if (phase === "gameover") {
      ctx.shadowColor = "#ff2244";
      ctx.shadowBlur = 25;
      ctx.font = "bold 24px monospace";
      ctx.fillStyle = "#ff2244";
      ctx.fillText("CORE BREACH", CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 30);
      ctx.shadowBlur = 0;

      ctx.font = "11px monospace";
      ctx.fillStyle = COL.hudText;
      ctx.fillText(
        `SCORE: ${Math.floor(score.total).toLocaleString()}`,
        CANVAS_SIZE / 2,
        CANVAS_SIZE / 2 + 5,
      );
      ctx.fillText(
        `PURGES: ${score.totalPurges}  ·  CHAIN: ${score.longestChain}`,
        CANVAS_SIZE / 2,
        CANVAS_SIZE / 2 + 22,
      );

      const enterPulse = 0.3 + Math.sin(time * 0.005) * 0.7;
      ctx.fillStyle = `rgba(255, 100, 100, ${enterPulse})`;
      ctx.font = "10px monospace";
      ctx.fillText(
        "[ ENTER TO REDEPLOY ]",
        CANVAS_SIZE / 2,
        CANVAS_SIZE / 2 + 50,
      );
    } else if (phase === "victory") {
      ctx.shadowColor = COL.coreHealthy;
      ctx.shadowBlur = 30;
      ctx.font = "bold 22px monospace";
      ctx.fillStyle = COL.coreHealthy;
      ctx.fillText("CORE SECURED", CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 30);
      ctx.shadowBlur = 0;

      ctx.font = "11px monospace";
      ctx.fillStyle = COL.hudText;
      ctx.fillText(
        `FINAL SCORE: ${Math.floor(score.total).toLocaleString()}`,
        CANVAS_SIZE / 2,
        CANVAS_SIZE / 2 + 5,
      );
      ctx.fillText(
        `PURGES: ${score.totalPurges}  ·  BEST CHAIN: ${score.longestChain}`,
        CANVAS_SIZE / 2,
        CANVAS_SIZE / 2 + 22,
      );

      const enterPulse = 0.3 + Math.sin(time * 0.005) * 0.7;
      ctx.fillStyle = `rgba(0, 255, 200, ${enterPulse})`;
      ctx.font = "10px monospace";
      ctx.fillText(
        "[ ENTER TO REDEPLOY ]",
        CANVAS_SIZE / 2,
        CANVAS_SIZE / 2 + 50,
      );
    }
  }

  // ─────────────────────────────────────────────────────────
  // DRAW: In-Game HUD
  // ─────────────────────────────────────────────────────────

  function drawHUD(
    ctx: CanvasRenderingContext2D,
    score: ScoreState,
    remainingMs: number,
    time: number,
  ): void {
    const store = useGameStore.getState();
    const core = store.core;

    ctx.textAlign = "left";
    ctx.font = "bold 9px monospace";

    // Timer (top-center)
    const secs = Math.ceil(remainingMs / 1000);
    const mins = Math.floor(secs / 60);
    const secsR = secs % 60;
    const timerStr = `${mins}:${secsR.toString().padStart(2, "0")}`;

    const timerUrgent = secs <= 30;
    ctx.textAlign = "center";
    ctx.fillStyle = timerUrgent
      ? `rgba(255, 68, 68, ${0.7 + Math.sin(time * 0.008) * 0.3})`
      : COL.hudText;
    ctx.font = "bold 11px monospace";
    ctx.fillText(timerStr, CANVAS_SIZE / 2, 12);

    // Score (top-left)
    ctx.textAlign = "left";
    ctx.font = "bold 8px monospace";
    ctx.fillStyle = COL.hudText;
    ctx.fillText(`SCR ${Math.floor(score.total)}`, 4, 12);

    // Bits/Currency (below score)
    ctx.fillStyle = "#ffcc44";
    ctx.fillText(`₿${score.currency}`, 4, 22);

    // Combo (top-right)
    ctx.textAlign = "right";
    if (score.multiplier > 1) {
      const comboPulse = 0.7 + Math.sin(time * 0.008) * 0.3;
      ctx.fillStyle = `rgba(255, 200, 0, ${comboPulse})`;
      ctx.font = "bold 9px monospace";
      ctx.fillText(`x${score.multiplier.toFixed(1)}`, CANVAS_SIZE - 4, 12);

      ctx.fillStyle = "rgba(255, 200, 0, 0.5)";
      ctx.font = "7px monospace";
      ctx.fillText(`COMBO ${score.comboCount}`, CANVAS_SIZE - 4, 22);
    }

    // Core health bar (bottom-center)
    const barWidth = 80;
    const barHeight = 5;
    const barX = (CANVAS_SIZE - barWidth) / 2;
    const barY = CANVAS_SIZE - 12;
    const healthPct = Math.max(0, core.health / CORE_MAX_HEALTH);

    ctx.fillStyle = "rgba(20, 20, 30, 0.7)";
    ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);

    const barColor = lerpColor("#cc2233", "#00ffc8", healthPct);
    ctx.fillStyle = barColor;
    ctx.fillRect(barX, barY, barWidth * healthPct, barHeight);

    ctx.textAlign = "center";
    ctx.font = "6px monospace";
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.fillText(
      `CORE ${Math.ceil(core.health)}/${CORE_MAX_HEALTH}`,
      CANVAS_SIZE / 2,
      barY - 2,
    );

    // Overclock cooldown indicator (bottom-right)
    if (core.overclockCooldownMs > 0) {
      ctx.textAlign = "right";
      ctx.font = "7px monospace";
      ctx.fillStyle = "rgba(255, 170, 0, 0.5)";
      ctx.fillText(
        `OC ${(core.overclockCooldownMs / 1000).toFixed(0)}s`,
        CANVAS_SIZE - 4,
        CANVAS_SIZE - 4,
      );
    } else if ((store.upgrades.get("core_overclock")?.level ?? 0) > 0) {
      ctx.textAlign = "right";
      ctx.font = "7px monospace";
      ctx.fillStyle = "rgba(255, 170, 0, 0.8)";
      ctx.fillText("OC READY", CANVAS_SIZE - 4, CANVAS_SIZE - 4);
    }

    // Entity count (bottom-left, debug)
    ctx.textAlign = "left";
    ctx.font = "6px monospace";
    ctx.fillStyle = "rgba(136, 204, 255, 0.3)";
    ctx.fillText(`ENT:${store.activeEntityCount}`, 4, CANVAS_SIZE - 4);
  }

  // ═════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        minHeight: "100vh",
        backgroundColor: "#050508",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "relative",
          width: CANVAS_SIZE,
          height: CANVAS_SIZE,
          maxWidth: "100vw",
          maxHeight: "100vh",
          aspectRatio: "1 / 1",
          imageRendering: "pixelated",
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            width: "100%",
            height: "100%",
            display: "block",
            cursor: "crosshair",
            imageRendering: "pixelated",
          }}
          tabIndex={0}
        />
      </div>
    </div>
  );
}
