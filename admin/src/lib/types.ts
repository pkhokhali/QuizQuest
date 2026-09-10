// API types matching docs/API.md exactly.

export type Language = "en" | "ne";

export type Country =
  | "nepal"
  | "india"
  | "usa"
  | "japan"
  | "uk"
  | "china"
  | "australia"
  | "global";

export type Subject =
  | "math"
  | "science"
  | "social"
  | "english"
  | "nepali"
  | "gk"
  | "current";

export type GradeBand = "1-3" | "4-5" | "6-8" | "9-10" | "11-12";

export type QuestionStatus = "draft" | "approved";

export type Role = "student" | "teacher" | "admin";

export interface Avatar {
  emoji: string;
  bg: string;
}

export interface User {
  id: number;
  phone: string;
  name: string;
  role: Role;
  grade: number | null;
  language: Language;
  homeCountry: Country;
  extraCountries: Country[];
  subjects: Subject[];
  quizTime: string;
  avatar: Avatar;
  xp: number;
  level: number;
  streak: number;
  bestStreak: number;
  friendCode: string;
  schoolId: number | null;
  onboarded: boolean;
}

// ---- Auth ----

export interface RequestOtpResponse {
  ok: boolean;
  devCode?: string;
}

export interface VerifyResponse {
  token: string;
  user: User;
  isNew: boolean;
}

// ---- Questions (admin shape) ----

export interface Question {
  id: number;
  textEn: string;
  textNe: string;
  optionsEn: string[];
  optionsNe: string[];
  correctIndex: number;
  country: Country;
  subject: Subject;
  gradeBand: GradeBand;
  difficulty: number;
  topic: string;
  source: string;
  status: QuestionStatus;
}

export type QuestionInput = Omit<Question, "id">;

export interface QuestionListResponse {
  questions: Question[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

// ---- Digests ----

export type DigestStatus = "draft" | "published";

export interface Digest {
  id: number;
  date: string; // YYYY-MM-DD
  gradeBand: GradeBand;
  headlineEn: string;
  headlineNe: string;
  gkFactEn: string;
  gkFactNe: string;
  nepalFactEn: string;
  nepalFactNe: string;
  status: DigestStatus;
  pushedAt?: string | null;
  pushCount?: number;
  lastPushedBy?: string | null;
}

export interface SchedulerStatus {
  active: boolean;
  timezone: string;
  scheduleHour: number;
  scheduleMinute: number;
  currentTime: string;
  currentDate: string;
  lastRunDate: string | null;
  registeredTokens: number;
  uniqueUsersWithPush: number;
  todayDigestsCount: number;
  nextRun: string;
}

export type DigestInput = Omit<Digest, "id" | "status" | "pushedAt" | "pushCount" | "lastPushedBy">;

// ---- Mix config ----

export interface MixConfig {
  gradeBand: GradeBand;
  homePct: number;
  extraPct: number;
  globalPct: number;
}

// ---- Schools ----

export interface School {
  id: number;
  name: string;
  district?: string;
  joinCode: string;
  studentCount: number;
  verified?: boolean;
  badge?: string;
  totalXp?: number;
}

// ---- Memory Packs ----

export interface MemoryPair {
  id: number;
  q: string;
  a: string;
  emoji?: string;
}

export interface MemoryPack {
  id: number;
  titleEn: string;
  titleNe?: string;
  subject: string;
  difficulty: number;
  timeLimitSec: number;
  pairs: MemoryPair[];
  createdAt?: string;
}

// ---- Reported Questions ----

export interface ReportedQuestion {
  id: number;
  questionId: number;
  reporterUserId: number;
  reporterName?: string;
  reason: string;
  details?: string;
  status: "open" | "resolved";
  createdAt: string;
  questionText?: string;
}

// ---- Analytics ----

export interface Analytics {
  totals: {
    users: number;
    questions: number;
    schools: number;
  };
  dau: number;
  wau: number;
  quizzesToday: number;
  battlesToday: number;
  avgStreak: number;
  subjectPopularity: { subject: Subject; answers: number }[];
  countryDistribution: { country: Country; students: number }[];
  gradeDistribution: { grade: number; students: number }[];
}

// ---- Shared option lists (for selects/filters) ----

export const COUNTRIES: Country[] = [
  "nepal",
  "india",
  "usa",
  "japan",
  "uk",
  "china",
  "australia",
  "global",
];

export const SUBJECTS: Subject[] = [
  "math",
  "science",
  "social",
  "english",
  "nepali",
  "gk",
  "current",
];

export const GRADE_BANDS: GradeBand[] = ["1-3", "4-5", "6-8", "9-10", "11-12"];

export const QUESTION_STATUSES: QuestionStatus[] = ["draft", "approved"];
