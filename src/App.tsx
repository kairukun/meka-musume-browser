import { StatusRail, TopBar } from "./components/Shell";
import { BriefingScreen } from "./screens/BriefingScreen";
import { DevelopScreen, DoctrineScreen } from "./screens/DevelopScreen";
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
      {showChrome && <TopBar />}
      <StatusRail />
      <main className={`main${bleed ? " main-bleed" : ""}`}>
        {screen === "title" && <TitleScreen />}
        {screen === "story" && <BriefingScreen />}
        {screen === "hub" && <HubScreen />}
        {screen === "roster" && <RosterScreen />}
        {screen === "report" && <ReportScreen />}
        {screen === "drill" && <TrainingScreen />}
        {screen === "develop" && <DevelopScreen />}
        {screen === "doctrine" && <DoctrineScreen />}
        {screen === "sim" && <SimScreen />}
      </main>
    </div>
  );
}
