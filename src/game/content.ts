import type { AffinityOption, CrewId, StoryLine } from "./types";
import { ASSET } from "./crew";

export const STORIES: Record<string, StoryLine[]> = {
  chapter1: [
    {
      bg: ASSET.bg("academy_gate_day"),
      speaker: null,
      text: "Tokyo Kikai Academy — morning light cuts across the gate. Cadet Commanders funnel in under a sky that still pretends this is peacetime.",
    },
    {
      bg: ASSET.bg("academy_gate_day"),
      portrait: { who: "yuu", expr: "neutral" },
      speaker: "Yuu",
      text: "Bay 07. Team assignment. Don’t freeze on the threshold.",
    },
    {
      bg: ASSET.cg("team_assemble"),
      speaker: null,
      text: "Inside, four faces wait like a formation already mid-brief.",
    },
    {
      bg: ASSET.bg("hangar_bay"),
      portrait: { who: "emi", expr: "angry" },
      speaker: "Emi",
      text: "You’re Command? Don’t slow Assault down with soft calls.",
      choices: [
        { label: "I won’t. Clear lanes. Fast calls.", delta: 1, expr: "smirk", line: "Huh. Maybe you’ll last a week.", tag: "emi_hard" },
        { label: "We’ll keep everyone comfortable.", delta: -1, expr: "angry", line: "Comfortable pilots die first.", tag: "emi_soft" },
        { label: "Tell me what Striker needs.", delta: 1, expr: "smirk", line: "Clear lanes. Don’t second-guess mid-strike.", tag: "emi_hard" },
      ],
      choiceWho: "emi",
    },
    {
      bg: ASSET.bg("hangar_bay"),
      portrait: { who: "yuki", expr: "blush" },
      speaker: "Yuki",
      text: "I… hold the line. If that’s okay. Bulwark is heavy, but I can do it.",
      choices: [
        { label: "I trust you to hold. We’ll cover flanks.", delta: 1, expr: "smile", line: "…Okay. I’ll hold.", tag: "yuki_trust" },
        { label: "Just tank the hits. Don’t hesitate.", delta: -1, expr: "blush", line: "I-I’ll try harder. Sorry.", tag: "yuki_push" },
        { label: "How does Bulwark feel so far?", delta: 1, expr: "blush", line: "Heavier. Safer. Weirdly… okay.", tag: "yuki_trust" },
      ],
      choiceWho: "yuki",
    },
    {
      bg: ASSET.bg("hangar_bay"),
      portrait: { who: "naomi", expr: "neutral" },
      speaker: "Naomi",
      text: "Defense reads two steps ahead. I’ll brief you before each drill. Time is a resource.",
      choices: [
        { label: "Send briefs early. I’ll follow the timeline.", delta: 1, expr: "smile", line: "Efficient. Noted.", tag: "naomi_brief" },
        { label: "We’ll wing it — plans change.", delta: -1, expr: "stern", line: "Plans change. Preparation doesn’t.", tag: "naomi_wing" },
        { label: "What do you need from Command?", delta: 1, expr: "smile", line: "Clear decisions. No vanity calls.", tag: "naomi_brief" },
      ],
      choiceWho: "naomi",
    },
    {
      bg: ASSET.bg("hangar_bay"),
      portrait: { who: "kat", expr: "grin" },
      speaker: "Kat",
      text: "Frames don’t panic. Pilots do. I keep the metal honest — you keep the people pointed.",
      choices: [
        { label: "Coffee and honest redlines. Deal.", delta: 1, expr: "grin", line: "Look at you — learning Tech dialect.", tag: "kat_coffee" },
        { label: "Just keep them green. I handle the rest.", delta: 0, expr: "focused", line: "Fine. Don’t invent mystery faults.", tag: "kat_green" },
        { label: "I’ll stay out of the bay unless asked.", delta: -1, expr: "focused", line: "That’s how Command loses the plot.", tag: "kat_absent" },
      ],
      choiceWho: "kat",
    },
    {
      bg: ASSET.bg("hangar_bay"),
      portrait: { who: "yuu", expr: "neutral" },
      speaker: "Yuu",
      text: "Team 07 is live. Check in. Study. Drill. The coast is already drawing lines on a map Japan pretends not to see.",
    },
  ],

  lecture_01: [
    {
      bg: ASSET.bg("classroom_day"),
      speaker: "Instructor Sato",
      text: "Combat Basics. You will not memorize glory. You will memorize spacing, cover, and who eats the first hit.",
    },
    {
      bg: ASSET.bg("classroom_day"),
      portrait: { who: "emi", expr: "neutral" },
      speaker: "Emi",
      text: "Finally. Something that isn’t ceremony.",
    },
    {
      bg: ASSET.bg("classroom_day"),
      speaker: "Instructor Sato",
      text: "Assault breaks lines. Tank absorbs them. Defense denies the cheap shot. Command decides which truth the squad lives.",
    },
    {
      bg: ASSET.bg("classroom_day"),
      speaker: null,
      text: "During notes, how do you study?",
      choices: [
        { label: "Map roles to Emi / Yuki / Naomi specifically.", delta: 0, line: "roles" },
        { label: "Copy the board and hope it sticks.", delta: 0, line: "copy" },
        { label: "Ask Sato about coastal readiness drills.", delta: 0, line: "coast" },
      ],
      choiceWho: "yuu",
    },
    {
      bg: ASSET.bg("classroom_day"),
      portrait: { who: "yuu", expr: "neutral" },
      speaker: "Yuu",
      text: "Doctrine isn’t abstract when it has faces. Bay 07 just got sharper.",
    },
  ],

  talk_emi: [
    {
      bg: ASSET.bg("hangar_bay"),
      speaker: null,
      text: "Bay heat still clinging to the deck. Emi stretches like she’s already mid-sprint.",
    },
    {
      bg: ASSET.bg("hangar_bay"),
      portrait: { who: "emi", expr: "angry" },
      speaker: "Emi",
      text: "If training is soft, I’m blaming you. Assault doesn’t wait for permission.",
      choices: [
        { label: "Then we train hard. No excuses.", delta: 1, expr: "smirk", line: "Good.", tag: "emi_hard" },
        { label: "I’ll try to keep everyone comfortable.", delta: -1, expr: "angry", line: "Comfortable pilots die first.", tag: "emi_soft" },
        { label: "Tell me what Striker needs from Command.", delta: 1, expr: "smirk", line: "Clear lanes. Fast calls.", tag: "emi_hard" },
      ],
      choiceWho: "emi",
    },
    {
      bg: ASSET.bg("hangar_bay"),
      portrait: { who: "emi", expr: "smirk" },
      speaker: "Emi",
      text: "Don’t make me chase you for the next block. Be ready.",
    },
  ],
  talk_yuki: [
    {
      bg: ASSET.bg("hangar_bay"),
      speaker: null,
      text: "Bulwark’s silhouette fills half the bay. Yuki stands in its shadow like she belongs there — almost.",
    },
    {
      bg: ASSET.bg("hangar_bay"),
      portrait: { who: "yuki", expr: "blush" },
      speaker: "Yuki",
      text: "The Tank frame is… big. But if I’m in front, maybe everyone else can breathe.",
      choices: [
        { label: "I trust you to hold. We’ll cover your flanks.", delta: 1, expr: "smile", line: "…Okay. I’ll hold.", tag: "yuki_trust" },
        { label: "Stop hesitating — just tank the hits.", delta: -1, expr: "blush", line: "I-I’ll try harder. Sorry.", tag: "yuki_push" },
        { label: "How does Bulwark feel after calibration?", delta: 1, expr: "blush", line: "Heavier. Safer. Weirdly… okay.", tag: "yuki_trust" },
      ],
      choiceWho: "yuki",
    },
    {
      bg: ASSET.bg("hangar_bay"),
      portrait: { who: "yuki", expr: "smile" },
      speaker: "Yuki",
      text: "I’ll… be here. When you need the wall.",
    },
  ],
  talk_naomi: [
    {
      bg: ASSET.bg("classroom_day"),
      speaker: null,
      text: "Naomi’s slate is already open — timelines stacked like ammunition.",
    },
    {
      bg: ASSET.bg("classroom_day"),
      portrait: { who: "naomi", expr: "neutral" },
      speaker: "Naomi",
      text: "Defense means reading the field two steps ahead. I’ll brief you before each drill.",
      choices: [
        { label: "Send the brief early. I’ll follow your timeline.", delta: 1, expr: "smile", line: "Efficient. Noted.", tag: "naomi_brief" },
        { label: "We’ll wing it — plans change.", delta: -1, expr: "stern", line: "Plans change. Preparation doesn’t.", tag: "naomi_wing" },
        { label: "Confirm the clock. Which item first?", delta: 0, expr: "neutral", line: "Acceptable. Item one, then.", tag: "naomi_brief" },
      ],
      choiceWho: "naomi",
    },
    {
      bg: ASSET.bg("classroom_day"),
      portrait: { who: "naomi", expr: "smile" },
      speaker: "Naomi",
      text: "Good. Time spent now is time we don’t bleed later.",
    },
  ],
  talk_kat: [
    {
      bg: ASSET.bg("hangar_bay"),
      speaker: null,
      text: "Tool cart, coffee ring, and a wrench that somehow doubles as a pointer.",
    },
    {
      bg: ASSET.bg("hangar_bay"),
      portrait: { who: "kat", expr: "grin" },
      speaker: "Kat",
      text: "Commander, if you keep walking past my tool cart like scenery, I’m billing you in snacks.",
      choices: [
        { label: "Coffee and honest redlines. Deal.", delta: 1, expr: "grin", line: "Proud of you, boss.", tag: "kat_coffee" },
        { label: "Just keep frames green.", delta: 0, expr: "focused", line: "Fine. No mystery faults.", tag: "kat_green" },
        { label: "I’ll stay out of the bay.", delta: -1, expr: "focused", line: "That’s how Command loses the plot.", tag: "kat_absent" },
      ],
      choiceWho: "kat",
    },
    {
      bg: ASSET.bg("hangar_bay"),
      portrait: { who: "kat", expr: "grin" },
      speaker: "Kat",
      text: "Bay’s open. Don’t invent faults I have to invent solutions for.",
    },
  ],
  outing_emi: [
    {
      bg: ASSET.bg("hangar_bay"),
      portrait: { who: "emi", expr: "neutral" },
      speaker: "Emi",
      text: "Lunch? Fine. Don’t waste my time with soft talk — walk and talk or we skip it.",
      choices: [
        { label: "Match her pace — train talk, no fluff.", delta: 1, expr: "smirk", line: "Huh. At least you get it.", tag: "emi_hard" },
        { label: "Tell her she deserves a soft break.", delta: -1, expr: "angry", line: "Deserve? Soft pilots get soft scores.", tag: "emi_soft" },
        { label: "Ask what Striker needs pushed next drill.", delta: 1, expr: "smirk", line: "Clear lanes. Don’t second-guess.", tag: "emi_hard" },
      ],
      choiceWho: "emi",
    },
    {
      bg: ASSET.bg("academy_gate_day"),
      portrait: { who: "emi", expr: "smirk" },
      speaker: "Emi",
      text: "Gate air’s cleaner than the bay. Don’t get used to it — we train harder tomorrow.",
    },
  ],
  outing_yuki: [
    {
      bg: ASSET.bg("academy_gate_day"),
      portrait: { who: "yuki", expr: "blush" },
      speaker: "Yuki",
      text: "A-ah… lunch? Somewhere quiet, please. Away from the loud drills.",
      choices: [
        { label: "Pick a quiet corner. Let her set the pace.", delta: 1, expr: "smile", line: "Thank you… that helps.", tag: "yuki_trust" },
        { label: "Push her to speak louder.", delta: -1, expr: "blush", line: "I… I’ll try. Sorry.", tag: "yuki_push" },
        { label: "Ask if Bulwark feels lighter after calibration.", delta: 1, expr: "blush", line: "A little. When you’re clear, I can hold longer.", tag: "yuki_trust" },
      ],
      choiceWho: "yuki",
    },
    {
      bg: ASSET.bg("classroom_day"),
      portrait: { who: "yuki", expr: "smile" },
      speaker: "Yuki",
      text: "Empty classroom. Soft light. I can… breathe here. Thank you for not rushing.",
    },
  ],
  outing_naomi: [
    {
      bg: ASSET.bg("classroom_day"),
      portrait: { who: "naomi", expr: "neutral" },
      speaker: "Naomi",
      text: "I scheduled twenty-five minutes. Efficient use of the window, Commander.",
      choices: [
        { label: "Bring a short debrief outline and stick to it.", delta: 1, expr: "smile", line: "Prepared. Good.", tag: "naomi_brief" },
        { label: "Turn it into unstructured small talk.", delta: -1, expr: "stern", line: "Unfocused. We’ll do better next time.", tag: "naomi_wing" },
        { label: "Ask her coastal threat read — timed.", delta: 1, expr: "smile", line: "UN pressure rising. Train accordingly.", tag: "naomi_brief" },
      ],
      choiceWho: "naomi",
    },
    {
      bg: ASSET.bg("academy_gate_day"),
      portrait: { who: "naomi", expr: "smile" },
      speaker: "Naomi",
      text: "Window closed on schedule. Productivity isn’t romance — but it is respect.",
    },
  ],
  outing_kat: [
    {
      bg: ASSET.bg("hangar_bay"),
      portrait: { who: "kat", expr: "grin" },
      speaker: "Kat",
      text: "Outing protocols: snacks first, existential dread second. Cart comes with us.",
      choices: [
        { label: "Buy the good coffee. Ask about redlines.", delta: 1, expr: "grin", line: "Now you’re speaking Tech.", tag: "kat_coffee" },
        { label: "Make it all shop talk.", delta: 0, expr: "focused", line: "Acceptable. Dense, but acceptable.", tag: "kat_green" },
        { label: "Skip her cart notes entirely.", delta: -1, expr: "focused", line: "Rude. And unsafe.", tag: "kat_absent" },
      ],
      choiceWho: "kat",
    },
    {
      bg: ASSET.bg("academy_gate_day"),
      portrait: { who: "kat", expr: "grin" },
      speaker: "Kat",
      text: "Sun on the gate, grease on my gloves. Perfect. Don’t spill that coffee near my seals.",
    },
  ],

  hub_loss: [
    {
      bg: ASSET.bg("hangar_bay"),
      portrait: { who: "emi", expr: "angry" },
      speaker: "Emi",
      text: "That sim spanked us. Don’t pretend it didn’t.",
    },
    {
      bg: ASSET.bg("hangar_bay"),
      portrait: { who: "naomi", expr: "stern" },
      speaker: "Naomi",
      text: "Losses are data. We extract the failure points, then we stop repeating them.",
    },
    {
      bg: ASSET.bg("hangar_bay"),
      portrait: { who: "emi", expr: "neutral" },
      speaker: "Emi",
      text: "…She’s right. Next run, we hit harder and smarter. You’re still Command.",
    },
  ],

  coastal: [
    {
      bg: ASSET.bg("classroom_day"),
      speaker: "Instructor Sato",
      text: "Priority feed. All cadet commanders — listen carefully.",
    },
    {
      bg: ASSET.cg("academy_gate"),
      speaker: null,
      text: "A coastal map blooms across the board — Unified Nations hulls as hard white wedges against Japan’s eastern line.",
    },
    {
      bg: ASSET.bg("classroom_day"),
      portrait: { who: "naomi", expr: "stern" },
      speaker: "Naomi",
      text: "The chatter patterns match escalation, not exercises. I’ve been saying that.",
    },
    {
      bg: ASSET.bg("classroom_day"),
      portrait: { who: "emi", expr: "angry" },
      speaker: "Emi",
      text: "Then stop saying it and let us train like it’s already here.",
    },
    {
      bg: ASSET.bg("classroom_day"),
      portrait: { who: "yuu", expr: "concerned" },
      speaker: "Yuu",
      text: "Team 07 — rest when we must. Bond when we can. Train like the map is already bleeding.",
    },
  ],
};

