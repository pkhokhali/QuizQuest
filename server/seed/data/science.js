// Science fact tables — stable facts only.

export const PLANETS = [
  { en: "Mercury", ne: "बुध", order: 1 },
  { en: "Venus", ne: "शुक्र", order: 2 },
  { en: "Earth", ne: "पृथ्वी", order: 3 },
  { en: "Mars", ne: "मंगल", order: 4 },
  { en: "Jupiter", ne: "बृहस्पति", order: 5 },
  { en: "Saturn", ne: "शनि", order: 6 },
  { en: "Uranus", ne: "युरेनस", order: 7 },
  { en: "Neptune", ne: "नेप्च्युन", order: 8 },
];

export const ELEMENTS = [
  ["Hydrogen", "H", 1], ["Helium", "He", 2], ["Lithium", "Li", 3], ["Carbon", "C", 6],
  ["Nitrogen", "N", 7], ["Oxygen", "O", 8], ["Sodium", "Na", 11], ["Magnesium", "Mg", 12],
  ["Aluminium", "Al", 13], ["Silicon", "Si", 14], ["Phosphorus", "P", 15], ["Sulphur", "S", 16],
  ["Chlorine", "Cl", 17], ["Potassium", "K", 19], ["Calcium", "Ca", 20], ["Iron", "Fe", 26],
  ["Copper", "Cu", 29], ["Zinc", "Zn", 30], ["Silver", "Ag", 47], ["Gold", "Au", 79],
  ["Mercury", "Hg", 80], ["Lead", "Pb", 82],
];

export const UNITS = [
  ["Length", "Metre", ["Kilogram", "Second", "Litre"]],
  ["Mass", "Kilogram", ["Metre", "Newton", "Pascal"]],
  ["Time", "Second", ["Minute-only", "Metre", "Joule"]],
  ["Force", "Newton", ["Joule", "Watt", "Pascal"]],
  ["Energy", "Joule", ["Newton", "Watt", "Volt"]],
  ["Power", "Watt", ["Joule", "Ampere", "Ohm"]],
  ["Electric current", "Ampere", ["Volt", "Ohm", "Watt"]],
  ["Electric resistance", "Ohm", ["Ampere", "Volt", "Farad"]],
  ["Pressure", "Pascal", ["Newton", "Bar-only", "Joule"]],
  ["Temperature", "Kelvin", ["Celsius-only", "Joule", "Watt"]],
  ["Frequency", "Hertz", ["Second", "Watt", "Decibel"]],
  ["Electric potential", "Volt", ["Ampere", "Ohm", "Coulomb"]],
];

export const BODY_FACTS = [
  // [qEn, qNe, correct, distractors, correctNe, distractorsNe, difficulty]
  ["How many bones does an adult human body have?", "वयस्क मानिसको शरीरमा कति हड्डी हुन्छन्?", "206", ["300", "180", "250"], "२०६", ["३००", "१८०", "२५०"], 2],
  ["Which is the largest organ of the human body?", "मानव शरीरको सबैभन्दा ठूलो अंग कुन हो?", "Skin", ["Liver", "Heart", "Brain"], "छाला", ["कलेजो", "मुटु", "मस्तिष्क"], 2],
  ["Which organ pumps blood in our body?", "हाम्रो शरीरमा रगत पम्प गर्ने अंग कुन हो?", "Heart", ["Lungs", "Kidney", "Stomach"], "मुटु", ["फोक्सो", "मिर्गौला", "पेट"], 1],
  ["How many chambers does the human heart have?", "मानव मुटुमा कति कोठा हुन्छन्?", "4", ["2", "3", "6"], "४", ["२", "३", "६"], 2],
  ["Which part of the body helps us breathe?", "शरीरको कुन अंगले सास फेर्न मद्दत गर्छ?", "Lungs", ["Heart", "Liver", "Kidney"], "फोक्सो", ["मुटु", "कलेजो", "मिर्गौला"], 1],
  ["What is the smallest bone in the human body?", "मानव शरीरको सबैभन्दा सानो हड्डी कुन हो?", "Stapes (in the ear)", ["Femur", "Radius", "Tibia"], "स्टेपिज (कानमा)", ["फिमर", "रेडियस", "टिबिया"], 4],
  ["What is the longest bone in the human body?", "मानव शरीरको सबैभन्दा लामो हड्डी कुन हो?", "Femur", ["Spine", "Humerus", "Tibia"], "फिमर", ["ढाड", "ह्युमरस", "टिबिया"], 3],
  ["Which blood cells help fight infection?", "कुन रक्तकोषले संक्रमणसँग लड्न मद्दत गर्छ?", "White blood cells", ["Red blood cells", "Platelets", "Plasma"], "सेता रक्तकोष", ["राता रक्तकोष", "प्लेटलेट्स", "प्लाज्मा"], 2],
  ["Which vitamin do we get from sunlight?", "घामबाट हामीलाई कुन भिटामिन मिल्छ?", "Vitamin D", ["Vitamin A", "Vitamin C", "Vitamin B12"], "भिटामिन डी", ["भिटामिन ए", "भिटामिन सी", "भिटामिन बी१२"], 1],
  ["Which organ filters waste from our blood?", "रगतबाट फोहोर छान्ने अंग कुन हो?", "Kidney", ["Liver", "Heart", "Lungs"], "मिर्गौला", ["कलेजो", "मुटु", "फोक्सो"], 2],
];

