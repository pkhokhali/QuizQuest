/** Bakes EXPO_PUBLIC_API_URL into the native app via expo-constants `extra`. */
const appJson = require("./app.json");

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  ...appJson.expo,
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000",
  },
};
