import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useI18n } from "../state/LanguageContext";
import { useTheme } from "../state/ThemeContext";
import { fonts, spacing } from "../theme";

export function LoadingView({ message }: { message?: string }) {
  const { t } = useI18n();
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.text, { color: colors.textMuted, fontFamily: fonts.body }]}>
        {message ?? t("loading")}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  text: {
    fontSize: 15,
  },
});
