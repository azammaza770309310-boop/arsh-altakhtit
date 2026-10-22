"use client";

import { useCallback, useEffect, useState } from "react";
import { Crown, Medal, Loader2, RefreshCcw } from "lucide-react";
import { MODES, MODE_ORDER, arDigits, type GameMode } from "@/lib/game-data";

interface ScoreRow {
  id: number;
  playerName: string;
  mode: string;
  score: number;
  accuracy: number;
  bestStreak: number;
  createdAt: string;
}

export function Leaderboard({
  initialMode = "journey",
  highlightId,
  compact = false,
}: {
  initialMode?: GameMode;
  highlightId?: number | null;
  compact?: boolean;
}) {
  const [mode, setMode] = useState<GameMode>(initialMode);
  const [rows, setRows] = useState<ScoreRow[] | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (m: GameMode) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/scores?mode=${m}`, { cache: "no-store" });
      const data = await res.json();
      setRows(data.scores ?? []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(mode);
  }, [mode, load]);

  return (
    <div className="glass-card p-5 sm:p-6 w-full">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="font-display text-2xl font-bold gold-text flex items-center gap-2">
          <Crown className="size-6 text-gold" />
          لوحة الأبطال
        </h3>
        <button
          onClick={() => void load(mode)}
          className="btn-ghost-gold p-2"
          aria-label="تحديث اللوحة"
        >
          <RefreshCcw className={`size-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* تبويبات الأنماط */}
      <div className="flex gap-2 mb-4" role="tablist" aria-label="اختيار نمط اللعب">
        {MODE_ORDER.map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={`px-3.5 py-1.5 rounded-full text-sm font-bold transition-all ${
              mode === m
                ? "bg-gold text-[#191228] shadow-lg shadow-gold/25"
                : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-gold-light"
            }`}
          >
            {MODES[m].name}
          </button>
        ))}
      </div>

      {loading && rows === null ? (
        <div className="flex justify-center py-8 text-gold">
          <Loader2 className="size-6 animate-spin" />
        </div>
      ) : !rows || rows.length === 0 ? (
        <p className="text-center text-muted-foreground py-8 text-sm leading-relaxed">
          لا توجد نتائج محفوظة بعد في «{MODES[mode].name}».
          <br />
          كوني أول من يسجل اسمها في اللوحة!
        </p>
      ) : (
        <ol className={`space-y-2 ${compact ? "max-h-72" : "max-h-96"} overflow-y-auto royal-scroll pl-1`}>
          {rows.map((row, i) => {
            const isTop = i === 0;
            const highlighted = highlightId != null && row.id === highlightId;
            return (
              <li
                key={row.id}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 border transition-colors ${
                  highlighted
                    ? "bg-gold/15 border-gold/60"
                    : isTop
                      ? "bg-gold/10 border-gold/40"
                      : "bg-white/[0.03] border-white/5"
                }`}
              >
                <span
                  className={`shrink-0 w-8 h-8 rounded-full grid place-items-center font-extrabold text-sm ${
                    i === 0
                      ? "bg-gradient-to-br from-gold-light to-gold text-[#191228]"
                      : i === 1
                        ? "bg-white/15 text-gold-pale"
                        : i === 2
                          ? "bg-[#8a6d3b]/40 text-gold-pale"
                          : "bg-white/5 text-muted-foreground"
                  }`}
                >
                  {i === 0 ? <Crown className="size-4" /> : <Medal className="size-4" />}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate text-foreground">{row.playerName}</p>
                  <p className="text-xs text-muted-foreground">
                    دقة {arDigits(row.accuracy)}٪ · أطول سلسلة {arDigits(row.bestStreak)}
                  </p>
                </div>
                <span className="numeric font-extrabold text-gold-light text-lg">
                  {arDigits(row.score)}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
