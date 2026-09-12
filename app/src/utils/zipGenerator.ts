/**
 * Zip Path Puzzle Generator (Authentic to LinkedIn's Zip Game)
 * Generates guaranteed solvable Hamiltonian grid paths across 4x4, 5x5, and 6x6 boards.
 */

export interface ZipCell {
  row: number;
  col: number;
}

export interface ZipPuzzle {
  id: string;
  size: number; // 4, 5, or 6
  difficulty: "easy" | "medium" | "hard";
  totalCells: number;
  checkpoints: Record<string, number>; // "r-c" -> checkpoint number (1, 2, 3...)
  maxCheckpoint: number;
  solutionPath: ZipCell[]; // sequential path of all cells
}

/** Check if two cells are orthogonally adjacent */
export function areAdjacent(a: ZipCell, b: ZipCell): boolean {
  const dr = Math.abs(a.row - b.row);
  const dc = Math.abs(a.col - b.col);
  return (dr === 1 && dc === 0) || (dr === 0 && dc === 1);
}

/** Key string helper: "row-col" */
export function cellKey(r: number, c: number): string {
  return `${r}-${c}`;
}

export function parseKey(key: string): ZipCell {
  const [r, c] = key.split("-").map(Number);
  return { row: r, col: c };
}

/**
 * Generates a full Hamiltonian path on an N x N grid using randomized backtracking with Warnsdorff's heuristic.
 */
function generateHamiltonianPath(size: number, seed?: number): ZipCell[] {
  const total = size * size;
  const visited: boolean[][] = Array.from({ length: size }, () =>
    Array(size).fill(false)
  );

  const neighbors = (r: number, c: number): ZipCell[] => {
    const list: ZipCell[] = [];
    const deltas = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ];
    for (const [dr, dc] of deltas) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size && !visited[nr][nc]) {
        list.push({ row: nr, col: nc });
      }
    }
    return list;
  };

  // Pseudo-random helper for deterministic daily seeds
  let rngVal = seed ? Math.abs(seed) : Date.now();
  const rng = () => {
    rngVal = (rngVal * 9301 + 49297) % 233280;
    return rngVal / 233280;
  };

  const path: ZipCell[] = [];

  function backtrack(r: number, c: number): boolean {
    visited[r][c] = true;
    path.push({ row: r, col: c });

    if (path.length === total) {
      return true;
    }

    // Get unvisited neighbors and sort by Warnsdorff heuristic (fewest unvisited neighbors first)
    const nbrs = neighbors(r, c);
    nbrs.sort((a, b) => {
      const degA = neighbors(a.row, a.col).length;
      const degB = neighbors(b.row, b.col).length;
      if (degA !== degB) return degA - degB;
      return rng() - 0.5;
    });

    for (const next of nbrs) {
      if (backtrack(next.row, next.col)) {
        return true;
      }
    }

    visited[r][c] = false;
    path.pop();
    return false;
  }

  // Attempt starting from corners or perimeter for aesthetic snakes
  const startCandidates = [
    { row: 0, col: 0 },
    { row: 0, col: size - 1 },
    { row: size - 1, col: 0 },
    { row: size - 1, col: size - 1 },
  ];
  const start = startCandidates[Math.floor(rng() * startCandidates.length)];

  if (backtrack(start.row, start.col)) {
    return path;
  }

  // Fallback fallback: standard boustrophedon (snake) path if deep search hits recursion limit
  const snakePath: ZipCell[] = [];
  for (let r = 0; r < size; r++) {
    if (r % 2 === 0) {
      for (let c = 0; c < size; c++) snakePath.push({ row: r, col: c });
    } else {
      for (let c = size - 1; c >= 0; c--) snakePath.push({ row: r, col: c });
    }
  }
  return snakePath;
}

/**
 * Builds a Zip puzzle from a Hamiltonian path by extracting numbered anchor checkpoints.
 */
export function createZipPuzzle(
  size: 4 | 5 | 6 = 4,
  difficulty: "easy" | "medium" | "hard" = "easy",
  seed?: number
): ZipPuzzle {
  const path = generateHamiltonianPath(size, seed);
  const total = size * size;

  // Number of checkpoints based on size & difficulty
  // 4x4 -> 4-5 checkpoints (e.g. 1, 5, 9, 13, 16)
  // 5x5 -> 5-6 checkpoints
  // 6x6 -> 6-7 checkpoints
  const numCheckpoints = size === 4 ? 4 : size === 5 ? 5 : 6;
  const step = Math.floor((total - 1) / (numCheckpoints - 1));

  const checkpoints: Record<string, number> = {};
  let currentCheckpointNum = 1;

  // Start cell is always checkpoint 1
  const startKey = cellKey(path[0].row, path[0].col);
  checkpoints[startKey] = 1;

  // Intermediate checkpoints
  for (let i = 1; i < numCheckpoints - 1; i++) {
    const pathIdx = i * step;
    const cell = path[pathIdx];
    currentCheckpointNum++;
    checkpoints[cellKey(cell.row, cell.col)] = currentCheckpointNum;
  }

  // Final cell is always the highest checkpoint
  const endCell = path[path.length - 1];
  currentCheckpointNum++;
  checkpoints[cellKey(endCell.row, endCell.col)] = currentCheckpointNum;

  return {
    id: `zip-${size}x${size}-${seed || Date.now()}`,
    size,
    difficulty,
    totalCells: total,
    checkpoints,
    maxCheckpoint: currentCheckpointNum,
    solutionPath: path,
  };
}

