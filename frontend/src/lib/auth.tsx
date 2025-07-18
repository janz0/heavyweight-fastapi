// File: lib/auth.ts
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}

interface AuthContextType {
  authToken: string | null;
  user: User | null;
  isChecking: boolean;
  signIn: (token: string) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType>({
  authToken: null,
  user: null,
  isChecking: true,
  signIn: () => {},
  signOut: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  // helper to fetch /users/me
  async function loadUser(token: string) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch /me");
      const u: User = await res.json();
      setUser(u);
    } catch {
      setUser(null);
      setAuthToken(null);
      document.cookie = "auth_token=; path=/; max-age=0";
      localStorage.removeItem("auth_token");
    }
  }

  useEffect(() => {
    // On mount, read the cookie (if any) and also mirror into state
    const cookieToken = parseCookie("auth_token");
    if (cookieToken) {
      setAuthToken(cookieToken || null);
      loadUser(cookieToken).finally(() => setIsChecking(false));
    } else {
      setIsChecking(false);
    }
  }, []);

  const signIn = (token: string) => {
    // 1) Store in local state (so client components can immediately read it)
    setAuthToken(token);

    // 2) Persist to cookie (so middleware can read it on server-side requests)
    //    We'll set a non-HTTP-only cookie for simplicity—if you want httponly,
    //    you'd need to set it via an API route.
    document.cookie = `auth_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}`;

    loadUser(token);
    // 3) (Optional) Keep it in localStorage as well, if any other code relies on localStorage
    localStorage.setItem("auth_token", token);
  };

  const signOut = () => {
    setAuthToken(null);
    setUser(null);
    document.cookie = "auth_token=; path=/; max-age=0"; // clear cookie
    localStorage.removeItem("auth_token");
  };

  return (
    <AuthContext.Provider value={{ authToken, user, isChecking, signIn, signOut }}>
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
