import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import { useEffect, useState } from "react";
import { Image, NativeModules, Platform, Vibration } from "react-native";

const { NativeSoundModule } = NativeModules;
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
  tap: 0.7,
  tick: 0.5,
  cardFlip: 0.75,
  correct: 0.95,
  wrong: 0.85,
  combo: 0.95,
  victory: 1.0,
  fanfare: 0.95,
  battleStart: 1.0,
  matchFound: 0.9,
  star: 0.85,
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
export async function ensureAudioMode() {
  if (audioModeConfigured) return;
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: "mixWithOthers",
      shouldPlayInBackground: false,
    });
    audioModeConfigured = true;
  } catch {
    // Non-fatal if restricted on web / sandbox
  }
}

// Initialize audio mode immediately
ensureAudioMode().catch(() => {});

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

/**
 * Resolves static required assets into a format directly loadable by native audio engines
 * (e.g. android raw resource identifiers or local asset URIs in release builds).
 */
function getAudioSource(assetSource: any): any {
  if (typeof assetSource === "number") {
    try {
      const resolved = Image.resolveAssetSource(assetSource);
      if (resolved?.uri) {
        if (resolved.uri.startsWith("http")) {
          return { uri: resolved.uri };
        }
        const cleanName = resolved.uri.replace(/\.[^/.]+$/, "");
        const rawName = cleanName.startsWith("assets_") ? cleanName : `assets_${cleanName}`;
        return { uri: rawName };
      }
    } catch {}
  }
  return assetSource;
}

function getNextPlayer(key: string) {
  const assetSource = SOUND_ASSETS[key];
  if (!assetSource) return null;

  if (!playerPools[key]) {
    playerPools[key] = [];
    poolIndices[key] = 0;
  }

  const pool = playerPools[key];
  if (!pool[0]) {
    try {
      const source = getAudioSource(assetSource);
      const player = createAudioPlayer(source, {
        keepAudioSessionActive: false,
      });

      try {
        player.volume = GAIN_STAGING[key] ?? 0.8;
      } catch {}

      pool[0] = player;
    } catch {
      return null;
    }
  }

  return pool[0];
}

function playSoundSafely(key: string) {
  if (!soundEnabled) return;
  const volume = GAIN_STAGING[key] ?? 0.8;

  // 1. Ultra-fast zero-latency Android native SoundPool
  if (Platform.OS === "android" && NativeSoundModule && typeof NativeSoundModule.play === "function") {
    try {
      NativeSoundModule.play(key, volume);
      return;
    } catch {}
  }

  // 2. Fallback to expo-audio for other platforms / dev
  try {
    ensureAudioMode().catch(() => {});
    const player = getNextPlayer(key);
    if (player) {
      try {
        if (typeof player.seekTo === "function") {
          player.seekTo(0).catch(() => {});
        }
      } catch {}
      player.play();
    }
  } catch {
    // Silent catch so game logic never breaks if device audio daemon fails
  }
}

/** Pre-warm native sound pool on boot without freezing audio thread */
export function prewarmAudio() {
  if (Platform.OS === "android" && NativeSoundModule && typeof NativeSoundModule.preload === "function") {
    try {
      NativeSoundModule.preload();
    } catch {}
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

  /** Zip Game: Subtle tactile pop on advancing one cell */
  playZipPop: () => {
    playSoundSafely("tick");
    try {
      if (Platform.OS !== "web") {
        Vibration.vibrate(8);
      }
    } catch {}
  },

  /** Zip Game: Fluid zip/whoosh sound on rubber-band retracting path */
  playZipRetract: () => {
    playSoundSafely("cardFlip");
    try {
      if (Platform.OS !== "web") {
        Vibration.vibrate(14);
      }
    } catch {}
  },

  /** Zip Game: Ascending bell chime upon reaching ordered checkpoint */
  playZipCheckpoint: () => {
    playSoundSafely("star");
    try {
      if (Platform.OS !== "web") {
        Vibration.vibrate(28);
      }
    } catch {}
  },

  /** Zip Game: Muted barrier bump when hitting wall or invalid move */
  playZipWallHit: () => {
    playSoundSafely("wrong");
    try {
      if (Platform.OS !== "web") {
        Vibration.vibrate(18);
      }
    } catch {}
  },

  /** Zip Game: Grand victory fanfare when path is 100% complete */
  playZipSolve: () => {
    playSoundSafely("victory");
    try {
      if (Platform.OS !== "web") {
        Vibration.vibrate([0, 50, 40, 70, 40, 120]);
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
