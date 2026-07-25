import React from "react";
import { StyleSheet, View } from "react-native";
import { colors, spacing } from "../theme";

interface ProgressDotsProps {
  count: number;
  current: number;
}

export function ProgressDots({ count, current }: ProgressDotsProps) {
  return (
    <View style={styles.row}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={[styles.dot, i === current && styles.active]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primarySoft,
  },
  active: {
    backgroundColor: colors.primary,
    width: 24,
  },
});
