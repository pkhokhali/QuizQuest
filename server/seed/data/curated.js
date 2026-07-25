// Curated one-off questions. Shape: [textEn, textNe|null, correct, [d1,d2,d3], correctNe|null, [dNe x3]|null, country, subject, gradeBands[], difficulty, topic]
// Stable facts only — anything time-sensitive goes through the admin digest/curation pipeline.

export const CURATED = [
  // World GK
  ["Which is the largest ocean in the world?", "विश्वको सबैभन्दा ठूलो महासागर कुन हो?", "Pacific Ocean", ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean"], "प्रशान्त महासागर", ["एट्लान्टिक महासागर", "हिन्द महासागर", "आर्कटिक महासागर"], "global", "gk", ["4-5", "6-8"], 2, "geography"],
  ["Which is the longest river in the world?", "विश्वको सबैभन्दा लामो नदी कुन हो?", "Nile", ["Amazon", "Ganges", "Yangtze"], "नाइल", ["अमेजन", "गंगा", "याङ्जे"], "global", "gk", ["4-5", "6-8"], 2, "geography"],
  ["Which is the largest desert in the world?", "विश्वको सबैभन्दा ठूलो मरुभूमि कुन हो?", "Sahara (hot desert)", ["Gobi", "Thar", "Kalahari"], "सहारा", ["गोबी", "थार", "कालाहारी"], "global", "gk", ["6-8"], 3, "geography"],
  ["How many continents are there in the world?", "विश्वमा कति महादेश छन्?", "7", ["5", "6", "8"], "७", ["५", "६", "८"], "global", "gk", ["1-3", "4-5"], 1, "geography"],
  ["Which is the smallest country in the world?", "विश्वको सबैभन्दा सानो देश कुन हो?", "Vatican City", ["Monaco", "Maldives", "Singapore"], "भ्याटिकन सिटी", ["मोनाको", "माल्दिभ्स", "सिंगापुर"], "global", "gk", ["6-8", "9-10"], 3, "geography"],
  ["Which country is known as the 'Land of the Rising Sun'?", "'उदाउँदो सूर्यको देश' भनेर कुन देश चिनिन्छ?", "Japan", ["China", "Thailand", "South Korea"], "जापान", ["चीन", "थाइल्यान्ड", "दक्षिण कोरिया"], "global", "gk", ["4-5", "6-8"], 2, "nicknames"],
  ["The Great Wall is located in which country?", "ग्रेट वाल कुन देशमा छ?", "China", ["Japan", "India", "Mongolia"], "चीन", ["जापान", "भारत", "मंगोलिया"], "global", "gk", ["4-5", "6-8"], 1, "landmarks"],
  ["The Eiffel Tower is in which city?", "आइफल टावर कुन सहरमा छ?", "Paris", ["London", "Rome", "Berlin"], "पेरिस", ["लन्डन", "रोम", "बर्लिन"], "global", "gk", ["4-5", "6-8"], 1, "landmarks"],
  ["The Statue of Liberty was a gift to the USA from which country?", "स्ट्याचु अफ लिबर्टी अमेरिकालाई कुन देशले उपहार दिएको थियो?", "France", ["United Kingdom", "Spain", "Italy"], "फ्रान्स", ["बेलायत", "स्पेन", "इटाली"], "usa", "gk", ["6-8", "9-10"], 3, "landmarks"],
  ["Which organization has its headquarters in New York and works for world peace?", "विश्व शान्तिका लागि काम गर्ने, न्युयोर्कमा मुख्यालय भएको संस्था कुन हो?", "United Nations", ["World Bank", "UNESCO", "WHO"], "संयुक्त राष्ट्र संघ", ["विश्व बैंक", "युनेस्को", "विश्व स्वास्थ्य संगठन"], "global", "gk", ["6-8", "9-10"], 2, "organizations"],
  ["How many colors are there in a rainbow?", "इन्द्रेणीमा कति रंग हुन्छन्?", "7", ["5", "6", "8"], "७", ["५", "६", "८"], "global", "gk", ["1-3"], 1, "nature"],
  ["Which is the tallest mountain in the world?", "विश्वको सबैभन्दा अग्लो हिमाल कुन हो?", "Mount Everest", ["K2", "Kanchenjunga", "Makalu"], "सगरमाथा", ["केटु", "कञ्चनजङ्घा", "मकालु"], "global", "gk", ["1-3", "4-5"], 1, "geography"],
  ["In which sport is the term 'century' used for scoring 100 runs?", "कुन खेलमा १०० रन बनाउँदा 'सेन्चुरी' भनिन्छ?", "Cricket", ["Football", "Volleyball", "Basketball"], "क्रिकेट", ["फुटबल", "भलिबल", "बास्केटबल"], "global", "gk", ["4-5", "6-8"], 1, "sports"],
  ["How many players are there in a football (soccer) team on the field?", "फुटबल टिममा मैदानमा कति खेलाडी हुन्छन्?", "11", ["9", "10", "12"], "११", ["९", "१०", "१२"], "global", "gk", ["4-5", "6-8"], 1, "sports"],
  ["The Olympic Games are held every how many years?", "ओलम्पिक खेल कति वर्षमा हुन्छ?", "4", ["2", "3", "5"], "४", ["२", "३", "५"], "global", "gk", ["4-5", "6-8"], 2, "sports"],
  ["Which is the national game of the USA?", "अमेरिकाको राष्ट्रिय खेल कुन हो?", "Baseball", ["Basketball", "American Football", "Ice Hockey"], "बेसबल", ["बास्केटबल", "अमेरिकन फुटबल", "आइस हकी"], "usa", "gk", ["6-8"], 3, "sports"],

  // India pack
  ["Which is the national animal of India?", "भारतको राष्ट्रिय जनावर कुन हो?", "Bengal Tiger", ["Lion", "Elephant", "Leopard"], "बंगाल बाघ", ["सिंह", "हात्ती", "चितुवा"], "india", "gk", ["4-5", "6-8"], 1, "national-symbols"],
  ["Which is the national bird of India?", "भारतको राष्ट्रिय चरा कुन हो?", "Peacock", ["Parrot", "Eagle", "Crane"], "मयूर", ["सुगा", "चील", "सारस"], "india", "gk", ["4-5", "6-8"], 1, "national-symbols"],
  ["The Taj Mahal is located in which city?", "ताजमहल कुन सहरमा छ?", "Agra", ["Delhi", "Jaipur", "Mumbai"], "आगरा", ["दिल्ली", "जयपुर", "मुम्बई"], "india", "gk", ["4-5", "6-8"], 1, "landmarks"],
  ["Who is known as the 'Father of the Nation' in India?", "भारतमा 'राष्ट्रपिता' भनेर को चिनिन्छन्?", "Mahatma Gandhi", ["Jawaharlal Nehru", "Sardar Patel", "B. R. Ambedkar"], "महात्मा गान्धी", ["जवाहरलाल नेहरू", "सरदार पटेल", "बी. आर. अम्बेडकर"], "india", "social", ["6-8", "9-10"], 2, "history"],
  ["India got independence from British rule in which year?", "भारत बेलायती शासनबाट कुन वर्ष स्वतन्त्र भयो?", "1947", ["1950", "1942", "1935"], "सन् १९४७", ["सन् १९५०", "सन् १९४२", "सन् १९३५"], "india", "social", ["6-8", "9-10"], 2, "history"],
  ["Which river is considered the holiest in India?", "भारतमा सबैभन्दा पवित्र मानिने नदी कुन हो?", "Ganges (Ganga)", ["Yamuna", "Brahmaputra", "Godavari"], "गंगा", ["यमुना", "ब्रह्मपुत्र", "गोदावरी"], "india", "gk", ["4-5", "6-8"], 2, "geography"],
  ["Which Indian city is called the 'Pink City'?", "भारतको कुन सहरलाई 'गुलाबी सहर' भनिन्छ?", "Jaipur", ["Jodhpur", "Udaipur", "Agra"], "जयपुर", ["जोधपुर", "उदयपुर", "आगरा"], "india", "gk", ["6-8"], 3, "nicknames"],
  ["Which is the largest state of India by area?", "क्षेत्रफलका आधारमा भारतको सबैभन्दा ठूलो राज्य कुन हो?", "Rajasthan", ["Uttar Pradesh", "Maharashtra", "Madhya Pradesh"], "राजस्थान", ["उत्तर प्रदेश", "महाराष्ट्र", "मध्य प्रदेश"], "india", "gk", ["6-8", "9-10"], 3, "geography"],
  ["The Indian festival of lights is called what?", "भारतको उज्यालोको चाडलाई के भनिन्छ?", "Diwali", ["Holi", "Eid", "Pongal"], "दिवाली (दीपावली)", ["होली", "इद", "पोंगल"], "india", "social", ["4-5", "6-8"], 1, "culture"],
  ["Which Indian scientist-president was known as the 'Missile Man'?", "'मिसाइल म्यान' भनेर चिनिने भारतीय वैज्ञानिक-राष्ट्रपति को हुन्?", "A. P. J. Abdul Kalam", ["C. V. Raman", "Homi Bhabha", "Vikram Sarabhai"], "ए. पी. जे. अब्दुल कलाम", ["सी. भी. रमन", "होमी भाभा", "विक्रम साराभाई"], "india", "gk", ["9-10", "11-12"], 3, "personalities"],

  // USA pack
  ["Who was the first President of the United States?", "संयुक्त राज्य अमेरिकाका पहिलो राष्ट्रपति को थिए?", "George Washington", ["Abraham Lincoln", "Thomas Jefferson", "John Adams"], "जर्ज वासिङ्टन", ["अब्राहम लिंकन", "थोमस जेफर्सन", "जोन एडम्स"], "usa", "social", ["6-8", "9-10"], 2, "history"],
  ["How many states are there in the USA?", "अमेरिकामा कति राज्य छन्?", "50", ["48", "51", "52"], "५०", ["४८", "५१", "५२"], "usa", "gk", ["4-5", "6-8"], 1, "geography"],
  ["The USA declared independence in which year?", "अमेरिकाले कुन वर्ष स्वतन्त्रताको घोषणा गर्‍यो?", "1776", ["1789", "1750", "1800"], "सन् १७७६", ["सन् १७८९", "सन् १७५०", "सन् १८००"], "usa", "social", ["6-8", "9-10"], 3, "history"],
  ["Which US President ended slavery?", "कुन अमेरिकी राष्ट्रपतिले दासप्रथा अन्त्य गरे?", "Abraham Lincoln", ["George Washington", "Franklin Roosevelt", "John Kennedy"], "अब्राहम लिंकन", ["जर्ज वासिङ्टन", "फ्र्याङ्कलिन रुजवेल्ट", "जोन केनेडी"], "usa", "social", ["6-8", "9-10"], 3, "history"],
  ["Which city in the USA is famous as the center of movies (Hollywood)?", "अमेरिकाको कुन सहर चलचित्र (हलिउड) का लागि प्रसिद्ध छ?", "Los Angeles", ["New York", "Chicago", "Miami"], "लस एन्जलस", ["न्युयोर्क", "सिकागो", "मायामी"], "usa", "gk", ["4-5", "6-8"], 2, "culture"],
  ["Which is the longest river in the USA?", "अमेरिकाको सबैभन्दा लामो नदी कुन हो?", "Missouri River", ["Mississippi River", "Colorado River", "Hudson River"], "मिसौरी नदी", ["मिसिसिपी नदी", "कोलोराडो नदी", "हडसन नदी"], "usa", "gk", ["9-10"], 4, "geography"],
  ["The first person to walk on the Moon was an American. Who?", "चन्द्रमामा पहिलो पाइला टेक्ने अमेरिकी को थिए?", "Neil Armstrong", ["Buzz Aldrin", "Yuri Gagarin", "John Glenn"], "नील आर्मस्ट्रङ", ["बज एल्ड्रिन", "युरी गागरिन", "जोन ग्लेन"], "usa", "gk", ["6-8", "9-10"], 2, "space"],
  ["Which famous US landmark is carved with faces of four presidents?", "चार राष्ट्रपतिको अनुहार कुँदिएको प्रसिद्ध अमेरिकी स्मारक कुन हो?", "Mount Rushmore", ["Statue of Liberty", "Lincoln Memorial", "Golden Gate Bridge"], "माउन्ट रसमोर", ["स्ट्याचु अफ लिबर्टी", "लिंकन मेमोरियल", "गोल्डेन गेट ब्रिज"], "usa", "gk", ["6-8", "9-10"], 3, "landmarks"],

  // Social / civics (Nepal-flavored but stable)
  ["What is the minimum voting age in Nepal?", "नेपालमा मतदान गर्ने न्यूनतम उमेर कति हो?", "18 years", ["16 years", "21 years", "20 years"], "१८ वर्ष", ["१६ वर्ष", "२१ वर्ष", "२० वर्ष"], "nepal", "social", ["6-8", "9-10"], 2, "civics"],
  ["Who makes laws in Nepal?", "नेपालमा कानुन कसले बनाउँछ?", "Federal Parliament", ["Supreme Court", "Police", "Ministers only"], "संघीय संसद", ["सर्वोच्च अदालत", "प्रहरी", "मन्त्रीहरू मात्र"], "nepal", "social", ["6-8", "9-10"], 3, "civics"],
  ["Which body interprets the constitution of Nepal?", "नेपालको संविधानको व्याख्या कुन निकायले गर्छ?", "Supreme Court", ["Parliament", "President's Office", "Election Commission"], "सर्वोच्च अदालत", ["संसद", "राष्ट्रपति कार्यालय", "निर्वाचन आयोग"], "nepal", "social", ["9-10", "11-12"], 4, "civics"],
  ["What are the three levels of government in Nepal?", "नेपालमा सरकारका तीन तह कुन-कुन हुन्?", "Federal, Provincial, Local", ["Central, Zonal, District", "National, Regional, Village", "Federal, District, Ward"], "संघ, प्रदेश, स्थानीय", ["केन्द्र, अञ्चल, जिल्ला", "राष्ट्रिय, क्षेत्रीय, गाउँ", "संघ, जिल्ला, वडा"], "nepal", "social", ["6-8", "9-10"], 3, "civics"],
  ["Children below which age should never be employed as laborers (per Nepal law)?", "नेपालको कानुनअनुसार कति वर्षमुनिका बालबालिकालाई श्रममा लगाउनु हुँदैन?", "14 years", ["10 years", "12 years", "16 years"], "१४ वर्ष", ["१० वर्ष", "१२ वर्ष", "१६ वर्ष"], "nepal", "social", ["6-8", "9-10"], 4, "civics"],

  // Financial literacy (evergreen; sponsored-pack style content)
  ["What is money kept in a bank account called?", "बैंक खातामा राखिएको पैसालाई के भनिन्छ?", "Deposit", ["Loan", "Interest", "Tax"], "निक्षेप", ["ऋण", "ब्याज", "कर"], "global", "gk", ["4-5", "6-8"], 2, "financial-literacy"],
  ["What do we call the extra money a bank pays you for saving?", "बचत गरेबापत बैंकले दिने थप रकमलाई के भनिन्छ?", "Interest", ["Deposit", "Fine", "Fee"], "ब्याज", ["निक्षेप", "जरिवाना", "शुल्क"], "global", "gk", ["4-5", "6-8"], 2, "financial-literacy"],
  ["Which of these is the best habit with pocket money?", "खर्च गर्न पाएको पैसामा सबैभन्दा राम्रो बानी कुन हो?", "Save some, spend some wisely", ["Spend it all immediately", "Hide it and forget it", "Give it away always"], "केही बचत गर्ने, केही बुद्धिमानीपूर्वक खर्च गर्ने", ["तुरुन्तै सबै खर्च गर्ने", "लुकाएर बिर्सने", "सधैं अरूलाई दिने"], "global", "gk", ["4-5", "6-8"], 1, "financial-literacy"],
  ["What is a budget?", "बजेट भनेको के हो?", "A plan for income and spending", ["A type of bank", "A kind of tax", "A loan from friends"], "आम्दानी र खर्चको योजना", ["एक प्रकारको बैंक", "एक किसिमको कर", "साथीबाट लिएको ऋण"], "global", "gk", ["6-8", "9-10"], 2, "financial-literacy"],

  // Health & hygiene (evergreen)
  ["How long should you wash your hands with soap?", "साबुनले कति समयसम्म हात धुनुपर्छ?", "At least 20 seconds", ["5 seconds", "2 seconds", "1 minute exactly"], "कम्तीमा २० सेकेन्ड", ["५ सेकेन्ड", "२ सेकेन्ड", "ठिक १ मिनेट"], "global", "science", ["1-3", "4-5"], 1, "health"],
  ["How many hours of sleep do school-age children need each night?", "विद्यालय जाने उमेरका बालबालिकालाई रातमा कति घण्टा निद्रा चाहिन्छ?", "9-11 hours", ["4-5 hours", "6 hours", "14 hours"], "९-११ घण्टा", ["४-५ घण्टा", "६ घण्टा", "१४ घण्टा"], "global", "science", ["4-5", "6-8"], 2, "health"],
  ["Which food group gives us energy the fastest?", "कुन खाद्य समूहले हामीलाई सबैभन्दा छिटो शक्ति दिन्छ?", "Carbohydrates", ["Proteins", "Vitamins", "Minerals"], "कार्बोहाइड्रेट", ["प्रोटिन", "भिटामिन", "खनिज"], "global", "science", ["4-5", "6-8"], 2, "health"],
  ["Which drink is healthiest for daily hydration?", "दैनिक शरीरलाई चाहिने तरल पदार्थका लागि सबैभन्दा स्वस्थ पेय कुन हो?", "Water", ["Soft drinks", "Energy drinks", "Sweetened juice"], "पानी", ["सफ्ट ड्रिंक्स", "एनर्जी ड्रिंक्स", "गुलियो जुस"], "global", "science", ["1-3", "4-5"], 1, "health"],
];
