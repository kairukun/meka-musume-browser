import { create } from "zustand";
import { persist } from "zustand/middleware";
import { BOND_CREW, CREW, FATIGUE_MAX, INTELLIGENCE_MAX } from "./crew";
import {
  COHESION_MAX,
  CONDITIONING_MAX,
  DOCTRINE_CAP,
  DOCTRINES,
  developmentStrBonus,
  emptyFacilities,
  emptyFrameTuning,
  FACILITIES,
  FRAME_MAX,
  FRAME_TUNE_COST,
  type DoctrineId,
  type FacilityId,
  type FrameClass,
} from "./development";
import {
  affinityRankForValue,
  clamp,
  clampAffinity,
  combatRating,
  dayAgendaLine,
  fatigueLabel,
  opposingSquadStrength,
  pilotAtk,
  pilotDefense,
  pilotMaxHp,
  shortName,
  squadCombatStrength,
} from "./formulas";
import { emptySimCleared, SIM_LEVELS, simLevelDef } from "./simLevels";
import type { CrewId, MissionStatus, NotifyItem, PilotId, ScreenId, SimLevelId } from "./types";

export type AffinityMap = Record<Exclude<CrewId, "yuu">, number>;
export type BondSeen = Record<string, boolean>;

export interface GameState {
  screen: ScreenId;
  storyId: string | null;
  storyIndex: number;
  gameDay: number;
  gameMonth: string;
  playerHp: number;
  playerHpMax: number;
  intelligence: number;
  fatigue: number;
  rank: string;
  affinity: AffinityMap;
  routeFlags: AffinityMap;
  bondSeen: BondSeen;
  hubTalked: Record<Exclude<CrewId, "yuu">, boolean>;
  chapter1IntroDone: boolean;
  lecture01Done: boolean;
  simCleared: Record<SimLevelId, boolean>;
  simBattlesWon: number;
  coastalAlertReady: boolean;
  coastalAlertSeen: boolean;
  activeSim: SimLevelId;
  /** Squad development */
  simCredits: number;
  frameTuning: Record<FrameClass, number>;
  doctrines: DoctrineId[];
  cohesion: number;
  facilities: Record<FacilityId, boolean>;
  conditioning: number;
  pendingDoctrinePick: boolean;
  notifyQueue: NotifyItem[];
  notifySeq: number;
  lastChoiceLine: string | null;
  savedAt: string | null;

  setScreen: (s: ScreenId) => void;
  notify: (text: string) => void;
  clearNotify: (id: number) => void;
  addFatigue: (n: number) => void;
  addIntelligence: (n: number) => void;
  addAffinity: (who: Exclude<CrewId, "yuu">, amount: number) => number;
  spendDay: () => void;
  canTrain: () => boolean;
  squadStr: () => number;
  developmentBonus: () => number;
  opforStr: (mode?: "match" | "sim" | SimLevelId) => number;
  affinityRank: (who: CrewId) => number;
  pendingBond: () => { who: Exclude<CrewId, "yuu">; rank: number } | null;
  markBondSeen: (who: string, rank: number) => void;
  missionStatus: (id: string) => MissionStatus;
  hubObjective: () => string;
  agenda: () => string;
  fatigueText: () => string;
  crewCheckinsDone: () => boolean;
  startStory: (id: string) => void;
  advanceStory: () => void;
  setStoryIndex: (i: number) => void;
  openHubWithPriority: () => void;
  rest: () => void;
  completeLecture: () => void;
  markTalked: (who: Exclude<CrewId, "yuu">) => void;
  startSim: (id: SimLevelId) => void;
  completeSim: (won: boolean, opts?: { clean?: boolean }) => void;
  pickDoctrine: (id: DoctrineId) => void;
  skipDoctrine: () => void;
  tuneFrame: (cls: FrameClass) => boolean;
  buyFacility: (id: FacilityId) => boolean;
  markCoastalSeen: () => void;
  resetGame: () => void;
  saveGame: () => void;
  pilotStats: (who: PilotId) => { atk: number; defense: number; maxHp: number; cr: number };
}

const emptyAffinity = (): AffinityMap => ({
  emi: 0,
  yuki: 0,
  naomi: 0,
  kat: 0,
});

