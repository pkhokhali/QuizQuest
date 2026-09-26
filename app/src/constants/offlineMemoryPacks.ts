import { MemoryPack } from "../api/types";

export const OFFLINE_MEMORY_PACKS: MemoryPack[] = [
  {
    id: 99101,
    titleEn: "Cosmic Solar System",
    titleNe: "सौर्यमण्डल",
    subject: "science",
    difficulty: 2,
    timeLimitSec: 60,
    pairs: [
      { id: 1, q: "Sun", a: "Center Star", emoji: "☀️" },
      { id: 2, q: "Mars", a: "Red Planet", emoji: "🔴" },
      { id: 3, q: "Jupiter", a: "Gas Giant", emoji: "🪐" },
      { id: 4, q: "Saturn", a: "Ringed World", emoji: "💫" },
      { id: 5, q: "Earth", a: "Blue Planet", emoji: "🌍" },
      { id: 6, q: "Moon", a: "Earth's Satellite", emoji: "🌕" },
    ],
  },
  {
    id: 99102,
    titleEn: "World Capitals",
    titleNe: "विश्वका राजधानीहरू",
    subject: "social",
    difficulty: 2,
    timeLimitSec: 60,
    pairs: [
      { id: 11, q: "Nepal", a: "Kathmandu", emoji: "🏔️" },
      { id: 12, q: "Japan", a: "Tokyo", emoji: "🗼" },
      { id: 13, q: "France", a: "Paris", emoji: "🥐" },
      { id: 14, q: "UK", a: "London", emoji: "🏰" },
      { id: 15, q: "USA", a: "Washington D.C.", emoji: "🗽" },
      { id: 16, q: "India", a: "New Delhi", emoji: "🛕" },
    ],
  },
  {
    id: 99103,
    titleEn: "Chemical Elements",
    titleNe: "रासायनिक तत्वहरू",
    subject: "science",
    difficulty: 3,
    timeLimitSec: 60,
    pairs: [
      { id: 21, q: "Hydrogen", a: "H", emoji: "💧" },
      { id: 22, q: "Helium", a: "He", emoji: "🎈" },
      { id: 23, q: "Gold", a: "Au", emoji: "🏆" },
      { id: 24, q: "Silver", a: "Ag", emoji: "🥈" },
      { id: 25, q: "Oxygen", a: "O", emoji: "🌬️" },
      { id: 26, q: "Iron", a: "Fe", emoji: "⚙️" },
    ],
  },
  {
    id: 99104,
    titleEn: "Animal Kingdom",
    titleNe: "प्राणी जगत",
    subject: "science",
    difficulty: 1,
    timeLimitSec: 60,
    pairs: [
      { id: 31, q: "Polar Bear", a: "Arctic Tundra", emoji: "🐻‍❄️" },
      { id: 32, q: "Camel", a: "Sandy Desert", emoji: "🐫" },
      { id: 33, q: "Kangaroo", a: "Australian Outback", emoji: "🦘" },
      { id: 34, q: "Penguin", a: "Antarctic Ice", emoji: "🐧" },
      { id: 35, q: "Tiger", a: "Dense Rainforest", emoji: "🐅" },
      { id: 36, q: "Dolphin", a: "Deep Ocean", emoji: "🐬" },
    ],
  },
];

export function getOfflineMemoryPack(): MemoryPack {
  const rnd = Math.floor(Math.random() * OFFLINE_MEMORY_PACKS.length);
  return OFFLINE_MEMORY_PACKS[rnd];
}
