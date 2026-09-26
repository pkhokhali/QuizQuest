import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  NavigationContainer,
  DefaultTheme,
  createNavigationContainerRef,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useEffect, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  IconArcade,
  IconBattle,
  IconHome,
  IconProfile,
  IconRanks,
} from "../components/QuestIcons";
import { LoadingView } from "../components/LoadingView";
import { ArcadeScreen } from "../screens/ArcadeScreen";
import { AwardsScreen } from "../screens/AwardsScreen";
import { BattleLiveScreen } from "../screens/BattleLiveScreen";
import { BattleScreen } from "../screens/BattleScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { MemoryPlayScreen } from "../screens/MemoryPlayScreen";
import { ZipPlayScreen } from "../screens/ZipPlayScreen";
import { RiddlePlayScreen } from "../screens/RiddlePlayScreen";
import { WordSearchPlayScreen } from "../screens/WordSearchPlayScreen";
import { GameInsightsScreen } from "../screens/GameInsightsScreen";
import { OnboardingScreen } from "../screens/OnboardingScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { QuizPlayScreen } from "../screens/QuizPlayScreen";
import { RanksScreen } from "../screens/RanksScreen";
import { OtpScreen } from "../screens/auth/OtpScreen";
import { PhoneScreen } from "../screens/auth/PhoneScreen";
import { useAuth } from "../state/AuthContext";
import { useI18n } from "../state/LanguageContext";
import { useTheme } from "../state/ThemeContext";
import { fonts, radius } from "../theme";
import { Haptics } from "../utils/haptics";
import {
  AuthStackParamList,
  MainTabParamList,
  RootStackParamList,
} from "./types";

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigateFromNotification(screen: string, _params?: Record<string, any>) {
  if (navigationRef.isReady()) {
    if (screen === "Battle") {
      navigationRef.navigate("Tabs", { screen: "Battle" });
    } else if (screen === "Arcade") {
      navigationRef.navigate("Tabs", { screen: "Arcade" });
    } else if (screen === "ZipPlay") {
      navigationRef.navigate("ZipPlay");
    } else if (screen === "DailyQuiz") {
      navigationRef.navigate("DailyQuiz");
    } else if (screen === "RiddlePlay") {
      navigationRef.navigate("RiddlePlay");
    } else if (screen === "Home") {
      navigationRef.navigate("Tabs", { screen: "Home" });
    }
  }
}

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

const TAB_ICONS: Record<
  keyof MainTabParamList,
  React.ComponentType<{ size?: number; color?: string }>
> = {
  Home: IconHome,
  Arcade: IconArcade,
  Battle: IconBattle,
  Ranks: IconRanks,
  Profile: IconProfile,
};

function Tabs() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarPaddingBottom = Math.max(insets.bottom, 8);
  return (
    <Tab.Navigator
      screenListeners={{
        tabPress: () => Haptics.tap(),
      }}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            height: 62 + tabBarPaddingBottom,
            paddingBottom: tabBarPaddingBottom,
          },
        ],
        tabBarLabelStyle: [styles.tabLabel, { fontFamily: fonts.bodyBold }],
        tabBarAccessibilityLabel: t(`tab${route.name}` as never),
        tabBarIcon: ({ focused, color }) => {
          const Icon = TAB_ICONS[route.name];
          return (
            <View
              style={[
                styles.tabIconBox,
                focused && { backgroundColor: colors.primarySoft },
              ]}
            >
              <Icon size={focused ? 22 : 20} color={color} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: t("tabQuests") }}
      />
      <Tab.Screen
        name="Arcade"
        component={ArcadeScreen}
        options={{ title: t("tabArcade") }}
      />
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
        name="Profile"
        component={ProfileScreen}
        options={{ title: t("tabProfile") }}
      />
    </Tab.Navigator>
  );
}

function DailyQuizRoute({ route }: { route?: { params?: { mode?: "daily" | "practice"; subject?: string } } }) {
  const mode = route?.params?.mode || "daily";
  const subject = route?.params?.subject;
  return <QuizPlayScreen mode={mode} initialSubject={subject} />;
}

function RevengeRoundRoute() {
  return <QuizPlayScreen mode="revenge" />;
}

export function RootNavigator() {
  const { restoring, token, user } = useAuth();
  const { setLang } = useI18n();
  const { colors } = useTheme();

  const navTheme = useMemo(
    () => ({
      ...DefaultTheme,
      colors: {
        ...DefaultTheme.colors,
        background: colors.bg,
        primary: colors.primary,
        card: colors.card,
        text: colors.text,
        border: colors.border,
      },
    }),
    [colors]
  );

  useEffect(() => {
    if (user?.onboarded && user.language) setLang(user.language);
  }, [user?.onboarded, user?.language, setLang]);

  if (restoring) {
    return <LoadingView />;
  }

  return (
    <NavigationContainer ref={navigationRef} theme={navTheme}>
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
          <RootStack.Screen name="DailyQuiz" component={DailyQuizRoute} />
          <RootStack.Screen name="RevengeRound" component={RevengeRoundRoute} />
          <RootStack.Screen name="BattleLive" component={BattleLiveScreen} />
          <RootStack.Screen name="MemoryPlay" component={MemoryPlayScreen} />
          <RootStack.Screen name="ZipPlay" component={ZipPlayScreen} />
          <RootStack.Screen name="RiddlePlay" component={RiddlePlayScreen} />
          <RootStack.Screen name="WordSearchPlay" component={WordSearchPlayScreen} />
          <RootStack.Screen name="GameInsights" component={GameInsightsScreen} />
          <RootStack.Screen name="Awards" component={AwardsScreen} />
        </RootStack.Navigator>
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    paddingTop: 6,
    paddingHorizontal: 8,
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  tabIconBox: {
    width: 38,
    height: 28,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
});
