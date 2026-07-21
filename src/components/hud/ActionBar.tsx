"use client";

import React, { useState, useEffect } from "react";
import { OVERCLOCK_CONFIGS, UPGRADE_CONFIGS } from "@/constants/gameConfig";
import { useGameStore } from "@/store/useGameStore";
import { powerBusConsumer } from "@/runtime/consumers/PowerBusConsumer";
import type { UpgradeId } from "@/types/game";

export function ActionBar() {
  const core = useGameStore((state) => state.core);
  const score = useGameStore((state) => state.score);
  const upgrades = useGameStore((state) => state.upgrades);
  const purchaseUpgrade = useGameStore((state) => state.purchaseUpgrade);
  const setOverclockPressed = useGameStore((state) => state.setOverclockPressed);

  const [injectingMap, setInjectingMap] = useState<Record<string, boolean>>({});
  const [, setPowerBusState] = useState(0);

  useEffect(() => {
    return powerBusConsumer.subscribe(() => {
      setPowerBusState((prev) => prev + 1);
    });
  }, []);

  const ocUpgrade = upgrades.get("core_overclock");
  const isOcUnlocked = ocUpgrade ? ocUpgrade.level > 0 : false;
  const isOcReady = isOcUnlocked && core.overclockCooldownMs <= 0 && !core.overclockActive;
  const ocProgress = isOcUnlocked
    ? core.overclockActive
      ? (core.overclockDurationMs / OVERCLOCK_CONFIGS[ocUpgrade!.level].duration) * 100
      : 100 - (core.overclockCooldownMs / OVERCLOCK_CONFIGS[ocUpgrade!.level].cd) * 100
    : 0;

  const handlePurchase = (id: UpgradeId) => {
    setInjectingMap((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => {
      purchaseUpgrade(id);
      setInjectingMap((prev) => ({ ...prev, [id]: false }));
    }, 200);
  };

  return (
    <footer className="w-full flex flex-col sm:flex-row items-stretch gap-1.5 bg-[#030305] border-t border-zinc-900 px-2 py-1 font-mono text-xs select-none shrink-0">
      {/* OVERCLOCK ACTION BUTTON */}
      <button
        disabled={!isOcReady}
        onClick={() => setOverclockPressed()}
        className={`relative overflow-hidden flex items-center justify-center px-3 py-1 border font-bold uppercase tracking-wider transition-colors shrink-0 rounded-none text-[10px] ${
          !isOcUnlocked
            ? "bg-black border-zinc-900 text-zinc-700 cursor-not-allowed"
            : core.overclockActive
              ? "bg-amber-900/30 border-amber-500 text-amber-400 animate-pulse"
              : isOcReady
                ? "bg-amber-500 hover:bg-amber-400 border-amber-400 text-black"
                : "bg-black border-zinc-900 text-amber-700/60 cursor-not-allowed"
        }`}
      >
        {isOcUnlocked && (!isOcReady || core.overclockActive) && (
          <div
            className="absolute left-0 bottom-0 h-1 bg-amber-500 transition-all duration-100"
            style={{ width: `${Math.min(100, Math.max(0, ocProgress))}%` }}
          />
        )}
        <span className="z-10 text-[11px] whitespace-nowrap">
          {!isOcUnlocked && "OVERCLOCK [LOCKED]"}
          {core.overclockActive && "⚡ ACTIVE"}
          {isOcUnlocked && !core.overclockActive && !isOcReady && "COOLING DOWN"}
          {isOcReady && "⚡ OVERCLOCK [E]"}
        </span>
      </button>

      {/* UPGRADES HOTBAR GRID */}
      <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-1 overflow-x-auto custom-scrollbar">
        {UPGRADE_CONFIGS.map((config) => {
          const upg = upgrades.get(config.id);
          if (!upg) return null;

          const isMax = upg.level >= upg.maxLevel;
          const cost = isMax ? null : config.costs[upg.level];
          const canAfford = !isMax && score.currency >= (cost || 0);
          const isInjecting = injectingMap[config.id];

          let shortLabel = "";
          if (config.id === "drone_speed") shortLabel = "Drone Spd";
          else if (config.id === "cable_length") shortLabel = "Beam Ext";
          else if (config.id === "purge_radius") shortLabel = "Cascade";
          else if (config.id === "core_overclock") shortLabel = "Overclock";
          else if (config.id === "overclock_dampener") shortLabel = "Heat Sink";
          else if (config.id === "bit_scavenger") shortLabel = "Scavenger";
          else if (config.id === "shield_buffer") shortLabel = "Capacitor";
          else if (config.id === "targeting_subroutines") shortLabel = "Targeting";

          return (
            <button
              key={config.id}
              disabled={isMax || !canAfford || isInjecting}
              onClick={() => handlePurchase(config.id)}
              className={`flex flex-col justify-between p-1.5 rounded-none border text-left transition-colors relative min-w-[70px] ${
                isInjecting
                  ? "bg-cyan-900/30 border-cyan-500 text-cyan-200"
                  : isMax
                    ? "bg-black border-zinc-900 text-zinc-700 cursor-not-allowed opacity-80"
                    : canAfford
                      ? "bg-[#020202] hover:bg-zinc-900 border-zinc-800 hover:border-cyan-500 text-zinc-300"
                      : "bg-black border-zinc-900 text-zinc-700 cursor-not-allowed"
              }`}
            >
              <div className="flex justify-between items-center w-full text-[9px] mb-0.5">
                <span className="font-semibold truncate pr-1 text-zinc-400">{shortLabel}</span>
                <span className="text-cyan-500 font-bold text-[8px] bg-black px-1 border border-zinc-900">
                  L{upg.level}
                </span>
              </div>
              <div className="text-[9px] font-bold">
                {isInjecting ? (
                  <span className="text-cyan-400">...</span>
                ) : isMax ? (
                  <span className="text-zinc-700">MAX</span>
                ) : (
                  <span className={canAfford ? "text-amber-500" : "text-zinc-700"}>
                    ₿ {cost}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </footer>
  );
}
