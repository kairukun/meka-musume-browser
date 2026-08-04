import { useEffect, useMemo, useRef, useState } from "react";
import { CharacterPortrait } from "../components/CharacterPortrait";
import { ASSET, CREW, SIGNATURE_LABEL } from "../game/crew";
import {
  applyEnemyAction,
  endEnemyPhase,
  getOllamaEnabled,
  listEnemyActions,
  pickHeuristicAction,
  setOllamaEnabled,
} from "../game/enemyAi";
import { ollamaPickAction, probeOllama } from "../game/ollama";
import { ensureAudio, sfxHit, sfxLose, sfxWin } from "../game/audio";
import {
  SIM_H,
  SIM_W,
  allAlliesPlaced,
  attackTiles,
  bfsMove,
  calcDamage,
  checkEnd,
  createSimBattle,
  tileDef,
  tileImage,
  tileLabel,
  unitAt,
  type SimBattle,
  type SimUnit,
} from "../game/sim";
import { useGame } from "../game/store";
import type { CrewId } from "../game/types";

const CLASS_ICON: Record<string, string> = {
  Assault: "⚔",
  Tank: "🛡",
  Defense: "◎",
  Support: "✦",
  Command: "★",
};

export function SimScreen() {
  const setScreen = useGame((s) => s.setScreen);
  const allyStr = useGame((s) => s.squadStr());
  const activeSim = useGame((s) => s.activeSim);
  const opforStr = useGame((s) => s.opforStr(activeSim));
  const fatigue = useGame((s) => s.fatigue);
  const completeSim = useGame((s) => s.completeSim);
  const frameTuning = useGame((s) => s.frameTuning);
  const doctrines = useGame((s) => s.doctrines);
  const [battle, setBattle] = useState<SimBattle>(() =>
    createSimBattle(allyStr, opforStr, { frameTuning, doctrines, levelId: activeSim }),
  );
  const [cursor, setCursor] = useState<[number, number] | null>(null);
  const selected = battle.units.find((u) => u.id === battle.selected) ?? null;
  const hoverUnit = cursor ? unitAt(battle, cursor[0], cursor[1]) : null;
  const focus = hoverUnit ?? selected ?? battle.units.find((u) => u.team === "ally" && u.hp > 0) ?? null;
  const terrain = cursor
    ? { label: tileLabel(battle.map, cursor[0], cursor[1]), def: tileDef(battle.map, cursor[0], cursor[1]) }
    : { label: "Ash Plaza", def: 0 };

  const levelLabel = activeSim.replace("_", " ").toUpperCase();

  const forecast = useMemo(() => {
    if (!selected || battle.mode !== "act" || !hoverUnit || hoverUnit.team !== "enemy") return null;
    if (!battle.attackTiles.some(([ax, ay]) => ax === hoverUnit.x && ay === hoverUnit.y)) return null;
    const dmg = calcDamage(selected, hoverUnit, fatigue, battle.markedId, false, doctrines, battle.map);
    return { dmg, target: hoverUnit };
  }, [selected, battle.mode, battle.attackTiles, battle.markedId, hoverUnit, fatigue, doctrines]);

  const [useOllama, setUseOllama] = useState(() => getOllamaEnabled());
  const [ollamaReady, setOllamaReady] = useState(false);
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [aiThinking, setAiThinking] = useState(false);
  const [ollamaError, setOllamaError] = useState<string | null>(null);
  const [showTutorial, setShowTutorial] = useState(() => !useGame.getState().tutorialDone);
  const [debrief, setDebrief] = useState<null | {
    won: boolean;
    clean: boolean;
    mvp: string;
    downed: string[];
    tip: string;
  }>(null);
  const enemyBusy = useRef(false);
  const finishSent = useRef(false);

  useEffect(() => { ensureAudio(); }, []);

  useEffect(() => {
    let alive = true;
    if (useOllama) {
      void probeOllama().then((r) => {
        if (!alive) return;
        setOllamaReady(r.ok);
        setOllamaModels(r.models);
      });
    }
    return () => { alive = false; };
  }, [useOllama]);

  useEffect(() => {
    if (battle.phase !== "enemy") {
      enemyBusy.current = false;
      setAiThinking(false);
      return;
    }
    if (enemyBusy.current) return;
    enemyBusy.current = true;
    let cancelled = false;

    const run = async () => {
      const snap = battle;
      const ready = snap.units.filter((u) => u.team === "enemy" && u.hp > 0 && !u.acted);
      if (!ready.length) {
        if (!cancelled) { setBattle(endEnemyPhase(snap)); enemyBusy.current = false; }
        return;
      }
      const unit = ready[0];
      const allies = snap.units.filter((u) => u.team === "ally" && u.hp > 0 && u.x != null);
      if (!allies.length) {
        if (!cancelled) { setBattle({ ...snap, phase: "lose" }); enemyBusy.current = false; }
        return;
      }

      const actions = listEnemyActions(snap, unit, fatigue, doctrines);
      let pick = pickHeuristicAction(actions);

      if (useOllama) {
        let models = ollamaModels;
        let readyOk = ollamaReady;
        if (!readyOk || !models.length) {
          const r = await probeOllama();
          readyOk = r.ok;
          models = r.models;
          setOllamaReady(r.ok);
          setOllamaModels(r.models);
        }
        if (readyOk && models.length) {
          setAiThinking(true);
          setOllamaError(null);
          const llm = await ollamaPickAction(unit.name, unit.cls, actions, models);
          setAiThinking(false);
          if (llm) pick = llm;
          else setOllamaError("Ollama missed — academy OpFor.");
        } else {
          setOllamaError("Ollama offline — academy OpFor active.");
          await new Promise((r) => window.setTimeout(r, 220));
        }
      } else {
        await new Promise((r) => window.setTimeout(r, 260));
      }

      if (cancelled || !pick) { enemyBusy.current = false; return; }
      if (pick.foeId) sfxHit();
      setBattle(applyEnemyAction(snap, unit.id, pick, fatigue, doctrines));
      enemyBusy.current = false;
    };
    void run();
    return () => { cancelled = true; };
  }, [battle.phase, battle.units, fatigue, doctrines, useOllama, ollamaReady, ollamaModels]);

  useEffect(() => {
    if (battle.phase !== "win" && battle.phase !== "lose") return;
    if (finishSent.current || debrief) return;
    finishSent.current = true;
    const allies = battle.units.filter((u) => u.team === "ally");
    const clean = allies.every((u) => u.hp > 0);
    const living = allies.filter((u) => u.hp > 0).sort((a, c) => c.hp / c.maxHp - a.hp / a.maxHp);
    const downed = allies.filter((u) => u.hp <= 0).map((u) => u.name);
    if (battle.phase === "win") sfxWin();
    else sfxLose();
    setDebrief({
      won: battle.phase === "win",
      clean,
      mvp: living[0]?.name ?? "Team 07",
      downed,
      tip: battle.tip,
    });
  }, [battle.phase, battle.units, debrief]);

  const phaseLabel =
    battle.phase === "deploy"
      ? "Deploy"
      : battle.phase === "enemy"
        ? "Enemy Phase"
        : battle.phase === "player"
          ? "Player Phase"
          : battle.phase === "win"
            ? "Victory"
            : "Defeat";

  return (
    <div className="simfe">
      <div className="simfe-stage">
        <div className="simfe-board">
          {Array.from({ length: SIM_H * SIM_W }, (_, i) => {
            const x = i % SIM_W;
            const y = Math.floor(i / SIM_W);
            const deploySpot =
              battle.phase === "deploy" && battle.deploy.some(([dx, dy]) => dx === x && dy === y);
            const move = battle.moveTiles.some(([mx, my]) => mx === x && my === y);
            const atk = battle.attackTiles.some(([ax, ay]) => ax === x && ay === y);
            const u = unitAt(battle, x, y);
            const blocked = [3, 4, 5].includes(battle.map[y][x]);
            return (
              <button
                key={`${x}-${y}`}
                type="button"
                className={[
                  "simfe-cell",
                  deploySpot ? "deploy" : "",
                  move ? "move" : "",
                  atk ? "atk" : "",
                  blocked ? "blocked" : "",
                  cursor && cursor[0] === x && cursor[1] === y ? "cursor" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                style={{ backgroundImage: `url(${tileImage(battle.map, x, y)})` }}
                onMouseEnter={() => setCursor([x, y])}
                onFocus={() => setCursor([x, y])}
                onClick={() => setBattle((b) => clickTile(b, x, y, fatigue, doctrines))}
              >
                {u && (
                  <div
                    className={[
                      "simfe-unit",
                      u.team,
                      u.acted && u.team === "ally" ? "acted" : "",
                      battle.selected === u.id ? "selected" : "",
                      battle.markedId === u.id ? "marked" : "",
                      battle.tauntId === u.id ? "taunt" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <span className="simfe-class" aria-hidden>
                      {CLASS_ICON[u.cls]}
                    </span>
                    <img src={ASSET.simUnit(u.team, u.sprite)} alt={u.name} />
                    <div className={`simfe-hpbar ${u.team}`}>
                      <span style={{ width: `${(u.hp / u.maxHp) * 100}%` }} />
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="simfe-hud">
        <div className="simfe-chip terrain">
          <strong>{terrain.label}</strong>
          {terrain.def > 0 && <span>Def +{terrain.def}</span>}
        </div>

        <div className="simfe-chip phase">
          <span>{levelLabel}</span>
          <strong>{phaseLabel}</strong>
          <span>
            Turn {battle.turn} · OpFor STR {opforStr}
            {aiThinking ? " · Ollama thinking…" : ""}
          </span>
        </div>

        <div className="simfe-chip log">{battle.log}</div>

        <div className="simfe-chip tip-chip">{battle.tip}</div>
        <label className="simfe-chip ollama-toggle">
          <input
            type="checkbox"
            checked={useOllama}
            onChange={(e) => {
              setUseOllama(e.target.checked);
              setOllamaEnabled(e.target.checked);
              setOllamaError(null);
            }}
          />
          <span>
            Ollama OpFor
            {useOllama ? (ollamaReady ? " · online" : " · offline→academy") : " · academy AI"}
          </span>
        </label>
        {ollamaError && <div className="simfe-chip ollama-err">{ollamaError}</div>}

        {focus && (
          <div className={`simfe-unitpanel ${focus.team}`}>
            <div className="simfe-portrait">
              {focus.who ? (
                <CharacterPortrait src={ASSET.sprite(focus.who)} variant="thumb" />
              ) : (
                <img src={ASSET.simUnit(focus.team, focus.sprite)} alt="" />
              )}
            </div>
            <div className="simfe-unitmeta">
              <div className="name">{focus.name}</div>
              <div className="sub">
                {focus.cls}
                {focus.who ? ` · ${CREW[focus.who as CrewId].unit}` : " · OpFor"}
              </div>
              <div className="mov">Mov {focus.move}</div>
            </div>
          </div>
        )}

        {focus && (
          <div className="simfe-hp">
            HP{" "}
            <strong>
              {focus.hp}
              <span> / {focus.maxHp}</span>
            </strong>
            {forecast && (
              <em>
                → {Math.max(0, forecast.target.hp - forecast.dmg)} (−{forecast.dmg})
              </em>
            )}
          </div>
        )}

        {focus && (
          <div className="simfe-stats">
            <div>
              <span>Atk</span>
              <strong>{focus.atk + focus.atkBuff}</strong>
            </div>
            <div>
              <span>Def</span>
              <strong>{focus.defense + focus.defBuff}</strong>
            </div>
            <div>
              <span>Rng</span>
              <strong>
                {focus.range[0]}–{focus.range[1]}
              </strong>
            </div>
            <div>
              <span>STR</span>
              <strong>{focus.team === "ally" ? allyStr : opforStr}</strong>
            </div>
          </div>
        )}

        <div className="simfe-minimap" aria-hidden>
          {Array.from({ length: SIM_H * SIM_W }, (_, i) => {
            const x = i % SIM_W;
            const y = Math.floor(i / SIM_W);
            const t = battle.map[y][x];
            const u = unitAt(battle, x, y);
            return (
              <i
                key={i}
                className={[
                  t === 3 || t === 4 || t === 5 ? "block" : t === 2 ? "cover" : t === 1 ? "path" : "g",
                  u ? u.team : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              />
            );
          })}
        </div>

        <div className="simfe-actions">
          {battle.phase === "deploy" && (
            <>
              <div className="simfe-deploy-row">
                {battle.units
                  .filter((u) => u.team === "ally")
                  .map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      className={`simfe-deploy-btn${battle.selected === u.id ? " on" : ""}${u.x != null ? " placed" : ""}`}
                      onClick={() =>
                        setBattle((b) => ({
                          ...b,
                          selected: u.id,
                          mode: "place",
                          moveTiles: [...b.deploy],
                          log: `Place ${u.name} on a blue tile.`,
                        }))
                      }
                    >
                      <img src={ASSET.simUnit("ally", u.sprite)} alt="" />
                      <span>{u.name}</span>
                    </button>
                  ))}
              </div>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!allAlliesPlaced(battle)}
                onClick={() =>
                  setBattle((b) => ({
                    ...b,
                    phase: "enemy",
                    mode: "select",
                    moveTiles: [],
                    attackTiles: [],
                    selected: null,
                    log: "Deployment locked. OpFor advancing.",
                  }))
                }
              >
                Begin Battle
              </button>
            </>
          )}

          {battle.phase === "player" && battle.mode === "act" && selected && (
            <>
              {!selected.sigUsed && selected.who && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setBattle((b) => useSignature(b, fatigue, doctrines))}
                >
                  {SIGNATURE_LABEL[selected.who]}
                </button>
              )}
              <button
                type="button"
                className="btn"
                onClick={() =>
                  setBattle((b) => {
                    const u = b.units.find((x) => x.id === b.selected);
                    if (!u) return b;
                    const acted = { ...u, acted: true };
                    const next = {
                      ...b,
                      units: b.units.map((x) => (x.id === u.id ? acted : x)),
                      log: `${u.name} waits.`,
                      selected: null,
                      mode: "select" as const,
                      moveTiles: [],
                      attackTiles: [],
                    };
                    return finishUnit(trySupport(next, acted, doctrines), acted);
                  })
                }
              >
                Wait
              </button>
            </>
          )}

          {battle.phase === "player" && battle.mode === "select" && (
            <button
              type="button"
              className="btn"
              onClick={() =>
                setBattle((b) => ({
                  ...b,
                  phase: "enemy",
                  units: b.units.map((u) => (u.team === "ally" ? { ...u, acted: true } : u)),
                  selected: null,
                  moveTiles: [],
                  attackTiles: [],
                  log: "Ending player phase…",
                }))
              }
            >
              End Phase
            </button>
          )}

          <button type="button" className="btn btn-ghost" onClick={() => setScreen("hub")}>
            Abort
          </button>
        </div>
      </div>

      {showTutorial && (
        <div className="sim-overlay">
          <div className="sim-overlay-card">
            <h2>Combat Basics</h2>
            <ol>
              <li>Deploy all five on blue tiles, then Begin.</li>
              <li>Select → move (blue) → attack red tiles or use a signature.</li>
              <li>Rubble grants DEF. Fatigue softens your hits and worsens theirs.</li>
              <li>Academy AI is default; enable Ollama for LLM OpFor.</li>
            </ol>
            <p className="muted">{battle.tip}</p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                useGame.getState().markTutorialDone();
                setShowTutorial(false);
              }}
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {debrief && (
        <div className="sim-overlay">
          <div className="sim-overlay-card">
            <h2>{debrief.won ? "Sim Debrief — Victory" : "Sim Debrief — Defeat"}</h2>
            <p>
              MVP: <strong>{debrief.mvp}</strong>
              {debrief.clean ? " · Clean run" : ""}
            </p>
            {debrief.downed.length > 0 && (
              <p className="muted">Downed: {debrief.downed.join(", ")}</p>
            )}
            <p className="muted">{debrief.tip}</p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                const d = debrief;
                setDebrief(null);
                completeSim(d.won, { clean: d.clean });
              }}
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function finishUnit(battle: SimBattle, _u: SimUnit): SimBattle {
  const end = checkEnd(battle);
  if (end) return { ...battle, phase: end };
  const ready = battle.units.filter((x) => x.team === "ally" && x.hp > 0 && !x.acted && x.x != null);
  if (!ready.length) return { ...battle, phase: "enemy", selected: null, mode: "select" };
  return { ...battle, selected: null, mode: "select", moveTiles: [], attackTiles: [], movedFrom: null };
}

function clickTile(
  battle: SimBattle,
  x: number,
  y: number,
  fatigue: number,
  doctrines: import("../game/development").DoctrineId[],
): SimBattle {
  const b: SimBattle = { ...battle, units: battle.units.map((u) => ({ ...u })) };
  if (b.phase === "deploy") {
    const u = b.units.find((x) => x.id === b.selected);
    if (!u || u.team !== "ally") return b;
    if (!battle.deploy.some(([dx, dy]) => dx === x && dy === y)) {
      return { ...b, log: "Deploy only on highlighted tiles." };
    }
    if (unitAt(b, x, y) && unitAt(b, x, y)!.id !== u.id) return { ...b, log: "Tile occupied." };
    u.x = x;
    u.y = y;
    const left = b.units.filter((a) => a.team === "ally" && a.x == null);
    return {
      ...b,
      selected: left[0]?.id ?? null,
      moveTiles: left[0] ? [...battle.deploy] : [],
      log: left[0] ? `${u.name} deployed. Place ${left[0].name}.` : "All placed. Press Begin Battle.",
    };
  }
  if (b.phase !== "player") return b;
  if (b.mode === "select") {
    const u = unitAt(b, x, y);
    if (u && u.team === "ally" && !u.acted) {
      return {
        ...b,
        selected: u.id,
        mode: "move",
        moveTiles: bfsMove(b, u),
        attackTiles: [],
        movedFrom: [u.x!, u.y!],
        log: `Move ${u.name}.`,
      };
    }
    return b;
  }
  if (b.mode === "move") {
    const u = b.units.find((x) => x.id === b.selected);
    if (!u || !b.moveTiles.some(([mx, my]) => mx === x && my === y)) return b;
    u.x = x;
    u.y = y;
    return {
      ...b,
      mode: "act",
      moveTiles: [],
      attackTiles: attackTiles(u, x, y),
      log: `${u.name} ready — attack a red tile, use a signature, or Wait.`,
    };
  }
  if (b.mode === "act") {
    const u = b.units.find((x) => x.id === b.selected);
    if (!u) return b;
    const target = unitAt(b, x, y);
    if (target?.team === "enemy" && b.attackTiles.some(([ax, ay]) => ax === x && ay === y)) {
      const dmg = calcDamage(u, target, fatigue, b.markedId, false, doctrines, b.map);
      target.hp = Math.max(0, target.hp - dmg);
      u.acted = true;
      let next: SimBattle = { ...b, log: `${u.name} hits ${target.name} — ${dmg}.` };
      if (b.markedId === target.id) next = { ...next, markedId: null };
      next = trySupport(next, u, doctrines);
      return finishUnit(next, u);
    }
  }
  return b;
}

function trySupport(
  battle: SimBattle,
  u: SimUnit,
  doctrines: import("../game/development").DoctrineId[] = [],
): SimBattle {
  if (!u.who || u.x == null) return battle;
  const linkHeal = doctrines.includes("command_link") ? 3 : 2;
  for (const ally of battle.units.filter(
    (a) => a.team === "ally" && a.hp > 0 && a.id !== u.id && a.who && a.x != null,
  )) {
    const d = Math.abs(ally.x! - u.x) + Math.abs(ally.y! - u.y!);
    if (d !== 1) continue;
    const pair = [u.who, ally.who!].sort().join("|");
    if (battle.supportFired.includes(pair)) continue;
    u.defBuff += 2;
    ally.defBuff += 2;
    u.hp = Math.min(u.maxHp, u.hp + linkHeal);
    ally.hp = Math.min(ally.maxHp, ally.hp + linkHeal);
    return {
      ...battle,
      supportFired: [...battle.supportFired, pair],
      log: `${battle.log} · Support link ${u.name}+${ally.name}`,
    };
  }
  return battle;
}

function useSignature(
  battle: SimBattle,
  fatigue: number,
  doctrines: import("../game/development").DoctrineId[],
): SimBattle {
  const b: SimBattle = { ...battle, units: battle.units.map((u) => ({ ...u })) };
  const u = b.units.find((x) => x.id === b.selected);
  if (!u || u.sigUsed || b.mode !== "act") return battle;
  const who = u.who;
  if (who === "yuki") {
    u.sigUsed = true;
    u.defBuff += 4;
    u.acted = true;
    b.tauntId = u.id;
    b.log = "Bulwark — OpFor drawn.";
    return finishUnit(trySupport(b, u, doctrines), u);
  }
  if (who === "kat") {
    const allies = b.units.filter(
      (a) =>
        a.team === "ally" &&
        a.id !== u.id &&
        a.x != null &&
        Math.abs(a.x - u.x!) + Math.abs(a.y! - u.y!) <= 2,
    );
    if (!allies.length) return { ...b, log: "Patch — no ally nearby." };
    allies.sort((a, c) => a.hp / a.maxHp - c.hp / c.maxHp);
    const tgt = allies[0];
    let heal = Math.max(4, Math.floor(tgt.maxHp * 0.22));
    if (doctrines.includes("patch_grid")) heal = Math.round(heal * 1.25);
    tgt.hp = Math.min(tgt.maxHp, tgt.hp + heal);
    u.sigUsed = true;
    u.acted = true;
    b.log = `Patch — ${tgt.name} +${heal} HP.`;
    return finishUnit(trySupport(b, u, doctrines), u);
  }
  if (who === "yuu") {
    let n = 0;
    const buff = doctrines.includes("command_link") ? 4 : 3;
    for (const a of b.units) {
      if (a.team !== "ally" || a.id === u.id || a.x == null) continue;
      if (Math.abs(a.x - u.x!) + Math.abs(a.y! - u.y!) <= 2) {
        a.atkBuff += buff;
        n++;
      }
    }
    u.sigUsed = true;
    u.acted = true;
    b.log = `Directive — +ATK to ${n} allies.`;
    return finishUnit(trySupport(b, u, doctrines), u);
  }
  const targets = b.units.filter(
    (t) =>
      t.team === "enemy" &&
      t.hp > 0 &&
      t.x != null &&
      b.attackTiles.some(([ax, ay]) => ax === t.x && ay === t.y),
  );
  if (!targets.length) return { ...b, log: `${SIGNATURE_LABEL[who!]} needs a target.` };
  targets.sort((a, c) => a.hp - c.hp);
  const tgt = targets[0];
  if (who === "naomi") b.markedId = tgt.id;
  const dmg = calcDamage(u, tgt, fatigue, b.markedId, who === "emi", doctrines, b.map);
  tgt.hp = Math.max(0, tgt.hp - dmg);
  u.sigUsed = true;
  u.acted = true;
  b.log = `${SIGNATURE_LABEL[who!]} — ${dmg} dmg.`;
  return finishUnit(trySupport(b, u, doctrines), u);
}
