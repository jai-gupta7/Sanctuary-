import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";

import { authApi, clearAuthTokens, getAuthTokens, setAuthTokens, usersApi } from "./api";
import { normalizeIndianPhone } from "./phone";
import type { CurrentUserPayload } from "./types";

type AuthContextValue = {
  currentUser: CurrentUserPayload | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  pendingPhone: string;
  setPendingPhone: (phone: string) => void;
  requestOtp: (phone: string) => Promise<{ expiresIn: number; devOtp?: string }>;
  verifyOtp: (phone: string, otp: string) => Promise<CurrentUserPayload>;
  refreshCurrentUser: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentUserPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingPhone, setPendingPhoneState] = useState(() => {
    const storedPhone = window.localStorage.getItem("shared-living-os.pending-phone") ?? "";
    return normalizeIndianPhone(storedPhone) ?? "";
  });

  const setPendingPhone = useCallback((phone: string) => {
    const normalizedPhone = phone ? normalizeIndianPhone(phone) ?? phone : "";
    setPendingPhoneState(normalizedPhone);
    if (!normalizedPhone) {
      window.localStorage.removeItem("shared-living-os.pending-phone");
      return;
    }
    window.localStorage.setItem("shared-living-os.pending-phone", normalizedPhone);
  }, []);

  const refreshCurrentUser = useCallback(async () => {
    const tokens = getAuthTokens();
    if (!tokens?.accessToken) {
      setCurrentUser(null);
      return;
    }

    try {
      const user = await usersApi.getMe();
      setCurrentUser(user);
    } catch {
      clearAuthTokens();
      setCurrentUser(null);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        await refreshCurrentUser();
      } finally {
        setIsLoading(false);
      }
    })();
  }, [refreshCurrentUser]);

  const requestOtp = useCallback(
    async (phone: string) => {
      const normalizedPhone = normalizeIndianPhone(phone) ?? phone;
      const result = await authApi.requestOtp(normalizedPhone);
      setPendingPhone(result.phone);
      return {
        expiresIn: result.expiresIn,
        devOtp: result.devOtp
      };
    },
    [setPendingPhone]
  );

  const verifyOtp = useCallback(
    async (phone: string, otp: string) => {
      const normalizedPhone = normalizeIndianPhone(phone) ?? phone;
      const result = await authApi.verifyOtp(normalizedPhone, otp);
      setAuthTokens(result.tokens);
      setPendingPhone("");
      const me = await usersApi.getMe();
      setCurrentUser(me);
      return me;
    },
    [setPendingPhone]
  );

  const logout = useCallback(async () => {
    const refreshToken = getAuthTokens()?.refreshToken;
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch {
        // Best effort logout.
      }
    }

    clearAuthTokens();
    setCurrentUser(null);
    setPendingPhone("");
  }, [setPendingPhone]);

  const value = useMemo<AuthContextValue>(
    () => ({
      currentUser,
      isAuthenticated: Boolean(currentUser),
      isAdmin: currentUser?.user.role === "admin",
      isLoading,
      pendingPhone,
      setPendingPhone,
      requestOtp,
      verifyOtp,
      refreshCurrentUser,
      logout
    }),
    [currentUser, isLoading, logout, pendingPhone, refreshCurrentUser, requestOtp, setPendingPhone, verifyOtp]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
