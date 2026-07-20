import { CANVAS_SIZE, GRID_SIZE, SYNTHETIC_NEIGHBORS, CORE_MAX_HEALTH, MAX_EMITTERS } from "@/constants/gameConfig";
import type { GamePhase, ScoreState, NeonCable, GameState } from "@/types/game";
import { COL, lerpColor } from "./colors";
import { useGameStore } from "@/store/useGameStore"; // Needed only for activeEntityCount, etc. if required, but we can pass state directly

export function drawBorderOverlays(
  ctx: CanvasRenderingContext2D,
  cables: NeonCable[],
  neighborIndex: number,
  score: ScoreState,
  time: number
): void {
  const borderHits = { N: false, S: false, E: false, W: false };

  for (const cable of cables) {
    if (cable.state !== "active" && cable.state !== "completed") continue;
    if (!cable.isBorderLink || !cable.targetPos) continue;

    const t = cable.targetPos;
    if (t.y === 0) borderHits.N = true;
    if (t.y === GRID_SIZE - 1) borderHits.S = true;
    if (t.x === GRID_SIZE - 1) borderHits.E = true;
    if (t.x === 0) borderHits.W = true;
  }

  const neighborName = SYNTHETIC_NEIGHBORS[neighborIndex % SYNTHETIC_NEIGHBORS.length];
  const displayScore = Math.floor(score.total).toLocaleString();
  const pulse = 0.5 + Math.sin(time * 0.004 * Math.PI) * 0.5;
  const alpha = 0.4 + pulse * 0.6;

  ctx.font = "bold 10px monospace";
  ctx.textAlign = "center";

  if (borderHits.N) {
    ctx.shadowColor = COL.borderTextGlow;
    ctx.shadowBlur = 6;
    ctx.fillStyle = `rgba(68, 255, 170, ${alpha})`;
    ctx.fillText(`↑ ${neighborName} · ${displayScore}`, CANVAS_SIZE / 2, 10);
    ctx.shadowBlur = 0;
  }

  if (borderHits.S) {
    ctx.shadowColor = COL.borderTextGlow;
    ctx.shadowBlur = 6;
    ctx.fillStyle = `rgba(68, 255, 170, ${alpha})`;
    ctx.fillText(
      `↓ ${neighborName} · ${displayScore}`,
      CANVAS_SIZE / 2,
      CANVAS_SIZE - 4,
    );
    ctx.shadowBlur = 0;
  }

  if (borderHits.W) {
    ctx.save();
    ctx.shadowColor = COL.borderTextGlow;
    ctx.shadowBlur = 6;
    ctx.fillStyle = `rgba(68, 255, 170, ${alpha})`;
    ctx.translate(10, CANVAS_SIZE / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`← ${neighborName} · ${displayScore}`, 0, 0);
    ctx.restore();
  }

  if (borderHits.E) {
    ctx.save();
    ctx.shadowColor = COL.borderTextGlow;
    ctx.shadowBlur = 6;
    ctx.fillStyle = `rgba(68, 255, 170, ${alpha})`;
    ctx.translate(CANVAS_SIZE - 4, CANVAS_SIZE / 2);
    ctx.rotate(Math.PI / 2);
    ctx.fillText(`→ ${neighborName} · ${displayScore}`, 0, 0);
    ctx.restore();
  }
}

