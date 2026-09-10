import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../state/ThemeContext";
import { fonts } from "../theme";

interface ScoreRingProps {
  score: number;
  total: number;
  size?: number;
}

/** Animated celebratory score ring with spring scale and counting display. */
export function ScoreRing({ score, total, size = 140 }: ScoreRingProps) {
  const { colors } = useTheme();
  const good = total > 0 && score / total >= 0.5;
  const isPerfect = total > 0 && score === total;

  const scale = useRef(new Animated.Value(0.3)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    // Entrance spring animation
    Animated.spring(scale, {
      toValue: 1,
      friction: 4,
      tension: 50,
      useNativeDriver: true,
    }).start();

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.05,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Score count-up timer
    let current = 0;
    const stepTime = Math.max(30, Math.floor(600 / Math.max(1, score)));
    const interval = setInterval(() => {
      current++;
      if (current <= score) {
        setDisplayScore(current);
      } else {
        clearInterval(interval);
      }
    }, stepTime);

    return () => clearInterval(interval);
  }, [score]);

  const ringColor = isPerfect ? colors.gold : good ? colors.green : colors.accent;

  return (
    <Animated.View
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: ringColor,
          backgroundColor: colors.card,
          transform: [{ scale }, { scale: pulse }],
        },
      ]}
    >
      <Text style={[styles.score, { color: ringColor, fontFamily: fonts.display }]}>
        {displayScore}
        <Text style={[styles.total, { color: colors.textMuted, fontFamily: fonts.bodyBold }]}>
          /{total}
        </Text>
      </Text>
      {isPerfect && (
        <Text style={styles.perfectBadge}>👑 PERFECT</Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  ring: {
    borderWidth: 8,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  score: {
    fontSize: 42,
  },
  total: {
    fontSize: 22,
  },
  perfectBadge: {
    position: "absolute",
    bottom: -12,
    backgroundColor: "#F59E0B",
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: "hidden",
    letterSpacing: 0.8,
  },
});
