import { useNavigation } from "@react-navigation/native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getDailyWordSearch, submitWordSearch } from "../api/client";
import { queueOfflineSubmission } from "../utils/offlineStore";
import { DailyWordSearchResponse } from "../api/types";
import { Atmosphere } from "../components/Atmosphere";
import { Card } from "../components/Card";
import { ConfettiEffect } from "../components/ConfettiEffect";
import { GameRulesModal } from "../components/GameRulesModal";
import { PrimaryButton } from "../components/PrimaryButton";
import {
  getAllWordSearchCategories,
  sampleCategoryWords,
  WORD_SEARCH_DATA,
  WordEntry,
} from "../constants/wordSearchData";
import { useAuth } from "../state/AuthContext";
import { useI18n } from "../state/LanguageContext";
import { useTheme } from "../state/ThemeContext";
import { fonts, radius, shadow, spacing } from "../theme";
import { SoundEffects, useSoundEnabled } from "../utils/audio";
import {
  generateWordSearchPuzzle,
  getStraightLineCells,
  MYSTERY_COLOR,
  PlacedWord,
  WordSearchPuzzle,
} from "../utils/wordSearchGenerator";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const GRID_PADDING = spacing.md * 2;
// Cap board width by screen width and vertical height budget so grid and word bank fit harmoniously
const MAX_BOARD_WIDTH = Math.min(SCREEN_WIDTH - GRID_PADDING, Math.floor(SCREEN_HEIGHT * 0.44), 380);

/** Internal padding inside the grid container border */
const GRID_CONTAINER_PADDING = 4;
/** Gap between cells */
const CELL_GAP = 2;

type DifficultyTier = "easy" | "medium" | "hard";

interface DifficultyConfig {
  id: DifficultyTier;
  labelEn: string;
  labelNe: string;
  size: number;
  wordCount: number;
  icon: string;
}

const DIFFICULTY_CONFIGS: DifficultyConfig[] = [
  { id: "easy", labelEn: "Easy", labelNe: "सजिलो", size: 10, wordCount: 6, icon: "🌱" },
  { id: "medium", labelEn: "Medium", labelNe: "मध्यम", size: 13, wordCount: 10, icon: "⚡" },
  { id: "hard", labelEn: "Hard", labelNe: "कडा", size: 16, wordCount: 14, icon: "🔥" },
];

/**
 * Compute the exact cell size and touchable area dimensions, matching render layout precisely.
 * This ensures touch coordinates map 1:1 with rendered cell positions.
 */
function computeGridMetrics(gridSize: number) {
  const innerWidth = MAX_BOARD_WIDTH - GRID_CONTAINER_PADDING * 2;
  const cellSize = (innerWidth - CELL_GAP * (gridSize - 1)) / gridSize;
  return { innerWidth, cellSize };
}

