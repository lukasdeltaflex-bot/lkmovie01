"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { useBranding } from "@/context/branding-context";
import { getRecentProjects, SavedProject, getUserProjects } from "@/lib/firebase/projects";
import { getUserSearchHistory, SearchRecord } from "@/lib/firebase/search";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
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
          getRecentProjects(user.uid, 4),
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
  const storagePercentage = Math.min(100, Math.max(5, (totalProjects / 100) * 100));

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-500">
        <div className="space-y-4">
           <Skeleton className="h-4 w-32 rounded-full opacity-20" />
           <Skeleton className="h-20 w-1/2 rounded-[2rem] opacity-20" />
           <Skeleton className="h-6 w-1/3 rounded-full opacity-10" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           {[...Array(3)].map((_, i) => (
             <Skeleton key={i} className="h-52 rounded-[2.5rem] opacity-5" />
           ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
           <div className="lg:col-span-8 space-y-8">
              <Skeleton className="h-10 w-48 rounded-full opacity-10" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {[...Array(4)].map((_, i) => (
                   <Skeleton key={i} className="h-32 rounded-4xl opacity-5" />
                 ))}
              </div>
           </div>
           <div className="lg:col-span-4 space-y-8">
              <Skeleton className="h-10 w-full rounded-full opacity-10" />
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-24 rounded-4xl opacity-5" />
                ))}
              </div>
           </div>
        </div>
      </div>
    );
  }

  const trendingNiches = [
    { label: "Cortes Podcast", icon: "🎙️", count: "124k" },
    { label: "Documentários", icon: "🗿", count: "89k" },
    { label: "ASMR / Relax", icon: "🍃", count: "56k" },
    { label: "High Stakes", icon: "🏦", count: "42k" },
    { label: "Gaming Pro", icon: "🎮", count: "110k" },
  ];

  const liveActivity = [
    { user: "André M.", action: "Renderizou 4K", time: "2 min", avatar: "👨‍💻" },
    { user: "Julia S.", action: "Novo Corte", time: "5 min", avatar: "👩‍🎨" },
    { user: "Leo K.", action: "Exportou Sub", time: "12 min", avatar: "👨" },
  ];

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

      <header className="flex flex-col gap-4 relative">
        <div className="absolute -left-20 -top-20 w-64 h-64 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="flex items-center gap-3 text-xs font-black text-gray-400 uppercase tracking-[0.3em] relative z-10">
           <span className="w-2 h-2 rounded-full animate-pulse shadow-[0_0_8px_currentColor]" style={{ backgroundColor: branding.primaryColor, color: branding.primaryColor }}></span>
           Centro de Comando Live
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-gray-900 dark:text-white tracking-tighter leading-none relative z-10">
          Olá, <span className="bg-clip-text text-transparent italic" style={{ backgroundImage: `linear-gradient(to right, ${branding.primaryColor}, ${branding.secondaryColor})` }}>{userName}</span>
        </h1>
        <p className="text-gray-500 dark:text-gray-400 font-bold text-lg md:text-xl max-w-2xl relative z-10">Seu ecossistema cinematográfico {branding.appName} está 100% operacional.</p>
      </header>

      {/* MÉTRICAS REAIS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <MetricCard 
          title="VÍDEOS ATIVOS CLOUD" 
          value={totalProjects.toString()} 
          icon="💎" 
          badge="Live Sync" 
          color={branding.primaryColor} 
        />
        <MetricCard 
          title="STORAGE UTILIZADO" 
          value={`${estimatedStorage}GB`} 
          icon="💾" 
          badge={`${storagePercentage}% Full`} 
          color={branding.secondaryColor}
          progress={storagePercentage}
        />
        <MetricCard 
          title="NÍVEL DE ACESSO" 
          value="SaaS Pro" 
          icon="⭐" 
          badge="VIP" 
          color="#facc15" 
          action="Ver Benefícios »"
        />
      </div>

      {/* TRENDING NICHES */}
      <div className="space-y-8">
         <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic flex items-center gap-3">
               <span className="text-xl">🔥</span> Nichos em Alta
            </h2>
            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest bg-blue-500/10 px-4 py-2 rounded-full border border-blue-500/20">Updated Every 24h</span>
         </div>
         <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
            {trendingNiches.map(niche => (
               <div 
                  key={niche.label} 
                  className="min-w-[220px] bg-white dark:bg-gray-900/50 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-xl flex flex-col gap-6 group cursor-pointer transition-all duration-500 hover:-translate-y-2"
                  style={{ '--hover-color': branding.primaryColor } as any}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = branding.primaryColor}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = ''}
               >
                  <div className="w-16 h-16 bg-gray-50 dark:bg-black rounded-3xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform shadow-inner">{niche.icon}</div>
                  <div>
                     <p className="font-black text-gray-900 dark:text-white text-base uppercase leading-tight">{niche.label}</p>
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">{niche.count} canais ativos</p>
                  </div>
               </div>
            ))}
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pt-4">
         
         {/* FEED DE PROJETOS RECENTES */}
         <div className="lg:col-span-8 space-y-10">
            <div className="flex justify-between items-end border-b border-gray-100 dark:border-gray-800 pb-8">
               <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic">Renderizações Recentes</h2>
               <Link href="/biblioteca" className="text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:pr-4" style={{ color: branding.primaryColor }}>Ver Galeria Completa ➔</Link>
            </div>
            
            {recentProjects.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {recentProjects.map(project => (
                   <div 
                     key={project.id} 
                     className="group bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[2.5rem] p-6 flex gap-6 items-center transition-all duration-500 shadow-xl dark:shadow-none relative" 
                     onMouseEnter={(e) => e.currentTarget.style.borderColor = branding.primaryColor}
                     onMouseLeave={(e) => e.currentTarget.style.borderColor = ''}
                   >
                      <div className="w-28 h-28 rounded-3xl overflow-hidden shrink-0 shadow-2xl border-4 border-white dark:border-gray-800">
                          <img src={project.thumbnail} className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-1000" />
                       </div>
                       <div className="overflow-hidden space-y-2">
                          <div className="flex items-center gap-2">
                             <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span>
                             <p className="text-[10px] font-black text-green-500 uppercase tracking-widest">Finalizado</p>
                          </div>
                          <h3 className="text-lg font-black text-gray-900 dark:text-white truncate leading-tight uppercase italic">{project.title}</h3>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{project.channel}</p>
                       </div>
                    </div>
                  ))}
               </div>
            ) : (
               <div className="bg-white dark:bg-gray-950 border-4 border-dashed border-gray-100 dark:border-gray-800 rounded-[3rem] p-24 flex flex-col items-center text-center space-y-8 shadow-inner group cursor-pointer hover:border-blue-500/30 transition-all">
                  <div className="w-32 h-32 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center text-5xl animate-bounce shadow-2xl">🎬</div>
                  <div className="space-y-2">
                    <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic">Silêncio no Set...</h3>
                    <p className="text-gray-500 max-w-sm font-bold text-base">Sua história cinematográfica ainda não começou. Vamos minerar algumas cenas agora?</p>
                  </div>
                  <Link href="/buscar-cenas">
                    <Button className="font-black px-12 py-8 rounded-2xl shadow-2xl text-lg tracking-widest active:scale-95 transition-all text-white" style={{ backgroundColor: branding.primaryColor }}>INICIAR PRIMEIRA PRODUÇÃO 🚀</Button>
                  </Link>
               </div>
            )}
         </div>

         {/* ATALHOS & LIVE FEED */}
         <div className="lg:col-span-4 space-y-12">
            <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic border-b border-gray-100 dark:border-gray-800 pb-8">Estúdio Cloud</h2>
            <div className="grid grid-cols-1 gap-4">
               {[
                 { label: "Nova Busca", sub: "YouTube Advanced Mining", icon: "🔍", href: "/buscar-cenas", color: branding.primaryColor },
                 { label: "Minha Galeria", sub: "Nuvem de Produções", icon: "📚", href: "/biblioteca", color: branding.secondaryColor },
                 { label: "Configurar SaaS", sub: "Branding & Presets", icon: "🎨", href: "/configuracoes", color: "#6b7280" }
               ].map((item) => (
                  <Link 
                    key={item.href} 
                    href={item.href} 
                    className="flex items-center gap-6 p-6 bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 hover:border-primary transition-all duration-300 shadow-xl group"
                  >
                    <div 
                      className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 shadow-inner"
                      style={{ backgroundColor: `${item.color}15`, color: item.color }}
                    >
                      {item.icon}
                    </div>
                    <div className="overflow-hidden">
                      <h3 className="font-black text-gray-900 dark:text-white text-xl leading-tight group-hover:text-primary transition-colors uppercase italic">{item.label}</h3>
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-1 truncate">{item.sub}</p>
                    </div>
                  </Link>
               ))}
            </div>

            {/* FEED LIVE ACTIVITY SaaS */}
            <div className="space-y-8 pt-4">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-6">
                   <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full bg-green-500 animate-ping"></span> Live SaaS
                   </h2>
                   <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Global Activity</span>
                </div>
                <div className="space-y-4">
                   {liveActivity.map((act, i) => (
                     <div key={i} className="flex items-center gap-4 p-5 bg-white dark:bg-gray-900/30 rounded-3xl border border-transparent hover:border-gray-100 dark:hover:border-gray-800 transition-all duration-300 group cursor-default">
                        <div className="w-12 h-12 bg-gray-50 dark:bg-black rounded-2xl flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform">{act.avatar}</div>
                        <div className="flex-1 overflow-hidden">
                           <p className="text-[10px] font-black text-gray-900 dark:text-white uppercase leading-none">{act.user}</p>
                           <p className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter mt-1">{act.action}</p>
                        </div>
                        <span className="text-[8px] font-black text-gray-400 uppercase bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">{act.time}</span>
                     </div>
                   ))}
                </div>
            </div>
         </div>
      </div>
    </div>
  );
}

// COMPONENTES AUXILIARES
function MetricCard({ title, value, icon, badge, color, progress, action }: { title: string, value: string, icon: string, badge: string, color: string, progress?: number, action?: string }) {
  return (
    <div className="bg-white dark:bg-gray-900 p-10 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-2xl dark:shadow-none flex flex-col justify-between h-60 group hover:border-primary transition-all duration-700 overflow-hidden relative">
        <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full group-hover:scale-125 transition-transform duration-1000 opacity-[0.03] pointer-events-none" style={{ backgroundColor: color }}></div>
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
          {action && (
             <button className="block text-[10px] font-black uppercase tracking-[0.2em] hover:opacity-70 transition-opacity text-left" style={{ color }}>
                {action}
             </button>
          )}
        </div>
    </div>
  );
}

