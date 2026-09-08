import express from "express";
import cors from "cors";
import http from "http";
import os from "os";
import { Server } from "socket.io";
import db from "./db.js";
import authRoutes from "./routes/auth.js";
import studentRoutes from "./routes/student.js";
import adminRoutes from "./routes/admin.js";
import { initBattle } from "./battle.js";

const app = express();
// Lock down origins in production via CORS_ORIGIN (comma-separated); "*" in dev.
const ORIGINS = (process.env.CORS_ORIGIN || "*")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
const corsOrigin = ORIGINS.includes("*") ? "*" : ORIGINS;
app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: "20mb" })); // large limit for CSV imports

app.get("/", (req, res) => {
  const questions = db.prepare("SELECT COUNT(*) c FROM questions").get().c;
  res.json({ name: "QuizQuest API", ok: true, questions });
});

app.get("/privacy", (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>QuizQuest - Privacy Policy</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background: #f8fafc; margin: 0; padding: 24px; }
    .container { max-width: 800px; margin: 0 auto; background: #ffffff; padding: 40px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
    h1 { color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; }
    h2 { color: #1e293b; margin-top: 28px; }
    ul { padding-left: 20px; }
    li { margin-bottom: 8px; }
    .badge { display: inline-block; background: #e0f2fe; color: #0284c7; padding: 4px 12px; border-radius: 999px; font-weight: 600; font-size: 13px; margin-bottom: 16px; }
    footer { margin-top: 40px; font-size: 13px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <span class="badge">Official Policy</span>
    <h1>Privacy Policy for QuizQuest</h1>
    <p><strong>Effective Date:</strong> September 8, 2026<br><strong>Last Updated:</strong> September 8, 2026</p>
    
    <p>Welcome to <strong>QuizQuest</strong>. We are committed to protecting your privacy and ensuring your personal information is handled safely, transparently, and responsibly.</p>

    <h2>1. Information We Collect</h2>
    <ul>
      <li><strong>Account Information:</strong> When you sign in or register, your authentication credentials (phone number or email) are securely managed via Google Firebase Authentication.</li>
      <li><strong>Profile & Preferences:</strong> Chosen nickname/display name, grade level (optional), avatar selection, and preferred language (English or Nepali).</li>
      <li><strong>Gameplay & Progress:</strong> Daily quiz scores, answer choices, time spent per question, streaks, XP earned, leaderboard ranking, and achievement trophies.</li>
      <li><strong>Push Notifications:</strong> Expo push tokens (if notification permission is granted) to alert you about daily quests and friend challenges.</li>
    </ul>

    <h2>2. How We Use Information</h2>
    <p>We use your information exclusively to:</p>
    <ul>
      <li>Deliver daily quizzes, multiplayer 1v1 battles, and accurate leaderboard rankings.</li>
      <li>Remember your language and display preferences.</li>
      <li>Help schools organize student learning circles when school codes are entered.</li>
      <li>Diagnose crashes and maintain server uptime.</li>
    </ul>
    <p><strong>We do NOT sell, rent, or trade your personal data to any advertisers or third-party brokers.</strong></p>

    <h2>3. Third-Party Services</h2>
    <p>QuizQuest relies on trusted industry providers:</p>
    <ul>
      <li><strong>Google Firebase:</strong> Secure authentication & identity management.</li>
      <li><strong>Expo:</strong> Mobile client updates and push notification infrastructure.</li>
      <li><strong>Backend Hosting:</strong> Secure dedicated cloud VPS server and encrypted database.</li>
    </ul>

    <h2>4. Children's Privacy (COPPA & Student Safety)</h2>
    <p>QuizQuest is family- and student-friendly. We do not require real names or physical locations, and we do not display behavioral ads. Parents or guardians can request data review or account deletion at any time.</p>

    <h2>5. Account & Data Deletion</h2>
    <p>You may request deletion of your account and all associated gameplay history at any time by tapping <strong>Delete Account</strong> in the app profile settings, or by emailing <strong>prabinkhokhali89@gmail.com</strong> with the subject line <em>"Account Deletion Request"</em>.</p>

    <h2>6. Contact Us</h2>
    <p>For any privacy inquiries or support, please contact:<br>
    <strong>Developer:</strong> Prabin Khokhali<br>
    <strong>Email:</strong> <a href="mailto:prabinkhokhali89@gmail.com">prabinkhokhali89@gmail.com</a><br>
    <strong>Website:</strong> <a href="https://prabinkhokhali.com.np/apps/4f40b1f4-d9ad-4a75-b23a-82acb617b6a1" target="_blank" rel="noopener noreferrer">https://prabinkhokhali.com.np/apps/4f40b1f4-d9ad-4a75-b23a-82acb617b6a1</a></p>

    <footer>
      &copy; 2026 QuizQuest. All rights reserved.
    </footer>
  </div>
</body>
</html>`);
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", studentRoutes);

app.use((req, res) => res.status(404).json({ error: "Not found" }));
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong" });
});

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: corsOrigin } });
initBattle(io);

const PORT = Number(process.env.PORT) || 4000;
// Bind on all interfaces so phones on the same Wi‑Fi (and Docker hosts) can connect.
const HOST = process.env.HOST || "0.0.0.0";

function lanAddresses() {
  const addrs = new Set();
  for (const ifaces of Object.values(os.networkInterfaces())) {
    for (const iface of ifaces || []) {
      if (iface.family === "IPv4" && !iface.internal) addrs.add(iface.address);
    }
  }
  return [...addrs];
}

server.listen(PORT, HOST, () => {
  console.log(`QuizQuest API + battle engine listening on http://${HOST}:${PORT}`);
  const questionCount = db.prepare("SELECT COUNT(*) c FROM questions").get().c;
  if (questionCount === 0) {
    console.warn("⚠ Question bank is empty — run `npm run seed` in server/ before students can play.");
  } else {
    console.log(`  ${questionCount.toLocaleString()} questions loaded`);
  }
  const lan = lanAddresses();
  if (lan.length) {
    console.log("LAN access:");
    for (const ip of lan) console.log(`  http://${ip}:${PORT}/`);
  }
});
