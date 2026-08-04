import type { SimLevelId } from "./types";

export type MapClass = "Assault" | "Tank" | "Defense" | "Support" | "Command";

/** 0 grass, 1 dirt, 2 rubble(+def), 3 border, 4 rock, 5 building */
export type TileGrid = number[][];

export type FoeSpawn = {
  id: string;
  name: string;
  cls: MapClass;
  x: number;
  y: number;
};

export type SimMapDef = {
  id: SimLevelId;
  name: string;
  tip: string;
  map: TileGrid;
  deploy: [number, number][];
  foes: FoeSpawn[];
};

const BORDER_ROW = [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3];

/** Sim 01 — open ruined block (original layout) */
const MAP_01: TileGrid = [
  BORDER_ROW,
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
  BORDER_ROW,
];

/** Sim 02 — crossfire corridors */
const MAP_02: TileGrid = [
  BORDER_ROW,
  [3, 0, 0, 0, 5, 0, 0, 0, 4, 0, 0, 4, 0, 0, 0, 5, 0, 0, 0, 3],
  [3, 0, 1, 0, 5, 0, 1, 0, 0, 2, 2, 0, 0, 1, 0, 5, 0, 1, 0, 3],
  [3, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 3],
  [3, 2, 2, 0, 4, 0, 2, 2, 0, 5, 5, 0, 2, 2, 0, 4, 0, 2, 2, 3],
  [3, 0, 0, 0, 0, 0, 0, 0, 0, 5, 5, 0, 0, 0, 0, 0, 0, 0, 0, 3],
  [3, 0, 0, 0, 0, 0, 0, 0, 0, 5, 5, 0, 0, 0, 0, 0, 0, 0, 0, 3],
  [3, 2, 2, 0, 4, 0, 2, 2, 0, 5, 5, 0, 2, 2, 0, 4, 0, 2, 2, 3],
  [3, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 3],
  [3, 0, 1, 0, 5, 0, 1, 0, 0, 2, 2, 0, 0, 1, 0, 5, 0, 1, 0, 3],
  [3, 0, 0, 0, 5, 0, 0, 0, 4, 0, 0, 4, 0, 0, 0, 5, 0, 0, 0, 3],
  BORDER_ROW,
];

/** Sim 03 — hold the block (defensive rubble pockets left) */
const MAP_03: TileGrid = [
  BORDER_ROW,
  [3, 2, 2, 0, 0, 4, 0, 0, 0, 1, 1, 0, 0, 0, 4, 0, 0, 5, 5, 3],
  [3, 2, 0, 0, 1, 0, 0, 5, 0, 0, 0, 0, 5, 0, 0, 1, 0, 0, 5, 3],
  [3, 0, 0, 1, 0, 0, 0, 5, 0, 2, 2, 0, 5, 0, 0, 0, 1, 0, 0, 3],
  [3, 0, 1, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 1, 0, 3],
  [3, 0, 0, 0, 2, 2, 0, 1, 0, 4, 4, 0, 1, 0, 2, 2, 0, 0, 0, 3],
  [3, 0, 0, 0, 2, 2, 0, 1, 0, 4, 4, 0, 1, 0, 2, 2, 0, 0, 0, 3],
  [3, 0, 1, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 1, 0, 3],
  [3, 0, 0, 1, 0, 0, 0, 5, 0, 2, 2, 0, 5, 0, 0, 0, 1, 0, 0, 3],
  [3, 2, 0, 0, 1, 0, 0, 5, 0, 0, 0, 0, 5, 0, 0, 1, 0, 0, 5, 3],
  [3, 2, 2, 0, 0, 4, 0, 0, 0, 1, 1, 0, 0, 0, 4, 0, 0, 5, 5, 3],
  BORDER_ROW,
];

