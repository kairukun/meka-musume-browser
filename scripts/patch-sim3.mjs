import fs from "fs";
const path = "src/screens/SimScreen.tsx";
let s = fs.readFileSync(path, "utf8").replace(/\r\n/g, "\n");

s = s.replace(
  `import {
  applyEnemyAction,
  endEnemyPhase,
  listEnemyActions,
} from "../game/enemyAi";
import { ollamaPickAction, probeOllama } from "../game/ollama";
import {
  SIM_DEPLOY,
  SIM_H,
  SIM_MAP,
  SIM_W,`,
  `import {
  applyEnemyAction,
  endEnemyPhase,
  getOllamaEnabled,
  listEnemyActions,
  pickHeuristicAction,
  setOllamaEnabled,
} from "../game/enemyAi";
import { ollamaPickAction, probeOllama } from "../game/ollama";
import { ensureAudio, sfxHit, sfxLose, sfxWin } from "../game/audio";
import {
  SIM_H,
  SIM_W,`,
);

s = s.replace(
  "createSimBattle(allyStr, opforStr, { frameTuning, doctrines }),",
  "createSimBattle(allyStr, opforStr, { frameTuning, doctrines, levelId: activeSim }),",
);
s = s.replace(
  "tileLabel(cursor[0], cursor[1]), def: tileDef(cursor[0], cursor[1])",
  "tileLabel(battle.map, cursor[0], cursor[1]), def: tileDef(battle.map, cursor[0], cursor[1])",
);
s = s.replace(
  "calcDamage(selected, hoverUnit, fatigue, battle.markedId, false, doctrines)",
  "calcDamage(selected, hoverUnit, fatigue, battle.markedId, false, doctrines, battle.map)",
);

s = s.replaceAll("SIM_MAP[y][x]", "battle.map[y][x]");
s = s.replaceAll("tileImage(x, y)", "tileImage(battle.map, x, y)");
s = s.replace(
  `setBattle((b) => ({
                          ...b,
                          selected: u.id,
                          mode: "place",
                          moveTiles: [...SIM_DEPLOY],
                          log: \`Place \${u.name} on a blue tile.\`,
                        }))`,
  `setBattle((b) => ({
                          ...b,
                          selected: u.id,
                          mode: "place",
                          moveTiles: [...b.deploy],
                          log: \`Place \${u.name} on a blue tile.\`,
                        }))`,
);
s = s.replaceAll("SIM_DEPLOY", "battle.deploy");
s = s.replace(
  "calcDamage(u, target, fatigue, b.markedId, false, doctrines)",
  "calcDamage(u, target, fatigue, b.markedId, false, doctrines, b.map)",
);
s = s.replace(
  'calcDamage(u, tgt, fatigue, b.markedId, who === "emi", doctrines)',
  "calcDamage(u, tgt, fatigue, b.markedId, who === \"emi\", doctrines, b.map)",
);

const markerA = "  const [ollamaReady, setOllamaReady] = useState(false);";
const markerB = '  useEffect(() => {\n    if (battle.phase === "win") {';
const a = s.indexOf(markerA);
const b = s.indexOf(markerB);
console.log("markers", a, b);
if (a < 0 || b < 0) process.exit(1);

const newBlock = `  const [useOllama, setUseOllama] = useState(() => getOllamaEnabled());
  const [ollamaReady, setOllamaReady] = useState(false);
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [aiThinking, setAiThinking] = useState(false);
  const [ollamaError, setOllamaError] = useState<string | null>(null);
  const [retryTick, setRetryTick] = useState(0);
  const [showTutorial, setShowTutorial] = useState(() => !useGame.getState().tutorialDone);
  const [debrief, setDebrief] = useState<null | {
    won: boolean;
    clean: boolean;
    mvp: string;
    downed: string[];
    tip: string;
  }>(null);
  const enemyBusy = useRef(false);
  const finishSent = useRef(false);

  useEffect(() => { ensureAudio(); }, []);

  useEffect(() => {
    let alive = true;
    if (useOllama) {
      void probeOllama().then((r) => {
        if (!alive) return;
        setOllamaReady(r.ok);
        setOllamaModels(r.models);
      });
    }
    return () => { alive = false; };
  }, [useOllama]);

  useEffect(() => {
    if (battle.phase !== "enemy") {
      enemyBusy.current = false;
      setAiThinking(false);
      return;
    }
    if (enemyBusy.current) return;
    enemyBusy.current = true;
    let cancelled = false;

    const run = async () => {
      const snap = battle;
      const ready = snap.units.filter((u) => u.team === "enemy" && u.hp > 0 && !u.acted);
      if (!ready.length) {
        if (!cancelled) { setBattle(endEnemyPhase(snap)); enemyBusy.current = false; }
        return;
      }
      const unit = ready[0];
      const allies = snap.units.filter((u) => u.team === "ally" && u.hp > 0 && u.x != null);
      if (!allies.length) {
        if (!cancelled) { setBattle({ ...snap, phase: "lose" }); enemyBusy.current = false; }
        return;
      }

      const actions = listEnemyActions(snap, unit, fatigue, doctrines);
      let pick = pickHeuristicAction(actions);

      if (useOllama) {
        let models = ollamaModels;
        let readyOk = ollamaReady;
        if (!readyOk || !models.length) {
          const r = await probeOllama();
          readyOk = r.ok;
          models = r.models;
          setOllamaReady(r.ok);
          setOllamaModels(r.models);
        }
        if (readyOk && models.length) {
          setAiThinking(true);
          setOllamaError(null);
          const llm = await ollamaPickAction(unit.name, unit.cls, actions, models);
          setAiThinking(false);
          if (llm) pick = llm;
          else setOllamaError("Ollama missed — academy OpFor.");
        } else {
          setOllamaError("Ollama offline — academy OpFor active.");
          await new Promise((r) => window.setTimeout(r, 220));
        }
      } else {
        await new Promise((r) => window.setTimeout(r, 260));
      }

      if (cancelled || !pick) { enemyBusy.current = false; return; }
      if (pick.foeId) sfxHit();
      setBattle(applyEnemyAction(snap, unit.id, pick, fatigue, doctrines));
      enemyBusy.current = false;
    };
    void run();
    return () => { cancelled = true; };
  }, [battle.phase, battle.units, fatigue, doctrines, useOllama, ollamaReady, ollamaModels, retryTick]);

`;

