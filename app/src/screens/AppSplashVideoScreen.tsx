import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";
import { fonts, radius, shadow, spacing } from "../theme";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface AppSplashProps {
  onFinish: () => void;
}

function VideoPlayerLayer({ onVideoEnd }: { onVideoEnd: () => void }) {
  const videoSource = require("../../assets/splash_intro.mp4");
  const player = useVideoPlayer(videoSource, (p) => {
    p.loop = false;
    p.muted = false;
    p.play();
  });

  useEffect(() => {
    const subscription = player.addListener("playToEnd", () => {
      onVideoEnd();
    });
    return () => {
      subscription.remove();
    };
  }, [player, onVideoEnd]);

  return (
    <VideoView
      player={player}
      style={styles.videoPlayer}
      contentFit="cover"
      nativeControls={false}
    />
  );
}

export function AppSplashVideoScreen({ onFinish }: AppSplashProps) {
  const [videoFailed, setVideoFailed] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const logoScale = useRef(new Animated.Value(0.85)).current;
  const glowPulse = useRef(new Animated.Value(0.3)).current;
  const finishedRef = useRef(false);

  const handleFinish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 350,
      useNativeDriver: true,
    }).start(() => {
      onFinish();
    });
  };

  useEffect(() => {
    // Safety auto-finish after 5.3 seconds to allow full 5s video playback
    const timer = setTimeout(() => {
      handleFinish();
    }, 5300);

    // Fallback animation loop
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(logoScale, {
            toValue: 1.05,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(glowPulse, {
            toValue: 0.8,
            duration: 900,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(logoScale, {
            toValue: 0.95,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(glowPulse, {
            toValue: 0.3,
            duration: 900,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {!videoFailed ? (
        <View style={StyleSheet.absoluteFill}>
          <VideoPlayerLayer onVideoEnd={handleFinish} />
        </View>
      ) : (
        /* Cinematic Animated Branding Fallback */
        <View style={styles.fallbackContainer}>
          <Animated.View
            style={[
              styles.glowOrb,
              {
                opacity: glowPulse,
                transform: [{ scale: logoScale }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.logoBadge,
              { transform: [{ scale: logoScale }] },
            ]}
          >
            <Text style={styles.logoIcon}>👑</Text>
          </Animated.View>
          <Text style={styles.brandTitle}>QUIZQUEST</Text>
          <Text style={styles.brandSubtitle}>Daily Knowledge • Global Battles</Text>
        </View>
      )}

      {/* Skip button in top corner */}
      <TouchableOpacity
        style={styles.skipButton}
        onPress={handleFinish}
        activeOpacity={0.7}
      >
        <Text style={styles.skipText}>SKIP ✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...(StyleSheet.absoluteFill as any),
    backgroundColor: "#0F0728",
    zIndex: 9999,
    justifyContent: "center",
    alignItems: "center",
  },
  videoPlayer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  fallbackContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  glowOrb: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(168, 85, 247, 0.4)",
  },
  logoBadge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#7C3AED",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#FAF5FF",
    marginBottom: spacing.md,
    ...shadow.card,
  },
  logoIcon: {
    fontSize: 64,
  },
  brandTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 34,
    color: "#FFFFFF",
    letterSpacing: 2,
    textShadowColor: "rgba(168, 85, 247, 0.6)",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 14,
  },
  brandSubtitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: "#C4B5FD",
    marginTop: 6,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  skipButton: {
    position: "absolute",
    top: 50,
    right: 20,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    zIndex: 100,
  },
  skipText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: "#FFFFFF",
    letterSpacing: 1,
  },
});
