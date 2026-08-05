import { SIM_LEVELS } from "../game/simLevels";
import { simMapDef } from "../game/simMaps";
import { useGame } from "../game/store";
import type { SimLevelId } from "../game/types";

export function TrainingScreen() {
  const missionStatus = useGame((s) => s.missionStatus);
  const setScreen = useGame((s) => s.setScreen);
  const startSim = useGame((s) => s.startSim);
  const canTrain = useGame((s) => s.canTrain());
  const squadStr = useGame((s) => s.squadStr());
  const opforStr = useGame((s) => s.opforStr);

  return (
    <div className="list-screen">
      <h1>Sim Deck</h1>
      <p className="muted">
        Four difficulties — Very Easy → Hard. Your Squad STR is <strong>{squadStr}</strong>; OpFor
        scales from that.
      </p>
      {!canTrain && <p className="warn">Fatigue lock — rest before launching.</p>}

      {SIM_LEVELS.map((level) => {
        const st = missionStatus(level.id);
        const opfor = opforStr(level.id as SimLevelId);
        const map = simMapDef(level.id);
        const delta = opfor - squadStr;
        const deltaLabel =
          delta === 0 ? "even" : delta > 0 ? `+${delta} vs you` : `${delta} vs you`;
        return (
          <button
            key={level.id}
            type="button"
            className="btn sim-level-btn"
            disabled={st === "locked" || !canTrain}
            onClick={() => startSim(level.id)}
          >
            <span className="sim-level-main">
              <strong>
                <span className={`diff-pill diff-${level.difficulty}`}>{level.difficultyLabel}</span>{" "}
                {level.label.replace(/^Sim 0\d — /, "")}
              </strong>
              <span className="muted">
                {map.name} — {level.blurb}
              </span>
              <span className="muted">Tip: {map.tip}</span>
              <span className="sim-level-str">
                OpFor Combat STR <strong>{opfor}</strong>
                <span className="muted">
                  {" "}
                  · yours {squadStr} · {deltaLabel}
                </span>
              </span>
            </span>
            <span className={`badge ${st}`}>{st.toUpperCase()}</span>
          </button>
        );
      })}

      <button type="button" className="btn btn-ghost" onClick={() => setScreen("hub")}>
        Back
      </button>
    </div>
  );
}
