import type { SimLevelId } from "./types";

export type SimDifficulty = "very_easy" | "easy" | "medium" | "hard";

export interface SimLevelDef {
  id: SimLevelId;
  label: string;
  blurb: string;
  difficulty: SimDifficulty;
  difficultyLabel: string;
  /** Added to player Squad STR to get OpFor Combat STR */
  opforOffset: number;
}

/** Progressive 5v5 sims — OpFor Combat STR = Squad STR + offset (clamped). */
export const SIM_LEVELS: SimLevelDef[] = [
  {
    id: "sim_01",
    label: "Sim 01 — Street Sweep",
    blurb: "Ash Plaza tutorial pressure. OpFor is clearly under your rating.",
    difficulty: "very_easy",
    difficultyLabel: "Very Easy",
    opforOffset: -10,
  },
  {
    id: "sim_02",
    label: "Sim 02 — Crossfire",
    blurb: "Split lanes. OpFor still softer than Team 07.",
    difficulty: "easy",
    difficultyLabel: "Easy",
    opforOffset: -4,
  },
  {
    id: "sim_03",
    label: "Sim 03 — Hold the Block",
    blurb: "Even fight with a light edge to OpFor.",
    difficulty: "medium",
    difficultyLabel: "Medium",
    opforOffset: 3,
  },
  {
    id: "sim_04",
    label: "Sim 04 — City Core",
    blurb: "Peak academy trial. OpFor hits above your Combat STR.",
    difficulty: "hard",
    difficultyLabel: "Hard",
    opforOffset: 10,
  },
];

export const SIM_LEVEL_IDS = SIM_LEVELS.map((l) => l.id);

export function simLevelDef(id: SimLevelId) {
  return SIM_LEVELS.find((l) => l.id === id) ?? SIM_LEVELS[0];
}

export function emptySimCleared(): Record<SimLevelId, boolean> {
  return { sim_01: false, sim_02: false, sim_03: false, sim_04: false };
}
