import AsyncStorage from "@react-native-async-storage/async-storage";
import { HomeData, StudentQuestion, Subject } from "../api/types";
import { getBaseUrl } from "../api/config";
import { getOfflineSeedQuestions } from "../constants/offlineSeedQuestions";
export { getOfflineMemoryPack } from "../constants/offlineMemoryPacks";
export { getOfflineRiddle } from "../constants/offlineRiddles";

export const CACHED_QUESTIONS_KEY = "qq_cached_questions";
export const CACHED_HOME_KEY = "qq_cached_home";
export const OFFLINE_QUEUE_KEY = "qq_offline_queue";
export const OFFLINE_USER_XP_KEY = "qq_offline_bonus_xp";

export interface OfflineQuestion extends StudentQuestion {
  correctIndex: number;
}

export interface OfflineSubmission {
  id: string;
  type: "quiz" | "zip" | "wordsearch" | "memory" | "riddle";
  endpoint: string;
  payload: unknown;
  timestamp: number;
}

// ---------------------------------------------------------------------------
// 1. Procedural Client-Side Math Generator (0 KB storage, infinite questions)
// ---------------------------------------------------------------------------

const NE_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
const toNepaliNum = (n: number | string) => String(n).replace(/\d/g, (d) => NE_DIGITS[Number(d)]);
const randInt = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function makeNumericOptions(correct: number): { options: string[]; correctIndex: number } {
  const set = new Set<number>([correct]);
  const deltas = [1, -1, 2, -2, 5, -5, 10, -10];
  const shuffledDeltas = shuffleArray(deltas);

  for (const d of shuffledDeltas) {
    if (set.size >= 4) break;
    const cand = correct + d;
    if (cand >= 0) set.add(cand);
  }

  let pad = correct + 3;
  while (set.size < 4) {
    set.add(pad++);
  }

  const list = shuffleArray([...set]);
  return {
    options: list.map(String),
    correctIndex: list.indexOf(correct),
  };
}

