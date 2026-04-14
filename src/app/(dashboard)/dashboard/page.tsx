"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { useBranding } from "@/context/branding-context";
import { getRecentProjects, SavedProject } from "@/lib/firebase/projects";
import { getUserRenderJobs, getLastUserRenderJob } from "@/lib/firebase/render-jobs";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { AutoVideoModal } from "@/components/dashboard/AutoVideoModal";
import { RenderJob } from "@/types/render";
import { PLAN_LIMITS } from "@/lib/utils/usage-limits";
import { ProductionChart } from "@/components/dashboard/ProductionChart";
import { ActivityLog } from "@/components/dashboard/ActivityLog";

export default function DashboardPage() {
  const { user } = useAuth();
  const { branding, showToast } = useBranding();
  const [recentProjects, setRecentProjects] = useState<SavedProject[]>([]);
  const [renderStats, setRenderStats] = useState({ total: 0, pending: 0, completed: 0 });
  const [lastJob, setLastJob] = useState<RenderJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAutoModal, setShowAutoModal] = useState(false);

  const userName = user?.email?.split('@')[0] || "Visitante";
  const referralCode = branding.referralCode || "GERANDO...";

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const [projects, allJobs, lastJobData] = await Promise.all([
          getRecentProjects(user.uid, 4),
          getUserRenderJobs(user.uid),
          getLastUserRenderJob(user.uid)
        ]);

        setRecentProjects(projects);
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

  const copyReferral = () => {
    const url = `${window.location.origin}/login?ref=${referralCode}`;
    navigator.clipboard.writeText(url);
    if (showToast) showToast("Link de indicação copiado! 🎉", "success");
  };

  if (loading) return <div className="p-20 text-center font-black animate-pulse uppercase tracking-[0.5em]">Carregando Smart Dashboard...</div>;

  const usage = branding.usage || { searchesCount: 0, projectsCount: 0, rendersCount: 0, referralsCount: 0 };
  const plan = branding.plan || "free";
  const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS];

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-1000 pb-20 px-4">
      {showAutoModal && <AutoVideoModal onClose={() => setShowAutoModal(false)} />}

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-[10px] font-black text-muted-custom uppercase tracking-[0.3em]">
             <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6]"></span>
             Intelligence Hub {plan.toUpperCase()}
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-foreground tracking-tighter leading-none">
            Welcome, <span className="bg-clip-text text-transparent italic bg-gradient-to-r from-blue-600 to-indigo-500">{userName}</span>
          </h1>
        </div>

        <div className="flex flex-wrap gap-4">
            <div className="bg-surface border border-border-custom p-5 rounded-3xl flex items-center gap-6 shadow-sm">
               <div>
                  <p className="text-[10px] font-black text-muted-custom uppercase tracking-widest leading-none">Seu Código</p>
                  <p className="text-lg font-black text-blue-600 dark:text-blue-400 italic mt-1">{referralCode}</p>
               </div>
               <Button onClick={copyReferral} variant="outline" className="h-12 px-6 rounded-2xl border-border-custom text-[9px] font-black uppercase">Copiar Link 🔗</Button>
            </div>
           
           <Button onClick={() => setShowAutoModal(true)} className="h-20 px-10 rounded-3xl bg-blue-600 text-white font-black italic shadow-2xl hover:scale-105 active:scale-95 transition-all w-full sm:w-auto">GERAÇÃO MÁGICA 🪄</Button>
        </div>
      </header>

      {/* METRICS & GROWTH */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-8">
           <ProductionChart color="#3b82f6" />
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <MetricCard title="PROJETOS TOTAIS" value={usage.projectsCount?.toString() || "0"} icon="📂" badge="Projetos" trend="" color="#3b82f6" />
               <MetricCard title="CENAS BUSCADAS" value={usage.searchesCount?.toString() || "0"} icon="🔍" badge="Buscas" trend="" color="#8b5cf6" />
            </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
           {/* USAGE LIMITS */}
           <div className="bg-surface rounded-3xl border border-border-custom p-10 shadow-xl space-y-8">
              <h3 className="text-xl font-black text-foreground tracking-tighter uppercase italic">SaaS Power Metrics</h3>
              <div className="space-y-6">
                 <UsageBar label="Buscas (24h)" current={usage.searchesCount} max={limits.maxDailySearches} color="#3b82f6" />
                 <UsageBar label="Projetos" current={usage.projectsCount} max={limits.maxProjects} color="#8b5cf6" />
                 <UsageBar label="Renderizações" current={usage.rendersCount} max={limits.maxRenders} color="#10b981" />
              </div>
              <Link href="/perfil" className="block"><Button className="w-full h-14 rounded-2xl border border-border-custom bg-background/50 text-muted-custom hover:text-foreground font-black text-[10px] uppercase transition-all">Gerenciar Plano 💎</Button></Link>
           </div>

           <ActivityLog />
        </div>
      </div>

      {/* RECENT OPERATIONAL LOG */}
      <div className="space-y-8">
         <h2 className="text-3xl font-black text-foreground uppercase italic tracking-tighter border-b border-border-custom pb-4">Real-Time Operations</h2>
         {lastJob ? (
            <div className="bg-surface border border-border-custom p-10 rounded-[3rem] flex items-center justify-between group hover:border-blue-500 transition-all shadow-sm">
               <div className="flex items-center gap-8">
                  <div className="w-24 h-24 bg-background border border-border-custom rounded-[2rem] flex items-center justify-center text-4xl shadow-inner">
                     {lastJob.status === 'completed' ? '✅' : '⚙️'}
                  </div>
                  <div className="space-y-2">
                     <p className="text-[10px] font-black text-muted-custom uppercase tracking-widest">Target: {lastJob.id}</p>
                     <h3 className="text-2xl font-black uppercase text-foreground">{lastJob.status === 'completed' ? 'Transmissão Pronta' : 'Renderizando Nuvem'}</h3>
                     <div className="w-64 h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${lastJob.progress}%` }}></div>
                     </div>
                  </div>
               </div>
               <Link href={`/video/${lastJob.id}`}>
                 <Button variant="outline" className="h-16 px-10 rounded-2xl border-border-custom font-black uppercase tracking-widest">Link Público ➔</Button>
               </Link>
            </div>
         ) : (
            <div className="p-20 border-4 border-dashed border-border-custom rounded-[3rem] text-center italic text-muted-custom font-bold">Inicie sua primeira produção viral.</div>
         )}
      </div>
    </div>
  );
}

