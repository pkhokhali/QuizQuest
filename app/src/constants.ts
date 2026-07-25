import { Subject } from "./api/types";
import { TranslationKey } from "./i18n";

export interface CountryOption {
  code: string;
  flag: string;
  labelKey: TranslationKey;
}

export const HOME_COUNTRY: CountryOption = {
  code: "nepal",
  flag: "🇳🇵",
  labelKey: "countryNepal",
};

export const EXTRA_COUNTRIES: CountryOption[] = [
  { code: "india", flag: "🇮🇳", labelKey: "countryIndia" },
  { code: "usa", flag: "🇺🇸", labelKey: "countryUsa" },
  { code: "japan", flag: "🇯🇵", labelKey: "countryJapan" },
  { code: "uk", flag: "🇬🇧", labelKey: "countryUk" },
  { code: "china", flag: "🇨🇳", labelKey: "countryChina" },
  { code: "australia", flag: "🇦🇺", labelKey: "countryAustralia" },
];

export const ALL_COUNTRIES: CountryOption[] = [HOME_COUNTRY, ...EXTRA_COUNTRIES];

export function countryFlag(code: string): string {
  return ALL_COUNTRIES.find((c) => c.code === code)?.flag ?? "🌍";
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
