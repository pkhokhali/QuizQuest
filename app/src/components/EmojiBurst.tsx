import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

const DEFAULT_EMOJIS = ["🎉", "⭐", "✨", "🎊", "💜", "🧡"];

interface EmojiBurstProps {
  emojis?: string[];
  count?: number;
}

/** Lightweight confetti: emojis float up and fade out once on mount. */
export function EmojiBurst({ emojis = DEFAULT_EMOJIS, count = 12 }: EmojiBurstProps) {
  const anims = useRef(
    Array.from({ length: count }).map(() => new Animated.Value(0))
  ).current;
  const configs = useRef(
    Array.from({ length: count }).map((_, i) => ({
      emoji: emojis[i % emojis.length],
      left: Math.random() * 90 + 5,
      drift: (Math.random() - 0.5) * 80,
      size: 20 + Math.random() * 16,
      delay: Math.random() * 400,
    }))
  ).current;

  useEffect(() => {
    const animations = anims.map((value, i) =>
      Animated.timing(value, {
        toValue: 1,
        duration: 1400,
        delay: configs[i].delay,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      })
    );
    Animated.parallel(animations).start();
  }, [anims, configs]);

  return (
    <View pointerEvents="none" style={styles.overlay}>
      {configs.map((cfg, i) => (
        <Animated.Text
          key={i}
          style={{
            position: "absolute",
            bottom: 0,
            left: `${cfg.left}%`,
            fontSize: cfg.size,
            opacity: anims[i].interpolate({
              inputRange: [0, 0.7, 1],
              outputRange: [1, 1, 0],
            }),
            transform: [
              {
                translateY: anims[i].interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -320],
                }),
              },
              {
                translateX: anims[i].interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, cfg.drift],
                }),
              },
            ],
          }}
        >
          {cfg.emoji}
        </Animated.Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
});
