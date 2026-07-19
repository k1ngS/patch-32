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
    <main className="h-screen w-full flex flex-col lg:flex-row bg-[#050508] text-[#e0e0e0] p-4 lg:p-6 gap-6 justify-center items-center select-none overflow-hidden relative">
      
      {/* ── PERIPHERAL DECORATIVE TELEMETRY (Desktop Only) ── */}
      <div className="hidden xl:block absolute top-4 left-6 text-zinc-700 text-[10px] tracking-widest font-mono">
        SYS_ALLOC: 412MB // VOLTAGE_CORE: 1.22V
      </div>
      <div className="hidden xl:block absolute bottom-4 left-6 text-zinc-700 text-[10px] tracking-widest font-mono">
        DRV_VERSION: 0.16.2092JD
      </div>
      <div className="hidden xl:block absolute top-4 right-6 text-zinc-700 text-[10px] tracking-widest font-mono">
        NODE_SEC: ACTIVE // LINK_MTU: 1500
      </div>
      <div className="hidden xl:block absolute bottom-4 right-6 text-zinc-700 text-[10px] tracking-widest font-mono">
        [ SYSTEM METRICS // NOMINAL ]
      </div>

      {activeScreen === "menu" && <MainMenu />}
      {activeScreen === "tutorial" && <TutorialScreen />}

      {(activeScreen === "game" || activeScreen === "gameover") && (
        <>
          {/* ESQUERDA: O CONTAINER DO GRID */}
          <section className="w-full max-w-[min(82vh,calc(100vw-380px))] aspect-square bg-[#0a0a10] border border-zinc-800/80 rounded-xl flex items-center justify-center p-2 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] bg-[size:16px_16px] opacity-20 pointer-events-none"></div>
            <GridCanvas />
            
            {/* OVERLAY DE FIM DE JOGO */}
            {activeScreen === "gameover" && <GameOverReport />}
          </section>

          {/* DIREITA: O TERMINAL DE UPGRADES E METRICAS */}
          <section className="w-full lg:w-80 shrink-0 flex h-[85vh]">
            <ControlPanel />
          </section>
        </>
      )}
    </main>
  );
}
