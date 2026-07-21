export const COL = {
  bg: "#020204",
  gridLine: "rgba(255, 255, 255, 0.04)",
  gridDot: "rgba(0, 229, 255, 0.15)",
  nodeClean: "rgba(15, 23, 42, 0.2)",
  nodeUnstable: "#d4a017",
  nodeUnstableGlow: "rgba(212, 160, 23, 0.3)",
  nodeCorrupted: "#cc2233",
  nodeCorruptedGlow: "rgba(204, 34, 51, 0.25)",
  nodeImmune: "rgba(0, 255, 180, 0.15)",
  coreHealthy: "#00ffc8",
  coreDamaged: "#ff4444",
  coreShield: "#4488ff",
  coreShieldGlow: "rgba(68, 136, 255, 0.4)",
  coreOverclock: "#ffaa00",
  droneFill: "#00e5ff",
  droneGlow: "rgba(0, 229, 255, 0.6)",
  droneTrail: "rgba(0, 229, 255, 0.12)",
  droneStunned: "#ff4444",
  cableCyan: "#00ffd5",
  cableGlow: "rgba(0, 255, 213, 0.5)",
  cableBorder: "#44ff88",
  cableBorderGlow: "rgba(68, 255, 136, 0.5)",
  pulseWorm: "#ff2244",
  pulseWormGlow: "rgba(255, 34, 68, 0.5)",
  siegeBloc: "#991122",
  siegeBlocCross: "#ff6666",
  stormFlitter: "#ff44ff",
  stormFlitterGlow: "rgba(255, 68, 255, 0.6)",
  borderText: "#44ffaa",
  borderTextGlow: "rgba(68, 255, 170, 0.6)",
  hudText: "#88ccff",
} as const;

const _colorCache = new Map<string, string>();
export function lerpColor(c1: string, c2: string, t: number): string {
  const step = Math.round(t * 20); 
  const key = `${c1}-${c2}-${step}`;
  let cached = _colorCache.get(key);
  if (cached) return cached;

  const hex1 = parseInt(c1.slice(1), 16);
  const hex2 = parseInt(c2.slice(1), 16);
  
  const r1 = (hex1 >> 16) & 255, g1 = (hex1 >> 8) & 255, b1 = hex1 & 255;
  const r2 = (hex2 >> 16) & 255, g2 = (hex2 >> 8) & 255, b2 = hex2 & 255;
  
  const realT = step / 20;
  const r = Math.round(r1 + (r2 - r1) * realT);
  const g = Math.round(g1 + (g2 - g1) * realT);
  const b = Math.round(b1 + (b2 - b1) * realT);
  
  cached = `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
  _colorCache.set(key, cached);
  return cached;
}
