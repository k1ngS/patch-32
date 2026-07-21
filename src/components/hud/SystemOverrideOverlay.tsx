"use client";

import React from "react";
import { useGameStore } from "@/store/useGameStore";

export function SystemOverrideOverlay() {
  const isOverrideActive = useGameStore((state) => state.isOverrideActive);
  const isInputLocked = useGameStore((state) => state.isInputLocked);
  const inputLockRemainingMs = useGameStore((state) => state.inputLockRemainingMs);

  const active = isOverrideActive || isInputLocked;
  if (!active) return null;

  const lockSec = (Math.max(0, inputLockRemainingMs) / 1000).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm pointer-events-auto select-none animate-in fade-in duration-200">
      
      {/* SCANLINE SHUTTER OVERLAY */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(239,68,68,0.15)_50%,transparent_50%)] bg-[length:100%_6px] animate-pulse pointer-events-none" />

      {/* EMERGENCY OS DIALOG BOX */}
      <div className="bg-[#0c0d12] border-2 border-red-500/90 p-6 sm:p-8 shadow-[0_0_50px_rgba(239,68,68,0.5)] max-w-xl w-full flex flex-col items-center text-center space-y-5 font-mono relative overflow-hidden">
        
        {/* TOP ALERT HEADER */}
        <div className="flex items-center gap-2 text-red-400 font-bold text-xs sm:text-sm tracking-widest uppercase bg-red-950/70 px-3.5 py-1.5 border border-red-800 shadow-inner">
          <span className="animate-ping">⚠️</span>
          [ System Security Event ]
        </div>

        {/* PRIMARY OVERRIDE TITLE */}
        <h2 className="text-md sm:text-lg font-extrabold text-amber-400 tracking-wider uppercase">
          SYSTEM RECOVERY MODE // LEVEL: PRIORITY ACCESS
        </h2>

        {/* EXACT REQUIRED MESSAGE */}
        <div className="w-full bg-black/90 p-4 border border-red-900/60 text-left space-y-2">
          <p className="text-xs sm:text-sm font-semibold text-red-200 leading-relaxed font-mono">
            Temporary user privileges suspended.
          </p>
          <p className="text-xs sm:text-sm font-semibold text-amber-300 leading-relaxed font-mono">
            Emergency recovery process initiated.
          </p>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest pt-2 border-t border-zinc-900">
            [ EXECUTING SYSTEM_QUARANTINE_PROCEDURE // STANDBY ]
          </p>
        </div>

        {/* KERNEL TAKING CONTROL PROGRESS BAR */}
        <div className="w-full space-y-1.5">
          <div className="flex justify-between items-center text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
            <span>PROTOCOL EXECUTION IN PROGRESS:</span>
            <span className="text-red-400 font-bold text-xs animate-pulse">
              [ {lockSec}s ]
            </span>
          </div>
          <div className="w-full h-2 bg-black border border-red-900 overflow-hidden relative">
            <div className="h-full bg-amber-500 animate-[pulse_0.4s_ease-in-out_infinite] w-full" />
          </div>
        </div>

        {/* FOOTER NOTICE */}
        <p className="text-[10px] text-zinc-500 uppercase tracking-widest pt-1 border-t border-zinc-900 w-full">
          DO NOT ATTEMPT TO FORCE SHUTDOWN // RESTORING PRIVILEGES SHORTLY
        </p>

      </div>
    </div>
  );
}