export function WordSearchPlayScreen() {
  const { colors } = useTheme();
  const { lang, t } = useI18n();
  const navigation = useNavigation();
  const { refreshUser } = useAuth();
  const { isSoundEnabled, toggleSound } = useSoundEnabled();

  // Mode: "daily" (official synchronized challenge) or "practice" (free play)
  const [gameMode, setGameMode] = useState<"daily" | "practice">("daily");
  const [loading, setLoading] = useState<boolean>(false);
  const [dailyData, setDailyData] = useState<DailyWordSearchResponse | null>(null);

  // Configuration
  const [selectedCategory, setSelectedCategory] = useState<string>("nepal_heritage");
  const [difficulty, setDifficulty] = useState<DifficultyTier>("medium");

  // Active puzzle state
  const [puzzle, setPuzzle] = useState<WordSearchPuzzle | null>(null);
  const [foundWords, setFoundWords] = useState<Set<string>>(new Set());
  const [selectedClue, setSelectedClue] = useState<PlacedWord | null>(null);
  const [clueModalVisible, setClueModalVisible] = useState<boolean>(false);

  // Hints
  const [hintsLeft, setHintsLeft] = useState<number>(3);
  const [hintedCell, setHintedCell] = useState<{ row: number; col: number } | null>(null);

  // Selection & Touch — refs for PanResponder (avoids stale closures), state for rendering
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [selectionCellsState, setSelectionCellsState] = useState<{ row: number; col: number }[]>([]);
  const [tapAnchorState, setTapAnchorState] = useState<{ row: number; col: number } | null>(null);

  // Mutable refs for PanResponder — updated synchronously, no stale closure issues
  const selectionCellsRef = useRef<{ row: number; col: number }[]>([]);
  const tapAnchorRef = useRef<{ row: number; col: number } | null>(null);
  const startCellRef = useRef<{ row: number; col: number } | null>(null);
  const currentCellRef = useRef<{ row: number; col: number } | null>(null);
  const puzzleRef = useRef<WordSearchPuzzle | null>(null);
  const foundWordsRef = useRef<Set<string>>(new Set());
  const hintedCellRef = useRef<{ row: number; col: number } | null>(null);

  // Board layout measurements — refreshed on every touch via measureInWindow
  const gridContainerRef = useRef<View>(null);
  const gridLayoutRef = useRef<{ x: number; y: number; width: number; height: number }>({
    x: 0,
    y: 0,
    width: MAX_BOARD_WIDTH,
    height: MAX_BOARD_WIDTH,
  });

  // Timer & Combo
  const [timeSeconds, setTimeSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [comboCount, setComboCount] = useState<number>(0);
  const lastFoundTimestampRef = useRef<number>(0);

  // Victory modal & Mystery Word
  const [showVictory, setShowVictory] = useState<boolean>(false);
  const [awardedXp, setAwardedXp] = useState<number>(35);
  const [stars, setStars] = useState<number>(3);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [revealedMystery, setRevealedMystery] = useState<PlacedWord | null>(null);
  const [showRules, setShowRules] = useState<boolean>(false);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const comboScaleAnim = useRef(new Animated.Value(1)).current;
  const gridGlowAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const cellFoundAnim = useRef(new Animated.Value(1)).current;

  // Vibration debounce to prevent excessive haptics during fast swipes
  const lastVibrationRef = useRef<number>(0);

  // Categories list
  const categoryList = useMemo(() => getAllWordSearchCategories(), []);

  // Keep refs in sync with state
  useEffect(() => {
    puzzleRef.current = puzzle;
  }, [puzzle]);
  useEffect(() => {
    foundWordsRef.current = foundWords;
  }, [foundWords]);
  useEffect(() => {
    hintedCellRef.current = hintedCell;
  }, [hintedCell]);

  // Sync selection state → ref
  const updateSelectionCells = useCallback((cells: { row: number; col: number }[]) => {
    selectionCellsRef.current = cells;
    setSelectionCellsState(cells);
  }, []);

  const updateTapAnchor = useCallback((anchor: { row: number; col: number } | null) => {
    tapAnchorRef.current = anchor;
    setTapAnchorState(anchor);
  }, []);

  // Grid glow breathing animation
  useEffect(() => {
    if (puzzle && !showVictory) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(gridGlowAnim, { toValue: 1, duration: 2000, useNativeDriver: false }),
          Animated.timing(gridGlowAnim, { toValue: 0, duration: 2000, useNativeDriver: false }),
        ])
      ).start();
    }
    return () => {
      gridGlowAnim.stopAnimation();
    };
  }, [puzzle, showVictory]);

  // Animate progress bar when words are found
  useEffect(() => {
    if (puzzle && puzzle.placedWords.length > 0) {
      const progress = foundWords.size / puzzle.placedWords.length;
      Animated.spring(progressAnim, {
        toValue: progress,
        tension: 60,
        friction: 8,
        useNativeDriver: false,
      }).start();
    }
  }, [foundWords.size, puzzle]);

  // Timer interval effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimeSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning]);

  /**
   * Generates a completely fresh, instant puzzle locally (< 10ms)
   * Guaranteed zero loading lag and true randomness.
   */
  const createLocalPuzzle = useCallback(
    (
      catId: string,
      diff: DifficultyTier,
      seedStr?: string,
      overrideWords?: WordEntry[]
    ) => {
      const currentConfig =
        DIFFICULTY_CONFIGS.find((d) => d.id === diff) || DIFFICULTY_CONFIGS[1];

      let wordsToUse: WordEntry[];
      let mysteryWordItem: WordEntry | undefined;

      if (overrideWords && overrideWords.length > 0) {
        wordsToUse = overrideWords;
      } else {
        const sampled = sampleCategoryWords(catId, currentConfig.wordCount, diff);
        wordsToUse = sampled.selectedWords;
        mysteryWordItem = sampled.mysteryWord;
      }

      // Generate grid with difficulty constraints and secret mystery word
      const newPuzzle = generateWordSearchPuzzle(
        wordsToUse,
        currentConfig.size,
        seedStr,
        diff,
        mysteryWordItem
      );

      setPuzzle(newPuzzle);
      setFoundWords(new Set());
      updateTapAnchor(null);
      updateSelectionCells([]);
      setTimeSeconds(0);
      setIsTimerRunning(true);
      setHintsLeft(diff === "hard" ? 1 : diff === "medium" ? 2 : 3);
      setHintedCell(null);
      setComboCount(0);
      setRevealedMystery(null);
      lastFoundTimestampRef.current = 0;
      setLoading(false);
      progressAnim.setValue(0);

      return newPuzzle;
    },
    []
  );

  /**
   * Initializes or refreshes daily challenge
   */
  const loadDailyChallenge = useCallback(
    async (diff: DifficultyTier = difficulty) => {
      const todayDateStr = new Date().toISOString().slice(0, 10);
      const catId = "nepal_heritage";

      // 1. Immediately render local puzzle using deterministic date seed (ZERO LAG!)
      createLocalPuzzle(catId, diff, todayDateStr);

      // 2. Fetch server daily metadata in background for leaderboard / scores
      try {
        const res = await getDailyWordSearch();
        setDailyData(res);
      } catch (err) {
        // Safe silent fallback - offline mode already working
      }
    },
    [difficulty, createLocalPuzzle]
  );

  /**
   * Starts a randomized free play practice session with true randomness
   */
  const startFreePlaySession = useCallback(
    (catId: string, diff: DifficultyTier) => {
      setSelectedCategory(catId);
      setDifficulty(diff);
      const uniqueSeed = `${catId}-${Date.now()}-${Math.random()}`;
      createLocalPuzzle(catId, diff, uniqueSeed);
    },
    [createLocalPuzzle]
  );

  /**
   * INITIAL MOUNT HOOK: Generates the board immediately upon opening the screen
   */
  useEffect(() => {
    loadDailyChallenge();
  }, []);

  // Compute map of cell coordinate -> found word color
  const cellColorMap = useMemo(() => {
    const map = new Map<string, string>();
    if (!puzzle) return map;

    for (const pw of puzzle.placedWords) {
      if (foundWords.has(pw.word)) {
        for (const c of pw.cells) {
          map.set(`${c.row},${c.col}`, pw.color);
        }
      }
    }

    // If mystery word is revealed at victory, highlight its cells with gold glow
    if (revealedMystery) {
      for (const c of revealedMystery.cells) {
        map.set(`${c.row},${c.col}`, MYSTERY_COLOR);
      }
    }

    return map;
  }, [puzzle, foundWords, revealedMystery]);

  // Check victory condition when all words are found
  const checkVictory = useCallback(
    async (updatedFound: Set<string>) => {
      if (!puzzleRef.current) return;
      const currentPuzzle = puzzleRef.current;
      if (updatedFound.size === currentPuzzle.placedWords.length) {
        setIsTimerRunning(false);
        SoundEffects.playVictory();

        // Reveal secret mystery word if one was embedded in the puzzle
        if (currentPuzzle.mysteryWord) {
          setRevealedMystery(currentPuzzle.mysteryWord);
        }

        // Calculate stars based on completion time & difficulty
        let earnedStars = 3;
        const timeLimit = difficulty === "easy" ? 90 : difficulty === "medium" ? 150 : 210;
        if (timeSeconds > timeLimit * 1.5) {
          earnedStars = 1;
        } else if (timeSeconds > timeLimit) {
          earnedStars = 2;
        }
        setStars(earnedStars);

        // Calculate XP reward
        const baseBonus = difficulty === "easy" ? 25 : difficulty === "medium" ? 35 : 50;
        const mysteryBonus = currentPuzzle.mysteryWord ? 20 : 0;
        const totalXp = baseBonus + earnedStars * 5 + mysteryBonus;
        setAwardedXp(totalXp);
        setShowVictory(true);

        // Submit score if in daily mode
        if (gameMode === "daily") {
          try {
            setSubmitting(true);
            await submitWordSearch({
              puzzleDate: dailyData?.puzzleDate || new Date().toISOString().slice(0, 10),
              category: selectedCategory,
              timeSeconds,
              wordsFound: updatedFound.size,
              totalWords: currentPuzzle.placedWords.length,
              stars: earnedStars,
            });
            refreshUser();
          } catch (err) {
            queueOfflineSubmission("wordsearch", "/api/wordsearch/submit", {
              puzzleDate: dailyData?.puzzleDate || new Date().toISOString().slice(0, 10),
              category: selectedCategory,
              timeSeconds,
              wordsFound: updatedFound.size,
              totalWords: currentPuzzle.placedWords.length,
              stars: earnedStars,
            });
          } finally {
            setSubmitting(false);
          }
        }
      }
    },
    [gameMode, dailyData, selectedCategory, timeSeconds, difficulty, refreshUser]
  );

  // Evaluate if given cells match an unfound placed word
  const checkWordMatch = useCallback(
    (cells: { row: number; col: number }[]) => {
      const currentPuzzle = puzzleRef.current;
      const currentFound = foundWordsRef.current;
      if (!currentPuzzle || cells.length < 2) return false;

      const forwardChars = cells.map((c) => currentPuzzle.grid[c.row][c.col]).join("");
      const backwardChars = [...forwardChars].reverse().join("");

      let matchedWord: PlacedWord | null = null;
      for (const pw of currentPuzzle.placedWords) {
        if (!currentFound.has(pw.word)) {
          if (pw.word === forwardChars || pw.word === backwardChars) {
            matchedWord = pw;
            break;
          }
        }
      }

      if (matchedWord) {
        SoundEffects.playCorrect();
        Vibration.vibrate(40);

        // Celebrate found word with cell pulse animation
        Animated.sequence([
          Animated.timing(cellFoundAnim, { toValue: 1.15, duration: 120, useNativeDriver: true }),
          Animated.timing(cellFoundAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
        ]).start();

        // Combo calculation: found within 15 seconds
        const now = Date.now();
        if (lastFoundTimestampRef.current > 0 && now - lastFoundTimestampRef.current < 15000) {
          setComboCount((prev) => {
            const next = prev + 1;
            Animated.sequence([
              Animated.timing(comboScaleAnim, { toValue: 1.3, duration: 150, useNativeDriver: true }),
              Animated.timing(comboScaleAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
            ]).start();
            return next;
          });
        } else {
          setComboCount(1);
        }
        lastFoundTimestampRef.current = now;

        const nextFound = new Set(currentFound);
        nextFound.add(matchedWord.word);
        setFoundWords(nextFound);
        setSelectedClue(matchedWord);

        const currentHinted = hintedCellRef.current;
        if (currentHinted && currentHinted.row === matchedWord.startRow && currentHinted.col === matchedWord.startCol) {
          setHintedCell(null);
        }

        checkVictory(nextFound);
        return true;
      }
      return false;
    },
    [checkVictory, comboScaleAnim, cellFoundAnim]
  );

  /**
   * Measure grid position using measureInWindow for scroll-proof coordinates.
   * measureInWindow returns absolute screen coordinates regardless of scroll state.
   */
  const measureGridNow = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      if (gridContainerRef.current) {
        gridContainerRef.current.measureInWindow((x, y, width, height) => {
          if (width > 0 && height > 0) {
            gridLayoutRef.current = { x, y, width, height };
          }
          resolve();
        });
      } else {
        resolve();
      }
    });
  }, []);

  /**
   * Convert absolute screen touch coordinates to grid cell.
   * Uses the EXACT same sizing math as the render layout to eliminate offset drift.
   */
  const touchToCell = useCallback(
    (pageX: number, pageY: number, gridSize: number): { row: number; col: number } => {
      const layout = gridLayoutRef.current;
      const { cellSize } = computeGridMetrics(gridSize);

      // Local coordinates within the grid container, accounting for container padding
      const localX = pageX - layout.x - GRID_CONTAINER_PADDING;
      const localY = pageY - layout.y - GRID_CONTAINER_PADDING;

      // Divide by (cellSize + gap) to get cell index
      const col = Math.max(0, Math.min(gridSize - 1, Math.floor(localX / (cellSize + CELL_GAP))));
      const row = Math.max(0, Math.min(gridSize - 1, Math.floor(localY / (cellSize + CELL_GAP))));
      return { row, col };
    },
    []
  );

  // Debounced vibration helper
  const vibrateDebounced = useCallback((ms: number = 8) => {
    const now = Date.now();
    if (now - lastVibrationRef.current > 30) {
      lastVibrationRef.current = now;
      Vibration.vibrate(ms);
    }
  }, []);

  /**
   * PanResponder with ref-based state access — NO stale closures.
   * Dependencies are minimal and stable: only utility functions.
   */
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
          const currentPuzzle = puzzleRef.current;
          if (!currentPuzzle) return;
          const { pageX, pageY } = evt.nativeEvent;

          // Re-measure grid position on EVERY touch start for scroll-proof accuracy
          if (gridContainerRef.current) {
            gridContainerRef.current.measureInWindow((x, y, width, height) => {
              if (width > 0 && height > 0) {
                gridLayoutRef.current = { x, y, width, height };
              }

              setIsDragging(true);

              const cell = touchToCell(pageX, pageY, currentPuzzle.size);
              startCellRef.current = cell;
              currentCellRef.current = cell;

              const anchor = tapAnchorRef.current;
              if (!anchor) {
                selectionCellsRef.current = [cell];
                setSelectionCellsState([cell]);
              } else {
                const previewLine = getStraightLineCells(anchor.row, anchor.col, cell.row, cell.col);
                selectionCellsRef.current = previewLine;
                setSelectionCellsState(previewLine);
              }
              SoundEffects.playTap();
            });
          }
        },

        onPanResponderMove: (evt) => {
          const currentPuzzle = puzzleRef.current;
          if (!startCellRef.current || !currentPuzzle) return;
          const { pageX, pageY } = evt.nativeEvent;

          const cell = touchToCell(pageX, pageY, currentPuzzle.size);

          if (cell.row !== currentCellRef.current?.row || cell.col !== currentCellRef.current?.col) {
            currentCellRef.current = cell;
            vibrateDebounced(8);
            const fromCell = tapAnchorRef.current || startCellRef.current;
            const line = getStraightLineCells(fromCell.row, fromCell.col, cell.row, cell.col);
            selectionCellsRef.current = line;
            setSelectionCellsState(line);
          }
        },

        onPanResponderRelease: () => {
          setIsDragging(false);
          const currentPuzzle = puzzleRef.current;
          if (!currentPuzzle || !startCellRef.current) {
            selectionCellsRef.current = [];
            setSelectionCellsState([]);
            startCellRef.current = null;
            currentCellRef.current = null;
            return;
          }

          const tappedCell = startCellRef.current;
          const currentSelection = selectionCellsRef.current;
          const anchor = tapAnchorRef.current;
          const wasMultiCellDrag = currentSelection.length > 1;

          if (wasMultiCellDrag && !anchor) {
            const matched = checkWordMatch(currentSelection);
            if (!matched) {
              SoundEffects.playCardFlip();
            }
            selectionCellsRef.current = [];
            setSelectionCellsState([]);
            tapAnchorRef.current = null;
            setTapAnchorState(null);
          } else {
            if (!anchor) {
              tapAnchorRef.current = tappedCell;
              setTapAnchorState(tappedCell);
              selectionCellsRef.current = [tappedCell];
              setSelectionCellsState([tappedCell]);
              SoundEffects.playTap();
            } else {
              if (anchor.row === tappedCell.row && anchor.col === tappedCell.col) {
                tapAnchorRef.current = null;
                setTapAnchorState(null);
                selectionCellsRef.current = [];
                setSelectionCellsState([]);
                SoundEffects.playTap();
              } else {
                const line = getStraightLineCells(anchor.row, anchor.col, tappedCell.row, tappedCell.col);
                selectionCellsRef.current = line;
                setSelectionCellsState(line);
                const matched = checkWordMatch(line);
                if (matched) {
                  tapAnchorRef.current = null;
                  setTapAnchorState(null);
                  selectionCellsRef.current = [];
                  setSelectionCellsState([]);
                } else {
                  SoundEffects.playTap();
                  tapAnchorRef.current = tappedCell;
                  setTapAnchorState(tappedCell);
                  selectionCellsRef.current = [tappedCell];
                  setSelectionCellsState([tappedCell]);
                }
              }
            }
          }

          startCellRef.current = null;
          currentCellRef.current = null;
        },

        onPanResponderTerminate: () => {
          setIsDragging(false);
          selectionCellsRef.current = [];
          setSelectionCellsState([]);
          startCellRef.current = null;
          currentCellRef.current = null;
        },
      }),
    [touchToCell, checkWordMatch, vibrateDebounced]
  );

  // Use a hint to highlight the first letter of an unfound word
  const handleUseHint = () => {
    if (!puzzle || hintsLeft <= 0) {
      Alert.alert(
        lang === "ne" ? "सङ्केत समाप्त" : "No Hints Left",
        lang === "ne" ? "तपाईंले सबै ३ सङ्केतहरू प्रयोग गरिसक्नुभयो।" : "You have used all 3 hints for this puzzle."
      );
      return;
    }

    const unfound = puzzle.placedWords.filter((pw) => !foundWords.has(pw.word));
    if (unfound.length === 0) return;

    const target = unfound[0];
    setHintedCell({ row: target.startRow, col: target.startCol });
    setHintsLeft((prev) => prev - 1);
    setSelectedClue(target);
    SoundEffects.playTap();

    pulseAnim.setValue(1);
    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.35, duration: 220, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1.0, duration: 220, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1.25, duration: 180, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1.0, duration: 180, useNativeDriver: true }),
    ]).start();
  };

  // Format seconds to mm:ss
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const activeCategoryMeta = useMemo(() => {
    return (
      categoryList.find((c) => c.id === selectedCategory) || {
        id: "nepal_heritage",
        titleEn: "Nepal Heritage",
        titleNe: "नेपाली सम्पदा",
        icon: "🏔️",
      }
    );
  }, [categoryList, selectedCategory]);

  // Animated border color for grid glow
  const gridBorderColor = gridGlowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border, colors.primary + "80"],
  });

  const gridShadowOpacity = gridGlowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 0.5],
  });

  // Compute progress percentage for progress bar
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <Atmosphere>
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        {/* Top App Header */}
        <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.iconButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          accessibilityLabel="Go back"
        >
          <Text style={[styles.backText, { color: colors.text }]}>←</Text>
        </TouchableOpacity>

        <View style={styles.titleContainer}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {lang === "ne" ? "शब्द खोज" : "Word Search"}
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
            {gameMode === "daily"
              ? lang === "ne"
                ? "🌟 दैनिक चुनौती (Daily)"
                : "🌟 Daily Synchronized"
              : `${activeCategoryMeta.icon} ${lang === "ne" ? activeCategoryMeta.titleNe : activeCategoryMeta.titleEn}`}
          </Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => setShowRules(true)}
            style={[styles.iconButton, { backgroundColor: colors.surface, borderColor: colors.border, marginRight: 8 }]}
          >
            <Text style={styles.actionIcon}>❓</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={toggleSound}
            style={[styles.iconButton, { backgroundColor: colors.surface, borderColor: colors.border, marginRight: 8 }]}
          >
            <Text style={styles.actionIcon}>{isSoundEnabled ? "🔊" : "🔇"}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleUseHint}
            style={[styles.hintButton, {
              backgroundColor: colors.accent + "18",
              borderColor: colors.accent + "60",
            }]}
          >
            <Text style={[styles.hintButtonText, { color: colors.accent }]}>💡 {hintsLeft}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Mode & Difficulty Segmented Controls */}
      <View style={styles.controlsRow}>
        {/* Game Mode Tab */}
        <View style={[styles.segmentedPillContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[
              styles.segmentOption,
              gameMode === "daily" && [styles.activeSegment, { backgroundColor: colors.primary }],
            ]}
            onPress={() => {
              setGameMode("daily");
              loadDailyChallenge();
            }}
          >
            <Text
              style={[
                styles.segmentText,
                { color: gameMode === "daily" ? "#FFF" : colors.textMuted },
              ]}
            >
              🌟 {lang === "ne" ? "दैनिक" : "Daily"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentOption,
              gameMode === "practice" && [styles.activeSegment, { backgroundColor: colors.primary }],
            ]}
            onPress={() => {
              setGameMode("practice");
              startFreePlaySession(selectedCategory, difficulty);
            }}
          >
            <Text
              style={[
                styles.segmentText,
                { color: gameMode === "practice" ? "#FFF" : colors.textMuted },
              ]}
            >
              🎮 {lang === "ne" ? "अभ्यास" : "Practice"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Difficulty Tier Selector */}
        <View style={[styles.difficultySelector, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {DIFFICULTY_CONFIGS.map((d) => {
            const isDiffActive = difficulty === d.id;
            return (
              <TouchableOpacity
                key={d.id}
                style={[
                  styles.diffButton,
                  isDiffActive && [styles.activeDiffButton, { backgroundColor: colors.accent }],
                ]}
                onPress={() => {
                  setDifficulty(d.id);
                  if (gameMode === "daily") {
                    loadDailyChallenge(d.id);
                  } else {
                    startFreePlaySession(selectedCategory, d.id);
                  }
                  SoundEffects.playTap();
                }}
              >
                <Text
                  style={[
                    styles.diffButtonText,
                    { color: isDiffActive ? "#1E293B" : colors.textMuted },
                  ]}
                >
                  {d.icon} {lang === "ne" ? d.labelNe : d.labelEn}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Category Pills (Practice Mode) */}
      {gameMode === "practice" && (
        <View style={styles.categoryScrollContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryPills}
          >
            {categoryList.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryPill,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.surface,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => startFreePlaySession(cat.id, difficulty)}
                >
                  <Text style={styles.categoryPillIcon}>{cat.icon}</Text>
                  <Text
                    style={[
                      styles.categoryPillText,
                      { color: isSelected ? "#FFF" : colors.text },
                    ]}
                  >
                    {lang === "ne" ? cat.titleNe : cat.titleEn}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Glassmorphic Stats & Live HUD Bar */}
      <View style={[styles.statsBar, { backgroundColor: colors.surface + "E0", borderColor: colors.border }]}>
        <View style={styles.statBadge}>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>
            {lang === "ne" ? "समय" : "Time"}
          </Text>
          <Text style={[styles.statValue, { color: colors.text }]}>⏱️ {formatTime(timeSeconds)}</Text>
        </View>

        <View style={styles.statBadge}>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>
            {lang === "ne" ? "शब्दहरू" : "Words"}
          </Text>
          <Text style={[styles.statValue, { color: colors.text }]}>
            🎯 {foundWords.size} / {puzzle?.placedWords.length || 0}
          </Text>
        </View>

        {/* Combo Multiplier Streak */}
        {comboCount > 1 ? (
          <Animated.View style={[styles.comboBadge, { transform: [{ scale: comboScaleAnim }] }]}>
            <Text style={styles.comboText}>🔥 {comboCount}x COMBO!</Text>
          </Animated.View>
        ) : (
          <View style={styles.statBadge}>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>
              {lang === "ne" ? "अङ्क" : "XP"}
            </Text>
            <Text style={[styles.statValue, { color: colors.accent }]}>⭐ +35 XP</Text>
          </View>
        )}

        {/* Instant Shuffle / Regenerate Button */}
        <TouchableOpacity
          style={[styles.shuffleButton, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "50" }]}
          onPress={() => {
            SoundEffects.playTap();
            if (gameMode === "practice") {
              startFreePlaySession(selectedCategory, difficulty);
            } else {
              loadDailyChallenge();
            }
          }}
        >
          <Text style={[styles.shuffleButtonText, { color: colors.primary }]}>
            🔄 {lang === "ne" ? "नयाँ" : "New"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Animated Progress Bar */}
      {puzzle && (
        <View style={[styles.progressBarContainer, { backgroundColor: colors.surface }]}>
          <Animated.View
            style={[
              styles.progressBarFill,
              {
                width: progressWidth,
                backgroundColor: foundWords.size === puzzle.placedWords.length ? colors.green : colors.primary,
              },
            ]}
          />
        </View>
      )}

      {/* Main Board View — Grid is OUTSIDE ScrollView to prevent touch offset issues */}
      {loading || !puzzle ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>
            {lang === "ne" ? "पजल तयार गरिँदै..." : "Generating puzzle..."}
          </Text>
        </View>
      ) : (
        <View style={styles.gameArea}>
          {/* Active Clue Notification Banner */}
          {selectedClue && (
            <TouchableOpacity
              style={[
                styles.clueBanner,
                { backgroundColor: selectedClue.color + "15", borderColor: selectedClue.color + "50" },
              ]}
              onPress={() => setClueModalVisible(true)}
            >
              <View style={styles.clueBannerLeft}>
                <Text style={[styles.clueBannerWord, { color: selectedClue.color }]}>
                  ✓ {selectedClue.word}
                </Text>
                <Text style={[styles.clueBannerText, { color: colors.text }]} numberOfLines={1}>
                  💡 {lang === "ne" ? selectedClue.clueNe : selectedClue.clueEn}
                </Text>
              </View>
              <Text style={styles.clueBannerDetailIcon}>ℹ️</Text>
            </TouchableOpacity>
          )}

          {/* Tap-to-Connect Prompt */}
          {tapAnchorState && (
            <View style={[styles.clueBanner, { backgroundColor: colors.accent + "15", borderColor: colors.accent + "50" }]}>
              <Text style={[styles.clueBannerWord, { color: colors.accent }]}>
                📍 {lang === "ne" ? "सुरुको अक्षर छानियो" : "Start Letter Selected"}
              </Text>
              <Text style={[styles.clueBannerText, { color: colors.text }]}>
                {lang === "ne"
                  ? "अब अन्तिम अक्षर थिचेर जोड्नुहोस्, वा फेरि थिचेर हटाउनुहोस्।"
                  : "Tap the final letter to connect, or tap again to cancel."}
              </Text>
            </View>
          )}

          {/* Attractive Letter Grid with PanResponder — positioned outside ScrollView */}
          <Animated.View
            style={[
              styles.gridOuterGlow,
              {
                borderColor: gridBorderColor,
                shadowColor: colors.primary,
                shadowOpacity: gridShadowOpacity as any,
              },
            ]}
          >
            <View
              ref={gridContainerRef}
              style={[
                styles.gridContainer,
                {
                  width: MAX_BOARD_WIDTH,
                  height: MAX_BOARD_WIDTH,
                  backgroundColor: colors.bg,
                  borderColor: colors.border + "60",
                  padding: GRID_CONTAINER_PADDING,
                },
              ]}
              onLayout={() => {
                // Initial measurement after layout
                setTimeout(() => measureGridNow(), 50);
              }}
              {...panResponder.panHandlers}
            >
              {puzzle.grid.map((rowArr, rIdx) => (
                <View key={`row-${rIdx}`} style={styles.gridRow} pointerEvents="none">
                  {rowArr.map((letter, cIdx) => {
                    const key = `${rIdx},${cIdx}`;
                    const isFound = cellColorMap.has(key);
                    const foundColor = cellColorMap.get(key) || colors.primary;

                    const isSelected = selectionCellsState.some((c) => c.row === rIdx && c.col === cIdx);
                    const isAnchor = tapAnchorState?.row === rIdx && tapAnchorState?.col === cIdx;
                    const isHinted = hintedCell && hintedCell.row === rIdx && hintedCell.col === cIdx;

                    let cellBg = colors.surface;
                    let cellTextColor = colors.text;
                    let cellBorderColor = "transparent";

                    if (isFound) {
                      cellBg = foundColor;
                      cellTextColor = "#FFFFFF";
                      cellBorderColor = foundColor;
                    } else if (isSelected) {
                      cellBg = colors.primary;
                      cellTextColor = "#FFFFFF";
                      cellBorderColor = colors.primary;
                    } else if (isAnchor) {
                      cellBg = colors.accent + "30";
                      cellTextColor = colors.accent;
                      cellBorderColor = colors.accent;
                    }

                    const { cellSize } = computeGridMetrics(puzzle.size);

                    return (
                      <Animated.View
                        key={`cell-${rIdx}-${cIdx}`}
                        pointerEvents="none"
                        style={[
                          styles.cell,
                          {
                            width: cellSize,
                            height: cellSize,
                            backgroundColor: cellBg,
                            borderRadius: puzzle.size >= 16 ? 4 : puzzle.size > 10 ? 6 : 8,
                            borderColor: cellBorderColor,
                            borderWidth: isFound || isAnchor ? 1.5 : 0.5,
                            shadowColor: isFound ? foundColor : "transparent",
                            shadowOpacity: isFound ? 0.4 : 0,
                            shadowRadius: isFound ? 6 : 0,
                            shadowOffset: { width: 0, height: isFound ? 2 : 0 },
                            elevation: isFound ? 4 : 1,
                          },
                          isSelected && {
                            transform: [{ scale: 1.06 }],
                            zIndex: 10,
                            borderWidth: 1.5,
                          },
                          isHinted && {
                            borderColor: colors.accent,
                            borderWidth: 2.5,
                            transform: [{ scale: pulseAnim as any }],
                          },
                        ]}
                      >
                        <Text
                          pointerEvents="none"
                          style={[
                            styles.cellLetter,
                            {
                              color: cellTextColor,
                              fontSize:
                                puzzle.size >= 16
                                  ? 11.5
                                  : puzzle.size >= 13
                                  ? 13
                                  : puzzle.size === 10
                                  ? 15
                                  : 17,
                              fontWeight: isFound || isSelected ? "800" : "600",
                              textShadowColor: isFound ? "rgba(0,0,0,0.3)" : "transparent",
                              textShadowOffset: { width: 0, height: 1 },
                              textShadowRadius: isFound ? 2 : 0,
                            },
                          ]}
                        >
                          {letter}
                        </Text>
                      </Animated.View>
                    );
                  })}
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Word Bank Card with Interactive Chips — inside a scroll area below grid */}
          <ScrollView
            style={styles.wordBankScroll}
            contentContainerStyle={styles.wordBankScrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
            overScrollMode="never"
            keyboardShouldPersistTaps="handled"
          >
            <Card style={[styles.wordBankCard, { borderColor: colors.border }]}>
              <View style={styles.wordBankHeader}>
                <Text style={[styles.wordBankTitle, { color: colors.text }]}>
                  📝 {lang === "ne" ? "खोज्नुपर्ने शब्दहरू" : "Word Bank"} ({foundWords.size}/
                  {puzzle.placedWords.length})
                </Text>
                <Text style={[styles.wordBankSub, { color: colors.textMuted }]}>
                  {lang === "ne"
                    ? "औँला तान्नुहोस् वा अक्षर थिच्नुहोस् • अर्थ हेर्न शब्द छुनुहोस्"
                    : "Swipe across letters • Tap word to see meaning"}
                </Text>
              </View>

              <View style={styles.wordBankGrid}>
                {puzzle.placedWords.map((pw) => {
                  const isFound = foundWords.has(pw.word);
                  return (
                    <TouchableOpacity
                      key={pw.word}
                      style={[
                        styles.wordChip,
                        {
                          backgroundColor: isFound ? pw.color + "20" : colors.surface,
                          borderColor: isFound ? pw.color : colors.border,
                          borderWidth: isFound ? 1.5 : 1,
                        },
                      ]}
                      onPress={() => {
                        setSelectedClue(pw);
                        setClueModalVisible(true);
                        SoundEffects.playTap();
                      }}
                    >
                      <Text
                        style={[
                          styles.wordChipText,
                          {
                            color: isFound ? pw.color : colors.text,
                            textDecorationLine: isFound ? "line-through" : "none",
                            fontWeight: isFound ? "800" : "600",
                          },
                        ]}
                      >
                        {isFound ? "✓ " : "○ "}
                        {pw.word}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Card>
          </ScrollView>
        </View>
      )}

      {/* Bilingual Clue Detail Bottom Sheet / Modal */}
      <Modal
        visible={clueModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setClueModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.clueModalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.clueModalHeader}>
              <View style={[styles.clueModalWordBadge, { backgroundColor: (selectedClue?.color || colors.primary) + "20" }]}>
                <Text style={[styles.clueModalWord, { color: selectedClue?.color || colors.primary }]}>
                  {selectedClue?.word}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setClueModalVisible(false)}
                style={[styles.closeModalButton, { backgroundColor: colors.bg }]}
              >
                <Text style={[styles.closeModalText, { color: colors.textMuted }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.clueModalBody}>
              <View style={[styles.clueSection, { backgroundColor: colors.bg + "80" }]}>
                <Text style={[styles.clueSectionHeader, { color: colors.textMuted }]}>
                  🇳🇵 नेपाली अर्थ (Nepali Context):
                </Text>
                <Text style={[styles.clueSectionText, { color: colors.text }]}>
                  {selectedClue?.clueNe || "सम्पदासँग सम्बन्धित"}
                </Text>
              </View>

              <View style={[styles.clueSection, { marginTop: 12, backgroundColor: colors.bg + "80" }]}>
                <Text style={[styles.clueSectionHeader, { color: colors.textMuted }]}>
                  🇬🇧 English Definition & Clue:
                </Text>
                <Text style={[styles.clueSectionText, { color: colors.text }]}>
                  {selectedClue?.clueEn || "Related to culture and knowledge"}
                </Text>
              </View>
            </View>

            <PrimaryButton
              label={lang === "ne" ? "बुझेँ (Got it)" : "Got it!"}
              onPress={() => setClueModalVisible(false)}
              style={{ marginTop: 16 }}
            />
          </View>
        </View>
      </Modal>

      {/* Victory Celebration Modal */}
      <Modal visible={showVictory} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <ConfettiEffect count={70} />
          <View style={[styles.victoryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={styles.victoryEmoji}>🏆</Text>
            <Text style={[styles.victoryTitle, { color: colors.text }]}>
              {lang === "ne" ? "उत्कृष्ट! शब्दहरू भेट्टाउनुभयो!" : "Splendid! Puzzle Solved!"}
            </Text>
            <Text style={[styles.victorySub, { color: colors.textMuted }]}>
              {lang === "ne"
                ? `तपाईंले ${formatTime(timeSeconds)} मा सबै शब्दहरू पत्ता लगाउनुभयो!`
                : `You discovered all words in ${formatTime(timeSeconds)}!`}
            </Text>

            {/* Star Rating */}
            <View style={styles.starsRow}>
              {[1, 2, 3].map((s) => (
                <Text key={s} style={[styles.starIcon, { opacity: s <= stars ? 1 : 0.25 }]}>
                  ⭐
                </Text>
              ))}
            </View>

            {/* Secret Mystery Word Reveal Card */}
            {revealedMystery && (
              <View style={[styles.mysteryWordCard, { borderColor: colors.gold || "#FFD700" }]}>
                <Text style={styles.mysteryWordLabel}>
                  ✨ {lang === "ne" ? "रहस्यमय शब्द खुल्यो!" : "SECRET MYSTERY WORD REVEALED!"}
                </Text>
                <Text style={styles.mysteryWordTitle}>{revealedMystery.word}</Text>
                <Text style={styles.mysteryWordSub}>
                  {lang === "ne" ? revealedMystery.clueNe : revealedMystery.clueEn}
                </Text>
                <Text style={styles.mysteryXpBonus}>+20 BONUS XP!</Text>
              </View>
            )}

            {/* XP Award Pill */}
            <View style={[styles.xpPill, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "40" }]}>
              <Text style={[styles.xpPillText, { color: colors.primary }]}>
                +{awardedXp} XP EARNED
              </Text>
            </View>

            {/* Victory Actions */}
            <View style={styles.victoryActions}>
              <PrimaryButton
                label={lang === "ne" ? "अर्को बोर्ड खेल्नुहोस्" : "Play Next Board"}
                onPress={() => {
                  setShowVictory(false);
                  setGameMode("practice");
                  startFreePlaySession(selectedCategory, difficulty);
                }}
                style={{ marginBottom: 10 }}
              />
              <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: colors.border }]}
                onPress={() => {
                  setShowVictory(false);
                  navigation.goBack();
                }}
              >
                <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
                  {lang === "ne" ? "खेल पृष्ठमा फर्कनुहोस्" : "Back to Games"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <GameRulesModal
        visible={showRules}
        gameId="wordSearch"
        onClose={() => setShowRules(false)}
      />
    </SafeAreaView>
  </Atmosphere>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    ...shadow.sm,
  },
  backText: {
    fontSize: 20,
    fontWeight: "700",
  },
  titleContainer: {
    alignItems: "center",
    flex: 1,
    marginHorizontal: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 1,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionIcon: {
    fontSize: 16,
  },
  hintButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1.2,
  },
  hintButtonText: {
    fontSize: 13,
    fontWeight: "700",
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    marginTop: 6,
    gap: 8,
  },
  segmentedPillContainer: {
    flexDirection: "row",
    borderRadius: radius.pill,
    padding: 3,
    borderWidth: 1,
    ...shadow.sm,
  },
  segmentOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  activeSegment: {
    ...shadow.nepalButton,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: "700",
  },
  difficultySelector: {
    flexDirection: "row",
    borderRadius: radius.pill,
    padding: 3,
    borderWidth: 1,
    ...shadow.sm,
  },
  diffButton: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  activeDiffButton: {
    ...shadow.nepalButton,
  },
  diffButtonText: {
    fontSize: 11,
    fontWeight: "700",
  },
  categoryScrollContainer: {
    marginTop: 8,
  },
  categoryPills: {
    paddingHorizontal: spacing.md,
    gap: 8,
  },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1.2,
  },
  categoryPillIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: "700",
  },
  statsBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginHorizontal: spacing.md,
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    ...shadow.sm,
  },
  statBadge: {
    alignItems: "center",
  },
  statLabel: {
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 12,
    fontWeight: "800",
    marginTop: 2,
  },
  comboBadge: {
    backgroundColor: "#F97316",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    ...shadow.nepalButton,
  },
  comboText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  shuffleButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1.2,
  },
  shuffleButtonText: {
    fontSize: 11,
    fontWeight: "800",
  },
  progressBarContainer: {
    marginHorizontal: spacing.md,
    marginTop: 6,
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 2,
  },
  loaderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: "600",
  },
  gameArea: {
    flex: 1,
    alignItems: "center",
    paddingTop: 6,
  },
  clueBanner: {
    width: MAX_BOARD_WIDTH,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 6,
  },
  clueBannerLeft: {
    flex: 1,
  },
  clueBannerWord: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1,
  },
  clueBannerText: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 1,
  },
  clueBannerDetailIcon: {
    fontSize: 14,
    marginLeft: 8,
  },
  gridOuterGlow: {
    borderRadius: 18,
    borderWidth: 2,
    padding: 0,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  gridContainer: {
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: "space-between",
    overflow: "hidden",
  },
  gridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cell: {
    alignItems: "center",
    justifyContent: "center",
  },
  cellLetter: {
    fontFamily: fonts.bodyBold,
    textAlign: "center",
  },
  wordBankScroll: {
    flex: 1,
    width: "100%",
    marginTop: 8,
  },
  wordBankScrollContent: {
    alignItems: "center",
    paddingBottom: 30,
    paddingHorizontal: spacing.md,
  },
  wordBankCard: {
    width: MAX_BOARD_WIDTH,
    padding: 12,
    borderRadius: 16,
  },
  wordBankHeader: {
    marginBottom: 8,
  },
  wordBankTitle: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  wordBankSub: {
    fontSize: 10,
    marginTop: 2,
    lineHeight: 14,
  },
  wordBankGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  wordChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  wordChipText: {
    fontSize: 12,
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.md,
  },
  clueModalCard: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 22,
    borderWidth: 1,
    padding: spacing.lg,
    ...shadow.card,
  },
  clueModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  clueModalWordBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  clueModalWord: {
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  closeModalButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  closeModalText: {
    fontSize: 16,
    fontWeight: "700",
  },
  clueModalBody: {
    marginVertical: 8,
  },
  clueSection: {
    padding: 12,
    borderRadius: 12,
  },
  clueSectionHeader: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  clueSectionText: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  victoryCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 24,
    borderWidth: 1,
    padding: spacing.xl,
    alignItems: "center",
    ...shadow.card,
  },
  victoryEmoji: {
    fontSize: 48,
  },
  victoryTitle: {
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 8,
  },
  victorySub: {
    fontSize: 13,
    textAlign: "center",
    marginTop: 4,
  },
  starsRow: {
    flexDirection: "row",
    marginVertical: 12,
    gap: 6,
  },
  starIcon: {
    fontSize: 32,
  },
  mysteryWordCard: {
    width: "100%",
    backgroundColor: "rgba(255, 215, 0, 0.12)",
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 10,
    alignItems: "center",
    marginVertical: 10,
  },
  mysteryWordLabel: {
    color: "#D97706",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
  mysteryWordTitle: {
    color: "#B45309",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 2,
    marginTop: 2,
  },
  mysteryWordSub: {
    fontSize: 11,
    color: "#92400E",
    textAlign: "center",
    marginTop: 2,
  },
  mysteryXpBonus: {
    fontSize: 11,
    fontWeight: "900",
    color: "#16A34A",
    marginTop: 4,
  },
  xpPill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    marginBottom: 16,
  },
  xpPillText: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 1,
  },
  victoryActions: {
    width: "100%",
  },
  secondaryButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
