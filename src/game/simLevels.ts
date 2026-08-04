import type { SimLevelId } from "./types";

export interface SimLevelDef {
  id: SimLevelId;
  label: string;
  blurb: string;
  /** Added to player Squad STR to get OpFor Combat STR */
  opforOffset: number;
}

/** Progressive 5v5 sims — OpFor Combat STR = Squad STR + offset (clamped). */
export const SIM_LEVELS: SimLevelDef[] = [
  {
    id: "sim_01",
    label: "Sim 01 — Street Sweep",
    blurb: "Clear a ruined block. OpFor is slightly under your rating.",
    opforOffset: -2,
  },
  {
    id: "sim_02",
    label: "Sim 02 — Crossfire",
    blurb: "Intersecting lanes. OpFor matches your edge and then some.",
    opforOffset: 4,
  },
  {
    id: "sim_03",
    label: "Sim 03 — Hold the Block",
    blurb: "Defense under pressure. Harder OpFor rating.",
    opforOffset: 9,
  },
  {
    id: "sim_04",
    label: "Sim 04 — City Core",
    blurb: "Final academy sim. Peak opposing Combat STR.",
    opforOffset: 15,
  },
];

export const SIM_LEVEL_IDS = SIM_LEVELS.map((l) => l.id);

export function simLevelDef(id: SimLevelId) {
  return SIM_LEVELS.find((l) => l.id === id) ?? SIM_LEVELS[0];
}

export function emptySimCleared(): Record<SimLevelId, boolean> {
  return { sim_01: false, sim_02: false, sim_03: false, sim_04: false };
}
