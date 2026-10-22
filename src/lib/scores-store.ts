/**
 * طبقة تخزين النتائج — تعمل مع نوعين من قواعد البيانات:
 *  1) محلي (التطوير): SQLite عبر Prisma — DATABASE_URL يبدأ بـ file:
 *  2) سحابي (النشر على Vercel): PostgreSQL عبر مكتبة pg — DATABASE_URL يبدأ بـ postgres:// أو postgresql://
 *    (يشتغل مع Neon و Vercel Postgres و Supabase — والجدول ينشئ نفسه تلقائيًا أول مرة)
 */

export interface ScoreRow {
  id: number;
  playerName: string;
  mode: string;
  score: number;
  accuracy: number;
  bestStreak: number;
  correct: number;
  total: number;
  createdAt: string | Date;
}

export interface ScoreInput {
  playerName: string;
  mode: string;
  score: number;
  accuracy: number;
  bestStreak: number;
  correct: number;
  total: number;
}

const url = process.env.DATABASE_URL ?? "";

export function isPostgres(): boolean {
  return url.startsWith("postgres://") || url.startsWith("postgresql://");
}

/* ---------------- مسار SQLite المحلي (Prisma) ---------------- */

const globalForPrisma = globalThis as unknown as {
  prisma: import("@prisma/client").PrismaClient | undefined;
};

async function getPrisma() {
  // على Vercel بدون متغير DATABASE_URL: وضع "بدون قاعدة بيانات" — لا نحاول تشغيل Prisma أصلًا
  if (!url) {
    throw new Error("DATABASE_URL غير مضبوط — اللعبة تعمل بدون قاعدة بيانات مشتركة");
  }
  if (!globalForPrisma.prisma) {
    const { PrismaClient } = await import("@prisma/client");
    globalForPrisma.prisma = new PrismaClient();
  }
  return globalForPrisma.prisma;
}

/* ---------------- مسار PostgreSQL السحابي (pg) ---------------- */

type PgPool = import("pg").Pool;

const globalForPg = globalThis as unknown as { pgPool?: PgPool };

async function getPg(): Promise<PgPool> {
  if (!globalForPg.pgPool) {
    const { Pool } = await import("pg");
    const local = url.includes("localhost") || url.includes("127.0.0.1");
    globalForPg.pgPool = new Pool({
      connectionString: url,
      ssl: local ? undefined : { rejectUnauthorized: false },
      max: 3,
    });
    // إنشاء الجدول تلقائيًا إذا لم يوجد
    await globalForPg.pgPool.query(`
      CREATE TABLE IF NOT EXISTS "Score" (
        id SERIAL PRIMARY KEY,
        "playerName" TEXT NOT NULL,
        mode TEXT NOT NULL,
        score INTEGER NOT NULL,
        accuracy INTEGER NOT NULL,
        "bestStreak" INTEGER NOT NULL,
        correct INTEGER NOT NULL,
        total INTEGER NOT NULL,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
  }
  return globalForPg.pgPool;
}

/* ---------------- الواجهة الموحدة ---------------- */

export async function getTopScores(mode?: string): Promise<ScoreRow[]> {
  if (isPostgres()) {
    const pool = await getPg();
    const q = mode
      ? `SELECT * FROM "Score" WHERE mode = $1 ORDER BY score DESC, "createdAt" ASC LIMIT 10`
      : `SELECT * FROM "Score" ORDER BY score DESC, "createdAt" ASC LIMIT 10`;
    const res = mode ? await pool.query(q, [mode]) : await pool.query(q);
    return res.rows as ScoreRow[];
  }
  const prisma = await getPrisma();
  return prisma.score.findMany({
    where: mode ? { mode } : {},
    orderBy: [{ score: "desc" }, { createdAt: "asc" }],
    take: 10,
  });
}

export async function saveScore(
  data: ScoreInput
): Promise<{ score: ScoreRow; rank: number }> {
  if (isPostgres()) {
    const pool = await getPg();
    const inserted = await pool.query(
      `INSERT INTO "Score" ("playerName", mode, score, accuracy, "bestStreak", correct, total)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [data.playerName, data.mode, data.score, data.accuracy, data.bestStreak, data.correct, data.total]
    );
    const better = await pool.query(
      `SELECT COUNT(*)::int AS c FROM "Score" WHERE mode = $1 AND score > $2`,
      [data.mode, data.score]
    );
    return { score: inserted.rows[0] as ScoreRow, rank: better.rows[0].c + 1 };
  }
  const prisma = await getPrisma();
  const score = await prisma.score.create({ data });
  const betterCount = await prisma.score.count({
    where: { mode: data.mode, score: { gt: data.score } },
  });
  return { score, rank: betterCount + 1 };
}
