import React from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useI18n } from "../state/LanguageContext";
import { useTheme } from "../state/ThemeContext";
import { fonts, radius, shadow, spacing } from "../theme";
import { Haptics } from "../utils/haptics";

export type RuleGameId =
  | "zip"
  | "wordSearch"
  | "memory"
  | "riddle"
  | "battle"
  | "quiz";

interface GameRulesModalProps {
  visible: boolean;
  gameId: RuleGameId;
  onClose: () => void;
}

interface RuleContent {
  icon: string;
  badge: string;
  badgeBg: string;
  titleKey: any;
  step1Key: any;
  step2Key: any;
  step3Key: any;
  proTipKey: any;
}

const GAME_RULES: Record<RuleGameId, RuleContent> = {
  zip: {
    icon: "⚡",
    badge: "LOGIC PUZZLE",
    badgeBg: "#6366F1",
    titleKey: "rulesZipTitle",
    step1Key: "rulesZipStep1",
    step2Key: "rulesZipStep2",
    step3Key: "rulesZipStep3",
    proTipKey: "rulesZipProTip",
  },
  wordSearch: {
    icon: "🔍",
    badge: "VOCABULARY",
    badgeBg: "#EC4899",
    titleKey: "rulesWordSearchTitle",
    step1Key: "rulesWordSearchStep1",
    step2Key: "rulesWordSearchStep2",
    step3Key: "rulesWordSearchStep3",
    proTipKey: "rulesWordSearchProTip",
  },
  memory: {
    icon: "🧠",
    badge: "MEMORY RECALL",
    badgeBg: "#F59E0B",
    titleKey: "rulesMemoryTitle",
    step1Key: "rulesMemoryStep1",
    step2Key: "rulesMemoryStep2",
    step3Key: "rulesMemoryStep3",
    proTipKey: "rulesMemoryProTip",
  },
  riddle: {
    icon: "💡",
    badge: "LATERAL THINKING",
    badgeBg: "#10B981",
    titleKey: "rulesRiddleTitle",
    step1Key: "rulesRiddleStep1",
    step2Key: "rulesRiddleStep2",
    step3Key: "rulesRiddleStep3",
    proTipKey: "rulesRiddleProTip",
  },
  battle: {
    icon: "⚔️",
    badge: "LIVE 1v1 PvP",
    badgeBg: "#EF4444",
    titleKey: "rulesBattleTitle",
    step1Key: "rulesBattleStep1",
    step2Key: "rulesBattleStep2",
    step3Key: "rulesBattleStep3",
    proTipKey: "rulesBattleProTip",
  },
  quiz: {
    icon: "📜",
    badge: "DAILY QUEST",
    badgeBg: "#3B82F6",
    titleKey: "rulesQuizTitle",
    step1Key: "rulesQuizStep1",
    step2Key: "rulesQuizStep2",
    step3Key: "rulesQuizStep3",
    proTipKey: "rulesQuizProTip",
  },
};

