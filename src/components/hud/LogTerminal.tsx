"use client";

import React from "react";
import { useGameStore } from "@/store/useGameStore";

function formatTime(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export function LogTerminal() {
  const logs = useGameStore((state) => state.logs);

  return (
    <div className="flex flex-col h-full bg-[#0a0a10]/80 border border-zinc-800/80 rounded-lg p-2 font-mono text-[10px] select-none overflow-hidden">
      <span className="text-zinc-500 uppercase tracking-widest text-[9px] mb-1 font-semibold border-b border-zinc-900 pb-0.5">
        System Logs
      </span>
      <div className="flex-1 overflow-y-auto flex flex-col-reverse custom-scrollbar space-y-1 space-y-reverse pt-1">
        {logs.slice().reverse().map((log) => {
          let typeCol = "text-zinc-400";
          if (log.type === "PURGE") typeCol = "text-cyan-400";
          else if (log.type === "CHAIN") typeCol = "text-amber-400";
          else if (log.type === "PATCH") typeCol = "text-green-400";
          else if (log.type === "BREACH" || log.type === "HALT") typeCol = "text-red-500";

          return (
            <div key={log.id} className="leading-tight break-words">
              <span className="text-zinc-600">[{formatTime(log.timeMs)}]</span>{" "}
              <span className={`${typeCol} font-bold`}>{log.type}</span>{" "}
              <span className="text-zinc-400">// {log.message}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
