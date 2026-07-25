// Nepal fact tables (stable, non-current-affairs facts only — anything that can
// go stale belongs in the admin digest/curation pipeline, not the generator).

export const PROVINCES = [
  { en: "Koshi", ne: "कोशी", hq: "Biratnagar", hqNe: "विराटनगर" },
  { en: "Madhesh", ne: "मधेश", hq: "Janakpur", hqNe: "जनकपुर" },
  { en: "Bagmati", ne: "बागमती", hq: "Hetauda", hqNe: "हेटौंडा" },
  { en: "Gandaki", ne: "गण्डकी", hq: "Pokhara", hqNe: "पोखरा" },
  { en: "Lumbini", ne: "लुम्बिनी", hq: "Deukhuri", hqNe: "देउखुरी" },
  { en: "Karnali", ne: "कर्णाली", hq: "Birendranagar", hqNe: "वीरेन्द्रनगर" },
  { en: "Sudurpashchim", ne: "सुदूरपश्चिम", hq: "Godawari", hqNe: "गोदावरी" },
];

export const PEAKS = [
  { en: "Mount Everest", ne: "सगरमाथा", m: 8849 },
  { en: "Kanchenjunga", ne: "कञ्चनजङ्घा", m: 8586 },
  { en: "Lhotse", ne: "ल्होत्से", m: 8516 },
  { en: "Makalu", ne: "मकालु", m: 8463 },
  { en: "Cho Oyu", ne: "चो ओयु", m: 8188 },
  { en: "Dhaulagiri", ne: "धौलागिरी", m: 8167 },
  { en: "Manaslu", ne: "मनास्लु", m: 8163 },
  { en: "Annapurna I", ne: "अन्नपूर्ण प्रथम", m: 8091 },
];

export const RIVERS = [
  { en: "Karnali", ne: "कर्णाली", note: "longest river of Nepal", noteNe: "नेपालको सबैभन्दा लामो नदी" },
  { en: "Koshi", ne: "कोशी", note: "largest river of Nepal", noteNe: "नेपालको सबैभन्दा ठूलो नदी" },
  { en: "Gandaki", ne: "गण्डकी", note: "deepest gorge in the world (Kali Gandaki)", noteNe: "विश्वकै गहिरो खोंच (काली गण्डकी)" },
  { en: "Bagmati", ne: "बागमती", note: "flows through Kathmandu", noteNe: "काठमाडौं हुँदै बग्ने" },
];

export const LAKES = [
  { en: "Rara", ne: "रारा", note: "biggest lake of Nepal", noteNe: "नेपालको सबैभन्दा ठूलो ताल" },
  { en: "Shey Phoksundo", ne: "शे-फोक्सुन्डो", note: "deepest lake of Nepal", noteNe: "नेपालको सबैभन्दा गहिरो ताल" },
  { en: "Tilicho", ne: "तिलिचो", note: "one of the highest lakes in the world", noteNe: "विश्वकै अग्लो तालमध्ये एक" },
  { en: "Phewa", ne: "फेवा", note: "famous lake of Pokhara", noteNe: "पोखराको प्रसिद्ध ताल" },
];

export const FESTIVALS = [
  { en: "Dashain", ne: "दशैं", desc: "the longest and biggest festival of Nepal", descNe: "नेपालको सबैभन्दा लामो र ठूलो चाड" },
  { en: "Tihar", ne: "तिहार", desc: "the festival of lights in Nepal", descNe: "नेपालको उज्यालोको चाड" },
  { en: "Holi", ne: "होली", desc: "the festival of colours", descNe: "रंगहरूको चाड" },
  { en: "Buddha Jayanti", ne: "बुद्ध जयन्ती", desc: "celebrates the birth of Gautam Buddha", descNe: "गौतम बुद्धको जन्मदिन मनाइने" },
  { en: "Maghe Sankranti", ne: "माघे संक्रान्ति", desc: "celebrated on the first day of Magh", descNe: "माघ महिनाको पहिलो दिन मनाइने" },
  { en: "Chhath", ne: "छठ", desc: "dedicated to the Sun god, popular in Madhesh", descNe: "सूर्य देवतालाई समर्पित, मधेशमा लोकप्रिय" },
  { en: "Indra Jatra", ne: "इन्द्रजात्रा", desc: "a famous street festival of Kathmandu", descNe: "काठमाडौंको प्रसिद्ध जात्रा" },
  { en: "Teej", ne: "तीज", desc: "a festival especially celebrated by women", descNe: "विशेषगरी महिलाहरूले मनाउने चाड" },
];

