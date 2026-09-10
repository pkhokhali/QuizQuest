import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  View,
} from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const CONFETTI_COLORS = [
  "#F59E0B", // Gold
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#10B981", // Emerald
  "#3B82F6", // Blue
  "#F43F5E", // Rose
  "#EAB308", // Yellow
  "#06B6D4", // Cyan
  "#A855F7", // Violet
];

interface Particle {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  rotate: Animated.Value;
  scale: Animated.Value;
  opacity: Animated.Value;
  color: string;
  size: number;
  isCircle: boolean;
}

interface ConfettiProps {
  count?: number;
  onFinish?: () => void;
}

export function ConfettiEffect({ count = 50, onFinish }: ConfettiProps) {
  const particles = useRef<Particle[]>(
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: new Animated.Value(SCREEN_WIDTH * 0.5),
      y: new Animated.Value(SCREEN_HEIGHT * 0.25),
      rotate: new Animated.Value(0),
      scale: new Animated.Value(0),
      opacity: new Animated.Value(1),
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size: 9 + (i % 7) * 2,
      isCircle: i % 3 === 0,
    }))
  ).current;

  useEffect(() => {
    const animations = particles.map((p, i) => {
      // Confetti burst: spreads across full width and falls down
      const spreadX = (Math.random() - 0.5) * SCREEN_WIDTH * 1.1;
      const targetX = Math.max(10, Math.min(SCREEN_WIDTH - 20, SCREEN_WIDTH * 0.5 + spreadX));
      const targetY = SCREEN_HEIGHT * 0.35 + Math.random() * (SCREEN_HEIGHT * 0.6);
      const duration = 2200 + (i % 8) * 200;

      return Animated.parallel([
        Animated.sequence([
          Animated.timing(p.scale, {
            toValue: 1.3,
            duration: 180,
            useNativeDriver: true,
          }),
          Animated.timing(p.scale, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(p.x, {
          toValue: targetX,
          duration,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(p.y, {
          toValue: targetY,
          duration,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(p.rotate, {
          toValue: (i % 2 === 0 ? 1 : -1) * (720 + (i % 5) * 360),
          duration,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(duration * 0.65),
          Animated.timing(p.opacity, {
            toValue: 0,
            duration: duration * 0.35,
            useNativeDriver: true,
          }),
        ]),
      ]);
    });

    Animated.parallel(animations).start(() => {
      onFinish?.();
    });
  }, []);

  return (
    <View style={styles.overlay} pointerEvents="none">
      {particles.map((p) => {
        const spin = p.rotate.interpolate({
          inputRange: [-1800, 1800],
          outputRange: ["-1800deg", "1800deg"],
        });

        return (
          <Animated.View
            key={p.id}
            style={[
              styles.particle,
              {
                width: p.size,
                height: p.isCircle ? p.size : p.size * 1.7,
                borderRadius: p.isCircle ? p.size / 2 : 3,
                backgroundColor: p.color,
                opacity: p.opacity,
                transform: [
                  { translateX: p.x },
                  { translateY: p.y },
                  { rotateZ: spin },
                  { scale: p.scale },
                ],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...(StyleSheet.absoluteFill as object),
    zIndex: 99999,
    elevation: 99999,
  },
  particle: {
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 99999,
    elevation: 99999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
});
