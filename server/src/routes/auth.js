import { Router } from "express";
import db from "../db.js";
import { signToken } from "../auth.js";
import { serializeUser } from "../util.js";

const router = Router();
const DEV_OTP = "123456";

// In production, integrate Sparrow SMS here and store per-phone codes with expiry.
router.post("/request-otp", (req, res) => {
  const phone = String(req.body.phone || "").replace(/\D/g, "");
  if (phone.length < 7) return res.status(400).json({ error: "Enter a valid phone number" });
  const body = { ok: true };
  if (process.env.NODE_ENV !== "production") body.devCode = DEV_OTP;
  res.json(body);
});

router.post("/verify", (req, res) => {
  const phone = String(req.body.phone || "").replace(/\D/g, "");
  const code = String(req.body.code || "");
  if (phone.length < 7) return res.status(400).json({ error: "Enter a valid phone number" });
  if (code !== DEV_OTP) return res.status(400).json({ error: "That code didn't match — try again" });

  let user = db.prepare("SELECT * FROM users WHERE phone = ?").get(phone);
  const isNew = !user;
  if (!user) {
    const name = typeof req.body.name === "string" ? req.body.name.slice(0, 60) : "";
    const info = db.prepare("INSERT INTO users (phone, name) VALUES (?, ?)").run(phone, name);
    user = db.prepare("SELECT * FROM users WHERE id = ?").get(info.lastInsertRowid);
  }
  res.json({ token: signToken(user), user: serializeUser(user), isNew });
});

export default router;
