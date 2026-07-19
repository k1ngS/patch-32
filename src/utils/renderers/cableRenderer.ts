import { TILE_SIZE } from "@/constants/gameConfig";
import type { NeonCable } from "@/types/game";
import { COL } from "./colors";

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
    const glowCol = isBorder ? COL.cableBorderGlow : COL.cableGlow;
    const lineCol = isBorder ? COL.cableBorder : COL.cableCyan;

    const flowPhase = (time * 0.003) % 1;

    ctx.shadowColor = glowCol;
    ctx.shadowBlur = 8;

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

    if (cable.state === "active" || cable.state === "completed") {
      const particleT = flowPhase;
      const ppx = sx + (ex - sx) * particleT;
      const ppy = sy + (ey - sy) * particleT;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(ppx, ppy, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = lineCol;
    ctx.beginPath();
    ctx.arc(sx, sy, 3, 0, Math.PI * 2);
    ctx.fill();

    if (cable.targetPos) {
      const tx = cable.targetPos.x * TILE_SIZE + TILE_SIZE / 2;
      const ty = cable.targetPos.y * TILE_SIZE + TILE_SIZE / 2;
      ctx.beginPath();
      ctx.arc(tx, ty, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
