/**
 * Word Search Grid Generator and Helpers
 * Supports seeded (daily) and randomized (free play) puzzle grids,
 * dynamic difficulty tiers, and Secret Mystery Words (रहस्यमय शब्द).
 */

export interface PlacedWord {
  word: string;
  clueEn: string;
  clueNe: string;
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
  cells: { row: number; col: number }[];
  color: string;
  glowColor?: string;
  isMystery?: boolean;
}

export interface WordSearchPuzzle {
  grid: string[][];
  size: number;
  placedWords: PlacedWord[];
  mysteryWord?: PlacedWord | null;
  difficulty: "easy" | "medium" | "hard";
}

export const WORD_COLORS = [
  "#10B981", // Emerald
  "#3B82F6", // Electric Blue
  "#EC4899", // Neon Pink
  "#8B5CF6", // Royal Purple
  "#F59E0B", // Vivid Amber
  "#06B6D4", // Cyan
  "#F43F5E", // Rose Red
  "#14B8A6", // Teal
  "#A855F7", // Purple Iris
  "#F97316", // Warm Orange
  "#6366F1", // Indigo
  "#E11D48", // Crimson
];

export const MYSTERY_COLOR = "#FFD700"; // Golden Glow for Mystery Word

// Seeded PRNG (Mulberry32)
function createRng(seedStr?: string) {
  if (!seedStr) {
    return Math.random;
  }
  let h = 0;
  for (let i = 0; i < seedStr.length; i++) {
    h = (Math.imul(31, h) + seedStr.charCodeAt(i)) | 0;
  }
  let a = h >>> 0;
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Direction definitions by difficulty
const EASY_DIRECTIONS = [
  { dr: 0, dc: 1 },  // Left to Right
  { dr: 1, dc: 0 },  // Top to Bottom
];

const MEDIUM_DIRECTIONS = [
  { dr: 0, dc: 1 },  // Left to Right
  { dr: 1, dc: 0 },  // Top to Bottom
  { dr: 1, dc: 1 },  // Diagonal Down-Right
  { dr: -1, dc: 1 }, // Diagonal Up-Right
];

const HARD_DIRECTIONS = [
  { dr: 0, dc: 1 },   // Left to Right
  { dr: 1, dc: 0 },   // Top to Bottom
  { dr: 1, dc: 1 },   // Diagonal Down-Right
  { dr: -1, dc: 1 },  // Diagonal Up-Right
  { dr: 0, dc: -1 },  // Right to Left (Reverse Horizontal)
  { dr: -1, dc: 0 },  // Bottom to Top (Reverse Vertical)
  { dr: 1, dc: -1 },  // Diagonal Down-Left
  { dr: -1, dc: -1 }, // Diagonal Up-Left
];

export function generateWordSearchPuzzle(
  words: { word: string; clueEn: string; clueNe: string }[],
  size: number = 10,
  seed?: string,
  difficulty: "easy" | "medium" | "hard" = "medium",
  mysteryInput?: { word: string; clueEn: string; clueNe: string }
): WordSearchPuzzle {
  const rng = createRng(seed);

  // Initialize empty grid
  const grid: (string | null)[][] = Array.from({ length: size }, () =>
    Array(size).fill(null)
  );

  const placedWords: PlacedWord[] = [];

  // Determine allowed directions by difficulty tier
  const allowedDirs =
    difficulty === "easy"
      ? EASY_DIRECTIONS
      : difficulty === "hard"
      ? HARD_DIRECTIONS
      : MEDIUM_DIRECTIONS;

  // Enforce minimum word length by difficulty: Easy: min 4, Medium: min 5, Hard: min 6
  const minLen = difficulty === "hard" ? 6 : difficulty === "medium" ? 5 : 4;
  const sanitizedWords = [...words]
    .map((w) => ({ ...w, word: w.word.toUpperCase().replace(/[^A-Z]/g, "") }))
    .filter((w) => w.word.length >= minLen && w.word.length <= size)
    .sort((a, b) => b.word.length - a.word.length);

  function tryPlaceWord(
    item: { word: string; clueEn: string; clueNe: string },
    color: string,
    isMystery: boolean = false
  ): PlacedWord | null {
    const word = item.word;
    const dirs = [...allowedDirs].sort(() => rng() - 0.5);

    for (let attempt = 0; attempt < 180; attempt++) {
      const dir = dirs[Math.floor(rng() * dirs.length)];

      const minRow = dir.dr < 0 ? word.length - 1 : 0;
      const maxRow = dir.dr > 0 ? size - word.length : size - 1;
      const minCol = dir.dc < 0 ? word.length - 1 : 0;
      const maxCol = dir.dc > 0 ? size - word.length : size - 1;

      if (maxRow < minRow || maxCol < minCol) continue;

      const r = minRow + Math.floor(rng() * (maxRow - minRow + 1));
      const c = minCol + Math.floor(rng() * (maxCol - minCol + 1));

      // Check if word fits without conflicting with occupied letters
      let fits = true;
      const cells: { row: number; col: number }[] = [];

      for (let chIdx = 0; chIdx < word.length; chIdx++) {
        const currR = r + chIdx * dir.dr;
        const currC = c + chIdx * dir.dc;
        const existing = grid[currR][currC];
        if (existing !== null && existing !== word[chIdx]) {
          fits = false;
          break;
        }
        cells.push({ row: currR, col: currC });
      }

      if (fits) {
        for (let chIdx = 0; chIdx < word.length; chIdx++) {
          const currR = r + chIdx * dir.dr;
          const currC = c + chIdx * dir.dc;
          grid[currR][currC] = word[chIdx];
        }

        return {
          word,
          clueEn: item.clueEn,
          clueNe: item.clueNe,
          startRow: r,
          startCol: c,
          endRow: r + (word.length - 1) * dir.dr,
          endCol: c + (word.length - 1) * dir.dc,
          cells,
          color,
          isMystery,
        };
      }
    }
    return null;
  }

  // 1. Place standard target words
  for (let i = 0; i < sanitizedWords.length; i++) {
    const item = sanitizedWords[i];
    const color = WORD_COLORS[placedWords.length % WORD_COLORS.length];
    const placed = tryPlaceWord(item, color, false);
    if (placed) {
      placedWords.push(placed);
    }
  }

  // 2. Place secret mystery word in remaining space if provided
  let placedMystery: PlacedWord | null = null;
  if (mysteryInput) {
    const cleanMystery = {
      ...mysteryInput,
      word: mysteryInput.word.toUpperCase().replace(/[^A-Z]/g, ""),
    };
    if (cleanMystery.word.length >= 2 && cleanMystery.word.length <= size) {
      placedMystery = tryPlaceWord(cleanMystery, MYSTERY_COLOR, true);
    }
  }

  // 3. Fill remaining null cells with adversarial letter distribution
  // On hard/medium: heavily weight letters from placed target words to create deceptive red-herrings
  const targetLetters: string[] = [];
  placedWords.forEach((pw) => {
    // Extra weight for prefix letters (creates false word starts)
    for (let k = 0; k < Math.min(3, pw.word.length); k++) {
      targetLetters.push(pw.word[k], pw.word[k]);
    }
    for (let k = 0; k < pw.word.length; k++) {
      targetLetters.push(pw.word[k]);
    }
  });

  const COMMON_LETTERS = "AAAAAABBBCCCDDDEEEEEEEFFGGHHIIIIIIJKLLLLMMNNNNNOOOOOOPPQRRRRRSSSSSTTTTTTUUUUVWWXYZ";
  const adversarialBias = difficulty === "hard" ? 0.65 : difficulty === "medium" ? 0.45 : 0.15;

  const finalGrid: string[][] = grid.map((row) =>
    row.map((cell) => {
      if (cell !== null) return cell;
      if (targetLetters.length > 0 && rng() < adversarialBias) {
        return targetLetters[Math.floor(rng() * targetLetters.length)];
      }
      return COMMON_LETTERS[Math.floor(rng() * COMMON_LETTERS.length)];
    })
  );

  return {
    grid: finalGrid,
    size,
    placedWords,
    mysteryWord: placedMystery,
    difficulty,
  };
}

/**
 * Calculates straight line cells from start cell to target cell.
 * Restricts to Horizontal, Vertical, and 45° Diagonal lines.
 */
export function getStraightLineCells(
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number
): { row: number; col: number }[] {
  const dRow = endRow - startRow;
  const dCol = endCol - startCol;

  if (dRow === 0 && dCol === 0) {
    return [{ row: startRow, col: startCol }];
  }

  const absRow = Math.abs(dRow);
  const absCol = Math.abs(dCol);

  // Must be strictly horizontal, vertical, or diagonal
  if (absRow !== 0 && absCol !== 0 && absRow !== absCol) {
    // Project to the closest 45° axis
    if (absRow > absCol * 1.5) {
      return getStraightLineCells(startRow, startCol, endRow, startCol);
    } else if (absCol > absRow * 1.5) {
      return getStraightLineCells(startRow, startCol, startRow, endCol);
    } else {
      const signRow = dRow > 0 ? 1 : -1;
      const signCol = dCol > 0 ? 1 : -1;
      const minStep = Math.min(absRow, absCol);
      return getStraightLineCells(startRow, startCol, startRow + signRow * minStep, startCol + signCol * minStep);
    }
  }

  const stepRow = dRow === 0 ? 0 : dRow > 0 ? 1 : -1;
  const stepCol = dCol === 0 ? 0 : dCol > 0 ? 1 : -1;
  const length = Math.max(absRow, absCol);

  const cells: { row: number; col: number }[] = [];
  for (let i = 0; i <= length; i++) {
    cells.push({
      row: startRow + i * stepRow,
      col: startCol + i * stepCol,
    });
  }

  return cells;
}
