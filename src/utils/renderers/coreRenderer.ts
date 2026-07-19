import { CORE_POS, TILE_SIZE, CORE_MAX_HEALTH } from "@/constants/gameConfig";
import type { CoreState } from "@/types/game";
import { COL, lerpColor } from "./colors";

export function drawCore(
  ctx: CanvasRenderingContext2D,
  core: CoreState,
  time: number
): void {
  const cx = CORE_POS.x * TILE_SIZE + TILE_SIZE / 2;
  const cy = CORE_POS.y * TILE_SIZE + TILE_SIZE / 2;
  const healthPct = Math.max(0, core.health / CORE_MAX_HEALTH);

  const basePulse = 0.85 + Math.sin(time * 0.003) * 0.15;
  const radius = TILE_SIZE * 0.6 * basePulse;

  const coreColor = lerpColor("#cc2233", "#00ffc8", healthPct);

  ctx.shadowColor = coreColor;
  ctx.shadowBlur = 20 + (1 - healthPct) * 15;

  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = coreColor;
  ctx.globalAlpha = 0.8;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;

  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.55, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 + healthPct * 0.4})`;
  ctx.lineWidth = 1.5;
  ctx.stroke();

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

    ctx.font = "7px monospace";
    ctx.fillStyle = COL.coreShield;
    ctx.textAlign = "center";
    ctx.fillText(
      `⛨${Math.ceil(core.shieldPoints)}`,
      cx,
      cy + shieldRadius + 10,
    );
  }

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
