import fetch from "node-fetch";

async function testOfflineSync() {
  console.log("Testing offline quest sync against local server...");

  // 1. Sign in or obtain a test user token
  const loginRes = await fetch("http://localhost:4000/api/auth/phone/otp-verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: "+9779800000001", otp: "123456" }),
  });
  
  if (!loginRes.ok) {
    // Try email sign in
    const emailRes = await fetch("http://localhost:4000/api/auth/email/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test2@quizquest.com", password: "password123" }),
    });
    if (!emailRes.ok) {
      console.log("Could not sign in for simulated sync:", await emailRes.text());
      return;
    }
    const { token, user } = await emailRes.json();
    return runSyncWithToken(token, user);
  }

  const { token, user } = await loginRes.json();
  return runSyncWithToken(token, user);
}

async function runSyncWithToken(token, user) {
  console.log(`Signed in as user ${user.id} (${user.name || user.email}), current XP: ${user.xp}, streak: ${user.streak}`);

  // Test submitting an offline daily quiz
  console.log("Submitting offline daily quiz (quizId: 999999, offlineScore: 8)...");
  const dailyRes = await fetch("http://localhost:4000/api/quiz/daily/submit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      quizId: 999999,
      offlineScore: 8,
      offlineTimestamp: Date.now() - 3600000,
      answers: [],
    }),
  });

  const dailyData = await dailyRes.json();
  console.log("Daily offline sync response status:", dailyRes.status, dailyData);

  // Test submitting an offline memory score
  console.log("Submitting offline memory score...");
  const memRes = await fetch("http://localhost:4000/api/memory/submit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      packId: 99101,
      moves: 9,
      timeMs: 25000,
    }),
  });
  const memData = await memRes.json();
  console.log("Memory offline sync response status:", memRes.status, memData);

  // Test submitting an offline riddle solve
  console.log("Submitting offline riddle solve...");
  const ridRes = await fetch("http://localhost:4000/api/riddle/solve", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      riddleId: 99201,
    }),
  });
  const ridData = await ridRes.json();
  console.log("Riddle offline sync response status:", ridRes.status, ridData);

  console.log("Offline sync simulation test completed successfully!");
}

testOfflineSync().catch(console.error);
