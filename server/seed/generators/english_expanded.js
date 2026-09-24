// Expanded English Language, Grammar, Vocabulary & Idioms Generator
import { shuffle } from "../../src/util.js";

function distractors(pool, correct, n = 3) {
  const filtered = pool.filter((p) => p !== correct && p != null && p !== "");
  const shuffled = shuffle([...new Set(filtered)]);
  return shuffled.slice(0, n);
}

function assemble({ textEn, textNe, correctEn, distractorsEn, correctNe, distractorsNe, country = "global", subject = "english", gradeBand, difficulty = 3, topic, source }) {
  const order = shuffle([0, 1, 2, 3]);
  const en = [correctEn, ...distractorsEn];

  return {
    textEn,
    textNe: null,
    optionsEn: order.map((i) => String(en[i])),
    optionsNe: null,
    correctIndex: order.indexOf(0),
    country,
    subject,
    gradeBand,
    difficulty,
    topic,
    source: source || "generator:english_expanded",
  };
}

export function generateEnglishExpanded() {
  const out = [];

  // 1. Idioms and Proverbs with their figurative meanings
  const IDIOMS = [
    { phrase: "Piece of cake", meaning: "Something that is very easy to accomplish" },
    { phrase: "Break a leg", meaning: "A superstitious way to wish someone good luck before a performance" },
    { phrase: "Bite the bullet", meaning: "To face a difficult or unpleasant situation with courage and fortitude" },
    { phrase: "Once in a blue moon", meaning: "An event that happens very rarely" },
    { phrase: "Barking up the wrong tree", meaning: "Pursuing a mistaken line of thought or accusing the wrong person" },
    { phrase: "Burn the midnight oil", meaning: "To work or study late into the night" },
    { phrase: "Spill the beans", meaning: "To reveal a secret prematurely or indiscreetly" },
    { phrase: "Cost an arm and a leg", meaning: "To be extremely expensive" },
    { phrase: "Cry over spilled milk", meaning: "To worry or complain about something that has already happened and cannot be changed" },
    { phrase: "Hit the nail on the head", meaning: "To describe exactly what is causing a situation or problem" },
    { phrase: "Under the weather", meaning: "Feeling slightly unwell or sick" },
    { phrase: "Every cloud has a silver lining", meaning: "Every difficult or unpleasant situation has a positive or hopeful aspect" },
    { phrase: "Actions speak louder than words", meaning: "What people actually do is more significant than what they claim they will do" },
    { phrase: "Don't judge a book by its cover", meaning: "Do not evaluate the true quality or value of something purely by outward appearance" },
    { phrase: "Let the cat out of the bag", meaning: "To accidentally disclose a secret" },
    { phrase: "Through thick and thin", meaning: "Under all conditions, no matter how challenging or difficult" },
    { phrase: "At the drop of a hat", meaning: "Without any hesitation or delay immediately" },
    { phrase: "Ball is in your court", meaning: "It is now your decision or responsibility to take the next step" },
    { phrase: "Blessing in disguise", meaning: "A misfortune that unexpectedly results in positive outcome later" },
    { phrase: "Burn bridges", meaning: "To destroy relationships so that one can never return" },
  ];

  const allMeanings = IDIOMS.map((i) => i.meaning);

  for (const idm of IDIOMS) {
    for (const band of ["6-8", "9-10", "11-12"]) {
      out.push(assemble({
        textEn: `What is the meaning of the English idiom "${idm.phrase}"?`,
        correctEn: idm.meaning,
        distractorsEn: distractors(allMeanings, idm.meaning),
        gradeBand: band,
        difficulty: 3,
        topic: "idioms",
        source: "generator:english:idioms",
      }));
    }
  }

  // 2. Advanced Vocabulary: Words and Precise Definitions
  const VOCABULARY = [
    { word: "Benevolent", definition: "Well-meaning, kindly, and motivated by goodwill" },
    { word: "Ephemeral", definition: "Lasting for a very short, fleeting period of time" },
    { word: "Pragmatic", definition: "Dealing with things sensibly and realistically rather than theoretically" },
    { word: "Resilient", definition: "Able to withstand or recover quickly from difficult conditions" },
    { word: "Eloquent", definition: "Fluent, persuasive, and beautifully expressive in speech or writing" },
    { word: "Ambiguous", definition: "Open to more than one interpretation; unclear or having double meaning" },
    { word: "Meticulous", definition: "Showing great attention to detail; very careful and precise" },
    { word: "Audacious", definition: "Showing a willingness to take surprisingly bold risks" },
    { word: "Candid", definition: "Truthful, straightforward, and frank in expression" },
    { word: "Diligent", definition: "Showing persistent, careful, and conscientious effort in work" },
    { word: "Empathy", definition: "The ability to understand and share the feelings of another" },
    { word: "Frugal", definition: "Prudent and economical in the spending of money or resources" },
    { word: "Gregarious", definition: "Fond of company; sociable and outgoing" },
    { word: "Hypocrisy", definition: "Practicing beliefs or behaviors contrary to what one professes" },
    { word: "Inevitable", definition: "Certain to happen; unavoidable" },
    { word: "Juxtaposition", definition: "Placing two contrasting elements side by side to compare them" },
    { word: "Kinetic", definition: "Relating to or resulting from movement and motion" },
    { word: "Lucid", definition: "Expressed clearly; easy to understand and rational" },
    { word: "Magnanimous", definition: "Generous or forgiving, especially toward a rival or less powerful person" },
    { word: "Nostalgia", definition: "A sentimental longing or affection for the past" },
    { word: "Omnipresent", definition: "Widely or constantly encountered; widespread and present everywhere" },
    { word: "Pernicious", definition: "Having a harmful effect, especially in a gradual or subtle way" },
    { word: "Quintessential", definition: "Representing the most perfect or typical example of a quality" },
    { word: "Rhetoric", definition: "The art of effective or persuasive speaking or writing" },
    { word: "Superfluous", definition: "Unnecessary, especially through being more than enough" },
    { word: "Tenacious", definition: "Tending to keep a firm hold of something; clinging or determined" },
    { word: "Ubiquitous", definition: "Present, appearing, or found everywhere simultaneously" },
    { word: "Venerable", definition: "Accorded a great deal of respect, especially because of age and wisdom" },
    { word: "Zealous", definition: "Having or showing intense passion, enthusiasm, and devotion" },
  ];

  const allDefinitions = VOCABULARY.map((v) => v.definition);

  for (const item of VOCABULARY) {
    for (const band of ["6-8", "9-10", "11-12"]) {
      out.push(assemble({
        textEn: `Which word matches the definition: "${item.definition}"?`,
        correctEn: item.word,
        distractorsEn: distractors(VOCABULARY.map((x) => x.word), item.word),
        gradeBand: band,
        difficulty: band === "6-8" ? 3 : 4,
        topic: "vocabulary",
        source: "generator:english:vocab_words",
      }));

      out.push(assemble({
        textEn: `What is the accurate definition of the word "${item.word}"?`,
        correctEn: item.definition,
        distractorsEn: distractors(allDefinitions, item.definition),
        gradeBand: band,
        difficulty: 4,
        topic: "vocabulary",
        source: "generator:english:vocab_defs",
      }));
    }
  }

  // 3. Grammar: Parts of Speech Recognition
  const GRAMMAR_PARTS = [
    { sentence: "The quick brown fox jumps gracefully over the fence.", word: "gracefully", pos: "Adverb" },
    { sentence: "She placed the heavy brass key upon the wooden table.", word: "upon", pos: "Preposition" },
    { sentence: "Although it was pouring rain, we enjoyed the football match.", word: "Although", pos: "Conjunction" },
    { sentence: "Mount Everest is the highest mountain peak in the world.", word: "highest", pos: "Adjective" },
    { sentence: "They will deliver the package tomorrow morning.", word: "deliver", pos: "Verb" },
    { sentence: "Integrity and courage are essential virtues for any leader.", word: "Integrity", pos: "Noun (Abstract)" },
    { sentence: "Everyone arrived on time except for the guest speaker.", word: "Everyone", pos: "Pronoun" },
    { sentence: "Hurrah! Our team won the championship trophy!", word: "Hurrah!", pos: "Interjection" },
  ];

  const allPos = ["Noun (Abstract)", "Pronoun", "Verb", "Adjective", "Adverb", "Preposition", "Conjunction", "Interjection"];

  for (const g of GRAMMAR_PARTS) {
    for (const band of ["4-5", "6-8", "9-10"]) {
      out.push(assemble({
        textEn: `In the sentence: "${g.sentence}", what part of speech is the word "${g.word}"?`,
        correctEn: g.pos,
        distractorsEn: distractors(allPos, g.pos),
        gradeBand: band,
        difficulty: 2,
        topic: "parts-of-speech",
        source: "generator:english:parts_of_speech",
      }));
    }
  }

  return out;
}