export function generateProceduralMathQuestions(
  count: number = 10,
  gradeBand: string = "4-5",
  lang: "en" | "ne" = "en"
): OfflineQuestion[] {
  const list: OfflineQuestion[] = [];
  let idGen = Date.now();

  for (let i = 0; i < count; i++) {
    idGen++;
    let textEn = "";
    let textNe = "";
    let correct = 0;
    let topic = "arithmetic";
    let difficulty = 2;

    if (gradeBand === "1-3") {
      const type = randInt(1, 3);
      if (type === 1) {
        const a = randInt(2, 25);
        const b = randInt(1, 25);
        correct = a + b;
        textEn = `What is ${a} + ${b}?`;
        textNe = `${toNepaliNum(a)} + ${toNepaliNum(b)} कति हुन्छ?`;
        topic = "addition";
      } else if (type === 2) {
        const a = randInt(10, 50);
        const b = randInt(1, a);
        correct = a - b;
        textEn = `What is ${a} - ${b}?`;
        textNe = `${toNepaliNum(a)} - ${toNepaliNum(b)} कति हुन्छ?`;
        topic = "subtraction";
      } else {
        const a = randInt(2, 9);
        const b = randInt(2, 9);
        correct = a * b;
        textEn = `What is ${a} × ${b}?`;
        textNe = `${toNepaliNum(a)} × ${toNepaliNum(b)} कति हुन्छ?`;
        topic = "multiplication";
      }
    } else if (gradeBand === "4-5") {
      const type = randInt(1, 3);
      if (type === 1) {
        const a = randInt(12, 60);
        const b = randInt(11, 40);
        correct = a * b;
        textEn = `Calculate: ${a} × ${b} = ?`;
        textNe = `हिसाब गर्नुहोस्: ${toNepaliNum(a)} × ${toNepaliNum(b)} = ?`;
        topic = "multiplication";
      } else if (type === 2) {
        const div = randInt(3, 12);
        const quot = randInt(10, 50);
        const dividend = div * quot;
        correct = quot;
        textEn = `What is ${dividend} ÷ ${div}?`;
        textNe = `${toNepaliNum(dividend)} ÷ ${toNepaliNum(div)} कति हुन्छ?`;
        topic = "division";
      } else {
        const side = randInt(4, 25);
        correct = side * 4;
        textEn = `What is the perimeter of a square with side ${side} cm?`;
        textNe = `${toNepaliNum(side)} सेन्टिमिटर भुजा भएको वर्गको परिमिति कति हुन्छ?`;
        topic = "geometry";
        difficulty = 3;
      }
    } else if (gradeBand === "6-8") {
      const type = randInt(1, 3);
      if (type === 1) {
        const pct = randInt(1, 8) * 10;
        const total = randInt(2, 10) * 50;
        correct = (pct * total) / 100;
        textEn = `What is ${pct}% of ${total}?`;
        textNe = `${toNepaliNum(total)} को ${toNepaliNum(pct)}% कति हुन्छ?`;
        topic = "percentage";
      } else if (type === 2) {
        const x = randInt(2, 15);
        const b = randInt(3, 20);
        const rhs = 2 * x + b;
        correct = x;
        textEn = `Solve for x: 2x + ${b} = ${rhs}`;
        textNe = `x को मान निकाल्नुहोस्: २x + ${toNepaliNum(b)} = ${toNepaliNum(rhs)}`;
        topic = "algebra";
        difficulty = 3;
      } else {
        const base = randInt(2, 9);
        const exp = randInt(2, 3);
        correct = Math.pow(base, exp);
        textEn = `What is ${base}^${exp} (${base} to the power ${exp})?`;
        textNe = `${toNepaliNum(base)} को घात ${toNepaliNum(exp)} कति हुन्छ?`;
        topic = "exponents";
      }
    } else {
      // 9-10 & 11-12
      const type = randInt(1, 2);
      if (type === 1) {
        const a = randInt(3, 8);
        const b = randInt(4, 9);
        correct = a * a + b * b;
        textEn = `If a right triangle has legs ${a} and ${b}, what is hypotenuse² (c²)?`;
        textNe = `समकोण त्रिभुजको भुजाहरू ${toNepaliNum(a)} र ${toNepaliNum(b)} भए, कर्णको वर्ग (c²) कति हुन्छ?`;
        topic = "geometry";
        difficulty = 4;
      } else {
        const x = randInt(2, 12);
        correct = x * x - 4;
        textEn = `If f(x) = x² - 4, what is f(${x})?`;
        textNe = `यदि f(x) = x² - ४ भए, f(${toNepaliNum(x)}) को मान कति हुन्छ?`;
        topic = "functions";
        difficulty = 4;
      }
    }

    const { options, correctIndex } = makeNumericOptions(correct);
    const finalOptions = lang === "ne" ? options.map(toNepaliNum) : options;

    list.push({
      id: idGen,
      text: lang === "ne" && textNe ? textNe : textEn,
      options: finalOptions,
      subject: "math" as Subject,
      country: "nepal",
      difficulty,
      topic,
      correctIndex,
    });
  }

  return list;
}

// ---------------------------------------------------------------------------
// 2. Question Caching & Retrieval
// ---------------------------------------------------------------------------

export async function saveCachedQuestions(
  newQuestions: (StudentQuestion & { correctIndex?: number })[]
): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(CACHED_QUESTIONS_KEY);
    const existing: (StudentQuestion & { correctIndex?: number })[] = raw ? JSON.parse(raw) : [];

    const map = new Map<string, StudentQuestion & { correctIndex?: number }>();
    existing.forEach((q) => map.set(q.text, q));
    newQuestions.forEach((q) => map.set(q.text, q));

    // Keep up to 500 newest questions
    const combined = Array.from(map.values()).slice(-500);
    await AsyncStorage.setItem(CACHED_QUESTIONS_KEY, JSON.stringify(combined));
  } catch {
    // Non-critical local storage fallback
  }
}

