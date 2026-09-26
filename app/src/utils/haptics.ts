import { Platform, Vibration } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const HAPTICS_STORAGE_KEY = "@quizquest_haptics_enabled";

let hapticsEnabled = true;

// Initialize setting from AsyncStorage on app launch
AsyncStorage.getItem(HAPTICS_STORAGE_KEY)
  .then((val) => {
    if (val !== null) {
      hapticsEnabled = val === "true";
    }
  })
  .catch(() => {});

function vibrateSafely(pattern: number | number[]) {
  if (!hapticsEnabled) return;
  try {
    if (Platform.OS === "android" || Platform.OS === "ios") {
      Vibration.vibrate(pattern);
    }
  } catch {
    // Graceful fallback if device lacks motor or is in silent restrictions
  }
}

export const Haptics = {
  isEnabled: () => hapticsEnabled,

  setEnabled: async (enabled: boolean) => {
    hapticsEnabled = enabled;
    try {
      await AsyncStorage.setItem(HAPTICS_STORAGE_KEY, enabled ? "true" : "false");
    } catch {}
  },

  toggle: async () => {
    hapticsEnabled = !hapticsEnabled;
    try {
      await AsyncStorage.setItem(HAPTICS_STORAGE_KEY, hapticsEnabled ? "true" : "false");
    } catch {}
    return hapticsEnabled;
  },

  /** Ultra-short subtle tap for button clicks & menu selections (10ms) */
  tap: () => {
    vibrateSafely(10);
  },

  /** Crisp checkpoint/cell hit in Zip and Word Search (16ms) */
  checkpoint: () => {
    vibrateSafely(16);
  },

  /** Double-tick pulse for correct quiz answers & found words */
  correct: () => {
    vibrateSafely([0, 15, 50, 25]);
  },

  /** Alert buzz for wrong quiz answers or invalid grid moves */
  wrong: () => {
    vibrateSafely([0, 35, 45, 35]);
  },

  /** Rapid combo pulse when chaining speed bonuses */
  combo: () => {
    vibrateSafely([0, 12, 35, 18, 35, 24]);
  },

  /** Celebratory rumble when clearing a puzzle or winning a 1v1 battle */
  victory: () => {
    vibrateSafely([0, 25, 60, 40, 60, 70]);
  },
};
