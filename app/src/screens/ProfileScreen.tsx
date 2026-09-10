import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { createSchool, getMySchool, joinSchool, leaveSchool, updateMe } from "../api/client";
import { Language, SchoolClanData, Subject } from "../api/types";
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
import { useSoundEnabled } from "../utils/audio";

export function ProfileScreen() {
  const { t, lang, setLang } = useI18n();
  const { user, setUser, signOut } = useAuth();
  const { colors, paletteId, setPaletteId } = useTheme();
  const tabPadding = useTabScreenPadding();
  const { isSoundEnabled, toggleSound } = useSoundEnabled();

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
  const [clanData, setClanData] = useState<SchoolClanData | null>(null);
  const [schoolTab, setSchoolTab] = useState<"join" | "create">("join");
  const [createSchoolName, setCreateSchoolName] = useState("");
  const [createDistrict, setCreateDistrict] = useState("");
  const [creatingSchool, setCreatingSchool] = useState(false);
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    if (user?.schoolName) {
      getMySchool()
        .then((res) => setClanData(res.school))
        .catch(() => {});
    } else {
      setClanData(null);
    }
  }, [user?.schoolName]);

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

  const onCreateSchool = async () => {
    const sName = createSchoolName.trim();
    if (!sName) return;
    setCreatingSchool(true);
    setCreateError("");
    try {
      const res = await createSchool({
        name: sName,
        district: createDistrict.trim() || undefined,
      });
      setUser(res.user);
      setCreateSchoolName("");
      setCreateDistrict("");
      Alert.alert(
        "School Clan Created! 🏫",
        `Your school clan code is: ${res.school.joinCode}\nShare this code with your classmates to build the school leaderboard!`,
        [
          { text: "Done", style: "cancel" },
          {
            text: "Share Code",
            onPress: () => {
              Share.share({
                message: `Join our school clan "${res.school.name}" on QuizQuest! Use code: ${res.school.joinCode}`,
              });
            },
          },
        ]
      );
    } catch (e: any) {
      setCreateError(e?.message || "Could not create school clan");
    } finally {
      setCreatingSchool(false);
    }
  };

  const shareClanCode = () => {
    const code = clanData?.joinCode || "";
    Share.share({
      message: `Join our school clan "${user.schoolName}" on QuizQuest! Use code: ${code}`,
    });
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
          <Card
            style={StyleSheet.flatten([
              styles.accountCard,
              {
                backgroundColor: colors.surfaceElevated,
                borderColor: colors.border,
                borderWidth: 1,
              },
            ])}
          >
            <View style={styles.accountTop}>
              <AvatarCircle avatar={{ emoji, bg }} size={72} />
              <View style={styles.accountMeta}>
                <Text
                  style={[
                    styles.accountLabel,
                    { color: colors.primary, fontFamily: fonts.bodyBold },
                  ]}
                >
                  {t("profileAccount")}
                </Text>
                <Text
                  style={[
                    styles.accountName,
                    { color: colors.text, fontFamily: fonts.display },
                  ]}
                  numberOfLines={1}
                >
                  {user.name}
                </Text>
                <View style={[styles.codeBadge, { backgroundColor: colors.surface }]}>
                  <Text
                    style={[
                      styles.friendCode,
                      { color: colors.textMuted, fontFamily: fonts.bodyBold },
                    ]}
                  >
                    {t("profileFriendCode")}: <Text style={{ color: colors.text }}>{user.friendCode}</Text>
                  </Text>
                </View>
              </View>
            </View>
            <TouchableOpacity
              style={[
                styles.logoutBtn,
                {
                  backgroundColor: colors.dangerSoft,
                  borderColor: colors.danger,
                  borderWidth: 1,
                },
              ]}
              onPress={onLogout}
              activeOpacity={0.85}
            >
              <IconLogout size={16} color={colors.danger} />
              <Text
                style={[
                  styles.logoutText,
                  { color: colors.danger, fontFamily: fonts.bodyBold },
                ]}
              >
                {t("profileLogout")}
              </Text>
            </TouchableOpacity>
          </Card>

          {/* School / class clan */}
          <Card style={styles.section}>
            <View style={styles.schoolHeaderRow}>
              <Text
                style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.bodyBold }]}
              >
                {t("profileSchool")}
              </Text>
              {clanData?.verified && (
                <View style={[styles.verifiedBadge, { backgroundColor: colors.greenSoft }]}>
                  <Text style={[styles.verifiedBadgeText, { color: colors.green, fontFamily: fonts.bodyBold }]}>
                    ✓ Verified
                  </Text>
                </View>
              )}
            </View>

            {user.schoolName ? (
              <View style={styles.clanDetailsBox}>
                <View style={[styles.schoolPill, { backgroundColor: colors.primarySoft }]}>
                  <Text
                    style={[
                      styles.schoolPillText,
                      { color: colors.primary, fontFamily: fonts.bodyBold },
                    ]}
                  >
                    🏫 {user.schoolName}
                  </Text>
                  {clanData?.district ? (
                    <Text style={[styles.clanDistrictText, { color: colors.textMuted, fontFamily: fonts.body }]}>
                      📍 {clanData.district}
                    </Text>
                  ) : null}
                </View>

                {/* Clan stats row */}
                <View style={styles.clanStatsRow}>
                  <View style={[styles.clanStatCell, { backgroundColor: colors.bg, borderColor: colors.border }]}>
                    <Text style={[styles.clanStatLabel, { color: colors.textMuted, fontFamily: fonts.bodyBold }]}>
                      CLAN CODE
                    </Text>
                    <Text style={[styles.clanStatValue, { color: colors.primary, fontFamily: fonts.display }]}>
                      {clanData?.joinCode || "—"}
                    </Text>
                  </View>
                  <View style={[styles.clanStatCell, { backgroundColor: colors.bg, borderColor: colors.border }]}>
                    <Text style={[styles.clanStatLabel, { color: colors.textMuted, fontFamily: fonts.bodyBold }]}>
                      MEMBERS
                    </Text>
                    <Text style={[styles.clanStatValue, { color: colors.text, fontFamily: fonts.display }]}>
                      {clanData?.membersCount ?? 1}
                    </Text>
                  </View>
                  <View style={[styles.clanStatCell, { backgroundColor: colors.bg, borderColor: colors.border }]}>
                    <Text style={[styles.clanStatLabel, { color: colors.textMuted, fontFamily: fonts.bodyBold }]}>
                      TOTAL XP
                    </Text>
                    <Text style={[styles.clanStatValue, { color: colors.accent, fontFamily: fonts.display }]}>
                      {clanData?.totalXp ?? user.xp}
                    </Text>
                  </View>
                </View>

                {/* Share invite button */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[styles.shareClanBtn, { backgroundColor: colors.primary }]}
                  onPress={shareClanCode}
                >
                  <Text style={[styles.shareClanText, { color: colors.textOnPrimary, fontFamily: fonts.bodyBold }]}>
                    📢 {t("profileShareClan")}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={onLeaveSchool} accessibilityRole="button" style={{ alignSelf: "center", marginTop: spacing.xs }}>
                  <Text
                    style={[
                      styles.schoolLeave,
                      { color: colors.danger, fontFamily: fonts.bodyBold },
                    ]}
                  >
                    {t("profileSchoolLeave")}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* Switcher: Join or Create */}
                <View style={styles.clanTabSwitcher}>
                  <TouchableOpacity
                    onPress={() => setSchoolTab("join")}
                    style={[
                      styles.clanTabBtn,
                      schoolTab === "join" && {
                        backgroundColor: colors.primary,
                        borderColor: colors.primary,
                      },
                      schoolTab !== "join" && {
                        backgroundColor: colors.bg,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.clanTabText,
                        {
                          color: schoolTab === "join" ? colors.textOnPrimary : colors.textMuted,
                          fontFamily: fonts.bodyBold,
                        },
                      ]}
                    >
                      {t("profileSchoolJoin")}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setSchoolTab("create")}
                    style={[
                      styles.clanTabBtn,
                      schoolTab === "create" && {
                        backgroundColor: colors.primary,
                        borderColor: colors.primary,
                      },
                      schoolTab !== "create" && {
                        backgroundColor: colors.bg,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.clanTabText,
                        {
                          color: schoolTab === "create" ? colors.textOnPrimary : colors.textMuted,
                          fontFamily: fonts.bodyBold,
                        },
                      ]}
                    >
                      + {t("profileSchoolCreate")}
                    </Text>
                  </TouchableOpacity>
                </View>

                {schoolTab === "join" ? (
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
                ) : (
                  <View style={styles.createSchoolForm}>
                    <Text
                      style={[styles.note, { color: colors.textMuted, fontFamily: fonts.body }]}
                    >
                      {t("profileSchoolCreateDesc")}
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
                      value={createSchoolName}
                      onChangeText={setCreateSchoolName}
                      placeholder={t("profileSchoolNameLabel")}
                      placeholderTextColor={colors.textMuted}
                      maxLength={60}
                    />
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
                      value={createDistrict}
                      onChangeText={setCreateDistrict}
                      placeholder={`${t("profileDistrictLabel")} (optional, e.g. Lalitpur)`}
                      placeholderTextColor={colors.textMuted}
                      maxLength={40}
                    />
                    {createError ? (
                      <Text
                        style={[styles.error, { color: colors.accent, fontFamily: fonts.body }]}
                      >
                        {createError}
                      </Text>
                    ) : null}
                    <PrimaryButton
                      label={t("profileCreateBtn")}
                      onPress={onCreateSchool}
                      loading={creatingSchool}
                      disabled={!createSchoolName.trim() || creatingSchool}
                    />
                  </View>
                )}
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

          <Card style={styles.section}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.bodyBold, marginBottom: 4 }]}>
                  {lang === "ne" ? "ध्वनि प्रभाव (Sound Effects)" : "Sound Effects"}
                </Text>
                <Text style={[styles.note, { color: colors.textMuted, fontFamily: fonts.body }]}>
                  {isSoundEnabled ? (lang === "ne" ? "ध्वनि चालू छ" : "Sound effects are ON") : (lang === "ne" ? "ध्वनि बन्द छ" : "Sound effects are MUTED")}
                </Text>
              </View>
              <TouchableOpacity
                onPress={toggleSound}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: radius.chip,
                  backgroundColor: isSoundEnabled ? colors.primarySoft : colors.surfaceElevated,
                  borderColor: isSoundEnabled ? colors.primary : colors.border,
                  borderWidth: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                }}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 18 }}>{isSoundEnabled ? "🔊" : "🔇"}</Text>
                <Text style={{ color: isSoundEnabled ? colors.primary : colors.textMuted, fontFamily: fonts.bodyBold, fontSize: 13 }}>
                  {isSoundEnabled ? "ON" : "OFF"}
                </Text>
              </TouchableOpacity>
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
    fontSize: 12,
  },
  codeBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.small,
    marginTop: 4,
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
  schoolHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  verifiedBadge: {
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.chip,
  },
  verifiedBadgeText: {
    fontSize: 11,
  },
  clanDetailsBox: {
    gap: spacing.sm,
  },
  clanDistrictText: {
    fontSize: 12,
    marginTop: 2,
  },
  clanStatsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginVertical: spacing.xs,
  },
  clanStatCell: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: radius.chip,
    borderWidth: 1,
    alignItems: "center",
  },
  clanStatLabel: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
  clanStatValue: {
    fontSize: 16,
    marginTop: 2,
  },
  shareClanBtn: {
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderRadius: radius.button,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xs,
  },
  shareClanText: {
    fontSize: 14,
  },
  clanTabSwitcher: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  clanTabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radius.chip,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  clanTabText: {
    fontSize: 13,
  },
  createSchoolForm: {
    gap: spacing.sm,
  },
});
