// Simulates two grade-8 students playing a full real-time battle.
import { io } from "socket.io-client";

const BASE = process.env.BASE_URL || "http://localhost:4000";

async function login(phone) {
  const res = await fetch(`${BASE}/api/auth/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, code: "123456" }),
  });
  return (await res.json()).token;
}

function player(name, token) {
  const socket = io(`${BASE}/battle`, { auth: { token }, transports: ["websocket"] });
  const state = { name, socket, score: 0, ended: null, reveals: 0 };
  socket.on("battle:start", (d) => {
    state.battleId = d.battleId;
    console.log(`${name}: battle ${d.battleId} vs ${d.opponent.name} (${d.totalQuestions} questions)`);
  });
  socket.on("battle:question", (d) => {
    if ("correctIndex" in d.question) { console.log("FAIL: answer leaked in battle question"); process.exit(1); }
    setTimeout(() => {
      socket.emit("battle:answer", {
        battleId: state.battleId,
        questionIndex: d.index,
        choice: Math.floor(Math.random() * 4),
        timeMs: 500 + Math.floor(Math.random() * 2000),
      });
    }, 100 + Math.random() * 400);
  });
  socket.on("battle:reveal", (d) => {
    state.reveals++;
    state.score = d.scores.you;
  });
  socket.on("battle:end", (d) => {
    state.ended = d;
    console.log(`${name}: ${d.result} ${d.scores.you}-${d.scores.them}, +${d.xpEarned} XP, awards: ${d.newAwards.map((a) => a.code).join(",") || "none"}`);
  });
  return state;
}

const [t1, t2] = await Promise.all([login("9811111101"), login("9811111102")]);
const p1 = player("Aarav", t1);
const p2 = player("Sita", t2);

await new Promise((r) => setTimeout(r, 800));
p1.socket.emit("queue:join");
p2.socket.emit("queue:join");

const deadline = Date.now() + 120000;
while ((!p1.ended || !p2.ended) && Date.now() < deadline) {
  await new Promise((r) => setTimeout(r, 1000));
}

let ok = true;
if (!p1.ended || !p2.ended) { console.log("FAIL: battle did not finish"); ok = false; }
else {
  if (p1.reveals !== 6 || p2.reveals !== 6) { console.log(`FAIL: reveals ${p1.reveals}/${p2.reveals}, expected 6/6`); ok = false; }
  const consistent =
    p1.ended.scores.you === p2.ended.scores.them && p1.ended.scores.them === p2.ended.scores.you;
  if (!consistent) { console.log("FAIL: score mismatch between players"); ok = false; }
  const results = [p1.ended.result, p2.ended.result].sort().join(",");
  if (!["loss,win", "draw,draw"].includes(results)) { console.log(`FAIL: inconsistent results ${results}`); ok = false; }
}
p1.socket.close();
p2.socket.close();
console.log(ok ? "Battle smoke test passed." : "Battle smoke test FAILED");
process.exit(ok ? 0 : 1);
