import { useEffect, useState } from "react";
import { CharacterPortrait } from "../components/CharacterPortrait";
import { ASSET, CREW, CREW_ORDER } from "../game/crew";
import { useGame } from "../game/store";
import type { CrewId } from "../game/types";

export function HubScreen() {
  const startStory = useGame((s) => s.startStory);
  const rest = useGame((s) => s.rest);
  const setScreen = useGame((s) => s.setScreen);
  const set = useGame.setState;
  const objective = useGame((s) => s.hubObjective());
  const affinity = useGame((s) => s.affinity);
  const affinityRank = useGame((s) => s.affinityRank);
  const missionStatus = useGame((s) => s.missionStatus);
  const canTrain = useGame((s) => s.canTrain());
  const fatigueText = useGame((s) => s.fatigueText());
  const notify = useGame((s) => s.notify);
  const [outingOpen, setOutingOpen] = useState(false);

  useEffect(() => {
    const st = useGame.getState();
    if (st.coastalAlertReady && !st.coastalAlertSeen) {
      startStory("coastal");
      return;
    }
    const pending = st.pendingBond();
    if (pending) startStory(`bond_${pending.who}_${pending.rank}`);
  }, [startStory]);

  const lectureSt = missionStatus("lecture_01");

  return (
    <div className="hub">
      <div className="objective-banner">{objective}</div>

      <div className="crew-grid">
        {CREW_ORDER.map((id) => {
          const c = CREW[id];
          const aff = id === "yuu" ? null : affinity[id];
          const rank = affinityRank(id);
          return (
            <button
              key={id}
              type="button"
              className="crew-card"
              onClick={() => {
                if (id === "yuu") {
                  notify("Command slate clear. Keep the squad sharp.");
                  return;
                }
                startStory(`talk_${id}`);
              }}
            >
              <div className="art">
                <CharacterPortrait src={ASSET.sprite(id)} alt={c.short} variant="card" />
              </div>
              <div className="meta">
                <div className="name">{c.short}</div>
                <div className="role">{c.unit}</div>
                <div className="aff">{aff == null ? "Commander" : `Affinity ${aff} · Bond R${rank}`}</div>
              </div>
            </button>
          );
        })}
      </div>

      <aside className="side-panel">
        <div className="panel">
          <h2>Bay Actions</h2>
          <div className="action-stack">
            <button type="button" className="btn" onClick={rest}>
              Rest in Dorms
              <span className="muted"> · −22 fatigue · +1 day</span>
            </button>
            <button type="button" className="btn" onClick={() => setOutingOpen(true)}>
              Lunch / Outing
              <span className="muted"> · bond · −14 fatigue</span>
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => setScreen("develop")}
            >
              Squad Development
              <span className="muted"> · tune · facilities · doctrine</span>
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                if (!canTrain) {
                  notify("Fatigue too high — rest first.");
                  return;
                }
                setScreen("drill");
              }}
            >
              Training Deck
              <span className="muted"> · sim ladder</span>
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => {
                if (lectureSt === "locked") {
                  notify("Unlocks after first briefing.");
                  return;
                }
                if (!canTrain && lectureSt === "open") {
                  notify("Too wiped for the lecture hall.");
                  return;
                }
                startStory("lecture_01");
              }}
            >
              Combat Basics
              <span className="muted"> · [{lectureSt}]</span>
            </button>
          </div>
        </div>
        <div className="panel">
          <h2>Readiness</h2>
          <p className="muted" style={{ margin: 0, fontSize: 13 }}>
            {fatigueText}
          </p>
          <ul className="help-list" style={{ marginTop: 10 }}>
            <li>Talks are free. Major actions advance the day.</li>
            <li>Bond scenes unlock at Affinity 3 / 6 / 10.</li>
            <li>Win sims for credits · spend them on frame tunes & facilities.</li>
            <li>Rest while Winded/Tired for Conditioning (+Squad STR).</li>
          </ul>
        </div>
      </aside>

      <div className="hub-footer">
        <button type="button" className="btn" onClick={() => setScreen("roster")}>
          Squad Roster
        </button>
        <button type="button" className="btn" onClick={() => setScreen("report")}>
          Training Report
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => set({ screen: "title" })}>
          Title Screen
        </button>
      </div>

      {outingOpen && (
        <div className="modal-back" onClick={() => setOutingOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Who’s free for lunch?</h3>
            <p className="muted">Outing advances the day and raises affinity.</p>
            <div className="modal-actions">
              {(["emi", "yuki", "naomi", "kat"] as Exclude<CrewId, "yuu">[]).map((who) => (
                <button
                  key={who}
                  type="button"
                  className="btn"
                  onClick={() => {
                    setOutingOpen(false);
                    startStory(`outing_${who}`);
                  }}
                >
                  {CREW[who].short} — {CREW[who].unit}
                </button>
              ))}
              <button type="button" className="btn btn-ghost" onClick={() => setOutingOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
