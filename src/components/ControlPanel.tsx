import React, { useState, useEffect } from "react";
import {
  CORE_MAX_HEALTH,
  OVERCLOCK_CONFIGS,
  UPGRADE_CONFIGS,
} from "@/constants/gameConfig";
import { useGameStore } from "@/store/useGameStore";
import type { UpgradeId } from "@/types/game";

// Helper for formatting mm:ss
function formatTime(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export function ControlPanel() {
  const phase = useGameStore((state) => state.phase);
  const score = useGameStore((state) => state.score);
  const core = useGameStore((state) => state.core);
  const remainingMs = useGameStore((state) => state.remainingMs);
  const upgrades = useGameStore((state) => state.upgrades);
  const logs = useGameStore((state) => state.logs);
  const runId = useGameStore((state) => state.runId);

  const purchaseUpgrade = useGameStore((state) => state.purchaseUpgrade);
  const setOverclockPressed = useGameStore(
    (state) => state.setOverclockPressed,
  );

  const [injectingMap, setInjectingMap] = useState<Record<string, boolean>>({});

  // Cycle dots for injecting animation
  const [dots, setDots] = useState("");
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 80);
    return () => clearInterval(interval);
  }, []);

  const healthPercentage = (core.health / CORE_MAX_HEALTH) * 100;

  // Find current Overclock Level to know if it's unlocked and its cooldown
  const ocUpgrade = upgrades.get("core_overclock");
  const isOcUnlocked = ocUpgrade ? ocUpgrade.level > 0 : false;
  const isOcReady =
    isOcUnlocked && core.overclockCooldownMs <= 0 && !core.overclockActive;
  const ocProgress = isOcUnlocked
    ? core.overclockActive
      ? (core.overclockDurationMs /
          OVERCLOCK_CONFIGS[ocUpgrade!.level].duration) *
        100
      : 100 -
        (core.overclockCooldownMs / OVERCLOCK_CONFIGS[ocUpgrade!.level].cd) * 100
    : 0;

  const handlePurchase = (id: UpgradeId) => {
    setInjectingMap((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => {
      purchaseUpgrade(id);
      setInjectingMap((prev) => ({ ...prev, [id]: false }));
    }, 200);
  };

  const totalUpgrades = Array.from(upgrades.values()).reduce(
    (sum, upg) => sum + upg.level,
    0
  );

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const kernelVersion = `KERNEL v0.${totalUpgrades}.${phase.toUpperCase()}.${mounted ? runId : "000000"}`;

  return (
    <div className="flex flex-col w-[320px] h-full bg-[#09090c] border-l border-zinc-800 text-zinc-300 font-mono text-sm overflow-y-auto p-4 custom-scrollbar">
      {/* ── HEADER: STATUS & PHASE ── */}
      <div className="mb-6">
        <h1 className="text-md font-bold text-cyan-400 tracking-wider border-b border-zinc-800 pb-2 mb-2 break-words">
          {kernelVersion}
        </h1>
        <div className="flex justify-between items-center bg-zinc-900/50 p-2 border border-zinc-800 rounded">
          <span className="text-zinc-500 uppercase text-xs">Sys. Phase:</span>
          <span className="text-cyan-300 uppercase font-bold text-xs tracking-widest animate-pulse">
            {phase}
          </span>
        </div>
        <p className="mt-2 text-[10px] text-zinc-500 italic">
          {phase === "boot" && "> Awaiting sequence..."}
          {phase === "ready" && "> Initializing core bounds..."}
          {phase === "playing" && "> Link established. Defend the core."}
          {phase === "gameover" && "> Critical failure. Core breached."}
          {phase === "victory" && "> Protocol complete. Sector secure."}
        </p>
      </div>

      {/* ── TELEMETRY ── */}
      <div className="space-y-4 mb-6">
        {/* Timer */}
        <div className="flex justify-between items-center">
          <span className="text-zinc-500 uppercase text-xs">
            Time Remaining
          </span>
          <span className="text-lg font-bold text-zinc-100">
            {formatTime(remainingMs)}
          </span>
        </div>

        {/* Core Health Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500 uppercase">Core Integrity</span>
            <span className="text-cyan-400 font-bold">
              {Math.ceil(core.health)} / {CORE_MAX_HEALTH}
            </span>
          </div>
          <div className="w-full h-2 bg-zinc-900 border border-zinc-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${core.overclockActive ? "bg-amber-400" : "bg-cyan-500"}`}
              style={{
                width: `${Math.max(0, Math.min(100, healthPercentage))}%`,
              }}
            />
          </div>
          {core.shieldPoints > 0 && (
            <div className="text-[10px] text-amber-400 text-right uppercase">
              + {Math.ceil(core.shieldPoints)} Shield Buffer Active
            </div>
          )}
        </div>

        {/* Score & Economy */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <div className="bg-zinc-900 border border-zinc-800 p-2 rounded flex flex-col">
            <span className="text-zinc-500 text-[10px] uppercase">
              Op Score
            </span>
            <span className="text-cyan-300 font-bold">
              {Math.floor(score.total).toLocaleString()}
            </span>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-2 rounded flex flex-col">
            <span className="text-zinc-500 text-[10px] uppercase">
              Link Chain
            </span>
            <span className="text-cyan-300 font-bold">
              x{score.multiplier.toFixed(2)}
            </span>
          </div>
          <div className="col-span-2 bg-zinc-900 border border-zinc-800 p-2 rounded flex flex-col">
            <span className="text-zinc-500 text-[10px] uppercase">
              Available Bits
            </span>
            <span className="text-amber-500 font-bold text-lg flex items-center gap-2">
              <span className="text-xl">₿</span> {score.currency}
            </span>
          </div>
        </div>
      </div>

      {/* ── OVERCLOCK BUTTON ── */}
      <div className="mb-6">
        <button
          disabled={!isOcReady}
          onClick={() => setOverclockPressed()}
          className={`w-full relative overflow-hidden flex flex-col items-center justify-center py-3 border font-bold uppercase tracking-wider transition-colors
            ${
              !isOcUnlocked
                ? "bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed"
                : core.overclockActive
                  ? "bg-amber-500/20 border-amber-500 text-amber-400"
                  : isOcReady
                    ? "bg-amber-500 hover:bg-amber-400 border-amber-400 text-zinc-900 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                    : "bg-zinc-900 border-zinc-800 text-amber-700 cursor-not-allowed"
            }`}
        >
          {/* Cooldown / Duration background fill */}
          {isOcUnlocked && (!isOcReady || core.overclockActive) && (
            <div
              className="absolute left-0 bottom-0 h-1 bg-amber-500 transition-all duration-100"
              style={{ width: `${Math.min(100, Math.max(0, ocProgress))}%` }}
            />
          )}
          <span className="z-10 flex items-center gap-2">
            {!isOcUnlocked && "OVERCLOCK [LOCKED]"}
            {core.overclockActive && "OVERCLOCK ENGAGED"}
            {isOcUnlocked &&
              !core.overclockActive &&
              !isOcReady &&
              "COOLING DOWN"}
            {isOcReady && "⚡ INJECT OVERCLOCK [E]"}
          </span>
        </button>
      </div>

      {/* ── UPGRADE MATRIX ── */}
      <div className="mb-6 flex-grow">
        <h2 className="text-xs uppercase text-zinc-500 font-bold tracking-widest mb-3 border-b border-zinc-800 pb-1">
          Upgrade Matrix
        </h2>
        <div className="space-y-3">
          {UPGRADE_CONFIGS.map((config) => {
            const upg = upgrades.get(config.id);
            if (!upg) return null;

            const isMax = upg.level >= upg.maxLevel;
            const cost = isMax ? null : config.costs[upg.level];
            const canAfford = !isMax && score.currency >= (cost || 0);
            const isInjecting = injectingMap[config.id];

            let label = "";
            let desc = "";
            if (config.id === "drone_speed") {
              label = "Drone Thrusters";
              desc = "Increases drone traversal speed.";
            } else if (config.id === "cable_length") {
              label = "Beam Extension";
              desc = "Extends maximum linking distance.";
            } else if (config.id === "purge_radius") {
              label = "Cascade Frequency";
              desc = "Expands chain reaction blast radius.";
            } else if (config.id === "core_overclock") {
              label = "Core Overclock";
              desc = "Unlocks & upgrades manual emergency shield.";
            }

            return (
              <div
                key={config.id}
                className="bg-zinc-900/40 border border-zinc-800 p-2 rounded relative"
              >
                {isInjecting && (
                  <div className="absolute inset-0 bg-[rgba(88,224,216,0.20)] pointer-events-none rounded" />
                )}
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-zinc-200 text-sm">
                    {label}
                  </span>
                  <span className="text-xs text-cyan-500 font-bold bg-cyan-900/30 px-1 rounded">
                    Lvl {upg.level}/{upg.maxLevel}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500 mb-2">{desc}</p>
                <button
                  disabled={isMax || !canAfford || isInjecting}
                  onClick={() => handlePurchase(config.id)}
                  className={`w-full py-1 text-xs font-bold uppercase transition-colors flex justify-center items-center gap-1
                    ${
                      isInjecting 
                        ? "bg-cyan-900 text-cyan-100 border border-cyan-400"
                        : isMax
                          ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                          : canAfford
                            ? "bg-cyan-900/50 hover:bg-cyan-800 text-cyan-300 border border-cyan-800 hover:border-cyan-400"
                            : "bg-zinc-900 text-red-500/70 border border-red-900/50 cursor-not-allowed"
                    }`}
                >
                  {isInjecting ? (
                    `> INJECTING${dots.padEnd(3, '\u00A0')}`
                  ) : isMax ? (
                    "MAXIMUM LEVEL"
                  ) : (
                    <>
                      <span>Upgrade </span>
                      <span className="text-amber-500 ml-1 flex items-center">
                        ₿ {cost}
                      </span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── SYSTEM LOGS TERMINAL ── */}
      <div className="mt-auto flex flex-col">
        <h2 className="text-[10px] uppercase text-zinc-600 font-bold tracking-widest mb-2">
          System Logs
        </h2>
        <div className="bg-[#050508] border border-zinc-800 p-2 rounded font-mono text-[10px] h-[100px] overflow-y-auto flex flex-col-reverse custom-scrollbar space-y-1 space-y-reverse">
          {logs.slice().reverse().map((log) => {
            let typeCol = "text-zinc-400";
            if (log.type === "PURGE") typeCol = "text-cyan-400";
            else if (log.type === "CHAIN") typeCol = "text-amber-400";
            else if (log.type === "PATCH") typeCol = "text-green-400";
            else if (log.type === "BREACH" || log.type === "HALT") typeCol = "text-red-500";

            return (
              <div key={log.id} className="leading-tight">
                <span className="text-zinc-600">[{formatTime(log.timeMs)}]</span>{" "}
                <span className={`${typeCol} font-bold`}>{log.type}</span>{" "}
                <span className="text-zinc-400">// {log.message}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
