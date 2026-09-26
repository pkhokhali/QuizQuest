import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ColorTokens,
  DEFAULT_PALETTE_ID,
  PaletteId,
  getPalette,
} from "../theme";

const PALETTE_KEY = "qq_palette";

type ThemeContextValue = {
  paletteId: PaletteId;
  colors: ColorTokens;
  isLight: boolean;
  setPaletteId: (id: PaletteId) => void;
  toggleLightDark: () => void;
  ready: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [paletteId, setPaletteIdState] = useState<PaletteId>(DEFAULT_PALETTE_ID);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(PALETTE_KEY);
        if (
          saved === "light" ||
          saved === "solar" ||
          saved === "midnight" ||
          saved === "cyber" ||
          saved === "simrik" ||
          saved === "himalaya" ||
          saved === "violet" ||
          saved === "dawn" ||
          saved === "forest"
        ) {
          setPaletteIdState(saved as PaletteId);
        }
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const setPaletteId = useCallback((id: PaletteId) => {
    setPaletteIdState(id);
    void AsyncStorage.setItem(PALETTE_KEY, id);
  }, []);

  const toggleLightDark = useCallback(() => {
    setPaletteIdState((prev) => {
      const active = getPalette(prev);
      const nextId: PaletteId = active.colors.isLight ? "midnight" : "light";
      void AsyncStorage.setItem(PALETTE_KEY, nextId);
      return nextId;
    });
  }, []);

  const currentPalette = useMemo(() => getPalette(paletteId), [paletteId]);

  const value = useMemo(
    () => ({
      paletteId,
      colors: currentPalette.colors,
      isLight: currentPalette.colors.isLight,
      setPaletteId,
      toggleLightDark,
      ready,
    }),
    [paletteId, currentPalette, setPaletteId, toggleLightDark, ready]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
