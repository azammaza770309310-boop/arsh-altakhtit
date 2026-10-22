"use client";

import { useEffect, useState } from "react";
import {
  Crown,
  Trophy,
  Flame,
  Target,
  RotateCcw,
  Home,
  ListChecks,
  Save,
  Loader2,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { MODES, arDigits, getRank } from "@/lib/game-data";
import { celebrate } from "@/lib/confetti";
import { sfx } from "@/lib/sound";
import { setBestScore } from "./HomeScreen";
import { Leaderboard } from "./Leaderboard";
import type { GameResults } from "./GameScreen";
import { ModeIcon } from "./ModeIcons";

export function ResultsScreen({
  results,
  playerName,
  onReplay,
  onReview,
  onHome,
}: {
  results: GameResults;
  playerName: string;
  onReplay: () => void;
  onReview: () => void;
  onHome: () => void;
}) {
  const accuracy = Math.round((results.correct / results.total) * 100);
  const rank = getRank(accuracy);
  const mode = MODES[results.mode];

  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [savedRank, setSavedRank] = useState<number | null>(null);
  const [savedId, setSavedId] = useState<number | null>(null);
  const [name, setName] = useState(playerName);

  useEffect(() => {
    setBestScore(results.mode, results.score);
    if (results.victory || accuracy >= 75) {
      sfx.win();
      celebrate();
    } else {
      sfx.lose();
    }
  }, []);

  async function saveScore() {
    const finalName = name.trim() || "لاعبة مجهولة";
    setSaveState("saving");
    try {
      const res = await fetch("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerName: finalName,
          mode: results.mode,
          score: results.score,
          accuracy,
          bestStreak: results.bestStreak,
          correct: results.correct,
          total: results.total,
        }),
      });
      if (!res.ok) throw new Error("failed");
      const data = await res.json();
      setSavedRank(data.rank ?? null);
      setSavedId(data.score?.id ?? null);
      setSaveState("saved");
      sfx.correct();
    } catch {
      setSaveState("error");
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-16 pt-8">
      {/* التاج */}
      <header className="text-center mb-8 slide-up">
        <div className="inline-grid place-items-center mb-5">
          <div className="relative">
            <div
              className={`absolute inset-0 rounded-full blur-2xl ${
                results.victory ? "bg-gold/40" : "bg-purple-500/25"
              }`}
              aria-hidden="true"
            />
            <div className="relative gold-frame p-7 sm:p-9 float-soft">
              <ModeIcon
                name={results.victory ? "crown" : rank.icon}
                className="size-16 sm:size-20 text-gold-light"
                strokeWidth={1.4}
              />
            </div>
          </div>
        </div>
        <p className="text-gold/90 font-bold mb-2">
          {results.victory ? "إنجاز ملكي مكتمل!" : "انتهت الجولة"}
        </p>
        <h1 className="font-display font-bold gold-text text-4xl sm:text-6xl leading-tight mb-3">
          {rank.title}
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
          {rank.description}
        </p>
        {playerName && (
          <p className="mt-3 text-gold-light font-bold flex items-center justify-center gap-2">
            <Sparkles className="size-4" />
            {playerName}
          </p>
        )}
      </header>

      {/* النتائج */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-8">
        <StatCard
          icon={<Trophy className="size-5" />}
          label="النقاط"
          value={arDigits(results.score)}
          accent
        />
        <StatCard
          icon={<Target className="size-5" />}
          label="الدقة"
          value={`${arDigits(accuracy)}٪`}
          sub={`${arDigits(results.correct)} من ${arDigits(results.total)}`}
        />
        <StatCard
          icon={<Flame className="size-5" />}
          label="أطول سلسلة"
          value={arDigits(results.bestStreak)}
        />
        <StatCard
          icon={<Crown className="size-5" />}
          label="النمط"
          value={mode.name}
          small
        />
      </section>

      {/* حفظ النتيجة */}
      <section className="glass-card p-5 sm:p-6 mb-8 slide-up" style={{ animationDelay: "0.15s" }}>
        {saveState === "saved" ? (
          <div className="text-center py-2">
            <p className="flex items-center justify-center gap-2 font-extrabold text-emerald-300 text-lg mb-1.5">
              <CheckCircle2 className="size-6" />
              سُجِّلت نتيجتك في لوحة الأبطال
              {savedRank ? <> — المركز {arDigits(savedRank)} في «{mode.name}»!</> : null}
            </p>
            <p className="text-sm text-muted-foreground">تنافسي مع زميلاتك… عرش التخطيط ينتظر صاحبته.</p>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="flex-1">
              <label htmlFor="result-name" className="block text-sm font-bold text-gold-light mb-1.5">
                سجّلي اسمك في لوحة الأبطال
              </label>
              <input
                id="result-name"
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 40))}
                placeholder="اسمك يا ملكة"
                className="w-full rounded-xl bg-white/[0.05] border border-gold/30 px-4 py-3 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-gold/70 focus:ring-2 focus:ring-gold/25 transition-all"
              />
            </div>
            <button
              onClick={() => void saveScore()}
              disabled={saveState === "saving"}
              className="btn-gold px-7 py-3.5 font-extrabold flex items-center justify-center gap-2 shrink-0"
            >
              {saveState === "saving" ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <Save className="size-5" />
              )}
              حفظ النتيجة
            </button>
          </div>
        )}
        {saveState === "error" && (
          <p className="text-red-300 text-sm mt-3 text-center">
            تعذر الحفظ — تأكدي من الاتصال ثم حاولي مجددًا.
          </p>
        )}
      </section>

      {/* الأزرار */}
      <section className="grid sm:grid-cols-3 gap-3.5 mb-10 slide-up" style={{ animationDelay: "0.25s" }}>
        <button onClick={onReplay} className="btn-gold py-4 text-lg flex items-center justify-center gap-2.5">
          <RotateCcw className="size-5" />
          جولة أخرى
        </button>
        <button onClick={onReview} className="btn-ghost-gold py-4 text-lg font-extrabold flex items-center justify-center gap-2.5">
          <ListChecks className="size-5" />
          راجعي إجاباتك
        </button>
        <button onClick={onHome} className="btn-ghost-gold py-4 text-lg font-extrabold flex items-center justify-center gap-2.5">
          <Home className="size-5" />
          الرئيسية
        </button>
      </section>

      {/* اللوحة بعد الحفظ */}
      <section className="slide-up" style={{ animationDelay: "0.35s" }}>
        <Leaderboard initialMode={results.mode} highlightId={savedId} />
      </section>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  accent,
  small,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
  small?: boolean;
}) {
  return (
    <div
      className={`glass-card p-4 text-center ${accent ? "border-gold/60 bg-gold/[0.07] pulse-gold" : ""}`}
    >
      <span
        className={`inline-grid place-items-center size-10 rounded-xl mb-2 ${
          accent ? "bg-gold/20 text-gold-light" : "bg-white/5 text-gold/80"
        }`}
      >
        {icon}
      </span>
      <p className="text-xs font-bold text-muted-foreground mb-1">{label}</p>
      <p className={`numeric font-extrabold text-gold-pale ${small ? "text-base" : "text-2xl"}`}>{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground mt-1 numeric">{sub}</p>}
    </div>
  );
}
