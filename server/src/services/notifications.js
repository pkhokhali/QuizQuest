import db from "../db.js";
import { getApps } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

/**
 * Sends push notifications to Expo Push service in batches of up to 100.
 */
async function sendExpoPushNotifications(messages) {
  if (!messages.length) return { success: 0, failed: 0 };
  let success = 0;
  let failed = 0;

  // Expo recommends batches of 100 messages max
  const BATCH_SIZE = 100;
  for (let i = 0; i < messages.length; i += BATCH_SIZE) {
    const batch = messages.slice(i, i + BATCH_SIZE);
    try {
      const res = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(batch),
      });
      const data = await res.json();
      if (data && Array.isArray(data.data)) {
        for (const item of data.data) {
          if (item.status === "ok") success++;
          else failed++;
        }
      } else {
        success += batch.length;
      }
    } catch (err) {
      console.error("Expo push notification send error:", err);
      failed += batch.length;
    }
  }
  return { success, failed };
}

/**
 * Sends notifications via Firebase Admin SDK if FCM tokens are detected.
 */
async function sendFcmNotifications(messages) {
  if (!messages.length || !getApps().length) return { success: 0, failed: 0 };
  let success = 0;
  let failed = 0;

  try {
    const response = await getMessaging().sendEach(messages);
    success += response.successCount;
    failed += response.failureCount;
  } catch (err) {
    console.error("FCM push send error:", err);
    failed += messages.length;
  }

  return { success, failed };
}

/**
 * Broadcasts a push notification to all users or filtered by grade band / country.
 * @param {Object} options
 * @param {string} options.title
 * @param {string} options.body
 * @param {Object} [options.data]
 * @param {string} [options.gradeBand] - e.g. "1-5", "6-8", "9-10"
 * @param {string} [options.country]
 */
export async function broadcastPushNotification({ title, body, data = {}, gradeBand, country }) {
  let query = `
    SELECT pt.token, u.id as user_id, u.grade, u.home_country
    FROM push_tokens pt
    JOIN users u ON pt.user_id = u.id
    WHERE pt.token IS NOT NULL AND pt.token != ''
  `;
  const params = [];

  if (country) {
    query += " AND u.home_country = ?";
    params.push(country);
  }

  const rows = db.prepare(query).all(...params);

  // Filter in memory for grade bands if specified
  const filteredRows = rows.filter((r) => {
    if (!gradeBand) return true;
    const g = r.grade || 8;
    if (gradeBand === "1-5" && g >= 1 && g <= 5) return true;
    if (gradeBand === "6-8" && g >= 6 && g <= 8) return true;
    if (gradeBand === "9-10" && g >= 9 && g <= 10) return true;
    return false;
  });

  if (!filteredRows.length) {
    return { total: 0, success: 0, failed: 0 };
  }

  const expoMessages = [];
  const fcmMessages = [];

  for (const row of filteredRows) {
    const t = row.token.trim();
    if (t.startsWith("ExponentPushToken") || t.startsWith("ExpoPushToken")) {
      expoMessages.push({
        to: t,
        sound: "default",
        title,
        body,
        data,
      });
    } else {
      fcmMessages.push({
        token: t,
        notification: { title, body },
        data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
      });
    }
  }

  const [expoRes, fcmRes] = await Promise.all([
    sendExpoPushNotifications(expoMessages),
    sendFcmNotifications(fcmMessages),
  ]);

  return {
    total: filteredRows.length,
    success: expoRes.success + fcmRes.success,
    failed: expoRes.failed + fcmRes.failed,
  };
}

/**
 * Pushes a daily digest notification for students.
 */
export async function pushDigestNotification({ digest, isManual = false, adminEmail = "auto_scheduler" }) {
  if (!digest) throw new Error("No digest provided to push");

  const title = digest.headlineNe
    ? `☀️ QuizQuest: ${digest.headlineEn}`
    : "☀️ Your Daily Quiz Quest Digest is Ready!";
  
  const body = digest.nepalFactEn
    ? `🏔️ Nepal Fact: ${digest.nepalFactEn.slice(0, 85)}... Tap to play!`
    : digest.gkFactEn
    ? `💡 Daily GK: ${digest.gkFactEn.slice(0, 85)}... Tap to play!`
    : "Today's 3 things & daily quest are live. Level up your streak now!";

  const res = await broadcastPushNotification({
    title,
    body,
    data: {
      type: "daily_digest",
      digestId: digest.id,
      date: digest.date,
      gradeBand: digest.gradeBand,
    },
    gradeBand: digest.gradeBand,
  });

  // Record push in database
  db.prepare(`
    UPDATE digests
    SET pushed_at = datetime('now'),
        push_count = COALESCE(push_count, 0) + 1,
        last_pushed_by = ?
    WHERE id = ?
  `).run(adminEmail, digest.id);

  return {
    ...res,
    pushedAt: new Date().toISOString(),
    isManual,
  };
}
