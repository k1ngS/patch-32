import React from "react";
import { useGameStore } from "@/store/useGameStore";

export function TutorialScreen() {
  const setActiveScreen = useGameStore((state) => state.setActiveScreen);
  const initGame = useGameStore((state) => state.initGame);

  const handleStart = () => {
    initGame();
    setActiveScreen("game");
  };

  return (
    <div className="absolute inset-0 bg-[#050508] flex flex-col items-center justify-center z-50 text-[#e0e0e0] font-mono p-8">
      <h2 className="text-2xl font-bold text-cyan-400 tracking-widest uppercase mb-12 border-b border-zinc-800 pb-4">
        Briefing Protocol
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mb-12">
        <div className="bg-zinc-900/50 border border-zinc-700 p-6 rounded-lg flex flex-col items-center text-center space-y-4">
          <div className="text-cyan-400 text-4xl mb-2">📡</div>
          <h3 className="text-lg font-bold text-zinc-200">1. Deploy Emitters</h3>
          <p className="text-sm text-zinc-500">
            Use your mouse to place emitter nodes on clean sectors. They auto-link to infected zones and purge them.
          </p>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-700 p-6 rounded-lg flex flex-col items-center text-center space-y-4">
          <div className="text-amber-500 text-4xl mb-2">🦠</div>
          <h3 className="text-lg font-bold text-zinc-200">2. Contain Outbreaks</h3>
          <p className="text-sm text-zinc-500">
            Parasites will breach from the borders and infect the grid. Chain purges to generate currency and eliminate threats.
          </p>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-700 p-6 rounded-lg flex flex-col items-center text-center space-y-4">
          <div className="text-red-500 text-4xl mb-2">⚡</div>
          <h3 className="text-lg font-bold text-zinc-200">3. Overclock Safely</h3>
          <p className="text-sm text-zinc-500">
            Monitor the Thermal Throttle. Using Overclock provides emergency shields and speed, but incurs a heavy cooldown penalty.
          </p>
        </div>
      </div>

      <button
        onClick={handleStart}
        className="px-8 py-3 bg-amber-500/20 border border-amber-500 text-amber-400 font-bold uppercase tracking-widest hover:bg-amber-500 hover:text-zinc-900 hover:shadow-[0_0_20px_rgba(245,158,11,0.5)] transition-all duration-300"
      >
        [ RUN SIMULATION ]
      </button>
    </div>
  );
}
