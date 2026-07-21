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
  const tickProgress = Math.min(1, Math.max(0, infectionAccumulatorMs / 1000)); // INFECTION_TICK_RATE_MS = 1000

  for (let i = 0; i < parasites.length; i++) {
    const p = parasites[i];
    if (p.markedForRemoval) continue;

    const prev = p.prevPos || p.pos;
    const lerpX = prev.x + (p.pos.x - prev.x) * tickProgress;
    const lerpY = prev.y + (p.pos.y - prev.y) * tickProgress;

    const px = lerpX * TILE_SIZE + TILE_SIZE / 2;
    const py = lerpY * TILE_SIZE + TILE_SIZE / 2;

    switch (p.variant) {
      case "pulse_worm":
        drawPulseWorm(ctx, px, py, p, progression, time);
        break;
      case "siege_bloc":
        drawSiegeBloc(ctx, px, py, p, progression, time);
        break;
      case "storm_flitter":
        drawStormFlitter(ctx, px, py, p, progression, time);
        break;
      case "ransomware_boss":
        drawRansomwareBoss(ctx, px, py, p, progression, time);
        break;
    }
  }
}

function drawPulseWorm(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  p: Parasite,
  progression: number,
  time: number
): void {
  const isLatePhase = progression > 0.5;
  const freq = isLatePhase ? 0.025 : 0.0094; // ~4Hz late, ~1.5Hz early
  const pulse = 0.7 + Math.sin(time * freq + p.id * 1.7) * 0.3;
  const size = TILE_SIZE * 0.55 * pulse; // Increased from 0.4

  ctx.save();
  ctx.translate(cx, cy);

  ctx.shadowColor = COL.pulseWormGlow;
  ctx.shadowBlur = 8 * pulse;

  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.lineTo(-size * 0.87, size * 0.5);
  ctx.lineTo(size * 0.87, size * 0.5);
  ctx.closePath();
  ctx.fillStyle = COL.pulseWorm;

  if (isLatePhase) {
    ctx.globalAlpha = 0.6 + Math.random() * 0.4; // Flicker
  } else {
    ctx.globalAlpha = 0.7 + pulse * 0.3;
  }
  
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;

  if ((p.ticksSincePulse || 0) >= 2) {
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(0, -size - 3, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawSiegeBloc(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  p: Parasite,
  progression: number,
  time: number
): void {
  const halfSize = TILE_SIZE * 0.55; // Increased from 0.4
  const isLatePhase = progression > 0.4;

  ctx.save();
  ctx.translate(cx, cy);

  // Outer Armor Aura
  const auraScale = 1.0 + Math.sin(time * 0.002) * 0.2;
  const auraVisible = Math.sin(time * 0.004) * 0.5 + 0.5;
  ctx.strokeStyle = `rgba(150, 30, 30, ${0.4 * auraVisible})`;
  ctx.lineWidth = 0.5;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.arc(0, 0, TILE_SIZE * 1.0 * auraScale, 0, Math.PI * 2); // Increased from 0.8
  ctx.stroke();
  ctx.setLineDash([]);

  // Base Bloc
  ctx.fillStyle = COL.siegeBloc;
  ctx.fillRect(-halfSize, -halfSize, halfSize * 2, halfSize * 2);

  ctx.strokeStyle = "#cc3344";
  ctx.lineWidth = 1;
  ctx.strokeRect(-halfSize, -halfSize, halfSize * 2, halfSize * 2);

  // Rotating Cross
  ctx.save();
  if (isLatePhase) {
    ctx.rotate(time * 0.002);
  }
  ctx.strokeStyle = COL.siegeBlocCross;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-halfSize * 0.7, 0);
  ctx.lineTo(halfSize * 0.7, 0);
  ctx.moveTo(0, -halfSize * 0.7);
  ctx.lineTo(0, halfSize * 0.7);
  ctx.stroke();
  
  ctx.fillStyle = COL.siegeBlocCross;
  ctx.beginPath();
  ctx.arc(0, 0, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

function drawStormFlitter(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  p: Parasite,
  progression: number,
  time: number
): void {
  const isLatePhase = progression > 0.6;
  const flash = Math.sin(time * 0.015 + p.id * 2.3) > 0.7 ? 1.3 : 1.0;
  const size = TILE_SIZE * 0.50 * flash; // Increased from 0.35

  // Jitter calculation
  const jitterAmt = isLatePhase ? 3 : 1.5;
  const jx = (Math.random() * 2 - 1) * jitterAmt;
  const jy = (Math.random() * 2 - 1) * jitterAmt;

  ctx.save();
  ctx.translate(cx + jx, cy + jy);

  ctx.shadowColor = COL.stormFlitterGlow;
  ctx.shadowBlur = 4 * flash;

  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.lineTo(size, 0);
  ctx.lineTo(0, size);
  ctx.lineTo(-size, 0);
  ctx.closePath();
  ctx.fillStyle = COL.stormFlitter;
  ctx.globalAlpha = 0.6 + flash * 0.3;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;

  if (flash > 1.1) {
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 0.5;
    const sparkCount = isLatePhase ? 6 : 3;
    for (let s = 0; s < sparkCount; s++) {
      const angle = (time * 0.01 + s * (Math.PI * 2 / sparkCount)) % (Math.PI * 2);
      const len = size * 0.8;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(angle) * len, Math.sin(angle) * len);
      ctx.stroke();
    }
  }

  ctx.restore();
}

function drawRansomwareBoss(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  p: Parasite,
  progression: number,
  time: number
): void {
  const size = TILE_SIZE * 0.95;
  const pulse = Math.sin(time * 0.01) * 0.15 + 1.0;

  ctx.save();
  ctx.translate(cx, cy);

  // Outer Crimson Aura & Spikes
  ctx.shadowColor = "#ff0055";
  ctx.shadowBlur = 20 * pulse;

  ctx.fillStyle = "#2a000a";
  ctx.strokeStyle = "#ff0055";
  ctx.lineWidth = 2.5;

  ctx.beginPath();
  const spikeCount = 8;
  for (let i = 0; i < spikeCount * 2; i++) {
    const r = (i % 2 === 0 ? size : size * 0.5) * pulse;
    const angle = (Math.PI / spikeCount) * i + time * 0.003;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Core Diamond
  ctx.fillStyle = "#ff0055";
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.4);
  ctx.lineTo(size * 0.4, 0);
  ctx.lineTo(0, size * 0.4);
  ctx.lineTo(-size * 0.4, 0);
  ctx.closePath();
  ctx.fill();

  // Label & HP Bar
  ctx.shadowBlur = 0;
  ctx.font = "bold 9px monospace";
  ctx.textAlign = "center";
  ctx.fillStyle = "#ff0055";
  ctx.fillText("RANSOMWARE", 0, -size * 1.25);

  // Health Bar
  const hpPct = Math.max(0, p.hp / 800);
  const barW = size * 1.8;
  ctx.fillStyle = "rgba(0,0,0,0.8)";
  ctx.fillRect(-barW / 2, -size * 1.05, barW, 4);
  ctx.fillStyle = "#ff0055";
  ctx.fillRect(-barW / 2, -size * 1.05, barW * hpPct, 4);

  ctx.restore();
}
