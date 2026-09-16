import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { useTheme } from "../state/ThemeContext";

type Props = {
  children?: React.ReactNode;
  style?: ViewStyle;
  /** Soft layered wash behind screen content. */
  intensity?: "soft" | "bold";
};

/** Non-flat background: layered washes that follow the active palette with subtle Himalayan aura. */
export function Atmosphere({ children, style, intensity = "soft" }: Props) {
  const { colors } = useTheme();
  const deepOpacity = intensity === "bold" ? 0.6 : 0.4;

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }, style]}>
      {/* Top right mountain sun / star aura */}
      <View
        style={[
          styles.blobTop,
          { backgroundColor: colors.accent, opacity: deepOpacity * 0.22 },
        ]}
      />
      {/* Bottom left deep valley mountain wash */}
      <View
        style={[
          styles.blobBottom,
          { backgroundColor: colors.primary, opacity: deepOpacity * 0.18 },
        ]}
      />
      {/* Subtle glowing ring (Chandra / lunar arc) */}
      <View
        style={[
          styles.arc,
          { borderColor: colors.border, opacity: 0.5 },
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
    top: -90,
    right: -70,
    width: 280,
    height: 280,
    borderRadius: 140,
  },
  blobBottom: {
    position: "absolute",
    bottom: 60,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  arc: {
    position: "absolute",
    top: "22%",
    right: -50,
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 2,
    borderStyle: "dashed",
  },
});
