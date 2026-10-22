"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Crown,
  Heart,
  Flame,
  Star,
  Timer,
  Scissors,
  SkipForward,
  CheckCircle2,
  XCircle,
  Lightbulb,
  ChevronLeft,
  Zap,
} from "lucide-react";
import {
  MODES,
  LETTERS,
  arDigits,
  fmtTime,
  shuffle,
  buildQuestionSet,
  type AnswerRecord,
  type GameMode,
  type Question,
} from "@/lib/game-data";
import { QUESTIONS } from "@/lib/questions";
import { sfx } from "@/lib/sound";
import { burst } from "@/lib/confetti";

export interface GameResults {
  mode: GameMode;
  score: number;
  correct: number;
  total: number;
  bestStreak: number;
  answers: AnswerRecord[];
  victory: boolean;
}

interface PreparedQuestion extends Question {
  opts: string[];
  correct: number;
}

function prepareQuestion(q: Question): PreparedQuestion {
  if (q.type === "tf") return { ...q, opts: q.options, correct: q.correctIndex };
  const indices = shuffle(q.options.map((_, i) => i));
  return {
    ...q,
    opts: indices.map((i) => q.options[i]),
    correct: indices.indexOf(q.correctIndex),
  };
}

function prepareSet(mode: GameMode): PreparedQuestion[] {
  return buildQuestionSet(QUESTIONS, mode).map(prepareQuestion);
}