export const GENERAL_SCIENCE = [
  ["What is H2O commonly known as?", "H2O लाई साधारणतया के भनिन्छ?", "Water", ["Oxygen", "Hydrogen", "Salt"], "पानी", ["अक्सिजन", "हाइड्रोजन", "नुन"], 1],
  ["Which gas do plants absorb from the air?", "बिरुवाले हावाबाट कुन ग्यास लिन्छन्?", "Carbon dioxide", ["Oxygen", "Nitrogen", "Hydrogen"], "कार्बन डाइअक्साइड", ["अक्सिजन", "नाइट्रोजन", "हाइड्रोजन"], 1],
  ["Which gas do we need to breathe?", "हामीलाई सास फेर्न कुन ग्यास चाहिन्छ?", "Oxygen", ["Carbon dioxide", "Nitrogen", "Helium"], "अक्सिजन", ["कार्बन डाइअक्साइड", "नाइट्रोजन", "हिलियम"], 1],
  ["What is the process by which plants make food?", "बिरुवाले खाना बनाउने प्रक्रिया के हो?", "Photosynthesis", ["Respiration", "Digestion", "Evaporation"], "प्रकाश संश्लेषण", ["श्वासप्रश्वास", "पाचन", "वाष्पीकरण"], 2],
  ["What is the boiling point of water at sea level?", "समुद्र सतहमा पानीको उम्लने बिन्दु कति हो?", "100°C", ["90°C", "80°C", "120°C"], "१००° से.", ["९०° से.", "८०° से.", "१२०° से."], 1],
  ["What is the freezing point of water?", "पानीको जम्ने बिन्दु कति हो?", "0°C", ["10°C", "-10°C", "5°C"], "०° से.", ["१०° से.", "-१०° से.", "५° से."], 1],
  ["What is the speed of light approximately?", "प्रकाशको गति लगभग कति हो?", "300,000 km/s", ["150,000 km/s", "300,000 m/s", "3,000 km/s"], "३,००,००० कि.मि./से.", ["१,५०,००० कि.मि./से.", "३,००,००० मि./से.", "३,००० कि.मि./से."], 3],
  ["Which force pulls objects toward the Earth?", "वस्तुहरूलाई पृथ्वीतिर तान्ने बल कुन हो?", "Gravity", ["Magnetism", "Friction", "Electricity"], "गुरुत्वाकर्षण", ["चुम्बकत्व", "घर्षण", "बिजुली"], 1],
  ["Who proposed the theory of gravity after seeing a falling apple?", "स्याउ खसेको देखेर गुरुत्वाकर्षणको सिद्धान्त कसले प्रतिपादन गरे?", "Isaac Newton", ["Albert Einstein", "Galileo Galilei", "Thomas Edison"], "आइज्याक न्युटन", ["अल्बर्ट आइन्स्टाइन", "ग्यालिलियो ग्यालिली", "थोमस एडिसन"], 2],
  ["What percentage of the Earth's surface is covered by water?", "पृथ्वीको सतहको कति प्रतिशत भाग पानीले ढाकेको छ?", "About 71%", ["About 50%", "About 60%", "About 85%"], "लगभग ७१%", ["लगभग ५०%", "लगभग ६०%", "लगभग ८५%"], 2],
  ["Which is the hardest natural substance?", "सबैभन्दा कडा प्राकृतिक पदार्थ कुन हो?", "Diamond", ["Iron", "Gold", "Granite"], "हीरा", ["फलाम", "सुन", "ग्रेनाइट"], 2],
  ["What do we call animals that eat only plants?", "बिरुवा मात्र खाने जनावरलाई के भनिन्छ?", "Herbivores", ["Carnivores", "Omnivores", "Predators"], "शाकाहारी", ["मांसाहारी", "सर्वाहारी", "सिकारी"], 1],
  ["Which planet is known as the Red Planet?", "रातो ग्रह भनेर कुन ग्रह चिनिन्छ?", "Mars", ["Venus", "Jupiter", "Mercury"], "मंगल", ["शुक्र", "बृहस्पति", "बुध"], 1],
  ["How long does the Earth take to orbit the Sun?", "पृथ्वीले सूर्यको परिक्रमा गर्न कति समय लिन्छ?", "About 365 days", ["About 30 days", "About 24 hours", "About 180 days"], "लगभग ३६५ दिन", ["लगभग ३० दिन", "लगभग २४ घण्टा", "लगभग १८० दिन"], 1],
  ["What causes day and night?", "दिन र रात हुनुको कारण के हो?", "Earth's rotation", ["Earth's revolution", "Moon's rotation", "Sun's movement"], "पृथ्वीको घूर्णन", ["पृथ्वीको परिक्रमा", "चन्द्रमाको घूर्णन", "सूर्यको गति"], 2],
];

