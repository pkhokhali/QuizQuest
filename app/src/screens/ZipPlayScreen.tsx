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
import {
  getDailyZipLeaderboard,
  getDailyZipPuzzle as getDailyZipPuzzleApi,
  nudgeDailyZipFriend,
  submitDailyZipScore,
} from "../api/client";
import {
  AvatarInfo,
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
  ZipCell,
  ZipPuzzle,
} from "../utils/zipGenerator";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_PADDING = spacing.lg * 2;
const MAX_BOARD_WIDTH = Math.min(SCREEN_WIDTH - GRID_PADDING, 380);

export function ZipPlayScreen() {
  const { colors } = useTheme();
  const { lang, t } = useI18n();
  const navigation = useNavigation();
  const { refreshUser } = useAuth();
  const { isSoundEnabled, toggleSound } = useSoundEnabled();

  // Mode: "daily" (Official synchronized daily challenge) or "practice" (Free play)
  const [gameMode, setGameMode] = useState<"daily" | "practice">("daily");
  const [size, setSize] = useState<4 | 5 | 6>(4);
  const [puzzle, setPuzzle] = useState<ZipPuzzle>(() => createZipPuzzle(4, "easy"));
  const [path, setPath] = useState<ZipCell[]>([]);
  const [nextExpectedCheckpoint, setNextExpectedCheckpoint] = useState<number>(2);
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [gameEnded, setGameEnded] = useState(false);
  const [hintCell, setHintCell] = useState<ZipCell | null>(null);

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
  const cellSize = MAX_BOARD_WIDTH / puzzle.size;

  /** Initialize a practice or local puzzle */
  const initPracticeGame = useCallback((newSize: 4 | 5 | 6) => {
    const p = createZipPuzzle(
      newSize,
      newSize === 4 ? "easy" : newSize === 5 ? "medium" : "hard"
    );
    setSize(newSize);
    setPuzzle(p);

    const startCell = p.solutionPath[0];
    setPath([startCell]);
    setNextExpectedCheckpoint(2);
    setMoves(0);
    setSeconds(0);
    setGameEnded(false);
    setHintCell(null);
    setOfficialXpAwarded(0);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
  }, []);

  /** Fetch daily puzzle from backend server */
  const loadDailyChallenge = useCallback(async () => {
    setDailyLoading(true);
    try {
      const res = await getDailyZipPuzzleApi();
      setDailyData(res);
      setMyDailyScore(res.myScore);
      setRivalToBeat(res.rivalToBeat);

      const serverPuzzle: ZipPuzzle = {
        id: `daily-${res.date}`,
        size: res.size,
        difficulty: res.difficulty,
        totalCells: res.totalCells,
        checkpoints: res.checkpoints,
        maxCheckpoint: res.maxCheckpoint,
        solutionPath: res.solutionPath,
      };

      setSize(res.size as 4 | 5 | 6);
      setPuzzle(serverPuzzle);

      const startCell = serverPuzzle.solutionPath[0];
      setPath([startCell]);
      setNextExpectedCheckpoint(2);
      setMoves(0);
      setSeconds(0);
      setGameEnded(false);
      setHintCell(null);
      setOfficialXpAwarded(0);

      if (timerRef.current) clearInterval(timerRef.current);
      if (!res.myScore) {
        timerRef.current = setInterval(() => {
          setSeconds((s) => s + 1);
        }, 1000);
      }
    } catch {
      // Offline fallback: use deterministic client generator
      const fallback = getDailyZipPuzzleLocal();
      setSize(fallback.size as 4 | 5 | 6);
      setPuzzle(fallback);
      setPath([fallback.solutionPath[0]]);
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
      initPracticeGame(size);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameMode, loadDailyChallenge, initPracticeGame, size]);

  // Set of path coordinates for O(1) lookup
  const pathKeySet = useMemo(() => {
    return new Set(path.map((c) => cellKey(c.row, c.col)));
  }, [path]);

  // Map of cellKey -> path index
  const pathIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    path.forEach((c, idx) => map.set(cellKey(c.row, c.col), idx));
    return map;
  }, [path]);

  /** Add or backtrack to a cell */
  const handleCellAction = useCallback(
    async (r: number, c: number) => {
      if (gameEnded) return;
      if (r < 0 || r >= puzzle.size || c < 0 || c >= puzzle.size) return;

      const targetKey = cellKey(r, c);

      // Check if tapping a cell already in path: backtrack/unwind to it
      if (pathKeySet.has(targetKey)) {
        const targetIdx = pathIndexMap.get(targetKey);
        if (targetIdx !== undefined && targetIdx < path.length - 1) {
          const newPath = path.slice(0, targetIdx + 1);
          setPath(newPath);
          SoundEffects.playTap();

          // Recalculate next expected checkpoint
          let maxVisitedCheckpoint = 1;
          newPath.forEach((pt) => {
            const cp = puzzle.checkpoints[cellKey(pt.row, pt.col)];
            if (cp !== undefined && cp > maxVisitedCheckpoint) {
              maxVisitedCheckpoint = cp;
            }
          });
          setNextExpectedCheckpoint(maxVisitedCheckpoint + 1);
          return;
        }
        return;
      }

      // If extending the path
      const currentHead = path[path.length - 1];
      const nextCell: ZipCell = { row: r, col: c };

      if (!areAdjacent(currentHead, nextCell)) {
        return;
      }

      // Check checkpoint rule: cannot hit a checkpoint out of order
      const cp = puzzle.checkpoints[targetKey];
      if (cp !== undefined) {
        if (cp !== nextExpectedCheckpoint) {
          SoundEffects.playWrong();
          return;
        }
      }

      // Valid move!
      const newPath = [...path, nextCell];
      const newMoves = moves + 1;
      setPath(newPath);
      setMoves(newMoves);
      setHintCell(null);

      if (cp !== undefined) {
        SoundEffects.playCorrect();
        setNextExpectedCheckpoint(cp + 1);
      } else {
        SoundEffects.playCardFlip();
      }

      // Check for victory: all cells visited and all checkpoints visited in order
      if (newPath.length === puzzle.totalCells) {
        if (timerRef.current) clearInterval(timerRef.current);
        setGameEnded(true);
        SoundEffects.playVictory();

        // Calculate stars based on speed: <= 40s (3 stars), <= 80s (2 stars), else 1 star
        const stars =
          seconds <= (puzzle.size === 4 ? 40 : puzzle.size === 5 ? 75 : 110)
            ? 3
            : seconds <= (puzzle.size === 4 ? 85 : puzzle.size === 5 ? 135 : 190)
            ? 2
            : 1;

        if (gameMode === "daily") {
          try {
            const subRes = await submitDailyZipScore({
              puzzleDate: dailyData?.date,
              timeSeconds: seconds,
              moves: newMoves,
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
            // Submission gracefully handled
          }
        } else {
          refreshUser();
        }
      }
    },
    [
      gameEnded,
      puzzle,
      path,
      pathKeySet,
      pathIndexMap,
      nextExpectedCheckpoint,
      moves,
      seconds,
      gameMode,
      dailyData,
      refreshUser,
    ]
  );

  /** Provide hint by highlighting next correct cell from solutionPath */
  const handleHint = useCallback(() => {
    if (gameEnded) return;
    const currentLength = path.length;
    if (currentLength < puzzle.solutionPath.length) {
      const nextInSolution = puzzle.solutionPath[currentLength];
      setHintCell(nextInSolution);
      SoundEffects.playStar();
    }
  }, [gameEnded, path, puzzle.solutionPath]);

  /** Step back one cell */
  const handleUndo = useCallback(() => {
    if (path.length <= 1 || gameEnded) return;
    const newPath = path.slice(0, -1);
    setPath(newPath);
    SoundEffects.playTap();

    let maxVisitedCheckpoint = 1;
    newPath.forEach((pt) => {
      const cp = puzzle.checkpoints[cellKey(pt.row, pt.col)];
      if (cp !== undefined && cp > maxVisitedCheckpoint) {
        maxVisitedCheckpoint = cp;
      }
    });
    setNextExpectedCheckpoint(maxVisitedCheckpoint + 1);
    setHintCell(null);
  }, [path, gameEnded, puzzle.checkpoints]);

  /** Reset path back to 1 */
  const handleReset = useCallback(() => {
    if (gameEnded) return;
    const start = puzzle.solutionPath[0];
    setPath([start]);
    setNextExpectedCheckpoint(2);
    setHintCell(null);
    SoundEffects.playTap();
  }, [gameEnded, puzzle.solutionPath]);

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
    const solvedSeconds = myDailyScore ? myDailyScore.timeSeconds : seconds;
    const solvedMoves = myDailyScore ? myDailyScore.moves : moves;
    const solvedStars = myDailyScore ? myDailyScore.stars : 3;
    const text = generateZipShareText({
      puzzleNum: dailyData?.puzzleNum || 1,
      size: puzzle.size,
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
  }, [myDailyScore, seconds, moves, dailyData?.puzzleNum, puzzle.size, lang]);

  // PanResponder to allow seamless touch-and-drag line drawing
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          const { locationX, locationY } = evt.nativeEvent;
          const col = Math.floor(locationX / cellSize);
          const row = Math.floor(locationY / cellSize);
          handleCellAction(row, col);
        },
        onPanResponderMove: (evt) => {
          const { locationX, locationY } = evt.nativeEvent;
          const col = Math.floor(locationX / cellSize);
          const row = Math.floor(locationY / cellSize);
          handleCellAction(row, col);
        },
      }),
    [cellSize, handleCellAction]
  );

  const currentHead = path[path.length - 1];
  const percentFilled = Math.round((path.length / puzzle.totalCells) * 100);

  return (
    <Atmosphere>
      <SafeAreaView style={styles.safe} edges={["top"]}>
        {/* Header HUD */}
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: colors.surface }]}
            onPress={() => navigation.goBack()}
            activeOpacity={0.75}
          >
            <Text style={[styles.backBtnText, { color: colors.text }]}>✕</Text>
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={[styles.modeTag, { color: colors.accent, fontFamily: fonts.bodyBold }]}>
              ⚡ ZIP PATH PUZZLE
            </Text>
            <Text style={[styles.title, { color: colors.text, fontFamily: fonts.display }]}>
              {gameMode === "daily"
                ? `Daily #${dailyData?.puzzleNum || "..."}`
                : lang === "ne"
                ? "मार्ग पूरा गर्नुहोस्"
                : "Complete The Path"}
            </Text>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              onPress={toggleSound}
              style={[
                styles.iconBtn,
                { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
              ]}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 16 }}>{isSoundEnabled ? "🔊" : "🔇"}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleOpenStandings}
              style={[
                styles.standingsBtn,
                { backgroundColor: colors.surface, borderColor: colors.gold },
              ]}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 14 }}>🏆</Text>
              <Text style={[styles.standingsBtnText, { color: colors.gold, fontFamily: fonts.bodyBold }]}>
                {t("zipStandings")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Mode Segmented Switcher (Daily vs Practice) */}
        <View style={[styles.modeSegmentContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity
            onPress={() => setGameMode("daily")}
            style={[
              styles.modeSegmentBtn,
              gameMode === "daily" && { backgroundColor: colors.primary },
            ]}
            activeOpacity={0.8}
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
              🌟 {t("zipDailyChallenge")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setGameMode("practice")}
            style={[
              styles.modeSegmentBtn,
              gameMode === "practice" && { backgroundColor: colors.primary },
            ]}
            activeOpacity={0.8}
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
              🎯 {t("zipPracticeMode")}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
          {/* DAILY MODE: Rival To Beat Banner */}
          {gameMode === "daily" && rivalToBeat && (
            <TouchableOpacity
              onPress={handleOpenStandings}
              style={[
                styles.rivalBanner,
                { backgroundColor: colors.surfaceElevated, borderColor: colors.accent },
              ]}
              activeOpacity={0.85}
            >
              <AvatarCircle avatar={rivalToBeat.avatar} size={34} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.rivalBannerTitle, { color: colors.accent, fontFamily: fonts.bodyBold }]}>
                  🎯 {t("zipRivalToBeat")}
                </Text>
                <Text style={[styles.rivalBannerSubtitle, { color: colors.text, fontFamily: fonts.body }]}>
                  {rivalToBeat.name} finished in {rivalToBeat.timeSeconds}s
                </Text>
              </View>
              <View style={[styles.rivalPill, { backgroundColor: colors.accentSoft }]}>
                <Text style={[styles.rivalPillText, { color: colors.accent, fontFamily: fonts.bodyBold }]}>
                  Beat {rivalToBeat.timeSeconds}s ⚡
                </Text>
              </View>
            </TouchableOpacity>
          )}

          {/* DAILY MODE: Already Solved Banner */}
          {gameMode === "daily" && myDailyScore && (
            <Card
              style={StyleSheet.flatten([
                styles.completedBanner,
                { backgroundColor: colors.primarySoft, borderColor: colors.primary },
              ])}
            >
              <View style={styles.completedHeaderRow}>
                <Text style={{ fontSize: 24 }}>✅</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.completedTitle, { color: colors.text, fontFamily: fonts.bodyBold }]}>
                    {t("zipTodayCompleted")}
                  </Text>
                  <Text style={[styles.completedSub, { color: colors.textMuted, fontFamily: fonts.body }]}>
                    ⏱ {myDailyScore.timeSeconds}s · 🎯 {myDailyScore.moves} moves · {"⭐".repeat(myDailyScore.stars)}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={handleShareResult}
                  style={[styles.shareMiniBtn, { backgroundColor: colors.primary }]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.shareMiniBtnText, { color: colors.textOnPrimary, fontFamily: fonts.bodyBold }]}>
                    📤 {t("zipShareResults")}
                  </Text>
                </TouchableOpacity>
              </View>
            </Card>
          )}

          {/* PRACTICE MODE: Size Picker */}
          {gameMode === "practice" && (
            <View style={styles.difficultyRow}>
              {([4, 5, 6] as const).map((s) => {
                const active = size === s;
                const labels = { 4: "4×4 Easy", 5: "5×5 Focus", 6: "6×6 Master" };
                return (
                  <TouchableOpacity
                    key={s}
                    onPress={() => initPracticeGame(s)}
                    style={[
                      styles.diffChip,
                      {
                        backgroundColor: active ? colors.primary : colors.surface,
                        borderColor: active ? colors.primary : colors.border,
                      },
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.diffChipText,
                        {
                          color: active ? colors.textOnPrimary : colors.textMuted,
                          fontFamily: fonts.bodyBold,
                        },
                      ]}
                    >
                      {labels[s]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Checkpoint Progress Tracker & Live Timer */}
          <View style={[styles.progressCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <View style={styles.trackerTopRow}>
              <Text style={[styles.statsLabel, { color: colors.textMuted, fontFamily: fonts.bodyBold }]}>
                CHECKPOINTS
              </Text>
              <View style={[styles.timerPill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.timerText, { color: colors.accent, fontFamily: fonts.bodyBold }]}>
                  ⏱ {seconds}s
                </Text>
              </View>
            </View>

            <View style={styles.checkpointTrack}>
              {Array.from({ length: puzzle.maxCheckpoint }, (_, i) => i + 1).map((cpNum) => {
                const passed = cpNum < nextExpectedCheckpoint;
                const isNext = cpNum === nextExpectedCheckpoint;
                return (
                  <View key={cpNum} style={{ flexDirection: "row", alignItems: "center" }}>
                    <View
                      style={[
                        styles.trackDot,
                        {
                          backgroundColor: passed
                            ? colors.green
                            : isNext
                            ? colors.primary
                            : colors.bgMid,
                          borderColor: isNext ? colors.accent : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.trackDotText,
                          {
                            color: passed || isNext ? "#FFFFFF" : colors.textMuted,
                            fontFamily: fonts.bodyBold,
                          },
                        ]}
                      >
                        {cpNum}
                      </Text>
                    </View>
                    {cpNum < puzzle.maxCheckpoint && (
                      <View
                        style={[
                          styles.trackLine,
                          { backgroundColor: passed ? colors.green : colors.border },
                        ]}
                      />
                    )}
                  </View>
                );
              })}
            </View>

            {/* Coverage Meter */}
            <View style={styles.statsRow}>
              <Text style={[styles.statsLabel, { color: colors.textMuted, fontFamily: fonts.body }]}>
                {lang === "ne" ? "भरिएको कोष्ठक" : "Cells Filled"}: {path.length}/{puzzle.totalCells} ({percentFilled}%)
              </Text>
              <Text style={[styles.statsLabel, { color: colors.textMuted, fontFamily: fonts.body }]}>
                Moves: {moves}
              </Text>
            </View>
          </View>

          {/* The Interactive Zip Grid */}
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
              {/* Grid Cells */}
              {Array.from({ length: puzzle.size }).map((_, r) => (
                <View key={`row-${r}`} style={styles.gridRow}>
                  {Array.from({ length: puzzle.size }).map((_, c) => {
                    const key = cellKey(r, c);
                    const isCheckpoint = puzzle.checkpoints[key] !== undefined;
                    const cpNum = puzzle.checkpoints[key];
                    const inPath = pathKeySet.has(key);
                    const isHead = currentHead?.row === r && currentHead?.col === c;
                    const isHint = hintCell?.row === r && hintCell?.col === c;

                    const pathIdx = pathIndexMap.get(key) ?? -1;
                    const prevInPath = pathIdx > 0 ? path[pathIdx - 1] : null;
                    const nextInPath =
                      pathIdx >= 0 && pathIdx < path.length - 1 ? path[pathIdx + 1] : null;

                    return (
                      <TouchableOpacity
                        key={key}
                        activeOpacity={0.9}
                        onPress={() => handleCellAction(r, c)}
                        style={[
                          styles.cell,
                          {
                            width: cellSize,
                            height: cellSize,
                            borderColor: inPath ? colors.primary : colors.border,
                            backgroundColor: inPath
                              ? colors.primarySoft
                              : isHint
                              ? colors.goldSoft
                              : colors.surface,
                          },
                        ]}
                      >
                        {/* Connection bridge indicators between cells */}
                        {prevInPath && (
                          <View
                            style={[
                              styles.bridge,
                              {
                                backgroundColor: colors.primary,
                                ...(prevInPath.row < r && styles.bridgeTop),
                                ...(prevInPath.row > r && styles.bridgeBottom),
                                ...(prevInPath.col < c && styles.bridgeLeft),
                                ...(prevInPath.col > c && styles.bridgeRight),
                              },
                            ]}
                          />
                        )}
                        {nextInPath && (
                          <View
                            style={[
                              styles.bridge,
                              {
                                backgroundColor: colors.primary,
                                ...(nextInPath.row < r && styles.bridgeTop),
                                ...(nextInPath.row > r && styles.bridgeBottom),
                                ...(nextInPath.col < c && styles.bridgeLeft),
                                ...(nextInPath.col > c && styles.bridgeRight),
                              },
                            ]}
                          />
                        )}

                        {/* Checkpoint Number Badge or Path Pulse Dot */}
                        {isCheckpoint ? (
                          <View
                            style={[
                              styles.checkpointBadge,
                              {
                                backgroundColor: inPath ? colors.primary : colors.surfaceElevated,
                                borderColor: inPath ? colors.accent : colors.primary,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.checkpointNumber,
                                {
                                  color: inPath ? "#FFFFFF" : colors.text,
                                  fontFamily: fonts.display,
                                  fontSize: puzzle.size === 6 ? 13 : 16,
                                },
                              ]}
                            >
                              {cpNum}
                            </Text>
                          </View>
                        ) : inPath ? (
                          <View
                            style={[
                              styles.pathDot,
                              {
                                backgroundColor: isHead ? colors.accent : colors.primary,
                                transform: [{ scale: isHead ? 1.3 : 1 }],
                              },
                            ]}
                          />
                        ) : isHint ? (
                          <View style={[styles.hintIndicator, { borderColor: colors.gold }]} />
                        ) : null}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>
          )}

          {/* Action Toolbar */}
          <View style={styles.toolbar}>
            <TouchableOpacity
              style={[styles.toolBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={handleUndo}
              activeOpacity={0.7}
            >
              <Text style={styles.toolIcon}>↩️</Text>
              <Text style={[styles.toolLabel, { color: colors.text, fontFamily: fonts.bodyBold }]}>
                Undo
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toolBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={handleHint}
              activeOpacity={0.7}
            >
              <Text style={styles.toolIcon}>💡</Text>
              <Text style={[styles.toolLabel, { color: colors.text, fontFamily: fonts.bodyBold }]}>
                Hint
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toolBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={handleReset}
              activeOpacity={0.7}
            >
              <Text style={styles.toolIcon}>🔄</Text>
              <Text style={[styles.toolLabel, { color: colors.text, fontFamily: fonts.bodyBold }]}>
                Reset
              </Text>
            </TouchableOpacity>

            {gameMode === "practice" ? (
              <TouchableOpacity
                style={[styles.toolBtn, { backgroundColor: colors.accentSoft, borderColor: colors.accent }]}
                onPress={() => initPracticeGame(size)}
                activeOpacity={0.7}
              >
                <Text style={styles.toolIcon}>🎲</Text>
                <Text style={[styles.toolLabel, { color: colors.accent, fontFamily: fonts.bodyBold }]}>
                  New
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.toolBtn, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}
                onPress={handleShareResult}
                activeOpacity={0.7}
              >
                <Text style={styles.toolIcon}>📤</Text>
                <Text style={[styles.toolLabel, { color: colors.primary, fontFamily: fonts.bodyBold }]}>
                  Share
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Rules / Hint helper */}
          <View style={[styles.instructionsCard, { backgroundColor: colors.surfaceElevated }]}>
            <Text style={[styles.instructionsTitle, { color: colors.text, fontFamily: fonts.bodyBold }]}>
              {lang === "ne" ? "नियमहरू" : "How to Play"}
            </Text>
            <Text style={[styles.instructionsBody, { color: colors.textMuted, fontFamily: fonts.body }]}>
              {lang === "ne"
                ? "१. १ बाट सुरु गरी अंकहरूलाई क्रमिक रूपमा जोड्नुहोस्।\n२. ग्रिडका सबै कोष्ठकहरू पार गरी बाटो पूरा गर्नुहोस्।"
                : "1. Connect numbered checkpoints in sequential order (1 → 2 → 3 → ...).\n2. Drag or tap adjacent cells to completely fill the grid without overlapping."}
            </Text>
          </View>
        </ScrollView>

        {/* Victory Modal Overlay */}
        {gameEnded && (
          <View style={styles.modalOverlay}>
            <ConfettiEffect count={50} />
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
                  : `Full ${puzzle.size}×${puzzle.size} path completed in ${seconds}s!`}
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

                {gameMode === "daily" ? (
                  <PrimaryButton
                    label="🎯 Switch to Practice Mode"
                    onPress={() => {
                      setGameEnded(false);
                      setGameMode("practice");
                    }}
                    variant="ghost"
                  />
                ) : (
                  <PrimaryButton
                    label={size < 6 ? `⚡ Level Up: ${size + 1}×${size + 1}` : "Play Same Size"}
                    onPress={() => initPracticeGame(Math.min(6, size + 1) as 4 | 5 | 6)}
                    variant="ghost"
                  />
                )}
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

                      {(!standingsData?.unplayedFriends || standingsData.unplayedFriends.length === 0) ? (
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  backBtnText: {
    fontSize: 16,
    fontWeight: "700",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: spacing.sm,
  },
  modeTag: {
    fontSize: 10,
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 16,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  standingsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: radius.chip,
    borderWidth: 1,
  },
  standingsBtnText: {
    fontSize: 11,
  },
  modeSegmentContainer: {
    flexDirection: "row",
    alignSelf: "center",
    borderRadius: radius.chip,
    borderWidth: 1,
    padding: 3,
    marginVertical: spacing.xs,
    width: MAX_BOARD_WIDTH,
  },
  modeSegmentBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: radius.chip,
    alignItems: "center",
    justifyContent: "center",
  },
  modeSegmentText: {
    fontSize: 12,
  },
  rivalBanner: {
    flexDirection: "row",
    alignItems: "center",
    width: MAX_BOARD_WIDTH,
    padding: spacing.sm + 2,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  rivalBannerTitle: {
    fontSize: 11,
    letterSpacing: 0.5,
  },
  rivalBannerSubtitle: {
    fontSize: 12,
  },
  rivalPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.chip,
  },
  rivalPillText: {
    fontSize: 11,
  },
  completedBanner: {
    width: MAX_BOARD_WIDTH,
    padding: spacing.sm + 2,
    borderRadius: radius.card,
    borderWidth: 1,
    marginBottom: spacing.xs,
  },
  completedHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  completedTitle: {
    fontSize: 13,
  },
  completedSub: {
    fontSize: 11,
    marginTop: 2,
  },
  shareMiniBtn: {
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 6,
    borderRadius: radius.chip,
  },
  shareMiniBtnText: {
    fontSize: 11,
  },
  scrollContent: {
    alignItems: "center",
    paddingBottom: spacing.xxl,
    gap: spacing.xs,
  },
  difficultyRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginVertical: spacing.xs,
  },
  diffChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.chip,
    borderWidth: 1,
  },
  diffChipText: {
    fontSize: 11,
  },
  progressCard: {
    width: MAX_BOARD_WIDTH,
    padding: spacing.md,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: spacing.sm,
  },
  trackerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timerPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    borderRadius: radius.chip,
    borderWidth: 1,
  },
  timerText: {
    fontSize: 12,
  },
  checkpointTrack: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  trackDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  trackDotText: {
    fontSize: 11,
  },
  trackLine: {
    width: 24,
    height: 3,
    marginHorizontal: 2,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statsLabel: {
    fontSize: 11,
  },
  gridContainer: {
    borderRadius: radius.card,
    borderWidth: 2,
    overflow: "hidden",
    marginTop: spacing.xs,
    ...shadow.card,
  },
  loadingGrid: {
    alignItems: "center",
    justifyContent: "center",
  },
  gridRow: {
    flex: 1,
    flexDirection: "row",
  },
  cell: {
    borderWidth: 0.5,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  bridge: {
    position: "absolute",
    zIndex: 1,
  },
  bridgeTop: {
    top: -2,
    width: 8,
    height: "55%",
  },
  bridgeBottom: {
    bottom: -2,
    width: 8,
    height: "55%",
  },
  bridgeLeft: {
    left: -2,
    height: 8,
    width: "55%",
  },
  bridgeRight: {
    right: -2,
    height: 8,
    width: "55%",
  },
  checkpointBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  checkpointNumber: {
    textAlign: "center",
  },
  pathDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    zIndex: 2,
  },
  hintIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: "dashed",
  },
  toolbar: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  toolBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 7,
    borderRadius: radius.chip,
    borderWidth: 1,
  },
  toolIcon: {
    fontSize: 14,
  },
  toolLabel: {
    fontSize: 11,
  },
  instructionsCard: {
    width: MAX_BOARD_WIDTH,
    padding: spacing.md,
    borderRadius: radius.card,
    marginTop: spacing.sm,
    gap: 4,
  },
  instructionsTitle: {
    fontSize: 12,
    letterSpacing: 0.5,
  },
  instructionsBody: {
    fontSize: 11,
    lineHeight: 16,
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
});
