import { useFocusEffect, useNavigation } from "@react-navigation/native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getHome, updateMe } from "../api/client";
import { SoundEffects } from "../utils/audio";
import { HomeData } from "../api/types";
import { getCachedHome, saveCachedHome, syncOfflineQueue } from "../utils/offlineStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Atmosphere } from "../components/Atmosphere";
import { AvatarCircle } from "../components/AvatarCircle";
import { Card } from "../components/Card";
import { CountrySelectorModal } from "../components/CountrySelectorModal";
import { ErrorCard } from "../components/ErrorCard";
import { FeatureTourSpotlightModal, TourStepItem, TUTORIAL_STORAGE_KEY } from "../components/FeatureTourSpotlightModal";
import { LoadingView } from "../components/LoadingView";
import { NotificationCenterModal } from "../components/NotificationCenterModal";
import { IconFlame, IconMap } from "../components/QuestIcons";
import { StreakFlame } from "../components/StreakFlame";
import { StreakCelebrationModal } from "../components/StreakCelebrationModal";
import { LanguageSelectorModal } from "../components/LanguageSelectorModal";
import { XpBar } from "../components/XpBar";
import { ALL_COUNTRIES, countryFlag, countrySyllabus, xpForLevel } from "../constants";
import { SUPPORTED_LANGUAGES } from "../i18n";
import { detectUserCountry } from "../utils/countryDetector";
import { useTabScreenPadding } from "../navigation/useTabScreenPadding";
import { useAuth } from "../state/AuthContext";
import { useI18n } from "../state/LanguageContext";
import { useTheme } from "../state/ThemeContext";
import { fonts, radius, spacing } from "../theme";
import { Haptics } from "../utils/haptics";

