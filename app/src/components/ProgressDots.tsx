import React from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../state/ThemeContext";
import { spacing } from "../theme";

interface ProgressDotsProps {
  count: number;
  current: number;
}

export function ProgressDots({ count, current }: ProgressDotsProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            {
              backgroundColor: i === current ? colors.primary : colors.primarySoft,
              width: i === current ? 24 : 10,
            },
          ]}
        />
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
    height: 10,
    borderRadius: 5,
  },
});
