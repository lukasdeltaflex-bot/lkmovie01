"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface Branding {
  appName: string;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  defaultWatermark: string;
  defaultEndScreen: string;
}

interface BrandingContextType {
  branding: Branding;
  setBranding: (branding: Partial<Branding>) => void;
}

const defaultBranding: Branding = {
  appName: "LKMOVIE01",
  logo: "🎬",
  primaryColor: "#2563eb", // blue-600
  secondaryColor: "#4f46e5", // indigo-600
  defaultWatermark: "",
  defaultEndScreen: "",
};

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [branding, setBrandingState] = useState<Branding>(defaultBranding);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("branding_config");
    if (saved) {
      try {
        setBrandingState(JSON.parse(saved));
      } catch (e) {
        console.error("Erro ao dar parse no branding", e);
      }
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("branding_config", JSON.stringify(branding));
      
      // Aplicar variáveis CSS globais
      const root = document.documentElement;
      root.style.setProperty("--primary", branding.primaryColor);
      root.style.setProperty("--secondary", branding.secondaryColor);
      
      // Gerar versões RGBA para transparências se necessário
      const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : null;
      };
      
      const rgbPrimary = hexToRgb(branding.primaryColor);
      if (rgbPrimary) root.style.setProperty("--primary-rgb", rgbPrimary);
    }
  }, [branding, mounted]);

  const setBranding = (newBranding: Partial<Branding>) => {
    setBrandingState((prev) => ({ ...prev, ...newBranding }));
  };

  return (
    <BrandingContext.Provider value={{ branding, setBranding }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  const context = useContext(BrandingContext);
  if (context === undefined) {
    throw new Error("useBranding must be used within a BrandingProvider");
  }
  return context;
}
