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

export default function Home() {
  const activeScreen = useGameStore((state) => state.activeScreen);

  return (
    <main className="w-full h-[100dvh] flex flex-col items-center bg-[#050508] text-[#e0e0e0] font-mono select-none overflow-hidden p-2 sm:p-3">
      {/* TELAS DE MENU E TUTORIAL */}
      {activeScreen === "menu" && <MainMenu />}
      {activeScreen === "tutorial" && <TutorialScreen />}

      {/* TELA DE JOGO / GAMEOVER */}
      {(activeScreen === "game" || activeScreen === "gameover") && (
        <div className="w-full h-full flex flex-col items-center justify-center gap-1 sm:gap-2 overflow-hidden">
          
          {/* ÁREA CENTRAL MAXIMIZADA */}
          <div className="flex-1 flex flex-col items-center justify-center w-full min-h-0 overflow-hidden">
            
            {/* HUD SUPERIOR COLADA NO GRID */}
            <div className="w-full max-w-[min(90vw,80vh)] mb-1">
              <TopHUD />
            </div>

            {/* CONTAINER PROTAGONISTA DA ARENA (70-80% DA TELA) */}
            <section className="relative w-full max-w-[min(90vw,80vh)] aspect-square bg-[#0a0a10] border border-zinc-800/80 rounded-xl flex items-center justify-center p-0.5 sm:p-1 shadow-2xl overflow-hidden shrink-0">
              <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] bg-[size:24px_24px] opacity-20 pointer-events-none"></div>
              <GridCanvas />
              
              {/* OVERLAY DE FIM DE JOGO */}
              {activeScreen === "gameover" && <GameOverReport />}
            </section>

            {/* ACTION BAR INFERIOR COLADA NO GRID */}
            <div className="w-full max-w-[min(90vw,80vh)] mt-1">
              <ActionBar />
            </div>

          </div>

          {/* PAINÉIS LATERAIS OCULTOS (HUD REORGANIZADA PARA FOCO CENTRAL) */}
          <div className="hidden">
            <LogTerminal />
            <TelemetryPanel />
          </div>

        </div>
      )}
    </main>
  );
}
