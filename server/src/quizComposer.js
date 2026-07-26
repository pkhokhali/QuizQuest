import db from "./db.js";
import { gradeBandFor, shuffle, today } from "./util.js";

const DAILY_SIZE = 8;
const BASE_DIFFICULTY = { "1-3": 1, "4-5": 2, "6-8": 3, "9-10": 4, "11-12": 4 };
const ALL_SUBJECTS = ["math", "science", "social", "english", "nepali", "gk", "current"];

/** Adaptive difficulty: rolling accuracy of the user's last 20 answers in a subject. */
export function targetDifficulty(userId, subject, gradeBand) {
  const base = BASE_DIFFICULTY[gradeBand] || 3;
  const rows = db
    .prepare("SELECT correct FROM answer_log WHERE user_id = ? AND subject = ? ORDER BY id DESC LIMIT 20")
    .all(userId, subject);
  if (rows.length < 8) return base;
  const acc = rows.filter((r) => r.correct).length / rows.length;
  if (acc >= 0.8) return Math.min(5, base + 1);
  if (acc <= 0.4) return Math.max(1, base - 1);
  return base;
}

function getMix(gradeBand) {
  const row = db.prepare("SELECT * FROM mix_config WHERE grade_band = ?").get(gradeBand);
  return row
    ? { home: row.home_pct, extra: row.extra_pct, global: row.global_pct }
    : { home: 60, extra: 25, global: 15 };
}


/** Spread subjects across the daily quest so one topic (e.g. math) doesn't dominate. */
function diverseSubjects(count, preferred) {
  const pref = preferred.filter((s) => ALL_SUBJECTS.includes(s));
  const others = ALL_SUBJECTS.filter((s) => !pref.includes(s));
  const slots = [];
  // At least one from each core bucket when we have room.
  const core = shuffle(["math", "science", "gk", "social", "english"]);
  for (const s of core) {
    if (slots.length < count) slots.push(s);
  }
  while (slots.length < count) {
    const pool = pref.length ? [...pref, ...pref, ...others] : ALL_SUBJECTS;
    slots.push(pool[Math.floor(Math.random() * pool.length)]);
  }
  return shuffle(slots);
}

/**
 * Pick one question matching constraints with progressive fallbacks so a thin
 * content bank never breaks quiz composition.
 */
function pickQuestion({ countries, gradeBand, subject, difficulty, excludeIds }) {
  const excl = excludeIds.size ? [...excludeIds] : [-1];
  const exclPh = excl.map(() => "?").join(",");
  const cPh = countries.map(() => "?").join(",");
  const attempts = [
    { sql: `AND subject = ? AND ABS(difficulty - ?) <= 1`, params: [subject, difficulty] },
    { sql: `AND subject = ?`, params: [subject] },
    { sql: ``, params: [] },
  ];
  for (const a of attempts) {
    const q = db
      .prepare(
        `SELECT * FROM questions
         WHERE status = 'approved' AND grade_band = ? AND country IN (${cPh})
         AND id NOT IN (${exclPh}) ${a.sql}
         ORDER BY RANDOM() LIMIT 1`
      )
      .get(gradeBand, ...countries, ...excl, ...a.params);
    if (q) return q;
  }
  // Last resort: any approved question in the band.
  return db
    .prepare(
      `SELECT * FROM questions WHERE status = 'approved' AND grade_band = ? AND id NOT IN (${exclPh})
       ORDER BY RANDOM() LIMIT 1`
    )
    .get(gradeBand, ...excl);
}

/** Compose the day's quest: mix-config country split, preferred-subject weighting, adaptive difficulty. */
export function composeDailyQuiz(user) {
  const gradeBand = gradeBandFor(user.grade || 8);
  const mix = getMix(gradeBand);
  const extras = JSON.parse(user.extra_countries || "[]");
  const preferred = JSON.parse(user.subjects || "[]");
  const home = user.home_country || "nepal";

  let homeCount = Math.round((DAILY_SIZE * mix.home) / 100);
  let extraCount = extras.length ? Math.round((DAILY_SIZE * mix.extra) / 100) : 0;
  let globalCount = DAILY_SIZE - homeCount - extraCount;
  if (globalCount < 0) {
    extraCount += globalCount;
    globalCount = 0;
  }

  // Avoid repeating questions the student saw in the last 14 days.
  const recentIds = db
    .prepare("SELECT DISTINCT question_id FROM answer_log WHERE user_id = ? AND date >= date('now','-14 days')")
    .all(user.id)
    .map((r) => r.question_id);
  const excludeIds = new Set(recentIds);

  const buckets = [
    ...Array(homeCount).fill([home]),
    ...Array(extraCount).fill(extras),
    ...Array(globalCount).fill(["global"]),
  ];

  const picked = [];
  const subjects = diverseSubjects(buckets.length, preferred);
  for (let i = 0; i < buckets.length; i++) {
    const countries = buckets[i];
    const subject = subjects[i];
    const difficulty = targetDifficulty(user.id, subject, gradeBand);
    const q = pickQuestion({ countries, gradeBand, subject, difficulty, excludeIds });
    if (q) {
      picked.push(q);
      excludeIds.add(q.id);
    }
  }
  return shuffle(picked);
}

/** Questions the student got wrong in the last 21 days (excluding last 2, so they "come back later"). */
export function composeRevengeRound(user) {
  const rows = db
    .prepare(
      `SELECT DISTINCT question_id FROM answer_log
       WHERE user_id = ? AND correct = 0
         AND date >= date('now','-21 days') AND date <= date('now','-2 days')
         AND question_id NOT IN (
           SELECT question_id FROM answer_log WHERE user_id = ? AND correct = 1
         )
       ORDER BY RANDOM() LIMIT 6`
    )
    .all(user.id, user.id);
  if (!rows.length) return [];
  const ids = rows.map((r) => r.question_id);
  const ph = ids.map(() => "?").join(",");
  return db.prepare(`SELECT * FROM questions WHERE id IN (${ph}) AND status = 'approved'`).all(...ids);
}

export function revengeAvailable(user) {
  const existing = db
    .prepare("SELECT * FROM quizzes WHERE user_id = ? AND date = ? AND kind = 'revenge'")
    .get(user.id, today());
  if (existing && existing.completed) return false;
  return composeRevengeRound(user).length > 0;
}
