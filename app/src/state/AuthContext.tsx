import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getMe, TOKEN_KEY, USER_KEY } from "../api/client";
import { User } from "../api/types";
import { disconnectBattleSocket } from "../socket/battleSocket";

interface AuthContextValue {
  /** True while restoring the session from storage on launch. */
  restoring: boolean;
  token: string | null;
  user: User | null;
  signIn: (token: string, user: User) => Promise<void>;
  signOut: () => Promise<void>;
  /** Update the cached user (e.g. after PUT /api/me). */
  setUser: (user: User) => void;
  /** Re-fetch the user from the server; silently keeps old data on failure. */
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [restoring, setRestoring] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUserState] = useState<User | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(USER_KEY),
        ]);
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUserState(JSON.parse(storedUser) as User);
          // Refresh in the background so grade/xp/etc. stay current.
          getMe()
            .then(({ user: fresh }) => {
              setUserState(fresh);
              AsyncStorage.setItem(USER_KEY, JSON.stringify(fresh)).catch(() => {});
            })
            .catch(() => {});
        }
      } catch {
        // Corrupted storage — start signed out.
      } finally {
        setRestoring(false);
      }
    })();
  }, []);

  const signIn = useCallback(async (newToken: string, newUser: User) => {
    setToken(newToken);
    setUserState(newUser);
    await AsyncStorage.multiSet([
      [TOKEN_KEY, newToken],
      [USER_KEY, JSON.stringify(newUser)],
    ]);
  }, []);

  const signOut = useCallback(async () => {
    disconnectBattleSocket();
    setToken(null);
    setUserState(null);
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
  }, []);

  const setUser = useCallback((next: User) => {
    setUserState(next);
    AsyncStorage.setItem(USER_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const { user: fresh } = await getMe();
      setUserState(fresh);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(fresh));
    } catch {
      // Keep the cached user if the network is down.
    }
  }, []);

  const value = useMemo(
    () => ({ restoring, token, user, signIn, signOut, setUser, refreshUser }),
    [restoring, token, user, signIn, signOut, setUser, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
