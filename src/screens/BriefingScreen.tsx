import { useEffect, useMemo, useState } from "react";
import { CharacterPortrait } from "../components/CharacterPortrait";
import { ensureAudio, sfxClick, sfxConfirm } from "../game/audio";
import { ASSET, CREW } from "../game/crew";
import { resolveStory, shuffleOptions } from "../game/content";
import { LOCKED_DIALOG_LINES, ollamaRemixDialogue, probeOllama } from "../game/ollama";
import { useGame } from "../game/store";
import type { AffinityOption, CrewId } from "../game/types";

type LogMsg = { who: string | null; text: string };

export function BriefingScreen() {
  const storyId = useGame((s) => s.storyId);
  const storyIndex = useGame((s) => s.storyIndex);
  const advanceStory = useGame((s) => s.advanceStory);
  const addAffinity = useGame((s) => s.addAffinity);
  const addIntelligence = useGame((s) => s.addIntelligence);
  const addFatigue = useGame((s) => s.addFatigue);
  const markTalked = useGame((s) => s.markTalked);
  const completeLecture = useGame((s) => s.completeLecture);
  const spendDay = useGame((s) => s.spendDay);
  const openHub = useGame((s) => s.openHubWithPriority);
  const markBondSeen = useGame((s) => s.markBondSeen);
  const markCoastalSeen = useGame((s) => s.markCoastalSeen);
  const rememberChoice = useGame((s) => s.rememberChoice);
  const notify = useGame((s) => s.notify);
  const fatigue = useGame((s) => s.fatigue);
  const choiceMemory = useGame((s) => s.choiceMemory);
  const coastalPressure = useGame((s) => s.coastalPressure);
  const lastSimWon = useGame((s) => s.lastSimWon);
  const set = useGame.setState;

  const lines = useMemo(() => {
    if (!storyId) return [];
    return resolveStory(storyId, {
      fatigue,
      choiceMemory,
      coastalPressure,
      lastSimWon,
    });
  }, [storyId, fatigue, choiceMemory, coastalPressure, lastSimWon]);
  const line = lines[storyIndex];
  const [log, setLog] = useState<LogMsg[]>([]);
  const [choices, setChoices] = useState<AffinityOption[] | null>(null);
  const [expr, setExpr] = useState("neutral");
  const [done, setDone] = useState(false);
  const [dialogLive, setDialogLive] = useState(false);
  const [dialogBusy, setDialogBusy] = useState(false);

  useEffect(() => {
    ensureAudio();
  }, []);

  useEffect(() => {
    setLog([]);
    setDone(false);
  }, [storyId]);

  useEffect(() => {
    if (!line) return;
    const baseChoices = line.choices?.length ? shuffleOptions(line.choices) : null;
    setChoices(baseChoices);
    setExpr(line.portrait?.expr ?? "neutral");
    setDialogLive(false);
    setLog((prev) => [...prev, { who: line.speaker ?? null, text: line.text }].slice(-8));

    let cancelled = false;
    setDialogBusy(true);
    (async () => {
      const probe = await probeOllama();
      if (cancelled || !probe.ok) {
        setDialogBusy(false);
        return;
      }
      const remix = await ollamaRemixDialogue({
        models: probe.models,
        speaker: line.speaker,
        who: line.portrait?.who ?? line.choiceWho ?? null,
        text: line.text,
        choices: baseChoices,
      });
      if (cancelled || !remix) {
        setDialogBusy(false);
        return;
      }
      setLog((prev) => {
        if (!prev.length) return prev;
        const copy = [...prev];
        copy[copy.length - 1] = { who: line.speaker ?? null, text: remix.text };
        return copy;
      });
      if (remix.choices) setChoices(remix.choices);
      setDialogLive(true);
      setDialogBusy(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [storyId, storyIndex, line]);

  useEffect(() => {
    if (line || !storyId || done) return;
    setDone(true);
    if (storyId === "chapter1") {
      set({ chapter1IntroDone: true });
      openHub();
    } else if (storyId === "lecture_01") {
      completeLecture();
    } else if (storyId.startsWith("talk_")) {
      markTalked(storyId.replace("talk_", "") as Exclude<CrewId, "yuu">);
      addFatigue(3);
      openHub();
    } else if (storyId.startsWith("outing_")) {
      addFatigue(-14);
      spendDay();
      useGame.setState((st) => ({
        cohesion: Math.min(100, st.cohesion + 5),
      }));
      notify("Outing complete — fatigue down · cohesion +5 · day advanced");
      openHub();
    } else if (storyId.startsWith("bond_")) {
      const m = /^bond_(\w+)_(\d+)$/.exec(storyId);
      if (m) {
        const who = m[1] as Exclude<CrewId, "yuu">;
        const rank = Number(m[2]);
        markBondSeen(who, rank);
        addAffinity(who, 1);
        notify(`Bond Rank ${rank} — ${CREW[who].short}`);
      }
      openHub();
    } else if (storyId === "coastal") {
      markCoastalSeen();
    } else {
      openHub();
    }
  }, [
    line,
    storyId,
    done,
    set,
    openHub,
    completeLecture,
    markTalked,
    addFatigue,
    spendDay,
    notify,
    markBondSeen,
    addAffinity,
    markCoastalSeen,
  ]);

  const portraitWho = line?.portrait?.who;
  const portraitSrc = useMemo(() => {
    if (!portraitWho) return null;
    return ASSET.sprite(portraitWho, expr);
  }, [portraitWho, expr]);

  if (!line) {
    return (
      <div className="briefing">
        <div className="briefing-body">
          <p className="muted">Closing briefing…</p>
        </div>
      </div>
    );
  }

  const onChoice = (opt: AffinityOption) => {
    sfxConfirm();
    if (opt.tag) rememberChoice(opt.tag);
    if (storyId === "lecture_01") {
      if (opt.line === "roles") {
        addIntelligence(3);
        addAffinity("emi", 1);
        addAffinity("yuki", 1);
        addAffinity("naomi", 1);
      } else if (opt.line === "copy") {
        addIntelligence(2);
        (["emi", "yuki", "naomi", "kat"] as const).forEach((w) => addAffinity(w, 1));
      } else {
        addIntelligence(2);
        addAffinity("kat", 1);
        addAffinity("naomi", 1);
      }
      addFatigue(12);
    } else if (line.choiceWho && line.choiceWho !== "yuu" && opt.delta) {
      addAffinity(line.choiceWho, opt.delta);
    }
    if (opt.expr) setExpr(opt.expr);
    if (opt.line && !LOCKED_DIALOG_LINES.has(opt.line)) {
      setLog((prev) => [...prev, { who: line.speaker ?? null, text: opt.line! }].slice(-8));
    }
    setChoices(null);
    advanceStory();
  };

  return (
    <div className="briefing">
      <div className="briefing-art">
        <img className="bg" src={line.bg ?? ASSET.bg("hangar_bay")} alt="" />
        {portraitSrc && (
          <CharacterPortrait
            key={portraitWho}
            src={portraitSrc}
            alt={portraitWho ? CREW[portraitWho].short : ""}
            variant="stage"
          />
        )}
      </div>
      <div className="briefing-body">
        <div className="briefing-live" aria-live="polite">
          {dialogBusy ? "Ollama rewriting…" : dialogLive ? "Live dialogue" : "Script dialogue"}
          {fatigue >= 70 ? " · Winded" : ""}
          {coastalPressure >= 3 ? ` · Coastal ${coastalPressure}/8` : ""}
        </div>
        <div className="briefing-log">
          {log.map((m, i) => (
            <div key={`${i}-${m.text.slice(0, 24)}`} className={`msg${m.who ? "" : " narrator"}`}>
              {m.who && <div className="who">{m.who}</div>}
              <div>{m.text}</div>
            </div>
          ))}
        </div>
        {choices ? (
          <div className={`choice-grid${dialogBusy ? " is-remixing" : ""}`}>
            {choices.map((c, i) => (
              <button
                key={`${i}-${c.delta}-${c.expr ?? ""}`}
                type="button"
                className="btn"
                onClick={() => onChoice(c)}
              >
                {c.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="briefing-nav">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                sfxClick();
                advanceStory();
              }}
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
