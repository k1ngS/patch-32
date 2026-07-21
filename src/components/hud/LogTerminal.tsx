"use client";

import React, { useState, useEffect } from "react";
import { consoleConsumer, type LogEntry } from "@/runtime/consumers/ConsoleConsumer";

function formatTime(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export function LogTerminal() {
  const [logs, setLogs] = useState<LogEntry[]>(consoleConsumer.getLogs());

  useEffect(() => {
    return consoleConsumer.subscribe(() => {
      setLogs([...consoleConsumer.getLogs()]);
    });
  }, []);

  return (
    <div className="flex flex-col h-full bg-transparent p-2 font-mono text-[10px] select-none overflow-hidden">
      <div className="flex-1 overflow-y-auto flex flex-col-reverse custom-scrollbar space-y-1 space-y-reverse">
        {logs.slice().reverse().map((log) => {
          let typeCol = "text-zinc-500";
          if (log.type === "PURGE") typeCol = "text-cyan-400 font-bold";
          else if (log.type === "CHAIN") typeCol = "text-amber-400 font-bold";
          else if (log.type === "PATCH") typeCol = "text-emerald-400 font-bold";
          else if (log.type === "BREACH" || log.type === "HALT") typeCol = "text-red-400 font-bold";
          else if (log.type === "INFO") typeCol = "text-zinc-600";

          return (
            <div
              key={log.id}
              className="leading-tight break-words border-l-2 border-zinc-900 hover:border-cyan-500/40 pl-1.5 py-0.5 animate-in fade-in slide-in-from-bottom-1 duration-200 ease-out transition-all"
            >
              <span className="text-zinc-600 font-mono">[{formatTime(log.timeMs)}]</span>{" "}
              <span className={`${typeCol}`}>{log.type}</span>{" "}
              <span className="text-zinc-300">// {log.message}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
