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

  // Frequência de pulsação acelera conforme a saúde cai (frequência cardíaca mecânica)
  const pulseFreq = 0.003 + (1 - healthPct) * 0.008;
  const basePulse = 0.85 + Math.sin(time * pulseFreq) * (0.15 + (1 - healthPct) * 0.1);
  const radius = TILE_SIZE * 0.75 * basePulse; // Increased from 0.6

  const coreColor = lerpColor("#ff1133", "#00ffc8", healthPct);

  // Aura de Alerta Perimetral em caso de perigo crítico (< 40% HP)
  if (healthPct < 0.4) {
    const alertPulse = 0.4 + Math.sin(time * 0.012) * 0.4;
    ctx.shadowColor = "#ff0033";
    ctx.shadowBlur = 40;
    ctx.beginPath();
    ctx.arc(cx, cy, TILE_SIZE * 2.0, 0, Math.PI * 2); // Increased from 1.8
    ctx.strokeStyle = `rgba(255, 0, 51, ${alertPulse * (0.4 - healthPct)})`;
    ctx.lineWidth = 2; // Increased from 1.5
    ctx.setLineDash([6, 6]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.shadowBlur = 0;
  }

  // Brilho Principal do Core
  ctx.shadowColor = coreColor;
  ctx.shadowBlur = 20 + (1 - healthPct) * 25;

  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = coreColor;
  ctx.globalAlpha = 0.85;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;

  // Anel Interno de Reator
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.65, 0, Math.PI * 2); // Increased from 0.55
  ctx.strokeStyle = `rgba(255, 255, 255, ${0.4 + healthPct * 0.5})`;
  ctx.lineWidth = 2; // Increased from 1.5
  ctx.stroke();

  // Aletas de Rotação Magnética
  const rotSpeed = core.overclockActive ? 0.01 : 0.002 + (1 - healthPct) * 0.004;
  const rot = time * rotSpeed;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  for (let i = 0; i < 4; i++) {
    ctx.rotate(Math.PI / 2);
    ctx.beginPath();
    ctx.moveTo(radius * 0.75, 0); // Increased from 0.7
    ctx.lineTo(radius * 1.35, 0); // Increased from 1.25
    ctx.strokeStyle = healthPct < 0.3 ? `rgba(255, 68, 68, 0.8)` : `rgba(255, 255, 255, 0.5)`;
    ctx.lineWidth = 1.5; // Increased from 1.2
    ctx.stroke();
  }
  ctx.restore();

  // Escudo
  if (core.shieldPoints > 0) {
    const shieldPulse = 0.6 + Math.sin(time * 0.006) * 0.4;
    const shieldRadius = TILE_SIZE * 1.35; // Increased from 1.15

    ctx.shadowColor = COL.coreShieldGlow;
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(cx, cy, shieldRadius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(68, 136, 255, ${0.6 * shieldPulse})`;
    ctx.lineWidth = 3; // Increased from 2.5
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // Overclock FX
  if (core.overclockActive) {
    const ocPulse = 0.5 + Math.sin(time * 0.012) * 0.5;
    ctx.shadowColor = COL.coreOverclock;
    ctx.shadowBlur = 25;
    ctx.beginPath();
    ctx.arc(cx, cy, TILE_SIZE * 1.6, 0, Math.PI * 2); // Increased from 1.4
    ctx.strokeStyle = `rgba(255, 170, 0, ${0.6 * ocPulse})`;
    ctx.lineWidth = 2.5; // Increased from 2
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.shadowBlur = 0;
  }
}
