// Country-specific curriculum and class-specific procedural question generator.
// Generates authentic questions for UK, Nepal, India, USA, Japan, China, Australia, Global,
// and Lifelong Learner across all 13 class levels.

import { gradeBandFor, shuffle } from "../../src/util.js";

const ri = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
const pick = (arr) => arr[ri(0, arr.length - 1)];

export function makeQ(textEn, textNe, correct, distractors, country, subject, grade, difficulty, topic) {
  const d3 = distractors.filter((d) => d !== correct);
  const pickedD = shuffle(d3).slice(0, 3);
  while (pickedD.length < 3) pickedD.push(`Option ${pickedD.length + 1}`);

  const options = shuffle([correct, ...pickedD]);
  return {
    textEn,
    textNe: textNe || null,
    optionsEn: options.map(String),
    optionsNe: null,
    correctIndex: options.indexOf(correct),
    country,
    subject,
    grade,
    gradeBand: gradeBandFor(grade),
    difficulty: Math.min(3, Math.max(1, difficulty || 2)),
    topic: topic || "curriculum",
    source: `curriculum:${country}:grade${grade}`,
  };
}

// -----------------------------------------------------------------------------------------
// DATA REGISTRIES PER COUNTRY
// -----------------------------------------------------------------------------------------

const UK_DATA = {
  nations: [
    { name: "England", capital: "London", flower: "Rose", patron: "St. George" },
    { name: "Scotland", capital: "Edinburgh", flower: "Thistle", patron: "St. Andrew" },
    { name: "Wales", capital: "Cardiff", flower: "Daffodil", patron: "St. David" },
    { name: "Northern Ireland", capital: "Belfast", flower: "Shamrock", patron: "St. Patrick" },
  ],
  monarchs: [
    { name: "William the Conqueror", year: 1066, achievement: "Invaded England at the Battle of Hastings" },
    { name: "Henry VIII", year: 1509, achievement: "Had six wives and established the Church of England" },
    { name: "Elizabeth I", year: 1558, achievement: "Defeated the Spanish Armada in 1588" },
    { name: "Queen Victoria", year: 1837, achievement: "Reigned over the expansion of the British Empire" },
    { name: "George VI", year: 1936, achievement: "Led Britain as monarch through World War II" },
    { name: "Elizabeth II", year: 1952, achievement: "Was the longest-reigning monarch in British history" },
    { name: "Charles III", year: 2022, achievement: "Acceded to the British throne in 2022" },
  ],
  counties: [
    { county: "Yorkshire", feature: "Largest traditional county with rolling Dales and Moors" },
    { county: "Kent", feature: "Known as the 'Garden of England' with the White Cliffs of Dover" },
    { county: "Cornwall", feature: "Located in the southwestern tip, famous for rugged coastline and pasties" },
    { county: "Cumbria", feature: "Home to the Lake District National Park and Scafell Pike" },
    { county: "Oxfordshire", feature: "World-renowned for the University of Oxford" },
    { county: "Cambridgeshire", feature: "Famed for Cambridge University and the Silicon Fen tech hub" },
  ],
  literature: [
    { author: "William Shakespeare", work: "Hamlet", quote: "'To be or not to be, that is the question'" },
    { author: "Charles Dickens", work: "Oliver Twist", quote: "A classic novel exploring Victorian London social struggles" },
    { author: "Jane Austen", work: "Pride and Prejudice", quote: "Masterpiece novel featuring Elizabeth Bennet and Mr. Darcy" },
    { author: "George Orwell", work: "1984", quote: "Dystopian novel introducing Big Brother and doublethink" },
    { author: "J.K. Rowling", work: "Harry Potter", quote: "Global fantasy series set at Hogwarts School" },
    { author: "Arthur Conan Doyle", work: "Sherlock Holmes", quote: "Detective stories set at 221B Baker Street" },
  ],
  science: [
    { scientist: "Isaac Newton", discovery: "Universal Gravitation and the Three Laws of Motion" },
    { scientist: "Charles Darwin", discovery: "Theory of Evolution by Natural Selection" },
    { scientist: "Michael Faraday", discovery: "Electromagnetic Induction and the electric motor principle" },
    { scientist: "Alexander Fleming", discovery: "Penicillin, the first mass-effective antibiotic" },
    { scientist: "Rosalind Franklin", discovery: "X-ray diffraction photograph that revealed the DNA double helix structure" },
    { scientist: "Stephen Hawking", discovery: "Hawking Radiation emitted by black holes" },
  ],
  civics: [
    { title: "House of Commons", role: "Elected chamber of the UK Parliament where MPs debate and vote on laws" },
    { title: "House of Lords", role: "Upper chamber of Parliament that scrutinizes and revises legislation" },
    { title: "10 Downing Street", role: "Official residence and executive office of the British Prime Minister" },
    { title: "Magna Carta (1215)", role: "Historic charter that established the principle that everyone, even the King, is subject to the law" },
    { title: "National Health Service (NHS)", role: "Public healthcare system established in 1948 providing free care at the point of delivery" },
  ],
};

