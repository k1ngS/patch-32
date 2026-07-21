import { TILE_SIZE } from "@/constants/gameConfig";
import type { NeonCable } from "@/types/game";

export function drawCables(
  ctx: CanvasRenderingContext2D,
  cables: NeonCable[],
  time: number
): void {
  for (let i = 0; i < cables.length; i++) {
    const cable = cables[i];
    const sx = cable.sourcePos.x * TILE_SIZE + TILE_SIZE / 2;
    const sy = cable.sourcePos.y * TILE_SIZE + TILE_SIZE / 2;

    let ex: number, ey: number;

    if (cable.targetPos) {
      ex = cable.targetPos.x * TILE_SIZE + TILE_SIZE / 2;
      ey = cable.targetPos.y * TILE_SIZE + TILE_SIZE / 2;
    } else {
      continue;
    }

    if (cable.state === "extending" || cable.state === "retracting") {
      const t = cable.progress;
      ex = sx + (ex - sx) * t;
      ey = sy + (ey - sy) * t;
    }

    const isBorder = cable.isBorderLink;
    const lineCol = isBorder ? "#10b981" : "#06b6d4";

    ctx.save();

    // Verification Thread Monitoring Line
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.strokeStyle = lineCol;
    ctx.lineWidth = 1;
    ctx.globalAlpha = cable.state === "completed" ? 0.7 + Math.sin(time * 0.005) * 0.2 : 0.9;
    if (isBorder) {
      ctx.setLineDash([3, 3]);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;

    // Source Probe Marker (Small Square)
    ctx.fillStyle = lineCol;
    ctx.fillRect(sx - 2, sy - 2, 4, 4);

    // Target Probe Marker (Small Square)
    if (cable.targetPos) {
      const tx = cable.targetPos.x * TILE_SIZE + TILE_SIZE / 2;
      const ty = cable.targetPos.y * TILE_SIZE + TILE_SIZE / 2;
      ctx.fillRect(tx - 2, ty - 2, 4, 4);
    }

    ctx.restore();
  }
}

