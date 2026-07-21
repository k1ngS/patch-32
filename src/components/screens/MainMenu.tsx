"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useGameStore } from "@/store/useGameStore";
import { audioEngine } from "@/utils/audioEngine";

const BOOT_LINES = [
  "Powering on...",
  "POST completed.",
  "Initializing hardware...",
  "Booting PATCH OS...",
];

const AUTH_LINES = [
  "Authenticating...",
  "Loading Kernel...",
  "Applying Patch32...",
];

export function MainMenu() {
  const setActiveScreen = useGameStore((state) => state.setActiveScreen);
  const hasAppliedPatch = useGameStore((state) => state.hasAppliedPatch);

  // Phase: 'boot' -> 'login' -> 'auth'
  const [phase, setPhase] = useState<"boot" | "login" | "auth">("boot");
  const [displayedBootLines, setDisplayedBootLines] = useState<string[]>([]);
  const [displayedAuthLines, setDisplayedAuthLines] = useState<string[]>([]);

  // Play boot chime on menu start
  useEffect(() => {
    audioEngine.playBootChime();
  }, []);

  // Finish boot instantly (skip)
  const skipBoot = useCallback(() => {
    setDisplayedBootLines(BOOT_LINES);
    setPhase("login");
  }, []);

  // Finish auth instantly (skip)
  const skipAuth = useCallback(() => {
    audioEngine.playBootChime();
    setDisplayedAuthLines(AUTH_LINES);
    setActiveScreen("tutorial");
  }, [setActiveScreen]);

  // Global key / mouse skip handler
  useEffect(() => {
    const handleSkip = (e: MouseEvent | KeyboardEvent) => {
      // Don't trigger skip if clicking directly on the Operator button (it will handle its own click)
      if (phase === "boot") {
        skipBoot();
      } else if (phase === "auth") {
        skipAuth();
      }
    };

    window.addEventListener("keydown", handleSkip);
    return () => {
      window.removeEventListener("keydown", handleSkip);
    };
  }, [phase, skipBoot, skipAuth]);

  // Sequential typing for boot lines
  useEffect(() => {
    if (phase !== "boot") return;

    if (displayedBootLines.length < BOOT_LINES.length) {
      const timer = setTimeout(() => {
        setDisplayedBootLines((prev) => [...prev, BOOT_LINES[prev.length]]);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setPhase("login");
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [phase, displayedBootLines]);

  // Sequential typing for auth lines
  useEffect(() => {
    if (phase !== "auth") return;

    if (displayedAuthLines.length < AUTH_LINES.length) {
      const timer = setTimeout(() => {
        setDisplayedAuthLines((prev) => [...prev, AUTH_LINES[prev.length]]);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setActiveScreen("tutorial");
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [phase, displayedAuthLines, setActiveScreen]);

  const handleOperatorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (phase === "login") {
      setPhase("auth");
      setDisplayedAuthLines([AUTH_LINES[0]]);
    }
  };

  const handleContainerClick = () => {
    if (phase === "boot") skipBoot();
    else if (phase === "auth") skipAuth();
  };

  return (
    <div
      onClick={handleContainerClick}
      className="absolute inset-0 bg-[#030305] flex flex-col items-center justify-center z-50 text-[#e0e0e0] font-mono select-none cursor-pointer p-6"
    >
      <div className="max-w-md w-full flex flex-col items-start justify-center space-y-6 bg-black/60 p-8 border border-zinc-900 shadow-2xl relative">
        
        {/* SKIP HINT */}
        <div className="absolute top-2 right-3 text-[9px] text-zinc-600 uppercase tracking-widest pointer-events-none">
          [Click / Press any key to skip]
        </div>

        {/* 1. BOOT SEQUENCE */}
        {phase === "boot" && (
          <div className="w-full space-y-2 text-sm text-cyan-400/90 font-mono">
            {displayedBootLines.map((line, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-zinc-600 text-xs">{">"}</span>
                <span>{line}</span>
              </div>
            ))}
            {displayedBootLines.length < BOOT_LINES.length && (
              <span className="inline-block w-2 h-4 bg-cyan-400 animate-pulse ml-4" />
            )}
          </div>
        )}

        {/* 2. LOGIN SCREEN */}
        {(phase === "login" || phase === "auth") && (
          <div className="w-full flex flex-col items-center text-center space-y-8 animate-in fade-in duration-300">
            {/* LOGO */}
            <div className="space-y-2">
              <h1 className="text-5xl font-bold text-cyan-400 tracking-[0.25em] drop-shadow-[0_0_20px_rgba(34,211,238,0.5)]">
                PATCH32
              </h1>
              <p className="text-zinc-500 text-[10px] uppercase tracking-widest">
                Kernel System Containment Apparatus
              </p>
            </div>

            {/* OPERATOR LOGIN USER */}
            {phase === "login" && (
              <div className="flex flex-col items-center space-y-4 pt-4 w-full">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest">
                  Select Profile to Authorize
                </span>

                <button
                  onClick={handleOperatorClick}
                  className="w-full max-w-xs px-6 py-3 bg-cyan-950/40 hover:bg-cyan-500 hover:text-black border border-cyan-500/80 text-cyan-300 font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-between group shadow-[0_0_15px_rgba(34,211,238,0.15)]"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 group-hover:bg-black transition-colors" />
                    Operator
                  </span>
                  {hasAppliedPatch && (
                    <span className="text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-500 px-1.5 py-0.5 rounded group-hover:bg-emerald-400 group-hover:text-black font-semibold">
                      PATCH APPLIED
                    </span>
                  )}
                </button>
              </div>
            )}

            {/* 3. AUTHENTICATING SEQUENCE */}
            {phase === "auth" && (
              <div className="w-full space-y-2 text-xs text-amber-400 text-left bg-black p-4 border border-amber-900/40 font-mono">
                {displayedAuthLines.map((line, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-amber-600">{">"}</span>
                    <span>{line}</span>
                  </div>
                ))}
                {displayedAuthLines.length < AUTH_LINES.length && (
                  <span className="inline-block w-2 h-3 bg-amber-400 animate-pulse ml-4" />
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
