import type { DoctrineId } from "./development";
import {
  bfsMove,
  calcDamage,
  checkEnd,
  type SimBattle,
  type SimUnit,
} from "./sim";

export type EnemyAction = {
  id: number;
  x: number;
  y: number;
  foeId: string | null;
  blurb: string;
};

/** Legal move/attack options for one OpFor unit — Ollama picks among these. */
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
      const dmg = calcDamage(unit, a, fatigue, null, false, doctrines);
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
        blurb: `Advance to (${tx},${ty}) toward ${nearest.a.name} (HP ${nearest.a.hp}/${nearest.a.maxHp}, ${nearest.a.cls})`,
      });
      continue;
    }

    for (const { foe, dmg } of reachable) {
      const taunt = battle.tauntId === foe.id ? ", taunting" : "";
      actions.push({
        id: id++,
        x: tx,
        y: ty,
        foeId: foe.id,
        blurb: `Move (${tx},${ty}) then strike ${foe.name} (${foe.cls}, HP ${foe.hp}/${foe.maxHp}${taunt}) for ~${dmg} damage`,
      });
    }
  }

  if (unit.x != null && unit.y != null) {
    actions.push({
      id: id++,
      x: unit.x,
      y: unit.y,
      foeId: null,
      blurb: `Hold formation at (${unit.x},${unit.y}) — no attack`,
    });
  }

  return actions;
}

export function applyEnemyAction(
  battle: SimBattle,
  unitId: string,
  action: EnemyAction,
  fatigue: number,
  doctrines: DoctrineId[],
): SimBattle {
  const b: SimBattle = { ...battle, units: battle.units.map((u) => ({ ...u })) };
  const unit = b.units.find((u) => u.id === unitId);
  if (!unit) return battle;
  unit.x = action.x;
  unit.y = action.y;
  if (action.foeId) {
    const foe = b.units.find((u) => u.id === action.foeId);
    if (foe && foe.hp > 0) {
      const dmg = calcDamage(unit, foe, fatigue, null, false, doctrines);
      foe.hp = Math.max(0, foe.hp - dmg);
      b.log = `${unit.name} hits ${foe.name} — ${dmg}.`;
    } else {
      b.log = `${unit.name} advances.`;
    }
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
