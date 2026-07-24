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
  const isCritical = healthPct < 0.3;
  const size = TILE_SIZE * 1.2;

  ctx.save();
  ctx.translate(cx, cy);

  // Kernel Sector 0x00 Background Block
  ctx.fillStyle = isCritical ? "rgba(127, 29, 29, 0.6)" : "rgba(8, 51, 68, 0.6)";
  ctx.fillRect(-size, -size, size * 2, size * 2);

  // Double Border for Kernel Memory Sector
  ctx.strokeStyle = isCritical ? "#ef4444" : "#06b6d4";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-size, -size, size * 2, size * 2);

  ctx.strokeStyle = isCritical ? "#7f1d1d" : "#0891b2";
  ctx.lineWidth = 1;
  ctx.strokeRect(-size + 3, -size + 3, (size - 3) * 2, (size - 3) * 2);

  // Header Title
  ctx.font = "bold 7px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = isCritical ? "#fca5a5" : "#cffaff";
  ctx.fillText("KERNEL MEMORY", 0, -size * 0.4);

  ctx.font = "bold 6px monospace";
  ctx.fillStyle = isCritical ? "#f87171" : "#06b6d4";
  ctx.fillText("SECTOR 0x00", 0, 0);

  // Stability Metric Line
  const pctText = `${Math.ceil(healthPct * 100)}% STABLE`;
  ctx.fillStyle = isCritical ? "#ef4444" : "#10b981";
  ctx.fillText(pctText, 0, size * 0.4);

  // Shield Layer Indicator
  if (core.shieldPoints > 0) {
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.strokeRect(-size - 4, -size - 4, (size + 4) * 2, (size + 4) * 2);
    ctx.setLineDash([]);
  }

  ctx.restore();
}

