import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

export const API_BASE_KEY = "qq_api_base";

/** URL compiled into the app at build time (Gradle / Expo). */
export function getBuiltInBaseUrl(): string {
  const extra = Constants.expoConfig?.extra as { apiUrl?: string } | undefined;
  const fromExtra = extra?.apiUrl?.trim();
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();
  const url = fromExtra || fromEnv || "http://localhost:4000";
  return url.replace(/\/$/, "");
}

/** Saved on the login screen — overrides the baked-in URL (same-Wi‑Fi testing). */
export async function getBaseUrl(): Promise<string> {
  const override = await AsyncStorage.getItem(API_BASE_KEY);
  if (override?.trim()) return override.trim().replace(/\/$/, "");
  return getBuiltInBaseUrl();
}

export async function setBaseUrl(url: string): Promise<void> {
  const trimmed = url.trim().replace(/\/$/, "");
  if (trimmed) await AsyncStorage.setItem(API_BASE_KEY, trimmed);
  else await AsyncStorage.removeItem(API_BASE_KEY);
}

/** @deprecated use getBaseUrl() — kept for imports that only need the default */
export const BASE_URL = getBuiltInBaseUrl();