export function GameRulesModal({
  visible,
  gameId,
  onClose,
}: GameRulesModalProps) {
  const { colors } = useTheme();
  const { t } = useI18n();

  const info = GAME_RULES[gameId] || GAME_RULES.zip;

  const handleDismiss = () => {
    Haptics.tap();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleDismiss}
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: colors.surfaceElevated,
              borderColor: colors.border,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
              <View style={[styles.iconBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={styles.iconText}>{info.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={[styles.badge, { backgroundColor: info.badgeBg }]}>
                  <Text style={styles.badgeText}>{info.badge}</Text>
                </View>
                <Text
                  style={[
                    styles.title,
                    { color: colors.text, fontFamily: fonts.display },
                  ]}
                  numberOfLines={1}
                >
                  {t(info.titleKey)}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleDismiss}
              style={[
                styles.closeButton,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={[styles.closeIcon, { color: colors.textMuted }]}>
                ✕
              </Text>
            </TouchableOpacity>
          </View>

          {/* Steps Content */}
          <ScrollView
            style={styles.contentScroll}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Step 1 */}
            <View style={[styles.stepCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.stepNum, { backgroundColor: colors.primary }]}>
                <Text style={styles.stepNumText}>1</Text>
              </View>
              <View style={styles.stepTextWrap}>
                <Text style={[styles.stepLabel, { color: colors.primary, fontFamily: fonts.bodyBold }]}>
                  STEP 1: OBJECTIVE
                </Text>
                <Text style={[styles.stepDesc, { color: colors.text, fontFamily: fonts.body }]}>
                  {t(info.step1Key)}
                </Text>
              </View>
            </View>

            {/* Step 2 */}
            <View style={[styles.stepCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.stepNum, { backgroundColor: colors.accent }]}>
                <Text style={styles.stepNumText}>2</Text>
              </View>
              <View style={styles.stepTextWrap}>
                <Text style={[styles.stepLabel, { color: colors.accent, fontFamily: fonts.bodyBold }]}>
                  STEP 2: HOW TO PLAY
                </Text>
                <Text style={[styles.stepDesc, { color: colors.text, fontFamily: fonts.body }]}>
                  {t(info.step2Key)}
                </Text>
              </View>
            </View>

            {/* Step 3 */}
            <View style={[styles.stepCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.stepNum, { backgroundColor: colors.green }]}>
                <Text style={styles.stepNumText}>3</Text>
              </View>
              <View style={styles.stepTextWrap}>
                <Text style={[styles.stepLabel, { color: colors.green, fontFamily: fonts.bodyBold }]}>
                  STEP 3: CLEAR & WIN
                </Text>
                <Text style={[styles.stepDesc, { color: colors.text, fontFamily: fonts.body }]}>
                  {t(info.step3Key)}
                </Text>
              </View>
            </View>

            {/* Pro Tip Callout */}
            <View
              style={[
                styles.proTipBox,
                {
                  backgroundColor: colors.amberSoft,
                  borderColor: colors.amber,
                },
              ]}
            >
              <Text style={styles.proTipIcon}>💡</Text>
              <Text
                style={[
                  styles.proTipText,
                  { color: colors.amber, fontFamily: fonts.bodyBold },
                ]}
              >
                {t(info.proTipKey)}
              </Text>
            </View>
          </ScrollView>

          {/* Bottom Action */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[
                styles.gotItButton,
                { backgroundColor: colors.primary },
              ]}
              onPress={handleDismiss}
              activeOpacity={0.8}
            >
              <Text style={[styles.gotItText, { fontFamily: fonts.bodyBold }]}>
                {t("done")} — Let's Play! 🚀
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  container: {
    width: "100%",
    maxWidth: 440,
    maxHeight: "85%",
    borderRadius: radius.card,
    borderWidth: 1.5,
    overflow: "hidden",
    ...shadow.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  iconText: {
    fontSize: 22,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 2,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 18,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: spacing.sm,
  },
  closeIcon: {
    fontSize: 14,
    fontWeight: "bold",
  },
  contentScroll: {
    paddingHorizontal: spacing.lg,
  },
  content: {
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  stepCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.2,
    gap: spacing.md,
  },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  stepNumText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "bold",
  },
  stepTextWrap: {
    flex: 1,
  },
  stepLabel: {
    fontSize: 11,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  stepDesc: {
    fontSize: 14,
    lineHeight: 20,
  },
  proTipBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.2,
    gap: spacing.sm,
  },
  proTipIcon: {
    fontSize: 18,
  },
  proTipText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    padding: spacing.md,
    borderTopWidth: 1,
  },
  gotItButton: {
    height: 48,
    borderRadius: radius.button,
    justifyContent: "center",
    alignItems: "center",
  },
  gotItText: {
    color: "#FFFFFF",
    fontSize: 16,
  },
});
