// File: lib/auth.ts
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface AuthContextType {
  authToken: string | null;
  isChecking: boolean;
  signIn: (token: string) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType>({
  authToken: null,
  isChecking: true,
  signIn: () => {},
  signOut: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // On mount, read the cookie (if any) and also mirror into state
    const cookieToken = parseCookie("auth_token");
    setAuthToken(cookieToken || null);
    setIsChecking(false);
  }, []);

  const signIn = (token: string) => {
    // 1) Store in local state (so client components can immediately read it)
    setAuthToken(token);

    // 2) Persist to cookie (so middleware can read it on server-side requests)
    //    We'll set a non-HTTP-only cookie for simplicity—if you want httponly,
    //    you'd need to set it via an API route.
    document.cookie = `auth_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}`;

    // 3) (Optional) Keep it in localStorage as well, if any other code relies on localStorage
    localStorage.setItem("auth_token", token);
  };

  const signOut = () => {
    setAuthToken(null);
    document.cookie = "auth_token=; path=/; max-age=0"; // clear cookie
    localStorage.removeItem("auth_token");
  };

  return (
    <AuthContext.Provider value={{ authToken, isChecking, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

// Helper to parse a simple cookie by name
function parseCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const matches = document.cookie.match(
    new RegExp(
      "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, "\\$1") + "=([^;]*)"
    )
  );
  return matches ? decodeURIComponent(matches[1]) : null;
}
