import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { AvatarInfo } from "../api/types";

interface AvatarCircleProps {
  avatar: AvatarInfo;
  size?: number;
}

export function AvatarCircle({ avatar, size = 48 }: AvatarCircleProps) {
  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: avatar.bg || "#7C3AED",
        },
      ]}
    >
      {avatar.photoUrl ? (
        <Image
          source={{ uri: avatar.photoUrl }}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
          }}
          resizeMode="cover"
        />
      ) : (
        <Text style={{ fontSize: size * 0.55 }}>{avatar.emoji || "🦊"}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: "center",
    justifyContent: "center",
  },
});
