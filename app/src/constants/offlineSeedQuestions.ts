import { Subject } from "../api/types";
import { OfflineQuestion } from "../utils/offlineStore";

export interface BundledQuestion {
  id: number;
  textEn: string;
  textNe: string;
  optionsEn: string[];
  optionsNe: string[];
  correctIndex: number;
  subject: Subject;
  gradeBand: string;
  country: string;
  difficulty: number;
  topic: string;
}

export const OFFLINE_SEED_QUESTIONS: BundledQuestion[] = [
  // --- Grade Band 1-3 ---
  {
    id: 90001,
    textEn: "Which animal is known as the 'Ship of the Desert'?",
    textNe: "मरुभूमिको जहाज भनेर कुन जनावरलाई चिनिन्छ?",
    optionsEn: ["Camel", "Horse", "Elephant", "Lion"],
    optionsNe: ["ऊँट", "घोडा", "हात्ती", "सिंह"],
    correctIndex: 0,
    subject: "science",
    gradeBand: "1-3",
    country: "global",
    difficulty: 1,
    topic: "animals",
  },
  {
    id: 90002,
    textEn: "How many days are there in a standard year?",
    textNe: "एक साधारण वर्षमा कति दिन हुन्छन्?",
    optionsEn: ["365", "366", "360", "350"],
    optionsNe: ["३६५", "३६६", "३६०", "३५०"],
    correctIndex: 0,
    subject: "gk",
    gradeBand: "1-3",
    country: "global",
    difficulty: 1,
    topic: "calendar",
  },
  {
    id: 90003,
    textEn: "What is 15 + 12?",
    textNe: "१५ + १२ कति हुन्छ?",
    optionsEn: ["27", "25", "30", "28"],
    optionsNe: ["२७", "२५", "३०", "२८"],
    correctIndex: 0,
    subject: "math",
    gradeBand: "1-3",
    country: "global",
    difficulty: 1,
    topic: "addition",
  },
  {
    id: 90004,
    textEn: "Which part of the plant grows underground?",
    textNe: "बिरुवाको कुन भाग जमिन मुनि उम्रन्छ?",
    optionsEn: ["Root", "Stem", "Leaf", "Flower"],
    optionsNe: ["जरा", "डाँठ", "पात", "फूल"],
    correctIndex: 0,
    subject: "science",
    gradeBand: "1-3",
    country: "global",
    difficulty: 1,
    topic: "plants",
  },
  {
    id: 90005,
    textEn: "What is the opposite of 'Cold'?",
    textNe: "'चिसो' को विपरीत शब्द के हो?",
    optionsEn: ["Hot", "Freeze", "Ice", "Cool"],
    optionsNe: ["तातो", "हिउँ", "बरफ", "शीतल"],
    correctIndex: 0,
    subject: "english",
    gradeBand: "1-3",
    country: "global",
    difficulty: 1,
    topic: "antonyms",
  },
  {
    id: 90006,
    textEn: "Mount Everest is located in which country?",
    textNe: "सगरमाथा कुन देशमा अवस्थित छ?",
    optionsEn: ["Nepal", "India", "China", "Bhutan"],
    optionsNe: ["नेपाल", "भारत", "चीन", "भूटान"],
    correctIndex: 0,
    subject: "social",
    gradeBand: "1-3",
    country: "nepal",
    difficulty: 1,
    topic: "geography",
  },

  // --- Grade Band 4-5 ---
  {
    id: 90010,
    textEn: "What gas do plants absorb during photosynthesis?",
    textNe: "बिरुवाले प्रकाश संश्लेषणमा कुन ग्यास सोस्छन्?",
    optionsEn: ["Carbon Dioxide", "Oxygen", "Nitrogen", "Hydrogen"],
    optionsNe: ["कार्बन डाइअक्साइड", "अक्सिजन", "नाइट्रोजन", "हाइड्रोजन"],
    correctIndex: 0,
    subject: "science",
    gradeBand: "4-5",
    country: "global",
    difficulty: 2,
    topic: "photosynthesis",
  },
  {
    id: 90011,
    textEn: "What is 8 × 9?",
    textNe: "८ × ९ कति हुन्छ?",
    optionsEn: ["72", "64", "81", "70"],
    optionsNe: ["७२", "६४", "८१", "७०"],
    correctIndex: 0,
    subject: "math",
    gradeBand: "4-5",
    country: "global",
    difficulty: 2,
    topic: "multiplication",
  },
  {
    id: 90012,
    textEn: "What is the capital city of France?",
    textNe: "फ्रान्सको राजधानी कुन शहर हो?",
    optionsEn: ["Paris", "Lyon", "Marseille", "Nice"],
    optionsNe: ["पेरिस", "लियोन", "मार्सेली", "निस"],
    correctIndex: 0,
    subject: "social",
    gradeBand: "4-5",
    country: "global",
    difficulty: 2,
    topic: "capitals",
  },
  {
    id: 90013,
    textEn: "Which organ pumps blood throughout the human body?",
    textNe: "मानव शरीरभरि रगत पम्प गर्ने अङ्ग कुन हो?",
    optionsEn: ["Heart", "Lungs", "Brain", "Kidney"],
    optionsNe: ["मुटु", "फोक्सो", "मस्तिष्क", "मिर्गौला"],
    correctIndex: 0,
    subject: "science",
    gradeBand: "4-5",
    country: "global",
    difficulty: 2,
    topic: "human_body",
  },
  {
    id: 90014,
    textEn: "Choose the correct past tense of 'Go':",
    textNe: "'Go' शब्दको सही भूतकाल (Past Tense) कुन हो?",
    optionsEn: ["Went", "Gone", "Going", "Goed"],
    optionsNe: ["Went", "Gone", "Going", "Goed"],
    correctIndex: 0,
    subject: "english",
    gradeBand: "4-5",
    country: "global",
    difficulty: 2,
    topic: "grammar",
  },
  {
    id: 90015,
    textEn: "How many provinces are there in Nepal?",
    textNe: "नेपालमा कतिवटा प्रदेशहरू छन्?",
    optionsEn: ["7", "5", "14", "10"],
    optionsNe: ["७", "५", "१४", "१०"],
    correctIndex: 0,
    subject: "social",
    gradeBand: "4-5",
    country: "nepal",
    difficulty: 2,
    topic: "civics",
  },

  // --- Grade Band 6-8 ---
  {
    id: 90020,
    textEn: "What is the chemical symbol for Water?",
    textNe: "पानीको रासायनिक सूत्र के हो?",
    optionsEn: ["H2O", "CO2", "NaCl", "O2"],
    optionsNe: ["H2O", "CO2", "NaCl", "O2"],
    correctIndex: 0,
    subject: "science",
    gradeBand: "6-8",
    country: "global",
    difficulty: 3,
    topic: "chemistry",
  },
  {
    id: 90021,
    textEn: "If 3x + 6 = 21, what is x?",
    textNe: "यदि ३x + ६ = २१ भए x को मान कति हुन्छ?",
    optionsEn: ["5", "4", "7", "6"],
    optionsNe: ["५", "४", "७", "६"],
    correctIndex: 0,
    subject: "math",
    gradeBand: "6-8",
    country: "global",
    difficulty: 3,
    topic: "algebra",
  },
  {
    id: 90022,
    textEn: "Which planet is known as the Red Planet?",
    textNe: "रातो ग्रह भनेर कुन ग्रहलाई चिनिन्छ?",
    optionsEn: ["Mars", "Venus", "Jupiter", "Saturn"],
    optionsNe: ["मंगल (Mars)", "शुक्र (Venus)", "बृहस्पति (Jupiter)", "शनि (Saturn)"],
    correctIndex: 0,
    subject: "science",
    gradeBand: "6-8",
    country: "global",
    difficulty: 3,
    topic: "astronomy",
  },
  {
    id: 90023,
    textEn: "What is the capital of the United Kingdom?",
    textNe: "संयुक्त अधिराज्य (UK) को राजधानी कुन हो?",
    optionsEn: ["London", "Manchester", "Edinburgh", "Birmingham"],
    optionsNe: ["लन्डन", "म्यानचेस्टर", "एडिनबर्ग", "बर्मिङ्घम"],
    correctIndex: 0,
    subject: "social",
    gradeBand: "6-8",
    country: "uk",
    difficulty: 3,
    topic: "geography",
  },
  {
    id: 90024,
    textEn: "Who wrote the play 'Romeo and Juliet'?",
    textNe: "'रोमियो र जुलियट' नाटक कसले लेखेका हुन्?",
    optionsEn: ["William Shakespeare", "Charles Dickens", "Mark Twain", "Jane Austen"],
    optionsNe: ["विलियम शेक्सपियर", "चार्ल्स डिकेन्स", "मार्क ट्वेन", "जेन अस्टिन"],
    correctIndex: 0,
    subject: "english",
    gradeBand: "6-8",
    country: "global",
    difficulty: 3,
    topic: "literature",
  },
  {
    id: 90025,
    textEn: "What is the largest organ in the human body?",
    textNe: "मानव शरीरको सबैभन्दा ठूलो अङ्ग कुन हो?",
    optionsEn: ["Skin", "Liver", "Brain", "Heart"],
    optionsNe: ["छाला", "कलेजो", "मस्तिष्क", "मुटु"],
    correctIndex: 0,
    subject: "science",
    gradeBand: "6-8",
    country: "global",
    difficulty: 3,
    topic: "biology",
  },

  // --- Grade Band 9-10 ---
  {
    id: 90030,
    textEn: "What is Newton's First Law of Motion also known as?",
    textNe: "न्युटनको चाल सम्बन्धी पहिलो नियमलाई के पनि भनिन्छ?",
    optionsEn: ["Law of Inertia", "Law of Acceleration", "Law of Action-Reaction", "Law of Gravity"],
    optionsNe: ["जडताको नियम (Law of Inertia)", "प्रवेगको नियम", "क्रिया र प्रतिक्रियाको नियम", "गुरुत्वाकर्षणको नियम"],
    correctIndex: 0,
    subject: "science",
    gradeBand: "9-10",
    country: "global",
    difficulty: 4,
    topic: "physics",
  },
  {
    id: 90031,
    textEn: "What is the value of Sin 90° in trigonometry?",
    textNe: "त्रिकोणमितिमा Sin ९०° को मान कति हुन्छ?",
    optionsEn: ["1", "0", "1/2", "Undefined"],
    optionsNe: ["१", "०", "१/२", "अपरिभाषित"],
    correctIndex: 0,
    subject: "math",
    gradeBand: "9-10",
    country: "global",
    difficulty: 4,
    topic: "trigonometry",
  },
  {
    id: 90032,
    textEn: "Who is known as the Father of the Indian Constitution?",
    textNe: "भारतीय संविधानका पिता भनेर कसलाई चिनिन्छ?",
    optionsEn: ["Dr. B.R. Ambedkar", "Mahatma Gandhi", "Jawaharlal Nehru", "Sardar Patel"],
    optionsNe: ["डा. बी.आर. अम्बेडकर", "महात्मा गान्धी", "जवाहरलाल नेहरू", "सरदार पटेल"],
    correctIndex: 0,
    subject: "social",
    gradeBand: "9-10",
    country: "india",
    difficulty: 4,
    topic: "history",
  },
  {
    id: 90033,
    textEn: "What is the powerhouse of the cell?",
    textNe: "कोषको शक्तिगृह (Powerhouse of cell) भनेर केलाई चिनिन्छ?",
    optionsEn: ["Mitochondria", "Ribosome", "Nucleus", "Endoplasmic Reticulum"],
    optionsNe: ["माइटोकोन्ड्रिय", "राइबोजोम", "न्युक्लियस", "इन्डोप्लाज्मिक रेटिकुलम"],
    correctIndex: 0,
    subject: "science",
    gradeBand: "9-10",
    country: "global",
    difficulty: 4,
    topic: "biology",
  },

  // --- Grade Band 11-12 & Lifelong Learner ---
  {
    id: 90040,
    textEn: "Which economic principle describes 'All other things being equal'?",
    textNe: "'अन्य सबै कुरा समान रहेमा' भन्ने अर्थ राख्ने ल्याटिन शब्दावली कुन हो?",
    optionsEn: ["Ceteris Paribus", "Laissez-Faire", "Ad Hoc", "Carpe Diem"],
    optionsNe: ["Ceteris Paribus", "Laissez-Faire", "Ad Hoc", "Carpe Diem"],
    correctIndex: 0,
    subject: "social",
    gradeBand: "11-12",
    country: "global",
    difficulty: 5,
    topic: "economics",
  },
  {
    id: 90041,
    textEn: "What is the derivative of sin(x) with respect to x?",
    textNe: "sin(x) को x को सापेक्ष डेरिभेटिभ (d/dx) के हुन्छ?",
    optionsEn: ["cos(x)", "-cos(x)", "tan(x)", "-sin(x)"],
    optionsNe: ["cos(x)", "-cos(x)", "tan(x)", "-sin(x)"],
    correctIndex: 0,
    subject: "math",
    gradeBand: "11-12",
    country: "global",
    difficulty: 5,
    topic: "calculus",
  },
  {
    id: 90042,
    textEn: "Who proposed the General Theory of Relativity in 1915?",
    textNe: "सन् १९१५ मा सापेक्षताको सामान्य सिद्धान्त (General Relativity) कसले प्रतिपादन गरेका थिए?",
    optionsEn: ["Albert Einstein", "Isaac Newton", "Niels Bohr", "Max Planck"],
    optionsNe: ["अल्बर्ट आइन्स्टाइन", "आइज्याक न्युटन", "निल्स बोर", "म्याक्स प्लाङ्क"],
    correctIndex: 0,
    subject: "science",
    gradeBand: "11-12",
    country: "global",
    difficulty: 5,
    topic: "physics",
  },
  {
    id: 90043,
    textEn: "Which philosopher famously stated: 'Cogito, ergo sum' (I think, therefore I am)?",
    textNe: "'म सोच्छु, त्यसैले म छु' (I think, therefore I am) कसको भनाइ हो?",
    optionsEn: ["René Descartes", "Immanuel Kant", "Socrates", "Friedrich Nietzsche"],
    optionsNe: ["रेने डेकार्ट", "इमानुएल कान्ट", "सुकरात", "फ्रेडरिक नित्से"],
    correctIndex: 0,
    subject: "social",
    gradeBand: "11-12",
    country: "global",
    difficulty: 5,
    topic: "philosophy",
  },
];

export function getOfflineSeedQuestions(options?: {
  gradeBand?: string;
  subject?: string;
  lang?: "en" | "ne";
  count?: number;
}): OfflineQuestion[] {
  const gradeBand = options?.gradeBand || "4-5";
  const lang = options?.lang || "en";
  const count = options?.count || 10;

  // Filter matching grade band or fallback to general pool
  let matching = OFFLINE_SEED_QUESTIONS.filter((q) => {
    if (options?.subject && q.subject !== options.subject) return false;
    return q.gradeBand === gradeBand;
  });

  if (matching.length === 0) {
    matching = OFFLINE_SEED_QUESTIONS.filter((q) => {
      if (options?.subject && q.subject !== options.subject) return false;
      return true;
    });
  }

  // Shuffle
  const shuffled = [...matching].sort(() => Math.random() - 0.5);

  return shuffled.slice(0, count).map((q) => ({
    id: q.id,
    text: lang === "ne" && q.textNe ? q.textNe : q.textEn,
    options: lang === "ne" && q.optionsNe ? q.optionsNe : q.optionsEn,
    subject: q.subject,
    country: q.country,
    difficulty: q.difficulty,
    topic: q.topic,
    correctIndex: q.correctIndex,
  }));
}
