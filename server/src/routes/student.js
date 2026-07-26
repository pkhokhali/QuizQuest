import { Router } from "express";
import db from "../db.js";
import { requireAuth } from "../auth.js";
import {
  serializeUser,
  serializeDigest,
  optionOrder,
  originalChoiceIndex,
  studentQuestion,
  gradeBandFor,
  today,
  daysAgo,
  weekStart,
  levelForXp,
  friendCode,
  parseFriendCode,
} from "../util.js";
import { composeDailyQuiz, composeRevengeRound } from "../quizComposer.js";
import { checkAwards, awardsForUser } from "../awards.js";
import { isOnline } from "../presence.js";

const BOT_PHONE = "9900000000";

function getBotUser() {
  return db.prepare("SELECT id FROM users WHERE phone = ?").get(BOT_PHONE);
}

/** One sample past battle so the Battle tab isn't empty for brand-new students. */
function ensureDemoBattle(userId) {
  const count = db
    .prepare("SELECT COUNT(*) c FROM battles WHERE p1 = ? OR p2 = ?")
    .get(userId, userId).c;
  if (count > 0) return;
  const bot = getBotUser();
  if (!bot || bot.id === userId) return;
  db.prepare("INSERT INTO battles (p1, p2, s1, s2, winner, date) VALUES (?, ?, ?, ?, ?, ?)").run(
    userId,
    bot.id,
    420,
    380,
    userId,
    daysAgo(2)
  );
}

function ensureDemoFriend(userId) {
  const bot = getBotUser();
  if (!bot || bot.id === userId) return;
  db.prepare("INSERT OR IGNORE INTO friendships (user_id, friend_id) VALUES (?, ?)").run(
    userId,
    bot.id
  );
  db.prepare("INSERT OR IGNORE INTO friendships (user_id, friend_id) VALUES (?, ?)").run(
    bot.id,
    userId
  );
}

const router = Router();
router.use(requireAuth);

const COUNTRIES = ["nepal", "india", "usa", "japan", "uk", "china", "australia"];
const SUBJECTS = ["math", "science", "social", "english", "nepali", "gk", "current"];

// ---------- Profile ----------

router.get("/me", (req, res) => res.json({ user: serializeUser(req.user) }));

router.put("/me", (req, res) => {
  const b = req.body || {};
  const sets = [];
  const params = [];
  if (typeof b.name === "string") { sets.push("name = ?"); params.push(b.name.slice(0, 60)); }
  if (Number.isInteger(b.grade) && b.grade >= 1 && b.grade <= 12) { sets.push("grade = ?"); params.push(b.grade); }
  if (b.language === "en" || b.language === "ne") { sets.push("language = ?"); params.push(b.language); }
  if (COUNTRIES.includes(b.homeCountry)) { sets.push("home_country = ?"); params.push(b.homeCountry); }
  if (Array.isArray(b.extraCountries)) {
    const extras = b.extraCountries.filter((c) => COUNTRIES.includes(c)).slice(0, 2);
    sets.push("extra_countries = ?"); params.push(JSON.stringify(extras));
  }
  if (Array.isArray(b.subjects)) {
    sets.push("subjects = ?"); params.push(JSON.stringify(b.subjects.filter((s) => SUBJECTS.includes(s))));
  }
  // Accept both the app's "afterschool" and the legacy "afternoon" label.
  if (["morning", "afternoon", "afterschool", "evening"].includes(b.quizTime)) { sets.push("quiz_time = ?"); params.push(b.quizTime); }
  if (b.avatar && typeof b.avatar === "object") { sets.push("avatar = ?"); params.push(JSON.stringify(b.avatar)); }
  if (typeof b.joinCode === "string" && b.joinCode.trim()) {
    const school = db.prepare("SELECT id FROM schools WHERE join_code = ?").get(b.joinCode.trim().toUpperCase());
    if (school) { sets.push("school_id = ?"); params.push(school.id); }
  }
  if (sets.length) {
    db.prepare(`UPDATE users SET ${sets.join(", ")} WHERE id = ?`).run(...params, req.user.id);
  }
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
  res.json({ user: serializeUser(user) });
});

// Join a school (or class) by its code so class/school ranks light up.
router.post("/school/join", (req, res) => {
  const code = String(req.body.joinCode || "").trim().toUpperCase();
  if (!code) return res.status(400).json({ error: "Enter your school code" });
  const school = db.prepare("SELECT * FROM schools WHERE join_code = ?").get(code);
  if (!school) return res.status(404).json({ error: "No school found with that code" });
  db.prepare("UPDATE users SET school_id = ? WHERE id = ?").run(school.id, req.user.id);
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
  res.json({ user: serializeUser(user), school: { id: school.id, name: school.name } });
});

