import db from "../db.js";
import { pushDigestNotification, broadcastPushNotification } from "./notifications.js";
import { GRADE_BANDS } from "../util.js";

const TIMEZONE = process.env.DIGEST_TIMEZONE || "Asia/Kathmandu";
const SCHEDULE_HOUR = Number(process.env.DIGEST_SCHEDULE_HOUR ?? 7);
const SCHEDULE_MINUTE = Number(process.env.DIGEST_SCHEDULE_MINUTE ?? 0);

const ZIP_HOUR = Number(process.env.ZIP_SCHEDULE_HOUR ?? 12);
const ZIP_MINUTE = Number(process.env.ZIP_SCHEDULE_MINUTE ?? 30);

const STREAK_HOUR = Number(process.env.STREAK_SCHEDULE_HOUR ?? 19);
const STREAK_MINUTE = Number(process.env.STREAK_SCHEDULE_MINUTE ?? 30);

let lastRunDate = null;
let lastZipPushDate = null;
let lastStreakPushDate = null;
let timerId = null;

/**
 * Returns current time parts in the configured timezone.
 */
export function getLocalTime(tz = TIMEZONE) {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const find = (type) => parts.find((p) => p.type === type)?.value;

  const year = find("year");
  const month = find("month");
  const day = find("day");
  const hour = Number(find("hour"));
  const minute = Number(find("minute"));
  const second = Number(find("second"));

  return {
    isoDate: `${year}-${month}-${day}`,
    hour,
    minute,
    second,
    formatted: `${year}-${month}-${day} ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}`,
    timezone: tz,
  };
}

/**
 * Rich, educational fact pools that rotate every single day.
 */
const GK_POOL = [
  { en: "Honey never spoils: archaeologists found 3,000-year-old honey in Egyptian tombs that is still completely edible!", ne: "मह कहिल्यै बिग्रँदैन: पुरातत्वविद्हरूले इजिप्टका चिहानहरूमा ३००० वर्ष पुरानो खानयोग्य मह भेट्टाएका छन्।" },
  { en: "Octopuses have three hearts and blue blood!", ne: "अक्टोपसका तीनवटा मुटु र नीलो रगत हुन्छ!" },
  { en: "A day on planet Venus is longer than an entire year on Venus.", ne: "शुक्र ग्रहको एक दिन उसको एक वर्षभन्दा पनि लामो हुन्छ।" },
  { en: "Bananas are curved because they grow towards the sun against gravity (negative geotropism).", ne: "केरा गुरुत्वाकर्षणको विपरित सूर्यतर्फ फर्केर हुर्कने भएकाले बाङ्गो हुन्छ।" },
  { en: "Sound travels about 4 times faster through water than through air.", ne: "ध्वनि हावामा भन्दा पानीमा करिब ४ गुणा छिटो यात्रा गर्छ।" },
  { en: "The human brain generates enough electrical energy to power a small LED light bulb!", ne: "मानव मस्तिष्कले सानो एलइडी चिम बाल्न पुग्ने विद्युत शक्ति उत्पादन गर्दछ!" },
  { en: "Water can boil and freeze at the exact same temperature under a condition called the 'triple point'!", ne: "'ट्रिपल पोइन्ट' अवस्थामा पानी एकै समयमा उम्लन र जम्न सक्छ!" },
  { en: "Light from the Sun takes approximately 8 minutes and 20 seconds to reach Earth.", ne: "सूर्यको प्रकाश पृथ्वीसम्म आइपुग्न करिब ८ मिनेट २० सेकेन्ड लाग्छ।" },
  { en: "A bolt of lightning is five times hotter than the surface of the Sun!", ne: "आकाशमा चम्कने चट्याङ सूर्यको सतहभन्दा पाँच गुणा बढी तातो हुन्छ!" },
  { en: "Sharks existed on Earth before trees and even before Saturn developed its rings!", ne: "रूखहरू र शनिको घेरा बन्नुभन्दा पहिले नै पृथ्वीमा शार्कहरू अस्तित्वमा थिए!" },
  { en: "Butterflies taste their food using sensory receptors located in their feet!", ne: "पुतलीहरूले आफ्नो खुट्टामा रहेका स्वाद रिसेप्टरहरू प्रयोग गरेर खानाको स्वाद लिन्छन्!" },
  { en: "A cloud can weigh more than a million pounds (about 500,000 kilograms)!", ne: "एउटा बादलको तौल १० लाख पाउण्ड (करिब ५ लाख किलोग्राम) भन्दा बढी हुन सक्छ!" },
  { en: "Hot water can freeze faster than cold water under certain conditions, known as the Mpemba effect.", ne: "केही विशेष अवस्थामा चिसो पानीभन्दा तातो पानी छिटो जम्छ, जसलाई 'म्पेम्बा प्रभाव' भनिन्छ।" },
  { en: "The heart of a blue whale is the size of a small car and beats only 5 to 6 times per minute!", ne: "निलो ह्वेलको मुटु एउटा सानो कार जत्रो हुन्छ र प्रतिमिनेट ५ देखि ६ पटक मात्र धड्किन्छ!" },
  { en: "About 70% of oxygen on Earth is produced by marine plants and phytoplankton in our oceans!", ne: "पृथ्वीमा पाइने अक्सिजनको करिब ७०% भाग महासागरका वनस्पति र फाइटोप्लाङ्क्टनहरूले उत्पादन गर्छन्!" },
  { en: "DNA in all human cells, if uncoiled and placed end-to-end, would reach from Pluto and back twice!", ne: "मानव शरीरका सबै कोषको डीएनए तन्काउने हो भने त्यो यम ग्रह पुगेर दुई पटक फर्कन सक्छ!" },
];

