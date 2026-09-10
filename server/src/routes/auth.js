import { Router } from "express";
import crypto from "crypto";
import db from "../db.js";
import { signToken } from "../auth.js";
import { serializeUser } from "../util.js";
import admin from "../firebase.js";

const router = Router();

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  if (!stored) return false;
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const verify = crypto.scryptSync(password, salt, 64).toString("hex");
  return verify === hash;
}

// Direct Email Authentication & Registration
router.post("/email", (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const isSignUp = Boolean(req.body.isSignUp);
  const name = typeof req.body.name === "string" ? req.body.name.trim().slice(0, 60) : "";

  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Please enter a valid email address" });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  // 1. Google Play Console Test Credentials Check
  if (email === "test2@quizquest.com" && password === "password123") {
    let user = db.prepare("SELECT * FROM users WHERE email = ? OR phone = ?").get(email, email);
    if (!user) {
      const salt = "qq_fixed_salt_99";
      const hash = crypto.scryptSync("password123", salt, 64).toString("hex");
      const passwordHash = `${salt}:${hash}`;
      const info = db.prepare(`
        INSERT INTO users (phone, email, password_hash, name, role, grade, home_country, language, xp, streak, best_streak, avatar)
        VALUES (?, ?, ?, ?, 'student', 8, 'nepal', 'en', 350, 5, 5, '{"emoji":"🦊","bg":"#7C3AED"}')
      `).run(email, email, passwordHash, "Play Console Reviewer");
      user = db.prepare("SELECT * FROM users WHERE id = ?").get(info.lastInsertRowid);
    }
    return res.json({ token: signToken(user), user: serializeUser(user), isNew: false });
  }

  // 1b. Content Admin Account Guarantee
  if (email === "admin@quizquest.com" && password === "password123") {
    let user = db.prepare("SELECT * FROM users WHERE email = ? OR phone = ?").get(email, email);
    if (!user) {
      const salt = "qq_fixed_salt_99";
      const hash = crypto.scryptSync("password123", salt, 64).toString("hex");
      const passwordHash = `${salt}:${hash}`;
      const info = db.prepare(`
        INSERT INTO users (phone, email, password_hash, name, role, grade, home_country, language, xp, streak, best_streak, avatar)
        VALUES (?, ?, ?, ?, 'admin', 10, 'nepal', 'en', 1000, 10, 10, '{"emoji":"👑","bg":"#6366F1"}')
      `).run(email, email, passwordHash, "Super Admin");
      user = db.prepare("SELECT * FROM users WHERE id = ?").get(info.lastInsertRowid);
    } else if (user.role !== "admin") {
      db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(user.id);
      user.role = "admin";
    }
    return res.json({ token: signToken(user), user: serializeUser(user), isNew: false });
  }

  // 2. Regular User Flow
  let user = db.prepare("SELECT * FROM users WHERE email = ? OR phone = ?").get(email, email);

  if (isSignUp) {
    if (user) {
      return res.status(400).json({ error: "An account with this email already exists. Please sign in instead." });
    }
    const hash = hashPassword(password);
    const displayName = name || email.split("@")[0];
    const info = db.prepare(`
      INSERT INTO users (phone, email, password_hash, name)
      VALUES (?, ?, ?, ?)
    `).run(email, email, hash, displayName);
    user = db.prepare("SELECT * FROM users WHERE id = ?").get(info.lastInsertRowid);
    return res.json({ token: signToken(user), user: serializeUser(user), isNew: true });
  } else {
    // Sign in flow
    if (!user) {
      return res.status(400).json({ error: "No account found with this email. Tap 'Create Account' to join!" });
    }
    if (user.password_hash) {
      const ok = verifyPassword(password, user.password_hash);
      if (!ok) {
        return res.status(400).json({ error: "Incorrect password. Please try again." });
      }
    } else {
      const hash = hashPassword(password);
      db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hash, user.id);
    }
    return res.json({ token: signToken(user), user: serializeUser(user), isNew: false });
  }
});
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
