import { AFFINITY_MAX, BOND_THRESHOLDS, CREW, PILOT_IDS } from "./crew";
import type { CrewId, PilotId } from "./types";

export function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

export function affinityRankForValue(val: number) {
  let rank = 0;
  for (const t of BOND_THRESHOLDS) {
    if (val >= t) rank += 1;
  }
  return rank;
}

export function combatRatingBase(who: CrewId) {
  return ({ emi: 42, yuki: 40, naomi: 38, kat: 28, yuu: 20 } as const)[who];
}

export function combatRating(
  who: CrewId,
  affinity: Record<Exclude<CrewId, "yuu">, number>,
  intelligence: number,
) {
  const aff = who === "yuu" ? 0 : affinity[who];
  const base = combatRatingBase(who);
  let rating = base + aff * 3;
  if (who === "yuu") rating = 18 + Math.floor(intelligence * 0.55);
  if (who === "kat") rating = base + aff * 2;
  return clamp(rating, 1, 99);
}

export function squadCombatStrength(
  affinity: Record<Exclude<CrewId, "yuu">, number>,
  intelligence: number,
) {
  const pilots = PILOT_IDS.reduce(
    (sum, id) => sum + combatRating(id, affinity, intelligence),
    0,
  );
  const support = Math.floor(combatRating("kat", affinity, intelligence) * 0.45);
  const command = Math.floor(combatRating("yuu", affinity, intelligence) * 0.35);
  const doctrine = Math.floor(intelligence * 0.55);
  return clamp(Math.floor((pilots + support + command + doctrine) / 4.5), 1, 99);
}

export function opposingSquadStrength(
  ours: number,
  mode: "match" | "sim" | "drill_01" | "drill_02" | "drill_03" = "match",
) {
  const offset = mode === "drill_02" ? 1 : 0;
  return clamp(ours + offset, 1, 99);
}

export function strScaleFactor(strVal: number) {
  return 0.55 + (clamp(strVal, 1, 99) / 100) * 1.15;
}

export function fatigueDrillMult(fatigue: number) {
  if (fatigue < 35) return 1;
  if (fatigue < 60) return 0.92;
  if (fatigue < 85) return 0.82;
  return 0.7;
}

export function fatigueIncomingMult(fatigue: number) {
  if (fatigue < 35) return 1;
  if (fatigue < 60) return 1.08;
  if (fatigue < 85) return 1.18;
  return 1.3;
}

export function fatigueLabel(fatigue: number) {
  if (fatigue < 35) return "Fresh — drills at full edge";
  if (fatigue < 60) return "Winded — slight drill penalty";
  if (fatigue < 85) return "Tired — real drill penalties";
  return "Critical — sim locks / heavy penalties";
}

export function dayWeekLabel(month: string, day: number) {
  if (month === "April") {
    if (day <= 7) return "Week 1 · Orientation";
    if (day <= 14) return "Week 2 · Basics";
    if (day <= 21) return "Week 3 · Pressure";
    return "Week 4 · Edge of May";
  }
  return "May · Escalation watch";
}

export function dayAgendaLine(month: string, day: number) {
  return `${month} ${day} — ${dayWeekLabel(month, day)}`;
}

export function pilotAtk(who: PilotId, cr: number) {
  const base = { emi: 12, yuki: 9, naomi: 8 }[who];
  return base + Math.floor((cr - 40) / 6);
}

export function pilotDefense(who: PilotId, cr: number) {
  const base = { emi: 4, yuki: 10, naomi: 12 }[who];
  return base + Math.max(0, Math.floor((cr - 40) / 8));
}

export function pilotMaxHp(who: PilotId, cr: number) {
  const base = { emi: 40, yuki: 70, naomi: 55 }[who];
  return base + Math.max(0, (cr - 40) * 2);
}

export function signatureOrder(who: PilotId) {
  return ({ emi: "breach", yuki: "bulwark", naomi: "mark" } as const)[who];
}

export function shortName(who: CrewId) {
  return CREW[who].short;
}

export function clampAffinity(n: number) {
  return clamp(n, 0, AFFINITY_MAX);
}
