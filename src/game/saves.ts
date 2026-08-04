import type { GameState } from "./store";

export const SAVE_SLOTS = 3;
const SLOT_PREFIX = "meka-musume-slot-";
const META_KEY = "meka-musume-slot-meta";

export type SlotMeta = {
  label: string;
  savedAt: string | null;
  day: number;
  month: string;
  empty: boolean;
};

function emptyMeta(i: number): SlotMeta {
  return {
    label: `Slot ${i + 1}`,
    savedAt: null,
    day: 1,
    month: "April",
    empty: true,
  };
}

export function listSlotMeta(): SlotMeta[] {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (!raw) return Array.from({ length: SAVE_SLOTS }, (_, i) => emptyMeta(i));
    const parsed = JSON.parse(raw) as SlotMeta[];
    return Array.from({ length: SAVE_SLOTS }, (_, i) => parsed[i] ?? emptyMeta(i));
  } catch {
    return Array.from({ length: SAVE_SLOTS }, (_, i) => emptyMeta(i));
  }
}

function writeMeta(list: SlotMeta[]) {
  localStorage.setItem(META_KEY, JSON.stringify(list));
}

/** Persist current zustand JSON into a named slot (from persist storage). */
export function writeSlot(index: number, state: Partial<GameState>) {
  const snap = {
    ...state,
    savedAt: new Date().toLocaleString(),
  };
  localStorage.setItem(`${SLOT_PREFIX}${index}`, JSON.stringify({ state: snap, version: 4 }));
  const meta = listSlotMeta();
  meta[index] = {
    label: `Slot ${index + 1}`,
    savedAt: snap.savedAt as string,
    day: (snap.gameDay as number) ?? 1,
    month: (snap.gameMonth as string) ?? "April",
    empty: false,
  };
  writeMeta(meta);
}

export function readSlot(index: number): Partial<GameState> | null {
  try {
    const raw = localStorage.getItem(`${SLOT_PREFIX}${index}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: Partial<GameState> };
    return parsed.state ?? null;
  } catch {
    return null;
  }
}

export function clearSlot(index: number) {
  localStorage.removeItem(`${SLOT_PREFIX}${index}`);
  const meta = listSlotMeta();
  meta[index] = emptyMeta(index);
  writeMeta(meta);
}
