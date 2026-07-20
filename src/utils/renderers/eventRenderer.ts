import { TILE_SIZE } from "@/constants/gameConfig";
import type { VisualEvent } from "@/types/game";

export function drawVisualEvents(
  ctx: CanvasRenderingContext2D,
  visualEvents: VisualEvent[],
  time: number
): void {
  for (const ev of visualEvents) {
    const age = time - ev.bornAt;
    if (age < 0) continue;

    const cx = ev.x * TILE_SIZE + TILE_SIZE / 2;
    const cy = ev.y * TILE_SIZE + TILE_SIZE / 2;

    // Flash inicial com onda de choque expansiva
    if (age <= 120) {
      const progress = age / 120;
      const flashAlpha = 1 - progress;
      const shockwaveRadius = 8 + progress * 24;

      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      
      // Anel expansivo de Purge
      ctx.strokeStyle = `rgba(0, 255, 200, ${flashAlpha * 0.8})`;
      ctx.lineWidth = 2 * (1 - progress);
      ctx.beginPath();
      ctx.arc(cx, cy, shockwaveRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Flash central
      ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha * 0.7})`;
      ctx.fillRect(cx - 6, cy - 6, 12, 12);
      ctx.restore();
    }

    // Texto de Bits flutuante e animado
    if (ev.bits > 0 && age <= 450) {
      const progress = age / 450;
      const textAlpha = Math.sin((1 - progress) * Math.PI * 0.5);
      const floatY = cy - progress * 36;
      const scale = progress < 0.15 ? 1 + (progress / 0.15) * 0.3 : 1.3 - (progress - 0.15) * 0.3;

      ctx.save();
      ctx.shadowColor = "#ffcc00";
      ctx.shadowBlur = 8;
      ctx.fillStyle = `rgba(255, 217, 106, ${textAlpha})`;
      ctx.font = `bold ${Math.round(11 * scale)}px monospace`;
      ctx.textAlign = "center";
      ctx.fillText(`+${ev.bits} ₿`, cx, floatY);
      ctx.shadowBlur = 0;
      ctx.restore();
    }
  }
}
