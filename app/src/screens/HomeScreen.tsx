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
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor={colors.primary}
            />
          }
        >
          <View style={styles.greetingRow}>
            <View style={styles.greetingText}>
              <Text
                style={[
                  styles.brandHint,
                  { color: colors.primary, fontFamily: fonts.bodyBold },
                ]}
              >
                {t("appName")}
              </Text>
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
                {t("tagline")}
              </Text>
            </View>
            <AvatarCircle avatar={data.user.avatar} size={52} />
          </View>

          <Card color={colors.primary} style={styles.streakCard}>
            <View style={styles.streakTop}>
              <View>
                <Animated.View style={{ transform: [{ scale: pulse }] }}>
                  <StreakFlame count={data.user.streak} size={52} />
                </Animated.View>
                <Text
                  style={[
                    styles.streakLabel,
                    { fontFamily: fonts.body },
                  ]}
                >
                  {t("homeStreakDays")} · {t("homeStreakKeepGoing")}
                </Text>
              </View>
              <View style={styles.weeklyBox}>
                <Text
                  style={[
                    styles.weeklyXp,
                    { color: colors.textOnPrimary, fontFamily: fonts.display },
                  ]}
                >
                  {data.weeklyXp}
                </Text>
                <Text style={[styles.weeklyLabel, { fontFamily: fonts.body }]}>
                  {t("homeWeeklyXp")}
                </Text>
              </View>
            </View>
            <View style={styles.levelRow}>
              <Text
                style={[
                  styles.levelText,
                  { color: colors.textOnPrimary, fontFamily: fonts.bodyBold },
                ]}
              >
                {t("homeLevel", { level: data.user.level })}
              </Text>
              <Text style={[styles.levelXp, { fontFamily: fonts.body }]}>
                {t("homeXpProgress", { xp: `${xpIntoLevel}/${levelXpNeeded}` })}
              </Text>
            </View>
            <XpBar progress={xpIntoLevel / levelXpNeeded} />
          </Card>

          <TouchableOpacity
            activeOpacity={0.85}
            disabled={quizDone}
            onPress={() => navigation.navigate("DailyQuiz")}
          >
            <Card color={colors.cream} style={styles.questCard}>
              <IconMap size={48} color={colors.primary} secondary={colors.accent} />
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
                {quizDone ? (
                  <Text
                    style={[
                      styles.questDone,
                      { color: colors.green, fontFamily: fonts.bodyBold },
                    ]}
                  >
                    {t("homeQuestDone", {
                      score: data.dailyQuiz.score ?? 0,
                      total: data.dailyQuiz.total,
                    })}
                  </Text>
                ) : (
                  <View
                    style={[styles.questCta, { backgroundColor: colors.primary }]}
                  >
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
              </View>
            </Card>
          </TouchableOpacity>

          {data.revengeAvailable && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation.navigate("RevengeRound")}
            >
              <Card color={colors.accentSoft} style={styles.revengeCard}>
                <IconFlame size={44} color={colors.accent} secondary={colors.primary} />
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
                  <View
                    style={[styles.revengeCta, { backgroundColor: colors.accent }]}
                  >
                    <Text
                      style={[
                        styles.revengeCtaText,
                        {
                          color: colors.textOnPrimary,
                          fontFamily: fonts.bodyBold,
                        },
                      ]}
                    >
                      {t("homeRevengeCta")} →
                    </Text>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          )}

          {digest && (
            <Card style={styles.digestCard}>
              <View style={styles.digestHeader}>
                <Text
                  style={[
                    styles.digestTitle,
                    { color: colors.text, fontFamily: fonts.bodyBold },
                  ]}
                >
                  {t("homeDigestTitle")}
                </Text>
                <Text
                  style={[
                    styles.digestDate,
                    { color: colors.primary, fontFamily: fonts.bodyBold },
                  ]}
                >
                  {digest.bsDate}
                </Text>
              </View>
              <Text
                style={[
                  styles.digestHeadline,
                  { color: colors.text, fontFamily: fonts.bodyBold },
                ]}
              >
                {lang === "ne" && digest.headlineNe
                  ? digest.headlineNe
                  : digest.headlineEn}
              </Text>
              <View style={[styles.digestItem, { backgroundColor: colors.bg }]}>
                <Text
                  style={[
                    styles.digestLabel,
                    { color: colors.textMuted, fontFamily: fonts.bodyBold },
                  ]}
                >
                  {t("homeDigestGk")}
                </Text>
                <Text
                  style={[styles.digestText, { color: colors.text, fontFamily: fonts.body }]}
                >
                  {lang === "ne" && digest.gkFactNe
                    ? digest.gkFactNe
                    : digest.gkFactEn}
                </Text>
              </View>
              <View style={[styles.digestItem, { backgroundColor: colors.bg }]}>
                <Text
                  style={[
                    styles.digestLabel,
                    { color: colors.textMuted, fontFamily: fonts.bodyBold },
                  ]}
                >
                  {t("homeDigestNepal")}
                </Text>
                <Text
                  style={[styles.digestText, { color: colors.text, fontFamily: fonts.body }]}
                >
                  {lang === "ne" && digest.nepalFactNe
                    ? digest.nepalFactNe
                    : digest.nepalFactEn}
                </Text>
              </View>
            </Card>
          )}

          {data.recentAwards.length > 0 && (
            <View>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: colors.text, fontFamily: fonts.bodyBold },
                ]}
              >
                {t("homeRecentAwards")}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.awardsRow}>
                  {data.recentAwards.map((award) => (
                    <View
                      key={award.code}
                      style={[styles.awardChip, { backgroundColor: colors.card }]}
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
    paddingBottom: spacing.xxl,
  },
  greetingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  greetingText: { flex: 1, paddingRight: spacing.md, gap: 2 },
  brandHint: {
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  greeting: { fontSize: 26 },
  greetingSub: { fontSize: 13 },
  streakCard: { gap: spacing.md, padding: spacing.xl },
  streakTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  streakLabel: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
    marginTop: spacing.xs,
  },
  weeklyBox: { alignItems: "flex-end" },
  weeklyXp: { fontSize: 28 },
  weeklyLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
  },
  levelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.sm,
  },
  levelText: { fontSize: 15 },
  levelXp: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
  },
  questCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  questBody: { flex: 1, gap: spacing.xs },
  questTitle: { fontSize: 22 },
  questMeta: { fontSize: 13 },
  questDone: { fontSize: 15, marginTop: spacing.xs },
  questCta: {
    alignSelf: "flex-start",
    borderRadius: radius.chip,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xs,
  },
  questCtaText: { fontSize: 14 },
  revengeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  revengeTitle: { fontSize: 20 },
  revengeCopy: { fontSize: 13 },
  revengeCta: {
    alignSelf: "flex-start",
    borderRadius: radius.chip,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xs,
  },
  revengeCtaText: { fontSize: 14 },
  digestCard: { gap: spacing.md },
  digestHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  digestTitle: { fontSize: 17 },
  digestDate: { fontSize: 13 },
  digestHeadline: { fontSize: 16 },
  digestItem: {
    borderRadius: radius.small,
    padding: spacing.md,
    gap: spacing.xs,
  },
  digestLabel: {
    fontSize: 12,
    textTransform: "uppercase",
  },
  digestText: { fontSize: 14, lineHeight: 20 },
  sectionTitle: {
    fontSize: 17,
    marginBottom: spacing.sm,
  },
  awardsRow: { flexDirection: "row", gap: spacing.md },
  awardChip: {
    alignItems: "center",
    borderRadius: radius.chip,
    padding: spacing.md,
    width: 96,
    gap: spacing.xs,
  },
  awardIcon: { fontSize: 30 },
  awardName: { fontSize: 11, textAlign: "center" },
});
