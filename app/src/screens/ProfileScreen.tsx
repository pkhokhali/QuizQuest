import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { updateMe } from "../api/client";
import { Language, Subject } from "../api/types";
import { AvatarCircle } from "../components/AvatarCircle";
import { Card } from "../components/Card";
import { Chip } from "../components/Chip";
import { PrimaryButton } from "../components/PrimaryButton";
import { AVATAR_BGS, AVATAR_EMOJIS, EXTRA_COUNTRIES, SUBJECTS } from "../constants";
import { useAuth } from "../state/AuthContext";
import { useI18n } from "../state/LanguageContext";
import { colors, radius, spacing } from "../theme";

export function ProfileScreen() {
  const { t, lang, setLang } = useI18n();
  const { user, setUser, signOut } = useAuth();

  const [name, setName] = useState(user?.name ?? "");
  const [grade, setGrade] = useState<number | null>(user?.grade ?? null);
  const [extraCountries, setExtraCountries] = useState<string[]>(
    user?.extraCountries ?? []
  );
  const [subjects, setSubjects] = useState<Subject[]>(user?.subjects ?? []);
  const [emoji, setEmoji] = useState(user?.avatar.emoji ?? "🦊");
  const [bg, setBg] = useState(user?.avatar.bg ?? colors.primary);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [failed, setFailed] = useState(false);

  if (!user) return null;

  const dirty =
    name !== user.name ||
    grade !== user.grade ||
    emoji !== user.avatar.emoji ||
    bg !== user.avatar.bg ||
    JSON.stringify(extraCountries) !== JSON.stringify(user.extraCountries) ||
    JSON.stringify(subjects) !== JSON.stringify(user.subjects);

  const toggleCountry = (code: string) => {
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

  const changeLanguage = async (next: Language) => {
    setLang(next);
    try {
      const { user: updated } = await updateMe({ language: next });
      setUser(updated);
    } catch {
      // Local switch still applied; server sync will happen on next save.
    }
  };

  const onSave = async () => {
    setSaving(true);
    setFailed(false);
    setSaved(false);
    try {
      const { user: updated } = await updateMe({
        name: name.trim() || user.name,
        grade: grade ?? undefined,
        extraCountries,
        subjects,
        avatar: { emoji, bg },
      });
      setUser(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setFailed(true);
    } finally {
      setSaving(false);
    }
  };

  const onLogout = () => {
    Alert.alert(t("profileLogout"), "", [
      { text: t("cancel"), style: "cancel" },
      { text: t("profileLogout"), style: "destructive", onPress: () => signOut() },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t("profileTitle")}</Text>

        {/* Avatar */}
        <View style={styles.avatarBlock}>
          <AvatarCircle avatar={{ emoji, bg }} size={88} />
          <Text style={styles.friendCode}>
            {t("profileFriendCode")}: {user.friendCode}
          </Text>
        </View>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>{t("profileAvatar")}</Text>
          <View style={styles.emojiGrid}>
            {AVATAR_EMOJIS.map((item) => {
              const locked = user.level < item.level;
              const selected = emoji === item.emoji;
              return (
                <TouchableOpacity
                  key={item.emoji}
                  style={[
                    styles.emojiCell,
                    selected && styles.emojiSelected,
                    locked && styles.emojiLocked,
                  ]}
                  onPress={() => !locked && setEmoji(item.emoji)}
                  disabled={locked}
                >
                  <Text style={styles.emojiText}>{item.emoji}</Text>
                  {locked && (
                    <Text style={styles.lockLabel}>
                      {t("profileAvatarLevel", { level: item.level })}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.bgRow}>
            {AVATAR_BGS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.bgSwatch,
                  { backgroundColor: color },
                  bg === color && styles.bgSelected,
                ]}
                onPress={() => setBg(color)}
              />
            ))}
          </View>
        </Card>

        {/* Name + grade */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>{t("profileName")}</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            maxLength={30}
            placeholder={t("obNamePlaceholder")}
            placeholderTextColor={colors.textMuted}
          />
          <Text style={styles.sectionTitle}>{t("profileGrade")}</Text>
          <View style={styles.chipWrap}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
              <Chip
                key={g}
                label={String(g)}
                selected={grade === g}
                onPress={() => setGrade(g)}
              />
            ))}
          </View>
        </Card>

        {/* Countries */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>{t("profileCountries")}</Text>
          <View style={styles.chipWrap}>
            <Chip label={`🇳🇵 ${t("countryNepal")}`} selected disabled />
            {EXTRA_COUNTRIES.map((c) => (
              <Chip
                key={c.code}
                label={`${c.flag} ${t(c.labelKey)}`}
                selected={extraCountries.includes(c.code)}
                onPress={() => toggleCountry(c.code)}
              />
            ))}
          </View>
        </Card>

        {/* Subjects */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>{t("profileSubjects")}</Text>
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
        </Card>

        {/* Language */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>{t("profileLanguage")}</Text>
          <View style={styles.langRow}>
            {(["en", "ne"] as Language[]).map((l) => (
              <Chip
                key={l}
                label={l === "en" ? "English" : "नेपाली"}
                selected={lang === l}
                onPress={() => changeLanguage(l)}
                style={styles.langChip}
              />
            ))}
          </View>
        </Card>

        {/* Best streak */}
        <Card style={styles.streakCard}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <View>
            <Text style={styles.streakLabel}>{t("profileBestStreak")}</Text>
            <Text style={styles.streakValue}>
              {t("profileStreakDays", { days: user.bestStreak })}
            </Text>
          </View>
        </Card>

        {failed ? <Text style={styles.error}>{t("errorFriendly")}</Text> : null}
        {saved ? <Text style={styles.savedText}>✓ {t("profileSaved")}</Text> : null}

        {dirty && (
          <PrimaryButton label={t("save")} onPress={onSave} loading={saving} />
        )}

        <PrimaryButton label={t("profileLogout")} onPress={onLogout} variant="ghost" />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.text,
  },
  avatarBlock: {
    alignItems: "center",
    gap: spacing.sm,
  },
  friendCode: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textMuted,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
  },
  note: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted,
  },
  emojiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  emojiCell: {
    width: 64,
    height: 64,
    borderRadius: radius.small,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  emojiSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  emojiLocked: {
    opacity: 0.5,
  },
  emojiText: {
    fontSize: 26,
  },
  lockLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: colors.textMuted,
  },
  bgRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  bgSwatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: "transparent",
  },
  bgSelected: {
    borderColor: colors.text,
  },
  input: {
    backgroundColor: colors.bg,
    borderRadius: radius.chip,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.md,
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  langRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  langChip: {
    flex: 1,
    alignItems: "center",
  },
  streakCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  streakEmoji: {
    fontSize: 36,
  },
  streakLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textMuted,
  },
  streakValue: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
  },
  error: {
    color: colors.accent,
    fontWeight: "600",
    textAlign: "center",
  },
  savedText: {
    color: colors.green,
    fontWeight: "800",
    textAlign: "center",
  },
});
