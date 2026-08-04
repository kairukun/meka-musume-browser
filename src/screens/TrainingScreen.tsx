import { useState } from "react";
import { CREW, SIGNATURE_LABEL } from "../game/crew";
import { createDrill, resolveDrillTurn, type DrillState } from "../game/drill";
import { useGame } from "../game/store";
import type { CrewId, DrillId, DrillOrder, PilotId } from "../game/types";

export function TrainingScreen() {
  const [playing, setPlaying] = useState<DrillId | null>(null);
  if (playing) return <DrillConsole id={playing} onExit={() => setPlaying(null)} />;
  return <TrainingSelect onPlay={setPlaying} />;
}

function TrainingSelect({ onPlay }: { onPlay: (id: DrillId) => void }) {
  const missionStatus = useGame((s) => s.missionStatus);
  const setScreen = useGame((s) => s.setScreen);
  const set = useGame.setState;
  const canTrain = useGame((s) => s.canTrain());
  const drills: { id: DrillId; label: string; blurb: string }[] = [
    { id: "drill_01", label: "Drill 01 — Breach", blurb: "Assault pressure. Punch the dummy." },
    { id: "drill_02", label: "Drill 02 — Hold the Line", blurb: "Tank wall. Survive the pressure." },
    { id: "drill_03", label: "Drill 03 — Mark & Deny", blurb: "Defense marks. Focus fire." },
  ];

  return (
    <div className="list-screen">
      <h1>Training Deck</h1>
      <p className="muted">Pick a mock drill or launch the 5v5 sim once all three are clear.</p>
      {!canTrain && <p className="warn">Fatigue lock — rest before launching.</p>}
      {drills.map((d) => {
        const st = missionStatus(d.id);
        return (
          <button
            key={d.id}
            type="button"
            className="btn"
            style={{ justifyContent: "space-between", width: "100%" }}
            disabled={st === "locked" || !canTrain}
            onClick={() => {
              set({ activeDrill: d.id });
              onPlay(d.id);
            }}
          >
            <span>
              <strong>{d.label}</strong>
              <br />
              <span className="muted">{d.blurb}</span>
            </span>
            <span className={`badge ${st}`}>{st.toUpperCase()}</span>
          </button>
        );
      })}
      <button
        type="button"
        className="btn btn-primary"
        disabled={missionStatus("sim_battle") === "locked" || !canTrain}
        onClick={() => setScreen("sim")}
      >
        Simulated Battle — 5v5 OpFor
      </button>
      <button type="button" className="btn btn-ghost" onClick={() => setScreen("hub")}>
        Back
      </button>
    </div>
  );
}

function DrillConsole({ id, onExit }: { id: DrillId; onExit: () => void }) {
  const pilotStats = useGame((s) => s.pilotStats);
  const squadStr = useGame((s) => s.squadStr());
  const opforStr = useGame((s) => s.opforStr(id));
  const fatigue = useGame((s) => s.fatigue);
  const katAff = useGame((s) => s.affinity.kat);
  const completeDrill = useGame((s) => s.completeDrill);
  const addAffinity = useGame((s) => s.addAffinity);
  const setScreen = useGame((s) => s.setScreen);
  const fatigueText = useGame((s) => s.fatigueText());
  const [creditOpen, setCreditOpen] = useState(false);

  const [state, setState] = useState<DrillState>(() =>
    createDrill(
      id,
      { emi: pilotStats("emi"), yuki: pilotStats("yuki"), naomi: pilotStats("naomi") },
      squadStr,
      opforStr,
    ),
  );

  const setOrder = (pid: PilotId, order: DrillOrder) => {
    setState((s) => ({
      ...s,
      pilots: s.pilots.map((p) => (p.id === pid ? { ...p, order } : p)),
    }));
  };

  const confirm = () => {
    const next = resolveDrillTurn(state, fatigue, katAff);
    setState(next);
    if (next.won) setCreditOpen(true);
  };

  const finish = (who: Exclude<CrewId, "yuu"> | null) => {
    if (who) addAffinity(who, 1);
    setCreditOpen(false);
    completeDrill(id);
  };

  if (state.lost) {
    return (
      <div className="list-screen">
        <h1>Simulation Failed</h1>
        <p>{state.log}</p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            onExit();
            setScreen("hub");
          }}
        >
          Return to Hub
        </button>
      </div>
    );
  }

  return (
    <div className="drill">
      <section className="drill-status">
        <h2>{id.replace("_", " ").toUpperCase()} · Turn {state.turn}</h2>
        <p className="muted">
          07 STR {squadStr} · OpFor {opforStr} · {fatigueText}
        </p>
        {state.pilots.map((p) => (
          <div key={p.id} className="unit-meter">
            <span>{p.name}</span>
            <div className="meter">
              <i style={{ width: `${(p.hp / p.maxHp) * 100}%`, background: `var(--${p.id})` }} />
            </div>
            <span>
              {p.hp}/{p.maxHp}
            </span>
          </div>
        ))}
        <div className="unit-meter enemy">
          <span>OpFor</span>
          <div className="meter">
            <i style={{ width: `${(state.enemyHp / state.enemyMax) * 100}%` }} />
          </div>
          <span>
            {state.enemyHp}/{state.enemyMax}
          </span>
        </div>
        <div className="log-box">{state.log}</div>
      </section>

      <section className="drill-orders">
        <h2>Issue Orders</h2>
        {state.pilots.map((p) => {
          const sig = p.id === "emi" ? "breach" : p.id === "yuki" ? "bulwark" : "mark";
          const opts: { id: DrillOrder; label: string; sig?: boolean }[] = [
            { id: "strike", label: "Strike" },
            { id: "focus", label: "Focus" },
            { id: "guard", label: "Guard" },
            { id: sig, label: SIGNATURE_LABEL[p.id], sig: true },
          ];
          return (
            <div key={p.id} className="order-block">
              <div className="order-label">
                {p.name} · {CREW[p.id].unit}
              </div>
              {p.hp <= 0 ? (
                <span className="warn">DOWNED</span>
              ) : (
                <div className="seg">
                  {opts.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      className={`btn${p.order === o.id ? " active" : ""}${o.sig ? " sig" : ""}`}
                      onClick={() => setOrder(p.id, o.id)}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        <button type="button" className="btn btn-primary" onClick={confirm} disabled={state.won}>
          Resolve Turn
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            onExit();
            setScreen("hub");
          }}
        >
          Abort
        </button>
      </section>

      {creditOpen && (
        <div className="modal-back">
          <div className="modal">
            <h3>Drill cleared — credit first?</h3>
            <div className="modal-actions">
              {(["emi", "yuki", "naomi", "kat"] as const).map((who) => (
                <button key={who} type="button" className="btn" onClick={() => finish(who)}>
                  {CREW[who].short}
                </button>
              ))}
              <button type="button" className="btn btn-ghost" onClick={() => finish(null)}>
                Keep it quiet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