// Leave the current school.
router.post("/school/leave", (req, res) => {
  db.prepare("UPDATE users SET school_id = NULL WHERE id = ?").run(req.user.id);
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
  res.json({ user: serializeUser(user) });
});

// ---------- Home & digest ----------

function publishedDigest(gradeBand) {
  return db
    .prepare("SELECT * FROM digests WHERE date = ? AND grade_band = ? AND status = 'published' ORDER BY id DESC")
    .get(today(), gradeBand);
}

router.get("/home", (req, res) => {
  const user = req.user;
  const gradeBand = gradeBandFor(user.grade || 8);
  const quiz = db
    .prepare("SELECT * FROM quizzes WHERE user_id = ? AND date = ? AND kind = 'daily'")
    .get(user.id, today());
  const dailyQuiz = {
    status: !quiz ? "not_started" : quiz.completed ? "completed" : "in_progress",
    score: quiz ? quiz.score : 0,
    total: quiz ? JSON.parse(quiz.question_ids).length : 8,
  };
  const weeklyXp =
    db.prepare("SELECT COALESCE(SUM(amount),0) s FROM xp_events WHERE user_id = ? AND date >= ?")
      .get(user.id, weekStart()).s;
  const recent = db
    .prepare("SELECT award_code, earned_at FROM user_awards WHERE user_id = ? ORDER BY earned_at DESC LIMIT 3")
    .all(user.id);
  const all = awardsForUser(user.id).filter((a) => a.earned);
  const recentAwards = recent
    .map((r) => all.find((a) => a.code === r.award_code))
    .filter(Boolean)
    .map(({ earned, ...a }) => a);

  const revengeQuiz = db
    .prepare("SELECT * FROM quizzes WHERE user_id = ? AND date = ? AND kind = 'revenge'")
    .get(user.id, today());
  const revengeAvail = (!revengeQuiz || !revengeQuiz.completed) && composeRevengeRound(user).length > 0;

  res.json({
    user: serializeUser(user),
    dailyQuiz,
    digest: serializeDigest(publishedDigest(gradeBand)),
    revengeAvailable: revengeAvail,
    recentAwards,
    weeklyXp,
  });
});

router.get("/digest/today", (req, res) => {
  res.json({ digest: serializeDigest(publishedDigest(gradeBandFor(req.user.grade || 8))) });
});

// ---------- Quizzes ----------

function getOrCreateQuiz(user, kind) {
  let quiz = db
    .prepare("SELECT * FROM quizzes WHERE user_id = ? AND date = ? AND kind = ?")
    .get(user.id, today(), kind);
  if (!quiz) {
    const questions = kind === "daily" ? composeDailyQuiz(user) : composeRevengeRound(user);
    if (!questions.length) return null;
    const info = db
      .prepare("INSERT INTO quizzes (user_id, date, kind, question_ids) VALUES (?, ?, ?, ?)")
      .run(user.id, today(), kind, JSON.stringify(questions.map((q) => q.id)));
    quiz = db.prepare("SELECT * FROM quizzes WHERE id = ?").get(info.lastInsertRowid);
  }
  return quiz;
}

function questionsForQuiz(quiz, language) {
  const ids = JSON.parse(quiz.question_ids);
  const ph = ids.map(() => "?").join(",");
  const rows = db.prepare(`SELECT * FROM questions WHERE id IN (${ph})`).all(...ids);
  const byId = Object.fromEntries(rows.map((r) => [r.id, r]));
  return ids.map((id) => byId[id]).filter(Boolean).map((q) => studentQuestion(q, language, quiz.id));
}

router.get("/quiz/daily", (req, res) => {
  const quiz = getOrCreateQuiz(req.user, "daily");
  if (!quiz) return res.status(503).json({ error: "No questions available yet — check back soon!" });
  res.json({
    quizId: quiz.id,
    date: quiz.date,
    questions: questionsForQuiz(quiz, req.user.language),
    completed: Boolean(quiz.completed),
    score: quiz.score,
  });
});

