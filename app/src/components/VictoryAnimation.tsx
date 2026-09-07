import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View, Text } from "react-native";
import { useTheme } from "../state/ThemeContext";
import { fonts, type } from "../theme";

interface VictoryAnimationProps {
  visible: boolean;
  onAnimationComplete?: () => void;
  message?: string;
}

export function VictoryAnimation({
  visible,
  onAnimationComplete,
  message = "VICTORY!",
}: VictoryAnimationProps) {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1.2,
            duration: 600,
            easing: Easing.elastic(1.5),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(rotate, {
            toValue: 1,
            duration: 800,
            easing: Easing.out(Easing.back(2)),
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(scale, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (onAnimationComplete) {
          setTimeout(onAnimationComplete, 1500); // hold for a bit
        }
      });
    } else {
      scale.setValue(0);
      opacity.setValue(0);
      rotate.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["-15deg", "0deg"],
  });

  return (
    <View style={[StyleSheet.absoluteFill, styles.overlay]}>
      <Animated.View
        style={[
          styles.container,
          {
            backgroundColor: colors.card,
            borderColor: colors.accent,
            opacity: opacity,
            transform: [{ scale }, { rotate: spin }],
          },
        ]}
      >
        <Text style={[styles.text, { color: colors.accent }]}>✨</Text>
        <Text style={[styles.text, { color: colors.text, marginTop: 16 }]}>
          {message}
        </Text>
        <Text style={[styles.subtext, { color: colors.textMuted }]}>
          Insanely great job.
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    zIndex: 1000,
  },
  container: {
    padding: 40,
    borderRadius: 30,
    borderWidth: 4,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 20,
  },
  text: {
    fontFamily: fonts.display,
    fontSize: type.hero,
    textAlign: "center",
    textTransform: "uppercase",
  },
  subtext: {
    fontFamily: fonts.body,
    fontSize: type.body,
    marginTop: 8,
    textAlign: "center",
  },
});
