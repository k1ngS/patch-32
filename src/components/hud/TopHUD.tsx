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

interface TopHUDProps {
  showLogs?: boolean;
  showTelemetry?: boolean;
  onToggleLogs?: () => void;
  onToggleTelemetry?: () => void;
}

export function TopHUD({ showLogs, showTelemetry, onToggleLogs, onToggleTelemetry }: TopHUDProps) {
  const core = useGameStore((state) => state.core);
  const score = useGameStore((state) => state.score);
  const remainingMs = useGameStore((state) => state.remainingMs);
  const currentSectorIndex = useGameStore((state) => state.currentSectorIndex);

  const healthPercentage = Math.max(0, Math.min(100, (core.health / CORE_MAX_HEALTH) * 100));
  const isLowHealth = core.health < CORE_MAX_HEALTH * 0.4;
  const isCriticalHealth = core.health < CORE_MAX_HEALTH * 0.2;

  let healthBarColor = "bg-cyan-500";
  if (core.overclockActive) {
    healthBarColor = "bg-amber-400 animate-pulse";
  } else if (isCriticalHealth) {
    healthBarColor = "bg-red-500 animate-pulse";
  } else if (isLowHealth) {
    healthBarColor = "bg-amber-500";
  }

  return (
    <header className="w-full flex items-center justify-between gap-2 sm:gap-4 bg-[#030305] px-2 py-1 font-mono select-none shrink-0 border-b border-zinc-900">
      {/* SECTOR / WAVE INFO */}
      <div className="flex flex-col min-w-[85px] sm:min-w-[130px]">
        <span className="text-[9px] text-zinc-500 uppercase tracking-widest">
          Sector 0{currentSectorIndex + 1} // {currentSectorIndex === 0 ? "Root" : currentSectorIndex === 1 ? "Cache" : "Gateway"}
        </span>
        <span className="text-xs sm:text-sm font-bold text-cyan-400">
          {formatTime(remainingMs)}
        </span>
      </div>

      {/* DRAWER TOGGLES */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        <button
          onClick={onToggleLogs}
          className={`px-2 py-1 text-[10px] sm:text-xs font-bold border transition-colors flex items-center gap-1.5 font-mono ${
            showLogs
              ? "bg-cyan-950/40 border-cyan-500 text-cyan-300"
              : "bg-black hover:bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-cyan-500"
          }`}
          title="Toggle System Console"
        >
          <span className={`w-1.5 h-1.5 ${showLogs ? "bg-cyan-400 animate-pulse" : "bg-zinc-700"}`}></span>
          <span>[CONSOLE]</span>
        </button>

        <button
          onClick={onToggleTelemetry}
          className={`px-2 py-1 text-[10px] sm:text-xs font-bold border transition-colors flex items-center gap-1.5 font-mono ${
            showTelemetry
              ? "bg-amber-950/40 border-amber-500 text-amber-300"
              : "bg-black hover:bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-amber-500"
          }`}
          title="Toggle Telemetry Bus"
        >
          <span className={`w-1.5 h-1.5 ${showTelemetry ? "bg-amber-400 animate-pulse" : "bg-zinc-700"}`}></span>
          <span>[TELEMETRY]</span>
        </button>
      </div>

      {/* KERNEL INTEGRITY BAR */}
      <div className="flex-1 max-w-md flex flex-col space-y-0.5">
        <div className="flex justify-between items-center text-xs">
          <span className="text-zinc-500 uppercase text-[9px] sm:text-[10px] font-bold tracking-wider flex items-center gap-1">
            Kernel RAM Stability
            {isCriticalHealth && <span className="text-red-500 animate-ping font-bold">[CRITICAL]</span>}
            {!isCriticalHealth && isLowHealth && <span className="text-amber-500 font-bold">[WARN]</span>}
          </span>
          <span className={`font-bold text-[9px] sm:text-[10px] ${isCriticalHealth ? "text-red-500" : isLowHealth ? "text-amber-400" : "text-cyan-400"}`}>
            {Math.ceil(healthPercentage)}%
          </span>
        </div>
        <div className="w-full h-1.5 sm:h-2 bg-black border border-zinc-900 overflow-hidden relative">
          <div
            className={`h-full transition-all duration-300 ${healthBarColor}`}
            style={{ width: `${healthPercentage}%` }}
          />
        </div>
        {core.shieldPoints > 0 && (
          <span className="text-[9px] text-amber-400 uppercase tracking-wider text-right font-bold">
            + {Math.ceil(core.shieldPoints)} FIREWALL BUFFER
          </span>
        )}
      </div>

      {/* BITS ECONOMY */}
      <div className="flex flex-col items-end min-w-[65px] sm:min-w-[95px]" title="Recovered Compute Capacity (CPU/RAM Bits)">
        <span className="text-[9px] text-zinc-500 uppercase tracking-widest">Bits</span>
        <span className="text-xs sm:text-sm font-bold text-amber-500 flex items-center gap-1">
          <span className="text-amber-400 font-normal">₿</span> {score.currency}
        </span>
      </div>
    </header>
  );
}
