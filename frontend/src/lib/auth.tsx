"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode
} from "react";
import { useRouter } from "next/navigation";

interface User { id: string; email: string; /*…*/ }

interface AuthContext {
  user: User | null;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
}

const AuthCtx = createContext<AuthContext | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  // on mount, try to load a token & fetch /users/me
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then(setUser)
        .catch(() => localStorage.removeItem("token"));
    }
  }, []);

  const login = async (email: string, password: string) => {
    const form = new URLSearchParams({ username: email, password });
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/users/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form,
      }
    );
    if (!res.ok) throw new Error("Invalid creds");
    const { access_token } = await res.json();
    localStorage.setItem("token", access_token);

    const me = await (await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/users/me`,
      { headers: { Authorization: `Bearer ${access_token}` } }
    )).json();
    setUser(me);
    router.push("/");
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthCtx.Provider value={{ user, login, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};