export const NEPAL_FACTS = [
  // [questionEn, questionNe, correct, [distractors x3], correctNe, [distractorsNe x3], topic, difficulty]
  ["How many districts are there in Nepal?", "नेपालमा कति जिल्ला छन्?", "77", ["75", "72", "80"], "७७", ["७५", "७२", "८०"], "geography", 2],
  ["How many provinces are there in Nepal?", "नेपालमा कति प्रदेश छन्?", "7", ["5", "9", "14"], "७", ["५", "९", "१४"], "geography", 1],
  ["Which is the national bird of Nepal?", "नेपालको राष्ट्रिय चरा कुन हो?", "Danphe (Himalayan Monal)", ["Peacock", "Eagle", "Parrot"], "डाँफे", ["मयूर", "चील", "सुगा"], "national-symbols", 1],
  ["Which is the national flower of Nepal?", "नेपालको राष्ट्रिय फूल कुन हो?", "Rhododendron (Laliguras)", ["Lotus", "Sunflower", "Marigold"], "लालीगुराँस", ["कमल", "सूर्यमुखी", "सयपत्री"], "national-symbols", 1],
  ["Which is the national animal of Nepal?", "नेपालको राष्ट्रिय जनावर कुन हो?", "Cow", ["Tiger", "Elephant", "One-horned Rhino"], "गाई", ["बाघ", "हात्ती", "एकसिंगे गैंडा"], "national-symbols", 1],
  ["Where was Gautam Buddha born?", "गौतम बुद्धको जन्म कहाँ भएको थियो?", "Lumbini", ["Kathmandu", "Bodh Gaya", "Pokhara"], "लुम्बिनी", ["काठमाडौं", "बोधगया", "पोखरा"], "history", 1],
  ["Who was the first king of unified Nepal?", "एकीकृत नेपालका पहिलो राजा को थिए?", "Prithvi Narayan Shah", ["Tribhuvan Shah", "Mahendra Shah", "Ram Shah"], "पृथ्वीनारायण शाह", ["त्रिभुवन शाह", "महेन्द्र शाह", "राम शाह"], "history", 2],
  ["Nepal became a federal democratic republic in which year (AD)?", "नेपाल कुन वर्ष (ई.सं.) संघीय लोकतान्त्रिक गणतन्त्र बन्यो?", "2008", ["1990", "2006", "2015"], "सन् २००८", ["सन् १९९०", "सन् २००६", "सन् २०१५"], "history", 3],
  ["The current constitution of Nepal was promulgated in which year (AD)?", "नेपालको वर्तमान संविधान कुन वर्ष (ई.सं.) जारी भयो?", "2015", ["2008", "2013", "2017"], "सन् २०१५", ["सन् २००८", "सन् २०१३", "सन् २०१७"], "history", 3],
  ["Which is the shape of Nepal's national flag?", "नेपालको राष्ट्रिय झन्डाको आकार कस्तो छ?", "Two triangles", ["Rectangle", "Square", "Circle"], "दुई त्रिभुज", ["आयत", "वर्ग", "वृत्त"], "national-symbols", 1],
  ["Which is the oldest temple of Kathmandu valley among these?", "यीमध्ये काठमाडौं उपत्यकाको सबैभन्दा पुरानो मन्दिर कुन हो?", "Pashupatinath", ["Boudhanath", "Krishna Mandir", "Dakshinkali"], "पशुपतिनाथ", ["बौद्धनाथ", "कृष्ण मन्दिर", "दक्षिणकाली"], "culture", 3],
  ["What is the name of Nepal's national anthem?", "नेपालको राष्ट्रिय गानको नाम के हो?", "Sayaun Thunga Phulka", ["Shreeman Gambhir", "Rastriya Gaan", "Nepal Aama"], "सयौं थुँगा फूलका", ["श्रीमान् गम्भीर", "राष्ट्रिय गान", "नेपाल आमा"], "national-symbols", 2],
  ["Which lake is famous for the reflection of Machhapuchhre?", "माछापुच्छ्रेको प्रतिबिम्बका लागि प्रसिद्ध ताल कुन हो?", "Phewa Lake", ["Rara Lake", "Tilicho Lake", "Begnas Lake"], "फेवा ताल", ["रारा ताल", "तिलिचो ताल", "बेगनास ताल"], "geography", 2],
  ["Sagarmatha (Mount Everest) lies in which district?", "सगरमाथा कुन जिल्लामा पर्छ?", "Solukhumbu", ["Taplejung", "Dolakha", "Mustang"], "सोलुखुम्बु", ["ताप्लेजुङ", "दोलखा", "मुस्ताङ"], "geography", 3],
  ["Which is known as the 'City of Lakes' in Nepal?", "नेपालमा 'तालहरूको सहर' भनेर कुन सहर चिनिन्छ?", "Pokhara", ["Kathmandu", "Biratnagar", "Butwal"], "पोखरा", ["काठमाडौं", "विराटनगर", "बुटवल"], "geography", 1],
  ["Who is known as the 'Aadikavi' (first poet) of Nepal?", "नेपालका आदिकवि को हुन्?", "Bhanubhakta Acharya", ["Laxmi Prasad Devkota", "Motiram Bhatta", "Lekhnath Paudyal"], "भानुभक्त आचार्य", ["लक्ष्मीप्रसाद देवकोटा", "मोतीराम भट्ट", "लेखनाथ पौड्याल"], "literature", 2],
  ["Who is known as the 'Mahakavi' (great poet) of Nepal?", "नेपालका महाकवि को हुन्?", "Laxmi Prasad Devkota", ["Bhanubhakta Acharya", "Bal Krishna Sama", "Madhav Prasad Ghimire"], "लक्ष्मीप्रसाद देवकोटा", ["भानुभक्त आचार्य", "बालकृष्ण सम", "माधवप्रसाद घिमिरे"], "literature", 2],
  ["Which national park is famous for one-horned rhinos?", "एकसिंगे गैंडाका लागि प्रसिद्ध राष्ट्रिय निकुञ्ज कुन हो?", "Chitwan National Park", ["Sagarmatha National Park", "Rara National Park", "Langtang National Park"], "चितवन राष्ट्रिय निकुञ्ज", ["सगरमाथा राष्ट्रिय निकुञ्ज", "रारा राष्ट्रिय निकुञ्ज", "लाङटाङ राष्ट्रिय निकुञ्ज"], "geography", 2],
  ["What is the total area of Nepal (sq. km)?", "नेपालको कुल क्षेत्रफल कति वर्ग कि.मि. छ?", "147,516", ["147,181", "150,000", "141,000"], "१,४७,५१६", ["१,४७,१८१", "१,५०,०००", "१,४१,०००"], "geography", 4],
  ["Kalapatthar, famous for Everest views, is at approximately what height?", "सगरमाथाको दृश्यका लागि प्रसिद्ध कालापत्थरको उचाइ लगभग कति हो?", "5,644 m", ["4,500 m", "6,200 m", "7,000 m"], "५,६४४ मि.", ["४,५०० मि.", "६,२०० मि.", "७,००० मि."], "geography", 4],
  ["Which is Nepal's first newspaper?", "नेपालको पहिलो पत्रिका कुन हो?", "Gorkhapatra", ["Kantipur", "Nepal Samachar", "Himalaya Times"], "गोरखापत्र", ["कान्तिपुर", "नेपाल समाचार", "हिमालय टाइम्स"], "history", 3],
  ["The Bikram Sambat calendar is approximately how many years ahead of AD?", "बिक्रम संवत् ई.सं.भन्दा लगभग कति वर्ष अगाडि छ?", "57", ["50", "60", "65"], "५७", ["५०", "६०", "६५"], "culture", 2],
  ["Which valley is known as the 'Living Museum' for its art and temples?", "कला र मन्दिरका कारण 'जीवित संग्रहालय' भनेर कुन उपत्यका चिनिन्छ?", "Kathmandu Valley", ["Pokhara Valley", "Dang Valley", "Surkhet Valley"], "काठमाडौं उपत्यका", ["पोखरा उपत्यका", "दाङ उपत्यका", "सुर्खेत उपत्यका"], "culture", 3],
  ["Which is the smallest district of Nepal by area?", "क्षेत्रफलका आधारमा नेपालको सबैभन्दा सानो जिल्ला कुन हो?", "Bhaktapur", ["Kathmandu", "Lalitpur", "Manang"], "भक्तपुर", ["काठमाडौं", "ललितपुर", "मनाङ"], "geography", 4],
  ["Which is the largest district of Nepal by area?", "क्षेत्रफलका आधारमा नेपालको सबैभन्दा ठूलो जिल्ला कुन हो?", "Dolpa", ["Humla", "Mugu", "Gorkha"], "डोल्पा", ["हुम्ला", "मुगु", "गोरखा"], "geography", 4],
];
