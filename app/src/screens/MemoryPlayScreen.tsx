import { useNavigation } from "@react-navigation/native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getMemoryPacks, getRandomMemoryPack, submitMemoryScore } from "../api/client";
import { MemoryPack, MemoryPair } from "../api/types";
import { Atmosphere } from "../components/Atmosphere";
import { Card } from "../components/Card";
import { ConfettiEffect } from "../components/ConfettiEffect";
import { EmojiBurst } from "../components/EmojiBurst";
import { ErrorCard } from "../components/ErrorCard";
import { LoadingView } from "../components/LoadingView";
import { PrimaryButton } from "../components/PrimaryButton";
import { useAuth } from "../state/AuthContext";
import { useI18n } from "../state/LanguageContext";
import { useTheme } from "../state/ThemeContext";
import { fonts, radius, shadow, spacing } from "../theme";
import { SoundEffects, useSoundEnabled } from "../utils/audio";
import { VictoryAnimation } from "../components/VictoryAnimation";

interface CardItem {
  uid: string;
  pairId: number;
  type: "q" | "a";
  text: string;
  emoji?: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_SIZE = Math.floor((SCREEN_WIDTH - spacing.lg * 2 - spacing.sm * 3) / 3);

function MemoryCardItem({
  card,
  isFlipped,
  isMatched,
  onPress,
  cardSize,
  colors,
}: {
  card: CardItem;
  isFlipped: boolean;
  isMatched: boolean;
  onPress: () => void;
  cardSize: number;
  colors: any;
}) {
  const animatedValue = useRef(new Animated.Value(isFlipped ? 180 : 0)).current;

  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: isFlipped ? 180 : 0,
      friction: 7,
      tension: 12,
      useNativeDriver: true,
    }).start();
  }, [isFlipped]);

  const frontInterpolate = animatedValue.interpolate({
    inputRange: [0, 180],
    outputRange: ["180deg", "360deg"],
  });

  const backInterpolate = animatedValue.interpolate({
    inputRange: [0, 180],
    outputRange: ["0deg", "180deg"],
  });

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      style={[
        styles.cardWrapper,
        { width: cardSize, height: cardSize + 14 },
        isMatched && styles.matchedWrapper,
      ]}
      onPress={onPress}
    >
      <View style={{ width: cardSize, height: cardSize + 14 }}>
        {/* Front Face */}
        <Animated.View
          style={[
            styles.memoryCardFace,
            {
              backgroundColor: colors.surfaceElevated,
              borderColor: isMatched ? colors.green : colors.accent,
              borderWidth: 1.5,
              transform: [{ perspective: 1000 }, { rotateY: frontInterpolate }],
              backfaceVisibility: "hidden",
            },
          ]}
        >
          <Text style={styles.cardEmoji}>{card.emoji || "✨"}</Text>
          <Text
            style={[
              styles.cardText,
              {
                color: colors.text,
                fontFamily: fonts.bodyBold,
                fontSize: card.text.length > 25 ? 10 : 11,
              },
            ]}
            numberOfLines={3}
          >
            {card.text}
          </Text>
          <View
            style={[
              styles.typeChip,
              {
                backgroundColor:
                  card.type === "q" ? colors.primarySoft : colors.goldSoft,
              },
            ]}
          >
            <Text
              style={[
                styles.typeText,
                {
                  color: card.type === "q" ? colors.primary : colors.gold,
                  fontFamily: fonts.bodyBold,
                },
              ]}
            >
              {card.type === "q" ? "PROMPT" : "MATCH"}
            </Text>
          </View>
        </Animated.View>

        {/* Back Face */}
        <Animated.View
          style={[
            styles.memoryCardFace,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderWidth: 1,
              transform: [{ perspective: 1000 }, { rotateY: backInterpolate }],
              backfaceVisibility: "hidden",
            },
          ]}
        >
          <Text style={styles.cardBackLogo}>💎</Text>
          <Text
            style={[
              styles.cardBackText,
              { color: colors.textMuted, fontFamily: fonts.bodyBold },
            ]}
          >
            QUIZ
          </Text>
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
}

