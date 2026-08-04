import { useEffect, useMemo, useRef, useState } from "react";
import { CharacterPortrait } from "../components/CharacterPortrait";
import { ASSET, CREW, SIGNATURE_LABEL } from "../game/crew";
import {
  applyEnemyAction,
  endEnemyPhase,
  listEnemyActions,
} from "../game/enemyAi";
import { ollamaPickAction, probeOllama } from "../game/ollama";
import {
  SIM_DEPLOY,
  SIM_H,
  SIM_MAP,
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
    createSimBattle(allyStr, opforStr, { frameTuning, doctrines }),
  );
  const [cursor, setCursor] = useState<[number, number] | null>(null);
  const selected = battle.units.find((u) => u.id === battle.selected) ?? null;
  const hoverUnit = cursor ? unitAt(battle, cursor[0], cursor[1]) : null;
  const focus = hoverUnit ?? selected ?? battle.units.find((u) => u.team === "ally" && u.hp > 0) ?? null;
  const terrain = cursor
    ? { label: tileLabel(cursor[0], cursor[1]), def: tileDef(cursor[0], cursor[1]) }
    : { label: "Ash Plaza", def: 0 };

  const levelLabel = activeSim.replace("_", " ").toUpperCase();

  const forecast = useMemo(() => {
    if (!selected || battle.mode !== "act" || !hoverUnit || hoverUnit.team !== "enemy") return null;
    if (!battle.attackTiles.some(([ax, ay]) => ax === hoverUnit.x && ay === hoverUnit.y)) return null;
    const dmg = calcDamage(selected, hoverUnit, fatigue, battle.markedId, false, doctrines);
    return { dmg, target: hoverUnit };
  }, [selected, battle.mode, battle.attackTiles, battle.markedId, hoverUnit, fatigue, doctrines]);

  const [ollamaReady, setOllamaReady] = useState(false);
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [aiThinking, setAiThinking] = useState(false);
  const [ollamaError, setOllamaError] = useState<string | null>(null);
  const [retryTick, setRetryTick] = useState(0);
  const enemyBusy = useRef(false);

  const refreshOllama = async () => {
    const r = await probeOllama();
    setOllamaReady(r.ok);
    setOllamaModels(r.models);
    return r;
  };

  useEffect(() => {
    let alive = true;
    refreshOllama().then((r) => {
      if (!alive) return;
      setOllamaReady(r.ok);
      setOllamaModels(r.models);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (battle.phase !== "enemy") {
      enemyBusy.current = false;
      setAiThinking(false);
      setOllamaError(null);
      return;
    }
    if (enemyBusy.current) return;
    enemyBusy.current = true;
    let cancelled = false;

    const run = async () => {
      const snap = battle;
      const ready = snap.units.filter((u) => u.team === "enemy" && u.hp > 0 && !u.acted);
      if (!ready.length) {
        if (!cancelled) {
          setBattle(endEnemyPhase(snap));
          enemyBusy.current = false;
        }
        return;
      }
      const unit = ready[0];
      const allies = snap.units.filter((u) => u.team === "ally" && u.hp > 0 && u.x != null);
      if (!allies.length) {
        if (!cancelled) {
          setBattle({ ...snap, phase: "lose" });
          enemyBusy.current = false;
        }
        return;
      }

      let models = ollamaModels;
      let readyOk = ollamaReady;
      if (!readyOk || !models.length) {
        const r = await refreshOllama();
        readyOk = r.ok;
        models = r.models;
      }

      if (!readyOk || !models.length) {
        if (!cancelled) {
          setOllamaError("Ollama offline — install/start Ollama, pull a model, then Retry.");
          setBattle((b) => ({
            ...b,
            log: "OpFor waiting on Ollama (localhost:11434)…",
          }));
          enemyBusy.current = false;
        }
        return;
      }

      const actions = listEnemyActions(snap, unit, fatigue, doctrines);
      if (!actions.length) {
        if (!cancelled) {
          setBattle(applyEnemyAction(snap, unit.id, { id: -1, x: unit.x!, y: unit.y!, foeId: null, blurb: "Hold" }, fatigue, doctrines));
          enemyBusy.current = false;
        }
        return;
      }

      setAiThinking(true);
      setOllamaError(null);
      let pick = await ollamaPickAction(unit.name, unit.cls, actions, models);
      if (!pick) pick = await ollamaPickAction(unit.name, unit.cls, actions, models);
      setAiThinking(false);

      if (cancelled) {
        enemyBusy.current = false;
        return;
      }
      if (!pick) {
        setOllamaError("Ollama did not return a valid move. Retry OpFor turn.");
        setBattle((b) => ({ ...b, log: `${unit.name} stalled — Ollama no reply.` }));
        enemyBusy.current = false;
        return;
      }
      setBattle(applyEnemyAction(snap, unit.id, pick, fatigue, doctrines));
      enemyBusy.current = false;
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [battle.phase, battle.units, fatigue, doctrines, ollamaReady, ollamaModels, retryTick]);


  useEffect(() => {
    if (battle.phase === "win") {
      const clean = battle.units.filter((u) => u.team === "ally").every((u) => u.hp > 0);
      completeSim(true, { clean });
    }
    if (battle.phase === "lose") completeSim(false);
  }, [battle.phase, battle.units, completeSim]);

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
              battle.phase === "deploy" && SIM_DEPLOY.some(([dx, dy]) => dx === x && dy === y);
            const move = battle.moveTiles.some(([mx, my]) => mx === x && my === y);
            const atk = battle.attackTiles.some(([ax, ay]) => ax === x && ay === y);
            const u = unitAt(battle, x, y);
            const blocked = [3, 4, 5].includes(SIM_MAP[y][x]);
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
                style={{ backgroundImage: `url(${tileImage(x, y)})` }}
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

        <div className="simfe-chip ollama-toggle">
          <span>
            OpFor: Ollama
            {ollamaReady ? " · online" : " · offline"}
          </span>
          {(ollamaError || !ollamaReady) && (
            <button
              type="button"
              className="btn"
              style={{ padding: "2px 8px", fontSize: 11 }}
              onClick={() => {
                setOllamaError(null);
                enemyBusy.current = false;
                void refreshOllama().then(() => setRetryTick((n) => n + 1));
              }}
            >
              Retry
            </button>
          )}
        </div>
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
            const t = SIM_MAP[y][x];
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
                          moveTiles: [...SIM_DEPLOY],
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
    if (!SIM_DEPLOY.some(([dx, dy]) => dx === x && dy === y)) {
      return { ...b, log: "Deploy only on highlighted tiles." };
    }
    if (unitAt(b, x, y) && unitAt(b, x, y)!.id !== u.id) return { ...b, log: "Tile occupied." };
    u.x = x;
    u.y = y;
    const left = b.units.filter((a) => a.team === "ally" && a.x == null);
    return {
      ...b,
      selected: left[0]?.id ?? null,
      moveTiles: left[0] ? [...SIM_DEPLOY] : [],
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
      const dmg = calcDamage(u, target, fatigue, b.markedId, false, doctrines);
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
  const dmg = calcDamage(u, tgt, fatigue, b.markedId, who === "emi", doctrines);
  tgt.hp = Math.max(0, tgt.hp - dmg);
  u.sigUsed = true;
  u.acted = true;
  b.log = `${SIGNATURE_LABEL[who!]} — ${dmg} dmg.`;
  return finishUnit(trySupport(b, u, doctrines), u);
}