function bondScene(who: CrewId, rank: number, lines: StoryLine[]): void {
  STORIES[`bond_${who}_${rank}`] = lines;
}

bondScene("emi", 1, [
  { bg: ASSET.cg("team_assemble"), speaker: null, text: "Bond Rank 1 — Emi. After hours, Striker’s bay lights are still hot." },
  { bg: ASSET.bg("hangar_bay"), portrait: { who: "emi", expr: "neutral" }, speaker: "Emi", text: "You’re still here. Most Commanders clock out when the board goes green." },
  { bg: ASSET.bg("hangar_bay"), portrait: { who: "yuu", expr: "neutral" }, speaker: "Yuu", text: "Green doesn’t mean done. It means we ask what almost went wrong." },
  { bg: ASSET.bg("hangar_bay"), portrait: { who: "emi", expr: "smirk" }, speaker: "Emi", text: "…Tch. Fine. Stay. Soft-talk me and you get the coolant hose." },
]);
bondScene("emi", 2, [
  { bg: ASSET.bg("academy_gate_day"), portrait: { who: "emi", expr: "angry" }, speaker: "Emi", text: "UN chatter’s getting louder. Don’t tell me you haven’t heard it." },
  { bg: ASSET.bg("academy_gate_day"), portrait: { who: "yuu", expr: "neutral" }, speaker: "Yuu", text: "I hear it. I’m not pretending drills equal coastal fire." },
  { bg: ASSET.bg("academy_gate_day"), portrait: { who: "emi", expr: "smirk" }, speaker: "Emi", text: "Good. When it stops being pretend, I need someone who won’t freeze mid-call." },
]);
bondScene("emi", 3, [
  { bg: ASSET.cg("team_assemble"), portrait: { who: "emi", expr: "smirk" }, speaker: "Emi", text: "If the coast lights up, I go first. That’s Assault. Don’t pull me for ‘safety.’" },
  { bg: ASSET.bg("hangar_bay"), portrait: { who: "yuu", expr: "neutral" }, speaker: "Yuu", text: "I won’t pull you for safety. I’ll pull you when the lane is wrong — and I’ll tell you why." },
  { bg: ASSET.bg("hangar_bay"), portrait: { who: "emi", expr: "neutral" }, speaker: "Emi", text: "…That’s the only kind of Command I respect." },
]);
bondScene("yuki", 1, [
  { bg: ASSET.cg("hangar_arrival"), speaker: null, text: "Bond Rank 1 — Yuki." },
  { bg: ASSET.bg("hangar_bay"), portrait: { who: "yuki", expr: "blush" }, speaker: "Yuki", text: "Um… Bulwark’s calibration log is long. I thought you might want the soft parts." },
  { bg: ASSET.bg("hangar_bay"), portrait: { who: "yuu", expr: "smile" }, speaker: "Yuu", text: "I want whatever keeps you standing. Soft parts included." },
]);
bondScene("yuki", 2, [
  { bg: ASSET.bg("classroom_day"), portrait: { who: "yuki", expr: "blush" }, speaker: "Yuki", text: "When everyone looks at me, I feel like the wall and the person hiding behind it." },
  { bg: ASSET.bg("classroom_day"), portrait: { who: "yuu", expr: "neutral" }, speaker: "Yuu", text: "You’re allowed to be both. The squad doesn’t need a statue — it needs you." },
]);
bondScene("yuki", 3, [
  { bg: ASSET.cg("hangar_arrival"), portrait: { who: "yuki", expr: "smile" }, speaker: "Yuki", text: "If the war comes inland… I’ll hold. Because you asked — and you meant it." },
  { bg: ASSET.bg("hangar_bay"), portrait: { who: "yuu", expr: "neutral" }, speaker: "Yuu", text: "Holding isn’t dying alone. We cover you back." },
]);
bondScene("naomi", 1, [
  { bg: ASSET.cg("academy_gate"), speaker: null, text: "Bond Rank 1 — Naomi." },
  { bg: ASSET.bg("classroom_day"), portrait: { who: "naomi", expr: "neutral" }, speaker: "Naomi", text: "I annotated today’s doctrine against our last drill. You’re improving. Unevenly." },
  { bg: ASSET.bg("classroom_day"), portrait: { who: "yuu", expr: "neutral" }, speaker: "Yuu", text: "I’ll take uneven over blind. Mark the gaps." },
]);
bondScene("naomi", 2, [
  { bg: ASSET.bg("hangar_bay"), portrait: { who: "naomi", expr: "stern" }, speaker: "Naomi", text: "Coastal pressure models don’t care about our feelings. Neither should Command." },
  { bg: ASSET.bg("hangar_bay"), portrait: { who: "yuu", expr: "neutral" }, speaker: "Yuu", text: "Feelings still move pilots. I won’t ignore either column." },
]);
bondScene("naomi", 3, [
  { bg: ASSET.bg("classroom_day"), portrait: { who: "naomi", expr: "smile" }, speaker: "Naomi", text: "When Installment Two arrives, I want my brief on your slate first." },
  { bg: ASSET.bg("classroom_day"), portrait: { who: "yuu", expr: "neutral" }, speaker: "Yuu", text: "First read. Every time. That’s a promise, not a courtesy." },
]);
bondScene("kat", 1, [
  { bg: ASSET.cg("hangar_arrival"), speaker: null, text: "Bond Rank 1 — Kat." },
  { bg: ASSET.bg("hangar_bay"), portrait: { who: "kat", expr: "grin" }, speaker: "Kat", text: "If you keep walking past my tool cart like scenery, I’m billing you in snacks." },
]);
bondScene("kat", 2, [
  { bg: ASSET.bg("hangar_bay"), portrait: { who: "kat", expr: "focused" }, speaker: "Kat", text: "Frames don’t panic. Pilots do. My job is fewer places for panic to hide." },
  { bg: ASSET.bg("hangar_bay"), portrait: { who: "yuu", expr: "neutral" }, speaker: "Yuu", text: "And mine is not inventing new panic for you to chase." },
]);
bondScene("kat", 3, [
  { bg: ASSET.bg("hangar_bay"), portrait: { who: "kat", expr: "grin" }, speaker: "Kat", text: "When the coast goes loud, Bay 07 doesn’t get a vacation. I’ll keep them breathing — you keep them pointed." },
  { bg: ASSET.bg("hangar_bay"), portrait: { who: "yuu", expr: "neutral" }, speaker: "Yuu", text: "Deal. You call the metal. I call the people." },
]);

