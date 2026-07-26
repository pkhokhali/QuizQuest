// QuizQuest database seeder.
//   npm run seed                 -> ~100k questions (scale 1)
//   QUESTION_SCALE=5 npm run seed -> ~5x math volume
import db from "../src/db.js";
import { generateMath } from "./generators/math.js";
import { generateFacts } from "./generators/facts.js";
import { CURATED } from "./data/curated.js";
import { GRADE_BANDS, today, daysAgo, shuffle } from "../src/util.js";

const SCALE = Math.max(0.1, Number(process.env.QUESTION_SCALE) || 1);
// Math is universal curriculum content: spread it across countries so every
// bucket of the daily mix (home / extra / global) has volume.
const MATH_COUNTRY_WEIGHTS = [["nepal", 50], ["india", 15], ["usa", 15], ["global", 20]];

function weightedCountry() {
  let r = Math.random() * 100;
  for (const [c, w] of MATH_COUNTRY_WEIGHTS) {
    if ((r -= w) <= 0) return c;
  }
  return "global";
}

console.log(`Seeding QuizQuest (scale ${SCALE})...`);
const t0 = Date.now();

// Wipe (idempotent reseed)
for (const t of ["answer_log", "xp_events", "quizzes", "battles", "user_awards", "friendships", "digests", "questions", "users", "schools", "mix_config"]) {
  db.prepare(`DELETE FROM ${t}`).run();
}
db.prepare("DELETE FROM sqlite_sequence").run();

// ---------- Questions ----------
const insertQ = db.prepare(
  `INSERT INTO questions (text_en, text_ne, options_en, options_ne, correct_index, country, subject, grade_band, difficulty, topic, source, status)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved')`
);

let count = 0;
const insertMany = db.transaction((rows) => {
  for (const r of rows) {
    insertQ.run(
      r.textEn,
      r.textNe || null,
      JSON.stringify(r.optionsEn),
      r.optionsNe ? JSON.stringify(r.optionsNe) : null,
      r.correctIndex,
      r.country || weightedCountry(),
      r.subject,
      r.gradeBand,
      r.difficulty,
      r.topic || "",
      r.source || "generator"
    );
    count++;
  }
});

console.log("Generating math templates...");
const math = generateMath(SCALE * 4); // volume driver
insertMany(math);
console.log(`  math: ${math.length}`);

console.log("Expanding fact tables...");
const facts = generateFacts();
insertMany(facts);
console.log(`  facts: ${facts.length}`);

const curatedRows = CURATED.flatMap(
  ([textEn, textNe, corr, dist, corrNe, distNe, country, subject, bands, difficulty, topic]) =>
    bands.map((band) => {
      const order = shuffle([0, 1, 2, 3]);
      const en = [corr, ...dist];
      const nes = corrNe && distNe ? [corrNe, ...distNe] : null;
      return {
        textEn,
        textNe: nes ? textNe : null,
        optionsEn: order.map((i) => en[i]),
        optionsNe: nes ? order.map((i) => nes[i]) : null,
        correctIndex: order.indexOf(0),
        country,
        subject,
        gradeBand: band,
        difficulty,
        topic,
        source: "curated",
      };
    })
);
insertMany(curatedRows);
console.log(`  curated: ${curatedRows.length}`);

// ---------- Mix config ----------
for (const band of GRADE_BANDS) {
  db.prepare("INSERT INTO mix_config (grade_band, home_pct, extra_pct, global_pct) VALUES (?, 60, 25, 15)").run(band);
}

// ---------- Schools, admin, demo students ----------
const schoolA = db.prepare("INSERT INTO schools (name, join_code) VALUES ('Shree Janakalyan Secondary School', 'SCH-JANAK1')").run().lastInsertRowid;
const schoolB = db.prepare("INSERT INTO schools (name, join_code) VALUES ('Kathmandu Valley Academy', 'SCH-KVA002')").run().lastInsertRowid;

db.prepare("INSERT INTO users (phone, name, role) VALUES ('9800000000', 'Content Admin', 'admin')").run();

