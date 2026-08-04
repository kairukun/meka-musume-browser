import { useEffect } from "react";
import { useGame } from "../game/store";

export function Toasts() {
  const queue = useGame((s) => s.notifyQueue);
  const clear = useGame((s) => s.clearNotify);
  useEffect(() => {
    if (!queue.length) return;
    const t = window.setTimeout(() => clear(queue[0].id), 2600);
    return () => window.clearTimeout(t);
  }, [queue, clear]);
  return (
    <div className="toasts" aria-live="polite">
      {queue.map((n) => (
        <div key={n.id} className="toast">
          {n.text}
        </div>
      ))}
    </div>
  );
}

export function TopBar({ showStats = true }: { showStats?: boolean }) {
  const agenda = useGame((s) => s.agenda());
  const intelligence = useGame((s) => s.intelligence);
  const fatigue = useGame((s) => s.fatigue);
  const squadStr = useGame((s) => s.squadStr());
  const saveGame = useGame((s) => s.saveGame);
  const setScreen = useGame((s) => s.setScreen);
  const screen = useGame((s) => s.screen);

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
        </>
      )}
      <div className="topbar-spacer" />
      {screen !== "title" && (
        <>
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
