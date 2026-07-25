// Expands curated fact tables into tagged MCQ rows.

import { COUNTRIES, INDIA_STATES, US_STATES } from "../data/countries.js";
import { PROVINCES, PEAKS, RIVERS, LAKES, FESTIVALS, NEPAL_FACTS } from "../data/nepal.js";
import { PLANETS, ELEMENTS, UNITS, BODY_FACTS, GENERAL_SCIENCE, INVENTORS, ANIMAL_FACTS } from "../data/science.js";
import { SYNONYMS, ANTONYMS, PLURALS, NEPALI_VOCAB } from "../data/english.js";

const ri = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
const shuffled = (arr) => [...arr].sort(() => Math.random() - 0.5);

/** Pick n distinct distractors from a pool, excluding the correct value. */
function distractors(pool, correct, n = 3) {
  const opts = shuffled(pool.filter((p) => p !== correct && p != null));
  return opts.slice(0, n);
}

function assemble({ textEn, textNe, correctEn, distractorsEn, correctNe, distractorsNe, country, subject, gradeBand, difficulty, topic, source }) {
  const order = shuffled([0, 1, 2, 3]);
  const en = [correctEn, ...distractorsEn];
  const hasNe = textNe && correctNe && distractorsNe && distractorsNe.every((d) => d != null);
  const neArr = hasNe ? [correctNe, ...distractorsNe] : null;
  return {
    textEn,
    textNe: hasNe ? textNe : null,
    optionsEn: order.map((i) => String(en[i])),
    optionsNe: neArr ? order.map((i) => String(neArr[i])) : null,
    correctIndex: order.indexOf(0),
    country,
    subject,
    gradeBand,
    difficulty,
    topic,
    source,
  };
}