const initial = {
  screen: "title" as ScreenId,
  storyId: null as string | null,
  storyIndex: 0,
  gameDay: 1,
  gameMonth: "April",
  playerHp: 100,
  playerHpMax: 100,
  intelligence: 12,
  fatigue: 8,
  rank: "Cadet",
  affinity: emptyAffinity(),
  routeFlags: emptyAffinity(),
  bondSeen: {} as BondSeen,
  hubTalked: { emi: false, yuki: false, naomi: false, kat: false },
  chapter1IntroDone: false,
  lecture01Done: false,
  simCleared: emptySimCleared(),
  simBattlesWon: 0,
  coastalAlertReady: false,
  coastalAlertSeen: false,
  activeSim: "sim_01" as SimLevelId,
  simCredits: 0,
  frameTuning: emptyFrameTuning(),
  doctrines: [] as DoctrineId[],
  cohesion: 0,
  facilities: emptyFacilities(),
  conditioning: 0,
  pendingDoctrinePick: false,
  notifyQueue: [] as NotifyItem[],
  notifySeq: 0,
  lastChoiceLine: null as string | null,
  savedAt: null as string | null,
};

function migrateSimCleared(raw: Record<string, unknown> | undefined): Record<SimLevelId, boolean> {
  const base = emptySimCleared();
  if (!raw) return base;
  const old = raw as {
    simCleared?: Partial<Record<SimLevelId, boolean>>;
    drill01Done?: boolean;
    drill02Done?: boolean;
    drill03Done?: boolean;
    simBattleDone?: boolean;
  };
  return {
    sim_01: !!(old.simCleared?.sim_01 || old.drill01Done),
    sim_02: !!(old.simCleared?.sim_02 || old.drill02Done),
    sim_03: !!(old.simCleared?.sim_03 || old.drill03Done),
    sim_04: !!(old.simCleared?.sim_04 || old.simBattleDone),
  };
}

