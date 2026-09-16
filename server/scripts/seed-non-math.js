// server/scripts/seed-non-math.js
// Non-destructive seeder to enrich QuizQuest with high-quality Science, GK, Social Studies,
// Environment, English, and Nepali questions across all grade bands ('1-3', '4-5', '6-8', '9-10', '11-12').

import db from "../src/db.js";
import { shuffle } from "../src/util.js";
import { PLANETS, ELEMENTS, UNITS, BODY_FACTS, GENERAL_SCIENCE, INVENTORS, ANIMAL_FACTS } from "../seed/data/science.js";
import { PROVINCES, PEAKS, RIVERS, LAKES, FESTIVALS, NEPAL_FACTS } from "../seed/data/nepal.js";
import { SYNONYMS, ANTONYMS, PLURALS, NEPALI_VOCAB } from "../seed/data/english.js";

// Ensure index exists for fast lookup
db.exec(`CREATE INDEX IF NOT EXISTS idx_q_text_band ON questions (text_en, grade_band);`);

const insertQ = db.prepare(
  `INSERT INTO questions (text_en, text_ne, options_en, options_ne, correct_index, country, subject, grade_band, difficulty, topic, source, status)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'curated:non-math-enrichment', 'approved')`
);

const checkExisting = db.prepare(
  `SELECT 1 FROM questions WHERE text_en = ? AND grade_band = ? LIMIT 1`
);

function addQuestion({ textEn, textNe, optionsEn, optionsNe, correctIndex = 0, country = "global", subject, gradeBand, difficulty = 2, topic = "" }) {
  if (checkExisting.get(textEn, gradeBand)) return false;

  const indices = shuffle([0, 1, 2, 3]);
  const shuffledEn = indices.map((i) => String(optionsEn[i]));
  const shuffledNe = optionsNe && optionsNe.length === 4 ? indices.map((i) => String(optionsNe[i])) : null;
  const newCorrectIndex = indices.indexOf(correctIndex);

  insertQ.run(
    textEn,
    textNe || null,
    JSON.stringify(shuffledEn),
    shuffledNe ? JSON.stringify(shuffledNe) : null,
    newCorrectIndex,
    country,
    subject,
    gradeBand,
    difficulty,
    topic
  );
  return true;
}

function pickDistractors(pool, exclude, count = 3) {
  const filtered = pool.filter((x) => x !== exclude);
  return shuffle(filtered).slice(0, count);
}

let addedCount = 0;

