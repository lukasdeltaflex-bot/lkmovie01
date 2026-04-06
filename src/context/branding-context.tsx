"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./auth-context";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Toast } from "@/components/ui/Toast";

import { UserSettings, UserUsage, UserAnalytics } from "@/types/project.d";

export interface Branding {
  appName: string;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  defaultWatermark: string;
  defaultEndScreen: string;
  hasSeenOnboarding: boolean;
  goal?: string;
  stylePreference?: string;
  plan?: "free" | "pro";
  usage?: UserUsage;
  analytics?: UserAnalytics;
  referralCode?: string;
}

interface BrandingContextType {
  branding: Branding;
  setBranding: (branding: Partial<Branding>, persist?: boolean) => Promise<void>;
  loading: boolean;
  showToast: (message: string, type?: "success" | "error" | "info" | "warning") => void;
}

const defaultBranding: Branding = {
  appName: "LKMOVIE01",
  logo: "🎥",
  primaryColor: "#2563eb", // Blue 600
  secondaryColor: "#7c3aed", // Violet 600
  defaultWatermark: "",
  defaultEndScreen: "",
  hasSeenOnboarding: false,
};

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export function BrandingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [branding, setBrandingState] = useState<Branding>(defaultBranding);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" | "warning" } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sincronizacao com Firestore em tempo real
  useEffect(() => {
    if (!user || !db) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const docRef = doc(db, "user_settings", user.uid);
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setBrandingState(docSnap.data() as Branding);
      } else {
        // Se nao existir, tenta pegar do localStorage como fallback inicial
        const saved = localStorage.getItem("branding_config");
        if (saved) {
          try {
            setBrandingState(JSON.parse(saved));
          } catch (e) {
            setBrandingState(defaultBranding);
          }
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Efeito para aplicar variaveis CSS e salvar localmente
  useEffect(() => {
    if (mounted) {
      localStorage.setItem("branding_config", JSON.stringify(branding));
      
      const root = document.documentElement;
      root.style.setProperty("--primary", branding.primaryColor);
      root.style.setProperty("--secondary", branding.secondaryColor);
      
      const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : null;
      };
      
      const rgbPrimary = hexToRgb(branding.primaryColor);
      if (rgbPrimary) root.style.setProperty("--primary-rgb", rgbPrimary);
    }
  }, [branding, mounted]);

  const showToast = (message: string, type: "success" | "error" | "info" | "warning" = "info") => {
    setToast({ message, type });
  };

  const setBranding = async (newBranding: Partial<Branding>, persist = true) => {
    const updated = { ...branding, ...newBranding };
    setBrandingState(updated);

    if (persist && user && db) {
      try {
        const docRef = doc(db, "user_settings", user.uid);
        await setDoc(docRef, updated, { merge: true });
      } catch (error) {
        console.error("Erro ao persistir branding no Firestore:", error);
      }
    }
  };

  return (
    <ThemeWrapper mounted={mounted}>
      <BrandingContext.Provider value={{ branding, setBranding, loading, showToast }}>
        {children}
        {toast && (
          <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={() => setToast(null)} 
          />
        )}
      </BrandingContext.Provider>
    </ThemeWrapper>
  );
}

// Wrapper para evitar flashes de cor desnecessarios
function ThemeWrapper({ children, mounted }: { children: ReactNode, mounted: boolean }) {
  return (
    <div style={{ opacity: mounted ? 1 : 0, transition: 'opacity 0.5s ease-in-out' }}>
      {children}
    </div>
  );
}

export function useBranding() {
  const context = useContext(BrandingContext);
  if (context === undefined) {
    throw new Error("useBranding must be used within a BrandingProvider");
  }
  return context;
}
