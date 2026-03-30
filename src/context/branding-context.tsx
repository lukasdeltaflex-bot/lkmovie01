"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface Branding {
  appName: string;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
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
};

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [branding, setBrandingState] = useState<Branding>(defaultBranding);

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
