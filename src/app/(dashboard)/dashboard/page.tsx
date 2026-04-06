"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { useBranding } from "@/context/branding-context";
import { getRecentProjects, SavedProject, getUserProjects } from "@/lib/firebase/projects";
import { getUserRenderJobs, getLastUserRenderJob } from "@/lib/firebase/render-jobs";
import { getUserSearchHistory, SearchRecord } from "@/lib/firebase/search";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { OnboardingModal } from "@/components/dashboard/OnboardingModal";
import { createNotification } from "@/lib/firebase/notifications";
import { RenderJob } from "@/types/render";

export default function DashboardPage() {
  const { user } = useAuth();
  const { branding, setBranding } = useBranding();
  const [recentProjects, setRecentProjects] = useState<SavedProject[]>([]);
  const [recentSearches, setRecentSearches] = useState<SearchRecord[]>([]);
  const [renderStats, setRenderStats] = useState({ total: 0, pending: 0, completed: 0 });
  const [lastJob, setLastJob] = useState<RenderJob | null>(null);
  const [loading, setLoading] = useState(true);

  const userName = user?.email?.split('@')[0] || "Visitante";

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const [projects, searches, allJobs, lastJobData] = await Promise.all([
          getRecentProjects(user.uid, 4),
          getUserSearchHistory(user.uid, 5),
          getUserRenderJobs(user.uid),
          getLastUserRenderJob(user.uid)
        ]);

        setRecentProjects(projects);
        setRecentSearches(searches);
        setLastJob(lastJobData);
        
        setRenderStats({
          total: allJobs.length,
          pending: allJobs.filter(j => j.status === "pending" || j.status === "processing").length,
          completed: allJobs.filter(j => j.status === "completed").length
        });

      } catch (error) {
        console.error("Erro ao carregar Dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-500">
        <Skeleton className="h-40 w-full rounded-4xl opacity-10" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-52 rounded-4xl opacity-5" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-20 px-4 lg:px-0">
      
      {!branding.hasSeenOnboarding && (
        <OnboardingModal onComplete={() => setBranding({ hasSeenOnboarding: true })} />
      )}

      <header className="flex flex-col gap-4">
        <div className="flex items-center gap-3 text-xs font-black text-gray-400 uppercase tracking-[0.3em]">
           <span className="w-2 h-2 rounded-full animate-pulse shadow-[0_0_8px_currentColor] bg-blue-500"></span>
           Centro de Comando FASE 3
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-gray-900 dark:text-white tracking-tighter leading-none">
          Olá, <span className="bg-clip-text text-transparent italic bg-gradient-to-r from-blue-500 to-indigo-600">{userName}</span>
        </h1>
        <p className="text-gray-500 dark:text-gray-400 font-bold text-lg md:text-xl max-w-2xl">Gestão de Renderização e Fila de Produção Cloud ativada.</p>
      </header>

      {/* MÉTRICAS DE RENDERIZAÇÃO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <MetricCard 
          title="TOTAL DE RENDERS" 
          value={renderStats.total.toString()} 
          icon="💎" 
          badge="Nuvem" 
          color="#3b82f6" 
        />
        <MetricCard 
          title="RENDERS PENDENTES" 
          value={renderStats.pending.toString()} 
          icon="⚙️" 
          badge="Executando" 
          color="#f59e0b"
          progress={renderStats.pending > 0 ? 50 : 0}
        />
        <MetricCard 
          title="RENDERS CONCLUÍDOS" 
          value={renderStats.completed.toString()} 
          icon="✅" 
          badge="Pronto" 
          color="#10b981" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pt-4">
         
         {/* ÚLTIMA ATIVIDADE DE RENDER */}
         <div className="lg:col-span-8 space-y-10">
            <div className="flex justify-between items-end border-b border-gray-100 dark:border-gray-800 pb-8">
               <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic">Último Render solicitado</h2>
               <Link href="/biblioteca" className="text-[10px] font-black uppercase text-blue-500">Ver Fila Completa ➔</Link>
            </div>
            
            {lastJob ? (
               <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[2.5rem] p-8 flex flex-col md:flex-row gap-8 items-center shadow-xl">
                  <div className="w-40 h-40 bg-gray-50 dark:bg-black rounded-4xl flex items-center justify-center text-5xl shadow-inner shrink-0">
                     {lastJob.status === 'completed' ? '✅' : '⚙️'}
                  </div>
                  <div className="space-y-4 flex-1">
                     <div className="flex items-center gap-3">
                        <span className={`w-3 h-3 rounded-full ${lastJob.status === 'completed' ? 'bg-green-500' : 'bg-blue-500 animate-pulse'}`}></span>
                        <p className="text-xs font-black uppercase tracking-widest text-gray-500">JOB ID: {lastJob.id?.slice(-8).toUpperCase()}</p>
                     </div>
                     <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">Status: {lastJob.status.toUpperCase()}</h3>
                     <div className="w-full h-3 bg-gray-100 dark:bg-black rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${lastJob.progress}%` }}></div>
                     </div>
                     <p className="text-[10px] font-bold text-gray-400 uppercase">Progresso atual: {lastJob.progress}% concluído</p>
                  </div>
               </div>
            ) : (
               <div className="bg-white dark:bg-gray-950 border-4 border-dashed border-gray-100 dark:border-gray-800 rounded-[3rem] p-24 flex flex-col items-center text-center space-y-8">
                  <div className="w-32 h-32 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center text-5xl shadow-2xl">🎬</div>
                  <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic">Nenhum render solicitado</h3>
                  <Link href="/buscar-cenas">
                    <Button className="font-black px-12 py-8 rounded-2xl shadow-2xl text-lg tracking-widest bg-blue-500 text-white">GERAR PRIMEIRO VÍDEO 🚀</Button>
                  </Link>
               </div>
            )}
         </div>

         {/* ATALHOS */}
         <div className="lg:col-span-4 space-y-8">
            <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic border-b border-gray-100 dark:border-gray-800 pb-8">Acesso Rápido</h2>
            <div className="grid grid-cols-1 gap-4">
               {[
                 { label: "Minerar Cenas", icon: "🔍", href: "/buscar-cenas", color: "#3b82f6" },
                 { label: "Ver Biblioteca", icon: "📚", href: "/biblioteca", color: "#8b5cf6" },
                 { label: "Configurar SaaS", icon: "🎨", href: "/configuracoes", color: "#6b7280" }
               ].map((item) => (
                  <Link 
                    key={item.href} 
                    href={item.href} 
                    className="flex items-center gap-6 p-6 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 hover:border-blue-500 transition-all shadow-lg group"
                  >
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner" style={{ backgroundColor: `${item.color}15`, color: item.color }}>{item.icon}</div>
                    <h3 className="font-black text-gray-900 dark:text-white text-lg uppercase italic group-hover:text-blue-500 transition-colors">{item.label}</h3>
                  </Link>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, badge, color, progress }: { title: string, value: string, icon: string, badge: string, color: string, progress?: number }) {
  return (
    <div className="bg-white dark:bg-gray-900 p-10 rounded-4xl border border-gray-100 dark:border-gray-800 shadow-2xl flex flex-col justify-between h-60 group relative overflow-hidden">
        <div className="flex justify-between items-start relative z-10">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">{title}</span>
          <span className="p-5 bg-gray-50 dark:bg-black text-2xl rounded-2xl group-hover:rotate-12 transition-transform shadow-inner border border-gray-100 dark:border-gray-800" style={{ color }}>{icon}</span>
        </div>
        <div className="relative z-10 space-y-4">
          <div className="flex items-baseline gap-4">
            <span className="text-6xl font-black text-gray-900 dark:text-white tracking-tighter">{value}</span>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 dark:bg-black px-3 py-1.5 rounded-xl border border-gray-100 dark:border-gray-800">{badge}</span>
          </div>
          {progress !== undefined && (
            <div className="w-full h-2 bg-gray-100 dark:bg-black rounded-full overflow-hidden shadow-inner">
               <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${progress}%`, backgroundColor: color }}></div>
            </div>
          )}
        </div>
    </div>
  );
}