export function HomeScreen() {
  const { t, lang } = useI18n();
  const { user, setUser, token } = useAuth();
  const { colors, toggleLightDark } = useTheme();
  const navigation = useNavigation();
  const pulse = useRef(new Animated.Value(1)).current;
  const tabPadding = useTabScreenPadding();

  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showLangModal, setShowLangModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [factSeed, setFactSeed] = useState(() => Math.floor(Math.random() * 50));
  const [showTutorial, setShowTutorial] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const countryPillRef = useRef<View>(null);
  const questCardRef = useRef<View>(null);
  const battleCardRef = useRef<View>(null);
  const arcadeGridRef = useRef<View>(null);
  const digestCardRef = useRef<View>(null);
  const clanPillRef = useRef<View>(null);

  // Auto-launch Feature Tour for new players
  useEffect(() => {
    if (data && !loading) {
      AsyncStorage.getItem(TUTORIAL_STORAGE_KEY).then((seen) => {
        if (!seen) {
          const timer = setTimeout(() => setShowTutorial(true), 750);
          return () => clearTimeout(timer);
        }
      });
    }
  }, [data, loading]);

  const tourSteps: TourStepItem[] = [
    {
      id: "country",
      titleKey: "tourStep1Title",
      descKey: "tourStep1Desc",
      icon: "🇳🇵",
      getRef: () => countryPillRef.current,
      scrollTo: () => scrollViewRef.current?.scrollTo({ y: 0, animated: true }),
    },
    {
      id: "quest",
      titleKey: "tourStep2Title",
      descKey: "tourStep2Desc",
      icon: "🗺️",
      getRef: () => questCardRef.current,
      scrollTo: () => scrollViewRef.current?.scrollTo({ y: 190, animated: true }),
    },
    {
      id: "battle",
      titleKey: "tourStep3Title",
      descKey: "tourStep3Desc",
      icon: "⚔️",
      getRef: () => battleCardRef.current,
      scrollTo: () => scrollViewRef.current?.scrollTo({ y: 620, animated: true }),
    },
    {
      id: "arcade",
      titleKey: "tourStep4Title",
      descKey: "tourStep4Desc",
      icon: "🎮",
      getRef: () => arcadeGridRef.current,
      scrollTo: () => scrollViewRef.current?.scrollTo({ y: 440, animated: true }),
    },
    {
      id: "digest",
      titleKey: "tourStep5Title",
      descKey: "tourStep5Desc",
      icon: "📰",
      getRef: () => digestCardRef.current,
      scrollTo: () => scrollViewRef.current?.scrollTo({ y: 840, animated: true }),
    },
    {
      id: "clan",
      titleKey: "tourStep6Title",
      descKey: "tourStep6Desc",
      icon: "🏫",
      getRef: () => clanPillRef.current,
      scrollTo: () => scrollViewRef.current?.scrollTo({ y: 0, animated: true }),
    },
  ];

  // Auto-detect user country if not set yet
  useEffect(() => {
    if (data?.user && !data.user.homeCountry) {
      const detected = detectUserCountry();
      updateMe({ homeCountry: detected })
        .then(({ user: updated }) => {
          setUser(updated);
        })
        .catch(() => {});
    }
  }, [data?.user, setUser]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.06,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const load = useCallback(
    async (asRefresh = false) => {
      if (asRefresh) setRefreshing(true);
      setFailed(false);
      try {
        const home = await getHome();
        setData(home);
        setUser(home.user);
        setIsOffline(false);
        saveCachedHome(home);
        if (token) {
          syncOfflineQueue(token).catch(() => {});
        }
      } catch {
        const cached = await getCachedHome();
        if (cached) {
          setData(cached);
          setIsOffline(true);
        } else if (!asRefresh) {
          setFailed(true);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [setUser, token]
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading && !data) return <LoadingView />;
  if (failed && !data) return <ErrorCard onRetry={() => load()} />;
  if (!data || !user) return <LoadingView />;

  const levelXpNeeded = xpForLevel(data.user.level);
  const xpIntoLevel = data.user.xp % levelXpNeeded;
  const quizDone = data.dailyQuiz.status === "completed";
  const digest = data.digest;

  // Dynamic notification badge: count genuinely pending daily activities
  const pendingQuiz = !quizDone ? 1 : 0;
  const pendingRiddle = data.riddle && !data.riddle.solved ? 1 : 0;
  const notifBadgeCount = pendingQuiz + pendingRiddle;

  return (
    <Atmosphere>
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[styles.content, { paddingBottom: tabPadding }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor={colors.primary}
            />
          }
        >
          {/* Offline Mode Banner */}
          {isOffline && (
            <View
              style={[
                styles.offlineBanner,
                {
                  backgroundColor: colors.amberSoft,
                  borderColor: colors.amber,
                },
              ]}
            >
              <Text style={styles.offlineBannerIcon}>📡</Text>
              <Text
                style={[
                  styles.offlineBannerText,
                  { color: colors.amber, fontFamily: fonts.bodyBold },
                ]}
              >
                {lang === "ne"
                  ? "अफलाइन मोड सक्रिय: क्यास गरिएका प्रश्न र खेलहरू उपलब्ध छन्। इन्टरनेट आएपछि स्कोर स्वतः सिङ्क हुनेछ।"
                  : "Offline Mode Active: Quizzes and games are playable offline. Progress will sync when reconnected!"}
              </Text>
            </View>
          )}

          {/* Top Header Bar: 2-Row Layout */}
          <View style={styles.topHeaderBar}>
            {/* ROW 1: Brand/Level on left | Notification + Avatar on right */}
            <View style={styles.headerRow1}>
              <View style={styles.brandContainer}>
                <Text
                  style={[
                    styles.brandTitle,
                    { color: colors.primary, fontFamily: fonts.display },
                  ]}
                >
                  {t("appName")}
                </Text>
                <View
                  style={[
                    styles.levelBadge,
                    { backgroundColor: colors.primary, borderColor: colors.primaryDark },
                  ]}
                >
                  <Text
                    style={[
                      styles.levelBadgeText,
                      { color: colors.textOnPrimary, fontFamily: fonts.bodyBold },
                    ]}
                  >
                    Lv. {data.user.level}
                  </Text>
                </View>
              </View>

              <View style={styles.headerRow1Right}>
                {/* Notification Bell */}
                <TouchableOpacity
                  style={[
                    styles.headerIconButton,
                    { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                  ]}
                  onPress={() => setShowNotificationModal(true)}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityLabel="Notifications"
                >
                  <Text style={styles.notificationBellIcon}>🔔</Text>
                  {notifBadgeCount > 0 && (
                    <View style={[styles.notificationBellBadge, { backgroundColor: colors.primary }]}>
                      <Text style={styles.notificationBellBadgeText}>{notifBadgeCount}</Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* Avatar → taps to Profile tab */}
                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={() => {
                    Haptics.tap();
                    (navigation as any).navigate("Tabs", { screen: "Profile" });
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="My Profile"
                  style={styles.avatarBtn}
                >
                  <AvatarCircle avatar={data.user.avatar} size={36} />
                </TouchableOpacity>
              </View>
            </View>

            {/* ROW 2: Country + Language + Theme toggle */}
            <View style={styles.headerRow2}>
              {/* Country Syllabus Selector */}
              <View ref={countryPillRef} collapsable={false}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[
                    styles.headerActionChip,
                    { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                  ]}
                  onPress={() => setShowCountryModal(true)}
                >
                  <Text style={{ fontSize: 13 }}>
                    {countryFlag(data.user.homeCountry || "nepal")}
                  </Text>
                  <Text
                    style={[
                      styles.headerActionChipText,
                      { color: colors.text, fontFamily: fonts.bodyBold },
                    ]}
                    numberOfLines={1}
                  >
                    {t(
                      (ALL_COUNTRIES.find(
                        (c) => c.code === (data.user.homeCountry || "nepal")
                      )?.labelKey as any) || "countryNepal"
                    )}
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: 8 }}>▼</Text>
                </TouchableOpacity>
              </View>

              {/* Language Switcher */}
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.headerActionChip,
                  { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                ]}
                onPress={() => {
                  Haptics.tap();
                  setShowLangModal(true);
                }}
              >
                <Text style={{ fontSize: 13 }}>
                  {SUPPORTED_LANGUAGES.find((l) => l.code === lang)?.flag || "🌐"}
                </Text>
                <Text
                  style={[
                    styles.headerActionChipText,
                    { color: colors.text, fontFamily: fonts.bodyBold },
                  ]}
                >
                  {SUPPORTED_LANGUAGES.find((l) => l.code === lang)?.label.slice(0, 3).toUpperCase() || "LAN"}
                </Text>
              </TouchableOpacity>

              {/* Theme Toggle (Light / Dark) */}
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.headerIconButton,
                  { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                ]}
                onPress={() => {
                  Haptics.tap();
                  toggleLightDark();
                }}
                accessibilityRole="button"
                accessibilityLabel="Toggle Theme"
              >
                <Text style={{ fontSize: 13 }}>{colors.isLight ? "🌙" : "☀️"}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Hero Greeting & Quick Access Chips */}
          <View style={styles.greetingContainer}>
            <View style={styles.greetingHeader}>
              <Text
                style={[styles.greeting, { color: colors.text, fontFamily: fonts.display }]}
              >
                {t("homeGreeting", { name: data.user.name })}
              </Text>
              <Text
                style={[
                  styles.greetingSub,
                  { color: colors.textMuted, fontFamily: fonts.body },
                ]}
              >
                ✨ {t("tagline")}
              </Text>
            </View>

            {/* Clean secondary action chips below greeting */}
            <View style={styles.secondaryActionsRow}>
              <View ref={clanPillRef} collapsable={false}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[
                    styles.secondaryActionChip,
                    {
                      backgroundColor: colors.primarySoft,
                      borderColor: colors.primary,
                    },
                  ]}
                  onPress={() => (navigation as any).navigate("SchoolHub")}
                >
                  <Text
                    style={[
                      styles.secondaryActionChipText,
                      { color: colors.primary, fontFamily: fonts.bodyBold },
                    ]}
                    numberOfLines={1}
                  >
                    🏫 {data.user.schoolName ? data.user.schoolName : "School Clan"}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[
                  styles.secondaryActionChip,
                  { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                ]}
                onPress={() => {
                  SoundEffects.playTap();
                  setShowTutorial(true);
                }}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel={t("tourHowToPlay")}
              >
                <Text style={styles.tourGuideIcon}>🎓</Text>
                <Text style={[styles.secondaryActionChipText, { color: colors.text, fontFamily: fonts.bodyBold }]}>
                  {t("tourHowToPlay")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Notification Center Modal */}
          <NotificationCenterModal
            visible={showNotificationModal}
            onClose={() => setShowNotificationModal(false)}
            onNavigateQuiz={() => (navigation as any).navigate("DailyQuiz")}
            onNavigateZip={() => (navigation as any).navigate("ZipPlay")}
            onNavigateBattle={() => (navigation as any).navigate("Battle")}
            onNavigateRiddle={() => (navigation as any).navigate("RiddlePlay")}
            streakCount={data.user.streak || 1}
          />

          {/* Country Syllabus Switcher Modal */}
          <CountrySelectorModal
            visible={showCountryModal}
            onClose={() => setShowCountryModal(false)}
            onCountryChanged={() => load()}
          />

          {/* Player Progression & Streak HUD Card */}
          <StreakCelebrationModal
            visible={showStreakModal}
            streakDays={data.user.streak || 1}
            onClose={() => setShowStreakModal(false)}
          />
          <Card style={styles.streakCard}>
            <View style={styles.streakTop}>
              <TouchableOpacity
                style={styles.streakLeft}
                activeOpacity={0.75}
                onPress={() => setShowStreakModal(true)}
              >
                <Animated.View style={{ transform: [{ scale: pulse }] }}>
                  <StreakFlame count={data.user.streak} size={48} />
                </Animated.View>
                <View>
                  <Text
                    style={[
                      styles.streakCountText,
                      { color: colors.text, fontFamily: fonts.display },
                    ]}
                  >
                    {data.user.streak} {t("homeStreakDays")} 🔥
                  </Text>
                  <Text
                    style={[
                      styles.streakLabel,
                      { color: colors.accent, fontFamily: fonts.bodyBold },
                    ]}
                  >
                    {lang === "ne" ? "उत्सव हेर्न थिच्नुहोस्" : "Tap for streak reward"} ✨
                  </Text>
                </View>
              </TouchableOpacity>

              <View
                style={[
                  styles.weeklyBox,
                  { backgroundColor: colors.bgMid, borderColor: colors.border },
                ]}
              >
                <Text
                  style={[
                    styles.weeklyXp,
                    { color: colors.accent, fontFamily: fonts.display },
                  ]}
                >
                  +{data.weeklyXp}
                </Text>
                <Text
                  style={[
                    styles.weeklyLabel,
                    { color: colors.textMuted, fontFamily: fonts.bodyBold },
                  ]}
                >
                  {t("homeWeeklyXp")}
                </Text>
              </View>
            </View>

            {/* Level XP Bar */}
            <View style={styles.levelProgressContainer}>
              <View style={styles.levelRow}>
                <Text
                  style={[
                    styles.levelText,
                    { color: colors.text, fontFamily: fonts.bodyBold },
                  ]}
                >
                  {t("homeLevel", { level: data.user.level })}
                </Text>
                <Text
                  style={[
                    styles.levelXp,
                    { color: colors.textMuted, fontFamily: fonts.bodyBold },
                  ]}
                >
                  {t("homeXpProgress", { xp: `${xpIntoLevel} / ${levelXpNeeded} XP` })}
                </Text>
              </View>
              <XpBar progress={xpIntoLevel / levelXpNeeded} />
            </View>
          </Card>

          {/* Hero Daily Quest Card */}
          <View ref={questCardRef} collapsable={false}>
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => {
                if (quizDone) {
                  navigation.navigate("DailyQuiz", { mode: "practice" });
                } else {
                  navigation.navigate("DailyQuiz", { mode: "daily" });
                }
              }}
            >
              <Card
                style={StyleSheet.flatten([
                  styles.questCard,
                  { borderColor: colors.primary, borderWidth: 1.5 },
                ])}
              >
                <View style={styles.questHeaderRow}>
                  <View
                    style={[
                      styles.questBountyBadge,
                      {
                        backgroundColor: quizDone
                          ? "rgba(16, 185, 129, 0.18)"
                          : "rgba(0, 210, 255, 0.16)",
                        borderColor: quizDone ? colors.green : colors.primary,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.questBountyText,
                        {
                          color: quizDone ? colors.green : colors.primary,
                          fontFamily: fonts.bodyBold,
                        },
                      ]}
                    >
                      {quizDone ? "✓ COMPLETED · UNLIMITED MODE ON" : "DAILY QUEST · +50 XP"}
                    </Text>
                  </View>
                </View>

                <View style={styles.questMainContent}>
                  <View
                    style={[
                      styles.questIconBox,
                      { backgroundColor: colors.bgMid, borderColor: colors.border },
                    ]}
                  >
                    <IconMap size={44} color={colors.primary} secondary={colors.accent} />
                  </View>

                  <View style={styles.questBody}>
                    <Text
                      style={[
                        styles.questTitle,
                        { color: colors.text, fontFamily: fonts.display },
                      ]}
                    >
                      {quizDone ? t("quizPlayMore") : t("homeTodaysQuest")}
                    </Text>
                    <Text
                      style={[
                        styles.questMeta,
                        { color: colors.textMuted, fontFamily: fonts.body },
                      ]}
                    >
                      {quizDone
                        ? "Play endless 5-question rounds for +XP & mastery!"
                        : t("homeQuestMeta")}
                    </Text>
                  </View>
                </View>

                {quizDone ? (
                  <View style={{ gap: 8 }}>
                    <View
                      style={[
                        styles.questDoneBanner,
                        { backgroundColor: "rgba(16, 185, 129, 0.12)", borderColor: colors.green },
                      ]}
                    >
                      <Text
                        style={[
                          styles.questDoneText,
                          { color: colors.green, fontFamily: fonts.bodyBold },
                        ]}
                      >
                        🎉 {t("homeQuestDone", {
                          score: data.dailyQuiz.score ?? 0,
                          total: data.dailyQuiz.total,
                        })}
                      </Text>
                    </View>
                    <View style={[styles.questCta, { backgroundColor: colors.primary }]}>
                      <Text
                        style={[
                          styles.questCtaText,
                          { color: colors.textOnPrimary, fontFamily: fonts.bodyBold },
                        ]}
                      >
                        🎲 {t("quizPlayMore")} →
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={[styles.questCta, { backgroundColor: colors.primary }]}>
                    <Text
                      style={[
                        styles.questCtaText,
                        { color: colors.textOnPrimary, fontFamily: fonts.bodyBold },
                      ]}
                    >
                      {t("homeStartQuest")} →
                    </Text>
                  </View>
                )}
              </Card>
            </TouchableOpacity>
          </View>

          {/* Game Arena & Brain Gym Teaser Card (Directs to Dedicated Arcade Tab) */}
          <View ref={arcadeGridRef} collapsable={false}>
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => {
                Haptics.tap();
                (navigation as any).navigate("Tabs", { screen: "Arcade" });
              }}
            >
              <Card
                style={StyleSheet.flatten([
                  styles.arcadeTeaserCard,
                  { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                ])}
              >
                <View style={styles.arcadeTeaserTop}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
                    <View style={[styles.arcadeIconBox, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}>
                      <Text style={{ fontSize: 24 }}>🎮</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Text style={[styles.arcadeTeaserTitle, { color: colors.text, fontFamily: fonts.display }]}>
                          {t("homeArcadeHeader")}
                        </Text>
                        <View style={[styles.arcadeBadge, { backgroundColor: colors.accent }]}>
                          <Text style={styles.arcadeBadgeText}>5 GAMES</Text>
                        </View>
                      </View>
                      <Text style={[styles.arcadeTeaserSub, { color: colors.textMuted, fontFamily: fonts.body }]}>
                        {t("homeArcadeSub")}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Quick game shortcuts */}
                <View style={styles.arcadeQuickPillsRow}>
                  <TouchableOpacity
                    style={[styles.quickGamePill, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => (navigation as any).navigate("ZipPlay")}
                  >
                    <Text style={[styles.quickGamePillText, { color: colors.text }]}>⚡ Zip Path</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.quickGamePill, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => (navigation as any).navigate("WordSearchPlay")}
                  >
                    <Text style={[styles.quickGamePillText, { color: colors.text }]}>🔍 Word Search</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.quickGamePill, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => (navigation as any).navigate("MemoryPlay")}
                  >
                    <Text style={[styles.quickGamePillText, { color: colors.text }]}>🧠 Memory</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.quickGamePill, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => (navigation as any).navigate("RiddlePlay")}
                  >
                    <Text style={[styles.quickGamePillText, { color: colors.text }]}>💡 Riddles</Text>
                  </TouchableOpacity>
                </View>

                {/* Direct CTA */}
                <View style={[styles.arcadeTeaserCta, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.arcadeTeaserCtaText, { fontFamily: fonts.bodyBold }]}>
                    {lang === "ne" ? "आर्केड एरीना खोल्नुहोस् ➔" : "Enter Arcade Arena (Tab 2) ➔"}
                  </Text>
                </View>
              </Card>
            </TouchableOpacity>
          </View>

          {/* Revenge Round Card */}
          {data.revengeAvailable && (
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => navigation.navigate("RevengeRound")}
            >
              <Card
                style={StyleSheet.flatten([
                  styles.revengeCard,
                  { borderColor: colors.accent, borderWidth: 1.5 },
                ])}
              >
                <View style={styles.questHeaderRow}>
                  <View
                    style={[
                      styles.questBountyBadge,
                      {
                        backgroundColor: "rgba(255, 183, 3, 0.16)",
                        borderColor: colors.accent,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.questBountyText,
                        { color: colors.accent, fontFamily: fonts.bodyBold },
                      ]}
                    >
                      🔥 REVENGE ROUND · +25 XP
                    </Text>
                  </View>
                </View>

                <View style={styles.questMainContent}>
                  <View
                    style={[
                      styles.questIconBox,
                      { backgroundColor: colors.bgMid, borderColor: colors.border },
                    ]}
                  >
                    <IconFlame size={40} color={colors.accent} secondary={colors.primary} />
                  </View>
                  <View style={styles.questBody}>
                    <Text
                      style={[
                        styles.revengeTitle,
                        { color: colors.text, fontFamily: fonts.display },
                      ]}
                    >
                      {t("homeRevengeTitle")}
                    </Text>
                    <Text
                      style={[
                        styles.revengeCopy,
                        { color: colors.textMuted, fontFamily: fonts.body },
                      ]}
                    >
                      {t("homeRevengeCopy")}
                    </Text>
                  </View>
                </View>

                <View style={[styles.revengeCta, { backgroundColor: colors.accent }]}>
                  <Text
                    style={[
                      styles.revengeCtaText,
                      { color: colors.textOnPrimary, fontFamily: fonts.bodyBold },
                    ]}
                  >
                    {t("homeRevengeCta")} →
                  </Text>
                </View>
              </Card>
            </TouchableOpacity>
          )}


          {/* Today's Digest Card */}
          {digest && (
            <View ref={digestCardRef} collapsable={false}>
              <Card style={styles.digestCard}>
              <View style={styles.digestHeader}>
                <View style={styles.digestBadge}>
                  <Text style={[styles.digestBadgeText, { color: colors.primary, fontFamily: fonts.bodyBold }]}>
                    📰 DAILY DIGEST
                  </Text>
                </View>

                {/* Instant Shuffle / Random Digest Fact Button */}
                <TouchableOpacity
                  style={[
                    styles.digestShuffleBtn,
                    { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                  ]}
                  onPress={() => {
                    SoundEffects.playCardFlip();
                    setFactSeed((prev) => (prev + 1) % 50);
                  }}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.digestShuffleText, { color: colors.accent, fontFamily: fonts.bodyBold }]}>
                    🎲 {lang === "ne" ? "अर्को रोचक तथ्य" : "New Fact"}
                  </Text>
                </TouchableOpacity>

                <Text
                  style={[
                    styles.digestDate,
                    { color: colors.textMuted, fontFamily: fonts.bodyBold },
                  ]}
                >
                  {digest.bsDate}
                </Text>
              </View>

              <Text
                style={[
                  styles.digestHeadline,
                  { color: colors.text, fontFamily: fonts.displayMed },
                ]}
              >
                {lang === "ne" && digest.headlineNe ? digest.headlineNe : digest.headlineEn}
              </Text>

              <View
                style={[
                  styles.digestItem,
                  { backgroundColor: colors.bgMid, borderColor: colors.border },
                ]}
              >
                <Text
                  style={[
                    styles.digestLabel,
                    { color: colors.primary, fontFamily: fonts.bodyBold },
                  ]}
                >
                  💡 {t("homeDigestGk")}
                </Text>
                <Text
                  style={[
                    styles.digestText,
                    { color: colors.text, fontFamily: fonts.body },
                  ]}
                >
                  {lang === "ne" && digest.gkFactNe ? digest.gkFactNe : digest.gkFactEn}
                </Text>
              </View>

              <View
                style={[
                  styles.digestItem,
                  { backgroundColor: colors.bgMid, borderColor: colors.border },
                ]}
              >
                <Text
                  style={[
                    styles.digestLabel,
                    { color: colors.accent, fontFamily: fonts.bodyBold },
                  ]}
                >
                  🇳🇵 {t("homeDigestNepal")}
                </Text>
                <Text
                  style={[
                    styles.digestText,
                    { color: colors.text, fontFamily: fonts.body },
                  ]}
                >
                  {lang === "ne" && digest.nepalFactNe ? digest.nepalFactNe : digest.nepalFactEn}
                </Text>
              </View>
            </Card>
          </View>
        )}

          {/* Recent Awards Carousel */}
          {data.recentAwards.length > 0 && (
            <View style={styles.awardsSection}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: colors.text, fontFamily: fonts.bodyBold },
                ]}
              >
                🏆 {t("homeRecentAwards")}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.awardsRow}>
                  {data.recentAwards.map((award) => (
                    <View
                      key={award.code}
                      style={[
                        styles.awardChip,
                        {
                          backgroundColor: colors.card,
                          borderColor: colors.gold,
                        },
                      ]}
                    >
                      <Text style={styles.awardIcon}>{award.icon}</Text>
                      <Text
                        style={[
                          styles.awardName,
                          { color: colors.text, fontFamily: fonts.bodyBold },
                        ]}
                        numberOfLines={1}
                      >
                        {lang === "ne" && award.nameNe
                          ? award.nameNe
                          : award.nameEn}
                      </Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Interactive Spotlight Feature Tour & How to Play */}
      <FeatureTourSpotlightModal
        visible={showTutorial}
        steps={tourSteps}
        onClose={() => setShowTutorial(false)}
      />

      {/* Language Selector Modal */}
      <LanguageSelectorModal
        visible={showLangModal}
        onClose={() => setShowLangModal(false)}
      />
    </Atmosphere>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  topHeaderBar: {
    flexDirection: "column",
    marginBottom: spacing.xs,
    paddingTop: spacing.xs,
    gap: 6,
  },
  headerRow1: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerRow1Right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerRow2: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  avatarBtn: {
    borderRadius: 20,
    overflow: "hidden",
  },
  brandContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  brandTitle: {
    fontSize: 20,
    letterSpacing: -0.3,
  },
  levelBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  levelBadgeText: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
  headerActionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  headerActionChipText: {
    fontSize: 11,
    letterSpacing: 0.2,
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  greetingContainer: {
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  greetingHeader: {
    gap: 2,
  },
  secondaryActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 2,
  },
  secondaryActionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  secondaryActionChipText: {
    fontSize: 12,
    letterSpacing: 0.2,
  },
  greetingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  greetingText: { flex: 1, paddingRight: spacing.md, gap: 2 },
  brandBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: 2,
  },
  brandHint: {
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  levelPill: {
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: 10,
    borderWidth: 1,
  },
  levelPillText: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
  greeting: { fontSize: 24 },
  greetingSub: { fontSize: 13 },
  streakCard: {
    gap: spacing.md,
    padding: spacing.lg,
  },
  streakTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  streakLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  streakCountText: {
    fontSize: 18,
  },
  streakLabel: {
    fontSize: 12,
  },
  weeklyBox: {
    alignItems: "center",
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.chip,
    borderWidth: 1,
  },
  weeklyXp: { fontSize: 20 },
  weeklyLabel: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  levelProgressContainer: {
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  levelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  levelText: { fontSize: 13 },
  levelXp: {
    fontSize: 12,
  },
  questCard: {
    gap: spacing.md,
    padding: spacing.lg,
  },
  questHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  questBountyBadge: {
    paddingVertical: 3,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: 12,
    borderWidth: 1,
  },
  questBountyText: {
    fontSize: 11,
    letterSpacing: 0.8,
  },
  questMainContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  questIconBox: {
    width: 58,
    height: 58,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  questBody: { flex: 1, gap: 2 },
  questTitle: { fontSize: 20 },
  questMeta: { fontSize: 13 },
  questDoneBanner: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.chip,
    borderWidth: 1,
    alignItems: "center",
  },
  questDoneText: { fontSize: 14 },
  questCta: {
    borderRadius: radius.button,
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  questCtaText: { fontSize: 15, letterSpacing: 0.3 },
  revengeCard: {
    gap: spacing.md,
    padding: spacing.lg,
  },
  revengeTitle: { fontSize: 19 },
  revengeCopy: { fontSize: 13 },
  revengeCta: {
    borderRadius: radius.button,
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  revengeCtaText: { fontSize: 15, letterSpacing: 0.3 },
  digestCard: { gap: spacing.md, padding: spacing.lg },
  digestHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  digestBadge: {
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
  },
  digestBadgeText: {
    fontSize: 11,
    letterSpacing: 0.8,
  },
  digestDate: { fontSize: 12 },
  digestHeadline: { fontSize: 16, lineHeight: 22 },
  digestItem: {
    borderRadius: radius.chip,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.xs,
  },
  digestLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  digestText: { fontSize: 13, lineHeight: 19 },
  awardsSection: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    letterSpacing: 0.3,
  },
  awardsRow: { flexDirection: "row", gap: spacing.md },
  awardChip: {
    alignItems: "center",
    borderRadius: radius.card,
    borderWidth: 1,
    padding: spacing.md,
    width: 96,
    gap: spacing.xs,
  },
  awardIcon: { fontSize: 28 },
  awardName: { fontSize: 11, textAlign: "center" },
  clanPill: {
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: 10,
    borderWidth: 1,
    maxWidth: 160,
  },
  clanPillText: {
    fontSize: 10,
    letterSpacing: 0.3,
  },
  countryPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 2.5,
    paddingHorizontal: spacing.sm,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
  },
  countryPillText: {
    fontSize: 11,
    letterSpacing: 0.2,
  },
  countrySyllabusTag: {
    fontSize: 10,
  },
  memoryCard: {
    gap: spacing.md,
    padding: spacing.lg,
  },
  memoryTimerPill: {
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.chip,
    borderWidth: 1,
  },
  memoryTimerText: {
    fontSize: 11,
  },
  memoryCta: {
    borderRadius: radius.button,
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  riddleCard: {
    gap: spacing.md,
    padding: spacing.lg,
    marginTop: spacing.md,
    borderWidth: 1.5,
    borderColor: "rgba(245, 158, 11, 0.4)",
  },
  riddleHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  riddleBadge: {
    backgroundColor: "rgba(245, 158, 11, 0.16)",
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.chip,
  },
  riddleBadgeText: {
    fontSize: 11,
    letterSpacing: 0.3,
  },
  riddleCatPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  riddleCatText: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
  riddleQuestion: {
    fontSize: 16,
    lineHeight: 24,
    fontStyle: "italic",
  },
  hintsRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  hintChip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  hintChipText: {
    fontSize: 11,
  },
  hintBox: {
    padding: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    gap: 2,
  },
  hintBoxTitle: {
    fontSize: 11,
  },
  hintBoxText: {
    fontSize: 13,
    lineHeight: 18,
  },
  answerContainer: {
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 8,
  },
  answerLabel: {
    fontSize: 12,
    letterSpacing: 0.3,
  },
  answerText: {
    fontSize: 18,
  },
  riddleActionButtons: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
    flexWrap: "wrap",
  },
  solvedBadge: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  solvedBadgeText: {
    fontSize: 12,
  },
  claimXpBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  claimXpText: {
    fontSize: 12,
  },
  shareRiddleBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  shareRiddleText: {
    fontSize: 12,
  },
  riddleRevealRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  revealAnswerBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  revealAnswerText: {
    fontSize: 13,
  },
  shareRiddleSmallBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerRightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  notificationBellBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.2,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationBellIcon: {
    fontSize: 20,
  },
  notificationBellBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  notificationBellBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
  },
  digestShuffleBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.chip,
    borderWidth: 1,
  },
  digestShuffleText: {
    fontSize: 11,
  },
  arcadeTeaserCard: {
    padding: spacing.md,
    borderRadius: radius.card,
    borderWidth: 1.5,
    marginVertical: spacing.xs,
  },
  arcadeTeaserTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  arcadeTeaserTitle: {
    fontSize: 18,
  },
  arcadeTeaserSub: {
    fontSize: 12,
    marginTop: 2,
  },
  arcadeQuickPillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginVertical: spacing.sm,
  },
  quickGamePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.chip,
    borderWidth: 1,
  },
  quickGamePillText: {
    fontSize: 12,
    fontWeight: "600",
  },
  arcadeTeaserCta: {
    height: 42,
    borderRadius: radius.button,
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.xs,
  },
  arcadeTeaserCtaText: {
    color: "#FFFFFF",
    fontSize: 14,
  },
  arcadeHeaderRow: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    paddingHorizontal: 2,
  },
  arcadeSectionTitle: {
    fontSize: 17,
    letterSpacing: 0.3,
  },
  arcadeSectionSub: {
    fontSize: 12,
    marginTop: 2,
  },
  arcadeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  arcadeGridItem: {
    width: "48%",
  },
  arcadeCard: {
    padding: spacing.sm + 2,
    borderRadius: radius.card,
    borderWidth: 1.2,
    minHeight: 180,
    justifyContent: "space-between",
  },
  arcadeCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  arcadeIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  arcadeIconText: {
    fontSize: 22,
  },
  arcadeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  arcadeBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontFamily: fonts.bodyBold,
    letterSpacing: 0.5,
  },
  arcadeItemTitle: {
    fontSize: 14,
    marginBottom: 3,
  },
  arcadeItemSub: {
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 8,
    flex: 1,
  },
  arcadeItemCta: {
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: radius.button,
    alignItems: "center",
    justifyContent: "center",
  },
  arcadeItemCtaText: {
    color: "#FFFFFF",
    fontSize: 11,
    letterSpacing: 0.5,
  },
  offlineBanner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.card,
    borderWidth: 1,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  offlineBannerIcon: {
    fontSize: 18,
  },
  offlineBannerText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  tourGuideBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  tourGuideIcon: {
    fontSize: 14,
  },
  tourGuideText: {
    fontSize: 12,
  },
});

