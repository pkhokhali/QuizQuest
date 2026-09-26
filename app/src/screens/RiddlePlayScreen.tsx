import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { getDailyRiddle, getRandomRiddle, solveDailyRiddle } from "../api/client";
import { RiddleData } from "../api/types";
import { Atmosphere } from "../components/Atmosphere";
import { Card } from "../components/Card";
import { ConfettiEffect } from "../components/ConfettiEffect";
import { GameRulesModal } from "../components/GameRulesModal";
import { useAuth } from "../state/AuthContext";
import { useI18n } from "../state/LanguageContext";
import { useTheme } from "../state/ThemeContext";
import { fonts, radius, shadow, spacing } from "../theme";
import { SoundEffects, useSoundEnabled } from "../utils/audio";
import { getOfflineRiddle, queueOfflineSubmission } from "../utils/offlineStore";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export function RiddlePlayScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { lang } = useI18n();
  const { colors } = useTheme();
  const { refreshUser } = useAuth();
  const { isSoundEnabled, toggleSound } = useSoundEnabled();

  const isNepali = lang === "ne";
  const initialMode = route.params?.initialMode || "daily";

  const [gameMode, setGameMode] = useState<"daily" | "practice">(initialMode);
  const [loading, setLoading] = useState(true);
  const [currentRiddle, setCurrentRiddle] = useState<RiddleData | null>(null);
  const [sessionSolvedCount, setSessionSolvedCount] = useState(0);
  const [showRules, setShowRules] = useState(false);

  // Reveal Answer state
  const [isRevealed, setIsRevealed] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [awardedXp, setAwardedXp] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Card Flip / Scale animations
  const flipAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const riddleText = useMemo(() => {
    if (!currentRiddle) return "";
    return (
      (isNepali && currentRiddle.riddleNe ? currentRiddle.riddleNe : currentRiddle.riddleEn) ||
      currentRiddle.riddleEn ||
      currentRiddle.riddleNe ||
      ""
    );
  }, [currentRiddle, isNepali]);

  const rawAnswer = useMemo(() => {
    if (!currentRiddle) return "";
    return (
      (isNepali && currentRiddle.answerNe ? currentRiddle.answerNe : currentRiddle.answerEn) ||
      currentRiddle.answerEn ||
      currentRiddle.answerNe ||
      ""
    );
  }, [currentRiddle, isNepali]);

  const meaningText = useMemo(() => {
    if (!currentRiddle) return "";
    return isNepali && currentRiddle.meaningNe
      ? currentRiddle.meaningNe
      : currentRiddle.meaningEn || "";
  }, [currentRiddle, isNepali]);

  // Load daily riddle
  const loadDaily = useCallback(async () => {
    setLoading(true);
    setIsRevealed(false);
    setHasRated(false);
    setAwardedXp(0);
    flipAnim.setValue(0);
    try {
      const res = await getDailyRiddle();
      if (res.riddle) {
        setCurrentRiddle(res.riddle);
        if (res.riddle.solved) {
          setIsRevealed(true);
          setHasRated(true);
          flipAnim.setValue(1);
        }
      } else {
        setCurrentRiddle(getOfflineRiddle());
      }
    } catch {
      // Offline fallback: Use bundled offline riddle!
      setCurrentRiddle(getOfflineRiddle());
    } finally {
      setLoading(false);
    }
  }, [flipAnim]);

  // Load next random riddle
  const loadNextRandom = useCallback(async () => {
    setLoading(true);
    setIsRevealed(false);
    setHasRated(false);
    setAwardedXp(0);
    flipAnim.setValue(0);
    try {
      const res = await getRandomRiddle();
      if (res.riddle) {
        setCurrentRiddle(res.riddle);
      } else {
        setCurrentRiddle(getOfflineRiddle());
      }
    } catch {
      // Offline fallback: Use bundled offline riddle!
      setCurrentRiddle(getOfflineRiddle());
    } finally {
      setLoading(false);
    }
  }, [flipAnim]);

  useEffect(() => {
    if (gameMode === "daily") {
      loadDaily();
    } else {
      loadNextRandom();
    }
  }, [gameMode, loadDaily, loadNextRandom]);

  // Animated Reveal Answer
  const handleRevealAnswer = useCallback(() => {
    if (isRevealed) return;
    SoundEffects.playCardFlip();
    Animated.spring(flipAnim, {
      toValue: 1,
      tension: 60,
      friction: 8,
      useNativeDriver: true,
    }).start();
    setIsRevealed(true);
  }, [isRevealed, flipAnim]);

  // Self-Rate: "मैले मिलाएँ! (+15 XP)"
  const handleGotItRight = useCallback(async () => {
    if (hasRated || !currentRiddle || submitting) return;
    setSubmitting(true);
    SoundEffects.playCorrect();

    try {
      if (gameMode === "daily" && !currentRiddle.solved) {
        const res = await solveDailyRiddle(currentRiddle.id);
        if (res.success) {
          setAwardedXp(res.xpEarned || 15);
          refreshUser();
        }
      } else {
        setAwardedXp(15);
      }
      setSessionSolvedCount((prev) => prev + 1);
      setHasRated(true);
    } catch {
      // Queue offline riddle solve for sync when reconnected!
      if (gameMode === "daily") {
        queueOfflineSubmission("riddle", "/api/riddle/solve", { riddleId: currentRiddle.id });
      }
      setAwardedXp(15);
      setSessionSolvedCount((prev) => prev + 1);
      setHasRated(true);
    } finally {
      setSubmitting(false);
    }
  }, [hasRated, currentRiddle, submitting, gameMode, refreshUser]);

  // Self-Rate: "मलाई थाहा थिएन (Did Not Know)"
  const handleDidNotKnow = useCallback(() => {
    if (hasRated) return;
    SoundEffects.playTap();
    setHasRated(true);
  }, [hasRated]);

  // Share riddle with friends
  const handleShareRiddle = () => {
    if (!currentRiddle) return;
    const shareMessage = isNepali
      ? `🧩 गाउँखाने कथा:\n"${riddleText}"\n\nके तपाईं उत्तर दिन सक्नुहुन्छ? QuizQuest एपमा खेल्नुहोस्!`
      : `🧩 Nepali Gaunkhane Katha:\n"${riddleText}"\n\nCan you solve this riddle? Play on QuizQuest!`;
    Share.share({ message: shareMessage });
  };

  return (
    <Atmosphere style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {awardedXp > 0 && <ConfettiEffect count={40} />}

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.headerBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Text style={[styles.headerBtnText, { color: colors.text }]}>✕</Text>
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: colors.text, fontFamily: fonts.bodyBold }]}>
              🧩 {isNepali ? "गाउँखाने कथा" : "Gaunkhane Katha"}
            </Text>
            <Text style={[styles.headerSub, { color: colors.textMuted, fontFamily: fonts.body }]}>
              {gameMode === "daily"
                ? isNepali
                  ? "दैनिक पहेली चुनौती"
                  : "Daily Riddle Challenge"
                : isNepali
                ? `असीमित पहेली • ${sessionSolvedCount} हल`
                : `Free Play • ${sessionSolvedCount} solved`}
            </Text>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <TouchableOpacity
              style={[styles.headerBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => setShowRules(true)}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 16 }}>❓</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.headerBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={toggleSound}
              activeOpacity={0.7}
            >
              <Text style={styles.headerBtnText}>{isSoundEnabled ? "🔊" : "🔇"}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Mode Selector Tabs */}
          <View style={[styles.modeTabs, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity
              style={[
                styles.modeTab,
                gameMode === "daily" && [styles.activeTab, { backgroundColor: colors.primary }],
              ]}
              onPress={() => setGameMode("daily")}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.modeTabText,
                  { color: gameMode === "daily" ? "#FFF" : colors.textMuted, fontFamily: fonts.bodyBold },
                ]}
              >
                🌟 {isNepali ? "दैनिक कथा" : "Daily Challenge"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modeTab,
                gameMode === "practice" && [styles.activeTab, { backgroundColor: colors.primary }],
              ]}
              onPress={() => setGameMode("practice")}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.modeTabText,
                  { color: gameMode === "practice" ? "#FFF" : colors.textMuted, fontFamily: fonts.bodyBold },
                ]}
              >
                🎲 {isNepali ? "असीमित पहेली (५०+)" : "Free Play (50+)"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Loading Indicator */}
          {loading ? (
            <View style={styles.loaderBox}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loaderText, { color: colors.textMuted, fontFamily: fonts.body }]}>
                {isNepali ? "गाउँखाने कथा खोजिँदै..." : "Fetching riddle..."}
              </Text>
            </View>
          ) : currentRiddle ? (
            <View style={styles.riddleWrapper}>
              {/* Question Card */}
              <Card style={[styles.riddleCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {/* Badge Row */}
                <View style={styles.badgeRow}>
                  <View style={[styles.categoryBadge, { backgroundColor: colors.primary + "20" }]}>
                    <Text style={[styles.categoryBadgeText, { color: colors.primary, fontFamily: fonts.bodyBold }]}>
                      📜 {isNepali ? currentRiddle.categoryNe || "मौलिक पहेली" : currentRiddle.categoryEn || "Folk Riddle"}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.shareBadge, { backgroundColor: colors.surface }]}
                    onPress={handleShareRiddle}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.shareBadgeText, { color: colors.textMuted }]}>📤 {isNepali ? "सेयर" : "Share"}</Text>
                  </TouchableOpacity>
                </View>

                {/* Riddle Text Prompt */}
                <View style={styles.riddleTextContainer}>
                  <Text style={[styles.quoteMark, { color: colors.primary }]}>“</Text>
                  <Text style={[styles.riddlePromptText, { color: colors.text, fontFamily: fonts.bodyBold }]}>
                    {riddleText}
                  </Text>
                  <Text style={[styles.quoteMarkRight, { color: colors.primary }]}>”</Text>
                </View>

                {/* Clue subtitle */}
                <Text style={[styles.clueSub, { color: colors.textMuted, fontFamily: fonts.body }]}>
                  {isNepali
                    ? "यस गाउँखाने कथाको उत्तर के हुन सक्छ? सोच्नुहोस् र तल उत्तर हेर्नुहोस्!"
                    : "Ponder this authentic Nepali riddle, then reveal the answer below!"}
                </Text>

                {/* Reveal Answer Button (If Not Yet Revealed) */}
                {!isRevealed ? (
                  <TouchableOpacity
                    style={[styles.revealBtn, { backgroundColor: colors.primary }]}
                    onPress={handleRevealAnswer}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.revealBtnText, { fontFamily: fonts.bodyBold }]}>
                      👁️ {isNepali ? "उत्तर हेर्नुहोस्" : "Reveal Answer"}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  /* Revealed Answer Box */
                  <View style={[styles.revealedContainer, { backgroundColor: colors.surface, borderColor: colors.gold }]}>
                    <View style={styles.answerBanner}>
                      <Text style={styles.answerEmoji}>💡</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.answerLabel, { color: colors.textMuted, fontFamily: fonts.body }]}>
                          {isNepali ? "सही उत्तर" : "Correct Answer"}
                        </Text>
                        <Text style={[styles.answerValue, { color: colors.gold, fontFamily: fonts.bodyBold }]}>
                          {rawAnswer}
                        </Text>
                      </View>
                    </View>

                    {meaningText ? (
                      <View style={styles.meaningBox}>
                        <Text style={[styles.meaningText, { color: colors.text, fontFamily: fonts.body }]}>
                          {meaningText}
                        </Text>
                      </View>
                    ) : null}

                    {/* Self-Rating Action (If not rated yet) */}
                    {!hasRated ? (
                      <View style={styles.ratingSection}>
                        <Text style={[styles.ratingTitle, { color: colors.textMuted, fontFamily: fonts.body }]}>
                          {isNepali ? "के तपाईंले मिलाउनुभएको थियो?" : "Did you guess it correctly?"}
                        </Text>

                        <View style={styles.ratingBtnRow}>
                          <TouchableOpacity
                            style={[styles.rateRightBtn, { backgroundColor: colors.green }]}
                            onPress={handleGotItRight}
                            disabled={submitting}
                            activeOpacity={0.8}
                          >
                            <Text style={[styles.rateBtnText, { fontFamily: fonts.bodyBold }]}>
                              ✓ {isNepali ? "मैले मिलाएँ! (+१५ XP)" : "I got it right! (+15 XP)"}
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.rateWrongBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                            onPress={handleDidNotKnow}
                            activeOpacity={0.8}
                          >
                            <Text style={[styles.rateWrongText, { color: colors.textMuted, fontFamily: fonts.body }]}>
                              {isNepali ? "मलाई थाहा थिएन" : "Did not know"}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      /* Celebration or Completed Banner */
                      <View style={[styles.ratedBanner, { backgroundColor: "rgba(16, 185, 129, 0.1)" }]}>
                        <Text style={[styles.ratedBannerText, { color: colors.green, fontFamily: fonts.bodyBold }]}>
                          {awardedXp > 0
                            ? isNepali
                              ? `🎉 बधाई छ! +${awardedXp} XP प्राप्त भयो!`
                              : `🎉 Awesome! +${awardedXp} XP earned!`
                            : isNepali
                            ? "✓ नयाँ मौलिक ज्ञान सिकाइ भयो!"
                            : "✓ Great learning experience!"}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </Card>

              {/* Bottom Action: Next Riddle */}
              <TouchableOpacity
                style={[styles.nextRiddleBtn, { backgroundColor: colors.surface, borderColor: colors.primary }]}
                onPress={gameMode === "daily" ? () => setGameMode("practice") : loadNextRandom}
                activeOpacity={0.8}
              >
                <Text style={[styles.nextRiddleBtnText, { color: colors.primary, fontFamily: fonts.bodyBold }]}>
                  {gameMode === "daily"
                    ? isNepali
                      ? "थप असीमित पहेली खेल्नुहोस् (५०+) ➔"
                      : "Play More Unlimited Riddles (50+) ➔"
                    : isNepali
                    ? "अर्को नयाँ कथा ➔"
                    : "Next Riddle ➔"}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.loaderBox}>
              <Text style={[styles.loaderText, { color: colors.textMuted, fontFamily: fonts.body }]}>
                {isNepali ? "कुनै पहेली फेला परेन।" : "No riddles available."}
              </Text>
            </View>
          )}
        </ScrollView>

        <GameRulesModal
          visible={showRules}
          gameId="riddle"
          onClose={() => setShowRules(false)}
        />
      </SafeAreaView>
    </Atmosphere>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerBtnText: {
    fontSize: 16,
    fontWeight: "700",
  },
  headerCenter: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  headerSub: {
    fontSize: 12,
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  modeTabs: {
    flexDirection: "row",
    borderRadius: radius.pill,
    borderWidth: 1,
    padding: 3,
    marginVertical: spacing.md,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  activeTab: {
    ...shadow.sm,
  },
  modeTabText: {
    fontSize: 13,
  },
  loaderBox: {
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  loaderText: {
    fontSize: 14,
    marginTop: spacing.md,
  },
  riddleWrapper: {
    marginTop: spacing.xs,
  },
  riddleCard: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1.5,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  categoryBadgeText: {
    fontSize: 12,
  },
  shareBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  shareBadgeText: {
    fontSize: 12,
  },
  riddleTextContainer: {
    position: "relative",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  quoteMark: {
    fontSize: 32,
    fontWeight: "900",
    lineHeight: 32,
    marginBottom: -10,
  },
  quoteMarkRight: {
    fontSize: 32,
    fontWeight: "900",
    lineHeight: 32,
    alignSelf: "flex-end",
    marginTop: -10,
  },
  riddlePromptText: {
    fontSize: 22,
    lineHeight: 34,
    textAlign: "center",
  },
  clueSub: {
    fontSize: 13,
    textAlign: "center",
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    opacity: 0.85,
  },
  revealBtn: {
    paddingVertical: 16,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.md,
  },
  revealBtnText: {
    color: "#FFF",
    fontSize: 16,
  },
  revealedContainer: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
  },
  answerBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  answerEmoji: {
    fontSize: 32,
  },
  answerLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  answerValue: {
    fontSize: 22,
    fontWeight: "800",
    marginTop: 2,
  },
  meaningBox: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  meaningText: {
    fontSize: 14,
    lineHeight: 20,
    fontStyle: "italic",
  },
  ratingSection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  ratingTitle: {
    fontSize: 13,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  ratingBtnRow: {
    flexDirection: "column",
    gap: spacing.sm,
  },
  rateRightBtn: {
    paddingVertical: 12,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  rateBtnText: {
    color: "#FFF",
    fontSize: 14,
  },
  rateWrongBtn: {
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  rateWrongText: {
    fontSize: 13,
  },
  ratedBanner: {
    marginTop: spacing.sm,
    padding: 10,
    borderRadius: radius.sm,
    alignItems: "center",
  },
  ratedBannerText: {
    fontSize: 13,
  },
  nextRiddleBtn: {
    marginTop: spacing.md,
    paddingVertical: 14,
    borderRadius: radius.md,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  nextRiddleBtnText: {
    fontSize: 15,
  },
});
