import { useFocusEffect, useNavigation } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import {
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
import { AvatarCircle } from "../components/AvatarCircle";
import { Card } from "../components/Card";
import { ErrorCard } from "../components/ErrorCard";
import { LoadingView } from "../components/LoadingView";
import { StreakFlame } from "../components/StreakFlame";
import { XpBar } from "../components/XpBar";
import { xpForLevel } from "../constants";
import { useAuth } from "../state/AuthContext";
import { useI18n } from "../state/LanguageContext";
import { colors, radius, spacing } from "../theme";

export function HomeScreen() {
  const { t, lang } = useI18n();
  const { user, setUser } = useAuth();
  const navigation = useNavigation();

  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);

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
        {/* Greeting */}
        <View style={styles.greetingRow}>
          <View>
            <Text style={styles.greeting}>
              {t("homeGreeting", { name: data.user.name })}
            </Text>
            <Text style={styles.greetingSub}>{t("tagline")}</Text>
          </View>
          <AvatarCircle avatar={data.user.avatar} size={52} />
        </View>

        {/* Hero streak card */}
        <Card color={colors.primary} style={styles.streakCard}>
          <View style={styles.streakTop}>
            <View>
              <StreakFlame count={data.user.streak} size={52} />
              <Text style={styles.streakLabel}>
                {t("homeStreakDays")} · {t("homeStreakKeepGoing")}
              </Text>
            </View>
            <View style={styles.weeklyBox}>
              <Text style={styles.weeklyXp}>{data.weeklyXp}</Text>
              <Text style={styles.weeklyLabel}>{t("homeWeeklyXp")}</Text>
            </View>
          </View>
          <View style={styles.levelRow}>
            <Text style={styles.levelText}>
              {t("homeLevel", { level: data.user.level })}
            </Text>
            <Text style={styles.levelXp}>
              {t("homeXpProgress", { xp: `${xpIntoLevel}/${levelXpNeeded}` })}
            </Text>
          </View>
          <XpBar progress={xpIntoLevel / levelXpNeeded} />
        </Card>

        {/* Today's Quest */}
        <TouchableOpacity
          activeOpacity={0.85}
          disabled={quizDone}
          onPress={() => navigation.navigate("DailyQuiz")}
        >
          <Card color={colors.cream} style={styles.questCard}>
            <Text style={styles.questEmoji}>🗺️</Text>
            <View style={styles.questBody}>
              <Text style={styles.questTitle}>{t("homeTodaysQuest")}</Text>
              <Text style={styles.questMeta}>{t("homeQuestMeta")}</Text>
              {quizDone ? (
                <Text style={styles.questDone}>
                  {t("homeQuestDone", {
                    score: data.dailyQuiz.score ?? 0,
                    total: data.dailyQuiz.total,
                  })}
                </Text>
              ) : (
                <View style={styles.questCta}>
                  <Text style={styles.questCtaText}>{t("homeStartQuest")} →</Text>
                </View>
              )}
            </View>
          </Card>
        </TouchableOpacity>

        {/* Revenge Round */}
        {data.revengeAvailable && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate("RevengeRound")}
          >
            <Card color={colors.accentSoft} style={styles.revengeCard}>
              <Text style={styles.questEmoji}>💪</Text>
              <View style={styles.questBody}>
                <Text style={styles.revengeTitle}>{t("homeRevengeTitle")}</Text>
                <Text style={styles.revengeCopy}>{t("homeRevengeCopy")}</Text>
                <View style={styles.revengeCta}>
                  <Text style={styles.revengeCtaText}>{t("homeRevengeCta")} →</Text>
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        )}

        {/* Today's 3 Things */}
        {digest && (
          <Card style={styles.digestCard}>
            <View style={styles.digestHeader}>
              <Text style={styles.digestTitle}>📌 {t("homeDigestTitle")}</Text>
              <Text style={styles.digestDate}>{digest.bsDate}</Text>
            </View>
            <Text style={styles.digestHeadline}>
              {lang === "ne" && digest.headlineNe ? digest.headlineNe : digest.headlineEn}
            </Text>
            <View style={styles.digestItem}>
              <Text style={styles.digestLabel}>💡 {t("homeDigestGk")}</Text>
              <Text style={styles.digestText}>
                {lang === "ne" && digest.gkFactNe ? digest.gkFactNe : digest.gkFactEn}
              </Text>
            </View>
            <View style={styles.digestItem}>
              <Text style={styles.digestLabel}>🏔️ {t("homeDigestNepal")}</Text>
              <Text style={styles.digestText}>
                {lang === "ne" && digest.nepalFactNe
                  ? digest.nepalFactNe
                  : digest.nepalFactEn}
              </Text>
            </View>
          </Card>
        )}

        {/* Recent awards */}
        {data.recentAwards.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>{t("homeRecentAwards")}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.awardsRow}>
                {data.recentAwards.map((award) => (
                  <View key={award.code} style={styles.awardChip}>
                    <Text style={styles.awardIcon}>{award.icon}</Text>
                    <Text style={styles.awardName} numberOfLines={1}>
                      {lang === "ne" && award.nameNe ? award.nameNe : award.nameEn}
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
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
  greeting: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.text,
  },
  greetingSub: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: "600",
  },
  streakCard: {
    gap: spacing.md,
    padding: spacing.xl,
  },
  streakTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  streakLabel: {
    color: "rgba(255,255,255,0.9)",
    fontWeight: "700",
    fontSize: 13,
    marginTop: spacing.xs,
  },
  weeklyBox: {
    alignItems: "flex-end",
  },
  weeklyXp: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.textOnPrimary,
  },
  weeklyLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "600",
  },
  levelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.sm,
  },
  levelText: {
    color: colors.textOnPrimary,
    fontWeight: "800",
    fontSize: 15,
  },
  levelXp: {
    color: "rgba(255,255,255,0.85)",
    fontWeight: "600",
    fontSize: 13,
  },
  questCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  questEmoji: {
    fontSize: 44,
  },
  questBody: {
    flex: 1,
    gap: spacing.xs,
  },
  questTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
  },
  questMeta: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: "600",
  },
  questDone: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.green,
    marginTop: spacing.xs,
  },
  questCta: {
    backgroundColor: colors.primary,
    alignSelf: "flex-start",
    borderRadius: radius.chip,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xs,
  },
  questCtaText: {
    color: colors.textOnPrimary,
    fontWeight: "800",
    fontSize: 14,
  },
  revengeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  revengeTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
  },
  revengeCopy: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: "600",
  },
  revengeCta: {
    backgroundColor: colors.accent,
    alignSelf: "flex-start",
    borderRadius: radius.chip,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xs,
  },
  revengeCtaText: {
    color: colors.textOnPrimary,
    fontWeight: "800",
    fontSize: 14,
  },
  digestCard: {
    gap: spacing.md,
  },
  digestHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  digestTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.text,
  },
  digestDate: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },
  digestHeadline: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  digestItem: {
    backgroundColor: colors.bg,
    borderRadius: radius.small,
    padding: spacing.md,
    gap: spacing.xs,
  },
  digestLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.textMuted,
    textTransform: "uppercase",
  },
  digestText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: "500",
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  awardsRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  awardChip: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.chip,
    padding: spacing.md,
    width: 96,
    gap: spacing.xs,
  },
  awardIcon: {
    fontSize: 30,
  },
  awardName: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
});
