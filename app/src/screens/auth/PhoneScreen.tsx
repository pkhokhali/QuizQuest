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
import { ApiError, loginWithEmail, pingServer, verifyFirebase } from "../../api/client";
import { getBaseUrl, getBuiltInBaseUrl, setBaseUrl } from "../../api/config";
import { Atmosphere } from "../../components/Atmosphere";
import { BrandMark } from "../../components/BrandMark";
import { PrimaryButton } from "../../components/PrimaryButton";
import { AuthStackParamList } from "../../navigation/types";
import { useI18n } from "../../state/LanguageContext";
import { useTheme } from "../../state/ThemeContext";
import { useAuth } from "../../state/AuthContext";
import { fonts, radius, spacing } from "../../theme";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase";

type Props = NativeStackScreenProps<AuthStackParamList, "Phone">;

function formatAuthError(err: any): string {
  const code = String(err?.code || "");
  const msg = String(err?.message || "");

  if (code.includes("email-already-in-use") || msg.includes("email-already-in-use")) {
    return "This email is already registered. Please switch to Sign In.";
  }
  if (code.includes("invalid-credential") || code.includes("wrong-password") || msg.includes("invalid-credential")) {
    return "Incorrect email or password. New here? Tap 'Create Account'.";
  }
  if (code.includes("user-not-found") || msg.includes("user-not-found")) {
    return "No account found with this email. Tap 'Create Account' to join!";
  }
  if (code.includes("weak-password") || msg.includes("weak-password")) {
    return "Password must be at least 6 characters.";
  }
  if (code.includes("invalid-email") || msg.includes("invalid-email")) {
    return "Please enter a valid email address.";
  }
  if (code.includes("too-many-requests") || msg.includes("too-many-requests")) {
    return "Too many failed attempts. Please wait a moment and try again.";
  }
  if (code.includes("network-request-failed") || msg.includes("network")) {
    return "Network error. Please check your internet connection.";
  }
  return msg.replace(/^Firebase:\s*Error\s*\((.*?)\)\.?/, "$1") || "Authentication failed. Please try again.";
}

