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

/** Classic violet quest — familiar QuizQuest look, refined. */
const violet: ColorTokens = {
  primary: "#6D28D9",
  primaryDark: "#4C1D95",
  primarySoft: "#EDE9FE",
  accent: "#F97316",
  accentSoft: "#FFEDD5",
  bg: "#F5F0FB",
  bgMid: "#E9DFF7",
  bgDeep: "#C4B5FD",
  card: "#FFFFFF",
  cream: "#FFF8EF",
  text: "#2D2440",
  textMuted: "#7C7196",
  textOnPrimary: "#FFFFFF",
  green: "#16A34A",
  greenSoft: "#DCFCE7",
  amber: "#F59E0B",
  amberSoft: "#FEF3C7",
  border: "#E8E0F4",
  gold: "#FBBF24",
  silver: "#CBD5E1",
  bronze: "#D6A26C",
  danger: "#DC2626",
  dangerSoft: "#FEE2E2",
};

/** Himalayan morning — indigo sky, saffron, mist teal. */
const himalaya: ColorTokens = {
  primary: "#1E3A5F",
  primaryDark: "#0F2744",
  primarySoft: "#D6E4F0",
  accent: "#E8A317",
  accentSoft: "#FFF1C9",
  bg: "#F2F6F8",
  bgMid: "#DCE8EF",
  bgDeep: "#8FB4C9",
  card: "#FFFFFF",
  cream: "#FFF8E8",
  text: "#1A2B3C",
  textMuted: "#5C7388",
  textOnPrimary: "#FFFFFF",
  green: "#0D9488",
  greenSoft: "#CCFBF1",
  amber: "#E8A317",
  amberSoft: "#FEF3C7",
  border: "#D3E0EA",
  gold: "#E8A317",
  silver: "#94A3B8",
  bronze: "#C4894A",
  danger: "#B91C1C",
  dangerSoft: "#FEE2E2",
};

/** Dawn trail — coral rose, slate ink, soft apricot light. */
const dawn: ColorTokens = {
  primary: "#C45C4A",
  primaryDark: "#8F3A2E",
  primarySoft: "#FCE8E4",
  accent: "#2F4858",
  accentSoft: "#D9E4EA",
  bg: "#FFF6F1",
  bgMid: "#F8E0D6",
  bgDeep: "#E8B4A4",
  card: "#FFFFFF",
  cream: "#FFF1E6",
  text: "#2A2420",
  textMuted: "#8A7368",
  textOnPrimary: "#FFFFFF",
  green: "#3D8B6E",
  greenSoft: "#D1FAE5",
  amber: "#D97706",
  amberSoft: "#FEF3C7",
  border: "#F0DDD4",
  gold: "#E0A84A",
  silver: "#B8C0C8",
  bronze: "#C4894A",
  danger: "#B91C1C",
  dangerSoft: "#FEE2E2",
};

/** Forest climb — pine canopy, moss, lantern gold. */
const forest: ColorTokens = {
  primary: "#1F4D3A",
  primaryDark: "#123226",
  primarySoft: "#D7EBE2",
  accent: "#D4A017",
  accentSoft: "#FFF3C4",
  bg: "#F3F7F4",
  bgMid: "#D8E8DE",
  bgDeep: "#7BA892",
  card: "#FFFFFF",
  cream: "#FFF9E8",
  text: "#1C2E26",
  textMuted: "#5F756A",
  textOnPrimary: "#FFFFFF",
  green: "#2F8F5B",
  greenSoft: "#DCFCE7",
  amber: "#D4A017",
  amberSoft: "#FEF3C7",
  border: "#D5E5DB",
  gold: "#D4A017",
  silver: "#A8B5AE",
  bronze: "#B8894A",
  danger: "#B91C1C",
  dangerSoft: "#FEE2E2",
};

export const PALETTES: PaletteMeta[] = [
  {
    id: "violet",
    nameKey: "themeViolet",
    swatch: [violet.primary, violet.accent, violet.bgDeep],
    colors: violet,
  },
  {
    id: "himalaya",
    nameKey: "themeHimalaya",
    swatch: [himalaya.primary, himalaya.accent, himalaya.green],
    colors: himalaya,
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
  return PALETTES.find((p) => p.id === id) ?? PALETTES[1];
}

/** Default export for rare static fallbacks (prefer useTheme). */
export const colors: ColorTokens = himalaya;

export const radius = {
  card: 22,
  button: 20,
  chip: 18,
  small: 12,
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
    shadowColor: "#0F2744",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
};