const runSeeding = db.transaction(() => {
  // =========================================================================
  // 1. NEPALI LANGUAGE - ANTONYMS (उल्टो अर्थ)
  // =========================================================================
  const antonymPairs = [
    ["दिन", "रात", ["बिहान", "साँझ", "घाम"]],
    ["ठूलो", "सानो", ["लामो", "अग्लो", "मोटो"]],
    ["अग्लो", "होचो", ["लामो", "पातलो", "मोटो"]],
    ["तातो", "चिसो", ["न्यानो", "उज्यालो", "रातो"]],
    ["सुख", "दुःख", ["हाँसो", "आनन्द", "शान्ति"]],
    ["सत्य", "असत्य", ["धर्म", "न्याय", "शान्ति"]],
    ["नयाँ", "पुरानो", ["सफा", "सुन्दर", "राम्रो"]],
    ["उज्यालो", "अँध्यारो", ["घाम", "दिउँसो", "बिहान"]],
    ["मित्र", "शत्रु", ["साथी", "दाइ", "छिमेकी"]],
    ["धनी", "गरिब", ["विद्वान", "मालिक", "राजा"]],
    ["सजिलो", "गाह्रो", ["छिटो", "ढिलो", "मीठो"]],
    ["जित", "हार", ["खेल", "इनाम", "विजय"]],
    ["आकाश", "पाताल", ["धर्ती", "पहाड", "बादल"]],
    ["अमृत", "विष", ["दूध", "पानी", "औषधि"]],
    ["ज्ञानी", "मूर्ख", ["चालाक", "विद्वान", "चतुर"]],
    ["उकालो", "ओरालो", ["तेर्सो", "बाटो", "सडक"]],
    ["आयात", "निर्यात", ["व्यापार", "खरिद", "बिक्री"]],
    ["उपकार", "अपकार", ["दान", "सहयोग", "दया"]],
    ["जीवन", "मृत्यु", ["जन्म", "आयु", "सास"]],
    ["स्वाधीन", "पराधीन", ["स्वतन्त्र", "नागरिक", "बन्दी"]],
  ];

  for (const [word, correct, wrong] of antonymPairs) {
    for (const gb of ["1-3", "4-5", "6-8"]) {
      if (addQuestion({
        textEn: `What is the opposite (antonym) of '${word}' in Nepali?`,
        textNe: `'${word}' को विपरितार्थक (उल्टो अर्थ दिने) शब्द कुन हो?`,
        optionsEn: [correct, ...wrong],
        optionsNe: [correct, ...wrong],
        correctIndex: 0,
        country: "nepal",
        subject: "nepali",
        gradeBand: gb,
        difficulty: gb === "1-3" ? 1 : 2,
        topic: "antonyms"
      })) addedCount++;
    }
  }

  // =========================================================================
  // 2. NEPALI LANGUAGE - SYNONYMS (पर्यायवाची शब्द)
  // =========================================================================
  const synonymPairs = [
    ["आँखा", "नयन", ["कान", "नाक", "मुख"]],
    ["सूर्य", "भास्कर", ["चन्द्र", "नभ", "समीर"]],
    ["चन्द्रमा", "शशि", ["सूर्य", "तारा", "बादल"]],
    ["पानी", "जल", ["दूध", "अमृत", "रस"]],
    ["घर", "गृह", ["सडक", "वन", "सहर"]],
    ["हावा", "पवन", ["पानी", "आगो", "बादल"]],
    ["आगो", "अग्नि", ["धुवाँ", "खरानी", "ताप"]],
    ["फूल", "पुष्प", ["पात", "हाँगा", "जरा"]],
    ["रुख", "वृक्ष", ["घाँस", "झाडी", "काठ"]],
    ["आकाश", "गगन", ["धर्ती", "समुद्र", "पहाड"]],
    ["पृथ्वी", "धर्ती", ["आकाश", "सूर्य", "चन्द्र"]],
    ["रात", "रात्रि", ["दिन", "साँझ", "प्रभात"]],
    ["पहाड", "पर्वत", ["मैदान", "तराई", "नदी"]],
    ["नदी", "सरिता", ["ताल", "कुवा", "सागर"]],
    ["राजा", "नृप", ["मन्त्री", "सेना", "प्रजा"]],
  ];

  for (const [word, correct, wrong] of synonymPairs) {
    for (const gb of ["1-3", "4-5", "6-8", "9-10"]) {
      if (addQuestion({
        textEn: `What is the synonym of '${word}' in Nepali?`,
        textNe: `'${word}' को पर्यायवाची शब्द कुन हो?`,
        optionsEn: [correct, ...wrong],
        optionsNe: [correct, ...wrong],
        correctIndex: 0,
        country: "nepal",
        subject: "nepali",
        gradeBand: gb,
        difficulty: gb === "1-3" ? 1 : 2,
        topic: "synonyms"
      })) addedCount++;
    }
  }

  // =========================================================================
  // 3. NEPALI LANGUAGE - GENDER (लिंग परिवर्तन)
  // =========================================================================
  const genderPairs = [
    ["केटा", "केटी", ["बहिनी", "दिदी", "आमा"]],
    ["बाबु", "आमा", ["काकी", "दिदी", "हजुरामा"]],
    ["घोडा", "घोडी", ["गाई", "बाख्री", "गधी"]],
    ["बाख्रा", "बाख्री", ["भेडा", "गाई", "भैंसी"]],
    ["कुकुर", "कुुकुर्नी", ["बिरालो", "बाख्री", "स्याल"]],
    ["बाघ", "बाघिनी", ["सिंही", "गाई", "चितुवा"]],
    ["राजा", "रानी", ["राजकुमारी", "महारानी", "देवी"]],
    ["विद्वान", "विदुषी", ["पण्डिता", "विद्वानी", "महिला"]],
    ["कवि", "कवयित्री", ["लेखिका", "कविनी", "साहित्यकार"]],
    ["नायक", "नायिका", ["अभिनेता", "गायिका", "कलाकार"]],
  ];

  for (const [masc, fem, distractors] of genderPairs) {
    for (const gb of ["1-3", "4-5", "6-8"]) {
      if (addQuestion({
        textEn: `What is the feminine gender form of '${masc}' in Nepali?`,
        textNe: `'${masc}' को स्त्रीलिंगी रूप कुन हो?`,
        optionsEn: [fem, ...distractors],
        optionsNe: [fem, ...distractors],
        correctIndex: 0,
        country: "nepal",
        subject: "nepali",
        gradeBand: gb,
        difficulty: 1,
        topic: "gender"
      })) addedCount++;
    }
  }

  // =========================================================================
  // 4. NEPALI GRAMMAR & PARTS OF SPEECH (नाम, सर्वनाम, विशेषण, क्रियापद)
  // =========================================================================
  const grammarItems = [
    { word: "सगरमाथा", type: "नाम (Noun)", options: ["नाम (Noun)", "सर्वनाम (Pronoun)", "विशेषण (Adjective)", "क्रियापद (Verb)"] },
    { word: "काठमाडौं", type: "नाम (Noun)", options: ["नाम (Noun)", "सर्वनाम (Pronoun)", "विशेषण (Adjective)", "क्रियापद (Verb)"] },
    { word: "ऊ", type: "सर्वनाम (Pronoun)", options: ["सर्वनाम (Pronoun)", "नाम (Noun)", "विशेषण (Adjective)", "क्रियापद (Verb)"] },
    { word: "हामी", type: "सर्वनाम (Pronoun)", options: ["सर्वनाम (Pronoun)", "नाम (Noun)", "विशेषण (Adjective)", "क्रियापद (Verb)"] },
    { word: "रातो", type: "विशेषण (Adjective)", options: ["विशेषण (Adjective)", "नाम (Noun)", "सर्वनाम (Pronoun)", "क्रियापद (Verb)"] },
    { word: "सुन्दर", type: "विशेषण (Adjective)", options: ["विशेषण (Adjective)", "नाम (Noun)", "सर्वनाम (Pronoun)", "क्रियापद (Verb)"] },
    { word: "पढ्छ", type: "क्रियापद (Verb)", options: ["क्रियापद (Verb)", "नाम (Noun)", "सर्वनाम (Pronoun)", "विशेषण (Adjective)"] },
    { word: "दौडनु", type: "क्रियापद (Verb)", options: ["क्रियापद (Verb)", "नाम (Noun)", "सर्वनाम (Pronoun)", "विशेषण (Adjective)"] },
    { word: "बिस्तारै", type: "क्रियायोगी (Adverb)", options: ["क्रियायोगी (Adverb)", "नाम (Noun)", "विशेषण (Adjective)", "सर्वनाम (Pronoun)"] },
    { word: "र", type: "संयोजक (Conjunction)", options: ["संयोजक (Conjunction)", "विस्मयादिबोधक", "नामयोगी", "निपात"] },
  ];

  for (const item of grammarItems) {
    for (const gb of ["4-5", "6-8", "9-10", "11-12"]) {
      if (addQuestion({
        textEn: `In Nepali grammar, which part of speech is '${item.word}'?`,
        textNe: `नेपाली व्याकरण अनुसार '${item.word}' कुन पदवर्ग (शब्दवर्ग) हो?`,
        optionsEn: item.options,
        optionsNe: item.options,
        correctIndex: 0,
        country: "nepal",
        subject: "nepali",
        gradeBand: gb,
        difficulty: 2,
        topic: "grammar"
      })) addedCount++;
    }
  }

  // =========================================================================
  // 5. NEPALI PROVERBS & IDIOMS (उखान टुक्का)
  // =========================================================================
  const proverbs = [
    { text: "नाच्न जान्दैन...", answer: "आँगन टेढो", distractors: ["खुट्टा भाँचियो", "गीत मन पर्दैन", "लुगा पुरानो"] },
    { text: "हुने बिरुवाको...", answer: "चिल्लो पात", distractors: ["हरियो डाँठ", "मीठो फल", "सुन्दर फूल"] },
    { text: "जो होचो...", answer: "उसकै मुखमा घोचो", distractors: ["उसकै जित", "उसकै भाग", "उसकै भर"] },
    { text: "अचानोको पीर...", answer: "खुकुरीले जान्दैन", distractors: ["दाउराले जान्दैन", "आरनले जान्दैन", "मानिसले जान्दैन"] },
    { text: "अगुल्टोले हानेको कुकुर...", answer: "बिजुली चम्किँदा तर्सन्छ", distractors: ["पानी देख्दा भाग्छ", "कराउँदै हिँड्छ", "घरभित्र पस्छ"] },
    { text: "काम गर्ने कालु...", answer: "मंसु खाने भालु", distractors: ["सुत्ने भालु", "हाँस्ने भालु", "हेर्ने भालु"] },
    { text: "ढिलो होस्...", answer: "छिनोस्", distractors: ["नहोस्", "सजिलो होस्", "राम्रो होस्"] },
    { text: "आलु खाएर...", answer: "पेडाको धाक", distractors: ["मीठो स्वाद", "पेट भर्ने", "पैसा माग्ने"] },
  ];

  for (const p of proverbs) {
    for (const gb of ["4-5", "6-8", "9-10"]) {
      if (addQuestion({
        textEn: `Complete the Nepali proverb: '${p.text}'`,
        textNe: `नेपाली उखान पूरा गर्नुहोस्: '${p.text}'`,
        optionsEn: [p.answer, ...p.distractors],
        optionsNe: [p.answer, ...p.distractors],
        correctIndex: 0,
        country: "nepal",
        subject: "nepali",
        gradeBand: gb,
        difficulty: 2,
        topic: "proverbs"
      })) addedCount++;
    }
  }

  // =========================================================================
  // 6. ENGLISH VOCABULARY (Synonyms, Antonyms, Plurals) across 1-3, 4-5, 6-8, 9-10
  // =========================================================================
  const synWords = SYNONYMS.map((s) => s[0]);
  for (const [word, syn] of SYNONYMS) {
    const wrong = pickDistractors(synWords, word, 3);
    for (const gb of ["4-5", "6-8", "9-10"]) {
      if (addQuestion({
        textEn: `Which word is a synonym of '${word}'?`,
        textNe: `'${word}' को समानार्थी (समान अर्थ दिने) अंग्रेजी शब्द कुन हो?`,
        optionsEn: [syn, ...wrong],
        optionsNe: [syn, ...wrong],
        correctIndex: 0,
        country: "global",
        subject: "english",
        gradeBand: gb,
        difficulty: gb === "4-5" ? 2 : 3,
        topic: "synonyms"
      })) addedCount++;
    }
  }

  const antWords = ANTONYMS.map((a) => a[1]);
  for (const [word, ant] of ANTONYMS) {
    const wrong = pickDistractors(antWords, ant, 3);
    for (const gb of ["1-3", "4-5", "6-8"]) {
      if (addQuestion({
        textEn: `What is the opposite (antonym) of '${word}'?`,
        textNe: `'${word}' को विपरितार्थक (Opposite) अंग्रेजी शब्द कुन हो?`,
        optionsEn: [ant, ...wrong],
        optionsNe: [ant, ...wrong],
        correctIndex: 0,
        country: "global",
        subject: "english",
        gradeBand: gb,
        difficulty: gb === "1-3" ? 1 : 2,
        topic: "antonyms"
      })) addedCount++;
    }
  }

  const pluralWords = PLURALS.map((p) => p[1]);
  for (const [sing, pl] of PLURALS) {
    const wrong = pickDistractors(pluralWords, pl, 3);
    for (const gb of ["1-3", "4-5", "6-8"]) {
      if (addQuestion({
        textEn: `What is the correct plural form of '${sing}'?`,
        textNe: `'${sing}' को सही बहुवचन (Plural) रूप कुन हो?`,
        optionsEn: [pl, ...wrong],
        optionsNe: [pl, ...wrong],
        correctIndex: 0,
        country: "global",
        subject: "english",
        gradeBand: gb,
        difficulty: 2,
        topic: "grammar"
      })) addedCount++;
    }
  }

  // =========================================================================
  // 7. SCIENCE - ELEMENTS, PLANETS, UNITS, BODY, GENERAL across all bands
  // =========================================================================
  for (const p of PLANETS) {
    const planetEn = PLANETS.filter((o) => o.en !== p.en).map((o) => o.en);
    const planetNe = PLANETS.filter((o) => o.ne !== p.ne).map((o) => o.ne);
    for (const gb of ["1-3", "4-5", "6-8"]) {
      if (addQuestion({
        textEn: `Which planet is position ${p.order} from the Sun in our Solar System?`,
        textNe: `सूर्यबाट ${p.order} औं स्थानमा रहेको सौर्यमण्डलको ग्रह कुन हो?`,
        optionsEn: [p.en, ...planetEn.slice(0, 3)],
        optionsNe: [p.ne, ...planetNe.slice(0, 3)],
        correctIndex: 0,
        country: "global",
        subject: "science",
        gradeBand: gb,
        difficulty: gb === "1-3" ? 1 : 2,
        topic: "solar-system"
      })) addedCount++;
    }
  }

  for (const [elem, sym, num] of ELEMENTS) {
    const otherSyms = ELEMENTS.filter((e) => e[1] !== sym).map((e) => e[1]);
    for (const gb of ["6-8", "9-10", "11-12"]) {
      if (addQuestion({
        textEn: `What is the chemical symbol for ${elem}?`,
        textNe: `${elem} को रासायनिक संकेत (Chemical Symbol) के हो?`,
        optionsEn: [sym, ...otherSyms.slice(0, 3)],
        optionsNe: [sym, ...otherSyms.slice(0, 3)],
        correctIndex: 0,
        country: "global",
        subject: "science",
        gradeBand: gb,
        difficulty: 2,
        topic: "chemistry"
      })) addedCount++;
    }
  }

  for (const [qty, unit, distractors] of UNITS) {
    for (const gb of ["6-8", "9-10", "11-12"]) {
      if (addQuestion({
        textEn: `What is the SI unit of ${qty}?`,
        textNe: `${qty} को एसआई (SI) एकाइ कुन हो?`,
        optionsEn: [unit, ...distractors.slice(0, 3)],
        optionsNe: [unit, ...distractors.slice(0, 3)],
        correctIndex: 0,
        country: "global",
        subject: "science",
        gradeBand: gb,
        difficulty: 2,
        topic: "physics"
      })) addedCount++;
    }
  }

  for (const [qEn, qNe, correct, distractors, correctNe, distractorsNe, diff] of ANIMAL_FACTS) {
    for (const gb of ["1-3", "4-5", "6-8"]) {
      if (addQuestion({
        textEn: qEn,
        textNe: qNe,
        optionsEn: [correct, ...distractors],
        optionsNe: correctNe && distractorsNe ? [correctNe, ...distractorsNe] : null,
        correctIndex: 0,
        country: "global",
        subject: "science",
        gradeBand: gb,
        difficulty: diff || 1,
        topic: "zoology"
      })) addedCount++;
    }
  }

  // =========================================================================
  // 8. SOCIAL STUDIES - PROVINCES OF NEPAL
  // =========================================================================
  for (const prov of PROVINCES) {
    const otherCapEn = PROVINCES.filter((o) => o.hq !== prov.hq).map((o) => o.hq);
    const otherCapNe = PROVINCES.filter((o) => o.hqNe !== prov.hqNe).map((o) => o.hqNe);
    for (const gb of ["4-5", "6-8", "9-10", "11-12"]) {
      if (addQuestion({
        textEn: `What is the provincial capital (headquarter) of ${prov.en} Province?`,
        textNe: `${prov.ne} प्रदेशको प्रदेश राजधानी कुन सहर हो?`,
        optionsEn: [prov.hq, ...otherCapEn.slice(0, 3)],
        optionsNe: [prov.hqNe, ...otherCapNe.slice(0, 3)],
        correctIndex: 0,
        country: "nepal",
        subject: "social",
        gradeBand: gb,
        difficulty: 2,
        topic: "provinces"
      })) addedCount++;
    }
  }
});

runSeeding();

console.log(`Successfully added ${addedCount} non-math questions into QuizQuest!`);
