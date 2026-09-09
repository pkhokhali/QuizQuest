import { getAnalytics, isSupported, logEvent } from "firebase/analytics";
import app from "../firebase";

let analyticsInstance: ReturnType<typeof getAnalytics> | null = null;

// Initialize analytics if supported in the current environment
isSupported()
  .then((supported) => {
    if (supported) {
      analyticsInstance = getAnalytics(app);
    }
  })
  .catch(() => {
    // Analytics optional in offline / native dev
  });

/**
 * Log standard Play Games / Firebase login event
 */
export function logLoginEvent(method: string = "email") {
  try {
    if (analyticsInstance) {
      logEvent(analyticsInstance, "login", { method });
    }
    console.log(`[Analytics] login event logged (method: ${method})`);
  } catch (err) {
    // ignore
  }
}

/**
 * Log standard Play Games unlock achievement event:
 * Bundle bundle = new Bundle();
 * bundle.putString(FirebaseAnalytics.Param.ACHIEVEMENT_ID, achievementId);
 * mFirebaseAnalytics.logEvent(FirebaseAnalytics.Event.UNLOCK_ACHIEVEMENT, bundle);
 */
export function logUnlockAchievement(achievementId: string) {
  try {
    if (analyticsInstance) {
      logEvent(analyticsInstance, "unlock_achievement", {
        achievement_id: achievementId,
      });
    }
    console.log(`[Analytics] unlock_achievement: ${achievementId}`);
  } catch (err) {
    // ignore
  }
}

/**
 * Log standard Play Games post score on leaderboard event:
 * Bundle bundle = new Bundle();
 * bundle.putLong(FirebaseAnalytics.Param.SCORE, score);
 * bundle.putString("leaderboard_id", leaderboardId);
 * mFirebaseAnalytics.logEvent(FirebaseAnalytics.Event.POST_SCORE, bundle);
 */
export function logPostScore(score: number, leaderboardId: string = "daily_leaderboard") {
  try {
    if (analyticsInstance) {
      logEvent(analyticsInstance, "post_score", {
        score,
        leaderboard_id: leaderboardId,
      });
    }
    console.log(`[Analytics] post_score: ${score} to ${leaderboardId}`);
  } catch (err) {
    // ignore
  }
}
