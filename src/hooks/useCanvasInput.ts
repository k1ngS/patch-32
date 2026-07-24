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
      const isOverrideActive = useGameStore.getState().isOverrideActive;
      const isInputLocked = useGameStore.getState().isInputLocked;
      if (isOverrideActive || isInputLocked) {
        mouseGridRef.current = null;
        return;
      }

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
      const isOverrideActive = useGameStore.getState().isOverrideActive;
      const isInputLocked = useGameStore.getState().isInputLocked;
      if (isOverrideActive || isInputLocked) return;

      const state = useGameStore.getState();
      if (state.phase !== 'playing') return;

      if (e.button === 0 && mouseGridRef.current) {
        const gx = mouseGridRef.current.x;
        const gy = mouseGridRef.current.y;

        // Check if there is an existing Emitter on this cell
        const existingEmitter = state.emitterNodes.find(
          (node) => node.pos.x === gx && node.pos.y === gy
        );

        if (existingEmitter) {
          // Reboot / Flush Emitter
          state.rebootEmitter(existingEmitter.id);
        } else {
          // Perform manual memory purge or place process node
          state.manualMemoryPurge(gx, gy);
        }
      } else if (e.button === 2) {
        // Right click fires Drone EMP Pulse
        e.preventDefault();
        state.fireDronePulse();
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const isOverrideActive = useGameStore.getState().isOverrideActive;
      const isInputLocked = useGameStore.getState().isInputLocked;
      if (isOverrideActive || isInputLocked) return;

      const state = useGameStore.getState();
      if (state.phase !== 'playing') return;

      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyE') {
        state.setOverclockPressed();
      } else if (e.code === 'Space') {
        e.preventDefault();
        state.fireDronePulse();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    canvas.addEventListener("pointerdown", handlePointerDown as EventListener);
    canvas.addEventListener("pointermove", handlePointerMove as EventListener);
    canvas.addEventListener("contextmenu", handleContextMenu);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      canvas.removeEventListener("pointerdown", handlePointerDown as EventListener);
      canvas.removeEventListener("pointermove", handlePointerMove as EventListener);
      canvas.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [canvasRef]);

  return { mouseGridRef };
}