const NEPAL_POOL = [
  { en: "Nepal is home to Mount Everest (8,848.86m), the highest peak in the world, known locally as Sagarmatha.", ne: "नेपालमा विश्वको सर्वोच्च शिखर सगरमाथा (८,८४८.८६ मिटर) अवस्थित छ।" },
  { en: "Nepal has the only non-quadrilateral national flag in the entire world, consisting of two triangular pennants.", ne: "नेपालको राष्ट्रिय झण्डा विश्वकै एक मात्र चारकुने नभएको त्रिकोणात्मक झण्डा हो।" },
  { en: "Lumbini in Nepal is the sacred birthplace of Lord Gautam Buddha, the Light of Asia.", ne: "नेपालको लुम्बिनी एसियाका ज्योति भगवान गौतम बुद्धको पवित्र जन्मस्थल हो।" },
  { en: "Nepal hosts over 850 bird species, representing nearly 9% of the world's total bird population.", ne: "नेपालमा ८५० भन्दा बढी प्रजातिका चराहरू पाइन्छन्, जुन विश्वको चराहरूको करिब ९% हो।" },
  { en: "Muktinath temple at 3,710m is sacred to both Hindus and Buddhists as a place of spiritual liberation.", ne: "३,७१० मिटरको उचाइमा रहेको मुक्तिनाथ मन्दिर हिन्दु र बौद्ध दुवै धर्मावलम्बीको साझा तीर्थस्थल हो।" },
  { en: "Tilicho Lake at 4,919 meters in Manang is one of the highest altitude freshwater lakes in the world!", ne: "मनाङमा ४,९१९ मिटरको उचाइमा रहेको तिलिचो ताल विश्वकै अग्लो स्थानमा रहेका तालहरूमध्ये एक हो!" },
  { en: "Nepal is home to the rare One-Horned Rhinoceros and the endangered Royal Bengal Tiger in Chitwan National Park.", ne: "चितवन राष्ट्रिय निकुञ्जमा दुर्लभ एकसिङ्गे गैँडा र पाटे बाघ पाइन्छन्।" },
  { en: "The Kali Gandaki gorge between Annapurna and Dhaulagiri is the deepest canyon in the world!", ne: "अन्नपूर्ण र धौलागिरी हिमालको बीचमा रहेको कालीगण्डकी खोँच विश्वकै गहिरो खोँच हो!" },
  { en: "Kathmandu Valley has 7 UNESCO World Heritage monument zones within a radius of just 20 kilometers!", ne: "काठमाडौँ उपत्यकामा २० किलोमिटरको दायराभित्रै ७ वटा युनेस्को विश्व सम्पदा स्थलहरू छन्!" },
  { en: "Nepal has never been colonized or conquered by any foreign empire throughout its history!", ne: "नेपाल आफ्नो सम्पूर्ण इतिहासमा कहिल्यै कुनै विदेशी साम्राज्यको उपनिवेश वा पराधीन भएन!" },
  { en: "Rara Lake in Mugu is Nepal's biggest and deepest freshwater lake, changing shades of blue with the sunlight.", ne: "मुगुको रारा ताल नेपालको सबैभन्दा ठूलो र गहिरो ताल हो, जसको पानी घामसँगै रङ फेरिरहन्छ।" },
  { en: "Nepal boasts 8 of the world's 14 mountains that rise above 8,000 meters in altitude!", ne: "विश्वका ८,००० मिटरभन्दा अग्ला १४ हिमालहरूमध्ये ८ वटा नेपालमै पर्दछन्!" },
  { en: "Nepal has its own unique calendar, the Bikram Sambat (BS), which is approximately 56.7 years ahead of the Gregorian calendar.", ne: "नेपालको आफ्नै मौलिक विक्रम संवत् (वि.सं.) छ, जुन इस्वी संवत् भन्दा करिब ५६.७ वर्ष अगाडि छ।" },
  { en: "The Spiny Babbler (काँडे भ्याकुर) is a unique bird found exclusively in Nepal and nowhere else on Earth!", ne: "काँडे भ्याकुर विश्वको कुनै पनि देशमा नपाइने, केवल नेपालमा मात्र पाइने दुर्लभ चरा हो!" },
  { en: "Janakpurdham in Dhanusha is the historic capital of the ancient Mithila Kingdom and birthplace of Goddess Sita.", ne: "धनुषाको जनकपुरधाम प्राचीन मिथिला राज्यको ऐतिहासिक राजधानी र माता सीताको जन्मस्थल हो।" },
];

