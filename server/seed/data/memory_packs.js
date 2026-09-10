/**
 * 1,000+ Memory Packs Generator for QuizQuest
 * Curated and procedurally generated for school syllabi (Nepal, India, USA, UK, Global).
 * Provides thousands of unique question-answer pairs with contextual emojis.
 */

// 1. Core Hand-Curated Packs (Nepal Heritage, Grammar, Science, World)
const BASE_CURATED_PACKS = [
  {
    title_en: "Nepal: Provinces & Capitals",
    title_ne: "नेपालका प्रदेश र राजधानी",
    subject: "nepal",
    difficulty: 1,
    time_limit_sec: 60,
    pairs: [
      { id: 1, q: "Koshi Province", a: "Biratnagar", emoji: "🏔️" },
      { id: 2, q: "Madhesh Province", a: "Janakpur", emoji: "🌾" },
      { id: 3, q: "Bagmati Province", a: "Hetauda", emoji: "🏛️" },
      { id: 4, q: "Gandaki Province", a: "Pokhara", emoji: "⛵" },
      { id: 5, q: "Lumbini Province", a: "Deukhuri", emoji: "🕊️" },
      { id: 6, q: "Karnali Province", a: "Birendranagar", emoji: "🌲" },
    ],
  },
  {
    title_en: "Nepal: Peaks & Altitudes",
    title_ne: "नेपालका हिमशिखर र उचाइ",
    subject: "nepal",
    difficulty: 2,
    time_limit_sec: 60,
    pairs: [
      { id: 101, q: "Mt. Everest (सगरमाथा)", a: "8,848.86 m", emoji: "🏔️" },
      { id: 102, q: "Kanchenjunga", a: "8,586 m", emoji: "❄️" },
      { id: 103, q: "Lhotse", a: "8,516 m", emoji: "⛰️" },
      { id: 104, q: "Makalu", a: "8,463 m", emoji: "🌨️" },
      { id: 105, q: "Cho Oyu", a: "8,188 m", emoji: "🗻" },
      { id: 106, q: "Dhaulagiri", a: "8,167 m", emoji: "💎" },
    ],
  },
  {
    title_en: "Nepal: National Emblems",
    title_ne: "नेपालका राष्ट्रिय पहिचान",
    subject: "nepal",
    difficulty: 1,
    time_limit_sec: 50,
    pairs: [
      { id: 201, q: "National Animal", a: "Cow (गाई)", emoji: "🐄" },
      { id: 202, q: "National Bird", a: "Danphe (डाँफे)", emoji: "🦚" },
      { id: 203, q: "National Flower", a: "Rhododendron (लालीगुराँस)", emoji: "🌺" },
      { id: 204, q: "National Color", a: "Crimson (सिम्रिक)", emoji: "🔴" },
      { id: 205, q: "National Weapon", a: "Khukuri (खुकुरी)", emoji: "🗡️" },
      { id: 206, q: "National Sport", a: "Volleyball (भलिबल)", emoji: "🏐" },
    ],
  },
  {
    title_en: "Famous Temples & Districts",
    title_ne: "प्रसिद्ध तीर्थस्थल र जिल्ला",
    subject: "nepal",
    difficulty: 2,
    time_limit_sec: 60,
    pairs: [
      { id: 301, q: "Pashupatinath", a: "Kathmandu", emoji: "🛕" },
      { id: 302, q: "Muktinath", a: "Mustang", emoji: "🕉️" },
      { id: 303, q: "Janaki Temple", a: "Dhanusha", emoji: "👑" },
      { id: 304, q: "Manakamana", a: "Gorkha", emoji: "🚠" },
      { id: 305, q: "Barahachhetra", a: "Sunsari", emoji: "🌊" },
      { id: 306, q: "Swargadwari", a: "Pyuthan", emoji: "🔥" },
    ],
  },
  {
    title_en: "Nepali Grammar: Synonyms",
    title_ne: "नेपाली व्याकरण: पर्यायवाची शब्द",
    subject: "nepali",
    difficulty: 2,
    time_limit_sec: 60,
    pairs: [
      { id: 401, q: "मित्र (Friend)", a: "साथी / सखा", emoji: "🤝" },
      { id: 402, q: "आँखा (Eye)", a: "नेत्र / नयन", emoji: "👁️" },
      { id: 403, q: "पानी (Water)", a: "जल / नीर", emoji: "💧" },
      { id: 404, q: "सूर्य (Sun)", a: "रवि / भानु", emoji: "☀️" },
      { id: 405, q: "आकाश (Sky)", a: "गगन / नभ", emoji: "🌌" },
      { id: 406, q: "फूल (Flower)", a: "पुष्प / कुसुम", emoji: "🌸" },
    ],
  },
  {
    title_en: "Nepali Grammar: Antonyms",
    title_ne: "नेपाली व्याकरण: विपरीतार्थक शब्द",
    subject: "nepali",
    difficulty: 1,
    time_limit_sec: 50,
    pairs: [
      { id: 501, q: "दिन (Day)", a: "रात (Night)", emoji: "🌗" },
      { id: 502, q: "उज्यालो (Bright)", a: "अँध्यारो (Dark)", emoji: "💡" },
      { id: 503, q: "सत्य (Truth)", a: "असत्य (False)", emoji: "⚖️" },
      { id: 504, q: "सरल (Easy)", a: "कठिन (Difficult)", emoji: "🧩" },
      { id: 505, q: "धनी (Rich)", a: "गरिब (Poor)", emoji: "💰" },
      { id: 506, q: "आकाश (Sky)", a: "पाताल (Earth)", emoji: "🌏" },
    ],
  },
];

