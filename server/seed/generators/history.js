// Comprehensive History and Social Studies Generator
import { WORLD_HISTORY_EVENTS, NEPAL_HISTORY_EVENTS } from "../data/world_history.js";
import { INDIA_FREEDOM_FIGHTERS } from "../data/india.js";
import { shuffle } from "../../src/util.js";

function distractors(pool, correct, n = 3) {
  const filtered = pool.filter((p) => p !== correct && p != null && p !== "");
  const shuffled = shuffle([...new Set(filtered)]);
  return shuffled.slice(0, n);
}

function assemble({ textEn, textNe, correctEn, distractorsEn, correctNe, distractorsNe, country, subject = "history", gradeBand, difficulty = 3, topic, source }) {
  const order = shuffle([0, 1, 2, 3]);
  const en = [correctEn, ...distractorsEn];
  const hasNe = textNe && correctNe && distractorsNe && distractorsNe.every((d) => d != null) && distractorsNe.length === 3;
  const neArr = hasNe ? [correctNe, ...distractorsNe] : null;

  return {
    textEn,
    textNe: hasNe ? textNe : null,
    optionsEn: order.map((i) => String(en[i])),
    optionsNe: neArr ? order.map((i) => String(neArr[i])) : null,
    correctIndex: order.indexOf(0),
    country: country || "global",
    subject,
    gradeBand,
    difficulty,
    topic,
    source: source || "generator:history",
  };
}

export function generateHistory() {
  const out = [];

  const allWorldYears = WORLD_HISTORY_EVENTS.map((e) => e.year);
  const allEras = [...new Set(WORLD_HISTORY_EVENTS.map((e) => e.era))];

  // 1. World History Milestones
  for (const ev of WORLD_HISTORY_EVENTS) {
    for (const band of ["6-8", "9-10", "11-12"]) {
      // Question: In what year did [event] happen?
      out.push(assemble({
        textEn: `In which historical period or year did the event "${ev.event}" take place?`,
        correctEn: ev.year,
        distractorsEn: distractors(allWorldYears, ev.year),
        country: "global",
        gradeBand: band,
        difficulty: 3,
        topic: "world-history",
        source: "generator:history:world_years",
      }));

      // Question: What was the primary historical significance of [event]?
      out.push(assemble({
        textEn: `What is the historical significance of "${ev.event}" (${ev.year})?`,
        correctEn: ev.significance,
        distractorsEn: distractors(WORLD_HISTORY_EVENTS.map((x) => x.significance), ev.significance),
        country: "global",
        gradeBand: band,
        difficulty: 4,
        topic: "world-history",
        source: "generator:history:world_significance",
      }));

      // Question: To which historical era does [event] belong?
      out.push(assemble({
        textEn: `To which historical era or civilization does "${ev.event}" belong?`,
        correctEn: ev.era,
        distractorsEn: distractors(allEras, ev.era),
        country: "global",
        gradeBand: band,
        difficulty: 2,
        topic: "world-history",
        source: "generator:history:eras",
      }));
    }
  }

  // 2. Nepal History & Social Studies
  const allNepalYears = NEPAL_HISTORY_EVENTS.map((e) => e.year);

  for (const nev of NEPAL_HISTORY_EVENTS) {
    for (const band of ["4-5", "6-8", "9-10", "11-12"]) {
      out.push(assemble({
        textEn: `In which year did the historical milestone "${nev.event}" occur in Nepal?`,
        textNe: `नेपालको इतिहासमा "${nev.event}" कहिले भएको थियो?`,
        correctEn: nev.year,
        distractorsEn: distractors(allNepalYears, nev.year),
        correctNe: nev.year,
        distractorsNe: distractors(allNepalYears, nev.year),
        country: "nepal",
        gradeBand: band,
        difficulty: 3,
        topic: "nepal-history",
        source: "generator:history:nepal_events",
      }));

      out.push(assemble({
        textEn: `What was the outcome or significance of "${nev.event}" in Nepal?`,
        correctEn: nev.significance,
        distractorsEn: distractors(NEPAL_HISTORY_EVENTS.map((x) => x.significance), nev.significance),
        country: "nepal",
        gradeBand: band,
        difficulty: 4,
        topic: "nepal-history",
        source: "generator:history:nepal_significance",
      }));
    }
  }

  // 3. Indian Freedom Fighters & History
  for (const ff of INDIA_FREEDOM_FIGHTERS) {
    for (const band of ["4-5", "6-8", "9-10"]) {
      out.push(assemble({
        textEn: `Which Indian freedom fighter was known by the popular title "${ff.title}"?`,
        correctEn: ff.name,
        distractorsEn: distractors(INDIA_FREEDOM_FIGHTERS.map((x) => x.name), ff.name),
        country: "india",
        gradeBand: band,
        difficulty: 2,
        topic: "india-freedom-fighters",
        source: "generator:history:india_fighters",
      }));

      out.push(assemble({
        textEn: `What was the key contribution of ${ff.name} (${ff.title}) during India's independence movement?`,
        correctEn: ff.role,
        distractorsEn: distractors(INDIA_FREEDOM_FIGHTERS.map((x) => x.role), ff.role),
        country: "india",
        gradeBand: band,
        difficulty: 3,
        topic: "india-history",
        source: "generator:history:india_roles",
      }));
    }
  }

  return out;
}
