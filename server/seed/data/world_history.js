// World History Timeline and Major Global Events

export const WORLD_HISTORY_EVENTS = [
  // Ancient & Classical Era
  { event: "Construction of the Great Pyramid of Giza", year: "c. 2560 BCE", era: "Ancient Egypt", significance: "Oldest of the Seven Wonders of the Ancient World" },
  { event: "Code of Hammurabi established", year: "c. 1754 BCE", era: "Babylon", significance: "One of the earliest written legal codes ('an eye for an eye')" },
  { event: "Founding of the Roman Republic", year: "509 BCE", era: "Ancient Rome", significance: "Overthrow of the Roman monarchy leading to representative senate" },
  { event: "Golden Age of Athens under Pericles", year: "c. 450 BCE", era: "Ancient Greece", significance: "Development of democracy, philosophy, and classical arts" },
  { event: "Alexander the Great conquers Persian Empire", year: "331 BCE", era: "Hellenistic", significance: "Spread of Greek culture across Mediterranean and Asia" },
  { event: "Emperor Ashoka converts to Buddhism after Kalinga War", year: "c. 261 BCE", era: "Maurya Empire", significance: "Spread of non-violence, rock edicts, and Buddhist philosophy" },
  { event: "Qin Shi Huang unifies China and begins Great Wall", year: "221 BCE", era: "Imperial China", significance: "First Emperor of China, terracotta army, centralized state" },
  { event: "Julius Caesar assassinated on the Ides of March", year: "44 BCE", era: "Roman Republic", significance: "End of Roman Republic and transition to Roman Empire under Augustus" },
  { event: "Fall of the Western Roman Empire", year: "476 CE", era: "Late Antiquity", significance: "Deposition of Romulus Augustulus marking start of the Middle Ages" },

  // Medieval & Renaissance
  { event: "Prophet Muhammad establishes Islam and the Hijra", year: "622 CE", era: "Islamic History", significance: "Start of Islamic calendar and rapid spread of Islamic civilization" },
  { event: "Charlemagne crowned Holy Roman Emperor", year: "800 CE", era: "Medieval Europe", significance: "First recognized emperor in western Europe since fall of Rome" },
  { event: "Battle of Hastings & Norman Conquest of England", year: "1066 CE", era: "Medieval Britain", significance: "William the Conqueror defeats King Harold II" },
  { event: "Signing of the Magna Carta", year: "1215 CE", era: "Medieval Britain", significance: "English barons force King John to accept limits on royal power" },
  { event: "Genghis Khan establishes the Mongol Empire", year: "1206 CE", era: "Mongol Empire", significance: "Creation of largest contiguous land empire in history" },
  { event: "The Black Death sweeps Europe and Asia", year: "1347-1351 CE", era: "Late Middle Ages", significance: "Pandemic killing estimated 30-60% of European population" },
  { event: "Fall of Constantinople to Ottoman Empire", year: "1453 CE", era: "Ottoman Empire", significance: "Sultan Mehmed II captures Byzantine capital, opening trade routes" },
  { event: "Johannes Gutenberg invents movable type printing press", year: "c. 1440 CE", era: "Renaissance", significance: "Revolutionized mass distribution of books and knowledge" },
  { event: "Christopher Columbus arrives in the Americas", year: "1492 CE", era: "Age of Discovery", significance: "Initiated permanent transatlantic contact and the Columbian Exchange" },
  { event: "Vasco da Gama discovers direct sea route to India", year: "1498 CE", era: "Age of Discovery", significance: "Portuguese fleet sails around Cape of Good Hope to Calicut" },
  { event: "Martin Luther posts 95 Theses sparking Protestant Reformation", year: "1517 CE", era: "Early Modern Europe", significance: "Challenged Roman Catholic Church authority, reshaping Europe" },

  // Enlightenment & Revolutions
  { event: "Publication of Isaac Newton's Principia Mathematica", year: "1687 CE", era: "Scientific Revolution", significance: "Formulated three laws of motion and universal gravitation" },
  { event: "American Declaration of Independence", year: "1776 CE", era: "American Revolution", significance: "Thirteen American colonies declare separation from Great Britain" },
  { event: "Storming of the Bastille & Start of French Revolution", year: "1789 CE", era: "French Revolution", significance: "Overthrow of absolute monarchy under slogan 'Liberty, Equality, Fraternity'" },
  { event: "James Watt patents steam engine condensor", year: "1769 CE", era: "Industrial Revolution", significance: "Catalyzed shift from manual labor to mechanized industry" },
  { event: "Battle of Waterloo ends Napoleon's reign", year: "1815 CE", era: "Napoleonic Era", significance: "British and Prussian forces defeat Napoleon Bonaparte in Belgium" },
  { event: "American Civil War ends and slavery abolished", year: "1865 CE", era: "US History", significance: "13th Amendment abolishes slavery following Union victory under Lincoln" },

  // 20th Century & Modern Era
  { event: "Outbreak of World War I", year: "1914 CE", era: "World War I", significance: "Triggered by assassination of Archduke Franz Ferdinand in Sarajevo" },
  { event: "Russian Revolution overthrows the Tsarist regime", year: "1917 CE", era: "Russian History", significance: "Vladimir Lenin and Bolsheviks establish first communist state (USSR)" },
  { event: "End of World War I with Treaty of Versailles", year: "1918-1919 CE", era: "Interwar Period", significance: "Armistice on Nov 11; establishment of League of Nations" },
  { event: "Outbreak of World War II with invasion of Poland", year: "1939 CE", era: "World War II", significance: "Nazi Germany invades Poland, leading Britain and France to declare war" },
  { event: "Attack on Pearl Harbor brings USA into World War II", year: "1941 CE", era: "World War II", significance: "Japanese surprise air attack on US naval base in Hawaii" },
  { event: "D-Day Allied Invasion of Normandy", year: "1944 CE", era: "World War II", significance: "Operation Overlord opens Western Front against Nazi forces" },
  { event: "Founding of the United Nations (UN)", year: "1945 CE", era: "Post-War Era", significance: "51 founding countries sign UN Charter in San Francisco for world peace" },
  { event: "India and Pakistan gain independence from British rule", year: "1947 CE", era: "Decolonization", significance: "Partition of British India ending almost 200 years of colonial rule" },
  { event: "Adoption of the Universal Declaration of Human Rights", year: "1948 CE", era: "Human Rights", significance: "UN General Assembly proclaims universal fundamental human protections" },
  { event: "Yuri Gagarin becomes the first human in outer space", year: "1961 CE", era: "Space Race", significance: "Soviet cosmonaut orbits Earth aboard Vostok 1" },
  { event: "Apollo 11 lands Neil Armstrong and Buzz Aldrin on the Moon", year: "1969 CE", era: "Space Exploration", significance: "'One small step for man, one giant leap for mankind'" },
  { event: "Fall of the Berlin Wall", year: "1989 CE", era: "Cold War", significance: "Symbolic end of the Cold War leading to German reunification in 1990" },
  { event: "Dissolution of the Soviet Union (USSR)", year: "1991 CE", era: "Modern History", significance: "End of the Cold War and independence for 15 former Soviet republics" },
  { event: "Nelson Mandela elected President of democratic South Africa", year: "1994 CE", era: "Post-Apartheid", significance: "First multi-racial democratic election following end of Apartheid" },
  { event: "Tim Berners-Lee invents the World Wide Web", year: "1989-1991 CE", era: "Digital Age", significance: "Public release of WWW protocols connecting computers globally" },
];

