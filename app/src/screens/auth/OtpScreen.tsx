import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ApiError, verifyOtp } from "../../api/client";
import { Atmosphere } from "../../components/Atmosphere";
import { PrimaryButton } from "../../components/PrimaryButton";
import { AuthStackParamList } from "../../navigation/types";
import { useAuth } from "../../state/AuthContext";
import { useI18n } from "../../state/LanguageContext";
import { useTheme } from "../../state/ThemeContext";
import { fonts, radius, spacing } from "../../theme";

type Props = NativeStackScreenProps<AuthStackParamList, "Otp">;

export function OtpScreen({ route }: Props) {
  const { phone, devCode } = route.params;
  const { t } = useI18n();
  const { signIn } = useAuth();
  const { colors } = useTheme();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onVerify = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await verifyOtp(phone, code.trim());
      await signIn(res.token, res.user);
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 0
          ? t("errorNetwork")
          : t("errorFriendly")
      );
      setLoading(false);
    }
  };

  return (
    <Atmosphere>
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.content}>
              <Text style={styles.emoji}>🔑</Text>
              <Text
                style={[styles.title, { color: colors.text, fontFamily: fonts.display }]}
              >
                {t("authOtpTitle")}
              </Text>
              <Text
                style={[
                  styles.subtitle,
                  { color: colors.textMuted, fontFamily: fonts.body },
                ]}
              >
                {t("authOtpSent", { phone })}
              </Text>

              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    color: colors.text,
                    fontFamily: fonts.display,
                  },
                ]}
                value={code}
                onChangeText={setCode}
                placeholder="······"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
              />

              {devCode ? (
                <Text
                  style={[
                    styles.helper,
                    { color: colors.textMuted, fontFamily: fonts.body },
                  ]}
                >
                  {t("authOtpHelper")} ({devCode})
                </Text>
              ) : null}
              {error ? (
                <Text
                  style={[styles.error, { color: colors.accent, fontFamily: fonts.body }]}
                >
                  {error}
                </Text>
              ) : null}

              <PrimaryButton
                label={t("authVerify")}
                onPress={onVerify}
                loading={loading}
                disabled={code.trim().length < 6}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Atmosphere>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingBottom: spacing.xxl + 24,
  },
  content: {
    padding: spacing.xl,
    gap: spacing.md,
    alignItems: "stretch",
  },
  emoji: { fontSize: 56, textAlign: "center" },
  title: { fontSize: 28, textAlign: "center" },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  input: {
    borderRadius: radius.chip,
    borderWidth: 2,
    padding: spacing.lg,
    fontSize: 28,
    letterSpacing: 8,
    textAlign: "center",
  },
  helper: { fontSize: 13, textAlign: "center" },
  error: { fontSize: 14, textAlign: "center" },
});
