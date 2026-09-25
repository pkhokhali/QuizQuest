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
  getPracticeQuiz,
  getRevengeQuiz,
  submitDailyQuiz,
  submitPracticeQuiz,
  submitRevengeQuiz,
} from "../api/client";
import {
  AnswerInput,
  CorrectEntry,
  StudentQuestion,
  SubmitQuizResponse,
} from "../api/types";
import {
  getCachedQuestions,
  OfflineQuestion,
  queueOfflineSubmission,
  saveCachedQuestions,
} from "../utils/offlineStore";
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
  mode: "daily" | "revenge" | "practice";
  initialSubject?: string;
}

const ADVANCE_DELAY_MS = 350;
const PER_QUESTION_MS = 30_000;

export function QuizPlayScreen({ mode: initialMode, initialSubject }: QuizPlayScreenProps) {
  const [currentMode, setCurrentMode] = useState<"daily" | "revenge" | "practice">(initialMode);
  const mode = currentMode;
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { t, lang } = useI18n();
  const navigation = useNavigation();
  const { refreshUser, user } = useAuth();
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
  const [isOfflineMode, setIsOfflineMode] = useState(false);

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
      const data =
        mode === "daily"
          ? await getDailyQuiz()
          : mode === "practice"
          ? await getPracticeQuiz(initialSubject)
          : await getRevengeQuiz();
      if (!data.questions || data.questions.length === 0) {
        setEmptyMessage(mode === "daily" ? t("quizEmptyDaily") : undefined);
        setPhase("empty");
        return;
      }
      setIsOfflineMode(false);
      setQuizId(data.quizId);
      setQuestions(data.questions);
      saveCachedQuestions(data.questions);
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
        // Fallback to offline questions (smart cache + procedural math)
        const gradeBand = user?.grade
          ? user.grade <= 3
            ? "1-3"
            : user.grade <= 5
            ? "4-5"
            : user.grade <= 8
            ? "6-8"
            : "9-10"
          : "4-5";
        const offlineList = await getCachedQuestions({
          subject: initialSubject,
          count: 10,
          gradeBand,
          lang: (user?.language as "en" | "ne") || "en",
        });

        if (offlineList.length > 0) {
          setIsOfflineMode(true);
          setQuizId(999999);
          setQuestions(offlineList);
          answersRef.current = [];
          setIndex(0);
          setSelected(null);
          setAnswered(false);
          questionShownAt.current = Date.now();
          setPhase("playing");
        } else {
          setPhase("error");
        }
      }
    }
  }, [mode, initialSubject, t, user?.grade, user?.homeCountry, user?.language]);

  useEffect(() => {
    load();
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    };
  }, [load]);

  const submit = useCallback(
    async (answers: AnswerInput[], id: number) => {
      setPhase("submitting");

      // Local offline submission evaluation
      if (isOfflineMode || id === 999999) {
        let score = 0;
        const correctEntries: CorrectEntry[] = [];
        questions.forEach((q) => {
          const offQ = q as OfflineQuestion;
          const userAns = answers.find((a) => Number(a.questionId) === Number(q.id));
          const cIdx = typeof offQ.correctIndex === "number" ? offQ.correctIndex : 0;
          correctEntries.push({ questionId: q.id, correctIndex: cIdx });
          if (userAns && userAns.choice !== null && userAns.choice !== undefined && Number(userAns.choice) === cIdx) {
            score++;
          }
        });
        const xpEarned = score * 10;
        const offlineResult: SubmitQuizResponse = {
          score,
          total: questions.length,
          xpEarned,
          xp: (user?.xp ?? 0) + xpEarned,
          level: user?.level ?? 1,
          streak: (user?.streak ?? 0) + (score > 0 ? 1 : 0),
          newAwards: [],
          correct: correctEntries,
        };
        const endpoint =
          mode === "daily"
            ? "/api/quiz/daily/submit"
            : mode === "practice"
            ? "/api/quiz/practice/submit"
            : "/api/quiz/revenge/submit";
        queueOfflineSubmission("quiz", endpoint, {
          quizId: id,
          answers,
          offlineScore: score,
          offlineTimestamp: Date.now(),
        });
        setResult(offlineResult);
        setPhase("results");
        return;
      }

      try {
        const res =
          mode === "daily"
            ? await submitDailyQuiz({ quizId: id, answers })
            : mode === "practice"
            ? await submitPracticeQuiz({ quizId: id, answers })
            : await submitRevengeQuiz({ quizId: id, answers });
        setResult(res);
        setPhase("results");
        refreshUser();

        // Update cached questions with verified correct index for offline play
        if (res.correct && res.correct.length > 0) {
          const questionMap = new Map(questions.map((q) => [q.id, q]));
          const verified = res.correct
            .map((c) => {
              const q = questionMap.get(c.questionId);
              return q ? { ...q, correctIndex: c.correctIndex } : null;
            })
            .filter(Boolean) as (StudentQuestion & { correctIndex: number })[];
          saveCachedQuestions(verified);
        }

        // Log Firebase Analytics events for Play Games leaderboards & achievements
        logPostScore(res.score, mode === "daily" ? "daily_quiz_leaderboard" : "practice_quiz_leaderboard");
        if (res.newAwards && Array.isArray(res.newAwards)) {
          for (const award of res.newAwards) {
            logUnlockAchievement(award.code);
          }
        }
      } catch {
        // Submission network failed - preserve user progress with offline queue
        let score = 0;
        const correctEntries: CorrectEntry[] = [];
        questions.forEach((q) => {
          const offQ = q as OfflineQuestion;
          const userAns = answers.find((a) => Number(a.questionId) === Number(q.id));
          const cIdx = typeof offQ.correctIndex === "number" ? offQ.correctIndex : 0;
          correctEntries.push({ questionId: q.id, correctIndex: cIdx });
          if (userAns && userAns.choice !== null && userAns.choice !== undefined && Number(userAns.choice) === cIdx) {
            score++;
          }
        });
        const xpEarned = score * 10;
        const fallbackResult: SubmitQuizResponse = {
          score,
          total: questions.length,
          xpEarned,
          xp: (user?.xp ?? 0) + xpEarned,
          level: user?.level ?? 1,
          streak: (user?.streak ?? 0) + (score > 0 ? 1 : 0),
          newAwards: [],
          correct: correctEntries,
        };
        const endpoint =
          mode === "daily"
            ? "/api/quiz/daily/submit"
            : mode === "practice"
            ? "/api/quiz/practice/submit"
            : "/api/quiz/revenge/submit";
        queueOfflineSubmission("quiz", endpoint, {
          quizId: id,
          answers,
          offlineScore: score,
          offlineTimestamp: Date.now(),
        });
        setResult(fallbackResult);
        setPhase("results");
      }
    },
    [mode, isOfflineMode, questions, user, refreshUser]
  );

  const advance = useCallback(
    (choice: number | null) => {
      const currentIndex = indexRef.current;
      const currentQuestions = questionsRef.current;
      const currentQuizId = quizIdRef.current;
      if (currentQuizId === null) return;

      if (answeredRef.current) return;
      answeredRef.current = true;
      setAnswered(true);
      setSelected(choice);

      if (advanceTimer.current) {
        clearTimeout(advanceTimer.current);
        advanceTimer.current = null;
      }

      const timeMs = Date.now() - questionShownAt.current;
      const currentQ = currentQuestions[currentIndex];
      if (currentQ) {
        // Deduplicate: replace any existing answer for this question
        answersRef.current = answersRef.current.filter(
          (a) => Number(a.questionId) !== Number(currentQ.id)
        );
        answersRef.current.push({
          questionId: currentQ.id,
          choice,
          timeMs,
        });
      }

      advanceTimer.current = setTimeout(() => {
        if (currentIndex + 1 < currentQuestions.length) {
          setIndex(currentIndex + 1);
          setSelected(null);
          setAnswered(false);
          answeredRef.current = false;
          questionShownAt.current = Date.now();
        } else {
          submit(answersRef.current, currentQuizId);
        }
      }, ADVANCE_DELAY_MS);
    },
    [submit]
  );

  const onPick = (choice: number) => {
    if (answeredRef.current || answered || quizId === null) return;
    SoundEffects.playTap();
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
        onPlayNext={() => {
          setCurrentMode("practice");
          setPhase("loading");
          load();
        }}
      />
    );
  }

  const question = questions[index];
  const progress = (index + (answered ? 1 : 0)) / questions.length;
  const isUrgent = secondsLeft !== null && secondsLeft <= 5;

  return (
    <Atmosphere>
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.close}>
            <Text style={[styles.closeText, { color: colors.textMuted }]}>✕</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.progressText, { color: colors.text, fontFamily: fonts.bodyBold }]}>
              {t("quizProgress", { n: index + 1, total: questions.length })}
            </Text>
            {isOfflineMode && (
              <View style={[styles.offlinePill, { backgroundColor: colors.amberSoft }]}>
                <Text style={[styles.offlinePillText, { color: colors.amber, fontFamily: fonts.bodyBold }]}>
                  📡 {lang === "ne" ? "अफलाइन मोड" : "Offline Mode"}
                </Text>
              </View>
            )}
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
  mode: "daily" | "revenge" | "practice";
  result: SubmitQuizResponse;
  questions: StudentQuestion[];
  answers: AnswerInput[];
  onDone: () => void;
  onPlayNext: () => void;
}