/**
 * Auto-generates a set of 3 grade-band digests for a given date if missing.
 * Facts deterministically rotate each day based on date seed.
 */
export function autoGenerateDigestsForDate(dateStr) {
  const created = [];
  const existing = db.prepare("SELECT grade_band FROM digests WHERE date = ?").all(dateStr);
  const existingBands = new Set(existing.map((e) => e.grade_band));

  // Compute a unique day seed from YYYY-MM-DD so every day rotates to a new fact
  const parts = dateStr.split("-").map(Number);
  const dayHash = (parts[0] || 2026) * 365 + (parts[1] || 1) * 31 + (parts[2] || 1);

  for (let i = 0; i < GRADE_BANDS.length; i++) {
    const band = GRADE_BANDS[i];
    if (existingBands.has(band)) continue;

    const gk = GK_POOL[(dayHash + i * 7) % GK_POOL.length];
    const np = NEPAL_POOL[(dayHash + i * 11) % NEPAL_POOL.length];

    const headlineEn = band === "1-5"
      ? "Explorer Day: Discover Super Wonders!"
      : band === "6-8"
      ? "Trailblazer Quest: Science & Himalayan Wonders!"
      : "Scholar Focus: SEE Prep & Global Mastery!";

    const headlineNe = band === "1-5"
      ? "अन्वेषक दिन: अद्भुत रहस्यहरू पत्ता लगाउनुहोस्!"
      : band === "6-8"
      ? "दैनिक खोज: विज्ञान र हिमाली आश्चर्यहरू!"
      : "विद्यार्थी प्रेरणा: उच्च सफलताको दैनिक यात्रा!";

    const info = db.prepare(`
      INSERT INTO digests (date, grade_band, headline_en, headline_ne, gk_fact_en, gk_fact_ne, nepal_fact_en, nepal_fact_ne, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'published')
    `).run(dateStr, band, headlineEn, headlineNe, gk.en, gk.ne, np.en, np.ne);

    const row = db.prepare("SELECT * FROM digests WHERE id = ?").get(info.lastInsertRowid);
    created.push(row);
  }

  return created;
}

/**
 * Executes the 7:00 AM daily digest push routine.
 */
export async function executeScheduledDailyPush() {
  const local = getLocalTime();
  console.log(`[Scheduler] ⏰ Triggering 7:00 AM daily digest push for ${local.isoDate} (${local.formatted})...`);

  // Check published digests for today
  let digests = db.prepare("SELECT * FROM digests WHERE date = ? AND status = 'published'").all(local.isoDate);

  // If no published digests, check for drafts and auto-publish them
  if (!digests.length) {
    const drafts = db.prepare("SELECT * FROM digests WHERE date = ? AND status = 'draft'").all(local.isoDate);
    if (drafts.length) {
      db.prepare("UPDATE digests SET status = 'published' WHERE date = ? AND status = 'draft'").run(local.isoDate);
      digests = db.prepare("SELECT * FROM digests WHERE date = ? AND status = 'published'").all(local.isoDate);
    }
  }

  // If still no digests, auto-generate them with today's fresh rotating facts
  if (!digests.length) {
    console.log(`[Scheduler] No digests found for today. Auto-generating fresh digests for ${local.isoDate}...`);
    digests = autoGenerateDigestsForDate(local.isoDate);
  }

  // Push notifications for each grade band
  let totalPushed = 0;
  for (const digest of digests) {
    try {
      const res = await pushDigestNotification({
        digest,
        isManual: false,
        adminEmail: "auto_scheduler@quizquest",
      });
      totalPushed += res.success;
      console.log(`[Scheduler] Published & pushed digest #${digest.id} (Grades ${digest.grade_band}): ${res.success} devices.`);
    } catch (err) {
      console.error(`[Scheduler] Error pushing digest #${digest.id}:`, err);
    }
  }

  lastRunDate = local.isoDate;
  return { date: local.isoDate, totalPushed, count: digests.length };
}