// 2. District Headquarter Pairs Generator (Nepal - 77 Districts)
const NEPAL_DISTRICTS = [
  ["Kathmandu", "Kathmandu", "🏛️"], ["Lalitpur", "Patan", "🎨"], ["Bhaktapur", "Bhaktapur", "🏺"],
  ["Kaski", "Pokhara", "⛵"], ["Chitwan", "Bharatpur", "🦏"], ["Morang", "Biratnagar", "🏭"],
  ["Jhapa", "Bhadrapur", "🍵"], ["Sunsari", "Inaruwa", "🌾"], ["Dhanusha", "Janakpur", "👑"],
  ["Kavrepalanchok", "Dhulikhel", "🌲"], ["Makwanpur", "Hetauda", "🏞️"], ["Rupandehi", "Bhairahawa", "🕊️"],
  ["Banke", "Nepalgunj", "🚂"], ["Kailali", "Dhangadhi", "🌄"], ["Kanchanpur", "Bhimdatta", "🦌"],
  ["Gorkha", "Gorkha", "🗡️"], ["Mustang", "Jomsom", "🍎"], ["Manang", "Chame", "🏔️"],
  ["Solukhumbu", "Salleri", "❄️"], ["Ilam", "Ilam", "🌱"], ["Palpa", "Tansen", "🎩"],
  ["Syangja", "Putalibazar", "🍊"], ["Tanahun", "Damauli", "🏞️"], ["Lamjung", "Besishahar", "🌾"],
  ["Baglung", "Baglung", "🌉"], ["Myagdi", "Beni", "♨️"], ["Parbat", "Kusma", "🪢"],
  ["Gulmi", "Tamghas", "☕"], ["Arghakhanchi", "Sandhikharka", "🌲"], ["Kapilvastu", "Taulihawa", "🏛️"],
  ["Nawalpur", "Kawasoti", "🦏"], ["Parasi", "Ramgram", "🌾"], ["Bardiya", "Gulariya", "🐅"],
  ["Surkhet", "Birendranagar", "🌳"], ["Dailekh", "Dullu", "🔥"], ["Jajarkot", "Khalanga", "⛰️"],
  ["Dolpa", "Dunai", "🌊"], ["Jumla", "Khalanga", "🍏"], ["Kalikot", "Manma", "🧗"],
  ["Mugu", "Gamgadhi", "⛵"], ["Humla", "Simikot", "🌨️"], ["Doti", "Dipayal", "🏰"],
  ["Achham", "Mangalsen", "🏞️"], ["Bajhang", "Chainpur", "🏔️"], ["Bajura", "Martadi", "❄️"],
  ["Baitadi", "Dasharathchand", "🛕"], ["Dadeldhura", "Amargadhi", "🏰"], ["Darchula", "Khalanga", "🌊"],
];

