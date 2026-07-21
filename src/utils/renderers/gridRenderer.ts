import { CANVAS_SIZE, TILE_SIZE, GRID_SIZE, CABLE_LENGTHS } from "@/constants/gameConfig";
import type { DataNode, GridPosition, GameState } from "@/types/game";
import { COL } from "./colors";

export function drawGrid(
  ctx: CanvasRenderingContext2D,
  grid: DataNode[],
  saturation: number,
  time: number
): void {
  // Cor das linhas do Grid reage à saturação (Apenas em crise)
  if (saturation > 0.7) {
    const pulse = 0.15 + Math.sin(time * 0.008) * 0.1;
    ctx.strokeStyle = `rgba(220, 38, 38, ${pulse})`;
  } else if (saturation > 0.4) {
    ctx.strokeStyle = "rgba(212, 160, 23, 0.15)";
  } else {
    ctx.strokeStyle = COL.gridLine;
  }

  // 1. Linhas finas de matriz de memória (0.5px)
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

  // 2. Micro-pontos de interseção de hardware (Matriz densa)
  ctx.fillStyle = COL.gridDot;
  for (let x = 0; x <= GRID_SIZE; x += 4) {
    for (let y = 0; y <= GRID_SIZE; y += 4) {
      const px = x * TILE_SIZE;
      const py = y * TILE_SIZE;
      ctx.fillRect(px - 1, py - 1, 2, 2);
    }
  }

  // 3. Renderização de todos os 1024 setores da matriz (32x32)
  for (let i = 0; i < grid.length; i++) {
    const node = grid[i];
    const px = node.pos.x * TILE_SIZE;
    const py = node.pos.y * TILE_SIZE;

    if (node.state === "corrupted") {
      const pulse = 0.7 + Math.sin(time * 0.004 + i * 0.1) * 0.3;
      ctx.fillStyle = `rgba(204, 34, 51, ${0.45 * pulse})`;
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

      ctx.fillStyle = `rgba(255, 60, 60, ${0.2 * pulse})`;
      ctx.fillRect(px + 1, py + 1, TILE_SIZE - 2, TILE_SIZE - 2);
    } else if (node.state === "unstable") {
      const flickerSpeed = saturation > 0.5 ? 0.012 : 0.006;
      const flicker = 0.5 + Math.sin(time * flickerSpeed + i * 0.3) * 0.5;
      ctx.fillStyle = `rgba(212, 160, 23, ${0.3 * flicker})`;
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

      ctx.strokeStyle = `rgba(212, 160, 23, ${0.3 * flicker})`;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + TILE_SIZE, py + TILE_SIZE);
      ctx.moveTo(px + TILE_SIZE, py);
      ctx.lineTo(px, py + TILE_SIZE);
      ctx.stroke();
    } else {
      // Setores limpos: Matriz de memória monitorada em alta densidade
      ctx.fillStyle = "rgba(15, 23, 42, 0.2)";
      ctx.fillRect(px + 0.5, py + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.02)";
      ctx.strokeRect(px + 0.5, py + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
    }

    if (node.purgeImmunityMs > 0) {
      const fade = Math.min(1, node.purgeImmunityMs / 1500);
      ctx.fillStyle = `rgba(0, 255, 180, ${0.15 * fade})`;
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
    }

    if (node.auraSpreadBuff > 0 && node.state !== "corrupted") {
      ctx.fillStyle = `rgba(150, 30, 30, ${0.1 * node.auraSpreadBuff})`;
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
    }
  }

  // Scanline Radar Dinâmico por nível de Perigo
  const scanCycle = saturation > 0.5 ? 2000 : 4000;
  const scanProgress = (time % scanCycle) / scanCycle;
  const scanY = scanProgress * CANVAS_SIZE;
  
  if (saturation > 0.6) {
    const pulse = 0.3 + Math.sin(time * 0.01) * 0.2;
    ctx.fillStyle = `rgba(220, 38, 38, ${pulse})`;
  } else if (saturation > 0.3) {
    ctx.fillStyle = "rgba(245, 158, 11, 0.15)";
  } else {
    ctx.fillStyle = "rgba(88, 224, 216, 0.08)";
  }
  
  ctx.fillRect(0, scanY, CANVAS_SIZE, 1.5);
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
    
    const isCritical = state.core.health < 400; // < 20% max health
    const blinkCycle = isCritical ? 1600 : 800; // Scanner blinks slower in Critical state
    const blink = (time % blinkCycle) < (blinkCycle / 2) ? 0.55 : 0.2;
    
    ctx.beginPath();
    ctx.arc(cx, cy, TILE_SIZE * 0.6, 0, Math.PI * 2);
    ctx.strokeStyle = isCritical ? `rgba(239, 68, 68, ${blink})` : `rgba(120, 220, 255, ${blink})`;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    const cableLengthLevel = state.upgrades.get("cable_length")?.level ?? 0;
    const reach = CABLE_LENGTHS[cableLengthLevel];
    
    const opacity = Math.max(0.04, 0.18 - (reach * 0.006));

    ctx.beginPath();
    ctx.arc(cx, cy, reach * TILE_SIZE, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(120, 220, 255, ${opacity.toFixed(3)})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}
