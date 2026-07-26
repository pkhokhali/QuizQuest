import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useEffect, useRef, useState , useMemo} from "react";
import {
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  BattleEndEvent,
  BattleQuestionEvent,
  BattleRevealEvent,
} from "../api/types";
import { AvatarCircle } from "../components/AvatarCircle";
import { Card } from "../components/Card";
import { EmojiBurst } from "../components/EmojiBurst";
import { OptionButton, OptionState } from "../components/OptionButton";
import { PrimaryButton } from "../components/PrimaryButton";
import { getBattleSocket, getLastQuestion } from "../socket/battleSocket";
import { RootStackParamList } from "../navigation/types";
import { useAuth } from "../state/AuthContext";
import { useI18n } from "../state/LanguageContext";
import { useTheme } from "../state/ThemeContext";
import { radius, spacing, ColorTokens } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "BattleLive">;

export function BattleLiveScreen({ route, navigation }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { start } = route.params;
  const { t, lang } = useI18n();
  const { user, refreshUser } = useAuth();

  const [question, setQuestion] = useState<BattleQuestionEvent | null>(
    getLastQuestion()
  );
  const [choice, setChoice] = useState<number | null>(null);
  const [reveal, setReveal] = useState<BattleRevealEvent | null>(null);
  const [scores, setScores] = useState({ you: 0, them: 0 });
  const [end, setEnd] = useState<BattleEndEvent | null>(null);
  const [opponentLeft, setOpponentLeft] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  const questionShownAt = useRef(Date.now());
  const countdown = useRef(new Animated.Value(1)).current;

  // Socket listeners
  useEffect(() => {
    const socket = getBattleSocket();
    if (!socket) return;

    const onQuestion = (e: BattleQuestionEvent) => {
      setQuestion(e);
      setChoice(null);
      setReveal(null);
      questionShownAt.current = Date.now();
    };
    const onReveal = (e: BattleRevealEvent) => {
      setReveal(e);
      setScores(e.scores);
    };
    const onEnd = (e: BattleEndEvent) => {
      setEnd(e);
      setScores(e.scores);
      refreshUser();
    };
    const onLeft = () => {
      setOpponentLeft(true);
      refreshUser();
    };

    socket.on("battle:question", onQuestion);
    socket.on("battle:reveal", onReveal);
    socket.on("battle:end", onEnd);
    socket.on("battle:opponent_left", onLeft);

    return () => {
      socket.off("battle:question", onQuestion);
      socket.off("battle:reveal", onReveal);
      socket.off("battle:end", onEnd);
      socket.off("battle:opponent_left", onLeft);
    };
  }, [refreshUser]);

  // Countdown driven by the server deadline
  useEffect(() => {
    if (!question || reveal) return;
    const total = start.perQuestionMs;

    const tick = () => {
      const remaining = Math.max(0, question.deadlineTs - Date.now());
      setSecondsLeft(Math.ceil(remaining / 1000));
      countdown.setValue(remaining / total);
    };
    tick();
    const interval = setInterval(tick, 250);

    const remainingNow = Math.max(0, question.deadlineTs - Date.now());
    const anim = Animated.timing(countdown, {
      toValue: 0,
      duration: remainingNow,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    anim.start();

    return () => {
      clearInterval(interval);
      anim.stop();
    };
  }, [question, reveal, start.perQuestionMs, countdown]);

  const answer = (i: number) => {
    if (choice !== null || reveal || !question) return;
    const socket = getBattleSocket();
    if (!socket) return;
    setChoice(i);
    socket.emit("battle:answer", {
      battleId: start.battleId,
      questionIndex: question.index,
      choice: i,
      timeMs: Date.now() - questionShownAt.current,
    });
  };

  // ---- End states ----
  if (opponentLeft || end) {
    const result = opponentLeft ? "win" : end!.result;
    const title = opponentLeft
      ? t("liveOpponentLeft")
      : result === "win"
      ? t("liveVictory")
      : result === "draw"
      ? t("liveDraw")
      : t("liveCloseLoss");
    const emoji = result === "win" ? "🏆" : result === "draw" ? "🤝" : "💪";

    return (
      <SafeAreaView style={styles.safe}>
        {result === "win" && <EmojiBurst />}
        <View style={styles.endBox}>
          <Text style={styles.endEmoji}>{emoji}</Text>
          <Text style={styles.endTitle}>{title}</Text>
          <View style={styles.endScores}>
            <Text style={styles.endScoreText}>
              {t("liveYou")}  {scores.you} : {scores.them}  {start.opponent.name}
            </Text>
          </View>
          {end && (
            <View style={styles.xpPill}>
              <Text style={styles.xpText}>{t("liveXpEarned", { xp: end.xpEarned })}</Text>
            </View>
          )}
          {end && end.newAwards.length > 0 && (
            <Card color={colors.cream} style={styles.awardsCard}>
              <Text style={styles.awardsTitle}>🎁 {t("quizNewAward")}</Text>
              {end.newAwards.map((award) => (
                <Text key={award.code} style={styles.awardLine}>
                  {award.icon}{" "}
                  {lang === "ne" && award.nameNe ? award.nameNe : award.nameEn}
                </Text>
              ))}
            </Card>
          )}
          <PrimaryButton
            label={t("liveBackToBattles")}
            onPress={() => navigation.goBack()}
          />
        </View>
      </SafeAreaView>
    );
  }

  // ---- Live play ----
  const optionState = (i: number): OptionState => {
    if (reveal) {
      if (i === reveal.correctIndex) return "correct";
      if (reveal.yourChoice === i && reveal.yourChoice !== reveal.correctIndex)
        return "missed";
      return "dimmed";
    }
    return choice === i ? "selected" : "default";
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header: you vs opponent */}
      <View style={styles.header}>
        <View style={styles.player}>
          {user && <AvatarCircle avatar={user.avatar} size={44} />}
          <Text style={styles.playerName} numberOfLines={1}>
            {t("liveYou")}
          </Text>
          <Text style={styles.playerScore}>{scores.you}</Text>
        </View>
        <Text style={styles.vs}>VS</Text>
        <View style={styles.player}>
          <AvatarCircle avatar={start.opponent.avatar} size={44} />
          <Text style={styles.playerName} numberOfLines={1}>
            {start.opponent.name}
          </Text>
          <Text style={styles.playerScore}>{scores.them}</Text>
        </View>
      </View>

      {/* Live score bar */}
      <View style={styles.scoreBar}>
        <View
          style={[
            styles.scoreFillYou,
            {
              flex: scores.you + scores.them === 0 ? 1 : Math.max(scores.you, 0.001),
            },
          ]}
        />
        <View
          style={[
            styles.scoreFillThem,
            {
              flex: scores.you + scores.them === 0 ? 1 : Math.max(scores.them, 0.001),
            },
          ]}
        />
      </View>

      {question ? (
        <ScrollView contentContainerStyle={styles.playContent}>
          <View style={styles.countdownRow}>
            <Text style={styles.questionIndex}>
              {t("quizProgress", {
                n: question.index + 1,
                total: start.totalQuestions,
              })}
            </Text>
            <Text style={styles.seconds}>⏱ {secondsLeft ?? "-"}s</Text>
          </View>
          <View style={styles.countdownTrack}>
            <Animated.View
              style={[
                styles.countdownFill,
                {
                  width: countdown.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0%", "100%"],
                  }),
                },
              ]}
            />
          </View>

          <Card style={styles.questionCard}>
            <Text style={styles.questionText}>{question.question.text}</Text>
          </Card>

          <View style={styles.options}>
            {question.question.options.map((option, i) => (
              <OptionButton
                key={i}
                index={i}
                label={option}
                state={optionState(i)}
                onPress={() => answer(i)}
                disabled={choice !== null || !!reveal}
              />
            ))}
          </View>

          {reveal && reveal.yourChoice !== reveal.correctIndex && (
            <Text style={styles.closeOne}>{t("quizCloseOne")}</Text>
          )}
        </ScrollView>
      ) : (
        <View style={styles.waitingBox}>
          <Text style={styles.waitingEmoji}>🥁</Text>
          <Text style={styles.waitingText}>{t("liveGetReady")}</Text>
        </View>
      )}
    </SafeAreaView>
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
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  player: {
    alignItems: "center",
    gap: spacing.xs,
    width: 110,
  },
  playerName: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.text,
  },
  playerScore: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.primary,
  },
  vs: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.textMuted,
  },
  scoreBar: {
    flexDirection: "row",
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    marginHorizontal: spacing.xl,
    backgroundColor: colors.border,
  },
  scoreFillYou: {
    backgroundColor: colors.primary,
  },
  scoreFillThem: {
    backgroundColor: colors.accent,
  },
  playContent: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  countdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  questionIndex: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.textMuted,
  },
  seconds: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.accent,
  },
  countdownTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primarySoft,
    overflow: "hidden",
  },
  countdownFill: {
    height: "100%",
    borderRadius: 5,
    backgroundColor: colors.accent,
  },
  questionCard: {
    padding: spacing.xl,
    minHeight: 120,
    justifyContent: "center",
  },
  questionText: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    lineHeight: 28,
  },
  options: {
    gap: spacing.md,
  },
  closeOne: {
    textAlign: "center",
    fontSize: 15,
    fontWeight: "800",
    color: colors.amber,
  },
  waitingBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  waitingEmoji: {
    fontSize: 56,
  },
  waitingText: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.textMuted,
  },
  endBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.lg,
  },
  endEmoji: {
    fontSize: 72,
  },
  endTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
  },
  endScores: {
    backgroundColor: colors.card,
    borderRadius: radius.chip,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  endScoreText: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
  },
  xpPill: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.chip,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  xpText: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.primaryDark,
  },
  awardsCard: {
    width: "100%",
    gap: spacing.sm,
  },
  awardsTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
  },
  awardLine: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
});
}