/**
 * Validates player's current path against game rules:
 * 1. Adjacent steps only.
 * 2. No cell visited twice.
 * 3. Checkpoints must be reached in order 1, 2, 3...
 */
export function validatePlayerMove(
  currentPath: ZipCell[],
  nextCell: ZipCell,
  checkpoints: Record<string, number>,
  nextExpectedCheckpoint: number
): { valid: boolean; isCheckpoint: boolean; checkpointNumber?: number; reason?: string } {
  // If path is empty, must start at checkpoint 1
  if (currentPath.length === 0) {
    const cp = checkpoints[cellKey(nextCell.row, nextCell.col)];
    if (cp === 1) {
      return { valid: true, isCheckpoint: true, checkpointNumber: 1 };
    }
    return { valid: false, isCheckpoint: false, reason: "Must start at checkpoint 1" };
  }

  const last = currentPath[currentPath.length - 1];

  // Must be adjacent
  if (!areAdjacent(last, nextCell)) {
    return { valid: false, isCheckpoint: false, reason: "Cells must be adjacent" };
  }

  // Must not already be in path
  const alreadyVisited = currentPath.some(
    (c) => c.row === nextCell.row && c.col === nextCell.col
  );
  if (alreadyVisited) {
    return { valid: false, isCheckpoint: false, reason: "Cell already visited" };
  }

  // If this cell is a checkpoint, check if it matches next expected checkpoint
  const cp = checkpoints[cellKey(nextCell.row, nextCell.col)];
  if (cp !== undefined) {
    if (cp !== nextExpectedCheckpoint) {
      return {
        valid: false,
        isCheckpoint: true,
        checkpointNumber: cp,
        reason: `Follow checkpoints in order: reach ${nextExpectedCheckpoint} before ${cp}`,
      };
    }
    return { valid: true, isCheckpoint: true, checkpointNumber: cp };
  }

  return { valid: true, isCheckpoint: false };
}

/**
/**
 * Curated Daily Challenge Puzzles (deterministic for each day of year)
 */
export function getDailyZipPuzzle(dateStr?: string): ZipPuzzle {
  const now = dateStr ? new Date(dateStr + "T00:00:00Z") : new Date();
  const epoch = new Date("2026-01-01T00:00:00Z");
  const dayNum = Math.max(1, Math.floor((now.getTime() - epoch.getTime()) / 86400000) + 1);
  const dayOfWeek = now.getUTCDay();
  // Mon/Wed/Fri: 4x4 (Easy), Tue/Thu/Sat: 5x5 (Focus), Sun: 6x6 (Master)
  const size = dayOfWeek === 0 ? 6 : [1, 3, 5].includes(dayOfWeek) ? 4 : 5;
  const difficulty = size === 4 ? "easy" : size === 5 ? "medium" : "hard";
  const puzzle = createZipPuzzle(size, difficulty, (dayNum * 2654435761) >>> 0);
  return {
    ...puzzle,
    id: `daily-${dateStr || now.toISOString().slice(0, 10)}`,
  };
}

/**
 * Generates a viral emoji share grid (Wordle / LinkedIn style).
 */
export function generateZipShareText(params: {
  puzzleNum: number;
  size: number;
  seconds: number;
  moves: number;
  stars: number;
  rank?: number;
  totalSolvers?: number;
  lang?: string;
}): string {
  const { puzzleNum, size, seconds, moves, stars, rank, totalSolvers } = params;
  const starEmojis = "⭐".repeat(Math.max(1, stars));
  let gridEmoji = "";
  for (let r = 0; r < size; r++) {
    gridEmoji += "🟩".repeat(size) + "\n";
  }

  const rankText = rank ? ` | 🏆 Rank #${rank}${totalSolvers ? ` of ${totalSolvers}` : ""}` : "";
  return `⚡ QuizQuest Daily Zip #${puzzleNum}\n⏱ ${seconds}s | 🎯 ${size * size}/${size * size} Cells | ${starEmojis}${rankText}\n\n${gridEmoji}Can you beat my time? Challenge me on QuizQuest!`;
}


