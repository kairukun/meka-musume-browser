import { ASSET } from "./crew";
import type { DoctrineId } from "./development";
import { fatigueDrillMult, fatigueIncomingMult } from "./formulas";
import { simMapDef, type TileGrid } from "./simMaps";
import type { CrewId, SimLevelId } from "./types";

export const SIM_W = 20;
export const SIM_H = 12;
export const SIM_TILE = 36;

/** @deprecated use battle.map — kept for TrainingScreen previews */
export const SIM_MAP: TileGrid = simMapDef("sim_01").map;
export const SIM_DEPLOY = simMapDef("sim_01").deploy;

const CLASS = {
  Assault: { move: 5, hp: 26, atk: 16, defense: 4, sprite: "assault", range: [1, 2] as [number, number] },
  Tank: { move: 3, hp: 36, atk: 12, defense: 10, sprite: "tank", range: [1, 4] as [number, number] },
  Defense: { move: 3, hp: 30, atk: 12, defense: 9, sprite: "defense", range: [1, 4] as [number, number] },
  Support: { move: 4, hp: 26, atk: 11, defense: 6, sprite: "support", range: [1, 3] as [number, number] },
  Command: { move: 4, hp: 28, atk: 12, defense: 7, sprite: "command", range: [1, 3] as [number, number] },
};

export type SimClass = keyof typeof CLASS;

export interface SimUnit {
  id: string;
  name: string;
  cls: SimClass;
  who: CrewId | null;
  team: "ally" | "enemy";
  x: number | null;
  y: number | null;
  hp: number;
  maxHp: number;
  atk: number;
  defense: number;
  move: number;
  range: [number, number];
  sprite: string;
  acted: boolean;
  sigUsed: boolean;
  atkBuff: number;
  defBuff: number;
}

export type SimPhase = "deploy" | "player" | "enemy" | "win" | "lose";

export interface SimBattle {
  levelId: SimLevelId;
  map: TileGrid;
  deploy: [number, number][];
  tip: string;
  phase: SimPhase;
  turn: number;
  units: SimUnit[];
  selected: string | null;
  mode: "place" | "select" | "command";
  moveTiles: [number, number][];
  attackTiles: [number, number][];
  movedFrom: [number, number] | null;
  log: string;
  supportFired: string[];
  tauntId: string | null;
  markedId: string | null;
  allyStr: number;
  opforStr: number;
  /** Enemy signature used this battle (one shared for OpFor drama) */
  enemySigUsed: boolean;
}

function scaleStats(cls: SimClass, str: number, ally: boolean, frameLevel = 0) {
  const base = CLASS[cls];
  let hpF = 0.75 + (str / 100) * 0.4;
  let atkF = 0.7 + (str / 100) * 0.7;
  if (!ally) {
    hpF *= 0.88;
    atkF *= 0.95;
  }
  const tune = ally ? 1 + frameLevel * 0.06 : 1;
  return {
    hp: Math.max(14, Math.round(base.hp * hpF * tune)),
    atk: Math.max(5, Math.round(base.atk * atkF * tune)),
    defense: Math.max(3, Math.round(base.defense * atkF * tune)),
    move: base.move + (ally && frameLevel >= 3 ? 1 : 0),
    range: base.range,
    sprite: base.sprite,
  };
}