const NEPAL_DATA = {
  provinces: [
    { name: "Koshi Province", capital: "Biratnagar", highlight: "Home to Mount Everest and tea gardens of Ilam" },
    { name: "Madhesh Province", capital: "Janakpur", highlight: "Centred in Mithila culture, Janaki Temple, and fertile plains" },
    { name: "Bagmati Province", capital: "Hetauda", highlight: "Includes the Kathmandu Valley, Chitwan National Park, and major heritage sites" },
    { name: "Gandaki Province", capital: "Pokhara", highlight: "Famous for the Annapurna range, Phewa Lake, and Muktinath" },
    { name: "Lumbini Province", capital: "Deukhuri", highlight: "Birthplace of Lord Buddha in Lumbini, a UNESCO World Heritage Site" },
    { name: "Karnali Province", capital: "Birendranagar", highlight: "Largest province by area, home to Rara Lake and Shey Phoksundo" },
    { name: "Sudurpashchim Province", capital: "Godawari", highlight: "Western province with Shuklaphanta and Khaptad National Parks" },
  ],
  peaks: [
    { name: "Mount Everest (Sagarmatha)", elevation: "8,848.86 m", dist: "Solukhumbu" },
    { name: "Kanchenjunga", elevation: "8,586 m", dist: "Taplejung" },
    { name: "Lhotse", elevation: "8,516 m", dist: "Solukhumbu" },
    { name: "Makalu", elevation: "8,485 m", dist: "Sankhuwasabha" },
    { name: "Cho Oyu", elevation: "8,188 m", dist: "Solukhumbu" },
    { name: "Dhaulagiri I", elevation: "8,167 m", dist: "Myagdi" },
    { name: "Manaslu", elevation: "8,163 m", dist: "Gorkha" },
    { name: "Annapurna I", elevation: "8,091 m", dist: "Myagdi" },
  ],
  heritage: [
    { site: "Pashupatinath Temple", location: "Kathmandu", significance: "Sacred Hindu temple dedicated to Lord Shiva on the Bagmati River" },
    { site: "Swayambhunath Stupa", location: "Kathmandu", significance: "Ancient Buddhist stupa crowned with wisdom eyes, also known as Monkey Temple" },
    { site: "Boudhanath Stupa", location: "Kathmandu", significance: "One of the largest spherical stupas in the world and center of Tibetan Buddhism in Nepal" },
    { site: "Chitwan National Park", location: "Chitwan", significance: "Home to the endangered One-horned Rhinoceros and Royal Bengal Tiger" },
    { site: "Lumbini", location: "Rupandehi", significance: "Sacred garden birthplace of Prince Siddhartha Gautama (Lord Buddha)" },
  ],
  history: [
    { event: "Unification of Nepal", leader: "Prithvi Narayan Shah", year: "1768 AD" },
    { event: "Sugauli Treaty", leader: "Nepal and British East India Company", year: "1816 AD" },
    { event: "Kot Parva (Massacre)", leader: "Jung Bahadur Rana", year: "1903 BS (1846 AD)" },
    { event: "Establishment of Democracy", leader: "King Tribhuvan & political parties", year: "2007 BS (1951 AD)" },
    { event: "Promulgation of Federal Constitution", leader: "Constituent Assembly", year: "2072 BS (2015 AD)" },
  ],
};

const INDIA_DATA = {
  states: [
    { name: "Maharashtra", capital: "Mumbai", feature: "Financial capital of India and home to Bollywood" },
    { name: "Karnataka", capital: "Bengaluru", feature: "Silicon Valley of India and center of IT innovations" },
    { name: "Tamil Nadu", capital: "Chennai", feature: "Renowned for Dravidian temples and automobile industry" },
    { name: "Uttar Pradesh", capital: "Lucknow", feature: "Most populous state, home to the Taj Mahal in Agra" },
    { name: "Rajasthan", capital: "Jaipur", feature: "The 'Land of Kings' famous for desert forts and palaces" },
    { name: "Kerala", capital: "Thiruvananthapuram", feature: "Known as 'God's Own Country' with highest literacy rate" },
    { name: "West Bengal", capital: "Kolkata", feature: "Cultural capital famed for literature, art, and Durga Puja" },
  ],
  history: [
    { event: "Harappan Civilization", period: "c. 2500 BCE", note: "Advanced bronze-age urban civilization with planned cities and drainage systems" },
    { event: "Maurya Empire", period: "c. 322 BCE", note: "United most of the subcontinent under Chandragupta and Emperor Ashoka" },
    { event: "Gupta Empire", period: "c. 320 CE", note: "Classical 'Golden Age of India' with breakthroughs in mathematics by Aryabhata" },
    { event: "Mughal Empire", period: "c. 1526 CE", note: "Dynasty founded by Babur, known for architectural masterworks like the Taj Mahal" },
    { event: "Indian Independence", period: "15 August 1947", note: "Gained freedom from British rule through the non-violent struggle led by Gandhi" },
  ],
  leaders: [
    { name: "Mahatma Gandhi", role: "Father of the Nation who pioneered Satyagraha (non-violent resistance)" },
    { name: "Dr. B. R. Ambedkar", role: "Chief Architect and Chairman of the Drafting Committee of the Indian Constitution" },
    { name: "Jawaharlal Nehru", role: "First Prime Minister of independent India and architect of modern democratic institutions" },
    { name: "Sardar Vallabhbhai Patel", role: "'Iron Man of India' who integrated over 560 princely states into the Indian Union" },
    { name: "Subhas Chandra Bose", role: "Leader of the Indian National Army (Azad Hind Fauj)" },
  ],
  science: [
    { scientist: "C. V. Raman", discovery: "Raman Effect explaining the scattering of light, winning Nobel Prize in Physics (1930)" },
    { scientist: "Srinivasa Ramanujan", discovery: "Groundbreaking mathematical formulas, modular forms, and infinite series" },
    { scientist: "Homi J. Bhabha", discovery: "Father of the Indian Nuclear Program and founding director of TIFR" },
    { scientist: "A. P. J. Abdul Kalam", discovery: "'Missile Man of India' who led India's missile defense and civilian space programs" },
    { scientist: "Vikram Sarabhai", discovery: "Father of the Indian Space Program that founded ISRO" },
  ],
};

