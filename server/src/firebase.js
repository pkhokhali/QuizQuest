import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getMessaging } from "firebase-admin/messaging";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import db from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (!getApps().length) {
  let saRaw = process.env.FIREBASE_SERVICE_ACCOUNT;
  
  // Local development fallback: if env var isn't set, try reading server/.env
  if (!saRaw) {
    const envPath = path.join(__dirname, "..", ".env");
    if (fs.existsSync(envPath)) {
      try {
        const envContent = fs.readFileSync(envPath, "utf8");
        const match = envContent.match(/FIREBASE_SERVICE_ACCOUNT=(.*)/s);
        if (match) {
          saRaw = match[1].trim();
        }
      } catch (e) {
        // ignore
      }
    }
  }

  if (saRaw) {
    try {
      saRaw = saRaw.trim();
      if ((saRaw.startsWith("'") && saRaw.endsWith("'")) || (saRaw.startsWith('"') && saRaw.endsWith('"'))) {
        saRaw = saRaw.slice(1, -1);
      }
      const serviceAccount = JSON.parse(saRaw);
      initializeApp({
        credential: cert(serviceAccount)
      });
      console.log("Firebase Admin SDK initialized.");
    } catch (err) {
      console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT:", err);
    }
  } else {
    console.warn("FIREBASE_SERVICE_ACCOUNT env variable is not set. Token verification may fail without credentials.");
    initializeApp({
      projectId: "quizquest-c1b37"
    });
  }
}

export async function sendPushNotification(userId, title, body) {
  if (!getApps().length) return; // Ensure admin is initialized
  
  try {
    const rows = db.prepare("SELECT token FROM push_tokens WHERE user_id = ?").all(userId);
    if (!rows.length) return;
    
    const messages = rows.map(r => ({
      token: r.token,
      notification: { title, body },
    }));
    
    await getMessaging().sendEach(messages);
  } catch (err) {
    console.error("Push Notification Error:", err);
  }
}

export default {
  auth: () => getAuth()
};
