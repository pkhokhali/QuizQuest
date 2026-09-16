/**
 * QuizQuest Word Search (शब्द खोज) Master Vocabulary Dataset
 * Comprehensive bilingual database with core categories,
 * mystery words, and extensive curated vocabulary.
 */

export interface WordEntry {
  word: string;
  clueEn: string;
  clueNe: string;
  difficulty?: "easy" | "medium" | "hard";
}

export interface WordSearchCategoryConfig {
  id: string;
  titleEn: string;
  titleNe: string;
  icon: string;
  mysteryWord: {
    word: string;
    clueEn: string;
    clueNe: string;
  };
  words: WordEntry[];
}

export const WORD_SEARCH_DATA: Record<string, WordSearchCategoryConfig> = {
  nepal_heritage: {
    id: "nepal_heritage",
    titleEn: "Nepal Heritage & Landmarks",
    titleNe: "नेपाली सम्पदा र धरोहर",
    icon: "🏔️",
    mysteryWord: {
      word: "NEPAL",
      clueEn: "The sacred Himalayan country of Mount Everest & Buddha",
      clueNe: "सगरमाथा र शान्तिका अग्रदूत बुद्धको पावन देश नेपाल",
    },
    words: [
      { word: "SAGARMATHA", clueEn: "Highest peak in the world (8848.86m)", clueNe: "विश्वको सर्वोच्च शिखर सगरमाथा" },
      { word: "POKHARA", clueEn: "Scenic lake city surrounded by Annapurnas", clueNe: "नेपालको सुन्दर तालहरूको सहर पोखरा" },
      { word: "LUMBINI", clueEn: "Holy birthplace of Gautama Buddha", clueNe: "भगवान गौतम बुद्धको पावन जन्मस्थल लुम्बिनी" },
      { word: "DANFE", clueEn: "National bird of Nepal (Himalayan Monal)", clueNe: "नेपालको राष्ट्रिय चरा डाँफे" },
      { word: "RHINO", clueEn: "One-horned icon of Chitwan grasslands", clueNe: "चितवनको प्रसिद्ध एकसिङ्गे गैँडा" },
      { word: "BAGMATI", clueEn: "Holy river flowing past Pashupatinath", clueNe: "काठमाडौँको पवित्र बागमती नदी" },
      { word: "PATAN", clueEn: "Ancient city of fine arts and Lalitpur palace", clueNe: "कला र संस्कृतिको ऐतिहासिक पाटन नगर" },
      { word: "BHAKTAPUR", clueEn: "City of devotees & 55-window palace", clueNe: "पचपन्न झ्याले दरबार भएको भक्तपुर" },
      { word: "JANAKPUR", clueEn: "Birthplace of Goddess Sita & Janaki Mandir", clueNe: "माता सीताको जन्मभूमि तथा जानकी मन्दिर" },
      { word: "MUSTANG", clueEn: "Ancient Himalayan kingdom of caves & Lo Manthang", clueNe: "हिमाल पारिको ऐतिहासिक मुस्ताङ जिल्ला" },
      { word: "GORKHA", clueEn: "Historical cradle of unified Nepal & brave Gorkhali", clueNe: "एकीकृत नेपालको उद्गम थलो गोरखा" },
      { word: "PASHUPATI", clueEn: "Supreme Hindu temple dedicated to Lord Shiva", clueNe: "विश्वप्रसिद्ध पशुपतिनाथ मन्दिर" },
      { word: "SWAYAMBHU", clueEn: "Ancient hillside stupa with watching eyes", clueNe: "काठमाडौँ उपत्यकाको स्वयम्भूनाथ महाचैत्य" },
      { word: "BOUDHA", clueEn: "Gigantic spherical mandala stupa of Kathmandu", clueNe: "विश्वकै ठूला बौद्ध स्तूपहरूमध्ये एक बौद्धनाथ" },
      { word: "ILAM", clueEn: "Verdant misty tea hills of eastern Nepal", clueNe: "चियाबारीको रमणीय जिल्ला इलाम" },
      { word: "GOSAINKUNDA", clueEn: "Holy alpine lake of Lord Shiva in Langtang", clueNe: "लाङटाङ क्षेत्रको पवित्र गोसाइँकुण्ड" },
      { word: "MANAKAMANA", clueEn: "Wish-fulfilling temple reached by cable car", clueNe: "मनोकामना पूरा गर्ने देवी मनकामना मन्दिर" },
      { word: "CHANGUNARAYAN", clueEn: "Oldest dated temple complex in Kathmandu", clueNe: "नेपालको सबैभन्दा पुरानो चाँगुनारायण मन्दिर" },
      { word: "DURBAR", clueEn: "Historic royal squares preserved as UNESCO sites", clueNe: "उपत्यकाका ऐतिहासिक दरबार क्षेत्रहरू" },
      { word: "MUKTINATH", clueEn: "Sacred temple of 108 waterspouts in Mustang", clueNe: "मुस्ताङको मुक्तिनाथ धाम (१०८ धारा)" },
      { word: "KANCHENJUNGA", clueEn: "Third highest mountain peak on Earth", clueNe: "विश्वको तेस्रो अग्लो हिमाल कञ्चनजङ्घा" },
      { word: "MAKALU", clueEn: "Fifth highest mountain known for isolated wilderness", clueNe: "मकालु हिमाल" },
      { word: "DHAULAGIRI", clueEn: "White mountain towering over Kali Gandaki", clueNe: "धवलागिरि हिमाल" },
      { word: "PALPA", clueEn: "Historical hill town famous for Dhaka & metalcraft", clueNe: "ढाका कपडा र रानीमहलको जिल्ला पाल्पा" },
      { word: "BANDIPUR", clueEn: "Preserved Newari hilltop settlement in Tanahun", clueNe: "परम्परागत नेवारी बस्ती बन्दीपुर" },
      { word: "BARAHA", clueEn: "Holy Hindu shrine in Sunsari district", clueNe: "बराहक्षेत्र धाम" },
      { word: "PATHIBHARA", clueEn: "High-altitude pilgrimage site in Taplejung", clueNe: "ताप्लेजुङको पाथीभरा देवी मन्दिर" },
      { word: "RANIMAHAL", clueEn: "The Taj Mahal of Nepal situated on Gandaki bank", clueNe: "कालीगण्डकी किनारको ऐतिहासिक रानीमहल" },
      { word: "KIRTIPUR", clueEn: "Historic fortified township on Kathmandu ridge", clueNe: "कीर्तिपुर ऐतिहासिक नगरी" },
      { word: "PANAUTI", clueEn: "Ancient sacred confluence city with historic temples", clueNe: "काभ्रेको प्राचीन नगरी पनौती" },
    ],
  },
  solar_system: {
    id: "solar_system",
    titleEn: "Cosmos & Astronomy",
    titleNe: "सौर्यमण्डल र खगोल",
    icon: "🪐",
    mysteryWord: {
      word: "SOLAR",
      clueEn: "Relating to the Sun and the gravitationally bound planetary system",
      clueNe: "सूर्य र त्यसको ऊर्जासँग सम्बन्धित",
    },
    words: [
      { word: "JUPITER", clueEn: "Largest gas giant with the Great Red Spot", clueNe: "सौर्यमण्डलको सबैभन्दा ठूलो ग्रह वृहस्पति" },
      { word: "SATURN", clueEn: "Planet world-famous for its majestic ring system", clueNe: "सुन्दर घेरा (रिङ) भएको शनि ग्रह" },
      { word: "MERCURY", clueEn: "Innermost planet nearest to the blazing Sun", clueNe: "सूर्यको सबैभन्दा नजिकको बुध ग्रह" },
      { word: "NEPTUNE", clueEn: "Farthest icy blue giant swept by supersonic winds", clueNe: "सौर्यमण्डलको सबैभन्दा टाढाको बरुण ग्रह" },
      { word: "VENUS", clueEn: "Hottest planet shrouded in thick acid clouds", clueNe: "सबैभन्दा चम्किलो र तातो शुक्र ग्रह" },
      { word: "MARS", clueEn: "The iron-rich Red Planet with polar ice caps", clueNe: "रातो ग्रह मङ्गल" },
      { word: "URANUS", clueEn: "Pale cyan ice giant that rotates on its side", clueNe: "ढल्केको अक्षमा घुम्ने अरुण ग्रह" },
      { word: "PLUTO", clueEn: "Famous dwarf planet residing in the Kuiper Belt", clueNe: "कुइपर बेल्टमा रहेको पुड्के ग्रह यम (प्लुटो)" },
      { word: "COMET", clueEn: "Cosmic dirty snowball forming a glowing ion tail", clueNe: "आकाशमा पुच्छर फैलाउने पुच्छ्रेतारा" },
      { word: "GALAXY", clueEn: "Colossal gravitational vortex of billions of stars", clueNe: "अरबौं ताराहरूको समूह (तारापुञ्ज)" },
      { word: "METEOR", clueEn: "Streaking light trail made by debris in atmosphere", clueNe: "वायुमण्डलमा घर्षणले बल्ने उल्कापिण्ड" },
      { word: "ECLIPSE", clueEn: "Celestial alignment where sunlight is obscured", clueNe: "सूर्य वा चन्द्रमा छेकिने ग्रहण" },
      { word: "ORBIT", clueEn: "Curved gravitational path traversed by celestial body", clueNe: "ग्रह वा उपग्रहको परिक्रमा कक्ष" },
      { word: "ASTEROID", clueEn: "Rocky celestial body orbiting between Mars & Jupiter", clueNe: "मङ्गल र वृहस्पति बीचको क्षुद्रग्रह" },
      { word: "PULSAR", clueEn: "Superdense spinning neutron star radiating beams", clueNe: "तीव्र गतिमा घुम्ने न्युट्रोन तारा" },
      { word: "QUASAR", clueEn: "Extremely luminous active galactic nucleus", clueNe: "ब्रह्माण्डको शक्तिशाली प्रकाश केन्द्र" },
      { word: "NEBULA", clueEn: "Vast interstellar cloud of cosmic dust and hydrogen", clueNe: "ताराहरू जन्माउने अन्तरिक्षको बादल" },
      { word: "SUNSPOT", clueEn: "Darker, cooler magnetic vortex on the Sun surface", clueNe: "सूर्यको सतहमा देखिने कालो धब्बा" },
      { word: "TITAN", clueEn: "Saturn largest moon featuring rivers of liquid methane", clueNe: "शनि ग्रहको विशाल उपग्रह टाइटन" },
      { word: "EUROPA", clueEn: "Jupiter moon concealing a deep liquid water ocean", clueNe: "बरफमुनि समुद्र भएको वृहस्पतिको उपग्रह" },
      { word: "PHOTON", clueEn: "Elementary quantum packet of electromagnetic light", clueNe: "प्रकाशको आधारभूत ऊर्जा कण फोटोन" },
      { word: "GRAVITY", clueEn: "Fundamental attraction pulling masses together", clueNe: "पिण्डहरूलाई तान्ने गुरुत्वाकर्षण बल" },
      { word: "SUPERNOVA", clueEn: "Cataclysmic explosion marking death of giant star", clueNe: "विशाल तारा विस्फोटन (सुपरनोभा)" },
      { word: "HORIZON", clueEn: "Boundary of black hole from which nothing escapes", clueNe: "कृष्णछिद्रको अन्तिम सीमा इभेन्ट होराइजन" },
      { word: "TELESCOPE", clueEn: "Optical instrument allowing observation of deep space", clueNe: "अन्तरिक्ष हेर्ने दूरबिन" },
    ],
  },
  science_elements: {
    id: "science_elements",
    titleEn: "Science & Nature",
    titleNe: "विज्ञान र प्रकृति",
    icon: "🔬",
    mysteryWord: {
      word: "ATOMS",
      clueEn: "The fundamental building blocks of all chemical matter",
      clueNe: "पदार्थ निर्माण गर्ने सबैभन्दा सानो आधारभूत कण",
    },
    words: [
      { word: "OXYGEN", clueEn: "Colorless gas essential for aerobic respiration", clueNe: "प्राणीहरूलाई सास फेर्न चाहिने प्राणवायु" },
      { word: "HYDROGEN", clueEn: "Lightest and most abundant element in the universe", clueNe: "ब्रह्माण्डमा सबैभन्दा बढी पाइने पहिलो तत्व" },
      { word: "CARBON", clueEn: "Core chemical foundation of all organic living chemistry", clueNe: "सबै जैविक जीवनको आधारभूत तत्व कार्बन" },
      { word: "NITROGEN", clueEn: "Inert atmospheric gas making up 78% of Earth air", clueNe: "हावामा ७८ प्रतिशत ओगट्ने नाइट्रोजन ग्यास" },
      { word: "SILICON", clueEn: "Semiconductor element powering microchips & computers", clueNe: "कम्प्युटर चिपमा प्रयोग हुने सिलिकन तत्व" },
      { word: "URANIUM", clueEn: "Heavy radioactive actinide fuel for nuclear power", clueNe: "आणविक ऊर्जा उत्पादनमा चाहिने युरेनियम" },
      { word: "COPPER", clueEn: "Reddish metallic element superb at carrying electricity", clueNe: "विद्युत् सुचालक तामा धातु" },
      { word: "CALCIUM", clueEn: "Alkaline earth mineral required for strong bones", clueNe: "दाँत र हड्डी बलियो बनाउने क्याल्सियम" },
      { word: "IRON", clueEn: "Transition metal binding oxygen within hemoglobin", clueNe: "रगतमा पाइने अत्यावश्यक फलाम तत्व" },
      { word: "SODIUM", clueEn: "Reactive alkali metal forming common table salt", clueNe: "खाने नुनको मुख्य आधार तत्व सोडियम" },
      { word: "HELIUM", clueEn: "Noble gas that makes party balloons float upward", clueNe: "हावाभन्दा हलुका निष्क्रिय हेलियम ग्यास" },
      { word: "CHLORINE", clueEn: "Halogen gas used to sanitize municipal water", clueNe: "पानी शुद्धिकरण गर्न प्रयोग हुने क्लोरिन" },
      { word: "POTASSIUM", clueEn: "Electrolyte nutrient abundant in bananas", clueNe: "केरामा पाइने शरीरलाई चाहिने पोटासियम" },
      { word: "MAGNESIUM", clueEn: "Light metal forming core of chlorophyll in plants", clueNe: "पातलाई हरियो बनाउन मद्दत गर्ने म्याग्नेसियम" },
      { word: "MERCURY", clueEn: "Dense silvery metal that remains liquid at room temp", clueNe: "कोठाको तापक्रममा पनि तरल रहने पारो धातु" },
      { word: "TITANIUM", clueEn: "Super-strong corrosion-proof metal used in aerospace", clueNe: "अत्यन्तै बलियो र खिया नलाग्ने टाइटानियम" },
      { word: "LITHIUM", clueEn: "Lightweight battery element powering modern smartphones", clueNe: "स्मार्टफोन ब्याट्रीमा प्रयोग हुने लिथियम" },
      { word: "ZINC", clueEn: "Trace dietary mineral supporting immune cell defense", clueNe: "रोग प्रतिरोधात्मक क्षमता बढाउने जिंक" },
      { word: "GOLD", clueEn: "Precious noble metal untarnished by air or water", clueNe: "सबैभन्दा बहुमूल्य पहेँलो सुन धातु" },
      { word: "SILVER", clueEn: "Highest electrical conductor among all metals", clueNe: "चाँदी धातु" },
      { word: "PHOSPHORUS", clueEn: "Non-metal element essential for DNA and bone energy", clueNe: "डिएनए र कोष ऊर्जाको लागि चाहिने फस्फोरस" },
      { word: "SULFUR", clueEn: "Yellow volcanic element with pungent odor", clueNe: "गन्धक (सल्फर)" },
      { word: "NEON", clueEn: "Noble gas glowing vibrant orange in billboard signs", clueNe: "चम्किला साइनबोर्डहरूमा बल्ने नियन ग्यास" },
      { word: "PLATINUM", clueEn: "Dense catalytic precious metal rarer than gold", clueNe: "बहुमूल्य सेतो धातु प्लेटिनम" },
      { word: "IODINE", clueEn: "Halogen nutrient preventing goiter in thyroid", clueNe: "गलगाँड हुन नदिने आयोडिन तत्व" },
    ],
  },
  wildlife_nature: {
    id: "wildlife_nature",
    titleEn: "Himalayan Wildlife",
    titleNe: "वन्यजन्तु र चराचुरुङ्गी",
    icon: "🐾",
    mysteryWord: {
      word: "FAUNA",
      clueEn: "The animals of a particular region or geological period",
      clueNe: "कुनै खास क्षेत्र वा प्रकृतिका पशुपन्छीहरू",
    },
    words: [
      { word: "SNOWLEOPARD", clueEn: "Mysterious apex predator of high Himalayan crags", clueNe: "हिमालयको 'हिउँ चितुवा' (Ghost of the Mountains)" },
      { word: "REDPANDA", clueEn: "Rusty arboreal mammal eating bamboo in Langtang", clueNe: "लाङटाङ र ताप्लेजुङको दुर्लभ रातो हाब्रे" },
      { word: "YAK", clueEn: "High-altitude shaggy ox adapted to oxygen-thin peaks", clueNe: "हिमाली भेगको चौंरीगाई (याक)" },
      { word: "TIGER", clueEn: "Majestic Royal Bengal predator roaming Bardia", clueNe: "बर्दिया र चितवनको शाही पाटे बाघ" },
      { word: "GHARIAL", clueEn: "Fish-eating long-snouted crocodile of Narayani", clueNe: "नदीमा माछा खाने सङ्कटापन्न घडियाल गोही" },
      { word: "MONAL", clueEn: "Rainbow-crested pheasant national bird of Nepal", clueNe: "रङ्गीचङ्गी प्वाँख भएको डाँफे (मुनाल)" },
      { word: "MUSKDEER", clueEn: "Solitary high-altitude forest deer possessing tusks", clueNe: "अमूल्य बिना उत्पादन गर्ने कस्तुरी मृग" },
      { word: "DOLPHIN", clueEn: "Rare Gangetic freshwater mammal swimming in Karnali", clueNe: "कर्णाली नदीमा पाइने दुर्लभ सोँस (डल्फिन)" },
      { word: "PANGOLIN", clueEn: "Endangered scaly mammal feeding on termites", clueNe: "कमिला खाने सङ्कटापन्न सालक" },
      { word: "HORNBILL", clueEn: "Great canopy bird possessing enormous curved beak", clueNe: "चितवनको ठूलो चुच्चो भएको धनेश चरा" },
      { word: "VULTURE", clueEn: "Crucial scavenger raptor maintaining clean ecosystems", clueNe: "प्रकृतिको सफाइकर्मी गिद्ध" },
      { word: "ELEPHANT", clueEn: "Intelligent mega-herbivore migrating across Tarai", clueNe: "तराईका जङ्गलमा बथानमा हिँड्ने जङ्गली हात्ती" },
      { word: "LEOPARD", clueEn: "Stealthy spotted feline living in temperate mid-hills", clueNe: "पहाडी जङ्गलको चतुर चितुवा" },
      { word: "PEACOCK", clueEn: "Magnificent bird displaying iridescent eye-spotted tail", clueNe: "सुन्दर प्वाँख फैलाएर नाच्ने मयूर" },
      { word: "LANGUR", clueEn: "Grey long-tailed monkey leaping among forest crowns", clueNe: "सेतो अनुहार र लामो पुच्छर भएको लङ्गुर बाँदर" },
      { word: "SAMBAR", clueEn: "Largest native deer species found in South Asia", clueNe: "ठूलो प्रजातिको जरायो मृग" },
      { word: "CHITAL", clueEn: "Spotted deer grazing in herds across Chitwan plains", clueNe: "चित्तल (चितुवा मृग)" },
      { word: "BOAR", clueEn: "Tusked wild swine roaming sub-tropical jungle undergrowth", clueNe: "जङ्गली बँदेल" },
      { word: "OTTER", clueEn: "Sleek semi-aquatic carnivore diving in clear river streams", clueNe: "नदी र खोलामा पौडिने ओत" },
      { word: "MACAW", clueEn: "Vibrant tropical parrot known for vocal intelligence", clueNe: "रङ्गीन सुगा प्रजाति" },
      { word: "FALCON", clueEn: "High-speed bird of prey diving at over 300 km/h", clueNe: "तीव्र गतिमा उड्ने सिकारी बाज" },
      { word: "EAGLE", clueEn: "Keen-eyed raptor soaring over mountain cliffs", clueNe: "आकाशमा उचाइमा उड्ने चील" },
      { word: "BADGER", clueEn: "Nocturnal burrowing creature equipped with digging claws", clueNe: "दुलो खन्ने जीव बिजु" },
      { word: "GORAL", clueEn: "Small agile goat-antelope leaping across rocky slopes", clueNe: "भिरपहरामा उफ्रिने घोरल" },
      { word: "SEROW", clueEn: "Shy dark goat-antelope inhabiting deep Himalayan gorges", clueNe: "हिमाली थार" },
    ],
  },
  body_health: {
    id: "body_health",
    titleEn: "Human Anatomy & Body",
    titleNe: "मानव शरीर र स्वास्थ्य",
    icon: "🫀",
    mysteryWord: {
      word: "PULSE",
      clueEn: "The rhythmic throbbing of arteries as blood is propelled",
      clueNe: "मुटुको धड्कनसँगै धमनीमा चल्ने नाडीको गति",
    },
    words: [
      { word: "HEART", clueEn: "Muscular pump circulating lifeblood through body", clueNe: "शरीरभरि रगत पम्प गर्ने संवेदनशील अङ्ग मुटु" },
      { word: "BRAIN", clueEn: "Supreme command center of nervous system & thinking", clueNe: "सोच्ने र नियन्त्रण गर्ने प्रमुख अङ्ग मस्तिष्क" },
      { word: "LUNGS", clueEn: "Spongy respiratory organs exchanging gas in chest", clueNe: "अक्सिजन लिने र कार्बनडाइअक्साइड फाल्ने फोक्सो" },
      { word: "KIDNEY", clueEn: "Bean-shaped filtration organ purifying liquid waste", clueNe: "रगतबाट फोहोर पानी छान्ने दुई मिर्गौला" },
      { word: "STOMACH", clueEn: "Digestive sack breaking down food with acidic juices", clueNe: "खाना मथ्ने र पचाउने आमाशय (पेट)" },
      { word: "NEURON", clueEn: "Excitable nerve cell firing electrochemical signals", clueNe: "सूचना प्रवाह गर्ने सूक्ष्म स्नायु कोष (न्युरोन)" },
      { word: "LIVER", clueEn: "Largest internal detoxifying metabolic chemical factory", clueNe: "विषाक्त तत्व सफा गर्ने शरीरको ठूलो ग्रन्थी कलेजो" },
      { word: "SKIN", clueEn: "Vast outer integumentary barrier protecting organs", clueNe: "शरीरलाई बाहिरी चोटबाट जोगाउने छाला" },
      { word: "ARTERY", clueEn: "High-pressure vessel carrying oxygenated blood away", clueNe: "मुटुबाट शुद्ध रगत शरीरभरि लैजाने धमनी" },
      { word: "VEIN", clueEn: "Valved vessel carrying deoxygenated blood back to heart", clueNe: "अशुद्ध रगत मुटुमा फिर्ता ल्याउने शिरा" },
      { word: "SKELETON", clueEn: "Supportive framework consisting of 206 rigid bones", clueNe: "शरीरलाई आकार दिने २०६ हाडको अस्थिपञ्जर" },
      { word: "MUSCLE", clueEn: "Contractile tissue creating all bodily movements", clueNe: "शरीर हल्लाउन र हिँड्न मद्दत गर्ने मांशपेसी" },
      { word: "THYROID", clueEn: "Butterfly-shaped neck gland regulating metabolism", clueNe: "घाँटीमा रहेको थाइराइड ग्रन्थी" },
      { word: "PANCREAS", clueEn: "Dual-function gland manufacturing essential insulin", clueNe: "रगतमा चिनीको मात्रा सन्तुलन गर्ने प्यान्क्रियाज" },
      { word: "RETINA", clueEn: "Light-sensitive tissue lining inner back of eyeball", clueNe: "आँखाभित्र तस्वीर बनाउने पर्दा (रेटिना)" },
      { word: "CORNEA", clueEn: "Transparent dome covering front of human eye", clueNe: "आँखाको अगाडिको पारदर्शी भाग कोर्निया" },
      { word: "SPINE", clueEn: "Column of vertebrae shielding the delicate spinal cord", clueNe: "ढाडको मेरुदण्ड" },
      { word: "FEMUR", clueEn: "Longest, heaviest, strongest bone found in thigh", clueNe: "मानव शरीरको सबैभन्दा लामो हाड तिघ्राको फिमर" },
      { word: "PLASMA", clueEn: "Pale yellow fluid carrying blood cells & nutrients", clueNe: "रगतको तरल पहेँलो भाग प्लाज्मा" },
      { word: "PLATELET", clueEn: "Microscopic cell fragment enabling blood clot healing", clueNe: "रगत जम्न मद्दत गर्ने प्लेटलेट्स" },
      { word: "IMMUNITY", clueEn: "Biological defense shield fighting microbial infections", clueNe: "रोगसँग लड्ने प्रतिरोधात्मक शक्ति" },
      { word: "ENZYME", clueEn: "Protein catalyst speeding up biochemical reactions", clueNe: "रासायनिक प्रक्रिया छिटो बनाउने इन्जाइम" },
      { word: "HORMONES", clueEn: "Chemical messengers traveling in bloodstream", clueNe: "शरीरका प्रणाली नियन्त्रण गर्ने हर्मोन" },
      { word: "COCHLEA", clueEn: "Spiral snail-shaped inner ear cavity converting sound", clueNe: "कानभित्र आवाज सुन्ने शङ्खाकार भाग" },
      { word: "TRACHEA", clueEn: "Rigid windpipe connecting voice box with bronchial tubes", clueNe: "श्वासनली" },
    ],
  },
  nepal_geography: {
    id: "nepal_geography",
    titleEn: "Nepal Geography & Rivers",
    titleNe: "नेपाल भूगोल र नदीनाला",
    icon: "🗺️",
    mysteryWord: {
      word: "HIMAL",
      clueEn: "The high snowy mountains forming Nepal northern wall",
      clueNe: "नेपालको उत्तरी सिमानामा ठडिएका सेता हिमालहरू",
    },
    words: [
      { word: "KARNALI", clueEn: "Longest perennial river draining western Nepal", clueNe: "नेपालको सबैभन्दा लामो नदी कर्णाली" },
      { word: "KOSHI", clueEn: "Mighty eastern river system with seven tributaries", clueNe: "सबैभन्दा धेरै पानीको बहाव भएको सप्तकोशी नदी" },
      { word: "GANDAKI", clueEn: "Central holy river system cutting deep gorge", clueNe: "कालीगण्डकी, त्रिशूली आदि मिलेर बनेको गण्डकी नदी" },
      { word: "TILICHO", clueEn: "High-altitude glacial lake situated at 4,919 meters", clueNe: "विश्वकै अग्लो स्थानमा रहेको तिलिचो ताल" },
      { word: "RARA", clueEn: "Largest pristine natural freshwater lake in Mugu", clueNe: "मुगु जिल्लामा रहेको नेपालको सबैभन्दा ठूलो रारा ताल" },
      { word: "CHITWAN", clueEn: "Subtropical inner Terai home to first National Park", clueNe: "चितवन उपत्यका र राष्ट्रिय निकुञ्ज" },
      { word: "ANNAPURNA", clueEn: "Famed Himalayan massif attracting global trekkers", clueNe: "विश्वप्रसिद्ध अन्नपूर्ण हिमाल र पदमार्ग" },
      { word: "PHOKSUNDO", clueEn: "Deep alpine turquoise lake in remote Dolpa district", clueNe: "डोल्पाको निलो शे-फोक्सुन्डो ताल" },
      { word: "DOLPA", clueEn: "Largest geographic district of Nepal by land area", clueNe: "क्षेत्रफलको हिसाबले नेपालको सबैभन्दा ठूलो जिल्ला डोल्पा" },
      { word: "MANANG", clueEn: "Trans-Himalayan rain-shadow district on Annapurna loop", clueNe: "हिमाल पारिको मनाङ जिल्ला" },
      { word: "TERAI", clueEn: "Fertile southern lowland plains feeding the nation", clueNe: "नेपालको अन्नको भण्डार मानिने तराई क्षेत्र" },
      { word: "TRISHULI", clueEn: "Popular whitewater rafting river flowing to Narayani", clueNe: "जलयात्रा (र्याफ्टिङ) को लागि प्रसिद्ध त्रिशूली नदी" },
      { word: "KALIGANDAKI", clueEn: "River that carved deepest canyon in the world", clueNe: "विश्वकै गहिरो गल्छी बनाउने कालीगण्डकी" },
      { word: "PHEWA", clueEn: "Famous Pokhara lake with Tal Barahi on an island", clueNe: "बिचमा तालबाराही मन्दिर रहेको पोखराको फेवाताल" },
      { word: "BEGNAS", clueEn: "Tranquil freshwater lake nestled in eastern Pokhara", clueNe: "पोखराको शान्त बेगनास ताल" },
      { word: "RUPA", clueEn: "Twin sister lake of Begnas surrounded by green ridges", clueNe: "कास्कीको रुपा ताल" },
      { word: "BHOJPUR", clueEn: "Eastern hill district famed for authentic Khukuri blades", clueNe: "खुकुरीको लागि प्रख्यात भोजपुर जिल्ला" },
      { word: "DARCHULA", clueEn: "Far-western frontier district bordering India & China", clueNe: "सुदूरपश्चिमको सीमावर्ती जिल्ला दार्चुला" },
      { word: "SOLUKHUMBU", clueEn: "Everest district homeland of legendary Sherpa climbers", clueNe: "सगरमाथा अवस्थित सोलुखुम्बु जिल्ला" },
      { word: "ILAM", clueEn: "Eastern paradise known for rolling organic tea hills", clueNe: "चिया र अलैँचीको जिल्ला इलाम" },
      { word: "MUSTANG", clueEn: "Arid desert-like district famous for apples and caves", clueNe: "स्याउ र मुक्तिनाथको जिल्ला मुस्ताङ" },
      { word: "MAHAKALI", clueEn: "Border river defining the western frontier of Nepal", clueNe: "नेपालको पश्चिमी सिमानाको महाकाली नदी" },
      { word: "BHERI", clueEn: "Important tributary feeding the lower Karnali system", clueNe: "भेरी नदी" },
      { word: "MECHI", clueEn: "Eastern river defining the border with India", clueNe: "नेपालको पूर्वी सिमानाको मेची नदी" },
      { word: "TAPLEJUNG", clueEn: "Far-eastern district housing Kanchenjunga peak", clueNe: "कञ्चनजङ्घा हिमाल रहेको ताप्लेजुङ" },
    ],
  },
  nepali_culture: {
    id: "nepali_culture",
    titleEn: "Festivals & Nepali Culture",
    titleNe: "चाडपर्व र मौलिक कला",
    icon: "🪕",
    mysteryWord: {
      word: "PEACE",
      clueEn: "The core universal harmony championed by Lord Buddha",
      clueNe: "गौतम बुद्धले विश्वलाई दिएको शान्तिको अमर सन्देश",
    },
    words: [
      { word: "DASHAIN", clueEn: "Grandest autumn festival with Jamara, Tika & swings", clueNe: "नेपालीहरूको सबैभन्दा ठूलो चाड बडादसैँ" },
      { word: "TIHAR", clueEn: "Five-day festival of lights, flowers, and Bhai Tika", clueNe: "दीपावली, यमपञ्चक तथा दिदीबहिनी र दाजुभाइको तिहार" },
      { word: "CHHATH", clueEn: "Sun-worship thanksgiving festival celebrated on river banks", clueNe: "सूर्यदेव र छठीमाताको उपासना गर्ने छठ पर्व" },
      { word: "LOSHAR", clueEn: "New year celebrated by Tamang, Sherpa & Gurung communities", clueNe: "हिमाली तथा बौद्ध समुदायको नयाँ वर्ष ल्होसार" },
      { word: "KHUKURI", clueEn: "Inimitable curved steel knife emblem of bravery", clueNe: "नेपाली वीरताको प्रतीक परम्परागत हतियार खुकुरी" },
      { word: "MADAL", clueEn: "Wooden hand drum with dual heads producing folk rhythms", clueNe: "नेपाली मौलिक लोकबाजा मादल" },
      { word: "SARANGI", clueEn: "Folk bowed string instrument played by Gaine minstrels", clueNe: "गाइने दाइहरूले बजाउने तारबाजा सारङ्गी" },
      { word: "SELROTI", clueEn: "Traditional crispy ring-shaped fried sweet rice bread", clueNe: "दसैँ-तिहारमा पकाइने मौलिक परिकार सेलरोटी" },
      { word: "DHAKA", clueEn: "Hand-woven geometric textile used for national Topi caps", clueNe: "नेपाली टोपी र चोलो बनाइने मौलिक ढाका कपडा" },
      { word: "CHAUTARI", clueEn: "Raised stone terrace around banyan tree offering hill shade", clueNe: "वर र पीपलको छहारी भएको शीतल चौतारी" },
      { word: "HOLI", clueEn: "Jubilant spring festival splashing colored powder & water", clueNe: "रङ र खुसीको पर्व फागुपूर्णिमा (होली)" },
      { word: "MAGHE", clueEn: "Winter solstice festival celebrating sesame, yams & ghee", clueNe: "तरुल, तिलको लड्डु र घिउ खाइने माघे सङ्क्रान्ति" },
      { word: "TEEJ", clueEn: "Monsoon festival where women dress in red and dance", clueNe: "दिदीबहिनीहरू रातो सारीमा नाच्ने हरितालिका तीज" },
      { word: "GAAI", clueEn: "Historic procession festival honoring departed ancestors", clueNe: "काठमाडौँ उपत्यकाको प्रसिद्ध गाईजात्रा" },
      { word: "INDRAJATRA", clueEn: "Grand Kathmandu street festival pulling wooden chariots", clueNe: "जीवित देवी कुमारी र इन्द्रको रथयात्रा इन्द्रजात्रा" },
      { word: "GUNDRUK", clueEn: "Fermented leafy vegetable cherished as national dish", clueNe: "नेपाली मौलिक स्वादको गुन्द्रुक" },
      { word: "MOMO", clueEn: "Steamed meat or vegetable dumplings with spicy chutney", clueNe: "नेपालको सबैभन्दा लोकप्रिय खाजा म:म:" },
      { word: "DHIDO", clueEn: "Traditional hot buckwheat or millet flour porridge meal", clueNe: "फापर वा कोदोको तातो ढिँडो" },
      { word: "PANCHEBAJA", clueEn: "Set of five traditional musical instruments for weddings", clueNe: "शुभकार्य र विवाहमा बजाइने पञ्चेबाजा" },
      { word: "RODI", clueEn: "Gurung traditional communal youth social singing club", clueNe: "गुरुङ समुदायको मौलिक रोधीघर" },
      { word: "DEUDA", clueEn: "Circular traditional call-and-response folk dance of west", clueNe: "सुदूरपश्चिमको प्रसिद्ध लोकनृत्य देउडा" },
      { word: "MARUNI", clueEn: "Ancient eastern folk dance performed during festivals", clueNe: "मौलिक लोकनृत्य मारुनी" },
      { word: "YOMARI", clueEn: "Steamed sweet rice dumpling filled with Chaku & sesame", clueNe: "नेवार समुदायको विशेष चाडमा खाइने योमरी" },
      { word: "CHURA", clueEn: "Colorful glass bangles worn by women during festivals", clueNe: "हातमा लगाइने रङ्गीचङ्गी काँचको चुरा" },
      { word: "POTEY", clueEn: "Beaded glass necklace worn by married Nepali women", clueNe: "गलामा लगाइने तिलहरी र पोते" },
    ],
  },
  tech_computing: {
    id: "tech_computing",
    titleEn: "Technology & Computing",
    titleNe: "प्रविधि र कम्प्युटर",
    icon: "💻",
    mysteryWord: {
      word: "CYBER",
      clueEn: "Relating to computers, networks, and virtual reality",
      clueNe: "कम्प्युटर, इन्टरनेट र डिजिटल संसारसँग सम्बन्धित",
    },
    words: [
      { word: "ALGORITHM", clueEn: "Step-by-step mathematical logic for solving computational problems", clueNe: "समस्या समाधान गर्ने चरणबद्ध कम्प्युटर विधि (एल्गोरिदम)" },
      { word: "DATABASE", clueEn: "Organized digital storehouse of queryable structured data", clueNe: "व्यवस्थित रूपमा तथ्याङ्क भण्डारण गर्ने डाटाबेस" },
      { word: "NETWORK", clueEn: "Interconnected cluster of nodes and communication pathways", clueNe: "कम्प्युटरहरू एकआपसमा जोडिने सञ्जाल (नेटवर्क)" },
      { word: "SECURITY", clueEn: "Safeguards protecting systems from cyber intruders", clueNe: "डिजिटल प्रणाली सुरक्षित राख्ने साइबर सुरक्षा" },
      { word: "ROBOTICS", clueEn: "Branch of engineering creating automated electromechanical agents", clueNe: "रोबोट निर्माण र सञ्चालन गर्ने प्रविधि" },
      { word: "HARDWARE", clueEn: "Physical electronic components making up computer", clueNe: "कम्प्युटरका देख्न र छुन सकिने भौतिक पाटपुर्जा" },
      { word: "SOFTWARE", clueEn: "Written program code guiding computer operations", clueNe: "कम्प्युटर चलाउने प्रोग्राम र एप्स (सफ्टवेयर)" },
      { word: "INTERNET", clueEn: "Vast planetary network routing information worldwide", clueNe: "विश्वभरका सूचना आदानप्रदान गर्ने महासञ्जाल इन्टरनेट" },
      { word: "PROCESSOR", clueEn: "Central silicon chip computing millions of instructions", clueNe: "कम्प्युटरको दिमाग मानिने मुख्य सिपिउ चिप" },
      { word: "MEMORY", clueEn: "High-speed volatile RAM storing immediate CPU instructions", clueNe: "कम्प्युटरको कार्य सञ्चालन गर्ने अस्थायी र्‍याम मेमोरी" },
      { word: "CIRCUIT", clueEn: "Complete path through which electrical current flows", clueNe: "विद्युत् प्रवाह हुने विद्युतीय परिपथ (सर्किट)" },
      { word: "CODING", clueEn: "Drafting instructions in human-readable programming languages", clueNe: "कम्प्युटरलाई निर्देशन दिने कोडिङ भाषा" },
      { word: "QUANTUM", clueEn: "Computing paradigm leveraging subatomic superposition qubits", clueNe: "उन्नत क्वान्टम कम्प्युटिङ प्रविधि" },
      { word: "SATELLITE", clueEn: "Artificial craft orbiting Earth relaying communications", clueNe: "अन्तरिक्षमा घुमेर सञ्चार सेवा दिने भू-उपग्रह" },
      { word: "BROWSER", clueEn: "Software application displaying HTML web documents", clueNe: "इन्टरनेट वेबसाइटहरू खोल्ने वेब ब्राउजर" },
      { word: "SERVER", clueEn: "High-uptime computer delivering resources across network", clueNe: "डाटा र वेबसाइट सञ्चालन गर्ने मुख्य सर्भर" },
      { word: "FIREWALL", clueEn: "Digital defensive barrier filtering malicious incoming traffic", clueNe: "अनधिकृत पहुँच रोक्ने सुरक्षा पर्खाल फायरवाल" },
      { word: "SENSOR", clueEn: "Device detecting physical stimuli like heat, light, and motion", clueNe: "वातावरणको परिवर्तन महसुस गर्ने सेन्सर" },
      { word: "CLOUD", clueEn: "Remote network of servers providing on-demand compute & storage", clueNe: "इन्टरनेटमार्फत डाटा सुरक्षित राख्ने क्लाउड प्रविधि" },
      { word: "BINARY", clueEn: "Base-2 numeral code consisting purely of zeros and ones", clueNe: "कम्प्युटरले बुझ्ने ० र १ को बाइनरी कोड" },
    ],
  },
};

