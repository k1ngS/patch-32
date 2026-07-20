"use client";

import GridCanvas from "@/components/GridCanvas";
import { useGameStore } from "@/store/useGameStore";
import { MainMenu } from "@/components/screens/MainMenu";
import { TutorialScreen } from "@/components/screens/TutorialScreen";
import { GameOverReport } from "@/components/screens/GameOverReport";
import { TopHUD } from "@/components/hud/TopHUD";
import { ActionBar } from "@/components/hud/ActionBar";
import { LogTerminal } from "@/components/hud/LogTerminal";
import { TelemetryPanel } from "@/components/hud/TelemetryPanel";

import React, { useState } from "react";

export default function Home() {
  const activeScreen = useGameStore((state) => state.activeScreen);
  const [showLogs, setShowLogs] = useState(false);
  const [showTelemetry, setShowTelemetry] = useState(false);

  const toggleLogs = () => {
    setShowLogs((prev) => !prev);
  };

  const toggleTelemetry = () => {
    setShowTelemetry((prev) => !prev);
  };

  return (
    <main className="w-full h-[100dvh] flex flex-col items-center bg-[#050508] text-[#e0e0e0] font-mono select-none overflow-hidden p-2 sm:p-3 relative">
      {/* TELAS DE MENU E TUTORIAL */}
      {activeScreen === "menu" && <MainMenu />}
      {activeScreen === "tutorial" && <TutorialScreen />}

      {/* TELA DE JOGO / GAMEOVER */}
      {(activeScreen === "game" || activeScreen === "gameover") && (
        <div className="w-full h-full flex flex-col items-center justify-center gap-1 sm:gap-2 overflow-hidden relative">
          
          {/* ÁREA CENTRAL MAXIMIZADA */}
          <div className="flex-1 flex flex-col items-center justify-center w-full min-h-0 overflow-hidden relative">
            
            {/* HUD SUPERIOR COLADA NO GRID */}
            <div className="w-full max-w-6xl mb-1">
              <TopHUD
                showLogs={showLogs}
                showTelemetry={showTelemetry}
                onToggleLogs={toggleLogs}
                onToggleTelemetry={toggleTelemetry}
              />
            </div>

            {/* CONTAINER CENTRAL DA ARENA (GRID) - ANCORA FIXA PARA AS ASAS LATERAIS */}
            <div className="flex-1 flex items-center justify-center w-full min-h-0 overflow-visible relative">
              
              {/* ARENA CENTRAL PROTAGONISTA (GRID) */}
              <section className="relative h-full max-h-[min(90vw,76vh)] aspect-square bg-[#0a0a10] border border-zinc-800/80 rounded-xl flex items-center justify-center p-0.5 sm:p-1 shadow-2xl shrink-0">
                <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] bg-[size:24px_24px] opacity-20 pointer-events-none rounded-xl"></div>
                <GridCanvas />
                
                {/* PAINEL ANCORADO À ESQUERDA (FORA DO GRID, 0 IMPACTO NO POSICIONAMENTO DO GRID) */}
                {showLogs && (
                  <aside className="absolute right-[calc(100%+8px)] top-0 bottom-0 w-56 sm:w-64 bg-[#0a0a10]/95 border border-cyan-500/40 rounded-xl p-2 shadow-2xl flex flex-col z-20 animate-in fade-in slide-in-from-right-2 duration-200">
                    <div className="flex justify-between items-center mb-1.5 pb-1 border-b border-zinc-800">
                      <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                        SYS_LOGS // TERMINAL
                      </span>
                      <button
                        onClick={() => setShowLogs(false)}
                        className="text-[9px] text-zinc-500 hover:text-cyan-400 font-bold px-1.5 py-0.5 rounded border border-zinc-800 hover:border-cyan-500/40"
                      >
                        [x]
                      </button>
                    </div>
                    <div className="flex-1 min-h-0">
                      <LogTerminal />
                    </div>
                  </aside>
                )}

                {/* PAINEL ANCORADO À DIREITA (FORA DO GRID, 0 IMPACTO NO POSICIONAMENTO DO GRID) */}
                {showTelemetry && (
                  <aside className="absolute left-[calc(100%+8px)] top-0 bottom-0 w-48 sm:w-56 bg-[#0a0a10]/95 border border-amber-500/40 rounded-xl p-2 shadow-2xl flex flex-col z-20 animate-in fade-in slide-in-from-left-2 duration-200">
                    <div className="flex justify-between items-center mb-1.5 pb-1 border-b border-zinc-800">
                      <span className="text-[9px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                        TELEMETRY // LIVE
                      </span>
                      <button
                        onClick={() => setShowTelemetry(false)}
                        className="text-[9px] text-zinc-500 hover:text-amber-400 font-bold px-1.5 py-0.5 rounded border border-zinc-800 hover:border-amber-500/40"
                      >
                        [x]
                      </button>
                    </div>
                    <div className="flex-1 min-h-0">
                      <TelemetryPanel />
                    </div>
                  </aside>
                )}

                {/* OVERLAY DE FIM DE JOGO */}
                {activeScreen === "gameover" && <GameOverReport />}
              </section>

            </div>

            {/* ACTION BAR INFERIOR COLADA NO GRID */}
            <div className="w-full max-w-6xl mt-1">
              <ActionBar />
            </div>

          </div>

        </div>
      )}
    </main>
  );
}
