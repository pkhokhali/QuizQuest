import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getAwards } from "../api/client";
import { Award } from "../api/types";
import { Card } from "../components/Card";
import { ErrorCard } from "../components/ErrorCard";
import { LoadingView } from "../components/LoadingView";
import { useI18n } from "../state/LanguageContext";
import { colors, spacing } from "../theme";

export function AwardsScreen() {
  const { t, lang } = useI18n();
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

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>🏅 {t("awardsTitle")}</Text>
        <Text style={styles.subtitle}>
          {t("awardsEarned", { count: earnedCount, total: awards.length })} ·{" "}
          {t("awardsKeepGoing")}
        </Text>

        <View style={styles.grid}>
          {awards.map((award) => {
            const name = lang === "ne" && award.nameNe ? award.nameNe : award.nameEn;
            const desc = lang === "ne" && award.descNe ? award.descNe : award.descEn;
            return (
              <Card
                key={award.code}
                color={award.earned ? colors.cream : colors.card}
                style={StyleSheet.flatten([
                  styles.awardCard,
                  award.earned ? styles.earnedCard : styles.lockedCard,
                ])}
              >
                <Text style={[styles.icon, !award.earned && styles.lockedIcon]}>
                  {award.icon}
                </Text>
                <Text style={styles.name} numberOfLines={2}>
                  {name}
                </Text>
                <Text style={styles.desc} numberOfLines={3}>
                  {desc}
                </Text>
                {award.earned && award.earnedAt ? (
                  <Text style={styles.date}>✓ {award.earnedAt.slice(0, 10)}</Text>
                ) : null}
              </Card>
            );
          })}
        </View>
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
    gap: spacing.md,
    paddingBottom: spacing.xxl,
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
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  awardCard: {
    width: "47%",
    flexGrow: 1,
    alignItems: "center",
    gap: spacing.xs,
    padding: spacing.lg,
  },
  earnedCard: {
    borderWidth: 2,
    borderColor: colors.gold,
  },
  lockedCard: {
    opacity: 0.55,
  },
  icon: {
    fontSize: 40,
  },
  lockedIcon: {
    opacity: 0.6,
  },
  name: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
  },
  desc: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted,
    textAlign: "center",
  },
  date: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.green,
    marginTop: spacing.xs,
  },
});
