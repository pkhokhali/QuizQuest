import { useNavigation } from "@react-navigation/native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  PanResponder,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Line } from "react-native-svg";
import {
  getDailyZipLeaderboard,
  getDailyZipPuzzle as getDailyZipPuzzleApi,
  nudgeDailyZipFriend,
  submitDailyZipScore,
} from "../api/client";
import { queueOfflineSubmission } from "../utils/offlineStore";
import {
  DailyZipLeaderboardResponse,
  DailyZipPuzzleResponse,
} from "../api/types";
import { Atmosphere } from "../components/Atmosphere";
import { AvatarCircle } from "../components/AvatarCircle";
import { Card } from "../components/Card";
import { ConfettiEffect } from "../components/ConfettiEffect";
import { EmojiBurst } from "../components/EmojiBurst";
import { PrimaryButton } from "../components/PrimaryButton";
import { useAuth } from "../state/AuthContext";
import { useI18n } from "../state/LanguageContext";
import { useTheme } from "../state/ThemeContext";
import { fonts, radius, shadow, spacing } from "../theme";
import { SoundEffects, useSoundEnabled } from "../utils/audio";
import {
  areAdjacent,
  cellKey,
  createZipPuzzle,
  generateZipShareText,
  getDailyZipPuzzle as getDailyZipPuzzleLocal,
  getSmartHint,
  hasWall,
  parseKey,
  wallKey,
  ZipCell,
  ZipDifficulty,
  ZipDimension,
  ZipPuzzle,
} from "../utils/zipGenerator";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_PADDING = spacing.md * 2;
const MAX_BOARD_WIDTH = Math.min(SCREEN_WIDTH - GRID_PADDING, 390);
function interpolateHexColor(c1: string, c2: string, factor: number): string {
  const r1 = parseInt(c1.slice(1, 3), 16);
  const g1 = parseInt(c1.slice(3, 5), 16);
  const b1 = parseInt(c1.slice(5, 7), 16);
  const r2 = parseInt(c2.slice(1, 3), 16);
  const g2 = parseInt(c2.slice(3, 5), 16);
  const b2 = parseInt(c2.slice(5, 7), 16);

  const r = Math.round(r1 + factor * (r2 - r1));
  const g = Math.round(g1 + factor * (g2 - g1));
  const b = Math.round(b1 + factor * (b2 - b1));

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/** Authentic LinkedIn Zip purple-to-pink-to-coral ribbon gradient */
export function getZipRibbonColor(index: number, total: number): string {
  if (total <= 1) return "#9333EA";
  const t = Math.max(0, Math.min(1, index / Math.max(1, total - 1)));
  if (t <= 0.35) {
    return interpolateHexColor("#7E22CE", "#BE185D", t / 0.35);
  } else if (t <= 0.7) {
    return interpolateHexColor("#BE185D", "#E11D48", (t - 0.35) / 0.35);
  } else {
    return interpolateHexColor("#E11D48", "#EA580C", (t - 0.7) / 0.3);
  }
}

export function ZipPlayScreen() {
  const { colors, paletteId } = useTheme();
  const { lang, t } = useI18n();
  const navigation = useNavigation();
  const { refreshUser } = useAuth();
  const { isSoundEnabled, toggleSound } = useSoundEnabled();

  // Mode: "daily" (Official synchronized daily challenge) or "practice" (Free play)
  const [gameMode, setGameMode] = useState<"daily" | "practice">("daily");
  const [size, setSize] = useState<ZipDimension>(6);
  const [practiceSize, setPracticeSize] = useState<ZipDimension>(6);
  const [practiceDifficulty, setPracticeDifficulty] = useState<ZipDifficulty>("medium");
  const [puzzle, setPuzzle] = useState<ZipPuzzle>(() => createZipPuzzle(6, "medium"));
  const [path, setPath] = useState<string[]>([]);
  const [nextExpectedCheckpoint, setNextExpectedCheckpoint] = useState<number>(2);
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [gameEnded, setGameEnded] = useState(false);
  const [hintCellKey, setHintCellKey] = useState<string | null>(null);
  const [showHowToPlay, setShowHowToPlay] = useState(true);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Daily Challenge & Social State
  const [dailyLoading, setDailyLoading] = useState(false);
  const [dailyData, setDailyData] = useState<DailyZipPuzzleResponse | null>(null);
  const [myDailyScore, setMyDailyScore] = useState<DailyZipPuzzleResponse["myScore"] | null>(null);
  const [rivalToBeat, setRivalToBeat] = useState<DailyZipPuzzleResponse["rivalToBeat"] | null>(null);
  const [officialXpAwarded, setOfficialXpAwarded] = useState<number>(0);

  // Standings & Nudge Modal
  const [showStandingsModal, setShowStandingsModal] = useState(false);
  const [standingsTab, setStandingsTab] = useState<"friends" | "school" | "global">("friends");
  const [standingsLoading, setStandingsLoading] = useState(false);
  const [standingsData, setStandingsData] = useState<DailyZipLeaderboardResponse | null>(null);
  const [nudgedFriendIds, setNudgedFriendIds] = useState<Set<number>>(new Set());

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cellSize = MAX_BOARD_WIDTH / puzzle.size.cols;
  const pipeWidth = Math.max(14, Math.round(cellSize * 0.72));
  const wallThickness = Math.max(4, Math.round(cellSize * 0.12));

  // Set of walls for O(1) barrier collision check
  const wallsSet = useMemo(() => {
    return new Set(puzzle.walls.map((w) => wallKey(w.between[0], w.between[1])));
  }, [puzzle.walls]);

  // Set of path coordinates for O(1) lookup
  const pathKeySet = useMemo(() => new Set(path), [path]);

  // Map of cellKey -> path index
  const pathIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    path.forEach((key, idx) => map.set(key, idx));
    return map;
  }, [path]);

  // Real-time gesture refs to eliminate React re-render latency during 120Hz continuous drag
  const [isDragging, setIsDragging] = useState(false);
  const pathRef = useRef<string[]>(path);
  const nextExpectedCpRef = useRef<number>(nextExpectedCheckpoint);
  const movesRef = useRef<number>(moves);
  const gameEndedRef = useRef<boolean>(gameEnded);
  const puzzleRef = useRef<ZipPuzzle>(puzzle);
  const secondsRef = useRef<number>(seconds);
  const wallsSetRef = useRef<Set<string>>(wallsSet);
  const gridLayoutRef = useRef<{ pageX: number; pageY: number; cellSize: number } | null>(null);

  useEffect(() => {
    pathRef.current = path;
  }, [path]);

  useEffect(() => {
    nextExpectedCpRef.current = nextExpectedCheckpoint;
  }, [nextExpectedCheckpoint]);

  useEffect(() => {
    movesRef.current = moves;
  }, [moves]);

  useEffect(() => {
    gameEndedRef.current = gameEnded;
  }, [gameEnded]);

  useEffect(() => {
    puzzleRef.current = puzzle;
  }, [puzzle]);

  useEffect(() => {
    secondsRef.current = seconds;
  }, [seconds]);

  useEffect(() => {
    wallsSetRef.current = wallsSet;
  }, [wallsSet]);

  const practiceSizeRef = useRef<ZipDimension>(practiceSize);
  const practiceDifficultyRef = useRef<ZipDifficulty>(practiceDifficulty);

  useEffect(() => {
    practiceSizeRef.current = practiceSize;
  }, [practiceSize]);

  useEffect(() => {
    practiceDifficultyRef.current = practiceDifficulty;
  }, [practiceDifficulty]);

  /** Initialize a practice puzzle with selectable size & difficulty and 100% fresh randomized seed */
  const initPracticeGame = useCallback(
    (newSize?: ZipDimension, newDiff?: ZipDifficulty) => {
      const s = newSize ?? practiceSizeRef.current;
      const d = newDiff ?? practiceDifficultyRef.current;
      const dynamicSeed = ((Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0);
      const p = createZipPuzzle(s, d, dynamicSeed);
      setSize(s);
      setPracticeSize(s);
      setPracticeDifficulty(d);
      setPuzzle(p);
      puzzleRef.current = p;

      const startKey = p.solution[0];
      pathRef.current = [startKey];
      nextExpectedCpRef.current = 2;
      movesRef.current = 0;
      gameEndedRef.current = false;

      setPath([startKey]);
      setNextExpectedCheckpoint(2);
      setMoves(0);
      setSeconds(0);
      setGameEnded(false);
      setHintCellKey(null);
      setOfficialXpAwarded(0);

      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    },
    []
  );

  /** Fetch daily puzzle from backend or fallback */
  const loadDailyChallenge = useCallback(async () => {
    setDailyLoading(true);
    try {
      const res = await getDailyZipPuzzleApi();
      setDailyData(res);
      setMyDailyScore(res.myScore);
      setRivalToBeat(res.rivalToBeat);

      const serverPuzzle = getDailyZipPuzzleLocal(res.date);
      setSize(serverPuzzle.size.rows as ZipDimension);
      setPuzzle(serverPuzzle);
      puzzleRef.current = serverPuzzle;

      const startKey = serverPuzzle.solution[0];
      pathRef.current = [startKey];
      nextExpectedCpRef.current = 2;
      movesRef.current = 0;
      gameEndedRef.current = false;

      setPath([startKey]);
      setNextExpectedCheckpoint(2);
      setMoves(0);
      setSeconds(0);
      setGameEnded(false);
      setHintCellKey(null);
      setOfficialXpAwarded(0);

      if (timerRef.current) clearInterval(timerRef.current);
      if (!res.myScore) {
        timerRef.current = setInterval(() => {
          setSeconds((s) => s + 1);
        }, 1000);
      }
    } catch {
      const fallback = getDailyZipPuzzleLocal();
      setSize(fallback.size.rows as ZipDimension);
      setPuzzle(fallback);
      puzzleRef.current = fallback;

      const startKey = fallback.solution[0];
      pathRef.current = [startKey];
      nextExpectedCpRef.current = 2;
      movesRef.current = 0;
      gameEndedRef.current = false;

      setPath([startKey]);
      setNextExpectedCheckpoint(2);
      setMoves(0);
      setSeconds(0);
      setGameEnded(false);

      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } finally {
      setDailyLoading(false);
    }
  }, []);

  // On mount or mode switch
  useEffect(() => {
    if (gameMode === "daily") {
      loadDailyChallenge();
    } else {
      initPracticeGame();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameMode, loadDailyChallenge, initPracticeGame]);

  /** Win celebration and score submission handler */
  const handleGameWin = useCallback(
    async (finalPath: string[], totalMoves: number) => {
      if (timerRef.current) clearInterval(timerRef.current);
      gameEndedRef.current = true;
      setGameEnded(true);
      SoundEffects.playZipSolve();

      const elapsed = secondsRef.current;
      const dim = puzzleRef.current.size.rows;
      const diff = puzzleRef.current.difficulty;
      let cutoff3 = 45;
      let cutoff2 = 90;
      if (dim <= 5) {
        cutoff3 = diff === "hard" || diff === "impossible" ? 25 : 35;
        cutoff2 = diff === "hard" || diff === "impossible" ? 50 : 70;
      } else if (dim === 6) {
        cutoff3 = diff === "hard" || diff === "impossible" ? 40 : 55;
        cutoff2 = diff === "hard" || diff === "impossible" ? 80 : 100;
      } else if (dim === 7) {
        cutoff3 = diff === "hard" || diff === "impossible" ? 60 : 80;
        cutoff2 = diff === "hard" || diff === "impossible" ? 110 : 140;
      } else if (dim === 8) {
        cutoff3 = diff === "hard" || diff === "impossible" ? 80 : 110;
        cutoff2 = diff === "hard" || diff === "impossible" ? 140 : 180;
      } else if (dim === 9) {
        cutoff3 = diff === "hard" || diff === "impossible" ? 110 : 150;
        cutoff2 = diff === "hard" || diff === "impossible" ? 180 : 240;
      } else {
        cutoff3 = diff === "hard" || diff === "impossible" ? 140 : 200;
        cutoff2 = diff === "hard" || diff === "impossible" ? 240 : 320;
      }
      const stars = elapsed <= cutoff3 ? 3 : elapsed <= cutoff2 ? 2 : 1;

      if (gameMode === "daily") {
        try {
          const subRes = await submitDailyZipScore({
            puzzleDate: dailyData?.date,
            timeSeconds: elapsed,
            moves: totalMoves,
            stars,
          });
          if (subRes.ok) {
            setOfficialXpAwarded(subRes.score.xpEarned);
            setMyDailyScore({
              timeSeconds: subRes.score.timeSeconds,
              moves: subRes.score.moves,
              stars: subRes.score.stars,
              xpEarned: subRes.score.xpEarned,
              completedAt: new Date().toISOString(),
            });
            refreshUser();
          }
        } catch {
          const earnedXp = stars * 15;
          setOfficialXpAwarded(earnedXp);
          setMyDailyScore({
            timeSeconds: elapsed,
            moves: totalMoves,
            stars,
            xpEarned: earnedXp,
            completedAt: new Date().toISOString(),
          });
          queueOfflineSubmission("zip", "/api/zip/daily/submit", {
            puzzleDate: dailyData?.date || new Date().toISOString().slice(0, 10),
            timeSeconds: elapsed,
            moves: totalMoves,
            stars,
          });
        }
      } else {
        refreshUser();
      }
    },
    [gameMode, dailyData?.date, refreshUser]
  );

  /**
   * Initial touch-down on the grid:
   * 1. If path is empty, starts on checkpoint 1.
   * 2. If touching a previous checkpoint or cell on the line, intentionally rewinds to that point!
   *    ("or should touch the number or the line upto where backtrack needed")
   * 3. If touching an adjacent unvisited cell from head, advances by 1.
   */
  const handleTouchDown = useCallback(
    (row: number, col: number) => {
      if (gameEndedRef.current) return;
      const pz = puzzleRef.current;
      if (row < 0 || row >= pz.size.rows || col < 0 || col >= pz.size.cols) return;

      const targetKey = cellKey(row, col);

      // Start path on cell 1 if path is empty
      if (pathRef.current.length === 0) {
        if (pz.numbers[targetKey] === 1) {
          pathRef.current = [targetKey];
          nextExpectedCpRef.current = 2;
          setPath([targetKey]);
          setNextExpectedCheckpoint(2);
          SoundEffects.playZipPop();
        }
        return;
      }

      // DELIBERATE TOUCH-TO-BACKTRACK:
      // Tapping on an already-visited cell or number rewinds the path directly to that cell!
      const existingIdx = pathRef.current.indexOf(targetKey);
      if (existingIdx !== -1) {
        if (existingIdx < pathRef.current.length - 1) {
          const newPath = pathRef.current.slice(0, existingIdx + 1);
          pathRef.current = newPath;
          setPath(newPath);
          SoundEffects.playZipRetract();

          // Recalculate next expected checkpoint
          let maxVisitedCp = 1;
          newPath.forEach((k) => {
            const cp = pz.numbers[k];
            if (cp !== undefined && cp > maxVisitedCp) {
              maxVisitedCp = cp;
            }
          });
          nextExpectedCpRef.current = maxVisitedCp + 1;
          setNextExpectedCheckpoint(maxVisitedCp + 1);
          setHintCellKey(null);
        }
        return;
      }

      // If touching an adjacent unvisited cell from head
      const headKey = pathRef.current[pathRef.current.length - 1];
      const head = parseKey(headKey);
      if (areAdjacent(head, { row, col })) {
        if (hasWall(wallsSetRef.current, headKey, targetKey)) {
          SoundEffects.playZipWallHit();
          return;
        }
        const cp = pz.numbers[targetKey];
        if (cp !== undefined && cp !== nextExpectedCpRef.current) {
          SoundEffects.playZipWallHit();
          return;
        }
        pathRef.current.push(targetKey);
        movesRef.current += 1;
        const updated = [...pathRef.current];
        setPath(updated);
        setMoves(movesRef.current);
        if (cp !== undefined) {
          nextExpectedCpRef.current = cp + 1;
          setNextExpectedCheckpoint(cp + 1);
          SoundEffects.playZipCheckpoint();
        } else {
          SoundEffects.playZipPop();
        }
        setHintCellKey(null);

        const totalCells = pz.size.rows * pz.size.cols;
        if (updated.length === totalCells && cp === pz.maxCheckpoint) {
          handleGameWin(updated, movesRef.current);
        }
      }
    },
    [handleGameWin]
  );

  /**
   * Continuous Dragging along the grid:
   * 1. If dragging backward into the immediate predecessor (head - 1), unrolls backward 1 step ("I should come backward").
   * 2. If dragging towards ANY OTHER cell already in the path, STRICTLY BLOCKS THE MOVE ("it shouldnt let drag where the line is already dragged").
   * 3. Blocks moving through walls or out-of-order checkpoints.
   * 4. Extends the line forward into adjacent unvisited cells.
   */
  const handleDragMove = useCallback(
    (targetR: number, targetC: number) => {
      if (gameEndedRef.current) return;
      const pz = puzzleRef.current;
      if (targetR < 0 || targetR >= pz.size.rows || targetC < 0 || targetC >= pz.size.cols) return;

      const targetKey = cellKey(targetR, targetC);
      if (pathRef.current.length === 0) return;

      let changed = false;
      const maxSteps = pz.size.rows + pz.size.cols;
      let loopCount = 0;

      while (loopCount < maxSteps) {
        const headKey = pathRef.current[pathRef.current.length - 1];
        if (headKey === targetKey) break;

        const head = parseKey(headKey);
        const dr = targetR - head.row;
        const dc = targetC - head.col;

        const candidates: { r: number; c: number }[] = [];
        if (Math.abs(dr) >= Math.abs(dc)) {
          if (dr !== 0) candidates.push({ r: head.row + Math.sign(dr), c: head.col });
          if (dc !== 0) candidates.push({ r: head.row, c: head.col + Math.sign(dc) });
        } else {
          if (dc !== 0) candidates.push({ r: head.row, c: head.col + Math.sign(dc) });
          if (dr !== 0) candidates.push({ r: head.row + Math.sign(dr), c: head.col });
        }

        let stepped = false;
        for (const next of candidates) {
          if (next.r < 0 || next.r >= pz.size.rows || next.c < 0 || next.c >= pz.size.cols) continue;
          const nextK = cellKey(next.r, next.c);

          // CASE 1: Moving backward along the line into the immediate previous cell -> Unroll 1 step!
          const prevHeadKey =
            pathRef.current.length >= 2 ? pathRef.current[pathRef.current.length - 2] : null;
          if (nextK === prevHeadKey) {
            pathRef.current.pop();
            changed = true;
            stepped = true;
            SoundEffects.playZipRetract();

            // Recalculate next expected checkpoint
            let maxVisitedCp = 1;
            pathRef.current.forEach((k) => {
              const cp = pz.numbers[k];
              if (cp !== undefined && cp > maxVisitedCp) {
                maxVisitedCp = cp;
              }
            });
            nextExpectedCpRef.current = maxVisitedCp + 1;
            break;
          }

          // CASE 2: Moving into ANY OTHER already-drawn cell -> STRICTLY BLOCKED AS AN OBSTACLE!
          // Does NOT revert or wipe out earlier paths!
          if (pathRef.current.includes(nextK)) {
            SoundEffects.playZipWallHit();
            break; // Stop immediately at this obstacle
          }

          // CASE 3: Wall barrier collision -> Blocked!
          if (hasWall(wallsSetRef.current, headKey, nextK)) {
            SoundEffects.playZipWallHit();
            break;
          }

          // CASE 4: Checkpoint out of order -> Blocked!
          const cp = pz.numbers[nextK];
          if (cp !== undefined && cp !== nextExpectedCpRef.current) {
            SoundEffects.playZipWallHit();
            break;
          }

          // CASE 5: Clear valid move -> Step into cell!
          pathRef.current.push(nextK);
          movesRef.current += 1;
          changed = true;
          stepped = true;

          if (cp !== undefined) {
            SoundEffects.playZipCheckpoint();
            nextExpectedCpRef.current = cp + 1;
          } else {
            SoundEffects.playZipPop();
          }
          break;
        }

        if (!stepped) {
          // Hit an obstacle (wall, visited line, or out-of-order checkpoint)
          break;
        }
        loopCount++;
      }

      if (changed) {
        const updatedPath = [...pathRef.current];
        setPath(updatedPath);
        setMoves(movesRef.current);
        setNextExpectedCheckpoint(nextExpectedCpRef.current);
        setHintCellKey(null);

        const totalCells = pz.size.rows * pz.size.cols;
        const finalHeadKey = updatedPath[updatedPath.length - 1];
        const finalCp = pz.numbers[finalHeadKey];
        if (updatedPath.length === totalCells && finalCp === pz.maxCheckpoint) {
          handleGameWin(updatedPath, movesRef.current);
        }
      }
    },
    [handleGameWin]
  );

  /** Intelligent Hint: rewinds path to deviation point and highlights the exact next correct cell */
  const handleHint = useCallback(() => {
    if (gameEndedRef.current) return;
    const { validPrefixLength, nextCorrectCell } = getSmartHint(
      pathRef.current,
      puzzleRef.current.solution
    );

    if (validPrefixLength < pathRef.current.length) {
      const rewoundPath = pathRef.current.slice(0, validPrefixLength);
      pathRef.current = rewoundPath;
      setPath(rewoundPath);

      let maxVisitedCp = 1;
      rewoundPath.forEach((k) => {
        const cp = puzzleRef.current.numbers[k];
        if (cp !== undefined && cp > maxVisitedCp) {
          maxVisitedCp = cp;
        }
      });
      nextExpectedCpRef.current = maxVisitedCp + 1;
      setNextExpectedCheckpoint(maxVisitedCp + 1);
    }

    setHintCellKey(nextCorrectCell);
    SoundEffects.playStar();
  }, []);

  /** Step back one cell */
  const handleUndo = useCallback(() => {
    if (pathRef.current.length <= 1 || gameEndedRef.current) return;
    const newPath = pathRef.current.slice(0, -1);
    pathRef.current = newPath;
    setPath(newPath);
    SoundEffects.playZipPop();

    let maxVisitedCp = 1;
    newPath.forEach((k) => {
      const cp = puzzleRef.current.numbers[k];
      if (cp !== undefined && cp > maxVisitedCp) {
        maxVisitedCp = cp;
      }
    });
    nextExpectedCpRef.current = maxVisitedCp + 1;
    setNextExpectedCheckpoint(maxVisitedCp + 1);
    setHintCellKey(null);
  }, []);

  /** Clear/Reset path back to checkpoint 1 */
  const handleReset = useCallback(() => {
    if (gameEndedRef.current) return;
    const startKey = puzzleRef.current.solution[0];
    pathRef.current = [startKey];
    nextExpectedCpRef.current = 2;
    setPath([startKey]);
    setNextExpectedCheckpoint(2);
    setHintCellKey(null);
    SoundEffects.playZipRetract();
  }, []);

  /** Open Standings & Leaderboard Modal */
  const handleOpenStandings = useCallback(async () => {
    setShowStandingsModal(true);
    setStandingsLoading(true);
    try {
      const data = await getDailyZipLeaderboard(dailyData?.date);
      setStandingsData(data);
    } catch {
      // ignore
    } finally {
      setStandingsLoading(false);
    }
  }, [dailyData?.date]);

  /** Nudge a friend who hasn't played today */
  const handleNudge = useCallback(
    async (friendUserId: number, friendName: string) => {
      try {
        const res = await nudgeDailyZipFriend(friendUserId, dailyData?.date);
        if (res.ok) {
          SoundEffects.playFanfare();
          setNudgedFriendIds((prev) => new Set([...prev, friendUserId]));
          Alert.alert(
            "👉 Nudge Sent!",
            `${friendName} has been notified to solve today's Daily Zip and beat your time!`
          );
        }
      } catch {
        Alert.alert("Notice", "You already nudged this friend today.");
        setNudgedFriendIds((prev) => new Set([...prev, friendUserId]));
      }
    },
    [dailyData?.date]
  );

  /** Share Result using native share sheet */
  const handleShareResult = useCallback(async () => {
    const solvedSeconds = myDailyScore ? myDailyScore.timeSeconds : secondsRef.current;
    const solvedMoves = myDailyScore ? myDailyScore.moves : movesRef.current;
    const solvedStars = myDailyScore ? myDailyScore.stars : 3;
    const text = generateZipShareText({
      puzzleNum: dailyData?.puzzleNum || 1,
      size: puzzleRef.current.size,
      seconds: solvedSeconds,
      moves: solvedMoves,
      stars: solvedStars,
      lang,
    });
    try {
      await Share.share({
        message: text,
        title: "QuizQuest Daily Zip",
      });
    } catch {
      // User cancelled share
    }
  }, [myDailyScore, dailyData?.puzzleNum, lang]);

  // Ultra-responsive PanResponder for 120Hz continuous drag drawing
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponderCapture: () => true,
        onPanResponderTerminationRequest: () => false,
        onShouldBlockNativeResponder: () => true,

        onPanResponderGrant: (evt) => {
          const { pageX, pageY, locationX, locationY } = evt.nativeEvent;
          const gridPageX = pageX - locationX;
          const gridPageY = pageY - locationY;
          gridLayoutRef.current = {
            pageX: gridPageX,
            pageY: gridPageY,
            cellSize,
          };
          setIsDragging(true);

          const col = Math.floor(locationX / cellSize);
          const row = Math.floor(locationY / cellSize);
          handleTouchDown(row, col);
        },

        onPanResponderMove: (evt) => {
          if (!gridLayoutRef.current) return;
          const { pageX, pageY } = evt.nativeEvent;
          const localX = pageX - gridLayoutRef.current.pageX;
          const localY = pageY - gridLayoutRef.current.pageY;
          const col = Math.floor(localX / cellSize);
          const row = Math.floor(localY / cellSize);
          handleDragMove(row, col);
        },

        onPanResponderRelease: () => {
          setIsDragging(false);
        },

        onPanResponderTerminate: () => {
          setIsDragging(false);
        },
      }),
    [cellSize, handleTouchDown, handleDragMove]
  );

  const totalCells = puzzle.size.rows * puzzle.size.cols;
  const currentHeadKey = path[path.length - 1];
  const percentFilled = Math.round((path.length / totalCells) * 100);

  return (
    <Atmosphere>
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        {/* Top Header Bar (Clean LinkedIn-styled header) */}
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: colors.surface }]}
            onPress={() => navigation.goBack()}
            activeOpacity={0.75}
          >
            <Text style={[styles.backBtnText, { color: colors.text }]}>←</Text>
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <View style={styles.brandBadge}>
              <Text style={styles.brandBadgeText}>QQ</Text>
            </View>
            <Text style={[styles.headerZipTitle, { color: colors.text, fontFamily: fonts.display }]}>
              Zip
            </Text>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              onPress={() => setShowHowToPlay((prev) => !prev)}
              style={[
                styles.iconBtn,
                { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
              ]}
              activeOpacity={0.7}
            >
              <Text style={[styles.iconBtnText, { color: colors.text, fontFamily: fonts.bodyBold }]}>?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleOpenStandings}
              style={[
                styles.iconBtn,
                { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
              ]}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 16 }}>🏆</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={toggleSound}
              style={[
                styles.iconBtn,
                { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
              ]}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 14 }}>{isSoundEnabled ? "🔊" : "🔇"}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          bounces={false}
          scrollEnabled={!isDragging}
          showsVerticalScrollIndicator={false}
        >
          {/* Clear Segmented Mode Tabs: Daily Challenge vs Unlimited Free Play */}
          <View style={[styles.modeSegmentContainer, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <TouchableOpacity
              style={[
                styles.modeSegmentTab,
                gameMode === "daily" && [styles.modeSegmentTabActive, { backgroundColor: colors.primary }],
              ]}
              onPress={() => {
                if (gameMode !== "daily") {
                  setGameMode("daily");
                  loadDailyChallenge();
                }
              }}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.modeSegmentText,
                  {
                    color: gameMode === "daily" ? colors.textOnPrimary : colors.textMuted,
                    fontFamily: fonts.bodyBold,
                  },
                ]}
              >
                🌟 Daily Challenge {dailyData?.puzzleNum ? `#${dailyData.puzzleNum}` : ""}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modeSegmentTab,
                gameMode === "practice" && [styles.modeSegmentTabActive, { backgroundColor: colors.primary }],
              ]}
              onPress={() => {
                if (gameMode !== "practice") {
                  setGameMode("practice");
                  initPracticeGame(practiceSize, practiceDifficulty);
                }
              }}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.modeSegmentText,
                  {
                    color: gameMode === "practice" ? colors.textOnPrimary : colors.textMuted,
                    fontFamily: fonts.bodyBold,
                  },
                ]}
              >
                🎲 Free Play (New Board)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Daily Solved Banner with Play Unlimited Boards button */}
          {gameMode === "daily" && myDailyScore && (
            <View
              style={[
                styles.dailySolvedNotice,
                { backgroundColor: "rgba(16, 185, 129, 0.12)", borderColor: colors.green },
              ]}
            >
              <View style={styles.dailySolvedNoticeTextCol}>
                <Text style={[styles.dailySolvedNoticeTitle, { color: colors.green, fontFamily: fonts.bodyBold }]}>
                  ✓ Daily Zip Solved ({myDailyScore.timeSeconds}s)
                </Text>
                <Text style={[styles.dailySolvedNoticeSub, { color: colors.textMuted, fontFamily: fonts.body }]}>
                  Play unlimited randomized puzzles in Free Play!
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.dailySolvedPlayMoreBtn, { backgroundColor: colors.green }]}
                onPress={() => {
                  setGameMode("practice");
                  initPracticeGame(practiceSize, practiceDifficulty);
                }}
                activeOpacity={0.85}
              >
                <Text style={[styles.dailySolvedPlayMoreText, { fontFamily: fonts.bodyBold }]}>
                  New Board 🎲
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Practice Mode Size & Difficulty Selectors (Placed at the top of controls) */}
          {gameMode === "practice" && (
            <View
              style={[
                styles.practiceConfigCard,
                {
                  backgroundColor: colors.surfaceElevated,
                  borderColor: colors.border,
                },
              ]}
            >
              {/* Row 1: Grid Size (5x5, 6x6, 7x7, 8x8) */}
              <View style={styles.selectorRow}>
                <Text style={[styles.selectorLabel, { color: colors.textMuted, fontFamily: fonts.bodyBold }]}>
                  SIZE
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.pillsGroupScroll}
                >
                  {([5, 6, 7, 8, 9, 10] as ZipDimension[]).map((s) => {
                    const active = practiceSize === s;
                    return (
                      <TouchableOpacity
                        key={`size-${s}`}
                        onPress={() => {
                          setPracticeSize(s);
                          initPracticeGame(s, practiceDifficulty);
                        }}
                        style={[
                          styles.chipPill,
                          active
                            ? [styles.chipPillActive, { backgroundColor: colors.primary, borderColor: colors.primary }]
                            : { backgroundColor: colors.card, borderColor: colors.border },
                        ]}
                        activeOpacity={0.75}
                      >
                        <Text
                          style={[
                            styles.chipPillText,
                            {
                              color: active ? colors.textOnPrimary : colors.textMuted,
                              fontFamily: active ? fonts.bodyBold : fonts.body,
                            },
                          ]}
                        >
                          {s}×{s}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Row 2: Difficulty Level (Easy, Medium, Hard, Impossible) & New Board Shuffle */}
              <View style={styles.selectorRow}>
                <Text style={[styles.selectorLabel, { color: colors.textMuted, fontFamily: fonts.bodyBold }]}>
                  LEVEL
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.pillsGroupScroll}
                >
                  {(["easy", "medium", "hard", "impossible"] as ZipDifficulty[]).map((d) => {
                    const active = practiceDifficulty === d;
                    const activeColor =
                      d === "easy"
                        ? "#10B981"
                        : d === "medium"
                        ? "#F59E0B"
                        : d === "hard"
                        ? "#EF4444"
                        : "#A855F7";
                    return (
                      <TouchableOpacity
                        key={`diff-${d}`}
                        onPress={() => {
                          setPracticeDifficulty(d);
                          initPracticeGame(practiceSize, d);
                        }}
                        style={[
                          styles.chipPill,
                          active
                            ? [styles.chipPillActive, { backgroundColor: activeColor, borderColor: activeColor }]
                            : { backgroundColor: colors.card, borderColor: colors.border },
                        ]}
                        activeOpacity={0.75}
                      >
                        <Text
                          style={[
                            styles.chipPillText,
                            {
                              color: active ? "#FFFFFF" : colors.textMuted,
                              fontFamily: active ? fonts.bodyBold : fonts.body,
                            },
                          ]}
                        >
                          {d === "easy"
                            ? "🟢 Easy"
                            : d === "medium"
                            ? "🟡 Med"
                            : d === "hard"
                            ? "🔴 Hard"
                            : "💀 Impossible"}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}

                  <TouchableOpacity
                    onPress={() => initPracticeGame(practiceSize, practiceDifficulty)}
                    style={[styles.shuffleBtn, { backgroundColor: colors.accent, borderColor: colors.accent }]}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.shuffleBtnText, { color: "#FFFFFF", fontFamily: fonts.bodyBold }]}>
                      🎲 New
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </View>
          )}

          {/* Rival To Beat Pill (if daily and rival exists) */}
          {gameMode === "daily" && rivalToBeat && (
            <TouchableOpacity
              onPress={handleOpenStandings}
              style={[
                styles.rivalBanner,
                { backgroundColor: colors.surfaceElevated, borderColor: colors.accent },
              ]}
              activeOpacity={0.85}
            >
              <AvatarCircle avatar={rivalToBeat.avatar} size={28} />
              <Text style={[styles.rivalBannerSubtitle, { color: colors.text, fontFamily: fonts.body }]}>
                Beat <Text style={{ fontFamily: fonts.bodyBold }}>{rivalToBeat.name}</Text> ({rivalToBeat.timeSeconds}s)
              </Text>
            </TouchableOpacity>
          )}

          {/* Live In-Game HUD directly anchored above the board */}
          <View style={styles.hudBar}>
            <View style={styles.hudLeft}>
              <View style={[styles.timerBadge, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <Text style={[styles.timerText, { color: colors.text, fontFamily: fonts.display }]}>
                  ⏱ {formatTimer(seconds)}
                </Text>
              </View>

              <View
                style={[
                  styles.targetBadge,
                  {
                    backgroundColor: colors.surfaceElevated,
                    borderColor: nextExpectedCheckpoint <= puzzle.maxCheckpoint ? colors.accent : colors.green,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.targetBadgeText,
                    {
                      color: nextExpectedCheckpoint <= puzzle.maxCheckpoint ? colors.accent : colors.green,
                      fontFamily: fonts.bodyBold,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {nextExpectedCheckpoint <= puzzle.maxCheckpoint
                    ? `🎯 Target #${nextExpectedCheckpoint}`
                    : "🏁 Fill Board!"}
                </Text>
                <Text style={[styles.targetProgressText, { color: colors.textMuted, fontFamily: fonts.body }]}>
                  {`(${Math.min(nextExpectedCheckpoint - 1, puzzle.maxCheckpoint)}/${puzzle.maxCheckpoint})`}
                </Text>
              </View>
            </View>

            <View style={styles.hudRight}>
              {gameMode === "practice" && (
                <TouchableOpacity
                  onPress={() => initPracticeGame(practiceSize, practiceDifficulty)}
                  style={[styles.hudActionBtn, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.hudActionBtnText, { color: colors.primary, fontFamily: fonts.bodyBold }]}>
                    🎲 New Board
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={handleReset}
                style={[styles.hudActionBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
                activeOpacity={0.7}
              >
                <Text style={[styles.hudActionBtnText, { color: colors.textMuted, fontFamily: fonts.bodyBold }]}>
                  ↺ Reset
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* The Interactive Zip Grid with Continuous Vector Ribbon & Physical Wall Barriers */}
          {dailyLoading ? (
            <View style={[styles.gridContainer, styles.loadingGrid, { width: MAX_BOARD_WIDTH, height: MAX_BOARD_WIDTH }]}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[{ color: colors.textMuted, marginTop: spacing.md, fontFamily: fonts.body }]}>
                Loading Today's Zip...
              </Text>
            </View>
          ) : (
            <View
              style={[
                styles.gridContainer,
                {
                  width: MAX_BOARD_WIDTH,
                  height: MAX_BOARD_WIDTH,
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
              {...panResponder.panHandlers}
            >
              {/* Subtle Grid Divider Lines */}
              <View style={StyleSheet.absoluteFill} pointerEvents="none">
                {Array.from({ length: puzzle.size.rows }).map((_, r) => (
                  <View key={`grid-row-${r}`} style={{ flex: 1, flexDirection: "row" }}>
                    {Array.from({ length: puzzle.size.cols }).map((_, c) => (
                      <View
                        key={`grid-cell-${r}-${c}`}
                        style={{
                          flex: 1,
                          borderColor: "rgba(255, 255, 255, 0.05)",
                          borderWidth: 0.5,
                        }}
                      />
                    ))}
                  </View>
                ))}
              </View>

              {/* CONTINUOUS VECTOR-SMOOTH RIBBON (REACT-NATIVE-SVG) */}
              <Svg
                width={MAX_BOARD_WIDTH}
                height={MAX_BOARD_WIDTH}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              >
                {/* 1. Seamless Path Line Segments */}
                {path.slice(1).map((key, idx) => {
                  const prevKey = path[idx];
                  const from = parseKey(prevKey);
                  const to = parseKey(key);
                  const x1 = from.col * cellSize + cellSize / 2;
                  const y1 = from.row * cellSize + cellSize / 2;
                  const x2 = to.col * cellSize + cellSize / 2;
                  const y2 = to.row * cellSize + cellSize / 2;
                  const color = getZipRibbonColor(idx + 1, totalCells);
                  return (
                    <Line
                      key={`seg-${idx}`}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={color}
                      strokeWidth={pipeWidth}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  );
                })}

                {/* 2. Path Vertex Nodes (Exact match with pipeWidth eliminates all seams) */}
                {path.map((key, idx) => {
                  const pos = parseKey(key);
                  const cx = pos.col * cellSize + cellSize / 2;
                  const cy = pos.row * cellSize + cellSize / 2;
                  const color = getZipRibbonColor(idx, totalCells);
                  return (
                    <Circle
                      key={`node-${key}`}
                      cx={cx}
                      cy={cy}
                      r={pipeWidth / 2}
                      fill={color}
                    />
                  );
                })}

                {/* 3. Leading Head Pulse Halo */}
                {currentHeadKey &&
                  (() => {
                    const hp = parseKey(currentHeadKey);
                    return (
                      <Circle
                        cx={hp.col * cellSize + cellSize / 2}
                        cy={hp.row * cellSize + cellSize / 2}
                        r={pipeWidth / 2 + 3}
                        stroke="#FFFFFF"
                        strokeWidth={2.5}
                        fill="none"
                        opacity={0.9}
                      />
                    );
                  })()}

                {/* 4. Physical Obstacle Maze Walls (Continuous Seamless High-Contrast Corridors) */}
                {puzzle.walls.map((w, wIdx) => {
                  const a = parseKey(w.between[0]);
                  const b = parseKey(w.between[1]);
                  const wallColor = paletteId === "dawn" ? "#0F172A" : "#F8FAFC";
                  const wWidth = Math.max(5, Math.round(cellSize * 0.13));

                  if (a.row === b.row) {
                    // Vertical wall segment between adjacent columns
                    const colBorder = Math.max(a.col, b.col);
                    const x = colBorder * cellSize;
                    const y1 = a.row * cellSize;
                    const y2 = (a.row + 1) * cellSize;
                    return (
                      <Line
                        key={`wall-${wIdx}`}
                        x1={x}
                        y1={y1}
                        x2={x}
                        y2={y2}
                        stroke={wallColor}
                        strokeWidth={wWidth}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    );
                  } else {
                    // Horizontal wall segment between adjacent rows
                    const rowBorder = Math.max(a.row, b.row);
                    const y = rowBorder * cellSize;
                    const x1 = a.col * cellSize;
                    const x2 = (a.col + 1) * cellSize;
                    return (
                      <Line
                        key={`wall-${wIdx}`}
                        x1={x1}
                        y1={y}
                        x2={x2}
                        y2={y}
                        stroke={wallColor}
                        strokeWidth={wWidth}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    );
                  }
                })}

                {/* 5. Hint Target Highlight */}
                {hintCellKey &&
                  (() => {
                    const hp = parseKey(hintCellKey);
                    return (
                      <Circle
                        cx={hp.col * cellSize + cellSize / 2}
                        cy={hp.row * cellSize + cellSize / 2}
                        r={cellSize * 0.32}
                        stroke={colors.gold}
                        strokeWidth={3}
                        strokeDasharray="4, 4"
                        fill="none"
                      />
                    );
                  })()}
              </Svg>

              {/* Numbered Checkpoint Badges (Solid black circles with crisp white bold numerals) */}
              {Object.entries(puzzle.numbers).map(([key, num]) => {
                const pos = parseKey(key);
                const isNext = num === nextExpectedCheckpoint;
                const isPassed = num < nextExpectedCheckpoint;
                const badgeSize = Math.min(cellSize * 0.72, 42);
                return (
                  <View
                    key={`cp-${key}`}
                    pointerEvents="none"
                    style={[
                      styles.checkpointBadge,
                      {
                        left: pos.col * cellSize + (cellSize - badgeSize) / 2,
                        top: pos.row * cellSize + (cellSize - badgeSize) / 2,
                        width: badgeSize,
                        height: badgeSize,
                        borderRadius: badgeSize / 2,
                        backgroundColor: "#111318",
                        borderWidth: isNext ? 2.5 : 1.5,
                        borderColor: isNext
                          ? "#FFFFFF"
                          : isPassed
                          ? "rgba(255, 255, 255, 0.85)"
                          : "rgba(255, 255, 255, 0.25)",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.checkpointNumber,
                        {
                          color: "#FFFFFF",
                          fontFamily: fonts.display,
                          fontSize:
                            num >= 10
                              ? puzzle.size.cols >= 9
                                ? 9.5
                                : puzzle.size.cols >= 8
                                ? 11
                                : 13
                              : puzzle.size.cols >= 9
                              ? 11.5
                              : puzzle.size.cols >= 8
                              ? 13.5
                              : 17,
                          fontWeight: "900",
                        },
                      ]}
                    >
                      {num}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Action Toolbar (Two wide pill buttons matching LinkedIn Zip) */}
          <View style={styles.actionToolbar}>
            <TouchableOpacity
              style={[
                styles.actionPillBtn,
                {
                  backgroundColor: colors.surfaceElevated,
                  borderColor: colors.border,
                  opacity: path.length <= 1 ? 0.45 : 1,
                },
              ]}
              onPress={handleUndo}
              disabled={path.length <= 1}
              activeOpacity={0.7}
            >
              <Text style={[styles.actionPillText, { color: colors.text, fontFamily: fonts.bodyBold }]}>
                Undo
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionPillBtn,
                {
                  backgroundColor: colors.surfaceElevated,
                  borderColor: colors.border,
                },
              ]}
              onPress={handleHint}
              activeOpacity={0.7}
            >
              <Text style={[styles.actionPillText, { color: colors.text, fontFamily: fonts.bodyBold }]}>
                Hint
              </Text>
            </TouchableOpacity>
          </View>

          {/* Visual "How to Play" Card */}
          <View style={[styles.visualHowToPlayCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity
              style={styles.howToPlayHeader}
              onPress={() => setShowHowToPlay((prev) => !prev)}
              activeOpacity={0.8}
            >
              <Text style={[styles.howToPlayTitle, { color: colors.text, fontFamily: fonts.bodyBold }]}>
                How to play
              </Text>
              <Text style={[styles.howToPlayChevron, { color: colors.textMuted }]}>
                {showHowToPlay ? "▲" : "▼"}
              </Text>
            </TouchableOpacity>

            {showHowToPlay && (
              <View style={styles.howToPlayContent}>
                <View style={styles.howToPlayRow}>
                  {/* Visual 1: Connect the dots in order */}
                  <View style={styles.howToPlayCol}>
                    <View style={styles.dotsGraphicRow}>
                      <View style={[styles.miniDot, { backgroundColor: "#111318", borderColor: "rgba(255,255,255,0.4)" }]}>
                        <Text style={styles.miniDotText}>1</Text>
                      </View>
                      <View style={[styles.miniDotLine, { backgroundColor: "#BE185D" }]} />
                      <View style={[styles.miniDot, { backgroundColor: "#111318", borderColor: "rgba(255,255,255,0.4)" }]}>
                        <Text style={styles.miniDotText}>2</Text>
                      </View>
                      <View style={[styles.miniDotLine, { backgroundColor: "#EA580C" }]} />
                      <View style={[styles.miniDot, { backgroundColor: "#111318", borderColor: "rgba(255,255,255,0.4)" }]}>
                        <Text style={styles.miniDotText}>3</Text>
                      </View>
                    </View>
                    <Text style={[styles.howToPlayDesc, { color: colors.textMuted, fontFamily: fonts.body }]}>
                      Connect the dots in order
                    </Text>
                  </View>

                  {/* Visual 2: Fill every cell */}
                  <View style={styles.howToPlayCol}>
                    <View style={[styles.miniGridGraphic, { borderColor: "rgba(255,255,255,0.15)" }]}>
                      <View style={[styles.miniGridRibbon, { backgroundColor: "#BE185D" }]} />
                    </View>
                    <Text style={[styles.howToPlayDesc, { color: colors.textMuted, fontFamily: fonts.body }]}>
                      Fill every cell
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.seeResultsBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
                  onPress={() => {
                    if (myDailyScore || gameEnded) {
                      handleShareResult();
                    } else {
                      handleOpenStandings();
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.seeResultsBtnText, { color: colors.text, fontFamily: fonts.bodyBold }]}>
                    {myDailyScore || gameEnded ? "See results" : `Leaderboard & Standings 🏆`}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Victory Modal Overlay */}
        {gameEnded && (
          <View style={styles.modalOverlay}>
            <ConfettiEffect count={55} />
            <EmojiBurst />
            <Card
              style={StyleSheet.flatten([
                styles.victoryCard,
                { borderColor: colors.gold, borderWidth: 2 },
              ])}
            >
              <Text style={styles.victoryEmoji}>⚡</Text>
              <Text style={[styles.victoryTitle, { color: colors.text, fontFamily: fonts.display }]}>
                {gameMode === "daily" ? "DAILY ZIP SOLVED!" : "ZIP SOLVED!"}
              </Text>
              <Text style={[styles.victorySubtitle, { color: colors.textMuted, fontFamily: fonts.body }]}>
                {lang === "ne"
                  ? "तपाईंले ग्रिड सफलतापूर्वक पूरा गर्नुभयो!"
                  : `Full ${puzzle.size.rows}×${puzzle.size.cols} path completed in ${seconds}s!`}
              </Text>

              {/* Bounty Box */}
              <View style={styles.statsBoxRow}>
                <View style={[styles.statBox, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.statBoxLabel, { color: colors.textMuted }]}>Time</Text>
                  <Text style={[styles.statBoxVal, { color: colors.text, fontFamily: fonts.display }]}>
                    {seconds}s
                  </Text>
                </View>
                <View style={[styles.statBox, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.statBoxLabel, { color: colors.textMuted }]}>Moves</Text>
                  <Text style={[styles.statBoxVal, { color: colors.text, fontFamily: fonts.display }]}>
                    {moves}
                  </Text>
                </View>
                <View style={[styles.statBox, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.statBoxLabel, { color: colors.textMuted }]}>XP Bounty</Text>
                  <Text style={[styles.statBoxVal, { color: colors.primary, fontFamily: fonts.display }]}>
                    +{officialXpAwarded || 50}
                  </Text>
                </View>
              </View>

              <View style={styles.modalButtons}>
                <PrimaryButton
                  label="📤 Share Score & Grid"
                  onPress={handleShareResult}
                  variant="primary"
                />

                <PrimaryButton
                  label="🏆 View Daily Standings & Nudge"
                  onPress={() => {
                    setGameEnded(false);
                    handleOpenStandings();
                  }}
                  variant="accent"
                />

                <PrimaryButton
                  label="🎲 Play Another Board (New Random Grid)"
                  onPress={() => {
                    setGameEnded(false);
                    setGameMode("practice");
                    initPracticeGame(practiceSize, practiceDifficulty);
                  }}
                  variant="primary"
                />
              </View>
            </Card>
          </View>
        )}

        {/* Standings & Social Nudge Modal */}
        <Modal
          visible={showStandingsModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowStandingsModal(false)}
        >
          <View style={styles.sheetOverlay}>
            <View style={[styles.sheetContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {/* Sheet Header */}
              <View style={styles.sheetHeader}>
                <View>
                  <Text style={[styles.sheetTitle, { color: colors.text, fontFamily: fonts.display }]}>
                    🏆 {t("zipLeaderboardTitle")}
                  </Text>
                  <Text style={[styles.sheetSubtitle, { color: colors.textMuted, fontFamily: fonts.body }]}>
                    Daily Challenge #{dailyData?.puzzleNum || 1} · {dailyData?.date || "Today"}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowStandingsModal(false)}
                  style={[styles.sheetCloseBtn, { backgroundColor: colors.surface }]}
                >
                  <Text style={[styles.sheetCloseBtnText, { color: colors.text }]}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Standings Sub-Tabs */}
              <View style={[styles.tabBar, { backgroundColor: colors.surface }]}>
                <TouchableOpacity
                  onPress={() => setStandingsTab("friends")}
                  style={[
                    styles.tabItem,
                    standingsTab === "friends" && { backgroundColor: colors.primary },
                  ]}
                >
                  <Text
                    style={[
                      styles.tabItemText,
                      {
                        color: standingsTab === "friends" ? colors.textOnPrimary : colors.textMuted,
                        fontFamily: fonts.bodyBold,
                      },
                    ]}
                  >
                    👥 {t("zipFriendsTab")}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setStandingsTab("school")}
                  style={[
                    styles.tabItem,
                    standingsTab === "school" && { backgroundColor: colors.primary },
                  ]}
                >
                  <Text
                    style={[
                      styles.tabItemText,
                      {
                        color: standingsTab === "school" ? colors.textOnPrimary : colors.textMuted,
                        fontFamily: fonts.bodyBold,
                      },
                    ]}
                  >
                    🏫 {t("zipSchoolTab")}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setStandingsTab("global")}
                  style={[
                    styles.tabItem,
                    standingsTab === "global" && { backgroundColor: colors.primary },
                  ]}
                >
                  <Text
                    style={[
                      styles.tabItemText,
                      {
                        color: standingsTab === "global" ? colors.textOnPrimary : colors.textMuted,
                        fontFamily: fonts.bodyBold,
                      },
                    ]}
                  >
                    🌍 {t("zipGlobalTab")}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Standings List Content */}
              {standingsLoading ? (
                <View style={styles.sheetLoadingBox}>
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              ) : (
                <ScrollView style={styles.sheetScroll} showsVerticalScrollIndicator={false}>
                  {/* Leaderboard Rows */}
                  {(() => {
                    const list =
                      standingsTab === "friends"
                        ? standingsData?.friends || []
                        : standingsTab === "school"
                        ? standingsData?.school || []
                        : standingsData?.global || [];

                    if (list.length === 0) {
                      return (
                        <View style={styles.emptyBox}>
                          <Text style={{ fontSize: 32 }}>🧩</Text>
                          <Text style={[styles.emptyText, { color: colors.textMuted, fontFamily: fonts.body }]}>
                            {t("zipNoSolversYet")}
                          </Text>
                        </View>
                      );
                    }

                    return list.map((item) => {
                      const medal =
                        item.rank === 1 ? "🥇" : item.rank === 2 ? "🥈" : item.rank === 3 ? "🥉" : `#${item.rank}`;
                      return (
                        <View
                          key={item.userId}
                          style={[
                            styles.rankRow,
                            {
                              backgroundColor: item.isMe ? colors.primarySoft : colors.surface,
                              borderColor: item.isMe ? colors.primary : colors.border,
                            },
                          ]}
                        >
                          <Text style={[styles.rankMedal, { color: colors.text, fontFamily: fonts.display }]}>
                            {medal}
                          </Text>
                          <AvatarCircle avatar={item.avatar} size={36} />
                          <View style={{ flex: 1, marginLeft: spacing.sm }}>
                            <Text style={[styles.rankName, { color: colors.text, fontFamily: fonts.bodyBold }]}>
                              {item.name} {item.isMe && " (You)"}
                            </Text>
                            <Text style={[styles.rankSub, { color: colors.textMuted, fontFamily: fonts.body }]}>
                              {item.moves} moves · {"⭐".repeat(item.stars)}
                            </Text>
                          </View>
                          <View style={[styles.timeBadge, { backgroundColor: colors.surfaceElevated }]}>
                            <Text style={[styles.timeBadgeText, { color: colors.accent, fontFamily: fonts.bodyBold }]}>
                              ⏱ {item.timeSeconds}s
                            </Text>
                          </View>
                        </View>
                      );
                    });
                  })()}

                  {/* Friends Tab: Unplayed Friends with Nudge Buttons */}
                  {standingsTab === "friends" && (
                    <View style={styles.unplayedSection}>
                      <View style={styles.unplayedHeader}>
                        <Text style={[styles.unplayedTitle, { color: colors.text, fontFamily: fonts.bodyBold }]}>
                          👉 {t("zipFriendsUnplayed")}
                        </Text>
                      </View>

                      {!standingsData?.unplayedFriends || standingsData.unplayedFriends.length === 0 ? (
                        <Text style={[styles.allPlayedText, { color: colors.green, fontFamily: fonts.body }]}>
                          {t("zipAllFriendsPlayed")}
                        </Text>
                      ) : (
                        standingsData.unplayedFriends.map((friend) => {
                          const isNudged = nudgedFriendIds.has(friend.userId) || !friend.canNudge;
                          return (
                            <View
                              key={friend.userId}
                              style={[
                                styles.nudgeRow,
                                { backgroundColor: colors.surface, borderColor: colors.border },
                              ]}
                            >
                              <AvatarCircle avatar={friend.avatar} size={34} />
                              <Text
                                style={[
                                  styles.nudgeFriendName,
                                  { color: colors.text, fontFamily: fonts.bodyBold },
                                ]}
                              >
                                {friend.name}
                              </Text>

                              <TouchableOpacity
                                disabled={isNudged}
                                onPress={() => handleNudge(friend.userId, friend.name)}
                                style={[
                                  styles.nudgeBtn,
                                  {
                                    backgroundColor: isNudged ? colors.border : colors.primary,
                                  },
                                ]}
                                activeOpacity={0.8}
                              >
                                <Text
                                  style={[
                                    styles.nudgeBtnText,
                                    {
                                      color: isNudged ? colors.textMuted : colors.textOnPrimary,
                                      fontFamily: fonts.bodyBold,
                                    },
                                  ]}
                                >
                                  {isNudged ? t("zipNudged") : `👉 ${t("zipNudge")}`}
                                </Text>
                              </TouchableOpacity>
                            </View>
                          );
                        })
                      )}
                    </View>
                  )}
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </Atmosphere>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  backBtnText: {
    fontSize: 20,
    fontWeight: "700",
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  brandBadge: {
    backgroundColor: "#0A66C2",
    width: 24,
    height: 24,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  brandBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },
  headerZipTitle: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  iconBtnText: {
    fontSize: 15,
    fontWeight: "800",
  },
  scrollContent: {
    alignItems: "center",
    paddingBottom: spacing.xxl + 20,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  hudBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: MAX_BOARD_WIDTH,
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  hudLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },
  timerBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.chip,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  timerText: {
    fontSize: 13,
    letterSpacing: 0.5,
  },
  targetBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.chip,
    borderWidth: 1,
    gap: 5,
    flexShrink: 0,
  },
  targetBadgeText: {
    fontSize: 12,
    letterSpacing: 0.2,
  },
  targetProgressText: {
    fontSize: 11,
  },
  hudRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
  },
  hudActionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.chip,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  hudActionBtnText: {
    fontSize: 12,
    letterSpacing: 0.2,
  },
  difficultyPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.chip,
    borderWidth: 1,
  },
  difficultyPillText: {
    fontSize: 11,
    letterSpacing: 0.5,
  },
  practiceConfigCard: {
    width: MAX_BOARD_WIDTH,
    borderRadius: radius.card,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
    gap: 6,
  },
  selectorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  selectorLabel: {
    fontSize: 10,
    letterSpacing: 0.8,
    width: 38,
  },
  pillsGroup: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  pillsGroupScroll: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingRight: 8,
  },
  chipPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  chipPillActive: {
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
  },
  chipPillText: {
    fontSize: 11,
  },
  shuffleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    marginLeft: "auto",
  },
  shuffleBtnText: {
    fontSize: 11,
    letterSpacing: 0.2,
  },
  rivalBanner: {
    flexDirection: "row",
    alignItems: "center",
    width: MAX_BOARD_WIDTH,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: spacing.sm,
  },
  rivalBannerSubtitle: {
    fontSize: 12,
  },
  gridContainer: {
    borderRadius: radius.card,
    borderWidth: 2,
    overflow: "hidden",
    position: "relative",
    ...shadow.card,
  },
  loadingGrid: {
    alignItems: "center",
    justifyContent: "center",
  },
  checkpointBadge: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
  },
  checkpointNumber: {
    textAlign: "center",
  },
  actionToolbar: {
    flexDirection: "row",
    width: MAX_BOARD_WIDTH,
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  actionPillBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  actionPillText: {
    fontSize: 14,
  },
  visualHowToPlayCard: {
    width: MAX_BOARD_WIDTH,
    borderRadius: radius.card,
    borderWidth: 1,
    padding: spacing.md,
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  howToPlayHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  howToPlayTitle: {
    fontSize: 13,
    letterSpacing: 0.3,
  },
  howToPlayChevron: {
    fontSize: 11,
  },
  howToPlayContent: {
    gap: spacing.md,
    marginTop: 4,
  },
  howToPlayRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-start",
  },
  howToPlayCol: {
    flex: 1,
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 4,
  },
  dotsGraphicRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 38,
  },
  miniDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  miniDotText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
  },
  miniDotLine: {
    width: 14,
    height: 4,
    borderRadius: 2,
    marginHorizontal: -1,
  },
  miniGridGraphic: {
    width: 38,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
  },
  miniGridRibbon: {
    width: 22,
    height: 22,
    borderRadius: 6,
  },
  howToPlayDesc: {
    fontSize: 11,
    textAlign: "center",
  },
  seeResultsBtn: {
    width: "100%",
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginTop: 2,
  },
  seeResultsBtnText: {
    fontSize: 13,
    letterSpacing: 0.3,
  },
  modalOverlay: {
    ...(StyleSheet.absoluteFill as object),
    backgroundColor: "rgba(10, 14, 39, 0.88)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    zIndex: 99999,
    elevation: 99999,
  },
  victoryCard: {
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
    padding: spacing.xl,
    gap: spacing.md,
  },
  victoryEmoji: {
    fontSize: 48,
  },
  victoryTitle: {
    fontSize: 22,
    letterSpacing: 0.5,
  },
  victorySubtitle: {
    fontSize: 13,
    textAlign: "center",
  },
  statsBoxRow: {
    flexDirection: "row",
    gap: spacing.sm,
    width: "100%",
  },
  statBox: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: radius.small,
    alignItems: "center",
    gap: 2,
  },
  statBoxLabel: {
    fontSize: 10,
    textTransform: "uppercase",
  },
  statBoxVal: {
    fontSize: 16,
  },
  modalButtons: {
    width: "100%",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  sheetContent: {
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    borderWidth: 1,
    maxHeight: "85%",
    paddingBottom: spacing.xl,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  sheetTitle: {
    fontSize: 18,
  },
  sheetSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  sheetCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetCloseBtnText: {
    fontSize: 14,
    fontWeight: "700",
  },
  tabBar: {
    flexDirection: "row",
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    borderRadius: radius.chip,
    padding: 3,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: radius.chip,
    alignItems: "center",
    justifyContent: "center",
  },
  tabItemText: {
    fontSize: 11,
  },
  sheetLoadingBox: {
    padding: spacing.xxl,
    alignItems: "center",
  },
  sheetScroll: {
    paddingHorizontal: spacing.lg,
  },
  emptyBox: {
    alignItems: "center",
    padding: spacing.xxl,
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: 13,
    textAlign: "center",
  },
  rankRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: radius.card,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  rankMedal: {
    fontSize: 16,
    width: 32,
    textAlign: "center",
  },
  rankName: {
    fontSize: 13,
  },
  rankSub: {
    fontSize: 11,
    marginTop: 2,
  },
  timeBadge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.chip,
  },
  timeBadgeText: {
    fontSize: 12,
  },
  unplayedSection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
  },
  unplayedHeader: {
    marginBottom: spacing.sm,
  },
  unplayedTitle: {
    fontSize: 13,
  },
  allPlayedText: {
    fontSize: 12,
    textAlign: "center",
    marginVertical: spacing.md,
  },
  nudgeRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.sm + 4,
    borderRadius: radius.card,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  nudgeFriendName: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: 13,
  },
  nudgeBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.chip,
  },
  nudgeBtnText: {
    fontSize: 11,
  },
  modeSegmentContainer: {
    flexDirection: "row",
    borderRadius: radius.chip,
    borderWidth: 1,
    padding: 3,
    marginBottom: spacing.sm + 2,
    marginHorizontal: spacing.xs,
  },
  modeSegmentTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radius.chip - 2,
    alignItems: "center",
    justifyContent: "center",
  },
  modeSegmentTabActive: {
    ...shadow.card,
  },
  modeSegmentText: {
    fontSize: 12,
    letterSpacing: 0.2,
  },
  dailySolvedNotice: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.card,
    borderWidth: 1,
    marginBottom: spacing.sm,
    marginHorizontal: spacing.xs,
    gap: 8,
  },
  dailySolvedNoticeTextCol: {
    flex: 1,
  },
  dailySolvedNoticeTitle: {
    fontSize: 12,
  },
  dailySolvedNoticeSub: {
    fontSize: 11,
    marginTop: 2,
  },
  dailySolvedPlayMoreBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  dailySolvedPlayMoreText: {
    fontSize: 11,
    color: "#FFFFFF",
  },
});
