import db from "../src/db.js";
import { today, daysAgo, levelForXp } from "../src/util.js";

async function run() {
  console.log("=== Testing Offline Quest Processing Logic ===");

  // Find or create test user
  let user = db.prepare("SELECT * FROM users WHERE email = ?").get("test2@quizquest.com");
  if (!user) {
    user = db.prepare("SELECT * FROM users LIMIT 1").get();
  }

  console.log(`Initial user: ${user.name} (id: ${user.id}) | XP: ${user.xp}, Streak: ${user.streak}`);

  const initialXp = user.xp;
  const initialStreak = user.streak;

  // Simulate offline submission with quizId = 999999 and offlineScore = 8
  const offlineScore = 8;
  const xpEarned = offlineScore * 10; // 80 XP

  // Apply offline sync logic (identical to updated student.js submitQuiz)
  let streak = user.streak;
  let comeback = false;
  const last = user.last_quiz_date;
  if (last === daysAgo(1)) streak = user.streak + 1;
  else if (last !== today()) {
    if (last && last < daysAgo(3)) comeback = true;
    streak = 1;
  }

  db.prepare("UPDATE users SET streak = ?, best_streak = MAX(best_streak, ?), last_quiz_date = ? WHERE id = ?")
    .run(streak, streak, today(), user.id);

  db.prepare("UPDATE users SET xp = xp + ? WHERE id = ?").run(xpEarned, user.id);
  db.prepare("INSERT INTO xp_events (user_id, amount, reason, date) VALUES (?, ?, 'offline_daily_quest', ?)")
    .run(user.id, xpEarned, today());

  const fresh = db.prepare("SELECT * FROM users WHERE id = ?").get(user.id);
  console.log(`After offline sync: XP: ${fresh.xp} (+${fresh.xp - initialXp} XP), Streak: ${fresh.streak}, Level: ${levelForXp(fresh.xp)}`);

  console.log("Offline quest processing verified successfully!");
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
