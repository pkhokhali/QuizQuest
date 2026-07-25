import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useI18n } from "../state/LanguageContext";
import { colors, spacing } from "../theme";
import { Card } from "./Card";
import { PrimaryButton } from "./PrimaryButton";

interface ErrorCardProps {
  onRetry: () => void;
  message?: string;
}

/** Friendly retry card — never shows raw error text to students. */
export function ErrorCard({ onRetry, message }: ErrorCardProps) {
  const { t } = useI18n();
  return (
    <View style={styles.wrapper}>
      <Card style={styles.card}>
        <Text style={styles.emoji}>🙈</Text>
        <Text style={styles.text}>{message ?? t("errorFriendly")}</Text>
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
    backgroundColor: colors.bg,
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
    fontWeight: "600",
    color: colors.text,
    textAlign: "center",
  },
});
