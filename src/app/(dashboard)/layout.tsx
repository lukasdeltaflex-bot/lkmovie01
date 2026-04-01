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
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 gap-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="font-bold text-blue-600 animate-pulse">Carregando LKMOVIE01...</span>
      </div>
    );
  }

  if (!user) return null;

  return (
    <SelectedVideoProvider>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300 overflow-hidden">
        <Sidebar />
        <main 
          className={`flex-1 overflow-y-auto p-4 md:p-8 transition-all duration-300 w-full ${
            sidebarCollapsed ? "md:ml-20" : "md:ml-64"
          }`}
        >
          {/* Header Global Flutuante / Home Mobile Trigger */}
          <div className="flex justify-between md:justify-end items-center sticky top-0 z-30 mb-8 pointer-events-none">
             <div className="md:hidden pointer-events-auto bg-white/80 dark:bg-gray-950/80 backdrop-blur-md p-2 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xl w-12 h-12 flex items-center justify-center overflow-hidden">
                {branding.logo.length > 2 ? (
                  <img src={branding.logo} alt="Logo" className="w-8 h-8 object-contain" />
                ) : (
                  <span className="text-2xl">{branding.logo}</span>
                )}
             </div>
             <div className="pointer-events-auto">
                <NotificationBell />
             </div>
          </div>

          <div className="max-w-[1600px] mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </SelectedVideoProvider>
  );
}