router.get("/quiz/revenge", (req, res) => {
  const existing = db
    .prepare("SELECT * FROM quizzes WHERE user_id = ? AND date = ? AND kind = 'revenge'")
    .get(req.user.id, today());
  if (existing && existing.completed) return res.status(404).json({ error: "Revenge round already done today" });
  const quiz = getOrCreateQuiz(req.user, "revenge");
  if (!quiz) return res.status(404).json({ error: "Nothing to avenge right now — nice work!" });
  res.json({ quizId: quiz.id, questions: questionsForQuiz(quiz, req.user.language) });
});

function submitQuiz(req, res, kind) {
  const user = req.user;
  const { quizId, answers } = req.body || {};
  const quiz = db.prepare("SELECT * FROM quizzes WHERE id = ? AND user_id = ? AND kind = ?").get(quizId, user.id, kind);
  if (!quiz) return res.status(404).json({ error: "Quiz not found" });
  if (quiz.completed) return res.status(400).json({ error: "Already completed" });
  if (!Array.isArray(answers)) return res.status(400).json({ error: "Answers required" });

  const ids = JSON.parse(quiz.question_ids);
  const ph = ids.map(() => "?").join(",");
  const questions = db.prepare(`SELECT * FROM questions WHERE id IN (${ph})`).all(...ids);
  const byId = Object.fromEntries(questions.map((q) => [q.id, q]));

  let score = 0;
  let xpEarned = 0;
  const correct = [];
  const logStmt = db.prepare(
    "INSERT INTO answer_log (user_id, question_id, subject, country, correct, source, date) VALUES (?, ?, ?, ?, ?, ?, ?)"
  );
  for (const qid of ids) {
    const q = byId[qid];
    if (!q) continue;
    const ans = answers.find((a) => a && a.questionId === qid);
    const choice = originalChoiceIndex(quiz.id, qid, ans?.choice ?? null);
    const isCorrect = choice != null && choice === q.correct_index;
    correct.push({
      questionId: qid,
      correctIndex: optionOrder(quiz.id, qid).indexOf(q.correct_index),
    });
    if (isCorrect) {
      score += 1;
      if (kind === "daily") {
        xpEarned += 10;
        if (typeof ans.timeMs === "number" && ans.timeMs < 5000) xpEarned += 5;
      } else {
        xpEarned += 8;
      }
    } else if (kind === "daily") {
      xpEarned -= 2; // quiet cost, never floors below 0 for the quiz overall
    }
    logStmt.run(user.id, qid, q.subject, q.country, isCorrect ? 1 : 0, kind, today());
  }
  xpEarned = Math.max(0, xpEarned);

  let streak = user.streak;
  let comeback = false;
  if (kind === "daily") {
    const last = user.last_quiz_date;
    if (last === daysAgo(1)) streak = user.streak + 1;
    else if (last !== today()) {
      if (last && last < daysAgo(3)) comeback = true;
      streak = 1;
    }
    db.prepare("UPDATE users SET streak = ?, best_streak = MAX(best_streak, ?), last_quiz_date = ? WHERE id = ?")
      .run(streak, streak, today(), user.id);
  }

  db.prepare("UPDATE quizzes SET completed = 1, score = ?, xp_earned = ? WHERE id = ?").run(score, xpEarned, quiz.id);
  db.prepare("UPDATE users SET xp = xp + ? WHERE id = ?").run(xpEarned, user.id);
  if (xpEarned > 0) {
    db.prepare("INSERT INTO xp_events (user_id, amount, reason, date) VALUES (?, ?, ?, ?)")
      .run(user.id, xpEarned, kind === "daily" ? "daily_quest" : "revenge_round", today());
  }

  const fresh = db.prepare("SELECT * FROM users WHERE id = ?").get(user.id);
  const newAwards = checkAwards(user.id, { comeback }).map(({ earned, ...a }) => a);
  res.json({
    score,
    total: ids.length,
    xpEarned,
    xp: fresh.xp,
    level: levelForXp(fresh.xp),
    streak: fresh.streak,
    newAwards,
    correct,
  });
}

router.post("/quiz/daily/submit", (req, res) => submitQuiz(req, res, "daily"));
router.post("/quiz/revenge/submit", (req, res) => submitQuiz(req, res, "revenge"));

// ---------- Battles history ----------