/** Sim 04 — city core choke */
const MAP_04: TileGrid = [
  BORDER_ROW,
  [3, 5, 5, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 5, 5, 3],
  [3, 5, 0, 0, 1, 0, 0, 0, 2, 5, 5, 2, 0, 0, 0, 1, 0, 0, 5, 3],
  [3, 0, 0, 1, 0, 0, 5, 0, 0, 5, 5, 0, 0, 5, 0, 0, 1, 0, 0, 3],
  [3, 0, 1, 0, 0, 2, 5, 0, 0, 0, 0, 0, 0, 5, 2, 0, 0, 1, 0, 3],
  [3, 0, 0, 0, 2, 2, 0, 0, 1, 0, 0, 1, 0, 0, 2, 2, 0, 0, 0, 3],
  [3, 0, 0, 0, 2, 2, 0, 0, 1, 0, 0, 1, 0, 0, 2, 2, 0, 0, 0, 3],
  [3, 0, 1, 0, 0, 2, 5, 0, 0, 0, 0, 0, 0, 5, 2, 0, 0, 1, 0, 3],
  [3, 0, 0, 1, 0, 0, 5, 0, 0, 5, 5, 0, 0, 5, 0, 0, 1, 0, 0, 3],
  [3, 5, 0, 0, 1, 0, 0, 0, 2, 5, 5, 2, 0, 0, 0, 1, 0, 0, 5, 3],
  [3, 5, 5, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 5, 5, 3],
  BORDER_ROW,
];

const DEPLOY_LEFT: [number, number][] = [
  [1, 3], [1, 4], [1, 5], [1, 6], [1, 7], [1, 8],
  [2, 3], [2, 4], [2, 5], [2, 6], [2, 7], [2, 8],
  [3, 4], [3, 5], [3, 6], [3, 7],
];

export const SIM_MAPS: Record<SimLevelId, SimMapDef> = {
  sim_01: {
    id: "sim_01",
    name: "Ash Plaza",
    tip: "Use rubble (gray) for +DEF. Push Assault up after Tank anchors.",
    map: MAP_01,
    deploy: DEPLOY_LEFT,
    foes: [
      { id: "e_as", name: "Rook-A", cls: "Assault", x: 18, y: 3 },
      { id: "e_tk", name: "Rook-T", cls: "Tank", x: 18, y: 5 },
      { id: "e_df", name: "Rook-D", cls: "Defense", x: 18, y: 8 },
      { id: "e_sp", name: "Rook-S", cls: "Support", x: 17, y: 4 },
      { id: "e_cm", name: "Rook-C", cls: "Command", x: 17, y: 7 },
    ],
  },
  sim_02: {
    id: "sim_02",
    name: "Crossfire Lanes",
    tip: "Center buildings split the board — don’t feed both corridors at once.",
    map: MAP_02,
    deploy: DEPLOY_LEFT,
    foes: [
      { id: "e_as", name: "Lane-A", cls: "Assault", x: 18, y: 2 },
      { id: "e_tk", name: "Lane-T", cls: "Tank", x: 17, y: 5 },
      { id: "e_df", name: "Lane-D", cls: "Defense", x: 18, y: 9 },
      { id: "e_sp", name: "Lane-S", cls: "Support", x: 16, y: 4 },
      { id: "e_cm", name: "Lane-C", cls: "Command", x: 16, y: 7 },
    ],
  },
  sim_03: {
    id: "sim_03",
    name: "Hold Block",
    tip: "Left rubble is your shield. Yuki taunt + Naomi mark wins grinding fights.",
    map: MAP_03,
    deploy: [
      [1, 4], [1, 5], [1, 6], [1, 7],
      [2, 3], [2, 4], [2, 5], [2, 6], [2, 7], [2, 8],
      [3, 4], [3, 5], [3, 6], [3, 7],
    ],
    foes: [
      { id: "e_as", name: "Press-A", cls: "Assault", x: 17, y: 3 },
      { id: "e_as2", name: "Press-A2", cls: "Assault", x: 18, y: 5 },
      { id: "e_tk", name: "Press-T", cls: "Tank", x: 18, y: 7 },
      { id: "e_df", name: "Press-D", cls: "Defense", x: 16, y: 6 },
      { id: "e_cm", name: "Press-C", cls: "Command", x: 17, y: 9 },
    ],
  },
  sim_04: {
    id: "sim_04",
    name: "City Core",
    tip: "Choke points favor Defense range. Don’t overextend Assault alone.",
    map: MAP_04,
    deploy: DEPLOY_LEFT,
    foes: [
      { id: "e_as", name: "Core-A", cls: "Assault", x: 18, y: 3 },
      { id: "e_tk", name: "Core-T", cls: "Tank", x: 17, y: 5 },
      { id: "e_df", name: "Core-D", cls: "Defense", x: 18, y: 8 },
      { id: "e_sp", name: "Core-S", cls: "Support", x: 15, y: 4 },
      { id: "e_cm", name: "Core-C", cls: "Command", x: 16, y: 7 },
    ],
  },
};

export function simMapDef(id: SimLevelId): SimMapDef {
  return SIM_MAPS[id] ?? SIM_MAPS.sim_01;
}