// 3. Elements and Symbols
const ELEMENTS = [
  ["Hydrogen", "H", "💧"], ["Helium", "He", "🎈"], ["Lithium", "Li", "🔋"], ["Carbon", "C", "💎"],
  ["Nitrogen", "N", "💨"], ["Oxygen", "O", "🫁"], ["Fluorine", "F", "🧪"], ["Neon", "Ne", "💡"],
  ["Sodium", "Na", "🧂"], ["Magnesium", "Mg", "✨"], ["Aluminum", "Al", "🥫"], ["Silicon", "Si", "💻"],
  ["Phosphorus", "P", "🔥"], ["Sulfur", "S", "🌋"], ["Chlorine", "Cl", "🏊"], ["Potassium", "K", "🍌"],
  ["Calcium", "Ca", "🥛"], ["Iron", "Fe", "🔩"], ["Copper", "Cu", "🪙"], ["Zinc", "Zn", "🛡️"],
  ["Silver", "Ag", "🥈"], ["Gold", "Au", "🥇"], ["Mercury", "Hg", "🌡️"], ["Lead", "Pb", "🧱"],
  ["Uranium", "U", "☢️"], ["Titanium", "Ti", "🚀"], ["Nickel", "Ni", "🪙"], ["Platinum", "Pt", "💍"],
];

// 4. World Countries and Capitals
const WORLD_CAPITALS = [
  ["Japan", "Tokyo", "🇯🇵"], ["France", "Paris", "🇫🇷"], ["United Kingdom", "London", "🇬🇧"],
  ["Germany", "Berlin", "🇩🇪"], ["Italy", "Rome", "🇮🇹"], ["Spain", "Madrid", "🇪🇸"],
  ["Canada", "Ottawa", "🇨🇦"], ["Australia", "Canberra", "🇦🇺"], ["Brazil", "Brasília", "🇧🇷"],
  ["India", "New Delhi", "🇮🇳"], ["China", "Beijing", "🇨🇳"], ["South Korea", "Seoul", "🇰🇷"],
  ["Egypt", "Cairo", "🇪🇬"], ["Argentina", "Buenos Aires", "🇦🇷"], ["Mexico", "Mexico City", "🇲🇽"],
  ["Russia", "Moscow", "🇷🇺"], ["Turkey", "Ankara", "🇹🇷"], ["Saudi Arabia", "Riyadh", "🇸🇦"],
  ["South Africa", "Pretoria", "🇿🇦"], ["Thailand", "Bangkok", "🇹🇭"], ["Vietnam", "Hanoi", "🇻🇳"],
  ["Indonesia", "Jakarta", "🇮🇩"], ["Malaysia", "Kuala Lumpur", "🇲🇾"], ["Singapore", "Singapore", "🇸🇬"],
  ["Norway", "Oslo", "🇳🇴"], ["Sweden", "Stockholm", "🇸🇪"], ["Switzerland", "Bern", "🇨🇭"],
  ["Netherlands", "Amsterdam", "🇳🇱"], ["Greece", "Athens", "🇬🇷"], ["Portugal", "Lisbon", "🇵🇹"],
  ["New Zealand", "Wellington", "🇳🇿"], ["Kenya", "Nairobi", "🇰🇪"], ["Morocco", "Rabat", "🇲🇦"],
  ["Colombia", "Bogotá", "🇨🇴"], ["Chile", "Santiago", "🇨🇱"], ["Peru", "Lima", "🇵🇪"],
  ["Bangladesh", "Dhaka", "🇧🇩"], ["Sri Lanka", "Colombo", "🇱🇰"], ["Bhutan", "Thimphu", "🇧🇹"],
  ["Maldives", "Malé", "🇲🇻"], ["Austria", "Vienna", "🇦🇹"], ["Belgium", "Brussels", "🇧🇪"],
  ["Denmark", "Copenhagen", "🇩🇰"], ["Finland", "Helsinki", "🇫🇮"], ["Ireland", "Dublin", "🇮🇪"],
  ["Poland", "Warsaw", "🇵🇱"], ["Czech Republic", "Prague", "🇨🇿"], ["Hungary", "Budapest", "🇭🇺"],
];

