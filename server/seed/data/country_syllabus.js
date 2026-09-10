// Country-wise school syllabus questions tailored for QuizQuest.
// Follows the curated question format:
// [textEn, textNe, correctEn, distractorsEn, correctNe, distractorsNe, country, subject, gradeBands, difficulty, topic]

export const COUNTRY_SYLLABUS = [
  // ==========================================
  // INDIA (CBSE / ICSE / NCERT Syllabus)
  // ==========================================
  [
    "Who is known as the 'Father of the Indian Constitution'?",
    "भारतीय संविधानका पिता भनेर कसलाई चिनिन्छ?",
    "Dr. B. R. Ambedkar",
    ["Mahatma Gandhi", "Jawaharlal Nehru", "Sardar Patel"],
    "डा. बी. आर. अम्बेडकर",
    ["महात्मा गान्धी", "जवाहरलाल नेहरू", "सरदार पटेल"],
    "india",
    "social",
    ["6-8", "9-10"],
    2,
    "constitution"
  ],
  [
    "Which is the longest river flowing entirely within India?",
    "भारतभित्र बग्ने सबैभन्दा लामो नदी कुन हो?",
    "Ganga",
    ["Yamuna", "Godavari", "Brahmaputra"],
    "गंगा",
    ["यमुना", "गोदावरी", "ब्रह्मपुत्र"],
    "india",
    "social",
    ["4-5", "6-8"],
    2,
    "geography"
  ],
  [
    "What is the national aquatic animal of India according to the Wildlife Protection Act?",
    "भारतको राष्ट्रिय जलचर प्राणी कुन हो?",
    "Gangetic River Dolphin",
    ["Blue Whale", "Gharial", "Sea Turtle"],
    "गंगेय डल्फिन",
    ["नीलो ह्वेल", "घडियाल", "समुद्री कछुवा"],
    "india",
    "science",
    ["6-8", "9-10"],
    3,
    "wildlife"
  ],
  [
    "Which Indian space agency launched the Chandrayaan and Mangalyaan lunar and Mars missions?",
    "चन्द्रयान र मंगलयान अभियान सञ्चालन गर्ने भारतीय अन्तरिक्ष संस्था कुन हो?",
    "ISRO",
    ["NASA", "DRDO", "BARC"],
    "इसरो (ISRO)",
    ["नासा", "डीआरडीओ", "बार्क"],
    "india",
    "science",
    ["4-5", "6-8", "9-10"],
    2,
    "space-science"
  ],
  [
    "What is the highest mountain peak located entirely or partly in Indian territory?",
    "भारतको भूभागमा अवस्थित सर्वोच्च शिखर कुन हो?",
    "Kangchenjunga",
    ["Nanda Devi", "K2 (Godwin-Austen)", "Kamet"],
    "कञ्चनजङ्घा",
    ["नन्दा देवी", "के२", "कामेत"],
    "india",
    "social",
    ["6-8", "9-10"],
    3,
    "peaks"
  ],
  [
    "Who composed India's national anthem 'Jana Gana Mana'?",
    "भारतको राष्ट्रिय गान 'जन गण मन' का रचनाकार को हुन्?",
    "Rabindranath Tagore",
    ["Bankim Chandra Chattopadhyay", "Sarojini Naidu", "Subhash Chandra Bose"],
    "रवीन्द्रनाथ टेगोर",
    ["बंकिम चन्द्र चट्टोपाध्याय", "सरोजिनी नायडू", "सुभाष चन्द्र बोस"],
    "india",
    "english",
    ["1-3", "4-5", "6-8"],
    1,
    "literature"
  ],
  [
    "How many states and union territories does the Republic of India have?",
    "भारतमा कतिवटा राज्य र केन्द्र शासित प्रदेश छन्?",
    "28 States and 8 Union Territories",
    ["29 States and 7 UTs", "28 States and 9 UTs", "30 States and 8 UTs"],
    "२८ राज्य र ८ केन्द्र शासित प्रदेश",
    ["२९ राज्य र ७ केन्द्र शासित प्रदेश", "२८ राज्य र ९ केन्द्र शासित प्रदेश", "३० राज्य र ८ केन्द्र शासित प्रदेश"],
    "india",
    "social",
    ["6-8", "9-10"],
    3,
    "civics"
  ],
  [
    "Which historical monument in Agra was built by Mughal Emperor Shah Jahan?",
    "आगरामा अवस्थित कुन ऐतिहासिक स्मारक मुगल सम्राट शाहजहाँले निर्माण गरेका हुन्?",
    "Taj Mahal",
    ["Qutub Minar", "Red Fort", "Hawa Mahal"],
    "ताजमहल",
    ["कुतुब मिनार", "लाल किल्ला", "हावा महल"],
    "india",
    "social",
    ["1-3", "4-5"],
    1,
    "history"
  ],

  // ==========================================
  // USA (Common Core, NGSS & Civics Syllabus)
  // ==========================================
  [
    "Who was the first President of the United States?",
    "संयुक्त राज्य अमेरिकाका प्रथम राष्ट्रपति को हुन्?",
    "George Washington",
    ["Thomas Jefferson", "John Adams", "Abraham Lincoln"],
    "जर्ज वासिङ्टन",
    ["थॉमस जेफर्सन", "जोन एडम्स", "अब्राहम लिंकन"],
    "usa",
    "social",
    ["1-3", "4-5", "6-8"],
    1,
    "us-presidents"
  ],
  [
    "In which year was the US Declaration of Independence adopted in Philadelphia?",
    "अमेरिकी स्वतन्त्रताको घोषणापत्र कुन वर्ष पारित भएको थियो?",
    "1776",
    ["1789", "1812", "1765"],
    "१७७६",
    ["१७८९", "१८१२", "१७६५"],
    "usa",
    "social",
    ["6-8", "9-10"],
    2,
    "us-history"
  ],
  [
    "How many voting members serve in the United States Senate?",
    "संयुक्त राज्य अमेरिकाको सिनेटमा कति जना सदस्य हुन्छन्?",
    "100 (2 per state)",
    ["435", "50", "120"],
    "१०० (प्रत्येक राज्यबाट २ जना)",
    ["४३५", "५०", "१२०"],
    "usa",
    "social",
    ["6-8", "9-10"],
    3,
    "us-civics"
  ],
  [
    "The Grand Canyon is one of the world's natural wonders located in which US state?",
    "विश्वप्रसिद्ध ग्रान्ड क्यानियन अमेरिकाको कुन राज्यमा अवस्थित छ?",
    "Arizona",
    ["Nevada", "Utah", "Colorado"],
    "एरिजोना",
    ["नेभाडा", "युटा", "कोलोराडो"],
    "usa",
    "social",
    ["4-5", "6-8"],
    2,
    "us-geography"
  ],
  [
    "What are the three co-equal branches of the United States federal government?",
    "अमेरिकी संघीय सरकारका तीनवटा अंगहरू कुन कुन हुन्?",
    "Legislative, Executive, Judicial",
    ["Senate, Congress, President", "Military, Civil, Legal", "State, Federal, Municipal"],
    "व्यवस्थापिका, कार्यपालिका र न्यायपालिका",
    ["सिनेट, कंग्रेस र राष्ट्रपति", "सैनिक, नागरिक र कानुनी", "राज्य, संघीय र नगरपालिका"],
    "usa",
    "social",
    ["6-8", "9-10"],
    2,
    "us-civics"
  ],
  [
    "Which is the longest river system in North America?",
    "उत्तर अमेरिकाको सबैभन्दा लामो नदी प्रणाली कुन हो?",
    "Missouri-Mississippi River System",
    ["Colorado River", "Rio Grande", "Yukon River"],
    "मिसौरी-मिसिसिपी नदी प्रणाली",
    ["कोलोराडो नदी", "रियो ग्रान्डे", "युकोन नदी"],
    "usa",
    "social",
    ["6-8", "9-10"],
    3,
    "us-geography"
  ],

  // ==========================================
  // UK (National Curriculum KS2-4 Syllabus)
  // ==========================================
  [
    "In which year was the historic Magna Carta signed at Runnymede by King John?",
    "राजा जोनद्वारा ऐतिहासिक म्याग्ना कार्टा कुन वर्ष हस्ताक्षर गरिएको थियो?",
    "1215",
    ["1066", "1492", "1603"],
    "१२१५",
    ["१०६६", "१४९२", "१६०३"],
    "uk",
    "social",
    ["6-8", "9-10"],
    3,
    "uk-history"
  ],
  [
    "Which four nations make up the United Kingdom?",
    "संयुक्त अधिराज्य (UK) कुन चारवटा देश मिलेर बनेको छ?",
    "England, Scotland, Wales, Northern Ireland",
    ["England, Scotland, Ireland, Wales", "Britain, England, Scotland, Ireland", "England, France, Scotland, Wales"],
    "इङ्ल्यान्ड, स्कटल्यान्ड, वेल्स र उत्तरी आयरल्यान्ड",
    ["इङ्ल्यान्ड, स्कटल्यान्ड, आयरल्यान्ड र वेल्स", "ब्रिटेन, इङ्ल्यान्ड, स्कटल्यान्ड र आयरल्यान्ड", "इङ्ल्यान्ड, फ्रान्स, स्कटल्यान्ड र वेल्स"],
    "uk",
    "social",
    ["1-3", "4-5", "6-8"],
    1,
    "uk-geography"
  ],
  [
    "Which famous British scientist formulated the Universal Law of Gravitation and three laws of motion?",
    "गुरुत्वाकर्षणको विश्वव्यापी नियम र गतिका तीन नियम प्रतिपादन गर्ने बेलायती वैज्ञानिक को हुन्?",
    "Sir Isaac Newton",
    ["Charles Darwin", "Stephen Hawking", "Michael Faraday"],
    "सर आइज्याक न्युटन",
    ["चार्ल्स डार्विन", "स्टिफन हकिङ", "माइकल फराडे"],
    "uk",
    "science",
    ["6-8", "9-10"],
    2,
    "physics"
  ],
  [
    "Which major river flows directly through the heart of London?",
    "लन्डन शहरको बीचबाट बग्ने मुख्य नदी कुन हो?",
    "River Thames",
    ["River Severn", "River Mersey", "River Clyde"],
    "थेम्स नदी",
    ["सेभर्न नदी", "मर्सी नदी", "क्लाइड नदी"],
    "uk",
    "social",
    ["4-5", "6-8"],
    2,
    "uk-geography"
  ],

  // ==========================================
  // JAPAN (MEXT School Curriculum)
  // ==========================================
  [
    "What is the highest mountain peak in Japan, standing at 3,776 meters?",
    "३,७७६ मिटर उचाइ भएको जापानको सर्वोच्च शिखर कुन हो?",
    "Mount Fuji",
    ["Mount Kita", "Mount Hotaka", "Mount Aso"],
    "माउन्ट फुजी",
    ["माउन्ट किता", "माउन्ट होताका", "माउन्ट आसो"],
    "japan",
    "social",
    ["4-5", "6-8", "9-10"],
    1,
    "japan-geography"
  ],
  [
    "Which of the following is Japan's largest and most populous main island?",
    "जापानको सबैभन्दा ठूलो र बढी जनसंख्या भएको मुख्य टापु कुन हो?",
    "Honshu",
    ["Hokkaido", "Kyushu", "Shikoku"],
    "होन्शु",
    ["होक्काइदो", "क्युशु", "शिकोकु"],
    "japan",
    "social",
    ["6-8", "9-10"],
    2,
    "japan-geography"
  ],
  [
    "What was the historical name of Tokyo before the Meiji Restoration in 1868?",
    "सन् १८६८ को मेइजी पुनर्स्थापना अघि टोकियोको ऐतिहासिक नाम के थियो?",
    "Edo",
    ["Kyoto", "Nara", "Osaka"],
    "एदो (Edo)",
    ["क्योटो", "नारा", "ओसाका"],
    "japan",
    "social",
    ["6-8", "9-10"],
    3,
    "japan-history"
  ],
  [
    "What is the official currency of Japan?",
    "जापानको आधिकारिक मुद्रा कुन हो?",
    "Yen (¥)",
    ["Won (₩)", "Yuan (¥)", "Ringgit"],
    "येन (¥)",
    ["वोन (₩)", "युआन (¥)", "रिंगिट"],
    "japan",
    "gk",
    ["1-3", "4-5"],
    1,
    "economy"
  ],

  // ==========================================
  // AUSTRALIA (ACARA School Curriculum)
  // ==========================================
  [
    "What is the planned capital city of the Commonwealth of Australia?",
    "अस्ट्रेलियाको राजधानी शहर कुन हो?",
    "Canberra",
    ["Sydney", "Melbourne", "Brisbane"],
    "क्यान्बरा",
    ["सिड्नी", "मेलबर्न", "ब्रिसबेन"],
    "australia",
    "social",
    ["4-5", "6-8"],
    2,
    "australia-civics"
  ],
  [
    "The Great Barrier Reef, the world's largest coral reef system, lies off the coast of which state?",
    "विश्वको सबैभन्दा ठूलो कोरल चट्टान 'ग्रेट ब्यारियर रिफ' अस्ट्रेलियाको कुन राज्यको तटमा छ?",
    "Queensland",
    ["New South Wales", "Western Australia", "Victoria"],
    "क्विन्सल्याण्ड",
    ["न्यू साउथ वेल्स", "पश्चिमी अस्ट्रेलिया", "भिक्टोरिया"],
    "australia",
    "science",
    ["6-8", "9-10"],
    3,
    "marine-biology"
  ],
  [
    "Which unique egg-laying mammals (monotremes) are native exclusively to Australia and New Guinea?",
    "अण्डा पार्ने अद्वितीय स्तनधारी प्राणी (मोनोट्रिम्स) कुन हुन्?",
    "Platypus and Echidna",
    ["Kangaroo and Koala", "Wombat and Dingo", "Tasmanian Devil and Quokka"],
    "प्लाटिपस र एकिड्ना",
    ["कंगारू र कोआला", "वोम्ब्याट र डिङ्गो", "टास्मानियन डेभिल र क्वोक्का"],
    "australia",
    "science",
    ["4-5", "6-8"],
    2,
    "zoology"
  ],
  [
    "How many states make up the Commonwealth of Australia?",
    "अस्ट्रेलियामा कतिवटा राज्यहरू छन्?",
    "6 States",
    ["5 States", "7 States", "8 States"],
    "६ राज्यहरू",
    ["५ राज्यहरू", "७ राज्यहरू", "८ राज्यहरू"],
    "australia",
    "social",
    ["6-8", "9-10"],
    2,
    "australia-civics"
  ],

  // ==========================================
  // GLOBAL (International Curriculum / Science & Math)
  // ==========================================
  [
    "Which organ in the human body produces the chemical hormone insulin?",
    "मानव शरीरको कुन अंगले इन्सुलिन हर्मोन उत्पादन गर्छ?",
    "Pancreas",
    ["Liver", "Kidney", "Gallbladder"],
    "अग्न्याशय (Pancreas)",
    ["कलेजो", "मिर्गौला", "पित्ताशय"],
    "global",
    "science",
    ["6-8", "9-10"],
    3,
    "human-biology"
  ],
  [
    "What is the mathematical constant Pi (π) rounded to two decimal places?",
    "गणितीय स्थिरांक पाई (π) को दुई दशमलव सम्मको मान कति हो?",
    "3.14",
    ["3.12", "3.16", "3.18"],
    "३.१४",
    ["३.१२", "३.१६", "३.१८"],
    "global",
    "math",
    ["4-5", "6-8"],
    1,
    "math-constants"
  ],
  [
    "Which is the largest and deepest of the Earth's five oceanic divisions?",
    "पृथ्वीको सबैभन्दा ठूलो र गहिरो महासागर कुन हो?",
    "Pacific Ocean",
    ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean"],
    "प्रशान्त महासागर",
    ["आन्ध्र महासागर", "हिन्द महासागर", "उत्तरध्रुवीय महासागर"],
    "global",
    "social",
    ["1-3", "4-5"],
    1,
    "oceans"
  ],
  [
    "In physics, what is the speed of light in a vacuum approximately equal to?",
    "भौतिकशास्त्रमा भ्याकुममा प्रकाशको गति लगभग कति हुन्छ?",
    "300,000 km/s (3 × 10⁸ m/s)",
    ["150,000 km/s", "30,000 km/s", "3,000,000 km/s"],
    "३,००,००० किमी/सेकेन्ड (३ × १०⁸ मि/से)",
    ["१,५०,००० किमी/से", "३०,००० किमी/से", "३०,००,००० किमी/से"],
    "global",
    "science",
    ["9-10"],
    3,
    "physics-speed"
  ]
];
