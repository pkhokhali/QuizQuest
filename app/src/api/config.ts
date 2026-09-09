import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

export const API_BASE_KEY = "qq_api_base";

export const PRODUCTION_API_URL = "https://quiz.prabinkhokhali.com.np";

/** URL compiled into the app at build time (Gradle / Expo), falling back to production. */
export function getBuiltInBaseUrl(): string {
  const extra = Constants.expoConfig?.extra as { apiUrl?: string } | undefined;
  const fromExtra = extra?.apiUrl?.trim();
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();
  const url = fromExtra || fromEnv || PRODUCTION_API_URL;
  return url.replace(/\/$/, "");
}

/** 
 * Returns the stable production server URL.
 * Automatically purges any obsolete server override in local storage.
 */
export async function getBaseUrl(): Promise<string> {
  const override = await AsyncStorage.getItem(API_BASE_KEY);
  if (override) {
    // Purge any legacy stored server override from earlier versions
    await AsyncStorage.removeItem(API_BASE_KEY);
  }
  return getBuiltInBaseUrl();
}

export async function setBaseUrl(url?: string): Promise<void> {
  // Server is locked to production; ensure legacy key is cleared
  await AsyncStorage.removeItem(API_BASE_KEY);
}

/** @deprecated use getBaseUrl() — kept for imports that only need the default */
export const BASE_URL = getBuiltInBaseUrl();

