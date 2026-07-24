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
    const size = TILE_SIZE * 0.44;

    const isOverheated = emitter.isOverheated || emitter.state === "overheated";
    const isBooting = emitter.state === "booting";

    ctx.save();
    ctx.translate(cx, cy);

    // Process Block Background
    if (isOverheated) {
      const pulse = Math.sin(time * 0.01) * 0.2 + 0.8;
      ctx.fillStyle = `rgba(185, 28, 28, ${0.4 * pulse})`;
      ctx.strokeStyle = "#ef4444";
    } else if (isBooting) {
      ctx.fillStyle = "rgba(217, 119, 6, 0.3)";
      ctx.strokeStyle = "#f59e0b";
    } else if (emitter.state === "ready") {
      ctx.fillStyle = thermalThrottleMs > 0 ? "rgba(180, 83, 9, 0.4)" : "rgba(15, 118, 110, 0.4)";
      ctx.strokeStyle = thermalThrottleMs > 0 ? "#f59e0b" : "#06b6d4";
    } else {
      // Cooldown
      ctx.fillStyle = "rgba(15, 23, 42, 0.6)";
      ctx.strokeStyle = "#0891b2";
    }

    // Process Box
    ctx.fillRect(-size, -size, size * 2, size * 2);
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-size, -size, size * 2, size * 2);

    // Process Header Bar
    ctx.fillStyle = isOverheated ? "#7f1d1d" : isBooting ? "#78350f" : "#0e7490";
    ctx.fillRect(-size, -size, size * 2, 4);

    // Process Tag Label (FW: Firewall, QR: Quarantine, HA: Heuristics, KD: Kernel Defender)
    const procTag = emitter.shotsFired > 3 ? "KD" : emitter.shotsFired > 1 ? "QR" : "FW";
    ctx.font = "bold 8px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = isOverheated ? "#fca5a5" : isBooting ? "#fde68a" : "#cffaff";
    ctx.fillText(procTag, 0, 1);

    ctx.restore();

    // Rectangular Sector Bus Scan Boundary (thin dashed administrative monitoring region)
    ctx.save();
    const scanRadius = emitter.length * TILE_SIZE;
    ctx.strokeStyle = isOverheated
      ? "rgba(239, 68, 68, 0.25)"
      : isBooting
        ? "rgba(245, 158, 11, 0.25)"
        : "rgba(6, 182, 212, 0.18)";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);
    ctx.strokeRect(cx - scanRadius, cy - scanRadius, scanRadius * 2, scanRadius * 2);
    ctx.setLineDash([]);
    ctx.restore();

    // Overheated System Status Banner
    if (isOverheated) {
      const blink = (time % 500) < 250;
      ctx.font = "bold 8px monospace";
      ctx.textAlign = "center";
      ctx.fillStyle = blink ? "#ef4444" : "#f59e0b";
      ctx.fillText("[REBOOT_REQ]", cx, cy - size - 4);
    }
  }
}

