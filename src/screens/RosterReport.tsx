import { ASSET, CREW, CREW_ORDER } from "../game/crew";
import { useGame } from "../game/store";

export function RosterScreen() {
  const setScreen = useGame((s) => s.setScreen);
  const affinity = useGame((s) => s.affinity);
  const intelligence = useGame((s) => s.intelligence);
  const squadStr = useGame((s) => s.squadStr());
  const affinityRank = useGame((s) => s.affinityRank);
  const pilotStats = useGame((s) => s.pilotStats);

  return (
    <div className="list-screen">
      <h1>Squad Roster</h1>
      <p className="muted">
        Team 07 STR {squadStr}/99 · Commander INT {intelligence}
      </p>
      {CREW_ORDER.map((id) => {
        const c = CREW[id];
        const aff = id === "yuu" ? "Command link" : `${affinity[id]}/20 · Bond R${affinityRank(id)}`;
        const stats = id === "emi" || id === "yuki" || id === "naomi" ? pilotStats(id) : null;
        return (
          <div key={id} className="roster-row">
            <img src={ASSET.sprite(id)} alt="" />
            <div>
              <h3>{c.name}</h3>
              <p>
                {c.role} · {c.unit}
              </p>
              <p>{c.mech}</p>
              <p>{aff}</p>
              {stats && (
                <p>
                  CR {stats.cr} · ATK {stats.atk} · DEF {stats.defense} · HP {stats.maxHp}
                </p>
              )}
              <p>{c.blurb}</p>
            </div>
          </div>
        );
      })}
      <button type="button" className="btn btn-primary" onClick={() => setScreen("hub")}>
        Back to Hub
      </button>
    </div>
  );
}

export function ReportScreen() {
  const setScreen = useGame((s) => s.setScreen);
  const missionStatus = useGame((s) => s.missionStatus);
  const objective = useGame((s) => s.hubObjective());
  const agenda = useGame((s) => s.agenda());
  const rows = [
    ["Briefing", "briefing"],
    ["Crew check-ins", "meet_crew"],
    ["Combat Basics", "lecture_01"],
    ["Drill 01 Breach", "drill_01"],
    ["Drill 02 Hold", "drill_02"],
    ["Drill 03 Mark", "drill_03"],
    ["Sim Battle", "sim_battle"],
    ["Coastal Alert", "coastal"],
  ] as const;

  return (
    <div className="list-screen">
      <h1>Training Report</h1>
      <p className="muted">{agenda}</p>
      <p>{objective}</p>
      <div className="report-rows">
        {rows.map(([label, id]) => {
          const st = missionStatus(id);
          return (
            <div key={id}>
              <span>{label}</span>
              <span className={`badge ${st}`}>{st.toUpperCase()}</span>
            </div>
          );
        })}
      </div>
      <button type="button" className="btn btn-primary" onClick={() => setScreen("hub")}>
        Close
      </button>
    </div>
  );
}
