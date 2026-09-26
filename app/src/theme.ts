// QuizQuest visual identity — structure tokens + international themes.
// Active theme is chosen by the user (ThemeContext).

export type PaletteId =
  | "light"
  | "solar"
  | "midnight"
  | "cyber"
  | "simrik"
  | "himalaya"
  | "violet"
  | "dawn"
  | "forest";

export type ColorTokens = {
  isLight: boolean;
  primary: string;
  primaryDark: string;
  primarySoft: string;
  accent: string;
  accentSoft: string;
  bg: string;
  bgMid: string;
  bgDeep: string;
  card: string;
  surface: string;
  surfaceElevated: string;
  cream: string;
  text: string;
  textMuted: string;
  textOnPrimary: string;
  green: string;
  greenSoft: string;
  amber: string;
  amberSoft: string;
  border: string;
  gold: string;
  goldSoft: string;
  silver: string;
  bronze: string;
  danger: string;
  dangerSoft: string;
};

export type PaletteMeta = {
  id: PaletteId;
  nameKey:
    | "themeLight"
    | "themeSolar"
    | "themeMidnight"
    | "themeCyber"
    | "themeSimrik"
    | "themeViolet"
    | "themeHimalaya"
    | "themeDawn"
    | "themeForest";
  swatch: [string, string, string];
  colors: ColorTokens;
};

/** International Modern Light — High-contrast, clean WCAG AAA crisp daylight theme. */
const light: ColorTokens = {
  isLight: true,
  primary: "#2563EB", // Royal Sapphire Blue
  primaryDark: "#1D4ED8",
  primarySoft: "#EFF6FF",
  accent: "#F59E0B", // Radiant Amber Gold
  accentSoft: "#FEF3C7",
  bg: "#F8FAFC", // Clean cloud daylight
  bgMid: "#FFFFFF",
  bgDeep: "#F1F5F9",
  card: "#FFFFFF",
  surface: "#FFFFFF",
  surfaceElevated: "#F8FAFC",
  cream: "#F8FAFC",
  text: "#0F172A", // Deep Obsidian Slate (14:1 contrast ratio)
  textMuted: "#64748B",
  textOnPrimary: "#FFFFFF",
  green: "#10B981",
  greenSoft: "#D1FAE5",
  amber: "#F59E0B",
  amberSoft: "#FEF3C7",
  border: "#E2E8F0",
  gold: "#F59E0B",
  goldSoft: "rgba(245, 158, 11, 0.15)",
  silver: "#64748B",
  bronze: "#D97706",
  danger: "#EF4444",
  dangerSoft: "#FEE2E2",
};

/** Solar Warm Paper — Gentle natural parchment and fresh botanical emerald green. */
const solar: ColorTokens = {
  isLight: true,
  primary: "#059669", // Fresh botanical emerald
  primaryDark: "#047857",
  primarySoft: "#ECFDF5",
  accent: "#D97706",
  accentSoft: "#FEF3C7",
  bg: "#FDFBF7", // Warm natural paper
  bgMid: "#F5F2EA",
  bgDeep: "#EDE8DC",
  card: "#FFFFFF",
  surface: "#FFFFFF",
  surfaceElevated: "#F5F2EA",
  cream: "#FFFBEB",
  text: "#1C1917", // Deep warm charcoal
  textMuted: "#78716C",
  textOnPrimary: "#FFFFFF",
  green: "#059669",
  greenSoft: "#D1FAE5",
  amber: "#D97706",
  amberSoft: "#FEF3C7",
  border: "#E7E2D5",
  gold: "#D97706",
  goldSoft: "rgba(217, 119, 6, 0.12)",
  silver: "#78716C",
  bronze: "#B45309",
  danger: "#DC2626",
  dangerSoft: "#FEE2E2",
};

/** Midnight Pro — Deep cosmic void with vibrant electric cyan & gold. */
const midnight: ColorTokens = {
  isLight: false,
  primary: "#00D2FF", // Electric cyan
  primaryDark: "#0077B6",
  primarySoft: "#142C44",
  accent: "#FFB703",
  accentSoft: "#332A15",
  bg: "#0A0E27", // Cosmic night
  bgMid: "#12183D",
  bgDeep: "#1B2252",
  card: "#141C44",
  surface: "#141C44",
  surfaceElevated: "#1C265C",
  cream: "#E8F4F8",
  text: "#F8FAFC",
  textMuted: "#94A3B8",
  textOnPrimary: "#0A0E27",
  green: "#10B981",
  greenSoft: "#13382C",
  amber: "#FBBF24",
  amberSoft: "#362A14",
  border: "rgba(255, 255, 255, 0.12)",
  gold: "#FBBF24",
  goldSoft: "rgba(251, 191, 36, 0.2)",
  silver: "#E2E8F0",
  bronze: "#FB923C",
  danger: "#F43F5E",
  dangerSoft: "#38151D",
};

