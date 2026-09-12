import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AvatarInfo } from "../api/types";
import { useI18n } from "../state/LanguageContext";
import { fonts, radius, shadow } from "../theme";
import { SoundEffects } from "../utils/audio";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface BattleSplashProps {
  visible: boolean;
  player1: { name: string; avatar: AvatarInfo; xp?: number };
  player2: { name: string; avatar: AvatarInfo; xp?: number };
  onFinish: () => void;
}

export function BattleSplashModal({
  visible,
  player1,
  player2,
  onFinish,
}: BattleSplashProps) {
  const { lang } = useI18n();
  const [countdown, setCountdown] = useState(3);

  // Animations
  const p1Slide = useRef(new Animated.Value(-SCREEN_WIDTH)).current;
  const p2Slide = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const vsScale = useRef(new Animated.Value(0)).current;
  const vsRotate = useRef(new Animated.Value(0)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;
  const countdownScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visible) return;

    SoundEffects.playBattleStart();
    setCountdown(3);
    p1Slide.setValue(-SCREEN_WIDTH);
    p2Slide.setValue(SCREEN_WIDTH);
    vsScale.setValue(0);
    vsRotate.setValue(0);
    flashAnim.setValue(0.8);

    // Initial clash sequence
    Animated.sequence([
      Animated.parallel([
        Animated.timing(flashAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(p1Slide, {
          toValue: 0,
          friction: 6,
          tension: 70,
          useNativeDriver: true,
        }),
        Animated.spring(p2Slide, {
          toValue: 0,
          friction: 6,
          tension: 70,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.spring(vsScale, {
          toValue: 1,
          friction: 4,
          tension: 90,
          useNativeDriver: true,
        }),
        Animated.timing(vsRotate, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Countdown 3.. 2.. 1.. GO
    const timer3 = setTimeout(() => {
      setCountdown(2);
      pulseCountdown();
    }, 900);

    const timer2 = setTimeout(() => {
      setCountdown(1);
      pulseCountdown();
    }, 1700);

    const timer1 = setTimeout(() => {
      setCountdown(0);
      pulseCountdown();
    }, 2500);

    const timerFinish = setTimeout(() => {
      onFinish();
    }, 3200);

    return () => {
      clearTimeout(timer3);
      clearTimeout(timer2);
      clearTimeout(timer1);
      clearTimeout(timerFinish);
    };
  }, [visible]);

  const pulseCountdown = () => {
    SoundEffects.playTick();
    countdownScale.setValue(1.4);
    Animated.spring(countdownScale, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();
  };

  if (!visible) return null;

  const vsSpin = vsRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["-30deg", "0deg"],
  });

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.container}>
        {/* White screen lightning flash */}
        <Animated.View
          style={[styles.flashOverlay, { opacity: flashAnim }]}
          pointerEvents="none"
        />

        {/* Diagonal cosmic arena background */}
        <View style={styles.topArena}>
          <Animated.View
            style={[
              styles.playerCard,
              { transform: [{ translateX: p1Slide }] },
            ]}
          >
            <View
              style={[
                styles.avatarCircle,
                { backgroundColor: player1.avatar.bg || "#7C3AED" },
              ]}
            >
              <Text style={styles.avatarEmoji}>{player1.avatar.emoji || "🦊"}</Text>
            </View>
            <Text style={styles.playerName} numberOfLines={1}>
              {player1.name}
            </Text>
            <View style={styles.tagBadge}>
              <Text style={styles.tagText}>
                {lang === "ne" ? "तपाईं" : "YOU"}
              </Text>
            </View>
          </Animated.View>
        </View>

        {/* Center VS Emblem */}
        <Animated.View
          style={[
            styles.vsContainer,
            {
              transform: [{ scale: vsScale }, { rotate: vsSpin }],
            },
          ]}
        >
          <View style={styles.vsGlowCircle} />
          <View style={styles.vsBadge}>
            <Text style={styles.vsText}>VS</Text>
          </View>
        </Animated.View>

        {/* Bottom Arena */}
        <View style={styles.bottomArena}>
          <Animated.View
            style={[
              styles.playerCard,
              { transform: [{ translateX: p2Slide }] },
            ]}
          >
            <View
              style={[
                styles.avatarCircle,
                { backgroundColor: player2.avatar.bg || "#EC4899" },
              ]}
            >
              <Text style={styles.avatarEmoji}>{player2.avatar.emoji || "🦁"}</Text>
            </View>
            <Text style={styles.playerName} numberOfLines={1}>
              {player2.name}
            </Text>
            <View style={[styles.tagBadge, styles.opponentTag]}>
              <Text style={styles.tagText}>
                {lang === "ne" ? "विरोधी" : "OPPONENT"}
              </Text>
            </View>
          </Animated.View>
        </View>

        {/* Countdown footer */}
        <View style={styles.footerOverlay}>
          <Animated.Text
            style={[
              styles.countdownText,
              { transform: [{ scale: countdownScale }] },
            ]}
          >
            {countdown > 0
              ? countdown
              : lang === "ne"
              ? "सुरु गर्नुहोस्!"
              : "BATTLE!"}
          </Animated.Text>
          <Text style={styles.subtext}>
            {lang === "ne"
              ? "सबैभन्दा छिटो र सही उत्तर दिनुहोस्!"
              : "Fastest correct answers win the match!"}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A051E",
    justifyContent: "center",
    alignItems: "center",
  },
  flashOverlay: {
    ...(StyleSheet.absoluteFill as any),
    backgroundColor: "#FFFFFF",
    zIndex: 99,
  },
  topArena: {
    flex: 1,
    width: "100%",
    backgroundColor: "#160C38",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 40,
    borderBottomWidth: 3,
    borderBottomColor: "#A855F7",
  },
  bottomArena: {
    flex: 1,
    width: "100%",
    backgroundColor: "#20092B",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 40,
    borderTopWidth: 3,
    borderTopColor: "#EC4899",
  },
  playerCard: {
    alignItems: "center",
    justifyContent: "center",
  },
  avatarCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#FFFFFF",
    ...shadow.card,
  },
  avatarEmoji: {
    fontSize: 54,
  },
  playerName: {
    fontFamily: fonts.bodyBold,
    fontSize: 24,
    color: "#FFFFFF",
    marginTop: 12,
    letterSpacing: 0.5,
  },
  tagBadge: {
    marginTop: 6,
    backgroundColor: "#7C3AED",
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 999,
  },
  opponentTag: {
    backgroundColor: "#EC4899",
  },
  tagText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  vsContainer: {
    position: "absolute",
    zIndex: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  vsGlowCircle: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "rgba(251, 146, 60, 0.4)",
  },
  vsBadge: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#FB923C",
    borderWidth: 4,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    ...shadow.card,
  },
  vsText: {
    fontFamily: fonts.bodyBold,
    fontSize: 34,
    color: "#FFFFFF",
    fontStyle: "italic",
    letterSpacing: 1,
  },
  footerOverlay: {
    position: "absolute",
    bottom: 48,
    alignItems: "center",
    zIndex: 60,
  },
  countdownText: {
    fontFamily: fonts.bodyBold,
    fontSize: 52,
    color: "#FBBF24",
    textShadowColor: "rgba(251, 191, 36, 0.6)",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 16,
  },
  subtext: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: "#E2E8F0",
    marginTop: 4,
    opacity: 0.9,
  },
});
