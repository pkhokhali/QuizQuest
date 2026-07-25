import { useFocusEffect, useNavigation } from "@react-navigation/native";
import React, { useCallback, useEffect, useRef, useState } from "react";
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
import { addFriend, getBattleHistory, getFriends } from "../api/client";
import {
  BattleHistoryItem,
  BattleStartEvent,
  ChallengeIncomingEvent,
  Friend,
  QueueWaitingEvent,
} from "../api/types";
import { AvatarCircle } from "../components/AvatarCircle";
import { Card } from "../components/Card";
import { PrimaryButton } from "../components/PrimaryButton";
import { connectBattleSocket } from "../socket/battleSocket";
import { useAuth } from "../state/AuthContext";
import { useI18n } from "../state/LanguageContext";
import { colors, radius, spacing } from "../theme";

export function BattleScreen() {
  const { t } = useI18n();
  const { token, user } = useAuth();
  const navigation = useNavigation();

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
      const [f, h] = await Promise.all([getFriends(), getBattleHistory()]);
      setFriends(f.friends);
      setHistory(h.battles);
    } catch {
      setFriends((prev) => prev ?? []);
      setHistory((prev) => prev ?? []);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Socket wiring: listen for match start + incoming challenges while on this tab.
  useEffect(() => {
    if (!token) return;
    const socket = connectBattleSocket(token);

    const onWaiting = (e: QueueWaitingEvent) => setQueuePosition(e.position);
    const onIncoming = (e: ChallengeIncomingEvent) => setIncoming(e);
    const onStart = (e: BattleStartEvent) => {
      setSearching(false);
      setQueuePosition(null);
      setIncoming(null);
      navigation.navigate("BattleLive", { start: e });
    };

    socket.on("queue:waiting", onWaiting);
    socket.on("challenge:incoming", onIncoming);
    socket.on("battle:start", onStart);

    return () => {
      socket.off("queue:waiting", onWaiting);
      socket.off("challenge:incoming", onIncoming);
      socket.off("battle:start", onStart);
    };
  }, [token, navigation]);

  const startQueue = () => {
    if (!token) return;
    const socket = connectBattleSocket(token);
    socket.emit("queue:join", {});
    setSearching(true);
    setQueuePosition(null);
  };

  const cancelQueue = () => {
    connectBattleSocket(token ?? "").emit("queue:leave", {});
    setSearching(false);
    setQueuePosition(null);
  };

  const sendChallenge = (friendUserId: number) => {
    if (!token) return;
    connectBattleSocket(token).emit("challenge:send", { friendUserId });
    setChallengedIds((prev) => [...prev, friendUserId]);
  };

  const acceptChallenge = () => {
    if (!token || !incoming) return;
    connectBattleSocket(token).emit("challenge:accept", {
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
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>⚔️ {t("battleTitle")}</Text>

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
        <Card color={colors.primary} style={styles.heroCard}>
          {searching ? (
            <View style={styles.searchingBox}>
              <Animated.Text
                style={[styles.searchingEmoji, { transform: [{ rotate: rotation }] }]}
              >
                ⚔️
              </Animated.Text>
              <Text style={styles.searchingText}>{t("battleSearching")}</Text>
              {queuePosition !== null && (
                <Text style={styles.queueText}>
                  {t("battleQueuePosition", { position: queuePosition })}
                </Text>
              )}
              <PrimaryButton
                label={t("battleCancelSearch")}
                onPress={cancelQueue}
                variant="accent"
              />
            </View>
          ) : (
            <View style={styles.heroBox}>
              <Text style={styles.heroEmoji}>⚡</Text>
              <Text style={styles.heroTitle}>{t("battleQuick")}</Text>
              <Text style={styles.heroSub}>{t("battleQuickSub")}</Text>
              <PrimaryButton
                label={t("battleQuick")}
                onPress={startQueue}
                variant="accent"
              />
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
  },
  heroBox: {
    alignItems: "center",
    gap: spacing.sm,
  },
  heroEmoji: {
    fontSize: 48,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.textOnPrimary,
  },
  heroSub: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "600",
    marginBottom: spacing.sm,
  },
  searchingBox: {
    alignItems: "center",
    gap: spacing.md,
  },
  searchingEmoji: {
    fontSize: 48,
  },
  searchingText: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.textOnPrimary,
  },
  queueText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: colors.text,
    marginTop: spacing.sm,
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