function UsageBar({ label, current, max, color }: any) {
  const percent = Math.min((current/max)*100, 100);
  return (
    <div className="space-y-2">
       <div className="flex justify-between text-[9px] font-black uppercase text-muted-custom">
          <span>{label}</span>
          <span>{current}/{max}</span>
       </div>
       <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full transition-all duration-1000" style={{ width: `${percent}%`, backgroundColor: color }}></div>
       </div>
    </div>
  );
}

function MetricCard({ title, value, icon, badge, color, trend }: any) {
   return (
    <div className="bg-surface border border-border-custom p-8 rounded-3xl flex flex-col justify-between group h-60 hover:scale-[1.03] transition-all relative overflow-hidden shadow-xl">
       <div className="flex justify-between items-start relative z-10">
          <div>
             <p className="text-[10px] font-black text-muted-custom uppercase tracking-[0.2em] italic">{title}</p>
             <p className="text-[11px] font-black text-blue-600 dark:text-blue-500 mt-2 uppercase tracking-widest">{trend}</p>
          </div>
          <span className="w-14 h-14 bg-background rounded-2xl flex items-center justify-center text-2xl shadow-inner border border-border-custom" style={{ color }}>{icon}</span>
       </div>
       <div className="relative z-10">
          <p className="text-6xl font-black text-foreground items-baseline flex gap-4 tracking-tighter leading-none">{value} <span className="text-[11px] uppercase font-black text-muted-custom bg-background px-3 py-1.5 rounded-full border border-border-custom">{badge}</span></p>
       </div>
       <div className="absolute -right-6 -bottom-6 w-32 h-32 opacity-10 border-[15px] border-current rounded-full blur-2xl" style={{ color }}></div>
    </div>
  );
}