export function PhoneScreen({ navigation }: Props) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const { signIn } = useAuth();
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [serverUrl, setServerUrl] = useState(getBuiltInBaseUrl());
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverOk, setServerOk] = useState<boolean | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const valid = email.trim().length >= 5 && password.trim().length >= 6;
  const serverValid = /^https?:\/\/.+/.test(serverUrl.trim());

  useEffect(() => {
    (async () => {
      const url = await getBaseUrl();
      const builtIn = getBuiltInBaseUrl();
      if (url && !url.includes("localhost") && !url.includes("127.0.0.1") && !url.includes("fly.dev")) {
        setServerUrl(url);
      } else if (builtIn && !builtIn.includes("localhost") && !builtIn.includes("fly.dev")) {
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
      setError("Please enter a valid email and password (min 6 characters).");
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
      
      // 1. Direct Server Email Auth (primary & reliable for test account + all users)
      try {
        const res = await loginWithEmail({
          email: email.trim(),
          password,
          isSignUp,
        });
        await signIn(res.token, res.user);
        return;
      } catch (backendErr: any) {
        // If backend gave a specific 400 validation error (e.g. wrong password or user already exists), display it
        if (backendErr instanceof ApiError && backendErr.status === 400) {
          setError(backendErr.message);
          return;
        }

        // 2. Firebase Auth fallback if server direct auth was unavailable
        try {
          let userCredential;
          if (isSignUp) {
            userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
          } else {
            userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
          }

          const idToken = await userCredential.user.getIdToken();
          const res = await verifyFirebase(idToken);
          await signIn(res.token, res.user);
          return;
        } catch (fbErr: any) {
          throw backendErr || fbErr;
        }
      }
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 0) {
        setError(t("errorNetwork"));
      } else {
        setError(formatAuthError(err));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Atmosphere>
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          {/* Top Bar with subtle Server Config pill */}
          <View style={styles.topBar}>
            <TouchableOpacity
              style={[
                styles.serverPill,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setShowAdvanced((v) => !v)}
              accessibilityRole="button"
              accessibilityLabel={t("authServerLabel")}
            >
              <Text
                style={[
                  styles.serverPillText,
                  { color: colors.textMuted, fontFamily: fonts.bodyBold },
                ]}
              >
                ⚙ {showAdvanced ? "Close" : "Server"}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
          >
            {/* Collapsible Server Config Box */}
            {showAdvanced ? (
              <View
                style={[
                  styles.serverCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.serverTitle,
                    { color: colors.text, fontFamily: fonts.bodyBold },
                  ]}
                >
                  {t("authServerLabel")}
                </Text>
                <Text
                  style={[
                    styles.hint,
                    { color: colors.textMuted, fontFamily: fonts.body },
                  ]}
                >
                  {t("authServerHint")}
                </Text>
                <TextInput
                  style={[
                    styles.inputServer,
                    {
                      backgroundColor: colors.bgMid,
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
                  style={styles.testBtn}
                />
                {serverOk ? (
                  <Text
                    style={[
                      styles.serverOk,
                      { color: colors.green, fontFamily: fonts.bodyBold },
                    ]}
                  >
                    ✓ {t("authServerOk")}
                  </Text>
                ) : null}
              </View>
            ) : null}

            {/* Hero Brand Section */}
            <View style={styles.hero}>
              <BrandMark size="hero" />
            </View>

            {/* Floating Auth Card */}
            <View
              style={[
                styles.authCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              {/* Segmented Mode Selector */}
              <View
                style={[
                  styles.tabContainer,
                  { backgroundColor: colors.bgMid, borderColor: colors.border },
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.tabBtn,
                    !isSignUp && [styles.tabBtnActive, { backgroundColor: colors.primary }],
                  ]}
                  onPress={() => {
                    setIsSignUp(false);
                    setError(null);
                  }}
                  accessibilityRole="button"
                >
                  <Text
                    style={[
                      styles.tabText,
                      {
                        color: !isSignUp ? colors.textOnPrimary : colors.textMuted,
                        fontFamily: !isSignUp ? fonts.bodyBold : fonts.body,
                      },
                    ]}
                  >
                    Sign In
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.tabBtn,
                    isSignUp && [styles.tabBtnActive, { backgroundColor: colors.primary }],
                  ]}
                  onPress={() => {
                    setIsSignUp(true);
                    setError(null);
                  }}
                  accessibilityRole="button"
                >
                  <Text
                    style={[
                      styles.tabText,
                      {
                        color: isSignUp ? colors.textOnPrimary : colors.textMuted,
                        fontFamily: isSignUp ? fonts.bodyBold : fonts.body,
                      },
                    ]}
                  >
                    Create Account
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Email Field */}
              <View style={styles.fieldGroup}>
                <Text
                  style={[
                    styles.fieldLabel,
                    { color: colors.textMuted, fontFamily: fonts.bodyBold },
                  ]}
                >
                  Email Address
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.bgMid,
                      borderColor: colors.border,
                      color: colors.text,
                      fontFamily: fonts.body,
                    },
                  ]}
                  value={email}
                  onChangeText={(v) => {
                    setEmail(v);
                    if (error) setError(null);
                  }}
                  placeholder="student@quizquest.com"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Password Field */}
              <View style={styles.fieldGroup}>
                <Text
                  style={[
                    styles.fieldLabel,
                    { color: colors.textMuted, fontFamily: fonts.bodyBold },
                  ]}
                >
                  Password
                </Text>
                <View
                  style={[
                    styles.passwordWrapper,
                    {
                      backgroundColor: colors.bgMid,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <TextInput
                    style={[
                      styles.passwordInput,
                      {
                        color: colors.text,
                        fontFamily: fonts.body,
                      },
                    ]}
                    value={password}
                    onChangeText={(v) => {
                      setPassword(v);
                      if (error) setError(null);
                    }}
                    placeholder="••••••••"
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowPassword((v) => !v)}
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                  >
                    <Text
                      style={[
                        styles.eyeText,
                        { color: colors.primary, fontFamily: fonts.bodyBold },
                      ]}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Error feedback banner */}
              {error ? (
                <View style={[styles.errorBanner, { backgroundColor: colors.dangerSoft, borderColor: colors.danger }]}>
                  <Text style={[styles.error, { color: colors.danger, fontFamily: fonts.bodyBold }]}>
                    ⚠ {error}
                  </Text>
                </View>
              ) : null}

              {/* Play Store Reviewer Test Account Quick-Fill Pill */}
              <TouchableOpacity
                style={[
                  styles.testCredsPill,
                  {
                    backgroundColor: colors.primarySoft,
                    borderColor: colors.primary,
                  },
                ]}
                onPress={() => {
                  setEmail("test2@quizquest.com");
                  setPassword("password123");
                  setIsSignUp(false);
                  setError(null);
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.testCredsText,
                    { color: colors.primary, fontFamily: fonts.bodyBold },
                  ]}
                >
                  🧪 Fill Test Account (test2@quizquest.com)
                </Text>
              </TouchableOpacity>

              {/* Primary Action Button */}
              <PrimaryButton
                label={isSignUp ? "Create Account" : "Sign In"}
                onPress={onSubmit}
                loading={loading}
                disabled={!valid || !serverValid}
                style={styles.submitBtn}
              />

              {/* Switch Mode Footer Link */}
              <TouchableOpacity
                style={styles.switchModeBtn}
                onPress={() => {
                  setIsSignUp((v) => !v);
                  setError(null);
                }}
              >
                <Text
                  style={[
                    styles.switchModeText,
                    { color: colors.textMuted, fontFamily: fonts.body },
                  ]}
                >
                  {isSignUp ? "Already have an account? " : "Don't have an account? "}
                  <Text style={{ color: colors.primary, fontFamily: fonts.bodyBold }}>
                    {isSignUp ? "Sign In" : "Create one"}
                  </Text>
                </Text>
              </TouchableOpacity>
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
  topBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
  },
  serverPill: {
    paddingVertical: spacing.xs + 1,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    borderWidth: 1,
  },
  serverPillText: {
    fontSize: 12,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    justifyContent: "center",
  },
  hero: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.lg,
  },
  serverCard: {
    borderRadius: radius.card,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  serverTitle: {
    fontSize: 14,
  },
  hint: {
    fontSize: 12,
    lineHeight: 17,
  },
  inputServer: {
    borderRadius: radius.chip,
    borderWidth: 1,
    padding: spacing.sm + 2,
    fontSize: 14,
  },
  testBtn: {
    minHeight: 40,
    paddingVertical: spacing.xs,
  },
  serverOk: {
    fontSize: 13,
    textAlign: "center",
  },
  authCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: spacing.xl,
    gap: spacing.md,
    shadowColor: "#000000",
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  tabContainer: {
    flexDirection: "row",
    borderRadius: 14,
    borderWidth: 1,
    padding: 3,
    marginBottom: spacing.xs,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  tabBtnActive: {
    elevation: 2,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  tabText: {
    fontSize: 14,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  input: {
    borderRadius: radius.button,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 16,
  },
  passwordWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.button,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: 16,
  },
  eyeBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  eyeText: {
    fontSize: 13,
  },
  errorBanner: {
    padding: spacing.sm + 2,
    borderRadius: radius.chip,
    borderWidth: 1,
  },
  error: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },
  submitBtn: {
    marginTop: spacing.xs,
  },
  switchModeBtn: {
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  switchModeText: {
    fontSize: 14,
  },
  testCredsPill: {
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: radius.button,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  testCredsText: {
    fontSize: 12,
  },
});
