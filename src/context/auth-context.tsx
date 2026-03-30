"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { onAuthStateChanged, User, sendEmailVerification } from "firebase/auth";
import { auth } from "@/lib/firebase/config";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  emailVerified: boolean;
  triggerVerification: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Se o auth não estiver inicializado (build time ou erro de config), aborta silenciosamente
    if (!auth) {
      console.warn("Firebase Auth não inicializado no AuthProvider.");
      setLoading(false);
      return;
    }

    try {
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        setLoading(false);
      }, (error) => {
        console.error("Erro no onAuthStateChanged:", error);
        setLoading(false);
      });
      return () => unsubscribe();
    } catch (err) {
      console.error("Falha ao escutar mudanças de autenticação:", err);
      setLoading(false);
    }
  }, []);

  const triggerVerification = async () => {
    if (user && !user.emailVerified) {
      await sendEmailVerification(user);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, emailVerified: !!user?.emailVerified, triggerVerification }}>
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
