import { fatigueDrillMult, fatigueIncomingMult } from "./formulas";
import { drillDamage } from "./store";
import type { DrillId, DrillOrder, PilotId } from "./types";

export interface DrillPilot {
  id: PilotId;
  name: string;
  hp: number;
  maxHp: number;
  atk: number;
  defense: number;
  order: DrillOrder;
}

export interface DrillState {
  id: DrillId;
  turn: number;
  enemyHp: number;
  enemyMax: number;
  enemyAtk: number;
  focusBonus: number;
  marked: boolean;
  pilots: DrillPilot[];
  log: string;
  won: boolean;
  lost: boolean;
}

export function createDrill(
  id: DrillId,
  stats: Record<PilotId, { atk: number; defense: number; maxHp: number }>,
  squadStr: number,
  opforStr: number,
): DrillState {
  const scale = 0.7 + (opforStr / 100) * 0.7;
  let enemyMax = Math.round(70 + squadStr * 1.1);
  let enemyAtk = Math.max(6, Math.round(4 + opforStr * 0.34));
  let focusBonus = 1.35;
  const orders: Record<PilotId, DrillOrder> = {
    emi: "strike",
    yuki: "guard",
    naomi: "strike",
  };
  if (id === "drill_02") {
    focusBonus = 1.25;
    orders.yuki = "guard";
    orders.naomi = "guard";
    enemyMax = Math.round(enemyMax * 1.08);
    enemyAtk = Math.round(enemyAtk * 1.1);
  } else if (id === "drill_03") {
    focusBonus = 1.55;
    orders.emi = "focus";
    orders.naomi = "focus";
  }
  return {
    id,
    turn: 1,
    enemyHp: enemyMax,
    enemyMax,
    enemyAtk,
    focusBonus,
    marked: false,
    pilots: (["emi", "yuki", "naomi"] as PilotId[]).map((pid) => ({
      id: pid,
      name: pid === "emi" ? "Emi" : pid === "yuki" ? "Yuki" : "Naomi",
      hp: stats[pid].maxHp,
      maxHp: stats[pid].maxHp,
      atk: stats[pid].atk,
      defense: stats[pid].defense,
      order: orders[pid],
    })),
    log: `OpFor dummy online · STR ${opforStr} (scale ${scale.toFixed(2)})`,
    won: false,
    lost: false,
  };
}

export function resolveDrillTurn(state: DrillState, fatigue: number, katAff: number): DrillState {
  const next: DrillState = {
    ...state,
    pilots: state.pilots.map((p) => ({ ...p })),
    marked: state.marked,
  };
  const lines: string[] = [];
  const out = fatigueDrillMult(fatigue);
  const inn = fatigueIncomingMult(fatigue);
  const katMult = 1 + katAff * 0.015;
  const enemyDef = state.id === "drill_03" ? 8 : 6;
  let tauntYuki = false;
  let breachExposed = false;

  // Pass 1 — marks
  for (const p of next.pilots) {
    if (p.hp <= 0) continue;
    if (p.order === "mark") {
      next.marked = true;
      lines.push(`${p.name} Marks the vector — hits land cleaner.`);
    }
  }
  const markBonus = next.marked ? 1.28 : 1;

  // Pass 2 — actions
  for (const p of next.pilots) {
    if (p.hp <= 0 || p.order === "mark") continue;
    if (p.order === "guard") {
      lines.push(`${p.name} guards.`);
    } else if (p.order === "bulwark") {
      tauntYuki = true;
      lines.push(`${p.name} Bulwark — holds and draws fire.`);
    } else if (p.order === "breach") {
      breachExposed = true;
      const dmg = drillDamage(p.atk, enemyDef, 1.55 * katMult * out * markBonus);
      next.enemyHp = Math.max(0, next.enemyHp - dmg);
      lines.push(`${p.name} Breaches — ${dmg} dmg (exposed).`);
    } else {
      let focusB = p.order === "focus" ? next.focusBonus : 1;
      if (state.id === "drill_03" && p.id === "naomi" && p.order === "focus") focusB += 0.15;
      const dmg = drillDamage(p.atk, enemyDef, focusB * katMult * out * markBonus);
      next.enemyHp = Math.max(0, next.enemyHp - dmg);
      lines.push(`${p.name} ${p.order === "focus" ? "focuses" : "strikes"} — ${dmg} dmg.`);
    }
  }

  if (
    next.marked &&
    next.pilots.some((p) => p.hp > 0 && ["strike", "focus", "breach"].includes(p.order))
  ) {
    next.marked = false;
  }

  if (next.enemyHp > 0) {
    const living = next.pilots.filter((p) => p.hp > 0);
    if (living.length) {
      let target =
        tauntYuki && living.find((p) => p.id === "yuki")
          ? living.find((p) => p.id === "yuki")!
          : living[Math.floor(Math.random() * living.length)];
      const guarded =
        target.order === "guard" || target.order === "bulwark";
      let mit = guarded ? (target.order === "bulwark" ? 0.32 : 0.45) : 1;
      if (breachExposed && target.id === "emi") mit *= 1.22;
      const dmg = Math.max(
        1,
        Math.round(drillDamage(next.enemyAtk, target.defense) * mit * inn),
      );
      target.hp = Math.max(0, target.hp - dmg);
      const tag = tauntYuki && target.id === "yuki" ? " (bulwark)" : guarded ? " (guard)" : "";
      lines.push(`Target hits ${target.name} — ${dmg}${tag}.`);
    }
  } else {
    lines.push("Target destroyed.");
  }

  if (out < 1) lines.push("Fatigue softens output.");
  next.log = lines.join("  ·  ");
  next.turn += 1;
  next.won = next.enemyHp <= 0;
  next.lost = next.pilots.every((p) => p.hp <= 0);
  return next;
}
