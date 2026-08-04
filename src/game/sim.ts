import { ASSET } from "./crew";
import { fatigueDrillMult } from "./formulas";
import type { CrewId } from "./types";

export const SIM_W = 20;
export const SIM_H = 12;
export const SIM_TILE = 36;

/** 0 grass, 1 dirt, 2 rubble(+def), 3 border, 4 rock, 5 building */
export const SIM_MAP: number[][] = [
  [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
  [3, 0, 0, 1, 0, 0, 4, 0, 1, 0, 0, 1, 0, 4, 0, 0, 1, 0, 0, 3],
  [3, 0, 1, 0, 0, 5, 0, 0, 0, 2, 2, 0, 0, 0, 5, 0, 0, 1, 0, 3],
  [3, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 3],
  [3, 0, 0, 2, 0, 0, 4, 0, 0, 5, 0, 0, 0, 4, 0, 0, 2, 0, 0, 3],
  [3, 0, 1, 0, 0, 1, 0, 2, 0, 0, 0, 0, 2, 0, 1, 0, 0, 1, 0, 3],
  [3, 0, 1, 0, 0, 1, 0, 2, 0, 0, 0, 0, 2, 0, 1, 0, 0, 1, 0, 3],
  [3, 0, 0, 2, 0, 0, 4, 0, 0, 5, 0, 0, 0, 4, 0, 0, 2, 0, 0, 3],
  [3, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 3],
  [3, 0, 1, 0, 0, 5, 0, 0, 0, 2, 2, 0, 0, 0, 5, 0, 0, 1, 0, 3],
  [3, 0, 0, 1, 0, 0, 4, 0, 1, 0, 0, 1, 0, 4, 0, 0, 1, 0, 0, 3],
  [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
];

export const SIM_DEPLOY: [number, number][] = [
  [1, 3], [1, 4], [1, 5], [1, 6], [1, 7], [1, 8],
  [2, 3], [2, 4], [2, 5], [2, 6], [2, 7], [2, 8],
  [3, 4], [3, 5], [3, 6], [3, 7],
];

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
  phase: SimPhase;
  turn: number;
  units: SimUnit[];
  selected: string | null;
  mode: "place" | "select" | "move" | "act";
  moveTiles: [number, number][];
  attackTiles: [number, number][];
  movedFrom: [number, number] | null;
  log: string;
  supportFired: string[];
  tauntId: string | null;
  markedId: string | null;
  allyStr: number;
  opforStr: number;
}

function scaleStats(cls: SimClass, str: number, ally: boolean) {
  const base = CLASS[cls];
  let hpF = 0.75 + (str / 100) * 0.4;
  let atkF = 0.7 + (str / 100) * 0.7;
  if (!ally) {
    hpF *= 0.88;
    atkF *= 0.95;
  }
  return {
    hp: Math.max(14, Math.round(base.hp * hpF)),
    atk: Math.max(5, Math.round(base.atk * atkF)),
    defense: Math.max(3, Math.round(base.defense * atkF)),
    move: base.move,
    range: base.range,
    sprite: base.sprite,
  };
}

export function createSimBattle(allyStr: number, opforStr: number): SimBattle {
  const roster: [string, string, SimClass, CrewId][] = [
    ["a_yuu", "Yuu", "Command", "yuu"],
    ["a_emi", "Emi", "Assault", "emi"],
    ["a_yuki", "Yuki", "Tank", "yuki"],
    ["a_naomi", "Naomi", "Defense", "naomi"],
    ["a_kat", "Kat", "Support", "kat"],
  ];
  const units: SimUnit[] = roster.map(([id, name, cls, who]) => {
    const s = scaleStats(cls, allyStr, true);
    return {
      id, name, cls, who, team: "ally", x: null, y: null,
      hp: s.hp, maxHp: s.hp, atk: s.atk, defense: s.defense,
      move: s.move, range: s.range, sprite: s.sprite,
      acted: false, sigUsed: false, atkBuff: 0, defBuff: 0,
    };
  });
  const foes: [string, string, SimClass, number, number][] = [
    ["e_as", "Rook-A", "Assault", 18, 3],
    ["e_tk", "Rook-T", "Tank", 18, 5],
    ["e_df", "Rook-D", "Defense", 18, 8],
    ["e_sp", "Rook-S", "Support", 17, 4],
    ["e_cm", "Rook-C", "Command", 17, 7],
  ];
  for (const [id, name, cls, x, y] of foes) {
    const s = scaleStats(cls, opforStr, false);
    units.push({
      id, name, cls, who: null, team: "enemy", x, y,
      hp: s.hp, maxHp: s.hp, atk: s.atk, defense: s.defense,
      move: s.move, range: s.range, sprite: s.sprite,
      acted: false, sigUsed: false, atkBuff: 0, defBuff: 0,
    });
  }
  // normalize OpFor HP to ally total
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
    phase: "deploy",
    turn: 1,
    units,
    selected: allies[0]?.id ?? null,
    mode: "place",
    moveTiles: [...SIM_DEPLOY],
    attackTiles: [],
    movedFrom: null,
    log: `Place all five mechs, then Begin. OpFor STR ${opforStr}.`,
    supportFired: [],
    tauntId: null,
    markedId: null,
    allyStr,
    opforStr,
  };
}

export function tilePassable(x: number, y: number) {
  if (x < 0 || y < 0 || x >= SIM_W || y >= SIM_H) return false;
  return ![3, 4, 5].includes(SIM_MAP[y][x]);
}

export function tileDef(x: number, y: number) {
  return SIM_MAP[y][x] === 2 ? 3 : 0;
}

export function tileImage(x: number, y: number, _deploy = false) {
  const t = SIM_MAP[y][x];
  if (t === 5) return ASSET.simTile("building");
  if (t === 4) return ASSET.simTile("rock");
  if (t === 3) return ASSET.simTile("wall");
  if (t === 2) return ASSET.simTile("rubble");
  if (t === 1) return ASSET.simTile("dirt");
  return ASSET.simTile("grass");
}

export function tileLabel(x: number, y: number) {
  const t = SIM_MAP[y]?.[x];
  if (t === 5) return "Building";
  if (t === 4) return "Rock";
  if (t === 3) return "Wall";
  if (t === 2) return "Cover";
  if (t === 1) return "Path";
  return "Ground";
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
    for (const [nx, ny] of [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]] as [number, number][]) {
      if (!tilePassable(nx, ny)) continue;
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

export function calcDamage(attacker: SimUnit, defender: SimUnit, fatigue: number, markedId: string | null, breach = false) {
  const atk = attacker.atk + attacker.atkBuff;
  const def = defender.defense + defender.defBuff + tileDef(defender.x!, defender.y!);
  let mult = 1.15;
  if (breach) mult *= 1.45;
  if (markedId === defender.id && attacker.team === "ally") mult *= 1.22;
  let dmg = Math.max(2, Math.round((atk - def * 0.28) * mult * 1.2));
  if (attacker.team === "ally") dmg = Math.max(2, Math.round(dmg * fatigueDrillMult(fatigue)));
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
