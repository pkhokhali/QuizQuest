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
  // CDC Curriculum Grade 1-5 (Primary)
  ["Who wrote the national anthem of Nepal?", "नेपालको राष्ट्रिय गानका रचनाकार को हुन्?", "Byakul Maila (Pradeep Kumar Rai)", ["Amber Gurung", "Laxmi Prasad Devkota", "Bhanubhakta Acharya"], "व्याकुल माइला (प्रदीपकुमार राई)", ["अम्बर गुरुङ", "लक्ष्मीप्रसाद देवकोटा", "भानुभक्त आचार्य"], "culture", 2],
  ["Who composed the music of Nepal's national anthem?", "नेपालको राष्ट्रिय गानमा संगीत कसले भरेका हुन्?", "Amber Gurung", ["Byakul Maila", "Gopal Yonzon", "Narayan Gopal"], "अम्बर गुरुङ", ["व्याकुल माइला", "गोपाल योञ्जन", "नारायण गोपाल"], "culture", 2],
  ["How many colors are there in the rainbow (इन्द्रेणी)?", "इन्द्रेणीमा कतिवटा रंगहरू हुन्छन्?", "7", ["5", "6", "8"], "७", ["५", "६", "८"], "science", 1],
  ["What is the baby of a dog called in Nepali?", "कुकुरको बच्चालाई नेपालीमा के भनिन्छ?", "Chhawa (छाउरो)", ["Banchhoro", "Patho", "Gauthali"], "छाउरो", ["बाछो", "पाठा", "गौथली"], "nepali", 1],
  ["Which gas do plants release during photosynthesis?", "प्रकाश संश्लेषण प्रक्रियामा बिरुवाले कुन ग्यास फाल्छन्?", "Oxygen", ["Carbon Dioxide", "Nitrogen", "Hydrogen"], "अक्सिजन", ["कार्बनडाइअक्साइड", "नाइट्रोजन", "हाइड्रोजन"], "science", 2],
  ["In Nepali grammar, which of these is a Noun (नाम)?", "नेपाली व्याकरण अनुसार तलका मध्ये कुन 'नाम' पद हो?", "Pokhara (पोखरा)", ["Sundar (सुन्दर)", "Khelchha (खेल्छ)", "Uu (ऊ)"], "पोखरा", ["सुन्दर", "खेल्छ", "ऊ"], "nepali", 1],
  ["In Nepali grammar, which of these is a Pronoun (सर्वनाम)?", "नेपाली व्याकरण अनुसार तलका मध्ये कुन 'सर्वनाम' पद हो?", "Timi (तिमी)", ["Kathmandu (काठमाडौं)", "Daudinu (दौडिनु)", "Rato (रातो)"], "तिमी", ["काठमाडौं", "दौडिनु", "रातो"], "nepali", 1],
  ["What is the opposite of 'Upaakar' (उपकार) in Nepali?", "'उपकार' शब्दको विपरीतार्थक शब्द कुन हो?", "Apakar (अपकार)", ["Upahar", "Apeksha", "Satkar"], "अपकार", ["उपहार", "अपेक्षा", "सत्कार"], "nepali", 2],
  ["Which is the main staple food grain of Nepal?", "नेपालको प्रमुख खाद्यान्न बाली कुन हो?", "Paddy / Rice (धान)", ["Wheat", "Maize", "Millet"], "धान", ["गहुँ", "मकै", "कोदो"], "social-studies", 1],
  ["Which place is known as the Cherrapunji of Nepal due to highest rainfall?", "नेपालमा सबैभन्दा धेरै पानी पर्ने ठाउँ कुन हो?", "Lumle (Kaski)", ["Dharan", "Nepalgunj", "Ilam"], "लुम्ले (कास्की)", ["धरान", "नेपालगन्ज", "इलाम"], "geography", 2],
  
  // CDC Curriculum Grade 6-8 (Lower Secondary)
  ["When was the Sugauli Treaty signed (AD)?", "सुगौली सन्धि कहिले भएको थियो (ई.सं.)?", "1816", ["1814", "1815", "1820"], "सन् १८१६", ["सन् १८१४", "सन् १८१५", "सन् १८२०"], "history", 3],
  ["Who was the commander of Nalapani fort during the Anglo-Nepal war?", "नालापानीको युद्धमा नेपाली फौजको नेतृत्व कसले गरेका थिए?", "Balbhadra Kunwar", ["Amar Singh Thapa", "Bhakti Thapa", "Bhimsen Thapa"], "बलभद्र कुँवर", ["अमरसिंह थापा", "भक्ति थापा", "भीमसेन थापा"], "history", 2],
  ["Who was the first Prime Minister of Nepal?", "नेपालका पहिलो प्रधानमन्त्री को हुन्?", "Bhimsen Thapa", ["Jung Bahadur Rana", "Mathabar Singh Thapa", "Ranga Nath Poudyal"], "भीमसेन थापा", ["जंगबहादुर राणा", "माथवरसिंह थापा", "रंगनाथ पौड्याल"], "history", 2],
  ["Which planet is known as the 'Red Planet'?", "सौर्यमण्डलको 'रातो ग्रह' भनेर कुन ग्रहलाई चिनिन्छ?", "Mars (मङ्गल)", ["Venus", "Jupiter", "Mercury"], "मङ्गल", ["शुक्र", "बृहस्पति", "बुध"], "science", 2],
  ["What is the SI unit of Force in Physics?", "भौतिक विज्ञानमा बल (Force) को SI एकाइ के हो?", "Newton (N)", ["Joule", "Pascal", "Watt"], "न्युटन (N)", ["जुल", "पास्कल", "वाट"], "science", 2],
  ["What is the chemical formula of common table salt?", "हामीले खाने नुनको रासायनिक सूत्र के हो?", "NaCl", ["H2O", "CaCO3", "CO2"], "NaCl", ["H2O", "CaCO3", "CO2"], "science", 2],
  ["Which part of the human eye controls the amount of light entering?", "मानव आँखाको कुन भागले भित्र छिर्ने प्रकाशको मात्रा नियन्त्रण गर्छ?", "Pupil / Iris (नानी / आइरिस)", ["Cornea", "Retina", "Optic Nerve"], "नानी / आइरिस", ["कर्निया", "रेटिना", "दृष्टि नसा"], "science", 3],
  ["What is the value of Pi (π) rounded to two decimal places?", "पाई (π) को मान दुई दशमलव स्थानसम्म कति हुन्छ?", "3.14", ["3.12", "3.16", "3.18"], "३.१४", ["३.१२", "३.१६", "३.१८"], "math", 2],
  ["If the perimeter of a square is 36 cm, what is its side length?", "एउटा वर्गको परिमिति ३६ से.मि. भए त्यसको भुजाको लम्बाइ कति हुन्छ?", "9 cm", ["6 cm", "12 cm", "18 cm"], "९ से.मि.", ["६ से.मि.", "१२ से.मि.", "१८ से.मि."], "math", 2],
  ["What is the sum of interior angles of a triangle?", "त्रिभुजका तीनवटै भित्री कोणहरूको योगफल कति डिग्री हुन्छ?", "180°", ["90°", "360°", "270°"], "१८०°", ["९०°", "३६०°", "२७०°"], "math", 1],
  ["What type of word is 'Sundarta' (सुन्दरता) in Nepali grammar?", "नेपाली व्याकरण अनुसार 'सुन्दरता' कुन प्रकारको नाम हो?", "Bhavabachak (भाववाचक)", ["Vaktivachak", "Jativachak", "Dravyavachak"], "भाववाचक", ["व्यक्तिवाचक", "जातिवाचक", "द्रव्यवाचक"], "nepali", 3],
  ["Which river is called 'Sorrow of Bihar' in India?", "नेपालबाट भारत प्रवेश गरेपछि 'बिहारको दुःख' भनिने नदी कुन हो?", "Koshi (कोशी)", ["Gandaki", "Karnali", "Mechi"], "कोशी", ["गण्डकी", "कर्णाली", "मेची"], "geography", 2],

  // CDC Curriculum Grade 9-10 (Secondary / SEE Prep)
  ["When did Nepal become a member of the United Nations (UN)?", "नेपाल संयुक्त राष्ट्रसंघ (UN) को सदस्य कुन वर्ष बन्यो?", "1955 AD (Dec 14)", ["1945 AD", "1950 AD", "1960 AD"], "सन् १९५५ (डिसेम्बर १४)", ["सन् १९४५", "सन् १९५०", "सन् १९६०"], "social-studies", 3],
  ["How many fundamental rights are guaranteed in the Constitution of Nepal (2072)?", "नेपालको वर्तमान संविधान (२०७२) मा कतिवटा मौलिक हकको व्यवस्था छ?", "31", ["25", "29", "35"], "३१ वटा", ["२५ वटा", "२९ वटा", "३५ वटा"], "social-studies", 3],
  ["Who propounded the Theory of Relativity?", "सापेक्षतावादको सिद्धान्त (Theory of Relativity) कसले प्रतिपादन गरेका हुन्?", "Albert Einstein", ["Isaac Newton", "Galileo Galilei", "Stephen Hawking"], "अल्बर्ट आइन्स्टाइन", ["आइज्याक न्युटन", "ग्यालिलियो ग्यालिली", "स्टिफन हकिङ"], "science", 3],
  ["What is the speed of light in vacuum?", "शून्य माध्यममा प्रकाशको गति कति हुन्छ?", "3 × 10⁸ m/s", ["3 × 10⁶ m/s", "3 × 10¹⁰ m/s", "3 × 10⁴ m/s"], "३ × १०⁸ मि/से", ["३ × १०⁶ मि/से", "३ × १०¹⁰ मि/से", "३ × १०⁴ मि/से"], "science", 3],
  ["What is the powerhouse of the cell?", "कोषको शक्तिगृह (Powerhouse of the cell) भनेर केलाई चिनिन्छ?", "Mitochondria", ["Ribosome", "Nucleus", "Golgi Body"], "माइटोकोन्ड्रिया", ["राइबोजोम", "न्युक्लियस", "गल्जी बडी"], "science", 2],
  ["Which acid is found in lemon and oranges?", "कागती र सुन्तलामा कुन अम्ल (Acid) पाइन्छ?", "Citric Acid", ["Acetic Acid", "Lactic Acid", "Hydrochloric Acid"], "सिट्रिक अम्ल", ["एसिटिक अम्ल", "ल्याक्टिक अम्ल", "हाइड्रोक्लोरिक अम्ल"], "science", 2],
  ["What is the chemical name of Vitamin C?", "भिटामिन सी (Vitamin C) को रासायनिक नाम के हो?", "Ascorbic Acid", ["Retinol", "Thiamine", "Calciferol"], "एस्कर्बिक एसिड", ["रेटिनोल", "थियामिन", "क्याल्सिफेरोल"], "science", 3],
  ["In economics, what does GDP stand for?", "अर्थशास्त्रमा GDP को पूरा रूप के हो?", "Gross Domestic Product", ["Gross Development Profit", "General Domestic Production", "Global Development Plan"], "Gross Domestic Product (कुल गार्हस्थ्य उत्पादन)", ["Gross Development Profit", "General Domestic Production", "Global Development Plan"], "social-studies", 3],
  ["Which Treaty formally ended the First World War in 1919?", "सन् १९१९ मा प्रथम विश्वयुद्ध औपचारिक रूपमा अन्त्य गर्ने सन्धि कुन हो?", "Treaty of Versailles", ["Treaty of Paris", "Treaty of Rome", "Treaty of Vienna"], "भर्साइल्सको सन्धि", ["पेरिसको सन्धि", "रोमको सन्धि", "भियनाको सन्धि"], "history", 4],
  ["What is the quadratic formula to solve ax² + bx + c = 0?", "वर्ग समीकरण ax² + bx + c = 0 हल गर्ने सूत्र कुन हो?", "(-b ± √(b² - 4ac)) / (2a)", ["(-b ± √(b² + 4ac)) / (2a)", "(b ± √(b² - 4ac)) / (2a)", "(-b ± √(b² - 2ac)) / a"], "(-b ± √(b² - 4ac)) / (2a)", ["(-b ± √(b² + 4ac)) / (2a)", "(b ± √(b² - 4ac)) / (2a)", "(-b ± √(b² - 2ac)) / a"], "math", 3],
  ["Which Nepalese literary work was written by Laxmi Prasad Devkota in one night?", "लक्ष्मीप्रसाद देवकोटाले एकै रातमा रचना गरेको प्रसिद्ध खण्डकाव्य कुन हो?", "Muna Madan (मुनामदन)", ["Kunjini", "Shakuntala", "Sulochana"], "मुनामदन", ["कुञ्जिनी", "शाकुन्तल", "सुलोचना"], "literature", 3],
  ["What is the standard time of Nepal based on which meridian?", "नेपालको प्रमाणिक समय कुन देशान्तर रेखालाई आधार मानेर निर्धारण गरिएको छ?", "86° 15' East (Gaurishankar)", ["85° 15' East", "87° 30' East", "84° 45' East"], "८६° १५' पूर्वी देशान्तर (गौरीशंकर)", ["८५° १५' पूर्वी देशान्तर", "८७° ३०' पूर्वी देशान्तर", "८४° ४५' पूर्वी देशान्तर"], "geography", 3],
];
