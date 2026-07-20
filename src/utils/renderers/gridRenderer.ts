import { CANVAS_SIZE, TILE_SIZE, GRID_SIZE, CABLE_LENGTHS } from "@/constants/gameConfig";
import type { DataNode, GridPosition, GameState } from "@/types/game";
import { COL } from "./colors";

export function drawGrid(
  ctx: CanvasRenderingContext2D,
  grid: DataNode[],
  saturation: number,
  time: number
): void {
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

  for (let i = 0; i < grid.length; i++) {
    const node = grid[i];
    const px = node.pos.x * TILE_SIZE;
    const py = node.pos.y * TILE_SIZE;

    if (node.state === "corrupted") {
      const pulse = 0.7 + Math.sin(time * 0.004 + i * 0.1) * 0.3;
      ctx.fillStyle = `rgba(204, 34, 51, ${0.35 * pulse})`;
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

      ctx.shadowColor = COL.nodeCorruptedGlow;
      ctx.shadowBlur = 6;
      ctx.fillStyle = `rgba(255, 50, 50, ${0.15 * pulse})`;
      ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
      ctx.shadowBlur = 0;
    } else if (node.state === "unstable") {
      const flicker = 0.5 + Math.sin(time * 0.006 + i * 0.3) * 0.5;
      ctx.fillStyle = `rgba(212, 160, 23, ${0.25 * flicker})`;
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

      ctx.strokeStyle = `rgba(212, 160, 23, ${0.15 * flicker})`;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + TILE_SIZE, py + TILE_SIZE);
      ctx.moveTo(px + TILE_SIZE, py);
      ctx.lineTo(px, py + TILE_SIZE);
      ctx.stroke();
    } else if (node.purgeImmunityMs > 0) {
      const fade = Math.min(1, node.purgeImmunityMs / 1500);
      ctx.fillStyle = `rgba(0, 255, 180, ${0.08 * fade})`;
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
    }

    if (node.auraSpreadBuff > 0 && node.state !== "corrupted") {
      ctx.fillStyle = `rgba(150, 30, 30, ${0.1 * node.auraSpreadBuff})`;
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
    }
  }

  // Scanline Radar
  const scanCycle = 4000;
  const scanProgress = (time % scanCycle) / scanCycle;
  const scanY = scanProgress * CANVAS_SIZE;
  
  if (saturation > 0.4) {
    const pulse = 0.15 + Math.sin(time * 0.01) * 0.1;
    ctx.fillStyle = `rgba(220, 38, 38, ${pulse})`;
  } else {
    ctx.fillStyle = "rgba(88, 224, 216, 0.06)";
  }
  
  ctx.fillRect(0, scanY, CANVAS_SIZE, 1);
}

export function drawHoverPreview(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  time: number,
  hoverPos: GridPosition | null
): void {
  if (!hoverPos || state.phase !== "playing") return;

  const idx = hoverPos.y * GRID_SIZE + hoverPos.x;
  const node = state.grid[idx];
  
  if (node && node.state === "clean" && !node.isCoreNode) {
    const cx = hoverPos.x * TILE_SIZE + TILE_SIZE / 2;
    const cy = hoverPos.y * TILE_SIZE + TILE_SIZE / 2;
    
    const blink = (time % 800) < 400 ? 0.55 : 0.2;
    
    ctx.beginPath();
    ctx.arc(cx, cy, TILE_SIZE * 0.6, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(120, 220, 255, ${blink})`;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    const cableLengthLevel = state.upgrades.get("cable_length")?.level ?? 0;
    const reach = CABLE_LENGTHS[cableLengthLevel];
    
    // Reduces opacity as the radius grows (max reach ~22)
    const opacity = Math.max(0.04, 0.18 - (reach * 0.006));

    ctx.beginPath();
    ctx.arc(cx, cy, reach * TILE_SIZE, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(120, 220, 255, ${opacity.toFixed(3)})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}
