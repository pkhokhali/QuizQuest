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
import { Language } from "../api/types";
import { SUPPORTED_LANGUAGES } from "../i18n";
import { useAuth } from "../state/AuthContext";
import { useI18n } from "../state/LanguageContext";
import { useTheme } from "../state/ThemeContext";
import { fonts, radius, shadow, spacing } from "../theme";
import { Haptics } from "../utils/haptics";

interface LanguageSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  onLanguageChanged?: (newLang: Language) => void;
}

export function LanguageSelectorModal({
  visible,
  onClose,
  onLanguageChanged,
}: LanguageSelectorModalProps) {
  const { colors } = useTheme();
  const { t, lang, setLang } = useI18n();
  const { user, setUser } = useAuth();
  const [savingCode, setSavingCode] = useState<Language | null>(null);

  const handleSelectLanguage = async (code: Language) => {
    Haptics.tap();
    if (code === lang) {
      onClose();
      return;
    }

    setSavingCode(code);
    setLang(code);
    onLanguageChanged?.(code);

    if (user) {
      try {
        const { user: updated } = await updateMe({
          language: code,
        });
        setUser(updated);
      } catch (err) {
        // Non-fatal, local storage already updated
      }
    }

    setSavingCode(null);
    onClose();
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
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.title,
                  { color: colors.text, fontFamily: fonts.display },
                ]}
              >
                🌐 {t("selectLanguage")}
              </Text>
              <Text
                style={[
                  styles.subtitle,
                  { color: colors.textMuted, fontFamily: fonts.body },
                ]}
              >
                {t("selectLanguageSubtitle")}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                Haptics.tap();
                onClose();
              }}
              style={[
                styles.closeButton,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={[styles.closeIcon, { color: colors.textMuted }]}>
                ✕
              </Text>
            </TouchableOpacity>
          </View>

          {/* Languages List */}
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {SUPPORTED_LANGUAGES.map((item) => {
              const isSelected = item.code === lang;
              const isSaving = savingCode === item.code;

              return (
                <TouchableOpacity
                  key={item.code}
                  style={[
                    styles.langCard,
                    {
                      backgroundColor: isSelected
                        ? colors.primarySoft
                        : colors.card,
                      borderColor: isSelected
                        ? colors.primary
                        : colors.border,
                    },
                  ]}
                  onPress={() => handleSelectLanguage(item.code)}
                  activeOpacity={0.7}
                  disabled={isSaving}
                >
                  <Text style={styles.flag}>{item.flag}</Text>
                  <View style={styles.langInfo}>
                    <Text
                      style={[
                        styles.nativeLabel,
                        {
                          color: isSelected ? colors.primary : colors.text,
                          fontFamily: fonts.bodyBold,
                        },
                      ]}
                    >
                      {item.nativeLabel}
                    </Text>
                    <Text
                      style={[
                        styles.englishLabel,
                        {
                          color: colors.textMuted,
                          fontFamily: fonts.body,
                        },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </View>

                  {isSelected && (
                    <View
                      style={[
                        styles.checkBadge,
                        { backgroundColor: colors.primary },
                      ]}
                    >
                      <Text style={styles.checkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  container: {
    width: "100%",
    maxWidth: 420,
    maxHeight: "82%",
    borderRadius: radius.card,
    borderWidth: 1.5,
    overflow: "hidden",
    ...shadow.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  title: {
    fontSize: 20,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: spacing.sm,
  },
  closeIcon: {
    fontSize: 14,
    fontWeight: "bold",
  },
  list: {
    paddingHorizontal: spacing.lg,
  },
  listContent: {
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  langCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
  },
  flag: {
    fontSize: 28,
    marginRight: spacing.md,
  },
  langInfo: {
    flex: 1,
  },
  nativeLabel: {
    fontSize: 16,
  },
  englishLabel: {
    fontSize: 12,
    marginTop: 1,
  },
  checkBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },
  checkText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
});
