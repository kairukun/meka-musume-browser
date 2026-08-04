import type { EnemyAction } from "./enemyAi";
import { CREW } from "./crew";
import type { AffinityOption, CrewId } from "./types";

const DEFAULT_HOST = "http://127.0.0.1:11434";
/** Dev proxy path (see vite.config) — avoids CORS when using Vite. */
const PROXY_BASE = "/ollama-api";

/** Choice `line` values that drive game logic — never rewrite these. */
export const LOCKED_DIALOG_LINES = new Set(["roles", "copy", "coast"]);

function apiBase(): string {
  if (import.meta.env.DEV) return PROXY_BASE;
  return DEFAULT_HOST;
}

export async function probeOllama(timeoutMs = 2000): Promise<{
  ok: boolean;
  models: string[];
}> {
  const ctrl = new AbortController();
  const t = window.setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${apiBase()}/api/tags`, { signal: ctrl.signal });
    if (!res.ok) return { ok: false, models: [] };
    const data = (await res.json()) as { models?: { name: string }[] };
    const models = (data.models ?? []).map((m) => m.name);
    return { ok: models.length > 0, models };
  } catch {
    return { ok: false, models: [] };
  } finally {
    window.clearTimeout(t);
  }
}

function pickModel(models: string[]): string {
  const prefer = ["llama3.2", "llama3.1", "llama3", "mistral", "phi3", "qwen2.5", "gemma2"];
  for (const p of prefer) {
    const hit = models.find((m) => m === p || m.startsWith(`${p}:`));
    if (hit) return hit;
  }
  return models[0];
}

async function ollamaChatJson<T>(
  models: string[],
  system: string,
  user: string,
  timeoutMs: number,
  options?: { temperature?: number; num_predict?: number },
): Promise<T | null> {
  if (!models.length) return null;
  const model = pickModel(models);
  const ctrl = new AbortController();
  const t = window.setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${apiBase()}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: ctrl.signal,
      body: JSON.stringify({
        model,
        stream: false,
        format: "json",
        options: {
          temperature: options?.temperature ?? 0.7,
          num_predict: options?.num_predict ?? 280,
        },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { message?: { content?: string } };
    const raw = data.message?.content?.trim() ?? "";
    return JSON.parse(raw) as T;
  } catch {
    return null;
  } finally {
    window.clearTimeout(t);
  }
}

/**
 * Ollama chooses among legal actions. Fair academy OpFor — not a tryhard bot.
 */
export async function ollamaPickAction(
  unitName: string,
  unitClass: string,
  actions: EnemyAction[],
  models: string[],
  timeoutMs = 12000,
): Promise<EnemyAction | null> {
  if (!actions.length || !models.length) return null;
  const byFoe = new Map<string, EnemyAction>();
  const advances: EnemyAction[] = [];
  let hold: EnemyAction | null = null;
  for (const a of actions) {
    if (a.blurb.startsWith("Hold")) hold = a;
    else if (a.foeId) {
      if (!byFoe.has(a.foeId)) byFoe.set(a.foeId, a);
    } else if (advances.length < 4) advances.push(a);
  }
  const catalogList = [...byFoe.values(), ...advances];
  if (hold) catalogList.push(hold);
  if (!catalogList.length) catalogList.push(...actions.slice(0, 10));

  const catalog = catalogList.map((a) => `${a.id}: ${a.blurb}`).join("\n");

  const system = `You are OpFor for a Tokyo Kikai Academy training sim (Fire Emblem–style grid).
You are a fair sparring partner for cadets — NOT a tournament bot.
Directives:
- Prefer positional pressure and trades with Assault/Tank.
- Avoid focus-firing the Commander (Command) unless they are the only reachable target or already very low HP.
- Do not always finish wounded units; spreading pressure is fine.
- Holding or advancing without striking is valid when it sets up next turn.
Reply with ONLY JSON: {"id": <number>} using one listed action id.`;

  const user = `Acting unit: ${unitName} (${unitClass})
Choose one legal action:
${catalog}`;

  const parsed = await ollamaChatJson<{ id?: number }>(
    models,
    system,
    user,
    timeoutMs,
    { temperature: 0.6, num_predict: 48 },
  );
  if (parsed?.id == null) return null;
  return catalogList.find((a) => a.id === parsed.id) ?? actions.find((a) => a.id === parsed.id) ?? null;
}

export type RemixResult = {
  text: string;
  choices: AffinityOption[] | null;
};

/**
 * Rephrase a story beat + reply options for variety. Preserves affinity deltas / exprs / locked lines.
 */
export async function ollamaRemixDialogue(opts: {
  models: string[];
  speaker: string | null | undefined;
  who?: CrewId | null;
  text: string;
  choices: AffinityOption[] | null;
  timeoutMs?: number;
}): Promise<RemixResult | null> {
  const { models, speaker, who, text, choices, timeoutMs = 10000 } = opts;
  if (!models.length) return null;

  const crew = who ? CREW[who] : null;
  const voice = crew
    ? `${crew.name} (${crew.short}) — ${crew.role}, personality: ${crew.personality}. ${crew.blurb}`
    : speaker
      ? `Narrator / ${speaker}`
      : "Narrator";

  const choicePayload = (choices ?? []).map((c, i) => ({
    i,
    label: c.label,
    reply: LOCKED_DIALOG_LINES.has(c.line ?? "") ? null : (c.line ?? null),
    lockedReply: LOCKED_DIALOG_LINES.has(c.line ?? ""),
    tone: c.delta > 0 ? "supportive" : c.delta < 0 ? "clumsy/wrong" : "neutral",
  }));

  const system = `You write fresh dialogue for Meka Musume, a mech-academy visual novel (Tokyo Kikai Academy, Team 07).
Keep the SAME meaning and emotional beat. Vary wording so replays feel alive — not a copy-paste of the seed.
Stay in character. Short lines (1–2 sentences max for speech; choice labels under ~12 words).
No meta commentary, no stage directions, no emoji.
If speaker is a narrator (null), keep cinematic third-person.
Reply ONLY JSON:
{"text":"...","choices":[{"i":0,"label":"...","reply":"..."|null}, ...]}
Omit choices array if none were provided. For lockedReply:true choices, set reply to null and only rewrite label.`;

  const user = `Voice: ${voice}
Seed line: ${JSON.stringify(text)}
Seed choices: ${JSON.stringify(choicePayload)}
Rewrite now.`;

  type Raw = {
    text?: string;
    choices?: { i?: number; label?: string; reply?: string | null }[];
  };

  const parsed = await ollamaChatJson<Raw>(models, system, user, timeoutMs, {
    temperature: 0.85,
    num_predict: 320,
  });
  if (!parsed?.text || typeof parsed.text !== "string") return null;

  let nextChoices: AffinityOption[] | null = null;
  if (choices?.length) {
    nextChoices = choices.map((c, i) => {
      const hit = parsed.choices?.find((x) => x.i === i) ?? parsed.choices?.[i];
      const label =
        hit?.label && typeof hit.label === "string" && hit.label.trim()
          ? hit.label.trim()
          : c.label;
      if (LOCKED_DIALOG_LINES.has(c.line ?? "")) {
        return { ...c, label };
      }
      const reply =
        hit?.reply && typeof hit.reply === "string" && hit.reply.trim()
          ? hit.reply.trim()
          : c.line;
      return { ...c, label, line: reply };
    });
  }

  return { text: parsed.text.trim(), choices: nextChoices };
}
