import { useNavigation } from "@react-navigation/native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
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
import { colors, radius, spacing } from "../theme";

type Phase = "loading" | "error" | "empty" | "playing" | "submitting" | "results";

interface QuizPlayScreenProps {
  mode: "daily" | "revenge";
}

const ADVANCE_DELAY_MS = 350;

export function QuizPlayScreen({ mode }: QuizPlayScreenProps) {
  const { t } = useI18n();
  const navigation = useNavigation();
  const { refreshUser } = useAuth();

  const [phase, setPhase] = useState<Phase>("loading");
  const [quizId, setQuizId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<StudentQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<SubmitQuizResponse | null>(null);

  const answersRef = useRef<AnswerInput[]>([]);
  const questionShownAt = useRef(Date.now());
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    setPhase("loading");
    try {
      const data = mode === "daily" ? await getDailyQuiz() : await getRevengeQuiz();
      if (!data.questions || data.questions.length === 0) {
        setPhase("empty");
        return;
      }
      setQuizId(data.quizId);
      setQuestions(data.questions);
      answersRef.current = [];
      setIndex(0);
      setSelected(null);
      questionShownAt.current = Date.now();
      setPhase("playing");
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setPhase("empty");
      } else {
        setPhase("error");
      }
    }
  }, [mode]);

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
      } catch {
        setPhase("error");
      }
    },
    [mode, refreshUser]
  );

  const onPick = (choice: number) => {
    if (selected !== null || quizId === null) return;
    setSelected(choice);
    const timeMs = Date.now() - questionShownAt.current;
    answersRef.current.push({
      questionId: questions[index].id,
      choice,
      timeMs,
    });

    advanceTimer.current = setTimeout(() => {
      if (index + 1 < questions.length) {
        setIndex(index + 1);
        setSelected(null);
        questionShownAt.current = Date.now();
      } else {
        submit(answersRef.current, quizId);
      }
    }, ADVANCE_DELAY_MS);
  };

  if (phase === "loading") return <LoadingView />;
  if (phase === "submitting") return <LoadingView message={t("quizSubmitting")} />;
  if (phase === "error") return <ErrorCard onRetry={load} />;

  if (phase === "empty") {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.emptyBox}>
          <Text style={styles.emptyEmoji}>🌟</Text>
          <Text style={styles.emptyText}>{t("revengeEmpty")}</Text>
          <PrimaryButton label={t("quizBackHome")} onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
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
  const progress = (index + (selected !== null ? 1 : 0)) / questions.length;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.close}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.progressText}>
          {t("quizProgress", { n: index + 1, total: questions.length })}
        </Text>
        <View style={styles.close} />
      </View>
      <XpBar
        progress={progress}
        color={colors.primary}
        trackColor={colors.primarySoft}
        height={8}
        style={styles.progressBar}
      />

      <ScrollView contentContainerStyle={styles.playContent}>
        <Card style={styles.questionCard}>
          <Text style={styles.questionText}>{question.text}</Text>
        </Card>

        <View style={styles.options}>
          {question.options.map((option, i) => (
            <OptionButton
              key={i}
              index={i}
              label={option}
              state={selected === i ? "selected" : "default"}
              onPress={() => onPick(i)}
              disabled={selected !== null}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
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
  const { t, lang } = useI18n();
  const correctMap = new Map(result.correct.map((c) => [c.questionId, c.correctIndex]));
  const answerMap = new Map(answers.map((a) => [a.questionId, a.choice]));

  return (
    <SafeAreaView style={styles.safe}>
      <EmojiBurst />
      <ScrollView contentContainerStyle={styles.resultsContent}>
        <Text style={styles.resultsTitle}>
          {mode === "daily" ? t("quizResultsTitle") : t("revengeResultsTitle")}
        </Text>

        <ScoreRing score={result.score} total={result.total} />

        <View style={styles.statsRow}>
          <View style={styles.statPill}>
            <Text style={styles.statValue}>{t("quizXpEarned", { xp: result.xpEarned })}</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statValue}>{t("quizLevelNow", { level: result.level })}</Text>
          </View>
        </View>

        {mode === "daily" && (
          <View style={styles.streakBox}>
            <StreakFlame count={result.streak} size={36} />
            <Text style={styles.streakText}>
              {t("quizStreakNow", { streak: result.streak })}
            </Text>
          </View>
        )}

        {result.newAwards.length > 0 && (
          <Card color={colors.cream} style={styles.newAwardsCard}>
            <Text style={styles.newAwardsTitle}>🎁 {t("quizNewAward")}</Text>
            {result.newAwards.map((award) => (
              <View key={award.code} style={styles.newAwardRow}>
                <Text style={styles.newAwardIcon}>{award.icon}</Text>
                <View style={styles.newAwardText}>
                  <Text style={styles.newAwardName}>
                    {lang === "ne" && award.nameNe ? award.nameNe : award.nameEn}
                  </Text>
                  <Text style={styles.newAwardDesc}>
                    {lang === "ne" && award.descNe ? award.descNe : award.descEn}
                  </Text>
                </View>
              </View>
            ))}
          </Card>
        )}

        <Text style={styles.reviewTitle}>{t("quizReviewTitle")}</Text>
        <View style={styles.reviewList}>
          {questions.map((q) => {
            const correctIndex = correctMap.get(q.id);
            const myChoice = answerMap.get(q.id);
            const gotIt = correctIndex !== undefined && myChoice === correctIndex;
            return (
              <Card key={q.id} style={styles.reviewCard}>
                <Text style={styles.reviewQuestion}>{q.text}</Text>
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
                <Text style={gotIt ? styles.reviewNice : styles.reviewMissed}>
                  {gotIt ? t("quizNiceOne") : t("quizMissedGentle")}
                </Text>
              </Card>
            );
          })}
        </View>

        <PrimaryButton label={t("quizBackHome")} onPress={onDone} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  close: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    fontSize: 20,
    color: colors.textMuted,
    fontWeight: "700",
  },
  progressText: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.text,
  },
  progressBar: {
    marginHorizontal: spacing.lg,
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
  },
  questionText: {
    fontSize: 21,
    fontWeight: "700",
    color: colors.text,
    lineHeight: 30,
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
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
  resultsContent: {
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  resultsTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
    marginTop: spacing.lg,
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  statPill: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.chip,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.primaryDark,
  },
  streakBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.chip,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  streakText: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.accent,
  },
  newAwardsCard: {
    width: "100%",
    gap: spacing.md,
  },
  newAwardsTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.text,
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
  },
  newAwardName: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.text,
  },
  newAwardDesc: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: "600",
  },
  reviewTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
    alignSelf: "flex-start",
  },
  reviewList: {
    width: "100%",
    gap: spacing.md,
  },
  reviewCard: {
    gap: spacing.md,
  },
  reviewQuestion: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  reviewOptions: {
    gap: spacing.sm,
  },
  reviewNice: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.green,
  },
  reviewMissed: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.amber,
  },
});
