# QuizQuest

A gamified, class-wise MCQ learning app for students (Grades 1–12, Nepal-first, multi-country content). It never feels like an exam — quests, battles, streaks, and XP instead of tests and marks. Bilingual (Nepali/English) by default.

## Monorepo layout

| Folder    | What it is                                                         | Stack                                   |
| --------- | ------------------------------------------------------------------ | --------------------------------------- |
| `server/` | Shared backend: REST API + real-time battle engine + seed generator | Node.js, Express, Socket.io, SQLite (Postgres-ready schema) |
| `admin/`  | Content/admin web portal                                            | Next.js, React, Tailwind CSS             |
| `app/`    | Student mobile app (Android + iOS)                                  | React Native + Expo                      |
| `docs/`   | API contract shared by all surfaces                                 | —                                        |

## Quick start

### 1. Backend

```bash
cd server
npm install
npm run seed        # generates the question bank (60k+ unique questions) + demo data
npm run dev         # http://localhost:4000
```

Question bank size is controlled with `QUESTION_SCALE` (default 1 ≈ 60k unique questions; higher scales push each template toward its unique-combination ceiling):

```bash
QUESTION_SCALE=3 npm run seed   # bigger bank; SQLite handles it comfortably
```

### 2. Admin portal

```bash
cd admin
npm install
npm run dev         # http://localhost:3000
```

Log in with phone `9800000000`, OTP `123456` (dev OTP is always `123456`).

### 3. Student app

```bash
cd app
npm install
npx expo start      # scan QR with Expo Go (Android/iOS)
```

On a physical device, set the API host to your machine's LAN IP in `app/src/api/config.ts`.

Demo student: any phone number + OTP `123456`, then complete onboarding. Seeded demo students exist for leaderboards and battles.

## Key mechanics

- **Daily Quest**: 8 questions, composed once per student per day. Mix: 60% home country / 25% selected extra countries / 15% global (configurable per grade band from the admin portal). Difficulty adapts per subject from the student's last 20 answers.
- **Revenge Round**: questions a student missed come back days later — spaced repetition disguised as a game.
- **Battles**: real-time 1v1, 6 questions, 10s each, matched by grade. Server-authoritative scoring; the correct answer never reaches the client before the reveal.
- **Awards**: earned for effort and consistency (streaks, comebacks, countries explored) — not just rank.
- **Leaderboards**: weekly reset; students see the top 3 and their own neighborhood, never a full shaming ranking.
- **No exam language**: no "test", "marks", "fail", no red WRONG flash. Wrong answers cost a little XP quietly and get recycled into Revenge Rounds.

## Content pipeline

- Generator (`server/seed/`): curated fact tables (countries, capitals, currencies, Nepal provinces/festivals/peaks/rivers, planets, elements, inventors, ...) + parameterized math templates expand into tens of thousands of tagged, bilingual, deduplicated questions.
- Curated one-off questions live in `server/seed/data/curated.js` and via the admin portal (single entry or CSV bulk import).
- Daily digest ("Today's 3 things") is drafted in the admin portal and requires explicit approval before students see it — current-events content is never auto-published.

## CI/CD (GitHub)

Two workflows run from `.github/workflows/`:

- **Deploy admin portal to GitHub Pages** (`deploy-admin.yml`): every push to `main` that touches `admin/` builds the static export and publishes it to `https://pkhokhali.github.io/QuizQuest/`. Set the `ADMIN_API_URL` repository variable to your backend URL.
- **Build Android APK** (`build-apk.yml`): builds a release APK and uploads it as the `QuizQuest-apk` artifact. **Requires** the `APP_API_URL` repository variable (or the `api_url` workflow input) — `localhost` is rejected because phones can't reach it. Same-Wi‑Fi testing: set `APP_API_URL` to `http://YOUR_PC_LAN_IP:4000` and keep `npm run dev` running in `server/`. Internet-wide: deploy the API (e.g. free Render blueprint in `render.yaml`) then set both `APP_API_URL` and `ADMIN_API_URL` to that HTTPS URL and rebuild.

### Repo variables to set

Settings → Secrets and variables → Actions → **Variables**:

| Variable        | Example                                      | Used by        |
| --------------- | -------------------------------------------- | -------------- |
| `APP_API_URL`   | `http://192.168.0.111:4000` or Render URL    | APK build      |
| `ADMIN_API_URL` | same as above                                | Pages deploy   |

The backend itself needs a real host (any Node host works — Railway, Render, a VPS); GitHub can't run the persistent API/Socket.io server.

## Production notes

- Swap SQLite for PostgreSQL (schema is portable; see `server/src/db.js`), add Redis for matchmaking/leaderboards at scale.
- Wire real OTP via Sparrow SMS in `server/src/routes/auth.js` (dev mode uses fixed OTP `123456`).
- Push notifications: Expo Notifications / FCM (hook points in `app/`).
