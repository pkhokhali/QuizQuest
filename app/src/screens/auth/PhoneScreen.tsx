import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useState } from "react";
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
import { ApiError, loginWithEmail, verifyFirebase } from "../../api/client";
import { getBaseUrl } from "../../api/config";
import { Atmosphere } from "../../components/Atmosphere";
import { BrandMark } from "../../components/BrandMark";
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
  // Web client ID from google-services.json (client_type: 3)
  webClientId: "22793264461-cffq69rhg2i4ss74do5ngft8fhgvnm99.apps.googleusercontent.com",
  offlineAccess: false,
});

type Props = NativeStackScreenProps<AuthStackParamList, "Phone">;

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
  const { colors } = useTheme();
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
      if (!data?.idToken) throw new Error("No ID token returned");
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
        setError("Google Sign-In failed. Please try again or use email.");
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
    <Atmosphere>
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
            {/* Hero Brand Section */}
            <View style={styles.heroSection}>
              <View style={[styles.brandGlow, { backgroundColor: colors.primarySoft }]}>
                <BrandMark size="hero" />
              </View>
              <Text style={[styles.heroTitle, { color: colors.text, fontFamily: fonts.display }]}>
                QuizQuest
              </Text>
              <Text style={[styles.heroSubtitle, { color: colors.textMuted, fontFamily: fonts.body }]}>
                Battle your mind · Climb ranks · Level up
              </Text>
            </View>

            {/* Auth Glass Card */}
            <View
              style={[
                styles.authCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              {/* Modern Segmented Tab Switcher */}
              <View
                style={[
                  styles.tabContainer,
                  { backgroundColor: colors.bgMid, borderColor: colors.border },
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

              {/* Email Field */}
              <View style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <Text style={[styles.fieldLabel, { color: colors.textMuted, fontFamily: fonts.bodyBold }]}>
                    EMAIL ADDRESS
                  </Text>
                </View>
                <View
                  style={[
                    styles.inputContainer,
                    {
                      backgroundColor: colors.bgMid,
                      borderColor: colors.border,
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
                <View style={styles.labelRow}>
                  <Text style={[styles.fieldLabel, { color: colors.textMuted, fontFamily: fonts.bodyBold }]}>
                    PASSWORD
                  </Text>
                </View>
                <View
                  style={[
                    styles.inputContainer,
                    {
                      backgroundColor: colors.bgMid,
                      borderColor: colors.border,
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

              {/* Error feedback banner */}
              {error ? (
                <View style={[styles.errorBanner, { backgroundColor: colors.dangerSoft, borderColor: colors.danger }]}>
                  <Text style={styles.errorIcon}>⚠</Text>
                  <Text style={[styles.errorText, { color: colors.danger, fontFamily: fonts.bodyBold }]}>
                    {error}
                  </Text>
                </View>
              ) : null}

              {/* Primary Action Button */}
              <PrimaryButton
                label={isSignUp ? "Create Quest Account" : "Sign In to Quest"}
                onPress={onSubmit}
                loading={loading}
                disabled={!valid}
                style={styles.submitBtn}
              />

              {/* Divider */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or continue with</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Google Sign-In Button */}
              <TouchableOpacity
                style={styles.googleBtn}
                onPress={onGoogleSignIn}
                disabled={googleLoading}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Sign in with Google"
              >
                {googleLoading ? (
                  <Text style={styles.googleBtnText}>Signing in…</Text>
                ) : (
                  <>
                    <Text style={styles.googleIcon}>G</Text>
                    <Text style={styles.googleBtnText}>Sign in with Google</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Switch Mode Footer Link */}
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
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Atmosphere>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    justifyContent: "center",
  },
  heroSection: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xl,
  },
  brandGlow: {
    padding: spacing.md,
    borderRadius: 36,
    marginBottom: spacing.sm,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
  },
  heroTitle: {
    fontSize: 32,
    letterSpacing: 0.5,
    textAlign: "center",
  },
  heroSubtitle: {
    fontSize: 14,
    marginTop: spacing.xs,
    textAlign: "center",
    opacity: 0.9,
  },
  authCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: spacing.xl,
    gap: spacing.lg,
    shadowColor: "#000000",
    shadowOpacity: 0.22,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  tabContainer: {
    flexDirection: "row",
    borderRadius: 14,
    borderWidth: 1,
    padding: 3,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: spacing.sm + 3,
    borderRadius: 11,
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
  fieldGroup: {
    gap: 7,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
    minHeight: 52,
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
    marginTop: spacing.xs,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginVertical: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#ffffff22",
  },
  dividerText: {
    fontSize: 12,
    color: "#ffffff66",
    fontFamily: "System",
  },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    borderRadius: radius.chip,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  googleIcon: {
    fontSize: 18,
    fontWeight: "900",
    color: "#EA4335",
  },
  googleBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#333333",
  },
  switchModeBtn: {
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  switchModeText: {
    fontSize: 14,
  },
});