export function createSimBattle(
  allyStr: number,
  opforStr: number,
  opts?: {
    frameTuning?: Record<SimClass, number>;
    doctrines?: DoctrineId[];
    levelId?: SimLevelId;
  },
): SimBattle {
  const levelId = opts?.levelId ?? "sim_01";
  const layout = simMapDef(levelId);
  const tuning = opts?.frameTuning ?? {
    Assault: 0,
    Tank: 0,
    Defense: 0,
    Support: 0,
    Command: 0,
  };
  const doctrines = opts?.doctrines ?? [];
  const roster: [string, string, SimClass, CrewId][] = [
    ["a_yuu", "Yuu", "Command", "yuu"],
    ["a_emi", "Emi", "Assault", "emi"],
    ["a_yuki", "Yuki", "Tank", "yuki"],
    ["a_naomi", "Naomi", "Defense", "naomi"],
    ["a_kat", "Kat", "Support", "kat"],
  ];
  const units: SimUnit[] = roster.map(([id, name, cls, who]) => {
    const s = scaleStats(cls, allyStr, true, tuning[cls] ?? 0);
    const u: SimUnit = {
      id,
      name,
      cls,
      who,
      team: "ally",
      x: null,
      y: null,
      hp: s.hp,
      maxHp: s.hp,
      atk: s.atk,
      defense: s.defense,
      move: s.move,
      range: s.range,
      sprite: s.sprite,
      acted: false,
      sigUsed: false,
      atkBuff: 0,
      defBuff: 0,
    };
    if (doctrines.includes("iron_wall") && (cls === "Tank" || cls === "Defense")) {
      u.defBuff += 2;
    }
    return u;
  });
  for (const foe of layout.foes) {
    const s = scaleStats(foe.cls, opforStr, false);
    units.push({
      id: foe.id,
      name: foe.name,
      cls: foe.cls,
      who: null,
      team: "enemy",
      x: foe.x,
      y: foe.y,
      hp: s.hp,
      maxHp: s.hp,
      atk: s.atk,
      defense: s.defense,
      move: s.move,
      range: s.range,
      sprite: s.sprite,
      acted: false,
      sigUsed: false,
      atkBuff: 0,
      defBuff: 0,
    });
  }
  const allies = units.filter((u) => u.team === "ally");
  const enemies = units.filter((u) => u.team === "enemy");
  const budget = allies.reduce((s, u) => s + u.maxHp, 0);
  const foeTotal = enemies.reduce((s, u) => s + u.maxHp, 0);
  if (foeTotal > 0) {
    const scale = budget / foeTotal;
    for (const u of enemies) {
      u.maxHp = Math.max(12, Math.round(u.maxHp * scale));
      u.hp = u.maxHp;
    }
  }
  return {
    levelId,
    map: layout.map,
    deploy: layout.deploy,
    tip: layout.tip,
    phase: "deploy",
    turn: 1,
    units,
    selected: allies[0]?.id ?? null,
    mode: "place",
    moveTiles: [...layout.deploy],
    attackTiles: [],
    movedFrom: null,
    log: `${layout.name} — place five mechs, then Begin. OpFor STR ${opforStr}.`,
    supportFired: [],
    tauntId: null,
    markedId: null,
    allyStr,
    opforStr,
    enemySigUsed: false,
  };
}

export function tilePassable(map: TileGrid, x: number, y: number) {
  if (x < 0 || y < 0 || x >= SIM_W || y >= SIM_H) return false;
  return ![3, 4, 5].includes(map[y][x]);
}

export function tileDef(map: TileGrid, x: number, y: number) {
  return map[y][x] === 2 ? 3 : 0;
}

export function tileImage(map: TileGrid, x: number, y: number) {
  const t = map[y][x];
  if (t === 5) return ASSET.simTile("building");
  if (t === 4) return ASSET.simTile("rock");
  if (t === 3) return ASSET.simTile("wall");
  if (t === 2) return ASSET.simTile("rubble");
  if (t === 1) return ASSET.simTile("dirt");
  return ASSET.simTile("grass");
}

export function tileLabel(map: TileGrid, x: number, y: number) {
  const t = map[y]?.[x];
  if (t === 5) return "Ruined Building";
  if (t === 4) return "Wreckage";
  if (t === 3) return "Barrier";
  if (t === 2) return "Rubble Cover";
  if (t === 1) return "Cracked Street";
  return "Ash Plaza";
}

export function unitAt(battle: SimBattle, x: number, y: number) {
  return battle.units.find((u) => u.hp > 0 && u.x === x && u.y === y) ?? null;
}

export function bfsMove(battle: SimBattle, unit: SimUnit): [number, number][] {
  if (unit.x == null || unit.y == null) return [];
  const start: [number, number] = [unit.x, unit.y];
  const reach = new Map<string, number>([[`${start[0]},${start[1]}`, 0]]);
  const q: [number, number][] = [start];
  while (q.length) {
    const [cx, cy] = q.shift()!;
    const dist = reach.get(`${cx},${cy}`)!;
    if (dist >= unit.move) continue;
    for (const [nx, ny] of [
      [cx + 1, cy],
      [cx - 1, cy],
      [cx, cy + 1],
      [cx, cy - 1],
    ] as [number, number][]) {
      if (!tilePassable(battle.map, nx, ny)) continue;
      const key = `${nx},${ny}`;
      if (reach.has(key)) continue;
      const other = unitAt(battle, nx, ny);
      if (other && other.id !== unit.id) continue;
      reach.set(key, dist + 1);
      q.push([nx, ny]);
    }
  }
  return [...reach.keys()].map((k) => {
    const [x, y] = k.split(",").map(Number);
    return [x, y] as [number, number];
  });
}

