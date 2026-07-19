import React from "react";
import {
  CORE_MAX_HEALTH,
  NEIGHBOR_BONUS_POINTS,
  OVERCLOCK_CONFIGS,
  SYNTHETIC_NEIGHBORS,
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
  const syntheticNeighborIndex = useGameStore(
    (state) => state.syntheticNeighborIndex,
  );

  const purchaseUpgrade = useGameStore((state) => state.purchaseUpgrade);
  const setOverclockPressed = useGameStore(
    (state) => state.setOverclockPressed,
  );

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
    purchaseUpgrade(id);
  };

  return (
    <div className="flex flex-col w-[320px] h-full bg-[#09090c] border-l border-zinc-800 text-zinc-300 font-mono text-sm overflow-y-auto p-4 custom-scrollbar">
      {/* ── HEADER: STATUS & PHASE ── */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-cyan-400 tracking-wider border-b border-zinc-800 pb-2 mb-2">
          THE COMMAND LEDGER
        </h1>
        <div className="flex justify-between items-center bg-zinc-900/50 p-2 border border-zinc-800 rounded">
          <span className="text-zinc-500 uppercase text-xs">Sys. Phase:</span>
          <span className="text-cyan-300 uppercase font-bold text-xs tracking-widest animate-pulse">
            {phase}
          </span>
        </div>
        <p className="mt-2 text-xs text-zinc-500 italic">
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

            // Display labels mapped
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
                className="bg-zinc-900/40 border border-zinc-800 p-2 rounded"
              >
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
                  disabled={isMax || !canAfford}
                  onClick={() => handlePurchase(config.id)}
                  className={`w-full py-1 text-xs font-bold uppercase transition-colors flex justify-center items-center gap-1
                    ${
                      isMax
                        ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                        : canAfford
                          ? "bg-cyan-900/50 hover:bg-cyan-800 text-cyan-300 border border-cyan-800 hover:border-cyan-400"
                          : "bg-zinc-900 text-red-500/70 border border-red-900/50 cursor-not-allowed"
                    }`}
                >
                  {isMax ? (
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

      {/* ── NEIGHBOR TELEMETRY ── */}
      <div className="mt-auto">
        <h2 className="text-[10px] uppercase text-zinc-600 font-bold tracking-widest mb-2">
          Membrane Telemetry
        </h2>
        <div className="bg-[#050508] border border-zinc-800 p-3 rounded font-mono text-[10px] space-y-1">
          <p className="text-zinc-500">Scanning peripheral sectors...</p>
          <p className="text-cyan-500 animate-pulse">
            {">"} LINK ESTABLISHED WITH EXTERNAL REALITY:{" "}
            <span className="text-amber-400 font-bold">
              {SYNTHETIC_NEIGHBORS[syntheticNeighborIndex]}
            </span>
          </p>
          <p className="text-zinc-600 mt-2">
            Active Pacts:{" "}
            <span className="text-zinc-300">
              {Math.floor(score.neighborBonuses / NEIGHBOR_BONUS_POINTS)}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