export function drawPhaseOverlay(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  time: number
): void {
  const { phase, score, remainingMs } = state;

  if (phase === "playing") {
    drawHUD(ctx, state, time);
    return;
  }

  ctx.fillStyle = "rgba(5, 5, 10, 0.75)";
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  ctx.textAlign = "center";

  if (phase === "boot") {
    const titlePulse = 0.7 + Math.sin(time * 0.003) * 0.3;

    ctx.shadowColor = COL.droneFill;
    ctx.shadowBlur = 20;
    ctx.font = "bold 28px monospace";
    ctx.fillStyle = `rgba(0, 229, 255, ${titlePulse})`;
    ctx.fillText("PATCH_32", CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 40);
    ctx.shadowBlur = 0;

    ctx.font = "11px monospace";
    ctx.fillStyle = COL.hudText;
    ctx.fillText(
      "DEFEND THE CORE  ·  180 SECONDS",
      CANVAS_SIZE / 2,
      CANVAS_SIZE / 2,
    );

    const enterPulse = 0.3 + Math.sin(time * 0.005) * 0.7;
    ctx.fillStyle = `rgba(0, 255, 200, ${enterPulse})`;
    ctx.font = "11px monospace";
    ctx.fillText(
      "[ ENTER TO DEPLOY ]",
      CANVAS_SIZE / 2,
      CANVAS_SIZE / 2 + 30,
    );

    ctx.font = "10px monospace";
    ctx.fillStyle = "rgba(136, 204, 255, 0.5)";
    ctx.fillText(
      "MOUSE: PLACE EMITTER  ·  E: OVERCLOCK",
      CANVAS_SIZE / 2,
      CANVAS_SIZE / 2 + 55,
    );
  } else if (phase === "ready") {
    ctx.shadowColor = COL.coreHealthy;
    ctx.shadowBlur = 15;
    ctx.font = "bold 22px monospace";
    ctx.fillStyle = COL.coreHealthy;
    ctx.fillText("DEPLOYING...", CANVAS_SIZE / 2, CANVAS_SIZE / 2);
    ctx.shadowBlur = 0;
  } else if (phase === "paused") {
    ctx.font = "bold 20px monospace";
    ctx.fillStyle = COL.hudText;
    ctx.fillText("‖ PAUSED", CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 10);

    ctx.font = "9px monospace";
    ctx.fillStyle = "rgba(136, 204, 255, 0.6)";
    ctx.fillText("[ P TO RESUME ]", CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 15);
  } else if (phase === "gameover") {
    ctx.shadowColor = "#ff2244";
    ctx.shadowBlur = 25;
    ctx.font = "bold 24px monospace";
    ctx.fillStyle = "#ff2244";
    ctx.fillText("CORE BREACH", CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 30);
    ctx.shadowBlur = 0;

    ctx.font = "11px monospace";
    ctx.fillStyle = COL.hudText;
    ctx.fillText(
      `SCORE: ${Math.floor(score.total).toLocaleString()}`,
      CANVAS_SIZE / 2,
      CANVAS_SIZE / 2 + 5,
    );
    ctx.fillText(
      `PURGES: ${score.totalPurges}  ·  CHAIN: ${score.longestChain}`,
      CANVAS_SIZE / 2,
      CANVAS_SIZE / 2 + 22,
    );

    const enterPulse = 0.3 + Math.sin(time * 0.005) * 0.7;
    ctx.fillStyle = `rgba(255, 100, 100, ${enterPulse})`;
    ctx.font = "10px monospace";
    ctx.fillText(
      "[ ENTER TO REDEPLOY ]",
      CANVAS_SIZE / 2,
      CANVAS_SIZE / 2 + 50,
    );
  } else if (phase === "victory") {
    ctx.shadowColor = COL.coreHealthy;
    ctx.shadowBlur = 30;
    ctx.font = "bold 22px monospace";
    ctx.fillStyle = COL.coreHealthy;
    ctx.fillText("CORE SECURED", CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 30);
    ctx.shadowBlur = 0;

    ctx.font = "11px monospace";
    ctx.fillStyle = COL.hudText;
    ctx.fillText(
      `FINAL SCORE: ${Math.floor(score.total).toLocaleString()}`,
      CANVAS_SIZE / 2,
      CANVAS_SIZE / 2 + 5,
    );
    ctx.fillText(
      `PURGES: ${score.totalPurges}  ·  BEST CHAIN: ${score.longestChain}`,
      CANVAS_SIZE / 2,
      CANVAS_SIZE / 2 + 22,
    );

    const enterPulse = 0.3 + Math.sin(time * 0.005) * 0.7;
    ctx.fillStyle = `rgba(0, 255, 200, ${enterPulse})`;
    ctx.font = "10px monospace";
    ctx.fillText(
      "[ ENTER TO REDEPLOY ]",
      CANVAS_SIZE / 2,
      CANVAS_SIZE / 2 + 50,
    );
  }
}

