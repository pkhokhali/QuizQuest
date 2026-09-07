import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getAwards } from "../api/client";
import { Award } from "../api/types";
import { Atmosphere } from "../components/Atmosphere";
import { Card } from "../components/Card";
import { ErrorCard } from "../components/ErrorCard";
import { LoadingView } from "../components/LoadingView";
import { IconAwards } from "../components/QuestIcons";
import { XpBar } from "../components/XpBar";
import { useTabScreenPadding } from "../navigation/useTabScreenPadding";
import { useI18n } from "../state/LanguageContext";
import { useTheme } from "../state/ThemeContext";
import { fonts, radius, shadow, spacing } from "../theme";

export function AwardsScreen() {
  const { t, lang } = useI18n();
  const { colors } = useTheme();
  const tabPadding = useTabScreenPadding();
  const [awards, setAwards] = useState<Award[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      const res = await getAwards();
      setAwards(res.awards);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading && !awards) return <LoadingView />;
  if (failed || !awards) return <ErrorCard onRetry={load} />;

  const earnedCount = awards.filter((a) => a.earned).length;
  const progressPercent = awards.length > 0 ? earnedCount / awards.length : 0;

  return (
    <Atmosphere>
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: tabPadding }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.titleRow}>
            <View style={[styles.titleIconBox, { backgroundColor: colors.primarySoft }]}>
              <IconAwards size={24} color={colors.primary} />
            </View>
            <View style={styles.titleTextCol}>
              <Text
                style={[styles.title, { color: colors.text, fontFamily: fonts.display }]}
              >
                {t("awardsTitle")}
              </Text>
              <Text
                style={[styles.subtitle, { color: colors.textMuted, fontFamily: fonts.body }]}
              >
                {t("awardsKeepGoing")}
              </Text>
            </View>
          </View>

          {/* Gamified Showcase Banner with Progress */}
          <Card
            style={StyleSheet.flatten([
              styles.showcaseCard,
              {
                borderColor: colors.gold,
                borderWidth: 1.5,
              },
            ])}
          >
            <View style={styles.showcaseHeader}>
              <View>
                <Text
                  style={[
                    styles.showcaseTag,
                    { color: colors.gold, fontFamily: fonts.bodyBold },
                  ]}
                >
                  TROPHY CASE
                </Text>
                <Text
                  style={[
                    styles.showcaseCount,
                    { color: colors.text, fontFamily: fonts.display },
                  ]}
                >
                  {earnedCount}{" "}
                  <Text style={[styles.showcaseTotal, { color: colors.textMuted }]}>
                    / {awards.length}
                  </Text>
                </Text>
              </View>
              <View style={[styles.showcaseBadge, { backgroundColor: colors.goldSoft }]}>
                <Text style={styles.showcaseBadgeEmoji}>🏆</Text>
                <Text
                  style={[
                    styles.showcaseBadgePercent,
                    { color: colors.gold, fontFamily: fonts.bodyBold },
                  ]}
                >
                  {Math.round(progressPercent * 100)}%
                </Text>
              </View>
            </View>

            <XpBar
              progress={progressPercent}
              color={colors.gold}
              trackColor={colors.goldSoft}
              height={10}
            />

            <Text
              style={[
                styles.showcaseHint,
                { color: colors.textMuted, fontFamily: fonts.body },
              ]}
            >
              {t("awardsEarned", { count: earnedCount, total: awards.length })}
            </Text>
          </Card>

          {/* Trophies Grid */}
          <View style={styles.grid}>
            {awards.map((award) => {
              const name =
                lang === "ne" && award.nameNe ? award.nameNe : award.nameEn;
              const desc =
                lang === "ne" && award.descNe ? award.descNe : award.descEn;
              const isEarned = award.earned;

              return (
                <View
                  key={award.code}
                  style={[
                    styles.awardCardWrapper,
                    isEarned && shadow.card,
                  ]}
                >
                  <Card
                    style={StyleSheet.flatten([
                      styles.awardCard,
                      isEarned
                        ? {
                            borderColor: colors.gold,
                            borderWidth: 1.5,
                            backgroundColor: colors.surfaceElevated,
                          }
                        : {
                            borderColor: colors.border,
                            borderWidth: 1,
                            backgroundColor: colors.surface,
                            opacity: 0.68,
                          },
                    ])}
                  >
                    {/* Icon Container with Radiant Glow */}
                    <View
                      style={[
                        styles.iconContainer,
                        {
                          backgroundColor: isEarned
                            ? colors.goldSoft
                            : "rgba(255, 255, 255, 0.04)",
                          borderColor: isEarned ? colors.gold : colors.border,
                        },
                      ]}
                    >
                      <Text style={[styles.icon, !isEarned && styles.lockedIcon]}>
                        {award.icon}
                      </Text>
                      {!isEarned && (
                        <View style={styles.padlockBadge}>
                          <Text style={styles.padlockText}>🔒</Text>
                        </View>
                      )}
                    </View>

                    {/* Trophy Name & Description */}
                    <Text
                      style={[
                        styles.name,
                        {
                          color: isEarned ? colors.text : colors.textMuted,
                          fontFamily: fonts.bodyBold,
                        },
                      ]}
                      numberOfLines={2}
                    >
                      {name}
                    </Text>
                    <Text
                      style={[
                        styles.desc,
                        { color: colors.textMuted, fontFamily: fonts.body },
                      ]}
                      numberOfLines={3}
                    >
                      {desc}
                    </Text>

                    {/* Earned Status Chip */}
                    {isEarned ? (
                      <View
                        style={[
                          styles.statusChip,
                          { backgroundColor: colors.greenSoft },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            { color: colors.green, fontFamily: fonts.bodyBold },
                          ]}
                        >
                          ✓ {award.earnedAt ? award.earnedAt.slice(0, 10) : "UNLOCKED"}
                        </Text>
                      </View>
                    ) : (
                      <View
                        style={[
                          styles.statusChip,
                          { backgroundColor: "rgba(255, 255, 255, 0.04)" },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            { color: colors.textMuted, fontFamily: fonts.bodyBold },
                          ]}
                        >
                          LOCKED
                        </Text>
                      </View>
                    )}
                  </Card>
                </View>
              );
            })}
          </View>
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
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  titleIconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.small,
    alignItems: "center",
    justifyContent: "center",
  },
  titleTextCol: {
    flex: 1,
    gap: 2,
  },
  title: { fontSize: 26 },
  subtitle: { fontSize: 13 },
  showcaseCard: {
    gap: spacing.md,
    padding: spacing.lg,
  },
  showcaseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  showcaseTag: {
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  showcaseCount: {
    fontSize: 32,
    marginTop: 2,
  },
  showcaseTotal: {
    fontSize: 18,
  },
  showcaseBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.chip,
  },
  showcaseBadgeEmoji: {
    fontSize: 18,
  },
  showcaseBadgePercent: {
    fontSize: 15,
  },
  showcaseHint: {
    fontSize: 13,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  awardCardWrapper: {
    width: "47%",
    flexGrow: 1,
  },
  awardCard: {
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.lg,
    minHeight: 210,
    justifyContent: "space-between",
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginBottom: spacing.xs,
  },
  icon: { fontSize: 34 },
  lockedIcon: { opacity: 0.45 },
  padlockBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "#0A0E27",
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  padlockText: {
    fontSize: 10,
  },
  name: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 18,
  },
  desc: {
    fontSize: 11,
    textAlign: "center",
    lineHeight: 15,
    flex: 1,
  },
  statusChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.small,
    marginTop: spacing.xs,
  },
  statusText: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
});

