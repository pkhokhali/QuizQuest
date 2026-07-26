import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { spacing } from "../theme";

/** Scroll padding so content clears the bottom tab bar on all devices. */
export function useTabScreenPadding(extra = spacing.lg): number {
  const tabBarHeight = useBottomTabBarHeight();
  return tabBarHeight + extra;
}