router.get("/battles/history", (req, res) => {
  const uid = req.user.id;
  ensureDemoBattle(uid);
  const rows = db
    .prepare("SELECT * FROM battles WHERE p1 = ? OR p2 = ? ORDER BY id DESC LIMIT 30")
    .all(uid, uid);
  const battles = rows.map((b) => {
    const mine = b.p1 === uid;
    const oppId = mine ? b.p2 : b.p1;
    const opp = db.prepare("SELECT name FROM users WHERE id = ?").get(oppId);
    const myScore = mine ? b.s1 : b.s2;
    const theirScore = mine ? b.s2 : b.s1;
    return {
      id: b.id,
      opponentName: opp ? opp.name || "Player" : "Player",
      myScore,
      theirScore,
      result: b.winner == null ? "draw" : b.winner === uid ? "win" : "loss",
      date: b.date,
    };
  });
  res.json({ battles });
});

// ---------- Leaderboard ----------

router.get("/leaderboard", (req, res) => {
  const user = req.user;
  const scope = ["class", "school", "friends"].includes(req.query.scope) ? req.query.scope : "class";

  let members;
  if (scope === "friends") {
    const ids = db.prepare("SELECT friend_id FROM friendships WHERE user_id = ?").all(user.id).map((r) => r.friend_id);
    ids.push(user.id);
    const ph = ids.map(() => "?").join(",");
    members = db.prepare(`SELECT * FROM users WHERE id IN (${ph})`).all(...ids);
  } else if (scope === "school" && user.school_id) {
    members = db.prepare("SELECT * FROM users WHERE school_id = ? AND role = 'student'").all(user.school_id);
  } else {
    // class scope: same grade (same school when known)
    members = user.school_id
      ? db.prepare("SELECT * FROM users WHERE grade = ? AND school_id = ? AND role = 'student'").all(user.grade, user.school_id)
      : db.prepare("SELECT * FROM users WHERE grade = ? AND role = 'student'").all(user.grade);
  }
  if (!members.some((m) => m.id === user.id)) members.push(user);

  const ws = weekStart();
  const xpStmt = db.prepare("SELECT COALESCE(SUM(amount),0) s FROM xp_events WHERE user_id = ? AND date >= ?");
  const entries = members
    .map((m) => ({
      userId: m.id,
      name: m.name || "Player",
      avatar: JSON.parse(m.avatar || "{}"),
      weeklyXp: xpStmt.get(m.id, ws).s,
      isMe: m.id === user.id,
    }))
    .sort((a, b) => b.weeklyXp - a.weeklyXp || a.userId - b.userId)
    .map((e, i) => ({ ...e, rank: i + 1 }));

  const me = entries.find((e) => e.isMe);
  const top3 = entries.slice(0, 3);
  // Neighborhood: 2 above and 2 below the student — never the full ranking.
  const start = Math.max(0, me.rank - 3);
  const neighborhood = entries.slice(start, me.rank + 2);
  res.json({ scope, top3, neighborhood, me });
});

// ---------- Friends ----------

router.get("/friends", (req, res) => {
  ensureDemoFriend(req.user.id);
  const ids = db.prepare("SELECT friend_id FROM friendships WHERE user_id = ?").all(req.user.id).map((r) => r.friend_id);
  const friends = ids
    .map((id) => db.prepare("SELECT * FROM users WHERE id = ?").get(id))
    .filter(Boolean)
    .map((f) => ({
      userId: f.id,
      name: f.name || "Player",
      avatar: JSON.parse(f.avatar || "{}"),
      level: levelForXp(f.xp),
      streak: f.streak,
      online: isOnline(f.id),
    }));
  res.json({ friends });
});

router.post("/friends/add", (req, res) => {
  const fid = parseFriendCode(req.body.friendCode);
  if (!fid) return res.status(400).json({ error: "That doesn't look like a friend code (QQ-000123)" });
  if (fid === req.user.id) return res.status(400).json({ error: "That's your own code!" });
  const friend = db.prepare("SELECT * FROM users WHERE id = ?").get(fid);
  if (!friend) return res.status(404).json({ error: "No player found with that code" });
  db.prepare("INSERT OR IGNORE INTO friendships (user_id, friend_id) VALUES (?, ?)").run(req.user.id, fid);
  db.prepare("INSERT OR IGNORE INTO friendships (user_id, friend_id) VALUES (?, ?)").run(fid, req.user.id);
  res.json({
    friend: {
      userId: friend.id,
      name: friend.name || "Player",
      avatar: JSON.parse(friend.avatar || "{}"),
      level: levelForXp(friend.xp),
      streak: friend.streak,
      online: isOnline(friend.id),
    },
  });
});

// ---------- Awards ----------

router.get("/awards", (req, res) => {
  res.json({ awards: awardsForUser(req.user.id) });
});

export default router;