export async function clearCachedQuestions(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CACHED_QUESTIONS_KEY);
  } catch {
    // Non-critical local storage fallback
  }
}

export async function getCachedQuestions(options?: {
  subject?: string;
  count?: number;
  gradeBand?: string;
  lang?: "en" | "ne";
}): Promise<OfflineQuestion[]> {
  const targetCount = options?.count ?? 10;
  const lang = options?.lang ?? "en";
  const gradeBand = options?.gradeBand ?? "4-5";

  let results: OfflineQuestion[] = [];

  try {
    const raw = await AsyncStorage.getItem(CACHED_QUESTIONS_KEY);
    if (raw) {
      const all: (OfflineQuestion & { gradeBand?: string })[] = JSON.parse(raw);
      const filtered = all.filter((q) => {
        if (options?.subject && q.subject !== options.subject) return false;
        // If question has a stored gradeBand, enforce that it matches the requested gradeBand
        if (q.gradeBand && q.gradeBand !== gradeBand) return false;
        return true;
      });

      results = shuffleArray(filtered).slice(0, targetCount);
    }
  } catch {
    results = [];
  }

  // If cached pool is insufficient, pull curated multi-subject starter questions
  if (results.length < targetCount) {
    const needed = targetCount - results.length;
    const seedQs = getOfflineSeedQuestions({
      gradeBand,
      subject: options?.subject,
      lang,
      count: needed,
    });
    results = [...results, ...seedQs];
  }

  // If still insufficient (e.g. infinite practice play offline), generate fresh procedural questions!
  if (results.length < targetCount) {
    const needed = targetCount - results.length;
    const generated = generateProceduralMathQuestions(needed, gradeBand, lang);
    results = [...results, ...generated];
  }

  return results;
}

// ---------------------------------------------------------------------------
// 3. Offline Action Queue (Anti-Cheat & Resilient Sync)
// ---------------------------------------------------------------------------

export async function queueOfflineSubmission(
  type: "quiz" | "zip" | "wordsearch" | "memory" | "riddle",
  endpoint: string,
  payload: unknown
): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    const queue: OfflineSubmission[] = raw ? JSON.parse(raw) : [];

    const item: OfflineSubmission = {
      id: `off-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type,
      endpoint,
      payload,
      timestamp: Date.now(),
    };

    queue.push(item);
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // Non-blocking
  }
}

export async function syncOfflineQueue(token: string): Promise<number> {
  if (!token) return 0;

  let syncedCount = 0;
  try {
    const raw = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!raw) return 0;

    const queue: OfflineSubmission[] = JSON.parse(raw);
    if (queue.length === 0) return 0;

    const remaining: OfflineSubmission[] = [];
    const baseUrl = await getBaseUrl();

    for (const item of queue) {
      try {
        const res = await fetch(`${baseUrl}${item.endpoint}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(item.payload),
        });

        if (res.ok) {
          syncedCount++;
        } else if (res.status >= 400 && res.status < 500) {
          // Invalid payload on server, drop to prevent poison pill
        } else {
          // Server error / network drop, keep in queue
          remaining.push(item);
        }
      } catch {
        remaining.push(item);
      }
    }

    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remaining));
  } catch {
    // Non-blocking
  }

  return syncedCount;
}

// ---------------------------------------------------------------------------
// 4. Home Dashboard Offline Snapshot
// ---------------------------------------------------------------------------

export async function saveCachedHome(data: HomeData): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHED_HOME_KEY, JSON.stringify(data));
  } catch {
    // Non-critical
  }
}

export async function getCachedHome(): Promise<HomeData | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHED_HOME_KEY);
    return raw ? (JSON.parse(raw) as HomeData) : null;
  } catch {
    return null;
  }
}
