import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AuthUser {
  id: string;
  name: string | null;
  phone: string;
  creditBalance: number;
}

interface AuthContextType {
  user: AuthUser | null;
  sessionToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (phone: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = "milano_cab_auth";

interface StoredAuth {
  sessionToken: string;
  expiresAt: string;
  user: AuthUser;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      try {
        const auth: StoredAuth = JSON.parse(stored);
        const expiresAt = new Date(auth.expiresAt);
        
        if (expiresAt > new Date()) {
          setUser(auth.user);
          setSessionToken(auth.sessionToken);
        } else {
          // Session expired, clear it
          localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      } catch (e) {
        console.error("Error parsing stored auth:", e);
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (phone: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-phone`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ phone }),
        }
      );

      const data = await response.json();

      if (!data.success) {
        return { success: false, error: data.error || "Autenticazione fallita" };
      }

      // Store session
      const authData: StoredAuth = {
        sessionToken: data.sessionToken,
        expiresAt: data.expiresAt,
        user: {
          ...data.user,
          creditBalance: data.user.creditBalance ?? 0,
        },
      };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));

      setUser({ ...data.user, creditBalance: data.user.creditBalance ?? 0 });
      setSessionToken(data.sessionToken);

      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: "Errore di connessione" };
    }
  };

  const logout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
    setSessionToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        sessionToken,
        isAuthenticated: !!user && !!sessionToken,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
