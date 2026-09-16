import { useNavigation } from "@react-navigation/native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getDailyWordSearch, submitWordSearch } from "../api/client";
import { DailyWordSearchResponse } from "../api/types";
import { Atmosphere } from "../components/Atmosphere";
import { Card } from "../components/Card";
import { ConfettiEffect } from "../components/ConfettiEffect";
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

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_PADDING = spacing.md * 2;
const MAX_BOARD_WIDTH = Math.min(SCREEN_WIDTH - GRID_PADDING, 390);

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
  { id: "easy", labelEn: "Easy", labelNe: "सजिलो", size: 8, wordCount: 5, icon: "🌱" },
  { id: "medium", labelEn: "Medium", labelNe: "मध्यम", size: 10, wordCount: 7, icon: "⚡" },
  { id: "hard", labelEn: "Hard", labelNe: "कडा", size: 12, wordCount: 9, icon: "🔥" },
];

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

  // Selection & Touch
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [tapAnchor, setTapAnchor] = useState<{ row: number; col: number } | null>(null);
  const [selectionCells, setSelectionCells] = useState<{ row: number; col: number }[]>([]);
  const startCellRef = useRef<{ row: number; col: number } | null>(null);
  const currentCellRef = useRef<{ row: number; col: number } | null>(null);

  // Board layout measurements
  const gridContainerRef = useRef<View>(null);
  const gridLayoutRef = useRef<{ pageX: number; pageY: number; width: number; height: number }>({
    pageX: 0,
    pageY: 0,
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

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const comboScaleAnim = useRef(new Animated.Value(1)).current;

  // Categories list
  const categoryList = useMemo(() => getAllWordSearchCategories(), []);

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
      setTapAnchor(null);
      setSelectionCells([]);
      setTimeSeconds(0);
      setIsTimerRunning(true);
      setHintsLeft(3);
      setHintedCell(null);
      setComboCount(0);
      setRevealedMystery(null);
      lastFoundTimestampRef.current = 0;
      setLoading(false);

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
      if (!puzzle) return;
      if (updatedFound.size === puzzle.placedWords.length) {
        setIsTimerRunning(false);
        SoundEffects.playVictory();

        // Reveal secret mystery word if one was embedded in the puzzle
        if (puzzle.mysteryWord) {
          setRevealedMystery(puzzle.mysteryWord);
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
        const mysteryBonus = puzzle.mysteryWord ? 20 : 0;
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
              totalWords: puzzle.placedWords.length,
              stars: earnedStars,
            });
            refreshUser();
          } catch (err) {
            // Silently handle offline score sync
          } finally {
            setSubmitting(false);
          }
        }
      }
    },
    [puzzle, gameMode, dailyData, selectedCategory, timeSeconds, difficulty, refreshUser]
  );

  // Evaluate if given cells match an unfound placed word
  const checkWordMatch = useCallback(
    (cells: { row: number; col: number }[]) => {
      if (!puzzle || cells.length < 2) return false;

      const forwardChars = cells.map((c) => puzzle.grid[c.row][c.col]).join("");
      const backwardChars = [...forwardChars].reverse().join("");

      let matchedWord: PlacedWord | null = null;
      for (const pw of puzzle.placedWords) {
        if (!foundWords.has(pw.word)) {
          if (pw.word === forwardChars || pw.word === backwardChars) {
            matchedWord = pw;
            break;
          }
        }
      }

      if (matchedWord) {
        SoundEffects.playCorrect();
        Vibration.vibrate(40);

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

        const nextFound = new Set(foundWords);
        nextFound.add(matchedWord.word);
        setFoundWords(nextFound);
        setSelectedClue(matchedWord);

        if (hintedCell && hintedCell.row === matchedWord.startRow && hintedCell.col === matchedWord.startCol) {
          setHintedCell(null);
        }

        checkVictory(nextFound);
        return true;
      }
      return false;
    },
    [puzzle, foundWords, hintedCell, checkVictory, comboScaleAnim]
  );

  // Measure board bounds
  const measureGrid = useCallback(() => {
    gridContainerRef.current?.measure((x, y, width, height, pageX, pageY) => {
      if (width > 0 && height > 0) {
        gridLayoutRef.current = { pageX, pageY, width, height };
      }
    });
  }, []);

  // Responsive, fluid touch responder with continuous swipe and two-tap connect
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
          if (!puzzle) return;
          const { pageX, pageY, locationX, locationY } = evt.nativeEvent;

          const gridPageX = gridLayoutRef.current.pageX > 0 ? gridLayoutRef.current.pageX : pageX - locationX;
          const gridPageY = gridLayoutRef.current.pageY > 0 ? gridLayoutRef.current.pageY : pageY - locationY;
          gridLayoutRef.current = {
            pageX: gridPageX,
            pageY: gridPageY,
            width: MAX_BOARD_WIDTH,
            height: MAX_BOARD_WIDTH,
          };

          setIsDragging(true);

          const cellSize = MAX_BOARD_WIDTH / puzzle.size;
          const localX = pageX - gridPageX;
          const localY = pageY - gridPageY;
          const col = Math.max(0, Math.min(puzzle.size - 1, Math.floor(localX / cellSize)));
          const row = Math.max(0, Math.min(puzzle.size - 1, Math.floor(localY / cellSize)));
          const cell = { row, col };

          startCellRef.current = cell;
          currentCellRef.current = cell;

          if (!tapAnchor) {
            setSelectionCells([cell]);
          } else {
            const previewLine = getStraightLineCells(tapAnchor.row, tapAnchor.col, cell.row, cell.col);
            setSelectionCells(previewLine);
          }
          SoundEffects.playTap();
        },

        onPanResponderMove: (evt) => {
          if (!startCellRef.current || !puzzle || !gridLayoutRef.current) return;
          const { pageX, pageY } = evt.nativeEvent;
          const localX = pageX - gridLayoutRef.current.pageX;
          const localY = pageY - gridLayoutRef.current.pageY;
          const cellSize = MAX_BOARD_WIDTH / puzzle.size;

          const col = Math.max(0, Math.min(puzzle.size - 1, Math.floor(localX / cellSize)));
          const row = Math.max(0, Math.min(puzzle.size - 1, Math.floor(localY / cellSize)));
          const cell = { row, col };

          if (cell.row !== currentCellRef.current?.row || cell.col !== currentCellRef.current?.col) {
            currentCellRef.current = cell;
            Vibration.vibrate(8);
            const fromCell = tapAnchor || startCellRef.current;
            const line = getStraightLineCells(fromCell.row, fromCell.col, cell.row, cell.col);
            setSelectionCells(line);
          }
        },

        onPanResponderRelease: () => {
          setIsDragging(false);
          if (!puzzle || !startCellRef.current) {
            setSelectionCells([]);
            startCellRef.current = null;
            currentCellRef.current = null;
            return;
          }

          const tappedCell = startCellRef.current;
          const wasMultiCellDrag = selectionCells.length > 1;

          if (wasMultiCellDrag && !tapAnchor) {
            const matched = checkWordMatch(selectionCells);
            if (!matched) {
              SoundEffects.playCardFlip();
            }
            setSelectionCells([]);
            setTapAnchor(null);
          } else {
            if (!tapAnchor) {
              setTapAnchor(tappedCell);
              setSelectionCells([tappedCell]);
              SoundEffects.playTap();
            } else {
              if (tapAnchor.row === tappedCell.row && tapAnchor.col === tappedCell.col) {
                setTapAnchor(null);
                setSelectionCells([]);
                SoundEffects.playTap();
              } else {
                const line = getStraightLineCells(tapAnchor.row, tapAnchor.col, tappedCell.row, tappedCell.col);
                setSelectionCells(line);
                const matched = checkWordMatch(line);
                if (matched) {
                  setTapAnchor(null);
                  setSelectionCells([]);
                } else {
                  SoundEffects.playTap();
                  setTapAnchor(tappedCell);
                  setSelectionCells([tappedCell]);
                }
              }
            }
          }

          startCellRef.current = null;
          currentCellRef.current = null;
        },

        onPanResponderTerminate: () => {
          setIsDragging(false);
          setSelectionCells([]);
          startCellRef.current = null;
          currentCellRef.current = null;
        },
      }),
    [puzzle, selectionCells, tapAnchor, checkWordMatch]
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

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={["top", "bottom"]}>
      <Atmosphere />

      {/* Top App Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.iconButton, { backgroundColor: colors.surface }]}
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
            onPress={toggleSound}
            style={[styles.iconButton, { backgroundColor: colors.surface, marginRight: 8 }]}
          >
            <Text style={styles.actionIcon}>{isSoundEnabled ? "🔊" : "🔇"}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleUseHint}
            style={[styles.hintButton, { backgroundColor: colors.accent + "25", borderColor: colors.accent }]}
          >
            <Text style={[styles.hintButtonText, { color: colors.accent }]}>💡 {hintsLeft}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Mode & Difficulty Segmented Controls */}
      <View style={styles.controlsRow}>
        {/* Game Mode Tab */}
        <View style={[styles.segmentedPillContainer, { backgroundColor: colors.surface }]}>
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
        <View style={[styles.difficultySelector, { backgroundColor: colors.surface }]}>
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
      <View style={[styles.statsBar, { backgroundColor: colors.surface }]}>
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
          style={[styles.shuffleButton, { backgroundColor: colors.primary + "18", borderColor: colors.primary }]}
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
            🔄 {lang === "ne" ? "नयाँ खेल" : "Shuffle"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Board View */}
      {loading || !puzzle ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>
            {lang === "ne" ? "पजल तयार गरिँदै..." : "Generating puzzle..."}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!isDragging}
        >
          {/* Active Clue Notification Banner */}
          {selectedClue && (
            <TouchableOpacity
              style={[
                styles.clueBanner,
                { backgroundColor: selectedClue.color + "20", borderColor: selectedClue.color },
              ]}
              onPress={() => setClueModalVisible(true)}
            >
              <View style={styles.clueBannerLeft}>
                <Text style={[styles.clueBannerWord, { color: selectedClue.color }]}>
                  {selectedClue.word}
                </Text>
                <Text style={[styles.clueBannerText, { color: colors.text }]} numberOfLines={1}>
                  💡 {lang === "ne" ? selectedClue.clueNe : selectedClue.clueEn}
                </Text>
              </View>
              <Text style={styles.clueBannerDetailIcon}>ℹ️</Text>
            </TouchableOpacity>
          )}

          {/* Tap-to-Connect Prompt */}
          {tapAnchor && (
            <View style={[styles.clueBanner, { backgroundColor: colors.accent + "20", borderColor: colors.accent }]}>
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

          {/* Attractive Letter Grid with PanResponder */}
          <View
            ref={gridContainerRef}
            style={[
              styles.gridContainer,
              {
                width: MAX_BOARD_WIDTH,
                height: MAX_BOARD_WIDTH,
                backgroundColor: colors.bg,
                borderColor: colors.border,
              },
            ]}
            onLayout={measureGrid}
            {...panResponder.panHandlers}
          >
            {puzzle.grid.map((rowArr, rIdx) => (
              <View key={`row-${rIdx}`} style={styles.gridRow} pointerEvents="none">
                {rowArr.map((letter, cIdx) => {
                  const key = `${rIdx},${cIdx}`;
                  const isFound = cellColorMap.has(key);
                  const foundColor = cellColorMap.get(key) || colors.primary;

                  const isSelected = selectionCells.some((c) => c.row === rIdx && c.col === cIdx);
                  const isAnchor = tapAnchor?.row === rIdx && tapAnchor?.col === cIdx;
                  const isHinted = hintedCell && hintedCell.row === rIdx && hintedCell.col === cIdx;

                  let cellBg = colors.surface;
                  let cellTextColor = colors.text;

                  if (isFound) {
                    cellBg = foundColor;
                    cellTextColor = "#FFFFFF";
                  } else if (isSelected) {
                    cellBg = colors.primary;
                    cellTextColor = "#FFFFFF";
                  } else if (isAnchor) {
                    cellBg = colors.accent + "40";
                    cellTextColor = colors.accent;
                  }

                  const cellSize = Math.floor(MAX_BOARD_WIDTH / puzzle.size) - 4;

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
                          borderRadius: puzzle.size > 10 ? 6 : 8,
                          shadowColor: isFound ? foundColor : "#000",
                        },
                        isSelected && styles.cellSelected,
                        isAnchor && {
                          borderColor: colors.accent,
                          borderWidth: 2.5,
                        },
                        isFound && {
                          borderColor: foundColor,
                          borderWidth: 1,
                        },
                        isHinted && {
                          borderColor: colors.accent,
                          borderWidth: 2.5,
                          transform: [{ scale: pulseAnim }],
                        },
                      ]}
                    >
                      <Text
                        pointerEvents="none"
                        style={[
                          styles.cellLetter,
                          {
                            color: cellTextColor,
                            fontSize: puzzle.size > 10 ? 14 : puzzle.size === 10 ? 16 : 18,
                            fontWeight: isFound || isSelected ? "800" : "600",
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

          {/* Word Bank Card with Interactive Chips */}
          <Card style={styles.wordBankCard}>
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
                        backgroundColor: isFound ? pw.color : colors.surface,
                        borderColor: isFound ? pw.color : colors.border,
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
                          color: isFound ? "#FFF" : colors.text,
                          textDecorationLine: isFound ? "line-through" : "none",
                          fontWeight: isFound ? "800" : "600",
                        },
                      ]}
                    >
                      {isFound ? "✓ " : ""}
                      {pw.word}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>
        </ScrollView>
      )}

      {/* Bilingual Clue Detail Bottom Sheet / Modal */}
      <Modal
        visible={clueModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setClueModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.clueModalCard, { backgroundColor: colors.surface }]}>
            <View style={styles.clueModalHeader}>
              <Text style={[styles.clueModalWord, { color: selectedClue?.color || colors.primary }]}>
                {selectedClue?.word}
              </Text>
              <TouchableOpacity
                onPress={() => setClueModalVisible(false)}
                style={styles.closeModalButton}
              >
                <Text style={[styles.closeModalText, { color: colors.textMuted }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.clueModalBody}>
              <View style={styles.clueSection}>
                <Text style={[styles.clueSectionHeader, { color: colors.textMuted }]}>
                  🇳🇵 नेपाली अर्थ (Nepali Context):
                </Text>
                <Text style={[styles.clueSectionText, { color: colors.text }]}>
                  {selectedClue?.clueNe || "सम्पदासँग सम्बन्धित"}
                </Text>
              </View>

              <View style={[styles.clueSection, { marginTop: 12 }]}>
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
          <View style={[styles.victoryCard, { backgroundColor: colors.surface }]}>
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
              <View style={styles.mysteryWordCard}>
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
            <View style={[styles.xpPill, { backgroundColor: colors.primary + "20" }]}>
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
    </SafeAreaView>
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
    ...shadow.nepalButton,
  },
  backText: {
    fontSize: 20,
    fontWeight: "700",
  },
  titleContainer: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: "500",
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
    paddingVertical: 6,
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
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    ...shadow.sm,
  },
  statBadge: {
    alignItems: "center",
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  statValue: {
    fontSize: 13,
    fontWeight: "800",
    marginTop: 2,
  },
  comboBadge: {
    backgroundColor: "#F97316",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  comboText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
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
  scrollContent: {
    alignItems: "center",
    paddingVertical: 10,
    paddingBottom: 40,
  },
  clueBanner: {
    width: MAX_BOARD_WIDTH,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.2,
    marginBottom: 8,
  },
  clueBannerLeft: {
    flex: 1,
  },
  clueBannerWord: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 1,
  },
  clueBannerText: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },
  clueBannerDetailIcon: {
    fontSize: 16,
    marginLeft: 8,
  },
  gridContainer: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 6,
    justifyContent: "space-around",
    ...shadow.card,
  },
  gridRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  cell: {
    alignItems: "center",
    justifyContent: "center",
    margin: 1,
    ...shadow.sm,
  },
  cellSelected: {
    transform: [{ scale: 1.08 }],
    zIndex: 10,
  },
  cellLetter: {
    fontFamily: fonts.bodyBold,
    textAlign: "center",
  },
  wordBankCard: {
    width: MAX_BOARD_WIDTH,
    marginTop: 12,
    padding: 12,
    borderRadius: 16,
  },
  wordBankHeader: {
    marginBottom: 8,
  },
  wordBankTitle: {
    fontSize: 14,
    fontWeight: "800",
  },
  wordBankSub: {
    fontSize: 11,
    marginTop: 2,
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
    borderWidth: 1,
  },
  wordChipText: {
    fontSize: 12,
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.md,
  },
  clueModalCard: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 20,
    padding: spacing.lg,
    ...shadow.card,
  },
  clueModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  clueModalWord: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  closeModalButton: {
    padding: 4,
  },
  closeModalText: {
    fontSize: 18,
    fontWeight: "700",
  },
  clueModalBody: {
    marginVertical: 8,
  },
  clueSection: {
    backgroundColor: "rgba(0,0,0,0.04)",
    padding: 10,
    borderRadius: 10,
  },
  clueSectionHeader: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
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
    backgroundColor: "rgba(255, 215, 0, 0.15)",
    borderColor: "#FFD700",
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
