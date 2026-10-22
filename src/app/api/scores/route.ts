import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getTopScores, saveScore } from "@/lib/scores-store";

const scoreSchema = z.object({
  playerName: z.string().trim().min(1).max(40),
  mode: z.enum(["journey", "speed", "survival"]),
  score: z.number().int().min(0).max(1_000_000),
  accuracy: z.number().int().min(0).max(100),
  bestStreak: z.number().int().min(0).max(100),
  correct: z.number().int().min(0).max(200),
  total: z.number().int().min(0).max(200),
});

export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get("mode");
  const validModes = ["journey", "speed", "survival", "all"];
  if (mode && !validModes.includes(mode)) {
    return NextResponse.json({ error: "وضع لعب غير صالح" }, { status: 400 });
  }
  try {
    const scores = await getTopScores(mode && mode !== "all" ? mode : undefined);
    return NextResponse.json({ scores });
  } catch {
    // لو القاعدة غير متاحة نرجّع قائمة فاضية بدل تعطيل اللعبة
    return NextResponse.json({ scores: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = scoreSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
    }
    const { score, rank } = await saveScore(parsed.data);
    return NextResponse.json({ score, rank }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "تعذر حفظ النتيجة" }, { status: 500 });
  }
}
