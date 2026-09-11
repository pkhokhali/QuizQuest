import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useState } from "react";
import {
  ActivityIndicator,
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
import Svg, { Path } from "react-native-svg";
import { ApiError, loginWithEmail, verifyFirebase } from "../../api/client";
import { IconQuestPin } from "../../components/QuestIcons";
import { PrimaryButton } from "../../components/PrimaryButton";
import { AuthStackParamList } from "../../navigation/types";
import { useI18n } from "../../state/LanguageContext";
import { useTheme } from "../../state/ThemeContext";
import { useAuth } from "../../state/AuthContext";
import { fonts, radius, spacing } from "../../theme";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { auth } from "../../firebase";
import { logLoginEvent } from "../../utils/analytics";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

// Configure Google Sign-In once at module load time
GoogleSignin.configure({
  webClientId: "22793264461-cffq69rhg2i4ss74do5ngft8fhgvnm99.apps.googleusercontent.com",
  offlineAccess: false,
});

type Props = NativeStackScreenProps<AuthStackParamList, "Phone">;

/** Crisp 4-color authentic Google "G" logo */
function GoogleGIcon({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <Path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <Path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <Path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </Svg>
  );
}

function formatAuthError(err: any): string {
  const code = String(err?.code || "");
  const msg = String(err?.message || "");

  if (code.includes("email-already-in-use") || msg.includes("email-already-in-use")) {
    return "This email is already registered. Please switch to Sign In.";
  }
  if (
    code.includes("invalid-credential") ||
    code.includes("wrong-password") ||
    msg.includes("invalid-credential") ||
    msg.includes("auth/invalid-credential")
  ) {
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

  const clean = msg.replace(/^Firebase:\s*Error\s*\((.*?)\)\.?/, "$1");
  if (clean.startsWith("auth/")) {
    return "Authentication failed. Please check your details and try again.";
  }
  return clean || "Authentication failed. Please try again.";
}

export function PhoneScreen({ navigation }: Props) {
  const { t } = useI18n();
  const { colors, paletteId } = useTheme();
  const isDark = paletteId !== "dawn";
  const { signIn } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const valid = email.trim().length >= 5 && password.trim().length >= 6;

  const onGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const { data } = await GoogleSignin.signIn();
      if (!data?.idToken) throw new Error("No ID token returned from Google");
      const credential = GoogleAuthProvider.credential(data.idToken);
      const userCredential = await signInWithCredential(auth, credential);
      const idToken = await userCredential.user.getIdToken();
      const res = await verifyFirebase(idToken);
      await signIn(res.token, res.user);
      logLoginEvent("google");
    } catch (err: any) {
      if (err?.code === "SIGN_IN_CANCELLED") {
        // user dismissed — no error
      } else if (err?.code === "IN_PROGRESS") {
        // already signing in
      } else {
        setError("Google Sign-In failed. Please try again or use email below.");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const onSubmit = async () => {
    if (!valid) {
      setError("Please enter a valid email and password (minimum 6 characters).");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      // 1. Direct Server Email Auth (primary & reliable for test account + all users)
      try {
        const res = await loginWithEmail({
          email: email.trim(),
          password,
          isSignUp,
        });
        await signIn(res.token, res.user);
        logLoginEvent("email");
        return;
      } catch (backendErr: any) {
        if (backendErr instanceof ApiError && backendErr.status === 400) {
          setError(backendErr.message);
          return;
        }

        // 2. Firebase Auth fallback if direct server route was unavailable
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
          logLoginEvent("firebase_email");
          return;
        } catch (fbErr: any) {
          throw fbErr || backendErr;
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
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      {/* Ambient glowing backdrop: friendly luminous radiance, no harsh shapes */}
      <View style={styles.ambientContainer} pointerEvents="none">
        <View
          style={[
            styles.glowTop,
            {
              backgroundColor: isDark ? "rgba(168, 85, 247, 0.28)" : "rgba(168, 85, 247, 0.15)",
            },
          ]}
        />
        <View
          style={[
            styles.glowBottom,
            {
              backgroundColor: isDark ? "rgba(251, 146, 60, 0.20)" : "rgba(251, 191, 36, 0.14)",
            },
          ]}
        />
        <View
          style={[
            styles.glowCenter,
            {
              backgroundColor: isDark ? "rgba(59, 130, 246, 0.16)" : "rgba(59, 130, 246, 0.10)",
            },
          ]}
        />

        {/* Playful subtle sparkles */}
        <Text style={[styles.sparkle, { top: "12%", left: "10%", opacity: isDark ? 0.35 : 0.25 }]}>✨</Text>
        <Text style={[styles.sparkle, { top: "18%", right: "12%", opacity: isDark ? 0.35 : 0.25 }]}>✦</Text>
        <Text style={[styles.sparkle, { bottom: "16%", left: "14%", opacity: isDark ? 0.25 : 0.15 }]}>⭐</Text>
        <Text style={[styles.sparkle, { bottom: "22%", right: "10%", opacity: isDark ? 0.30 : 0.20 }]}>🏆</Text>
      </View>

      <SafeAreaView style={styles.safe} edges={["top", "bottom", "left", "right"]}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
          >
            {/* Sleek Compact Brand Header */}
            <View style={styles.brandHeader}>
              <View
                style={[
                  styles.brandBadge,
                  {
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                  },
                ]}
              >
                <IconQuestPin size={34} color="#FFFFFF" secondary={colors.accent} />
              </View>
              <Text style={[styles.brandTitle, { color: colors.text, fontFamily: fonts.display }]}>
                QuizQuest
              </Text>
              <View
                style={[
                  styles.taglinePill,
                  {
                    backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)",
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={[styles.taglineText, { color: colors.textMuted, fontFamily: fonts.bodyBold }]}>
                  {isSignUp ? "⚔️ Create your student quest profile" : "🚀 Welcome back! Ready for today's quest?"}
                </Text>
              </View>
            </View>

            {/* Main Auth Card */}
            <View
              style={[
                styles.authCard,
                {
                  backgroundColor: isDark ? "rgba(22, 14, 52, 0.88)" : "#FFFFFF",
                  borderColor: isDark ? "rgba(255, 255, 255, 0.14)" : "rgba(0, 0, 0, 0.08)",
                },
              ]}
            >
              {/* Segmented Sign In / Sign Up Mode Switcher */}
              <View
                style={[
                  styles.tabContainer,
                  {
                    backgroundColor: isDark ? "rgba(255, 255, 255, 0.06)" : "#F1F5F9",
                    borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
                  },
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.tabBtn,
                    !isSignUp && [
                      styles.tabBtnActive,
                      {
                        backgroundColor: colors.primary,
                        shadowColor: colors.primary,
                      },
                    ],
                  ]}
                  onPress={() => {
                    setIsSignUp(false);
                    setError(null);
                  }}
                  activeOpacity={0.85}
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
                    isSignUp && [
                      styles.tabBtnActive,
                      {
                        backgroundColor: colors.primary,
                        shadowColor: colors.primary,
                      },
                    ],
                  ]}
                  onPress={() => {
                    setIsSignUp(true);
                    setError(null);
                  }}
                  activeOpacity={0.85}
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

              {/* HIGH PRIORITY GOOGLE SIGN-IN BUTTON */}
              <TouchableOpacity
                style={[
                  styles.googleBtn,
                  {
                    backgroundColor: "#FFFFFF",
                    borderColor: isDark ? "rgba(255, 255, 255, 0.3)" : "#E2E8F0",
                  },
                ]}
                onPress={onGoogleSignIn}
                disabled={googleLoading}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Continue with Google"
              >
                {googleLoading ? (
                  <View style={styles.googleBtnContent}>
                    <ActivityIndicator size="small" color="#4285F4" />
                    <Text style={styles.googleBtnText}>Signing in with Google…</Text>
                  </View>
                ) : (
                  <View style={styles.googleBtnContent}>
                    <GoogleGIcon size={22} />
                    <Text style={styles.googleBtnText}>Continue with Google</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Theme-Harmonious Divider */}
              <View style={styles.dividerRow}>
                <View
                  style={[
                    styles.dividerLine,
                    { backgroundColor: isDark ? "rgba(255, 255, 255, 0.15)" : "#E2E8F0" },
                  ]}
                />
                <Text
                  style={[
                    styles.dividerText,
                    { color: colors.textMuted, fontFamily: fonts.body },
                  ]}
                >
                  or continue with email
                </Text>
                <View
                  style={[
                    styles.dividerLine,
                    { backgroundColor: isDark ? "rgba(255, 255, 255, 0.15)" : "#E2E8F0" },
                  ]}
                />
              </View>

              {/* Email Address Field */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.textMuted, fontFamily: fonts.bodyBold }]}>
                  EMAIL ADDRESS
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    {
                      backgroundColor: isDark ? "rgba(255, 255, 255, 0.06)" : "#F8FAFC",
                      borderColor: isDark ? "rgba(255, 255, 255, 0.12)" : "#E2E8F0",
                    },
                  ]}
                >
                  <Text style={styles.inputPrefixIcon}>✉</Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
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
              </View>

              {/* Password Field */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.textMuted, fontFamily: fonts.bodyBold }]}>
                  PASSWORD
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    {
                      backgroundColor: isDark ? "rgba(255, 255, 255, 0.06)" : "#F8FAFC",
                      borderColor: isDark ? "rgba(255, 255, 255, 0.12)" : "#E2E8F0",
                    },
                  ]}
                >
                  <Text style={styles.inputPrefixIcon}>🔒</Text>
                  <TextInput
                    style={[
                      styles.textInput,
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
                    placeholder="At least 6 characters"
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

              {/* Error Feedback Banner */}
              {error ? (
                <View
                  style={[
                    styles.errorBanner,
                    { backgroundColor: colors.dangerSoft, borderColor: colors.danger },
                  ]}
                >
                  <Text style={styles.errorIcon}>⚠</Text>
                  <Text style={[styles.errorText, { color: colors.danger, fontFamily: fonts.bodyBold }]}>
                    {error}
                  </Text>
                </View>
              ) : null}

              {/* Submit Button */}
              <PrimaryButton
                label={isSignUp ? "Create Quest Account" : "Sign In to Quest"}
                onPress={onSubmit}
                loading={loading}
                disabled={!valid}
                style={styles.submitBtn}
              />

              {/* Switch Mode Link */}
              <TouchableOpacity
                style={styles.switchModeBtn}
                onPress={() => {
                  setIsSignUp((v) => !v);
                  setError(null);
                }}
                activeOpacity={0.7}
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

              {/* Quick Demo Reviewer Helper */}
              <TouchableOpacity
                style={[
                  styles.demoPill,
                  {
                    backgroundColor: isDark ? "rgba(255, 255, 255, 0.04)" : "#F1F5F9",
                    borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
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
                <Text style={[styles.demoPillText, { color: colors.textMuted, fontFamily: fonts.body }]}>
                  🔑 Demo Student: <Text style={{ color: colors.primary, fontFamily: fonts.bodyBold }}>test2@quizquest.com</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: "hidden",
  },
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  ambientContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
  },
  glowTop: {
    position: "absolute",
    top: -100,
    right: -70,
    width: 320,
    height: 320,
    borderRadius: 160,
  },
  glowBottom: {
    position: "absolute",
    bottom: -80,
    left: -80,
    width: 320,
    height: 320,
    borderRadius: 160,
  },
  glowCenter: {
    position: "absolute",
    top: "35%",
    left: "15%",
    width: 240,
    height: 240,
    borderRadius: 120,
  },
  sparkle: {
    position: "absolute",
    fontSize: 22,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl + 20,
  },
  brandHeader: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md + 4,
  },
  brandBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs + 2,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.25)",
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  brandTitle: {
    fontSize: 28,
    letterSpacing: 0.4,
    textAlign: "center",
  },
  taglinePill: {
    marginTop: spacing.xs,
    paddingVertical: 5,
    paddingHorizontal: spacing.md,
    borderRadius: 999,
    borderWidth: 1,
  },
  taglineText: {
    fontSize: 12,
    letterSpacing: 0.2,
    textAlign: "center",
  },
  authCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: spacing.lg + 2,
    gap: spacing.md + 2,
    shadowColor: "#000000",
    shadowOpacity: 0.16,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  tabContainer: {
    flexDirection: "row",
    borderRadius: 13,
    borderWidth: 1,
    padding: 3,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  tabBtnActive: {
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  tabText: {
    fontSize: 14,
    letterSpacing: 0.2,
  },
  googleBtn: {
    borderRadius: radius.button,
    borderWidth: 1.2,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    shadowColor: "#000000",
    shadowOpacity: 0.10,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  googleBtnContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  googleBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1F2937",
    letterSpacing: 0.2,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginVertical: 2,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 12,
    letterSpacing: 0.3,
  },
  fieldGroup: {
    gap: 5,
  },
  fieldLabel: {
    fontSize: 11,
    letterSpacing: 0.8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.button,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    minHeight: 50,
  },
  inputPrefixIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
    opacity: 0.7,
  },
  textInput: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: 15,
  },
  eyeBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  eyeText: {
    fontSize: 13,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: radius.chip,
    borderWidth: 1,
    gap: spacing.sm,
  },
  errorIcon: {
    fontSize: 16,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  submitBtn: {
    marginTop: 2,
  },
  switchModeBtn: {
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  switchModeText: {
    fontSize: 13,
  },
  demoPill: {
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  demoPillText: {
    fontSize: 11,
    letterSpacing: 0.2,
  },
});
