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
    try {
      p.loop = false;
      p.muted = false;
      p.play();
    } catch {}
  });

  useEffect(() => {
    let subscription: any;
    try {
      subscription = player.addListener("playToEnd", () => {
        onVideoEnd();
      });
    } catch {}

    return () => {
      try {
        if (subscription && typeof subscription.remove === "function") {
          subscription.remove();
        }
      } catch {}
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
    try {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        onFinish();
      });
    } catch {
      onFinish();
    }
  };

  useEffect(() => {
    // Safety auto-finish after 5.3s allows full 5.0s video & soundtrack to play completely
    const timer = setTimeout(() => {
      handleFinish();
    }, 5300);

    // Cinematic pulsating branding fallback loop
    const animLoop = Animated.loop(
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
    );
    animLoop.start();

    return () => {
      clearTimeout(timer);
      animLoop.stop();
    };
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {!videoFailed ? (
        <View style={StyleSheet.absoluteFill}>
          <VideoPlayerLayer onVideoEnd={handleFinish} />
        </View>
      ) : null}

      {/* Cinematic Animated Branding Fallback */}
      {videoFailed && (
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
            <Text style={styles.logoIcon}>🇳🇵</Text>
          </Animated.View>
          <Text style={styles.brandTitle}>QUIZQUEST</Text>
          <Text style={styles.brandSubtitle}>नेपालको ज्ञान मञ्च • DAILY QUESTS</Text>
        </View>
      )}

      {/* Prominent, Responsive Skip Button with Large Touch Target */}
      <TouchableOpacity
        style={styles.skipButton}
        onPress={handleFinish}
        activeOpacity={0.75}
        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
      >
        <Text style={styles.skipText}>SKIP ✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...(StyleSheet.absoluteFill as any),
    backgroundColor: "#0B1120",
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
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(220, 38, 38, 0.4)",
  },
  logoBadge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#DC2626",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#F59E0B",
    marginBottom: spacing.md,
    ...shadow.card,
  },
  logoIcon: {
    fontSize: 54,
  },
  brandTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 34,
    color: "#FFFFFF",
    letterSpacing: 2.5,
    textShadowColor: "rgba(220, 38, 38, 0.6)",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 14,
  },
  brandSubtitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: "#F59E0B",
    marginTop: 8,
    letterSpacing: 1.5,
  },
  skipButton: {
    position: "absolute",
    top: 50,
    right: 20,
    backgroundColor: "rgba(11, 17, 32, 0.75)",
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "rgba(245, 158, 11, 0.6)",
    zIndex: 100,
    ...shadow.card,
  },
  skipText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: "#F59E0B",
    letterSpacing: 1,
  },
});
