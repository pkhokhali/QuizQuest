import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewStyle,
} from "react-native";
import { colors, radius, spacing } from "../theme";

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  variant?: "primary" | "accent" | "ghost";
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
  const bg =
    variant === "primary"
      ? colors.primary
      : variant === "accent"
      ? colors.accent
      : "transparent";
  const fg = variant === "ghost" ? colors.primary : colors.textOnPrimary;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: bg },
        variant === "ghost" && styles.ghost,
        (disabled || loading) && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Text style={[styles.label, { color: fg }]}>{label}</Text>
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
  },
  ghost: {
    borderWidth: 2,
    borderColor: colors.primarySoft,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: 17,
    fontWeight: "700",
  },
});