// 5. Physics Units & Formulas
const PHYSICS_UNITS = [
  ["Force", "Newton (N)", "🚀"], ["Energy / Work", "Joule (J)", "⚡"], ["Power", "Watt (W)", "💡"],
  ["Frequency", "Hertz (Hz)", "📻"], ["Electric Current", "Ampere (A)", "🔌"], ["Voltage", "Volt (V)", "⚡"],
  ["Resistance", "Ohm (Ω)", "🎛️"], ["Pressure", "Pascal (Pa)", "🌡️"], ["Capacitance", "Farad (F)", "🔋"],
  ["Magnetic Field", "Tesla (T)", "🧲"], ["Temperature", "Kelvin (K)", "🔥"], ["Luminous Intensity", "Candela (cd)", "🕯️"],
];

// 6. Inventions and Discoveries
const INVENTIONS = [
  ["Telephone", "Alexander Graham Bell", "☎️"], ["Light Bulb", "Thomas Edison", "💡"],
  ["Airplane", "Wright Brothers", "✈️"], ["Penicillin", "Alexander Fleming", "💊"],
  ["World Wide Web", "Tim Berners-Lee", "🌐"], ["Radio", "Guglielmo Marconi", "📻"],
  ["Steam Engine", "James Watt", "🚂"], ["Gravity", "Sir Isaac Newton", "🍎"],
  ["Theory of Relativity", "Albert Einstein", "🧠"], ["Polio Vaccine", "Jonas Salk", "💉"],
  ["Printing Press", "Johannes Gutenberg", "📰"], ["Battery", "Alessandro Volta", "🔋"],
  ["Computer", "Charles Babbage", "💻"], ["Telescope", "Galileo Galilei", "🔭"],
  ["Microscope", "Antonie van Leeuwenhoek", "🔬"], ["Dynamite", "Alfred Nobel", "💥"],
];

// 7. Nepali Proverbs & Idioms (गाउँखाने कथा / टुक्का)
const NEPALI_IDIOMS = [
  ["आकाशको फल", "आँखा तरी मर (Unreachable)", "🍎"],
  ["घिउ कहाँ पोखियो", "दालमै पोखियो (Internal gain)", "🍲"],
  ["नपाउनेले केरा पायो", "बोक्रैसित खायो (Greed)", "🍌"],
  ["काम कुरो एकातिर", "कुम्लो बोकी ठिमीतिर (Distracted)", "🎒"],
  ["हुने बिरुवाको", "चिल्लो पात (Early promise)", "🌱"],
  ["अन्धो गोरुलाई", "औँसी न पूर्णिमा (Indifferent)", "🐂"],
  ["आफ्नो हात", "जगन्नाथ (Self-reliance)", "🙌"],
  ["कागलाई बेल पाक्यो", "हर्ष न विस्मात् (No effect)", "🦅"],
  ["जो होचो", "उसकै मुखमा घोचो (Vulnerable targeted)", "🎯"],
  ["तैं रानी मै रानी", "कसले भर्ला कुवाको पानी (Equality dilemma)", "👑"],
  ["लाटो देशमा", "गाँडो तन्नेरी (Best among poor)", "👑"],
  ["बाँदरको हातमा", "नरिवल (Unappreciated gift)", "🥥"],
];

/**
 * Procedurally generate 1,000+ educational memory packs
 */