export function GameScreen({
  mode,
  onFinish,
  onQuit,
}: {
  mode: GameMode;
  onFinish: (results: GameResults) => void;
  onQuit: () => void;
}) {
  const config = MODES[mode];
  const [questions] = useState<PreparedQuestion[]>(() => prepareSet(mode));
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [lives, setLives] = useState(config.lives);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [phase, setPhase] = useState<"answering" | "revealed">("answering");
  const [chosen, setChosen] = useState<number | null>(null);
  const [removed, setRemoved] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(config.secondsPerQuestion ?? config.totalSeconds ?? 0);
  const [lifelines, setLifelines] = useState({ ...config.lifelines });
  const [gained, setGained] = useState<{ id: number; points: number } | null>(null);
  const [confirmQuit, setConfirmQuit] = useState(false);
  const bankedRef = useRef(0);
  const finishedRef = useRef(false);

  const q = questions[Math.min(qIndex, questions.length - 1)];
  const survivalLadder = config.survivalLadder ?? [];
  const perQuestionSeconds = config.secondsPerQuestion ?? 0;
  const isSpeed = mode === "speed";
  const answeredCount = answers.length;
  const gameOver = lives <= 0;
  const bankEmpty = isSpeed && answeredCount >= questions.length;

  /* نافذة النقاط المكتسبة */
  useEffect(() => {
    if (!gained) return;
    const id = setTimeout(() => setGained(null), 1800);
    return () => clearTimeout(id);
  }, [gained]);

  /* ── المؤقت ── */
  useEffect(() => {
    if (phase !== "answering" || finishedRef.current) return;
    const id = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, [phase, qIndex]);

  useEffect(() => {
    if (phase !== "answering") return;
    const threshold = isSpeed ? 10 : 5;
    if (timeLeft > 0 && timeLeft <= threshold) sfx.tick();
  }, [timeLeft, phase, isSpeed]);

  /* ── إنهاء اللعبة ── */
  function finishGame(victory: boolean) {
    if (finishedRef.current) return;
    finishedRef.current = true;
    let finalScore = score;
    if (mode === "survival" && !victory) {
      finalScore = survivalLadder.slice(0, bankedRef.current).reduce((s, v) => s + v, 0);
    }
    onFinish({
      mode,
      score: Math.max(0, Math.round(finalScore)),
      correct: answers.filter((a) => a.correct).length,
      total: Math.max(1, answeredCount),
      bestStreak,
      answers,
      victory: victory && lives > 0,
    });
  }

  /* ── الإجابة ── */
  function handleAnswer(idx: number | null) {
    if (phase !== "answering" || finishedRef.current) return;
    const isCorrect = idx !== null && idx === q.correct;
    const currentStreak = isCorrect ? streak + 1 : 0;
    let points = 0;

    if (isCorrect) {
      if (mode === "journey") {
        points =
          config.basePoints +
          Math.round(50 * (timeLeft / perQuestionSeconds)) +
          25 * Math.min(currentStreak - 1, 4);
      } else if (mode === "speed") {
        points = config.basePoints + 10 * Math.min(currentStreak - 1, 5);
        setTimeLeft((t) => Math.min(t + 5, 150));
      } else {
        points = survivalLadder[qIndex] ?? 100;
      }
      setScore((s) => s + points);
      setGained({ id: Date.now(), points });
      burst(window.innerWidth / 2, window.innerHeight * 0.35, 45);
      sfx.correct();
      if (currentStreak >= 3) sfx.streak(currentStreak);
      if (mode === "survival" && (config.checkpointIndexes ?? []).includes(qIndex)) {
        bankedRef.current = qIndex + 1;
      }
    } else {
      sfx.wrong();
      setLives((l) => Math.max(0, l - 1));
    }

    setStreak(currentStreak);
    setBestStreak((b) => Math.max(b, currentStreak));
    setChosen(idx);
    setPhase("revealed");
    setAnswers((prev) => [
      ...prev,
      {
        question: q,
        chosenIndex: idx,
        correct: isCorrect,
        pointsEarned: points,
        timeLeft,
      },
    ]);
  }

  /* ── السؤال التالي ── */
  function goNext() {
    if (finishedRef.current) return;
    if (gameOver) {
      finishGame(false);
      return;
    }
    if (isSpeed && (timeLeft <= 0 || bankEmpty)) {
      finishGame(lives > 0);
      return;
    }
    if (qIndex + 1 >= questions.length) {
      finishGame(true);
      return;
    }
    sfx.click();
    setQIndex((i) => i + 1);
    setChosen(null);
    setRemoved([]);
    setPhase("answering");
    setTimeLeft(config.secondsPerQuestion ?? config.totalSeconds ?? 0);
  }

  /* ── المساعدات ── */
  function useFifty() {
    if (lifelines.fifty <= 0 || q.type === "tf" || phase !== "answering") return;
    sfx.lifeline();
    const wrongIdx = q.opts.map((_, i) => i).filter((i) => i !== q.correct);
    const toRemove = shuffle(wrongIdx).slice(0, 2);
    setRemoved(toRemove);
    setLifelines((l) => ({ ...l, fifty: l.fifty - 1 }));
  }

  function useTime() {
    if (lifelines.time <= 0 || phase !== "answering") return;
    sfx.lifeline();
    setTimeLeft((t) => t + (isSpeed ? 10 : 15));
    setLifelines((l) => ({ ...l, time: l.time - 1 }));
  }

  function useSkip() {
    if (lifelines.skip <= 0 || phase !== "answering") return;
    sfx.lifeline();
    const record: AnswerRecord = {
      question: q,
      chosenIndex: null,
      correct: false,
      pointsEarned: 0,
      timeLeft,
    };
    const updated = [...answers, record];
    setAnswers(updated);
    setStreak(0);
    setLifelines((l) => ({ ...l, skip: l.skip - 1 }));
    if (qIndex + 1 >= questions.length) {
      // تخطّي آخر سؤال: إنهاء مباشر دون خصم قلب
      if (!finishedRef.current) {
        finishedRef.current = true;
        onFinish({
          mode,
          score,
          correct: updated.filter((a) => a.correct).length,
          total: Math.max(1, updated.length),
          bestStreak,
          answers: updated,
          victory: lives > 0,
        });
      }
      return;
    }
    setQIndex((i) => i + 1);
    setChosen(null);
    setRemoved([]);
    setTimeLeft(config.secondsPerQuestion ?? config.totalSeconds ?? 0);
  }

  /* ── انتهاء الوقت ── (بعد تعريف الدوال حتى لا يُسبق الإعلان) */
  useEffect(() => {
    if (timeLeft === 0 && phase === "answering" && !finishedRef.current) {
      if (isSpeed) {
        finishGame(lives > 0);
      } else {
        // حدث خارجي (انتهاء المؤقت) يستدعي منطق الإجابة — حالة مشروعة للتحديث
        // eslint-disable-next-line react-hooks/set-state-in-effect
        handleAnswer(null);
      }
    }
  }, [timeLeft, phase]);

  const timerRatio = isSpeed
    ? timeLeft / (config.totalSeconds ?? 90)
    : perQuestionSeconds
      ? timeLeft / perQuestionSeconds
      : 1;

  const isLastQuestion = qIndex + 1 >= questions.length;
  const nextLabel =
    gameOver || (isSpeed && (timeLeft <= 0 || bankEmpty)) || isLastQuestion
      ? "عرض النتائج"
      : "السؤال التالي";

  const sectionStars = useMemo(
    () => [1, 2, 3].map((d) => d <= q.difficulty),
    [q.difficulty]
  );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-16 pt-6">
      {/* شريط الحالة */}
      <header className="glass-card p-4 sm:p-5 mb-6 pop-in" key={`hud-${qIndex}`}>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          {/* اسم النمط */}
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="grid place-items-center size-10 rounded-xl bg-gold/15 border border-gold/30 shrink-0">
              {mode === "speed" ? (
                <Zap className="size-5 text-gold-light" />
              ) : mode === "survival" ? (
                <Flame className="size-5 text-gold-light" />
              ) : (
                <Crown className="size-5 text-gold-light" />
              )}
            </span>
            <div className="min-w-0">
              <p className="font-extrabold text-sm sm:text-base text-foreground truncate">
                {config.name}
              </p>
              <p className="text-xs text-muted-foreground numeric">
                {isSpeed
                  ? `السؤال ${arDigits(answeredCount + 1)}`
                  : `السؤال ${arDigits(qIndex + 1)} من ${arDigits(questions.length)}`}
              </p>
            </div>
          </div>

          {/* القلوب */}
          {!isSpeed && (
            <div className="flex items-center gap-1" aria-label={`الأرواح المتبقية ${lives}`}>
              {Array.from({ length: config.lives }, (_, i) => (
                <Heart
                  key={i}
                  className={`size-5 transition-all ${
                    i < lives
                      ? "text-red-400 fill-red-400 drop-shadow-[0_0_6px_rgba(248,113,113,0.5)]"
                      : "text-white/15"
                  } ${gameOver && i === lives ? "heartbeat" : ""}`}
                />
              ))}
            </div>
          )}

          <div className="flex-1" />

          {/* السلسلة */}
          {streak >= 2 && (
            <span className="flex items-center gap-1.5 font-extrabold text-orange-300 bg-orange-400/10 border border-orange-300/30 rounded-full px-3.5 py-1.5 text-sm pop-in">
              <Flame className="size-4" />
              سلسلة ×{arDigits(streak)}
            </span>
          )}

          {/* النقاط */}
          <div className="relative flex items-center gap-2 bg-gold/10 border border-gold/30 rounded-full px-4 py-1.5">
            <Star className="size-4 text-gold-light fill-gold-light" />
            <span className="numeric font-extrabold text-gold-light text-lg">{arDigits(score)}</span>
            {gained && (
              <span
                key={gained.id}
                className="absolute -top-7 -left-2 text-emerald-300 font-extrabold numeric pop-in pointer-events-none"
              >
                +{arDigits(gained.points)}
              </span>
            )}
          </div>

          {/* خروج */}
          <button
            onClick={() => {
              if (confirmQuit) onQuit();
              else {
                sfx.click();
                setConfirmQuit(true);
                setTimeout(() => setConfirmQuit(false), 2500);
              }
            }}
            className={`text-xs font-bold rounded-full px-3 py-1.5 transition-all ${
              confirmQuit
                ? "bg-red-500/80 text-white"
                : "bg-white/5 text-muted-foreground hover:bg-red-500/20 hover:text-red-300 border border-white/10"
            }`}
          >
            {confirmQuit ? "متأكدة؟" : "إنهاء"}
          </button>
        </div>

        {/* شريط التقدم */}
        {!isSpeed && (
          <div className="mt-4 h-2 rounded-full bg-white/5 overflow-hidden" role="progressbar"
            aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={qIndex}>
            <div
              className="h-full rounded-full bg-gradient-to-l from-gold-light via-gold to-gold/60 transition-all duration-700"
              style={{ width: `${(qIndex / questions.length) * 100}%` }}
            />
          </div>
        )}
      </header>

      {/* بطاقة السؤال */}
      <article
        key={`q-${qIndex}`}
        className="gold-frame p-6 sm:p-8 relative pop-in"
      >
        {/* حلقة المؤقت */}
        {phase === "answering" && (
          <div className="absolute -top-6 -left-2 sm:-left-4" aria-label={`الوقت المتبقي ${timeLeft} ثانية`}>
            <svg viewBox="0 0 72 72" className="size-[72px] sm:size-20 -rotate-90">
              <circle cx="36" cy="36" r="32" fill="#0b0e1d" stroke="rgba(255,255,255,0.08)" strokeWidth="7" />
              <circle
                cx="36" cy="36" r="32" fill="none"
                stroke={timerRatio > 0.35 ? "#e8c766" : timerRatio > 0.15 ? "#f59e0b" : "#ef4444"}
                strokeWidth="7" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 32}
                strokeDashoffset={2 * Math.PI * 32 * (1 - Math.max(0, Math.min(1, timerRatio)))}
                style={{ transition: "stroke-dashoffset 1s linear, stroke 0.4s" }}
              />
            </svg>
            <span className="absolute inset-0 grid place-items-center numeric font-extrabold text-lg sm:text-xl text-gold-pale">
              {isSpeed ? fmtTime(timeLeft) : arDigits(timeLeft)}
            </span>
          </div>
        )}

        {/* المحور والصعوبة */}
        <div className="flex flex-wrap items-center gap-2.5 mb-4">
          <span className="text-xs font-bold bg-purple-400/10 text-purple-200 border border-purple-300/25 rounded-full px-3.5 py-1.5">
            {q.section}
          </span>
          <span className="flex items-center gap-0.5" aria-label={`مستوى الصعوبة ${q.difficulty} من 3`}>
            {sectionStars.map((filled, i) => (
              <Star
                key={i}
                className={`size-3.5 ${filled ? "text-gold-light fill-gold-light" : "text-white/20"}`}
              />
            ))}
          </span>
        </div>

        {/* نص السؤال */}
        <h2 className="text-xl sm:text-3xl font-extrabold leading-relaxed text-foreground mb-7">
          {q.text.split("**").map((part, i) =>
            i % 2 === 1 ? (
              <span key={i} className="text-gold-light">
                {part}
              </span>
            ) : (
              <span key={i}>{part}</span>
            )
          )}
        </h2>

        {/* الخيارات */}
        <div className={`grid gap-3.5 ${q.type === "tf" ? "grid-cols-2" : "sm:grid-cols-2"}`}>
          {q.opts.map((opt, i) => {
            const isCorrectOpt = i === q.correct;
            const isChosen = i === chosen;
            const isRemoved = removed.includes(i);
            const revealed = phase === "revealed";
            let cls =
              "group relative flex items-center gap-3.5 rounded-2xl border px-4.5 sm:px-5 py-4 text-right font-bold transition-all duration-300 ";
            if (isRemoved) {
              cls += "opacity-25 line-through border-white/5 bg-white/[0.02] cursor-not-allowed ";
            } else if (revealed && isCorrectOpt) {
              cls += "border-emerald-400/70 bg-emerald-400/12 text-emerald-100 shadow-[0_0_30px_rgba(52,211,153,0.2)] ";
            } else if (revealed && isChosen && !isCorrectOpt) {
              cls += "border-red-400/70 bg-red-400/12 text-red-100 shake ";
            } else if (revealed) {
              cls += "border-white/8 bg-white/[0.02] text-muted-foreground/70 ";
            } else {
              cls +=
                "border-gold/25 bg-white/[0.045] hover:bg-gold/10 hover:border-gold/60 hover:-translate-y-0.5 text-foreground cursor-pointer ";
            }
            return (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                disabled={revealed || isRemoved || phase !== "answering"}
                className={cls}
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <span
                  className={`shrink-0 grid place-items-center size-9 sm:size-10 rounded-xl font-display font-bold text-lg border transition-colors ${
                    revealed && isCorrectOpt
                      ? "bg-emerald-400 text-[#0b2217] border-emerald-300"
                      : revealed && isChosen
                        ? "bg-red-400 text-[#2b0d0d] border-red-300"
                        : "bg-gold/12 text-gold-light border-gold/35 group-hover:bg-gold/25"
                  }`}
                >
                  {q.type === "tf" ? (i === 0 ? "✓" : "✗") : LETTERS[i]}
                </span>
                <span className="flex-1 text-base sm:text-lg leading-snug">{opt}</span>
                {revealed && isCorrectOpt && <CheckCircle2 className="size-6 text-emerald-300 shrink-0" />}
                {revealed && isChosen && !isCorrectOpt && <XCircle className="size-6 text-red-300 shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* المساعدات */}
        {phase === "answering" && (
          <div className="flex flex-wrap items-center gap-2.5 mt-6 pt-5 border-t border-white/8">
            <span className="text-xs font-bold text-muted-foreground">مساعدات ذهبية:</span>
            <LifelineButton
              label="حذف إجابتين"
              count={lifelines.fifty}
              disabled={q.type === "tf" || lifelines.fifty <= 0}
              onClick={useFifty}
              icon={<Scissors className="size-4" />}
            />
            <LifelineButton
              label={isSpeed ? "+١٠ ثوانٍ" : "+١٥ ثانية"}
              count={lifelines.time}
              disabled={lifelines.time <= 0}
              onClick={useTime}
              icon={<Timer className="size-4" />}
            />
            {config.lifelines.skip > 0 && (
              <LifelineButton
                label="تخطّي السؤال"
                count={lifelines.skip}
                disabled={lifelines.skip <= 0}
                onClick={useSkip}
                icon={<SkipForward className="size-4" />}
              />
            )}
          </div>
        )}

        {/* نتيجة الإجابة */}
        {phase === "revealed" && (
          <div className="mt-6 slide-up">
            <div
              className={`rounded-2xl border p-5 ${
                chosen !== null && chosen === q.correct
                  ? "border-emerald-400/50 bg-emerald-400/10"
                  : "border-red-400/50 bg-red-400/10"
              }`}
            >
              <p
                className={`font-extrabold text-lg mb-2 flex items-center gap-2 ${
                  chosen !== null && chosen === q.correct ? "text-emerald-300" : "text-red-300"
                }`}
              >
                {chosen !== null && chosen === q.correct ? (
                  <>
                    <CheckCircle2 className="size-6" />
                    أحسنتِ! إجابة صحيحة
                  </>
                ) : chosen === null ? (
                  <>
                    <XCircle className="size-6" />
                    انتهى الوقت — الإجابة الصحيحة: «{q.opts[q.correct]}»
                  </>
                ) : (
                  <>
                    <XCircle className="size-6" />
                    للأسف إجابة خاطئة — الصحيح: «{q.opts[q.correct]}»
                  </>
                )}
              </p>
              <p className="text-sm sm:text-base text-foreground/85 leading-relaxed flex items-start gap-2">
                <Lightbulb className="size-5 text-gold-light shrink-0 mt-0.5" />
                <span>
                  <span className="font-bold text-gold-light">توضيح من الدرس: </span>
                  {q.explanation}
                </span>
              </p>
              {mode === "survival" && !gameOver && (config.checkpointIndexes ?? []).includes(qIndex) && chosen === q.correct && (
                <p className="mt-3 text-sm font-bold text-gold-light flex items-center gap-2">
                  <Crown className="size-4" />
                  نقطة أمان! ضُمِن لكِ رصيد {arDigits(survivalLadder.slice(0, qIndex + 1).reduce((s, v) => s + v, 0))} نقطة
                </p>
              )}
            </div>
            <button onClick={goNext} className="btn-gold w-full mt-4 py-4 text-lg flex items-center justify-center gap-2.5">
              {nextLabel}
              <ChevronLeft className="size-5" />
            </button>
          </div>
        )}
      </article>
    </div>
  );
}

function LifelineButton({
  label,
  count,
  disabled,
  onClick,
  icon,
}: {
  label: string;
  count: number;
  disabled: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all ${
        disabled
          ? "opacity-30 cursor-not-allowed bg-white/5 border border-white/10 text-muted-foreground"
          : "btn-ghost-gold pulse-gold"
      }`}
      aria-label={`${label} — متبقٍ ${count}`}
    >
      {icon}
      {label}
      <span className="numeric text-xs bg-gold/20 text-gold-light rounded-full size-5 grid place-items-center">
        {arDigits(count)}
      </span>
    </button>
  );
}
