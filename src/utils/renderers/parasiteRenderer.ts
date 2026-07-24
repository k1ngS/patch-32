import { TILE_SIZE } from "@/constants/gameConfig";
import type { Parasite } from "@/types/game";
import { COL } from "./colors";

import { GAME_DURATION_MS } from "@/constants/gameConfig";

export function drawParasites(
  ctx: CanvasRenderingContext2D,
  parasites: Parasite[],
  elapsedMs: number,
  time: number,
  infectionAccumulatorMs: number
): void {
  const progression = Math.min(1, Math.max(0, elapsedMs / GAME_DURATION_MS));
  const tickProgress = Math.min(1, Math.max(0, infectionAccumulatorMs / 1000));

  for (let i = 0; i < parasites.length; i++) {
    const p = parasites[i];
    if (p.markedForRemoval) continue;

    // Grid-snapped memory sector position (no unit walking/sliding interpolation)
    const px = p.pos.x * TILE_SIZE + TILE_SIZE / 2;
    const py = p.pos.y * TILE_SIZE + TILE_SIZE / 2;

    switch (p.variant) {
      case "pulse_worm":
        drawMemoryLeak(ctx, px, py, p, progression, time);
        break;
      case "siege_bloc":
        drawSectorLock(ctx, px, py, p, progression, time);
        break;
      case "storm_flitter":
        drawThreadSpike(ctx, px, py, p, progression, time);
        break;
      case "ransomware_boss":
        drawRootkitOverride(ctx, px, py, p, progression, time);
        break;
    }
  }
}

/**
 * pulse_worm -> Memory Leak
 * Visual: Unstable memory allocation cell, rectangular block with hex memory address.
 */
function drawMemoryLeak(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  p: Parasite,
  progression: number,
  time: number
): void {
  const isLatePhase = progression > 0.5;
  const blink = (Math.floor(time / (isLatePhase ? 200 : 400)) + p.id) % 2 === 0;
  const size = TILE_SIZE * 0.42;

  ctx.save();
  ctx.translate(cx, cy);

  // Background cell block
  ctx.fillStyle = blink ? "rgba(220, 38, 38, 0.4)" : "rgba(185, 28, 28, 0.25)";
  ctx.fillRect(-size, -size, size * 2, size * 2);

  // Crisp border
  ctx.strokeStyle = blink ? "#ef4444" : "#b91c1c";
  ctx.lineWidth = 1;
  ctx.strokeRect(-size, -size, size * 2, size * 2);

  // Inner memory address label
  const hexAddr = `0x${((p.id * 17 + 0x32A0) % 0xffff).toString(16).toUpperCase()}`;
  ctx.font = "bold 7px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = blink ? "#fef2f2" : "#fca5a5";
  ctx.fillText(hexAddr, 0, 0);

  ctx.restore();
}

/**
 * siege_bloc -> Sector Lock
 * Visual: Locked memory sector block with crisp double system alert border.
 */
function drawSectorLock(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  p: Parasite,
  progression: number,
  time: number
): void {
  const size = TILE_SIZE * 0.46;

  ctx.save();
  ctx.translate(cx, cy);

  // Locked Sector Background
  ctx.fillStyle = "#1c0404";
  ctx.fillRect(-size, -size, size * 2, size * 2);

  // Double Border for Locked Sector
  ctx.strokeStyle = "#dc2626";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-size, -size, size * 2, size * 2);

  ctx.strokeStyle = "#991b1b";
  ctx.lineWidth = 1;
  ctx.strokeRect(-size + 2, -size + 2, (size - 2) * 2, (size - 2) * 2);

  // Status tag label
  ctx.font = "bold 7px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#f87171";
  ctx.fillText("LOCKED", 0, 0);

  ctx.restore();
}

/**
 * storm_flitter -> Thread Spike
 * Visual: Erratic bus line / thread execution pulse.
 */
function drawThreadSpike(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  p: Parasite,
  progression: number,
  time: number
): void {
  const flash = (Math.floor(time / 120) + p.id) % 2 === 0;
  const size = TILE_SIZE * 0.38;

  ctx.save();
  ctx.translate(cx, cy);

  // Pulse Line (Bus Thread)
  ctx.strokeStyle = flash ? "#f59e0b" : "#d97706";
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.moveTo(-size * 1.2, 0);
  ctx.lineTo(-size * 0.4, 0);
  ctx.lineTo(-size * 0.2, -size * 0.6);
  ctx.lineTo(size * 0.2, size * 0.6);
  ctx.lineTo(size * 0.4, 0);
  ctx.lineTo(size * 1.2, 0);
  ctx.stroke();

  // Technical Tag
  ctx.font = "bold 6px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = flash ? "#fbbf24" : "#f59e0b";
  ctx.fillText("SPIKE", 0, -size * 0.8);

  ctx.restore();
}

/**
 * ransomware_boss -> Rootkit Override
 * Visual: Critical Kernel Memory Corruption region with system exception report status.
 */
function drawRootkitOverride(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  p: Parasite,
  progression: number,
  time: number
): void {
  const size = TILE_SIZE * 0.9;
  const blink = Math.floor(time / 250) % 2 === 0;

  ctx.save();
  ctx.translate(cx, cy);

  // Background Region
  ctx.fillStyle = "#180205";
  ctx.fillRect(-size, -size, size * 2, size * 2);

  // Outer Critical Double Border
  ctx.strokeStyle = blink ? "#ef4444" : "#991b1b";
  ctx.lineWidth = 2;
  ctx.strokeRect(-size, -size, size * 2, size * 2);

  ctx.strokeStyle = "#7f1d1d";
  ctx.lineWidth = 1;
  ctx.strokeRect(-size + 3, -size + 3, (size - 3) * 2, (size - 3) * 2);

  // Header Title
  ctx.font = "bold 8px monospace";
  ctx.textAlign = "center";
  ctx.fillStyle = "#fca5a5";
  ctx.fillText("ROOTKIT_OVERRIDE", 0, -size * 0.4);

  // Hex exception code
  ctx.font = "7px monospace";
  ctx.fillStyle = "#f87171";
  ctx.fillText("EX_OVERFLOW_0x32", 0, 0);

  // Health Bar (System Integrity Bar)
  const hpPct = Math.max(0, p.hp / 800);
  const barW = size * 1.6;
  ctx.fillStyle = "#000000";
  ctx.fillRect(-barW / 2, size * 0.4, barW, 4);
  ctx.fillStyle = "#ef4444";
  ctx.fillRect(-barW / 2, size * 0.4, barW * hpPct, 4);
  ctx.strokeStyle = "#7f1d1d";
  ctx.lineWidth = 0.5;
  ctx.strokeRect(-barW / 2, size * 0.4, barW, 4);

  ctx.restore();
}

