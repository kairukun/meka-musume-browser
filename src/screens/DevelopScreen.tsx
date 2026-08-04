import {
  DOCTRINES,
  FACILITIES,
  FRAME_CLASSES,
  FRAME_MAX,
  FRAME_TUNE_COST,
  type DoctrineId,
  type FacilityId,
  type FrameClass,
} from "../game/development";
import { useGame } from "../game/store";

export function DevelopScreen() {
  const setScreen = useGame((s) => s.setScreen);
  const credits = useGame((s) => s.simCredits);
  const cohesion = useGame((s) => s.cohesion);
  const conditioning = useGame((s) => s.conditioning);
  const frameTuning = useGame((s) => s.frameTuning);
  const facilities = useGame((s) => s.facilities);
  const doctrines = useGame((s) => s.doctrines);
  const squadStr = useGame((s) => s.squadStr());
  const developmentBonus = useGame((s) => s.developmentBonus());
  const tuneFrame = useGame((s) => s.tuneFrame);
  const buyFacility = useGame((s) => s.buyFacility);
  const simCleared = useGame((s) => s.simCleared);

  return (
    <div className="list-screen develop">
      <h1>Squad Development</h1>
      <p className="muted">
        Squad STR <strong>{squadStr}</strong>
        <span className="muted"> · development bonus +{developmentBonus}</span>
      </p>
      <div className="dev-stats">
        <div className="stat-chip">
          Credits <strong>{credits}</strong>
        </div>
        <div className="stat-chip">
          Cohesion <strong>{cohesion}/100</strong>
          <span className="muted"> · +{Math.floor(cohesion / 10)} STR</span>
        </div>
        <div className="stat-chip">
          Conditioning <strong>{conditioning}/5</strong>
        </div>
      </div>

      <section className="panel">
        <h2>Frame Tuning</h2>
        <p className="muted">Spend {FRAME_TUNE_COST} credits · +2 Squad STR and stronger sim stats per level (max {FRAME_MAX}).</p>
        <div className="action-stack">
          {FRAME_CLASSES.map((cls) => {
            const lv = frameTuning[cls];
            return (
              <button
                key={cls}
                type="button"
                className="btn"
                disabled={lv >= FRAME_MAX || credits < FRAME_TUNE_COST}
                onClick={() => tuneFrame(cls as FrameClass)}
              >
                {cls} · Lv {lv}/{FRAME_MAX}
                <span className="muted"> · {FRAME_TUNE_COST} credits</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="panel">
        <h2>Facilities</h2>
        <p className="muted">One-time bay unlocks. Clear the listed sim first.</p>
        <div className="action-stack">
          {(Object.keys(FACILITIES) as FacilityId[]).map((id) => {
            const f = FACILITIES[id];
            const owned = facilities[id];
            const unlocked = !f.requiresSim || !!simCleared[f.requiresSim as keyof typeof simCleared];
            return (
              <button
                key={id}
                type="button"
                className="btn"
                disabled={owned || !unlocked || credits < f.cost}
                onClick={() => buyFacility(id)}
              >
                <span>
                  <strong>{f.name}</strong>
                  <br />
                  <span className="muted">{f.blurb}</span>
                </span>
                <span className="badge open">
                  {owned ? "ONLINE" : unlocked ? `${f.cost} cr · +${f.str} STR` : "LOCKED"}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="panel">
        <h2>Doctrines</h2>
        <p className="muted">Earned after sim wins (max 3). Each adds Squad STR and a combat perk.</p>
        {doctrines.length === 0 ? (
          <p className="muted">None locked yet.</p>
        ) : (
          <ul className="help-list">
            {doctrines.map((id) => (
              <li key={id}>
                <strong>{DOCTRINES[id].name}</strong> — {DOCTRINES[id].blurb}
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="muted">
        Tip: Rest while Winded/Tired (fatigue 35–84) for Conditioning. Clean sim wins (no ally KOs) grant more
        cohesion and credits.
      </p>

      <button type="button" className="btn btn-primary" onClick={() => setScreen("hub")}>
        Back to Hub
      </button>
    </div>
  );
}

export function DoctrineScreen() {
  const doctrines = useGame((s) => s.doctrines);
  const pickDoctrine = useGame((s) => s.pickDoctrine);
  const skipDoctrine = useGame((s) => s.skipDoctrine);
  const available = (Object.keys(DOCTRINES) as DoctrineId[]).filter((id) => !doctrines.includes(id));

  return (
    <div className="list-screen">
      <h1>Doctrine Select</h1>
      <p className="muted">Lock a training doctrine for Team 07. You can hold up to 3.</p>
      <div className="action-stack">
        {available.map((id) => (
          <button key={id} type="button" className="btn btn-primary" onClick={() => pickDoctrine(id)}>
            <span>
              <strong>{DOCTRINES[id].name}</strong>
              <br />
              <span className="muted">{DOCTRINES[id].blurb}</span>
            </span>
            <span className="badge open">+{DOCTRINES[id].str} STR</span>
          </button>
        ))}
      </div>
      <button type="button" className="btn btn-ghost" onClick={skipDoctrine}>
        Skip for now
      </button>
    </div>
  );
}
