import React, { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { updateMe } from "../api/client";
import { Language, QuizTime, Subject } from "../api/types";
import { Chip } from "../components/Chip";
import { Atmosphere } from "../components/Atmosphere";
import { PrimaryButton } from "../components/PrimaryButton";
import { ProgressDots } from "../components/ProgressDots";
import { EXTRA_COUNTRIES, HOME_COUNTRY, SUBJECTS } from "../constants";
import { useAuth } from "../state/AuthContext";
import { useI18n } from "../state/LanguageContext";
import { useTheme } from "../state/ThemeContext";
import { radius, shadow, spacing, ColorTokens } from "../theme";

const TOTAL_STEPS = 5;

export function OnboardingScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { t, lang, setLang } = useI18n();
  const { user, setUser } = useAuth();

  const [step, setStep] = useState(0);
  const [name, setName] = useState(user?.name ?? "");
  const [grade, setGrade] = useState<number | null>(user?.grade ?? null);
  const [extraCountries, setExtraCountries] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [quizTime, setQuizTime] = useState<QuizTime | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  const toggleExtraCountry = (code: string) => {
    setExtraCountries((prev) =>
      prev.includes(code)
        ? prev.filter((c) => c !== code)
        : prev.length < 2
        ? [...prev, code]
        : prev
    );
  };

  const toggleSubject = (code: Subject) => {
    setSubjects((prev) =>
      prev.includes(code) ? prev.filter((s) => s !== code) : [...prev, code]
    );
  };

  const canContinue = () => {
    switch (step) {
      case 0:
        return name.trim().length > 0;
      case 1:
        return grade !== null;
      case 2:
        return true; // extra countries optional
      case 3:
        return subjects.length > 0;
      case 4:
        return quizTime !== null;
      default:
        return false;
    }
  };

  const onNext = async () => {
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
      return;
    }
    // Finish: save everything. grade + homeCountry marks onboarded on server.
    setError(false);
    setSaving(true);
    try {
      const { user: updated } = await updateMe({
        name: name.trim(),
        language: lang,
        grade: grade ?? undefined,
        homeCountry: HOME_COUNTRY.code,
        extraCountries,
        subjects,
        quizTime: quizTime ?? undefined,
      });
      setUser(updated); // Navigation switches to tabs via onboarded flag.
    } catch {
      setError(true);
      setSaving(false);
    }
  };

  return (
    <Atmosphere>
      <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        {step > 0 ? (
          <TouchableOpacity onPress={() => setStep(step - 1)} style={styles.back}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.back} />
        )}
        <ProgressDots count={TOTAL_STEPS} current={step} />
        <View style={styles.back} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {step === 0 && (
          <View style={styles.step}>
            <Text style={styles.stepEmoji}>👋</Text>
            <Text style={styles.title}>{t("obNameTitle")}</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder={t("obNamePlaceholder")}
              placeholderTextColor={colors.textMuted}
              maxLength={30}
            />
            <Text style={styles.title2}>{t("obLanguageTitle")}</Text>
            <View style={styles.row}>
              {(["en", "ne"] as Language[]).map((l) => (
                <Chip
                  key={l}
                  label={l === "en" ? "English" : "नेपाली"}
                  selected={lang === l}
                  onPress={() => setLang(l)}
                  style={styles.flexChip}
                />
              ))}
            </View>
          </View>
        )}

        {step === 1 && (
          <View style={styles.step}>
            <Text style={styles.stepEmoji}>🎓</Text>
            <Text style={styles.title}>{t("obGradeTitle")}</Text>
            <View style={styles.gradeGrid}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.gradeChip, grade === g && styles.gradeChipSelected]}
                  onPress={() => setGrade(g)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.gradeNum,
                      grade === g && styles.gradeNumSelected,
                    ]}
                  >
                    {g}
                  </Text>
                  {g === 10 && <Text style={styles.gradeNote}>{t("obGradeSee")}</Text>}
                  {(g === 11 || g === 12) && (
                    <Text style={styles.gradeNote}>{t("obGradeNeb")}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={styles.step}>
            <Text style={styles.stepEmoji}>🌍</Text>
            <Text style={styles.title}>{t("obCountryTitle")}</Text>
            <View style={styles.homeCountryCard}>
              <Text style={styles.homeFlag}>{HOME_COUNTRY.flag}</Text>
              <View>
                <Text style={styles.homeCountryName}>{t(HOME_COUNTRY.labelKey)}</Text>
                <Text style={styles.homeCountryTag}>{t("obCountryHome")}</Text>
              </View>
            </View>
            <Text style={styles.title2}>{t("obExtraTitle")}</Text>
            <Text style={styles.note}>{t("obExtraNote")}</Text>
            <View style={styles.countryGrid}>
              {EXTRA_COUNTRIES.map((c) => {
                const selected = extraCountries.includes(c.code);
                return (
                  <TouchableOpacity
                    key={c.code}
                    style={[styles.countryCard, selected && styles.countryCardSelected]}
                    onPress={() => toggleExtraCountry(c.code)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.countryFlag}>{c.flag}</Text>
                    <Text
                      style={[
                        styles.countryName,
                        selected && styles.countryNameSelected,
                      ]}
                    >
                      {t(c.labelKey)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={styles.step}>
            <Text style={styles.stepEmoji}>💜</Text>
            <Text style={styles.title}>{t("obSubjectsTitle")}</Text>
            <Text style={styles.note}>{t("obSubjectsNote")}</Text>
            <View style={styles.chipWrap}>
              {SUBJECTS.map((s) => (
                <Chip
                  key={s.code}
                  label={`${s.emoji} ${t(s.labelKey)}`}
                  selected={subjects.includes(s.code)}
                  onPress={() => toggleSubject(s.code)}
                />
              ))}
            </View>
          </View>
        )}

        {step === 4 && (
          <View style={styles.step}>
            <Text style={styles.stepEmoji}>⏰</Text>
            <Text style={styles.title}>{t("obTimeTitle")}</Text>
            <View style={styles.timeList}>
              {(
                [
                  { value: "morning", emoji: "🌅", labelKey: "obTimeMorning" },
                  { value: "afterschool", emoji: "🎒", labelKey: "obTimeAfterSchool" },
                  { value: "evening", emoji: "🌙", labelKey: "obTimeEvening" },
                ] as const
              ).map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.timeCard,
                    quizTime === opt.value && styles.timeCardSelected,
                  ]}
                  onPress={() => setQuizTime(opt.value)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.timeEmoji}>{opt.emoji}</Text>
                  <Text
                    style={[
                      styles.timeLabel,
                      quizTime === opt.value && styles.timeLabelSelected,
                    ]}
                  >
                    {t(opt.labelKey)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {error ? <Text style={styles.error}>{t("errorFriendly")}</Text> : null}
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          label={step === TOTAL_STEPS - 1 ? t("obFinish") : t("next")}
          onPress={onNext}
          disabled={!canContinue()}
          loading={saving}
        />
      </View>
    </SafeAreaView>
    </Atmosphere>
  );
}

function createStyles(colors: ColorTokens) {
  return StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  back: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  backText: {
    fontSize: 24,
    color: colors.primary,
    fontWeight: "700",
  },
  content: {
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  step: {
    gap: spacing.md,
  },
  stepEmoji: {
    fontSize: 48,
    textAlign: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
  },
  title2: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginTop: spacing.lg,
  },
  note: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: "600",
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: radius.chip,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.lg,
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
  },
  row: {
    flexDirection: "row",
    gap: spacing.md,
  },
  flexChip: {
    flex: 1,
    alignItems: "center",
  },
  gradeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    justifyContent: "center",
  },
  gradeChip: {
    width: 76,
    height: 76,
    borderRadius: radius.chip,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.card,
  },
  gradeChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  gradeNum: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.text,
  },
  gradeNumSelected: {
    color: colors.textOnPrimary,
  },
  gradeNote: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.accent,
    marginTop: 2,
  },
  homeCountryCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.card,
    borderWidth: 2,
    borderColor: colors.primary,
    padding: spacing.lg,
  },
  homeFlag: {
    fontSize: 44,
  },
  homeCountryName: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.primaryDark,
  },
  homeCountryTag: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },
  countryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  countryCard: {
    width: "30%",
    flexGrow: 1,
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.chip,
    borderWidth: 2,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    gap: spacing.xs,
  },
  countryCardSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  countryFlag: {
    fontSize: 34,
  },
  countryName: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  countryNameSelected: {
    color: colors.primaryDark,
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  timeList: {
    gap: spacing.md,
  },
  timeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  timeCardSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  timeEmoji: {
    fontSize: 32,
  },
  timeLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  timeLabelSelected: {
    color: colors.primaryDark,
  },
  error: {
    color: colors.accent,
    fontWeight: "600",
    textAlign: "center",
    marginTop: spacing.lg,
  },
  footer: {
    padding: spacing.xl,
    paddingTop: spacing.sm,
  },
});
}