const USA_DATA = {
  states: [
    { name: "California", capital: "Sacramento", feature: "Most populous state, home to Silicon Valley and Hollywood" },
    { name: "Texas", capital: "Austin", feature: "Second-largest state by area and population, famous for energy and cattle" },
    { name: "New York", capital: "Albany", feature: "Major cultural and commercial hub home to NYC and Wall Street" },
    { name: "Florida", capital: "Tallahassee", feature: "The 'Sunshine State' with Everglades and Kennedy Space Center" },
    { name: "Illinois", capital: "Springfield", feature: "Midwestern center with Chicago on Lake Michigan" },
    { name: "Washington", capital: "Olympia", feature: "Pacific Northwest hub for aerospace, cloud tech, and temperate rainforests" },
  ],
  history: [
    { event: "Declaration of Independence", year: "1776", note: "Drafted by Thomas Jefferson in Philadelphia declaring independence from Great Britain" },
    { event: "US Constitution Ratification", year: "1788", note: "Supreme law of the land with checks and balances among three branches" },
    { event: "American Civil War", year: "1861-1865", note: "War fought to preserve the Union and end slavery, led by President Abraham Lincoln" },
    { event: "Moon Landing (Apollo 11)", year: "1969", note: "Neil Armstrong and Buzz Aldrin became first humans to walk on the lunar surface" },
    { event: "Civil Rights Act", year: "1964", note: "Landmark legislation outlawing discrimination based on race, color, religion, or sex" },
  ],
  presidents: [
    { name: "George Washington", note: "1st President, commander of Continental Army, established presidential traditions" },
    { name: "Thomas Jefferson", note: "3rd President, author of Declaration of Independence, doubled US size via Louisiana Purchase" },
    { name: "Abraham Lincoln", note: "16th President, issued Emancipation Proclamation, preserved the Union" },
    { name: "Franklin D. Roosevelt", note: "32nd President, enacted the New Deal and led the US through World War II" },
    { name: "John F. Kennedy", note: "35th President, initiated the Apollo Moon program and Peace Corps" },
  ],
  geography: [
    { landmark: "Grand Canyon", state: "Arizona", feature: "Immense gorge carved by the Colorado River" },
    { landmark: "Yellowstone National Park", state: "Wyoming/Montana/Idaho", feature: "First national park in the world, home to Old Faithful geyser" },
    { landmark: "Statue of Liberty", state: "New York", feature: "Colossal neoclassical sculpture gifted by France symbolizing freedom" },
    { landmark: "Mississippi River", state: "Central US", feature: "Major waterway draining 31 US states into the Gulf of Mexico" },
  ],
};

const JAPAN_DATA = {
  prefectures: [
    { name: "Tokyo", island: "Honshu", feature: "Capital and most populous metropolitan area in the world" },
    { name: "Kyoto", island: "Honshu", feature: "Ancient imperial capital famed for historic temples and shrines" },
    { name: "Osaka", island: "Honshu", feature: "Commercial heart of western Japan famed for culinary culture" },
    { name: "Hokkaido", island: "Hokkaido", feature: "Northern island known for snowy mountains and Sapporo" },
    { name: "Okinawa", island: "Ryukyu Islands", feature: "Subtropical southern islands with unique Ryukyuan heritage" },
    { name: "Hiroshima", island: "Honshu", feature: "Peace Memorial City known for resilience and Itsukushima Shrine" },
  ],
  history: [
    { era: "Heian Period (794-1185)", feature: "Peak of classical imperial court culture and Tale of Genji" },
    { era: "Kamakura Period (1185-1333)", feature: "Establishment of the first military Shogunate led by Minamoto no Yoritomo" },
    { era: "Edo Period (1603-1867)", feature: "Over 250 years of peace and national seclusion (Sakoku) under Tokugawa Shogunate" },
    { era: "Meiji Restoration (1868)", feature: "Rapid modernization and industrialization restoring imperial rule" },
    { era: "Post-War Economic Miracle (1950s-1980s)", feature: "Rapid rise into a global leader in high technology, automotive, and bullet trains (Shinkansen)" },
  ],
};

const CHINA_DATA = {
  provinces: [
    { name: "Guangdong", capital: "Guangzhou", feature: "Economic powerhouse on the Pearl River Delta including Shenzhen" },
    { name: "Sichuan", capital: "Chengdu", feature: "Home to Giant Pandas and world-famous spicy cuisine" },
    { name: "Shaanxi", capital: "Xi'an", feature: "Starting point of the ancient Silk Road and home to the Terracotta Army" },
    { name: "Zhejiang", capital: "Hangzhou", feature: "Famed for West Lake and modern digital commerce hubs" },
    { name: "Shandong", capital: "Jinan", feature: "Birthplace of Confucius and Mount Tai" },
  ],
  dynasties: [
    { name: "Qin Dynasty", period: "221-206 BCE", achievement: "First unified Chinese empire, standardized script and began Great Wall" },
    { name: "Han Dynasty", period: "202 BCE - 220 CE", achievement: "Golden age establishing the Silk Road and Confucian state ideals" },
    { name: "Tang Dynasty", period: "618-907 CE", achievement: "Cosmopolitan golden age of poetry by Li Bai and Du Fu, and trade" },
    { name: "Song Dynasty", period: "960-1279 CE", achievement: "Era of scientific inventions including movable type, magnetic compass, and paper money" },
    { name: "Ming Dynasty", period: "1368-1644 CE", achievement: "Built the Forbidden City in Beijing and sent Zheng He's treasure voyages" },
  ],
};

