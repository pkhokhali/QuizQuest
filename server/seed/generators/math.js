// Parameterized math question templates. Each template yields bilingual MCQs with
// plausible distractors. Volume scales with the `scale` factor (QUESTION_SCALE env).

import { shuffle } from "../../src/util.js";

const NE_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
const ne = (n) => String(n).replace(/\d/g, (d) => NE_DIGITS[Number(d)]);
const ri = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
const pick = (arr) => arr[ri(0, arr.length - 1)];
const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));

/** Build 4 options (1 correct + 3 distinct numeric distractors), shuffled. */
function numericOptions(correct, spreadFns) {
  const opts = new Set([correct]);
  let guard = 0;
  while (opts.size < 4 && guard++ < 60) {
    const d = pick(spreadFns)(correct);
    if (d !== correct && d >= 0 && Number.isFinite(d)) opts.add(d);
  }
  let extra = correct + opts.size;
  while (opts.size < 4) opts.add(extra++);
  const arr = shuffle([...opts]);
  return { options: arr, correctIndex: arr.indexOf(correct) };
}

function shuffleTextOptions(optionsEn, optionsNe, correctIndex) {
  const order = shuffle([0, 1, 2, 3]);
  return {
    optionsEn: order.map((i) => optionsEn[i]),
    optionsNe: optionsNe ? order.map((i) => optionsNe[i]) : optionsNe,
    correctIndex: order.indexOf(correctIndex),
  };
}

const NEAR = [(c) => c + 1, (c) => c - 1, (c) => c + 2, (c) => c - 2, (c) => c + 10, (c) => c - 10];

function q(textEn, textNe, correct, spread, band, difficulty, topic) {
  const { options, correctIndex } = numericOptions(correct, spread);
  return {
    textEn,
    textNe,
    optionsEn: options.map(String),
    optionsNe: options.map((o) => ne(o)),
    correctIndex,
    subject: "math",
    gradeBand: band,
    difficulty,
    topic,
    source: `generator:math-${topic}`,
  };
}

const T = [];

// --- Grades 1-3 ---
T.push({
  band: "1-3", count: 4000, gen() {
    const styles = [
      () => { const a = ri(1, 50), b = ri(1, 50); return q(`What is ${a} + ${b}?`, `${ne(a)} + ${ne(b)} कति हुन्छ?`, a + b, NEAR, "1-3", a + b > 60 ? 2 : 1, "addition"); },
      () => { const a = ri(5, 99), b = ri(1, a); return q(`What is ${a} - ${b}?`, `${ne(a)} - ${ne(b)} कति हुन्छ?`, a - b, NEAR, "1-3", a > 50 ? 2 : 1, "subtraction"); },
      () => { const a = ri(2, 9), b = ri(2, 9); return q(`What is ${a} × ${b}?`, `${ne(a)} × ${ne(b)} कति हुन्छ?`, a * b, [...NEAR, (c) => c + a, (c) => c - b], "1-3", 2, "multiplication"); },
      () => { const a = ri(1, 8), b = ri(1, 9); return q(`Sita has ${a} apples. Her friend gives her ${b} more. How many apples does she have now?`, `सीतासँग ${ne(a)} वटा स्याउ छन्। साथीले ${ne(b)} वटा थपिदिइन्। अब उनीसँग कति स्याउ छन्?`, a + b, NEAR, "1-3", 2, "word-problem"); },
      () => { const nums = [ri(1, 99), ri(1, 99), ri(1, 99)]; const c = Math.max(...nums); return q(`Which is the biggest: ${nums.join(", ")}?`, `सबैभन्दा ठूलो कुन हो: ${nums.map(ne).join(", ")}?`, c, [() => nums[0], () => nums[1], () => nums[2], (x) => x - 1], "1-3", 1, "comparison"); },
    ];
    return pick(styles)();
  },
});

