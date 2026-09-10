import { initializeApp, getApps, getApp } from "firebase/app";
// @ts-expect-error - getReactNativePersistence is exported by React Native entrypoint of firebase/auth
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyCZf6p911EQI4yhAevf8Jifl1e38vPBr4U",
  authDomain: "quizquest-c1b37.firebaseapp.com",
  projectId: "quizquest-c1b37",
  storageBucket: "quizquest-c1b37.firebasestorage.app",
  messagingSenderId: "22793264461",
  appId: "1:22793264461:android:9c01838a4d6d77b5342b04",
  measurementId: "G-CJJJKRBTTZ"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize auth with AsyncStorage for React Native persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export default app;
