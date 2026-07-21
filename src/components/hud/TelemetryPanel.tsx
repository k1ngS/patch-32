"use client";

import React from "react";
import { useGameStore } from "@/store/useGameStore";

export function TelemetryPanel() {
  const phase = useGameStore((state) => state.phase);
  const score = useGameStore((state) => state.score);
  const runId = useGameStore((state) => state.runId);

  return (
    <div className="flex flex-col h-full bg-transparent p-2 font-mono text-[10px] select-none space-y-2 overflow-hidden">
      <div className="flex justify-between items-center bg-black p-1.5 border border-zinc-900">
        <span className="text-zinc-500 uppercase">Phase:</span>
        <span className="text-cyan-500 font-bold uppercase tracking-wider">{phase}</span>
      </div>

      <div className="flex justify-between items-center bg-black p-1.5 border border-zinc-900">
        <span className="text-zinc-500 uppercase">Op Score:</span>
        <span className="text-cyan-500 font-bold">{Math.floor(score.total).toLocaleString()}</span>
      </div>

      <div className="flex justify-between items-center bg-black p-1.5 border border-zinc-900">
        <span className="text-zinc-500 uppercase">Chain Mult:</span>
        <span className="text-amber-500 font-bold">x{score.multiplier.toFixed(2)}</span>
      </div>
    </div>
  );
}
