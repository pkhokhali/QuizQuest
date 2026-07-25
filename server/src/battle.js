import db from "./db.js";
import { verifyToken } from "./auth.js";
import { studentQuestion, gradeBandFor, levelForXp, today } from "./util.js";
import { checkAwards } from "./awards.js";
import { onlineSockets } from "./presence.js";

const TOTAL_QUESTIONS = 6;
const PER_QUESTION_MS = 10000;
const REVEAL_PAUSE_MS = 2500;

const queues = new Map(); // gradeBand -> [{ socket, user }]
const battles = new Map(); // battleId -> battle
const challenges = new Map(); // challengeId -> { from, toUserId, expires }
let nextBattleId = 1;
let nextChallengeId = 1;

function pickBattleQuestions(gradeBand) {
  return db
    .prepare(
      `SELECT * FROM questions WHERE status = 'approved' AND grade_band = ? AND difficulty <= 4
       ORDER BY RANDOM() LIMIT ?`
    )
    .all(gradeBand, TOTAL_QUESTIONS);
}

function publicPlayer(user) {
  return {
    userId: user.id,
    name: user.name || "Player",
    avatar: JSON.parse(user.avatar || "{}"),
    level: levelForXp(user.xp),
  };
}

export function initBattle(io) {
  const nsp = io.of("/battle");

  nsp.use((socket, next) => {
    const payload = verifyToken(socket.handshake.auth?.token);
    if (!payload) return next(new Error("unauthorized"));
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(payload.uid);
    if (!user) return next(new Error("unauthorized"));
    socket.data.user = user;
    next();
  });

  nsp.on("connection", (socket) => {
    const user = socket.data.user;
    onlineSockets.set(user.id, socket);

    socket.on("queue:join", () => {
      if (findBattleByUser(user.id)) return;
      const band = gradeBandFor(user.grade || 8);
      const q = queues.get(band) || [];
      // Drop stale/self entries.
      const fresh = q.filter((e) => e.socket.connected && e.user.id !== user.id);
      const opponent = fresh.shift();
      queues.set(band, fresh);
      if (opponent) {
        startBattle(opponent, { socket, user }, band);
      } else {
        fresh.push({ socket, user });
        queues.set(band, fresh);
        socket.emit("queue:waiting", { position: fresh.length });
      }
    });

    socket.on("queue:leave", () => removeFromQueues(user.id));

    socket.on("challenge:send", ({ friendUserId } = {}) => {
      const target = onlineSockets.get(Number(friendUserId));
      if (!target) return;
      const challengeId = nextChallengeId++;
      challenges.set(challengeId, { from: { socket, user }, toUserId: Number(friendUserId), expires: Date.now() + 60000 });
      target.emit("challenge:incoming", { challengeId, from: publicPlayer(user) });
    });

    socket.on("challenge:accept", ({ challengeId } = {}) => {
      const ch = challenges.get(Number(challengeId));
      challenges.delete(Number(challengeId));
      if (!ch || ch.toUserId !== user.id || Date.now() > ch.expires) return;
      if (!ch.from.socket.connected) return;
      const band = gradeBandFor(ch.from.user.grade || user.grade || 8);
      startBattle(ch.from, { socket, user }, band);
    });

    socket.on("battle:answer", ({ battleId, questionIndex, choice, timeMs } = {}) => {
      const battle = battles.get(Number(battleId));
      if (!battle || battle.ended) return;
      const player = battle.players.find((p) => p.user.id === user.id);
      if (!player) return;
      if (questionIndex !== battle.index || player.answers[battle.index]) return;
      player.answers[battle.index] = {
        choice: Number.isInteger(choice) ? choice : null,
        timeMs: Math.min(PER_QUESTION_MS, Math.max(0, Number(timeMs) || PER_QUESTION_MS)),
      };
      if (battle.players.every((p) => p.answers[battle.index])) {
        clearTimeout(battle.timer);
        reveal(battle);
      }
    });

    socket.on("disconnect", () => {
      if (onlineSockets.get(user.id) === socket) onlineSockets.delete(user.id);
      removeFromQueues(user.id);
      const battle = findBattleByUser(user.id);
      if (battle && !battle.ended) forfeit(battle, user.id);
    });
  });
}

function removeFromQueues(userId) {
  for (const [band, q] of queues) {
    queues.set(band, q.filter((e) => e.user.id !== userId));
  }
}

function findBattleByUser(userId) {
  for (const b of battles.values()) {
    if (!b.ended && b.players.some((p) => p.user.id === userId)) return b;
  }
  return null;
}

