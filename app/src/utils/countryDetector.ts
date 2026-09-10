/**
 * Intelligently detects user's country from device timezone and locale.
 * Supports: nepal, india, usa, uk, japan, australia, china, global.
 */
export function detectUserCountry(): string {
  try {
    // 1. Check device timezone
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    const lowerTz = tz.toLowerCase();

    if (lowerTz.includes("kathmandu")) return "nepal";
    if (lowerTz.includes("kolkata") || lowerTz.includes("calcutta")) return "india";
    if (
      lowerTz.startsWith("america/") ||
      lowerTz.includes("new_york") ||
      lowerTz.includes("los_angeles") ||
      lowerTz.includes("chicago") ||
      lowerTz.includes("denver")
    ) {
      return "usa";
    }
    if (lowerTz.includes("london") || lowerTz.includes("belfast")) return "uk";
    if (lowerTz.includes("tokyo")) return "japan";
    if (lowerTz.startsWith("australia/") || lowerTz.includes("sydney") || lowerTz.includes("melbourne")) {
      return "australia";
    }
    if (lowerTz.includes("shanghai") || lowerTz.includes("beijing") || lowerTz.includes("hong_kong")) {
      return "china";
    }

    // 2. Check locale region code (e.g. "en-NP", "hi-IN", "en-US", "en-GB", "ja-JP")
    const locale = Intl.DateTimeFormat().resolvedOptions().locale || "";
    const region = locale.split("-")[1]?.toUpperCase() || "";

    const regionMap: Record<string, string> = {
      NP: "nepal",
      IN: "india",
      US: "usa",
      GB: "uk",
      UK: "uk",
      JP: "japan",
      AU: "australia",
      CN: "china",
    };

    if (regionMap[region]) {
      return regionMap[region];
    }
  } catch {
    // Fallback on error
  }

  // Default to nepal as requested by user
  return "nepal";
}
