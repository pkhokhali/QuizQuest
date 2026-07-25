import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useEffect } from "react";
import { StyleSheet, Text } from "react-native";
import { LoadingView } from "../components/LoadingView";
import { AwardsScreen } from "../screens/AwardsScreen";
import { BattleLiveScreen } from "../screens/BattleLiveScreen";
import { BattleScreen } from "../screens/BattleScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { OnboardingScreen } from "../screens/OnboardingScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { QuizPlayScreen } from "../screens/QuizPlayScreen";
import { RanksScreen } from "../screens/RanksScreen";
import { OtpScreen } from "../screens/auth/OtpScreen";
import { PhoneScreen } from "../screens/auth/PhoneScreen";
import { useAuth } from "../state/AuthContext";
import { useI18n } from "../state/LanguageContext";
import { colors } from "../theme";
import {
  AuthStackParamList,
  MainTabParamList,
  RootStackParamList,
} from "./types";

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

const TAB_EMOJIS: Record<keyof MainTabParamList, string> = {
  Home: "🏠",
  Battle: "⚔️",
  Ranks: "🏔️",
  Awards: "🏅",
  Profile: "🦊",
};

function Tabs() {
  const { t } = useI18n();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused }) => (
          <Text style={[styles.tabIcon, !focused && styles.tabIconInactive]}>
            {TAB_EMOJIS[route.name]}
          </Text>
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: t("tabHome") }} />
      <Tab.Screen
        name="Battle"
        component={BattleScreen}
        options={{ title: t("tabBattle") }}
      />
      <Tab.Screen
        name="Ranks"
        component={RanksScreen}
        options={{ title: t("tabRanks") }}
      />
      <Tab.Screen
        name="Awards"
        component={AwardsScreen}
        options={{ title: t("tabAwards") }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: t("tabProfile") }}
      />
    </Tab.Navigator>
  );
}

function DailyQuizRoute() {
  return <QuizPlayScreen mode="daily" />;
}

function RevengeRoundRoute() {
  return <QuizPlayScreen mode="revenge" />;
}

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    primary: colors.primary,
  },
};

export function RootNavigator() {
  const { restoring, token, user } = useAuth();
  const { setLang } = useI18n();

  // Keep the UI language in sync with the server-side preference once the
  // student is fully set up (during onboarding the local toggle leads).
  useEffect(() => {
    if (user?.onboarded && user.language) setLang(user.language);
  }, [user?.onboarded, user?.language, setLang]);

  if (restoring) {
    return <LoadingView />;
  }

  return (
    <NavigationContainer theme={navTheme}>
      {!token || !user ? (
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
          <AuthStack.Screen name="Phone" component={PhoneScreen} />
          <AuthStack.Screen name="Otp" component={OtpScreen} />
        </AuthStack.Navigator>
      ) : !user.onboarded ? (
        <OnboardingScreen />
      ) : (
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
          <RootStack.Screen name="Tabs" component={Tabs} />
          <RootStack.Screen
            name="DailyQuiz"
            component={DailyQuizRoute}
            options={{ animation: "slide_from_bottom", gestureEnabled: false }}
          />
          <RootStack.Screen
            name="RevengeRound"
            component={RevengeRoundRoute}
            options={{ animation: "slide_from_bottom", gestureEnabled: false }}
          />
          <RootStack.Screen
            name="BattleLive"
            component={BattleLiveScreen}
            options={{ animation: "fade", gestureEnabled: false }}
          />
        </RootStack.Navigator>
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.card,
    borderTopWidth: 0,
    elevation: 8,
    height: 62,
    paddingTop: 6,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "700",
  },
  tabIcon: {
    fontSize: 20,
  },
  tabIconInactive: {
    opacity: 0.45,
  },
});
