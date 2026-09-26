// Infinite on-demand question engine.
// If a user ever exhausts pre-seeded questions for their country or class,
// this engine generates fresh curriculum-accurate questions on the fly and saves them.

import db from "./db.js";
import { generateCountryQuestions } from "../seed/generators/country_curriculums.js";
import { gradeBandFor } from "./util.js";

const insertQ = db.prepare(
  `INSERT INTO questions (text_en, text_ne, options_en, options_ne, correct_index, country, subject, grade_band, grade, difficulty, topic, source, status)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved')`
);

const insertMany = db.transaction((rows) => {
  for (const r of rows) {
    insertQ.run(
      r.textEn,
      r.textNe || null,
      JSON.stringify(r.optionsEn),
      r.optionsNe ? JSON.stringify(r.optionsNe) : null,
      r.correctIndex,
      r.country,
      r.subject,
      r.gradeBand || gradeBandFor(r.grade || 8),
      r.grade || null,
      r.difficulty || 2,
      r.topic || "curriculum",
      r.source || "on-demand-engine"
    );
  }
});

/**
 * Ensure at least `minBuffer` questions exist for a given country and grade.
 * If below threshold, procedurally generates a new batch of questions.
 */
export function ensureQuestionBuffer(country = "global", grade = 8, minBuffer = 20) {
  const normCountry = String(country || "global").toLowerCase();
  const c = db
    .prepare("SELECT count(*) as c FROM questions WHERE status = 'approved' AND country = ? AND grade = ?")
    .get(normCountry, grade);

  if (!c || c.c < minBuffer) {
    const toGen = 100;
    try {
      const generated = generateCountryQuestions(normCountry, grade, toGen);
      if (generated && generated.length) {
        insertMany(generated);
      }
    } catch (err) {
      console.warn(`[questionEngine] Could not generate on-demand batch for ${normCountry}/${grade}:`, err.message);
    }
  }
}
