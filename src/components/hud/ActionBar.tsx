"use client";

import React, { useState, useEffect } from "react";
import { OVERCLOCK_CONFIGS, UPGRADE_CONFIGS } from "@/constants/gameConfig";
import { useGameStore } from "@/store/useGameStore";
import { powerBusConsumer } from "@/runtime/consumers/PowerBusConsumer";
import type { UpgradeId } from "@/types/game";

export interface ProcessUpgradeDetails {
  shortLabel: string;
  fullName: string;
  tag: string;
  description: string;
}

export const PROCESS_UPGRADE_DETAILS: Record<UpgradeId, ProcessUpgradeDetails> = {
  drone_speed: {
    shortLabel: "Proc Priority",
    fullName: "Process Priority Boost",
    tag: "KERNEL_SCHEDULER // THREAD_PRIORITY",
    description: "Allocates higher CPU execution priority to the defense drone, increasing sweep velocity across grid sectors.",
  },
  cable_length: {
    shortLabel: "Net Reach",
    fullName: "Network Reach Extension",
    tag: "NET_BUS // REACH_EXPANSION",
    description: "Extends maximum signal range of emitter auto-purge cables across grid sectors.",
  },
  purge_radius: {
    shortLabel: "Quarantine",
    fullName: "Quarantine Radius",
    tag: "QUARANTINE // CASCADE_AREA",
    description: "Expands purge explosion radius, triggering wider chain reaction purges on corrupted data blocks.",
  },
  core_overclock: {
    shortLabel: "Kernel OC",
    fullName: "Kernel Overclock",
    tag: "POWER_BUS // OVERDRIVE_SUBROUTINE",
    description: "Unlocks emergency Overclock [E] mode, boosting emitter reload rates and deploying firewall shields.",
  },
  overclock_dampener: {
    shortLabel: "Thermal Comp",
    fullName: "Thermal Compensator",
    tag: "THERMAL // HEAT_DISSIPATION",
    description: "Installs heat dissipation sinks that cut Overclock thermal throttle duration in half (4.0s → 2.0s).",
  },
  bit_scavenger: {
    shortLabel: "Mem Cleaner",
    fullName: "Memory Cleaner",
    tag: "GARBAGE_COLLECTOR // MEM_RECOVERY",
    description: "Defragments freed memory pages during purges, giving a chance to recover double Bits on chain reactions.",
  },
  shield_buffer: {
    shortLabel: "Firewall",
    fullName: "Firewall Buffer",
    tag: "SECURITY_WALL // OVERSHIELD_CAPACITOR",
    description: "Strengthens firewall overshields gained from border purges (+40 HP shield capacity per tier).",
  },
  targeting_subroutines: {
    shortLabel: "Heuristics",
    fullName: "Behavior Analysis Heuristics",
    tag: "HEURISTICS // TARGET_PRIORITY",
    description: "Enhances Emitter auto-target AI (L1 prioritizes Spyware; L2 prioritizes Rootkits).",
  },
};

