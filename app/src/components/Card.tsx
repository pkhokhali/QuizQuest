import React from "react";
import { StyleSheet, View, ViewProps } from "react-native";
import { colors, radius, shadow, spacing } from "../theme";

interface CardProps extends ViewProps {
  color?: string;
}

export function Card({ color, style, children, ...rest }: CardProps) {
  return (
    <View
      style={[styles.card, color ? { backgroundColor: color } : null, style]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: spacing.lg,
    ...shadow.card,
  },
});