/**
 * Helper to retrieve all category metadata cards
 */
export function getAllWordSearchCategories() {
  return Object.values(WORD_SEARCH_DATA).map((cat) => ({
    id: cat.id,
    titleEn: cat.titleEn,
    titleNe: cat.titleNe,
    icon: cat.icon,
    wordCount: cat.words.length,
    mysteryWord: cat.mysteryWord.word,
  }));
}

/**
 * Returns a sampled batch of words for a given category & difficulty.
 * Guaranteed to sample randomly using modern unbiased Fisher-Yates shuffle.
 */
export function sampleCategoryWords(
  categoryId: string,
  count: number = 7,
  difficulty: "easy" | "medium" | "hard" = "medium"
): { selectedWords: WordEntry[]; mysteryWord: WordEntry } {
  const category = WORD_SEARCH_DATA[categoryId] || WORD_SEARCH_DATA["nepal_heritage"];
  
  // Max word length filter depending on grid dimension
  const maxLen = difficulty === "easy" ? 8 : difficulty === "medium" ? 10 : 12;
  const filtered = category.words.filter(
    (w) => w.word.length >= 3 && w.word.length <= maxLen
  );

  const pool = filtered.length >= count ? filtered : category.words;
  const shuffled = [...pool];

  // Cryptographically inspired Fisher-Yates shuffle
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const selectedWords = shuffled.slice(0, count);

  return {
    selectedWords,
    mysteryWord: {
      word: category.mysteryWord.word,
      clueEn: category.mysteryWord.clueEn,
      clueNe: category.mysteryWord.clueNe,
    },
  };
}
