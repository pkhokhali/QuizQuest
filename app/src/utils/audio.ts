import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import { useEffect, useState } from "react";
import { Platform, Vibration } from "react-native";

const SOUND_STORAGE_KEY = "@quizquest_sound_enabled";

const SOUND_ASSETS: Record<string, any> = {
  correct: require("../../assets/sounds/correct.wav"),
  wrong: require("../../assets/sounds/wrong.wav"),
  tick: require("../../assets/sounds/tick.wav"),
  cardFlip: require("../../assets/sounds/card_flip.wav"),
  victory: require("../../assets/sounds/victory.wav"),
  combo: require("../../assets/sounds/combo.wav"),
};

let soundEnabled = true;
const listeners = new Set<(enabled: boolean) => void>();

// Configure audio mode on app load
let audioModeConfigured = false;
async function ensureAudioMode() {
  if (audioModeConfigured) return;
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
    });
    audioModeConfigured = true;
  } catch {
    // Non-fatal if audio mode is restricted
  }
}

// Initialize sound setting from AsyncStorage
AsyncStorage.getItem(SOUND_STORAGE_KEY).then((val) => {
  if (val !== null) {
    soundEnabled = val === "true";
    notifyListeners();
  }
}).catch(() => {});

function notifyListeners() {
  listeners.forEach((listener) => listener(soundEnabled));
}

// Cached players for each sound
const playerCache: Record<string, any> = {};

function getOrInitPlayer(key: string) {
  const asset = SOUND_ASSETS[key];
  if (!asset) return null;

  if (!playerCache[key]) {
    try {
      playerCache[key] = createAudioPlayer(asset);
    } catch {
      playerCache[key] = null;
    }
  }
  return playerCache[key];
}

async function playSoundSafely(key: string) {
  if (!soundEnabled) return;
  try {
    await ensureAudioMode();
    const player = getOrInitPlayer(key);
    if (player) {
      if (typeof player.seekTo === "function") {
        try {
          await player.seekTo(0);
        } catch {}
      }
      player.play();
    }
  } catch {
    // Re-create player on next play if current failed
    try {
      if (playerCache[key]?.remove) {
        playerCache[key].remove();
      }
    } catch {}
    delete playerCache[key];
  }
}

export const SoundEffects = {
  isSoundEnabled: () => soundEnabled,

  setSoundEnabled: async (enabled: boolean) => {
    soundEnabled = enabled;
    notifyListeners();
    try {
      await AsyncStorage.setItem(SOUND_STORAGE_KEY, enabled ? "true" : "false");
    } catch {}
  },

  toggleSound: async () => {
    soundEnabled = !soundEnabled;
    notifyListeners();
    try {
      await AsyncStorage.setItem(SOUND_STORAGE_KEY, soundEnabled ? "true" : "false");
    } catch {}
    return soundEnabled;
  },

  addListener: (listener: (enabled: boolean) => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  playCorrect: () => {
    playSoundSafely("correct");
    try {
      if (Platform.OS !== "web") {
        Vibration.vibrate(30);
      }
    } catch {}
  },

  playWrong: () => {
    playSoundSafely("wrong");
    try {
      if (Platform.OS !== "web") {
        Vibration.vibrate([0, 50, 40, 50]);
      }
    } catch {}
  },

  playTick: () => {
    playSoundSafely("tick");
    try {
      if (Platform.OS !== "web") {
        Vibration.vibrate(12);
      }
    } catch {}
  },

  playCardFlip: () => {
    playSoundSafely("cardFlip");
    try {
      if (Platform.OS !== "web") {
        Vibration.vibrate(15);
      }
    } catch {}
  },

  playVictory: () => {
    playSoundSafely("victory");
    try {
      if (Platform.OS !== "web") {
        Vibration.vibrate([0, 60, 60, 100, 60, 140]);
      }
    } catch {}
  },

  playCombo: () => {
    playSoundSafely("combo");
    try {
      if (Platform.OS !== "web") {
        Vibration.vibrate(40);
      }
    } catch {}
  },
};

/** React hook to reactively track and toggle sound across any screen */
export function useSoundEnabled() {
  const [enabled, setEnabled] = useState(soundEnabled);

  useEffect(() => {
    setEnabled(SoundEffects.isSoundEnabled());
    return SoundEffects.addListener((val) => {
      setEnabled(val);
    });
  }, []);

  return {
    isSoundEnabled: enabled,
    toggleSound: SoundEffects.toggleSound,
    setSoundEnabled: SoundEffects.setSoundEnabled,
  };
}
