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
import { audioEngine } from "@/utils/audioEngine";

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
    audioEngine.playUiClick();
    setShowLogs((prev) => !prev);
  };

  const toggleTelemetry = () => {
    audioEngine.playUiClick();
    setShowTelemetry((prev) => !prev);
  };

  // Border & breathing styles derived from FrameConsumer SystemStance
  let frameBorderColor = "border-cyan-500/30";
  let statusTagColor = "text-zinc-600 border-zinc-800 bg-black";
  let statusText = "SYSTEM // STABLE";
  let panelTransition = "transition-all duration-300 ease-out";

  if (machineStance === "under_load") {
    frameBorderColor = "border-amber-600/80 shadow-[0_0_30px_rgba(217,119,6,0.25)]";
    statusTagColor = "text-amber-500 border-amber-800/80 bg-amber-950/20";
    statusText = "SYSTEM_LOAD // ELEVATED";
  } else if (machineStance === "critical") {
    frameBorderColor = "border-red-600/90 shadow-[0_0_40px_rgba(220,38,38,0.4)] animate-pulse";
    statusTagColor = "text-red-500 border-red-800 bg-red-950/40 animate-pulse";
    statusText = "KERNEL_CRITICAL // EMERGENCY";
  } else if (machineStance === "recovery") {
    frameBorderColor = "border-emerald-600/80 shadow-[0_0_30px_rgba(16,185,129,0.3)]";
    statusTagColor = "text-emerald-400 border-emerald-800 bg-emerald-950/30";
    statusText = "KERNEL_RECOVERY // STABILIZING";
  } else if (machineStance === "overclock") {
    frameBorderColor = "border-amber-400 shadow-[0_0_35px_rgba(251,191,36,0.35)]";
    statusTagColor = "text-amber-300 border-amber-500 bg-amber-950/40";
    statusText = "POWER_SURGE // OVERCLOCK";
  } else if (machineStance === "collapse") {
    frameBorderColor = "border-red-600/90 shadow-[0_0_40px_rgba(220,38,38,0.4)]";
    statusTagColor = "text-red-500 border-red-800 bg-red-950/40";
    statusText = "KERNEL_COLLAPSE // BREACHED";
  }

  return (
    <main className="w-full h-[100dvh] flex items-center justify-center bg-[#020205] text-[#e0e0e0] font-mono select-none overflow-hidden p-1 sm:p-3 relative">
      
      {/* BACKGROUND SCANLINE & MATRIX ATMOSPHERE */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.4)_50%)] bg-[length:100%_4px] pointer-events-none z-0" />

      {/* TELAS FULLSCREEN: MENU, TUTORIAL E GAMEOVER */}
      {activeScreen === "menu" && <MainMenu />}
      {activeScreen === "tutorial" && <TutorialScreen />}
      {activeScreen === "gameover" && <GameOverReport />}

      {/* TELA DE JOGO DA WORKSTATION (PATCH OS APPLICATION WINDOW) */}
      {(activeScreen === "game" || activeScreen === "gameover") && (
        <div className={`w-full h-full max-w-7xl max-h-[98vh] flex flex-col backdrop-blur-xl bg-[#0a0a10]/90 border rounded-sm shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden relative z-10 animate-in zoom-in-95 duration-300 ease-out ${panelTransition} ${frameBorderColor}`}>
          
          {/* WINDOW HEADER BAR (EXACT SPEC FROM GDD) */}
          <div className="w-full bg-[#12121a] border-b border-zinc-800 px-3 py-1.5 flex justify-between items-center text-xs font-mono text-zinc-400 select-none shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500/80 shadow-[0_0_8px_rgba(34,211,238,0.8)]"></span>
              <span className="font-semibold text-zinc-300">
                [PATCH32] - Memory_Containment_Service.exe (PID: 4092)
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs font-bold">
              <button onClick={() => audioEngine.playUiClick()} className="hover:text-zinc-200 transition-colors" title="Minimize">_</button>
              <button onClick={() => audioEngine.playUiClick()} className="hover:text-zinc-200 transition-colors" title="Maximize">□</button>
              <button
                onClick={() => audioEngine.playUiClick()}
                className="text-red-400 hover:text-red-300 transition-colors font-bold px-1"
                title="Close Application"
              >
                X
              </button>
            </div>
          </div>

          {/* WINDOW CONTENT CONTAINER */}
          <div className="w-full flex-1 flex flex-col min-h-0 bg-black/95 relative">
            
            {/* MACHINE REASONING / VITAL HEADER */}
            <div className="w-full border-b border-zinc-900 bg-[#050508] flex justify-between items-center px-2.5 py-1 text-[9px] uppercase tracking-widest text-zinc-500 shrink-0">
              <span className="flex items-center gap-2 font-bold">
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
                <aside className="flex-1 min-w-[200px] border-r border-zinc-900 bg-[#030305] flex flex-col z-10 animate-in fade-in slide-in-from-left-2 duration-200">
                  <div className="flex justify-between items-center px-2 py-1 border-b border-zinc-900 bg-black">
                    <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-cyan-400 animate-pulse"></span>
                      SYSTEM CONSOLE
                    </span>
                    <button
                      onClick={toggleLogs}
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

              {/* MEMORY MATRIX WORKSTATION MODULE */}
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
                <aside className="flex-1 min-w-[200px] border-l border-zinc-900 bg-[#030305] flex flex-col z-10 animate-in fade-in slide-in-from-right-2 duration-200">
                  <div className="flex justify-between items-center px-2 py-1 border-b border-zinc-900 bg-black">
                    <span className="text-[9px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-amber-400 animate-pulse"></span>
                      TELEMETRY BUS
                    </span>
                    <button
                      onClick={toggleTelemetry}
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
        </div>
      )}
    </main>
  );
}
