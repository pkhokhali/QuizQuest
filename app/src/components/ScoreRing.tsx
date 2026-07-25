import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";

interface ScoreRingProps {
  score: number;
  total: number;
  size?: number;
}

/** Big friendly score circle (styled ring, no SVG dependency). */
export function ScoreRing({ score, total, size = 140 }: ScoreRingProps) {
  const good = total > 0 && score / total >= 0.5;
  return (
    <View
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: good ? colors.green : colors.accent,
        },
      ]}
    >
      <Text style={styles.score}>
        {score}
        <Text style={styles.total}>/{total}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    borderWidth: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card,
  },
  score: {
    fontSize: 40,
    fontWeight: "800",
    color: colors.text,
  },
  total: {
    fontSize: 22,
    color: colors.textMuted,
    fontWeight: "700",
  },
});
