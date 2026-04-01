"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { useBranding } from "@/context/branding-context";

export default function DashboardPage() {
  const { user } = useAuth();
  const { branding } = useBranding();
  const userName = user?.email?.split('@')[0] || "Visitante";

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-20">
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-3 text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-1">
           <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: branding.primaryColor }}></span>
           Visão Geral do Sistema
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tighter">
          Bem-vindo de volta, <span className="bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(to right, ${branding.primaryColor}, ${branding.secondaryColor})` }}>{userName}</span>
        </h1>
        <p className="text-gray-500 dark:text-gray-400 font-medium text-lg md:text-xl max-w-2xl">Aqui está o resumo da sua produtividade de vídeos e o status do sistema {branding.appName}.</p>
      </header>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-900 p-8 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-2xl dark:shadow-none flex flex-col justify-between h-44 group hover:border-primary transition-all duration-500 overflow-hidden relative">
           <div className="absolute -right-8 -top-8 w-24 h-24 bg-blue-500/5 rounded-full group-hover:scale-150 transition-transform duration-700" style={{ backgroundColor: `${branding.primaryColor}0D` }}></div>
           <div className="flex justify-between items-start relative z-10">
             <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Vídeos Gerados</span>
             <span className="p-3 bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-400 rounded-2xl group-hover:rotate-12 transition-transform" style={{ color: branding.primaryColor, backgroundColor: `${branding.primaryColor}1a` }}>🎥</span>
           </div>
           <div className="relative z-10">
             <span className="text-5xl font-black text-gray-900 dark:text-white">0</span>
             <span className="text-[10px] font-black text-green-500 ml-3 bg-green-500/10 px-2 py-1 rounded-lg border border-green-500/20">↑ 0% MES</span>
           </div>
        </div>
        <div className="bg-white dark:bg-gray-900 p-8 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-2xl dark:shadow-none flex flex-col justify-between h-44 group hover:border-primary transition-all duration-500 overflow-hidden relative">
           <div className="absolute -right-8 -top-8 w-24 h-24 bg-purple-500/5 rounded-full group-hover:scale-150 transition-transform duration-700" style={{ backgroundColor: `${branding.secondaryColor}0D` }}></div>
           <div className="flex justify-between items-start relative z-10">
             <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Armazenamento</span>
             <span className="p-3 bg-purple-50 dark:bg-purple-600/10 text-purple-600 dark:text-purple-400 rounded-2xl group-hover:-rotate-12 transition-transform" style={{ color: branding.secondaryColor, backgroundColor: `${branding.secondaryColor}1a` }}>💾</span>
           </div>
           <div className="relative z-10">
             <span className="text-5xl font-black text-gray-900 dark:text-white">0.0<span className="text-2xl text-gray-400 ml-1">GB</span></span>
             <div className="w-32 h-1 bg-gray-100 dark:bg-gray-800 rounded-full mt-3 overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '2%', backgroundColor: branding.primaryColor }}></div>
             </div>
           </div>
        </div>
        <div className="bg-white dark:bg-gray-900 p-8 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-2xl dark:shadow-none flex flex-col justify-between h-44 group hover:border-primary transition-all duration-500 overflow-hidden relative">
           <div className="absolute -right-8 -top-8 w-24 h-24 bg-yellow-500/5 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
           <div className="flex justify-between items-start relative z-10">
             <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Status do Plano</span>
             <span className="p-3 bg-yellow-50 dark:bg-yellow-600/10 text-yellow-600 dark:text-yellow-400 rounded-2xl group-hover:scale-110 transition-transform">⭐</span>
           </div>
           <div className="relative z-10">
             <span className="text-4xl font-black text-gray-900 dark:text-white">Gratuito</span>
             <button className="block text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mt-2 hover:opacity-70" style={{ color: branding.primaryColor }}>Fazer Upgrade Agora »</button>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 pt-4">
         {/* Atalhos */}
         <div className="lg:col-span-1 space-y-6">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Atalhos Eficientes</h2>
            <div className="grid grid-cols-1 gap-5">
               {[
                 { label: "Explorar Cenas", sub: "Novos clipes épicos", icon: "🔍", href: "/buscar-cenas", color: branding.primaryColor },
                 { label: "Sua Biblioteca", sub: "Projetos salvos", icon: "📚", href: "/biblioteca", color: branding.secondaryColor },
                 { label: "Branding", sub: "Logo e cores", icon: "🎨", href: "/configuracoes", color: "#6b7280" }
               ].map((item) => (
                  <Link 
                    key={item.href} 
                    href={item.href} 
                    className="flex items-center gap-5 p-5 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 hover:border-primary dark:hover:border-gray-700 transition-all shadow-xl dark:shadow-none group"
                  >
                    <div 
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-300"
                      style={{ backgroundColor: `${item.color}15`, color: item.color }}
                    >
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="font-black text-gray-900 dark:text-white text-lg leading-tight group-hover:text-primary transition-colors" style={{ color: item.color === branding.primaryColor ? branding.primaryColor : undefined }}>{item.label}</h3>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">{item.sub}</p>
                    </div>
                  </Link>
               ))}
            </div>
         </div>

         {/* Projetos Recentes */}
         <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-end">
               <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Feed de Atividade</h2>
               <Link href="/biblioteca" className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.15em] border-b-2 border-transparent hover:border-current transition-all" style={{ color: branding.primaryColor }}>Ver Galeria Completa</Link>
            </div>
            
            <div className="bg-white dark:bg-gray-900 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-[2.5rem] p-12 flex flex-col items-center justify-center text-center space-y-6 min-h-[400px] shadow-inner">
               <div className="w-28 h-28 bg-gray-50 dark:bg-gray-800/50 rounded-full flex items-center justify-center text-5xl mb-2 animate-pulse">
                 {branding.logo}
               </div>
               <div className="space-y-2">
                 <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Câmera, Ação! 🎬</h3>
                 <p className="text-gray-500 dark:text-gray-400 font-medium text-lg max-w-sm">Você ainda não tem nenhum projeto. Que tal começar a busca por cenas agora mesmo?</p>
               </div>
               <Link href="/buscar-cenas">
                 <button className="mt-4 px-10 py-5 text-white font-black rounded-2xl shadow-2xl shadow-blue-600/20 transform hover:-translate-y-1 active:translate-y-0 transition-all text-lg tracking-tight" style={{ backgroundColor: branding.primaryColor }}>
                   Buscar minas primeiras cenas 🚀
                 </button>
               </Link>
            </div>
         </div>
      </div>
    </div>
  );
}
