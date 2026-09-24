// Expanded Science Generator (Chemistry, Physics, Biology, Earth & Space)
import { PERIODIC_TABLE } from "../data/periodic_table.js";
import { shuffle } from "../../src/util.js";

function distractors(pool, correct, n = 3) {
  const filtered = pool.filter((p) => p !== correct && p != null && p !== "");
  const shuffled = shuffle([...new Set(filtered)]);
  return shuffled.slice(0, n);
}

function assemble({ textEn, textNe, correctEn, distractorsEn, correctNe, distractorsNe, country, subject = "science", gradeBand, difficulty = 3, topic, source }) {
  const order = shuffle([0, 1, 2, 3]);
  const en = [correctEn, ...distractorsEn];
  const hasNe = textNe && correctNe && distractorsNe && distractorsNe.every((d) => d != null) && distractorsNe.length === 3;
  const neArr = hasNe ? [correctNe, ...distractorsNe] : null;

  return {
    textEn,
    textNe: hasNe ? textNe : null,
    optionsEn: order.map((i) => String(en[i])),
    optionsNe: neArr ? order.map((i) => String(neArr[i])) : null,
    correctIndex: order.indexOf(0),
    country: country || "global",
    subject,
    gradeBand,
    difficulty,
    topic,
    source: source || "generator:science_expanded",
  };
}

export function generateScienceExpanded() {
  const out = [];

  const allSymbols = PERIODIC_TABLE.map((e) => e.sym);
  const allNames = PERIODIC_TABLE.map((e) => e.name);
  const allNumbers = PERIODIC_TABLE.map((e) => String(e.num));
  const allCategories = [...new Set(PERIODIC_TABLE.map((e) => e.cat))];

  // 1. Chemistry: Periodic Table (Symbol, Atomic Number, Category)
  for (const el of PERIODIC_TABLE) {
    // What is the chemical symbol of [Element]?
    for (const band of ["6-8", "9-10"]) {
      out.push(assemble({
        textEn: `What is the chemical symbol for the element ${el.name}?`,
        correctEn: el.sym,
        distractorsEn: distractors(allSymbols, el.sym),
        gradeBand: band,
        difficulty: el.num <= 20 ? 2 : 3,
        topic: "periodic-table",
        source: "generator:science:symbols",
      }));
    }

    // What element has atomic number [N]?
    for (const band of ["9-10", "11-12"]) {
      out.push(assemble({
        textEn: `Which chemical element has the atomic number ${el.num}?`,
        correctEn: el.name,
        distractorsEn: distractors(allNames, el.name),
        gradeBand: band,
        difficulty: el.num <= 20 ? 2 : 4,
        topic: "atomic-numbers",
        source: "generator:science:atomic_numbers",
      }));
    }

    // Chemical family / category
    for (const band of ["9-10", "11-12"]) {
      out.push(assemble({
        textEn: `To which chemical group or family does ${el.name} (${el.sym}) belong?`,
        correctEn: el.cat,
        distractorsEn: distractors(allCategories, el.cat),
        gradeBand: band,
        difficulty: 3,
        topic: "element-families",
        source: "generator:science:categories",
      }));
    }
  }

  // 2. Physics: SI Units and Formulas
  const PHYSICS_UNITS = [
    { quantity: "Force", unit: "Newton (N)", base: "kg·m/s²" },
    { quantity: "Energy or Work", unit: "Joule (J)", base: "N·m" },
    { quantity: "Power", unit: "Watt (W)", base: "J/s" },
    { quantity: "Electrical Resistance", unit: "Ohm (Ω)", base: "V/A" },
    { quantity: "Electric Current", unit: "Ampere (A)", base: "Coulomb/s" },
    { quantity: "Electric Potential Difference", unit: "Volt (V)", base: "W/A" },
    { quantity: "Pressure", unit: "Pascal (Pa)", base: "N/m²" },
    { quantity: "Frequency", unit: "Hertz (Hz)", base: "1/s" },
    { quantity: "Electric Charge", unit: "Coulomb (C)", base: "A·s" },
    { quantity: "Magnetic Field (Flux Density)", unit: "Tesla (T)", base: "Wb/m²" },
    { quantity: "Capacitance", unit: "Farad (F)", base: "C/V" },
    { quantity: "Luminous Intensity", unit: "Candela (cd)", base: "base SI" },
  ];

  const allUnits = PHYSICS_UNITS.map((u) => u.unit);

  for (const item of PHYSICS_UNITS) {
    for (const band of ["6-8", "9-10", "11-12"]) {
      out.push(assemble({
        textEn: `What is the SI standard unit of measurement for ${item.quantity}?`,
        correctEn: item.unit,
        distractorsEn: distractors(allUnits, item.unit),
        gradeBand: band,
        difficulty: band === "6-8" ? 2 : 3,
        topic: "si-units",
        source: "generator:science:si_units",
      }));
    }
  }

  // 3. Biology: Cell Organelles and Functions
  const ORGANELLES = [
    { name: "Mitochondria", function: "Powerhouse of the cell, generates ATP through cellular respiration" },
    { name: "Chloroplast", function: "Conducts photosynthesis using chlorophyll to produce glucose in plants" },
    { name: "Nucleus", function: "Houses the cellular genetic material (DNA) and controls cell activities" },
    { name: "Ribosome", function: "Synthesizes proteins from amino acid sequences encoded in RNA" },
    { name: "Endoplasmic Reticulum", function: "Network folding, modifying, and transporting proteins and synthesized lipids" },
    { name: "Golgi Apparatus", function: "Packages and distributes proteins and macromolecules to destinations" },
    { name: "Lysosome", function: "Contains digestive enzymes breaking down cellular waste and foreign invaders" },
    { name: "Cell Membrane", function: "Semi-permeable lipid bilayer regulating entry and exit of substances" },
    { name: "Vacuole", function: "Stores water, nutrients, and waste, maintaining turgor pressure in plant cells" },
  ];

  for (const org of ORGANELLES) {
    for (const band of ["6-8", "9-10", "11-12"]) {
      out.push(assemble({
        textEn: `Which cell organelle is responsible for: "${org.function}"?`,
        correctEn: org.name,
        distractorsEn: distractors(ORGANELLES.map((x) => x.name), org.name),
        gradeBand: band,
        difficulty: 3,
        topic: "cell-biology",
        source: "generator:science:organelles",
      }));
    }
  }

  // 4. Earth Science: Atmospheric Layers & Rock Cycles
  const ATMOSPHERE = [
    { layer: "Troposphere", fact: "Lowest layer containing 75% of atmosphere mass where weather occurs" },
    { layer: "Stratosphere", fact: "Contains the protective Ozone Layer that absorbs harmful solar UV rays" },
    { layer: "Mesosphere", fact: "Coldest atmospheric layer where most meteors burn up upon entry" },
    { layer: "Thermosphere", fact: "Extremely high temperature layer containing the ionosphere and Northern Lights" },
    { layer: "Exosphere", fact: "Outermost layer gradually merging with vacuum of interplanetary space" },
  ];

  for (const at of ATMOSPHERE) {
    for (const band of ["4-5", "6-8", "9-10"]) {
      out.push(assemble({
        textEn: `Which atmospheric layer of Earth is described as: "${at.fact}"?`,
        correctEn: at.layer,
        distractorsEn: distractors(ATMOSPHERE.map((x) => x.layer), at.layer),
        gradeBand: band,
        difficulty: 2,
        topic: "earth-atmosphere",
        source: "generator:science:atmosphere",
      }));
    }
  }

  return out;
}
