import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
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
import { ApiError, requestOtp } from "../../api/client";
import { getBaseUrl, getBuiltInBaseUrl, setBaseUrl } from "../../api/config";
import { PrimaryButton } from "../../components/PrimaryButton";
import { AuthStackParamList } from "../../navigation/types";
import { useI18n } from "../../state/LanguageContext";
import { colors, radius, spacing } from "../../theme";

type Props = NativeStackScreenProps<AuthStackParamList, "Phone">;

export function PhoneScreen({ navigation }: Props) {
  const { t } = useI18n();
  const [phone, setPhone] = useState("");
  const [serverUrl, setServerUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = phone.trim().length >= 10;
  const serverValid = /^https?:\/\/.+/.test(serverUrl.trim());

  useEffect(() => {
    getBaseUrl().then(setServerUrl);
  }, []);

  const onSubmit = async () => {
    if (!valid) {
      setError(t("authPhoneInvalid"));
      return;
    }
    if (!serverValid) {
      setError(t("errorNetwork"));
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await setBaseUrl(serverUrl);
      const res = await requestOtp(phone.trim());
      navigation.navigate("Otp", { phone: phone.trim(), devCode: res.devCode });
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 0
          ? `${t("errorNetwork")}\n(${getBuiltInBaseUrl()})`
          : t("errorFriendly")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
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
          <View style={styles.hero}>
            <Text style={styles.logo}>🧭</Text>
            <Text style={styles.appName}>{t("appName")}</Text>
            <Text style={styles.tagline}>{t("tagline")}</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.welcome}>{t("authWelcome")}</Text>

            <Text style={styles.label}>{t("authServerLabel")}</Text>
            <Text style={styles.hint}>{t("authServerHint")}</Text>
            <TextInput
              style={styles.inputServer}
              value={serverUrl}
              onChangeText={setServerUrl}
              placeholder={t("authServerPlaceholder")}
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />

            <Text style={styles.label}>{t("authPhoneLabel")}</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder={t("authPhonePlaceholder")}
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              maxLength={15}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <PrimaryButton
              label={t("authSendCode")}
              onPress={onSubmit}
              loading={loading}
              disabled={!valid || !serverValid}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "flex-end",
  },
  hero: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
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
    paddingBottom: spacing.xxl + 24,
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
  hint: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18,
    marginTop: -4,
  },
  inputServer: {
    backgroundColor: colors.card,
    borderRadius: radius.chip,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.md,
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
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
    lineHeight: 20,
  },
});
