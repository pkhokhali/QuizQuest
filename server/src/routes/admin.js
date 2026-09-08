import { Router } from "express";
import db from "../db.js";
import { requireAdmin } from "../auth.js";
import { adminQuestion, serializeDigest, GRADE_BANDS, today, daysAgo } from "../util.js";

const router = Router();
router.use(requireAdmin);

const COUNTRIES = ["nepal", "india", "usa", "japan", "uk", "china", "australia", "global"];
const SUBJECTS = ["math", "science", "social", "english", "nepali", "gk", "current"];

function validateQuestion(b) {
  if (!b.textEn || typeof b.textEn !== "string") return "textEn is required";
  if (!Array.isArray(b.optionsEn) || b.optionsEn.length !== 4 || b.optionsEn.some((o) => !String(o).trim()))
    return "optionsEn must be 4 non-empty options";
  if (!Number.isInteger(b.correctIndex) || b.correctIndex < 0 || b.correctIndex > 3)
    return "correctIndex must be 0-3";
  if (!COUNTRIES.includes(b.country)) return `country must be one of: ${COUNTRIES.join(", ")}`;
  if (!SUBJECTS.includes(b.subject)) return `subject must be one of: ${SUBJECTS.join(", ")}`;
  if (!GRADE_BANDS.includes(b.gradeBand)) return `gradeBand must be one of: ${GRADE_BANDS.join(", ")}`;
  if (!Number.isInteger(b.difficulty) || b.difficulty < 1 || b.difficulty > 5) return "difficulty must be 1-5";
  return null;
}

// ---------- Questions ----------