export function attackTiles(unit: SimUnit, x: number, y: number): [number, number][] {
  const [rmin, rmax] = unit.range;
  const out: [number, number][] = [];
  for (let ty = 0; ty < SIM_H; ty++) {
    for (let tx = 0; tx < SIM_W; tx++) {
      const d = Math.abs(tx - x) + Math.abs(ty - y);
      if (d >= rmin && d <= rmax) out.push([tx, ty]);
    }
  }
  return out;
}

export function calcDamage(
  attacker: SimUnit,
  defender: SimUnit,
  fatigue: number,
  markedId: string | null,
  breach = false,
  doctrines: DoctrineId[] = [],
  map?: TileGrid,
  levelId?: SimLevelId,
) {
  const tile =
    map && defender.x != null && defender.y != null ? tileDef(map, defender.x, defender.y) : 0;
  const atk = attacker.atk + attacker.atkBuff;
  const def = defender.defense + defender.defBuff + tile;
  let mult = 1.15;
  if (breach) mult *= 1.45;
  if (markedId === defender.id && attacker.team === "ally") {
    mult *= doctrines.includes("mark_protocol") ? 1.32 : 1.22;
  }
  if (attacker.team === "ally" && attacker.cls === "Assault" && doctrines.includes("breach_net")) {
    mult *= 1.15;
  }
  if (attacker.team === "enemy") {
    const byDiff: Record<string, number> = {
      sim_01: 0.72,
      sim_02: 0.82,
      sim_03: 0.9,
      sim_04: 0.98,
    };
    mult *= byDiff[levelId ?? "sim_03"] ?? 0.88;
  }
  let dmg = Math.max(2, Math.round((atk - def * 0.28) * mult * 1.2));
  if (attacker.team === "ally") dmg = Math.max(2, Math.round(dmg * fatigueDrillMult(fatigue)));
  if (attacker.team === "enemy") dmg = Math.max(2, Math.round(dmg * fatigueIncomingMult(fatigue)));
  return dmg;
}

export function allAlliesPlaced(battle: SimBattle) {
  return battle.units.filter((u) => u.team === "ally").every((u) => u.x != null);
}

export function checkEnd(battle: SimBattle): SimPhase | null {
  const allies = battle.units.filter((u) => u.team === "ally" && u.hp > 0 && u.x != null);
  const foes = battle.units.filter((u) => u.team === "enemy" && u.hp > 0);
  if (!foes.length) return "win";
  if (!allies.length) return "lose";
  return null;
}

/** One-shot enemy signature by class — fair but spicy. */
export function tryEnemySignature(battle: SimBattle, unit: SimUnit): SimBattle | null {
  if (battle.enemySigUsed || unit.sigUsed || unit.x == null) return null;
  const b: SimBattle = { ...battle, units: battle.units.map((u) => ({ ...u })), enemySigUsed: true };
  const u = b.units.find((x) => x.id === unit.id)!;
  u.sigUsed = true;
  if (u.cls === "Tank") {
    u.defBuff += 3;
    b.tauntId = u.id;
    b.log = `${u.name} locks armor — OpFor taunt.`;
    return b;
  }
  if (u.cls === "Assault") {
    u.atkBuff += 3;
    b.log = `${u.name} primes breach thrusters.`;
    return b;
  }
  if (u.cls === "Support") {
    const allies = b.units.filter((a) => a.team === "enemy" && a.hp > 0 && a.id !== u.id);
    allies.sort((a, c) => a.hp / a.maxHp - c.hp / c.maxHp);
    if (allies[0]) {
      const heal = Math.max(3, Math.floor(allies[0].maxHp * 0.15));
      allies[0].hp = Math.min(allies[0].maxHp, allies[0].hp + heal);
      b.log = `${u.name} patches ${allies[0].name} (+${heal}).`;
      return b;
    }
  }
  if (u.cls === "Defense") {
    const foes = b.units.filter((a) => a.team === "ally" && a.hp > 0 && a.x != null);
    foes.sort((a, c) => a.hp - c.hp);
    if (foes[0]) {
      b.markedId = foes[0].id;
      b.log = `${u.name} marks ${foes[0].name}.`;
      return b;
    }
  }
  return null;
}
