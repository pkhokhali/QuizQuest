import React from "react";
import { StyleSheet, View, ViewProps } from "react-native";
import { useTheme } from "../state/ThemeContext";
import { radius, shadow, spacing } from "../theme";

interface CardProps extends ViewProps {
  color?: string;
}

export function Card({ color, style, children, ...rest }: CardProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: color ?? colors.card },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.card,
    padding: spacing.lg,
    ...shadow.card,
  },
});
