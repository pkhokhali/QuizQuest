import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDc5xJkvc74qnJNu-VEk7-yQYuNRpP51XY",
  authDomain: "quizquest-c1b37.firebaseapp.com",
  projectId: "quizquest-c1b37",
  storageBucket: "quizquest-c1b37.firebasestorage.app",
  messagingSenderId: "22793264461",
  appId: "1:22793264461:web:0e9b19c2c7f9c036342b04",
  measurementId: "G-CJJJKRBTTZ"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export default app;
