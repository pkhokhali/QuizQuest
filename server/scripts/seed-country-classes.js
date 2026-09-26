// High-speed streaming bulk seeder for country and class-specific questions.
// Seeds authentic curriculum questions for all 8 countries across all 13 class levels.

import db from "../src/db.js";
import { generateCountryQuestions } from "../seed/generators/country_curriculums.js";

const COUNTRIES = ["uk", "nepal", "india", "usa", "japan", "china", "australia", "global"];
const CLASSES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

// Parse command line arguments
const args = process.argv.slice(2);
let perTier = 15000; // default 15,000 per class per country = 1.56M questions
for (const arg of args) {
  if (arg.startsWith("--per-tier=")) {
    perTier = Math.max(10, parseInt(arg.split("=")[1], 10) || 15000);
  }
}

console.log(`=======================================================`);
console.log(`QuizQuest Country & Class High-Capacity Seeder`);
console.log(`Target: ${COUNTRIES.length} Countries × ${CLASSES.length} Classes = ${COUNTRIES.length * CLASSES.length} Combinations`);
console.log(`Questions per combination: ${perTier.toLocaleString()}`);
console.log(`Total Target Volume: ${(COUNTRIES.length * CLASSES.length * perTier).toLocaleString()} questions`);
console.log(`=======================================================\n`);

// Speed pragmas
db.pragma("synchronous = OFF");
db.pragma("cache_size = 100000");

const insertQ = db.prepare(
  `INSERT INTO questions (text_en, text_ne, options_en, options_ne, correct_index, country, subject, grade_band, grade, difficulty, topic, source, status)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved')`
);

const insertChunk = db.transaction((rows) => {
  for (const r of rows) {
    insertQ.run(
      r.textEn,
      r.textNe,
      JSON.stringify(r.optionsEn),
      r.optionsNe ? JSON.stringify(r.optionsNe) : null,
      r.correctIndex,
      r.country,
      r.subject,
      r.gradeBand,
      r.grade,
      r.difficulty,
      r.topic,
      r.source
    );
  }
});

const t0 = Date.now();
let totalInserted = 0;
const CHUNK_SIZE = 5000;

for (const country of COUNTRIES) {
  const countryStart = Date.now();
  let countryTotal = 0;
  console.log(`▶ Seeding ${country.toUpperCase()} (Classes 1-12 + Lifelong)...`);

  for (const grade of CLASSES) {
    const tierName = grade === 13 ? "Lifelong Learner (🧠)" : `Class ${grade}`;
    let remaining = perTier;

    while (remaining > 0) {
      const batchSize = Math.min(remaining, CHUNK_SIZE);
      const rows = generateCountryQuestions(country, grade, batchSize);
      insertChunk(rows);
      totalInserted += rows.length;
      countryTotal += rows.length;
      remaining -= batchSize;
    }

    const tierCount = db.prepare("SELECT count(*) as c FROM questions WHERE country = ? AND grade = ?").get(country, grade).c;
    process.stdout.write(`   ✓ ${tierName.padEnd(24)}: ${tierCount.toLocaleString()} in DB\n`);
  }

  const countrySec = ((Date.now() - countryStart) / 1000).toFixed(1);
  console.log(`   ➔ ${country.toUpperCase()} Complete: ${countryTotal.toLocaleString()} questions in ${countrySec}s\n`);
}

// Restore safe pragmas
db.pragma("synchronous = NORMAL");

const totalSec = ((Date.now() - t0) / 1000).toFixed(1);
const grandTotal = db.prepare("SELECT count(*) as c FROM questions").get().c;

console.log(`=======================================================`);
console.log(`[SUCCESS] Seeding complete in ${totalSec}s!`);
console.log(`Total Questions in Database: ${grandTotal.toLocaleString()}`);
console.log(`=======================================================`);
