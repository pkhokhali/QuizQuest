import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TranslationKey } from "../i18n";
import { useI18n } from "../state/LanguageContext";
import { useTheme } from "../state/ThemeContext";
import { fonts, radius, shadow, spacing } from "../theme";
import { SoundEffects } from "../utils/audio";
import { ConfettiEffect } from "./ConfettiEffect";

export const TUTORIAL_STORAGE_KEY = "@quizquest_tutorial_completed_v1";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const PADDING = 6;
const CORNER_RADIUS = 16;

export interface TargetRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TourStepItem {
  id: string;
  titleKey: TranslationKey;
  descKey: TranslationKey;
  icon: string;
  badge?: string;
  getRef?: () => any;
  scrollTo?: () => void;
}

interface FeatureTourSpotlightModalProps {
  visible: boolean;
  steps: TourStepItem[];
  onClose: () => void;
  onFinish?: () => void;
}

export function FeatureTourSpotlightModal({
  visible,
  steps,
  onClose,
  onFinish,
}: FeatureTourSpotlightModalProps) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();

  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // Pulse animation for spotlight ring
  const pulseAnim = useRef(new Animated.Value(1)).current;
  // Fade in animation for card content
  const cardFadeAnim = useRef(new Animated.Value(0)).current;

  // Measure active step target
  const measureCurrentStep = useCallback(() => {
    if (!visible || steps.length === 0) return;
    const step = steps[currentStep];
    if (!step) return;

    if (step.scrollTo) {
      step.scrollTo();
    }

    setTimeout(() => {
      const node = step.getRef?.();
      if (node && typeof node.measureInWindow === "function") {
        node.measureInWindow((x: number, y: number, width: number, height: number) => {
          if (width > 0 && height > 0) {
            setTargetRect({ x, y, width, height });
          } else {
            setTargetRect(null);
          }
        });
      } else {
        setTargetRect(null);
      }
    }, 120);
  }, [visible, steps, currentStep]);

  useEffect(() => {
    if (visible) {
      setCurrentStep(0);
      setShowConfetti(false);
      cardFadeAnim.setValue(0);
      Animated.timing(cardFadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
      measureCurrentStep();
    } else {
      setTargetRect(null);
    }
  }, [visible]);

  useEffect(() => {
    cardFadeAnim.setValue(0);
    Animated.timing(cardFadeAnim, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
    measureCurrentStep();
  }, [currentStep, measureCurrentStep, cardFadeAnim]);

  // Infinite pulsing glow around the spotlight
  useEffect(() => {
    if (!visible) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.04,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [visible, pulseAnim]);

  const markCompleted = async () => {
    try {
      await AsyncStorage.setItem(TUTORIAL_STORAGE_KEY, "true");
    } catch {}
  };

  const handleNext = () => {
    SoundEffects.playTap();
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // Completed last step!
      SoundEffects.playVictory();
      setShowConfetti(true);
      markCompleted();
      setTimeout(() => {
        onFinish?.();
        onClose();
      }, 1400);
    }
  };

  const handleBack = () => {
    SoundEffects.playTap();
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    SoundEffects.playTap();
    markCompleted();
    onClose();
  };

  if (!visible || steps.length === 0) return null;

  const step = steps[currentStep] || steps[0];
  const isLast = currentStep === steps.length - 1;

  // Determine if card should be above or below spotlight
  const isTargetInBottomHalf = targetRect ? targetRect.y + targetRect.height / 2 > SCREEN_HEIGHT * 0.52 : false;

  // Spotlight box coordinates with padding
  const spotX = targetRect ? Math.max(8, targetRect.x - PADDING) : 0;
  const spotY = targetRect ? Math.max(insets.top, targetRect.y - PADDING) : 0;
  const spotW = targetRect ? Math.min(SCREEN_WIDTH - 16, targetRect.width + PADDING * 2) : 0;
  const spotH = targetRect ? targetRect.height + PADDING * 2 : 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleSkip}>
      <View style={styles.container}>
        {/* Confetti celebration on completion */}
        {showConfetti && <ConfettiEffect count={45} />}

        {/* Backdrop: 4 cut-out regions framing the spotlight */}
        {targetRect ? (
          <>
            {/* Top dark backdrop */}
            <TouchableWithoutFeedback onPress={handleNext}>
              <View style={[styles.darkOverlay, { top: 0, left: 0, right: 0, height: spotY }]} />
            </TouchableWithoutFeedback>

            {/* Bottom dark backdrop */}
            <TouchableWithoutFeedback onPress={handleNext}>
              <View
                style={[
                  styles.darkOverlay,
                  { top: spotY + spotH, left: 0, right: 0, bottom: 0 },
                ]}
              />
            </TouchableWithoutFeedback>

            {/* Left dark backdrop */}
            <TouchableWithoutFeedback onPress={handleNext}>
              <View
                style={[
                  styles.darkOverlay,
                  { top: spotY, left: 0, width: spotX, height: spotH },
                ]}
              />
            </TouchableWithoutFeedback>

            {/* Right dark backdrop */}
            <TouchableWithoutFeedback onPress={handleNext}>
              <View
                style={[
                  styles.darkOverlay,
                  {
                    top: spotY,
                    left: spotX + spotW,
                    right: 0,
                    height: spotH,
                  },
                ]}
              />
            </TouchableWithoutFeedback>

            {/* Pulsing Highlight Box around the Target */}
            <Animated.View
              pointerEvents="box-none"
              style={[
                styles.spotlightRing,
                {
                  left: spotX,
                  top: spotY,
                  width: spotW,
                  height: spotH,
                  borderColor: colors.primary,
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            >
              {/* Corner Beacon */}
              <View style={[styles.beaconBadge, { backgroundColor: colors.accent }]}>
                <Text style={styles.beaconText}>✨ TAP</Text>
              </View>
            </Animated.View>

            {/* Transparent touchable hotspot over the target itself */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleNext}
              style={[
                styles.hotspotTouch,
                {
                  left: spotX,
                  top: spotY,
                  width: spotW,
                  height: spotH,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={t(step.titleKey)}
            />
          </>
        ) : (
          /* Full dark backdrop if no target is measured */
          <TouchableWithoutFeedback onPress={handleNext}>
            <View style={[styles.darkOverlay, StyleSheet.absoluteFill]} />
          </TouchableWithoutFeedback>
        )}

        {/* Coachmark Tooltip Card */}
        <Animated.View
          style={[
            styles.cardContainer,
            {
              opacity: cardFadeAnim,
              ...(targetRect
                ? isTargetInBottomHalf
                  ? { bottom: SCREEN_HEIGHT - spotY + 12 }
                  : { top: spotY + spotH + 12 }
                : { top: SCREEN_HEIGHT * 0.3 }),
            },
          ]}
        >
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surfaceElevated,
                borderColor: colors.primary,
              },
            ]}
          >
            {/* Top Bar: Step Counter & Close/Skip Button */}
            <View style={styles.cardHeader}>
              <View style={[styles.stepChip, { backgroundColor: colors.primarySoft }]}>
                <Text style={[styles.stepChipText, { color: colors.primary, fontFamily: fonts.bodyBold }]}>
                  {t("tourStepOf", { current: currentStep + 1, total: steps.length })}
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleSkip}
                style={styles.closeBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel="Close tour"
              >
                <Text style={[styles.closeBtnText, { color: colors.textMuted }]}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Icon + Title */}
            <View style={styles.titleRow}>
              <Text style={styles.icon}>{step.icon}</Text>
              <Text
                style={[
                  styles.title,
                  { color: colors.text, fontFamily: fonts.display },
                ]}
              >
                {t(step.titleKey)}
              </Text>
            </View>

            {/* Description Paragraph */}
            <Text
              style={[
                styles.desc,
                { color: colors.textMuted, fontFamily: fonts.body },
              ]}
            >
              {t(step.descKey)}
            </Text>

            {/* Progress Dots */}
            <View style={styles.dotsRow}>
              {steps.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    {
                      backgroundColor:
                        i === currentStep
                          ? colors.primary
                          : i < currentStep
                          ? colors.accent
                          : colors.border,
                      width: i === currentStep ? 22 : 6,
                    },
                  ]}
                />
              ))}
            </View>

            {/* Action Buttons Row */}
            <View style={styles.buttonRow}>
              {currentStep > 0 ? (
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[
                    styles.secondaryBtn,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                  onPress={handleBack}
                >
                  <Text
                    style={[
                      styles.secondaryBtnText,
                      { color: colors.text, fontFamily: fonts.bodyBold },
                    ]}
                  >
                    ← {t("tourBack")}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.skipBtn}
                  onPress={handleSkip}
                >
                  <Text
                    style={[
                      styles.skipBtnText,
                      { color: colors.textMuted, fontFamily: fonts.bodyBold },
                    ]}
                  >
                    {t("tourSkip")}
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                activeOpacity={0.88}
                style={[
                  styles.primaryBtn,
                  { backgroundColor: isLast ? colors.green : colors.primary },
                ]}
                onPress={handleNext}
              >
                <Text
                  style={[
                    styles.primaryBtnText,
                    { color: colors.textOnPrimary, fontFamily: fonts.bodyBold },
                  ]}
                >
                  {isLast ? t("tourFinish") : `${t("tourNext")} →`}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  darkOverlay: {
    position: "absolute",
    backgroundColor: "rgba(10, 15, 30, 0.82)",
  },
  spotlightRing: {
    position: "absolute",
    borderRadius: CORNER_RADIUS,
    borderWidth: 2.5,
    shadowColor: "#00E5FF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  beaconBadge: {
    position: "absolute",
    top: -10,
    right: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    ...shadow.sm,
  },
  beaconText: {
    fontSize: 9,
    color: "#0F172A",
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  hotspotTouch: {
    position: "absolute",
    borderRadius: CORNER_RADIUS,
    backgroundColor: "transparent",
    zIndex: 10,
  },
  cardContainer: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 20,
  },
  card: {
    borderRadius: radius.card,
    padding: spacing.lg,
    borderWidth: 1.5,
    ...shadow.md,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  stepChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  stepChipText: {
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    fontSize: 18,
    lineHeight: 18,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
    marginBottom: 6,
  },
  icon: {
    fontSize: 22,
  },
  title: {
    fontSize: 18,
    flex: 1,
  },
  desc: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: spacing.md,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  buttonRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  skipBtn: {
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  skipBtnText: {
    fontSize: 13,
  },
  secondaryBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: {
    fontSize: 14,
  },
  primaryBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.md,
  },
  primaryBtnText: {
    fontSize: 15,
  },
});
