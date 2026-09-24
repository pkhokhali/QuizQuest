// Comprehensive General Knowledge Generator across 195 countries & global topics
import { COUNTRIES } from "../data/countries.js";
import { INDIA_MONUMENTS, INDIA_RIVERS, INDIA_NATIONAL_SYMBOLS } from "../data/india.js";
import { shuffle } from "../../src/util.js";

const GRADE_BANDS = ["1-3", "4-5", "6-8", "9-10", "11-12"];

function distractors(pool, correct, n = 3) {
  const filtered = pool.filter((p) => p !== correct && p != null && p !== "");
  const shuffled = shuffle([...new Set(filtered)]);
  return shuffled.slice(0, n);
}

function assemble({ textEn, textNe, correctEn, distractorsEn, correctNe, distractorsNe, country, subject = "gk", gradeBand, difficulty = 3, topic, source }) {
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
    source: source || "generator:gk",
  };
}

export function generateGK(scale = 1) {
  const out = [];

  const allCapitals = COUNTRIES.map((c) => c.cap);
  const allCurrencies = [...new Set(COUNTRIES.map((c) => c.cur))];
  const allContinents = [...new Set(COUNTRIES.map((c) => c.cont))];
  const allLanguages = [...new Set(COUNTRIES.map((c) => c.lang).filter(Boolean))];

  // 1. Worldwide Country Capitals (Forward & Reverse) across all 195 countries
  for (const c of COUNTRIES) {
    const sameCont = COUNTRIES.filter((o) => o.cont === c.cont && o.en !== c.en);
    const pool = (sameCont.length >= 4 ? sameCont : COUNTRIES).map((o) => o.cap);
    const capDist = distractors(pool, c.cap);

    // Forward: What is the capital of X?
    for (const band of ["4-5", "6-8", "9-10"]) {
      out.push(assemble({
        textEn: `What is the capital city of ${c.en}?`,
        textNe: c.ne ? `${c.ne}को राजधानी कुन सहर हो?` : null,
        correctEn: c.cap,
        distractorsEn: capDist,
        correctNe: c.capNe,
        distractorsNe: c.capNe ? distractors(COUNTRIES.filter(k => k.capNe).map(k => k.capNe), c.capNe) : null,
        country: c.code || "global",
        gradeBand: band,
        difficulty: c.cont === "Asia" || c.en === "United States" || c.en === "United Kingdom" ? 2 : 3,
        topic: "capitals",
        source: "generator:gk:capitals",
      }));
    }

    // Reverse: [Capital] is the capital of which nation?
    for (const band of ["6-8", "9-10"]) {
      out.push(assemble({
        textEn: `${c.cap} is the capital city of which country?`,
        textNe: c.capNe && c.ne ? `${c.capNe} कुन देशको राजधानी हो?` : null,
        correctEn: c.en,
        distractorsEn: distractors(COUNTRIES.map((o) => o.en), c.en),
        correctNe: c.ne,
        distractorsNe: c.ne ? distractors(COUNTRIES.filter(k => k.ne).map(k => k.ne), c.ne) : null,
        country: c.code || "global",
        gradeBand: band,
        difficulty: 3,
        topic: "capitals",
        source: "generator:gk:capitals_reverse",
      }));
    }

    // Currency of country
    for (const band of ["6-8", "9-10", "11-12"]) {
      out.push(assemble({
        textEn: `What is the official currency of ${c.en}?`,
        textNe: c.ne && c.curNe ? `${c.ne}को आधिकारिक मुद्रा के हो?` : null,
        correctEn: c.cur,
        distractorsEn: distractors(allCurrencies, c.cur),
        correctNe: c.curNe,
        distractorsNe: c.curNe ? distractors(COUNTRIES.filter(k => k.curNe).map(k => k.curNe), c.curNe) : null,
        country: c.code || "global",
        gradeBand: band,
        difficulty: 3,
        topic: "currencies",
        source: "generator:gk:currencies",
      }));
    }

    // Continent of country
    for (const band of ["1-3", "4-5"]) {
      out.push(assemble({
        textEn: `${c.en} is situated on which continent?`,
        textNe: c.ne ? `${c.ne} कुन महादेशमा अवस्थित छ?` : null,
        correctEn: c.cont,
        distractorsEn: distractors(allContinents, c.cont),
        country: c.code || "global",
        gradeBand: band,
        difficulty: 2,
        topic: "continents",
        source: "generator:gk:continents",
      }));
    }

    // Official Language of country
    if (c.lang) {
      for (const band of ["6-8", "9-10"]) {
        out.push(assemble({
          textEn: `What is the primary or official language spoken in ${c.en}?`,
          correctEn: c.lang,
          distractorsEn: distractors(allLanguages, c.lang),
          country: c.code || "global",
          gradeBand: band,
          difficulty: 3,
          topic: "languages",
          source: "generator:gk:languages",
        }));
      }
    }
  }

  // 2. Global Landmarks & UNESCO World Wonders
  const LANDMARKS = [
    { name: "Eiffel Tower", city: "Paris", country: "France", countryCode: "fr" },
    { name: "Colosseum", city: "Rome", country: "Italy", countryCode: "it" },
    { name: "Statue of Liberty", city: "New York", country: "United States", countryCode: "us" },
    { name: "Great Wall of China", city: "Beijing", country: "China", countryCode: "cn" },
    { name: "Machu Picchu", city: "Cusco", country: "Peru", countryCode: "pe" },
    { name: "Pyramids of Giza", city: "Cairo", country: "Egypt", countryCode: "eg" },
    { name: "Christ the Redeemer", city: "Rio de Janeiro", country: "Brazil", countryCode: "br" },
    { name: "Sydney Opera House", city: "Sydney", country: "Australia", countryCode: "au" },
    { name: "Burj Khalifa", city: "Dubai", country: "United Arab Emirates", countryCode: "ae" },
    { name: "Petra", city: "Ma'an", country: "Jordan", countryCode: "jo" },
    { name: "Big Ben and Palace of Westminster", city: "London", country: "United Kingdom", countryCode: "uk" },
    { name: "Mount Fuji", city: "Honshu", country: "Japan", countryCode: "jp" },
    { name: "Acropolis of Athens", city: "Athens", country: "Greece", countryCode: "gr" },
    { name: "Pashupatinath Temple", city: "Kathmandu", country: "Nepal", countryCode: "nepal" },
    { name: "Lumbini (Birthplace of Lord Buddha)", city: "Rupandehi", country: "Nepal", countryCode: "nepal" },
    { name: "Angkor Wat", city: "Siem Reap", country: "Cambodia", countryCode: "kh" },
    { name: "Chichen Itza", city: "Yucatán", country: "Mexico", countryCode: "mx" },
  ];

  for (const lm of LANDMARKS) {
    for (const band of ["4-5", "6-8", "9-10"]) {
      out.push(assemble({
        textEn: `In which country is the famous landmark "${lm.name}" located?`,
        correctEn: lm.country,
        distractorsEn: distractors(COUNTRIES.map((c) => c.en), lm.country),
        country: lm.countryCode,
        gradeBand: band,
        difficulty: 2,
        topic: "landmarks",
        source: "generator:gk:landmarks",
      }));
    }
  }

  // 3. International Organizations & Headquarters
  const ORGANIZATIONS = [
    { name: "United Nations (UN)", hq: "New York City, USA", abbrev: "UN" },
    { name: "World Health Organization (WHO)", hq: "Geneva, Switzerland", abbrev: "WHO" },
    { name: "UNESCO", hq: "Paris, France", abbrev: "UNESCO" },
    { name: "International Court of Justice (ICJ)", hq: "The Hague, Netherlands", abbrev: "ICJ" },
    { name: "International Monetary Fund (IMF)", hq: "Washington, D.C., USA", abbrev: "IMF" },
    { name: "World Bank", hq: "Washington, D.C., USA", abbrev: "World Bank" },
    { name: "South Asian Association for Regional Cooperation (SAARC)", hq: "Kathmandu, Nepal", abbrev: "SAARC" },
    { name: "Association of Southeast Asian Nations (ASEAN)", hq: "Jakarta, Indonesia", abbrev: "ASEAN" },
    { name: "International Olympic Committee (IOC)", hq: "Lausanne, Switzerland", abbrev: "IOC" },
    { name: "Interpol", hq: "Lyon, France", abbrev: "Interpol" },
  ];

  const orgHqPool = ORGANIZATIONS.map((o) => o.hq);
  for (const org of ORGANIZATIONS) {
    for (const band of ["6-8", "9-10", "11-12"]) {
      out.push(assemble({
        textEn: `Where is the headquarters of the ${org.name} located?`,
        correctEn: org.hq,
        distractorsEn: distractors(orgHqPool, org.hq),
        country: org.abbrev === "SAARC" ? "nepal" : "global",
        gradeBand: band,
        difficulty: 3,
        topic: "international-orgs",
        source: "generator:gk:orgs",
      }));
    }
  }

  // 4. India Monuments & Rivers
  for (const m of INDIA_MONUMENTS) {
    for (const band of ["4-5", "6-8", "9-10"]) {
      out.push(assemble({
        textEn: `In which city is the historical monument "${m.name}" located?`,
        correctEn: m.city,
        distractorsEn: distractors(INDIA_MONUMENTS.map((x) => x.city), m.city),
        country: "india",
        gradeBand: band,
        difficulty: 3,
        topic: "india-monuments",
        source: "generator:india:monuments",
      }));
      out.push(assemble({
        textEn: `Who built or commissioned the historic "${m.name}" in ${m.city}?`,
        correctEn: m.builder,
        distractorsEn: distractors(INDIA_MONUMENTS.map((x) => x.builder), m.builder),
        country: "india",
        gradeBand: band,
        difficulty: 4,
        topic: "india-history",
        source: "generator:india:builders",
      }));
    }
  }

  for (const r of INDIA_RIVERS) {
    for (const band of ["6-8", "9-10"]) {
      out.push(assemble({
        textEn: `What is the approximate length of the river ${r.name}?`,
        correctEn: r.length,
        distractorsEn: distractors(INDIA_RIVERS.map((x) => x.length), r.length),
        country: "india",
        gradeBand: band,
        difficulty: 3,
        topic: "india-geography",
        source: "generator:india:rivers",
      }));
    }
  }

  for (const sym of INDIA_NATIONAL_SYMBOLS) {
    for (const band of ["1-3", "4-5", "6-8"]) {
      out.push(assemble({
        textEn: `What is the ${sym.symbol} of India?`,
        correctEn: sym.value,
        distractorsEn: distractors(INDIA_NATIONAL_SYMBOLS.map((x) => x.value), sym.value),
        country: "india",
        gradeBand: band,
        difficulty: 2,
        topic: "india-symbols",
        source: "generator:india:symbols",
      }));
    }
  }

  return out;
}
