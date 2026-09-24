import { io, Socket } from "socket.io-client";
import { getBaseUrl } from "../api/config";
import {
  BattleEndEvent,
  BattleQuestionEvent,
  BattleRevealEvent,
  BattleStartEvent,
} from "../api/types";
import { OfflineQuestion, queueOfflineSubmission } from "../utils/offlineStore";

export interface BattleSocketLike {
  connected?: boolean;
  on: (event: string, callback: (...args: any[]) => void) => void;
  off: (event: string, callback: (...args: any[]) => void) => void;
  emit: (event: string, ...args: any[]) => void;
  disconnect?: () => void;
}

let socket: BattleSocketLike | null = null;
let lastQuestion: BattleQuestionEvent | null = null;

export async function connectBattleSocket(token: string): Promise<BattleSocketLike> {
  if (socket && socket.connected) return socket;
  if (socket && socket.disconnect) socket.disconnect();

  const baseUrl = await getBaseUrl();
  const realSocket = io(`${baseUrl}/battle`, {
    auth: { token },
    transports: ["websocket"],
  });

  realSocket.on("battle:start", () => {
    lastQuestion = null;
  });
  realSocket.on("battle:question", (event: BattleQuestionEvent) => {
    lastQuestion = event;
  });

  socket = realSocket;
  return socket;
}

export function getBattleSocket(): BattleSocketLike | null {
  return socket;
}

export function getLastQuestion(): BattleQuestionEvent | null {
  return lastQuestion;
}

export function disconnectBattleSocket(): void {
  if (socket && socket.disconnect) {
    socket.disconnect();
  }
  socket = null;
  lastQuestion = null;
}

/**
 * Initializes a fully offline, client-side Bot Battle!
 * Returns a BattleStartEvent and sets up a mock socket.
 */
export function startOfflineBotBattle(
  questions: OfflineQuestion[],
  onStart: (start: BattleStartEvent) => void
): void {
  disconnectBattleSocket();

  const listeners: Record<string, ((...args: any[]) => void)[]> = {};
  const perQuestionMs = 12000;
  const totalQuestions = questions.length;
  let currentIdx = 0;
  let userScore = 0;
  let botScore = 0;
  let questionTimeout: ReturnType<typeof setTimeout> | null = null;
  let answeredCurrent = false;

  const emitEvent = (ev: string, ...args: any[]) => {
    const list = listeners[ev] || [];
    list.forEach((fn) => fn(...args));
  };

  const advanceQuestion = () => {
    if (questionTimeout) clearTimeout(questionTimeout);
    answeredCurrent = false;

    if (currentIdx >= totalQuestions) {
      // Battle finished!
      const result =
        userScore > botScore ? "win" : userScore === botScore ? "draw" : "loss";
      const xpEarned = result === "win" ? 40 : result === "draw" ? 20 : 10;

      // Queue offline XP
      queueOfflineSubmission("quiz", "/quizzes/practice/submit", {
        offlineBotBattle: true,
        result,
        score: userScore,
        total: totalQuestions,
        xpEarned,
      });

      const endEvent: BattleEndEvent = {
        result,
        scores: { you: userScore, them: botScore },
        xpEarned,
        newAwards: [],
      };
      emitEvent("battle:end", endEvent);
      return;
    }

    const q = questions[currentIdx];
    const qEvent: BattleQuestionEvent = {
      index: currentIdx,
      question: q,
      deadlineTs: Date.now() + perQuestionMs,
    };
    lastQuestion = qEvent;
    emitEvent("battle:question", qEvent);

    // Auto-timeout if player does not answer in time
    questionTimeout = setTimeout(() => {
      if (!answeredCurrent) {
        processAnswer(null);
      }
    }, perQuestionMs + 300);
  };

  const processAnswer = (userChoice: number | null) => {
    if (answeredCurrent) return;
    answeredCurrent = true;
    if (questionTimeout) clearTimeout(questionTimeout);

    const q = questions[currentIdx];
    const correctIdx = typeof q.correctIndex === "number" ? q.correctIndex : 0;

    if (userChoice === correctIdx) {
      userScore++;
    }

    // Bot AI simulation (70% accuracy)
    const botCorrect = Math.random() < 0.7;
    const botChoice = botCorrect
      ? correctIdx
      : (correctIdx + 1) % (q.options?.length || 4);
    if (botCorrect) {
      botScore++;
    }

    const revealEvent: BattleRevealEvent = {
      index: currentIdx,
      correctIndex: correctIdx,
      scores: { you: userScore, them: botScore },
      yourChoice: userChoice,
      theirAnswered: true,
    };

    emitEvent("battle:reveal", revealEvent);

    // Advance to next question after 1.8s reveal animation
    setTimeout(() => {
      currentIdx++;
      advanceQuestion();
    }, 1800);
  };

  const mockSocket: BattleSocketLike = {
    connected: true,
    on: (event: string, cb: (...args: any[]) => void) => {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(cb);
    },
    off: (event: string, cb: (...args: any[]) => void) => {
      if (listeners[event]) {
        listeners[event] = listeners[event].filter((fn) => fn !== cb);
      }
    },
    emit: (event: string, ...args: any[]) => {
      if (event === "battle:answer") {
        const payload = args[0] as { choice: number | null };
        processAnswer(payload.choice);
      }
    },
    disconnect: () => {
      if (questionTimeout) clearTimeout(questionTimeout);
      Object.keys(listeners).forEach((k) => delete listeners[k]);
    },
  };

  socket = mockSocket;

  const startEvent: BattleStartEvent = {
    battleId: `off-bot-${Date.now()}`,
    opponent: {
      userId: 99999,
      name: "Bot Maya 🤖",
      avatar: { emoji: "🤖", bg: "#6366F1" },
      level: 3,
    },
    totalQuestions,
    perQuestionMs,
  };

  // Seed question 0 as lastQuestion so screen picks it up immediately
  const q0 = questions[0];
  lastQuestion = {
    index: 0,
    question: q0,
    deadlineTs: Date.now() + perQuestionMs,
  };

  onStart(startEvent);

  // Trigger question timeout for Q0
  questionTimeout = setTimeout(() => {
    if (!answeredCurrent) {
      processAnswer(null);
    }
  }, perQuestionMs + 300);
}