const AUSTRALIA_DATA = {
  states: [
    { name: "New South Wales", capital: "Sydney", landmark: "Sydney Opera House and Harbour Bridge" },
    { name: "Victoria", capital: "Melbourne", landmark: "Cultural capital with the Great Ocean Road" },
    { name: "Queensland", capital: "Brisbane", landmark: "Sunshine state home to the Great Barrier Reef" },
    { name: "Western Australia", capital: "Perth", landmark: "Largest state with vast desert and Margaret River wine region" },
    { name: "South Australia", capital: "Adelaide", landmark: "Renowned for Barossa Valley and wildlife of Kangaroo Island" },
    { name: "Tasmania", capital: "Hobart", landmark: "Island state famous for wilderness and Cradle Mountain" },
  ],
  nature: [
    { animal: "Kangaroo", type: "Marsupial", trait: "Famous hopping mammal with powerful hind legs and pouch" },
    { animal: "Koala", type: "Marsupial", trait: "Eucalyptus-leaf feeding tree dweller found in eastern Australia" },
    { animal: "Platypus", type: "Monotreme", trait: "Semi-aquatic egg-laying mammal with a duck-like bill" },
    { animal: "Echidna", type: "Monotreme", trait: "Spiny anteater that also lays eggs instead of giving live birth" },
    { animal: "Great Barrier Reef", type: "Coral Reef Ecosystem", trait: "World's largest living coral reef structure visible from space" },
  ],
  history: [
    { event: "First Nations Heritage", note: "Continuous Indigenous Australian cultures extending over 65,000 years" },
    { event: "First Fleet Arrival", year: "1788", note: "Captain Arthur Phillip arrived in Botany Bay to establish British settlement" },
    { event: "Gold Rush (Eureka Stockade)", year: "1854", note: "Miners' rebellion in Ballarat for democratic rights" },
    { event: "Federation of Australia", year: "1 January 1901", note: "Six colonies united to form the Commonwealth of Australia" },
    { event: "ANZAC Tradition", year: "1915", note: "Australian and New Zealand Army Corps landed at Gallipoli in WWI" },
  ],
};

const LIFELONG_DATA = {
  philosophy: [
    { philosopher: "Socrates", school: "Classical Greek", idea: "'An unexamined life is not worth living', developed the Socratic Method" },
    { philosopher: "Plato", school: "Platonism", idea: "Allegory of the Cave, Theory of Forms, and The Republic" },
    { philosopher: "Aristotle", school: "Peripatetic", idea: "Golden Mean virtue ethics, formal logic, and categorization of science" },
    { philosopher: "René Descartes", school: "Rationalism", idea: "'Cogito, ergo sum' (I think, therefore I am)" },
    { philosopher: "Immanuel Kant", school: "Deontology", idea: "Categorical Imperative: act only according to maxims you can universalize" },
    { philosopher: "Friedrich Nietzsche", school: "Existentialism", idea: "Critique of traditional morality, Amor Fati, and the Übermensch concept" },
    { philosopher: "Marcus Aurelius", school: "Stoicism", idea: "Roman Emperor whose Meditations reflect on duty, resilience, and inner tranquility" },
  ],
  breakthroughs: [
    { field: "Theoretical Physics", discovery: "General Relativity", pioneer: "Albert Einstein (1915)", impact: "Described gravity as the curvature of spacetime" },
    { field: "Quantum Mechanics", discovery: "Uncertainty Principle", pioneer: "Werner Heisenberg (1927)", impact: "Cannot simultaneously know exact position and momentum of a particle" },
    { field: "Biotechnology", discovery: "CRISPR-Cas9 Gene Editing", pioneer: "Jennifer Doudna & Emmanuelle Charpentier", impact: "Revolutionized precision DNA editing in living organisms" },
    { field: "Computing", discovery: "Turing Machine & Universal Computing", pioneer: "Alan Turing (1936)", impact: "Formulated the mathematical foundation of modern computer science" },
    { field: "Astronomy", discovery: "Cosmic Expansion", pioneer: "Edwin Hubble (1929)", impact: "Showed galaxies are moving away from each other, leading to Big Bang theory" },
  ],
  economics: [
    { concept: "Comparative Advantage", pioneer: "David Ricardo", summary: "Countries gain from trade by specializing in goods with lowest opportunity cost" },
    { concept: "Invisible Hand", pioneer: "Adam Smith", summary: "Self-interested individual actions in free markets can unintentionally benefit society" },
    { concept: "Keynesian Economics", pioneer: "John Maynard Keynes", summary: "Government intervention and fiscal stimulus can stabilize economic recessions" },
    { concept: "Creative Destruction", pioneer: "Joseph Schumpeter", summary: "Incessant process of industrial innovation continually devalues old technologies" },
  ],
};

// -----------------------------------------------------------------------------------------
// MAIN CURRICULUM GENERATOR FUNCTION
// -----------------------------------------------------------------------------------------

