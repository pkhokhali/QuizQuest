import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useI18n } from "../state/LanguageContext";
import { colors, spacing } from "../theme";

export function LoadingView({ message }: { message?: string }) {
  const { t } = useI18n();
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.text}>{message ?? t("loading")}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
    gap: spacing.md,
  },
  text: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: "600",
  },
});
