import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../state/ThemeContext";
import { fonts, radius, shadow } from "../theme";

interface VictoryAnimationProps {
  visible: boolean;
  onAnimationComplete?: () => void;
  message?: string;
  subMessage?: string;
}

export function VictoryAnimation({
  visible,
  onAnimationComplete,
  message = "VICTORY!",
  subMessage = "Outstanding performance!",
}: VictoryAnimationProps) {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const trophyBounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Continuous trophy bounce
        Animated.loop(
          Animated.sequence([
            Animated.timing(trophyBounce, {
              toValue: -15,
              duration: 400,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(trophyBounce, {
              toValue: 0,
              duration: 400,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            }),
          ])
        ).start();

        if (onAnimationComplete) {
          const timer = setTimeout(onAnimationComplete, 2200);
          return () => clearTimeout(timer);
        }
      });
    } else {
      scale.setValue(0);
      opacity.setValue(0);
      trophyBounce.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <TouchableOpacity
      activeOpacity={0.95}
      onPress={onAnimationComplete}
      style={[StyleSheet.absoluteFill, styles.overlay]}
    >
      <Animated.View
        style={[
          styles.container,
          {
            backgroundColor: colors.surfaceElevated,
            borderColor: colors.gold,
            opacity,
            transform: [{ scale }],
          },
        ]}
      >
        <Animated.Text
          style={[
            styles.trophy,
            {
              transform: [{ translateY: trophyBounce }],
            },
          ]}
        >
          🏆
        </Animated.Text>
        <Text style={[styles.title, { color: colors.gold, fontFamily: fonts.display }]}>
          {message}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textMuted, fontFamily: fonts.body }]}>
          {subMessage}
        </Text>
        <View style={[styles.tapChip, { backgroundColor: colors.primarySoft }]}>
          <Text style={[styles.tapText, { color: colors.primary, fontFamily: fonts.bodyBold }]}>
            TAP TO VIEW RECAP ➔
          </Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  overlay: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(10, 5, 30, 0.75)",
    zIndex: 99999,
    elevation: 99999,
  },
  container: {
    width: "84%",
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.card,
  },
  trophy: {
    fontSize: 72,
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    textAlign: "center",
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 20,
  },
  tapChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.chip,
  },
  tapText: {
    fontSize: 12,
    letterSpacing: 1,
  },
});
