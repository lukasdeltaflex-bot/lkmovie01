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
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
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
