// Types matching docs/API.md (QuizQuest API Contract v1)

export type Language = "en" | "ne";

export type Subject =
  | "math"
  | "science"
  | "social"
  | "english"
  | "nepali"
  | "gk"
  | "current";

export type Country =
  | "nepal"
  | "india"
  | "usa"
  | "japan"
  | "uk"
  | "china"
  | "australia"
  | "global";

export type GradeBand = "1-3" | "4-5" | "6-8" | "9-10" | "11-12";

export type QuizTime = "morning" | "afterschool" | "evening";

export interface AvatarInfo {
  emoji: string;
  bg: string;
}

export interface User {
  id: number;
  phone: string;
  name: string;
  role: "student" | "admin" | "teacher";
  grade: number | null;
  language: Language;
  homeCountry: string;
  extraCountries: string[];
  subjects: Subject[];
  quizTime: QuizTime | null;
  avatar: AvatarInfo;
  xp: number;
  level: number;
  streak: number;
  bestStreak: number;
  friendCode: string;
  schoolId: number | null;
  schoolName: string | null;
  onboarded: boolean;
}

/** Question shape sent to students — never includes correctIndex. */
export interface StudentQuestion {
  id: number;
  text: string;
  options: string[];
  subject: Subject;
  country: string;
  difficulty: number;
  topic: string;
}

export interface Digest {
  id: number;
  date: string;
  gradeBand: GradeBand;
  headlineEn: string;
  headlineNe: string;
  gkFactEn: string;
  gkFactNe: string;
  nepalFactEn: string;
  nepalFactNe: string;
  bsDate: string;
}

export interface Award {
  code: string;
  nameEn: string;
  nameNe: string;
  descEn: string;
  descNe: string;
  icon: string;
  earned: boolean;
  earnedAt: string | null;
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

// ---- Me / Home ----

export interface UpdateMeBody {
  name?: string;
  grade?: number;
  language?: Language;
  homeCountry?: string;
  extraCountries?: string[];
  subjects?: Subject[];
  quizTime?: QuizTime;
  avatar?: AvatarInfo;
  joinCode?: string;
}

export interface JoinSchoolResponse {
  user: User;
  school: { id: number; name: string };
}

export type DailyQuizStatus = "not_started" | "in_progress" | "completed";

export interface HomeData {
  user: User;
  dailyQuiz: {
    status: DailyQuizStatus;
    score: number | null;
    total: number;
  };
  digest: Digest | null;
  revengeAvailable: boolean;
  recentAwards: Award[];
  weeklyXp: number;
}

// ---- Quizzes ----

export interface DailyQuizResponse {
  quizId: number;
  date: string;
  questions: StudentQuestion[];
  completed: boolean;
  score: number | null;
}

export interface RevengeQuizResponse {
  quizId: number;
  questions: StudentQuestion[];
}

export interface AnswerInput {
  questionId: number;
  choice: number | null;
  timeMs: number;
}

export interface SubmitQuizBody {
  quizId: number;
  answers: AnswerInput[];
}

export interface CorrectEntry {
  questionId: number;
  correctIndex: number;
}

export interface SubmitQuizResponse {
  score: number;
  total: number;
  xpEarned: number;
  xp: number;
  level: number;
  streak: number;
  newAwards: Award[];
  correct: CorrectEntry[];
}

// ---- Battles ----

export interface BattleHistoryItem {
  id: number;
  opponentName: string;
  myScore: number;
  theirScore: number;
  result: "win" | "loss" | "draw";
  date: string;
}

export interface BattleHistoryResponse {
  battles: BattleHistoryItem[];
}

// ---- Social ----

export type LeaderboardScope = "class" | "school" | "friends";

export interface LeaderboardEntry {
  userId: number;
  name: string;
  avatar: AvatarInfo;
  weeklyXp: number;
  rank: number;
  isMe: boolean;
}

export interface LeaderboardResponse {
  scope: LeaderboardScope;
  top3: LeaderboardEntry[];
  neighborhood: LeaderboardEntry[];
  me: LeaderboardEntry | null;
}

export interface Friend {
  userId: number;
  name: string;
  avatar: AvatarInfo;
  level: number;
  streak: number;
  online: boolean;
}

export interface FriendsResponse {
  friends: Friend[];
}

export interface AwardsResponse {
  awards: Award[];
}

// ---- Socket.io battle events ----

export interface BattleOpponent {
  userId: number;
  name: string;
  avatar: AvatarInfo;
  level: number;
}

export interface QueueWaitingEvent {
  position: number;
}

export interface ChallengeIncomingEvent {
  challengeId: string;
  from: { userId: number; name: string; avatar: AvatarInfo };
}

export interface BattleStartEvent {
  battleId: string;
  opponent: BattleOpponent;
  totalQuestions: number;
  perQuestionMs: number;
}

export interface BattleQuestionEvent {
  index: number;
  question: StudentQuestion;
  deadlineTs: number;
}

export interface BattleRevealEvent {
  index: number;
  correctIndex: number;
  scores: { you: number; them: number };
  yourChoice: number | null;
  theirAnswered: boolean;
}

export interface BattleEndEvent {
  result: "win" | "loss" | "draw";
  scores: { you: number; them: number };
  xpEarned: number;
  newAwards: Award[];
}
