import { ASSET } from "../game/crew";
import { useGame } from "../game/store";

export function TitleScreen() {
  const startStory = useGame((s) => s.startStory);
  const openHub = useGame((s) => s.openHubWithPriority);
  const introDone = useGame((s) => s.chapter1IntroDone);
  const resetGame = useGame((s) => s.resetGame);
  const saveGame = useGame((s) => s.saveGame);
  const savedAt = useGame((s) => s.savedAt);

  return (
    <div className="title-screen">
      <div className="title-card">
        <img src={ASSET.logo} alt="Meka Musume" />
        <h1>Tokyo Kikai Academy</h1>
        <p>Command Team 07. Train before the coast goes loud.</p>
        <div className="title-actions">
          {!introDone ? (
            <button type="button" className="btn btn-primary" onClick={() => startStory("chapter1")}>
              Begin Assignment
            </button>
          ) : (
            <>
              <button type="button" className="btn btn-primary" onClick={openHub}>
                Enter Bay 07
              </button>
              <button type="button" className="btn" onClick={saveGame}>
                Save Progress
              </button>
            </>
          )}
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => {
              if (window.confirm("Wipe local save and start over?")) {
                resetGame();
                startStory("chapter1");
              }
            }}
          >
            New Game
          </button>
        </div>
        {savedAt && <p className="muted">Last save · {savedAt}</p>}
      </div>
    </div>
  );
}
