"use client";

import GridCanvas from "@/components/GridCanvas";
import { useGameStore } from "@/store/useGameStore";
import { frameConsumer, type MachineStance } from "@/runtime/consumers/FrameConsumer";
import { MainMenu } from "@/components/screens/MainMenu";
import { TutorialScreen } from "@/components/screens/TutorialScreen";
import { GameOverReport } from "@/components/screens/GameOverReport";
import { TopHUD } from "@/components/hud/TopHUD";
import { ActionBar } from "@/components/hud/ActionBar";
import { LogTerminal } from "@/components/hud/LogTerminal";
import { TelemetryPanel } from "@/components/hud/TelemetryPanel";
import { SystemAlertBanner } from "@/components/hud/SystemAlertBanner";

import React, { useState, useEffect } from "react";

export default function Home() {
  const activeScreen = useGameStore((state) => state.activeScreen);
  const [machineStance, setMachineStance] = useState<MachineStance>(frameConsumer.getStance());

  useEffect(() => {
    return frameConsumer.subscribe(() => {
      setMachineStance(frameConsumer.getStance());
    });
  }, []);

  const [showLogs, setShowLogs] = useState(true);
  const [showTelemetry, setShowTelemetry] = useState(true);

  const toggleLogs = () => {
    setShowLogs((prev) => !prev);
  };

  const toggleTelemetry = () => {
    setShowTelemetry((prev) => !prev);
  };

  // Border & breathing styles derived from FrameConsumer SystemStance
  let frameBorderColor = "border-zinc-900";
  let statusTagColor = "text-zinc-600 border-zinc-800 bg-black";
  let statusText = "SYSTEM // STABLE";
  let panelTransition = "transition-all duration-75";

  if (machineStance === "under_load") {
    frameBorderColor = "border-amber-600/80 shadow-[0_0_15px_rgba(217,119,6,0.15)]";
    statusTagColor = "text-amber-500 border-amber-800/80 bg-amber-950/20";
    statusText = "SYSTEM_LOAD // ELEVATED";
    panelTransition = "transition-all duration-200 ease-out"; // 100-200ms transition delay on bars/panels
  } else if (machineStance === "critical") {
    frameBorderColor = "border-red-600/90 shadow-[0_0_30px_rgba(220,38,38,0.4)] animate-pulse";
    statusTagColor = "text-red-500 border-red-800 bg-red-950/40 animate-pulse";
    statusText = "KERNEL_CRITICAL // EMERGENCY";
    panelTransition = "transition-all duration-100";
  } else if (machineStance === "recovery") {
    frameBorderColor = "border-emerald-600/80 shadow-[0_0_20px_rgba(16,185,129,0.3)]";
    statusTagColor = "text-emerald-400 border-emerald-800 bg-emerald-950/30";
    statusText = "KERNEL_RECOVERY // STABILIZING";
    panelTransition = "transition-colors duration-500 ease-in-out"; // Smooth 300-500ms relief transition
  } else if (machineStance === "overclock") {
    frameBorderColor = "border-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.3)]";
    statusTagColor = "text-amber-300 border-amber-500 bg-amber-950/40";
    statusText = "POWER_SURGE // OVERCLOCK";
  } else if (machineStance === "collapse") {
    frameBorderColor = "border-red-600/90 shadow-[0_0_30px_rgba(220,38,38,0.4)]";
    statusTagColor = "text-red-500 border-red-800 bg-red-950/40";
    statusText = "KERNEL_COLLAPSE // BREACHED";
  }

  return (
    <main className={`w-full h-[100dvh] flex flex-col bg-[#020202] text-[#e0e0e0] font-mono select-none overflow-hidden p-0 sm:p-1 border-2 ${panelTransition} ${frameBorderColor}`}>
      {/* TELAS DE MENU, TUTORIAL E GAMEOVER */}
      {activeScreen === "menu" && <MainMenu />}
      {activeScreen === "tutorial" && <TutorialScreen />}
      {activeScreen === "gameover" && <GameOverReport />}

      {/* TELA DE JOGO */}
      {(activeScreen === "game" || activeScreen === "gameover") && (
        <div className="w-full h-full flex flex-col min-h-0 bg-black relative">
          
          {/* MACHINE REASONING / VITAL HEADER */}
          <div className="w-full border-b border-zinc-900 bg-[#050508] flex justify-between items-center px-2 py-0.5 text-[9px] uppercase tracking-widest text-zinc-500 shrink-0">
            <span className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 ${machineStance === "collapse" || machineStance === "critical" ? "bg-red-500 animate-ping" : machineStance === "under_load" ? "bg-amber-500 animate-pulse" : machineStance === "recovery" ? "bg-emerald-400 animate-pulse" : "bg-cyan-500"}`}></span>
              [PATCH32 // KERNEL APPARATUS]
            </span>
            <span className={`px-1.5 py-0.5 border font-bold ${statusTagColor}`}>
              {statusText}
            </span>
          </div>

          {/* KERNEL INSTRUMENTATION (TOP HUD) */}
          <div className="w-full border-b border-zinc-900">
            <TopHUD
              showLogs={showLogs}
              showTelemetry={showTelemetry}
              onToggleLogs={toggleLogs}
              onToggleTelemetry={toggleTelemetry}
            />
          </div>

          {/* MIDDLE INSTRUMENTATION + WORKSTATION MODULES */}
          <div className="flex-1 flex flex-row items-stretch justify-center min-h-0 w-full relative overflow-hidden bg-black">
            
            {/* NATIVE SYSTEM CONSOLE (LOGS PANEL) */}
            {showLogs && (
              <aside className="flex-1 min-w-[200px] border-r border-zinc-900 bg-[#030305] flex flex-col z-10 animate-in fade-in slide-in-from-left-2 duration-150">
                <div className="flex justify-between items-center px-2 py-1 border-b border-zinc-900 bg-black">
                  <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-cyan-400 animate-pulse"></span>
                    SYSTEM CONSOLE
                  </span>
                  <button
                    onClick={() => setShowLogs(false)}
                    className="text-[9px] text-zinc-500 hover:text-cyan-400 font-bold px-1 py-0.5 border border-zinc-800 hover:border-cyan-500/40"
                  >
                    [X]
                  </button>
                </div>
                <div className="flex-1 min-h-0">
                  <LogTerminal />
                </div>
              </aside>
            )}

            {/* MEMORY MATRIX WORKSTATION MODULE (RESPONSIVE CLAMP: 520px -> 60vh -> 680px) */}
            <div className="flex-shrink-0 flex items-center justify-center p-2 bg-black relative">
              <section
                className="relative aspect-square border border-zinc-900 bg-black flex items-center justify-center p-0 flex-shrink-0 overflow-hidden"
                style={{
                  width: "clamp(520px, 60vh, 680px)",
                  height: "clamp(520px, 60vh, 680px)",
                }}
              >
                <GridCanvas />
                <SystemAlertBanner />
              </section>
            </div>

            {/* NATIVE TELEMETRY BUS (METRICS PANEL) */}
            {showTelemetry && (
              <aside className="flex-1 min-w-[200px] border-l border-zinc-900 bg-[#030305] flex flex-col z-10 animate-in fade-in slide-in-from-right-2 duration-150">
                <div className="flex justify-between items-center px-2 py-1 border-b border-zinc-900 bg-black">
                  <span className="text-[9px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-amber-400 animate-pulse"></span>
                    TELEMETRY BUS
                  </span>
                  <button
                    onClick={() => setShowTelemetry(false)}
                    className="text-[9px] text-zinc-500 hover:text-amber-400 font-bold px-1 py-0.5 border border-zinc-800 hover:border-amber-500/40"
                  >
                    [X]
                  </button>
                </div>
                <div className="flex-1 min-h-0">
                  <TelemetryPanel />
                </div>
              </aside>
            )}

          </div>

          {/* POWER DISTRIBUTION BUS (ACTION BAR) */}
          <div className="w-full border-t border-zinc-900">
            <ActionBar />
          </div>

        </div>
      )}
    </main>
  );
}