export function generateFacts() {
  const out = [];
  const bandsMid = ["4-5", "6-8"];

  // --- World geography: capitals, currencies, continents (per country, 2 grade bands each) ---
  for (const c of COUNTRIES) {
    const sameCont = COUNTRIES.filter((o) => o.cont === c.cont && o.en !== c.en);
    const capPoolEn = (sameCont.length >= 3 ? sameCont : COUNTRIES).map((o) => o.cap);
    const capDistEn = distractors(capPoolEn, c.cap);
    const capDistNe = c.capNe
      ? distractors(COUNTRIES.filter((o) => o.capNe && o.capNe !== c.capNe).map((o) => o.capNe), c.capNe)
      : null;
    out.push(assemble({
      textEn: `What is the capital of ${c.en}?`,
      textNe: c.ne ? `${c.ne}को राजधानी कुन हो?` : null,
      correctEn: c.cap, distractorsEn: capDistEn,
      correctNe: c.capNe, distractorsNe: capDistNe && capDistNe.length === 3 ? capDistNe : null,
      country: "global", subject: "gk", gradeBand: bandsMid[ri(0, 1)], difficulty: ["Asia"].includes(c.cont) ? 2 : 3,
      topic: "capitals", source: "generator:capitals",
    }));
    out.push(assemble({
      textEn: `${c.cap} is the capital of which country?`,
      textNe: c.capNe && c.ne ? `${c.capNe} कुन देशको राजधानी हो?` : null,
      correctEn: c.en, distractorsEn: distractors(COUNTRIES.map((o) => o.en), c.en),
      correctNe: c.ne, distractorsNe: c.ne ? distractors(COUNTRIES.filter((o) => o.ne).map((o) => o.ne), c.ne) : null,
      country: "global", subject: "gk", gradeBand: "6-8", difficulty: 3,
      topic: "capitals", source: "generator:capitals",
    }));
    out.push(assemble({
      textEn: `What is the currency of ${c.en}?`,
      textNe: c.ne && c.curNe ? `${c.ne}को मुद्रा के हो?` : null,
      correctEn: c.cur, distractorsEn: distractors([...new Set(COUNTRIES.map((o) => o.cur))], c.cur),
      correctNe: c.curNe, distractorsNe: c.curNe ? distractors([...new Set(COUNTRIES.filter((o) => o.curNe).map((o) => o.curNe))], c.curNe) : null,
      country: "global", subject: "gk", gradeBand: "9-10", difficulty: 3,
      topic: "currencies", source: "generator:currencies",
    }));
    out.push(assemble({
      textEn: `${c.en} is located in which continent?`,
      textNe: c.ne ? `${c.ne} कुन महादेशमा पर्छ?` : null,
      correctEn: c.cont, distractorsEn: distractors([...new Set(COUNTRIES.map((o) => o.cont))], c.cont),
      correctNe: null, distractorsNe: null,
      country: "global", subject: "gk", gradeBand: "4-5", difficulty: 2,
      topic: "continents", source: "generator:continents",
    }));
  }

  // --- India & USA state capitals ---
  for (const [state, cap] of INDIA_STATES) {
    out.push(assemble({
      textEn: `What is the capital of ${state} (India)?`, textNe: null,
      correctEn: cap, distractorsEn: distractors(INDIA_STATES.map((s) => s[1]), cap),
      country: "india", subject: "gk", gradeBand: "6-8", difficulty: 3, topic: "india-states", source: "generator:india-states",
    }));
  }
  for (const [state, cap] of US_STATES) {
    out.push(assemble({
      textEn: `What is the capital of the US state of ${state}?`, textNe: null,
      correctEn: cap, distractorsEn: distractors(US_STATES.map((s) => s[1]), cap),
      country: "usa", subject: "gk", gradeBand: "9-10", difficulty: 4, topic: "us-states", source: "generator:us-states",
    }));
  }

  // --- Nepal ---
  for (const p of PROVINCES) {
    out.push(assemble({
      textEn: `What is the capital (headquarters) of ${p.en} Province?`,
      textNe: `${p.ne} प्रदेशको राजधानी कुन हो?`,
      correctEn: p.hq, distractorsEn: distractors(PROVINCES.map((o) => o.hq), p.hq),
      correctNe: p.hqNe, distractorsNe: distractors(PROVINCES.map((o) => o.hqNe), p.hqNe),
      country: "nepal", subject: "social", gradeBand: "6-8", difficulty: 3, topic: "provinces", source: "generator:nepal-provinces",
    }));
    out.push(assemble({
      textEn: `${p.hq} is the capital of which province of Nepal?`,
      textNe: `${p.hqNe} नेपालको कुन प्रदेशको राजधानी हो?`,
      correctEn: p.en, distractorsEn: distractors(PROVINCES.map((o) => o.en), p.en),
      correctNe: p.ne, distractorsNe: distractors(PROVINCES.map((o) => o.ne), p.ne),
      country: "nepal", subject: "social", gradeBand: "6-8", difficulty: 3, topic: "provinces", source: "generator:nepal-provinces",
    }));
  }
  for (const pk of PEAKS) {
    out.push(assemble({
      textEn: `How tall is ${pk.en}? (in metres)`,
      textNe: `${pk.ne}को उचाइ कति मिटर छ?`,
      correctEn: `${pk.m} m`, distractorsEn: distractors(PEAKS.map((o) => `${o.m} m`), `${pk.m} m`),
      correctNe: `${pk.m} मि.`, distractorsNe: distractors(PEAKS.map((o) => `${o.m} मि.`), `${pk.m} मि.`),
      country: "nepal", subject: "gk", gradeBand: "9-10", difficulty: 4, topic: "peaks", source: "generator:nepal-peaks",
    }));
  }
  const rankNames = ["highest", "second highest", "third highest", "fourth highest"];
  const rankNe = ["सबैभन्दा अग्लो", "दोस्रो अग्लो", "तेस्रो अग्लो", "चौथो अग्लो"];
  const sortedPeaks = [...PEAKS].sort((a, b) => b.m - a.m);
  for (let i = 0; i < 4; i++) {
    out.push(assemble({
      textEn: `Which is the ${rankNames[i]} mountain in the world?`,
      textNe: `विश्वको ${rankNe[i]} हिमाल कुन हो?`,
      correctEn: sortedPeaks[i].en, distractorsEn: distractors(sortedPeaks.map((o) => o.en), sortedPeaks[i].en),
      correctNe: sortedPeaks[i].ne, distractorsNe: distractors(sortedPeaks.map((o) => o.ne), sortedPeaks[i].ne),
      country: "nepal", subject: "gk", gradeBand: "6-8", difficulty: i === 0 ? 1 : 3, topic: "peaks", source: "generator:nepal-peaks",
    }));
  }
  for (const r of [...RIVERS, ...LAKES]) {
    const pool = [...RIVERS, ...LAKES];
    out.push(assemble({
      textEn: `Which is known as: ${r.note}?`,
      textNe: `${r.noteNe} कुन हो?`,
      correctEn: r.en, distractorsEn: distractors(pool.map((o) => o.en), r.en),
      correctNe: r.ne, distractorsNe: distractors(pool.map((o) => o.ne), r.ne),
      country: "nepal", subject: "social", gradeBand: "4-5", difficulty: 2, topic: "rivers-lakes", source: "generator:nepal-water",
    }));
  }
  for (const f of FESTIVALS) {
    out.push(assemble({
      textEn: `Which festival is ${f.desc}?`,
      textNe: `${f.descNe} चाड कुन हो?`,
      correctEn: f.en, distractorsEn: distractors(FESTIVALS.map((o) => o.en), f.en),
      correctNe: f.ne, distractorsNe: distractors(FESTIVALS.map((o) => o.ne), f.ne),
      country: "nepal", subject: "social", gradeBand: "1-3", difficulty: 1, topic: "festivals", source: "generator:nepal-festivals",
    }));
  }
  for (const [tEn, tNe, corr, dist, corrNe, distNe, topic, diff] of NEPAL_FACTS) {
    out.push(assemble({
      textEn: tEn, textNe: tNe, correctEn: corr, distractorsEn: dist, correctNe: corrNe, distractorsNe: distNe,
      country: "nepal", subject: "social", gradeBand: diff >= 4 ? "9-10" : "6-8", difficulty: diff, topic, source: "curated:nepal",
    }));
  }

  // --- Science ---
  for (const p of PLANETS) {
    const ordinal = ["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth"][p.order - 1];
    const ordNe = ["पहिलो", "दोस्रो", "तेस्रो", "चौथो", "पाँचौं", "छैटौं", "सातौं", "आठौं"][p.order - 1];
    out.push(assemble({
      textEn: `Which is the ${ordinal} planet from the Sun?`,
      textNe: `सूर्यबाट ${ordNe} ग्रह कुन हो?`,
      correctEn: p.en, distractorsEn: distractors(PLANETS.map((o) => o.en), p.en),
      correctNe: p.ne, distractorsNe: distractors(PLANETS.map((o) => o.ne), p.ne),
      country: "global", subject: "science", gradeBand: "4-5", difficulty: 2, topic: "planets", source: "generator:planets",
    }));
  }
  for (const [name, sym] of ELEMENTS) {
    out.push(assemble({
      textEn: `What is the chemical symbol of ${name}?`, textNe: null,
      correctEn: sym, distractorsEn: distractors(ELEMENTS.map((e) => e[1]), sym),
      country: "global", subject: "science", gradeBand: "9-10", difficulty: 3, topic: "elements", source: "generator:elements",
    }));
    out.push(assemble({
      textEn: `Which element has the chemical symbol '${sym}'?`, textNe: null,
      correctEn: name, distractorsEn: distractors(ELEMENTS.map((e) => e[0]), name),
      country: "global", subject: "science", gradeBand: "9-10", difficulty: 3, topic: "elements", source: "generator:elements",
    }));
  }
  for (const [qty, unit, dist] of UNITS) {
    out.push(assemble({
      textEn: `What is the SI unit of ${qty.toLowerCase()}?`, textNe: null,
      correctEn: unit, distractorsEn: dist,
      country: "global", subject: "science", gradeBand: "9-10", difficulty: 3, topic: "si-units", source: "generator:units",
    }));
  }
  for (const [tEn, tNe, corr, dist, corrNe, distNe, diff] of [...BODY_FACTS, ...GENERAL_SCIENCE, ...ANIMAL_FACTS]) {
    out.push(assemble({
      textEn: tEn, textNe: tNe, correctEn: corr, distractorsEn: dist, correctNe: corrNe, distractorsNe: distNe,
      country: "global", subject: "science", gradeBand: diff <= 1 ? "1-3" : diff === 2 ? "4-5" : "6-8", difficulty: diff,
      topic: "science-facts", source: "curated:science",
    }));
  }
  for (const [invention, inventor, dist] of INVENTORS) {
    out.push(assemble({
      textEn: `Who invented / discovered the ${invention.toLowerCase()}?`, textNe: null,
      correctEn: inventor, distractorsEn: dist,
      country: "global", subject: "science", gradeBand: "6-8", difficulty: 3, topic: "inventors", source: "generator:inventors",
    }));
  }

  // --- English ---
  for (const [word, syn] of SYNONYMS) {
    out.push(assemble({
      textEn: `Which word means the same as '${word}'?`, textNe: null,
      correctEn: syn, distractorsEn: distractors(SYNONYMS.map((s) => s[1]), syn),
      country: "nepal", subject: "english", gradeBand: "6-8", difficulty: 3, topic: "synonyms", source: "generator:synonyms",
    }));
  }
  for (const [word, ant] of ANTONYMS) {
    out.push(assemble({
      textEn: `What is the opposite of '${word}'?`, textNe: null,
      correctEn: ant, distractorsEn: distractors(ANTONYMS.map((s) => s[1]), ant),
      country: "nepal", subject: "english", gradeBand: "4-5", difficulty: 2, topic: "antonyms", source: "generator:antonyms",
    }));
  }
  for (const [sing, plur] of PLURALS) {
    out.push(assemble({
      textEn: `What is the plural of '${sing}'?`, textNe: null,
      correctEn: plur, distractorsEn: distractors(PLURALS.map((s) => s[1]), plur).map((d, i) => (d === plur ? `${sing}s` : d)),
      country: "nepal", subject: "english", gradeBand: "4-5", difficulty: 2, topic: "plurals", source: "generator:plurals",
    }));
  }
  for (const [word, meaning, dist] of NEPALI_VOCAB) {
    out.push(assemble({
      textEn: `In Nepali, what does '${word}' mean?`,
      textNe: `'${word}' शब्दको अर्थ के हो?`,
      correctEn: meaning, distractorsEn: dist,
      correctNe: meaning, distractorsNe: dist,
      country: "nepal", subject: "nepali", gradeBand: "1-3", difficulty: 1, topic: "vocabulary", source: "generator:nepali-vocab",
    }));
  }

  return out;
}
