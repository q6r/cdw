import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ApiError, api, setUnauthenticatedHandler } from "./api";
import type { User } from "./types";

interface AuthValue {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Em queda de rede ou 5xx, tenta de novo com espera crescente antes de
  // tratar a pessoa como deslogada (mesma regra do front anterior).
  const refresh = useCallback(async () => {
    for (let attempt = 0; ; attempt++) {
      try {
        const { user } = await api.get<{ user: User | null }>("/auth/me");
        setUser(user);
        break;
      } catch (e) {
        const status = e instanceof ApiError ? e.status : 0;
        if ((status === 0 || status >= 500) && attempt < 20) {
          await new Promise((r) => setTimeout(r, Math.min(3000, 500 * (attempt + 1))));
          continue;
        }
        setUser(null);
        break;
      }
    }
    setLoading(false);
  }, []);

  const logout = useCallback(async () => {
    await api.post("/auth/logout").catch(() => {});
    setUser(null);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    setUnauthenticatedHandler(() => setUser(null));
    return () => setUnauthenticatedHandler(null);
  }, []);

  const value = useMemo(() => ({ user, loading, setUser, refresh, logout }), [user, loading, refresh, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth fora do AuthProvider");
  return ctx;
}