function drawHUD(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  time: number
): void {
  const { core, score, remainingMs, upgrades, activeEntityCount } = state;

  ctx.textAlign = "left";
  ctx.font = "bold 9px monospace";

  const secs = Math.ceil(remainingMs / 1000);
  const mins = Math.floor(secs / 60);
  const secsR = secs % 60;
  const timerStr = `${mins}:${secsR.toString().padStart(2, "0")}`;

  const timerUrgent = secs <= 30;
  ctx.textAlign = "center";
  ctx.fillStyle = timerUrgent
    ? `rgba(255, 68, 68, ${0.7 + Math.sin(time * 0.008) * 0.3})`
    : COL.hudText;
  ctx.font = "bold 16px monospace";
  ctx.fillText(timerStr, CANVAS_SIZE / 2, 32);

  ctx.textAlign = "left";
  ctx.font = "bold 14px monospace";
  ctx.fillStyle = COL.hudText;
  ctx.fillText(`SCR ${Math.floor(score.total)}`, 24, 32);

  ctx.fillStyle = "#ffcc44";
  ctx.fillText(`₿${score.currency}`, 24, 52);

  ctx.fillStyle = "rgba(136, 204, 255, 0.8)";
  ctx.font = "bold 12px monospace";
  ctx.fillText(`NODES ${activeEntityCount}/${MAX_EMITTERS}`, 24, 70);

  ctx.textAlign = "right";
  if (score.multiplier > 1) {
    const comboPulse = 0.7 + Math.sin(time * 0.008) * 0.3;
    ctx.fillStyle = `rgba(255, 200, 0, ${comboPulse})`;
    ctx.font = "bold 14px monospace";
    ctx.fillText(`x${score.multiplier.toFixed(1)}`, CANVAS_SIZE - 24, 32);

    ctx.fillStyle = "rgba(255, 200, 0, 0.5)";
    ctx.font = "10px monospace";
    ctx.fillText(`COMBO ${score.comboCount}`, CANVAS_SIZE - 24, 52);
  }

  const barWidth = 80;
  const barHeight = 5;
  const barX = (CANVAS_SIZE - barWidth) / 2;
  const barY = CANVAS_SIZE - 36;
  const healthPct = Math.max(0, core.health / CORE_MAX_HEALTH);

  ctx.fillStyle = "rgba(20, 20, 30, 0.7)";
  ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);

  const barColor = lerpColor("#cc2233", "#00ffc8", healthPct);
  ctx.fillStyle = barColor;
  ctx.fillRect(barX, barY, barWidth * healthPct, barHeight);

  ctx.textAlign = "center";
  ctx.font = "8px monospace";
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.fillText(
    `CORE ${Math.ceil(core.health)}/${CORE_MAX_HEALTH}`,
    CANVAS_SIZE / 2,
    barY - 4,
  );

  if (core.overclockCooldownMs > 0) {
    ctx.textAlign = "right";
    ctx.font = "10px monospace";
    ctx.fillStyle = "rgba(255, 170, 0, 0.5)";
    ctx.fillText(
      `OC ${(core.overclockCooldownMs / 1000).toFixed(0)}s`,
      CANVAS_SIZE - 24,
      CANVAS_SIZE - 24,
    );
  } else if ((upgrades.get("core_overclock")?.level ?? 0) > 0) {
    ctx.textAlign = "right";
    ctx.font = "10px monospace";
    ctx.fillStyle = "rgba(255, 170, 0, 0.8)";
    ctx.fillText("OC READY", CANVAS_SIZE - 24, CANVAS_SIZE - 24);
  }

  ctx.textAlign = "left";
  ctx.font = "10px monospace";
  ctx.fillStyle = "rgba(136, 204, 255, 0.3)";
  ctx.fillText(`ENT:${activeEntityCount}`, 24, CANVAS_SIZE - 24);
}

