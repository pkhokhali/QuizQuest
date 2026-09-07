import { useFocusEffect, useNavigation } from "@react-navigation/native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getHome } from "../api/client";
import { HomeData } from "../api/types";
import { Atmosphere } from "../components/Atmosphere";
import { AvatarCircle } from "../components/AvatarCircle";
import { Card } from "../components/Card";
import { ErrorCard } from "../components/ErrorCard";
import { LoadingView } from "../components/LoadingView";
import { IconFlame, IconMap } from "../components/QuestIcons";
import { StreakFlame } from "../components/StreakFlame";
import { XpBar } from "../components/XpBar";
import { xpForLevel } from "../constants";
import { useTabScreenPadding } from "../navigation/useTabScreenPadding";
import { useAuth } from "../state/AuthContext";
import { useI18n } from "../state/LanguageContext";
import { useTheme } from "../state/ThemeContext";
import { fonts, radius, spacing } from "../theme";

export function HomeScreen() {
  const { t, lang } = useI18n();
  const { user, setUser } = useAuth();
  const { colors } = useTheme();
  const navigation = useNavigation();
  const pulse = useRef(new Animated.Value(1)).current;
  const tabPadding = useTabScreenPadding();

  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.06,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const load = useCallback(
    async (asRefresh = false) => {
      if (asRefresh) setRefreshing(true);
      setFailed(false);
      try {
        const home = await getHome();
        setData(home);
        setUser(home.user);
      } catch {
        if (!asRefresh) setFailed(true);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [setUser]
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading && !data) return <LoadingView />;
  if (failed && !data) return <ErrorCard onRetry={() => load()} />;
  if (!data || !user) return <LoadingView />;

  const levelXpNeeded = xpForLevel(data.user.level);
  const xpIntoLevel = data.user.xp % levelXpNeeded;
  const quizDone = data.dailyQuiz.status === "completed";
  const digest = data.digest;

  return (
    <Atmosphere>
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: tabPadding }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor={colors.primary}
            />
          }
        >
          {/* Student Profile & Greeting HUD */}
          <View style={styles.greetingRow}>
            <View style={styles.greetingText}>
              <View style={styles.brandBadgeRow}>
                <Text
                  style={[
                    styles.brandHint,
                    { color: colors.primary, fontFamily: fonts.bodyBold },
                  ]}
                >
                  {t("appName")}
                </Text>
                <View
                  style={[
                    styles.levelPill,
                    { backgroundColor: colors.primary, borderColor: colors.primaryDark },
                  ]}
                >
                  <Text
                    style={[
                      styles.levelPillText,
                      { color: colors.textOnPrimary, fontFamily: fonts.bodyBold },
                    ]}
                  >
                    Lv. {data.user.level}
                  </Text>
                </View>
              </View>

              <Text
                style={[styles.greeting, { color: colors.text, fontFamily: fonts.display }]}
              >
                {t("homeGreeting", { name: data.user.name })}
              </Text>
              <Text
                style={[
                  styles.greetingSub,
                  { color: colors.textMuted, fontFamily: fonts.body },
                ]}
              >
                ✨ {t("tagline")}
              </Text>
            </View>
            <AvatarCircle avatar={data.user.avatar} size={54} />
          </View>

          {/* Player Progression & Streak HUD Card */}
          <Card style={styles.streakCard}>
            <View style={styles.streakTop}>
              <View style={styles.streakLeft}>
                <Animated.View style={{ transform: [{ scale: pulse }] }}>
                  <StreakFlame count={data.user.streak} size={48} />
                </Animated.View>
                <View>
                  <Text
                    style={[
                      styles.streakCountText,
                      { color: colors.text, fontFamily: fonts.display },
                    ]}
                  >
                    {data.user.streak} {t("homeStreakDays")}
                  </Text>
                  <Text
                    style={[
                      styles.streakLabel,
                      { color: colors.textMuted, fontFamily: fonts.body },
                    ]}
                  >
                    {t("homeStreakKeepGoing")}
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.weeklyBox,
                  { backgroundColor: colors.bgMid, borderColor: colors.border },
                ]}
              >
                <Text
                  style={[
                    styles.weeklyXp,
                    { color: colors.accent, fontFamily: fonts.display },
                  ]}
                >
                  +{data.weeklyXp}
                </Text>
                <Text
                  style={[
                    styles.weeklyLabel,
                    { color: colors.textMuted, fontFamily: fonts.bodyBold },
                  ]}
                >
                  {t("homeWeeklyXp")}
                </Text>
              </View>
            </View>

            {/* Level XP Bar */}
            <View style={styles.levelProgressContainer}>
              <View style={styles.levelRow}>
                <Text
                  style={[
                    styles.levelText,
                    { color: colors.text, fontFamily: fonts.bodyBold },
                  ]}
                >
                  {t("homeLevel", { level: data.user.level })}
                </Text>
                <Text
                  style={[
                    styles.levelXp,
                    { color: colors.textMuted, fontFamily: fonts.bodyBold },
                  ]}
                >
                  {t("homeXpProgress", { xp: `${xpIntoLevel} / ${levelXpNeeded} XP` })}
                </Text>
              </View>
              <XpBar progress={xpIntoLevel / levelXpNeeded} />
            </View>
          </Card>

          {/* Hero Daily Quest Card */}
          <TouchableOpacity
            activeOpacity={0.88}
            disabled={quizDone}
            onPress={() => navigation.navigate("DailyQuiz")}
          >
            <Card
              style={StyleSheet.flatten([
                styles.questCard,
                !quizDone && { borderColor: colors.primary, borderWidth: 1.5 },
              ])}
            >
              <View style={styles.questHeaderRow}>
                <View
                  style={[
                    styles.questBountyBadge,
                    {
                      backgroundColor: quizDone
                        ? "rgba(16, 185, 129, 0.18)"
                        : "rgba(0, 210, 255, 0.16)",
                      borderColor: quizDone ? colors.green : colors.primary,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.questBountyText,
                      {
                        color: quizDone ? colors.green : colors.primary,
                        fontFamily: fonts.bodyBold,
                      },
                    ]}
                  >
                    {quizDone ? "✓ COMPLETED" : "DAILY QUEST · +50 XP"}
                  </Text>
                </View>
              </View>

              <View style={styles.questMainContent}>
                <View
                  style={[
                    styles.questIconBox,
                    { backgroundColor: colors.bgMid, borderColor: colors.border },
                  ]}
                >
                  <IconMap size={44} color={colors.primary} secondary={colors.accent} />
                </View>

                <View style={styles.questBody}>
                  <Text
                    style={[
                      styles.questTitle,
                      { color: colors.text, fontFamily: fonts.display },
                    ]}
                  >
                    {t("homeTodaysQuest")}
                  </Text>
                  <Text
                    style={[
                      styles.questMeta,
                      { color: colors.textMuted, fontFamily: fonts.body },
                    ]}
                  >
                    {t("homeQuestMeta")}
                  </Text>
                </View>
              </View>

              {quizDone ? (
                <View
                  style={[
                    styles.questDoneBanner,
                    { backgroundColor: "rgba(16, 185, 129, 0.12)", borderColor: colors.green },
                  ]}
                >
                  <Text
                    style={[
                      styles.questDoneText,
                      { color: colors.green, fontFamily: fonts.bodyBold },
                    ]}
                  >
                    🎉 {t("homeQuestDone", {
                      score: data.dailyQuiz.score ?? 0,
                      total: data.dailyQuiz.total,
                    })}
                  </Text>
                </View>
              ) : (
                <View style={[styles.questCta, { backgroundColor: colors.primary }]}>
                  <Text
                    style={[
                      styles.questCtaText,
                      { color: colors.textOnPrimary, fontFamily: fonts.bodyBold },
                    ]}
                  >
                    {t("homeStartQuest")} →
                  </Text>
                </View>
              )}
            </Card>
          </TouchableOpacity>

          {/* Revenge Round Card */}
          {data.revengeAvailable && (
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => navigation.navigate("RevengeRound")}
            >
              <Card
                style={StyleSheet.flatten([
                  styles.revengeCard,
                  { borderColor: colors.accent, borderWidth: 1.5 },
                ])}
              >
                <View style={styles.questHeaderRow}>
                  <View
                    style={[
                      styles.questBountyBadge,
                      {
                        backgroundColor: "rgba(255, 183, 3, 0.16)",
                        borderColor: colors.accent,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.questBountyText,
                        { color: colors.accent, fontFamily: fonts.bodyBold },
                      ]}
                    >
                      🔥 REVENGE ROUND · +25 XP
                    </Text>
                  </View>
                </View>

                <View style={styles.questMainContent}>
                  <View
                    style={[
                      styles.questIconBox,
                      { backgroundColor: colors.bgMid, borderColor: colors.border },
                    ]}
                  >
                    <IconFlame size={40} color={colors.accent} secondary={colors.primary} />
                  </View>
                  <View style={styles.questBody}>
                    <Text
                      style={[
                        styles.revengeTitle,
                        { color: colors.text, fontFamily: fonts.display },
                      ]}
                    >
                      {t("homeRevengeTitle")}
                    </Text>
                    <Text
                      style={[
                        styles.revengeCopy,
                        { color: colors.textMuted, fontFamily: fonts.body },
                      ]}
                    >
                      {t("homeRevengeCopy")}
                    </Text>
                  </View>
                </View>

                <View style={[styles.revengeCta, { backgroundColor: colors.accent }]}>
                  <Text
                    style={[
                      styles.revengeCtaText,
                      { color: colors.textOnPrimary, fontFamily: fonts.bodyBold },
                    ]}
                  >
                    {t("homeRevengeCta")} →
                  </Text>
                </View>
              </Card>
            </TouchableOpacity>
          )}

          {/* Today's Digest Card */}
          {digest && (
            <Card style={styles.digestCard}>
              <View style={styles.digestHeader}>
                <View style={styles.digestBadge}>
                  <Text style={[styles.digestBadgeText, { color: colors.primary, fontFamily: fonts.bodyBold }]}>
                    📰 DAILY DIGEST
                  </Text>
                </View>
                <Text
                  style={[
                    styles.digestDate,
                    { color: colors.textMuted, fontFamily: fonts.bodyBold },
                  ]}
                >
                  {digest.bsDate}
                </Text>
              </View>

              <Text
                style={[
                  styles.digestHeadline,
                  { color: colors.text, fontFamily: fonts.displayMed },
                ]}
              >
                {lang === "ne" && digest.headlineNe ? digest.headlineNe : digest.headlineEn}
              </Text>

              <View
                style={[
                  styles.digestItem,
                  { backgroundColor: colors.bgMid, borderColor: colors.border },
                ]}
              >
                <Text
                  style={[
                    styles.digestLabel,
                    { color: colors.primary, fontFamily: fonts.bodyBold },
                  ]}
                >
                  💡 {t("homeDigestGk")}
                </Text>
                <Text
                  style={[
                    styles.digestText,
                    { color: colors.text, fontFamily: fonts.body },
                  ]}
                >
                  {lang === "ne" && digest.gkFactNe ? digest.gkFactNe : digest.gkFactEn}
                </Text>
              </View>

              <View
                style={[
                  styles.digestItem,
                  { backgroundColor: colors.bgMid, borderColor: colors.border },
                ]}
              >
                <Text
                  style={[
                    styles.digestLabel,
                    { color: colors.accent, fontFamily: fonts.bodyBold },
                  ]}
                >
                  🇳🇵 {t("homeDigestNepal")}
                </Text>
                <Text
                  style={[
                    styles.digestText,
                    { color: colors.text, fontFamily: fonts.body },
                  ]}
                >
                  {lang === "ne" && digest.nepalFactNe ? digest.nepalFactNe : digest.nepalFactEn}
                </Text>
              </View>
            </Card>
          )}

          {/* Recent Awards Carousel */}
          {data.recentAwards.length > 0 && (
            <View style={styles.awardsSection}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: colors.text, fontFamily: fonts.bodyBold },
                ]}
              >
                🏆 {t("homeRecentAwards")}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.awardsRow}>
                  {data.recentAwards.map((award) => (
                    <View
                      key={award.code}
                      style={[
                        styles.awardChip,
                        {
                          backgroundColor: colors.card,
                          borderColor: colors.gold,
                        },
                      ]}
                    >
                      <Text style={styles.awardIcon}>{award.icon}</Text>
                      <Text
                        style={[
                          styles.awardName,
                          { color: colors.text, fontFamily: fonts.bodyBold },
                        ]}
                        numberOfLines={1}
                      >
                        {lang === "ne" && award.nameNe
                          ? award.nameNe
                          : award.nameEn}
                      </Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Atmosphere>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  greetingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  greetingText: { flex: 1, paddingRight: spacing.md, gap: 2 },
  brandBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: 2,
  },
  brandHint: {
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  levelPill: {
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: 10,
    borderWidth: 1,
  },
  levelPillText: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
  greeting: { fontSize: 24 },
  greetingSub: { fontSize: 13 },
  streakCard: {
    gap: spacing.md,
    padding: spacing.lg,
  },
  streakTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  streakLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  streakCountText: {
    fontSize: 18,
  },
  streakLabel: {
    fontSize: 12,
  },
  weeklyBox: {
    alignItems: "center",
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.chip,
    borderWidth: 1,
  },
  weeklyXp: { fontSize: 20 },
  weeklyLabel: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  levelProgressContainer: {
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  levelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  levelText: { fontSize: 13 },
  levelXp: {
    fontSize: 12,
  },
  questCard: {
    gap: spacing.md,
    padding: spacing.lg,
  },
  questHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  questBountyBadge: {
    paddingVertical: 3,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: 12,
    borderWidth: 1,
  },
  questBountyText: {
    fontSize: 11,
    letterSpacing: 0.8,
  },
  questMainContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  questIconBox: {
    width: 58,
    height: 58,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  questBody: { flex: 1, gap: 2 },
  questTitle: { fontSize: 20 },
  questMeta: { fontSize: 13 },
  questDoneBanner: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.chip,
    borderWidth: 1,
    alignItems: "center",
  },
  questDoneText: { fontSize: 14 },
  questCta: {
    borderRadius: radius.button,
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  questCtaText: { fontSize: 15, letterSpacing: 0.3 },
  revengeCard: {
    gap: spacing.md,
    padding: spacing.lg,
  },
  revengeTitle: { fontSize: 19 },
  revengeCopy: { fontSize: 13 },
  revengeCta: {
    borderRadius: radius.button,
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  revengeCtaText: { fontSize: 15, letterSpacing: 0.3 },
  digestCard: { gap: spacing.md, padding: spacing.lg },
  digestHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  digestBadge: {
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
  },
  digestBadgeText: {
    fontSize: 11,
    letterSpacing: 0.8,
  },
  digestDate: { fontSize: 12 },
  digestHeadline: { fontSize: 16, lineHeight: 22 },
  digestItem: {
    borderRadius: radius.chip,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.xs,
  },
  digestLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  digestText: { fontSize: 13, lineHeight: 19 },
  awardsSection: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    letterSpacing: 0.3,
  },
  awardsRow: { flexDirection: "row", gap: spacing.md },
  awardChip: {
    alignItems: "center",
    borderRadius: radius.card,
    borderWidth: 1,
    padding: spacing.md,
    width: 96,
    gap: spacing.xs,
  },
  awardIcon: { fontSize: 28 },
  awardName: { fontSize: 11, textAlign: "center" },
});
