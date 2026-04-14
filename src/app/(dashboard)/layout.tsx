"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Sidebar } from "@/components/layout/Sidebar";
import { SelectedVideoProvider } from "@/context/selected-video-context";
import { useLayout } from "@/context/layout-context";
import { NotificationBell } from "@/components/dashboard/NotificationBell";
import { useBranding } from "@/context/branding-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const { sidebarCollapsed } = useLayout();
  const { branding } = useBranding();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 gap-6">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-3xl border-4 border-blue-500/10 animate-pulse"></div>
          <div className="absolute inset-0 rounded-3xl border-t-4 border-blue-600 animate-spin" style={{ borderTopColor: branding.primaryColor }}></div>
          <div className="absolute inset-0 flex items-center justify-center text-4xl">🎬</div>
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-widest uppercase italic">{branding.appName}</h2>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] animate-pulse">Sincronizando Sessão...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <SelectedVideoProvider>
      <div className="flex h-screen bg-background text-foreground transition-colors duration-300 font-sans overflow-hidden">
        <Sidebar />
        <main 
          className={`flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 py-8 md:px-8 lg:px-12 md:py-10 transition-all duration-500 w-0 relative ${
            sidebarCollapsed ? "md:ml-20" : "md:ml-72"
          }`}
        >
          {/* Header Global Flutuante */}
          <div className="flex justify-between md:justify-end items-center sticky top-0 z-[40] mb-8 pointer-events-none">
             <div className="md:hidden pointer-events-auto bg-white dark:bg-gray-900 p-3 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl w-14 h-14 flex items-center justify-center overflow-hidden active:scale-95 transition-all">
                {branding.logo.length > 2 ? (
                  <img src={branding.logo} alt="Logo" className="w-10 h-10 object-contain" />
                ) : (
                  <span className="text-3xl">{branding.logo}</span>
                )}
             </div>
             <div className="pointer-events-auto bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-full p-1 border border-gray-200 dark:border-gray-800 shadow-lg">
                <NotificationBell />
             </div>
          </div>

          <div className="max-w-[1400px] mx-auto w-full min-w-0">
            {children}
          </div>
        </main>
      </div>
    </SelectedVideoProvider>
  );
}
