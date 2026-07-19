import React from "react";
import { useGameStore } from "@/store/useGameStore";

export function MainMenu() {
  const setActiveScreen = useGameStore((state) => state.setActiveScreen);

  return (
    <div className="absolute inset-0 bg-[#050508] flex flex-col items-center justify-center z-50 text-[#e0e0e0] font-mono">
      <div className="text-center space-y-8">
        <h1 className="text-6xl font-bold text-cyan-400 tracking-[0.2em] drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">
          PATCH_32
        </h1>
        <p className="text-zinc-500 tracking-widest text-sm uppercase">
          Tactical Core Defense Simulation
        </p>
        
        <button
          onClick={() => setActiveScreen("tutorial")}
          className="mt-12 px-8 py-3 bg-cyan-900/30 border border-cyan-500 text-cyan-300 font-bold uppercase tracking-widest hover:bg-cyan-500 hover:text-[#050508] hover:shadow-[0_0_20px_rgba(34,211,238,0.6)] transition-all duration-300"
        >
          [ INITIALIZE PROTOCOL ]
        </button>
      </div>
    </div>
  );
}
