import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useI18n } from "../state/LanguageContext";
import { useTheme } from "../state/ThemeContext";
import { fonts, spacing } from "../theme";
import { Card } from "./Card";
import { PrimaryButton } from "./PrimaryButton";

interface ErrorCardProps {
  onRetry: () => void;
  message?: string;
}

/** Friendly retry card — never shows raw error text to students. */
export function ErrorCard({ onRetry, message }: ErrorCardProps) {
  const { t } = useI18n();
  const { colors } = useTheme();
  return (
    <View style={[styles.wrapper, { backgroundColor: colors.bg }]}>
      <Card style={styles.card}>
        <Text style={styles.emoji}>🙈</Text>
        <Text
          style={[styles.text, { color: colors.text, fontFamily: fonts.body }]}
        >
          {message ?? t("errorFriendly")}
        </Text>
        <PrimaryButton label={t("retry")} onPress={onRetry} />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.xl,
  },
  card: {
    alignItems: "center",
    gap: spacing.lg,
    padding: spacing.xl,
  },
  emoji: {
    fontSize: 48,
  },
  text: {
    fontSize: 16,
    textAlign: "center",
  },
});
