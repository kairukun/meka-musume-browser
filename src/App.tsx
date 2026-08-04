import { TopBar, Toasts } from "./components/Shell";
import { BriefingScreen } from "./screens/BriefingScreen";
import { HubScreen } from "./screens/HubScreen";
import { ReportScreen, RosterScreen } from "./screens/RosterReport";
import { SimScreen } from "./screens/SimScreen";
import { TitleScreen } from "./screens/TitleScreen";
import { TrainingScreen } from "./screens/TrainingScreen";
import { useGame } from "./game/store";

export default function App() {
  const screen = useGame((s) => s.screen);
  const showChrome = screen !== "title" && screen !== "sim";

  const bleed = screen === "title" || screen === "sim" || screen === "story";

  return (
    <div className="game">
      <Toasts />
      {showChrome && <TopBar />}
      <main className={`main${bleed ? " main-bleed" : ""}`}>
        {screen === "title" && <TitleScreen />}
        {screen === "story" && <BriefingScreen />}
        {screen === "hub" && <HubScreen />}
        {screen === "roster" && <RosterScreen />}
        {screen === "report" && <ReportScreen />}
        {screen === "drill" && <TrainingScreen />}
        {screen === "sim" && <SimScreen />}
      </main>
    </div>
  );
}
