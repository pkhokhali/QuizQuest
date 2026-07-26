# QuizQuest Admin Portal

Content and admin web portal for QuizQuest — manage the question bank, daily digests, content mix, and schools.

Built with Next.js (App Router), TypeScript, and Tailwind CSS.

## Getting started

```bash
npm install
npm run dev
```

Dev server listens on all interfaces (`0.0.0.0`), so other devices on your LAN can open `http://YOUR_LAN_IP:3000`. When accessed that way, API calls automatically go to `http://YOUR_LAN_IP:4000` (same host as the browser).

The portal expects the QuizQuest API at `http://localhost:4000` when opened locally. To point elsewhere, set:

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:4000
```

Sign in at `/login` with an admin or teacher phone number (dev seed: `9800000000`, OTP `123456`).

## Routes

| Route | Purpose |
| --- | --- |
| `/login` | Phone + OTP sign-in (admin/teacher only) |
| `/dashboard` | Analytics: stat cards and distribution charts |
| `/questions` | Question bank: filters, search, create/edit/delete, CSV import |
| `/digests` | "Today's 3 things" composer with draft → publish flow |
| `/mix` | Per-grade-band content mix (home / extra / global %) |
| `/schools` | School list with join codes, add school |

## Scripts

- `npm run dev` — dev server
- `npm run build` — production build
- `npm run lint` — ESLint