export function shuffleOptions<T extends AffinityOption>(opts: T[]): T[] {
  const a = [...opts];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export type StoryCtx = {
  fatigue: number;
  choiceMemory: Record<string, string>;
  coastalPressure: number;
  lastSimWon: boolean | null;
};

const RECALL_BEATS: Record<string, StoryLine> = {
  emi_hard: {
    bg: ASSET.bg("hangar_bay"),
    portrait: { who: "emi", expr: "smirk" },
    speaker: "Emi",
    text: "Still pushing hard like last time? Good. Soft Command doesn’t get a second chance with me.",
  },
  emi_soft: {
    bg: ASSET.bg("hangar_bay"),
    portrait: { who: "emi", expr: "angry" },
    speaker: "Emi",
    text: "Last chat you went soft. Don’t do that again — Assault eats comfort for breakfast.",
  },
  yuki_trust: {
    bg: ASSET.bg("hangar_bay"),
    portrait: { who: "yuki", expr: "smile" },
    speaker: "Yuki",
    text: "You… trusted me before. I still remember that. It helps when Bulwark feels too big.",
  },
  yuki_push: {
    bg: ASSET.bg("hangar_bay"),
    portrait: { who: "yuki", expr: "blush" },
    speaker: "Yuki",
    text: "Last time you pushed hard… I flinched. I’ll try not to. Please be patient?",
  },
  naomi_brief: {
    bg: ASSET.bg("classroom_day"),
    portrait: { who: "naomi", expr: "smile" },
    speaker: "Naomi",
    text: "You respected the brief last time. Continuity is a force multiplier — keep it.",
  },
  naomi_wing: {
    bg: ASSET.bg("classroom_day"),
    portrait: { who: "naomi", expr: "stern" },
    speaker: "Naomi",
    text: "You winged it before. I’m giving you another chance to use a timeline.",
  },
  kat_coffee: {
    bg: ASSET.bg("hangar_bay"),
    portrait: { who: "kat", expr: "grin" },
    speaker: "Kat",
    text: "Coffee Commander returns. Redlines are warmer when the brew is honest.",
  },
  kat_green: {
    bg: ASSET.bg("hangar_bay"),
    portrait: { who: "kat", expr: "focused" },
    speaker: "Kat",
    text: "Still on the ‘keep them green’ diet? Fine. I’ll translate metal into English.",
  },
  kat_absent: {
    bg: ASSET.bg("hangar_bay"),
    portrait: { who: "kat", expr: "focused" },
    speaker: "Kat",
    text: "You tried ghosting the bay once. Cart remembers. Don’t do that again.",
  },
};

const TALK_RECALL_KEYS: Record<string, string[]> = {
  talk_emi: ["emi_hard", "emi_soft"],
  talk_yuki: ["yuki_trust", "yuki_push"],
  talk_naomi: ["naomi_brief", "naomi_wing"],
  talk_kat: ["kat_coffee", "kat_green", "kat_absent"],
  outing_emi: ["emi_hard", "emi_soft"],
  outing_yuki: ["yuki_trust", "yuki_push"],
  outing_naomi: ["naomi_brief", "naomi_wing"],
  outing_kat: ["kat_coffee", "kat_green", "kat_absent"],
};

function tiredBeat(id: string): StoryLine {
  const who = id.includes("emi")
    ? ("emi" as const)
    : id.includes("yuki")
      ? ("yuki" as const)
      : id.includes("naomi")
        ? ("naomi" as const)
        : id.includes("kat")
          ? ("kat" as const)
          : null;
  if (who === "emi") {
    return {
      bg: ASSET.bg("hangar_bay"),
      portrait: { who: "emi", expr: "angry" },
      speaker: "Emi",
      text: "You’re winded. Don’t drag that into my lane — catch your breath or keep up.",
    };
  }
  if (who === "yuki") {
    return {
      bg: ASSET.bg("hangar_bay"),
      portrait: { who: "yuki", expr: "blush" },
      speaker: "Yuki",
      text: "You look tired… We can go slow. I don’t mind.",
    };
  }
  if (who === "naomi") {
    return {
      bg: ASSET.bg("classroom_day"),
      portrait: { who: "naomi", expr: "stern" },
      speaker: "Naomi",
      text: "Fatigue is visible. Shorten this exchange — efficiency over endurance theater.",
    };
  }
  if (who === "kat") {
    return {
      bg: ASSET.bg("hangar_bay"),
      portrait: { who: "kat", expr: "focused" },
      speaker: "Kat",
      text: "Boss, you’re running on fumes. Sit before you lean on something expensive.",
    };
  }
  return {
    bg: ASSET.bg("hangar_bay"),
    speaker: null,
    text: "Your legs feel heavy. Even a short talk costs more when the body’s already spent.",
  };
}

function findChoiceIndex(lines: StoryLine[]): number {
  return lines.findIndex((l) => l.choices && l.choices.length > 0);
}

/** Resolve a story id with fatigue / memory / pressure-aware prepends and swaps. */
export function resolveStory(id: string, ctx: StoryCtx): StoryLine[] {
  const base = STORIES[id];
  if (!base?.length) return [];

  const lines = base.map((l) => ({ ...l, choices: l.choices ? [...l.choices] : undefined }));

  if (id === "hub_loss") return lines;

  const head: StoryLine[] = [];
  const beforeChoice: StoryLine[] = [];

  if (ctx.fatigue >= 70 && (id.startsWith("talk_") || id.startsWith("outing_"))) {
    head.push(tiredBeat(id));
  }

  const recallKeys = TALK_RECALL_KEYS[id];
  if (recallKeys) {
    for (const key of recallKeys) {
      if (ctx.choiceMemory[key] && RECALL_BEATS[key]) {
        beforeChoice.push({ ...RECALL_BEATS[key] });
        break;
      }
    }
  }

  if (id === "coastal" && ctx.coastalPressure >= 3 && !ctx.choiceMemory.coastal_pressure_seen) {
    head.push({
      bg: ASSET.bg("classroom_day"),
      speaker: null,
      text: "The coastal feed feels louder today — pressure marks stacked thicker on every map edge.",
    });
  }

  if (!head.length && !beforeChoice.length) return lines;

  const choiceIdx = findChoiceIndex(lines);
  if (choiceIdx >= 0 && beforeChoice.length) {
    return [
      ...head,
      ...lines.slice(0, choiceIdx),
      ...beforeChoice,
      ...lines.slice(choiceIdx),
    ];
  }
  return [...head, ...lines];
}
