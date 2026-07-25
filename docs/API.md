# QuizQuest API Contract (v1)

Base URL (dev): `http://localhost:4000`
All JSON. Auth via `Authorization: Bearer <token>` (JWT) unless noted.
Errors: `{ "error": "message" }` with 4xx/5xx status.

## Conventions

- `language`: `"en" | "ne"`
- `country`: ISO-ish lowercase codes: `"nepal" | "india" | "usa" | "japan" | "uk" | ... | "global"`
- `subject`: `"math" | "science" | "social" | "english" | "nepali" | "gk" | "current"`
- `grade_band`: `"1-3" | "4-5" | "6-8" | "9-10" | "11-12"` (Grade 10 & 11-12 include SEE/NEB prep content)
- `difficulty`: integer 1–5
- Dates: `YYYY-MM-DD` (server local)
- Question objects sent to students NEVER include `correctIndex`.

### Question (admin shape)
```json
{
  "id": 123,
  "textEn": "What is the capital of Japan?",
  "textNe": "जापानको राजधानी कुन हो?",
  "optionsEn": ["Tokyo", "Osaka", "Kyoto", "Nagoya"],
  "optionsNe": ["टोकियो", "ओसाका", "क्योटो", "नागोया"],
  "correctIndex": 0,
  "country": "japan",
  "subject": "gk",
  "gradeBand": "6-8",
  "difficulty": 2,
  "topic": "capitals",
  "source": "generator:capitals",
  "status": "approved"
}
```
Student shape: same minus `correctIndex`, `source`, `status`; text/options collapsed to the student's language: `{ id, text, options, subject, country, difficulty, topic }` (falls back to English if Nepali missing).

## Auth

- `POST /api/auth/request-otp` body `{ "phone": "98........" }` → `{ "ok": true, "devCode": "123456" }` (devCode only returned when `NODE_ENV !== "production"`; dev OTP is always `123456`)
- `POST /api/auth/verify` body `{ "phone", "code", "name"? }` → `{ "token", "user", "isNew": bool }`
  - Admin login: phone `9800000000` is seeded with role `admin`.
- User object:
```json
{
  "id": 1, "phone": "98...", "name": "Aarav", "role": "student",
  "grade": 8, "language": "en", "homeCountry": "nepal",
  "extraCountries": ["india", "usa"], "subjects": ["math", "science"],
  "quizTime": "evening", "avatar": { "emoji": "🦊", "bg": "#7C3AED" },
  "xp": 240, "level": 3, "streak": 4, "bestStreak": 9,
  "friendCode": "QQ-000001", "schoolId": null, "onboarded": true
}
```

## Student endpoints

- `GET /api/me` → `{ user }`
- `PUT /api/me` body: any of `{ name, grade, language, homeCountry, extraCountries (max 2), subjects, quizTime, avatar }`. Setting grade+homeCountry marks `onboarded: true`. → `{ user }`
- `GET /api/home` → `{ user, dailyQuiz: { status: "not_started"|"in_progress"|"completed", score, total }, digest, revengeAvailable: bool, recentAwards: [award], weeklyXp: int }`
- `GET /api/digest/today` → `{ digest }` where digest = `{ id, date, gradeBand, headlineEn, headlineNe, gkFactEn, gkFactNe, nepalFactEn, nepalFactNe, bsDate: "२०८३ साउन ९" }` or `null`.

### Daily quiz
- `GET /api/quiz/daily` → `{ quizId, date, questions: [studentQuestion x8], completed: bool, score }`
  - Idempotent per user per day. Composition: mix-config % (default 60 home / 25 extra countries / 15 global) at the user's grade band, weighted toward preferred subjects, difficulty adapted per subject.
- `POST /api/quiz/daily/submit` body `{ "quizId", "answers": [{ "questionId", "choice": 0-3|null, "timeMs": 4200 }] }`
  → `{ score, total, xpEarned, xp, level, streak, newAwards: [award], correct: [{questionId, correctIndex}] }`
  - XP: +10 per correct, +5 speed bonus (< 5s), −2 per wrong (floor 0 per quiz). Completing the quiz maintains/extends streak.

### Revenge round (spaced repetition of missed questions)
- `GET /api/quiz/revenge` → `{ quizId, questions: [studentQuestion x up-to-6] }` (404 `{error}` if none available)
- `POST /api/quiz/revenge/submit` same shape as daily submit → same response (no streak effect; +8 XP per correct).

