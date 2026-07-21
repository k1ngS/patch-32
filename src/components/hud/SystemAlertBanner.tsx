"use client";

import React from "react";
import { useGameStore } from "@/store/useGameStore";

export function SystemAlertBanner() {
  const osAlertBanner = useGameStore((state) => state.osAlertBanner);
  const osToastMessage = useGameStore((state) => state.osToastMessage);
  const clearOsToast = useGameStore((state) => state.clearOsToast);
  const isInputLocked = useGameStore((state) => state.isInputLocked);
  const inputLockRemainingMs = useGameStore((state) => state.inputLockRemainingMs);
  const sectorBanner = useGameStore((state) => state.sectorBanner);

  const lockSeconds = (Math.max(0, inputLockRemainingMs) / 1000).toFixed(1);

  return (
    <div className="absolute inset-0 pointer-events-none z-40 flex flex-col items-center justify-between p-4 overflow-hidden select-none">
      
      {/* 1. FULL-SCREEN 4TH WALL CONTROL LOCKDOWN MODAL (3.5s) */}
      {isInputLocked && (
        <div className="pointer-events-auto absolute inset-0 bg-[#0d0202]/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 z-50 animate-in fade-in duration-100">
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(239,68,68,0.15)_50%,transparent_50%)] bg-[length:100%_6px] animate-pulse pointer-events-none" />
          
          <div className="bg-[#050000] border-2 border-red-500 p-6 shadow-[0_0_50px_rgba(239,68,68,0.5)] max-w-lg w-full flex flex-col items-center text-center space-y-4 font-mono relative">
            <div className="flex items-center gap-2 text-red-500 font-bold text-sm tracking-widest uppercase bg-red-950/60 px-3 py-1 border border-red-800">
              <span className="animate-ping">⚠️</span>
              [ WARNING: CRITICAL KERNEL BREACH DETECTED ]
            </div>

            <h3 className="text-lg font-bold text-red-400 tracking-wider">
              EMERGENCY SYSTEM OVERRIDE
            </h3>

            <p className="text-xs text-red-300/90 leading-relaxed bg-black/80 p-3 border border-red-950 w-full text-left">
              User privileges temporarily suspended for emergency system override.
            </p>

            <div className="w-full flex items-center justify-between bg-black p-3 border border-red-900 text-xs">
              <span className="text-zinc-400">CONTROL LOCKDOWN:</span>
              <span className="text-red-400 font-bold text-sm animate-pulse">
                [ {lockSeconds}s ]
              </span>
            </div>

            <p className="text-[10px] text-zinc-500 uppercase tracking-widest">
              PLEASE STAND BY // DO NOT ATTEMPT TO FORCE SHUTDOWN
            </p>
          </div>
        </div>
      )}

      {/* 2. BIG CENTER SECTOR TRANSITION BANNER */}
      {sectorBanner && !isInputLocked && (
        <div className="pointer-events-auto my-auto max-w-lg w-full bg-[#05080c] border-2 border-cyan-400 text-cyan-200 p-6 shadow-[0_0_50px_rgba(34,211,238,0.4)] animate-in zoom-in-95 duration-200 font-mono text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(34,211,238,0.08)_50%)] bg-[length:100%_4px] pointer-events-none" />

          <div className="text-xs text-cyan-400 font-bold tracking-[0.25em] uppercase mb-2">
            [ SYSTEM NOTICE // SECTOR TRANSITION ]
          </div>

          <h2 className="text-2xl font-black tracking-wider text-cyan-300 uppercase mb-3 drop-shadow-[0_0_10px_rgba(34,211,238,0.6)]">
            {sectorBanner.title}
          </h2>

          <p className="text-xs text-zinc-300 leading-relaxed bg-black/80 p-3 border border-cyan-950 text-left font-mono">
            {sectorBanner.subtitle}
          </p>
        </div>
      )}

      {/* 3. TOP SYSTEM ALERT BANNER */}
      {osAlertBanner && !isInputLocked && (
        <div className="pointer-events-auto w-full max-w-xl bg-[#0a0505] border-2 border-red-500/90 text-red-300 px-4 py-2.5 rounded-none shadow-[0_0_25px_rgba(239,68,68,0.3)] flex items-center justify-between gap-3 animate-in slide-in-from-top-4 duration-200 font-mono">
          <div className="flex items-center gap-2 text-xs font-bold tracking-wider">
            <span className="text-red-500 animate-ping">⚠️</span>
            <span>{osAlertBanner}</span>
          </div>
          <span className="text-[9px] text-red-400/80 border border-red-800/80 px-1.5 py-0.5 uppercase tracking-widest font-mono">
            SYS_LOCK
          </span>
        </div>
      )}

      {/* 4. CENTER OS DIALOG TOAST */}
      {osToastMessage && !isInputLocked && !sectorBanner && (
        <div className="pointer-events-auto my-auto max-w-md w-full bg-[#050508] border-2 border-amber-500 text-amber-200 p-4 shadow-[0_0_35px_rgba(245,158,11,0.35)] animate-in zoom-in-95 duration-150 font-mono">
          {/* OS WINDOW HEADER */}
          <div className="flex justify-between items-center border-b border-amber-900/60 pb-2 mb-3 bg-amber-950/20 -mx-4 -mt-4 px-4 py-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
              <span className="w-2 h-2 bg-amber-500 animate-pulse"></span>
              [PATCH OS — DISPATCHER LOCK]
            </span>
            <button
              onClick={() => clearOsToast()}
              className="text-[10px] text-amber-500 hover:text-amber-300 font-bold px-1 border border-amber-800"
            >
              [X]
            </button>
          </div>

          {/* OS MESSAGE CONTENT */}
          <div className="text-xs text-amber-100 font-mono leading-relaxed mb-4 space-y-1">
            <p className="font-semibold">{osToastMessage}</p>
            <p className="text-[10px] text-zinc-400">
              Access to this kernel process requires elevated operator permissions.
            </p>
          </div>

          {/* ACKNOWLEDGE BUTTON */}
          <div className="flex justify-end pt-2 border-t border-zinc-900">
            <button
              onClick={() => clearOsToast()}
              className="px-4 py-1 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider transition-colors"
            >
              [ ACKNOWLEDGE ]
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
