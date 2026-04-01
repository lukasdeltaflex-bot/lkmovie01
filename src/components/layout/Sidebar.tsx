"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayout } from "@/context/layout-context";
import { signOutUser } from "@/lib/firebase/auth";
import { useAuth } from "@/context/auth-context";
import { useBranding } from "@/context/branding-context";
import { useTheme } from "@/context/theme-context";

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, setSidebarCollapsed } = useLayout();
  const { branding } = useBranding();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: "📊" },
    { label: "Buscar Cenas", href: "/buscar-cenas", icon: "🔍" },
    { label: "Biblioteca", href: "/biblioteca", icon: "📚" },
    { label: "Configurações", href: "/configuracoes", icon: "⚙️" },
  ];

  const handleLogout = async () => {
    try { await signOutUser(); } catch (err) { console.error("Erro ao sair:", err); }
  };

  const closeMobile = () => setIsMobileOpen(false);

  return (
    <>
      {/* MOBILE TRIGGER - FLOATING */}
      <button 
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed bottom-6 right-6 md:hidden z-100 w-16 h-16 rounded-full bg-blue-600 text-white shadow-2xl flex items-center justify-center text-2xl active:scale-95 transition-all animate-in zoom-in duration-500"
        style={{ backgroundColor: branding.primaryColor }}
      >
        {isMobileOpen ? "✕" : "☰"}
      </button>

      {/* MOBILE OVERLAY */}
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-90 md:hidden animate-in fade-in duration-300" onClick={closeMobile}></div>
      )}

      <aside 
        className={`fixed top-0 left-0 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 flex flex-col z-95 shadow-xl dark:shadow-none 
        ${sidebarCollapsed ? "w-20" : "w-72"} 
        ${isMobileOpen ? "translate-x-0 w-72" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Toggle Button - Desktop Only */}
        <button 
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="hidden md:flex absolute -right-3 top-8 bg-blue-600 text-white w-6 h-6 rounded-full items-center justify-center hover:bg-blue-500 transition-all shadow-lg active:scale-90 z-10"
          style={{ backgroundColor: branding.primaryColor }}
        >
          <span className={`text-[10px] transform transition-transform duration-300 ${sidebarCollapsed ? "rotate-180" : ""}`}>◀</span>
        </button>

        {/* Header */}
        <div className={`p-6 transition-all duration-300 ${(sidebarCollapsed && !isMobileOpen) ? "opacity-0 invisible h-0 overflow-hidden p-0" : "opacity-100 visible h-auto"}`}>
          <h2 className="text-2xl font-black whitespace-nowrap flex items-center gap-3">
            <span className="text-3xl filter drop-shadow-md">{branding.logo}</span>
            <span className="tracking-tighter bg-clip-text text-transparent italic" style={{ backgroundImage: `linear-gradient(to right, ${branding.primaryColor}, ${branding.secondaryColor})` }}>
              {branding.appName}
            </span>
          </h2>
        </div>
        
        <div className={`p-6 transition-all duration-300 flex justify-center ${(sidebarCollapsed && !isMobileOpen) ? "opacity-100 visible" : "opacity-0 invisible h-0 overflow-hidden p-0"}`}>
           <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-2xl shadow-xl transition-all duration-500" style={{ background: `linear-gradient(to bottom right, ${branding.primaryColor}, ${branding.secondaryColor})` }}>
             {branding.logo}
           </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto custom-scrollbar">
          <div className={`text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 ml-2 transition-opacity duration-300 ${(sidebarCollapsed && !isMobileOpen) ? 'opacity-0' : 'opacity-100'}`}>Menu Principal</div>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href}
                href={item.href} 
                onClick={closeMobile}
                className={`flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 overflow-hidden whitespace-nowrap group relative ${
                  isActive 
                    ? "bg-blue-50 dark:bg-gray-800 font-bold" 
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
                style={isActive ? { color: branding.primaryColor } : {}}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 rounded-r-full" style={{ backgroundColor: branding.primaryColor }}></div>
                )}
                <span className={`text-xl shrink-0 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>{item.icon}</span>
                <span className={`transition-opacity duration-300 ${(sidebarCollapsed && !isMobileOpen) ? "opacity-0" : "opacity-100"}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Footer / User Profile Menu */}
        <div className="p-4 relative mt-auto border-t border-gray-100 dark:border-gray-800">
           {isMenuOpen && (!sidebarCollapsed || isMobileOpen) && (
              <div className="absolute bottom-[90px] left-4 right-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)] p-2 animate-in fade-in slide-in-from-bottom-2 duration-200 z-50 overflow-hidden">
                 <Link href="/perfil" onClick={() => {setIsMenuOpen(false); closeMobile();}} className="flex items-center gap-3 w-full px-4 py-4 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-2xl transition-colors text-xs font-black uppercase tracking-widest text-gray-700 dark:text-gray-200">
                   <span className="text-lg">👤</span> Meu Perfil
                 </Link>
                 <Link href="/configuracoes" onClick={() => {setIsMenuOpen(false); closeMobile();}} className="flex items-center gap-3 w-full px-4 py-4 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-2xl transition-colors text-xs font-black uppercase tracking-widest text-gray-700 dark:text-gray-200">
                   <span className="text-lg">⚙️</span> Configurações
                 </Link>
                 <div className="my-2 border-t border-gray-200 dark:border-gray-700 opacity-50"></div>
                 <div className="px-4 py-2 flex items-center justify-between">
                   <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Interface</span>
                   <div className="flex bg-gray-100 dark:bg-gray-900 rounded-xl p-1">
                     <button onClick={() => setTheme("light")} className={`p-2 rounded-lg text-xs transition-colors ${theme === 'light' ? 'bg-white shadow dark:bg-gray-700 text-yellow-500' : 'text-gray-400'}`}>☀️</button>
                     <button onClick={() => setTheme("dark")} className={`p-2 rounded-lg text-xs transition-colors ${theme === 'dark' ? 'bg-white shadow dark:bg-gray-700 text-blue-400' : 'text-gray-400'}`}>🌙</button>
                     <button onClick={() => setTheme("system")} className={`p-2 rounded-lg text-xs transition-colors ${theme === 'system' ? 'bg-white shadow dark:bg-gray-700 text-gray-800 dark:text-gray-200' : 'text-gray-400'}`}>💻</button>
                   </div>
                 </div>
                 <div className="my-2 border-t border-gray-200 dark:border-gray-700 opacity-50"></div>
                 <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-4 hover:bg-red-50 dark:hover:bg-red-900/10 text-red-500 rounded-2xl transition-colors text-xs font-black uppercase tracking-[0.2em]">
                   <span className="text-lg">🚪</span> Sair
                 </button>
              </div>
           )}

          <div 
             onClick={() => (!sidebarCollapsed || isMobileOpen) && setIsMenuOpen(!isMenuOpen)}
             className={`flex items-center gap-3 p-3 rounded-2xl hover:bg-gray-50 dark:bg-gray-800/50 dark:hover:bg-gray-800 transition-all cursor-pointer border border-transparent dark:border-gray-700 ${(sidebarCollapsed && !isMobileOpen) ? "justify-center" : "shadow-sm"}`}
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shrink-0 border-2 border-white dark:border-gray-950 shadow-lg" style={{ background: `linear-gradient(to top right, ${branding.primaryColor}, ${branding.secondaryColor})` }}>
              {user?.email?.[0].toUpperCase() || "U"}
            </div>
            <div className={`transition-opacity duration-300 overflow-hidden flex-1 ${(sidebarCollapsed && !isMobileOpen) ? "opacity-0 w-0" : "opacity-100"}`}>
              <p className="text-sm font-black text-gray-900 dark:text-white truncate italic uppercase tracking-tighter">
                {user?.email?.split('@')[0] || "Usuário"}
              </p>
              <p className="text-[10px] text-gray-500 font-bold truncate tracking-widest">{user?.email}</p>
            </div>
            {(!sidebarCollapsed || isMobileOpen) && (
               <div className={`text-gray-400 text-xs transition-transform duration-300 ${isMenuOpen ? "rotate-180" : ""}`}>▲</div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
