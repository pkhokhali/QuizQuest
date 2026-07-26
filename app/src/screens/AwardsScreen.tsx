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
import { useTabScreenPadding } from "../navigation/useTabScreenPadding";
import { useI18n } from "../state/LanguageContext";
import { useTheme } from "../state/ThemeContext";
import { fonts, spacing } from "../theme";

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

  return (
    <Atmosphere>
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: tabPadding }]}>
          <View style={styles.titleRow}>
            <IconAwards size={28} color={colors.primary} />
            <Text
              style={[styles.title, { color: colors.text, fontFamily: fonts.display }]}
            >
              {t("awardsTitle")}
            </Text>
          </View>
          <Text
            style={[styles.subtitle, { color: colors.primary, fontFamily: fonts.bodyBold }]}
          >
            {t("awardsEarned", { count: earnedCount, total: awards.length })} ·{" "}
            {t("awardsKeepGoing")}
          </Text>

          <View style={styles.grid}>
            {awards.map((award) => {
              const name =
                lang === "ne" && award.nameNe ? award.nameNe : award.nameEn;
              const desc =
                lang === "ne" && award.descNe ? award.descNe : award.descEn;
              return (
                <Card
                  key={award.code}
                  color={award.earned ? colors.cream : colors.card}
                  style={StyleSheet.flatten([
                    styles.awardCard,
                    award.earned
                      ? { borderWidth: 2, borderColor: colors.gold }
                      : { opacity: 0.55 },
                  ])}
                >
                  <Text style={[styles.icon, !award.earned && styles.lockedIcon]}>
                    {award.icon}
                  </Text>
                  <Text
                    style={[
                      styles.name,
                      { color: colors.text, fontFamily: fonts.bodyBold },
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
                  {award.earned && award.earnedAt ? (
                    <Text
                      style={[
                        styles.date,
                        { color: colors.green, fontFamily: fonts.bodyBold },
                      ]}
                    >
                      ✓ {award.earnedAt.slice(0, 10)}
                    </Text>
                  ) : null}
                </Card>
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
    gap: spacing.md,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: { fontSize: 26 },
  subtitle: { fontSize: 13 },
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
  icon: { fontSize: 40 },
  lockedIcon: { opacity: 0.6 },
  name: { fontSize: 15, textAlign: "center" },
  desc: { fontSize: 12, textAlign: "center" },
  date: { fontSize: 11, marginTop: spacing.xs },
});
