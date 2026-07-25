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
import { requestOtp } from "../../api/client";
import { PrimaryButton } from "../../components/PrimaryButton";
import { AuthStackParamList } from "../../navigation/types";
import { useI18n } from "../../state/LanguageContext";
import { colors, radius, spacing } from "../../theme";

type Props = NativeStackScreenProps<AuthStackParamList, "Phone">;

export function PhoneScreen({ navigation }: Props) {
  const { t } = useI18n();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = phone.trim().length >= 10;

  const onSubmit = async () => {
    if (!valid) {
      setError(t("authPhoneInvalid"));
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await requestOtp(phone.trim());
      navigation.navigate("Otp", { phone: phone.trim(), devCode: res.devCode });
    } catch {
      setError(t("errorFriendly"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.hero}>
          <Text style={styles.logo}>🧭</Text>
          <Text style={styles.appName}>{t("appName")}</Text>
          <Text style={styles.tagline}>{t("tagline")}</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.welcome}>{t("authWelcome")}</Text>
          <Text style={styles.label}>{t("authPhoneLabel")}</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder={t("authPhonePlaceholder")}
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
            maxLength={15}
            autoFocus
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <PrimaryButton
            label={t("authSendCode")}
            onPress={onSubmit}
            loading={loading}
            disabled={!valid}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  container: {
    flex: 1,
    justifyContent: "flex-end",
  },
  hero: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  logo: {
    fontSize: 72,
  },
  appName: {
    fontSize: 36,
    fontWeight: "800",
    color: colors.textOnPrimary,
  },
  tagline: {
    fontSize: 16,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "600",
  },
  form: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  welcome: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textMuted,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: radius.chip,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.lg,
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: 1,
  },
  error: {
    color: colors.accent,
    fontWeight: "600",
    fontSize: 14,
  },
});
