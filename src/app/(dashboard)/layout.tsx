"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Sidebar } from "@/components/layout/Sidebar";
import { SelectedVideoProvider } from "@/context/selected-video-context";
import { useLayout } from "@/context/layout-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const { sidebarCollapsed } = useLayout();
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
      <div className="flex h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
        <Sidebar />
        <main 
          className={`flex-1 overflow-y-auto p-4 md:p-8 transition-all duration-300 ${
            sidebarCollapsed ? "ml-0 md:ml-20" : "ml-0 md:ml-64"
          }`}
        >
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </SelectedVideoProvider>
  );
}
