import { TILE_SIZE } from "@/constants/gameConfig";
import type { EmitterNode } from "@/types/game";

export function drawEmitters(
  ctx: CanvasRenderingContext2D,
  emitters: EmitterNode[],
  thermalThrottleMs: number,
  time: number
): void {
  for (const emitter of emitters) {
    const cx = emitter.pos.x * TILE_SIZE + TILE_SIZE / 2;
    const cy = emitter.pos.y * TILE_SIZE + TILE_SIZE / 2;
    const size = 5;

    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 2;
      const x = cx + size * Math.cos(angle);
      const y = cy + size * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();

    if (emitter.state === "ready") {
      if (thermalThrottleMs > 0) {
        ctx.fillStyle = "#d97706";
        ctx.shadowColor = "#d97706";
      } else {
        ctx.fillStyle = "#58e0d8";
        ctx.shadowColor = "#58e0d8";
      }
      ctx.shadowBlur = 10 + Math.sin(time * 0.005) * 5;
    } else if (emitter.state === "cooldown") {
      if (thermalThrottleMs > 0) {
        ctx.fillStyle = "#92400e";
      } else {
        ctx.fillStyle = "#2a7a76";
      }
      ctx.shadowBlur = 0;
    } else if (emitter.state === "booting") {
      ctx.fillStyle = "#ff2244";
      ctx.shadowColor = "#ff2244";
      ctx.shadowBlur = 15 * (0.5 + Math.sin(time * 0.015) * 0.5);
    }

    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.beginPath();
    ctx.arc(cx, cy, emitter.length * TILE_SIZE, 0, Math.PI * 2);
    ctx.strokeStyle = emitter.state === "booting" ? "rgba(255, 34, 68, 0.1)" : "rgba(88, 224, 216, 0.1)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}
