import db from "./db.js";
import { verifyToken } from "./auth.js";
import { studentQuestion, gradeBandFor, levelForXp, today, optionOrder, originalChoiceIndex } from "./util.js";
import { checkAwards } from "./awards.js";
import { onlineSockets } from "./presence.js";

const TOTAL_QUESTIONS = 6;
const PER_QUESTION_MS = 10000;
const REVEAL_PAUSE_MS = 2500;

const BOT_PHONE = "9900000000";
const BOT_MATCH_DELAY_MS = 3000;

const queues = new Map(); // gradeBand -> [{ socket, user }]
const battles = new Map(); // battleId -> battle
const challenges = new Map(); // challengeId -> { from, toUserId, expires }
const botTimers = new Map(); // userId -> timeout
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

function getBotUser() {
  return db.prepare("SELECT * FROM users WHERE phone = ?").get(BOT_PHONE);
}

function emitTo(player, event, data) {
  if (player.socket?.connected) player.socket.emit(event, data);
}

function makePlayer(entry) {
  return {
    socket: entry.socket ?? null,
    user: entry.user,
    isBot: Boolean(entry.isBot),
    score: 0,
    answers: {},
  };
}

function clearBotTimer(userId) {
  const timer = botTimers.get(userId);
  if (timer) {
    clearTimeout(timer);
    botTimers.delete(userId);
  }
}

function scheduleBotMatch(entry, gradeBand) {
  clearBotTimer(entry.user.id);
  const timer = setTimeout(() => tryBotMatch(entry, gradeBand), BOT_MATCH_DELAY_MS);
  botTimers.set(entry.user.id, timer);
}

function tryBotMatch(entry, gradeBand) {
  clearBotTimer(entry.user.id);
  if (!entry.socket.connected || findBattleByUser(entry.user.id)) return;
  const q = queues.get(gradeBand) || [];
  const idx = q.findIndex((e) => e.user.id === entry.user.id);
  if (idx === -1) return;
  q.splice(idx, 1);
  queues.set(gradeBand, q);
  const botUser = getBotUser();
  if (!botUser) return;
  startBattle(entry, { socket: null, user: botUser, isBot: true }, gradeBand);
}

function answerAsBot(battle, botPlayer) {
  if (botPlayer.answers[battle.index]) return;
  const q = battle.questions[battle.index];
  const shuffledCorrect = optionOrder(battle.id, q.id).indexOf(q.correct_index);
  const correct = Math.random() < 0.55;
  let choice = shuffledCorrect;
  if (!correct) {
    const wrong = [0, 1, 2, 3].filter((i) => i !== shuffledCorrect);
    choice = wrong[Math.floor(Math.random() * wrong.length)];
  }
  botPlayer.answers[battle.index] = {
    choice,
    timeMs: 2500 + Math.floor(Math.random() * 4500),
  };
}

function ensureBotAnswers(battle) {
  for (const p of battle.players) {
    if (p.isBot) answerAsBot(battle, p);
  }
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
        clearBotTimer(user.id);
        startBattle(opponent, { socket, user }, band);
      } else {
        fresh.push({ socket, user });
        queues.set(band, fresh);
        socket.emit("queue:waiting", { position: fresh.length });
        scheduleBotMatch({ socket, user }, band);
      }
    });

    socket.on("queue:leave", () => {
      clearBotTimer(user.id);
      removeFromQueues(user.id);
    });

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
      ensureBotAnswers(battle);
      if (battle.players.every((p) => p.answers[battle.index])) {
        clearTimeout(battle.timer);
        reveal(battle);
      }
    });

    socket.on("disconnect", () => {
      clearBotTimer(user.id);
      if (onlineSockets.get(user.id) === socket) onlineSockets.delete(user.id);
      removeFromQueues(user.id);
      const battle = findBattleByUser(user.id);
      if (battle && !battle.ended) forfeit(battle, user.id);
    });
  });
}

function removeFromQueues(userId) {
  clearBotTimer(userId);
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
    emitTo(makePlayer(a), "queue:waiting", { position: 1 });
    return;
  }
  const battle = {
    id: nextBattleId++,
    questions,
    index: -1,
    ended: false,
    timer: null,
    players: [makePlayer(a), makePlayer(b)],
  };
  battles.set(battle.id, battle);
  for (const [i, p] of battle.players.entries()) {
    const opp = battle.players[1 - i];
    emitTo(p, "battle:start", {
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
    emitTo(p, "battle:question", {
      index: battle.index,
      question: studentQuestion(q, p.user.language, battle.id),
      deadlineTs,
    });
  }
  battle.timer = setTimeout(() => {
    ensureBotAnswers(battle);
    reveal(battle);
  }, PER_QUESTION_MS + 400);
}

function reveal(battle) {
  if (battle.ended) return;
  const q = battle.questions[battle.index];
  const logStmt = db.prepare(
    "INSERT INTO answer_log (user_id, question_id, subject, country, correct, source, date) VALUES (?, ?, ?, ?, ?, 'battle', ?)"
  );
  for (const p of battle.players) {
    const ans = p.answers[battle.index];
    const choice = ans ? originalChoiceIndex(battle.id, q.id, ans.choice) : null;
    const isCorrect = choice != null && choice === q.correct_index;
    if (isCorrect) {
      const remaining = Math.max(0, PER_QUESTION_MS - ans.timeMs);
      p.score += 100 + Math.floor(remaining / 100);
    }
    logStmt.run(p.user.id, q.id, q.subject, q.country, isCorrect ? 1 : 0, today());
  }
  for (const [i, p] of battle.players.entries()) {
    const opp = battle.players[1 - i];
    const ans = p.answers[battle.index];
    emitTo(p, "battle:reveal", {
      index: battle.index,
      correctIndex: optionOrder(battle.id, q.id).indexOf(q.correct_index),
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
    emitTo(r.player, "battle:end", {
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
  emitTo(winner, "battle:opponent_left", {});
  emitTo(winner, "battle:end", {
    result: "win",
    scores: { you: winnerResult.player.score, them: loserResult.player.score },
    xpEarned: winnerResult.xpEarned,
    newAwards: winnerResult.newAwards,
  });
}
