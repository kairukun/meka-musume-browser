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
  | "bond"
  | "coastal";

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
