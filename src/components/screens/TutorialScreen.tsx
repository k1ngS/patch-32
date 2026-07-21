import React from "react";
import { useGameStore } from "@/store/useGameStore";
import { PARASITE_CONFIGS } from "@/constants/gameConfig";

export function TutorialScreen() {
  const setActiveScreen = useGameStore((state) => state.setActiveScreen);
  const initGame = useGameStore((state) => state.initGame);

  const handleStart = () => {
    initGame();
    setActiveScreen("game");
  };

  return (
    <div className="absolute inset-0 bg-[#050508] flex flex-col items-center justify-center z-50 text-[#e0e0e0] font-mono p-8 overflow-y-auto custom-scrollbar">
      <div className="max-w-4xl w-full flex flex-col items-center my-auto py-12">
        <h2 className="text-2xl font-bold text-cyan-400 tracking-widest uppercase mb-10 border-b border-zinc-800 pb-4">
          Briefing Protocol
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-12">
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
              Malware will breach from the borders and infect the grid. Chain purges to recover computational Bits (CPU/RAM/cache) and eliminate threats.
            </p>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-700 p-6 rounded-lg flex flex-col items-center text-center space-y-4">
            <div className="text-red-500 text-4xl mb-2">⚡</div>
            <h3 className="text-lg font-bold text-zinc-200">3. Overclock Safely</h3>
            <p className="text-sm text-zinc-500">
              Monitor Thermal Throttle. Kernel Overclock provides emergency shields and speed, but incurs a heavy thermal cooldown penalty.
            </p>
          </div>
        </div>

        <h2 className="text-xl font-bold text-red-500 tracking-widest uppercase mb-8 border-b border-zinc-800 pb-2">
          Malware Index
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-12">
          <div className="bg-zinc-900/50 border border-red-900/30 p-5 rounded-lg flex flex-col space-y-3">
            <div className="flex items-center space-x-3 mb-1">
              <span className="text-red-500 text-xl">▲</span>
              <h3 className="text-md font-bold text-red-400">Crawler</h3>
            </div>
            <div className="text-xs text-zinc-400 space-y-1">
              <p>HP: <span className="text-zinc-200">{PARASITE_CONFIGS.pulse_worm.hp}</span></p>
              <p>DMG: <span className="text-zinc-200">{PARASITE_CONFIGS.pulse_worm.coreDamage}</span></p>
              <p>SPD: <span className="text-zinc-200">{PARASITE_CONFIGS.pulse_worm.speed} tick</span></p>
            </div>
            <p className="text-xs text-zinc-500 pt-2 border-t border-zinc-800">
              Common malware threat. Constant advance towards the kernel.
            </p>
          </div>

          <div className="bg-zinc-900/50 border border-red-900/30 p-5 rounded-lg flex flex-col space-y-3">
            <div className="flex items-center space-x-3 mb-1">
              <span className="text-red-800 text-xl">∎</span>
              <h3 className="text-md font-bold text-red-700">Rootkit</h3>
            </div>
            <div className="text-xs text-zinc-400 space-y-1">
              <p>HP: <span className="text-zinc-200">{PARASITE_CONFIGS.siege_bloc.hp}</span></p>
              <p>DMG: <span className="text-zinc-200">{PARASITE_CONFIGS.siege_bloc.coreDamage}</span></p>
              <p>SPD: <span className="text-zinc-200">{PARASITE_CONFIGS.siege_bloc.speed} ticks</span></p>
            </div>
            <p className="text-xs text-zinc-500 pt-2 border-t border-zinc-800">
              Slow but resilient malware. Orbital shielding requires concentrated purges.
            </p>
          </div>

          <div className="bg-zinc-900/50 border border-magenta-900/30 p-5 rounded-lg flex flex-col space-y-3">
            <div className="flex items-center space-x-3 mb-1">
              <span className="text-[#ff44ff] text-xl">◆</span>
              <h3 className="text-md font-bold text-[#ff44ff]">Spyware</h3>
            </div>
            <div className="text-xs text-zinc-400 space-y-1">
              <p>HP: <span className="text-zinc-200">{PARASITE_CONFIGS.storm_flitter.hp}</span></p>
              <p>DMG: <span className="text-zinc-200">{PARASITE_CONFIGS.storm_flitter.coreDamage}</span></p>
              <p>SPD: <span className="text-zinc-200">{PARASITE_CONFIGS.storm_flitter.speed} ticks</span></p>
            </div>
            <p className="text-xs text-zinc-500 pt-2 border-t border-zinc-800">
              Erratic and fragile spyware. Low health but highly unpredictable.
            </p>
          </div>
        </div>

        <button
          onClick={handleStart}
          className="px-8 py-3 bg-amber-500/20 border border-amber-500 text-amber-400 font-bold uppercase tracking-widest hover:bg-amber-500 hover:text-zinc-900 hover:shadow-[0_0_20px_rgba(245,158,11,0.5)] transition-all duration-300"
        >
          [ INITIALIZE CONTAINMENT ]
        </button>
      </div>
    </div>
  );
}
