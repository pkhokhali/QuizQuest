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
  { en: "Venus is the hottest planet in our solar system, with surface temperatures over 460°C due to thick greenhouse clouds!", ne: "शुक्र ग्रह सौर्यमण्डलको सबैभन्दा तातो ग्रह हो, जहाँ हरितगृह प्रभावका कारण तापक्रम ४६० डिग्री सेल्सियसभन्दा बढी पुग्छ।" },
  { en: "A single teaspoon of a neutron star weighs about 6 billion tons on Earth!", ne: "न्युट्रोन ताराको एक चम्चा धुलोको तौल पृथ्वीमा करिब ६ अर्ब टन बराबर हुन्छ!" },
  { en: "Cows have best friends and get visibly stressed when separated from them!", ne: "गाईहरूका पनि मिल्ने साथी हुन्छन् र एकअर्काबाट छुटिँदा उनीहरू तनावमा पर्छन्।" },
  { en: "Wombat poop is cube-shaped, preventing it from rolling away down rocky hills!", ne: "वोम्ब्याट नामक जनावरको दिसा घन (क्युब) आकारको हुन्छ, जसले गर्दा भीरबाट गुल्टिँदैन।" },
  { en: "Glass is technically an amorphous solid that behaves like a supercooled liquid!", ne: "काँच प्राविधिक रूपमा एक अस्फटिक ठोस हो जसले अति-शीतित तरल पदार्थ जस्तो व्यवहार गर्छ।" },
  { en: "Bamboo can grow up to 91 centimeters (35 inches) within a single 24-hour day!", ne: "बाँस एकै दिन (२४ घण्टा) मा ९१ सेन्टिमिटरसम्म अग्लो हुन सक्छ!" },
  { en: "A hummingbird flaps its wings up to 80 times per second and can fly backwards!", ne: "हमिङबर्डले प्रतिसेकेन्ड ८० पटकसम्म पखेटा फट्फटाउन सक्छ र पछाडितर्फ पनि उड्न सक्छ।" },
  { en: "There are more trees on Earth (about 3 trillion) than there are stars in the Milky Way galaxy (about 100-400 billion)!", ne: "मिल्की वे आकाशगंगामा रहेका ताराहरू भन्दा पृथ्वीमा रहेका रूखहरूको संख्या (करिब ३० खर्ब) धेरै छ!" },
  { en: "Saturn's moon Titan has thick orange atmosphere and lakes filled with liquid methane and ethane!", ne: "शनि ग्रहको उपग्रह टाइटनमा बाक्लो वायुमण्डल र तरल मिथेनका तालहरू छन्।" },
  { en: "Diamonds are forged from carbon under temperatures of over 1,000°C deep within Earth's mantle!", ne: "पृथ्वीको गहिराइमा १,००० डिग्री सेल्सियसभन्दा बढी ताप र उच्च चापमा कार्बनबाट हिरा बन्दछ।" },
  { en: "Koalas sleep up to 20 hours a day because eucalyptus leaves take immense energy to digest!", ne: "कोआलाहरू दिनमा २० घण्टासम्म सुत्छन् किनकि मसलाको पात पचाउन धेरै ऊर्जा खर्च हुन्छ।" },
  { en: "Sunlight hitting Earth in one single hour could power the entire global energy demand for a whole year!", ne: "पृथ्वीमा एक घण्टामा पर्ने सौर्य ऊर्जाले विश्वभरिको पूरै एक वर्षको ऊर्जा माग धान्न सक्छ।" },
  { en: "An adult human body contains approximately 37.2 trillion living cells!", ne: "वयस्क मानव शरीरमा करिब ३७.२ ट्रिलियन (३७२ खर्ब) जीवित कोषहरू हुन्छन्।" },
  { en: "The human eye can distinguish over 10 million distinct color shades!", ne: "मानव आँखाले १ करोडभन्दा बढी फरक-फरक रङका छटाहरू छुट्याउन सक्छ।" },
  { en: "Water expands by about 9% in volume when it freezes into ice, which is why ice floats!", ne: "पानी जमेर बरफ बन्दा यसको आयतन करिब ९% ले फैलिन्छ, जसले गर्दा बरफ पानीमाथि तैरिन्छ।" },
  { en: "The Mariana Trench in the Pacific Ocean is nearly 11,000 meters deep — deeper than Mt. Everest is tall!", ne: "प्रशान्त महासागरको मारियाना ट्रेन्च करिब ११,००० मिटर गहिरो छ — जुन सगरमाथाको उचाइभन्दा पनि बढी हो!" },
  { en: "Ants can lift objects between 10 to 50 times their own body weight!", ne: "कमिलाहरूले आफ्नो शरीरको तौलभन्दा १० देखि ५० गुणा बढी तौल उठाउन सक्छन्।" },
  { en: "The Great Barrier Reef in Australia is so vast it is visible from outer space!", ne: "अष्ट्रेलियाको ग्रेट ब्यारियर रिफ यति विशाल छ कि यसलाई अन्तरिक्षबाट पनि देख्न सकिन्छ।" },
  { en: "Lightning strikes planet Earth approximately 8 million times every single day!", ne: "पृथ्वीमा हरेक दिन करिब ८० लाख पटक आकाशे चट्याङ पर्दछ।" },
  { en: "Your skeleton completely replaces its cellular bone tissue every 10 years!", ne: "मानव शरीरको कंकालले हरेक १० वर्षमा आफ्ना पुराना हड्डी कोषहरू पूर्ण रूपमा नयाँ फेर्छ।" },
  { en: "The speed of sound through steel is around 5,960 meters per second — 17 times faster than in air!", ne: "स्टिलमा ध्वनिको गति प्रतिसेकेन्ड करिब ५,९६० मिटर हुन्छ — जुन हावाको भन्दा १७ गुणा छिटो हो।" },
  { en: "Jupiter's Great Red Spot is a giant storm that has been raging continuously for over 350 years!", ne: "बृहस्पति ग्रहको 'ग्रेट रेड स्पट' ३५० वर्षभन्दा बढी समयदेखि निरन्तर चलिरहेको विशाल आँधी हो।" },
  { en: "Tears from happiness and tears from sadness have different chemical and microscopic structures!", ne: "खुसी हुँदा आउने आँसु र दुःखमा आउने आँसुको रासायनिक र सूक्ष्मदर्शीय संरचना फरक हुन्छ।" },
  { en: "Cats spend roughly 70% of their entire lives sleeping or resting!", ne: "बिरालाहरूले आफ्नो सम्पूर्ण जीवनको करिब ७०% समय सुतेर वा आराम गरेर बिताउँछन्।" },
  { en: "Gold is so malleable that a single ounce (28 grams) can be beaten into a 100-square-foot sheet!", ne: "सुन यति लचकदार धातु हो कि एक औन्स (२८ ग्राम) सुनलाई पिटेर १०० वर्गफुटको पातलो पाता बनाउन सकिन्छ।" },
  { en: "Polar bear fur is not actually white; it is translucent and hollow, reflecting light like snow!", ne: "ध्रुवीय भालुको रौं वास्तवमा सेतो हुँदैन; यो पारदर्शी र खोक्रो हुन्छ जसले हिउँ जस्तै प्रकाश परावर्तन गर्छ।" },
  { en: "The human tongue has between 2,000 and 8,000 microscopic taste buds that regenerate every two weeks!", ne: "मानव जिब्रोमा २,००० देखि ८,००० सम्म स्वाद ग्रन्थिहरू हुन्छन् जुन हरेक दुई हप्तामा नयाँ बन्छन्।" },
  { en: "Pluto was reclassified as a dwarf planet by the International Astronomical Union in 2006.", ne: "सन् २००६ मा अन्तर्राष्ट्रिय खगोलीय संघले यम (प्लुटो) लाई 'पुड्के ग्रह' को श्रेणीमा राखेको थियो।" },
  { en: "The Eiffel Tower in Paris expands and grows up to 15 centimeters taller during the heat of summer!", ne: "गर्मी महिनामा फलाम फैलिने हुनाले पेरिसको एफिल टावर १५ सेन्टिमिटरसम्म अग्लो हुन्छ।" },
  { en: "Owls cannot rotate their eyeballs; instead, they can rotate their entire neck up to 270 degrees!", ne: "उल्लुले आफ्नो आँखाको नानी घुमाउन सक्दैन, त्यसैले उसले आफ्नो पूरै गर्धन २७० डिग्रीसम्म घुमाउँछ।" },
  { en: "The international Space Station travels at 28,000 km/h, orbiting Earth once every 90 minutes!", ne: "अन्तर्राष्ट्रिय अन्तरिक्ष स्टेशन २८,००० किमी/घण्टाको गतिमा कुद्छ र ९० मिनेटमै पृथ्वीको एक फन्को मार्छ।" },
  { en: "Cheetahs can accelerate from 0 to 96 km/h in just 3 seconds — faster than most sports supercars!", ne: "चितुवा (चिता) ले केवल ३ सेकेन्डमै ० देखि ९६ किमी/घण्टाको गति लिन सक्छ — जुन धेरैजसो स्पोर्ट्स कारभन्दा छिटो हो।" },
  { en: "An elephant trunk contains over 40,000 distinct muscles and can lift up to 350 kilograms!", ne: "हात्तीको सुँढमा ४०,००० भन्दा बढी मांसपेशीहरू हुन्छन् र यसले ३५० किलोग्रामसम्म तौल उठाउन सक्छ।" },
  { en: "Earth is the only known planet where water exists naturally in all three states: liquid, solid, and gas!", ne: "पृथ्वी एक मात्र ज्ञात ग्रह हो जहाँ पानी प्राकृतिक रूपमा तीनवटै अवस्था (तरल, ठोस र ग्यास) मा पाइन्छ।" },
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
  { en: "Pashupatinath Temple in Kathmandu is one of the most sacred Hindu pilgrimage sites in the entire world.", ne: "काठमाडौँको पशुपतिनाथ मन्दिर संसारभरिका हिन्दुहरूको एक अत्यन्त पवित्र तीर्थस्थल हो।" },
  { en: "Nepal has 77 administrative districts distributed across 7 federal provinces.", ne: "नेपालमा ७ वटा संघीय प्रदेश र ७७ वटा प्रशासनिक जिल्लाहरू रहेका छन्।" },
  { en: "The Rhododendron (Lali Gurans) is the national flower of Nepal, blooming across Himalayan forests in spring.", ne: "लालीगुराँस नेपालको राष्ट्रिय फूल हो, जुन वसन्त ऋतुमा पहाडी वनहरूमा ढकमक्क फुल्दछ।" },
  { en: "Swayambhunath Stupa, also known as the Monkey Temple, has stood above Kathmandu Valley for over 2,000 years!", ne: "काठमाडौँको स्वयम्भूनाथ स्तुप २,००० वर्षभन्दा बढी पुरानो ऐतिहासिक तथा धार्मिक सम्पदा हो।" },
  { en: "Bhadgaon (Bhaktapur) is world-famous for its 55-Window Palace and the architectural wonder Nyatapola Temple.", ne: "भक्तपुर आफ्नो ५५ झ्याले दरबार र पाँचतले ङातापोला मन्दिरको उत्कृष्ट वास्तुकलाका लागि प्रसिद्ध छ।" },
  { en: "The Annapurna Circuit trek is globally rated among the top 10 most breathtaking trekking trails on Earth.", ne: "अन्नपूर्ण पदमार्गलाई विश्वका १० उत्कृष्ट पदमार्गहरूमध्ये एक मानिन्छ।" },
  { en: "Nepal time is officially UTC+5:45, timed precisely to the meridian passing through Mount Gauri Sankar.", ne: "नेपालको प्रामाणिक समय दोलखाको गौरीशंकर हिमाललाई आधार मानेर युटिसी+५:४५ निर्धारण गरिएको छ।" },
  { en: "Pokhara, located at the base of the Annapurna range, is crowned Nepal's official Tourism Capital.", ne: "अन्नपूर्ण हिमश्रृंखलाको काखमा अवस्थित पोखरा नेपालको औपचारिक पर्यटन राजधानी हो।" },
  { en: "Over 120 distinct living languages and mother tongues are spoken across diverse communities in Nepal!", ne: "नेपालमा १२० भन्दा बढी विभिन्न मातृभाषाहरू बोलिने बहुसांस्कृतिक र बहुभाषिक विविधता छ।" },
  { en: "The iconic curved Khukuri knife is the world-renowned traditional blade and emblem of the brave Gurkhas.", ne: "अर्धचन्द्राकार खुकुरी बहादुर गोर्खालीहरूको विश्वप्रसिद्ध परम्परागत हतियार र राष्ट्रिय पहिचान हो।" },
  { en: "The Great One-Horned Rhinoceros population in Nepal has made one of the greatest wildlife recovery comebacks in conservation history!", ne: "नेपालमा एकसिङ्गे गैँडाको संख्या संरक्षणको इतिहासमै विश्वको सबैभन्दा सफल पुनरुत्थानमध्ये एक हो।" },
  { en: "Changu Narayan Temple in Bhaktapur holds the oldest known stone inscription of Nepal dating back to 464 AD!", ne: "भक्तपुरको चाँगुनारायण मन्दिरमा ई.सं. ४६४ को मानदेवको नेपालकै सबैभन्दा पुरानो शिलालेख सुरक्षित छ।" },
  { en: "Nepal has an elevation span ranging from just 59 meters above sea level in Jhapa up to 8,848.86 meters at Everest!", ne: "नेपालमा समुद्र सतहदेखि झापाको ५९ मिटर होचो भूभागदेखि ८,८४८.८६ मिटर अग्लो सगरमाथासम्मको उचाइ फैलिएको छ।" },
  { en: "Shey Phoksundo Lake in Dolpa is famed for its exotic aquamarine-turquoise water that harbors no aquatic life.", ne: "डोल्पाको शे-फोक्सुन्डो ताल आफ्नो गाढा निलो रङ र कुनै पनि जलचर जीव नहुने अनौठो विशेषताका लागि चिनिन्छ।" },
  { en: "Patan (Lalitpur) is acclaimed globally as the City of Fine Arts, celebrated for its metal sculptures and stone woodcarvings.", ne: "पाटन (ललितपुर) धातुका मूर्तिहरू र काष्ठकलाका लागि विश्वमै 'ललितकलाको सहर' भनेर चिनिन्छ।" },
  { en: "The historic city of Kirtipur resisted three historic sieges during the unification campaign of Nepal.", ne: "ऐतिहासिक कीर्तिपुर सहरले नेपाल एकीकरणका क्रममा तीन पटकसम्म वीरतापूर्वक प्रतिरोध गरेको थियो।" },
  { en: "Dharan and the eastern hills of Nepal are the primary birthplace of the world-famous organic orthodox black tea.", ne: "धरान र इलाम लगायतका पूर्वी पहाडी भूभाग नेपालको विश्वप्रसिद्ध अर्गानिक अर्थोडक्स चियाका लागि प्रसिद्ध छन्।" },
  { en: "Koshi Tappu Wildlife Reserve is the bird-watching paradise of Asia, home to the last surviving wild water buffaloes (Arna) in Nepal.", ne: "कोशी टप्पु वन्यजन्तु आरक्ष एसियाकै चराहरूको स्वर्ग र नेपालको एकमात्र अर्ना पाइने बासस्थान हो।" },
  { en: "Gorkha Durbar perched on a hill ridge was the royal ancestral palace where King Prithvi Narayan Shah began Nepal's unification.", ne: "पहाडको टाकुरामा रहेको गोरखा दरबार राजा पृथ्वीनारायण शाहले एकीकरण अभियान सुरु गरेको ऐतिहासिक किल्ला हो।" },
  { en: "Mustang in the rain shadow of the Himalayas was the ancient forbidden Kingdom of Lo, preserving pure Tibetan Buddhist art.", ne: "हिमालपारिको मुस्ताङ पुरानो लो राज्य हो, जहाँ प्राचीन गुम्बा कला र मौलिक संस्कृति अझै सुरक्षित छ।" },
  { en: "The living goddess 'Kumari' tradition in Kathmandu is a sacred living heritage unique to Nepal.", ne: "काठमाडौँको जीवित देवी 'कुमारी' परम्परा नेपालमा मात्र पाइने एक अद्वितीय र पवित्र धार्मिक संस्कृति हो।" },
  { en: "Bardia National Park in western Nepal is considered one of the best locations on Earth to spot wild Royal Bengal Tigers!", ne: "पश्चिम नेपालको बर्दिया राष्ट्रिय निकुञ्ज पाटे बाघलाई प्राकृतिक रूपमा हेर्नका लागि विश्वकै उत्कृष्ट निकुञ्ज मानिन्छ।" },
  { en: "Nepal has the world's second largest inland water resource potential, fed by over 6,000 mountain rivers and rivulets!", ne: "६,००० भन्दा बढी हिमाली नदीनालाहरू बग्ने नेपाल जलस्रोतको दृष्टिकोणले विश्वकै दोस्रो धनी देश हो।" },
  { en: "Singha Durbar in Kathmandu was once the largest private palace in Asia when constructed in 1908 by Chandra Shumsher.", ne: "सन् १९०८ मा चन्द्र शमशेरले बनाएको सिंहदरबार एक समय एसियाकै सबैभन्दा ठूलो निजी दरबार थियो।" },
  { en: "Manakamana Temple in Gorkha is accessible via Nepal's first passenger cable car system, crossing over the Trishuli River.", ne: "त्रिशूली नदीमाथि बनेको नेपालको पहिलो केबलकार चढेर गोरखाको मनोकामना मन्दिर पुग्न सकिन्छ।" },
  { en: "The majestic Danphe (Lophophorus) is the national bird of Nepal, displaying 9 rainbow-shimmering iridescent plumage colors!", ne: "डाँफे नेपालको राष्ट्रिय चरा हो, जसको प्वाँखमा इन्द्रेणी जस्तै ९ थरी चम्किला रङहरू झल्किन्छन्।" },
  { en: "Illam's sprawling rolling green tea gardens are celebrated as the Switzerland of Eastern Nepal.", ne: "इलामका सुन्दर हरिया चिया बगानहरूलाई पूर्वी नेपालको 'स्वीट्जरल्याण्ड' भनेर चिनिन्छ।" },
  { en: "Nepal's Danuwar, Tharu, and Newar traditional mud and wood houses are engineered with natural seismic-resistant interlocking timbers.", ne: "नेपालका परम्परागत थारु र नेवारी शैलीका काठ र माटाका घरहरू भूकम्प प्रतिरोधी संरचनाका उत्कृष्ट नमुना हुन्।" },
  { en: "Mount Dhaulagiri (8,167m) is named after the Sanskrit word meaning 'White Mountain', rising dramatically above the Kali Gandaki.", ne: "संस्कृत शब्द 'धवल गिरि' (सेतो हिमाल) बाट नामकरण भएको धौलागिरी हिमाल विश्वको सातौं अग्लो हिमाल हो।" },
  { en: "The Koshi River is famous for changing its course frequently, having shifted more than 120 km westward over the past 250 years!", ne: "कोशी नदी आफ्नो बहाव परिवर्तन गरिरहने अनौठो प्रवृत्तिका लागि प्रसिद्ध छ, जसले विगत २५० वर्षमा १२० किमी धार सारेको छ।" },
  { en: "The sacred Saligram ammonite fossils found in the Kali Gandaki riverbed are 150-million-year-old remnants of the ancient Tethys Sea!", ne: "कालीगण्डकी नदीमा पाइने पवित्र शालिग्राम १५ करोड वर्ष पुरानो प्राचीन टेथिस सागरको जीवाश्म हो।" },
  { en: "Tenzing Norgay Sherpa and Sir Edmund Hillary made history on May 29, 1953, by becoming the first humans to stand atop Mount Everest.", ne: "२९ मे १९५३ मा तेन्जिङ नोर्गे शेर्पा र एडमण्ड हिलारीले पहिलो पटक सगरमाथाको शिखरमा पाइला टेकेर इतिहास रचेका थिए।" },
  { en: "The Newari feast 'Samay Baji' is listed as an invaluable intangible cultural heritage representing culinary balance.", ne: "नेवारी समुदायको 'समय बजी' विभिन्न परिकारहरूको सन्तुलन भएको एक समृद्ध परम्परागत सांस्कृतिक भोज हो।" },
  { en: "Devghat at the confluence of the Kali Gandaki and Trishuli rivers is revered as one of the holiest river confluences in South Asia.", ne: "कालीगण्डकी र त्रिशूली नदीको संगमस्थल देवघाट दक्षिण एसियाकै एक अत्यन्त पवित्र धाम हो।" },
  { en: "Chitwan National Park was designated as Nepal's very first national park in 1973, saving the rhino from extinction.", ne: "सन् १९७३ मा स्थापित चितवन राष्ट्रिय निकुञ्ज नेपालको पहिलो राष्ट्रिय निकुञ्ज हो जसले गैँडालाई लोप हुनबाट बचायो।" },
];

/**
 * Auto-generates a set of 3 grade-band digests for a given date if missing.
 * Facts deterministically rotate each day based on date seed.
 */
export function autoGenerateDigestsForDate(dateStr, force = false) {
  const created = [];
  if (force) {
    db.prepare("DELETE FROM digests WHERE date = ?").run(dateStr);
  }

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

    const headlineEn = (band === "1-3" || band === "4-5")
      ? "Explorer Day: Discover Super Wonders!"
      : band === "6-8"
      ? "Trailblazer Quest: Science & Himalayan Wonders!"
      : "Scholar Focus: SEE Prep & Global Mastery!";

    const headlineNe = (band === "1-3" || band === "4-5")
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

  // Ensure today's digests exist immediately on boot
  const local = getLocalTime();
  try {
    const existing = db.prepare("SELECT COUNT(*) c FROM digests WHERE date = ? AND status = 'published'").get(local.isoDate)?.c || 0;
    if (existing === 0) {
      console.log(`[Scheduler] No published digests found for ${local.isoDate} on boot. Auto-generating today's rotating facts...`);
      autoGenerateDigestsForDate(local.isoDate);
    }
  } catch (err) {
    console.error("[Scheduler] Boot digest check error:", err);
  }

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