export const NEPAL_HISTORY_EVENTS = [
  { event: "Unification of Nepal begins under King Prithvi Narayan Shah", year: "1768 CE", significance: "King of Gorkha conquers Kathmandu Valley creating modern Nepal" },
  { event: "Anglo-Nepal War (Gurkha War)", year: "1814-1816 CE", significance: "War between Kingdom of Gorkha and British East India Company" },
  { event: "Treaty of Sugauli signed", year: "1816 CE", significance: "Demarcated border of Nepal with British India (Mechi to Mahakali)" },
  { event: "Kot Massacre and rise of Jung Bahadur Rana", year: "1846 CE", significance: "Jung Bahadur Rana becomes Prime Minister, starting 104-year Rana oligarchy" },
  { event: "Muluki Ain promulgated by Jung Bahadur Rana", year: "1854 CE", significance: "First unified legal civil code of Nepal" },
  { event: "Fall of Rana Regime and Dawn of Democracy (Prajatantra)", year: "1951 CE (2007 BS)", significance: "King Tribhuvan and Nepali Congress movement restore democracy" },
  { event: "Nepal joins the United Nations", year: "1955 CE (2012 BS)", significance: "Nepal officially admitted as a member state of the UN" },
  { event: "First General Elections of Nepal held", year: "1959 CE (2015 BS)", significance: "BP Koirala elected first democratically elected Prime Minister" },
  { event: "King Mahendra establishes Panchayat System", year: "1960 CE (2017 BS)", significance: "Partyless Panchayat political system introduced" },
  { event: "Restoration of Multiparty Democracy (Jana Andolan I)", year: "1990 CE (2046 BS)", significance: "Mass movement leads to constitutional monarchy and multiparty system" },
  { event: "Comprehensive Peace Accord (CPA) signed", year: "2006 CE (2063 BS)", significance: "Ended decade-long Maoist conflict, leading to Constituent Assembly" },
  { event: "Nepal declared a Federal Democratic Republic", year: "2008 CE (2065 BS)", significance: "First meeting of Constituent Assembly abolishes 240-year monarchy" },
  { event: "Promulgation of the Constitution of Nepal by Constituent Assembly", year: "2015 CE (2072 BS)", significance: "First constitution drafted by directly elected representatives, creating 7 provinces" },
];
