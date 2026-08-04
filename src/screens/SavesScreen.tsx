import { useState } from "react";
import { clearSlot, listSlotMeta, readSlot, writeSlot } from "../game/saves";
import { useGame } from "../game/store";

export function SavesScreen() {
  const setScreen = useGame((s) => s.setScreen);
  const saveGame = useGame((s) => s.saveGame);
  const [meta, setMeta] = useState(() => listSlotMeta());

  const refresh = () => setMeta(listSlotMeta());

  const snapshot = () => {
    const st = useGame.getState();
    const {
      setScreen: _a,
      notify: _b,
      clearNotify: _c,
      addFatigue: _d,
      addIntelligence: _e,
      addAffinity: _f,
      rememberChoice: _rc,
      markTutorialDone: _mt,
      unlockGallery: _ug,
      setAudioMuted: _sam,
      spendDay: _g,
      canTrain: _h,
      squadStr: _i,
      developmentBonus: _dev,
      opforStr: _j,
      affinityRank: _k,
      pendingBond: _l,
      markBondSeen: _m,
      missionStatus: _n,
      hubObjective: _o,
      agenda: _p,
      fatigueText: _q,
      crewCheckinsDone: _r,
      startStory: _s,
      advanceStory: _t,
      setStoryIndex: _u,
      openHubWithPriority: _v,
      rest: _w,
      completeLecture: _x,
      markTalked: _y,
      startSim: _z,
      completeSim: _aa,
      pickDoctrine: _pd,
      skipDoctrine: _sd,
      tuneFrame: _tf,
      buyFacility: _bf,
      markCoastalSeen: _ab,
      resetGame: _ac,
      saveGame: _save,
      pilotStats: _ad,
      notifyQueue: _ae,
      ...rest
    } = st;
    return rest;
  };

  return (
    <div className="hub meta-screen">
      <div className="panel">
        <h2>Save Slots</h2>
        <p className="muted">
          Autosave stays in browser storage. Slots are manual copies you can reload.
        </p>
        <div className="save-slots">
          {meta.map((m, i) => (
            <div key={i} className="save-slot">
              <div>
                <strong>{m.label}</strong>
                <div className="muted">
                  {m.empty
                    ? "Empty"
                    : `${m.month} ${m.day} · ${m.savedAt ?? "—"}`}
                </div>
              </div>
              <div className="save-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    writeSlot(i, snapshot());
                    saveGame();
                    refresh();
                    useGame.getState().notify(`Wrote ${m.label}`);
                  }}
                >
                  Save
                </button>
                <button
                  type="button"
                  className="btn"
                  disabled={m.empty}
                  onClick={() => {
                    const data = readSlot(i);
                    if (!data) return;
                    useGame.setState({ ...data, screen: "hub", notifyQueue: [] });
                    useGame.getState().notify(`Loaded ${m.label}`);
                    setScreen("hub");
                  }}
                >
                  Load
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  disabled={m.empty}
                  onClick={() => {
                    if (!window.confirm(`Clear ${m.label}?`)) return;
                    clearSlot(i);
                    refresh();
                  }}
                >
                  Clear
                </button>
              </div>
            </div>
          ))}
        </div>
        <button type="button" className="btn" onClick={() => setScreen(useGame.getState().chapter1IntroDone ? "hub" : "title")}>
          Back
        </button>
      </div>
    </div>
  );
}
