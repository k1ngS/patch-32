"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useGameStore } from "@/store/useGameStore";
import { audioEngine } from "@/utils/audioEngine";

const DIAGNOSTIC_STEPS = [
  "PATCH32 INITIALIZING...",
  "Checking Memory Block 32...",
  "System integrity check...",
  "Privilege request detected: Administrator Elevation Required.",
];

export function MainMenu() {
  const setActiveScreen = useGameStore((state) => state.setActiveScreen);
  const initGame = useGameStore((state) => state.initGame);
  const startGame = useGameStore((state) => state.startGame);
  const hasAppliedPatch = useGameStore((state) => state.hasAppliedPatch);

  const [stepIndex, setStepIndex] = useState(0);
  const [isReadyToAuthorize, setIsReadyToAuthorize] = useState(false);

  // Play boot chime on launch
  useEffect(() => {
    audioEngine.playBootChime();
  }, []);

  // Sequential typing of diagnostic steps
  useEffect(() => {
    if (stepIndex < DIAGNOSTIC_STEPS.length) {
      const timer = setTimeout(() => {
        setStepIndex((prev) => prev + 1);
      }, 350);
      return () => clearTimeout(timer);
    } else {
      setIsReadyToAuthorize(true);
    }
  }, [stepIndex]);

  const handleAuthorize = useCallback(() => {
    audioEngine.playUiClick();
    initGame();
    startGame();
    setActiveScreen("game");
  }, [initGame, startGame, setActiveScreen]);

  return (
    <div
      onClick={handleAuthorize}
      className="absolute inset-0 bg-[#030305] flex flex-col items-center justify-center z-50 text-[#e0e0e0] font-mono select-none cursor-pointer p-4"
    >
      {/* WINDOW FRAME (SYSTEM UTILITY STYLE) */}
      <div className="max-w-lg w-full bg-[#0c0d12] border border-zinc-700 shadow-[0_0_40px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col">
        
        {/* UTILITY TITLE BAR */}
        <div className="w-full bg-[#181a24] border-b border-zinc-700 px-3 py-1.5 flex justify-between items-center text-xs text-zinc-300 font-bold select-none">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
            <span>PATCH32 System Diagnostic &amp; Installer v32.0</span>
          </div>
          <div className="text-zinc-500 text-[10px]">PID: 4092</div>
        </div>

        {/* UTILITY BODY */}
        <div className="p-6 flex flex-col space-y-6 bg-[#08090d]">
          
          {/* APPLICATION LOGO / STATUS */}
          <div className="border-b border-zinc-800 pb-4">
            <h1 className="text-3xl font-extrabold text-cyan-400 tracking-[0.2em]">
              PATCH32
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Critical System Update &amp; Diagnostic Utility
            </p>
          </div>

          {/* DIAGNOSTIC CONSOLE LOGS */}
          <div className="bg-[#030407] border border-zinc-800 p-4 font-mono text-xs space-y-2 min-h-[140px] flex flex-col justify-center">
            {DIAGNOSTIC_STEPS.slice(0, stepIndex).map((line, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-cyan-500 font-bold">{">"}</span>
                <span className={idx === DIAGNOSTIC_STEPS.length - 1 ? "text-amber-400 font-bold" : "text-zinc-300"}>
                  {line}
                </span>
              </div>
            ))}
            {!isReadyToAuthorize && (
              <span className="inline-block w-2 h-4 bg-cyan-400 animate-pulse ml-4" />
            )}
          </div>

          {/* PRIVILEGE AUTHORIZATION ACTION */}
          <div className="flex flex-col items-center space-y-3 pt-2">
            <span className="text-[10px] text-zinc-400 uppercase tracking-widest">
              {isReadyToAuthorize ? "User Privilege Elevation Required" : "Checking Administrator Rights..."}
            </span>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAuthorize();
              }}
              disabled={!isReadyToAuthorize}
              className={`w-full py-3 px-6 border text-sm font-bold uppercase tracking-widest transition-all duration-200 flex items-center justify-center gap-3 ${
                isReadyToAuthorize
                  ? "bg-cyan-950/60 hover:bg-cyan-500 hover:text-black border-cyan-400 text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.3)] cursor-pointer"
                  : "bg-zinc-900 border-zinc-700 text-zinc-600 cursor-not-allowed"
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>[ AUTHORIZE ]</span>
            </button>

            {hasAppliedPatch && (
              <div className="text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-500 px-2 py-0.5 rounded font-semibold mt-2">
                SYSTEM STATUS: PATCH APPLIED
              </div>
            )}
          </div>

          {/* FOOTER HINT */}
          <div className="text-[9px] text-zinc-500 text-center tracking-widest pt-2 border-t border-zinc-900">
            Click anywhere or press [AUTHORIZE] to grant temporary privileges
          </div>
        </div>
      </div>
    </div>
  );
}

