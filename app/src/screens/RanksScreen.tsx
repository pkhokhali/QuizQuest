import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getLeaderboard } from "../api/client";
import { LeaderboardEntry, LeaderboardResponse, LeaderboardScope } from "../api/types";
import { Atmosphere } from "../components/Atmosphere";
import { AvatarCircle } from "../components/AvatarCircle";
import { Card } from "../components/Card";
import { ErrorCard } from "../components/ErrorCard";
import { LoadingView } from "../components/LoadingView";
import { IconRanks } from "../components/QuestIcons";
import { useTabScreenPadding } from "../navigation/useTabScreenPadding";
import { useAuth } from "../state/AuthContext";
import { useI18n } from "../state/LanguageContext";
import { useTheme } from "../state/ThemeContext";
import { ColorTokens, fonts, radius, spacing } from "../theme";

const SCOPES: { value: LeaderboardScope; labelKey: "ranksClass" | "ranksSchool" | "ranksFriends" }[] = [
  { value: "class", labelKey: "ranksClass" },
  { value: "school", labelKey: "ranksSchool" },
  { value: "friends", labelKey: "ranksFriends" },
];

export function RanksScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { t } = useI18n();
  const { user } = useAuth();
  const tabPadding = useTabScreenPadding();
  const [scope, setScope] = useState<LeaderboardScope>("class");
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async (s: LeaderboardScope) => {
    setLoading(true);
    setFailed(false);
    try {
      const res = await getLeaderboard(s);
      setData(res);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(scope);
    }, [load, scope])
  );

  const podiumOrder = (top3: LeaderboardEntry[]) => {
    // Visual order: 2nd, 1st, 3rd
    const sorted = [...top3].sort((a, b) => a.rank - b.rank);
    return [sorted[1], sorted[0], sorted[2]].filter(Boolean) as LeaderboardEntry[];
  };

  return (
    <Atmosphere>
      <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.headerBlock}>
        <View style={styles.titleRow}>
          <IconRanks size={28} color={colors.primary} />
          <Text style={[styles.title, { fontFamily: fonts.display }]}>
            {t("ranksTitle")}
          </Text>
        </View>
        <Text style={styles.subtitle}>{t("ranksResets")}</Text>
        <View style={styles.scopeRow}>
          {SCOPES.map((s) => (
            <TouchableOpacity
              key={s.value}
              style={[styles.scopeChip, scope === s.value && styles.scopeChipActive]}
              onPress={() => setScope(s.value)}
            >
              <Text
                style={[
                  styles.scopeText,
                  scope === s.value && styles.scopeTextActive,
                ]}
              >
                {t(s.labelKey)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <LoadingView />
      ) : failed || !data ? (
        <ErrorCard onRetry={() => load(scope)} />
      ) : (
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: tabPadding }]}>
          {scope !== "friends" && !user?.schoolId ? (
            <Card style={styles.joinCard}>
              <IconRanks size={40} color={colors.primary} />
              <Text style={[styles.joinTitle, { fontFamily: fonts.display }]}>
                {t("ranksJoinSchoolTitle")}
              </Text>
              <Text style={styles.joinCopy}>{t("ranksJoinSchoolCopy")}</Text>
            </Card>
          ) : data.top3.length === 0 && data.neighborhood.length === 0 ? (
            <Text style={styles.empty}>{t("ranksEmpty")}</Text>
          ) : (
            <>
              {/* Olympic Esports Style Podium */}
              <View style={styles.podiumContainer}>
                {podiumOrder(data.top3).map((entry) => {
                  const isFirst = entry.rank === 1;
                  const isSecond = entry.rank === 2;
                  const tierColor = isFirst ? colors.gold : isSecond ? colors.silver : colors.bronze;
                  const medalEmoji = isFirst ? "👑" : isSecond ? "🥈" : "🥉";

                  return (
                    <View
                      key={entry.userId}
                      style={[
                        styles.podiumSpot,
                        isFirst ? styles.podiumFirst : isSecond ? styles.podiumSecond : styles.podiumThird,
                        { borderColor: tierColor },
                      ]}
                    >
                      <View style={[styles.crownBadge, { backgroundColor: isFirst ? "rgba(251, 191, 36, 0.2)" : "transparent" }]}>
                        <Text style={styles.medalEmoji}>{medalEmoji}</Text>
                      </View>

                      <AvatarCircle avatar={entry.avatar} size={isFirst ? 58 : 46} />

                      <Text style={[styles.podiumName, { color: colors.text }]} numberOfLines={1}>
                        {entry.isMe ? t("ranksYou") : entry.name}
                      </Text>

                      <View style={[styles.podiumXpBadge, { backgroundColor: colors.bgMid }]}>
                        <Text style={[styles.podiumXpText, { color: tierColor, fontFamily: fonts.bodyBold }]}>
                          {t("ranksXp", { xp: entry.weeklyXp })}
                        </Text>
                      </View>

                      <View style={[styles.pedestalBase, { backgroundColor: isFirst ? colors.primary : colors.bgMid }]}>
                        <Text style={[styles.pedestalNumber, { color: isFirst ? colors.textOnPrimary : colors.textMuted }]}>
                          #{entry.rank}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* Neighborhood / Rank List */}
              <View style={styles.list}>
                {data.neighborhood.map((entry) => {
                  const isMe = entry.isMe;
                  return (
                    <Card
                      key={entry.userId}
                      style={[
                        styles.row,
                        isMe && styles.meRow,
                        isMe && { borderColor: colors.primary },
                      ]}
                    >
                      <View style={[styles.rankBadge, isMe && { backgroundColor: colors.primary }]}>
                        <Text style={[styles.rankNumber, { color: isMe ? colors.textOnPrimary : colors.textMuted }]}>
                          #{entry.rank}
                        </Text>
                      </View>

                      <AvatarCircle avatar={entry.avatar} size={40} />

                      <View style={styles.rowNameContainer}>
                        <Text style={[styles.rowName, { color: colors.text }]} numberOfLines={1}>
                          {isMe ? t("ranksYou") : entry.name}
                        </Text>
                        {isMe && (
                          <View style={[styles.youTag, { backgroundColor: colors.primary }]}>
                            <Text style={[styles.youTagText, { color: colors.textOnPrimary }]}>YOU</Text>
                          </View>
                        )}
                      </View>

                      <Text style={[styles.rowXp, { color: colors.accent, fontFamily: fonts.displayMed }]}>
                        {t("ranksXp", { xp: entry.weeklyXp })}
                      </Text>
                    </Card>
                  );
                })}
              </View>
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
    </Atmosphere>
  );
}

function createStyles(colors: ColorTokens) {
  return StyleSheet.create({
  safe: {
    flex: 1,
  },
  headerBlock: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.xs,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    fontSize: 24,
    color: colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: colors.primary,
  },
  scopeRow: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 3,
    marginTop: spacing.sm,
  },
  scopeChip: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 11,
    alignItems: "center",
  },
  scopeChipActive: {
    backgroundColor: colors.primary,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  scopeText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  scopeTextActive: {
    color: colors.textOnPrimary,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  empty: {
    textAlign: "center",
    color: colors.textMuted,
    fontSize: 14,
    marginTop: spacing.xxl,
  },
  joinCard: {
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.xl,
    marginTop: spacing.lg,
  },
  joinTitle: {
    fontSize: 18,
    color: colors.text,
  },
  joinCopy: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 18,
  },
  podiumContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  podiumSpot: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1.5,
    paddingTop: spacing.sm,
    width: "31%",
    gap: 4,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  podiumFirst: {
    paddingTop: spacing.md,
  },
  podiumSecond: {
    marginBottom: 0,
  },
  podiumThird: {
    marginBottom: 0,
  },
  crownBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  medalEmoji: {
    fontSize: 20,
  },
  podiumName: {
    fontSize: 12,
    marginTop: 2,
    paddingHorizontal: 4,
    textAlign: "center",
  },
  podiumXpBadge: {
    borderRadius: 8,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
    marginBottom: spacing.xs,
  },
  podiumXpText: {
    fontSize: 11,
  },
  pedestalBase: {
    width: "100%",
    paddingVertical: spacing.sm,
    borderBottomLeftRadius: radius.card - 2,
    borderBottomRightRadius: radius.card - 2,
    alignItems: "center",
    justifyContent: "center",
  },
  pedestalNumber: {
    fontSize: 14,
    fontWeight: "800",
  },
  list: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  meRow: {
    borderWidth: 1.5,
    elevation: 4,
    shadowColor: colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  rankNumber: {
    fontSize: 13,
    fontWeight: "800",
  },
  rowNameContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
  },
  rowName: {
    fontSize: 14,
    fontWeight: "700",
  },
  youTag: {
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  youTagText: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  rowXp: {
    fontSize: 13,
  },
});
}

