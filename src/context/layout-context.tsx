"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface LayoutContextType {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (value: boolean) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsedState] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    if (saved !== null) {
      setSidebarCollapsedState(saved === "true");
    }
  }, []);

  const setSidebarCollapsed = (value: boolean) => {
    setSidebarCollapsedState(value);
    localStorage.setItem("sidebarCollapsed", String(value));
  };

  return (
    <LayoutContext.Provider value={{ sidebarCollapsed, setSidebarCollapsed }}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error("useLayout must be used within a LayoutProvider");
  }
  return context;
}