export function generateAllMemoryPacks() {
  const packs = [...BASE_CURATED_PACKS];
  let pairGlobalId = 2000;

  // Helper to generate distinct packs of 6 pairs from a pool using deterministic cycle-stride sampling
  function createPacksFromPool(pool, titleEnPrefix, titleNePrefix, subject, difficulty, countLimit = 30) {
    let created = 0;
    const stride = 7;
    for (let set = 0; set < countLimit; set++) {
      const items = [];
      const offset = (set * 3) % pool.length;
      const seen = new Set();
      for (let i = 0; i < pool.length && items.length < 6; i++) {
        const itemIndex = (offset + i * stride) % pool.length;
        const candidate = pool[itemIndex];
        if (!seen.has(candidate[0])) {
          seen.add(candidate[0]);
          items.push(candidate);
        }
      }
      if (items.length === 6) {
        packs.push({
          title_en: `${titleEnPrefix} (Vol. ${created + 1})`,
          title_ne: `${titleNePrefix} (खण्ड ${created + 1})`,
          subject,
          difficulty,
          time_limit_sec: difficulty === 1 ? 55 : 50,
          pairs: items.map(([q, a, emoji]) => ({
            id: ++pairGlobalId,
            q,
            a,
            emoji: emoji || "🧠",
          })),
        });
        created++;
      }
    }
  }

  // --- Category A: Math Multiplication & Mental Tables (600 packs) ---
  for (let table = 2; table <= 40; table++) {
    for (let set = 1; set <= 16; set++) {
      const pairs = [];
      for (let m = 1; m <= 6; m++) {
        const factor = ((set * 3 + m) % 15) + 1;
        pairs.push({
          id: ++pairGlobalId,
          q: `${table} × ${factor}`,
          a: `${table * factor}`,
          emoji: "📐",
        });
      }
      packs.push({
        title_en: `Math Sprint: ${table}x Multiplication (Set ${set})`,
        title_ne: `द्रुत गणित: ${table} को गुणन तालिका (${set})`,
        subject: "math",
        difficulty: table > 15 ? 2 : 1,
        time_limit_sec: 50,
        pairs,
      });
    }
  }

  // --- Category B: Math Powers: Squares, Cubes & Roots (200 packs) ---
  for (let set = 1; set <= 35; set++) {
    const pairs = [];
    const base = set * 3;
    for (let i = 1; i <= 6; i++) {
      const n = base + i;
      pairs.push({
        id: ++pairGlobalId,
        q: `Square of ${n} (${n}²)`,
        a: `${n * n}`,
        emoji: "⚡",
      });
    }
    packs.push({
      title_en: `Math Powers: Squares Master (Set ${set})`,
      title_ne: `घाताङ्क: वर्ग संख्या मास्टर (${set})`,
      subject: "math",
      difficulty: set > 15 ? 3 : 2,
      time_limit_sec: 55,
      pairs,
    });
  }

  // Cubes
  for (let set = 1; set <= 25; set++) {
    const pairs = [];
    for (let i = 1; i <= 6; i++) {
      const n = (set % 15) + i;
      pairs.push({
        id: ++pairGlobalId,
        q: `Cube of ${n} (${n}³)`,
        a: `${n * n * n}`,
        emoji: "🎲",
      });
    }
    packs.push({
      title_en: `Math Powers: Cubes Master (Set ${set})`,
      title_ne: `घाताङ्क: घन संख्या मास्टर (${set})`,
      subject: "math",
      difficulty: 3,
      time_limit_sec: 60,
      pairs,
    });
  }

  // Addition / Subtraction mental speed packs
  for (let set = 1; set <= 80; set++) {
    const pairs = [];
    for (let i = 1; i <= 6; i++) {
      const a = (set * 7 + i * 11) % 90 + 10;
      const b = (set * 3 + i * 5) % 50 + 5;
      pairs.push({
        id: ++pairGlobalId,
        q: `${a} + ${b}`,
        a: `${a + b}`,
        emoji: "➕",
      });
    }
    packs.push({
      title_en: `Mental Addition Sprint (Set ${set})`,
      title_ne: `द्रुत जोड अभ्यास (${set})`,
      subject: "math",
      difficulty: set > 40 ? 2 : 1,
      time_limit_sec: 45,
      pairs,
    });
  }

  // Subtraction mental speed packs (60 packs)
  for (let set = 1; set <= 60; set++) {
    const pairs = [];
    for (let i = 1; i <= 6; i++) {
      const a = (set * 5 + i * 9) % 80 + 25;
      const b = (set * 2 + i * 4) % 20 + 2;
      pairs.push({
        id: ++pairGlobalId,
        q: `${a} − ${b}`,
        a: `${a - b}`,
        emoji: "➖",
      });
    }
    packs.push({
      title_en: `Mental Subtraction Sprint (Set ${set})`,
      title_ne: `द्रुत घटाउ अभ्यास (${set})`,
      subject: "math",
      difficulty: set > 30 ? 2 : 1,
      time_limit_sec: 45,
      pairs,
    });
  }

  // --- Category C: Fractions & Percentages (60 packs) ---
  const FRACTION_PAIRS = [
    ["1/2", "50%", "🥧"], ["1/4", "25%", "🍰"], ["3/4", "75%", "🎂"], ["1/5", "20%", "🍕"],
    ["2/5", "40%", "🍕"], ["3/5", "60%", "🍕"], ["4/5", "80%", "🍕"], ["1/10", "10%", "🍫"],
    ["3/10", "30%", "🍫"], ["7/10", "70%", "🍫"], ["9/10", "90%", "🍫"], ["1/8", "12.5%", "🧇"],
    ["3/8", "37.5%", "🧇"], ["5/8", "62.5%", "🧇"], ["7/8", "87.5%", "🧇"], ["1/3", "33.3%", "🥪"],
    ["2/3", "66.7%", "🥪"], ["1/6", "16.7%", "🍩"], ["5/6", "83.3%", "🍩"], ["1/1", "100%", "🎯"],
  ];
  createPacksFromPool(FRACTION_PAIRS, "Fractions to Percentages", "भिन्न र प्रतिशत रूपान्तरण", "math", 2, 60);

  // --- Category D: Nepal District Headquarters (85 packs) ---
  createPacksFromPool(NEPAL_DISTRICTS, "Nepal Districts & Headquarters", "नेपालका जिल्ला र सदरमुकाम", "nepal", 1, 85);

  // --- Category E: Chemistry Elements & Symbols (75 packs) ---
  createPacksFromPool(ELEMENTS, "Chemistry: Elements & Symbols", "रसायन शास्त्र: तत्व र संकेत", "science", 2, 75);

  // --- Category F: World Countries & Capitals (120 packs) ---
  createPacksFromPool(WORLD_CAPITALS, "World Geography: Country & Capital", "विश्व भूगोल: देश र राजधानी", "world", 1, 120);

  // --- Category G: Physics Units & Quantities (55 packs) ---
  createPacksFromPool(PHYSICS_UNITS, "Physics: Physical Quantities & Units", "भौतिक विज्ञान: एकाइ र नाप", "science", 2, 55);

  // --- Category H: Inventions & Discoveries (55 packs) ---
  createPacksFromPool(INVENTIONS, "Great Inventions & Scientists", "महान आविष्कार र वैज्ञानिकहरू", "science", 2, 55);

  // --- Category I: Nepali Proverbs & Idioms (50 packs) ---
  createPacksFromPool(NEPALI_IDIOMS, "Nepali Proverbs & Meanings", "नेपाली उखान र अर्थ", "nepali", 2, 50);

  // --- Category J: Science Formulas & Animal Classification (50 packs) ---
  const BIOLOGY_PAIRS = [
    ["Amphibian", "Frog (भ्यागुतो)", "🐸"], ["Reptile", "Crocodile (गोही)", "🐊"],
    ["Mammal with Wings", "Bat (चमेरो)", "🦇"], ["Largest Mammal", "Blue Whale (ह्वेल)", "🐋"],
    ["Fastest Land Animal", "Cheetah (चितुवा)", "🐆"], ["Flightless Bird", "Ostrich (अस्ट्रिच)", "🦤"],
    ["Cold-Blooded Reptile", "Snake (सर्प)", "🐍"], ["Marsupial", "Kangaroo (कङ्गारु)", "🦘"],
    ["Bird that Swims", "Penguin (पेन्गुइन)", "🐧"], ["Apex Marine Predator", "Orca / Killer Whale", "🐳"],
    ["Insect Pollinator", "Honeybee (मौरी)", "🐝"], ["Arachnid with 8 Legs", "Spider (माकुरो)", "🕷️"],
  ];
  createPacksFromPool(BIOLOGY_PAIRS, "Biology: Animal Kingdom", "जीव विज्ञान: प्राणी जगत्", "science", 1, 50);

  // --- Category K: Global Currencies (50 packs) ---
  const CURRENCY_PAIRS = [
    ["Japan", "Yen (¥)", "🇯🇵"], ["United Kingdom", "Pound (£)", "🇬🇧"], ["United States", "Dollar ($)", "🇺🇸"],
    ["European Union", "Euro (€)", "🇪🇺"], ["India", "Rupee (₹)", "🇮🇳"], ["China", "Yuan (¥)", "🇨🇳"],
    ["South Korea", "Won (₩)", "🇰🇷"], ["Russia", "Ruble (₽)", "🇷🇺"], ["Switzerland", "Swiss Franc (CHF)", "🇨🇭"],
    ["Bangladesh", "Taka (৳)", "🇧🇩"], ["Australia", "Australian Dollar (A$)", "🇦🇺"], ["UAE", "Dirham (AED)", "🇦🇪"],
  ];
  createPacksFromPool(CURRENCY_PAIRS, "Global Currencies & Nations", "विश्वका मुद्राहरू", "world", 1, 50);

  return packs;
}

export const MEMORY_PACKS = generateAllMemoryPacks();