export function MemoryPlayScreen() {
  const { colors } = useTheme();
  const { t, lang } = useI18n();
  const navigation = useNavigation();
  const { refreshUser } = useAuth();
  const { isSoundEnabled, toggleSound } = useSoundEnabled();

  const [loading, setLoading] = useState(true);
  const [packs, setPacks] = useState<MemoryPack[]>([]);
  const [currentPack, setCurrentPack] = useState<MemoryPack | null>(null);
  const [cards, setCards] = useState<CardItem[]>([]);
  const [flippedUids, setFlippedUids] = useState<string[]>([]);
  const [matchedPairIds, setMatchedPairIds] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [earnedStars, setEarnedStars] = useState(1);
  const [earnedXp, setEarnedXp] = useState(0);

  const startTimeRef = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const processingRef = useRef(false);

  // Load available packs
  const loadPacks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMemoryPacks();
      setPacks(res.packs);
      if (res.packs.length > 0) {
        // Pick a random pack instead of always index 0
        const rnd = res.packs[Math.floor(Math.random() * res.packs.length)];
        setupGame(rnd);
      }
    } catch {
      // Handled in view
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPacks();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loadPacks]);

  const setupGame = (pack: MemoryPack) => {
    setCurrentPack(pack);
    const items: CardItem[] = [];
    pack.pairs.forEach((p: MemoryPair) => {
      items.push({ uid: `${p.id}-q`, pairId: p.id, type: "q", text: p.q, emoji: p.emoji });
      items.push({ uid: `${p.id}-a`, pairId: p.id, type: "a", text: p.a, emoji: p.emoji });
    });

    // Shuffle cards
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }

    setCards(items);
    setFlippedUids([]);
    setMatchedPairIds([]);
    setMoves(0);
    setSecondsLeft(pack.timeLimitSec || 60);
    setGameStarted(true);
    setGameEnded(false);
    setLoading(false);
    processingRef.current = false;
    startTimeRef.current = Date.now();

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 6 && prev > 1) {
          SoundEffects.playTick();
        }
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleGameOver(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const onCardPress = (card: CardItem) => {
    if (
      processingRef.current ||
      matchedPairIds.includes(card.pairId) ||
      flippedUids.includes(card.uid) ||
      flippedUids.length >= 2 ||
      gameEnded
    ) {
      return;
    }

    SoundEffects.playCardFlip();
    const nextFlipped = [...flippedUids, card.uid];
    setFlippedUids(nextFlipped);

    if (nextFlipped.length === 2) {
      setMoves((m) => m + 1);
      processingRef.current = true;

      const firstCard = cards.find((c) => c.uid === nextFlipped[0])!;
      const secondCard = card;

      if (firstCard.pairId === secondCard.pairId) {
        // MATCH!
        SoundEffects.playCorrect();
        const nextMatched = [...matchedPairIds, firstCard.pairId];
        setMatchedPairIds(nextMatched);
        setFlippedUids([]);
        processingRef.current = false;

        // Check if all matched
        if (nextMatched.length === (currentPack?.pairs.length || 6)) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleGameWon();
        }
      } else {
        // MISMATCH — flip back after short pause
        SoundEffects.playWrong();
        setTimeout(() => {
          setFlippedUids([]);
          processingRef.current = false;
        }, 850);
      }
    }
  };

  const handleGameWon = async () => {
    setGameEnded(true);
    SoundEffects.playVictory();
    const timeSpent = Math.max(1000, Date.now() - startTimeRef.current);

    if (currentPack) {
      try {
        const res = await submitMemoryScore({
          packId: currentPack.id,
          moves: moves + 1,
          timeMs: timeSpent,
        });
        setEarnedStars(res.stars);
        setEarnedXp(res.xpEarned);
        refreshUser();
      } catch {
        setEarnedStars(2);
        setEarnedXp(40);
      }
    }
  };

  const loadNextRandomPack = async () => {
    try {
      setLoading(true);
      const res = await getRandomMemoryPack();
      if (res.pack) {
        setupGame(res.pack);
        return;
      }
      if (packs.length > 0) {
        const otherPacks = packs.filter((p) => p.id !== currentPack?.id);
        const pool = otherPacks.length > 0 ? otherPacks : packs;
        const rnd = pool[Math.floor(Math.random() * pool.length)];
        setupGame(rnd);
      }
    } catch {
      // Fallback to local pool if random endpoint fails
      if (packs.length > 0) {
        const otherPacks = packs.filter((p) => p.id !== currentPack?.id);
        const pool = otherPacks.length > 0 ? otherPacks : packs;
        const rnd = pool[Math.floor(Math.random() * pool.length)];
        setupGame(rnd);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGameOver = (_won: boolean) => {
    setGameEnded(true);
  };

  if (loading) return <LoadingView message="Loading Memory Blocks..." />;
  if (!currentPack) return <ErrorCard onRetry={loadPacks} />;

  const title = lang === "ne" && currentPack.titleNe ? currentPack.titleNe : currentPack.titleEn;
  const isUrgent = secondsLeft <= 10;

  return (
    <Atmosphere>
      <SafeAreaView style={styles.safe} edges={["top"]}>
        {/* Header HUD */}
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: colors.surface }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.backBtnText, { color: colors.text }]}>✕</Text>
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={[styles.modeTag, { color: colors.accent, fontFamily: fonts.bodyBold }]}>
              🧠 MEMORY BLOCK
            </Text>
            <Text
              style={[styles.packTitle, { color: colors.text, fontFamily: fonts.display }]}
              numberOfLines={1}
            >
              {title}
            </Text>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <TouchableOpacity
              onPress={toggleSound}
              style={[
                styles.soundToggleBtn,
                {
                  backgroundColor: colors.surfaceElevated,
                  borderColor: colors.border,
                },
              ]}
              activeOpacity={0.7}
              accessibilityLabel={isSoundEnabled ? "Mute sound" : "Unmute sound"}
            >
              <Text style={{ fontSize: 16 }}>{isSoundEnabled ? "🔊" : "🔇"}</Text>
            </TouchableOpacity>

            <View
              style={[
                styles.timerPill,
                {
                  backgroundColor: isUrgent ? colors.dangerSoft : colors.primarySoft,
                  borderColor: isUrgent ? colors.danger : colors.primary,
                },
              ]}
            >
              <Text
                style={[
                  styles.timerText,
                  {
                    color: isUrgent ? colors.danger : colors.primary,
                    fontFamily: fonts.bodyBold,
                  },
                ]}
              >
                ⏱ {secondsLeft}s
              </Text>
            </View>
          </View>
        </View>

        {/* Stats Row: Moves & Pairs remaining */}
        <View style={styles.statsBar}>
          <View style={[styles.statChip, { backgroundColor: colors.surfaceElevated }]}>
            <Text style={[styles.statLabel, { color: colors.textMuted, fontFamily: fonts.body }]}>
              Moves:
            </Text>
            <Text style={[styles.statValue, { color: colors.text, fontFamily: fonts.bodyBold }]}>
              {moves}
            </Text>
          </View>

          <View style={[styles.statChip, { backgroundColor: colors.surfaceElevated }]}>
            <Text style={[styles.statLabel, { color: colors.textMuted, fontFamily: fonts.body }]}>
              Matched:
            </Text>
            <Text style={[styles.statValue, { color: colors.green, fontFamily: fonts.bodyBold }]}>
              {matchedPairIds.length} / {currentPack.pairs.length}
            </Text>
          </View>
        </View>

        {/* 3D Memory Card Grid */}
        <ScrollView contentContainerStyle={styles.gridContainer}>
          <View style={styles.grid}>
            {cards.map((card) => {
              const isFlipped =
                flippedUids.includes(card.uid) || matchedPairIds.includes(card.pairId);
              const isMatched = matchedPairIds.includes(card.pairId);

              return (
                <MemoryCardItem
                  key={card.uid}
                  card={card}
                  isFlipped={isFlipped}
                  isMatched={isMatched}
                  onPress={() => onCardPress(card)}
                  cardSize={CARD_SIZE}
                  colors={colors}
                />
              );
            })}
          </View>

          {/* Pack Selection Carousel */}
          <View style={styles.packsSection}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text
                style={[
                  styles.packsSectionTitle,
                  { color: colors.textMuted, fontFamily: fonts.bodyBold },
                ]}
              >
                SELECT PACK (1,000+ AVAILABLE)
              </Text>
              <TouchableOpacity
                onPress={loadNextRandomPack}
                style={[styles.randomPill, { backgroundColor: colors.accentSoft, borderColor: colors.accent }]}
              >
                <Text style={[styles.randomPillText, { color: colors.accent, fontFamily: fonts.bodyBold }]}>
                  🎲 Random Quest
                </Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.packScroll}>
              {packs.map((p) => {
                const isCurrent = p.id === currentPack.id;
                // Subject-based emoji and color
                const subjectMeta: Record<string, { icon: string; color: string }> = {
                  nepal:      { icon: "🏔️", color: "#E53935" },
                  science:    { icon: "🔬", color: "#1E88E5" },
                  math:       { icon: "➗",  color: "#8E24AA" },
                  geography:  { icon: "🌍", color: "#43A047" },
                  english:    { icon: "📖", color: "#FB8C00" },
                  sports:     { icon: "⚽", color: "#00ACC1" },
                  technology: { icon: "💻", color: "#5E35B1" },
                  fun:        { icon: "🎉", color: "#F4511E" },
                  health:     { icon: "🏥", color: "#00897B" },
                  arts:       { icon: "🎨", color: "#D81B60" },
                };
                const meta = subjectMeta[p.subject] || { icon: "🧩", color: "#7E57C2" };
                const stars = "⭐".repeat(p.difficulty || 1);

                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[
                      styles.packCard,
                      {
                        backgroundColor: isCurrent ? colors.primarySoft : colors.surface,
                        borderColor: isCurrent ? colors.primary : colors.border,
                        borderWidth: isCurrent ? 2 : 1,
                      },
                    ]}
                    onPress={() => setupGame(p)}
                  >
                    <View style={[styles.packCardIcon, { backgroundColor: meta.color + "22" }]}>
                      <Text style={styles.packCardEmoji}>{meta.icon}</Text>
                    </View>
                    <Text
                      style={[
                        styles.packCardTitle,
                        {
                          color: isCurrent ? colors.primary : colors.text,
                          fontFamily: fonts.bodyBold,
                        },
                      ]}
                      numberOfLines={2}
                    >
                      {p.titleEn}
                    </Text>
                    <View style={styles.packCardMeta}>
                      <Text style={[styles.packCardStars, { color: colors.gold }]}>{stars}</Text>
                      <Text style={[styles.packCardTime, { color: colors.textMuted }]}>
                        ⏱{p.timeLimitSec}s
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </ScrollView>

        {/* Victory Modal Overlay */}
        {gameEnded && (
          <View style={styles.modalOverlay}>
            {matchedPairIds.length === currentPack.pairs.length && (
              <ConfettiEffect count={45} />
            )}
            <EmojiBurst />
            <Card
              style={StyleSheet.flatten([
                styles.victoryCard,
                { borderColor: colors.gold, borderWidth: 2 },
              ])}
            >
              <Text style={styles.victoryEmoji}>🏆</Text>
              <Text
                style={[
                  styles.victoryTitle,
                  { color: colors.text, fontFamily: fonts.display },
                ]}
              >
                {matchedPairIds.length === currentPack.pairs.length
                  ? "QUEST CLEARED!"
                  : "TIME'S UP!"}
              </Text>

              {/* Stars */}
              <View style={styles.starsRow}>
                {[1, 2, 3].map((star) => (
                  <Text
                    key={star}
                    style={[
                      styles.starEmoji,
                      { opacity: star <= earnedStars ? 1 : 0.25 },
                    ]}
                  >
                    ⭐
                  </Text>
                ))}
              </View>

              <View style={styles.victoryStats}>
                <View style={[styles.victoryStatBox, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.victoryStatLabel, { color: colors.textMuted }]}>
                    Moves
                  </Text>
                  <Text
                    style={[
                      styles.victoryStatVal,
                      { color: colors.text, fontFamily: fonts.display },
                    ]}
                  >
                    {moves}
                  </Text>
                </View>
                <View style={[styles.victoryStatBox, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.victoryStatLabel, { color: colors.textMuted }]}>
                    XP Bounty
                  </Text>
                  <Text
                    style={[
                      styles.victoryStatVal,
                      { color: colors.primary, fontFamily: fonts.display },
                    ]}
                  >
                    +{earnedXp}
                  </Text>
                </View>
              </View>

              <View style={styles.victoryButtons}>
                <PrimaryButton
                  label="⚡ Next Random Quest"
                  onPress={loadNextRandomPack}
                  variant="primary"
                />
                <PrimaryButton
                  label="Play Again"
                  onPress={() => setupGame(currentPack)}
                  variant="accent"
                />
                <PrimaryButton
                  label="Back to Home"
                  onPress={() => navigation.goBack()}
                  variant="ghost"
                />
              </View>
            </Card>
          </View>
        )}
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
    paddingVertical: spacing.md,
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
    letterSpacing: 1,
  },
  packTitle: {
    fontSize: 16,
    marginTop: 2,
  },
  timerPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.chip,
    borderWidth: 1,
  },
  timerText: {
    fontSize: 13,
  },
  statsBar: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  statChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.small,
  },
  statLabel: {
    fontSize: 12,
  },
  statValue: {
    fontSize: 13,
  },
  gridContainer: {
    padding: spacing.lg,
    alignItems: "center",
    paddingBottom: spacing.xxl,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    justifyContent: "center",
  },
  cardWrapper: {
    marginBottom: spacing.xs,
  },
  matchedWrapper: {
    opacity: 0.85,
  },
  memoryCardFace: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: radius.card,
    padding: spacing.xs + 2,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.card,
  },
  randomPill: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: radius.chip,
    borderWidth: 1,
  },
  randomPillText: {
    fontSize: 11,
    letterSpacing: 0.5,
  },
  memoryCard: {
    flex: 1,
    padding: spacing.xs,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.small,
  },
  cardFront: {
    alignItems: "center",
    justifyContent: "space-between",
    flex: 1,
    paddingVertical: 4,
  },
  cardEmoji: {
    fontSize: 26,
  },
  cardText: {
    textAlign: "center",
    lineHeight: 14,
    paddingHorizontal: 2,
  },
  typeChip: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 2,
  },
  typeText: {
    fontSize: 8,
    letterSpacing: 0.5,
  },
  cardBack: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  cardBackLogo: {
    fontSize: 28,
  },
  cardBackText: {
    fontSize: 9,
    letterSpacing: 1,
  },
  packsSection: {
    width: "100%",
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  packsSectionTitle: {
    fontSize: 11,
    letterSpacing: 1,
  },
  packScroll: {
    flexDirection: "row",
  },
  packCard: {
    width: 130,
    padding: spacing.sm,
    borderRadius: radius.card,
    marginRight: spacing.sm,
    gap: spacing.xs,
  },
  packCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  packCardEmoji: {
    fontSize: 25,
  },
  packCardTitle: {
    fontSize: 12,
    lineHeight: 16,
    minHeight: 32,
  },
  packCardMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
  },
  packCardStars: {
    fontSize: 9,
  },
  packCardTime: {
    fontSize: 10,
    fontWeight: "600",
  },
  modalOverlay: {
    ...(StyleSheet.absoluteFill as object),
    backgroundColor: "rgba(10, 14, 39, 0.85)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    zIndex: 99999,
    elevation: 99999,
  },
  soundToggleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  victoryCard: {
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
    padding: spacing.xl,
    gap: spacing.md,
    borderRadius: radius.card,
  },
  victoryEmoji: {
    fontSize: 48,
  },
  victoryTitle: {
    fontSize: 22,
    textAlign: "center",
  },
  starsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  starEmoji: {
    fontSize: 32,
  },
  victoryStats: {
    flexDirection: "row",
    gap: spacing.md,
    width: "100%",
  },
  victoryStatBox: {
    flex: 1,
    alignItems: "center",
    padding: spacing.md,
    borderRadius: radius.small,
    gap: 2,
  },
  victoryStatLabel: {
    fontSize: 11,
    textTransform: "uppercase",
  },
  victoryStatVal: {
    fontSize: 20,
  },
  victoryButtons: {
    width: "100%",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
