"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useGameStore } from "@/store/useGameStore";
import { audioEngine } from "@/utils/audioEngine";

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function GameOverReport() {
  const score = useGameStore((state) => state.score);
  const runId = useGameStore((state) => state.runId);
  const core = useGameStore((state) => state.core);
  const elapsedMs = useGameStore((state) => state.elapsedMs);
  const phase = useGameStore((state) => state.phase);
  
  const initGame = useGameStore((state) => state.initGame);
  const startGame = useGameStore((state) => state.startGame);
  const setActiveScreen = useGameStore((state) => state.setActiveScreen);

  const survivalTimeSeconds = Math.floor(elapsedMs / 1000);
  const survivalTimeStr = formatTime(survivalTimeSeconds);

  const isVictory = (core.health > 0 && elapsedMs >= 180000) || phase === "victory";

  // Victory sub-state: 'transition' (600ms wipe) -> 'report'
  const [victoryStep, setVictoryStep] = useState<"transition" | "report">("transition");

  // Defeat sub-state: 'glitch' (400ms collapse) -> 'bsod' (2s screen) -> 'recovery'
  const [defeatStep, setDefeatStep] = useState<"glitch" | "bsod" | "recovery">("glitch");

  const skipVictoryTransition = useCallback(() => {
    setVictoryStep("report");
  }, []);

  const skipDefeatTransition = useCallback(() => {
    if (defeatStep === "glitch") setDefeatStep("bsod");
    else if (defeatStep === "bsod") setDefeatStep("recovery");
  }, [defeatStep]);

  // Victory audio chime
  useEffect(() => {
    if (isVictory) {
      audioEngine.playBootChime();
    } else {
      audioEngine.playCrtShutdown();
    }
  }, [isVictory]);

  const handleReinstall = () => {
    audioEngine.playUiClick();
    audioEngine.playBootChime();
    initGame();
    startGame();
    setActiveScreen("game");
  };

  const handleVictoryRestart = () => {
    audioEngine.playUiClick();
    audioEngine.playBootChime();
    useGameStore.setState({ hasAppliedPatch: true });
    initGame();
    setActiveScreen("menu");
  };

  // Victory entrance transition timer
  useEffect(() => {
    if (!isVictory || victoryStep !== "transition") return;

    const timer = setTimeout(() => {
      setVictoryStep("report");
    }, 700);

    const handleSkip = () => {
      skipVictoryTransition();
    };

    window.addEventListener("keydown", handleSkip);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", handleSkip);
    };
  }, [isVictory, victoryStep, skipVictoryTransition]);

  // Defeat entrance transition timer (Glitch -> BSOD -> Recovery)
  useEffect(() => {
    if (isVictory) return;

    let timer: NodeJS.Timeout;
    if (defeatStep === "glitch") {
      timer = setTimeout(() => {
        setDefeatStep("bsod");
      }, 500);
    } else if (defeatStep === "bsod") {
      timer = setTimeout(() => {
        setDefeatStep("recovery");
      }, 2200);
    }

    const handleSkip = () => {
      skipDefeatTransition();
    };

    window.addEventListener("keydown", handleSkip);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", handleSkip);
    };
  }, [isVictory, defeatStep, skipDefeatTransition]);

  // ── 1. VICTORY FLOW ─────────────────────────────────────────
  if (isVictory) {
    if (victoryStep === "transition") {
      return (
        <div
          onClick={skipVictoryTransition}
          className="fixed inset-0 bg-[#010804] flex flex-col items-center justify-center z-50 text-emerald-400 font-mono p-6 select-none cursor-pointer overflow-hidden animate-in fade-in duration-150"
        >
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(16,185,129,0.15)_50%,transparent_50%)] bg-[length:100%_8px] animate-pulse pointer-events-none" />
          
          <div className="max-w-md w-full flex flex-col items-center text-center space-y-6 z-10">
            <div className="text-4xl animate-bounce">⚡</div>
            <h2 className="text-xl font-bold tracking-[0.2em] text-emerald-300 uppercase">
              APPLYING PATCH32...
            </h2>
            
            <div className="w-full h-2 bg-black border border-emerald-800 relative overflow-hidden">
              <div className="h-full bg-emerald-400 animate-[pulse_0.6s_ease-in-out_infinite] w-full" />
            </div>

            <p className="text-xs text-emerald-600 uppercase tracking-widest">
              [ KERNEL REBOOT IN PROGRESS // VERIFYING INTEGRITY ]
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 bg-[#020a05]/95 backdrop-blur-lg flex flex-col items-center justify-center z-50 text-[#e0e0e0] font-mono p-6 select-none animate-in zoom-in-95 duration-200">
        <div className="bg-[#050b09] border-2 border-emerald-500/80 p-8 shadow-[0_0_50px_rgba(16,185,129,0.3)] max-w-lg w-full flex flex-col items-center text-center space-y-6 relative overflow-hidden">
          
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(16,185,129,0.05)_50%)] bg-[length:100%_4px] pointer-events-none" />

          <div className="w-full border-b border-emerald-900/60 pb-4 flex items-center justify-between">
            <span className="text-xs text-emerald-400 font-bold uppercase tracking-widest bg-emerald-950 px-2.5 py-1 border border-emerald-800">
              PATCH APPLIED
            </span>
            <span className="text-[10px] text-emerald-600 font-mono">
              RUN_ID: {runId}
            </span>
          </div>

          <div className="w-full text-left space-y-2 text-sm font-mono text-emerald-300 bg-black/80 p-5 border border-emerald-900/60 shadow-inner">
            <p className="flex items-center gap-2.5 font-extrabold text-emerald-400 text-lg">
              <span className="text-emerald-400">✓</span> PATCH APPLIED
            </p>
            <p className="flex items-center gap-2.5 text-emerald-300 font-semibold">
              <span className="text-emerald-500">✓</span> System restored.
            </p>
            <p className="flex items-center gap-2.5 text-amber-400 font-semibold pt-3 border-t border-emerald-950">
              <span>⚡</span> Restart required.
            </p>
          </div>

          <div className="w-full space-y-2 text-xs">
            <div className="flex justify-between items-center bg-black/60 p-2.5 border border-emerald-950">
              <span className="text-zinc-400 uppercase text-[10px]">Threats Resolved</span>
              <span className="text-emerald-400 font-bold text-sm">{score.totalPurges}</span>
            </div>
            <div className="flex justify-between items-center bg-black/60 p-2.5 border border-emerald-950">
              <span className="text-zinc-400 uppercase text-[10px]">Runtime</span>
              <span className="text-zinc-200 font-bold text-sm">{survivalTimeStr}</span>
            </div>
            <div className="flex justify-between items-center bg-black/60 p-2.5 border border-emerald-950">
              <span className="text-zinc-400 uppercase text-[10px]">Recovered Bits</span>
              <span className="text-amber-400 font-bold text-sm">₿ {score.total}</span>
            </div>
          </div>

          <button
            onClick={handleVictoryRestart}
            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold uppercase text-xs tracking-widest border border-emerald-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] cursor-pointer"
          >
            [ RESTART SYSTEM ]
          </button>
        </div>
      </div>
    );
  }

  // ── 2. DEFEAT FLOW ─────────────────────────────────────────

  if (defeatStep === "glitch") {
    return (
      <div
        onClick={skipDefeatTransition}
        className="fixed inset-0 bg-[#0d0202] flex flex-col items-center justify-center z-50 text-red-500 font-mono p-6 select-none cursor-pointer overflow-hidden animate-in fade-in duration-75"
      >
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(239,68,68,0.2)_50%,transparent_50%)] bg-[length:100%_6px] animate-pulse pointer-events-none" />
        
        <div className="max-w-md w-full flex flex-col items-center text-center space-y-4 z-10 border border-red-900/60 p-6 bg-black/80">
          <div className="text-5xl text-red-600 animate-ping">⚠️</div>
          <h2 className="text-xl font-bold tracking-widest text-red-500 uppercase">
            CRITICAL KERNEL EXCEPTION
          </h2>
          <p className="text-xs text-red-400/80 tracking-wider">
            SYSTEM FAILURE REPORT // KERNEL COLLAPSE
          </p>
        </div>
      </div>
    );
  }

  if (defeatStep === "bsod") {
    return (
      <div
        onClick={skipDefeatTransition}
        className="fixed inset-0 bg-[#0000aa] flex flex-col justify-between z-50 text-white font-mono p-8 sm:p-12 select-none cursor-pointer animate-in fade-in duration-100"
      >
        <div className="max-w-3xl space-y-8">
          <div className="text-3xl font-bold bg-white text-[#0000aa] inline-block px-4 py-1.5 shadow-md uppercase">
            Critical Kernel Exception
          </div>
          
          <div className="space-y-3 text-xl font-semibold tracking-wide leading-relaxed">
            <p>System Failure Report: Critical Process Interruption.</p>
            <p>PATCH32 installation halted.</p>
          </div>

          <div className="pt-8 text-sm text-blue-200 space-y-2 font-mono">
            <p>*** STOP: 0x000000F4 (0x00000003, 0x89A42020, 0x89A4218C)</p>
            <p>*** CRITICAL_KERNEL_EXCEPTION // SYSTEM_FAILURE_REPORT</p>
          </div>
        </div>

        <div className="text-xs text-blue-300 flex flex-col sm:flex-row justify-between items-start sm:items-center border-t border-blue-800/80 pt-4 gap-2">
          <span className="animate-pulse flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-300" />
            [ Generating Failure Report... 100% ]
          </span>
          <span className="text-blue-300 font-bold bg-blue-950/60 px-2 py-1 border border-blue-800">
            [ Click / Press any key to view System Failure Report ]
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#030305]/95 backdrop-blur-lg flex flex-col items-center justify-center z-50 text-[#e0e0e0] font-mono p-6 select-none animate-in zoom-in-95 duration-200">
      <div className="bg-[#0a0505] border-2 border-red-600/90 p-8 shadow-[0_0_50px_rgba(220,38,38,0.35)] max-w-lg w-full flex flex-col items-center space-y-6 relative overflow-hidden">
        
        <div className="text-center w-full border-b border-red-900/60 pb-4">
          <h2 className="text-xl font-extrabold text-red-500 tracking-widest uppercase mb-1">
            CRITICAL KERNEL EXCEPTION
          </h2>
          <p className="text-[11px] text-zinc-400 uppercase tracking-widest font-semibold">
            System Failure Report // RUN_ID: {runId}
          </p>
        </div>

        <div className="w-full space-y-2.5 text-xs font-mono">
          <div className="flex justify-between items-center bg-black/80 p-3 border border-red-950">
            <span className="text-zinc-400 text-xs">Kernel Integrity</span>
            <span className="text-red-500 font-bold text-sm">0%</span>
          </div>

          <div className="flex justify-between items-center bg-black/80 p-3 border border-red-950">
            <span className="text-zinc-400 text-xs">Threats Resolved</span>
            <span className="text-zinc-200 font-bold text-sm">{score.totalPurges}</span>
          </div>

          <div className="flex justify-between items-center bg-black/80 p-3 border border-red-950">
            <span className="text-zinc-400 text-xs">Runtime</span>
            <span className="text-zinc-200 font-bold text-sm">{survivalTimeStr}</span>
          </div>

          <div className="flex justify-between items-center bg-black/80 p-3 border border-red-950">
            <span className="text-zinc-400 text-xs">Recovered Bits</span>
            <span className="text-amber-500 font-bold text-sm">₿ {score.total}</span>
          </div>
        </div>

        <div className="w-full pt-2">
          <button
            onClick={handleReinstall}
            className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white font-bold uppercase text-xs tracking-widest border border-red-400 transition-all shadow-[0_0_20px_rgba(220,38,38,0.4)] cursor-pointer"
          >
            Reinstall PATCH32
          </button>
        </div>

      </div>
    </div>
  );
}