// --- Grades 4-5 ---
T.push({
  band: "4-5", count: 5000, gen() {
    const styles = [
      () => { const a = ri(12, 99), b = ri(2, 12); return q(`What is ${a} × ${b}?`, `${ne(a)} × ${ne(b)} कति हुन्छ?`, a * b, [...NEAR, (c) => c + b, (c) => c + 100], "4-5", 2, "multiplication"); },
      () => { const b = ri(2, 12), c = ri(3, 25), a = b * c; return q(`What is ${a} ÷ ${b}?`, `${ne(a)} ÷ ${ne(b)} कति हुन्छ?`, c, NEAR, "4-5", 2, "division"); },
      () => { const d = pick([4, 5, 8, 10]), n1 = ri(1, d - 2), n2 = ri(1, d - n1 - 1); return q(`What is ${n1}/${d} + ${n2}/${d}? (answer as numerator over ${d})`, `${ne(n1)}/${ne(d)} + ${ne(n2)}/${ne(d)} को अंश (हर ${ne(d)}) कति हुन्छ?`, n1 + n2, NEAR, "4-5", 3, "fractions"); },
      () => { const a = ri(100, 999), b = ri(100, 999); return q(`What is ${a} + ${b}?`, `${ne(a)} + ${ne(b)} कति हुन्छ?`, a + b, [...NEAR, (c) => c + 100, (c) => c - 100], "4-5", 2, "addition"); },
      () => { const m = ri(2, 9); const seq = [m, m * 2, m * 3, m * 4]; return q(`What comes next: ${seq.join(", ")}, ...?`, `अब के आउँछ: ${seq.map(ne).join(", ")}, ...?`, m * 5, [...NEAR, (c) => c + m], "4-5", 2, "patterns"); },
      () => { const s = ri(3, 20); return q(`What is the perimeter of a square with side ${s} cm? (in cm)`, `${ne(s)} से.मि. भुजा भएको वर्गको परिमिति कति से.मि. हुन्छ?`, 4 * s, [...NEAR, (c) => c / 2, (c) => s * s], "4-5", 3, "geometry"); },
    ];
    return pick(styles)();
  },
});

// --- Grades 6-8 ---
T.push({
  band: "6-8", count: 6000, gen() {
    const styles = [
      () => {
        const p = ri(1, 99);
        const n = ri(10, 999);
        const ans = (p * n) / 100;
        return Number.isInteger(ans) ? q(`What is ${p}% of ${n}?`, `${ne(n)} को ${ne(p)}% कति हुन्छ?`, ans, [...NEAR, (c) => c * 2, (c) => c / 2], "6-8", 3, "percentage") : null;
      },
      () => { const x = ri(2, 40), a = ri(2, 12), b = ri(1, 60); return q(`If ${a}x + ${b} = ${a * x + b}, what is x?`, `यदि ${ne(a)}x + ${ne(b)} = ${ne(a * x + b)} भए x कति हुन्छ?`, x, NEAR, "6-8", 3, "algebra"); },
      () => { const a = ri(2, 25); return q(`What is ${a}² (${a} squared)?`, `${ne(a)}² (${ne(a)} को वर्ग) कति हुन्छ?`, a * a, [...NEAR, (c) => c + a, (c) => 2 * a], "6-8", 2, "squares"); },
      () => { const a = ri(2, 35); return q(`What is the square root of ${a * a}?`, `${ne(a * a)} को वर्गमूल कति हो?`, a, NEAR, "6-8", 3, "roots"); },
      () => { const l = ri(2, 99), w = ri(2, 99); return q(`What is the area of a rectangle with length ${l} cm and width ${w} cm? (in cm²)`, `लम्बाइ ${ne(l)} से.मि. र चौडाइ ${ne(w)} से.मि. भएको आयतको क्षेत्रफल कति से.मि.² हुन्छ?`, l * w, [...NEAR, (c) => 2 * (l + w)], "6-8", 3, "geometry"); },
      () => {
        const a = ri(4, 40);
        const b = ri(4, 40);
        const g = gcd(a, b);
        const l = (a * b) / g;
        return q(`What is the LCM of ${a} and ${b}?`, `${ne(a)} र ${ne(b)} को ल.स. कति हो?`, l, [...NEAR, () => g, () => a * b], "6-8", 3, "lcm-hcf");
      },
      () => {
        const a = ri(4, 48);
        const b = ri(4, 48);
        const g = gcd(a, b);
        return q(`What is the HCF of ${a} and ${b}?`, `${ne(a)} र ${ne(b)} को म.स. कति हो?`, g, [...NEAR, () => (a * b) / g, () => a + b], "6-8", 3, "lcm-hcf");
      },
      () => { const t = ri(2, 12), s = ri(5, 120); return q(`A bus travels at ${s} km/h for ${t} hours. How far does it go? (in km)`, `एउटा बस ${ne(s)} कि.मि./घण्टाको गतिमा ${ne(t)} घण्टा चल्छ। कति टाढा पुग्छ (कि.मि.)?`, s * t, [...NEAR, (c) => c + s, (c) => c - t], "6-8", 3, "speed-distance"); },
      () => {
        const nums = Array.from({ length: 4 }, () => ri(1, 99));
        const sum = nums.reduce((a, b) => a + b, 0);
        if (sum % 4 !== 0) return null;
        return q(`What is the average of ${nums.join(", ")}?`, `${nums.map(ne).join(", ")} को औसत कति हो?`, sum / 4, NEAR, "6-8", 3, "statistics");
      },
      () => { const a = ri(100, 999), b = ri(100, 999); return q(`What is ${a} + ${b}?`, `${ne(a)} + ${ne(b)} कति हुन्छ?`, a + b, [...NEAR, (c) => c + 100, (c) => c - 100], "6-8", 2, "addition"); },
      () => { const a = ri(200, 999), b = ri(50, a); return q(`What is ${a} - ${b}?`, `${ne(a)} - ${ne(b)} कति हुन्छ?`, a - b, NEAR, "6-8", 2, "subtraction"); },
      () => { const b = ri(2, 15), c = ri(3, 40), a = b * c; return q(`What is ${a} ÷ ${b}?`, `${ne(a)} ÷ ${ne(b)} कति हुन्छ?`, c, NEAR, "6-8", 2, "division"); },
      () => { const a = ri(12, 99), b = ri(2, 12); return q(`What is ${a} × ${b}?`, `${ne(a)} × ${ne(b)} कति हुन्छ?`, a * b, [...NEAR, (c) => c + b], "6-8", 2, "multiplication"); },
      () => { const s = ri(3, 25); return q(`What is the volume of a cube with edge ${s} cm? (in cm³)`, `${ne(s)} से.मि. भुजा भएको घनको आयतन कति से.मि.³ हुन्छ?`, s ** 3, [...NEAR, (c) => 6 * s * s, (c) => s * s], "6-8", 3, "geometry"); },
      () => {
        const a = ri(2, 8);
        const b = ri(2, 8);
        const c = ri(2, 8);
        return q(`What is ${a} + ${b} × ${c}? (order of operations)`, `${ne(a)} + ${ne(b)} × ${ne(c)} कति हुन्छ?`, a + b * c, [...NEAR, (c2) => (a + b) * c, (c2) => a * b + c], "6-8", 3, "order-of-ops");
      },
    ];
    return pick(styles)();
  },
});

