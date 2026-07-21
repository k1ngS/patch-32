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

    if (ev.type === "emp_pulse") {
      if (age <= 400) {
        const progress = age / 400;
        const alpha = 1 - progress;
        const radius = TILE_SIZE * 0.5 + progress * TILE_SIZE * 3.5;

        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.strokeStyle = `rgba(34, 211, 238, ${alpha})`;
        ctx.lineWidth = 4 * (1 - progress);
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = `rgba(34, 211, 238, ${alpha * 0.2})`;
        ctx.fill();
        ctx.restore();
      }

      if (ev.text && age <= 800) {
        const progress = age / 800;
        const textAlpha = 1 - progress;
        const floatY = cy - progress * 30;

        ctx.save();
        ctx.shadowColor = "#22d3ee";
        ctx.shadowBlur = 10;
        ctx.fillStyle = `rgba(34, 211, 238, ${textAlpha})`;
        ctx.font = "bold 13px monospace";
        ctx.textAlign = "center";
        ctx.fillText(ev.text, cx, floatY);
        ctx.restore();
      }
    } else if (ev.type === "reboot") {
      if (ev.text && age <= 800) {
        const progress = age / 800;
        const textAlpha = 1 - progress;
        const floatY = cy - progress * 25;

        ctx.save();
        ctx.shadowColor = "#10b981";
        ctx.shadowBlur = 10;
        ctx.fillStyle = `rgba(16, 185, 129, ${textAlpha})`;
        ctx.font = "bold 11px monospace";
        ctx.textAlign = "center";
        ctx.fillText(ev.text, cx, floatY);
        ctx.restore();
      }
    } else if (ev.type === "purge" || ev.type === "first_kill") {
      const isFirst = ev.type === "first_kill";
      const duration = isFirst ? 240 : 120;
      
      if (age <= duration) {
        const progress = age / duration;
        const flashAlpha = 1 - progress;
        const shockwaveRadius = (isFirst ? 16 : 8) + progress * (isFirst ? 48 : 24);

        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        
        ctx.strokeStyle = `rgba(0, 255, 200, ${flashAlpha * (isFirst ? 1.0 : 0.8)})`;
        ctx.lineWidth = (isFirst ? 4 : 2) * (1 - progress);
        ctx.beginPath();
        ctx.arc(cx, cy, shockwaveRadius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha * (isFirst ? 1.0 : 0.7)})`;
        ctx.fillRect(cx - (isFirst ? 10 : 6), cy - (isFirst ? 10 : 6), (isFirst ? 20 : 12), (isFirst ? 20 : 12));
        ctx.restore();
      }

      if (isFirst && ev.text && age <= 1000) {
        const progress = age / 1000;
        const textAlpha = Math.sin((1 - progress) * Math.PI * 0.5);
        const floatY = cy - progress * 40;
        
        ctx.save();
        ctx.shadowColor = "#00ffc8";
        ctx.shadowBlur = 12;
        ctx.fillStyle = `rgba(255, 255, 255, ${textAlpha})`;
        ctx.font = `bold 14px monospace`;
        ctx.textAlign = "center";
        ctx.fillText(ev.text, cx, floatY);
        ctx.shadowBlur = 0;
        ctx.restore();
      }
    } else if (ev.type === "core_damage") {
      if (age <= 300) {
        const progress = age / 300;
        const alpha = 1 - progress;
        const radius = 10 + progress * 40;
        
        ctx.save();
        ctx.strokeStyle = `rgba(255, 30, 30, ${alpha})`;
        ctx.lineWidth = 3 * (1 - progress);
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.fillStyle = `rgba(255, 0, 0, ${alpha * 0.5})`;
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 0.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      
      if (ev.text && age <= 800) {
        const progress = age / 800;
        const textAlpha = Math.sin((1 - Math.pow(progress, 2)) * Math.PI * 0.5);
        const floatY = cy - 20 - progress * 30;
        
        ctx.save();
        ctx.shadowColor = "#ff0000";
        ctx.shadowBlur = 10;
        ctx.fillStyle = `rgba(255, 100, 100, ${textAlpha})`;
        ctx.font = `bold 16px monospace`;
        ctx.textAlign = "center";
        ctx.fillText(ev.text, cx, floatY);
        ctx.shadowBlur = 0;
        ctx.restore();
      }
    }

    if (ev.bits !== undefined && ev.bits > 0 && age <= 450) {
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