function startBattle(a, b, gradeBand) {
  const questions = pickBattleQuestions(gradeBand);
  if (questions.length < 3) {
    a.socket.emit("queue:waiting", { position: 1 });
    return;
  }
  const battle = {
    id: nextBattleId++,
    questions,
    index: -1,
    ended: false,
    timer: null,
    players: [a, b].map((e) => ({ socket: e.socket, user: e.user, score: 0, answers: {} })),
  };
  battles.set(battle.id, battle);
  for (const [i, p] of battle.players.entries()) {
    const opp = battle.players[1 - i];
    p.socket.emit("battle:start", {
      battleId: battle.id,
      opponent: publicPlayer(opp.user),
      totalQuestions: questions.length,
      perQuestionMs: PER_QUESTION_MS,
    });
  }
  setTimeout(() => nextQuestion(battle), 1500);
}

function nextQuestion(battle) {
  if (battle.ended) return;
  battle.index += 1;
  if (battle.index >= battle.questions.length) return endBattle(battle);
  const q = battle.questions[battle.index];
  const deadlineTs = Date.now() + PER_QUESTION_MS;
  battle.deadlineTs = deadlineTs;
  for (const p of battle.players) {
    p.socket.emit("battle:question", {
      index: battle.index,
      question: studentQuestion(q, p.user.language),
      deadlineTs,
    });
  }
  battle.timer = setTimeout(() => reveal(battle), PER_QUESTION_MS + 400);
}

function reveal(battle) {
  if (battle.ended) return;
  const q = battle.questions[battle.index];
  const logStmt = db.prepare(
    "INSERT INTO answer_log (user_id, question_id, subject, country, correct, source, date) VALUES (?, ?, ?, ?, ?, 'battle', ?)"
  );
  for (const p of battle.players) {
    const ans = p.answers[battle.index];
    const isCorrect = ans && ans.choice === q.correct_index;
    if (isCorrect) {
      const remaining = Math.max(0, PER_QUESTION_MS - ans.timeMs);
      p.score += 100 + Math.floor(remaining / 100);
    }
    logStmt.run(p.user.id, q.id, q.subject, q.country, isCorrect ? 1 : 0, today());
  }
  for (const [i, p] of battle.players.entries()) {
    const opp = battle.players[1 - i];
    const ans = p.answers[battle.index];
    p.socket.emit("battle:reveal", {
      index: battle.index,
      correctIndex: q.correct_index,
      scores: { you: p.score, them: opp.score },
      yourChoice: ans ? ans.choice : null,
      theirAnswered: Boolean(opp.answers[battle.index]),
    });
  }
  setTimeout(() => nextQuestion(battle), REVEAL_PAUSE_MS);
}

function finishAndPersist(battle, winnerUserId) {
  battle.ended = true;
  clearTimeout(battle.timer);
  const [p1, p2] = battle.players;
  db.prepare("INSERT INTO battles (p1, p2, s1, s2, winner, date) VALUES (?, ?, ?, ?, ?, ?)")
    .run(p1.user.id, p2.user.id, p1.score, p2.score, winnerUserId, today());

  const results = [];
  for (const p of battle.players) {
    const isWin = winnerUserId === p.user.id;
    const isDraw = winnerUserId == null;
    const xpEarned = isWin ? 30 : isDraw ? 15 : 10;
    db.prepare("UPDATE users SET xp = xp + ? WHERE id = ?").run(xpEarned, p.user.id);
    db.prepare("INSERT INTO xp_events (user_id, amount, reason, date) VALUES (?, ?, 'battle', ?)")
      .run(p.user.id, xpEarned, today());
    const newAwards = checkAwards(p.user.id).map(({ earned, ...a }) => a);
    results.push({ player: p, result: isDraw ? "draw" : isWin ? "win" : "loss", xpEarned, newAwards });
  }
  battles.delete(battle.id);
  return results;
}

function endBattle(battle) {
  const [p1, p2] = battle.players;
  const winnerUserId = p1.score > p2.score ? p1.user.id : p2.score > p1.score ? p2.user.id : null;
  const results = finishAndPersist(battle, winnerUserId);
  for (const [i, r] of results.entries()) {
    const opp = results[1 - i];
    r.player.socket.emit("battle:end", {
      result: r.result,
      scores: { you: r.player.score, them: opp.player.score },
      xpEarned: r.xpEarned,
      newAwards: r.newAwards,
    });
  }
}

function forfeit(battle, leaverUserId) {
  const winner = battle.players.find((p) => p.user.id !== leaverUserId);
  const results = finishAndPersist(battle, winner.user.id);
  const winnerResult = results.find((r) => r.player.user.id === winner.user.id);
  const loserResult = results.find((r) => r.player.user.id === leaverUserId);
  winner.socket.emit("battle:opponent_left", {});
  winner.socket.emit("battle:end", {
    result: "win",
    scores: { you: winnerResult.player.score, them: loserResult.player.score },
    xpEarned: winnerResult.xpEarned,
    newAwards: winnerResult.newAwards,
  });
}
