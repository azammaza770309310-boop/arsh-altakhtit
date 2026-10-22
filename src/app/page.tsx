"use client";

import { useCallback, useEffect, useState } from "react";
import { Crown, Volume2, VolumeX } from "lucide-react";
import { Aurora } from "@/components/game/Aurora";
import { HomeScreen } from "@/components/game/HomeScreen";
import { GameScreen, type GameResults } from "@/components/game/GameScreen";
import { ResultsScreen } from "@/components/game/ResultsScreen";
import { ReviewScreen } from "@/components/game/ReviewScreen";
import { loadMuted, setMuted, sfx } from "@/lib/sound";
import type { GameMode } from "@/lib/game-data";

type Screen = "home" | "game" | "results" | "review";

const NAME_KEY = "throne-player-name";

export default function Page() {
  const [screen, setScreen] = useState<Screen>("home");
  const [mode, setMode] = useState<GameMode>("journey");
  const [runId, setRunId] = useState(0);
  const [results, setResults] = useState<GameResults | null>(null);
  const [playerName, setPlayerName] = useState("");
  const [muted, setMutedState] = useState(false);

  useEffect(() => {
    // مزامنة لمرة واحدة مع مخزن المتصفح (نظام خارجي) — تقرأ بعد الترطيب لتجنب اختلاف الخادم
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPlayerName(localStorage.getItem(NAME_KEY) ?? "");
    setMutedState(loadMuted());
  }, []);

  const handleNameChange = useCallback((name: string) => {
    setPlayerName(name);
    localStorage.setItem(NAME_KEY, name);
  }, []);

  const toggleMute = useCallback(() => {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
    if (!next) sfx.click();
  }, [muted]);

  const startGame = useCallback((m: GameMode) => {
    setMode(m);
    setRunId((r) => r + 1);
    setResults(null);
    setScreen("game");
    // تفعيل سياق الصوت بأول لمسة للمستخدم
    sfx.click();
  }, []);

  const finishGame = useCallback((r: GameResults) => {
    setResults(r);
    setScreen("results");
  }, []);

  const replay = useCallback(() => {
    setRunId((r) => r + 1);
    setResults(null);
    setScreen("game");
  }, []);

  return (
    <div className="relative min-h-screen">
      <Aurora />

      {/* شريط علوي أنيق */}
      <div className="sticky top-0 z-40 backdrop-blur-md bg-[#0b0e1d]/70 border-b border-gold/15">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <button
            onClick={() => {
              if (screen !== "home") {
                sfx.click();
                setScreen("home");
              }
            }}
            className="flex items-center gap-2.5 group"
            aria-label="العودة إلى الرئيسية"
          >
            <Crown className="size-6 text-gold-light group-hover:scale-110 transition-transform" />
            <span className="font-display font-bold text-xl gold-text">عرش التخطيط</span>
          </button>
          <button
            onClick={toggleMute}
            className="btn-ghost-gold p-2.5"
            aria-label={muted ? "تشغيل الأصوات" : "كتم الأصوات"}
            title={muted ? "تشغيل الأصوات" : "كتم الأصوات"}
          >
            {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
          </button>
        </div>
      </div>

      <main>
        {screen === "home" && (
          <HomeScreen playerName={playerName} onNameChange={handleNameChange} onStart={startGame} />
        )}

        {screen === "game" && (
          <GameScreen
            key={`${mode}-${runId}`}
            mode={mode}
            onFinish={finishGame}
            onQuit={() => setScreen("home")}
          />
        )}

        {screen === "results" && results && (
          <ResultsScreen
            results={results}
            playerName={playerName}
            onReplay={replay}
            onReview={() => setScreen("review")}
            onHome={() => setScreen("home")}
          />
        )}

        {screen === "review" && results && (
          <ReviewScreen results={results} onReplay={replay} onHome={() => setScreen("home")} />
        )}
      </main>
    </div>
  );
}
