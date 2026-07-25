export const GRADE_BANDS = ["1-3", "4-5", "6-8", "9-10", "11-12"];

export function gradeBandFor(grade) {
  if (grade <= 3) return "1-3";
  if (grade <= 5) return "4-5";
  if (grade <= 8) return "6-8";
  if (grade <= 10) return "9-10";
  return "11-12";
}

export function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Monday of the current week, YYYY-MM-DD (weekly leaderboard window). */
export function weekStart() {
  const d = new Date();
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function levelForXp(xp) {
  return Math.floor(Math.sqrt(Math.max(0, xp) / 50)) + 1;
}

export function friendCode(userId) {
  return `QQ-${String(userId).padStart(6, "0")}`;
}

export function parseFriendCode(code) {
  const m = /^QQ-?(\d{1,10})$/i.exec(String(code || "").trim());
  return m ? Number(m[1]) : null;
}

const NE_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
export function toNeDigits(n) {
  return String(n).replace(/\d/g, (d) => NE_DIGITS[Number(d)]);
}

// --- Bikram Sambat date (lookup-table conversion, BS 2081-2085) ---
const BS_MONTHS_NE = ["बैशाख", "जेठ", "असार", "साउन", "भदौ", "असोज", "कात्तिक", "मंसिर", "पुस", "माघ", "फागुन", "चैत"];
// Days in each BS month; reference: 2081-01-01 BS == 2024-04-13 AD
const BS_CAL = {
  2081: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2082: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  2083: [31, 31, 32, 31, 31, 30, 30, 30, 29, 30, 30, 30],
  2084: [31, 31, 32, 31, 31, 30, 30, 30, 29, 30, 30, 30],
  2085: [31, 32, 31, 32, 30, 31, 30, 30, 29, 30, 30, 30],
};
const BS_REF = { year: 2081, month: 0, day: 1, ad: new Date(2024, 3, 13) };

export function toBsDateString(adDate = new Date()) {
  let diff = Math.floor((adDate - BS_REF.ad) / 86400000);
  if (diff < 0) return null;
  let { year, month, day } = BS_REF;
  while (diff > 0) {
    const cal = BS_CAL[year];
    if (!cal) return null;
    const remainingInMonth = cal[month] - day;
    if (diff <= remainingInMonth) {
      day += diff;
      diff = 0;
    } else {
      diff -= remainingInMonth + 1;
      day = 1;
      month += 1;
      if (month > 11) {
        month = 0;
        year += 1;
      }
    }
  }
  return `${toNeDigits(year)} ${BS_MONTHS_NE[month]} ${toNeDigits(day)}`;
}

export function serializeUser(u) {
  return {
    id: u.id,
    phone: u.phone,
    name: u.name,
    role: u.role,
    grade: u.grade,
    language: u.language,
    homeCountry: u.home_country,
    extraCountries: JSON.parse(u.extra_countries || "[]"),
    subjects: JSON.parse(u.subjects || "[]"),
    quizTime: u.quiz_time,
    avatar: JSON.parse(u.avatar || "{}"),
    xp: u.xp,
    level: levelForXp(u.xp),
    streak: u.streak,
    bestStreak: u.best_streak,
    friendCode: friendCode(u.id),
    schoolId: u.school_id,
    onboarded: Boolean(u.grade && u.home_country),
  };
}

/** Question as students see it: localized, no correct answer. */
export function studentQuestion(q, language = "en") {
  const useNe = language === "ne" && q.text_ne;
  return {
    id: q.id,
    text: useNe ? q.text_ne : q.text_en,
    options: JSON.parse(useNe && q.options_ne ? q.options_ne : q.options_en),
    subject: q.subject,
    country: q.country,
    difficulty: q.difficulty,
    topic: q.topic,
  };
}

export function adminQuestion(q) {
  return {
    id: q.id,
    textEn: q.text_en,
    textNe: q.text_ne,
    optionsEn: JSON.parse(q.options_en),
    optionsNe: q.options_ne ? JSON.parse(q.options_ne) : null,
    correctIndex: q.correct_index,
    country: q.country,
    subject: q.subject,
    gradeBand: q.grade_band,
    difficulty: q.difficulty,
    topic: q.topic,
    source: q.source,
    status: q.status,
  };
}

export function serializeDigest(d) {
  if (!d) return null;
  return {
    id: d.id,
    date: d.date,
    gradeBand: d.grade_band,
    headlineEn: d.headline_en,
    headlineNe: d.headline_ne,
    gkFactEn: d.gk_fact_en,
    gkFactNe: d.gk_fact_ne,
    nepalFactEn: d.nepal_fact_en,
    nepalFactNe: d.nepal_fact_ne,
    status: d.status,
    bsDate: toBsDateString(new Date()),
  };
}

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
