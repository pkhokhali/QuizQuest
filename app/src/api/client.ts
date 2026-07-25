import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "./config";
import {
  AwardsResponse,
  BattleHistoryResponse,
  DailyQuizResponse,
  Friend,
  FriendsResponse,
  HomeData,
  Digest,
  LeaderboardResponse,
  LeaderboardScope,
  RequestOtpResponse,
  RevengeQuizResponse,
  SubmitQuizBody,
  SubmitQuizResponse,
  UpdateMeBody,
  User,
  VerifyResponse,
} from "./types";

export const TOKEN_KEY = "qq_token";
export const USER_KEY = "qq_user";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown } = {}
): Promise<T> {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError("network", 0);
  }

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // Non-JSON body; leave data null.
  }

  if (!res.ok) {
    const message =
      data && typeof data === "object" && "error" in data
        ? String((data as { error: unknown }).error)
        : `Request failed (${res.status})`;
    throw new ApiError(message, res.status);
  }

  return data as T;
}

// ---- Auth ----

export function requestOtp(phone: string): Promise<RequestOtpResponse> {
  return request("/api/auth/request-otp", { method: "POST", body: { phone } });
}

export function verifyOtp(
  phone: string,
  code: string,
  name?: string
): Promise<VerifyResponse> {
  return request("/api/auth/verify", {
    method: "POST",
    body: name ? { phone, code, name } : { phone, code },
  });
}

// ---- Me / Home ----

export function getMe(): Promise<{ user: User }> {
  return request("/api/me");
}

export function updateMe(body: UpdateMeBody): Promise<{ user: User }> {
  return request("/api/me", { method: "PUT", body });
}

export function getHome(): Promise<HomeData> {
  return request("/api/home");
}

export function getTodayDigest(): Promise<{ digest: Digest | null }> {
  return request("/api/digest/today");
}

// ---- Quizzes ----

export function getDailyQuiz(): Promise<DailyQuizResponse> {
  return request("/api/quiz/daily");
}

export function submitDailyQuiz(body: SubmitQuizBody): Promise<SubmitQuizResponse> {
  return request("/api/quiz/daily/submit", { method: "POST", body });
}

export function getRevengeQuiz(): Promise<RevengeQuizResponse> {
  return request("/api/quiz/revenge");
}

export function submitRevengeQuiz(body: SubmitQuizBody): Promise<SubmitQuizResponse> {
  return request("/api/quiz/revenge/submit", { method: "POST", body });
}

// ---- Battles ----

export function getBattleHistory(): Promise<BattleHistoryResponse> {
  return request("/api/battles/history");
}

// ---- Social ----

export function getLeaderboard(scope: LeaderboardScope): Promise<LeaderboardResponse> {
  return request(`/api/leaderboard?scope=${scope}`);
}

export function getFriends(): Promise<FriendsResponse> {
  return request("/api/friends");
}

export function addFriend(friendCode: string): Promise<{ friend: Friend }> {
  return request("/api/friends/add", { method: "POST", body: { friendCode } });
}

export function getAwards(): Promise<AwardsResponse> {
  return request("/api/awards");
}
