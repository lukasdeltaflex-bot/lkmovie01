"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { useBranding } from "@/context/branding-context";
import { getRecentProjects, SavedProject, getUserProjects } from "@/lib/firebase/projects";
import { getUserSearchHistory, SearchRecord } from "@/lib/firebase/search";
import { Button } from "@/components/ui/Button";
import { OnboardingModal } from "@/components/dashboard/OnboardingModal";
import { createNotification } from "@/lib/firebase/notifications";

export default function DashboardPage() {
  const { user } = useAuth();
  const { branding, setBranding } = useBranding();
  const [recentProjects, setRecentProjects] = useState<SavedProject[]>([]);
  const [recentSearches, setRecentSearches] = useState<SearchRecord[]>([]);
  const [totalProjects, setTotalProjects] = useState(0);
  const [loading, setLoading] = useState(true);

  const userName = user?.email?.split('@')[0] || "Visitante";

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const [projects, searches, allProjects] = await Promise.all([
          getRecentProjects(user.uid, 3),
          getUserSearchHistory(user.uid, 5),
          getUserProjects(user.uid)
        ]);
        setRecentProjects(projects);
        setRecentSearches(searches);
        setTotalProjects(allProjects.length);
      } catch (error) {
        console.error("Erro ao carregar Dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Estimar armazenamento (ex: 50MB por projeto simulado)
  const estimatedStorage = (totalProjects * 0.05).toFixed(2);
  const storagePercentage = Math.min(100, Math.max(2, (totalProjects / 100) * 100));

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center min-h-[60vh] animate-in fade-in duration-500 font-black text-xs uppercase tracking-[0.3em] text-gray-500">
        Sincronizando Dashboard SaaS...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-20">
      
      {!branding.hasSeenOnboarding && (
        <OnboardingModal onComplete={() => {
          setBranding({ hasSeenOnboarding: true });
          if (user) {
            createNotification(user.uid, {
              title: "Bem-vindo ao Time! 🚀",
              message: "Sua jornada cinematográfica começou. Explore o menu para criar sua primeira cena.",
              type: "success"
            });
          }
        }} />
      )}

      <header className="flex flex-col gap-4">
        <div className="flex items-center gap-3 text-xs font-black text-gray-400 uppercase tracking-[0.3em]">
           <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: branding.primaryColor }}></span>
           Centro de Comando Live
        </div>
        <h1 className="text-5xl md:text-6xl font-black text-gray-900 dark:text-white tracking-tighter leading-none">
          Olá, <span className="bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(to right, ${branding.primaryColor}, ${branding.secondaryColor})` }}>{userName}</span>
        </h1>
        <p className="text-gray-500 dark:text-gray-400 font-bold text-lg md:text-xl max-w-2xl">Seu ecossistema cinematográfico {branding.appName} está operacional.</p>
      </header>

      {/* MÉTRICAS REAIS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white dark:bg-gray-950 p-10 rounded-4xl border border-gray-100 dark:border-gray-800 shadow-2xl dark:shadow-none flex flex-col justify-between h-52 group hover:border-primary transition-all duration-500 overflow-hidden relative">
            <div className="absolute -right-12 -top-12 w-40 h-40 rounded-full group-hover:scale-150 transition-transform duration-1000 opacity-10" style={{ backgroundColor: branding.primaryColor }}></div>
            <div className="flex justify-between items-start relative z-10">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Vídeos Ativos Cloud</span>
              <span className="p-4 bg-gray-50 dark:bg-black text-xl rounded-2xl group-hover:rotate-12 transition-transform shadow-inner border border-gray-100 dark:border-gray-800" style={{ color: branding.primaryColor }}>💎</span>
            </div>
            <div className="relative z-10">
              <span className="text-6xl font-black text-gray-900 dark:text-white tracking-tighter">{totalProjects}</span>
              <span className="text-[10px] font-black text-green-500 ml-4 bg-green-500/10 px-3 py-1.5 rounded-xl border border-green-500/20 uppercase tracking-widest">Live Sync</span>
            </div>
        </div>

        <div className="bg-white dark:bg-gray-950 p-10 rounded-4xl border border-gray-100 dark:border-gray-800 shadow-2xl dark:shadow-none flex flex-col justify-between h-52 group hover:border-primary transition-all duration-500 overflow-hidden relative">
            <div className="absolute -right-12 -top-12 w-40 h-40 rounded-full group-hover:scale-150 transition-transform duration-1000 opacity-10" style={{ backgroundColor: branding.secondaryColor }}></div>
            <div className="flex justify-between items-start relative z-10">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Storage Estimado</span>
              <span className="p-4 bg-gray-50 dark:bg-black text-xl rounded-2xl group-hover:-rotate-12 transition-transform shadow-inner border border-gray-100 dark:border-gray-800" style={{ color: branding.secondaryColor }}>💾</span>
            </div>
            <div className="relative z-10 space-y-4">
              <span className="text-6xl font-black text-gray-900 dark:text-white tracking-tighter">{estimatedStorage}<span className="text-2xl text-gray-400 ml-1">GB</span></span>
              <div className="w-full h-2 bg-gray-100 dark:bg-gray-900 rounded-full overflow-hidden shadow-inner">
                 <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: `${storagePercentage}%`, backgroundColor: branding.primaryColor }}></div>
              </div>
            </div>
        </div>

        <div className="bg-white dark:bg-gray-950 p-10 rounded-4xl border border-gray-100 dark:border-gray-800 shadow-2xl dark:shadow-none flex flex-col justify-between h-52 group hover:border-primary transition-all duration-500 overflow-hidden relative">
            <div className="absolute -right-12 -top-12 w-40 h-40 bg-yellow-500/10 rounded-full group-hover:scale-150 transition-transform duration-1000"></div>
            <div className="flex justify-between items-start relative z-10">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Nível de Acesso</span>
              <span className="p-4 bg-yellow-50 dark:bg-yellow-900/10 text-yellow-600 dark:text-yellow-400 text-xl rounded-2xl group-hover:scale-110 transition-transform shadow-inner border border-yellow-500/10">⭐</span>
            </div>
            <div className="relative z-10">
              <span className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic">SaaS Pro</span>
              <button 
                className="block text-[10px] font-black uppercase tracking-[0.2em] mt-3 hover:opacity-70 transition-opacity" 
                style={{ color: branding.primaryColor }}
              >
                Detalhes da Assinatura »
              </button>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pt-4">
         
         {/* FEED DE PROJETOS RECENTES */}
         <div className="lg:col-span-8 space-y-8">
            <div className="flex justify-between items-end border-b border-gray-100 dark:border-gray-800 pb-6">
               <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic">Atividade Recente</h2>
               <Link href="/biblioteca" className="text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:pr-2" style={{ color: branding.primaryColor }}>Ver Galeria Completa ➔</Link>
            </div>
            
            {recentProjects.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {recentProjects.map(project => (
                    <div key={project.id} className="group bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-4xl p-6 flex gap-6 items-center hover:border-primary transition-all shadow-xl dark:shadow-none" style={{ hover: { borderColor: branding.primaryColor } } as any}>
                       <div className="w-24 h-24 rounded-3xl overflow-hidden shrink-0 shadow-2xl border border-gray-100 dark:border-gray-800">
                          <img src={project.thumbnail} className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-700" />
                       </div>
                       <div className="overflow-hidden space-y-1">
                          <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest" style={{ color: branding.primaryColor }}>Projeto Ativo</p>
                          <h3 className="text-lg font-black text-gray-900 dark:text-white truncate leading-tight">{project.title}</h3>
                          <div className="flex items-center gap-2">
                             <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-700"></span>
                             <p className="text-[10px] text-gray-400 font-bold uppercase">{project.channel}</p>
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
            ) : (
               <div className="bg-white dark:bg-gray-950 border-4 border-dashed border-gray-100 dark:border-gray-800 rounded-4xl p-20 flex flex-col items-center text-center space-y-6 shadow-inner">
                  <div className="w-24 h-24 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center text-4xl animate-pulse">🎬</div>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic">Silêncio no Set...</h3>
                  <p className="text-gray-500 max-w-xs font-bold text-sm">Sua história ainda não começou. Vamos buscar algumas cenas épicas?</p>
                  <Link href="/buscar-cenas">
                    <Button className="font-black px-10 py-6 rounded-2xl shadow-2xl" style={{ backgroundColor: branding.primaryColor }}>INICIAR PRODUÇÃO 🚀</Button>
                  </Link>
               </div>
            )}
         </div>

         {/* ATALHOS & HISTÓRICO */}
         <div className="lg:col-span-4 space-y-8">
            <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic border-b border-gray-100 dark:border-gray-800 pb-6">Atalhos</h2>
            <div className="space-y-4">
               {[
                 { label: "Nova Busca", sub: "Explorar banco YouTube", icon: "🔍", href: "/buscar-cenas", color: branding.primaryColor },
                 { label: "Biblioteca", sub: "Nuvem de Projetos", icon: "📚", href: "/biblioteca", color: branding.secondaryColor },
                 { label: "Settings", sub: "Aparência SaaS", icon: "🎨", href: "/configuracoes", color: "#6b7280" }
               ].map((item) => (
                  <Link 
                    key={item.href} 
                    href={item.href} 
                    className="flex items-center gap-5 p-6 bg-white dark:bg-gray-950 rounded-4xl border border-gray-100 dark:border-gray-800 hover:border-primary transition-all shadow-xl group"
                  >
                    <div 
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-inner"
                      style={{ backgroundColor: `${item.color}15`, color: item.color }}
                    >
                      {item.icon}
                    </div>
                    <div className="overflow-hidden">
                      <h3 className="font-black text-gray-900 dark:text-white text-lg leading-tight group-hover:text-primary" style={{ color: item.color === branding.primaryColor ? branding.primaryColor : undefined }}>{item.label}</h3>
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-1 truncate">{item.sub}</p>
                    </div>
                  </Link>
               ))}
            </div>

            {/* Historico Rápido */}
            {recentSearches.length > 0 && (
               <div className="pt-6 space-y-4">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] px-2">Recent Queries</p>
                  <div className="flex flex-col gap-2">
                     {recentSearches.map(s => (
                        <Link 
                          key={s.id} 
                          href={`/buscar-cenas?q=${encodeURIComponent(s.query)}`}
                          className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl text-xs font-black text-gray-500 hover:text-white hover:bg-black transition-all border border-gray-100 dark:border-gray-800 truncate"
                        >
                           #{s.query}
                        </Link>
                     ))}
                  </div>
               </div>
            )}
         </div>
      </div>
    </div>
  );
}
