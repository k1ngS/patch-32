import React from "react";
import { useGameStore } from "@/store/useGameStore";

export function GameOverReport() {
  const score = useGameStore((state) => state.score);
  const runId = useGameStore((state) => state.runId);
  const core = useGameStore((state) => state.core);
  const elapsedMs = useGameStore((state) => state.elapsedMs);
  
  const initGame = useGameStore((state) => state.initGame);
  const startGame = useGameStore((state) => state.startGame);
  const setActiveScreen = useGameStore((state) => state.setActiveScreen);

  const survivalTime = Math.floor(elapsedMs / 1000);
  const isVictory = core.health > 0 && elapsedMs >= 180000;

  const handleRestart = () => {
    initGame();
    startGame();
    setActiveScreen("game");
  };

  return (
    <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-50 text-[#e0e0e0] font-mono p-6">
      <div className="bg-[#0a0a10] border border-zinc-800 p-8 rounded shadow-2xl max-w-lg w-full">
        
        <div className="text-center mb-8 border-b border-zinc-800 pb-4">
          <h2 className={`text-3xl font-bold tracking-widest uppercase mb-2 ${isVictory ? 'text-cyan-400' : 'text-red-500'}`}>
            {isVictory ? 'Simulation Cleared' : 'Simulation Failed'}
          </h2>
          <p className="text-zinc-500 text-sm">
            RUN_ID: {runId} // {isVictory ? 'CORE SECURED' : 'CORE COMPROMISED'}
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex justify-between items-center bg-zinc-900/50 p-3 border border-zinc-800">
            <span className="text-zinc-400 text-xs uppercase">Survival Time</span>
            <span className="text-zinc-200 font-bold">{survivalTime}s</span>
          </div>

          <div className="flex justify-between items-center bg-zinc-900/50 p-3 border border-zinc-800">
            <span className="text-zinc-400 text-xs uppercase">Peak Chain</span>
            <span className="text-amber-500 font-bold">x{score.longestChain}</span>
          </div>

          <div className="flex justify-between items-center bg-zinc-900/50 p-3 border border-zinc-800">
            <span className="text-zinc-400 text-xs uppercase">Bits Generated</span>
            <span className="text-cyan-400 font-bold">₿ {score.total}</span>
          </div>

          <div className="flex justify-between items-center bg-zinc-900/50 p-3 border border-zinc-800">
            <span className="text-zinc-400 text-xs uppercase">Total Purges</span>
            <span className="text-zinc-200 font-bold">{score.totalPurges} Cells</span>
          </div>
        </div>

        <div className="flex justify-center">
          <button
            onClick={handleRestart}
            className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold uppercase text-sm border border-zinc-600 transition-colors"
          >
            [ REBOOT SYSTEM ]
          </button>
        </div>

      </div>
    </div>
  );
}
