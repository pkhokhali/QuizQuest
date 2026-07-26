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
        <ScrollView contentContainerStyle={styles.content}>
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
              {/* Podium */}
              <View style={styles.podium}>
                {podiumOrder(data.top3).map((entry) => {
                  const isFirst = entry.rank === 1;
                  return (
                    <View
                      key={entry.userId}
                      style={[styles.podiumSpot, isFirst && styles.podiumFirst]}
                    >
                      <Text style={styles.medal}>
                        {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : "🥉"}
                      </Text>
                      <AvatarCircle avatar={entry.avatar} size={isFirst ? 64 : 52} />
                      <Text style={styles.podiumName} numberOfLines={1}>
                        {entry.isMe ? t("ranksYou") : entry.name}
                      </Text>
                      <Text style={styles.podiumXp}>
                        {t("ranksXp", { xp: entry.weeklyXp })}
                      </Text>
                    </View>
                  );
                })}
              </View>

              {/* Neighborhood */}
              <View style={styles.list}>
                {data.neighborhood.map((entry) => (
                  <Card
                    key={entry.userId}
                    style={StyleSheet.flatten([
                      styles.row,
                      entry.isMe ? styles.meRow : null,
                    ])}
                  >
                    <Text style={[styles.rank, entry.isMe && styles.meText]}>
                      #{entry.rank}
                    </Text>
                    <AvatarCircle avatar={entry.avatar} size={40} />
                    <Text
                      style={[styles.rowName, entry.isMe && styles.meText]}
                      numberOfLines={1}
                    >
                      {entry.isMe ? t("ranksYou") : entry.name}
                    </Text>
                    <Text style={[styles.rowXp, entry.isMe && styles.meText]}>
                      {t("ranksXp", { xp: entry.weeklyXp })}
                    </Text>
                  </Card>
                ))}
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
    backgroundColor: colors.bg,
  },
  headerBlock: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },
  scopeRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  scopeChip: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.chip,
    paddingVertical: spacing.md,
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.border,
  },
  scopeChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  scopeText: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.textMuted,
  },
  scopeTextActive: {
    color: colors.textOnPrimary,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  empty: {
    textAlign: "center",
    color: colors.textMuted,
    fontWeight: "700",
    fontSize: 15,
    marginTop: spacing.xxl,
  },
  joinCard: {
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.xl,
    marginTop: spacing.lg,
  },
  joinTitle: {
    fontSize: 20,
    color: colors.text,
  },
  joinCopy: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textMuted,
    textAlign: "center",
  },
  podium: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: spacing.md,
  },
  podiumSpot: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: spacing.md,
    width: 100,
    gap: spacing.xs,
  },
  podiumFirst: {
    paddingVertical: spacing.xl,
    backgroundColor: colors.cream,
    borderWidth: 2,
    borderColor: colors.gold,
  },
  medal: {
    fontSize: 24,
  },
  podiumName: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.text,
  },
  podiumXp: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },
  list: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  meRow: {
    backgroundColor: colors.primary,
  },
  meText: {
    color: colors.textOnPrimary,
  },
  rank: {
    width: 42,
    fontSize: 15,
    fontWeight: "800",
    color: colors.textMuted,
  },
  rowName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  rowXp: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.primary,
  },
});
}

