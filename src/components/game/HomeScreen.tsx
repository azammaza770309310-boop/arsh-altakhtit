"use client";

import { Crown, Play, Sparkles, Heart, Timer, Flame, LifeBuoy, BookOpen, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { MODES, MODE_ORDER, arDigits, type GameMode } from "@/lib/game-data";
import { ModeIcon } from "./ModeIcons";
import { Leaderboard } from "./Leaderboard";
import { sfx } from "@/lib/sound";

const BEST_KEY = "throne-best";

export function getBestScores(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(BEST_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function setBestScore(mode: GameMode, score: number) {
  const current = getBestScores();
  if ((current[mode] ?? 0) < score) {
    current[mode] = score;
    localStorage.setItem(BEST_KEY, JSON.stringify(current));
  }
}

export function HomeScreen({
  playerName,
  onNameChange,
  onStart,
}: {
  playerName: string;
  onNameChange: (name: string) => void;
  onStart: (mode: GameMode) => void;
}) {
  const [best, setBest] = useState<Record<string, number>>({});

  useEffect(() => {
    // قراءة أفضل النتائج من مخزن المتصفح (نظام خارجي) بعد الترطيب
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBest(getBestScores());
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-16">
      {/* البطل الملكي */}
      <header className="text-center pt-10 sm:pt-14 pb-8 slide-up">
        <div className="inline-grid place-items-center mb-5">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-gold/25 blur-2xl" aria-hidden="true" />
            <div className="relative gold-frame p-6 sm:p-8 float-soft">
              <Crown className="size-14 sm:size-16 text-gold-light" strokeWidth={1.6} />
            </div>
          </div>
        </div>
        <p className="text-gold/90 tracking-wide font-bold mb-3 text-sm sm:text-base">
          لعبة تفاعلية · مبادئ إدارة الأعمال
        </p>
        <h1 className="font-display font-bold gold-text text-6xl sm:text-8xl leading-tight drop-shadow-lg">
          عرش التخطيط
        </h1>
        <div className="gold-divider my-6 max-w-md mx-auto">
          <Sparkles className="size-5" />
        </div>
        <p className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
          كويز ملكي شامل لدرس <span className="text-gold-light font-bold">التخطيط</span>: المفهوم،
          الخصائص، الفوائد، الأنواع، العناصر، الخطوات، وخصائص التخطيط الفعال ومعوقاته.
          <br className="hidden sm:block" />
          أجيبي، اجمعي النقاط، حافظي على سلسلتك… وتوّجي ملكةً لعرش التخطيط.
        </p>
      </header>

      {/* اسم اللاعبة */}
      <section className="mb-10 slide-up" style={{ animationDelay: "0.1s" }}>
        <label
          htmlFor="player-name"
          className="block text-center text-sm font-bold text-gold-light mb-2"
        >
          اسمك يا ملكة (اختياري)
        </label>
        <input
          id="player-name"
          value={playerName}
          onChange={(e) => onNameChange(e.target.value.slice(0, 40))}
          placeholder="اكتبي اسمك ليظهر في لوحة الأبطال"
          className="block mx-auto w-full max-w-sm text-center rounded-2xl bg-white/[0.05] border border-gold/30 px-5 py-3.5 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-gold/70 focus:ring-2 focus:ring-gold/25 transition-all"
        />
      </section>

      {/* بطاقات الأنماط */}
      <section className="grid gap-5 md:grid-cols-3 mb-10" aria-label="أنماط اللعب">
        {MODE_ORDER.map((modeId, i) => {
          const mode = MODES[modeId];
          return (
            <button
              key={modeId}
              onClick={() => {
                sfx.click();
                onStart(modeId);
              }}
              className="group glass-card p-6 text-right slide-up hover:border-gold/70 hover:-translate-y-1.5 hover:shadow-[0_22px_60px_rgba(201,162,39,0.22)] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gold/50"
              style={{ animationDelay: `${0.15 + i * 0.08}s` }}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="grid place-items-center size-14 rounded-2xl bg-gradient-to-br from-gold/25 to-gold/5 border border-gold/30 group-hover:scale-110 transition-transform duration-300">
                  <ModeIcon name={mode.icon} className="size-7 text-gold-light" />
                </span>
                {best[modeId] ? (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-gold-light bg-gold/10 border border-gold/25 rounded-full px-3 py-1.5">
                    <Trophy className="size-3.5" />
                    أفضل نتيجة: <span className="numeric">{arDigits(best[modeId])}</span>
                  </span>
                ) : null}
              </div>
              <p className="text-xs font-bold text-gold/80 mb-1">{mode.tagline}</p>
              <h3 className="font-display text-3xl font-bold text-foreground mb-2.5">{mode.name}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">{mode.description}</p>
              <span className="inline-flex items-center gap-2 font-extrabold text-gold-light group-hover:gap-3.5 transition-all">
                ابدئي اللعب
                <Play className="size-4 rotate-180" />
              </span>
            </button>
          );
        })}
      </section>

      {/* قواعد سريعة */}
      <section className="glass-card p-5 sm:p-6 mb-10 slide-up" style={{ animationDelay: "0.4s" }}>
        <h3 className="font-display text-2xl font-bold text-foreground flex items-center gap-2 mb-4">
          <BookOpen className="size-6 text-gold" />
          كيف تلعبين؟
        </h3>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm text-muted-foreground leading-relaxed">
          <li className="flex items-start gap-2.5">
            <Heart className="size-5 text-red-400 shrink-0 mt-0.5" />
            لديك قلوب محدودة — كل إجابة خاطئة أو انتهاء وقت يكلفك قلبًا.
          </li>
          <li className="flex items-start gap-2.5">
            <Timer className="size-5 text-gold-light shrink-0 mt-0.5" />
            راقبي المؤقت! الإجابات السريعة تمنحك نقاط وقت إضافية في رحلة الملكة.
          </li>
          <li className="flex items-start gap-2.5">
            <Flame className="size-5 text-orange-400 shrink-0 mt-0.5" />
            الإجابات المتتالية الصحيحة تبني سلسلة تشتعل وتضاعف نقاطك.
          </li>
          <li className="flex items-start gap-2.5">
            <LifeBuoy className="size-5 text-emerald-400 shrink-0 mt-0.5" />
            مساعدات ذهبية: حذف إجابتين، وقت إضافي، وتخطّي السؤال.
          </li>
          <li className="flex items-start gap-2.5">
            <Sparkles className="size-5 text-purple-300 shrink-0 mt-0.5" />
            بعد كل سؤال يظهر توضيح من الدرس نفسه — تتعلمين وأنتِ تلعبين!
          </li>
          <li className="flex items-start gap-2.5">
            <Trophy className="size-5 text-gold shrink-0 mt-0.5" />
            سجلي نتيجتك في لوحة الأبطال وتنافسي مع زميلاتك على القمة.
          </li>
        </ul>
      </section>

      {/* لوحة الأبطال */}
      <section className="slide-up" style={{ animationDelay: "0.5s" }} aria-label="لوحة الأبطال">
        <Leaderboard initialMode="journey" />
      </section>

      <footer className="text-center text-xs text-muted-foreground/70 mt-12 leading-relaxed">
        مبادئ إدارة الأعمال · درس التخطيط — لعبة مسلية للمراجعة قبل الاختبار
      </footer>
    </div>
  );
}
