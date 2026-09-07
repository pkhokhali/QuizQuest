import { Router } from "express";
import db from "../db.js";
import { signToken } from "../auth.js";
import { serializeUser } from "../util.js";
import admin from "../firebase.js";

const router = Router();
const DEV_OTP = "123456";
const IS_PROD = process.env.NODE_ENV === "production";
const OTP_TTL_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;

// In-memory OTP store: phone -> { code, expires, attempts }.
// Swap for Redis + a real SMS provider (e.g. Sparrow) in a scaled deployment.
const otpStore = new Map();

function issueCode(phone) {
  // Dev/LAN keeps the fixed code so testing stays easy; prod generates a random one.
  const code = IS_PROD ? String(Math.floor(100000 + Math.random() * 900000)) : DEV_OTP;
  otpStore.set(phone, { code, expires: Date.now() + OTP_TTL_MS, attempts: 0 });
  return code;
}

router.post("/request-otp", (req, res) => {
  const phone = String(req.body.phone || "").replace(/\D/g, "");
  if (phone.length < 7) return res.status(400).json({ error: "Enter a valid phone number" });
  const code = issueCode(phone);
  // TODO(prod): deliver `code` via SMS provider instead of returning it.
  const body = { ok: true };
  if (!IS_PROD) body.devCode = code;
  res.json(body);
});

router.post("/verify", (req, res) => {
  const phone = String(req.body.phone || "").replace(/\D/g, "");
  const code = String(req.body.code || "");
  if (phone.length < 7) return res.status(400).json({ error: "Enter a valid phone number" });

  const entry = otpStore.get(phone);
  // Non-prod fallback: accept the fixed dev code even without a prior request-otp.
  const devOk = !IS_PROD && code === DEV_OTP;

  if (!devOk) {
    if (!entry) return res.status(400).json({ error: "Request a code first" });
    if (Date.now() > entry.expires) {
      otpStore.delete(phone);
      return res.status(400).json({ error: "That code expired — request a new one" });
    }
    if (entry.attempts >= MAX_ATTEMPTS) {
      otpStore.delete(phone);
      return res.status(429).json({ error: "Too many tries — request a new code" });
    }
    if (code !== entry.code) {
      entry.attempts += 1;
      return res.status(400).json({ error: "That code didn't match — try again" });
    }
  }
  otpStore.delete(phone);

  let user = db.prepare("SELECT * FROM users WHERE phone = ?").get(phone);
  const isNew = !user;
  if (!user) {
    const name = typeof req.body.name === "string" ? req.body.name.slice(0, 60) : "";
    const info = db.prepare("INSERT INTO users (phone, name) VALUES (?, ?)").run(phone, name);
    user = db.prepare("SELECT * FROM users WHERE id = ?").get(info.lastInsertRowid);
  }
  res.json({ token: signToken(user), user: serializeUser(user), isNew });
});

router.post("/verify-firebase", async (req, res) => {
  const idToken = req.body.token;
  if (!idToken) return res.status(400).json({ error: "No Firebase token provided" });

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const email = decodedToken.email;
    if (!email) return res.status(400).json({ error: "Firebase user must have an email" });
    
    // We repurpose the "phone" column to store the email to avoid a database schema migration
    let user = db.prepare("SELECT * FROM users WHERE phone = ?").get(email);
    const isNew = !user;
    
    if (!user) {
      const name = typeof req.body.name === "string" ? req.body.name.slice(0, 60) : (decodedToken.name || "");
      const info = db.prepare("INSERT INTO users (phone, name) VALUES (?, ?)").run(email, name);
      user = db.prepare("SELECT * FROM users WHERE id = ?").get(info.lastInsertRowid);
    }
    
    res.json({ token: signToken(user), user: serializeUser(user), isNew });
  } catch (error) {
    console.error("Firebase auth error:", error);
    if (error.code === "auth/id-token-expired") {
      return res.status(401).json({ error: "Session expired. Please sign in again." });
    }
    if (error.code === "auth/argument-error") {
      return res.status(400).json({ error: "Malformed authentication token." });
    }
    if (error.message?.includes("Project Id") || error.message?.includes("credential")) {
      return res.status(500).json({ error: "Authentication service misconfigured on server." });
    }
    res.status(401).json({ error: error.message || "Invalid authentication token." });
  }
});

export default router;
