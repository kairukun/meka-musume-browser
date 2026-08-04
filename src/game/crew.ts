import type { CrewId, CrewMember, PilotId } from "./types";

export const AFFINITY_MAX = 20;
export const FATIGUE_MAX = 100;
export const INTELLIGENCE_MAX = 99;
export const BOND_THRESHOLDS = [3, 6, 10] as const;

export const CREW_ORDER: CrewId[] = ["yuu", "emi", "yuki", "naomi", "kat"];
export const PILOT_IDS: PilotId[] = ["emi", "yuki", "naomi"];
export const BOND_CREW: Exclude<CrewId, "yuu">[] = ["emi", "yuki", "naomi", "kat"];

export const CREW: Record<CrewId, CrewMember> = {
  yuu: {
    id: "yuu",
    name: "Yuu Igarashi",
    short: "Yuu",
    role: "Commander",
    mech: "Mission Log (Command Slate)",
    unit: "Command",
    personality: "decisive",
    blurb:
      "Issues orders from the bay. Learns the field by studying doctrine and reading his pilots.",
  },
  emi: {
    id: "emi",
    name: "Emi Kabe",
    short: "Emi",
    role: "Assault Pilot",
    mech: "TAM-A 「Striker」",
    unit: "Assault",
    personality: "blunt",
    blurb:
      "Front-line spear. Respects direct orders, hard drills, and commanders who don't soften the truth.",
  },
  yuki: {
    id: "yuki",
    name: "Yuki Kimura",
    short: "Yuki",
    role: "Tank Pilot",
    mech: "TAM-T 「Bulwark」",
    unit: "Tank",
    personality: "gentle",
    blurb:
      "Shield of the squad. Grows when trusted, protected in conversation, and asked — not ordered — to hold the line.",
  },
  naomi: {
    id: "naomi",
    name: "Naomi Hattori",
    short: "Naomi",
    role: "Defense Pilot",
    mech: "TAM-D 「Aegis」",
    unit: "Defense",
    personality: "precise",
    blurb:
      "Reads the board two steps ahead. Affinity rises with clear plans, protocol, and efficient debriefs.",
  },
  kat: {
    id: "kat",
    name: "Katsumi “Kat” Ichida",
    short: "Kat",
    role: "Tech / Maintenance",
    mech: "Bay 07 Support Rig",
    unit: "Support",
    personality: "playful",
    blurb:
      "Keeps the TAMs breathing. Bonds over honest tech talk, snacks, and not taking yourself too seriously.",
  },
};

export const SIGNATURE_LABEL: Record<CrewId, string> = {
  emi: "Breach",
  yuki: "Bulwark",
  naomi: "Mark",
  kat: "Patch",
  yuu: "Directive",
};

const BASE = import.meta.env.BASE_URL;

export const ASSET = {
  bg: (name: string) => `${BASE}assets/bg/${name}.png`,
  cg: (name: string) => `${BASE}assets/cg/${name}.png`,
  sprite: (who: string, expr = "neutral") => `${BASE}assets/sprites/${who}/${expr}.png`,
  logo: `${BASE}assets/logo.png`,
  simTile: (name: string) => `${BASE}assets/sim/tiles/${name}.png`,
  simUnit: (team: "ally" | "enemy", cls: string) =>
    `${BASE}assets/sim/units/${team}_${cls}.png`,
  gui: (name: string) => `${BASE}assets/gui/${name}`,
};
