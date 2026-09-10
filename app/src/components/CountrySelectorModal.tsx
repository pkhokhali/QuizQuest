import React, { useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { updateMe } from "../api/client";
import { ALL_COUNTRIES, countrySyllabus } from "../constants";
import { useAuth } from "../state/AuthContext";
import { useI18n } from "../state/LanguageContext";
import { useTheme } from "../state/ThemeContext";
import { fonts, radius, shadow, spacing } from "../theme";

interface CountrySelectorModalProps {
  visible: boolean;
  onClose: () => void;
  onCountryChanged?: (newCountry: string) => void;
}

export function CountrySelectorModal({
  visible,
  onClose,
  onCountryChanged,
}: CountrySelectorModalProps) {
  const { colors } = useTheme();
  const { t, lang } = useI18n();
  const { user, setUser } = useAuth();
  const [savingCode, setSavingCode] = useState<string | null>(null);

  const currentCountry = user?.homeCountry || "nepal";

  const handleSelectCountry = async (code: string) => {
    if (code === currentCountry) {
      onClose();
      return;
    }

    setSavingCode(code);
    try {
      const { user: updated } = await updateMe({
        homeCountry: code,
      });
      setUser(updated);
      onCountryChanged?.(code);
      onClose();
    } catch (err) {
      console.error("Failed to update country:", err);
    } finally {
      setSavingCode(null);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: colors.surfaceElevated,
              borderColor: colors.border,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text
                style={[
                  styles.title,
                  { color: colors.text, fontFamily: fonts.display },
                ]}
              >
                {lang === "ne" ? "पाठ्यक्रम देश छान्नुहोस्" : "Select Country Syllabus"}
              </Text>
              <Text
                style={[
                  styles.subtitle,
                  { color: colors.textMuted, fontFamily: fonts.body },
                ]}
              >
                {lang === "ne"
                  ? "तपाईंको विद्यालयको पाठ्यक्रम अनुसार प्रश्नहरू प्राप्त गर्नुहोस्"
                  : "Questions & daily quests will adapt to this school curriculum"}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: colors.surface }]}
            >
              <Text style={[styles.closeText, { color: colors.text }]}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Country List */}
          <ScrollView
            style={styles.scrollList}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {ALL_COUNTRIES.map((country) => {
              const isSelected = country.code === currentCountry;
              const isSaving = savingCode === country.code;
              const countryName = t(country.labelKey as any);
              const syllabus = countrySyllabus(country.code, lang);

              return (
                <TouchableOpacity
                  key={country.code}
                  activeOpacity={0.8}
                  disabled={isSaving}
                  style={[
                    styles.countryCard,
                    {
                      backgroundColor: isSelected ? colors.primarySoft : colors.surface,
                      borderColor: isSelected ? colors.primary : colors.border,
                      borderWidth: isSelected ? 2 : 1,
                    },
                  ]}
                  onPress={() => handleSelectCountry(country.code)}
                >
                  <Text style={styles.flagEmoji}>{country.flag}</Text>
                  <View style={styles.countryInfo}>
                    <View style={styles.nameRow}>
                      <Text
                        style={[
                          styles.countryName,
                          {
                            color: isSelected ? colors.primary : colors.text,
                            fontFamily: fonts.bodyBold,
                          },
                        ]}
                      >
                        {countryName}
                      </Text>
                      {isSelected && (
                        <View
                          style={[
                            styles.activeBadge,
                            { backgroundColor: colors.primary },
                          ]}
                        >
                          <Text
                            style={[
                              styles.activeText,
                              {
                                color: colors.textOnPrimary,
                                fontFamily: fonts.bodyBold,
                              },
                            ]}
                          >
                            ✓ {lang === "ne" ? "सक्रिय" : "ACTIVE"}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text
                      style={[
                        styles.syllabusText,
                        {
                          color: isSelected ? colors.primaryDark : colors.textMuted,
                          fontFamily: fonts.body,
                        },
                      ]}
                    >
                      {syllabus}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Footer note */}
          <View style={styles.footer}>
            <Text
              style={[
                styles.footerNote,
                { color: colors.textMuted, fontFamily: fonts.body },
              ]}
            >
              💡 {lang === "ne"
                ? "तपाईंले जुनसुकै बेला देश परिवर्तन गर्न सक्नुहुन्छ।"
                : "You can switch syllabus anytime without losing your XP or streak."}
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(10, 5, 30, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  container: {
    width: "100%",
    maxWidth: 420,
    maxHeight: "85%",
    borderRadius: radius.card,
    borderWidth: 1.5,
    padding: spacing.lg,
    ...shadow.card,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 20,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
    maxWidth: 300,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  closeText: {
    fontSize: 14,
    fontWeight: "700",
  },
  scrollList: {
    marginVertical: spacing.xs,
  },
  scrollContent: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  countryCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: radius.small,
    gap: spacing.md,
  },
  flagEmoji: {
    fontSize: 32,
  },
  countryInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  countryName: {
    fontSize: 16,
  },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activeText: {
    fontSize: 9,
    letterSpacing: 0.5,
  },
  syllabusText: {
    fontSize: 12,
    marginTop: 2,
  },
  footer: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    alignItems: "center",
  },
  footerNote: {
    fontSize: 11,
    textAlign: "center",
  },
});
