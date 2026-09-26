import db from "./db.js";
import { gradeBandFor, shuffle, today } from "./util.js";
import { ensureQuestionBuffer } from "./questionEngine.js";

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

export const COUNTRY_ALIASES = {
  nepal: ["nepal", "np"],
  india: ["india", "in"],
  usa: ["usa", "us"],
  uk: ["uk", "gb"],
  japan: ["japan", "jp"],
  china: ["china", "cn"],
  australia: ["australia", "au"],
  global: ["global"],
};

export function expandCountryCodes(countryList) {
  const result = new Set();
  for (const c of countryList || []) {
    if (!c) continue;
    const norm = String(c).toLowerCase().trim();
    const aliases = COUNTRY_ALIASES[norm] || [norm];
    aliases.forEach((a) => result.add(a));
  }
  return [...result];
}

/**
 * Fast random question picker using indexed offset instead of slow table-scan ORDER BY RANDOM().
 */
function queryRandomQuestion(whereSql, params) {
  const rowCount = db.prepare(`SELECT count(*) as c FROM questions WHERE ${whereSql}`).get(...params);
  if (!rowCount || rowCount.c === 0) return null;
  const offset = Math.floor(Math.random() * rowCount.c);
  return db.prepare(`SELECT * FROM questions WHERE ${whereSql} LIMIT 1 OFFSET ${offset}`).get(...params);
}

/**
 * Pick one question matching constraints with progressive fallbacks so a thin
 * content bank never breaks quiz composition and never leaks questions to the wrong grade or unrelated country.
 */
function pickQuestion({ countries, grade, gradeBand, subject, difficulty, excludeIds }) {
  const expandedCountries = expandCountryCodes(countries);
  const excl = excludeIds.size ? [...excludeIds] : [-1];
  const exclPh = excl.map(() => "?").join(",");
  const cPh = expandedCountries.map(() => "?").join(",");

  if (grade && expandedCountries[0]) {
    ensureQuestionBuffer(expandedCountries[0], grade);
  }

  // Attempt 1: Target countries + exact class/grade + subject
  if (grade) {
    let q = queryRandomQuestion(
      `status = 'approved' AND grade = ? AND country IN (${cPh}) AND id NOT IN (${exclPh}) AND subject = ? AND ABS(difficulty - ?) <= 1`,
      [grade, ...expandedCountries, ...excl, subject, difficulty]
    );
    if (q) return q;

    q = queryRandomQuestion(
      `status = 'approved' AND grade = ? AND country IN (${cPh}) AND id NOT IN (${exclPh}) AND subject = ?`,
      [grade, ...expandedCountries, ...excl, subject]
    );
    if (q) return q;

    q = queryRandomQuestion(
      `status = 'approved' AND grade = ? AND country IN (${cPh}) AND id NOT IN (${exclPh})`,
      [grade, ...expandedCountries, ...excl]
    );
    if (q) return q;
  }

  // Attempt 2: Target countries + gradeBand + subject + matching difficulty
  let q = queryRandomQuestion(
    `status = 'approved' AND grade_band = ? AND country IN (${cPh}) AND id NOT IN (${exclPh}) AND subject = ? AND ABS(difficulty - ?) <= 1`,
    [gradeBand, ...expandedCountries, ...excl, subject, difficulty]
  );
  if (q) return q;

  // Attempt 3: Target countries + gradeBand + subject (any difficulty)
  q = queryRandomQuestion(
    `status = 'approved' AND grade_band = ? AND country IN (${cPh}) AND id NOT IN (${exclPh}) AND subject = ?`,
    [gradeBand, ...expandedCountries, ...excl, subject]
  );
  if (q) return q;

  // Attempt 4: Target countries + gradeBand (any subject)
  q = queryRandomQuestion(
    `status = 'approved' AND grade_band = ? AND country IN (${cPh}) AND id NOT IN (${exclPh})`,
    [gradeBand, ...expandedCountries, ...excl]
  );
  if (q) return q;

  // Attempt 5: Fall back to "global" curriculum for this grade or gradeBand
  if (grade) {
    q = queryRandomQuestion(
      `status = 'approved' AND grade = ? AND country = 'global' AND id NOT IN (${exclPh})`,
      [grade, ...excl]
    );
    if (q) return q;
  }

  q = queryRandomQuestion(
    `status = 'approved' AND grade_band = ? AND country = 'global' AND id NOT IN (${exclPh}) AND subject = ?`,
    [gradeBand, ...excl, subject]
  );
  if (q) return q;

  q = queryRandomQuestion(
    `status = 'approved' AND grade_band = ? AND country = 'global' AND id NOT IN (${exclPh})`,
    [gradeBand, ...excl]
  );
  if (q) return q;

  // Attempt 6: Universal math/science questions in this grade band
  q = queryRandomQuestion(
    `status = 'approved' AND grade_band = ? AND subject IN ('math', 'science') AND id NOT IN (${exclPh})`,
    [gradeBand, ...excl]
  );
  if (q) return q;

  // Last resort: any approved question in this exact grade band
  return queryRandomQuestion(
    `status = 'approved' AND grade_band = ? AND id NOT IN (${exclPh})`,
    [gradeBand, ...excl]
  );
}