/**
 * Executes the 12:30 PM Daily Zip puzzle challenge reminder push.
 */
export async function executeScheduledZipPush() {
  const local = getLocalTime();
  console.log(`[Scheduler] ⚡ Triggering 12:30 PM Daily Zip reminder for ${local.isoDate}...`);
  try {
    const res = await broadcastPushNotification({
      title: "⚡ Today's Daily Zip is Live!",
      body: "A new 6×6 Zip path puzzle is waiting! Can you connect all checkpoints and beat your friends? 🧩",
      data: { type: "zip_daily", date: local.isoDate },
    });
    console.log(`[Scheduler] Pushed Daily Zip reminder to ${res.success} devices.`);
    lastZipPushDate = local.isoDate;
    return res;
  } catch (err) {
    console.error("[Scheduler] Error pushing daily zip reminder:", err);
  }
}

/**
 * Executes the 7:30 PM Evening streak protector reminder push.
 */
export async function executeScheduledStreakPush() {
  const local = getLocalTime();
  console.log(`[Scheduler] 🔥 Triggering 7:30 PM Streak Protector reminder for ${local.isoDate}...`);
  try {
    const res = await broadcastPushNotification({
      title: "🔥 Don't Lose Your Daily Streak!",
      body: "Only a few hours left today! Complete your daily quiz now to protect your flame and climb the leaderboard.",
      data: { type: "streak_reminder", date: local.isoDate },
    });
    console.log(`[Scheduler] Pushed Streak reminder to ${res.success} devices.`);
    lastStreakPushDate = local.isoDate;
    return res;
  } catch (err) {
    console.error("[Scheduler] Error pushing streak reminder:", err);
  }
}

/**
 * Periodic tick checking every 30 seconds for scheduled times.
 */
function tick() {
  try {
    const local = getLocalTime();

    // 1. Daily Digest Push (7:00 AM)
    if (
      local.hour === SCHEDULE_HOUR &&
      local.minute === SCHEDULE_MINUTE &&
      lastRunDate !== local.isoDate
    ) {
      executeScheduledDailyPush();
    }

    // 2. Daily Zip Challenge Reminder (12:30 PM)
    if (
      local.hour === ZIP_HOUR &&
      local.minute === ZIP_MINUTE &&
      lastZipPushDate !== local.isoDate
    ) {
      executeScheduledZipPush();
    }

    // 3. Evening Streak Protector Reminder (7:30 PM)
    if (
      local.hour === STREAK_HOUR &&
      local.minute === STREAK_MINUTE &&
      lastStreakPushDate !== local.isoDate
    ) {
      executeScheduledStreakPush();
    }
  } catch (err) {
    console.error("[Scheduler] Tick error:", err);
  }
}

/**
 * Starts the background scheduler service.
 */
export function startDigestScheduler() {
  if (timerId) clearInterval(timerId);
  console.log(`[Scheduler] 🚀 Daily Digest Scheduler active. Configured for ${String(SCHEDULE_HOUR).padStart(2, "0")}:${String(SCHEDULE_MINUTE).padStart(2, "0")} ${TIMEZONE}.`);
  // Tick immediately and then every 30 seconds
  tick();
  timerId = setInterval(tick, 30000);
}

/**
 * Returns diagnostic details about the scheduler.
 */
export function getSchedulerStatus() {
  const local = getLocalTime();
  const tokenCount = db.prepare("SELECT COUNT(*) c FROM push_tokens").get()?.c || 0;
  const userTokensCount = db.prepare("SELECT COUNT(DISTINCT user_id) c FROM push_tokens").get()?.c || 0;
  const todayDigests = db.prepare("SELECT COUNT(*) c FROM digests WHERE date = ?").get(local.isoDate)?.c || 0;

  return {
    active: true,
    timezone: TIMEZONE,
    scheduleHour: SCHEDULE_HOUR,
    scheduleMinute: SCHEDULE_MINUTE,
    currentTime: local.formatted,
    currentDate: local.isoDate,
    lastRunDate,
    registeredTokens: tokenCount,
    uniqueUsersWithPush: userTokensCount,
    todayDigestsCount: todayDigests,
    nextRun: `${local.isoDate} ${String(SCHEDULE_HOUR).padStart(2, "0")}:${String(SCHEDULE_MINUTE).padStart(2, "0")}:00 (${TIMEZONE})`,
  };
}
