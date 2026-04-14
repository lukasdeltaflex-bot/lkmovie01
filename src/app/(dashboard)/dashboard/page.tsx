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
          <div className="flex items-center gap-3 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">
             <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6]"></span>
             Intelligence Hub {plan.toUpperCase()}
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-gray-900 dark:text-white tracking-tighter leading-none">
            Welcome, <span className="bg-clip-text text-transparent italic bg-gradient-to-r from-blue-600 to-indigo-500">{userName}</span>
          </h1>
        </div>

        <div className="flex gap-4">
           {/* REFERRAL QUICK ACCESS */}
           <div className="bg-white/5 border border-white/10 p-5 rounded-3xl flex items-center gap-6">
              <div>
                 <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">Seu Código</p>
                 <p className="text-lg font-black text-blue-400 italic mt-1">{referralCode}</p>
              </div>
              <Button onClick={copyReferral} variant="outline" className="h-12 px-6 rounded-2xl border-white/10 text-[9px] font-black uppercase">Indicador PRO 🚀</Button>
           </div>
           
           <Button onClick={() => setShowAutoModal(true)} className="h-20 px-10 rounded-3xl bg-blue-600 text-white font-black italic shadow-2xl hover:scale-105 active:scale-95 transition-all">GERAÇÃO MÁGICA 🪄</Button>
        </div>
      </header>

      {/* METRICS & GROWTH */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-8">
           <ProductionChart color="#3b82f6" />
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <MetricCard title="CRESCIMENTO ORGÂNICO" value={usage.referralsCount?.toString() || "0"} icon="📈" badge="Indicados" trend="+100%" color="#10b981" />
              <MetricCard title="ENGAJAMENTO VIRAL" value={recentProjects.length.toString()} icon="🔥" badge="Atividade" trend="Ativo" color="#f59e0b" />
           </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
           {/* USAGE LIMITS */}
           <div className="bg-white dark:bg-[#0a0a0a] rounded-3xl border border-gray-100 dark:border-white/5 p-10 shadow-xl dark:shadow-2xl space-y-8">
              <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic">SaaS Power Metrics</h3>
              <div className="space-y-6">
                 <UsageBar label="Buscas (24h)" current={usage.searchesCount} max={limits.maxDailySearches} color="#3b82f6" />
                 <UsageBar label="Projetos" current={usage.projectsCount} max={limits.maxProjects} color="#8b5cf6" />
                 <UsageBar label="Renderizações" current={usage.rendersCount} max={limits.maxRenders} color="#10b981" />
              </div>
              <Link href="/perfil" className="block"><Button className="w-full h-14 rounded-2xl border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white font-black text-[10px] uppercase transition-all">Gerenciar Plano 💎</Button></Link>
           </div>

           <ActivityLog />
        </div>
      </div>

      {/* RECENT OPERATIONAL LOG */}
      <div className="space-y-8">
         <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter border-b border-white/5 pb-4">Real-Time Operations</h2>
         {lastJob ? (
            <div className="bg-white/5 border border-white/10 p-10 rounded-[3rem] flex items-center justify-between group hover:border-blue-500 transition-all">
               <div className="flex items-center gap-8">
                  <div className="w-24 h-24 bg-black rounded-[2rem] flex items-center justify-center text-4xl shadow-inner">
                     {lastJob.status === 'completed' ? '✅' : '⚙️'}
                  </div>
                  <div className="space-y-2">
                     <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Target: {lastJob.id}</p>
                     <h3 className="text-2xl font-black uppercase text-white">{lastJob.status === 'completed' ? 'Transmissão Pronta' : 'Renderizando Nuvem'}</h3>
                     <div className="w-64 h-2 bg-black rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${lastJob.progress}%` }}></div>
                     </div>
                  </div>
               </div>
               <Link href={`/video/${lastJob.id}`}>
                 <Button variant="outline" className="h-16 px-10 rounded-2xl border-white/10 font-black uppercase tracking-widest">Link Público ➔</Button>
               </Link>
            </div>
         ) : (
            <div className="p-20 border-4 border-dashed border-white/5 rounded-[3rem] text-center italic text-gray-500 font-bold">Inicie sua primeira produção viral.</div>
         )}
      </div>
    </div>
  );
}

function UsageBar({ label, current, max, color }: any) {
  const percent = Math.min((current/max)*100, 100);
  return (
    <div className="space-y-2">
       <div className="flex justify-between text-[9px] font-black uppercase text-gray-400">
          <span>{label}</span>
          <span>{current}/{max}</span>
       </div>
       <div className="w-full h-1.5 bg-black rounded-full overflow-hidden">
          <div className="h-full transition-all duration-1000" style={{ width: `${percent}%`, backgroundColor: color }}></div>
       </div>
    </div>
  );
}

function MetricCard({ title, value, icon, badge, color, trend }: any) {
  return (
    <div className="bg-white dark:bg-[#0d0d0d] border border-gray-100 dark:border-white/5 p-8 rounded-3xl flex flex-col justify-between group h-60 hover:scale-[1.03] transition-all relative overflow-hidden shadow-xl dark:shadow-2xl">
       <div className="flex justify-between items-start relative z-10">
          <div>
             <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] italic">{title}</p>
             <p className="text-[11px] font-black text-blue-600 dark:text-blue-500 mt-2 uppercase tracking-widest">{trend}</p>
          </div>
          <span className="w-14 h-14 bg-gray-50 dark:bg-white/5 rounded-2xl flex items-center justify-center text-2xl shadow-inner border border-gray-100 dark:border-white/5" style={{ color }}>{icon}</span>
       </div>
       <div className="relative z-10">
          <p className="text-6xl font-black text-gray-900 dark:text-white items-baseline flex gap-4 tracking-tighter leading-none">{value} <span className="text-[11px] uppercase font-black text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-white/5 px-3 py-1.5 rounded-full border border-gray-100 dark:border-white/5">{badge}</span></p>
       </div>
       <div className="absolute -right-6 -bottom-6 w-32 h-32 opacity-10 border-[15px] border-current rounded-full blur-2xl" style={{ color }}></div>
    </div>
  );
}
