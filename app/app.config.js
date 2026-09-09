/** Bakes EXPO_PUBLIC_API_URL into the native app via expo-constants `extra`. */
const appJson = require("./app.json");

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  ...appJson.expo,
  plugins: [
    "expo-font",
    [
      "expo-build-properties",
      {
        android: {
          minSdkVersion: 24,
          compileSdkVersion: 35,
          targetSdkVersion: 35,
          usesCleartextTraffic: true,
        },
      },
    ],
    "./plugins/withNetworkSecurity.js",
    "./plugins/withPlayGamesServices.js",
  ],
  updates: {
    url: "https://u.expo.dev/8209eeb8-c465-4463-89f5-d14dd9d2188f"
  },
  runtimeVersion: {
    policy: "appVersion"
  },
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL || "https://quiz.prabinkhokhali.com.np",
    eas: {
      projectId: "8209eeb8-c465-4463-89f5-d14dd9d2188f"
    }
  },
};