router.get("/questions", (req, res) => {
  const { country, subject, gradeBand, difficulty, status, search } = req.query;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const pageSize = Math.min(200, Math.max(1, parseInt(req.query.pageSize) || 50));
  const where = [];
  const params = [];
  if (country) { where.push("country = ?"); params.push(country); }
  if (subject) { where.push("subject = ?"); params.push(subject); }
  if (gradeBand) { where.push("grade_band = ?"); params.push(gradeBand); }
  if (difficulty) { where.push("difficulty = ?"); params.push(Number(difficulty)); }
  if (status) { where.push("status = ?"); params.push(status); }
  if (search) { where.push("(text_en LIKE ? OR text_ne LIKE ? OR topic LIKE ?)"); params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const total = db.prepare(`SELECT COUNT(*) c FROM questions ${whereSql}`).get(...params).c;
  const rows = db
    .prepare(`SELECT * FROM questions ${whereSql} ORDER BY id DESC LIMIT ? OFFSET ?`)
    .all(...params, pageSize, (page - 1) * pageSize);
  res.json({ questions: rows.map(adminQuestion), total, page, pageSize });
});

function questionParams(b) {
  return [
    b.textEn.trim(),
    b.textNe ? String(b.textNe).trim() : null,
    JSON.stringify(b.optionsEn.map(String)),
    Array.isArray(b.optionsNe) && b.optionsNe.length === 4 && b.optionsNe.every((o) => String(o).trim())
      ? JSON.stringify(b.optionsNe.map(String))
      : null,
    b.correctIndex,
    b.country,
    b.subject,
    b.gradeBand,
    b.difficulty,
    b.topic ? String(b.topic) : "",
    b.source ? String(b.source) : "admin",
    b.status === "draft" ? "draft" : "approved",
  ];
}

router.post("/questions", (req, res) => {
  const err = validateQuestion(req.body);
  if (err) return res.status(400).json({ error: err });
  const info = db
    .prepare(
      `INSERT INTO questions (text_en, text_ne, options_en, options_ne, correct_index, country, subject, grade_band, difficulty, topic, source, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(...questionParams(req.body));
  res.json({ question: adminQuestion(db.prepare("SELECT * FROM questions WHERE id = ?").get(info.lastInsertRowid)) });
});

router.put("/questions/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM questions WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Question not found" });
  const merged = { ...adminQuestion(existing), ...req.body };
  const err = validateQuestion(merged);
  if (err) return res.status(400).json({ error: err });
  db.prepare(
    `UPDATE questions SET text_en=?, text_ne=?, options_en=?, options_ne=?, correct_index=?, country=?, subject=?, grade_band=?, difficulty=?, topic=?, source=?, status=? WHERE id=?`
  ).run(...questionParams(merged), existing.id);
  res.json({ question: adminQuestion(db.prepare("SELECT * FROM questions WHERE id = ?").get(existing.id)) });
});

router.delete("/questions/:id", (req, res) => {
  db.prepare("DELETE FROM questions WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

// ---------- CSV import ----------

/** Minimal CSV parser with quoted-field support. */
function parseCsv(text) {
  const rows = [];
  let row = [], field = "", inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((f) => f.trim() !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((f) => f.trim() !== "")) rows.push(row);
  return rows;
}

router.post("/questions/import", (req, res) => {
  const csv = String(req.body.csv || "");
  if (!csv.trim()) return res.status(400).json({ error: "CSV content required" });
  const rows = parseCsv(csv);
  if (rows.length < 2) return res.status(400).json({ error: "CSV must have a header row and at least one data row" });
  const header = rows[0].map((h) => h.trim());
  const idx = (name) => header.indexOf(name);
  const required = ["textEn", "option1En", "option2En", "option3En", "option4En", "correctIndex", "country", "subject", "gradeBand", "difficulty"];
  const missing = required.filter((r) => idx(r) === -1);
  if (missing.length) return res.status(400).json({ error: `Missing CSV columns: ${missing.join(", ")}` });

  let imported = 0, skipped = 0;
  const errors = [];
  const insert = db.prepare(
    `INSERT INTO questions (text_en, text_ne, options_en, options_ne, correct_index, country, subject, grade_band, difficulty, topic, source, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved')`
  );
  const tx = db.transaction(() => {
    for (let r = 1; r < rows.length; r++) {
      const cells = rows[r];
      const get = (name) => { const i = idx(name); return i >= 0 ? (cells[i] || "").trim() : ""; };
      const q = {
        textEn: get("textEn"),
        textNe: get("textNe") || null,
        optionsEn: [get("option1En"), get("option2En"), get("option3En"), get("option4En")],
        optionsNe: [get("option1Ne"), get("option2Ne"), get("option3Ne"), get("option4Ne")],
        correctIndex: Number(get("correctIndex")),
        country: get("country").toLowerCase(),
        subject: get("subject").toLowerCase(),
        gradeBand: get("gradeBand"),
        difficulty: Number(get("difficulty")),
        topic: get("topic"),
        source: get("source") || "csv-import",
      };
      const err = validateQuestion(q);
      if (err) {
        skipped++;
        if (errors.length < 20) errors.push(`Row ${r + 1}: ${err}`);
        continue;
      }
      insert.run(
        q.textEn, q.textNe, JSON.stringify(q.optionsEn),
        q.optionsNe.every((o) => o) ? JSON.stringify(q.optionsNe) : null,
        q.correctIndex, q.country, q.subject, q.gradeBand, q.difficulty, q.topic, q.source
      );
      imported++;
    }
  });
  tx();
  res.json({ imported, skipped, errors });
});

// ---------- Digests ----------

router.get("/digests", (req, res) => {
  const { status } = req.query;
  const rows = status
    ? db.prepare("SELECT * FROM digests WHERE status = ? ORDER BY date DESC, id DESC LIMIT 200").all(status)
    : db.prepare("SELECT * FROM digests ORDER BY date DESC, id DESC LIMIT 200").all();
  res.json({ digests: rows.map(serializeDigest) });
});

router.post("/digests", (req, res) => {
  const b = req.body || {};
  if (!/^\d{4}-\d{2}-\d{2}$/.test(b.date || "")) return res.status(400).json({ error: "date must be YYYY-MM-DD" });
  if (!GRADE_BANDS.includes(b.gradeBand)) return res.status(400).json({ error: "Invalid gradeBand" });
  const info = db
    .prepare(
      `INSERT INTO digests (date, grade_band, headline_en, headline_ne, gk_fact_en, gk_fact_ne, nepal_fact_en, nepal_fact_ne, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft')`
    )
    .run(b.date, b.gradeBand, b.headlineEn || "", b.headlineNe || "", b.gkFactEn || "", b.gkFactNe || "", b.nepalFactEn || "", b.nepalFactNe || "");
  res.json({ digest: serializeDigest(db.prepare("SELECT * FROM digests WHERE id = ?").get(info.lastInsertRowid)) });
});

router.put("/digests/:id", (req, res) => {
  const d = db.prepare("SELECT * FROM digests WHERE id = ?").get(req.params.id);
  if (!d) return res.status(404).json({ error: "Digest not found" });
  if (d.status === "published") return res.status(400).json({ error: "Published digests are read-only" });
  const b = req.body || {};
  db.prepare(
    `UPDATE digests SET date = ?, grade_band = ?, headline_en = ?, headline_ne = ?, gk_fact_en = ?, gk_fact_ne = ?, nepal_fact_en = ?, nepal_fact_ne = ? WHERE id = ?`
  ).run(
    b.date || d.date,
    GRADE_BANDS.includes(b.gradeBand) ? b.gradeBand : d.grade_band,
    b.headlineEn ?? d.headline_en, b.headlineNe ?? d.headline_ne,
    b.gkFactEn ?? d.gk_fact_en, b.gkFactNe ?? d.gk_fact_ne,
    b.nepalFactEn ?? d.nepal_fact_en, b.nepalFactNe ?? d.nepal_fact_ne,
    d.id
  );
  res.json({ digest: serializeDigest(db.prepare("SELECT * FROM digests WHERE id = ?").get(d.id)) });
});

router.post("/digests/:id/approve", (req, res) => {
  const d = db.prepare("SELECT * FROM digests WHERE id = ?").get(req.params.id);
  if (!d) return res.status(404).json({ error: "Digest not found" });
  db.prepare("UPDATE digests SET status = 'published' WHERE id = ?").run(d.id);
  res.json({ digest: serializeDigest(db.prepare("SELECT * FROM digests WHERE id = ?").get(d.id)) });
});

router.delete("/digests/:id", (req, res) => {
  db.prepare("DELETE FROM digests WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

// ---------- Mix config ----------

router.get("/mix-config", (req, res) => {
  const rows = db.prepare("SELECT * FROM mix_config ORDER BY grade_band").all();
  const byBand = Object.fromEntries(rows.map((r) => [r.grade_band, r]));
  const configs = GRADE_BANDS.map((band) => {
    const r = byBand[band];
    return {
      gradeBand: band,
      homePct: r ? r.home_pct : 60,
      extraPct: r ? r.extra_pct : 25,
      globalPct: r ? r.global_pct : 15,
    };
  });
  res.json({ configs });
});

router.put("/mix-config", (req, res) => {
  const { gradeBand, homePct, extraPct, globalPct } = req.body || {};
  if (!GRADE_BANDS.includes(gradeBand)) return res.status(400).json({ error: "Invalid gradeBand" });
  const nums = [homePct, extraPct, globalPct];
  if (nums.some((n) => !Number.isInteger(n) || n < 0 || n > 100) || homePct + extraPct + globalPct !== 100)
    return res.status(400).json({ error: "Percentages must be whole numbers summing to 100" });
  db.prepare(
    `INSERT INTO mix_config (grade_band, home_pct, extra_pct, global_pct) VALUES (?, ?, ?, ?)
     ON CONFLICT(grade_band) DO UPDATE SET home_pct = excluded.home_pct, extra_pct = excluded.extra_pct, global_pct = excluded.global_pct`
  ).run(gradeBand, homePct, extraPct, globalPct);
  res.json({ config: { gradeBand, homePct, extraPct, globalPct } });
});

// ---------- Schools ----------

router.get("/schools", (req, res) => {
  const rows = db.prepare("SELECT * FROM schools ORDER BY id DESC").all();
  const schools = rows.map((s) => ({
    id: s.id,
    name: s.name,
    district: s.district || "Kathmandu",
    joinCode: s.join_code,
    verified: Boolean(s.verified),
    badge: s.badge || "🏫",
    studentCount: db.prepare("SELECT COUNT(*) c FROM users WHERE school_id = ?").get(s.id).c,
    totalXp: db.prepare("SELECT COALESCE(SUM(xp), 0) s FROM users WHERE school_id = ?").get(s.id).s,
  }));
  res.json({ schools });
});

router.post("/schools", (req, res) => {
  const name = String(req.body.name || "").trim();
  const district = String(req.body.district || "Kathmandu").trim();
  if (!name) return res.status(400).json({ error: "School name required" });
  let joinCode;
  do {
    joinCode = "SCH-" + Math.random().toString(36).slice(2, 8).toUpperCase();
  } while (db.prepare("SELECT 1 FROM schools WHERE join_code = ?").get(joinCode));
  const info = db.prepare("INSERT INTO schools (name, district, join_code) VALUES (?, ?, ?)").run(name, district, joinCode);
  res.json({ school: { id: info.lastInsertRowid, name, district, joinCode, verified: false, studentCount: 0, totalXp: 0 } });
});

router.post("/schools/:id/verify", (req, res) => {
  const school = db.prepare("SELECT * FROM schools WHERE id = ?").get(req.params.id);
  if (!school) return res.status(404).json({ error: "School not found" });
  const nextVerified = school.verified ? 0 : 1;
  db.prepare("UPDATE schools SET verified = ? WHERE id = ?").run(nextVerified, school.id);
  res.json({ ok: true, verified: Boolean(nextVerified) });
});

router.delete("/schools/:id", (req, res) => {
  db.prepare("UPDATE users SET school_id = NULL WHERE school_id = ?").run(req.params.id);
  db.prepare("DELETE FROM schools WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

// ---------- Memory Packs CMS ----------

router.get("/memory/packs", (req, res) => {
  const rows = db.prepare("SELECT * FROM memory_packs ORDER BY id DESC").all();
  const packs = rows.map((r) => ({
    id: r.id,
    titleEn: r.title_en,
    titleNe: r.title_ne,
    subject: r.subject,
    difficulty: r.difficulty,
    timeLimitSec: r.time_limit_sec,
    pairs: JSON.parse(r.pairs || "[]"),
    playsCount: db.prepare("SELECT COUNT(*) c FROM memory_scores WHERE pack_id = ?").get(r.id).c,
  }));
  res.json({ packs });
});

router.post("/memory/packs", (req, res) => {
  const b = req.body || {};
  if (!b.titleEn || !b.subject || !Array.isArray(b.pairs) || b.pairs.length < 3) {
    return res.status(400).json({ error: "titleEn, subject, and at least 3 pairs are required" });
  }
  const info = db.prepare(`
    INSERT INTO memory_packs (title_en, title_ne, subject, difficulty, time_limit_sec, pairs)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    String(b.titleEn).trim(),
    b.titleNe ? String(b.titleNe).trim() : null,
    String(b.subject).trim(),
    Number(b.difficulty) || 1,
    Number(b.timeLimitSec) || 60,
    JSON.stringify(b.pairs)
  );
  res.json({ id: info.lastInsertRowid, ok: true });
});

router.delete("/memory/packs/:id", (req, res) => {
  db.prepare("DELETE FROM memory_packs WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

// ---------- Reported Questions Queue ----------

router.get("/reports", (req, res) => {
  const rows = db.prepare(`
    SELECT r.id, r.user_id as userId, r.question_id as questionId, r.reason, r.details, r.status, r.created_at as createdAt,
           u.name as reporterName,
           q.text_en as questionText, q.subject
    FROM reported_questions r
    LEFT JOIN users u ON u.id = r.user_id
    LEFT JOIN questions q ON q.id = r.question_id
    ORDER BY r.id DESC
    LIMIT 100
  `).all();
  res.json({ reports: rows });
});

router.post("/reports/:id/resolve", (req, res) => {
  const status = req.body.status === "dismissed" ? "dismissed" : "resolved";
  db.prepare("UPDATE reported_questions SET status = ? WHERE id = ?").run(status, req.params.id);
  res.json({ ok: true, status });
});

// ---------- Analytics ----------

router.get("/analytics", (req, res) => {
  const totals = {
    users: db.prepare("SELECT COUNT(*) c FROM users WHERE role = 'student'").get().c,
    questions: db.prepare("SELECT COUNT(*) c FROM questions").get().c,
    schools: db.prepare("SELECT COUNT(*) c FROM schools").get().c,
  };
  const dau = db.prepare("SELECT COUNT(DISTINCT user_id) c FROM xp_events WHERE date = ?").get(today()).c;
  const wau = db.prepare("SELECT COUNT(DISTINCT user_id) c FROM xp_events WHERE date >= ?").get(daysAgo(7)).c;
  const quizzesToday = db.prepare("SELECT COUNT(*) c FROM quizzes WHERE date = ? AND completed = 1").get(today()).c;
  const battlesToday = db.prepare("SELECT COUNT(*) c FROM battles WHERE date = ?").get(today()).c;
  const avgStreak = db.prepare("SELECT ROUND(AVG(streak), 1) a FROM users WHERE role = 'student' AND streak > 0").get().a || 0;
  const subjectPopularity = db
    .prepare("SELECT subject, COUNT(*) answers FROM answer_log GROUP BY subject ORDER BY answers DESC")
    .all();
  const countryDistribution = db
    .prepare("SELECT home_country country, COUNT(*) students FROM users WHERE role = 'student' AND home_country IS NOT NULL GROUP BY home_country ORDER BY students DESC")
    .all();
  const gradeDistribution = db
    .prepare("SELECT grade, COUNT(*) students FROM users WHERE role = 'student' AND grade IS NOT NULL GROUP BY grade ORDER BY grade")
    .all();
  res.json({ totals, dau, wau, quizzesToday, battlesToday, avgStreak, subjectPopularity, countryDistribution, gradeDistribution });
});

export default router;
