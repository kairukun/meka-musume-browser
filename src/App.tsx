import { useEffect } from "react";
import { ensureAudio, setAudioMuted, setMusicTrack, stopAmbient } from "./game/audio";
import { StatusRail, TopBar } from "./components/Shell";
import { BriefingScreen } from "./screens/BriefingScreen";
import { DevelopScreen, DoctrineScreen } from "./screens/DevelopScreen";
import { GalleryScreen } from "./screens/GalleryScreen";
import { HubScreen } from "./screens/HubScreen";
import { ReportScreen, RosterScreen } from "./screens/RosterReport";
import { SavesScreen } from "./screens/SavesScreen";
import { SimScreen } from "./screens/SimScreen";
import { TitleScreen } from "./screens/TitleScreen";
import { TrainingScreen } from "./screens/TrainingScreen";
import { useGame } from "./game/store";

export default function App() {
  const screen = useGame((s) => s.screen);
  const audioMuted = useGame((s) => s.audioMuted);
  const showChrome = screen !== "title" && screen !== "sim";

  const bleed = screen === "title" || screen === "sim" || screen === "story";

  useEffect(() => {
    setAudioMuted(audioMuted);
    if (audioMuted) stopAmbient();
  }, [audioMuted]);

  useEffect(() => {
    if (audioMuted) return;
    if (screen === "sim") setMusicTrack("battle");
    else setMusicTrack("hub");
  }, [screen, audioMuted]);

  return (
    <div
      className="game"
      onPointerDown={() => {
        ensureAudio();
      }}
    >
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
        {screen === "gallery" && <GalleryScreen />}
        {screen === "saves" && <SavesScreen />}
      </main>
    </div>
  );
}
