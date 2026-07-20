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
        <div className="w-full h-full max-w-6xl flex flex-col items-center justify-between gap-2 overflow-hidden">
          {/* TOP HUD BAR */}
          <TopHUD />

          {/* ÁREA CENTRAL (PAINEL ESQUERDO, ARENA CENTRAL PROTAGONISTA, PAINEL DIREITO) */}
          <div className="flex-1 flex items-center justify-center gap-2 sm:gap-4 w-full min-h-0 overflow-hidden">
            {/* PAINEL SECUNDÁRIO ESQUERDO: LOGS (DESKTOP) */}
            <aside className="hidden xl:flex flex-col w-56 h-full max-h-[min(65vh,520px)] shrink-0">
              <LogTerminal />
            </aside>

            {/* CONTAINER PROTAGONISTA DA ARENA */}
            <section className="relative h-full max-h-[min(65vh,520px)] aspect-square bg-[#0a0a10] border border-zinc-800/80 rounded-xl flex items-center justify-center p-1 sm:p-2 shadow-2xl overflow-hidden shrink-0">
              <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] bg-[size:16px_16px] opacity-20 pointer-events-none"></div>
              <GridCanvas />
              
              {/* OVERLAY DE FIM DE JOGO */}
              {activeScreen === "gameover" && <GameOverReport />}
            </section>

            {/* PAINEL SECUNDÁRIO DIREITO: TELEMETRIA (DESKTOP) */}
            <aside className="hidden xl:flex flex-col w-52 h-full max-h-[min(65vh,520px)] shrink-0">
              <TelemetryPanel />
            </aside>
          </div>

          {/* ACTION BAR INFERIOR (UPGRADES & OVERCLOCK) */}
          <ActionBar />
        </div>
      )}
    </main>
  );
}