### Battles (history via REST, live via Socket.io)
- `GET /api/battles/history` → `{ battles: [{ id, opponentName, myScore, theirScore, result: "win"|"loss"|"draw", date }] }`

### Social
- `GET /api/leaderboard?scope=class|school|friends` → `{ scope, top3: [entry], neighborhood: [entry], me: entry }` where entry = `{ userId, name, avatar, weeklyXp, rank, isMe }`. Weekly XP resets Monday.
- `GET /api/friends` → `{ friends: [{ userId, name, avatar, level, streak, online: bool }] }`
- `POST /api/friends/add` body `{ "friendCode": "QQ-000123" }` → `{ friend }`
- `GET /api/awards` → `{ awards: [{ code, nameEn, nameNe, descEn, descNe, icon, earned: bool, earnedAt }] }`

## Admin endpoints (role `admin`; teacher endpoints noted)

- `GET /api/admin/questions?country=&subject=&gradeBand=&difficulty=&status=&search=&page=1&pageSize=50` → `{ questions, total, page, pageSize }`
- `POST /api/admin/questions` body: admin Question shape minus id → `{ question }`
- `PUT /api/admin/questions/:id` → `{ question }`
- `DELETE /api/admin/questions/:id` → `{ ok: true }`
- `POST /api/admin/questions/import` body `{ "csv": "<raw csv text>" }` → `{ imported, skipped, errors: [string] }`
  - CSV header: `textEn,textNe,option1En,option2En,option3En,option4En,option1Ne,option2Ne,option3Ne,option4Ne,correctIndex,country,subject,gradeBand,difficulty,topic,source`
- Digests:
  - `GET /api/admin/digests?status=` → `{ digests }`
  - `POST /api/admin/digests` body `{ date, gradeBand, headlineEn, headlineNe, gkFactEn, gkFactNe, nepalFactEn, nepalFactNe }` → `{ digest }` (status `draft`)
  - `PUT /api/admin/digests/:id` → `{ digest }`
  - `POST /api/admin/digests/:id/approve` → `{ digest }` (status `published`; only published digests are served to students)
  - `DELETE /api/admin/digests/:id` → `{ ok }`
- Mix config:
  - `GET /api/admin/mix-config` → `{ configs: [{ gradeBand, homePct, extraPct, globalPct }] }`
  - `PUT /api/admin/mix-config` body `{ gradeBand, homePct, extraPct, globalPct }` (must sum to 100) → `{ config }`
- Schools:
  - `GET /api/admin/schools` → `{ schools: [{ id, name, joinCode, studentCount }] }`
  - `POST /api/admin/schools` body `{ name }` → `{ school }` (joinCode auto-generated)
- Analytics:
  - `GET /api/admin/analytics` → `{ totals: { users, questions, schools }, dau, wau, quizzesToday, battlesToday, avgStreak, subjectPopularity: [{subject, answers}], countryDistribution: [{country, students}], gradeDistribution: [{grade, students}] }`

## Socket.io battle protocol (namespace `/battle`)

Connect: `io("http://localhost:4000/battle", { auth: { token } })`

Client → server:
- `queue:join` `{}` — join grade-based matchmaking
- `queue:leave` `{}`
- `challenge:send` `{ friendUserId }`
- `challenge:accept` `{ challengeId }`
- `battle:answer` `{ battleId, questionIndex, choice, timeMs }`

Server → client:
- `queue:waiting` `{ position }`
- `challenge:incoming` `{ challengeId, from: { userId, name, avatar } }`
- `battle:start` `{ battleId, opponent: { userId, name, avatar, level }, totalQuestions: 6, perQuestionMs: 10000 }`
- `battle:question` `{ index, question: studentQuestion, deadlineTs }`
- `battle:reveal` `{ index, correctIndex, scores: { you, them }, yourChoice, theirAnswered: bool }` (sent after both answer or timeout)
- `battle:end` `{ result: "win"|"loss"|"draw", scores: { you, them }, xpEarned, newAwards }`
- `battle:opponent_left` `{}` (counts as win)

Scoring: correct = 100 + floor(remainingMs/100) speed bonus; wrong/timeout = 0. Server validates answers; questions sent without `correctIndex`.

## Award codes (seeded)

`streak_3, streak_7, streak_30, first_battle, battles_10, battle_wins_5, global_explorer` (correct answers across 3+ countries), `subject_master_<subject>` (50 correct in subject), `comeback` (completed a quiz after 3+ day gap), `quiz_10, quiz_50` (quizzes completed).
