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
  photoUrl?: string;
}

export interface User {
  id: number;
  phone: string;
  email?: string;
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
  gradeBand?: GradeBand;
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

export interface RiddleData {
  id: number;
  riddleEn: string;
  riddleNe: string;
  answerEn: string;
  answerNe: string;
  hint1En?: string;
  hint1Ne?: string;
  hint2En?: string;
  hint2Ne?: string;
  hint3En?: string;
  hint3Ne?: string;
  meaningEn?: string;
  meaningNe?: string;
  category: string;
  categoryEn?: string;
  categoryNe?: string;
  difficulty: number;
  date: string;
  solved: boolean;
  xpEarned: number;
}

export interface HomeData {
  user: User;
  dailyQuiz: {
    status: DailyQuizStatus;
    score: number | null;
    total: number;
  };
  digest: Digest | null;
  riddle?: RiddleData | null;
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

// ---- School Clan Types ----

export interface CreateSchoolBody {
  name: string;
  district?: string;
}

export interface CreateSchoolResponse {
  user: User;
  school: {
    id: number;
    name: string;
    district: string;
    joinCode: string;
    code?: string;
    membersCount: number;
    totalXp: number;
  };
}

export interface SchoolClanMember {
  id: number;
  name: string;
  avatar: AvatarInfo;
  grade?: number;
  xp: number;
  streak: number;
  isMe: boolean;
}

export interface SchoolClanData {
  id: number;
  name: string;
  district: string;
  joinCode: string;
  code?: string;
  verified: boolean;
  badge: string;
  membersCount: number;
  totalXp: number;
  members: SchoolClanMember[];
}

export interface SchoolLeaderboardItem {
  id: number;
  name: string;
  district: string;
  joinCode: string;
  badge: string;
  verified: boolean;
  membersCount: number;
  totalXp: number;
  rank: number;
}

// ---- Memory Block Quiz Types ----

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
}

export interface SubmitMemoryResponse {
  stars: number;
  moves: number;
  timeMs: number;
  xpEarned: number;
  user: User;
}

// ---- Daily Zip Types ----

export interface DailyZipPuzzleResponse {
  puzzleNum: number;
  date: string;
  size: number | { rows: number; cols: number };
  difficulty: "easy" | "medium" | "hard";
  totalCells: number;
  numbers?: Record<string, number>;
  walls?: { between: [string, string] }[];
  solution?: string[];
  checkpoints: Record<string, number>;
  maxCheckpoint: number;
  solutionPath: { row: number; col: number }[];
  myScore: {
    timeSeconds: number;
    moves: number;
    stars: number;
    xpEarned: number;
    completedAt: string;
  } | null;
  rivalToBeat: {
    userId: number;
    name: string;
    avatar: AvatarInfo;
    timeSeconds: number;
  } | null;
}

export interface DailyZipSubmitResponse {
  ok: boolean;
  score: {
    puzzleDate: string;
    timeSeconds: number;
    moves: number;
    stars: number;
    xpEarned: number;
    isNewRecord: boolean;
  };
  user: User;
}

export interface ZipLeaderboardUser {
  rank: number;
  userId: number;
  name: string;
  avatar: AvatarInfo;
  level: number;
  timeSeconds: number;
  moves: number;
  stars: number;
  isMe: boolean;
}

export interface ZipUnplayedFriend {
  userId: number;
  name: string;
  avatar: AvatarInfo;
  canNudge: boolean;
}

export interface DailyZipLeaderboardResponse {
  global: ZipLeaderboardUser[];
  friends: ZipLeaderboardUser[];
  unplayedFriends: ZipUnplayedFriend[];
  school: ZipLeaderboardUser[];
}

// ---- Word Search Types ----
export interface WordSearchWord {
  word: string;
  clueEn: string;
  clueNe: string;
}

export interface WordSearchCategoryMeta {
  id: string;
  titleEn: string;
  titleNe: string;
  icon: string;
  wordCount: number;
}

export interface WordSearchLeaderboardUser {
  rank: number;
  userId: number;
  name: string;
  avatar: AvatarInfo;
  timeSeconds: number;
  wordsFound: number;
  isMe: boolean;
}

export interface DailyWordSearchResponse {
  puzzleDate: string;
  category: string;
  titleEn: string;
  titleNe: string;
  icon: string;
  words: WordSearchWord[];
  allCategories: WordSearchCategoryMeta[];
  myScore: {
    timeSeconds: number;
    wordsFound: number;
    totalWords: number;
    stars: number;
    xpEarned: number;
    completedAt: string;
  } | null;
  leaderboard: WordSearchLeaderboardUser[];
}

export interface WordSearchSubmitResponse {
  ok: boolean;
  score: {
    puzzleDate: string;
    timeSeconds: number;
    wordsFound: number;
    totalWords: number;
    stars: number;
    xpEarned: number;
    isNewRecord: boolean;
  };
  user: User;
}

// ---- Game Insights & Mastery Types ----

export interface SubjectMasteryItem {
  subject: string;
  total: number;
  correct: number;
  pct: number;
}

export interface GameBreakdownItem {
  reason: string;
  name: string;
  icon: string;
  color: string;
  totalXp: number;
  playCount: number;
}

export interface ActivityHeatmapDay {
  date: string;
  xp: number;
  events: number;
  answers: number;
  correct: number;
}

export interface PersonalBests {
  fastestZipSec: number | null;
  fastestWordSearchSec: number | null;
  wordSearchCount: number;
  totalRiddlesSolved: number;
  battlesWon: number;
  totalBattles: number;
  memoryHighestStars: number | null;
}

export interface UserInsightsResponse {
  summary: {
    totalXp: number;
    level: number;
    streak: number;
    totalAnswers: number;
    correctAnswers: number;
    accuracyPct: number;
  };
  subjectMastery: SubjectMasteryItem[];
  gameBreakdown: GameBreakdownItem[];
  activityHeatmap: ActivityHeatmapDay[];
  personalBests: PersonalBests;
}


