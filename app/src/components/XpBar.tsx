import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { colors } from "../theme";

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
  color = colors.accent,
  trackColor = "rgba(255,255,255,0.3)",
  height = 10,
  style,
}: XpBarProps) {
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
            backgroundColor: color,
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
