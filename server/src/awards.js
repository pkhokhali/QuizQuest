import db from "./db.js";

const SUBJECTS = ["math", "science", "social", "english", "nepali", "gk", "current"];
const SUBJECT_NAMES = {
  math: ["Math", "गणित"],
  science: ["Science", "विज्ञान"],
  social: ["Social Studies", "सामाजिक"],
  english: ["English", "अंग्रेजी"],
  nepali: ["Nepali", "नेपाली"],
  gk: ["GK", "सामान्य ज्ञान"],
  current: ["Current Affairs", "समसामयिक"],
};

export const AWARDS = [
  { code: "streak_3", nameEn: "On Fire", nameNe: "आगोमा!", descEn: "3-day quest streak", descNe: "३ दिनको स्ट्रिक", icon: "🔥" },
  { code: "streak_7", nameEn: "Week Warrior", nameNe: "साप्ताहिक योद्धा", descEn: "7-day quest streak", descNe: "७ दिनको स्ट्रिक", icon: "⚡" },
  { code: "streak_30", nameEn: "Unstoppable", nameNe: "अजेय", descEn: "30-day quest streak", descNe: "३० दिनको स्ट्रिक", icon: "🌋" },
  { code: "first_battle", nameEn: "First Duel", nameNe: "पहिलो द्वन्द्व", descEn: "Played your first battle", descNe: "पहिलो ब्याटल खेल्नुभयो", icon: "⚔️" },
  { code: "battles_10", nameEn: "Battle Tested", nameNe: "ब्याटल अनुभवी", descEn: "Played 10 battles", descNe: "१० ब्याटल खेल्नुभयो", icon: "🛡️" },
  { code: "battle_wins_5", nameEn: "Champion Rising", nameNe: "उदाउँदो च्याम्पियन", descEn: "Won 5 battles", descNe: "५ ब्याटल जित्नुभयो", icon: "🏆" },
  { code: "global_explorer", nameEn: "Global Explorer", nameNe: "विश्व अन्वेषक", descEn: "Correct answers from 3+ countries", descNe: "३+ देशका प्रश्नमा सही जवाफ", icon: "🌍" },
  { code: "comeback", nameEn: "Comeback Star", nameNe: "फिर्ती स्टार", descEn: "Came back after a break — welcome back!", descNe: "विश्रामपछि फर्किनुभयो — स्वागत छ!", icon: "🌟" },
  { code: "quiz_10", nameEn: "Quest Regular", nameNe: "नियमित खोजी", descEn: "Completed 10 daily quests", descNe: "१० दैनिक क्वेस्ट पूरा", icon: "🎯" },
  { code: "quiz_50", nameEn: "Quest Legend", nameNe: "क्वेस्ट किंवदन्ती", descEn: "Completed 50 daily quests", descNe: "५० दैनिक क्वेस्ट पूरा", icon: "👑" },
  ...SUBJECTS.map((s) => ({
    code: `subject_master_${s}`,
    nameEn: `${SUBJECT_NAMES[s][0]} Master`,
    nameNe: `${SUBJECT_NAMES[s][1]} मास्टर`,
    descEn: `50 correct ${SUBJECT_NAMES[s][0]} answers`,
    descNe: `${SUBJECT_NAMES[s][1]}का ५० सही जवाफ`,
    icon: "🎓",
  })),
];

const AWARD_BY_CODE = Object.fromEntries(AWARDS.map((a) => [a.code, a]));

function grant(userId, code, earned) {
  const res = db
    .prepare("INSERT OR IGNORE INTO user_awards (user_id, award_code) VALUES (?, ?)")
    .run(userId, code);
  if (res.changes > 0) earned.push(AWARD_BY_CODE[code]);
}

/**
 * Evaluate all award conditions for a user; grants and returns newly earned awards.
 * opts.comeback: caller detected a return-after-break on this quiz completion.
 */
export function checkAwards(userId, opts = {}) {
  const earned = [];
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
  if (!user) return earned;

  if (user.streak >= 3) grant(userId, "streak_3", earned);
  if (user.streak >= 7) grant(userId, "streak_7", earned);
  if (user.streak >= 30) grant(userId, "streak_30", earned);
  if (opts.comeback) grant(userId, "comeback", earned);

  const quizzes = db
    .prepare("SELECT COUNT(*) c FROM quizzes WHERE user_id = ? AND kind = 'daily' AND completed = 1")
    .get(userId).c;
  if (quizzes >= 10) grant(userId, "quiz_10", earned);
  if (quizzes >= 50) grant(userId, "quiz_50", earned);

  const battles = db.prepare("SELECT COUNT(*) c FROM battles WHERE p1 = ? OR p2 = ?").get(userId, userId).c;
  if (battles >= 1) grant(userId, "first_battle", earned);
  if (battles >= 10) grant(userId, "battles_10", earned);
  const wins = db.prepare("SELECT COUNT(*) c FROM battles WHERE winner = ?").get(userId).c;
  if (wins >= 5) grant(userId, "battle_wins_5", earned);

  const countries = db
    .prepare(
      "SELECT COUNT(DISTINCT country) c FROM answer_log WHERE user_id = ? AND correct = 1 AND country != 'global'"
    )
    .get(userId).c;
  if (countries >= 3) grant(userId, "global_explorer", earned);

  const subjectCounts = db
    .prepare("SELECT subject, COUNT(*) c FROM answer_log WHERE user_id = ? AND correct = 1 GROUP BY subject")
    .all(userId);
  for (const row of subjectCounts) {
    if (row.c >= 50 && AWARD_BY_CODE[`subject_master_${row.subject}`]) {
      grant(userId, `subject_master_${row.subject}`, earned);
    }
  }
  return earned;
}

export function awardsForUser(userId) {
  const earnedRows = db.prepare("SELECT award_code, earned_at FROM user_awards WHERE user_id = ?").all(userId);
  const earnedMap = Object.fromEntries(earnedRows.map((r) => [r.award_code, r.earned_at]));
  return AWARDS.map((a) => ({ ...a, earned: a.code in earnedMap, earnedAt: earnedMap[a.code] || null }));
}
