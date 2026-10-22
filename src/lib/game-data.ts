export type QuestionType = "mcq" | "tf";

export interface Question {
  id: number;
  section: string;
  difficulty: 1 | 2 | 3;
  type: QuestionType;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export type GameMode = "journey" | "speed" | "survival";

export interface ModeConfig {
  id: GameMode;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  questionCount: number | null; // null = unlimited until time ends
  lives: number;
  secondsPerQuestion: number | null; // null = shared pool timer
  totalSeconds: number | null;
  lifelines: { fifty: number; time: number; skip: number };
  basePoints: number;
  timeBonus: boolean;
  survivalLadder?: number[];
  checkpointIndexes?: number[];
}

export const MODES: Record<GameMode, ModeConfig> = {
  journey: {
    id: "journey",
    name: "رحلة الملكة",
    tagline: "النمط الكلاسيكي",
    description: "١٥ سؤالًا يأخذك في جولة عبر محاور الدرس كلها، مع ٣ قلوب ومساعدات ذهبية.",
    icon: "crown",
    questionCount: 15,
    lives: 3,
    secondsPerQuestion: 25,
    totalSeconds: null,
    lifelines: { fifty: 1, time: 1, skip: 1 },
    basePoints: 100,
    timeBonus: true,
  },
  speed: {
    id: "speed",
    name: "سباق الزمن",
    tagline: "ضد عقارب الساعة",
    description: "٩٠ ثانية فقط! أجيبي عن أكبر عدد ممكن من الأسئلة، وكل إجابة صحيحة تمنحك وقتًا إضافيًا.",
    icon: "zap",
    questionCount: null,
    lives: 3,
    secondsPerQuestion: null,
    totalSeconds: 90,
    lifelines: { fifty: 2, time: 1, skip: 0 },
    basePoints: 50,
    timeBonus: false,
  },
  survival: {
    id: "survival",
    name: "التحدّي الملكي",
    tagline: "خطأ واحد يُنهي كل شيء",
    description: "١٢ سؤالًا تتدرج من الأسهل إلى الأصعب، ولا تحتملين أي خطأ. كلما تقدمتِ ارتفع مكسبك.",
    icon: "flame",
    questionCount: 12,
    lives: 1,
    secondsPerQuestion: 30,
    totalSeconds: null,
    lifelines: { fifty: 2, time: 0, skip: 0 },
    basePoints: 0,
    timeBonus: false,
    survivalLadder: [100, 200, 400, 600, 1000, 1500, 2000, 3000, 4000, 6000, 8000, 10000],
    checkpointIndexes: [3, 7], // safe checkpoints (question index)
  },
};

export const MODE_ORDER: GameMode[] = ["journey", "speed", "survival"];

export interface Rank {
  min: number;
  title: string;
  description: string;
  icon: string;
}

export const RANKS: Rank[] = [
  { min: 90, title: "ملكة عرش التخطيط", description: "أداءٌ ملكي بامتياز — عرش التخطيط لكِ وحدك!", icon: "crown" },
  { min: 75, title: "أميرة التخطيط", description: "إجابات راقية تقترب بكِ من العرش، جولة أخرى وتبلغين القمة!", icon: "sparkles" },
  { min: 60, title: "وصيفة العرش", description: "مستوى نبيل! راجعي المحاور التي أخطأتِ فيها وستتوجين قريبًا.", icon: "medal" },
  { min: 40, title: "نبيلة واعدة", description: "بداية طيبة نحو العرش — التخطيط مهارة تُتقن بالممارسة.", icon: "star" },
  { min: 0, title: "في طريقك إلى القصر", description: "كل ملكة بدأت متدربة! أعيدي قراءة الدرس ثم عودي أقوى.", icon: "seedling" },
];

export function getRank(accuracy: number): Rank {
  return RANKS.find((r) => accuracy >= r.min) ?? RANKS[RANKS.length - 1];
}

const AR_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];

/** Convert any number to Arabic-Indic digits, preserving minus sign and separators. */
export function arDigits(value: number | string): string {
  return String(value).replace(/[0-9]/g, (d) => AR_DIGITS[Number(d)]);
}

export function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Pick a balanced, shuffled set of questions for a game run. */
export function buildQuestionSet(bank: Question[], mode: GameMode): Question[] {
  if (mode === "survival") {
    // ١٢ سؤالًا متدرجة الصعوبة: ٦ سهلة ثم ٤ متوسطة ثم ٢ صعبة
    const easy = shuffle(bank.filter((q) => q.difficulty === 1)).slice(0, 6);
    const medium = shuffle(bank.filter((q) => q.difficulty === 2)).slice(0, 4);
    const hard = shuffle(bank.filter((q) => q.difficulty === 3)).slice(0, 2);
    return [...easy, ...medium, ...hard];
  }
  const count = MODES[mode].questionCount;
  if (count == null) return shuffle(bank);
  // balanced sample: round-robin across sections so every محور appears
  const bySection = new Map<string, Question[]>();
  for (const q of shuffle(bank)) {
    const list = bySection.get(q.section) ?? [];
    list.push(q);
    bySection.set(q.section, list);
  }
  const sections = shuffle([...bySection.keys()]);
  const picked: Question[] = [];
  let idx = 0;
  while (picked.length < count && bySection.size > 0) {
    const key = sections[idx % sections.length];
    const list = bySection.get(key);
    if (list && list.length > 0) {
      picked.push(list.shift()!);
    } else {
      bySection.delete(key);
    }
    idx++;
  }
  return shuffle(picked);
}

export interface OptionState {
  text: string;
  removed: boolean; // removed by 50:50
}

export interface AnswerRecord {
  question: Question;
  chosenIndex: number | null; // null = skipped / timed out
  correct: boolean;
  pointsEarned: number;
  timeLeft: number;
}

export const LETTERS = ["أ", "ب", "ج", "د"];

export function fmtTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return arDigits(`${m}:${String(s).padStart(2, "0")}`);
}