export const INVENTORS = [
  ["Telephone", "Alexander Graham Bell", ["Thomas Edison", "Nikola Tesla", "Guglielmo Marconi"]],
  ["Light bulb (practical)", "Thomas Edison", ["Alexander Graham Bell", "Isaac Newton", "Michael Faraday"]],
  ["Radio", "Guglielmo Marconi", ["Thomas Edison", "Alexander Graham Bell", "James Watt"]],
  ["Steam engine (improved)", "James Watt", ["George Stephenson", "Thomas Edison", "Isaac Newton"]],
  ["Theory of relativity", "Albert Einstein", ["Isaac Newton", "Galileo Galilei", "Stephen Hawking"]],
  ["Penicillin", "Alexander Fleming", ["Louis Pasteur", "Edward Jenner", "Marie Curie"]],
  ["Radium and Polonium", "Marie Curie", ["Albert Einstein", "Alexander Fleming", "Dmitri Mendeleev"]],
  ["Periodic table", "Dmitri Mendeleev", ["Marie Curie", "John Dalton", "Antoine Lavoisier"]],
  ["Airplane", "Wright Brothers", ["Henry Ford", "Thomas Edison", "Leonardo da Vinci"]],
  ["Printing press", "Johannes Gutenberg", ["Benjamin Franklin", "James Watt", "Louis Braille"]],
  ["World Wide Web", "Tim Berners-Lee", ["Bill Gates", "Steve Jobs", "Alan Turing"]],
  ["Telescope (refined for astronomy)", "Galileo Galilei", ["Isaac Newton", "Copernicus", "Kepler"]],
];

export const ANIMAL_FACTS = [
  ["Which is the largest animal on Earth?", "पृथ्वीको सबैभन्दा ठूलो जनावर कुन हो?", "Blue whale", ["Elephant", "Giraffe", "Great white shark"], "नीलो ह्वेल", ["हात्ती", "जिराफ", "ग्रेट ह्वाइट शार्क"], 1],
  ["Which is the fastest land animal?", "जमिनमा सबैभन्दा छिटो दौडने जनावर कुन हो?", "Cheetah", ["Lion", "Horse", "Leopard"], "चितुवा (चिता)", ["सिंह", "घोडा", "चितुवा"], 1],
  ["Which is the tallest animal in the world?", "विश्वको सबैभन्दा अग्लो जनावर कुन हो?", "Giraffe", ["Elephant", "Camel", "Ostrich"], "जिराफ", ["हात्ती", "ऊँट", "अस्ट्रिच"], 1],
  ["Which bird cannot fly?", "कुन चरा उड्न सक्दैन?", "Ostrich", ["Eagle", "Sparrow", "Crow"], "अस्ट्रिच", ["चील", "भँगेरा", "काग"], 1],
  ["Which is the largest bird in the world?", "विश्वको सबैभन्दा ठूलो चरा कुन हो?", "Ostrich", ["Eagle", "Albatross", "Peacock"], "अस्ट्रिच", ["चील", "अल्बाट्रस", "मयूर"], 2],
  ["How many legs does a spider have?", "माकुराका कति खुट्टा हुन्छन्?", "8", ["6", "10", "4"], "८", ["६", "१०", "४"], 1],
  ["Which animal is known as the 'Ship of the Desert'?", "'मरुभूमिको जहाज' भनेर कुन जनावर चिनिन्छ?", "Camel", ["Horse", "Elephant", "Donkey"], "ऊँट", ["घोडा", "हात्ती", "गधा"], 1],
  ["Which mammal can fly?", "कुन स्तनधारी उड्न सक्छ?", "Bat", ["Flying squirrel", "Ostrich", "Penguin"], "चमेरो", ["उड्ने लोखर्के", "अस्ट्रिच", "पेन्गुइन"], 2],
];
