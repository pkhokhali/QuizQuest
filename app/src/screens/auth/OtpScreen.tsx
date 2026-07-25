import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { verifyOtp } from "../../api/client";
import { PrimaryButton } from "../../components/PrimaryButton";
import { AuthStackParamList } from "../../navigation/types";
import { useAuth } from "../../state/AuthContext";
import { useI18n } from "../../state/LanguageContext";
import { colors, radius, spacing } from "../../theme";

type Props = NativeStackScreenProps<AuthStackParamList, "Otp">;

export function OtpScreen({ route }: Props) {
  const { phone, devCode } = route.params;
  const { t } = useI18n();
  const { signIn } = useAuth();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onVerify = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await verifyOtp(phone, code.trim());
      await signIn(res.token, res.user);
      // Navigation switches automatically via auth state.
    } catch {
      setError(t("errorFriendly"));
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.content}>
          <Text style={styles.emoji}>🔑</Text>
          <Text style={styles.title}>{t("authOtpTitle")}</Text>
          <Text style={styles.subtitle}>{t("authOtpSent", { phone })}</Text>

          <TextInput
            style={styles.input}
            value={code}
            onChangeText={setCode}
            placeholder="······"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
          />

          <Text style={styles.helper}>
            {t("authOtpHelper")}
            {devCode ? ` (${devCode})` : ""}
          </Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <PrimaryButton
            label={t("authVerify")}
            onPress={onVerify}
            loading={loading}
            disabled={code.trim().length < 6}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.md,
  },
  emoji: {
    fontSize: 56,
    textAlign: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: "center",
    fontWeight: "600",
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: radius.chip,
    borderWidth: 2,
    borderColor: colors.primary,
    padding: spacing.lg,
    fontSize: 30,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
    letterSpacing: 12,
    marginTop: spacing.md,
  },
  helper: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    fontStyle: "italic",
  },
  error: {
    color: colors.accent,
    fontWeight: "600",
    fontSize: 14,
    textAlign: "center",
  },
});