function ResultsView({ mode, result, questions, answers, onDone, onPlayNext }: ResultsViewProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { t, lang } = useI18n();

  const correctMap = useMemo(
    () => new Map(result.correct.map((c) => [Number(c.questionId), c.correctIndex])),
    [result.correct]
  );
  const answerMap = useMemo(
    () => new Map(answers.map((a) => [Number(a.questionId), a.choice])),
    [answers]
  );

  // Compute verified correct count based directly on the questions review items
  const actualCorrectCount = useMemo(() => {
    let count = 0;
    questions.forEach((q) => {
      const correctIndex = correctMap.get(Number(q.id));
      const myChoice = answerMap.get(Number(q.id));
      if (
        correctIndex !== undefined &&
        myChoice !== null &&
        myChoice !== undefined &&
        myChoice === correctIndex
      ) {
        count++;
      }
    });
    return count;
  }, [questions, correctMap, answerMap]);

  const finalScore = Math.max(result.score, actualCorrectCount);
  const totalCount = questions.length || result.total || 8;
  const isPerfect = totalCount > 0 && finalScore === totalCount;
  const [showVictoryModal, setShowVictoryModal] = useState(finalScore > 0);

  useEffect(() => {
    if (finalScore > 0) {
      SoundEffects.playVictory();
    }
    if (result.streak && result.streak >= 3) {
      setTimeout(() => {
        SoundEffects.playCombo();
      }, 700);
    }
  }, [finalScore, result.streak]);

  return (
    <Atmosphere>
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
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
            {mode === "daily"
              ? t("quizResultsTitle")
              : mode === "practice"
              ? t("quizPracticeTitle")
              : t("revengeResultsTitle")}
          </Text>

          <ScoreRing score={finalScore} total={totalCount} />

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
              const correctIndex = correctMap.get(Number(q.id));
              const myChoice = answerMap.get(Number(q.id));
              const gotIt =
                correctIndex !== undefined &&
                myChoice !== null &&
                myChoice !== undefined &&
                myChoice === correctIndex;
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

          <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
            <PrimaryButton
              label={t("quizNextRound")}
              onPress={onPlayNext}
            />
            <TouchableOpacity
              onPress={onDone}
              style={{
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 14,
                borderRadius: radius.card,
                backgroundColor: colors.surfaceElevated,
                borderColor: colors.border,
                borderWidth: 1,
              }}
              activeOpacity={0.8}
            >
              <Text style={{ color: colors.textMuted, fontFamily: fonts.bodyBold, fontSize: 15 }}>
                {t("quizBackHome")}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Celebratory Victory Overlay Animations */}
        {finalScore > 0 && <ConfettiEffect count={50} />}
        {finalScore > 0 && <EmojiBurst />}
        <VictoryAnimation
          visible={showVictoryModal}
          onAnimationComplete={() => setShowVictoryModal(false)}
          message={isPerfect ? "PERFECT SCORE! 👑" : "VICTORY! 🏆"}
          subMessage={
            isPerfect
              ? "Flawless knowledge quest!"
              : `${finalScore}/${totalCount} correct • Great quest!`
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
    offlinePill: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: radius.pill,
      marginTop: 2,
    },
    offlinePillText: {
      fontSize: 11,
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

