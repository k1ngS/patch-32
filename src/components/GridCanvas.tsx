"use client";

import { useEffect, useRef } from "react";
import { CANVAS_SIZE } from "@/constants/gameConfig";
import { useCanvasInput } from "@/hooks/useCanvasInput";
import { useGameStore } from "@/store/useGameStore";
import { drawCables } from "@/utils/renderers/cableRenderer";
import { COL } from "@/utils/renderers/colors";
import { drawCore } from "@/utils/renderers/coreRenderer";
import { drawEmitters } from "@/utils/renderers/emitterRenderer";
import { drawVisualEvents } from "@/utils/renderers/eventRenderer";
// ── Pure Renderers ──────────────────────────────────────────
import { drawGrid, drawHoverPreview } from "@/utils/renderers/gridRenderer";
import {
  drawBorderOverlays,
  drawPhaseOverlay,
  drawGridBrackets,
  drawCentralMarquee,
} from "@/utils/renderers/overlayRenderer";
import { drawParasites } from "@/utils/renderers/parasiteRenderer";

export default function GridCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  // ── 1. Input Layer ──────────────────────────────────────────
  const { mouseGridRef } = useCanvasInput(canvasRef);

  // ── 2. Orchestration Layer (RAF) ────────────────────────────
  useEffect(() => {
    useGameStore.getState().startGame();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    // Fixed internal rendering resolution
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;

    function loop(timestamp: number): void {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const deltaMs = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      // Advance game state imperatively
      const store = useGameStore.getState();
      store.updateGameTick(deltaMs);

      // Re-read after tick
      const state = useGameStore.getState();

      // Clear Canvas
      ctx!.fillStyle = COL.bg;
      ctx!.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      ctx!.save();
      if (state.trauma > 0) {
        const maxShakeIntensity = 10; // Amplitude máxima de 10px
        const currentShake = maxShakeIntensity * (state.trauma * state.trauma);
        const offsetX = (Math.random() * 2 - 1) * currentShake;
        const offsetY = (Math.random() * 2 - 1) * currentShake;
        ctx!.translate(offsetX, offsetY);
      }

      // Execute Renderers in order (Painters Algorithm)
      drawGrid(ctx!, state.grid, state.saturation, timestamp);
      drawCables(ctx!, state.cables, timestamp);
      drawEmitters(ctx!, state.emitterNodes, state.core.thermalThrottleMs, timestamp);
      drawCore(ctx!, state.core, timestamp);
      drawParasites(ctx!, state.parasites, state.elapsedMs, timestamp, state.infectionAccumulatorMs);
      drawHoverPreview(ctx!, state, timestamp, mouseGridRef.current);
      drawVisualEvents(ctx!, state.visualEvents, timestamp);

      ctx!.restore();

      drawGridBrackets(ctx!, CANVAS_SIZE);
      drawBorderOverlays(
        ctx!,
        state.cables,
        state.syntheticNeighborIndex,
        state.score,
        timestamp,
      );
      drawPhaseOverlay(ctx!, state, timestamp);
      drawCentralMarquee(ctx!, state, timestamp);

      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(rafRef.current);
  }, [mouseGridRef]);

  // ── 3. Layout (CSS scaling without scrollbars) ──────────────
  return (
    <div className="relative w-full h-full flex-shrink-0 bg-[#0a0a10] rounded shadow-[0_0_50px_rgba(0,0,0,0.8)] aspect-square overflow-hidden select-none">
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-crosshair"
        tabIndex={0}
      />
    </div>
  );
}
