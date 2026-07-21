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
  // Render subtle technical viewport corners & coordinates instead of floating arcade HUD text
  ctx.save();
  ctx.font = "8px monospace";
  ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
  ctx.textAlign = "left";
  ctx.fillText("VIEWPORT_01 // 32x32_MATRIX", 8, 12);
  ctx.textAlign = "right";
  ctx.fillText("SCALE: 1:1", CANVAS_SIZE - 8, 12);
  ctx.restore();
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

  // 0. Opening Beat
  if (state.elapsedMs < 2000) {
    const t = state.elapsedMs;
    let alpha = 0;
    if (t < 500) alpha = t / 500;
    else if (t < 1500) alpha = 1;
    else alpha = 1 - ((t - 1500) / 500);

    ctx.save();
    ctx.font = "bold 11px monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = `rgba(0, 255, 200, ${alpha})`;
    ctx.fillText(">KERNEL v0.0.0", 24, cy - 20);
    ctx.fillText(">CORE ONLINE", 24, cy);
    ctx.fillText(">GRID INITIALIZED", 24, cy + 20);
    ctx.fillStyle = `rgba(255, 68, 68, ${alpha})`;
    ctx.fillText(">THREAT DETECTED", 24, cy + 40);
    ctx.restore();
  }

  // 1. Sector Change
  if (time - state.lastSectorChangeMs < 500 && state.lastSectorChangeMs > 0 && state.currentSectorIndex > 0) {
    const age = time - state.lastSectorChangeMs;
    const progress = age / 500;
    // Dark fade
    const fadeAlpha = Math.sin(progress * Math.PI) * 0.8;
    ctx.save();
    ctx.fillStyle = `rgba(0, 0, 0, ${fadeAlpha})`;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    const title = `PHASE ${state.currentSectorIndex + 1}`;
    const subtitle = state.currentSectorIndex === 1 ? "ESCALATION" : "PRESSURE";
    
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 24px monospace";
    ctx.fillStyle = `rgba(255, 255, 255, ${fadeAlpha * 1.2})`;
    ctx.shadowColor = "rgba(255, 255, 255, 0.8)";
    ctx.shadowBlur = 15;
    ctx.fillText(title, cx, cy - 10);
    
    ctx.font = "bold 16px monospace";
    ctx.fillStyle = `rgba(255, 68, 68, ${fadeAlpha * 1.2})`;
    ctx.shadowColor = "rgba(255, 68, 68, 0.8)";
    ctx.fillText(subtitle, cx, cy + 15);
    ctx.restore();
    return;
  }

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

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

export function drawEmpShockwave(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  time: number
): void {
  if (!state.empShockwaveActive || state.empRadius <= 0) return;

  const cx = CANVAS_SIZE / 2;
  const cy = CANVAS_SIZE / 2;
  const radius = state.empRadius;
  const maxRadius = CANVAS_SIZE * 0.75;
  const progress = Math.min(1, radius / maxRadius);
  const alpha = 1 - progress * 0.7;

  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  // Glowing Cyan/White Outer Ring
  ctx.shadowColor = "#00e5ff";
  ctx.shadowBlur = 25;
  ctx.strokeStyle = `rgba(0, 229, 255, ${alpha})`;
  ctx.lineWidth = Math.max(2, 10 * (1 - progress));
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  // White Inner Rim
  ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
  ctx.lineWidth = Math.max(1, 4 * (1 - progress));
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  // Radial Gradient Glow
  const grad = ctx.createRadialGradient(cx, cy, Math.max(0, radius - 30), cx, cy, radius);
  grad.addColorStop(0, "rgba(0, 229, 255, 0)");
  grad.addColorStop(0.8, `rgba(0, 229, 255, ${alpha * 0.25})`);
  grad.addColorStop(1, `rgba(255, 255, 255, ${alpha * 0.4})`);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();

  // Disintegration Particles along shockwave edge
  const particleCount = 28;
  for (let i = 0; i < particleCount; i++) {
    const angle = (i / particleCount) * Math.PI * 2 + time * 0.002;
    const rOffset = Math.sin(i * 3.7 + time * 0.005) * 12;
    const px = cx + Math.cos(angle) * (radius + rOffset);
    const py = cy + Math.sin(angle) * (radius + rOffset);

    ctx.fillStyle = i % 2 === 0 ? "#00e5ff" : "#ffffff";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(px, py, Math.random() * 2.5 + 1, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
