import { useNavigation } from "@react-navigation/native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getUserInsights } from "../api/client";
import { UserInsightsResponse } from "../api/types";
import { Atmosphere } from "../components/Atmosphere";
import { Card } from "../components/Card";
import { useI18n } from "../state/LanguageContext";
import { useTheme } from "../state/ThemeContext";
import { fonts, radius, shadow, spacing } from "../theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export function GameInsightsScreen() {
  const { colors } = useTheme();
  const { lang } = useI18n();
  const navigation = useNavigation();

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [insights, setInsights] = useState<UserInsightsResponse | null>(null);

  const loadData = useCallback(async () => {
    try {
      const data = await getUserInsights();
      setInsights(data);
    } catch (err) {
      console.warn("Error loading user game insights:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getHeatmapColor = (xp: number) => {
    if (xp === 0) return colors.surface;
    if (xp < 40) return colors.primary + "40";
    if (xp < 100) return colors.primary + "80";
    return colors.primary;
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={["top", "bottom"]}>
      <Atmosphere />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.iconButton, { backgroundColor: colors.surface }]}
          accessibilityLabel="Go back"
        >
          <Text style={[styles.backText, { color: colors.text }]}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerTitleCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            📊 {lang === "ne" ? "खेल विश्लेषण तथा प्रगति" : "Game Insights & Mastery"}
          </Text>
          <Text style={[styles.headerSub, { color: colors.textMuted }]}>
            {lang === "ne" ? "तपाईंको सिकाइ र खेल तथ्याङ्क" : "Your learning analytics & arcade records"}
          </Text>
        </View>

        <View style={{ width: 40 }} />
      </View>

      {loading && !insights ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>
            {lang === "ne" ? "तथ्याङ्क लोड गरिँदैछ..." : "Loading game analytics..."}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Summary Card */}
          <Card style={[styles.heroCard, { backgroundColor: colors.surface }]}>
            <View style={styles.heroRow}>
              <View style={styles.heroStat}>
                <Text style={[styles.heroStatValue, { color: colors.primary }]}>
                  ⚡ {insights?.summary.totalXp ?? 0}
                </Text>
                <Text style={[styles.heroStatLabel, { color: colors.textMuted }]}>
                  {lang === "ne" ? "कुल XP" : "Total XP"}
                </Text>
              </View>

              <View style={[styles.heroDivider, { backgroundColor: colors.border }]} />

              <View style={styles.heroStat}>
                <Text style={[styles.heroStatValue, { color: colors.accent }]}>
                  🎯 {insights?.summary.accuracyPct ?? 0}%
                </Text>
                <Text style={[styles.heroStatLabel, { color: colors.textMuted }]}>
                  {lang === "ne" ? "शुद्धता दर" : "Accuracy"}
                </Text>
              </View>

              <View style={[styles.heroDivider, { backgroundColor: colors.border }]} />

              <View style={styles.heroStat}>
                <Text style={[styles.heroStatValue, { color: "#F97316" }]}>
                  🔥 {insights?.summary.streak ?? 0}
                </Text>
                <Text style={[styles.heroStatLabel, { color: colors.textMuted }]}>
                  {lang === "ne" ? "दैनिक यात्रा" : "Day Streak"}
                </Text>
              </View>
            </View>

            <View style={[styles.heroSubTextRow, { borderTopColor: colors.border }]}>
              <Text style={[styles.heroSubText, { color: colors.textMuted }]}>
                {lang === "ne"
                  ? `कुल ${insights?.summary.totalAnswers ?? 0} मध्ये ${insights?.summary.correctAnswers ?? 0} प्रश्नको सही उत्तर`
                  : `${insights?.summary.correctAnswers ?? 0} correct out of ${insights?.summary.totalAnswers ?? 0} questions answered`}
              </Text>
            </View>
          </Card>

          {/* 30-Day Activity Heatmap */}
          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                📅 {lang === "ne" ? "३०-दिने सक्रियता क्यालेन्डर" : "30-Day Activity Grid"}
              </Text>
              <Text style={[styles.sectionSub, { color: colors.textMuted }]}>
                {lang === "ne" ? "दैनिक XP आर्जन र अध्ययन" : "Daily XP momentum"}
              </Text>
            </View>

            <View style={styles.heatmapGrid}>
              {insights?.activityHeatmap.map((day) => {
                const dayDate = new Date(day.date);
                const dayNum = dayDate.getDate();
                const isToday = day.date === new Date().toISOString().split("T")[0];

                return (
                  <View
                    key={day.date}
                    style={[
                      styles.heatCell,
                      {
                        backgroundColor: getHeatmapColor(day.xp),
                        borderColor: isToday ? colors.accent : colors.border,
                        borderWidth: isToday ? 1.5 : 0.5,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.heatCellText,
                        {
                          color: day.xp > 60 ? "#FFF" : colors.textMuted,
                          fontWeight: isToday ? "bold" : "normal",
                        },
                      ]}
                    >
                      {dayNum}
                    </Text>
                  </View>
                );
              })}
            </View>

            <View style={styles.heatmapLegend}>
              <Text style={[styles.legendText, { color: colors.textMuted }]}>
                {lang === "ne" ? "कम" : "Less"}
              </Text>
              <View style={[styles.legendBox, { backgroundColor: colors.surface }]} />
              <View style={[styles.legendBox, { backgroundColor: colors.primary + "40" }]} />
              <View style={[styles.legendBox, { backgroundColor: colors.primary + "80" }]} />
              <View style={[styles.legendBox, { backgroundColor: colors.primary }]} />
              <Text style={[styles.legendText, { color: colors.textMuted }]}>
                {lang === "ne" ? "बढी" : "More"}
              </Text>
            </View>
          </Card>

          {/* Subject Mastery */}
          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                📚 {lang === "ne" ? "विषयगत ज्ञान दक्षता" : "Subject Mastery"}
              </Text>
              <Text style={[styles.sectionSub, { color: colors.textMuted }]}>
                {lang === "ne" ? "पाठ्यक्रम अनुसारको प्रगति" : "Curriculum accuracy breakdown"}
              </Text>
            </View>

            {(!insights?.subjectMastery || insights.subjectMastery.length === 0) ? (
              <Text style={[styles.emptyNote, { color: colors.textMuted }]}>
                {lang === "ne"
                  ? "अझै प्रश्नहरू हल गरिएको छैन। क्विज खेलेर सुरु गर्नुहोस्!"
                  : "No subject quiz data yet. Play quizzes to see your mastery!"}
              </Text>
            ) : (
              insights.subjectMastery.map((sub) => {
                const isMaster = sub.pct >= 80;
                const isGood = sub.pct >= 60;
                const badgeColor = isMaster ? "#10B981" : isGood ? "#F59E0B" : "#EC4899";

                return (
                  <View key={sub.subject} style={styles.subjectRow}>
                    <View style={styles.subjectHeader}>
                      <Text style={[styles.subjectName, { color: colors.text }]}>
                        {sub.subject}
                      </Text>
                      <View style={styles.subjectRight}>
                        <Text style={[styles.subjectCount, { color: colors.textMuted }]}>
                          {sub.correct}/{sub.total}
                        </Text>
                        <View style={[styles.masteryPill, { backgroundColor: badgeColor + "20" }]}>
                          <Text style={[styles.masteryPillText, { color: badgeColor }]}>
                            {sub.pct}%
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Progress Track */}
                    <View style={[styles.progressBarTrack, { backgroundColor: colors.bg }]}>
                      <View
                        style={[
                          styles.progressBarFill,
                          {
                            width: `${Math.min(100, Math.max(5, sub.pct))}%`,
                            backgroundColor: badgeColor,
                          },
                        ]}
                      />
                    </View>
                  </View>
                );
              })
            )}
          </Card>

          {/* Game Modes XP Breakdown */}
          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                🎮 {lang === "ne" ? "खेल विधा अनुसार XP आर्जन" : "Game Mode XP Breakdown"}
              </Text>
              <Text style={[styles.sectionSub, { color: colors.textMuted }]}>
                {lang === "ne" ? "विभिन्न खेलमा बिताइएको समय र अङ्क" : "Where your XP was earned"}
              </Text>
            </View>

            <View style={styles.gamesGrid}>
              {insights?.gameBreakdown.map((game) => (
                <View
                  key={game.reason}
                  style={[
                    styles.gameItemCard,
                    { backgroundColor: colors.bg, borderColor: colors.border },
                  ]}
                >
                  <Text style={styles.gameItemIcon}>{game.icon}</Text>
                  <View style={styles.gameItemContent}>
                    <Text style={[styles.gameItemName, { color: colors.text }]} numberOfLines={1}>
                      {game.name}
                    </Text>
                    <Text style={[styles.gameItemPlays, { color: colors.textMuted }]}>
                      {game.playCount} {lang === "ne" ? "पटक खेलियो" : "plays"}
                    </Text>
                  </View>
                  <Text style={[styles.gameItemXp, { color: game.color }]}>
                    +{game.totalXp} XP
                  </Text>
                </View>
              ))}
            </View>
          </Card>

          {/* Personal Bests / Hall of Fame */}
          <Card style={[styles.sectionCard, { marginBottom: spacing.xl }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                🏆 {lang === "ne" ? "व्यक्तिगत उत्कृष्ट रेकर्ड" : "Personal Records"}
              </Text>
              <Text style={[styles.sectionSub, { color: colors.textMuted }]}>
                {lang === "ne" ? "तपाईंका अहिलेसम्मका कीर्तिमानहरू" : "Your all-time best achievements"}
              </Text>
            </View>

            <View style={styles.recordsList}>
              <View style={[styles.recordItem, { borderBottomColor: colors.border }]}>
                <Text style={styles.recordIcon}>⚡</Text>
                <View style={styles.recordContent}>
                  <Text style={[styles.recordTitle, { color: colors.text }]}>
                    {lang === "ne" ? "जिप पाथ सबैभन्दा छिटो" : "Fastest Zip Path Puzzle"}
                  </Text>
                  <Text style={[styles.recordSub, { color: colors.textMuted }]}>
                    {lang === "ne" ? "नम्बर जोड्ने गति" : "Number connection sprint"}
                  </Text>
                </View>
                <Text style={[styles.recordValue, { color: colors.primary }]}>
                  {insights?.personalBests.fastestZipSec != null
                    ? `${insights.personalBests.fastestZipSec}s`
                    : "—"}
                </Text>
              </View>

              <View style={[styles.recordItem, { borderBottomColor: colors.border }]}>
                <Text style={styles.recordIcon}>🔤</Text>
                <View style={styles.recordContent}>
                  <Text style={[styles.recordTitle, { color: colors.text }]}>
                    {lang === "ne" ? "शब्द खोज सबैभन्दा छिटो" : "Fastest Word Search"}
                  </Text>
                  <Text style={[styles.recordSub, { color: colors.textMuted }]}>
                    {lang === "ne" ? "सबै शब्द पत्ता लगाइएको समय" : "All hidden words discovered"}
                  </Text>
                </View>
                <Text style={[styles.recordValue, { color: colors.accent }]}>
                  {insights?.personalBests.fastestWordSearchSec != null
                    ? `${insights.personalBests.fastestWordSearchSec}s`
                    : "—"}
                </Text>
              </View>

              <View style={[styles.recordItem, { borderBottomColor: colors.border }]}>
                <Text style={styles.recordIcon}>🧩</Text>
                <View style={styles.recordContent}>
                  <Text style={[styles.recordTitle, { color: colors.text }]}>
                    {lang === "ne" ? "गाउँखाने कथा समाधान" : "Gaunkhane Katha Riddles"}
                  </Text>
                  <Text style={[styles.recordSub, { color: colors.textMuted }]}>
                    {lang === "ne" ? "सफलतापूर्वक बुझाइएका कथाहरू" : "Nepali folk riddles decoded"}
                  </Text>
                </View>
                <Text style={[styles.recordValue, { color: "#10B981" }]}>
                  {insights?.personalBests.totalRiddlesSolved ?? 0}
                </Text>
              </View>

              <View style={[styles.recordItem, { borderBottomWidth: 0 }]}>
                <Text style={styles.recordIcon}>⚔️</Text>
                <View style={styles.recordContent}>
                  <Text style={[styles.recordTitle, { color: colors.text }]}>
                    {lang === "ne" ? "साथीसँगको भिडन्त जित" : "1v1 Battle Victories"}
                  </Text>
                  <Text style={[styles.recordSub, { color: colors.textMuted }]}>
                    {insights?.personalBests.totalBattles ?? 0} {lang === "ne" ? "खेलिएको मध्ये" : "total matches"}
                  </Text>
                </View>
                <Text style={[styles.recordValue, { color: "#EF4444" }]}>
                  {insights?.personalBests.battlesWon ?? 0} 👑
                </Text>
              </View>
            </View>
          </Card>
        </ScrollView>
      )}
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
    paddingVertical: spacing.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.nepalButton,
  },
  backText: {
    fontSize: 22,
    fontWeight: "bold",
  },
  headerTitleCenter: {
    alignItems: "center",
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: fonts.display,
  },
  headerSub: {
    fontSize: 11,
    fontFamily: fonts.bodyReg,
    marginTop: 2,
  },
  loaderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: fonts.body,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
  },
  heroCard: {
    padding: spacing.md,
    borderRadius: radius.card,
    marginBottom: spacing.md,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: spacing.xs,
  },
  heroStat: {
    alignItems: "center",
    flex: 1,
  },
  heroStatValue: {
    fontSize: 18,
    fontFamily: fonts.bodyBold,
    marginBottom: 4,
  },
  heroStatLabel: {
    fontSize: 11,
    fontFamily: fonts.body,
    textTransform: "uppercase",
  },
  heroDivider: {
    width: 1,
    height: 36,
  },
  heroSubTextRow: {
    borderTopWidth: 1,
    paddingTop: spacing.sm,
    marginTop: spacing.sm,
    alignItems: "center",
  },
  heroSubText: {
    fontSize: 12,
    fontFamily: fonts.bodyReg,
  },
  sectionCard: {
    padding: spacing.md,
    borderRadius: radius.card,
    marginBottom: spacing.md,
  },
  sectionHeader: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: fonts.display,
  },
  sectionSub: {
    fontSize: 12,
    fontFamily: fonts.bodyReg,
    marginTop: 2,
  },
  heatmapGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  heatCell: {
    width: (SCREEN_WIDTH - spacing.md * 4 - 35) / 10,
    aspectRatio: 1,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  heatCellText: {
    fontSize: 9,
    fontFamily: fonts.body,
  },
  heatmapLegend: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 6,
    marginTop: spacing.xs,
  },
  legendText: {
    fontSize: 10,
    fontFamily: fonts.bodyReg,
  },
  legendBox: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  emptyNote: {
    fontSize: 13,
    fontFamily: fonts.bodyReg,
    textAlign: "center",
    paddingVertical: spacing.md,
  },
  subjectRow: {
    marginBottom: spacing.md,
  },
  subjectHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  subjectName: {
    fontSize: 14,
    fontFamily: fonts.bodyBold,
  },
  subjectRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  subjectCount: {
    fontSize: 12,
    fontFamily: fonts.bodyReg,
  },
  masteryPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  masteryPillText: {
    fontSize: 11,
    fontFamily: fonts.bodyBold,
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  gamesGrid: {
    gap: 8,
  },
  gameItemCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.sm,
    borderRadius: radius.chip,
    borderWidth: 1,
  },
  gameItemIcon: {
    fontSize: 22,
    marginRight: 10,
  },
  gameItemContent: {
    flex: 1,
  },
  gameItemName: {
    fontSize: 13,
    fontFamily: fonts.bodyBold,
  },
  gameItemPlays: {
    fontSize: 11,
    fontFamily: fonts.bodyReg,
  },
  gameItemXp: {
    fontSize: 13,
    fontFamily: fonts.bodyBold,
  },
  recordsList: {
    gap: 2,
  },
  recordItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  recordIcon: {
    fontSize: 22,
    marginRight: 12,
  },
  recordContent: {
    flex: 1,
  },
  recordTitle: {
    fontSize: 14,
    fontFamily: fonts.bodyBold,
  },
  recordSub: {
    fontSize: 11,
    fontFamily: fonts.bodyReg,
  },
  recordValue: {
    fontSize: 16,
    fontFamily: fonts.bodyBold,
  },
});
