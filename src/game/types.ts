export type CrewId = "yuu" | "emi" | "yuki" | "naomi" | "kat";
export type PilotId = "emi" | "yuki" | "naomi";
export type ScreenId =
  | "title"
  | "story"
  | "hub"
  | "roster"
  | "report"
  | "drill"
  | "sim"
  | "develop"
  | "doctrine"
  | "bond"
  | "coastal"
  | "gallery"
  | "saves";

/** Progressive simulated battles (replaces mock drills). */
export type SimLevelId = "sim_01" | "sim_02" | "sim_03" | "sim_04";

/** @deprecated kept for old save migration only */
export type DrillId = "drill_01" | "drill_02" | "drill_03";
export type DrillOrder = "strike" | "focus" | "guard" | "breach" | "bulwark" | "mark";
export type MissionStatus = "locked" | "open" | "done";

export interface CrewMember {
  id: CrewId;
  name: string;
  short: string;
  role: string;
  mech: string;
  unit: string;
  personality: string;
  blurb: string;
}

export interface AffinityOption {
  label: string;
  delta: number;
  expr?: string;
  line?: string;
  /** Optional memory key recorded when this choice is picked (e.g. emi_hard). */
  tag?: string;
}

export interface StoryLine {
  speaker?: string | null;
  text: string;
  bg?: string;
  portrait?: { who: CrewId; expr?: string } | null;
  choices?: AffinityOption[];
  choiceWho?: CrewId;
}

export interface NotifyItem {
  id: number;
  text: string;
}