export function generateCountryQuestions(country, grade, count) {
  const list = [];
  const countryNorm = country.toLowerCase();

  for (let i = 0; i < count; i++) {
    // Generate specialized questions depending on country & class
    let qObj = null;

    if (grade === 13) {
      // -----------------------------------------------------------
      // LIFELONG LEARNER / ADULT BRAIN FITNESS
      // -----------------------------------------------------------
      const cat = i % 4;
      if (cat === 0) {
        const item = pick(LIFELONG_DATA.philosophy);
        const wrongItems = LIFELONG_DATA.philosophy.filter((p) => p.philosopher !== item.philosopher).map((p) => p.philosopher);
        qObj = makeQ(
          `Which philosopher is famous for the philosophical concept: "${item.idea}"?`,
          null,
          item.philosopher,
          wrongItems,
          countryNorm,
          "social",
          13,
          3,
          "philosophy"
        );
      } else if (cat === 1) {
        const b = pick(LIFELONG_DATA.breakthroughs);
        const wrongPioneers = LIFELONG_DATA.breakthroughs.filter((x) => x.pioneer !== b.pioneer).map((x) => x.pioneer);
        qObj = makeQ(
          `In ${b.field}, which pioneer is celebrated for: "${b.discovery}" (${b.impact})?`,
          null,
          b.pioneer,
          wrongPioneers,
          countryNorm,
          "science",
          13,
          3,
          "scientific-breakthroughs"
        );
      } else if (cat === 2) {
        const econ = pick(LIFELONG_DATA.economics);
        const wrongConcepts = LIFELONG_DATA.economics.filter((e) => e.concept !== econ.concept).map((e) => e.concept);
        qObj = makeQ(
          `In economic theory, which concept states that: "${econ.summary}"?`,
          null,
          econ.concept,
          wrongConcepts,
          countryNorm,
          "social",
          13,
          3,
          "economics"
        );
      } else {
        // High-level lateral/math logic puzzle
        const a = ri(12, 45);
        const b = ri(2, 6);
        const res = a * b + ri(3, 9);
        const correctRem = res % b;
        qObj = makeQ(
          `Logic Check: When the number ${res} is divided by ${b}, what is the remainder?`,
          null,
          String(correctRem),
          [String((correctRem + 1) % b), String((correctRem + 2) % b), String(b)],
          countryNorm,
          "math",
          13,
          2,
          "mental-math"
        );
      }
    } else if (countryNorm === "uk") {
      // -----------------------------------------------------------
      // UNITED KINGDOM CURRICULUM
      // -----------------------------------------------------------
      const t = i % 5;
      if (t === 0) {
        const nation = pick(UK_DATA.nations);
        const wrongCaps = UK_DATA.nations.filter((n) => n.name !== nation.name).map((n) => n.capital);
        qObj = makeQ(
          `In the UK National Curriculum, what is the capital city of ${nation.name}?`,
          null,
          nation.capital,
          wrongCaps,
          "uk",
          "social",
          grade,
          grade <= 5 ? 1 : 2,
          "uk-geography"
        );
      } else if (t === 1) {
        const monarch = pick(UK_DATA.monarchs);
        const wrongMonarchs = UK_DATA.monarchs.filter((m) => m.name !== monarch.name).map((m) => m.name);
        qObj = makeQ(
          `British History: Which monarch is famous for having: "${monarch.achievement}"?`,
          null,
          monarch.name,
          wrongMonarchs,
          "uk",
          "social",
          grade,
          grade <= 5 ? 1 : 2,
          "british-monarchy"
        );
      } else if (t === 2) {
        const sci = pick(UK_DATA.science);
        const wrongScientists = UK_DATA.science.filter((s) => s.scientist !== sci.scientist).map((s) => s.scientist);
        qObj = makeQ(
          `UK Science Syllabus: Which British scientist is credited with the breakthrough of "${sci.discovery}"?`,
          null,
          sci.scientist,
          wrongScientists,
          "uk",
          "science",
          grade,
          grade <= 5 ? 2 : 3,
          "british-science"
        );
      } else if (t === 3) {
        const lit = pick(UK_DATA.literature);
        const wrongAuthors = UK_DATA.literature.filter((l) => l.author !== lit.author).map((l) => l.author);
        qObj = makeQ(
          `English Literature: Who wrote the famous work "${lit.work}" (${lit.quote})?`,
          null,
          lit.author,
          wrongAuthors,
          "uk",
          "english",
          grade,
          grade <= 5 ? 1 : 2,
          "literature"
        );
      } else {
        // UK Math according to Key Stage
        if (grade <= 3) {
          const a = ri(5, 50);
          const b = ri(2, 20);
          qObj = makeQ(`What is £${a} plus £${b}?`, null, `£${a + b}`, [`£${a + b + 1}`, `£${a + b - 2}`, `£${a + b + 5}`], "uk", "math", grade, 1, "currency-math");
        } else if (grade <= 6) {
          const a = ri(12, 100);
          const b = ri(2, 9);
          qObj = makeQ(`Calculate: ${a} × ${b}`, null, String(a * b), [String(a * b + b), String(a * b - b), String(a * b + 10)], "uk", "math", grade, 2, "multiplication");
        } else {
          // GCSE / A-Level
          const x = ri(2, 8);
          const ans = x * x - 4;
          qObj = makeQ(`If f(x) = x² - 4, what is the value of f(${x})?`, null, String(ans), [String(ans + 4), String(ans - 4), String(ans * 2)], "uk", "math", grade, 3, "algebra");
        }
      }
    } else if (countryNorm === "nepal") {
      // -----------------------------------------------------------
      // NEPAL CDC CURRICULUM
      // -----------------------------------------------------------
      const t = i % 5;
      if (t === 0) {
        const prov = pick(NEPAL_DATA.provinces);
        const wrongCaps = NEPAL_DATA.provinces.filter((p) => p.name !== prov.name).map((p) => p.capital);
        qObj = makeQ(
          `According to Nepal's administrative division, what is the provincial capital of ${prov.name}?`,
          `नेपालको प्रशासनिक विभाजन अनुसार ${prov.name}को प्रादेशिक राजधानी कहाँ हो?`,
          prov.capital,
          wrongCaps,
          "nepal",
          "social",
          grade,
          grade <= 5 ? 1 : 2,
          "nepal-provinces"
        );
      } else if (t === 1) {
        const peak = pick(NEPAL_DATA.peaks);
        const wrongHimal = NEPAL_DATA.peaks.filter((p) => p.name !== peak.name).map((p) => p.elevation);
        qObj = makeQ(
          `What is the official elevation of ${peak.name} in Nepal?`,
          `नेपालमा रहेको ${peak.name}को आधिकारिक उचाइ कति हो?`,
          peak.elevation,
          wrongHimal,
          "nepal",
          "social",
          grade,
          2,
          "nepal-geography"
        );
      } else if (t === 2) {
        const h = pick(NEPAL_DATA.history);
        const wrongLeaders = NEPAL_DATA.history.filter((x) => x.leader !== h.leader).map((x) => x.leader);
        qObj = makeQ(
          `Nepali History: Which leader/institution is associated with: "${h.event}" (${h.year})?`,
          `नेपालको इतिहास: "${h.event}" (${h.year}) सँग कुन नेतृत्व जोडिएको छ?`,
          h.leader,
          wrongLeaders,
          "nepal",
          "social",
          grade,
          grade <= 8 ? 2 : 3,
          "nepal-history"
        );
      } else if (t === 3) {
        const her = pick(NEPAL_DATA.heritage);
        const wrongLocs = ["Pokhara", "Biratnagar", "Janakpur", "Dhangadhi", "Nepalgunj"];
        qObj = makeQ(
          `Where in Nepal is the famous site "${her.site}" situated?`,
          `नेपालको प्रख्यात स्थल "${her.site}" कुन जिल्ला वा क्षेत्रमा अवस्थित छ?`,
          her.location,
          wrongLocs,
          "nepal",
          "social",
          grade,
          1,
          "nepal-heritage"
        );
      } else {
        // Nepal Science / Math curriculum
        if (grade <= 5) {
          const a = ri(10, 50);
          const b = ri(5, 30);
          qObj = makeQ(
            `Unitary Method: If 1 copy costs Rs. ${b}, how much do ${a} copies cost?`,
            `एकिक नियम: यदि १ कपीको रु. ${b} पर्छ भने ${a} कपीको कति पर्छ?`,
            `Rs. ${a * b}`,
            [`Rs. ${a * b + 10}`, `Rs. ${a * b - 15}`, `Rs. ${a * b + 20}`],
            "nepal",
            "math",
            grade,
            1,
            "unitary-method"
          );
        } else {
          // SEE / +2 Level
          const r = ri(2, 6);
          const vol = (4 / 3 * Math.PI * Math.pow(r, 3)).toFixed(1);
          qObj = makeQ(
            `In SEE Geometry, what is the volume of a sphere with radius r = ${r} cm (approx)?`,
            `गोलाको आयतन: यदि अर्धव्यास r = ${r} cm भए गोलाको आयतन कति हुन्छ?`,
            `${vol} cm³`,
            [`${(vol * 1.2).toFixed(1)} cm³`, `${(vol * 0.8).toFixed(1)} cm³`, `${(vol * 1.5).toFixed(1)} cm³`],
            "nepal",
            "math",
            grade,
            3,
            "mensuration"
          );
        }
      }
    } else if (countryNorm === "india") {
      // -----------------------------------------------------------
      // INDIA CBSE / NCERT CURRICULUM
      // -----------------------------------------------------------
      const t = i % 4;
      if (t === 0) {
        const state = pick(INDIA_DATA.states);
        const wrongCaps = INDIA_DATA.states.filter((s) => s.name !== state.name).map((s) => s.capital);
        qObj = makeQ(
          `In Indian Geography, what is the state capital of ${state.name}?`,
          null,
          state.capital,
          wrongCaps,
          "india",
          "social",
          grade,
          grade <= 5 ? 1 : 2,
          "india-states"
        );
      } else if (t === 1) {
        const l = pick(INDIA_DATA.leaders);
        const wrongLeaders = INDIA_DATA.leaders.filter((x) => x.name !== l.name).map((x) => x.name);
        qObj = makeQ(
          `Indian Freedom Struggle & Civics: Who is known as: "${l.role}"?`,
          null,
          l.name,
          wrongLeaders,
          "india",
          "social",
          grade,
          grade <= 5 ? 1 : 2,
          "indian-leaders"
        );
      } else if (t === 2) {
        const s = pick(INDIA_DATA.science);
        const wrongScientists = INDIA_DATA.science.filter((x) => x.scientist !== s.scientist).map((x) => x.scientist);
        qObj = makeQ(
          `NCERT Science: Which renowned Indian scientist made the breakthrough discovery of "${s.discovery}"?`,
          null,
          s.scientist,
          wrongScientists,
          "india",
          "science",
          grade,
          grade <= 5 ? 2 : 3,
          "indian-science"
        );
      } else {
        const h = pick(INDIA_DATA.history);
        const wrongNotes = INDIA_DATA.history.filter((x) => x.event !== h.event).map((x) => x.event);
        qObj = makeQ(
          `Indian History: Which historic era (${h.period}) is characterized as: "${h.note}"?`,
          null,
          h.event,
          wrongNotes,
          "india",
          "social",
          grade,
          2,
          "indian-history"
        );
      }
    } else if (countryNorm === "usa") {
      // -----------------------------------------------------------
      // UNITED STATES COMMON CORE CURRICULUM
      // -----------------------------------------------------------
      const t = i % 4;
      if (t === 0) {
        const st = pick(USA_DATA.states);
        const wrongCaps = USA_DATA.states.filter((s) => s.name !== st.name).map((s) => s.capital);
        qObj = makeQ(
          `US Geography: What is the state capital of ${st.name}?`,
          null,
          st.capital,
          wrongCaps,
          "usa",
          "social",
          grade,
          grade <= 5 ? 1 : 2,
          "us-states"
        );
      } else if (t === 1) {
        const pres = pick(USA_DATA.presidents);
        const wrongPres = USA_DATA.presidents.filter((p) => p.name !== pres.name).map((p) => p.name);
        qObj = makeQ(
          `US History: Which American President is known for: "${pres.note}"?`,
          null,
          pres.name,
          wrongPres,
          "usa",
          "social",
          grade,
          2,
          "us-presidents"
        );
      } else if (t === 2) {
        const hist = pick(USA_DATA.history);
        const wrongYears = ["1750", "1804", "1848", "1912", "1941", "1980"];
        qObj = makeQ(
          `US History: In what year did the "${hist.event}" take place (${hist.note})?`,
          null,
          hist.year,
          wrongYears,
          "usa",
          "social",
          grade,
          grade <= 5 ? 1 : 3,
          "us-history"
        );
      } else {
        const lm = pick(USA_DATA.geography);
        const wrongStates = ["California", "Texas", "Florida", "Ohio", "Washington", "Georgia"];
        qObj = makeQ(
          `US Landmarks: In which state or region is the "${lm.landmark}" located?`,
          null,
          lm.state,
          wrongStates,
          "usa",
          "social",
          grade,
          1,
          "us-geography"
        );
      }
    } else if (countryNorm === "japan") {
      // -----------------------------------------------------------
      // JAPAN MEXT CURRICULUM
      // -----------------------------------------------------------
      const t = i % 3;
      if (t === 0) {
        const pref = pick(JAPAN_DATA.prefectures);
        const wrongPrefs = JAPAN_DATA.prefectures.filter((p) => p.name !== pref.name).map((p) => p.name);
        qObj = makeQ(
          `Japanese Geography: Which prefecture on ${pref.island} is known as: "${pref.feature}"?`,
          null,
          pref.name,
          wrongPrefs,
          "japan",
          "social",
          grade,
          2,
          "japan-prefectures"
        );
      } else if (t === 1) {
        const hist = pick(JAPAN_DATA.history);
        const wrongEras = JAPAN_DATA.history.filter((h) => h.era !== hist.era).map((h) => h.era);
        qObj = makeQ(
          `Japanese History: Which historical era is known for: "${hist.feature}"?`,
          null,
          hist.era,
          wrongEras,
          "japan",
          "social",
          grade,
          grade <= 8 ? 2 : 3,
          "japan-history"
        );
      } else {
        const speed = ri(240, 320);
        qObj = makeQ(
          `Japan Technology: The Shinkansen bullet train travels at approximately ${speed} km/h. How far does it travel in 3 hours?`,
          null,
          `${speed * 3} km`,
          [`${speed * 2} km`, `${speed * 3 + 40} km`, `${speed * 3 - 50} km`],
          "japan",
          "math",
          grade,
          2,
          "physics-motion"
        );
      }
    } else if (countryNorm === "china") {
      // -----------------------------------------------------------
      // CHINA CURRICULUM
      // -----------------------------------------------------------
      const t = i % 3;
      if (t === 0) {
        const prov = pick(CHINA_DATA.provinces);
        const wrongCaps = CHINA_DATA.provinces.filter((p) => p.name !== prov.name).map((p) => p.capital);
        qObj = makeQ(
          `Chinese Geography: What is the provincial capital of ${prov.name} (${prov.feature})?`,
          null,
          prov.capital,
          wrongCaps,
          "china",
          "social",
          grade,
          2,
          "china-geography"
        );
      } else if (t === 1) {
        const dyn = pick(CHINA_DATA.dynasties);
        const wrongDyns = CHINA_DATA.dynasties.filter((d) => d.name !== dyn.name).map((d) => d.name);
        qObj = makeQ(
          `Chinese History: Which dynasty is celebrated for: "${dyn.achievement}"?`,
          null,
          dyn.name,
          wrongDyns,
          "china",
          "social",
          grade,
          2,
          "china-dynasties"
        );
      } else {
        // Gougu / Pythagorean theorem in China
        const a = 3 * ri(1, 5);
        const b = 4 * (a / 3);
        const c = 5 * (a / 3);
        qObj = makeQ(
          `Classical Mathematics (Gougu Rule): In a right-angled triangle with sides a = ${a} and b = ${b}, what is the hypotenuse c?`,
          null,
          String(c),
          [String(c + 1), String(c - 2), String(c + 3)],
          "china",
          "math",
          grade,
          grade <= 6 ? 2 : 1,
          "geometry"
        );
      }
    } else if (countryNorm === "australia") {
      // -----------------------------------------------------------
      // AUSTRALIA ACARA CURRICULUM
      // -----------------------------------------------------------
      const t = i % 3;
      if (t === 0) {
        const st = pick(AUSTRALIA_DATA.states);
        const wrongCaps = AUSTRALIA_DATA.states.filter((s) => s.name !== st.name).map((s) => s.capital);
        qObj = makeQ(
          `Australian Geography: What is the capital city of ${st.name}?`,
          null,
          st.capital,
          wrongCaps,
          "australia",
          "social",
          grade,
          1,
          "australia-states"
        );
      } else if (t === 1) {
        const n = pick(AUSTRALIA_DATA.nature);
        const wrongAnimals = AUSTRALIA_DATA.nature.filter((x) => x.animal !== n.animal).map((x) => x.animal);
        qObj = makeQ(
          `Australian Wildlife: Which unique Australian species is described as: "${n.trait}"?`,
          null,
          n.animal,
          wrongAnimals,
          "australia",
          "science",
          grade,
          1,
          "australia-wildlife"
        );
      } else {
        const h = pick(AUSTRALIA_DATA.history);
        const wrongEvents = AUSTRALIA_DATA.history.filter((x) => x.event !== h.event).map((x) => x.event);
        qObj = makeQ(
          `Australian History: Which milestone is known for: "${h.note}"?`,
          null,
          h.event,
          wrongEvents,
          "australia",
          "social",
          grade,
          2,
          "australia-history"
        );
      }
    } else {
      // -----------------------------------------------------------
      // GLOBAL / INTERNATIONAL CURRICULUM (IB / Cambridge)
      // -----------------------------------------------------------
      const t = i % 4;
      if (t === 0) {
        const planets = [
          { name: "Mercury", fact: "Smallest planet and closest to the Sun" },
          { name: "Venus", fact: "Hottest planet in the Solar System due to dense greenhouse atmosphere" },
          { name: "Mars", fact: "The 'Red Planet' home to Olympus Mons, the largest volcano" },
          { name: "Jupiter", fact: "Largest planet in the Solar System, famous for the Great Red Spot" },
          { name: "Saturn", fact: "Gas giant renowned for its spectacular, extensive ring system" },
          { name: "Neptune", fact: "Furthest planet from the Sun, exhibiting intense supersonic winds" },
        ];
        const p = pick(planets);
        const wrongPlanets = planets.filter((x) => x.name !== p.name).map((x) => x.name);
        qObj = makeQ(
          `Astronomy: Which planet in our Solar System is: "${p.fact}"?`,
          null,
          p.name,
          wrongPlanets,
          "global",
          "science",
          grade,
          1,
          "solar-system"
        );
      } else if (t === 1) {
        const continents = [
          { name: "Asia", fact: "Largest continent by both area and population" },
          { name: "Africa", fact: "Second-largest continent, home to the Nile River and Sahara Desert" },
          { name: "Antarctica", fact: "Coldest, driest, and windiest continent covered in an ice sheet" },
          { name: "South America", fact: "Continent home to the Amazon Rainforest and the Andes Mountains" },
          { name: "Europe", fact: "Continent bounded by the Arctic Ocean, Atlantic Ocean, and Mediterranean Sea" },
        ];
        const c = pick(continents);
        const wrongC = continents.filter((x) => x.name !== c.name).map((x) => x.name);
        qObj = makeQ(
          `World Geography: Which continent is: "${c.fact}"?`,
          null,
          c.name,
          wrongC,
          "global",
          "social",
          grade,
          1,
          "world-continents"
        );
      } else if (t === 2) {
        const elements = [
          { name: "Hydrogen", sym: "H", num: 1 },
          { name: "Helium", sym: "He", num: 2 },
          { name: "Carbon", sym: "C", num: 6 },
          { name: "Nitrogen", sym: "N", num: 7 },
          { name: "Oxygen", sym: "O", num: 8 },
          { name: "Sodium", sym: "Na", num: 11 },
          { name: "Iron", sym: "Fe", num: 26 },
          { name: "Gold", sym: "Au", num: 79 },
        ];
        const elem = pick(elements);
        const wrongSyms = elements.filter((x) => x.name !== elem.name).map((x) => x.sym);
        qObj = makeQ(
          `Periodic Table: What is the chemical symbol for the element ${elem.name} (Atomic Number ${elem.num})?`,
          null,
          elem.sym,
          wrongSyms,
          "global",
          "science",
          grade,
          grade <= 5 ? 2 : 1,
          "chemistry"
        );
      } else {
        const a = ri(15, 60);
        const b = ri(15, 60);
        qObj = makeQ(
          `International Math: Calculate ${a} + ${b}`,
          null,
          String(a + b),
          [String(a + b + 2), String(a + b - 1), String(a + b + 10)],
          "global",
          "math",
          grade,
          1,
          "arithmetic"
        );
      }
    }

    if (qObj) {
      list.push(qObj);
    }
  }

  return list;
}
