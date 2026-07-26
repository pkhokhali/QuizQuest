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
