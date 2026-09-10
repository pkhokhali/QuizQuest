import db from "../src/db.js";
import crypto from "crypto";

const salt = "qq_fixed_salt_99";
const hash = crypto.scryptSync("password123", salt, 64).toString("hex");
const passwordHash = `${salt}:${hash}`;

const existing = db.prepare("SELECT id FROM users WHERE email = ?").get("admin@quizquest.com");

if (existing) {
  db.prepare("UPDATE users SET role = 'admin', password_hash = ? WHERE id = ?").run(passwordHash, existing.id);
  console.log("✅ Updated existing user admin@quizquest.com to role 'admin' with password123");
} else {
  db.prepare(`
    INSERT INTO users (phone, email, password_hash, name, role, grade, home_country, language, xp, streak, best_streak, avatar)
    VALUES (?, ?, ?, ?, 'admin', 10, 'nepal', 'en', 1000, 10, 10, '{"emoji":"👑","bg":"#6366F1"}')
  `).run("admin@quizquest.com", "admin@quizquest.com", passwordHash, "Super Admin");
  console.log("✅ Created admin@quizquest.com / password123 with role 'admin'");
}
