import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { useTheme } from "../state/ThemeContext";

interface XpBarProps {
  /** 0..1 */
  progress: number;
  color?: string;
  trackColor?: string;
  height?: number;
  style?: ViewStyle;
}

export function XpBar({
  progress,
  color,
  trackColor = "rgba(255,255,255,0.3)",
  height = 10,
  style,
}: XpBarProps) {
  const { colors } = useTheme();
  const fill = color ?? colors.accent;
  const clamped = Math.max(0, Math.min(1, progress));
  return (
    <View
      style={[
        styles.track,
        { height, borderRadius: height / 2, backgroundColor: trackColor },
        style,
      ]}
    >
      <View
        style={[
          styles.fill,
          {
            width: `${clamped * 100}%`,
            borderRadius: height / 2,
            backgroundColor: fill,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    overflow: "hidden",
    width: "100%",
  },
  fill: {
    height: "100%",
  },
});
