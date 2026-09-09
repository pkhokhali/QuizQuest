import React, { useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
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
  icon?: React.ReactNode;
}

export function PrimaryButton({
  label,
  onPress,
  variant = "primary",
  disabled,
  loading,
  style,
  icon,
}: PrimaryButtonProps) {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 40,
      bounciness: 4,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 8,
    }).start();
  };

  const bg =
    variant === "primary"
      ? colors.primary
      : variant === "accent"
        ? colors.accent
        : variant === "danger"
          ? colors.danger
          : "transparent";
  const fg =
    variant === "ghost"
      ? colors.primary
      : variant === "danger"
        ? "#FFFFFF"
        : colors.textOnPrimary;
  const border =
    variant === "ghost"
      ? colors.border
      : variant === "danger"
        ? colors.danger
        : "transparent";

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        style={[
          styles.button,
          { backgroundColor: bg, borderColor: border },
          (variant === "ghost" || variant === "danger") && styles.outlined,
          (disabled || loading) && styles.disabled,
          variant === "primary" && {
            shadowColor: colors.primary,
            shadowOpacity: 0.3,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
            elevation: 4,
          },
        ]}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled || loading}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: Boolean(disabled || loading), busy: Boolean(loading) }}
      >
        {loading ? (
          <ActivityIndicator color={fg} size="small" />
        ) : (
          <View style={styles.contentRow}>
            {icon ? <View style={styles.iconWrapper}>{icon}</View> : null}
            <Text style={[styles.label, { color: fg, fontFamily: fonts.bodyBold }]}>
              {label}
            </Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.button,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
    borderWidth: 0,
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  iconWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  outlined: {
    borderWidth: 1.5,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: 16,
    letterSpacing: 0.3,
  },
});
