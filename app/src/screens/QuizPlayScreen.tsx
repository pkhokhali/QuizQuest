import { useNavigation } from "@react-navigation/native";
import React, { useCallback, useEffect, useRef, useState , useMemo} from "react";
import {
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ApiError,
  getDailyQuiz,
  getRevengeQuiz,
  submitDailyQuiz,
  submitRevengeQuiz,
} from "../api/client";
import { AnswerInput, StudentQuestion, SubmitQuizResponse } from "../api/types";
import { Atmosphere } from "../components/Atmosphere";
import { Card } from "../components/Card";
import { EmojiBurst } from "../components/EmojiBurst";
import { ErrorCard } from "../components/ErrorCard";
import { LoadingView } from "../components/LoadingView";
import { OptionButton } from "../components/OptionButton";
import { PrimaryButton } from "../components/PrimaryButton";
import { ScoreRing } from "../components/ScoreRing";
import { StreakFlame } from "../components/StreakFlame";
import { XpBar } from "../components/XpBar";
import { useAuth } from "../state/AuthContext";
import { useI18n } from "../state/LanguageContext";
import { useTheme } from "../state/ThemeContext";
import { ColorTokens, fonts, radius, spacing } from "../theme";
import { logPostScore, logUnlockAchievement } from "../utils/analytics";
import { SoundEffects, useSoundEnabled } from "../utils/audio";
import { ConfettiEffect } from "../components/ConfettiEffect";
import { VictoryAnimation } from "../components/VictoryAnimation";

type Phase = "loading" | "error" | "empty" | "playing" | "submitting" | "results";

interface QuizPlayScreenProps {
  mode: "daily" | "revenge";
}

const ADVANCE_DELAY_MS = 350;
const PER_QUESTION_MS = 30_000;

