import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useI18n } from "../state/LanguageContext";
import { useTheme } from "../state/ThemeContext";
import { fonts, spacing } from "../theme";
import { IconQuestPin } from "./QuestIcons";

type Props = {
  size?: "hero" | "compact";
  light?: boolean;
};

export function BrandMark({ size = "hero", light = false }: Props) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const hero = size === "hero";
  const fg = light ? colors.textOnPrimary : colors.text;
  const muted = light ? "rgba(255,255,255,0.85)" : colors.textMuted;

  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.badge,
          {
            backgroundColor: light ? "rgba(255,255,255,0.18)" : colors.primary,
            borderColor: light ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.15)",
            borderWidth: 1.5,
            width: hero ? 84 : 52,
            height: hero ? 84 : 52,
            borderRadius: hero ? 26 : 16,
            shadowColor: colors.primary,
            shadowOpacity: 0.4,
            shadowRadius: 14,
            shadowOffset: { width: 0, height: 6 },
            elevation: 8,
          },
        ]}
      >
        <IconQuestPin
          size={hero ? 48 : 32}
          color={colors.textOnPrimary}
          secondary={colors.accent}
        />
      </View>
      <Text
        style={[
          styles.name,
          {
            color: fg,
            fontSize: hero ? 32 : 22,
            fontFamily: fonts.display,
          },
        ]}
      >
        {t("appName")}
      </Text>
      {hero ? (
        <View
          style={[
            styles.taglinePill,
            {
              backgroundColor: light ? "rgba(0,0,0,0.15)" : colors.card,
              borderColor: light ? "rgba(255,255,255,0.2)" : colors.border,
            },
          ]}
        >
          <Text style={[styles.tagline, { color: muted, fontFamily: fonts.bodyBold }]}>
            ✨ {t("tagline")}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    gap: spacing.sm,
  },
  badge: {
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    letterSpacing: 0.4,
  },
  taglinePill: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md + 2,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 2,
  },
  tagline: {
    fontSize: 13,
    textAlign: "center",
  },
});
