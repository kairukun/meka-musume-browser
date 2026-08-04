import { useEffect } from "react";
import { useGame } from "../game/store";

/** Single latest notice in chrome flow — no overlay on Bay Actions. */
export function StatusRail() {
  const queue = useGame((s) => s.notifyQueue);
  const clear = useGame((s) => s.clearNotify);
  const latest = queue[queue.length - 1] ?? null;

  useEffect(() => {
    if (!latest) return;
    const t = window.setTimeout(() => clear(latest.id), 3200);
    return () => window.clearTimeout(t);
  }, [latest, clear]);

  if (!latest) return null;

  return (
    <div className="status-rail" aria-live="polite">
      <p className="status-rail-text">{latest.text}</p>
      <button type="button" className="status-rail-dismiss" onClick={() => clear(latest.id)} aria-label="Dismiss">
        ✕
      </button>
    </div>
  );
}

export function TopBar({ showStats = true }: { showStats?: boolean }) {
  const agenda = useGame((s) => s.agenda());
  const intelligence = useGame((s) => s.intelligence);
  const fatigue = useGame((s) => s.fatigue);
  const squadStr = useGame((s) => s.squadStr());
  const simCredits = useGame((s) => s.simCredits);
  const saveGame = useGame((s) => s.saveGame);
  const setScreen = useGame((s) => s.setScreen);
  const screen = useGame((s) => s.screen);
  const audioMuted = useGame((s) => s.audioMuted);
  const setAudioMuted = useGame((s) => s.setAudioMuted);
  const coastalPressure = useGame((s) => s.coastalPressure);

  return (
    <header className="topbar">
      <div className="brand">MEKA MUSUME</div>
      <div className="stat-chip">
        <span>DATE</span>
        <strong>{agenda}</strong>
      </div>
      {showStats && (
        <>
          <div className="stat-chip">
            INT <strong>{intelligence}</strong>
          </div>
          <div className="stat-chip">
            Fatigue <strong>{fatigue}</strong>
          </div>
          <div className="stat-chip">
            Squad STR <strong>{squadStr}</strong>
          </div>
          <div className="stat-chip">
            Credits <strong>{simCredits}</strong>
          </div>
          {coastalPressure > 0 && (
            <div className="stat-chip">
              Coast <strong>{coastalPressure}/8</strong>
            </div>
          )}
        </>
      )}
      <div className="topbar-spacer" />
      {screen !== "title" && (
        <>
          <button
            type="button"
            className="btn"
            onClick={() => setAudioMuted(!audioMuted)}
            title="Toggle ambient/SFX"
          >
            {audioMuted ? "Unmute" : "Mute"}
          </button>
          <button type="button" className="btn btn-primary" onClick={saveGame}>
            Save
          </button>
          {screen !== "hub" && (
            <button type="button" className="btn" onClick={() => setScreen("hub")}>
              Hub
            </button>
          )}
        </>
      )}
    </header>
  );
}