// --- Grades 9-10 (SEE prep) ---
T.push({
  band: "9-10", count: 5000, gen() {
    const styles = [
      () => { const p = ri(2, 20) * 500, r = ri(2, 12), t = ri(1, 5); const i = (p * r * t) / 100; return Number.isInteger(i) ? q(`Find the simple interest on Rs ${p} at ${r}% per year for ${t} years. (in Rs)`, `रु ${ne(p)} को ${ne(r)}% वार्षिक ब्याजदरमा ${ne(t)} वर्षको साधारण ब्याज कति हुन्छ (रु)?`, i, [(c) => c + p / 100, (c) => c * 2, (c) => c / 2, (c) => c + 100], "9-10", 4, "simple-interest") : null; },
      () => { const a = ri(2, 9), b = ri(2, 4); return q(`What is ${a}^${b}?`, `${ne(a)}^${ne(b)} कति हुन्छ?`, a ** b, [(c) => c + a, (c) => a * b, (c) => c - a, (c) => c + 1], "9-10", 3, "exponents"); },
      () => { const r = pick([7, 14, 21]); const area = Math.round((22 / 7) * r * r); return q(`What is the area of a circle with radius ${r} cm? (π = 22/7, in cm²)`, `${ne(r)} से.मि. अर्धव्यास भएको वृत्तको क्षेत्रफल कति से.मि.² हुन्छ? (π = २२/७)`, area, [(c) => Math.round((2 * 22 * r) / 7), (c) => c + r, (c) => c - r, (c) => c + 10], "9-10", 4, "geometry"); },
      () => { const x = ri(2, 12), y = ri(1, 10); return q(`If x = ${x} and y = ${y}, what is the value of 2x + 3y?`, `यदि x = ${ne(x)} र y = ${ne(y)} भए 2x + 3y को मान कति हुन्छ?`, 2 * x + 3 * y, NEAR, "9-10", 3, "algebra"); },
      () => { const a = ri(3, 20); const c = a + ri(1, 15); const bSq = c * c - a * a; const b = Math.sqrt(bSq); return Number.isInteger(b) ? q(`In a right triangle, the hypotenuse is ${c} cm and one side is ${a} cm. Find the other side. (in cm)`, `समकोण त्रिभुजमा कर्ण ${ne(c)} से.मि. र एक भुजा ${ne(a)} से.मि. छ। अर्को भुजा कति से.मि. हुन्छ?`, b, NEAR, "9-10", 4, "pythagoras") : null; },
      () => { const marked = ri(4, 40) * 100, disc = pick([5, 10, 15, 20, 25]); const price = marked - (marked * disc) / 100; return Number.isInteger(price) ? q(`A jacket marked Rs ${marked} has a ${disc}% discount. What is the selling price? (in Rs)`, `रु ${ne(marked)} अंकित मूल्यको ज्याकेटमा ${ne(disc)}% छुट छ। बिक्री मूल्य कति हुन्छ (रु)?`, price, [(c) => marked - disc, (c) => c + 100, (c) => c - 100, (c) => (marked * disc) / 100], "9-10", 4, "percentage") : null; },
    ];
    return pick(styles)();
  },
});

