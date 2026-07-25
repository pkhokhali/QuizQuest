import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, radius, spacing } from "../theme";

export type OptionState = "default" | "selected" | "correct" | "missed" | "dimmed";

interface OptionButtonProps {
  label: string;
  index: number;
  state?: OptionState;
  onPress?: () => void;
  disabled?: boolean;
}

const LETTERS = ["A", "B", "C", "D"];

/**
 * Quiz option. Never flashes red on wrong answers — a missed pick gets a
 * soft amber highlight, correct answers celebrate in green.
 */
export function OptionButton({
  label,
  index,
  state = "default",
  onPress,
  disabled,
}: OptionButtonProps) {
  const palette = getPalette(state);

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: palette.bg, borderColor: palette.border },
        state === "dimmed" && styles.dimmed,
      ]}
      onPress={onPress}
      disabled={disabled || !onPress}
      activeOpacity={0.75}
    >
      <View style={[styles.letter, { backgroundColor: palette.letterBg }]}>
        <Text style={[styles.letterText, { color: palette.letterFg }]}>
          {LETTERS[index] ?? "?"}
        </Text>
      </View>
      <Text style={[styles.label, { color: palette.fg }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function getPalette(state: OptionState) {
  switch (state) {
    case "selected":
      return {
        bg: colors.primarySoft,
        border: colors.primary,
        fg: colors.primaryDark,
        letterBg: colors.primary,
        letterFg: colors.textOnPrimary,
      };
    case "correct":
      return {
        bg: colors.greenSoft,
        border: colors.green,
        fg: colors.text,
        letterBg: colors.green,
        letterFg: colors.textOnPrimary,
      };
    case "missed":
      return {
        bg: colors.amberSoft,
        border: colors.amber,
        fg: colors.text,
        letterBg: colors.amber,
        letterFg: colors.textOnPrimary,
      };
    default:
      return {
        bg: colors.card,
        border: colors.border,
        fg: colors.text,
        letterBg: colors.primarySoft,
        letterFg: colors.primary,
      };
  }
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.chip,
    borderWidth: 2,
    padding: spacing.md,
    gap: spacing.md,
    minHeight: 60,
  },
  dimmed: {
    opacity: 0.45,
  },
  letter: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  letterText: {
    fontWeight: "800",
    fontSize: 15,
  },
  label: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
  },
});
