import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewStyle,
} from "react-native";
import { useTheme } from "../state/ThemeContext";
import { fonts, radius, spacing } from "../theme";

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  variant?: "primary" | "accent" | "ghost" | "danger";
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export function PrimaryButton({
  label,
  onPress,
  variant = "primary",
  disabled,
  loading,
  style,
}: PrimaryButtonProps) {
  const { colors } = useTheme();

  const bg =
    variant === "primary"
      ? colors.primary
      : variant === "accent"
        ? colors.accent
        : variant === "danger"
          ? colors.dangerSoft
          : "transparent";
  const fg =
    variant === "ghost"
      ? colors.primary
      : variant === "danger"
        ? colors.danger
        : colors.textOnPrimary;
  const border =
    variant === "ghost"
      ? colors.border
      : variant === "danger"
        ? colors.danger
        : "transparent";

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: bg, borderColor: border },
        (variant === "ghost" || variant === "danger") && styles.outlined,
        (disabled || loading) && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: Boolean(disabled || loading), busy: Boolean(loading) }}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Text style={[styles.label, { color: fg, fontFamily: fonts.bodyBold }]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.button,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 56,
    borderWidth: 0,
  },
  outlined: {
    borderWidth: 2,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: 17,
  },
});
