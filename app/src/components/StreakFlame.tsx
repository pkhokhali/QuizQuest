import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../state/ThemeContext";
import { fonts } from "../theme";
import { IconFlame } from "./QuestIcons";

interface StreakFlameProps {
  count: number;
  size?: number;
  /** Count label color — defaults to white for use on the primary card. */
  countColor?: string;
}

/** The hero streak flame — gently pulses to feel alive. */
export function StreakFlame({ count, size = 64, countColor = "#FFFFFF" }: StreakFlameProps) {
  const { colors } = useTheme();
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
    <View
      style={styles.container}
      accessibilityRole="text"
      accessibilityLabel={`${count} day streak`}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <IconFlame size={size} color={colors.accent} secondary={colors.amber} />
      </Animated.View>
      <Text
        style={[
          styles.count,
          { fontSize: size * 0.55, color: countColor, fontFamily: fonts.display },
        ]}
      >
        {count}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  count: {
    marginLeft: 4,
  },
});
