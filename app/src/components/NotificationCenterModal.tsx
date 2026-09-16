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

interface NotificationCenterModalProps {
  visible: boolean;
  onClose: () => void;
  onNavigateQuiz?: () => void;
  onNavigateZip?: () => void;
  onNavigateBattle?: () => void;
  onNavigateRiddle?: () => void;
  streakCount?: number;
}

export function NotificationCenterModal({
  visible,
  onClose,
  onNavigateQuiz,
  onNavigateZip,
  onNavigateBattle,
  onNavigateRiddle,
  streakCount = 1,
}: NotificationCenterModalProps) {
  const { lang } = useI18n();
  const { colors } = useTheme();
  const isNepali = lang === "ne";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.container,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Text style={styles.headerEmoji}>🔔</Text>
              <Text
                style={[
                  styles.title,
                  { color: colors.text, fontFamily: fonts.displayMed },
                ]}
              >
                {isNepali ? "सूचनाहरू र दैनिक गतिविधि" : "Notifications & Quests"}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.closeBtn,
                { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
              ]}
              onPress={onClose}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Close notifications"
            >
              <Text style={[styles.closeBtnText, { color: colors.textMuted }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollList} showsVerticalScrollIndicator={false}>
            {/* Notification Item 1: Daily Quiz Quest */}
            <TouchableOpacity
              style={[
                styles.notificationCard,
                { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
              ]}
              onPress={() => {
                onClose();
                if (onNavigateQuiz) onNavigateQuiz();
              }}
              activeOpacity={0.8}
            >
              <View style={[styles.iconPill, { backgroundColor: "rgba(220, 38, 38, 0.15)", borderColor: "#DC2626" }]}>
                <Text style={styles.cardEmoji}>🎯</Text>
              </View>
              <View style={styles.cardBody}>
                <View style={styles.cardHeaderRow}>
                  <Text style={[styles.cardTitle, { color: colors.text, fontFamily: fonts.bodyBold }]}>
                    {isNepali ? "दैनिक हाजिरीजवाफ तयार छ" : "Daily Knowledge Quest Ready"}
                  </Text>
                  <Text style={[styles.badgeXp, { color: "#F59E0B", fontFamily: fonts.bodyBold }]}>
                    +100 XP
                  </Text>
                </View>
                <Text style={[styles.cardSub, { color: colors.textMuted, fontFamily: fonts.body }]}>
                  {isNepali
                    ? "तपाईंको कक्षाको पाठ्यक्रम अनुसार ५ वटा नयाँ प्रश्नहरू उपलब्ध छन्।"
                    : "5 fresh syllabus-aligned questions waiting for your grade level."}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Notification Item 2: Streak Protector Alert */}
            <View
              style={[
                styles.notificationCard,
                { backgroundColor: colors.surfaceElevated, borderColor: "rgba(245, 158, 11, 0.3)" },
              ]}
            >
              <View style={[styles.iconPill, { backgroundColor: "rgba(245, 158, 11, 0.15)", borderColor: "#F59E0B" }]}>
                <Text style={styles.cardEmoji}>🔥</Text>
              </View>
              <View style={styles.cardBody}>
                <View style={styles.cardHeaderRow}>
                  <Text style={[styles.cardTitle, { color: colors.text, fontFamily: fonts.bodyBold }]}>
                    {isNepali ? `${streakCount} दिनको स्ट्रिक सुरक्षित छ` : `${streakCount}-Day Streak Active`}
                  </Text>
                  <Text style={[styles.badgeActive, { color: colors.green, fontFamily: fonts.bodyBold }]}>
                    {isNepali ? "सक्रिय" : "ON TRACK"}
                  </Text>
                </View>
                <Text style={[styles.cardSub, { color: colors.textMuted, fontFamily: fonts.body }]}>
                  {isNepali
                    ? "बेलुका ७:३० बजे दैनिक रिमाइन्डर आउनेछ ताकि स्ट्रिक नटुटोस्!"
                    : "Daily 7:30 PM reminder scheduled so your streak never burns out!"}
                </Text>
              </View>
            </View>

            {/* Notification Item 3: Daily Zip Challenge */}
            <TouchableOpacity
              style={[
                styles.notificationCard,
                { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
              ]}
              onPress={() => {
                onClose();
                if (onNavigateZip) onNavigateZip();
              }}
              activeOpacity={0.8}
            >
              <View style={[styles.iconPill, { backgroundColor: "rgba(139, 92, 246, 0.15)", borderColor: "#8B5CF6" }]}>
                <Text style={styles.cardEmoji}>⚡</Text>
              </View>
              <View style={styles.cardBody}>
                <View style={styles.cardHeaderRow}>
                  <Text style={[styles.cardTitle, { color: colors.text, fontFamily: fonts.bodyBold }]}>
                    {isNepali ? "दैनिक जिप पजल चुनौती" : "Daily Zip Path Puzzle"}
                  </Text>
                  <Text style={[styles.badgeXp, { color: "#8B5CF6", fontFamily: fonts.bodyBold }]}>
                    +50 XP
                  </Text>
                </View>
                <Text style={[styles.cardSub, { color: colors.textMuted, fontFamily: fonts.body }]}>
                  {isNepali
                    ? "ग्रिडका सबै कोठाहरू जोड्नुहोस् र लिडरबोर्डमा आफ्नो नाम दर्ज गर्नुहोस्।"
                    : "Connect numbers 1 to K and fill every cell to top the leaderboard."}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Notification Item 4: Daily Gaunkhane Katha / Riddle */}
            <TouchableOpacity
              style={[
                styles.notificationCard,
                { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
              ]}
              onPress={() => {
                onClose();
                if (onNavigateRiddle) onNavigateRiddle();
              }}
              activeOpacity={0.8}
            >
              <View style={[styles.iconPill, { backgroundColor: "rgba(16, 185, 129, 0.15)", borderColor: "#10B981" }]}>
                <Text style={styles.cardEmoji}>🧩</Text>
              </View>
              <View style={styles.cardBody}>
                <View style={styles.cardHeaderRow}>
                  <Text style={[styles.cardTitle, { color: colors.text, fontFamily: fonts.bodyBold }]}>
                    {isNepali ? "दैनिक गाउँखाने कथा र पहेली" : "Gaunkhane Katha & Riddles"}
                  </Text>
                  <Text style={[styles.badgeXp, { color: "#10B981", fontFamily: fonts.bodyBold }]}>
                    +15 XP
                  </Text>
                </View>
                <Text style={[styles.cardSub, { color: colors.textMuted, fontFamily: fonts.body }]}>
                  {isNepali
                    ? "आजको नयाँ गाउँखाने कथा सुल्झाउनुहोस् वा ५०+ पहेलीहरूको आनन्द लिनुहोस्।"
                    : "Unscramble today's authentic Nepali riddle or play unlimited puzzles."}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Notification Item 5: 1v1 Live Battle Arena */}
            <TouchableOpacity
              style={[
                styles.notificationCard,
                { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
              ]}
              onPress={() => {
                onClose();
                if (onNavigateBattle) onNavigateBattle();
              }}
              activeOpacity={0.8}
            >
              <View style={[styles.iconPill, { backgroundColor: "rgba(236, 72, 153, 0.15)", borderColor: "#EC4899" }]}>
                <Text style={styles.cardEmoji}>⚔️</Text>
              </View>
              <View style={styles.cardBody}>
                <View style={styles.cardHeaderRow}>
                  <Text style={[styles.cardTitle, { color: colors.text, fontFamily: fonts.bodyBold }]}>
                    {isNepali ? "प्रत्यक्ष १v१ ज्ञान युद्ध" : "1v1 Live Battle Duel"}
                  </Text>
                  <Text style={[styles.badgeActive, { color: "#EC4899", fontFamily: fonts.bodyBold }]}>
                    ONLINE
                  </Text>
                </View>
                <Text style={[styles.cardSub, { color: colors.textMuted, fontFamily: fonts.body }]}>
                  {isNepali
                    ? "अन्य साथीहरू अनलाइन छन्! तत्काल प्रतिस्पर्धा गर्नुहोस् र ट्रफी जित्नुहोस्।"
                    : "Challenge classmates & global rivals in high-speed real-time duel."}
                </Text>
              </View>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.md,
  },
  container: {
    width: "100%",
    maxWidth: 420,
    maxHeight: "85%",
    borderRadius: 24,
    borderWidth: 1.5,
    padding: spacing.lg,
    ...shadow.card,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  headerEmoji: {
    fontSize: 22,
  },
  title: {
    fontSize: 17,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: "700",
  },
  scrollList: {
    maxHeight: 460,
  },
  notificationCard: {
    flexDirection: "row",
    padding: spacing.md,
    borderRadius: radius.card,
    borderWidth: 1,
    marginBottom: spacing.sm,
    gap: 12,
    alignItems: "flex-start",
  },
  iconPill: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cardEmoji: {
    fontSize: 20,
  },
  cardBody: {
    flex: 1,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 14,
    flex: 1,
    marginRight: 6,
  },
  badgeXp: {
    fontSize: 11,
    letterSpacing: 0.5,
  },
  badgeActive: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
  cardSub: {
    fontSize: 12,
    lineHeight: 17,
  },
});
