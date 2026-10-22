"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, Lightbulb, ChevronRight, Home, RotateCcw } from "lucide-react";
import { arDigits } from "@/lib/game-data";
import type { AnswerRecord } from "@/lib/game-data";
import type { GameResults } from "./GameScreen";

export function ReviewScreen({
  results,
  onReplay,
  onHome,
}: {
  results: GameResults;
  onReplay: () => void;
  onHome: () => void;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const correctCount = results.answers.filter((a) => a.correct).length;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-16 pt-8">
      <header className="text-center mb-8 slide-up">
        <h1 className="font-display font-bold gold-text text-4xl sm:text-5xl mb-3">مراجعة ملكية</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          أجبتِ بشكل صحيح عن{" "}
          <span className="text-emerald-300 font-extrabold numeric">{arDigits(correctCount)}</span> من{" "}
          <span className="numeric font-bold">{arDigits(results.answers.length)}</span> سؤالًا —
          اضغطي على أي سؤال لرؤية إجابتك والإجابة الصحيحة والتوضيح.
        </p>
      </header>

      <ol className="space-y-3 mb-10">
        {results.answers.map((record, i) => {
          const q = record.question as AnswerRecord["question"] & {
            opts?: string[];
            correct?: number;
          };
          const opts = (q.opts ?? q.options) as string[];
          const correctIdx = (q.correct ?? q.correctIndex) as number;
          const open = openIndex === i;
          return (
            <li key={i} className="glass-card overflow-hidden slide-up" style={{ animationDelay: `${Math.min(i * 0.04, 0.5)}s` }}>
              <button
                onClick={() => setOpenIndex(open ? null : i)}
                className="w-full flex items-start gap-3.5 p-4 sm:p-5 text-right hover:bg-white/[0.03] transition-colors"
                aria-expanded={open}
              >
                <span
                  className={`shrink-0 grid place-items-center size-9 rounded-xl mt-0.5 ${
                    record.correct
                      ? "bg-emerald-400/15 text-emerald-300 border border-emerald-400/30"
                      : "bg-red-400/15 text-red-300 border border-red-400/30"
                  }`}
                >
                  {record.correct ? <CheckCircle2 className="size-5" /> : <XCircle className="size-5" />}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-xs font-bold text-gold/80 mb-1 numeric">
                    السؤال {arDigits(i + 1)} · {q.section}
                  </span>
                  <span className="block font-bold leading-relaxed text-foreground text-sm sm:text-base">
                    {q.text.split("**").map((part, j) =>
                      j % 2 === 1 ? (
                        <span key={j} className="text-gold-light">
                          {part}
                        </span>
                      ) : (
                        <span key={j}>{part}</span>
                      )
                    )}
                  </span>
                </span>
                <ChevronRight
                  className={`size-5 shrink-0 mt-2 text-muted-foreground transition-transform duration-300 ${
                    open ? "-rotate-90" : ""
                  }`}
                />
              </button>

              {open && (
                <div className="px-4 sm:px-5 pb-5 slide-up">
                  <div className="border-t border-white/8 pt-4 space-y-2.5">
                    {opts.map((opt, oi) => {
                      const isCorrect = oi === correctIdx;
                      const isChosen = oi === record.chosenIndex;
                      return (
                        <div
                          key={oi}
                          className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 text-sm font-bold ${
                            isCorrect
                              ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-100"
                              : isChosen
                                ? "border-red-400/50 bg-red-400/10 text-red-100"
                                : "border-white/8 bg-white/[0.02] text-muted-foreground/70"
                          }`}
                        >
                          <span className="flex-1">{opt}</span>
                          {isCorrect && (
                            <span className="text-[11px] font-extrabold text-emerald-300">الصحيحة ✓</span>
                          )}
                          {isChosen && !isCorrect && (
                            <span className="text-[11px] font-extrabold text-red-300">اختيارك ✗</span>
                          )}
                        </div>
                      );
                    })}
                    {record.chosenIndex === null && (
                      <p className="text-xs font-bold text-amber-300">⏱ لم تُجيبي عن هذا السؤال (انتهى الوقت أو تخطّي)</p>
                    )}
                    <p className="flex items-start gap-2 text-sm text-foreground/85 leading-relaxed pt-1">
                      <Lightbulb className="size-5 text-gold-light shrink-0 mt-0.5" />
                      <span>
                        <span className="font-bold text-gold-light">توضيح: </span>
                        {q.explanation}
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <div className="grid sm:grid-cols-2 gap-3.5">
        <button onClick={onReplay} className="btn-gold py-4 text-lg flex items-center justify-center gap-2.5">
          <RotateCcw className="size-5" />
          جولة أخرى
        </button>
        <button onClick={onHome} className="btn-ghost-gold py-4 text-lg font-extrabold flex items-center justify-center gap-2.5">
          <Home className="size-5" />
          الرئيسية
        </button>
      </div>
    </div>
  );
}
