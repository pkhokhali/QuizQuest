import { NavigatorScreenParams } from "@react-navigation/native";
import { BattleStartEvent } from "../api/types";

export type AuthStackParamList = {
  Phone: undefined;
  Otp: { phone: string; devCode?: string };
};

export type MainTabParamList = {
  Home: undefined;
  Arcade: undefined;
  Battle: undefined;
  Ranks: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<MainTabParamList>;
  DailyQuiz: { mode?: "daily" | "practice"; subject?: string } | undefined;
  RevengeRound: undefined;
  BattleLive: { start: BattleStartEvent };
  MemoryPlay: undefined;
  ZipPlay: undefined;
  RiddlePlay: { initialMode?: "daily" | "practice" } | undefined;
  WordSearchPlay: undefined;
  GameInsights: undefined;
  Awards: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
