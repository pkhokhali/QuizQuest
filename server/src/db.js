import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import crypto from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "..", "data");
fs.mkdirSync(dataDir, { recursive: true });

export const db = new Database(path.join(dataDir, "quizquest.db"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone TEXT UNIQUE NOT NULL,
  name TEXT DEFAULT '',
  role TEXT NOT NULL DEFAULT 'student',
  grade INTEGER,
  language TEXT NOT NULL DEFAULT 'en',
  home_country TEXT,
  extra_countries TEXT NOT NULL DEFAULT '[]',
  subjects TEXT NOT NULL DEFAULT '[]',
  quiz_time TEXT,
  avatar TEXT NOT NULL DEFAULT '{"emoji":"🦊","bg":"#7C3AED"}',
  xp INTEGER NOT NULL DEFAULT 0,
  streak INTEGER NOT NULL DEFAULT 0,
  best_streak INTEGER NOT NULL DEFAULT 0,
  last_quiz_date TEXT,
  school_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  text_en TEXT NOT NULL,
  text_ne TEXT,
  options_en TEXT NOT NULL,
  options_ne TEXT,
  correct_index INTEGER NOT NULL,
  country TEXT NOT NULL,
  subject TEXT NOT NULL,
  grade_band TEXT NOT NULL,
  difficulty INTEGER NOT NULL DEFAULT 2,
  topic TEXT DEFAULT '',
  source TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'approved',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_q_pick ON questions (status, grade_band, country, subject, difficulty);
CREATE INDEX IF NOT EXISTS idx_q_status ON questions (status);

CREATE TABLE IF NOT EXISTS quizzes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'daily',
  question_ids TEXT NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0,
  score INTEGER NOT NULL DEFAULT 0,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, date, kind)
);

CREATE TABLE IF NOT EXISTS answer_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  question_id INTEGER NOT NULL,
  subject TEXT NOT NULL,
  country TEXT NOT NULL,
  correct INTEGER NOT NULL,
  source TEXT NOT NULL DEFAULT 'daily',
  date TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_al_user ON answer_log (user_id, id);
CREATE INDEX IF NOT EXISTS idx_al_user_subject ON answer_log (user_id, subject, id);
CREATE INDEX IF NOT EXISTS idx_al_date ON answer_log (date);

CREATE TABLE IF NOT EXISTS xp_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  date TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_xp_user_date ON xp_events (user_id, date);

CREATE TABLE IF NOT EXISTS digests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  grade_band TEXT NOT NULL,
  headline_en TEXT DEFAULT '', headline_ne TEXT DEFAULT '',
  gk_fact_en TEXT DEFAULT '', gk_fact_ne TEXT DEFAULT '',
  nepal_fact_en TEXT DEFAULT '', nepal_fact_ne TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS user_awards (
  user_id INTEGER NOT NULL,
  award_code TEXT NOT NULL,
  earned_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, award_code)
);

CREATE TABLE IF NOT EXISTS friendships (
  user_id INTEGER NOT NULL,
  friend_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, friend_id)
);

CREATE TABLE IF NOT EXISTS battles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  p1 INTEGER NOT NULL,
  p2 INTEGER NOT NULL,
  s1 INTEGER NOT NULL DEFAULT 0,
  s2 INTEGER NOT NULL DEFAULT 0,
  winner INTEGER,
  date TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_battles_p ON battles (p1, p2);

CREATE TABLE IF NOT EXISTS mix_config (
  grade_band TEXT PRIMARY KEY,
  home_pct INTEGER NOT NULL DEFAULT 60,
  extra_pct INTEGER NOT NULL DEFAULT 25,
  global_pct INTEGER NOT NULL DEFAULT 15
);

