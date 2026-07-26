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
import { joinSchool, leaveSchool, updateMe } from "../api/client";
import { Language, Subject } from "../api/types";
import { Atmosphere } from "../components/Atmosphere";
import { AvatarCircle } from "../components/AvatarCircle";
import { Card } from "../components/Card";
import { Chip } from "../components/Chip";
import { PrimaryButton } from "../components/PrimaryButton";
import { IconLogout } from "../components/QuestIcons";
import { AVATAR_BGS, AVATAR_EMOJIS, EXTRA_COUNTRIES, SUBJECTS } from "../constants";
import { useTabScreenPadding } from "../navigation/useTabScreenPadding";
import { useAuth } from "../state/AuthContext";
import { useI18n } from "../state/LanguageContext";
import { useTheme } from "../state/ThemeContext";
import { PALETTES, fonts, radius, spacing } from "../theme";

export function ProfileScreen() {
  const { t, lang, setLang } = useI18n();
  const { user, setUser, signOut } = useAuth();
  const { colors, paletteId, setPaletteId } = useTheme();
  const tabPadding = useTabScreenPadding();

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
  const [schoolCode, setSchoolCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [schoolError, setSchoolError] = useState(false);

  if (!user) return null;

  const onJoinSchool = async () => {
    const code = schoolCode.trim();
    if (!code) return;
    setJoining(true);
    setSchoolError(false);
    try {
      const res = await joinSchool(code);
      setUser(res.user);
      setSchoolCode("");
    } catch {
      setSchoolError(true);
    } finally {
      setJoining(false);
    }
  };

  const onLeaveSchool = async () => {
    try {
      const res = await leaveSchool();
      setUser(res.user);
    } catch {
      setSchoolError(true);
    }
  };

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
    Alert.alert(t("profileLogout"), t("profileLogoutConfirm"), [
      { text: t("cancel"), style: "cancel" },
      { text: t("profileLogout"), style: "destructive", onPress: () => signOut() },
    ]);
  };

  return (
    <Atmosphere>
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: tabPadding }]}>
          <Text
            style={[styles.title, { color: colors.text, fontFamily: fonts.display }]}
          >
            {t("profileTitle")}
          </Text>

          {/* Account hero — logout lives here, always visible */}
          <Card color={colors.primary} style={styles.accountCard}>
            <View style={styles.accountTop}>
              <AvatarCircle avatar={{ emoji, bg }} size={72} />
              <View style={styles.accountMeta}>
                <Text
                  style={[
                    styles.accountLabel,
                    { color: "rgba(255,255,255,0.8)", fontFamily: fonts.body },
                  ]}
                >
                  {t("profileAccount")}
                </Text>
                <Text
                  style={[
                    styles.accountName,
                    { color: colors.textOnPrimary, fontFamily: fonts.display },
                  ]}
                  numberOfLines={1}
                >
                  {user.name}
                </Text>
                <Text
                  style={[
                    styles.friendCode,
                    { color: "rgba(255,255,255,0.9)", fontFamily: fonts.bodyBold },
                  ]}
                >
                  {t("profileFriendCode")}: {user.friendCode}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.logoutBtn, { backgroundColor: "rgba(255,255,255,0.16)" }]}
              onPress={onLogout}
              activeOpacity={0.85}
            >
              <IconLogout size={18} color={colors.textOnPrimary} />
              <Text
                style={[
                  styles.logoutText,
                  { color: colors.textOnPrimary, fontFamily: fonts.bodyBold },
                ]}
              >
                {t("profileLogout")}
              </Text>
            </TouchableOpacity>
          </Card>

          {/* School / class join */}
          <Card style={styles.section}>
            <Text
              style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.bodyBold }]}
            >
              {t("profileSchool")}
            </Text>
            {user.schoolName ? (
              <>
                <View style={[styles.schoolPill, { backgroundColor: colors.greenSoft }]}>
                  <Text
                    style={[
                      styles.schoolPillText,
                      { color: colors.green, fontFamily: fonts.bodyBold },
                    ]}
                  >
                    ✓ {user.schoolName}
                  </Text>
                </View>
                <TouchableOpacity onPress={onLeaveSchool} accessibilityRole="button">
                  <Text
                    style={[
                      styles.schoolLeave,
                      { color: colors.danger, fontFamily: fonts.bodyBold },
                    ]}
                  >
                    {t("profileSchoolLeave")}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text
                  style={[styles.note, { color: colors.textMuted, fontFamily: fonts.body }]}
                >
                  {t("profileSchoolHint")}
                </Text>
                <View style={styles.schoolRow}>
                  <TextInput
                    style={[
                      styles.input,
                      styles.schoolInput,
                      {
                        backgroundColor: colors.bg,
                        borderColor: colors.border,
                        color: colors.text,
                        fontFamily: fonts.bodyBold,
                      },
                    ]}
                    value={schoolCode}
                    onChangeText={(v) => {
                      setSchoolCode(v);
                      setSchoolError(false);
                    }}
                    placeholder={t("profileSchoolPlaceholder")}
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="characters"
                    autoCorrect={false}
                  />
                  <PrimaryButton
                    label={t("profileSchoolJoin")}
                    onPress={onJoinSchool}
                    loading={joining}
                    disabled={!schoolCode.trim() || joining}
                    style={styles.schoolJoinBtn}
                  />
                </View>
                {schoolError ? (
                  <Text
                    style={[styles.error, { color: colors.accent, fontFamily: fonts.body }]}
                  >
                    {t("profileSchoolError")}
                  </Text>
                ) : null}
              </>
            )}
          </Card>

          {/* Theme preference */}
          <Card style={styles.section}>
            <Text
              style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.bodyBold }]}
            >
              {t("profileTheme")}
            </Text>
            <Text
              style={[styles.note, { color: colors.textMuted, fontFamily: fonts.body }]}
            >
              {t("profileThemeHint")}
            </Text>
            <View style={styles.themeGrid}>
              {PALETTES.map((p) => {
                const selected = paletteId === p.id;
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[
                      styles.themeCard,
                      {
                        borderColor: selected ? colors.primary : colors.border,
                        backgroundColor: selected ? colors.primarySoft : colors.bg,
                      },
                    ]}
                    onPress={() => setPaletteId(p.id)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.swatchRow}>
                      {p.swatch.map((c) => (
                        <View
                          key={c}
                          style={[styles.swatch, { backgroundColor: c }]}
                        />
                      ))}
                    </View>
                    <Text
                      style={[
                        styles.themeName,
                        {
                          color: colors.text,
                          fontFamily: selected ? fonts.bodyBold : fonts.body,
                        },
                      ]}
                    >
                      {t(p.nameKey)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>

          <Card style={styles.section}>
            <Text
              style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.bodyBold }]}
            >
              {t("profileAvatar")}
            </Text>
            <View style={styles.emojiGrid}>
              {AVATAR_EMOJIS.map((item) => {
                const locked = user.level < item.level;
                const selected = emoji === item.emoji;
                return (
                  <TouchableOpacity
                    key={item.emoji}
                    style={[
                      styles.emojiCell,
                      {
                        backgroundColor: selected ? colors.primarySoft : colors.bg,
                        borderColor: selected ? colors.primary : "transparent",
                      },
                      locked && styles.emojiLocked,
                    ]}
                    onPress={() => !locked && setEmoji(item.emoji)}
                    disabled={locked}
                  >
                    <Text style={styles.emojiText}>{item.emoji}</Text>
                    {locked && (
                      <Text
                        style={[
                          styles.lockLabel,
                          { color: colors.textMuted, fontFamily: fonts.bodyBold },
                        ]}
                      >
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
                    bg === color && { borderColor: colors.text },
                  ]}
                  onPress={() => setBg(color)}
                />
              ))}
            </View>
          </Card>

          <Card style={styles.section}>
            <Text
              style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.bodyBold }]}
            >
              {t("profileName")}
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.bg,
                  borderColor: colors.border,
                  color: colors.text,
                  fontFamily: fonts.bodyBold,
                },
              ]}
              value={name}
              onChangeText={setName}
              maxLength={30}
              placeholder={t("obNamePlaceholder")}
              placeholderTextColor={colors.textMuted}
            />
            <Text
              style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.bodyBold }]}
            >
              {t("profileGrade")}
            </Text>
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

          <Card style={styles.section}>
            <Text
              style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.bodyBold }]}
            >
              {t("profileCountries")}
            </Text>
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

          <Card style={styles.section}>
            <Text
              style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.bodyBold }]}
            >
              {t("profileSubjects")}
            </Text>
            <Text
              style={[styles.note, { color: colors.textMuted, fontFamily: fonts.body }]}
            >
              {t("obSubjectsNote")}
            </Text>
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

          <Card style={styles.section}>
            <Text
              style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.bodyBold }]}
            >
              {t("profileLanguage")}
            </Text>
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

          <Card style={styles.streakCard}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <View>
              <Text
                style={[
                  styles.streakLabel,
                  { color: colors.textMuted, fontFamily: fonts.bodyBold },
                ]}
              >
                {t("profileBestStreak")}
              </Text>
              <Text
                style={[
                  styles.streakValue,
                  { color: colors.text, fontFamily: fonts.display },
                ]}
              >
                {t("profileStreakDays", { days: user.bestStreak })}
              </Text>
            </View>
          </Card>

          {failed ? (
            <Text style={[styles.error, { color: colors.accent, fontFamily: fonts.body }]}>
              {t("errorFriendly")}
            </Text>
          ) : null}
          {saved ? (
            <Text style={[styles.savedText, { color: colors.green, fontFamily: fonts.bodyBold }]}>
              ✓ {t("profileSaved")}
            </Text>
          ) : null}

          {dirty && (
            <PrimaryButton label={t("save")} onPress={onSave} loading={saving} />
          )}

          <PrimaryButton
            label={t("profileLogout")}
            onPress={onLogout}
            variant="danger"
          />
        </ScrollView>
      </SafeAreaView>
    </Atmosphere>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  title: {
    fontSize: 28,
  },
  accountCard: {
    gap: spacing.lg,
    padding: spacing.xl,
  },
  accountTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  accountMeta: {
    flex: 1,
    gap: 2,
  },
  accountLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  accountName: {
    fontSize: 24,
  },
  friendCode: {
    fontSize: 13,
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radius.button,
    paddingVertical: spacing.md,
  },
  logoutText: {
    fontSize: 16,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
  },
  note: {
    fontSize: 12,
    marginTop: -4,
  },
  themeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  themeCard: {
    width: "48%",
    flexGrow: 1,
    borderRadius: radius.small,
    borderWidth: 2,
    padding: spacing.md,
    gap: spacing.sm,
  },
  swatchRow: {
    flexDirection: "row",
    gap: 6,
  },
  swatch: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  themeName: {
    fontSize: 13,
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
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  emojiLocked: {
    opacity: 0.5,
  },
  emojiText: {
    fontSize: 26,
  },
  lockLabel: {
    fontSize: 9,
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
  input: {
    borderRadius: radius.chip,
    borderWidth: 2,
    padding: spacing.md,
    fontSize: 17,
  },
  schoolRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  schoolInput: {
    flex: 1,
    letterSpacing: 1,
  },
  schoolJoinBtn: {
    minHeight: 48,
    paddingHorizontal: spacing.lg,
  },
  schoolPill: {
    alignSelf: "flex-start",
    borderRadius: radius.chip,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  schoolPillText: {
    fontSize: 15,
  },
  schoolLeave: {
    fontSize: 13,
    marginTop: spacing.xs,
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
  },
  streakValue: {
    fontSize: 22,
  },
  error: {
    textAlign: "center",
  },
  savedText: {
    textAlign: "center",
  },
});
