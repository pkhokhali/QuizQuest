import db from "../src/db.js";

const COUNTRIES = ["uk", "nepal", "india", "usa", "japan", "china", "australia", "global"];
const CLASSES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

console.log("\n=======================================================");
console.log("QuizQuest Question Volume & Distribution Verification");
console.log("=======================================================");

const total = db.prepare("SELECT count(*) as c FROM questions").get().c;
console.log(`Total Questions in Database: ${total.toLocaleString()}`);

console.log("\n--- Breakdown by Country ---");
for (const c of COUNTRIES) {
  const count = db.prepare("SELECT count(*) as c FROM questions WHERE country = ?").get(c).c;
  console.log(`  ${c.toUpperCase().padEnd(14)}: ${count.toLocaleString()} questions`);
}

console.log("\n--- Breakdown by Class / Learning Tier ---");
for (const g of CLASSES) {
  const label = g === 13 ? "Lifelong Learner (🧠 Class 13)" : `Class ${g}`;
  const count = db.prepare("SELECT count(*) as c FROM questions WHERE grade = ?").get(g).c;
  console.log(`  ${label.padEnd(30)}: ${count.toLocaleString()} questions`);
}

console.log("=======================================================\n");