export const useGame = create<GameState>()(
  persist(
    (set, get) => ({
      ...initial,

      setScreen: (s) => set({ screen: s }),

      notify: (text) =>
        set((st) => {
          const id = st.notifySeq + 1;
          return {
            notifySeq: id,
            notifyQueue: [...st.notifyQueue.slice(-4), { id, text }],
          };
        }),

      clearNotify: (id) =>
        set((st) => ({
          notifyQueue: st.notifyQueue.filter((n) => n.id !== id),
        })),

      addFatigue: (n) =>
        set((st) => ({
          fatigue: clamp(st.fatigue + n, 0, FATIGUE_MAX),
        })),

      addIntelligence: (n) =>
        set((st) => ({
          intelligence: clamp(st.intelligence + n, 1, INTELLIGENCE_MAX),
        })),

      addAffinity: (who, amount) => {
        const st = get();
        const cur = st.affinity[who];
        const nxt = clampAffinity(cur + amount);
        const gained = nxt - cur;
        if (gained === 0) return 0;
        const oldRank = affinityRankForValue(cur);
        const newRank = affinityRankForValue(nxt);
        set({
          affinity: { ...st.affinity, [who]: nxt },
          routeFlags: {
            ...st.routeFlags,
            [who]: st.routeFlags[who] + Math.max(0, gained),
          },
        });
        if (gained > 0) {
          get().notify(`${shortName(who)} affinity +${gained}`);
          if (newRank > oldRank) {
            get().notify(`${shortName(who)} Bond Rank ${newRank} unlocked`);
          }
        } else {
          get().notify(`${shortName(who)} affinity ${gained}`);
        }
        return gained;
      },

      spendDay: () =>
        set((st) => {
          let day = st.gameDay + 1;
          let month = st.gameMonth;
          while (day > 30) {
            day -= 30;
            month = month === "April" ? "May" : "June";
          }
          return { gameDay: day, gameMonth: month };
        }),

      canTrain: () => get().fatigue < 85,

      squadStr: () => {
        const st = get();
        return squadCombatStrength(st.affinity, st.intelligence, get().developmentBonus());
      },

      developmentBonus: () => {
        const st = get();
        return developmentStrBonus({
          frameTuning: st.frameTuning,
          doctrines: st.doctrines,
          cohesion: st.cohesion,
          facilities: st.facilities,
          conditioning: st.conditioning,
        });
      },

      opforStr: (mode = "match") => opposingSquadStrength(get().squadStr(), mode),

      affinityRank: (who) => {
        if (who === "yuu") return 0;
        return affinityRankForValue(get().affinity[who]);
      },

      pendingBond: () => {
        const st = get();
        for (const who of BOND_CREW) {
          const rank = affinityRankForValue(st.affinity[who]);
          for (let r = 1; r <= rank; r++) {
            const key = `bond_${who}_${r}`;
            if (!st.bondSeen[key]) return { who, rank: r };
          }
        }
        return null;
      },

      markBondSeen: (who, rank) =>
        set((st) => ({
          bondSeen: { ...st.bondSeen, [`bond_${who}_${rank}`]: true },
        })),

      crewCheckinsDone: () => {
        const t = get().hubTalked;
        return t.emi && t.yuki && t.naomi && t.kat;
      },

      missionStatus: (id) => {
        const st = get();
        if (id === "briefing") return st.chapter1IntroDone ? "done" : "open";
        if (id === "meet_crew") {
          if (!st.chapter1IntroDone) return "locked";
          return get().crewCheckinsDone() ? "done" : "open";
        }
        if (id === "lecture_01") {
          if (st.lecture01Done) return "done";
          return st.chapter1IntroDone ? "open" : "locked";
        }
        if (id === "sim_01") {
          if (st.simCleared.sim_01) return "done";
          return get().crewCheckinsDone() && st.lecture01Done ? "open" : "locked";
        }
        if (id === "sim_02") {
          if (st.simCleared.sim_02) return "done";
          return st.simCleared.sim_01 ? "open" : "locked";
        }
        if (id === "sim_03") {
          if (st.simCleared.sim_03) return "done";
          return st.simCleared.sim_02 ? "open" : "locked";
        }
        if (id === "sim_04") {
          if (st.simCleared.sim_04) return "done";
          return st.simCleared.sim_03 ? "open" : "locked";
        }
        if (id === "coastal") {
          if (st.coastalAlertSeen) return "done";
          return st.coastalAlertReady ? "open" : "locked";
        }
        return "locked";
      },

      hubObjective: () => {
        const st = get();
        const pending = get().pendingBond();
        if (pending) {
          return `Bond Rank ${pending.rank} scene queued for ${CREW[pending.who].short} — opening next.`;
        }
        if (st.coastalAlertReady && !st.coastalAlertSeen) {
          return "Next: Coastal alert — Priority feed waiting.";
        }
        if (
          !get().canTrain() &&
          ["sim_01", "sim_02", "sim_03", "sim_04", "lecture_01"].some(
            (m) => get().missionStatus(m) === "open",
          )
        ) {
          return "Next: Rest or outing — fatigue is blocking sims.";
        }
        if (get().missionStatus("meet_crew") === "open") {
          const rem =
            4 -
            [st.hubTalked.emi, st.hubTalked.yuki, st.hubTalked.naomi, st.hubTalked.kat].filter(
              Boolean,
            ).length;
          return `Next: Crew check-ins (${rem} remaining).`;
        }
        if (get().missionStatus("lecture_01") === "open") return "Next: Combat Basics lecture.";
        for (const level of SIM_LEVELS) {
          if (get().missionStatus(level.id) === "open") {
            const opfor = get().opforStr(level.id);
            return `Next: ${level.label} · OpFor Combat STR ${opfor}.`;
          }
        }
        if (SIM_LEVELS.every((l) => st.simCleared[l.id])) {
          return "Sim ladder clear. Replay levels, bond ranks, or rest.";
        }
        return "One major action per day (sim / outing / rest). Talks are free.";
      },

      agenda: () => dayAgendaLine(get().gameMonth, get().gameDay),
      fatigueText: () => fatigueLabel(get().fatigue),

      startStory: (id) => set({ screen: "story", storyId: id, storyIndex: 0, lastChoiceLine: null }),
      advanceStory: () => set((st) => ({ storyIndex: st.storyIndex + 1 })),
      setStoryIndex: (i) => set({ storyIndex: i }),

      openHubWithPriority: () => {
        const st = get();
        if (st.coastalAlertReady && !st.coastalAlertSeen) {
          get().startStory("coastal");
          return;
        }
        const pending = get().pendingBond();
        if (pending) {
          get().startStory(`bond_${pending.who}_${pending.rank}`);
          return;
        }
        set({ screen: "hub" });
      },

      rest: () => {
        const before = get().fatigue;
        const midBand = before >= 35 && before < 85;
        get().addFatigue(-22);
        if (get().facilities.medbay) get().addFatigue(-4);
        get().spendDay();
        if (midBand && get().conditioning < CONDITIONING_MAX) {
          set((st) => ({ conditioning: st.conditioning + 1 }));
          get().notify(
            `Active recovery — Conditioning ${get().conditioning}/${CONDITIONING_MAX} · Squad STR up`,
          );
        } else {
          get().notify("Rested — Fatigue down · day advanced");
        }
        // Outing-adjacent cohesion tick for resting the bay together
        set((st) => ({ cohesion: clamp(st.cohesion + 2, 0, COHESION_MAX) }));
        get().openHubWithPriority();
      },

      completeLecture: () => {
        set({ lecture01Done: true });
        get().spendDay();
        get().notify("Combat Basics — INT up · Squad STR up · day advanced");
        get().openHubWithPriority();
      },

      markTalked: (who) =>
        set((st) => ({
          hubTalked: { ...st.hubTalked, [who]: true },
        })),

      startSim: (id) => set({ activeSim: id, screen: "sim" }),

      completeSim: (won, opts) => {
        const id = get().activeSim;
        const def = simLevelDef(id);
        if (won) {
          const clean = !!opts?.clean;
          const creditGain = clean ? 3 : 2;
          const cohesionGain = clean ? 10 : 5;
          set((st) => ({
            simCleared: { ...st.simCleared, [id]: true },
            simBattlesWon: st.simBattlesWon + 1,
            simCredits: st.simCredits + creditGain,
            cohesion: clamp(st.cohesion + cohesionGain, 0, COHESION_MAX),
            ...(id === "sim_03" && !st.coastalAlertSeen ? { coastalAlertReady: true } : {}),
          }));
          get().addIntelligence(3);
          get().addFatigue(get().facilities.medbay ? 4 : 6);
          get().notify(
            `${def.label} won — +${creditGain} credits · cohesion ${clean ? "+10" : "+5"} · INT +3`,
          );
          get().spendDay();
          if (get().doctrines.length < DOCTRINE_CAP) {
            set({ pendingDoctrinePick: true, screen: "doctrine" });
          } else {
            get().openHubWithPriority();
          }
        } else {
          set((st) => ({
            cohesion: clamp(st.cohesion - 6, 0, COHESION_MAX),
          }));
          get().addFatigue(8);
          get().notify(`${def.label} lost — cohesion −6 · day advanced`);
          get().spendDay();
          get().openHubWithPriority();
        }
      },

      pickDoctrine: (docId) => {
        const st = get();
        if (st.doctrines.includes(docId) || st.doctrines.length >= DOCTRINE_CAP) {
          get().skipDoctrine();
          return;
        }
        set({
          doctrines: [...st.doctrines, docId],
          pendingDoctrinePick: false,
        });
        get().notify(`Doctrine locked — ${DOCTRINES[docId].name} · Squad STR +${DOCTRINES[docId].str}`);
        get().openHubWithPriority();
      },

      skipDoctrine: () => {
        set({ pendingDoctrinePick: false });
        get().notify("Doctrine deferred — slot kept open");
        get().openHubWithPriority();
      },

      tuneFrame: (cls) => {
        const st = get();
        if (st.frameTuning[cls] >= FRAME_MAX) {
          get().notify(`${cls} already at max tune.`);
          return false;
        }
        if (st.simCredits < FRAME_TUNE_COST) {
          get().notify(`Need ${FRAME_TUNE_COST} sim credits to tune.`);
          return false;
        }
        set({
          simCredits: st.simCredits - FRAME_TUNE_COST,
          frameTuning: { ...st.frameTuning, [cls]: st.frameTuning[cls] + 1 },
        });
        get().addFatigue(3);
        get().notify(
          `${cls} frame tuned to Lv${get().frameTuning[cls]} — Squad STR +2 · −${FRAME_TUNE_COST} credits`,
        );
        return true;
      },

      buyFacility: (fid) => {
        const st = get();
        const fac = FACILITIES[fid];
        if (st.facilities[fid]) {
          get().notify(`${fac.name} already online.`);
          return false;
        }
        if (fac.requiresSim && !st.simCleared[fac.requiresSim as SimLevelId]) {
          get().notify(`Clear ${fac.requiresSim.replace("_", " ").toUpperCase()} first.`);
          return false;
        }
        if (st.simCredits < fac.cost) {
          get().notify(`Need ${fac.cost} sim credits.`);
          return false;
        }
        set({
          simCredits: st.simCredits - fac.cost,
          facilities: { ...st.facilities, [fid]: true },
        });
        get().notify(`${fac.name} online — Squad STR +${fac.str}`);
        return true;
      },

      markCoastalSeen: () => {
        set({ coastalAlertSeen: true, coastalAlertReady: false });
        get().addIntelligence(2);
        get().addFatigue(4);
        get().notify("Coastal Alert logged — INT +2 · Installment 2 foreshadowed");
        get().openHubWithPriority();
      },

      resetGame: () =>
        set({
          ...initial,
          affinity: emptyAffinity(),
          routeFlags: emptyAffinity(),
          bondSeen: {},
          hubTalked: { emi: false, yuki: false, naomi: false, kat: false },
          simCleared: emptySimCleared(),
          frameTuning: emptyFrameTuning(),
          facilities: emptyFacilities(),
          doctrines: [],
          simCredits: 0,
          cohesion: 0,
          conditioning: 0,
          pendingDoctrinePick: false,
          notifyQueue: [],
          savedAt: null,
        }),

      saveGame: () => {
        const stamp = new Date().toLocaleString();
        set({ savedAt: stamp });
        get().notify(`Game saved — ${stamp}`);
      },

      pilotStats: (who) => {
        const st = get();
        const cr = combatRating(who, st.affinity, st.intelligence);
        return {
          cr,
          atk: pilotAtk(who, cr),
          defense: pilotDefense(who, cr),
          maxHp: pilotMaxHp(who, cr),
        };
      },
    }),
    {
      name: "meka-musume-save",
      version: 3,
      migrate: (persisted) => {
        const p = (persisted ?? {}) as Record<string, unknown>;
        return {
          ...p,
          simCleared: migrateSimCleared(p),
          activeSim: (p.activeSim as SimLevelId) || "sim_01",
          simCredits: typeof p.simCredits === "number" ? p.simCredits : 0,
          frameTuning: (p.frameTuning as Record<FrameClass, number>) || emptyFrameTuning(),
          doctrines: Array.isArray(p.doctrines) ? (p.doctrines as DoctrineId[]) : [],
          cohesion: typeof p.cohesion === "number" ? p.cohesion : 0,
          facilities: (p.facilities as Record<FacilityId, boolean>) || emptyFacilities(),
          conditioning: typeof p.conditioning === "number" ? p.conditioning : 0,
          pendingDoctrinePick: false,
        };
      },
      partialize: (st) => {
        const {
          setScreen: _a,
          notify: _b,
          clearNotify: _c,
          addFatigue: _d,
          addIntelligence: _e,
          addAffinity: _f,
          spendDay: _g,
          canTrain: _h,
          squadStr: _i,
          developmentBonus: _dev,
          opforStr: _j,
          affinityRank: _k,
          pendingBond: _l,
          markBondSeen: _m,
          missionStatus: _n,
          hubObjective: _o,
          agenda: _p,
          fatigueText: _q,
          crewCheckinsDone: _r,
          startStory: _s,
          advanceStory: _t,
          setStoryIndex: _u,
          openHubWithPriority: _v,
          rest: _w,
          completeLecture: _x,
          markTalked: _y,
          startSim: _z,
          completeSim: _aa,
          pickDoctrine: _pd,
          skipDoctrine: _sd,
          tuneFrame: _tf,
          buyFacility: _bf,
          markCoastalSeen: _ab,
          resetGame: _ac,
          saveGame: _save,
          pilotStats: _ad,
          notifyQueue: _ae,
          ...save
        } = st;
        return save;
      },
    },
  ),
);
