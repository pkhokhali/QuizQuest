import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

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
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

export default db;
