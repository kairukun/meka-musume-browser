import { ASSET, CREW, CREW_ORDER } from "../game/crew";
import { useGame } from "../game/store";

const CGS = [
  { id: "cg_team", src: () => ASSET.cg("team_assemble"), label: "Team Assemble", unlock: "bond_emi_1" },
  { id: "cg_hangar", src: () => ASSET.cg("hangar_arrival"), label: "Hangar Arrival", unlock: "bond_yuki_3" },
  { id: "cg_gate", src: () => ASSET.cg("academy_gate"), label: "Coastal Map", unlock: "coastal" },
];

export function GalleryScreen() {
  const setScreen = useGame((s) => s.setScreen);
  const gallerySeen = useGame((s) => s.gallerySeen);
  const bondSeen = useGame((s) => s.bondSeen);
  const affinity = useGame((s) => s.affinity);

  const unlocked = (key: string) => !!(gallerySeen[key] || bondSeen[key]);

  return (
    <div className="hub meta-screen">
      <div className="panel">
        <h2>Archive Gallery</h2>
        <p className="muted">Unlocked CGs and roster portraits from bonds and sims.</p>
        <div className="gallery-grid">
          {CGS.map((cg) => {
            const on = unlocked(cg.unlock) || gallerySeen[cg.id];
            return (
              <div key={cg.id} className={`gallery-card${on ? "" : " locked"}`}>
                {on ? <img src={cg.src()} alt={cg.label} /> : <div className="locked-ph">???</div>}
                <span>{on ? cg.label : "Locked"}</span>
              </div>
            );
          })}
          {CREW_ORDER.map((id) => (
            <div key={id} className="gallery-card">
              <img src={ASSET.sprite(id)} alt={CREW[id].short} />
              <span>
                {CREW[id].short}
                {id !== "yuu" ? ` · Aff ${affinity[id]}` : ""}
              </span>
            </div>
          ))}
        </div>
        <button type="button" className="btn" onClick={() => setScreen("hub")}>
          Back to Bay
        </button>
      </div>
    </div>
  );
}