const DEMO = [
  ["9811111101", "Aarav", 8, "en", ["india", "usa"], ["math", "science"]],
  ["9811111102", "Sita", 8, "ne", ["india"], ["social", "nepali"]],
  ["9811111103", "Bibek", 8, "en", ["japan", "usa"], ["gk", "science"]],
  ["9811111104", "Anisha", 8, "ne", ["usa"], ["english", "math"]],
  ["9811111105", "Kiran", 8, "en", ["india", "uk"], ["math", "gk"]],
  ["9811111106", "Priya", 8, "ne", ["japan"], ["science", "current"]],
  ["9811111107", "Rohan", 7, "en", ["usa"], ["math"]],
  ["9811111108", "Sneha", 9, "ne", ["india"], ["social"]],
  ["9811111109", "Dipesh", 10, "en", ["uk", "usa"], ["math", "science"]],
  ["9811111110", "Maya", 5, "ne", ["india"], ["gk"]],
  ["9811111111", "Suman", 3, "en", [], ["math"]],
  ["9811111112", "Rita", 11, "ne", ["usa"], ["science"]],
];
const AVATARS = ["🦊", "🐯", "🦉", "🐼", "🦁", "🐨", "🦄", "🐸", "🐙", "🦅", "🐺", "🐢"];
const BGS = ["#7C3AED", "#F97316", "#0EA5E9", "#10B981", "#EC4899", "#F59E0B"];

const insertUser = db.prepare(
  `INSERT INTO users (phone, name, role, grade, language, home_country, extra_countries, subjects, quiz_time, avatar, xp, streak, best_streak, last_quiz_date, school_id)
   VALUES (?, ?, 'student', ?, ?, 'nepal', ?, ?, 'evening', ?, ?, ?, ?, ?, ?)`
);
const insertXp = db.prepare("INSERT INTO xp_events (user_id, amount, reason, date) VALUES (?, ?, ?, ?)");

const demoIds = [];
for (const [i, [phone, name, grade, lang, extras, subjects]] of DEMO.entries()) {
  const xp = 80 + Math.floor(Math.random() * 900);
  const streak = 1 + Math.floor(Math.random() * 12);
  const id = insertUser.run(
    phone, name, grade, lang,
    JSON.stringify(extras), JSON.stringify(subjects),
    JSON.stringify({ emoji: AVATARS[i], bg: BGS[i % BGS.length] }),
    xp, streak, streak + Math.floor(Math.random() * 5),
    today(), i < 8 ? schoolA : schoolB
  ).lastInsertRowid;
  demoIds.push(id);
  // Weekly XP so leaderboards feel alive.
  for (let d = 0; d < 5; d++) {
    if (Math.random() < 0.75) insertXp.run(id, 20 + Math.floor(Math.random() * 80), "daily_quest", daysAgo(d));
  }
}

// Practice opponent for quick battle when no human is in queue.
const botId = insertUser.run(
  "9900000000",
  "Quest Bot",
  8,
  "en",
  JSON.stringify(["india"]),
  JSON.stringify(["math", "gk"]),
  JSON.stringify({ emoji: "🤖", bg: "#6366F1" }),
  500,
  0,
  0,
  daysAgo(3),
  schoolA
).lastInsertRowid;

// Friendships among the grade-8 crew
const pairs = [[0, 1], [0, 2], [1, 3], [2, 4], [3, 5], [0, 4]];
for (const [a, b] of pairs) {
  db.prepare("INSERT OR IGNORE INTO friendships (user_id, friend_id) VALUES (?, ?)").run(demoIds[a], demoIds[b]);
  db.prepare("INSERT OR IGNORE INTO friendships (user_id, friend_id) VALUES (?, ?)").run(demoIds[b], demoIds[a]);
}

// A few past battles for history/analytics
for (let i = 0; i < 8; i++) {
  const a = demoIds[Math.floor(Math.random() * 6)];
  let b = demoIds[Math.floor(Math.random() * 6)];
  if (a === b) b = demoIds[(demoIds.indexOf(a) + 1) % 6];
  const s1 = 200 + Math.floor(Math.random() * 400);
  const s2 = 200 + Math.floor(Math.random() * 400);
  db.prepare("INSERT INTO battles (p1, p2, s1, s2, winner, date) VALUES (?, ?, ?, ?, ?, ?)")
    .run(a, b, s1, s2, s1 === s2 ? null : s1 > s2 ? a : b, daysAgo(Math.floor(Math.random() * 5)));
}

