import type { User } from "./types";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const TOKEN_KEY = "qq_token";
const USER_KEY = "qq_user";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

// Raw string accessor so it can be used as a useSyncExternalStore snapshot
// (stable value identity between reads).
export function getStoredUserRaw(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(USER_KEY);
}

export function getStoredUser(): User | null {
  const raw = getStoredUserRaw();
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function setSession(token: string, user: User) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

interface ApiOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
}

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.body !== undefined) headers["Content-Type"] = "application/json";

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError(
      "Couldn't reach the QuizQuest server. Is it running?",
      0
    );
  }

  if (res.status === 401) {
    clearSession();
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
    if (
      typeof window !== "undefined" &&
      !window.location.pathname.startsWith(`${basePath}/login`)
    ) {
      window.location.href = `${basePath}/login`;
    }
    throw new ApiError("Your session has expired. Please sign in again.", 401);
  }

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // Non-JSON response body; leave data as null.
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
