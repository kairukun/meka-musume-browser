import { useEffect, useMemo, useState } from "react";
import { ASSET, CREW, SIGNATURE_LABEL } from "../game/crew";
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
  const opforStr = useGame((s) => s.opforStr("sim"));
  const fatigue = useGame((s) => s.fatigue);
  const completeSim = useGame((s) => s.completeSim);
  const [battle, setBattle] = useState<SimBattle>(() => createSimBattle(allyStr, opforStr));
  const [cursor, setCursor] = useState<[number, number] | null>(null);
  const selected = battle.units.find((u) => u.id === battle.selected) ?? null;
  const hoverUnit = cursor ? unitAt(battle, cursor[0], cursor[1]) : null;
  const focus = hoverUnit ?? selected ?? battle.units.find((u) => u.team === "ally" && u.hp > 0) ?? null;
  const terrain = cursor
    ? { label: tileLabel(cursor[0], cursor[1]), def: tileDef(cursor[0], cursor[1]) }
    : { label: "Ground", def: 0 };

  const forecast = useMemo(() => {
    if (!selected || battle.mode !== "act" || !hoverUnit || hoverUnit.team !== "enemy") return null;
    if (!battle.attackTiles.some(([ax, ay]) => ax === hoverUnit.x && ay === hoverUnit.y)) return null;
    const dmg = calcDamage(selected, hoverUnit, fatigue, battle.markedId);
    return { dmg, target: hoverUnit };
  }, [selected, battle.mode, battle.attackTiles, battle.markedId, hoverUnit, fatigue]);

  useEffect(() => {
    if (battle.phase !== "enemy") return;
    const t = window.setTimeout(() => setBattle((b) => enemyStep(b, fatigue)), 320);
    return () => window.clearTimeout(t);
  }, [battle.phase, battle.units, fatigue]);

  useEffect(() => {
    if (battle.phase === "win") completeSim(true);
    if (battle.phase === "lose") completeSim(false);
  }, [battle.phase, completeSim]);

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
                onClick={() => setBattle((b) => clickTile(b, x, y, fatigue))}
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
          <span>Turn {battle.turn}</span>
          <strong>{phaseLabel}</strong>
        </div>

        <div className="simfe-chip log">{battle.log}</div>

        {focus && (
          <div className={`simfe-unitpanel ${focus.team}`}>
            <div className="simfe-portrait">
              {focus.who ? (
                <img src={ASSET.sprite(focus.who)} alt="" />
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
                  onClick={() => setBattle((b) => useSignature(b, fatigue))}
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
                    return finishUnit(trySupport(next, acted), acted);
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

function clickTile(battle: SimBattle, x: number, y: number, fatigue: number): SimBattle {
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
      const dmg = calcDamage(u, target, fatigue, b.markedId);
      target.hp = Math.max(0, target.hp - dmg);
      u.acted = true;
      let next: SimBattle = { ...b, log: `${u.name} hits ${target.name} — ${dmg}.` };
      if (b.markedId === target.id) next = { ...next, markedId: null };
      next = trySupport(next, u);
      return finishUnit(next, u);
    }
  }
  return b;
}

function trySupport(battle: SimBattle, u: SimUnit): SimBattle {
  if (!u.who || u.x == null) return battle;
  for (const ally of battle.units.filter(
    (a) => a.team === "ally" && a.hp > 0 && a.id !== u.id && a.who && a.x != null,
  )) {
    const d = Math.abs(ally.x! - u.x) + Math.abs(ally.y! - u.y!);
    if (d !== 1) continue;
    const pair = [u.who, ally.who!].sort().join("|");
    if (battle.supportFired.includes(pair)) continue;
    u.defBuff += 2;
    ally.defBuff += 2;
    u.hp = Math.min(u.maxHp, u.hp + 2);
    ally.hp = Math.min(ally.maxHp, ally.hp + 2);
    return {
      ...battle,
      supportFired: [...battle.supportFired, pair],
      log: `${battle.log} · Support link ${u.name}+${ally.name}`,
    };
  }
  return battle;
}

function useSignature(battle: SimBattle, fatigue: number): SimBattle {
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
    return finishUnit(trySupport(b, u), u);
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
    const heal = Math.max(4, Math.floor(tgt.maxHp * 0.22));
    tgt.hp = Math.min(tgt.maxHp, tgt.hp + heal);
    u.sigUsed = true;
    u.acted = true;
    b.log = `Patch — ${tgt.name} +${heal} HP.`;
    return finishUnit(trySupport(b, u), u);
  }
  if (who === "yuu") {
    let n = 0;
    for (const a of b.units) {
      if (a.team !== "ally" || a.id === u.id || a.x == null) continue;
      if (Math.abs(a.x - u.x!) + Math.abs(a.y! - u.y!) <= 2) {
        a.atkBuff += 3;
        n++;
      }
    }
    u.sigUsed = true;
    u.acted = true;
    b.log = `Directive — +ATK to ${n} allies.`;
    return finishUnit(trySupport(b, u), u);
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
  const dmg = calcDamage(u, tgt, fatigue, b.markedId, who === "emi");
  tgt.hp = Math.max(0, tgt.hp - dmg);
  u.sigUsed = true;
  u.acted = true;
  b.log = `${SIGNATURE_LABEL[who!]} — ${dmg} dmg.`;
  return finishUnit(trySupport(b, u), u);
}

function enemyStep(battle: SimBattle, fatigue: number): SimBattle {
  const b: SimBattle = { ...battle, units: battle.units.map((u) => ({ ...u })) };
  const ready = b.units.filter((u) => u.team === "enemy" && u.hp > 0 && !u.acted);
  if (!ready.length) {
    return {
      ...b,
      phase: "player",
      turn: b.turn + 1,
      mode: "select",
      units: b.units.map((u) => ({ ...u, acted: false })),
      log: `Your phase — Turn ${b.turn + 1}.`,
    };
  }
  const unit = ready[0];
  const allies = b.units.filter((u) => u.team === "ally" && u.hp > 0 && u.x != null);
  if (!allies.length) return { ...b, phase: "lose" };
  const moves = bfsMove(b, unit);
  let best: { x: number; y: number; foe: SimUnit | null; score: number } | null = null;
  for (const [tx, ty] of moves) {
    let score = -Math.abs(tx - 12) - Math.abs(ty - (2 + ready.indexOf(unit) * 2));
    let foe: SimUnit | null = null;
    let bestFs = -999;
    for (const a of allies) {
      const d = Math.abs(tx - a.x!) + Math.abs(ty - a.y!);
      if (d < unit.range[0] || d > unit.range[1]) continue;
      let fs = calcDamage(unit, a, fatigue, null) * 3;
      if (b.tauntId === a.id) fs += 70;
      if (fs > bestFs) {
        bestFs = fs;
        foe = a;
      }
    }
    if (foe) score += 40 + bestFs;
    if (!best || score > best.score) best = { x: tx, y: ty, foe, score };
  }
  if (best) {
    unit.x = best.x;
    unit.y = best.y;
    if (best.foe) {
      const dmg = calcDamage(unit, best.foe, fatigue, null);
      best.foe.hp = Math.max(0, best.foe.hp - dmg);
      b.log = `${unit.name} hits ${best.foe.name} — ${dmg}.`;
    } else b.log = `${unit.name} advances.`;
  }
  unit.acted = true;
  const end = checkEnd(b);
  if (end) return { ...b, phase: end };
  return b;
}
