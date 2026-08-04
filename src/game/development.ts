import type { SimClass } from "./sim";

export type FrameClass = SimClass;
export type DoctrineId =
  | "breach_net"
  | "iron_wall"
  | "mark_protocol"
  | "patch_grid"
  | "command_link";
export type FacilityId = "armory" | "sim_suite" | "crane" | "medbay";

export const FRAME_CLASSES: FrameClass[] = [
  "Assault",
  "Tank",
  "Defense",
  "Support",
  "Command",
];

export const FRAME_MAX = 3;
export const FRAME_TUNE_COST = 2;
export const DOCTRINE_CAP = 3;
export const COHESION_MAX = 100;
export const CONDITIONING_MAX = 5;

export const DOCTRINES: Record<
  DoctrineId,
  { name: string; blurb: string; str: number }
> = {
  breach_net: {
    name: "Breach Net",
    blurb: "Assault pressure — +15% Assault damage in sims.",
    str: 2,
  },
  iron_wall: {
    name: "Iron Wall",
    blurb: "Tank/Defense open with +2 DEF buff.",
    str: 2,
  },
  mark_protocol: {
    name: "Mark Protocol",
    blurb: "Marked targets take +10% more damage.",
    str: 2,
  },
  patch_grid: {
    name: "Patch Grid",
    blurb: "Support Patch heals +25%.",
    str: 2,
  },
  command_link: {
    name: "Command Link",
    blurb: "Directive ATK buff +1; adjacent support links heal +1.",
    str: 2,
  },
};

export const FACILITIES: Record<
  FacilityId,
  { name: string; blurb: string; str: number; cost: number; requiresSim?: string }
> = {
  armory: {
    name: "Armory Locker",
    blurb: "Spare plates and thrusters on call.",
    str: 3,
    cost: 3,
    requiresSim: "sim_01",
  },
  sim_suite: {
    name: "Sim Fidelity Suite",
    blurb: "Higher-res OpFor modeling for Team 07.",
    str: 3,
    cost: 4,
    requiresSim: "sim_02",
  },
  crane: {
    name: "Hangar Crane",
    blurb: "Faster frame swaps between sorties.",
    str: 3,
    cost: 5,
    requiresSim: "sim_03",
  },
  medbay: {
    name: "Bay Medbay",
    blurb: "Softens fatigue spikes after hard sims.",
    str: 2,
    cost: 3,
    requiresSim: "sim_01",
  },
};

export function emptyFrameTuning(): Record<FrameClass, number> {
  return { Assault: 0, Tank: 0, Defense: 0, Support: 0, Command: 0 };
}

export function emptyFacilities(): Record<FacilityId, boolean> {
  return { armory: false, sim_suite: false, crane: false, medbay: false };
}

export function developmentStrBonus(opts: {
  frameTuning: Record<FrameClass, number>;
  doctrines: DoctrineId[];
  cohesion: number;
  facilities: Record<FacilityId, boolean>;
  conditioning: number;
}) {
  const frame = FRAME_CLASSES.reduce((s, c) => s + opts.frameTuning[c] * 2, 0);
  const doctrine = opts.doctrines.reduce((s, id) => s + DOCTRINES[id].str, 0);
  const cohesion = Math.floor(opts.cohesion / 10);
  const facility = (Object.keys(opts.facilities) as FacilityId[]).reduce(
    (s, id) => s + (opts.facilities[id] ? FACILITIES[id].str : 0),
    0,
  );
  const conditioning = opts.conditioning;
  return frame + doctrine + cohesion + facility + conditioning;
}
