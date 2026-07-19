import { useEffect, useRef } from "react";
import { TILE_SIZE, GRID_SIZE } from "@/constants/gameConfig";
import { useGameStore } from "@/store/useGameStore";
import type { GridPosition } from "@/types/game";

export function useCanvasInput(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const mouseGridRef = useRef<GridPosition | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handlePointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      const gx = Math.floor(x / TILE_SIZE);
      const gy = Math.floor(y / TILE_SIZE);

      if (gx >= 0 && gx < GRID_SIZE && gy >= 0 && gy < GRID_SIZE) {
        mouseGridRef.current = { x: gx, y: gy };
      } else {
        mouseGridRef.current = null;
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      const state = useGameStore.getState();
      if (state.phase !== 'playing') return;
      if (e.button === 0 && mouseGridRef.current) {
        state.placeEmitter(mouseGridRef.current.x, mouseGridRef.current.y);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const state = useGameStore.getState();
      if (state.phase !== 'playing') return;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyE') {
        state.setOverclockPressed();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    canvas.addEventListener("pointerdown", handlePointerDown as EventListener);
    canvas.addEventListener("pointermove", handlePointerMove as EventListener);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      canvas.removeEventListener("pointerdown", handlePointerDown as EventListener);
      canvas.removeEventListener("pointermove", handlePointerMove as EventListener);
    };
  }, [canvasRef]);

  return { mouseGridRef };
}
