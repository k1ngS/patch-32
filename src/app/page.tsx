"use client";

import { ControlPanel } from "@/components/ControlPanel";
import GridCanvas from "@/components/GridCanvas";
import { useGameStore } from "@/store/useGameStore";
import { MainMenu } from "@/components/screens/MainMenu";
import { TutorialScreen } from "@/components/screens/TutorialScreen";
import { GameOverReport } from "@/components/screens/GameOverReport";

export default function Home() {
  const activeScreen = useGameStore((state) => state.activeScreen);

  return (
    <main className="w-full h-[100dvh] flex flex-col bg-[#050508] text-[#e0e0e0] font-mono select-none overflow-hidden p-2 sm:p-4 lg:p-5">
      {/* BARRAMENTO SUPERIOR */}
      <header className="w-full flex justify-between items-center text-[10px] text-zinc-600 tracking-widest border-b border-zinc-900/60 pb-1 sm:pb-2 mb-2 shrink-0 select-none pointer-events-none">
        <div>SYS_ALLOC: 412MB // VOLTAGE: 1.22V</div>
        <div className="hidden xs:block">NODE_SEC: ACTIVE</div>
      </header>

      {/* COMPONENTES CONDICIONAIS */}
      {activeScreen === "menu" && <MainMenu />}
      {activeScreen === "tutorial" && <TutorialScreen />}

      {(activeScreen === "game" || activeScreen === "gameover") && (
        <div className="flex-1 flex flex-col lg:flex-row gap-2 sm:gap-4 lg:gap-6 justify-center items-center min-h-0 w-full overflow-hidden">
          {/* ESQUERDA: O CONTAINER DO GRID */}
          <section className="w-full max-w-[min(100%,360px)] lg:max-w-[min(72vh,calc(100vw-360px))] max-h-[38vh] sm:max-h-[45vh] lg:max-h-none aspect-square bg-[#0a0a10] border border-zinc-800/80 rounded-xl flex items-center justify-center p-1.5 sm:p-2 shadow-2xl relative overflow-hidden shrink-0">
            <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] bg-[size:16px_16px] opacity-20 pointer-events-none"></div>
            <GridCanvas />
            
            {/* OVERLAY DE FIM DE JOGO */}
            {activeScreen === "gameover" && <GameOverReport />}
          </section>

          {/* DIREITA: O TERMINAL DE UPGRADES E METRICAS */}
          <section className="w-full sm:max-w-md lg:w-80 flex-1 lg:flex-none flex flex-col h-full min-h-0 shrink border border-zinc-800/30 lg:border-none rounded-xl p-2 sm:p-3 lg:p-0 bg-[#0a0a10]/30 lg:bg-transparent overflow-y-auto lg:overflow-hidden custom-scrollbar">
            <ControlPanel />
          </section>
        </div>
      )}

      {/* BARRAMENTO INFERIOR */}
      <footer className="w-full flex justify-between items-center text-[10px] text-zinc-600 tracking-widest border-t border-zinc-900/60 pt-1 sm:pt-2 mt-2 shrink-0 select-none pointer-events-none">
        <div>DRV_VERSION: 0.16.2092JD</div>
        <div>[ SYSTEM METRICS // NOMINAL ]</div>
      </footer>
    </main>
  );
}