export function drawGridBrackets(
  ctx: CanvasRenderingContext2D,
  canvasSize: number
): void {
  const len = 12;
  ctx.strokeStyle = "rgba(88, 224, 216, 0.35)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  
  // Top-Left
  ctx.moveTo(0, len);
  ctx.lineTo(0, 0);
  ctx.lineTo(len, 0);

  // Top-Right
  ctx.moveTo(canvasSize - len, 0);
  ctx.lineTo(canvasSize, 0);
  ctx.lineTo(canvasSize, len);

  // Bottom-Right
  ctx.moveTo(canvasSize, canvasSize - len);
  ctx.lineTo(canvasSize, canvasSize);
  ctx.lineTo(canvasSize - len, canvasSize);

  // Bottom-Left
  ctx.moveTo(len, canvasSize);
  ctx.lineTo(0, canvasSize);
  ctx.lineTo(0, canvasSize - len);

  ctx.stroke();
}

export function drawCentralMarquee(ctx: CanvasRenderingContext2D, state: GameState, time: number) {
  if (state.phase !== "playing") return;

  const cx = CANVAS_SIZE / 2;
  const cy = CANVAS_SIZE / 2;

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // 1. Sector Change
  if (time - state.lastSectorChangeMs < 1500 && state.lastSectorChangeMs > 0) {
    const blink = Math.floor(time / 150) % 2 === 0;
    if (blink) {
      ctx.font = "bold 22px monospace";
      ctx.fillStyle = "rgba(88, 224, 216, 0.9)";
      ctx.shadowColor = "rgba(88, 224, 216, 0.5)";
      ctx.shadowBlur = 10;
      ctx.fillText(`[ INITIALIZING PROTOCOL: SECTOR 0${state.currentSectorIndex + 1} ]`, cx, cy);
      ctx.shadowBlur = 0;
    }
    return; 
  }

  // 2. Throttle Flitch
  if (time - state.lastThrottleMs < 100 && state.lastThrottleMs > 0) {
    ctx.font = "bold 20px monospace";
    ctx.fillStyle = "rgba(220, 38, 38, 0.9)";
    ctx.shadowColor = "rgba(220, 38, 38, 0.6)";
    ctx.shadowBlur = 15;
    ctx.fillText("[ KERNEL THROTTLED // OVERHEAT ]", cx, cy);
    ctx.shadowBlur = 0;
    
    if (time - state.lastThrottleMs < 60) {
      ctx.save();
      const sliceH = 6;
      for (let y = cy - 20; y < cy + 20; y += sliceH) {
        if (Math.random() > 0.3) {
          const shift = (Math.random() > 0.5 ? 4 : -4);
          ctx.drawImage(ctx.canvas, 0, y, CANVAS_SIZE, sliceH, shift, y, CANVAS_SIZE, sliceH);
        }
      }
      ctx.restore();
    }
    return;
  }

  // 3. System Critical
  if (state.core.health / CORE_MAX_HEALTH < 0.5 && state.core.health > 0) {
    const pulse = Math.sin(time * 0.005) > 0;
    if (pulse) {
      ctx.font = "bold 20px monospace";
      ctx.fillStyle = "rgba(234, 179, 8, 0.9)"; // amber
      ctx.shadowColor = "rgba(234, 179, 8, 0.5)";
      ctx.shadowBlur = 10;
      ctx.fillText("[ WARNING: SYSTEM CRITICAL ]", cx, cy);
      ctx.shadowBlur = 0;
    }
  }
}
