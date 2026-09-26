import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Atmosphere } from "../components/Atmosphere";
import { Card } from "../components/Card";
import { GameRulesModal, RuleGameId } from "../components/GameRulesModal";
import { useAuth } from "../state/AuthContext";
import { useI18n } from "../state/LanguageContext";
import { useTheme } from "../state/ThemeContext";
import { fonts, radius, shadow, spacing } from "../theme";
import { Haptics } from "../utils/haptics";

export function ArcadeScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const { t, lang } = useI18n();
  const { user } = useAuth();

  const [activeRuleGame, setActiveRuleGame] = useState<RuleGameId | null>(null);

  const openRules = (gameId: RuleGameId) => {
    Haptics.tap();
    setActiveRuleGame(gameId);
  };

  const navigateToGame = (screenName: string, params?: Record<string, any>) => {
    Haptics.tap();
    navigation.navigate(screenName, params);
  };

  return (
    <Atmosphere>
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Banner */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <View style={styles.taglineRow}>
                <View style={[styles.arcadePill, { backgroundColor: colors.primary }]}>
                  <Text style={styles.arcadePillText}>BRAIN GYM</Text>
                </View>
                <Text
                  style={[
                    styles.streakBadge,
                    { color: colors.accent, fontFamily: fonts.bodyBold },
                  ]}
                >
                  ⚡ Mind Sports
                </Text>
              </View>
              <Text
                style={[
                  styles.title,
                  { color: colors.text, fontFamily: fonts.display },
                ]}
              >
                {t("arcadeTitle")}
              </Text>
              <Text
                style={[
                  styles.subtitle,
                  { color: colors.textMuted, fontFamily: fonts.body },
                ]}
              >
                {t("arcadeSubtitle")}
              </Text>
            </View>
          </View>

          {/* Quick Brain Stats Strip */}
          <View style={[styles.statsStrip, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <View style={styles.statCell}>
              <Text style={styles.statEmoji}>🔥</Text>
              <View>
                <Text style={[styles.statValue, { color: colors.text, fontFamily: fonts.display }]}>
                  {user?.streak ?? 1}d
                </Text>
                <Text style={[styles.statLabel, { color: colors.textMuted, fontFamily: fonts.body }]}>
                  Brain Streak
                </Text>
              </View>
            </View>

            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />

            <View style={styles.statCell}>
              <Text style={styles.statEmoji}>⚡</Text>
              <View>
                <Text style={[styles.statValue, { color: colors.primary, fontFamily: fonts.display }]}>
                  {user?.xp ?? 0}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textMuted, fontFamily: fonts.body }]}>
                  Total XP
                </Text>
              </View>
            </View>

            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />

            <View style={styles.statCell}>
              <Text style={styles.statEmoji}>🏆</Text>
              <View>
                <Text style={[styles.statValue, { color: colors.accent, fontFamily: fonts.display }]}>
                  Lv. {user?.level ?? 1}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textMuted, fontFamily: fonts.body }]}>
                  Mastery
                </Text>
              </View>
            </View>
          </View>

          {/* Games Grid */}
          <View style={styles.gamesList}>
            {/* 1. Zip Path Puzzle */}
            <Card
              style={StyleSheet.flatten([
                styles.gameCard,
                { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
              ])}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.iconBox, { backgroundColor: "rgba(99, 102, 241, 0.15)", borderColor: "#6366F1" }]}>
                  <Text style={styles.gameIcon}>⚡</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <View style={[styles.categoryBadge, { backgroundColor: "#6366F1" }]}>
                      <Text style={styles.categoryBadgeText}>NUMBER LOGIC</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => openRules("zip")}
                      style={[styles.ruleBtn, { borderColor: colors.border }]}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={[styles.ruleBtnText, { color: colors.textMuted }]}>❓ Rules</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.gameTitle, { color: colors.text, fontFamily: fonts.display }]}>
                    {t("arcadeZipTitle")}
                  </Text>
                </View>
              </View>

              <Text style={[styles.gameDesc, { color: colors.textMuted, fontFamily: fonts.body }]}>
                {t("arcadeZipSub")}
              </Text>

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.playBtn, { backgroundColor: "#4F46E5" }]}
                  onPress={() => navigateToGame("ZipPlay", { initialMode: "daily" })}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.playBtnText, { fontFamily: fonts.bodyBold }]}>
                    🌟 Daily Challenge
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.practiceBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => navigateToGame("ZipPlay", { initialMode: "practice" })}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.practiceBtnText, { color: colors.text, fontFamily: fonts.bodyBold }]}>
                    🎲 Practice
                  </Text>
                </TouchableOpacity>
              </View>
            </Card>

            {/* 2. Word Search Quest */}
            <Card
              style={StyleSheet.flatten([
                styles.gameCard,
                { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
              ])}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.iconBox, { backgroundColor: "rgba(236, 72, 153, 0.15)", borderColor: "#EC4899" }]}>
                  <Text style={styles.gameIcon}>🔍</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <View style={[styles.categoryBadge, { backgroundColor: "#EC4899" }]}>
                      <Text style={styles.categoryBadgeText}>VOCABULARY</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => openRules("wordSearch")}
                      style={[styles.ruleBtn, { borderColor: colors.border }]}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={[styles.ruleBtnText, { color: colors.textMuted }]}>❓ Rules</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.gameTitle, { color: colors.text, fontFamily: fonts.display }]}>
                    {t("arcadeWordSearchTitle")}
                  </Text>
                </View>
              </View>

              <Text style={[styles.gameDesc, { color: colors.textMuted, fontFamily: fonts.body }]}>
                {t("arcadeWordSearchSub")}
              </Text>

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.playBtn, { backgroundColor: "#DB2777" }]}
                  onPress={() => navigateToGame("WordSearchPlay")}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.playBtnText, { fontFamily: fonts.bodyBold }]}>
                    ▶️ Play Word Search
                  </Text>
                </TouchableOpacity>
              </View>
            </Card>

            {/* 3. Memory Blocks */}
            <Card
              style={StyleSheet.flatten([
                styles.gameCard,
                { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
              ])}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.iconBox, { backgroundColor: "rgba(245, 158, 11, 0.15)", borderColor: "#F59E0B" }]}>
                  <Text style={styles.gameIcon}>🧠</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <View style={[styles.categoryBadge, { backgroundColor: "#F59E0B" }]}>
                      <Text style={styles.categoryBadgeText}>RECALL & FOCUS</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => openRules("memory")}
                      style={[styles.ruleBtn, { borderColor: colors.border }]}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={[styles.ruleBtnText, { color: colors.textMuted }]}>❓ Rules</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.gameTitle, { color: colors.text, fontFamily: fonts.display }]}>
                    {t("arcadeMemoryTitle")}
                  </Text>
                </View>
              </View>

              <Text style={[styles.gameDesc, { color: colors.textMuted, fontFamily: fonts.body }]}>
                {t("arcadeMemorySub")}
              </Text>

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.playBtn, { backgroundColor: "#EA580C" }]}
                  onPress={() => navigateToGame("MemoryPlay")}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.playBtnText, { fontFamily: fonts.bodyBold }]}>
                    ▶️ Play Memory Blocks (60s)
                  </Text>
                </TouchableOpacity>
              </View>
            </Card>

            {/* 4. Daily Mind Riddles */}
            <Card
              style={StyleSheet.flatten([
                styles.gameCard,
                { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
              ])}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.iconBox, { backgroundColor: "rgba(16, 185, 129, 0.15)", borderColor: "#10B981" }]}>
                  <Text style={styles.gameIcon}>💡</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <View style={[styles.categoryBadge, { backgroundColor: "#10B981" }]}>
                      <Text style={styles.categoryBadgeText}>LATERAL RIDDLES</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => openRules("riddle")}
                      style={[styles.ruleBtn, { borderColor: colors.border }]}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={[styles.ruleBtnText, { color: colors.textMuted }]}>❓ Rules</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.gameTitle, { color: colors.text, fontFamily: fonts.display }]}>
                    {t("arcadeRiddlesTitle")}
                  </Text>
                </View>
              </View>

              <Text style={[styles.gameDesc, { color: colors.textMuted, fontFamily: fonts.body }]}>
                {t("arcadeRiddlesSub")}
              </Text>

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.playBtn, { backgroundColor: "#059669" }]}
                  onPress={() => navigateToGame("RiddlePlay", { initialMode: "daily" })}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.playBtnText, { fontFamily: fonts.bodyBold }]}>
                    🧩 Solve Today's Riddle
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.practiceBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => navigateToGame("RiddlePlay", { initialMode: "practice" })}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.practiceBtnText, { color: colors.text, fontFamily: fonts.bodyBold }]}>
                    50+ Free
                  </Text>
                </TouchableOpacity>
              </View>
            </Card>

            {/* 5. 1v1 Live Arena */}
            <Card
              style={StyleSheet.flatten([
                styles.gameCard,
                { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
              ])}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.iconBox, { backgroundColor: "rgba(239, 68, 68, 0.15)", borderColor: "#EF4444" }]}>
                  <Text style={styles.gameIcon}>⚔️</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <View style={[styles.categoryBadge, { backgroundColor: "#EF4444" }]}>
                      <Text style={styles.categoryBadgeText}>LIVE PvP</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => openRules("battle")}
                      style={[styles.ruleBtn, { borderColor: colors.border }]}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={[styles.ruleBtnText, { color: colors.textMuted }]}>❓ Rules</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.gameTitle, { color: colors.text, fontFamily: fonts.display }]}>
                    {t("arcadeBattleTitle")}
                  </Text>
                </View>
              </View>

              <Text style={[styles.gameDesc, { color: colors.textMuted, fontFamily: fonts.body }]}>
                {t("arcadeBattleSub")}
              </Text>

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.playBtn, { backgroundColor: "#DC2626" }]}
                  onPress={() => navigateToGame("Battle")}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.playBtnText, { fontFamily: fonts.bodyBold }]}>
                    ⚔️ Enter Battle Arena
                  </Text>
                </TouchableOpacity>
              </View>
            </Card>
          </View>
        </ScrollView>

        {/* Global Game Rules Modal */}
        {activeRuleGame && (
          <GameRulesModal
            visible={!!activeRuleGame}
            gameId={activeRuleGame}
            onClose={() => setActiveRuleGame(null)}
          />
        )}
      </SafeAreaView>
    </Atmosphere>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl * 2,
  },
  header: {
    marginBottom: spacing.md,
  },
  taglineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  arcadePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  arcadePillText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  streakBadge: {
    fontSize: 13,
  },
  title: {
    fontSize: 26,
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  statsStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.card,
    borderWidth: 1,
    marginBottom: spacing.lg,
    ...shadow.sm,
  },
  statCell: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statEmoji: {
    fontSize: 20,
  },
  statValue: {
    fontSize: 16,
  },
  statLabel: {
    fontSize: 11,
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: 28,
  },
  gamesList: {
    gap: spacing.lg,
  },
  gameCard: {
    padding: spacing.lg,
    borderRadius: radius.card,
    borderWidth: 1.5,
    ...shadow.card,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1.2,
    justifyContent: "center",
    alignItems: "center",
  },
  gameIcon: {
    fontSize: 24,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 2,
  },
  categoryBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  ruleBtn: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ruleBtnText: {
    fontSize: 11,
    fontWeight: "600",
  },
  gameTitle: {
    fontSize: 18,
  },
  gameDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginVertical: spacing.sm,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  playBtn: {
    flex: 1,
    height: 44,
    borderRadius: radius.button,
    justifyContent: "center",
    alignItems: "center",
  },
  playBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
  },
  practiceBtn: {
    paddingHorizontal: 16,
    height: 44,
    borderRadius: radius.button,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  practiceBtnText: {
    fontSize: 13,
  },
});
