import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";

interface StreakFlameProps {
  count: number;
  size?: number;
}

/** The hero flame — gently pulses to feel alive. */
export function StreakFlame({ count, size = 64 }: StreakFlameProps) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.12,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [scale]);

  return (
    <View style={styles.container}>
      <Animated.Text style={[{ fontSize: size, transform: [{ scale }] }]}>
        🔥
      </Animated.Text>
      <Text style={[styles.count, { fontSize: size * 0.55 }]}>{count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  count: {
    fontWeight: "800",
    color: "#FFFFFF",
    marginLeft: 4,
  },
});
