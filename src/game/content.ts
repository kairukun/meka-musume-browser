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
        { label: "I won’t. Clear lanes. Fast calls.", delta: 1, expr: "smirk", line: "Huh. Maybe you’ll last a week." },
        { label: "We’ll keep everyone comfortable.", delta: -1, expr: "angry", line: "Comfortable pilots die first." },
        { label: "Tell me what Striker needs.", delta: 1, expr: "smirk", line: "Clear lanes. Don’t second-guess mid-strike." },
      ],
      choiceWho: "emi",
    },
    {
      bg: ASSET.bg("hangar_bay"),
      portrait: { who: "yuki", expr: "blush" },
      speaker: "Yuki",
      text: "I… hold the line. If that’s okay. Bulwark is heavy, but I can do it.",
      choices: [
        { label: "I trust you to hold. We’ll cover flanks.", delta: 1, expr: "smile", line: "…Okay. I’ll hold." },
        { label: "Just tank the hits. Don’t hesitate.", delta: -1, expr: "blush", line: "I-I’ll try harder. Sorry." },
        { label: "How does Bulwark feel so far?", delta: 1, expr: "blush", line: "Heavier. Safer. Weirdly… okay." },
      ],
      choiceWho: "yuki",
    },
    {
      bg: ASSET.bg("hangar_bay"),
      portrait: { who: "naomi", expr: "neutral" },
      speaker: "Naomi",
      text: "Defense reads two steps ahead. I’ll brief you before each drill. Time is a resource.",
      choices: [
        { label: "Send briefs early. I’ll follow the timeline.", delta: 1, expr: "smile", line: "Efficient. Noted." },
        { label: "We’ll wing it — plans change.", delta: -1, expr: "stern", line: "Plans change. Preparation doesn’t." },
        { label: "What do you need from Command?", delta: 1, expr: "smile", line: "Clear decisions. No vanity calls." },
      ],
      choiceWho: "naomi",
    },
    {
      bg: ASSET.bg("hangar_bay"),
      portrait: { who: "kat", expr: "grin" },
      speaker: "Kat",
      text: "Frames don’t panic. Pilots do. I keep the metal honest — you keep the people pointed.",
      choices: [
        { label: "Coffee and honest redlines. Deal.", delta: 1, expr: "grin", line: "Look at you — learning Tech dialect." },
        { label: "Just keep them green. I handle the rest.", delta: 0, expr: "focused", line: "Fine. Don’t invent mystery faults." },
        { label: "I’ll stay out of the bay unless asked.", delta: -1, expr: "focused", line: "That’s how Command loses the plot." },
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
      portrait: { who: "emi", expr: "angry" },
      speaker: "Emi",
      text: "If training is soft, I’m blaming you. Assault doesn’t wait for permission.",
      choices: [
        { label: "Then we train hard. No excuses.", delta: 1, expr: "smirk", line: "Good." },
        { label: "I’ll try to keep everyone comfortable.", delta: -1, expr: "angry", line: "Comfortable pilots die first." },
        { label: "Tell me what Striker needs from Command.", delta: 1, expr: "smirk", line: "Clear lanes. Fast calls." },
      ],
      choiceWho: "emi",
    },
  ],
  talk_yuki: [
    {
      bg: ASSET.bg("hangar_bay"),
      portrait: { who: "yuki", expr: "blush" },
      speaker: "Yuki",
      text: "The Tank frame is… big. But if I’m in front, maybe everyone else can breathe.",
      choices: [
        { label: "I trust you to hold. We’ll cover your flanks.", delta: 1, expr: "smile", line: "…Okay. I’ll hold." },
        { label: "Stop hesitating — just tank the hits.", delta: -1, expr: "blush", line: "I-I’ll try harder. Sorry." },
        { label: "How does Bulwark feel after calibration?", delta: 1, expr: "blush", line: "Heavier. Safer. Weirdly… okay." },
      ],
      choiceWho: "yuki",
    },
  ],
  talk_naomi: [
    {
      bg: ASSET.bg("hangar_bay"),
      portrait: { who: "naomi", expr: "neutral" },
      speaker: "Naomi",
      text: "Defense means reading the field two steps ahead. I’ll brief you before each drill.",
      choices: [
        { label: "Send the brief early. I’ll follow your timeline.", delta: 1, expr: "smile", line: "Efficient. Noted." },
        { label: "We’ll wing it — plans change.", delta: -1, expr: "stern", line: "Plans change. Preparation doesn’t." },
        { label: "Confirm the clock. Which item first?", delta: 0, expr: "neutral", line: "Acceptable. Item one, then." },
      ],
      choiceWho: "naomi",
    },
  ],
  talk_kat: [
    {
      bg: ASSET.bg("hangar_bay"),
      portrait: { who: "kat", expr: "grin" },
      speaker: "Kat",
      text: "Commander, if you keep walking past my tool cart like scenery, I’m billing you in snacks.",
      choices: [
        { label: "Coffee and honest redlines. Deal.", delta: 1, expr: "grin", line: "Proud of you, boss." },
        { label: "Just keep frames green.", delta: 0, expr: "focused", line: "Fine. No mystery faults." },
        { label: "I’ll stay out of the bay.", delta: -1, expr: "focused", line: "That’s how Command loses the plot." },
      ],
      choiceWho: "kat",
    },
  ],
  outing_emi: [
    {
      bg: ASSET.bg("academy_gate_day"),
      portrait: { who: "emi", expr: "neutral" },
      speaker: "Emi",
      text: "Lunch? Fine. Don’t waste my time with soft talk.",
      choices: [
        { label: "Match her pace — train talk, no fluff.", delta: 1, expr: "smirk", line: "Huh. At least you get it." },
        { label: "Tell her she deserves a soft break.", delta: -1, expr: "angry", line: "Deserve? Soft pilots get soft scores." },
        { label: "Ask what Striker needs pushed next drill.", delta: 1, expr: "smirk", line: "Clear lanes. Don’t second-guess." },
      ],
      choiceWho: "emi",
    },
  ],
  outing_yuki: [
    {
      bg: ASSET.bg("academy_gate_day"),
      portrait: { who: "yuki", expr: "blush" },
      speaker: "Yuki",
      text: "A-ah… lunch? Somewhere quiet, please.",
      choices: [
        { label: "Pick a quiet corner. Let her set the pace.", delta: 1, expr: "smile", line: "Thank you… that helps." },
        { label: "Push her to speak louder.", delta: -1, expr: "blush", line: "I… I’ll try. Sorry." },
        { label: "Ask if Bulwark feels lighter after calibration.", delta: 1, expr: "blush", line: "A little. When you’re clear, I can hold longer." },
      ],
      choiceWho: "yuki",
    },
  ],
  outing_naomi: [
    {
      bg: ASSET.bg("academy_gate_day"),
      portrait: { who: "naomi", expr: "neutral" },
      speaker: "Naomi",
      text: "I scheduled twenty-five minutes. Efficient use of the window, Commander.",
      choices: [
        { label: "Bring a short debrief outline and stick to it.", delta: 1, expr: "smile", line: "Prepared. Good." },
        { label: "Turn it into unstructured small talk.", delta: -1, expr: "stern", line: "Unfocused. We’ll do better next time." },
        { label: "Ask her coastal threat read — timed.", delta: 1, expr: "smile", line: "UN pressure rising. Train accordingly." },
      ],
      choiceWho: "naomi",
    },
  ],
  outing_kat: [
    {
      bg: ASSET.bg("academy_gate_day"),
      portrait: { who: "kat", expr: "grin" },
      speaker: "Kat",
      text: "Outing protocols: snacks first, existential dread second.",
      choices: [
        { label: "Buy the good coffee. Ask about redlines.", delta: 1, expr: "grin", line: "Now you’re speaking Tech." },
        { label: "Make it all shop talk.", delta: 0, expr: "focused", line: "Acceptable. Dense, but acceptable." },
        { label: "Skip her cart notes entirely.", delta: -1, expr: "focused", line: "Rude. And unsafe." },
      ],
      choiceWho: "kat",
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
