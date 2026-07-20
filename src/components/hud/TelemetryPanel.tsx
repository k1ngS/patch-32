"use client";

import React from "react";
import { useGameStore } from "@/store/useGameStore";

export function TelemetryPanel() {
  const phase = useGameStore((state) => state.phase);
  const score = useGameStore((state) => state.score);
  const runId = useGameStore((state) => state.runId);

  return (
    <div className="flex flex-col h-full bg-[#0a0a10]/80 border border-zinc-800/80 rounded-lg p-2 font-mono text-[10px] select-none space-y-2 overflow-hidden">
      <span className="text-zinc-500 uppercase tracking-widest text-[9px] font-semibold border-b border-zinc-900 pb-0.5">
        Telemetry // RUN_{runId}
      </span>
      
      <div className="flex justify-between items-center bg-zinc-950/60 p-1.5 rounded border border-zinc-900">
        <span className="text-zinc-500 uppercase">Phase:</span>
        <span className="text-cyan-300 font-bold uppercase tracking-wider">{phase}</span>
      </div>

      <div className="flex justify-between items-center bg-zinc-950/60 p-1.5 rounded border border-zinc-900">
        <span className="text-zinc-500 uppercase">Op Score:</span>
        <span className="text-cyan-400 font-bold">{Math.floor(score.total).toLocaleString()}</span>
      </div>

      <div className="flex justify-between items-center bg-zinc-950/60 p-1.5 rounded border border-zinc-900">
        <span className="text-zinc-500 uppercase">Chain Mult:</span>
        <span className="text-amber-400 font-bold">x{score.multiplier.toFixed(2)}</span>
      </div>
    </div>
  );
}
