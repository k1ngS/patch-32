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

    if (age <= 80) {
      const flashAlpha = 1 - (age / 80);
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
      ctx.fillRect(cx - 8, cy - 8, 16, 16);
      ctx.globalCompositeOperation = "source-over";
    }

    if (ev.bits > 0 && age <= 380) {
      const textAlpha = 1 - (age / 380);
      const floatY = cy - (age / 380) * 32;
      
      ctx.fillStyle = `rgba(255, 217, 106, ${textAlpha})`;
      ctx.font = "bold 11px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`+${ev.bits}`, cx, floatY);
    }
  }
}
