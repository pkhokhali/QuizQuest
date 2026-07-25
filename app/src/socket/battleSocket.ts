import { io, Socket } from "socket.io-client";
import { BASE_URL } from "../api/config";
import { BattleQuestionEvent } from "../api/types";

let socket: Socket | null = null;

// The server can emit `battle:question` immediately after `battle:start`,
// before the BattleLive screen has mounted its listeners. We cache the most
// recent question here so the screen can pick it up on mount.
let lastQuestion: BattleQuestionEvent | null = null;

export function connectBattleSocket(token: string): Socket {
  if (socket && socket.connected) return socket;
  if (socket) socket.disconnect();

  socket = io(`${BASE_URL}/battle`, {
    auth: { token },
    transports: ["websocket"],
  });

  socket.on("battle:start", () => {
    lastQuestion = null;
  });
  socket.on("battle:question", (event: BattleQuestionEvent) => {
    lastQuestion = event;
  });

  return socket;
}

export function getBattleSocket(): Socket | null {
  return socket;
}

export function getLastQuestion(): BattleQuestionEvent | null {
  return lastQuestion;
}

export function disconnectBattleSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  lastQuestion = null;
}
