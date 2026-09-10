import { useFocusEffect, useNavigation } from "@react-navigation/native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { addFriend, getBattleHistory, getFriends, getMySchool } from "../api/client";
import {
  BattleHistoryItem,
  BattleStartEvent,
  ChallengeIncomingEvent,
  Friend,
  QueueWaitingEvent,
  SchoolClanMember,
} from "../api/types";
import { AvatarCircle } from "../components/AvatarCircle";
import { Atmosphere } from "../components/Atmosphere";
import { Card } from "../components/Card";
import { PrimaryButton } from "../components/PrimaryButton";
import { IconShield } from "../components/QuestIcons";
import { connectBattleSocket, getBattleSocket } from "../socket/battleSocket";
import { useTabScreenPadding } from "../navigation/useTabScreenPadding";
import { useAuth } from "../state/AuthContext";
import { useI18n } from "../state/LanguageContext";
import { useTheme } from "../state/ThemeContext";
import { ColorTokens, fonts, radius, spacing } from "../theme";

export function BattleScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { t } = useI18n();
  const { token, user } = useAuth();
  const navigation = useNavigation();
  const tabPadding = useTabScreenPadding();

  const [searching, setSearching] = useState(false);
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [incoming, setIncoming] = useState<ChallengeIncomingEvent | null>(null);
  const [friends, setFriends] = useState<Friend[] | null>(null);
  const [history, setHistory] = useState<BattleHistoryItem[] | null>(null);
  const [friendCodeInput, setFriendCodeInput] = useState("");
  const [addingFriend, setAddingFriend] = useState(false);
  const [addError, setAddError] = useState(false);
  const [codeShared, setCodeShared] = useState(false);
  const [challengedIds, setChallengedIds] = useState<number[]>([]);
  const [schoolMembers, setSchoolMembers] = useState<SchoolClanMember[] | null>(null);
  const [schoolName, setSchoolName] = useState<string | null>(null);

  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!searching) return;
    spin.setValue(0);
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [searching, spin]);

  const loadData = useCallback(async () => {
    try {
      const [f, h, s] = await Promise.all([
        getFriends(),
        getBattleHistory(),
        getMySchool(),
      ]);
      setFriends(f.friends);
      setHistory(h.battles);
      if (s.school) {
        setSchoolName(s.school.name);
        // Show other members (not the current user)
        setSchoolMembers(s.school.members.filter((m) => !m.isMe));
      } else {
        setSchoolMembers([]);
        setSchoolName(null);
      }
    } catch {
      setFriends((prev) => prev ?? []);
      setHistory((prev) => prev ?? []);
      setSchoolMembers((prev) => prev ?? []);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Reset challenged state so re-challenges work after returning from battle
      setChallengedIds([]);
      loadData();
    }, [loadData])
  );

  // Socket wiring: listen for match start + incoming challenges while on this tab.
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    let socket: ReturnType<typeof getBattleSocket>;

    const onWaiting = (e: QueueWaitingEvent) => setQueuePosition(e.position);
    const onIncoming = (e: ChallengeIncomingEvent) => setIncoming(e);
    const onStart = (e: BattleStartEvent) => {
      setSearching(false);
      setQueuePosition(null);
      setIncoming(null);
      navigation.navigate("BattleLive", { start: e });
    };

    (async () => {
      socket = await connectBattleSocket(token);
      if (cancelled || !socket) return;
      socket.on("queue:waiting", onWaiting);
      socket.on("challenge:incoming", onIncoming);
      socket.on("battle:start", onStart);
    })();

    return () => {
      cancelled = true;
      socket?.off("queue:waiting", onWaiting);
      socket?.off("challenge:incoming", onIncoming);
      socket?.off("battle:start", onStart);
    };
  }, [token, navigation]);

  const startQueue = async () => {
    if (!token) return;
    const socket = await connectBattleSocket(token);
    socket.emit("queue:join", {});
    setSearching(true);
    setQueuePosition(null);
  };

  const startBotBattle = async () => {
    if (!token) return;
    const socket = await connectBattleSocket(token);
    socket.emit("battle:bot");
    setSearching(true);
    setQueuePosition(null);
  };

  const cancelQueue = async () => {
    const socket = await connectBattleSocket(token ?? "");
    socket.emit("queue:leave", {});
    setSearching(false);
    setQueuePosition(null);
  };

  const sendChallenge = async (friendUserId: number) => {
    if (!token) return;
    const socket = await connectBattleSocket(token);
    socket.emit("challenge:send", { friendUserId });
    setChallengedIds((prev) => [...prev, friendUserId]);
  };

  const acceptChallenge = async () => {
    if (!token || !incoming) return;
    const socket = await connectBattleSocket(token);
    socket.emit("challenge:accept", {
      challengeId: incoming.challengeId,
    });
    setIncoming(null);
  };

  const onAddFriend = async () => {
    const code = friendCodeInput.trim();
    if (!code) return;
    setAddError(false);
    setAddingFriend(true);
    try {
      const { friend } = await addFriend(code);
      setFriends((prev) => [...(prev ?? []), friend]);
      setFriendCodeInput("");
    } catch {
      setAddError(true);
    } finally {
      setAddingFriend(false);
    }
  };

  const shareCode = async () => {
    if (!user) return;
    try {
      await Share.share({ message: user.friendCode });
      setCodeShared(true);
      setTimeout(() => setCodeShared(false), 2000);
    } catch {
      // Share sheet dismissed — nothing to do.
    }
  };

  const rotation = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Atmosphere>
      <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: tabPadding }]}>
        <View style={styles.titleRow}>
          <IconShield size={32} color={colors.primary} secondary={colors.accent} />
          <Text style={[styles.title, { fontFamily: fonts.display }]}>{t("battleTitle")}</Text>
        </View>

        {/* Incoming challenge banner */}
        {incoming && (
          <Card color={colors.accentSoft} style={styles.incomingCard}>
            <View style={styles.incomingRow}>
              <AvatarCircle avatar={incoming.from.avatar} size={44} />
              <Text style={styles.incomingText}>
                {t("battleIncoming", { name: incoming.from.name })}
              </Text>
            </View>
            <View style={styles.incomingButtons}>
              <TouchableOpacity style={styles.acceptBtn} onPress={acceptChallenge}>
                <Text style={styles.acceptText}>{t("battleAccept")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.declineBtn}
                onPress={() => setIncoming(null)}
              >
                <Text style={styles.declineText}>{t("battleDecline")}</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}

        {/* Quick battle hero */}
        <Card
          style={StyleSheet.flatten([
            styles.heroCard,
            {
              backgroundColor: colors.surfaceElevated,
              borderColor: colors.accent,
              borderWidth: 1.5,
            },
          ])}
        >
          {searching ? (
            <View style={styles.searchingBox}>
              <Animated.Text
                style={[styles.searchingEmoji, { transform: [{ rotate: rotation }] }]}
              >
                ⚔️
              </Animated.Text>
              <Text
                style={[
                  styles.searchingText,
                  { color: colors.text, fontFamily: fonts.display },
                ]}
              >
                {t("battleSearching")}
              </Text>
              {queuePosition !== null && (
                <Text
                  style={[
                    styles.queueText,
                    { color: colors.textMuted, fontFamily: fonts.body },
                  ]}
                >
                  {t("battleQueuePosition", { position: queuePosition })}
                </Text>
              )}
              <PrimaryButton
                label={t("battleCancelSearch")}
                onPress={cancelQueue}
                variant="ghost"
              />
            </View>
          ) : (
            <View style={styles.heroBox}>
              <View style={[styles.heroEmojiBox, { backgroundColor: colors.accentSoft }]}>
                <Text style={styles.heroEmoji}>⚡</Text>
              </View>
              <Text
                style={[
                  styles.heroTitle,
                  { color: colors.text, fontFamily: fonts.display },
                ]}
              >
                {t("battleQuick")}
              </Text>
              <Text
                style={[
                  styles.heroSub,
                  { color: colors.textMuted, fontFamily: fonts.body },
                ]}
              >
                {t("battleQuickSub")}
              </Text>
              <View style={styles.heroButtonCol}>
                <PrimaryButton
                  label={t("battleQuick")}
                  onPress={startQueue}
                  variant="accent"
                />
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[styles.botPracticeBtn, { borderColor: colors.primary, backgroundColor: colors.primarySoft }]}
                  onPress={startBotBattle}
                >
                  <Text style={[styles.botPracticeText, { color: colors.primary, fontFamily: fonts.bodyBold }]}>
                    🤖 Practice with AI Bot (Instant · 0s)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Card>

        {/* Friends */}
        <Text style={styles.sectionTitle}>{t("battleFriends")}</Text>

        <Card style={styles.codeCard}>
          <View>
            <Text style={styles.codeLabel}>{t("battleYourCode")}</Text>
            <Text style={styles.codeValue}>{user?.friendCode ?? "—"}</Text>
          </View>
          <TouchableOpacity style={styles.copyBtn} onPress={shareCode}>
            <Text style={styles.copyText}>{codeShared ? t("copied") : "📤"}</Text>
          </TouchableOpacity>
        </Card>

        <View style={styles.addRow}>
          <TextInput
            style={styles.addInput}
            value={friendCodeInput}
            onChangeText={setFriendCodeInput}
            placeholder={t("battleFriendCodePlaceholder")}
            placeholderTextColor={colors.textMuted}
            autoCapitalize="characters"
          />
          <TouchableOpacity
            style={styles.addBtn}
            onPress={onAddFriend}
            disabled={addingFriend}
          >
            {addingFriend ? (
              <ActivityIndicator color={colors.textOnPrimary} />
            ) : (
              <Text style={styles.addBtnText}>{t("battleAddFriend")}</Text>
            )}
          </TouchableOpacity>
        </View>
        {addError ? <Text style={styles.addError}>{t("errorFriendly")}</Text> : null}

        {friends === null ? (
          <ActivityIndicator color={colors.primary} />
        ) : friends.length === 0 ? (
          <Text style={styles.emptyText}>{t("battleNoFriends")}</Text>
        ) : (
          <View style={styles.friendList}>
            {friends.map((friend) => (
              <Card key={friend.userId} style={styles.friendCard}>
                <AvatarCircle avatar={friend.avatar} size={44} />
                <View style={styles.friendBody}>
                  <Text style={styles.friendName}>{friend.name}</Text>
                  <Text style={styles.friendMeta}>
                    {t("homeLevel", { level: friend.level })} · 🔥{friend.streak}
                    {friend.online ? `  · 🟢 ${t("battleOnline")}` : ""}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.challengeBtn,
                    challengedIds.includes(friend.userId) && styles.challengeSent,
                  ]}
                  onPress={() => sendChallenge(friend.userId)}
                  disabled={challengedIds.includes(friend.userId)}
                >
                  <Text style={styles.challengeText}>
                    {challengedIds.includes(friend.userId) ? "✓" : t("battleChallenge")}
                  </Text>
                </TouchableOpacity>
              </Card>
            ))}
          </View>
        )}

        {/* School Members */}
        {schoolMembers !== null && schoolMembers.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>
              🏫 {schoolName ?? "School"} Members
            </Text>
            <Text style={styles.schoolSubtitle}>
              Challenge your classmates directly — no friend code needed!
            </Text>
            <View style={styles.friendList}>
              {schoolMembers.map((member) => {
                const alreadyFriend = (friends ?? []).some(
                  (f) => f.userId === member.id
                );
                return (
                  <Card key={member.id} style={styles.friendCard}>
                    <AvatarCircle avatar={member.avatar} size={44} />
                    <View style={styles.friendBody}>
                      <Text style={styles.friendName}>{member.name}</Text>
                      <Text style={styles.friendMeta}>
                        {member.grade ? `Grade ${member.grade} · ` : ""}
                        ⭐ {member.xp} XP · 🔥{member.streak}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.challengeBtn,
                        challengedIds.includes(member.id) && styles.challengeSent,
                      ]}
                      onPress={() => sendChallenge(member.id)}
                      disabled={challengedIds.includes(member.id)}
                    >
                      <Text style={styles.challengeText}>
                        {challengedIds.includes(member.id)
                          ? "✓"
                          : t("battleChallenge")}
                      </Text>
                    </TouchableOpacity>
                  </Card>
                );
              })}
            </View>
          </>
        )}

        {/* History */}
        <Text style={styles.sectionTitle}>{t("battleHistory")}</Text>
        {history === null ? (
          <ActivityIndicator color={colors.primary} />
        ) : history.length === 0 ? (
          <Text style={styles.emptyText}>{t("battleNoHistory")}</Text>
        ) : (
          <View style={styles.historyList}>
            {history.map((battle) => (
              <Card key={battle.id} style={styles.historyCard}>
                <Text style={styles.historyEmoji}>
                  {battle.result === "win" ? "🏆" : battle.result === "draw" ? "🤝" : "💫"}
                </Text>
                <View style={styles.historyBody}>
                  <Text style={styles.historyName}>{battle.opponentName}</Text>
                  <Text style={styles.historyDate}>{battle.date}</Text>
                </View>
                <View style={styles.historyRight}>
                  <Text style={styles.historyScore}>
                    {battle.myScore} : {battle.theirScore}
                  </Text>
                  <Text
                    style={[
                      styles.historyResult,
                      battle.result === "win"
                        ? styles.winText
                        : battle.result === "draw"
                        ? styles.drawText
                        : styles.lossText,
                    ]}
                  >
                    {battle.result === "win"
                      ? t("battleWin")
                      : battle.result === "draw"
                      ? t("battleDraw")
                      : t("battleLoss")}
                  </Text>
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
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
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.text,
  },
  incomingCard: {
    gap: spacing.md,
  },
  incomingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  incomingText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
  },
  incomingButtons: {
    flexDirection: "row",
    gap: spacing.md,
  },
  acceptBtn: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: radius.chip,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  acceptText: {
    color: colors.textOnPrimary,
    fontWeight: "800",
    fontSize: 15,
  },
  declineBtn: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.chip,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  declineText: {
    color: colors.textMuted,
    fontWeight: "700",
    fontSize: 15,
  },
  heroCard: {
    padding: spacing.xl,
    gap: spacing.md,
  },
  heroBox: {
    alignItems: "center",
    gap: spacing.sm,
  },
  heroEmojiBox: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  heroEmoji: {
    fontSize: 36,
  },
  heroTitle: {
    fontSize: 22,
    textAlign: "center",
  },
  heroSub: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: spacing.xs,
  },
  heroButtonCol: {
    width: "100%",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  botPracticeBtn: {
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.button,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  botPracticeText: {
    fontSize: 14,
    fontWeight: "700",
  },
  searchingBox: {
    alignItems: "center",
    gap: spacing.md,
  },
  searchingEmoji: {
    fontSize: 48,
  },
  searchingText: {
    fontSize: 20,
    textAlign: "center",
  },
  queueText: {
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: fonts.display,
    color: colors.text,
    marginTop: spacing.sm,
  },
  schoolSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: "600",
    marginTop: -spacing.sm,
  },
  codeCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  codeLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
  },
  codeValue: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: 1,
  },
  copyBtn: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.chip,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  copyText: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.primaryDark,
  },
  addRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  addInput: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.chip,
    borderWidth: 2,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  addBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.chip,
    paddingHorizontal: spacing.lg,
    justifyContent: "center",
    minWidth: 100,
    alignItems: "center",
  },
  addBtnText: {
    color: colors.textOnPrimary,
    fontWeight: "800",
    fontSize: 14,
  },
  addError: {
    color: colors.accent,
    fontWeight: "600",
    fontSize: 13,
  },
  emptyText: {
    color: colors.textMuted,
    fontWeight: "600",
    fontSize: 14,
  },
  friendList: {
    gap: spacing.md,
  },
  friendCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  friendBody: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
  },
  friendMeta: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: "600",
  },
  challengeBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.chip,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  challengeSent: {
    backgroundColor: colors.greenSoft,
  },
  challengeText: {
    color: colors.textOnPrimary,
    fontWeight: "800",
    fontSize: 13,
  },
  historyList: {
    gap: spacing.md,
  },
  historyCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  historyEmoji: {
    fontSize: 28,
  },
  historyBody: {
    flex: 1,
  },
  historyName: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.text,
  },
  historyDate: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: "600",
  },
  historyRight: {
    alignItems: "flex-end",
  },
  historyScore: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
  },
  historyResult: {
    fontSize: 12,
    fontWeight: "800",
  },
  winText: {
    color: colors.green,
  },
  drawText: {
    color: colors.textMuted,
  },
  lossText: {
    color: colors.amber,
  },
});
}

