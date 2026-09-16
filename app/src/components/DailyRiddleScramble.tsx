import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { solveDailyRiddle } from "../api/client";
import { RiddleData } from "../api/types";
import { useI18n } from "../state/LanguageContext";
import { useTheme } from "../state/ThemeContext";
import { fonts, radius, shadow, spacing } from "../theme";
import { SoundEffects } from "../utils/audio";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface DailyRiddleScrambleProps {
  riddle: RiddleData;
  onSolved?: () => void;
  onOpenAllRiddles?: () => void;
}

interface TileItem {
  id: string;
  char: string;
  used: boolean;
}

// Common Nepali and English decoys to enrich letter bank
const NE_DECOYS = ["क", "म", "र", "स", "न", "त", "प", "ल", "द", "ब", "ग", "य"];
const EN_DECOYS = ["E", "A", "R", "T", "O", "S", "L", "N", "C", "P", "M", "D"];

function splitIntoGraphemes(text: string): string[] {
  if (!text) return [];
  const clean = text.trim();
  try {
    if (typeof Intl !== "undefined" && (Intl as any).Segmenter) {
      const segmenter = new (Intl as any).Segmenter("ne", { granularity: "grapheme" });
      return Array.from(segmenter.segment(clean)).map((s: any) => s.segment);
    }
  } catch {}
  return Array.from(clean);
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function DailyRiddleScramble({
  riddle,
  onSolved,
  onOpenAllRiddles,
}: DailyRiddleScrambleProps) {
  const { lang, t } = useI18n();
  const { colors } = useTheme();

  const isNepali = lang === "ne";
  const riddleText = (isNepali && riddle?.riddleNe ? riddle.riddleNe : riddle?.riddleEn) || riddle?.riddleEn || riddle?.riddleNe || "";
  const rawAnswer = (isNepali && riddle?.answerNe ? riddle.answerNe : riddle?.answerEn) || riddle?.answerEn || riddle?.answerNe || "";
  const cleanTarget = (rawAnswer || "").trim();

  // Break target answer into clean tokens (skip spaces for matching, but keep structure)
  const targetChars = useMemo(() => {
    if (!cleanTarget) return [];
    return splitIntoGraphemes(isNepali ? cleanTarget : cleanTarget.toUpperCase());
  }, [cleanTarget, isNepali]);

  // Non-space target characters
  const playableChars = useMemo(() => {
    return targetChars.filter((c) => c !== " ");
  }, [targetChars]);

  const [tiles, setTiles] = useState<TileItem[]>([]);
  const [placedIndices, setPlacedIndices] = useState<(string | null)[]>([]);
  const [isSolved, setIsSolved] = useState(Boolean(riddle?.solved));
  const [submitting, setSubmitting] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);
  const [shakeAnim] = useState(new Animated.Value(0));
  const [celebrateAnim] = useState(new Animated.Value(0));
  const [showHintModal, setShowHintModal] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);

  // Initialize letter bank with target letters + 3 decoys
  useEffect(() => {
    if (riddle.solved) {
      setIsSolved(true);
      return;
    }

    const decoys = isNepali ? NE_DECOYS : EN_DECOYS;
    const extra: string[] = [];
    const availableDecoys = decoys.filter((d) => !playableChars.includes(d));
    for (let i = 0; i < Math.min(3, availableDecoys.length); i++) {
      extra.push(availableDecoys[i]);
    }

    const allChars = shuffleArray([...playableChars, ...extra]);
    const generatedTiles: TileItem[] = allChars.map((char, i) => ({
      id: `tile-${i}-${char}`,
      char,
      used: false,
    }));

    setTiles(generatedTiles);
    setPlacedIndices(new Array(playableChars.length).fill(null));
  }, [riddle.id, riddle.solved, playableChars, isNepali]);

  // Check solution whenever placed tiles change
  useEffect(() => {
    if (isSolved || placedIndices.length === 0) return;

    const allFilled = placedIndices.every((id) => id !== null);
    if (!allFilled) return;

    // Construct current word from tile ids
    const currentWord = placedIndices
      .map((tileId) => {
        const found = tiles.find((t) => t.id === tileId);
        return found ? found.char : "";
      })
      .join("");

    const targetWord = playableChars.join("");

    if (
      currentWord.toLowerCase() === targetWord.toLowerCase() ||
      currentWord === targetWord
    ) {
      handleSolveSuccess();
    } else {
      triggerShake();
    }
  }, [placedIndices, isSolved, tiles, playableChars]);

  const triggerShake = () => {
    try {
      SoundEffects.playWrong();
    } catch {}

    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleSolveSuccess = async () => {
    if (isSolved || submitting) return;
    setSubmitting(true);
    setIsSolved(true);

    try {
      SoundEffects.playCorrect();
      setTimeout(() => {
        SoundEffects.playVictory();
      }, 300);
    } catch {}

    Animated.spring(celebrateAnim, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();

    try {
      await solveDailyRiddle(riddle.id);
      if (onSolved) onSolved();
    } catch {}
    setSubmitting(false);
  };

  // Tap an available tile in the letter bank to place in next empty slot
  const handleTilePress = (tile: TileItem) => {
    if (tile.used || isSolved) return;

    const nextEmptySlot = placedIndices.findIndex((id) => id === null);
    if (nextEmptySlot === -1) return;

    try {
      SoundEffects.playTap();
    } catch {}

    setTiles((prev) =>
      prev.map((t) => (t.id === tile.id ? { ...t, used: true } : t))
    );

    setPlacedIndices((prev) => {
      const next = [...prev];
      next[nextEmptySlot] = tile.id;
      return next;
    });
  };

  // Tap a filled slot to return letter back to the bank
  const handleSlotPress = (slotIndex: number) => {
    if (isSolved) return;
    const tileId = placedIndices[slotIndex];
    if (!tileId) return;

    try {
      SoundEffects.playCardFlip();
    } catch {}

    setTiles((prev) =>
      prev.map((t) => (t.id === tileId ? { ...t, used: false } : t))
    );

    setPlacedIndices((prev) => {
      const next = [...prev];
      next[slotIndex] = null;
      return next;
    });
  };

  // Clear all slots back to the bank
  const handleClear = () => {
    if (isSolved) return;
    try {
      SoundEffects.playTap();
    } catch {}
    setTiles((prev) => prev.map((t) => ({ ...t, used: false })));
    setPlacedIndices(new Array(playableChars.length).fill(null));
  };

  // Shuffle available bank tiles
  const handleShuffle = () => {
    if (isSolved) return;
    try {
      SoundEffects.playCardFlip();
    } catch {}
    setTiles((prev) => shuffleArray([...prev]));
  };

  // Hint button: reveals next correct letter
  const handleHint = () => {
    if (isSolved) return;
    const nextSlot = placedIndices.findIndex((id, idx) => {
      if (id === null) return true;
      const tile = tiles.find((t) => t.id === id);
      return tile?.char !== playableChars[idx];
    });

    if (nextSlot === -1) return;

    const correctChar = playableChars[nextSlot];
    // Find an unused tile that has this correct character
    const availableTile = tiles.find(
      (t) => t.char === correctChar && !placedIndices.includes(t.id)
    );

    if (availableTile) {
      try {
        SoundEffects.playStar();
      } catch {}

      // If slot had a wrong tile, un-use it
      const oldTileId = placedIndices[nextSlot];
      setTiles((prev) =>
        prev.map((t) => {
          if (t.id === availableTile.id) return { ...t, used: true };
          if (t.id === oldTileId) return { ...t, used: false };
          return t;
        })
      );

      setPlacedIndices((prev) => {
        const next = [...prev];
        next[nextSlot] = availableTile.id;
        return next;
      });
    } else {
      setShowHintModal(true);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `🧩 QuizQuest Daily Riddle (गाउँखाने कथा):\n\n"${riddleText}"\n\nCan you unscramble the answer? Play QuizQuest & earn +15 XP! 🔥\nhttps://quizquest.com`,
      });
    } catch {}
  };

  if (!riddle || !cleanTarget || playableChars.length === 0) {
    return null;
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Top Header Badge */}
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: "rgba(220, 38, 38, 0.15)", borderColor: "#DC2626" }]}>
          <Text style={styles.badgeFlag}>🇳🇵</Text>
          <Text style={[styles.badgeText, { color: "#F59E0B", fontFamily: fonts.bodyBold }]}>
            {isNepali ? "दैनिक गाउँखाने कथा" : "DAILY RIDDLE • NEPAL"}
          </Text>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          {onOpenAllRiddles && (
            <TouchableOpacity
              style={[
                styles.openAllBtn,
                { backgroundColor: colors.surfaceElevated, borderColor: colors.primary },
              ]}
              onPress={onOpenAllRiddles}
              activeOpacity={0.75}
            >
              <Text style={[styles.openAllBtnText, { color: colors.primary, fontFamily: fonts.bodyBold }]}>
                🎲 {isNepali ? "५०+ कथा खेल्नुहोस्" : "Play 50+ Riddles"}
              </Text>
            </TouchableOpacity>
          )}

          <View style={[styles.categoryPill, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <Text style={[styles.categoryText, { color: colors.textMuted, fontFamily: fonts.bodyBold }]}>
              {(riddle.category || "General").toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      {/* Riddle Question */}
      <Text style={[styles.questionText, { color: colors.text, fontFamily: fonts.displayMed }]}>
        "{riddleText}"
      </Text>

      {/* Solved Banner */}
      {isSolved ? (
        <Animated.View
          style={[
            styles.solvedBox,
            {
              backgroundColor: "rgba(16, 185, 129, 0.12)",
              borderColor: colors.green,
              transform: [
                {
                  scale: celebrateAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.9, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.solvedHeader}>
            <Text style={styles.solvedIcon}>👑</Text>
            <View>
              <Text style={[styles.solvedTitle, { color: colors.green, fontFamily: fonts.bodyBold }]}>
                {isNepali ? "सबास! तपाईंले मिलाउनुभयो!" : "Brilliant! You Solved It!"}
              </Text>
              <Text style={[styles.solvedAnswer, { color: colors.text, fontFamily: fonts.display }]}>
                {cleanTarget}
              </Text>
            </View>
          </View>
          <View style={[styles.xpChip, { backgroundColor: "rgba(245, 158, 11, 0.15)", borderColor: "#F59E0B" }]}>
            <Text style={[styles.xpChipText, { color: "#F59E0B", fontFamily: fonts.bodyBold }]}>
              +15 XP ACQUIRED ⚡
            </Text>
          </View>
          {onOpenAllRiddles && (
            <TouchableOpacity
              style={[styles.playMoreCta, { backgroundColor: colors.primary }]}
              onPress={onOpenAllRiddles}
              activeOpacity={0.85}
            >
              <Text style={[styles.playMoreCtaText, { color: colors.textOnPrimary, fontFamily: fonts.bodyBold }]}>
                🎲 {isNepali ? "थप गाउँखाने कथा खेल्नुहोस् (५०+ उपलब्ध) ➔" : "Play More Gaunkhane Katha (50+ Available) ➔"}
              </Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      ) : (
        <>
          {/* Answer Letter Slots (Tap to remove) */}
          <Animated.View
            style={[
              styles.slotsContainer,
              { transform: [{ translateX: shakeAnim }] },
            ]}
          >
            {placedIndices.map((tileId, idx) => {
              const tile = tiles.find((t) => t.id === tileId);
              const isFilled = Boolean(tile);

              return (
                <TouchableOpacity
                  key={`slot-${idx}`}
                  style={[
                    styles.slotTile,
                    {
                      backgroundColor: isFilled ? colors.primary : colors.surfaceElevated,
                      borderColor: isFilled ? "#F59E0B" : colors.border,
                    },
                    isFilled && styles.slotTileFilled,
                  ]}
                  onPress={() => handleSlotPress(idx)}
                  activeOpacity={0.7}
                  disabled={!isFilled}
                >
                  <Text
                    style={[
                      styles.slotText,
                      {
                        color: isFilled ? "#FFFFFF" : colors.textMuted,
                        fontFamily: fonts.bodyBold,
                      },
                    ]}
                  >
                    {tile ? tile.char : ""}
                  </Text>
                  {!isFilled && <View style={[styles.slotUnderline, { backgroundColor: colors.border }]} />}
                </TouchableOpacity>
              );
            })}
          </Animated.View>

          {/* Letter Bank (Scrambled Tile Bubbles) */}
          <Text style={[styles.bankLabel, { color: colors.textMuted, fontFamily: fonts.body }]}>
            {isNepali ? "तलका अक्षरहरू थिचेर उत्तर बनाउनुहोस्:" : "Tap letters to spell the answer:"}
          </Text>

          <View style={styles.tilesBank}>
            {tiles.map((tile) => (
              <TouchableOpacity
                key={tile.id}
                style={[
                  styles.bankTile,
                  {
                    backgroundColor: tile.used ? "transparent" : colors.surfaceElevated,
                    borderColor: tile.used ? "rgba(255, 255, 255, 0.06)" : colors.border,
                  },
                  !tile.used && styles.bankTileActive,
                ]}
                onPress={() => handleTilePress(tile)}
                disabled={tile.used}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.bankTileText,
                    {
                      color: tile.used ? "rgba(255, 255, 255, 0.15)" : colors.text,
                      fontFamily: fonts.bodyBold,
                    },
                  ]}
                >
                  {tile.char}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Action Control Buttons (Shuffle, Clear, Hint, Give Up) */}
          <View style={styles.controlsRow}>
            <TouchableOpacity
              style={[styles.controlBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
              onPress={handleShuffle}
              activeOpacity={0.75}
            >
              <Text style={styles.controlIcon}>🔄</Text>
              <Text style={[styles.controlLabel, { color: colors.textMuted, fontFamily: fonts.bodyBold }]}>
                {isNepali ? "साटासाट" : "Shuffle"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
              onPress={handleClear}
              activeOpacity={0.75}
            >
              <Text style={styles.controlIcon}>✕</Text>
              <Text style={[styles.controlLabel, { color: colors.textMuted, fontFamily: fonts.bodyBold }]}>
                {isNepali ? "हटाउनुहोस्" : "Clear"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlBtn, styles.hintBtn, { backgroundColor: "rgba(245, 158, 11, 0.15)", borderColor: "#F59E0B" }]}
              onPress={handleHint}
              activeOpacity={0.75}
            >
              <Text style={styles.controlIcon}>💡</Text>
              <Text style={[styles.controlLabel, { color: "#F59E0B", fontFamily: fonts.bodyBold }]}>
                {isNepali ? "संकेत" : "Hint"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
              onPress={handleShare}
              activeOpacity={0.75}
            >
              <Text style={styles.controlIcon}>📤</Text>
              <Text style={[styles.controlLabel, { color: colors.textMuted, fontFamily: fonts.bodyBold }]}>
                {isNepali ? "सेयर" : "Share"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Give up & reveal fallback for learning */}
          {!gaveUp ? (
            <TouchableOpacity
              style={styles.giveUpBtn}
              onPress={() => setGaveUp(true)}
              activeOpacity={0.7}
            >
              <Text style={[styles.giveUpText, { color: colors.textMuted, fontFamily: fonts.body }]}>
                {isNepali ? "उत्तर हेर्नुहोस् (० XP)" : "Give Up & Reveal Answer (0 XP)"}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.revealedBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <Text style={[styles.revealedLabel, { color: colors.textMuted, fontFamily: fonts.body }]}>
                {isNepali ? "सही उत्तर थियो:" : "The answer was:"}
              </Text>
              <Text style={[styles.revealedWord, { color: colors.primary, fontFamily: fonts.bodyBold }]}>
                {cleanTarget}
              </Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.card,
    borderWidth: 1.5,
    padding: spacing.lg,
    marginVertical: spacing.md,
    ...shadow.card,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.chip,
    borderWidth: 1,
    gap: 6,
  },
  badgeFlag: {
    fontSize: 14,
  },
  badgeText: {
    fontSize: 11,
    letterSpacing: 0.8,
  },
  categoryPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.small,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 10,
    letterSpacing: 0.6,
  },
  questionText: {
    fontSize: 19,
    lineHeight: 27,
    marginBottom: spacing.lg,
  },
  slotsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginBottom: spacing.lg,
  },
  slotTile: {
    width: 44,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  slotTileFilled: {
    borderBottomWidth: 3.5,
    ...shadow.nepalButton,
  },
  slotText: {
    fontSize: 20,
  },
  slotUnderline: {
    position: "absolute",
    bottom: 6,
    width: 18,
    height: 2,
    borderRadius: 1,
  },
  bankLabel: {
    fontSize: 12,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  tilesBank: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginBottom: spacing.lg,
  },
  bankTile: {
    width: 44,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  bankTileActive: {
    borderBottomWidth: 3,
    borderColor: "rgba(245, 158, 11, 0.35)",
    ...shadow.card,
  },
  bankTileText: {
    fontSize: 19,
  },
  controlsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: spacing.sm,
  },
  controlBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    borderRadius: radius.chip,
    borderWidth: 1,
    gap: 4,
  },
  hintBtn: {
    borderBottomWidth: 2.5,
  },
  controlIcon: {
    fontSize: 14,
  },
  controlLabel: {
    fontSize: 11,
  },
  giveUpBtn: {
    alignItems: "center",
    marginTop: spacing.sm,
    paddingVertical: 6,
  },
  giveUpText: {
    fontSize: 12,
    textDecorationLine: "underline",
  },
  revealedBox: {
    padding: spacing.md,
    borderRadius: radius.chip,
    borderWidth: 1,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  revealedLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  revealedWord: {
    fontSize: 18,
    letterSpacing: 1,
  },
  solvedBox: {
    padding: spacing.md,
    borderRadius: radius.card,
    borderWidth: 1.5,
    gap: spacing.sm,
  },
  solvedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  solvedIcon: {
    fontSize: 32,
  },
  solvedTitle: {
    fontSize: 14,
  },
  solvedAnswer: {
    fontSize: 20,
    marginTop: 2,
  },
  xpChip: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  xpChipText: {
    fontSize: 11,
    letterSpacing: 0.8,
  },
  openAllBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  openAllBtnText: {
    fontSize: 11,
  },
  playMoreCta: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radius.button,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xs,
    ...shadow.nepalButton,
  },
  playMoreCtaText: {
    fontSize: 13,
  },
});
