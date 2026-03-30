"use client";

import React from "react";
import { useTheme } from "@/context/theme-context";
import { useBranding } from "@/context/branding-context";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { branding, setBranding } = useBranding();

  const themes = [
    { id: "light", label: "☀️ Claro" },
    { id: "dark", label: "🌙 Escuro" },
    { id: "system", label: "💻 Sistema" }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-right-10 duration-700 pb-20">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold dark:text-white mb-2">Configurações Gerais</h1>
        <p className="text-gray-500 dark:text-gray-400">Configure os padrões para seus futuros projetos e o visual da ferramenta.</p>
      </header>

      <div className="space-y-12 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-8 rounded-3xl shadow-xl">
        {/* Appearance Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-sm font-bold text-white shadow-lg">T</span>
            <h2 className="text-xl font-semibold dark:text-white">Aparência do CRM</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id as any)}
                className={`flex flex-col items-center justify-center py-8 rounded-2xl border text-sm font-bold transition-all relative ${
                  theme === t.id 
                    ? "bg-blue-600 border-blue-500 text-white shadow-xl scale-[1.02] z-10" 
                    : "bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-500 hover:scale-[1.02] hover:bg-white dark:hover:bg-gray-700"
                }`}
              >
                <span className="text-3xl mb-2">{t.label.split(' ')[0]}</span>
                <span className="mb-0.5">{t.label.split(' ')[1]}</span>
                {theme === t.id && (
                  <div className="absolute top-2 right-2 w-2 h-2 bg-white rounded-full animate-pulse"></div>
                )}
              </button>
            ))}
          </div>
        </section>

        <hr className="border-gray-100 dark:border-gray-800" />

        {/* Branding Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-sm font-bold text-white shadow-lg">B</span>
            <h2 className="text-xl font-semibold dark:text-white">Identidade Visual</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Nome da Aplicação</label>
              <input 
                value={branding.appName}
                onChange={(e) => setBranding({ appName: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:text-white outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Logo / Emoji</label>
              <input 
                value={branding.logo}
                onChange={(e) => setBranding({ logo: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:text-white outline-none transition-all"
              />
            </div>
          </div>
        </section>

        <hr className="border-gray-100 dark:border-gray-800" />

        {/* Security & Preferences Section Placeholder */}
        <section className="space-y-6 opacity-30 pointer-events-none grayscale">
           <div className="flex items-center gap-3 mb-2">
            <span className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-sm font-bold text-white shadow-lg">S</span>
            <h2 className="text-xl font-semibold dark:text-white">Preferências de Conta</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
               <p className="text-xs font-bold text-gray-400 mb-2">Notificações por Email</p>
               <div className="w-12 h-6 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
             </div>
             <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
               <p className="text-xs font-bold text-gray-400 mb-2">Login em duas etapas</p>
               <div className="w-12 h-6 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
             </div>
          </div>
          <p className="text-[10px] uppercase tracking-widest font-bold text-blue-600 text-center animate-pulse">Breve: Novas Configurações</p>
        </section>

        <div className="flex justify-end pt-6">
          <button 
            disabled 
            className="bg-gray-200 dark:bg-gray-800 text-gray-400 px-10 py-5 text-base font-bold rounded-2xl transition-all cursor-not-allowed"
          >
            Configurações salvas automaticamente
          </button>
        </div>
      </div>
    </div>
  );
}
