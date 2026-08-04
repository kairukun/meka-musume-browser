import type { DoctrineId } from "./development";
import {
  bfsMove,
  calcDamage,
  checkEnd,
  tryEnemySignature,
  type SimBattle,
  type SimUnit,
} from "./sim";

export type EnemyAction = {
  id: number;
  x: number;
  y: number;
  foeId: string | null;
  score: number;
  blurb: string;
  useSig?: boolean;
};

const OLLAMA_KEY = "mm_opfor_ollama";

export function getOllamaEnabled(): boolean {
  try {
    return localStorage.getItem(OLLAMA_KEY) === "1";
  } catch {
    return false;
  }
}

export function setOllamaEnabled(on: boolean) {
  try {
    localStorage.setItem(OLLAMA_KEY, on ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function listEnemyActions(
  battle: SimBattle,
  unit: SimUnit,
  fatigue: number,
  doctrines: DoctrineId[],
): EnemyAction[] {
  const allies = battle.units.filter((u) => u.team === "ally" && u.hp > 0 && u.x != null);
  const moves = bfsMove(battle, unit);
  const actions: EnemyAction[] = [];
  let id = 0;

  for (const [tx, ty] of moves) {
    const reachable: { foe: SimUnit; dmg: number }[] = [];
    for (const a of allies) {
      const d = Math.abs(tx - a.x!) + Math.abs(ty - a.y!);
      if (d < unit.range[0] || d > unit.range[1]) continue;
      const dmg = calcDamage(unit, a, fatigue, null, false, doctrines, battle.map);
      reachable.push({ foe: a, dmg });
    }

    if (!reachable.length) {
      const nearest = allies.reduce(
        (best, a) => {
          const d = Math.abs(tx - a.x!) + Math.abs(ty - a.y!);
          return d < best.d ? { d, a } : best;
        },
        { d: 99, a: allies[0] },
      );
      actions.push({
        id: id++,
        x: tx,
        y: ty,
        foeId: null,
        score: 12 - nearest.d + (tx < 10 ? 2 : 0),
        blurb: `Advance to (${tx},${ty}) toward ${nearest.a.name}`,
      });
      continue;
    }

    for (const { foe, dmg } of reachable) {
      let score = dmg;
      if (foe.cls === "Command") score -= 8;
      if (foe.cls === "Assault" || foe.cls === "Tank") score += 3;
      if (battle.tauntId === foe.id) score += 12;
      const ratio = foe.hp / foe.maxHp;
      if (ratio < 0.35) score += 4;
      actions.push({
        id: id++,
        x: tx,
        y: ty,
        foeId: foe.id,
        score,
        blurb: `Move (${tx},${ty}) · strike ${foe.name} (~${dmg})`,
      });
    }
  }

  if (unit.x != null && unit.y != null) {
    actions.push({
      id: id++,
      x: unit.x,
      y: unit.y,
      foeId: null,
      score: -2,
      blurb: `Hold at (${unit.x},${unit.y})`,
    });
  }

  if (!battle.enemySigUsed && !unit.sigUsed && ["Tank", "Assault", "Support", "Defense"].includes(unit.cls)) {
    actions.push({
      id: id++,
      x: unit.x!,
      y: unit.y!,
      foeId: null,
      score: 6,
      blurb: `Use class signature (${unit.cls})`,
      useSig: true,
    });
  }

  return actions;
}

/** Fair academy brain — samples among top options. */
export function pickHeuristicAction(actions: EnemyAction[]): EnemyAction | null {
  if (!actions.length) return null;
  const sorted = [...actions].sort((a, b) => b.score - a.score);
  const top = sorted.slice(0, Math.min(4, sorted.length));
  const weights = top.map((_, i) => Math.max(1, 5 - i));
  const total = weights.reduce((s, w) => s + w, 0);
  let r = Math.random() * total;
  for (let i = 0; i < top.length; i++) {
    r -= weights[i];
    if (r <= 0) return top[i];
  }
  return top[0];
}

export function applyEnemyAction(
  battle: SimBattle,
  unitId: string,
  action: EnemyAction,
  fatigue: number,
  doctrines: DoctrineId[],
): SimBattle {
  if (action.useSig) {
    const unit = battle.units.find((u) => u.id === unitId);
    if (!unit) return battle;
    const sig = tryEnemySignature(battle, unit);
    if (sig) {
      const u = sig.units.find((x) => x.id === unitId)!;
      u.acted = true;
      const end = checkEnd(sig);
      if (end) return { ...sig, phase: end };
      return sig;
    }
  }

  const b: SimBattle = { ...battle, units: battle.units.map((u) => ({ ...u })) };
  const unit = b.units.find((u) => u.id === unitId);
  if (!unit) return battle;
  unit.x = action.x;
  unit.y = action.y;
  if (action.foeId) {
    const foe = b.units.find((u) => u.id === action.foeId);
    if (foe && foe.hp > 0) {
      const breach = unit.cls === "Assault" && unit.atkBuff > 0;
      const dmg = calcDamage(unit, foe, fatigue, b.markedId, breach, doctrines, b.map);
      foe.hp = Math.max(0, foe.hp - dmg);
      b.log = `${unit.name} hits ${foe.name} — ${dmg}.`;
    } else b.log = `${unit.name} advances.`;
  } else {
    b.log = action.blurb.startsWith("Hold")
      ? `${unit.name} holds formation.`
      : `${unit.name} advances.`;
  }
  unit.acted = true;
  const end = checkEnd(b);
  if (end) return { ...b, phase: end };
  return b;
}

export function endEnemyPhase(battle: SimBattle): SimBattle {
  return {
    ...battle,
    phase: "player",
    turn: battle.turn + 1,
    mode: "select",
    units: battle.units.map((u) => ({ ...u, acted: false })),
    log: `Your phase — Turn ${battle.turn + 1}.`,
  };
}
