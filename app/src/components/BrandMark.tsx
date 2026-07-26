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
            backgroundColor: light ? "rgba(255,255,255,0.14)" : colors.primary,
            width: hero ? 88 : 56,
            height: hero ? 88 : 56,
            borderRadius: hero ? 28 : 18,
          },
        ]}
      >
        <IconQuestPin
          size={hero ? 54 : 36}
          color={colors.textOnPrimary}
          secondary={colors.accent}
        />
      </View>
      <Text
        style={[
          styles.name,
          {
            color: fg,
            fontSize: hero ? 34 : 22,
            fontFamily: fonts.display,
          },
        ]}
      >
        {t("appName")}
      </Text>
      {hero ? (
        <Text style={[styles.tagline, { color: muted, fontFamily: fonts.body }]}>
          {t("tagline")}
        </Text>
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
    letterSpacing: 0.3,
  },
  tagline: {
    fontSize: 15,
    textAlign: "center",
    paddingHorizontal: spacing.xl,
  },
});
