import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useI18n } from "../state/LanguageContext";
import { useTheme } from "../state/ThemeContext";
import { fonts, radius, shadow, spacing } from "../theme";
import { EmojiBurst } from "./EmojiBurst";

interface StreakCelebrationProps {
  visible: boolean;
  streakDays: number;
  bonusXp?: number;
  onClose: () => void;
}

export function StreakCelebrationModal({
  visible,
  streakDays,
  bonusXp = 50,
  onClose,
}: StreakCelebrationProps) {
  const { colors } = useTheme();
  const { lang } = useI18n();

  // Animation values
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const flameBounce = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (!visible) return;

    scaleAnim.setValue(0);
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 80,
      useNativeDriver: true,
    }).start();

    // Loop flame pulsing
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(flameBounce, {
            toValue: 1.15,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0.9,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(flameBounce, {
            toValue: 1,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0.4,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    pulseLoop.start();

    return () => pulseLoop.stop();
  }, [visible]);

  if (!visible) return null;

  const milestoneTitle =
    lang === "ne"
      ? `${streakDays} दिने लगातार यात्रा!`
      : `${streakDays} DAY STREAK!`;

  const milestoneSubtitle =
    lang === "ne"
      ? "तपाईंको अध्ययनको ज्वाला निरन्तर बलिरहेको छ! यसैगरी अगाडि बढ्नुहोस्।"
      : "You're on fire! Consistency is the secret to true mastery.";

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Confetti particles */}
          <EmojiBurst count={16} />

          {/* Glowing flame circle */}
          <View style={styles.flameContainer}>
            <Animated.View
              style={[
                styles.flameGlow,
                {
                  opacity: glowOpacity,
                  transform: [{ scale: flameBounce }],
                },
              ]}
            />
            <Animated.Text
              style={[
                styles.flameEmoji,
                { transform: [{ scale: flameBounce }] },
              ]}
            >
              🔥
            </Animated.Text>
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.text }]}>
            {milestoneTitle}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {milestoneSubtitle}
          </Text>

          {/* Bonus XP Box */}
          <View
            style={[
              styles.bonusBox,
              { backgroundColor: colors.goldSoft, borderColor: colors.gold },
            ]}
          >
            <Text style={styles.bonusIcon}>⚡</Text>
            <Text style={[styles.bonusText, { color: colors.gold }]}>
              +{bonusXp} XP {lang === "ne" ? "बोनस प्राप्त!" : "STREAK BONUS!"}
            </Text>
          </View>

          {/* Continue button */}
          <TouchableOpacity
            style={[styles.continueButton, { backgroundColor: colors.primary }]}
            onPress={onClose}
            activeOpacity={0.85}
          >
            <Text style={styles.continueText}>
              {lang === "ne" ? "जारी राख्नुहोस्" : "KEEP IT UP!"}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(10, 5, 30, 0.82)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    borderRadius: radius.card,
    padding: spacing.xl,
    alignItems: "center",
    borderWidth: 1.5,
    ...shadow.card,
  },
  flameContainer: {
    width: 110,
    height: 110,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  flameGlow: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(251, 146, 60, 0.35)",
  },
  flameEmoji: {
    fontSize: 64,
  },
  title: {
    fontFamily: fonts.bodyBold,
    fontSize: 26,
    textAlign: "center",
    marginBottom: spacing.xs,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  bonusBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 999,
    borderWidth: 1.5,
    marginBottom: spacing.xl,
    gap: 8,
  },
  bonusIcon: {
    fontSize: 20,
  },
  bonusText: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    letterSpacing: 0.5,
  },
  continueButton: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.card,
  },
  continueText: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: "#FFFFFF",
    letterSpacing: 1,
  },
});