// ---------- Today's digest (published) per grade band ----------
const DIGESTS = {
  "1-3": {
    h: ["Scientists say drinking water helps your brain think faster — have a glass before your quest!", "वैज्ञानिकहरू भन्छन् पानी पिउँदा दिमागले छिटो सोच्छ — क्वेस्ट अघि एक गिलास पानी पिऊ!"],
    g: ["A group of lions is called a 'pride'.", "सिंहहरूको समूहलाई 'प्राइड' भनिन्छ।"],
    n: ["Nepal's flag is the only national flag that is not a rectangle!", "नेपालको झन्डा आयत नभएको विश्वकै एक मात्र राष्ट्रिय झन्डा हो!"],
  },
  "4-5": {
    h: ["Students around the world are planting 'school forests' — one tree can drink 1,000 litres of water a year!", "विश्वभरका विद्यार्थीहरू 'विद्यालय वन' रोप्दैछन् — एउटा रूखले वर्षमा १,००० लिटर पानी पिउन सक्छ!"],
    g: ["Honey never spoils — archaeologists found 3,000-year-old honey that was still good!", "मह कहिल्यै बिग्रँदैन — पुरातत्वविद्हरूले ३,००० वर्ष पुरानो खानयोग्य मह भेट्टाए!"],
    n: ["Rara, Nepal's biggest lake, sits 2,990 m above sea level.", "नेपालको सबैभन्दा ठूलो ताल रारा समुद्र सतहबाट २,९९० मि. माथि छ।"],
  },
  "6-8": {
    h: ["A new exoplanet was spotted this month — telescopes keep finding worlds beyond our solar system.", "यो महिना नयाँ बाह्यग्रह फेला पर्‍यो — दूरबिनहरूले सौर्यमण्डल बाहिरका संसारहरू भेट्टाइरहेका छन्।"],
    g: ["The Pacific Ocean is larger than all of Earth's land put together.", "प्रशान्त महासागर पृथ्वीका सबै जमिन जोड्दा भन्दा ठूलो छ।"],
    n: ["The Kali Gandaki gorge is deeper than the Grand Canyon.", "काली गण्डकी खोंच ग्रान्ड क्यान्यनभन्दा गहिरो छ।"],
  },
  "9-10": {
    h: ["Engineers are testing solar panels that work at night using stored heat — clean energy keeps improving.", "इन्जिनियरहरू सञ्चित तापबाट रातमा पनि चल्ने सोलार प्यानल परीक्षण गर्दैछन् — स्वच्छ ऊर्जा सुध्रँदै छ।"],
    g: ["Your brain uses about 20% of your body's energy while being only 2% of its weight.", "मस्तिष्कले शरीरको तौलको २% मात्र भए पनि २०% ऊर्जा खपत गर्छ।"],
    n: ["Nepal generates most of its electricity from hydropower.", "नेपालले आफ्नो अधिकांश बिजुली जलविद्युतबाट उत्पादन गर्छ।"],
  },
  "11-12": {
    h: ["Universities worldwide are adding AI-literacy courses — knowing how to question machines is the new skill.", "विश्वभरका विश्वविद्यालयहरूले एआई-साक्षरता पाठ्यक्रम थप्दैछन् — मेसिनलाई प्रश्न गर्न जान्नु नयाँ सीप हो।"],
    g: ["Light from the Sun takes about 8 minutes 20 seconds to reach Earth.", "सूर्यको प्रकाश पृथ्वीसम्म आइपुग्न करिब ८ मिनेट २० सेकेन्ड लाग्छ।"],
    n: ["Lumbini is a UNESCO World Heritage Site, listed in 1997.", "लुम्बिनी सन् १९९७ मा सूचीकृत युनेस्को विश्व सम्पदा स्थल हो।"],
  },
};
for (const band of GRADE_BANDS) {
  const d = DIGESTS[band];
  db.prepare(
    `INSERT INTO digests (date, grade_band, headline_en, headline_ne, gk_fact_en, gk_fact_ne, nepal_fact_en, nepal_fact_ne, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'published')`
  ).run(today(), band, d.h[0], d.h[1], d.g[0], d.g[1], d.n[0], d.n[1]);
}
// One draft for tomorrow so the admin approval flow has something to show.
db.prepare(
  `INSERT INTO digests (date, grade_band, headline_en, headline_ne, gk_fact_en, gk_fact_ne, nepal_fact_en, nepal_fact_ne, status)
   VALUES (date('now','+1 day'), '6-8', 'DRAFT: Review before publishing — placeholder for tomorrow''s headline.', '', 'Octopuses have three hearts.', 'अक्टोपसका तीनवटा मुटु हुन्छन्।', 'Tilicho is one of the highest lakes in the world.', 'तिलिचो विश्वकै अग्ला तालहरूमध्ये एक हो।', 'draft')`
).run();

const total = db.prepare("SELECT COUNT(*) c FROM questions").get().c;
console.log(`\nDone in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
console.log(`  questions: ${total}`);
console.log(`  users: ${db.prepare("SELECT COUNT(*) c FROM users").get().c} (admin: 9800000000, OTP 123456)`);
console.log(`  digests: ${db.prepare("SELECT COUNT(*) c FROM digests").get().c}`);
console.log(`Tip: QUESTION_SCALE=${SCALE * 5} npm run seed for a ${SCALE * 5}x math bank.`);
