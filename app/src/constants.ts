import { Subject } from "./api/types";
import { TranslationKey } from "./i18n";

export interface CountryOption {
  code: string;
  flag: string;
  labelKey: TranslationKey;
  syllabusEn: string;
  syllabusNe: string;
}

export const HOME_COUNTRY: CountryOption = {
  code: "nepal",
  flag: "🇳🇵",
  labelKey: "countryNepal",
  syllabusEn: "CDC Curriculum (Grades 1-10 / SEE)",
  syllabusNe: "पाठ्यक्रम विकास केन्द्र (CDC) पाठ्यक्रम",
};

export const EXTRA_COUNTRIES: CountryOption[] = [
  {
    code: "india",
    flag: "🇮🇳",
    labelKey: "countryIndia",
    syllabusEn: "CBSE / ICSE / NCERT Standards",
    syllabusNe: "CBSE / ICSE / NCERT पाठ्यक्रम",
  },
  {
    code: "usa",
    flag: "🇺🇸",
    labelKey: "countryUsa",
    syllabusEn: "Common Core & US Civics",
    syllabusNe: "कमन कोर र अमेरिकी नागरिक शास्त्र",
  },
  {
    code: "uk",
    flag: "🇬🇧",
    labelKey: "countryUk",
    syllabusEn: "National Curriculum (KS2-4)",
    syllabusNe: "बेलायती राष्ट्रिय पाठ्यक्रम (KS2-4)",
  },
  {
    code: "japan",
    flag: "🇯🇵",
    labelKey: "countryJapan",
    syllabusEn: "MEXT School Curriculum",
    syllabusNe: "जापानी MEXT विद्यालय पाठ्यक्रम",
  },
  {
    code: "australia",
    flag: "🇦🇺",
    labelKey: "countryAustralia",
    syllabusEn: "ACARA Australian Curriculum",
    syllabusNe: "अस्ट्रेलियन ACARA पाठ्यक्रम",
  },
  {
    code: "china",
    flag: "🇨🇳",
    labelKey: "countryChina",
    syllabusEn: "National Standards & Science",
    syllabusNe: "राष्ट्रिय मापदण्ड तथा विज्ञान",
  },
  {
    code: "global",
    flag: "🌍",
    labelKey: "countryGlobal",
    syllabusEn: "International Olympiad & Knowledge",
    syllabusNe: "अन्तर्राष्ट्रिय ओलम्पियाड र सामान्य ज्ञान",
  },
];

export const ALL_COUNTRIES: CountryOption[] = [HOME_COUNTRY, ...EXTRA_COUNTRIES];

export function countryFlag(code: string): string {
  return ALL_COUNTRIES.find((c) => c.code === code)?.flag ?? "🌍";
}

export function countrySyllabus(code: string, lang: "en" | "ne" = "en"): string {
  const c = ALL_COUNTRIES.find((item) => item.code === code) ?? HOME_COUNTRY;
  return lang === "ne" ? c.syllabusNe : c.syllabusEn;
}

export interface SubjectOption {
  code: Subject;
  emoji: string;
  labelKey: TranslationKey;
}

export const SUBJECTS: SubjectOption[] = [
  { code: "math", emoji: "🔢", labelKey: "subjMath" },
  { code: "science", emoji: "🔬", labelKey: "subjScience" },
  { code: "social", emoji: "🏛️", labelKey: "subjSocial" },
  { code: "english", emoji: "📖", labelKey: "subjEnglish" },
  { code: "nepali", emoji: "🏔️", labelKey: "subjNepali" },
  { code: "gk", emoji: "💡", labelKey: "subjGk" },
  { code: "current", emoji: "📰", labelKey: "subjCurrent" },
];

/** Avatar emojis and the level required to unlock each (first 6 are free). */
export const AVATAR_EMOJIS: { emoji: string; level: number }[] = [
  { emoji: "🦊", level: 1 },
  { emoji: "🐼", level: 1 },
  { emoji: "🐯", level: 1 },
  { emoji: "🦉", level: 1 },
  { emoji: "🐸", level: 1 },
  { emoji: "🐨", level: 1 },
  { emoji: "🦁", level: 3 },
  { emoji: "🐲", level: 5 },
  { emoji: "🦄", level: 7 },
  { emoji: "🦅", level: 10 },
  { emoji: "🐺", level: 12 },
  { emoji: "🔥", level: 15 },
];

export const AVATAR_BGS: string[] = [
  "#7C3AED",
  "#F97316",
  "#0EA5E9",
  "#22C55E",
  "#EC4899",
  "#F59E0B",
];

/** XP needed to reach the next level (simple client-side estimate for the bar). */
export function xpForLevel(level: number): number {
  return level * 100;
}
