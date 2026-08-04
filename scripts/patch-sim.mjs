import fs from "fs";

let s = fs.readFileSync("src/screens/SimScreen.tsx", "utf8");

s = s.replace(
  /import \{\n  applyEnemyAction,\n  endEnemyPhase,\n  listEnemyActions,\n\} from "\.\.\/game\/enemyAi";\nimport \{ ollamaPickAction, probeOllama \} from "\.\.\/game\/ollama";\nimport \{\n  SIM_DEPLOY,\n  SIM_H,\n  SIM_MAP,\n  SIM_W,/,
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
  '? { label: tileLabel(cursor[0], cursor[1]), def: tileDef(cursor[0], cursor[1]) }\n    : { label: "Ash Plaza", def: 0 };',
  '? { label: tileLabel(battle.map, cursor[0], cursor[1]), def: tileDef(battle.map, cursor[0], cursor[1]) }\n    : { label: "Field", def: 0 };',
);

s = s.replace(
  "const dmg = calcDamage(selected, hoverUnit, fatigue, battle.markedId, false, doctrines);",
  "const dmg = calcDamage(selected, hoverUnit, fatigue, battle.markedId, false, doctrines, battle.map);",
);

// Replace enemy AI effect block — find from useOllama-less version
const enemyStart = s.indexOf("  const [ollamaReady, setOllamaReady]");
const enemyEnd = s.indexOf("  useEffect(() => {\n    if (battle.phase === \"win\")");
if (enemyStart < 0 || enemyEnd < 0) throw new Error("enemy block markers missing");

const newEnemy = `  const [useOllama, setUseOllama] = useState(() => getOllamaEnabled());
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

  const refreshOllama = async () => {
    const r = await probeOllama();
    setOllamaReady(r.ok);
    setOllamaModels(r.models);
    return r;
  };

  useEffect(() => {
    ensureAudio();
  }, []);

  useEffect(() => {
    let alive = true;
    if (useOllama) {
      refreshOllama().then((r) => {
        if (!alive) return;
        setOllamaReady(r.ok);
        setOllamaModels(r.models);
      });
    }
    return () => {
      alive = false;
    };
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
        if (!cancelled) {
          setBattle(endEnemyPhase(snap));
          enemyBusy.current = false;
        }
        return;
      }
      const unit = ready[0];
      const allies = snap.units.filter((u) => u.team === "ally" && u.hp > 0 && u.x != null);
      if (!allies.length) {
        if (!cancelled) {
          setBattle({ ...snap, phase: "lose" });
          enemyBusy.current = false;
        }
        return;
      }

      const actions = listEnemyActions(snap, unit, fatigue, doctrines);
      let pick = pickHeuristicAction(actions);

      if (useOllama) {
        let models = ollamaModels;
        let readyOk = ollamaReady;
        if (!readyOk || !models.length) {
          const r = await refreshOllama();
          readyOk = r.ok;
          models = r.models;
        }
        if (readyOk && models.length) {
          setAiThinking(true);
          setOllamaError(null);
          const llm = await ollamaPickAction(unit.name, unit.cls, actions, models);
          setAiThinking(false);
          if (llm) pick = llm;
          else setOllamaError("Ollama missed — using academy OpFor.");
        } else {
          setOllamaError("Ollama offline — academy OpFor active.");
          await new Promise((r) => window.setTimeout(r, 220));
        }
      } else {
        await new Promise((r) => window.setTimeout(r, 260));
      }

      if (cancelled || !pick) {
        enemyBusy.current = false;
        return;
      }
      if (pick.foeId) sfxHit();
      setBattle(applyEnemyAction(snap, unit.id, pick, fatigue, doctrines));
      enemyBusy.current = false;
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [battle.phase, battle.units, fatigue, doctrines, useOllama, ollamaReady, ollamaModels, retryTick]);

`;

s = s.slice(0, enemyStart) + newEnemy + s.slice(enemyEnd);

s = s.replace(
  /  useEffect\(\(\) => \{\n    if \(battle\.phase === "win"\) \{\n      const clean = battle\.units\.filter\(\(u\) => u\.team === "ally"\)\.every\(\(u\) => u\.hp > 0\);\n      completeSim\(true, \{ clean \}\);\n    \}\n    if \(battle\.phase === "lose"\) completeSim\(false\);\n  \}, \[battle\.phase, battle\.units, completeSim\]\);/,
  `  useEffect(() => {
    if (battle.phase !== "win" && battle.phase !== "lose") return;
    if (finishSent.current || debrief) return;
    finishSent.current = true;
    const allies = battle.units.filter((u) => u.team === "ally");
    const clean = allies.every((u) => u.hp > 0);
    const living = allies.filter((u) => u.hp > 0).sort((a, b) => b.hp / b.maxHp - a.hp / a.maxHp);
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

s = s.replace(/SIM_DEPLOY/g, "battle.deploy");
s = s.replace(/SIM_MAP\[y\]\[x\]/g, "battle.map[y][x]");
s = s.replace(/tileImage\(x, y\)/g, "tileImage(battle.map, x, y)");
s = s.replace(
  /const dmg = calcDamage\(u, target, fatigue, b\.markedId, false, doctrines\);/g,
  "const dmg = calcDamage(u, target, fatigue, b.markedId, false, doctrines, b.map); sfxHit();",
);
s = s.replace(
  /const dmg = calcDamage\(u, tgt, fatigue, b\.markedId, who === "emi", doctrines\);/g,
  "const dmg = calcDamage(u, tgt, fatigue, b.markedId, who === \"emi\", doctrines, b.map); sfxHit();",
);

// Fix deploy buttons that incorrectly became battle.deploy inside setBattle callbacks — those use b
s = s.replace(
  /moveTiles: \[\.\.\.battle\.deploy\],\n                          log: `Place \$\{u\.name\}/g,
  "moveTiles: [...b.deploy],\n                          log: `Place ${u.name}",
);

// Ollama HUD chip
s = s.replace(
  /        <div className="simfe-chip ollama-toggle">[\s\S]*?\{ollamaError && <div className="simfe-chip ollama-err">\{ollamaError\}<\/div>\}/,
  `        <div className="simfe-chip tip-chip">{battle.tip}</div>

        <label className="simfe-chip ollama-toggle">
          <input
            type="checkbox"
            checked={useOllama}
            onChange={(e) => {
              const on = e.target.checked;
              setUseOllama(on);
              setOllamaEnabled(on);
              setOllamaError(null);
            }}
          />
          <span>
            Ollama OpFor
            {useOllama ? (ollamaReady ? " · online" : " · offline→academy") : " · academy AI"}
          </span>
          {useOllama && ollamaError && (
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
        </label>
        {ollamaError && <div className="simfe-chip ollama-err">{ollamaError}</div>}`,
);

// Insert tutorial + debrief before closing of root div — find last </div>\\n    </div>\\n  ); before final }
const insertBefore = s.lastIndexOf("    </div>\n  );\n}");
if (insertBefore < 0) throw new Error("closing not found");
const overlays = `
      {showTutorial && (
        <div className="sim-overlay">
          <div className="sim-overlay-card">
            <h2>Combat Basics</h2>
            <ol>
              <li>Deploy all five on blue tiles, then Begin.</li>
              <li>Select → move (blue) → attack red tiles or use a signature.</li>
              <li>Rubble grants DEF. Fatigue softens your hits and worsens theirs.</li>
              <li>OpFor uses academy AI by default; enable Ollama for LLM coaching.</li>
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
`;
s = s.slice(0, insertBefore) + overlays + s.slice(insertBefore);

fs.writeFileSync("src/screens/SimScreen.tsx", s);
console.log("SimScreen patched", s.length);
