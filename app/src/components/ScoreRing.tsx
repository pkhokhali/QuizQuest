import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../state/ThemeContext";
import { fonts } from "../theme";

interface ScoreRingProps {
  score: number;
  total: number;
  size?: number;
}

/** Big friendly score circle. */
export function ScoreRing({ score, total, size = 140 }: ScoreRingProps) {
  const { colors } = useTheme();
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
          backgroundColor: colors.card,
        },
      ]}
    >
      <Text style={[styles.score, { color: colors.text, fontFamily: fonts.display }]}>
        {score}
        <Text
          style={[styles.total, { color: colors.textMuted, fontFamily: fonts.bodyBold }]}
        >
          /{total}
        </Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    borderWidth: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  score: {
    fontSize: 40,
  },
  total: {
    fontSize: 22,
  },
});
