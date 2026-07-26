import jwt from "jsonwebtoken";
import db from "./db.js";

export const JWT_SECRET = process.env.JWT_SECRET || "quizquest-dev-secret";

if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  console.warn(
    "[security] JWT_SECRET is not set in production — using an insecure default. Set JWT_SECRET in the environment."
  );
}

export function signToken(user) {
  return jwt.sign({ uid: user.id, role: user.role }, JWT_SECRET, { expiresIn: "90d" });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  const payload = token && verifyToken(token);
  if (!payload) return res.status(401).json({ error: "Not signed in" });
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(payload.uid);
  if (!user) return res.status(401).json({ error: "Account not found" });
  req.user = user;
  next();
}

export function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== "admin" && req.user.role !== "teacher") {
      return res.status(403).json({ error: "Admin access required" });
    }
    next();
  });
}