s = s.slice(0, a) + newBlock + s.slice(b);

s = s.replace(
  `  useEffect(() => {
    if (battle.phase === "win") {
      const clean = battle.units.filter((u) => u.team === "ally").every((u) => u.hp > 0);
      completeSim(true, { clean });
    }
    if (battle.phase === "lose") completeSim(false);
  }, [battle.phase, battle.units, completeSim]);`,
  `  useEffect(() => {
    if (battle.phase !== "win" && battle.phase !== "lose") return;
    if (finishSent.current || debrief) return;
    finishSent.current = true;
    const allies = battle.units.filter((u) => u.team === "ally");
    const clean = allies.every((u) => u.hp > 0);
    const living = allies.filter((u) => u.hp > 0).sort((a, c) => c.hp / c.maxHp - a.hp / a.maxHp);
    const downed = allies.filter((u) => u.hp <= 0).map((u) => u.name);
    if (battle.phase === "win") sfxWin();
    else sfxLose();
    setDebrief({
      won: battle.phase === "win",
      clean,
      mvp: living[0]?.name ?? "Team 07",
      downed,
      tip: battle.tip,
    });
  }, [battle.phase, battle.units, debrief]);`,
);

const oldChip = `        <div className="simfe-chip ollama-toggle">
          <span>
            OpFor: Ollama
            {ollamaReady ? " · online" : " · offline"}
          </span>
          {(ollamaError || !ollamaReady) && (
            <button
              type="button"
              className="btn"
              style={{ padding: "2px 8px", fontSize: 11 }}
              onClick={() => {
                setOllamaError(null);
                enemyBusy.current = false;
                void refreshOllama().then(() => setRetryTick((n) => n + 1));
              }}
            >
              Retry
            </button>
          )}
        </div>
        {ollamaError && <div className="simfe-chip ollama-err">{ollamaError}</div>}`;

const newChip = `        <div className="simfe-chip tip-chip">{battle.tip}</div>
        <label className="simfe-chip ollama-toggle">
          <input
            type="checkbox"
            checked={useOllama}
            onChange={(e) => {
              setUseOllama(e.target.checked);
              setOllamaEnabled(e.target.checked);
              setOllamaError(null);
            }}
          />
          <span>
            Ollama OpFor
            {useOllama ? (ollamaReady ? " · online" : " · offline→academy") : " · academy AI"}
          </span>
        </label>
        {ollamaError && <div className="simfe-chip ollama-err">{ollamaError}</div>}`;

if (!s.includes(oldChip)) {
  console.error("chip missing");
  process.exit(1);
}
s = s.replace(oldChip, newChip);

const needle = `          <button type="button" className="btn btn-ghost" onClick={() => setScreen("hub")}>
            Abort
          </button>
        </div>
      </div>
    </div>
  );
}`;

const overlays = `          <button type="button" className="btn btn-ghost" onClick={() => setScreen("hub")}>
            Abort
          </button>
        </div>
      </div>

      {showTutorial && (
        <div className="sim-overlay">
          <div className="sim-overlay-card">
            <h2>Combat Basics</h2>
            <ol>
              <li>Deploy all five on blue tiles, then Begin.</li>
              <li>Select → move (blue) → attack red tiles or use a signature.</li>
              <li>Rubble grants DEF. Fatigue softens your hits and worsens theirs.</li>
              <li>Academy AI is default; enable Ollama for LLM OpFor.</li>
            </ol>
            <p className="muted">{battle.tip}</p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                useGame.getState().markTutorialDone();
                setShowTutorial(false);
              }}
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {debrief && (
        <div className="sim-overlay">
          <div className="sim-overlay-card">
            <h2>{debrief.won ? "Sim Debrief — Victory" : "Sim Debrief — Defeat"}</h2>
            <p>
              MVP: <strong>{debrief.mvp}</strong>
              {debrief.clean ? " · Clean run" : ""}
            </p>
            {debrief.downed.length > 0 && (
              <p className="muted">Downed: {debrief.downed.join(", ")}</p>
            )}
            <p className="muted">{debrief.tip}</p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                const d = debrief;
                setDebrief(null);
                completeSim(d.won, { clean: d.clean });
              }}
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}`;

if (!s.includes(needle)) {
  console.error("abort block missing");
  process.exit(1);
}
s = s.replace(needle, overlays);

fs.writeFileSync(path, s.replace(/\n/g, "\r\n"));
console.log("patched ok", s.length);
