"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";

export default function DashboardPage() {
  const { user } = useAuth();
  const userName = user?.email?.split('@')[0] || "Visitante";

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <header className="flex flex-col gap-2">
        <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">
          Bem-vindo de volta, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">{userName}</span>
        </h1>
        <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">Aqui está o resumo da sua produtividade de vídeos de hoje.</p>
      </header>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xl dark:shadow-none flex flex-col justify-between h-36 transform hover:-translate-y-1 transition-transform">
           <div className="flex justify-between items-start">
             <span className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Vídeos Gerados</span>
             <span className="p-2 bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-400 rounded-xl">🎥</span>
           </div>
           <div>
             <span className="text-4xl font-black text-gray-900 dark:text-white">0</span>
             <span className="text-xs font-bold text-green-500 ml-2">↑ 0% esse mês</span>
           </div>
        </div>
        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xl dark:shadow-none flex flex-col justify-between h-36 transform hover:-translate-y-1 transition-transform">
           <div className="flex justify-between items-start">
             <span className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Armazenamento</span>
             <span className="p-2 bg-purple-50 dark:bg-purple-600/10 text-purple-600 dark:text-purple-400 rounded-xl">💾</span>
           </div>
           <div>
             <span className="text-4xl font-black text-gray-900 dark:text-white">0.0<span className="text-2xl text-gray-400 ml-1">GB</span></span>
             <span className="text-xs font-medium text-gray-500 ml-2">de 5GB no plano free</span>
           </div>
        </div>
        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xl dark:shadow-none flex flex-col justify-between h-36 transform hover:-translate-y-1 transition-transform">
           <div className="flex justify-between items-start">
             <span className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Plano Atual</span>
             <span className="p-2 bg-yellow-50 dark:bg-yellow-600/10 text-yellow-600 dark:text-yellow-400 rounded-xl">⭐</span>
           </div>
           <div>
             <span className="text-3xl font-black text-gray-900 dark:text-white">Gratuito</span>
             <button className="text-xs font-bold text-blue-600 dark:text-blue-400 underline ml-2 hover:text-blue-500">Fazer Upgrade</button>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Atalhos */}
         <div className="lg:col-span-1 space-y-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Acesso Rápido</h2>
            <div className="grid grid-cols-1 gap-4">
               <Link href="/buscar-cenas" className="flex items-center gap-4 p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 transition-colors shadow-sm group">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">🔍</div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">Explorar Cenas</h3>
                    <p className="text-xs text-gray-500">Busque novos clipes agora</p>
                  </div>
               </Link>
               <Link href="/biblioteca" className="flex items-center gap-4 p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 transition-colors shadow-sm group">
                  <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-600/10 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">📚</div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">Sua Biblioteca</h3>
                    <p className="text-xs text-gray-500">Acesse seus projetos salvos</p>
                  </div>
               </Link>
               <Link href="/configuracoes" className="flex items-center gap-4 p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-600 transition-colors shadow-sm group">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">⚙️</div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">Ajustar Branding</h3>
                    <p className="text-xs text-gray-500">Altere logo e cores do sistema</p>
                  </div>
               </Link>
            </div>
         </div>

         {/* Projetos Recentes Empty State */}
         <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-center">
               <h2 className="text-xl font-bold text-gray-900 dark:text-white">Atividade Recente</h2>
               <Link href="/biblioteca" className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline">Ver tudo</Link>
            </div>
            
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center text-center space-y-4 min-h-[300px]">
               <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-4xl mb-2 opacity-50">
                 🎬
               </div>
               <h3 className="text-lg font-bold text-gray-900 dark:text-white">Nenhum projeto ainda</h3>
               <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm">Você ainda não gerou ou editou nenhuma cena. Que tal buscar algumas ideias de vídeos agora?</p>
               <Link href="/buscar-cenas" className="mt-4 px-6 py-3 bg-gray-900 dark:bg-blue-600 text-white font-bold rounded-xl hover:bg-gray-800 dark:hover:bg-blue-500 transition-colors shadow-lg">
                 Começar meu primeiro vídeo
               </Link>
            </div>
         </div>
      </div>
    </div>
  );
}
