import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { useTheme } from "../state/ThemeContext";

type Props = {
  children?: React.ReactNode;
  style?: ViewStyle;
  /** Soft layered wash behind screen content. */
  intensity?: "soft" | "bold";
};

/** Non-flat background: layered washes that follow the active palette. */
export function Atmosphere({ children, style, intensity = "soft" }: Props) {
  const { colors } = useTheme();
  const deepOpacity = intensity === "bold" ? 0.55 : 0.35;

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }, style]}>
      <View
        style={[
          styles.blobTop,
          { backgroundColor: colors.bgMid, opacity: deepOpacity },
        ]}
      />
      <View
        style={[
          styles.blobBottom,
          { backgroundColor: colors.bgDeep, opacity: deepOpacity * 0.45 },
        ]}
      />
      <View
        style={[
          styles.arc,
          { borderColor: colors.primarySoft, opacity: 0.7 },
        ]}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: "hidden",
  },
  blobTop: {
    position: "absolute",
    top: -80,
    right: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
  },
  blobBottom: {
    position: "absolute",
    bottom: 40,
    left: -90,
    width: 260,
    height: 260,
    borderRadius: 130,
  },
  arc: {
    position: "absolute",
    top: "28%",
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 28,
  },
});
