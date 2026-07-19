"use client";

import { ControlPanel } from "@/components/ControlPanel";
import GridCanvas from "@/components/GridCanvas";

export default function Home() {
  return (
    <main className="min-h-screen w-full flex flex-col lg:flex-row bg-[#050508] text-[#e0e0e0] p-4 lg:p-8 gap-6 justify-center items-center lg:items-stretch select-none">
      {/* ESQUERDA: O GRID CANVAS 32x32 */}
      <section className="flex-1 max-w-[512px] aspect-square bg-[#0a0a10] border border-zinc-800/80 rounded-xl flex items-center justify-center p-2 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] bg-[size:16px_16px] opacity-20 pointer-events-none"></div>
        <GridCanvas />
      </section>

      {/* DIREITA: O TERMINAL DE UPGRADES E METRICAS */}
      <section className="w-full lg:w-80 shrink-0 flex">
        <ControlPanel />
      </section>
    </main>
  );
}
