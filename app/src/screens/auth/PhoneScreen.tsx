import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ApiError, pingServer, requestOtp } from "../../api/client";
import { getBaseUrl, getBuiltInBaseUrl, setBaseUrl } from "../../api/config";
import { BrandMark } from "../../components/BrandMark";
import { PrimaryButton } from "../../components/PrimaryButton";
import { AuthStackParamList } from "../../navigation/types";
import { useI18n } from "../../state/LanguageContext";
import { useTheme } from "../../state/ThemeContext";
import { fonts, radius, spacing } from "../../theme";

type Props = NativeStackScreenProps<AuthStackParamList, "Phone">;

export function PhoneScreen({ navigation }: Props) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const [phone, setPhone] = useState("");
  const [serverUrl, setServerUrl] = useState(getBuiltInBaseUrl());
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverOk, setServerOk] = useState<boolean | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const valid = phone.trim().length >= 10;
  const serverValid = /^https?:\/\/.+/.test(serverUrl.trim());

  useEffect(() => {
    (async () => {
      const url = await getBaseUrl();
      const builtIn = getBuiltInBaseUrl();
      if (url && !url.includes("localhost") && !url.includes("127.0.0.1")) {
        setServerUrl(url);
      } else if (builtIn && !builtIn.includes("localhost")) {
        setServerUrl(builtIn);
      }
    })();
  }, []);

  const onTestServer = async () => {
    if (!serverValid) return;
    setTesting(true);
    setError(null);
    setServerOk(null);
    await setBaseUrl(serverUrl);
    const result = await pingServer(serverUrl);
    setTesting(false);
    setServerOk(result.ok);
    if (!result.ok) {
      setError(`${t("authServerFail")} (${result.detail})`);
    }
  };

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
      const ping = await pingServer(serverUrl);
      if (!ping.ok) {
        setError(`${t("authServerFail")} (${ping.detail})`);
        setLoading(false);
        return;
      }
      const res = await requestOtp(phone.trim());
      navigation.navigate("Otp", { phone: phone.trim(), devCode: res.devCode });
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 0
          ? t("errorNetwork")
          : t("errorFriendly")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.primary }]}
      edges={["top", "left", "right"]}
    >
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
            <BrandMark size="hero" light />
          </View>

          <View style={[styles.form, { backgroundColor: colors.bg }]}>
            <Text
              style={[styles.welcome, { color: colors.text, fontFamily: fonts.display }]}
            >
              {t("authWelcome")}
            </Text>

            <TouchableOpacity
              onPress={() => setShowAdvanced((v) => !v)}
              accessibilityRole="button"
              accessibilityLabel={t("authServerLabel")}
            >
              <Text
                style={[
                  styles.advancedToggle,
                  { color: colors.textMuted, fontFamily: fonts.bodyBold },
                ]}
              >
                {showAdvanced ? "▾ " : "▸ "}
                {t("authServerLabel")}
              </Text>
            </TouchableOpacity>

            {showAdvanced ? (
              <>
                <Text
                  style={[styles.hint, { color: colors.textMuted, fontFamily: fonts.body }]}
                >
                  {t("authServerHint")}
                </Text>
                <TextInput
                  style={[
                    styles.inputServer,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      color: colors.text,
                      fontFamily: fonts.body,
                    },
                  ]}
                  value={serverUrl}
                  onChangeText={(v) => {
                    setServerUrl(v);
                    setServerOk(null);
                  }}
                  placeholder={t("authServerPlaceholder")}
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
                <PrimaryButton
                  label={t("authTestServer")}
                  onPress={onTestServer}
                  variant="ghost"
                  loading={testing}
                  disabled={!serverValid || testing}
                />
                {serverOk ? (
                  <Text
                    style={[
                      styles.serverOk,
                      { color: colors.primary, fontFamily: fonts.bodyBold },
                    ]}
                  >
                    {t("authServerOk")}
                  </Text>
                ) : null}
              </>
            ) : null}

            <Text
              style={[styles.label, { color: colors.textMuted, fontFamily: fonts.bodyBold }]}
            >
              {t("authPhoneLabel")}
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.text,
                  fontFamily: fonts.bodyBold,
                },
              ]}
              value={phone}
              onChangeText={setPhone}
              placeholder={t("authPhonePlaceholder")}
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              maxLength={15}
            />
            {error ? (
              <Text style={[styles.error, { color: colors.accent, fontFamily: fonts.body }]}>
                {error}
              </Text>
            ) : null}
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
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: "flex-end" },
  hero: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl,
  },
  form: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: spacing.xl,
    paddingBottom: spacing.xxl + 24,
    gap: spacing.md,
  },
  welcome: { fontSize: 24, marginBottom: spacing.sm },
  label: { fontSize: 14 },
  advancedToggle: { fontSize: 13, paddingVertical: spacing.xs },
  hint: { fontSize: 12, lineHeight: 18, marginTop: -4 },
  inputServer: {
    borderRadius: radius.chip,
    borderWidth: 2,
    padding: spacing.md,
    fontSize: 15,
  },
  serverOk: { fontSize: 14, textAlign: "center" },
  input: {
    borderRadius: radius.chip,
    borderWidth: 2,
    padding: spacing.lg,
    fontSize: 20,
    letterSpacing: 1,
  },
  error: { fontSize: 14, lineHeight: 20 },
});
