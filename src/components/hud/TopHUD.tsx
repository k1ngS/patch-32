"use client";

import React from "react";
import { CORE_MAX_HEALTH } from "@/constants/gameConfig";
import { useGameStore } from "@/store/useGameStore";

function formatTime(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export function TopHUD() {
  const core = useGameStore((state) => state.core);
  const score = useGameStore((state) => state.score);
  const remainingMs = useGameStore((state) => state.remainingMs);
  const currentSectorIndex = useGameStore((state) => state.currentSectorIndex);

  const healthPercentage = Math.max(0, Math.min(100, (core.health / CORE_MAX_HEALTH) * 100));

  return (
    <header className="w-full max-w-5xl flex items-center justify-between gap-4 bg-[#0a0a10]/90 border border-zinc-800/80 rounded-lg p-2 sm:p-3 font-mono select-none shadow-lg backdrop-blur shrink-0">
      {/* SECTOR / WAVE INFO */}
      <div className="flex flex-col min-w-[80px] sm:min-w-[120px]">
        <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Sector</span>
        <span className="text-xs sm:text-sm font-bold text-cyan-400">
          0{currentSectorIndex + 1} // {formatTime(remainingMs)}
        </span>
      </div>

      {/* CORE INTEGRITY BAR */}
      <div className="flex-1 max-w-md flex flex-col space-y-1">
        <div className="flex justify-between items-center text-xs">
          <span className="text-zinc-400 uppercase text-[10px] sm:text-xs font-semibold">Core Health</span>
          <span className="text-cyan-400 font-bold text-[10px] sm:text-xs">
            {Math.ceil(core.health)} / {CORE_MAX_HEALTH}
          </span>
        </div>
        <div className="w-full h-2.5 bg-zinc-950 border border-zinc-800 rounded-sm overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              core.overclockActive ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]" : "bg-cyan-500"
            }`}
            style={{ width: `${healthPercentage}%` }}
          />
        </div>
        {core.shieldPoints > 0 && (
          <span className="text-[9px] text-amber-400 uppercase tracking-wider text-right">
            + {Math.ceil(core.shieldPoints)} Shield
          </span>
        )}
      </div>

      {/* BITS ECONOMY */}
      <div className="flex flex-col items-end min-w-[70px] sm:min-w-[100px]">
        <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Bits</span>
        <span className="text-xs sm:text-sm font-bold text-amber-500 flex items-center gap-1">
          <span className="text-amber-400 font-normal">₿</span> {score.currency}
        </span>
      </div>
    </header>
  );
}
