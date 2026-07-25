// English vocabulary tables. Distractors are drawn from other rows at generation time.

export const SYNONYMS = [
  ["happy", "joyful"], ["big", "huge"], ["small", "tiny"], ["fast", "quick"], ["smart", "clever"],
  ["angry", "furious"], ["brave", "courageous"], ["begin", "start"], ["end", "finish"], ["easy", "simple"],
  ["hard", "difficult"], ["rich", "wealthy"], ["silent", "quiet"], ["beautiful", "pretty"], ["strange", "odd"],
  ["afraid", "scared"], ["tired", "exhausted"], ["famous", "well-known"], ["correct", "right"], ["ancient", "old"],
  ["help", "assist"], ["build", "construct"], ["destroy", "demolish"], ["choose", "select"], ["reply", "answer"],
  ["enough", "sufficient"], ["error", "mistake"], ["gift", "present"], ["idea", "thought"], ["journey", "trip"],
  ["laugh", "giggle"], ["look", "watch"], ["neat", "tidy"], ["odd", "unusual"], ["polite", "courteous"],
  ["real", "genuine"], ["sad", "unhappy"], ["shout", "yell"], ["thin", "slim"], ["value", "worth"],
];

export const ANTONYMS = [
  ["hot", "cold"], ["big", "small"], ["fast", "slow"], ["happy", "sad"], ["day", "night"],
  ["up", "down"], ["light", "dark"], ["hard", "soft"], ["open", "closed"], ["full", "empty"],
  ["rich", "poor"], ["strong", "weak"], ["young", "old"], ["clean", "dirty"], ["early", "late"],
  ["far", "near"], ["heavy", "light"], ["high", "low"], ["long", "short"], ["loud", "quiet"],
  ["brave", "cowardly"], ["accept", "reject"], ["arrive", "depart"], ["attack", "defend"], ["begin", "end"],
  ["borrow", "lend"], ["buy", "sell"], ["cheap", "expensive"], ["deep", "shallow"], ["easy", "difficult"],
  ["expand", "shrink"], ["forget", "remember"], ["friend", "enemy"], ["give", "take"], ["increase", "decrease"],
  ["inside", "outside"], ["laugh", "cry"], ["love", "hate"], ["victory", "defeat"], ["win", "lose"],
];

export const PLURALS = [
  ["child", "children"], ["man", "men"], ["woman", "women"], ["foot", "feet"], ["tooth", "teeth"],
  ["mouse", "mice"], ["goose", "geese"], ["person", "people"], ["ox", "oxen"], ["leaf", "leaves"],
  ["knife", "knives"], ["wife", "wives"], ["life", "lives"], ["wolf", "wolves"], ["shelf", "shelves"],
  ["baby", "babies"], ["city", "cities"], ["story", "stories"], ["box", "boxes"], ["bus", "buses"],
  ["watch", "watches"], ["dish", "dishes"], ["hero", "heroes"], ["potato", "potatoes"], ["tomato", "tomatoes"],
  ["deer", "deer"], ["sheep", "sheep"], ["fish", "fish"], ["cactus", "cacti"], ["datum", "data"],
];

// Nepali vocabulary: [word, meaningNe(correct), distractors x3] — for the Nepali subject.
export const NEPALI_VOCAB = [
  ["सूर्य", "घाम", ["जून", "तारा", "बादल"]],
  ["चन्द्रमा", "जून", ["घाम", "तारा", "आकाश"]],
  ["पुस्तक", "किताब", ["कापी", "कलम", "झोला"]],
  ["विद्यालय", "स्कुल", ["घर", "बजार", "मन्दिर"]],
  ["आमा", "जननी", ["दिदी", "बहिनी", "फुपू"]],
  ["पानी", "जल", ["दूध", "तेल", "मह"]],
  ["हावा", "वायु", ["पानी", "आगो", "माटो"]],
  ["आगो", "अग्नि", ["जल", "वायु", "पृथ्वी"]],
  ["साथी", "मित्र", ["शत्रु", "छिमेकी", "पाहुना"]],
  ["घर", "गृह", ["वन", "बाटो", "खेत"]],
  ["फूल", "पुष्प", ["पात", "हाँगा", "जरा"]],
  ["रात", "रात्रि", ["दिन", "बिहान", "साँझ"]],
  ["वन", "जंगल", ["खेत", "बगैंचा", "चौर"]],
  ["नदी", "खोला", ["ताल", "समुद्र", "पोखरी"]],
  ["हिमाल", "पर्वत", ["पहाड", "तराई", "उपत्यका"]],
];