/** Cyber Neon Arena — High-octane arcade purple with cyber cyan glow. */
const cyber: ColorTokens = {
  isLight: false,
  primary: "#A855F7", // Electric violet
  primaryDark: "#7E22CE",
  primarySoft: "#2D164D",
  accent: "#06B6D4", // Cyber cyan
  accentSoft: "#113340",
  bg: "#090D16", // Cyber void
  bgMid: "#111827",
  bgDeep: "#1F2937",
  card: "#131C2E",
  surface: "#131C2E",
  surfaceElevated: "#1E2B45",
  cream: "#F3E8FF",
  text: "#F8FAFC",
  textMuted: "#94A3B8",
  textOnPrimary: "#FFFFFF",
  green: "#10B981",
  greenSoft: "#13382C",
  amber: "#F59E0B",
  amberSoft: "#362A14",
  border: "rgba(168, 85, 247, 0.28)",
  gold: "#F59E0B",
  goldSoft: "rgba(245, 158, 11, 0.2)",
  silver: "#E2E8F0",
  bronze: "#FB923C",
  danger: "#EF4444",
  dangerSoft: "#3B181E",
};

/** Simrik & Himal — Authentic Nepali royal crimson, Sayapatri marigold gold. */
const simrik: ColorTokens = {
  isLight: false,
  primary: "#DC2626", // Simrik crimson
  primaryDark: "#B91C1C",
  primarySoft: "#3B1414",
  accent: "#F59E0B", // Sayapatri gold
  accentSoft: "#382711",
  bg: "#0B1120",
  bgMid: "#111827",
  bgDeep: "#1E293B",
  card: "#162038",
  surface: "#162038",
  surfaceElevated: "#1E294B",
  cream: "#FFFBEB",
  text: "#F8FAFC",
  textMuted: "#94A3B8",
  textOnPrimary: "#FFFFFF",
  green: "#059669",
  greenSoft: "#13382C",
  amber: "#F59E0B",
  amberSoft: "#382711",
  border: "rgba(245, 158, 11, 0.22)",
  gold: "#F59E0B",
  goldSoft: "rgba(245, 158, 11, 0.15)",
  silver: "#E2E8F0",
  bronze: "#F97316",
  danger: "#EF4444",
  dangerSoft: "#3B1414",
};

export const PALETTES: PaletteMeta[] = [
  {
    id: "light",
    nameKey: "themeLight",
    swatch: [light.primary, light.accent, light.bgDeep],
    colors: light,
  },
  {
    id: "solar",
    nameKey: "themeSolar",
    swatch: [solar.primary, solar.accent, solar.bgDeep],
    colors: solar,
  },
  {
    id: "midnight",
    nameKey: "themeMidnight",
    swatch: [midnight.primary, midnight.accent, midnight.bgDeep],
    colors: midnight,
  },
  {
    id: "cyber",
    nameKey: "themeCyber",
    swatch: [cyber.primary, cyber.accent, cyber.bgDeep],
    colors: cyber,
  },
  {
    id: "simrik",
    nameKey: "themeSimrik",
    swatch: [simrik.primary, simrik.accent, simrik.bgDeep],
    colors: simrik,
  },
];

export const DEFAULT_PALETTE_ID: PaletteId = "light";

export function getPalette(id: PaletteId): PaletteMeta {
  return (
    PALETTES.find((p) => p.id === id) ??
    (id === "himalaya"
      ? PALETTES[2]
      : id === "violet"
      ? PALETTES[3]
      : id === "dawn"
      ? PALETTES[1]
      : id === "forest"
      ? PALETTES[1]
      : PALETTES[0])
  );
}

/** Default export for rare static fallbacks (prefer useTheme). */
export const colors: ColorTokens = light;

export const radius = {
  card: 20,
  button: 16,
  chip: 12,
  small: 8,
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const type = {
  hero: 36,
  title: 28,
  heading: 22,
  body: 16,
  small: 13,
  caption: 11,
};

export const fonts = {
  display: "Fredoka_700Bold",
  displayMed: "Fredoka_600SemiBold",
  body: "Nunito_600SemiBold",
  bodyBold: "Nunito_800ExtraBold",
  bodyReg: "Nunito_400Regular",
};

export const shadow = {
  sm: {
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  md: {
    shadowColor: "#000000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  card: {
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  nepalButton: {
    shadowColor: "#000000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  goldGlow: {
    shadowColor: "#F59E0B",
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
};
