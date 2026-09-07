// QuizQuest visual identity — structure tokens + named color palettes.
// Active palette is chosen by the student (ThemeContext).

export type PaletteId = "violet" | "himalaya" | "dawn" | "forest";

export type ColorTokens = {
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
  nameKey: "themeViolet" | "themeHimalaya" | "themeDawn" | "themeForest";
  swatch: [string, string, string];
  colors: ColorTokens;
};

/** Cinematic Violet quest — deep cosmic space with vivid neon glow. */
const violet: ColorTokens = {
  primary: "#A855F7", // Electric purple
  primaryDark: "#7E22CE",
  primarySoft: "#F3E8FF",
  accent: "#FB923C", // Vivid warm orange
  accentSoft: "#FFEDD5",
  bg: "#0F0728", // Deep cosmic void
  bgMid: "#1B0F40",
  bgDeep: "#28165E",
  card: "#1E1248",
  surface: "#1E1248",
  surfaceElevated: "#281861",
  cream: "#FAF5FF",
  text: "#F8FAFC",
  textMuted: "#C4B5FD",
  textOnPrimary: "#FFFFFF",
  green: "#10B981",
  greenSoft: "#D1FAE5",
  amber: "#FBBF24",
  amberSoft: "#FEF3C7",
  border: "rgba(255, 255, 255, 0.12)",
  gold: "#FBBF24",
  goldSoft: "rgba(251, 191, 36, 0.15)",
  silver: "#E2E8F0",
  bronze: "#FB923C",
  danger: "#F43F5E",
  dangerSoft: "#FFE4E6",
};

/** Himalayan Midnight — sleek cosmic night, radiant electric cyan, and warm gold. */
const himalaya: ColorTokens = {
  primary: "#00D2FF", // Electric neon cyan
  primaryDark: "#0077B6",
  primarySoft: "#E0F7FA",
  accent: "#FFB703", // Vivid warm gold
  accentSoft: "#FFEAA7",
  bg: "#0A0E27", // Ultra-clean deep midnight void
  bgMid: "#12183D",
  bgDeep: "#1B2252",
  card: "#141C44", // Refined slate-navy card
  surface: "#141C44",
  surfaceElevated: "#1C265C",
  cream: "#E8F4F8",
  text: "#F8FAFC",
  textMuted: "#94A3B8", // High-legibility slate
  textOnPrimary: "#0A0E27",
  green: "#10B981",
  greenSoft: "#D1FAE5",
  amber: "#FBBF24",
  amberSoft: "#FEF3C7",
  border: "rgba(255, 255, 255, 0.1)",
  gold: "#FBBF24",
  goldSoft: "rgba(251, 191, 36, 0.15)",
  silver: "#E2E8F0",
  bronze: "#FB923C",
  danger: "#F43F5E",
  dangerSoft: "#FFE4E6",
};

/** Dawn trail — crisp editorial ivory, vivid rose, and soft slate. */
const dawn: ColorTokens = {
  primary: "#E11D48", // Vivid rose
  primaryDark: "#BE123C",
  primarySoft: "#FFE4E6",
  accent: "#0284C7", // Sky blue
  accentSoft: "#E0F2FE",
  bg: "#F8FAFC", // Clean light canvas
  bgMid: "#F1F5F9",
  bgDeep: "#E2E8F0",
  card: "#FFFFFF",
  surface: "#FFFFFF",
  surfaceElevated: "#F8FAFC",
  cream: "#FFF1F2",
  text: "#0F172A",
  textMuted: "#64748B",
  textOnPrimary: "#FFFFFF",
  green: "#059669",
  greenSoft: "#D1FAE5",
  amber: "#D97706",
  amberSoft: "#FEF3C7",
  border: "#E2E8F0",
  gold: "#D97706",
  goldSoft: "rgba(217, 119, 6, 0.12)",
  silver: "#94A3B8",
  bronze: "#C2410C",
  danger: "#DC2626",
  dangerSoft: "#FEE2E2",
};

/** Forest climb — deep pine canopy, emerald green, and lantern gold. */
const forest: ColorTokens = {
  primary: "#059669", // Rich emerald
  primaryDark: "#047857",
  primarySoft: "#D1FAE5",
  accent: "#D97706",
  accentSoft: "#FEF3C7",
  bg: "#F4F7F5",
  bgMid: "#E6EFEA",
  bgDeep: "#D1E3D8",
  card: "#FFFFFF",
  surface: "#FFFFFF",
  surfaceElevated: "#F4F7F5",
  cream: "#ECFDF5",
  text: "#064E3B",
  textMuted: "#4B6358",
  textOnPrimary: "#FFFFFF",
  green: "#059669",
  greenSoft: "#D1FAE5",
  amber: "#D97706",
  amberSoft: "#FEF3C7",
  border: "#D1E3D8",
  gold: "#D97706",
  goldSoft: "rgba(217, 119, 6, 0.12)",
  silver: "#94A3B8",
  bronze: "#C2410C",
  danger: "#DC2626",
  dangerSoft: "#FEE2E2",
};

export const PALETTES: PaletteMeta[] = [
  {
    id: "himalaya",
    nameKey: "themeHimalaya",
    swatch: [himalaya.primary, himalaya.accent, himalaya.bgDeep],
    colors: himalaya,
  },
  {
    id: "violet",
    nameKey: "themeViolet",
    swatch: [violet.primary, violet.accent, violet.bgDeep],
    colors: violet,
  },
  {
    id: "dawn",
    nameKey: "themeDawn",
    swatch: [dawn.primary, dawn.accent, dawn.bgDeep],
    colors: dawn,
  },
  {
    id: "forest",
    nameKey: "themeForest",
    swatch: [forest.primary, forest.accent, forest.bgDeep],
    colors: forest,
  },
];

export const DEFAULT_PALETTE_ID: PaletteId = "himalaya";

export function getPalette(id: PaletteId): PaletteMeta {
  return PALETTES.find((p) => p.id === id) ?? PALETTES[0];
}

/** Default export for rare static fallbacks (prefer useTheme). */
export const colors: ColorTokens = himalaya;

export const radius = {
  card: 20,
  button: 16,
  chip: 12,
  small: 8,
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
  card: {
    shadowColor: "#000000",
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
};
