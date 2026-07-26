// End-to-end API smoke test against a running server. Usage: node scripts/smoke.js
const BASE = process.env.BASE_URL || "http://localhost:4000";
let failures = 0;

async function call(method, path, { token, body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

function check(name, cond, extra = "") {
  if (cond) console.log(`  PASS  ${name}`);
  else { failures++; console.log(`  FAIL  ${name} ${extra}`); }
}

const health = await call("GET", "/");
check("health", health.json.ok === true && health.json.questions > 10000, JSON.stringify(health.json));

// Student login (demo)
const login = await call("POST", "/api/auth/verify", { body: { phone: "9811111101", code: "123456" } });
check("student login", login.status === 200 && login.json.token && login.json.user.onboarded === true);
const t = login.json.token;

const home = await call("GET", "/api/home", { token: t });
check("home", home.status === 200 && home.json.digest && home.json.dailyQuiz, JSON.stringify(home.json).slice(0, 200));

const daily = await call("GET", "/api/quiz/daily", { token: t });
check("daily quiz composed", daily.status === 200 && daily.json.questions.length >= 6, `got ${daily.json.questions?.length}`);
check("no answer leak", daily.json.questions.every((q) => !("correctIndex" in q)));

const daily2 = await call("GET", "/api/quiz/daily", { token: t });
check("daily quiz idempotent", daily2.json.quizId === daily.json.quizId &&
  JSON.stringify(daily2.json.questions.map((q) => q.id)) === JSON.stringify(daily.json.questions.map((q) => q.id)));

const answers = daily.json.questions.map((q) => ({ questionId: q.id, choice: 0, timeMs: 3000 }));
const submit = await call("POST", "/api/quiz/daily/submit", { token: t, body: { quizId: daily.json.quizId, answers } });
check("daily submit", submit.status === 200 && Array.isArray(submit.json.correct) && submit.json.streak >= 1, JSON.stringify(submit.json).slice(0, 200));

const resubmit = await call("POST", "/api/quiz/daily/submit", { token: t, body: { quizId: daily.json.quizId, answers } });
check("double submit rejected", resubmit.status === 400);

const lb = await call("GET", "/api/leaderboard?scope=class", { token: t });
check("leaderboard", lb.status === 200 && lb.json.me && lb.json.top3.length > 0);

const awards = await call("GET", "/api/awards", { token: t });
check("awards", awards.status === 200 && awards.json.awards.length > 10);

const friends = await call("GET", "/api/friends", { token: t });
check("friends", friends.status === 200 && friends.json.friends.length > 0);

const hist = await call("GET", "/api/battles/history", { token: t });
check("battle history", hist.status === 200 && Array.isArray(hist.json.battles));

// New user onboarding
const newLogin = await call("POST", "/api/auth/verify", { body: { phone: "9899999999", code: "123456", name: "Test Kid" } });
check("new user", newLogin.json.user.onboarded === false);
const onboard = await call("PUT", "/api/me", {
  token: newLogin.json.token,
  body: { grade: 8, homeCountry: "nepal", extraCountries: ["india", "usa"], subjects: ["math"], language: "ne", quizTime: "evening" },
});
check("onboarding", onboard.json.user.onboarded === true && onboard.json.user.extraCountries.length === 2);
const neQuiz = await call("GET", "/api/quiz/daily", { token: newLogin.json.token });
check("nepali quiz served", neQuiz.status === 200 && neQuiz.json.questions.length >= 6);

// Admin
const admin = await call("POST", "/api/auth/verify", { body: { phone: "9800000000", code: "123456" } });
check("admin login", admin.json.user.role === "admin");
const at = admin.json.token;
check("student blocked from admin", (await call("GET", "/api/admin/analytics", { token: t })).status === 403);

const analytics = await call("GET", "/api/admin/analytics", { token: at });
check("analytics", analytics.status === 200 && analytics.json.totals.questions > 10000, JSON.stringify(analytics.json.totals));

const qList = await call("GET", "/api/admin/questions?subject=math&gradeBand=6-8&page=1&pageSize=5", { token: at });
check("question list + filters", qList.status === 200 && qList.json.questions.length === 5 && qList.json.total > 100);

const created = await call("POST", "/api/admin/questions", {
  token: at,
  body: { textEn: "Smoke test question?", optionsEn: ["A", "B", "C", "D"], correctIndex: 1, country: "nepal", subject: "gk", gradeBand: "6-8", difficulty: 2, topic: "smoke" },
});
check("question create", created.status === 200 && created.json.question.id > 0);
const upd = await call("PUT", `/api/admin/questions/${created.json.question.id}`, { token: at, body: { difficulty: 4 } });
check("question update", upd.json.question?.difficulty === 4);
check("question delete", (await call("DELETE", `/api/admin/questions/${created.json.question.id}`, { token: at })).json.ok === true);

const csv = `textEn,option1En,option2En,option3En,option4En,correctIndex,country,subject,gradeBand,difficulty,topic\n"CSV import works?",Yes,No,Maybe,Never,0,global,gk,6-8,1,csv-test\nBadRow,Yes,No,,,9,global,gk,6-8,1,x`;
const imp = await call("POST", "/api/admin/questions/import", { token: at, body: { csv } });
check("csv import", imp.json.imported === 1 && imp.json.skipped === 1, JSON.stringify(imp.json));

const dig = await call("POST", "/api/admin/digests", { token: at, body: { date: "2026-07-26", gradeBand: "9-10", headlineEn: "Smoke digest" } });
check("digest draft", dig.json.digest?.status === "draft");
const appr = await call("POST", `/api/admin/digests/${dig.json.digest.id}/approve`, { token: at });
check("digest approve", appr.json.digest?.status === "published");

const mix = await call("PUT", "/api/admin/mix-config", { token: at, body: { gradeBand: "6-8", homePct: 50, extraPct: 30, globalPct: 20 } });
check("mix config update", mix.status === 200);
check("mix config rejects bad sum", (await call("PUT", "/api/admin/mix-config", { token: at, body: { gradeBand: "6-8", homePct: 50, extraPct: 30, globalPct: 30 } })).status === 400);

const schools = await call("GET", "/api/admin/schools", { token: at });
check("schools", schools.json.schools?.length >= 2);

// Student joins a school by code → class/school ranks populate
const joinCode = schools.json.schools?.[0]?.joinCode;
const join = await call("POST", "/api/school/join", { token: newLogin.json.token, body: { joinCode } });
check("school join", join.status === 200 && join.json.user.schoolId && join.json.user.schoolName, JSON.stringify(join.json).slice(0, 200));
const badJoin = await call("POST", "/api/school/join", { token: newLogin.json.token, body: { joinCode: "SCH-NOPE00" } });
check("school join rejects bad code", badJoin.status === 404);

// "afterschool" quiz time is accepted (previously silently dropped)
const afterschool = await call("PUT", "/api/me", { token: newLogin.json.token, body: { quizTime: "afterschool" } });
check("afterschool quizTime saved", afterschool.json.user.quizTime === "afterschool", JSON.stringify(afterschool.json.user.quizTime));

console.log(failures === 0 ? "\nAll smoke tests passed." : `\n${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