export function QuizPlayScreen({ mode }: QuizPlayScreenProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { t } = useI18n();
  const navigation = useNavigation();
  const { refreshUser } = useAuth();
  const { isSoundEnabled, toggleSound } = useSoundEnabled();

  const [phase, setPhase] = useState<Phase>("loading");
  const [emptyMessage, setEmptyMessage] = useState<string | undefined>();
  const [quizId, setQuizId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<StudentQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [result, setResult] = useState<SubmitQuizResponse | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  const answersRef = useRef<AnswerInput[]>([]);
  const questionShownAt = useRef(Date.now());
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdown = useRef(new Animated.Value(1)).current;
  const indexRef = useRef(0);
  const questionsRef = useRef<StudentQuestion[]>([]);
  const quizIdRef = useRef<number | null>(null);
  const answeredRef = useRef(false);

  indexRef.current = index;
  questionsRef.current = questions;
  quizIdRef.current = quizId;
  answeredRef.current = answered;

  const load = useCallback(async () => {
    setPhase("loading");
    setEmptyMessage(undefined);
    try {
      const data = mode === "daily" ? await getDailyQuiz() : await getRevengeQuiz();
      if (!data.questions || data.questions.length === 0) {
        setEmptyMessage(mode === "daily" ? t("quizEmptyDaily") : undefined);
        setPhase("empty");
        return;
      }
      setQuizId(data.quizId);
      setQuestions(data.questions);
      answersRef.current = [];
      setIndex(0);
      setSelected(null);
      setAnswered(false);
      questionShownAt.current = Date.now();
      setPhase("playing");
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setPhase("empty");
      } else if (err instanceof ApiError && err.status === 503 && mode === "daily") {
        setEmptyMessage(t("quizEmptyDaily"));
        setPhase("empty");
      } else {
        setPhase("error");
      }
    }
  }, [mode, t]);

  useEffect(() => {
    load();
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    };
  }, [load]);

  const submit = useCallback(
    async (answers: AnswerInput[], id: number) => {
      setPhase("submitting");
      try {
        const res =
          mode === "daily"
            ? await submitDailyQuiz({ quizId: id, answers })
            : await submitRevengeQuiz({ quizId: id, answers });
        setResult(res);
        setPhase("results");
        refreshUser();

        // Log Firebase Analytics events for Play Games leaderboards & achievements
        logPostScore(res.score, mode === "daily" ? "daily_quiz_leaderboard" : "revenge_round_leaderboard");
        if (res.newAwards && Array.isArray(res.newAwards)) {
          for (const award of res.newAwards) {
            logUnlockAchievement(award.code);
          }
        }
      } catch {
        setPhase("error");
      }
    },
    [mode, refreshUser]
  );

  const advance = useCallback(
    (choice: number | null) => {
      const currentIndex = indexRef.current;
      const currentQuestions = questionsRef.current;
      const currentQuizId = quizIdRef.current;
      if (currentQuizId === null) return;

      setAnswered(true);
      setSelected(choice);
      const timeMs = Date.now() - questionShownAt.current;
      answersRef.current.push({
        questionId: currentQuestions[currentIndex].id,
        choice,
        timeMs,
      });

      advanceTimer.current = setTimeout(() => {
        if (currentIndex + 1 < currentQuestions.length) {
          setIndex(currentIndex + 1);
          setSelected(null);
          setAnswered(false);
          questionShownAt.current = Date.now();
        } else {
          submit(answersRef.current, currentQuizId);
        }
      }, ADVANCE_DELAY_MS);
    },
    [submit]
  );

  const onPick = (choice: number) => {
    if (answered || quizId === null) return;
    SoundEffects.playCorrect();
    advance(choice);
  };

  useEffect(() => {
    if (phase !== "playing" || answered) return;

    const deadline = questionShownAt.current + PER_QUESTION_MS;
    let lastTickedSec = -1;
    const tick = () => {
      const remainingSec = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setSecondsLeft(remainingSec);
      if (remainingSec !== lastTickedSec && remainingSec <= 5 && remainingSec > 0) {
        lastTickedSec = remainingSec;
        SoundEffects.playTick();
      }
    };
    tick();
    const interval = setInterval(tick, 250);

    const remainingNow = Math.max(0, deadline - Date.now());
    countdown.setValue(remainingNow / PER_QUESTION_MS);
    const anim = Animated.timing(countdown, {
      toValue: 0,
      duration: remainingNow,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    anim.start();

    const timeout = setTimeout(() => {
      if (answeredRef.current || quizIdRef.current === null) return;
      advance(null);
    }, remainingNow);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
      anim.stop();
    };
  }, [phase, index, answered, advance, countdown]);

  if (phase === "loading") return <LoadingView />;
  if (phase === "submitting") return <LoadingView message={t("quizSubmitting")} />;
  if (phase === "error") return <ErrorCard onRetry={load} />;

  if (phase === "empty") {
    return (
      <Atmosphere>
        <SafeAreaView style={styles.safe}>
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>🌟</Text>
            <Text style={[styles.emptyText, { fontFamily: fonts.bodyBold }]}>
              {emptyMessage ?? t("revengeEmpty")}
            </Text>
            <PrimaryButton label={t("quizBackHome")} onPress={() => navigation.goBack()} />
          </View>
        </SafeAreaView>
      </Atmosphere>
    );
  }

  if (phase === "results" && result) {
    return (
      <ResultsView
        mode={mode}
        result={result}
        questions={questions}
        answers={answersRef.current}
        onDone={() => navigation.goBack()}
      />
    );
  }

  const question = questions[index];
  const progress = (index + (answered ? 1 : 0)) / questions.length;
  const isUrgent = secondsLeft !== null && secondsLeft <= 5;

  return (
    <Atmosphere>
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.close}>
            <Text style={[styles.closeText, { color: colors.textMuted }]}>✕</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.progressText, { color: colors.text, fontFamily: fonts.bodyBold }]}>
              {t("quizProgress", { n: index + 1, total: questions.length })}
            </Text>
          </View>
          <View style={styles.headerRightControls}>
            <TouchableOpacity
              onPress={toggleSound}
              style={[
                styles.soundToggleBtn,
                {
                  backgroundColor: colors.surfaceElevated,
                  borderColor: colors.border,
                },
              ]}
              activeOpacity={0.7}
              accessibilityLabel={isSoundEnabled ? "Mute sound" : "Unmute sound"}
            >
              <Text style={{ fontSize: 16 }}>{isSoundEnabled ? "🔊" : "🔇"}</Text>
            </TouchableOpacity>

            <View style={[styles.timerPill, { backgroundColor: isUrgent ? colors.dangerSoft : colors.surfaceElevated }]}>
              <Text
                style={[
                  styles.seconds,
                  {
                    color: isUrgent ? colors.danger : colors.primary,
                    fontFamily: fonts.bodyBold,
                  },
                ]}
              >
                ⏱ {secondsLeft ?? "-"}s
              </Text>
            </View>
          </View>
        </View>

        <XpBar
          progress={progress}
          color={colors.primary}
          trackColor={colors.primarySoft}
          height={6}
          style={styles.progressBar}
        />

        <View style={styles.countdownTrack}>
          <Animated.View
            style={[
              styles.countdownFill,
              {
                backgroundColor: isUrgent ? colors.danger : colors.accent,
                width: countdown.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "100%"],
                }),
              },
            ]}
          />
        </View>

        <ScrollView
          contentContainerStyle={styles.playContent}
          showsVerticalScrollIndicator={false}
        >
          <Card style={styles.questionCard}>
            <View style={[styles.qNumChip, { backgroundColor: colors.primarySoft }]}>
              <Text style={[styles.qNumText, { color: colors.primary, fontFamily: fonts.bodyBold }]}>
                QUESTION {index + 1} OF {questions.length}
              </Text>
            </View>
            <Text style={[styles.questionText, { color: colors.text, fontFamily: fonts.display }]}>
              {question.text}
            </Text>
          </Card>

          <View style={styles.options}>
            {question.options.map((option, i) => (
              <OptionButton
                key={i}
                index={i}
                label={option}
                state={selected === i ? "selected" : "default"}
                onPress={() => onPick(i)}
                disabled={answered}
              />
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Atmosphere>
  );
}

// ---- Results ----

interface ResultsViewProps {
  mode: "daily" | "revenge";
  result: SubmitQuizResponse;
  questions: StudentQuestion[];
  answers: AnswerInput[];
  onDone: () => void;
}

function ResultsView({ mode, result, questions, answers, onDone }: ResultsViewProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { t, lang } = useI18n();
  const [showVictoryModal, setShowVictoryModal] = useState(result.score > 0);
  const correctMap = new Map(result.correct.map((c) => [c.questionId, c.correctIndex]));
  const answerMap = new Map(answers.map((a) => [a.questionId, a.choice]));

  useEffect(() => {
    if (result.score > 0) {
      SoundEffects.playVictory();
    }
    if (result.streak && result.streak >= 3) {
      setTimeout(() => {
        SoundEffects.playCombo();
      }, 700);
    }
  }, []);

  const isPerfect = result.score === result.total;

  return (
    <Atmosphere>
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <ScrollView
          contentContainerStyle={styles.resultsContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.resultCelebrationBadge, { backgroundColor: colors.goldSoft }]}>
            <Text style={styles.resultBadgeEmoji}>🏆</Text>
            <Text
              style={[
                styles.resultBadgeText,
                { color: colors.gold, fontFamily: fonts.bodyBold },
              ]}
            >
              QUEST COMPLETED
            </Text>
          </View>

          <Text
            style={[
              styles.resultsTitle,
              { color: colors.text, fontFamily: fonts.display },
            ]}
          >
            {mode === "daily" ? t("quizResultsTitle") : t("revengeResultsTitle")}
          </Text>

          <ScoreRing score={result.score} total={result.total} />

          <View style={styles.statsRow}>
            <View
              style={[
                styles.statPill,
                {
                  backgroundColor: colors.primarySoft,
                  borderColor: colors.primary,
                  borderWidth: 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.statValue,
                  { color: colors.primary, fontFamily: fonts.bodyBold },
                ]}
              >
                ⚡ {t("quizXpEarned", { xp: result.xpEarned })}
              </Text>
            </View>
            <View
              style={[
                styles.statPill,
                {
                  backgroundColor: colors.surfaceElevated,
                  borderColor: colors.border,
                  borderWidth: 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.statValue,
                  { color: colors.text, fontFamily: fonts.bodyBold },
                ]}
              >
                🎖️ {t("quizLevelNow", { level: result.level })}
              </Text>
            </View>
          </View>

          {mode === "daily" && (
            <View
              style={[
                styles.streakBox,
                {
                  backgroundColor: colors.accentSoft,
                  borderColor: colors.accent,
                  borderWidth: 1,
                },
              ]}
            >
              <StreakFlame count={result.streak} size={32} />
              <Text
                style={[
                  styles.streakText,
                  { color: colors.accent, fontFamily: fonts.bodyBold },
                ]}
              >
                {t("quizStreakNow", { streak: result.streak })}
              </Text>
            </View>
          )}

          {result.newAwards.length > 0 && (
            <Card
              style={StyleSheet.flatten([
                styles.newAwardsCard,
                {
                  borderColor: colors.gold,
                  borderWidth: 1.5,
                  backgroundColor: colors.surfaceElevated,
                },
              ])}
            >
              <Text
                style={[
                  styles.newAwardsTitle,
                  { color: colors.gold, fontFamily: fonts.bodyBold },
                ]}
              >
                🎁 {t("quizNewAward")}
              </Text>
              {result.newAwards.map((award) => (
                <View key={award.code} style={styles.newAwardRow}>
                  <Text style={styles.newAwardIcon}>{award.icon}</Text>
                  <View style={styles.newAwardText}>
                    <Text
                      style={[
                        styles.newAwardName,
                        { color: colors.text, fontFamily: fonts.bodyBold },
                      ]}
                    >
                      {lang === "ne" && award.nameNe ? award.nameNe : award.nameEn}
                    </Text>
                    <Text
                      style={[
                        styles.newAwardDesc,
                        { color: colors.textMuted, fontFamily: fonts.body },
                      ]}
                    >
                      {lang === "ne" && award.descNe ? award.descNe : award.descEn}
                    </Text>
                  </View>
                </View>
              ))}
            </Card>
          )}

          <Text
            style={[
              styles.reviewTitle,
              { color: colors.text, fontFamily: fonts.display },
            ]}
          >
            {t("quizReviewTitle")}
          </Text>
          <View style={styles.reviewList}>
            {questions.map((q) => {
              const correctIndex = correctMap.get(q.id);
              const myChoice = answerMap.get(q.id);
              const gotIt = correctIndex !== undefined && myChoice === correctIndex;
              return (
                <Card
                  key={q.id}
                  style={StyleSheet.flatten([
                    styles.reviewCard,
                    {
                      borderColor: gotIt ? colors.green : colors.border,
                      borderWidth: 1,
                    },
                  ])}
                >
                  <Text
                    style={[
                      styles.reviewQuestion,
                      { color: colors.text, fontFamily: fonts.bodyBold },
                    ]}
                  >
                    {q.text}
                  </Text>
                  {correctIndex !== undefined && (
                    <View style={styles.reviewOptions}>
                      <OptionButton
                        index={correctIndex}
                        label={q.options[correctIndex]}
                        state="correct"
                      />
                      {!gotIt && myChoice !== null && myChoice !== undefined && (
                        <OptionButton
                          index={myChoice}
                          label={q.options[myChoice]}
                          state="missed"
                        />
                      )}
                    </View>
                  )}
                  <Text
                    style={[
                      gotIt ? styles.reviewNice : styles.reviewMissed,
                      {
                        color: gotIt ? colors.green : colors.amber,
                        fontFamily: fonts.bodyBold,
                      },
                    ]}
                  >
                    {gotIt ? t("quizNiceOne") : t("quizMissedGentle")}
                  </Text>
                </Card>
              );
            })}
          </View>

          <PrimaryButton label={t("quizBackHome")} onPress={onDone} />
        </ScrollView>

        {/* Celebratory Victory Overlay Animations */}
        {result.score > 0 && <ConfettiEffect count={50} />}
        {result.score > 0 && <EmojiBurst />}
        <VictoryAnimation
          visible={showVictoryModal}
          onAnimationComplete={() => setShowVictoryModal(false)}
          message={isPerfect ? "PERFECT SCORE! 👑" : "VICTORY! 🏆"}
          subMessage={
            isPerfect
              ? "Flawless knowledge quest!"
              : `${result.score}/${result.total} correct • Great quest!`
          }
        />
      </SafeAreaView>
    </Atmosphere>
  );
}

function createStyles(colors: ColorTokens) {
  return StyleSheet.create({
    safe: {
      flex: 1,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    headerCenter: {
      flex: 1,
      alignItems: "center",
    },
    close: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    closeText: {
      fontSize: 20,
      fontWeight: "700",
    },
    headerRightControls: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    soundToggleBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
    },
    progressText: {
      fontSize: 14,
    },
    progressBar: {
      marginHorizontal: spacing.lg,
    },
    timerPill: {
      paddingHorizontal: spacing.md,
      paddingVertical: 4,
      borderRadius: radius.chip,
      borderWidth: 1,
      borderColor: colors.border,
    },
    seconds: {
      fontSize: 14,
    },
    countdownTrack: {
      height: 6,
      borderRadius: 3,
      backgroundColor: "rgba(255, 255, 255, 0.08)",
      overflow: "hidden",
      marginHorizontal: spacing.lg,
      marginTop: spacing.sm,
    },
    countdownFill: {
      height: "100%",
      borderRadius: 3,
    },
    playContent: {
      padding: spacing.lg,
      gap: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    questionCard: {
      padding: spacing.xl,
      minHeight: 140,
      justifyContent: "center",
      gap: spacing.sm,
    },
    qNumChip: {
      alignSelf: "flex-start",
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      borderRadius: radius.small,
    },
    qNumText: {
      fontSize: 11,
      letterSpacing: 0.8,
    },
    questionText: {
      fontSize: 20,
      lineHeight: 28,
    },
    options: {
      gap: spacing.md,
    },
    emptyBox: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: spacing.xl,
      gap: spacing.lg,
    },
    emptyEmoji: {
      fontSize: 56,
    },
    emptyText: {
      fontSize: 17,
      textAlign: "center",
    },
    resultsContent: {
      padding: spacing.xl,
      alignItems: "center",
      gap: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    resultCelebrationBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radius.chip,
      marginTop: spacing.md,
    },
    resultBadgeEmoji: {
      fontSize: 16,
    },
    resultBadgeText: {
      fontSize: 11,
      letterSpacing: 1,
    },
    resultsTitle: {
      fontSize: 26,
      textAlign: "center",
    },
    statsRow: {
      flexDirection: "row",
      gap: spacing.md,
    },
    statPill: {
      borderRadius: radius.chip,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
    },
    statValue: {
      fontSize: 15,
    },
    streakBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      borderRadius: radius.chip,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
    },
    streakText: {
      fontSize: 15,
    },
    newAwardsCard: {
      width: "100%",
      gap: spacing.md,
      padding: spacing.lg,
    },
    newAwardsTitle: {
      fontSize: 16,
    },
    newAwardRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },
    newAwardIcon: {
      fontSize: 32,
    },
    newAwardText: {
      flex: 1,
      gap: 2,
    },
    newAwardName: {
      fontSize: 15,
    },
    newAwardDesc: {
      fontSize: 12,
    },
    reviewTitle: {
      fontSize: 20,
      alignSelf: "flex-start",
      marginTop: spacing.sm,
    },
    reviewList: {
      width: "100%",
      gap: spacing.md,
    },
    reviewCard: {
      gap: spacing.md,
      padding: spacing.lg,
    },
    reviewQuestion: {
      fontSize: 15,
      lineHeight: 20,
    },
    reviewOptions: {
      gap: spacing.sm,
    },
    reviewNice: {
      fontSize: 13,
    },
    reviewMissed: {
      fontSize: 13,
    },
  });
}