CREATE TABLE IF NOT EXISTS schools (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  join_code TEXT UNIQUE NOT NULL,
  district TEXT DEFAULT 'Kathmandu',
  creator_user_id INTEGER,
  verified INTEGER NOT NULL DEFAULT 0,
  badge TEXT DEFAULT '🏫',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS memory_packs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title_en TEXT NOT NULL,
  title_ne TEXT,
  subject TEXT NOT NULL,
  difficulty INTEGER NOT NULL DEFAULT 1,
  pairs TEXT NOT NULL,
  time_limit_sec INTEGER NOT NULL DEFAULT 60,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS memory_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  pack_id INTEGER NOT NULL,
  moves INTEGER NOT NULL,
  time_ms INTEGER NOT NULL,
  stars INTEGER NOT NULL DEFAULT 1,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  date TEXT NOT NULL DEFAULT (date('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reported_questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  question_id INTEGER NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS push_tokens (
  user_id INTEGER NOT NULL,
  token TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, token)
);
`);

// Safe column migrations for existing databases
try {
  db.exec("ALTER TABLE users ADD COLUMN email TEXT");
} catch {}
try {
  db.exec("ALTER TABLE users ADD COLUMN password_hash TEXT");
} catch {}
try {
  db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users (email)");
} catch {}

try {
  db.exec("ALTER TABLE schools ADD COLUMN district TEXT DEFAULT 'Kathmandu'");
} catch {}
try {
  db.exec("ALTER TABLE schools ADD COLUMN creator_user_id INTEGER");
} catch {}
try {
  db.exec("ALTER TABLE schools ADD COLUMN verified INTEGER NOT NULL DEFAULT 0");
} catch {}
try {
  db.exec("ALTER TABLE schools ADD COLUMN badge TEXT DEFAULT '🏫'");
} catch {}

// Ensure Play Console test account (test2@quizquest.com / password123) is always ready
try {
  const salt = "qq_fixed_salt_99";
  const hash = crypto.scryptSync("password123", salt, 64).toString("hex");
  const passwordHash = `${salt}:${hash}`;
  const existingTestUser = db.prepare("SELECT id FROM users WHERE email = ? OR phone = ?").get("test2@quizquest.com", "test2@quizquest.com");

  if (!existingTestUser) {
    db.prepare(`
      INSERT INTO users (phone, email, password_hash, name, role, grade, home_country, language, xp, streak, best_streak, avatar)
      VALUES (?, ?, ?, ?, 'student', 8, 'nepal', 'en', 350, 5, 5, '{"emoji":"🦊","bg":"#7C3AED"}')
    `).run("test2@quizquest.com", "test2@quizquest.com", passwordHash, "Play Console Reviewer");
    console.log("Seeded Google Play test account: test2@quizquest.com / password123");
  } else {
    db.prepare(`
      UPDATE users SET email = ?, password_hash = ?, grade = COALESCE(grade, 8), home_country = COALESCE(home_country, 'nepal')
      WHERE id = ?
    `).run("test2@quizquest.com", passwordHash, existingTestUser.id);
  }
} catch (err) {
  console.error("Error setting up test account:", err);
}

// Ensure default content admin (admin@quizquest.com / password123) is always ready
try {
  const salt = "qq_fixed_salt_99";
  const hash = crypto.scryptSync("password123", salt, 64).toString("hex");
  const passwordHash = `${salt}:${hash}`;
  const existingAdmin = db.prepare("SELECT id FROM users WHERE email = ? OR phone = ?").get("admin@quizquest.com", "admin@quizquest.com");

  if (!existingAdmin) {
    db.prepare(`
      INSERT INTO users (phone, email, password_hash, name, role, grade, home_country, language, xp, streak, best_streak)
      VALUES (?, ?, ?, ?, 'admin', 10, 'nepal', 'en', 1000, 10, 10)
    `).run("admin@quizquest.com", "admin@quizquest.com", passwordHash, "Super Admin");
    console.log("Seeded default admin: admin@quizquest.com / password123");
  } else {
    db.prepare(`
      UPDATE users SET email = 'admin@quizquest.com', password_hash = ?, role = 'admin'
      WHERE id = ?
    `).run(passwordHash, existingAdmin.id);
  }
} catch (err) {
  console.error("Error setting up admin account:", err);
}

// Seed default memory packs if none exist
const packCount = db.prepare("SELECT COUNT(*) c FROM memory_packs").get().c;
if (packCount === 0) {
  const seedPacks = [
    {
      title_en: "Nepal Heritage & Wonders",
      title_ne: "नेपालका सम्पदा र स्थलहरू",
      subject: "nepal",
      difficulty: 1,
      time_limit_sec: 60,
      pairs: JSON.stringify([
        { id: 1, q: "Highest Peak in the World", a: "Mt. Everest (8,848.86m)", emoji: "🏔️" },
        { id: 2, q: "Capital of Nepal", a: "Kathmandu", emoji: "🏛️" },
        { id: 3, q: "Birthplace of Lord Buddha", a: "Lumbini", emoji: "🌸" },
        { id: 4, q: "Deepest Lake in Nepal", a: "Shey Phoksundo", emoji: "🌊" },
        { id: 5, q: "National Animal of Nepal", a: "Cow (गौ)", emoji: "🐄" },
        { id: 6, q: "City of Lakes", a: "Pokhara", emoji: "⛵" },
      ]),
    },
    {
      title_en: "Science & Cosmos Match",
      title_ne: "विज्ञान र ब्रह्माण्ड",
      subject: "science",
      difficulty: 1,
      time_limit_sec: 60,
      pairs: JSON.stringify([
        { id: 1, q: "Chemical Formula for Water", a: "H₂O", emoji: "💧" },
        { id: 2, q: "The Red Planet", a: "Mars", emoji: "🔴" },
        { id: 3, q: "Speed of Light", a: "300,000 km/s", emoji: "⚡" },
        { id: 4, q: "Plant Food Making Process", a: "Photosynthesis", emoji: "🌿" },
        { id: 5, q: "Force Formula", a: "Mass × Acceleration", emoji: "🚀" },
        { id: 6, q: "Earth's Natural Satellite", a: "The Moon", emoji: "🌙" },
      ]),
    },
    {
      title_en: "World Capitals & Landmarks",
      title_ne: "विश्वका राजधानी र पहिचान",
      subject: "geography",
      difficulty: 2,
      time_limit_sec: 50,
      pairs: JSON.stringify([
        { id: 1, q: "France", a: "Paris (Eiffel Tower)", emoji: "🗼" },
        { id: 2, q: "Japan", a: "Tokyo", emoji: "🗾" },
        { id: 3, q: "United Kingdom", a: "London (Big Ben)", emoji: "💂" },
        { id: 4, q: "Egypt", a: "Cairo (Pyramids)", emoji: "🏜️" },
        { id: 5, q: "Australia", a: "Canberra", emoji: "🦘" },
        { id: 6, q: "India", a: "New Delhi", emoji: "🕌" },
      ]),
    },
  ];

  const insertPack = db.prepare(`
    INSERT INTO memory_packs (title_en, title_ne, subject, difficulty, time_limit_sec, pairs)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const p of seedPacks) {
    insertPack.run(p.title_en, p.title_ne, p.subject, p.difficulty, p.time_limit_sec, p.pairs);
  }
  console.log("Seeded default memory card packs.");
}

export default db;
