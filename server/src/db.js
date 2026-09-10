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
try {
  db.exec("ALTER TABLE digests ADD COLUMN pushed_at TEXT");
} catch {}
try {
  db.exec("ALTER TABLE digests ADD COLUMN push_count INTEGER DEFAULT 0");
} catch {}
try {
  db.exec("ALTER TABLE digests ADD COLUMN last_pushed_by TEXT");
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

// Seed memory packs — uses INSERT OR IGNORE so new packs are added on restart
// without clearing existing data. Add a UNIQUE constraint on title_en if not already present.
try {
  db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_memory_packs_title ON memory_packs(title_en)").run();
} catch (_) {}

const insertPackIfNew = db.prepare(`
  INSERT OR IGNORE INTO memory_packs (title_en, title_ne, subject, difficulty, time_limit_sec, pairs)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const allMemoryPacks = [
  // ── NEPAL ───────────────────────────────────────────────────────────────────
  {
    title_en: "Nepal Heritage & Wonders",
    title_ne: "नेपालका सम्पदा र स्थलहरू",
    subject: "nepal",
    difficulty: 1,
    time_limit_sec: 60,
    pairs: [
      { id: 1, q: "Highest Peak in the World", a: "Mt. Everest (8,848.86m)", emoji: "🏔️" },
      { id: 2, q: "Capital of Nepal", a: "Kathmandu", emoji: "🏛️" },
      { id: 3, q: "Birthplace of Lord Buddha", a: "Lumbini", emoji: "🌸" },
      { id: 4, q: "Deepest Lake in Nepal", a: "Shey Phoksundo", emoji: "🌊" },
      { id: 5, q: "National Animal of Nepal", a: "Cow (गाई)", emoji: "🐄" },
      { id: 6, q: "City of Lakes", a: "Pokhara", emoji: "⛵" },
    ],
  },
  {
    title_en: "Nepal History & Kings",
    title_ne: "नेपालको इतिहास र राजा",
    subject: "nepal",
    difficulty: 2,
    time_limit_sec: 60,
    pairs: [
      { id: 1, q: "Unifier of Nepal", a: "Prithvi Narayan Shah", emoji: "👑" },
      { id: 2, q: "Nepal's First Constitution Year", a: "2015 BS (1958 AD)", emoji: "📜" },
      { id: 3, q: "Nepal became Republic", a: "2065 BS (2008 AD)", emoji: "🗳️" },
      { id: 4, q: "Pashupatinath Temple Location", a: "Deopatan, Kathmandu", emoji: "🛕" },
      { id: 5, q: "First Female President of Nepal", a: "Bidhya Devi Bhandari", emoji: "🌟" },
      { id: 6, q: "Year Nepal joined UN", a: "1955 AD", emoji: "🌐" },
    ],
  },
  {
    title_en: "Nepal Nature & Wildlife",
    title_ne: "नेपालको प्रकृति र वन्यजन्तु",
    subject: "nepal",
    difficulty: 1,
    time_limit_sec: 60,
    pairs: [
      { id: 1, q: "National Bird of Nepal", a: "Danphe (Lophophorus)", emoji: "🦚" },
      { id: 2, q: "National Flower of Nepal", a: "Rhododendron (Lali Gurans)", emoji: "🌺" },
      { id: 3, q: "Biggest National Park", a: "Shivapuri Nagarjun", emoji: "🌲" },
      { id: 4, q: "One-horned Rhino Habitat", a: "Chitwan National Park", emoji: "🦏" },
      { id: 5, q: "Snow Leopard lives in", a: "Himalayan alpine zones", emoji: "🐆" },
      { id: 6, q: "Red Panda found in", a: "Himalayan forests", emoji: "🐼" },
    ],
  },

  // ── SCIENCE ─────────────────────────────────────────────────────────────────
  {
    title_en: "Science & Cosmos Match",
    title_ne: "विज्ञान र ब्रह्माण्ड",
    subject: "science",
    difficulty: 1,
    time_limit_sec: 60,
    pairs: [
      { id: 1, q: "Chemical Formula for Water", a: "H₂O", emoji: "💧" },
      { id: 2, q: "The Red Planet", a: "Mars", emoji: "🔴" },
      { id: 3, q: "Speed of Light", a: "300,000 km/s", emoji: "⚡" },
      { id: 4, q: "Plant Food Making Process", a: "Photosynthesis", emoji: "🌿" },
      { id: 5, q: "Force Formula", a: "Mass × Acceleration", emoji: "🚀" },
      { id: 6, q: "Earth's Natural Satellite", a: "The Moon", emoji: "🌙" },
    ],
  },
  {
    title_en: "Human Body Systems",
    title_ne: "मानव शरीरका अंगहरू",
    subject: "science",
    difficulty: 2,
    time_limit_sec: 55,
    pairs: [
      { id: 1, q: "Pumps blood through body", a: "Heart", emoji: "❤️" },
      { id: 2, q: "Controls body like a computer", a: "Brain", emoji: "🧠" },
      { id: 3, q: "Filters blood, makes urine", a: "Kidney", emoji: "🫘" },
      { id: 4, q: "Largest organ of body", a: "Skin", emoji: "🫧" },
      { id: 5, q: "Organ for breathing", a: "Lungs", emoji: "🫁" },
      { id: 6, q: "Digests food chemically", a: "Stomach", emoji: "🍽️" },
    ],
  },
  {
    title_en: "Elements & Chemistry",
    title_ne: "तत्वहरू र रसायन",
    subject: "science",
    difficulty: 3,
    time_limit_sec: 50,
    pairs: [
      { id: 1, q: "Symbol for Gold", a: "Au", emoji: "🥇" },
      { id: 2, q: "Symbol for Iron", a: "Fe", emoji: "⚙️" },
      { id: 3, q: "Symbol for Sodium", a: "Na", emoji: "🧂" },
      { id: 4, q: "Symbol for Oxygen", a: "O", emoji: "💨" },
      { id: 5, q: "Symbol for Carbon", a: "C", emoji: "💎" },
      { id: 6, q: "Symbol for Silver", a: "Ag", emoji: "🥈" },
    ],
  },

  // ── MATHEMATICS ─────────────────────────────────────────────────────────────
  {
    title_en: "Math Formulas & Rules",
    title_ne: "गणितका सूत्रहरू",
    subject: "math",
    difficulty: 2,
    time_limit_sec: 55,
    pairs: [
      { id: 1, q: "Area of a Circle", a: "π × r²", emoji: "⭕" },
      { id: 2, q: "Pythagoras Theorem", a: "a² + b² = c²", emoji: "📐" },
      { id: 3, q: "Volume of a Cube", a: "side³", emoji: "🎲" },
      { id: 4, q: "Perimeter of Rectangle", a: "2(l + b)", emoji: "📏" },
      { id: 5, q: "Value of Pi (π)", a: "3.14159...", emoji: "🥧" },
      { id: 6, q: "Sum of angles in Triangle", a: "180°", emoji: "🔺" },
    ],
  },
  {
    title_en: "Number Powers & Squares",
    title_ne: "संख्याका घातहरू",
    subject: "math",
    difficulty: 2,
    time_limit_sec: 45,
    pairs: [
      { id: 1, q: "Square of 12", a: "144", emoji: "1️⃣" },
      { id: 2, q: "Square of 15", a: "225", emoji: "🔢" },
      { id: 3, q: "2 to the power 10", a: "1,024", emoji: "💻" },
      { id: 4, q: "Cube of 3", a: "27", emoji: "🎲" },
      { id: 5, q: "Square root of 169", a: "13", emoji: "✅" },
      { id: 6, q: "Cube of 4", a: "64", emoji: "🔵" },
    ],
  },

  // ── GEOGRAPHY ───────────────────────────────────────────────────────────────
  {
    title_en: "World Capitals & Landmarks",
    title_ne: "विश्वका राजधानी र पहिचान",
    subject: "geography",
    difficulty: 2,
    time_limit_sec: 50,
    pairs: [
      { id: 1, q: "France", a: "Paris (Eiffel Tower)", emoji: "🗼" },
      { id: 2, q: "Japan", a: "Tokyo", emoji: "🗾" },
      { id: 3, q: "United Kingdom", a: "London (Big Ben)", emoji: "💂" },
      { id: 4, q: "Egypt", a: "Cairo (Pyramids)", emoji: "🏜️" },
      { id: 5, q: "Australia", a: "Canberra", emoji: "🦘" },
      { id: 6, q: "India", a: "New Delhi", emoji: "🕌" },
    ],
  },
  {
    title_en: "Oceans, Rivers & Mountains",
    title_ne: "महासागर, नदी र पर्वत",
    subject: "geography",
    difficulty: 2,
    time_limit_sec: 55,
    pairs: [
      { id: 1, q: "Largest Ocean", a: "Pacific Ocean", emoji: "🌊" },
      { id: 2, q: "Longest River in World", a: "Nile River", emoji: "🐊" },
      { id: 3, q: "Highest Mountain Range", a: "Himalayas", emoji: "🏔️" },
      { id: 4, q: "Largest Desert", a: "Sahara Desert", emoji: "🏜️" },
      { id: 5, q: "Amazon River flows through", a: "Brazil", emoji: "🌿" },
      { id: 6, q: "Deepest Lake on Earth", a: "Lake Baikal", emoji: "🌊" },
    ],
  },
  {
    title_en: "Asian Countries & Capitals",
    title_ne: "एशियाली देश र राजधानी",
    subject: "geography",
    difficulty: 2,
    time_limit_sec: 55,
    pairs: [
      { id: 1, q: "China", a: "Beijing", emoji: "🐉" },
      { id: 2, q: "Pakistan", a: "Islamabad", emoji: "🌙" },
      { id: 3, q: "Bangladesh", a: "Dhaka", emoji: "🟢" },
      { id: 4, q: "Thailand", a: "Bangkok", emoji: "🐘" },
      { id: 5, q: "South Korea", a: "Seoul", emoji: "🇰🇷" },
      { id: 6, q: "Sri Lanka", a: "Sri Jayawardenepura Kotte", emoji: "🌴" },
    ],
  },

  // ── ENGLISH ─────────────────────────────────────────────────────────────────
  {
    title_en: "English: Antonyms Duel",
    title_ne: "अंग्रेजी: विपरीत शब्दहरू",
    subject: "english",
    difficulty: 1,
    time_limit_sec: 50,
    pairs: [
      { id: 1, q: "Hot", a: "Cold", emoji: "🌡️" },
      { id: 2, q: "Brave", a: "Cowardly", emoji: "🦁" },
      { id: 3, q: "Ancient", a: "Modern", emoji: "🏛️" },
      { id: 4, q: "Expand", a: "Shrink", emoji: "📏" },
      { id: 5, q: "Generous", a: "Stingy", emoji: "💰" },
      { id: 6, q: "Victory", a: "Defeat", emoji: "🏆" },
    ],
  },
  {
    title_en: "English: Word Origins",
    title_ne: "शब्दका अर्थहरू",
    subject: "english",
    difficulty: 3,
    time_limit_sec: 60,
    pairs: [
      { id: 1, q: "Philanthropy means", a: "Love of humanity", emoji: "💝" },
      { id: 2, q: "Omnivore means", a: "Eats both plants & meat", emoji: "🍖" },
      { id: 3, q: "Aquatic means", a: "Lives in water", emoji: "🐟" },
      { id: 4, q: "Nocturnal means", a: "Active at night", emoji: "🦉" },
      { id: 5, q: "Terrestrial means", a: "Lives on land", emoji: "🦎" },
      { id: 6, q: "Carnivore means", a: "Meat eater only", emoji: "🦁" },
    ],
  },

  // ── SPORTS ──────────────────────────────────────────────────────────────────
  {
    title_en: "Sports Champions & Records",
    title_ne: "खेलकुद र विश्व कीर्तिमान",
    subject: "sports",
    difficulty: 2,
    time_limit_sec: 55,
    pairs: [
      { id: 1, q: "FIFA World Cup 2022 Winner", a: "Argentina", emoji: "🇦🇷" },
      { id: 2, q: "Most Olympic Gold Medals (individual)", a: "Michael Phelps (23)", emoji: "🏊" },
      { id: 3, q: "Cricket: Highest Run Scorer", a: "Sachin Tendulkar", emoji: "🏏" },
      { id: 4, q: "Fastest 100m Sprint Record", a: "Usain Bolt 9.58s", emoji: "⚡" },
      { id: 5, q: "Tennis: Wimbledon surface", a: "Grass", emoji: "🎾" },
      { id: 6, q: "Chess Piece that moves in L-shape", a: "Knight", emoji: "♞" },
    ],
  },

  // ── TECHNOLOGY ──────────────────────────────────────────────────────────────
  {
    title_en: "Tech & Inventions",
    title_ne: "प्रविधि र आविष्कार",
    subject: "technology",
    difficulty: 2,
    time_limit_sec: 55,
    pairs: [
      { id: 1, q: "Who invented the Telephone?", a: "Alexander Graham Bell", emoji: "📞" },
      { id: 2, q: "Who invented the Lightbulb?", a: "Thomas Edison", emoji: "💡" },
      { id: 3, q: "Who invented World Wide Web?", a: "Tim Berners-Lee", emoji: "🌐" },
      { id: 4, q: "CPU stands for", a: "Central Processing Unit", emoji: "💻" },
      { id: 5, q: "Wi-Fi works on which waves?", a: "Radio Waves", emoji: "📶" },
      { id: 6, q: "First programmable computer", a: "ENIAC (1945)", emoji: "🖥️" },
    ],
  },

  // ── EMOJI / FUN ──────────────────────────────────────────────────────────────
  {
    title_en: "Emoji Decode Challenge 🔥",
    title_ne: "इमोजी बुझ्नुहोस्",
    subject: "fun",
    difficulty: 1,
    time_limit_sec: 45,
    pairs: [
      { id: 1, q: "🍎📚 → ?", a: "Study (Apple for teacher)", emoji: "🏫" },
      { id: 2, q: "🌧️ + ☀️ → ?", a: "Rainbow 🌈", emoji: "🌈" },
      { id: 3, q: "🐛 → 🦋 means?", a: "Metamorphosis", emoji: "🔄" },
      { id: 4, q: "🌙 + ⭐ on a flag → ?", a: "Islamic country symbol", emoji: "🕌" },
      { id: 5, q: "🎵 + 🎤 + 👨 → ?", a: "Singer / Musician", emoji: "🎶" },
      { id: 6, q: "💀 + ☠️ on label → ?", a: "Poison / Danger", emoji: "⚠️" },
    ],
  },

  // ── HEALTH & BODY ────────────────────────────────────────────────────────────
  {
    title_en: "Health & Nutrition Match",
    title_ne: "स्वास्थ्य र पोषण",
    subject: "health",
    difficulty: 1,
    time_limit_sec: 55,
    pairs: [
      { id: 1, q: "Vitamin C found in", a: "Oranges / Lemon", emoji: "🍊" },
      { id: 2, q: "Iron rich food", a: "Spinach & Red meat", emoji: "🥬" },
      { id: 3, q: "Calcium builds strong", a: "Bones & Teeth", emoji: "🦷" },
      { id: 4, q: "Protein found in", a: "Eggs, Meat, Lentils", emoji: "🥚" },
      { id: 5, q: "Diabetes caused by lack of", a: "Insulin", emoji: "💉" },
      { id: 6, q: "Normal human body temp", a: "37°C / 98.6°F", emoji: "🌡️" },
    ],
  },

  // ── ARTS & CULTURE ───────────────────────────────────────────────────────────
  {
    title_en: "Music & Arts Legends",
    title_ne: "संगीत र कलाका महान्",
    subject: "arts",
    difficulty: 2,
    time_limit_sec: 60,
    pairs: [
      { id: 1, q: "Painted the Mona Lisa", a: "Leonardo da Vinci", emoji: "🎨" },
      { id: 2, q: "Beethoven was famous for", a: "Classical Music (deaf)", emoji: "🎵" },
      { id: 3, q: "Shakespeare's most famous play", a: "Hamlet / Romeo & Juliet", emoji: "🎭" },
      { id: 4, q: "Nepalese Classical Music style", a: "Dohori & Bhajan", emoji: "🪗" },
      { id: 5, q: "Raga is from which tradition", a: "Indian Classical Music", emoji: "🎶" },
      { id: 6, q: "Origami is the art of", a: "Paper Folding (Japan)", emoji: "🦢" },
    ],
  },
];

const insertMemPackTx = db.transaction(() => {
  for (const p of allMemoryPacks) {
    insertPackIfNew.run(p.title_en, p.title_ne, p.subject, p.difficulty, p.time_limit_sec, JSON.stringify(p.pairs));
  }
});
insertMemPackTx();
console.log(`Memory packs ensured: ${allMemoryPacks.length} packs (INSERT OR IGNORE).`);

export default db;