// --- Grades 11-12 (NEB) ---
T.push({
  band: "11-12", count: 3500, gen() {
    const styles = [
      () => { const a = ri(1, 5), n = ri(2, 4); return q(`What is the derivative of ${a}x^${n} with respect to x, evaluated at x = 1?`, `${ne(a)}x^${ne(n)} को x का सापेक्ष अवकलजको मान x = १ मा कति हुन्छ?`, a * n, NEAR, "11-12", 4, "calculus"); },
      () => { const first = ri(1, 10), d = ri(2, 8), k = ri(5, 15); return q(`An arithmetic sequence starts at ${first} with common difference ${d}. What is the ${k}th term?`, `पहिलो पद ${ne(first)} र सार्वअन्तर ${ne(d)} भएको समान्तर श्रेणीको ${ne(k)}औं पद कति हुन्छ?`, first + (k - 1) * d, [(c) => c + d, (c) => c - d, (c) => first + k * d, (c) => c + 1], "11-12", 4, "sequences"); },
      () => { const nn = ri(4, 9); const c = nn * (nn - 1) / 2; return q(`How many ways can 2 students be chosen from ${nn} students?`, `${ne(nn)} जना विद्यार्थीबाट २ जना कति तरिकाले छान्न सकिन्छ?`, c, [(c2) => nn * nn, (c2) => nn * (nn - 1), (c2) => c2 + nn, (c2) => c2 - 1], "11-12", 4, "combinatorics"); },
      () => { const a = ri(2, 6); return q(`What is log base ${a} of ${a ** 3}?`, `${ne(a ** 3)} को आधार ${ne(a)} मा लघुगणक कति हुन्छ?`, 3, [() => a, () => a ** 3, () => 2, () => 9], "11-12", 4, "logarithms"); },
      () => {
        const deg = pick([0, 30, 90]);
        const val = { 0: 0, 30: 0.5, 90: 1 }[deg];
        const opts = ["0", "0.5", "1", "√3/2"];
        const correctIdx = opts.indexOf(String(val));
        const shuffled = shuffleTextOptions(opts, opts, correctIdx);
        return { textEn: `What is sin(${deg}°)?`, textNe: `sin(${ne(deg)}°) कति हुन्छ?`, ...shuffled, subject: "math", gradeBand: "11-12", difficulty: 4, topic: "trigonometry", source: "generator:math-trigonometry" };
      },
    ];
    return pick(styles)();
  },
});

/** Generate math questions across all bands; dedupes by question text. */
export function generateMath(scale = 1) {
  const out = [];
  const seen = new Set();
  for (const t of T) {
    const target = Math.round(t.count * scale);
    let made = 0;
    let guard = 0;
    while (made < target && guard < target * 12) {
      guard++;
      const item = t.gen();
      if (!item) continue;
      if (seen.has(item.textEn)) continue;
      seen.add(item.textEn);
      out.push(item);
      made++;
    }
  }
  return out;
}
