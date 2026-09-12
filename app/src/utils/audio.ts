import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import { useEffect, useState } from "react";
import { Platform, Vibration } from "react-native";

const SOUND_STORAGE_KEY = "@quizquest_sound_enabled";

const SOUND_ASSETS: Record<string, any> = {
  tap: require("../../assets/sounds/tap.wav"),
  correct: require("../../assets/sounds/correct.wav"),
  wrong: require("../../assets/sounds/wrong.wav"),
  tick: require("../../assets/sounds/tick.wav"),
  cardFlip: require("../../assets/sounds/card_flip.wav"),
  combo: require("../../assets/sounds/combo.wav"),
  victory: require("../../assets/sounds/victory.wav"),
  fanfare: require("../../assets/sounds/fanfare.wav"),
  battleStart: require("../../assets/sounds/battle_start.wav"),
  matchFound: require("../../assets/sounds/match_found.wav"),
  star: require("../../assets/sounds/star.wav"),
};

// Calibrated gain staging (0.0 to 1.0) for balanced acoustic master mix
const GAIN_STAGING: Record<string, number> = {
  tap: 0.55,
  tick: 0.35,
  cardFlip: 0.6,
  correct: 0.85,
  wrong: 0.75,
  combo: 0.9,
  victory: 0.95,
  fanfare: 0.9,
  battleStart: 0.95,
  matchFound: 0.85,
  star: 0.75,
};

// Number of polyphonic voice channels per fast-trigger sound
const VOICE_POOL_SIZE: Record<string, number> = {
  tap: 3,
  cardFlip: 3,
  tick: 2,
  star: 2,
  correct: 2,
};

let soundEnabled = true;
const listeners = new Set<(enabled: boolean) => void>();

// Multi-voice player pools: key -> array of audio players
const playerPools: Record<string, any[]> = {};
const poolIndices: Record<string, number> = {};

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
    // Non-fatal if restricted on web / sandbox
  }
}

// Initialize sound setting from AsyncStorage
AsyncStorage.getItem(SOUND_STORAGE_KEY)
  .then((val) => {
    if (val !== null) {
      soundEnabled = val === "true";
      notifyListeners();
    }
  })
  .catch(() => {});

function notifyListeners() {
  listeners.forEach((listener) => listener(soundEnabled));
}

function getNextPlayer(key: string) {
  const asset = SOUND_ASSETS[key];
  if (!asset) return null;

  const poolSize = VOICE_POOL_SIZE[key] || 1;
  if (!playerPools[key]) {
    playerPools[key] = [];
    poolIndices[key] = 0;
  }

  const pool = playerPools[key];
  let idx = poolIndices[key] || 0;

  // Initialize player if not yet instantiated for this voice slot
  if (!pool[idx]) {
    try {
      const player = createAudioPlayer(asset);
      try {
        player.volume = GAIN_STAGING[key] ?? 0.8;
      } catch {}
      pool[idx] = player;
    } catch {
      return null;
    }
  }

  const player = pool[idx];
  // Cycle round-robin index for next trigger
  poolIndices[key] = (idx + 1) % poolSize;
  return player;
}

async function playSoundSafely(key: string) {
  if (!soundEnabled) return;
  try {
    await ensureAudioMode();
    const player = getNextPlayer(key);
    if (player) {
      if (typeof player.seekTo === "function") {
        try {
          await player.seekTo(0);
        } catch {}
      }
      player.play();
    }
  } catch {
    // Silent catch so game logic never breaks if device audio daemon fails
  }
}

/** Pre-warm core sounds into memory for zero initial latency */
export function prewarmAudio() {
  if (Platform.OS === "web") return;
  setTimeout(() => {
    try {
      ensureAudioMode();
      ["tap", "correct", "cardFlip", "tick"].forEach((key) => {
        getNextPlayer(key);
      });
    } catch {}
  }, 500);
}

// Automatically trigger background pre-warm
prewarmAudio();

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

  /** Crisp wooden/glass tactile UI tap */
  playTap: () => {
    playSoundSafely("tap");
    try {
      if (Platform.OS !== "web") {
        Vibration.vibrate(8);
      }
    } catch {}
  },

  /** Bright major-9th chord chime */
  playCorrect: () => {
    playSoundSafely("correct");
    try {
      if (Platform.OS !== "web") {
        Vibration.vibrate(22);
      }
    } catch {}
  },

  /** Warm, rounded low-frequency wobble */
  playWrong: () => {
    playSoundSafely("wrong");
    try {
      if (Platform.OS !== "web") {
        Vibration.vibrate([0, 40, 30, 40]);
      }
    } catch {}
  },

  /** Precision clock/metronome tick */
  playTick: () => {
    playSoundSafely("tick");
    try {
      if (Platform.OS !== "web") {
        Vibration.vibrate(10);
      }
    } catch {}
  },

  /** Organic card/tile flip snap */
  playCardFlip: () => {
    playSoundSafely("cardFlip");
    try {
      if (Platform.OS !== "web") {
        Vibration.vibrate(12);
      }
    } catch {}
  },

  /** Ascending 5-tone pentatonic power combo */
  playCombo: () => {
    playSoundSafely("combo");
    try {
      if (Platform.OS !== "web") {
        Vibration.vibrate(35);
      }
    } catch {}
  },

  /** Triumphant brass & bell victory fanfare */
  playVictory: () => {
    playSoundSafely("victory");
    try {
      if (Platform.OS !== "web") {
        Vibration.vibrate([0, 50, 40, 60, 40, 110]);
      }
    } catch {}
  },

  /** Grand magical celebration chime for streaks / achievements */
  playFanfare: () => {
    playSoundSafely("fanfare");
    try {
      if (Platform.OS !== "web") {
        Vibration.vibrate([0, 40, 30, 60, 40, 90]);
      }
    } catch {}
  },

  /** Cinematic war drum & clash for battle start */
  playBattleStart: () => {
    playSoundSafely("battleStart");
    try {
      if (Platform.OS !== "web") {
        Vibration.vibrate([0, 50, 40, 70]);
      }
    } catch {}
  },

  /** Dual-tone sonar alert for matchmaking */
  playMatchFound: () => {
    playSoundSafely("matchFound");
    try {
      if (Platform.OS !== "web") {
        Vibration.vibrate([0, 30, 40, 30]);
      }
    } catch {}
  },

  /** Crystal glockenspiel ding for star reveal */
  playStar: () => {
    playSoundSafely("star");
    try {
      if (Platform.OS !== "web") {
        Vibration.vibrate(15);
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
