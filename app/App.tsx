import {
  Fredoka_600SemiBold,
  Fredoka_700Bold,
  useFonts as useFredoka,
} from "@expo-google-fonts/fredoka";
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_800ExtraBold,
  useFonts as useNunito,
} from "@expo-google-fonts/nunito";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { AppSplashVideoScreen } from "./src/screens/AppSplashVideoScreen";
import { AuthProvider } from "./src/state/AuthContext";
import { LanguageProvider } from "./src/state/LanguageContext";
import { ThemeProvider, useTheme } from "./src/state/ThemeContext";
import { registerForPushNotificationsAsync, scheduleDailyReminders, setupNotificationResponseHandler } from "./src/utils/push";
import { navigateFromNotification } from "./src/navigation/RootNavigator";

function AppShell() {
  const { colors, ready } = useTheme();
  const [fredokaLoaded] = useFredoka({
    Fredoka_600SemiBold,
    Fredoka_700Bold,
  });
  const [nunitoLoaded] = useNunito({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_800ExtraBold,
  });

  const [splashFinished, setSplashFinished] = React.useState(false);
  const [fontTimeout, setFontTimeout] = React.useState(false);

  React.useEffect(() => {
    registerForPushNotificationsAsync().catch(() => {});
    scheduleDailyReminders().catch(() => {});

    const unsubscribePushTap = setupNotificationResponseHandler((screen, params) => {
      navigateFromNotification(screen, params);
    });

    // Ensure fonts never indefinitely block app mounting if offline or slow
    const fontTimer = setTimeout(() => {
      setFontTimeout(true);
    }, 1200);

    return () => {
      clearTimeout(fontTimer);
      unsubscribePushTap();
    };
  }, []);

  if (!splashFinished) {
    return <AppSplashVideoScreen onFinish={() => setSplashFinished(true)} />;
  }

  const fontsReady = (fredokaLoaded && nunitoLoaded) || fontTimeout;

  if (!ready || !fontsReady) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.bg,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <RootNavigator />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <AppShell />
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