/** Compose the day's quest: mix-config country split, preferred-subject weighting, adaptive difficulty. */
export function composeDailyQuiz(user) {
  const grade = user.grade || 8;
  const gradeBand = gradeBandFor(grade);
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
    ...Array(extraCount).fill(extras.length ? extras : [home]),
    ...Array(globalCount).fill(["global"]),
  ];

  const picked = [];
  const subjects = diverseSubjects(buckets.length, preferred);
  for (let i = 0; i < buckets.length; i++) {
    const countries = buckets[i];
    const subject = subjects[i];
    const difficulty = targetDifficulty(user.id, subject, gradeBand);
    const q = pickQuestion({ countries, grade, gradeBand, subject, difficulty, excludeIds });
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

/** Compose a 5-question unlimited/practice round with balanced subjects across Science, GK, Social, Language, and Math. */
export function composePracticeQuiz(user, subjectFilter = null) {
  const grade = user.grade || 8;
  const gradeBand = gradeBandFor(grade);
  const home = user.home_country || "nepal";
  const extras = JSON.parse(user.extra_countries || "[]");
  const preferredCountries = expandCountryCodes([home, ...extras, "global"]);
  const PRACTICE_SIZE = 5;
  const targetSubjects = subjectFilter
    ? Array(PRACTICE_SIZE).fill(subjectFilter)
    : shuffle(["science", "gk", "social", "english", "math"]);

  const picked = [];
  const pickedIds = new Set();
  const cPh = preferredCountries.map(() => "?").join(",");

  for (const subj of targetSubjects) {
    const excl = pickedIds.size ? [...pickedIds] : [-1];
    const exclPh = excl.map(() => "?").join(",");

    // 1. Try preferred countries + exact subject + exact grade
    let q = queryRandomQuestion(
      `status = 'approved' AND subject = ? AND grade = ? AND country IN (${cPh}) AND id NOT IN (${exclPh})`,
      [subj, grade, ...preferredCountries, ...excl]
    );

    // 2. Try preferred countries + exact subject + exact grade band
    if (!q) {
      q = queryRandomQuestion(
        `status = 'approved' AND subject = ? AND grade_band = ? AND country IN (${cPh}) AND id NOT IN (${exclPh})`,
        [subj, gradeBand, ...preferredCountries, ...excl]
      );
    }

    // 3. Try global + exact subject + exact grade band
    if (!q) {
      q = queryRandomQuestion(
        `status = 'approved' AND subject = ? AND grade_band = ? AND country = 'global' AND id NOT IN (${exclPh})`,
        [subj, gradeBand, ...excl]
      );
    }

    // 4. Try any approved question for this subject in the SAME grade band
    if (!q) {
      q = queryRandomQuestion(
        `status = 'approved' AND subject = ? AND grade_band = ? AND id NOT IN (${exclPh})`,
        [subj, gradeBand, ...excl]
      );
    }

    if (q && !pickedIds.has(q.id)) {
      picked.push(q);
      pickedIds.add(q.id);
    }
  }

  // Backfill if needed (STRICTLY within the user's grade band!)
  while (picked.length < PRACTICE_SIZE) {
    const excl = pickedIds.size ? [...pickedIds] : [-1];
    const exclPh = excl.map(() => "?").join(",");
    const q = queryRandomQuestion(
      `status = 'approved' AND grade_band = ? AND id NOT IN (${exclPh})`,
      [gradeBand, ...excl]
    );
    if (!q) break;
    picked.push(q);
    pickedIds.add(q.id);
  }

  return shuffle(picked);
}