export function ActionBar() {
  const core = useGameStore((state) => state.core);
  const score = useGameStore((state) => state.score);
  const upgrades = useGameStore((state) => state.upgrades);
  const purchaseUpgrade = useGameStore((state) => state.purchaseUpgrade);
  const setOverclockPressed = useGameStore((state) => state.setOverclockPressed);
  const isPrivilegeSuspended = useGameStore((state) => state.isPrivilegeSuspended);
  const showOsToast = useGameStore((state) => state.showOsToast);

  const [injectingMap, setInjectingMap] = useState<Record<string, boolean>>({});
  const [, setPowerBusState] = useState(0);
  const [hoveredUpgradeId, setHoveredUpgradeId] = useState<UpgradeId | "overclock" | null>(null);

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

  const handleOverclockClick = () => {
    if (isPrivilegeSuspended) {
      showOsToast("This process is currently locked by the operating system.");
      return;
    }
    if (isOcReady) {
      setOverclockPressed();
    }
  };

  // Build active hover info
  let activeHoverInfo: {
    fullName: string;
    tag: string;
    description: string;
    levelText: string;
    costText: string;
    canAfford: boolean;
  } | null = null;

  if (hoveredUpgradeId === "overclock") {
    activeHoverInfo = {
      fullName: "Kernel Overclock [E]",
      tag: "POWER_BUS // MANUAL_OVERDRIVE",
      description: isPrivilegeSuspended
        ? "OVERRIDE SUSPENDED BY OPERATING SYSTEM. Privilege restoration in progress."
        : !isOcUnlocked
          ? "Process locked. Unlock Tier 1 Kernel Overclock from the process matrix to enable emergency overdrive."
          : core.overclockActive
            ? "Overclock currently engaged! Emitters reloading at 2x rate with active firewall shields."
            : !isOcReady
              ? "Thermal throttle cooling down. Wait for heat dissipation before re-engaging."
              : "Press [E] or click to trigger emergency Overclock, granting immediate firewall shield and 2x emitter reload speed.",
      levelText: ocUpgrade ? `L${ocUpgrade.level}` : "LOCKED",
      costText: isOcReady ? "READY [E]" : "COOLDOWN",
      canAfford: isOcReady,
    };
  } else if (hoveredUpgradeId) {
    const details = PROCESS_UPGRADE_DETAILS[hoveredUpgradeId];
    const upg = upgrades.get(hoveredUpgradeId);
    const config = UPGRADE_CONFIGS.find((c) => c.id === hoveredUpgradeId);

    if (details && upg && config) {
      const isMax = upg.level >= upg.maxLevel;
      const cost = isMax ? null : config.costs[upg.level];
      const canAfford = !isMax && score.currency >= (cost || 0);

      activeHoverInfo = {
        fullName: details.fullName,
        tag: details.tag,
        description: details.description,
        levelText: isMax ? `L${upg.level} (MAX)` : `L${upg.level} / L${upg.maxLevel}`,
        costText: isMax ? "MAX LEVEL" : `₿ ${cost} Bits`,
        canAfford,
      };
    }
  }

  return (
    <footer className="w-full flex flex-col sm:flex-row items-stretch gap-1.5 bg-[#030305] border-t border-zinc-900 px-2 py-1 font-mono text-xs select-none shrink-0 relative">
      
      {/* DIEGETIC PROCESS INSPECTOR TOOLTIP */}
      {activeHoverInfo && (
        <div className="absolute bottom-full left-2 mb-2 max-w-md w-full bg-[#050508] border-2 border-cyan-500/80 p-3 shadow-[0_0_30px_rgba(34,211,238,0.3)] text-xs font-mono z-50 pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex justify-between items-center border-b border-cyan-950 pb-1.5 mb-2">
            <span className="font-bold text-cyan-400 text-xs flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-cyan-400 animate-pulse" />
              {activeHoverInfo.fullName}
            </span>
            <span className="text-[9px] bg-black text-cyan-400 border border-cyan-900 px-1.5 py-0.5 font-bold">
              {activeHoverInfo.levelText}
            </span>
          </div>

          <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mb-1.5">
            [{activeHoverInfo.tag}]
          </div>

          <p className="text-[11px] text-zinc-300 leading-snug mb-2.5">
            {activeHoverInfo.description}
          </p>

          <div className="flex justify-between items-center text-[10px] pt-1.5 border-t border-zinc-900">
            <span className="text-zinc-500 uppercase tracking-widest text-[9px]">Upgrade Cost:</span>
            <span className={activeHoverInfo.canAfford ? "text-amber-400 font-bold text-xs" : "text-zinc-600 font-bold text-xs"}>
              {activeHoverInfo.costText}
            </span>
          </div>
        </div>
      )}

      {/* OVERCLOCK ACTION BUTTON */}
      <button
        disabled={!isOcReady && !isPrivilegeSuspended}
        onClick={handleOverclockClick}
        onMouseEnter={() => setHoveredUpgradeId("overclock")}
        onMouseLeave={() => setHoveredUpgradeId(null)}
        className={`relative overflow-hidden flex items-center justify-center px-3 py-1 border font-bold uppercase tracking-wider transition-colors shrink-0 rounded-none text-[10px] ${
          isPrivilegeSuspended
            ? "bg-red-950/40 border-red-500 text-red-400 cursor-pointer animate-pulse"
            : !isOcUnlocked
              ? "bg-black border-zinc-900 text-zinc-700 cursor-not-allowed"
              : core.overclockActive
                ? "bg-amber-900/30 border-amber-500 text-amber-400 animate-pulse"
                : isOcReady
                  ? "bg-amber-500 hover:bg-amber-400 border-amber-400 text-black cursor-pointer"
                  : "bg-black border-zinc-900 text-amber-700/60 cursor-not-allowed"
        }`}
      >
        {isOcUnlocked && (!isOcReady || core.overclockActive) && !isPrivilegeSuspended && (
          <div
            className="absolute left-0 bottom-0 h-1 bg-amber-500 transition-all duration-100"
            style={{ width: `${Math.min(100, Math.max(0, ocProgress))}%` }}
          />
        )}
        <span className="z-10 text-[11px] whitespace-nowrap">
          {isPrivilegeSuspended && "⚠️ KERNEL OC [LOCKED BY OS]"}
          {!isPrivilegeSuspended && !isOcUnlocked && "KERNEL OC [LOCKED]"}
          {!isPrivilegeSuspended && core.overclockActive && "⚡ ACTIVE"}
          {!isPrivilegeSuspended && isOcUnlocked && !core.overclockActive && !isOcReady && "COOLING DOWN"}
          {!isPrivilegeSuspended && isOcReady && "⚡ KERNEL OC [E]"}
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
          const details = PROCESS_UPGRADE_DETAILS[config.id];

          return (
            <button
              key={config.id}
              disabled={isMax || !canAfford || isInjecting}
              onClick={() => handlePurchase(config.id)}
              onMouseEnter={() => setHoveredUpgradeId(config.id)}
              onMouseLeave={() => setHoveredUpgradeId(null)}
              className={`flex flex-col justify-between p-1.5 rounded-none border text-left transition-colors relative min-w-[70px] ${
                isInjecting
                  ? "bg-cyan-900/30 border-cyan-500 text-cyan-200"
                  : isMax
                    ? "bg-black border-zinc-900 text-zinc-700 cursor-not-allowed opacity-80"
                    : canAfford
                      ? "bg-[#020202] hover:bg-zinc-900 border-zinc-800 hover:border-cyan-500 text-zinc-300 cursor-pointer"
                      : "bg-black border-zinc-900 text-zinc-700 cursor-not-allowed"
              }`}
            >
              <div className="flex justify-between items-center w-full text-[9px] mb-0.5">
                <span className="font-semibold truncate pr-1 text-zinc-400">{details.shortLabel}</span>
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
