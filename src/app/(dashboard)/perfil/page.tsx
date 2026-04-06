"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { useBranding } from "@/context/branding-context";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getUserRenderJobs } from "@/lib/firebase/render-jobs";
import { getUserProjects } from "@/lib/firebase/projects";

export default function PerfilPage() {
  const { user } = useAuth();
  const { branding, showToast } = useBranding();
  
  const [name, setName] = useState(user?.email?.split('@')[0] || "");
  const [isSaving, setIsSaving] = useState(false);
  const [stats, setStats] = useState({
    totalRenders: 0,
    successfulRenders: 0,
    totalProjects: 0,
    loading: true
  });

  useEffect(() => {
    if (user) {
      Promise.all([
        getUserRenderJobs(user.uid),
        getUserProjects(user.uid)
      ]).then(([jobs, projects]) => {
        setStats({
          totalRenders: jobs.length,
          successfulRenders: jobs.filter(j => j.status === "completed").length,
          totalProjects: projects.length,
          loading: false
        });
      });
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    // Simulação de persistência
    setTimeout(() => {
      setIsSaving(false);
      showToast("Perfil atualizado com sucesso!", "success");
    }, 1000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <header className="space-y-2">
        <div className="flex items-center gap-3 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">
           <span className="w-2 h-2 rounded-full" style={{ backgroundColor: branding.primaryColor }}></span>
           Performance Metrics & Account
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tighter">Seu Painel de Criador</h1>
        <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">Acompanhe seu desempenho e gerencie sua conta.</p>
      </header>

      {/* METRICS SECTION */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {[
           { label: "Total de Renders", value: stats.totalRenders, icon: "🎬", color: "blue" },
           { label: "Vídeos Concluídos", value: stats.successfulRenders, icon: "✅", color: "green" },
           { label: "Projetos Ativos", value: stats.totalProjects, icon: "📁", color: "purple" }
         ].map((stat, i) => (
           <div key={i} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-8 rounded-[2.5rem] shadow-xl flex items-center justify-between group transition-all hover:scale-105">
              <div className="space-y-1">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
                 <p className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter italic">
                   {stats.loading ? "---" : stat.value}
                 </p>
              </div>
              <div className="text-4xl filter grayscale group-hover:grayscale-0 transition-all">{stat.icon}</div>
           </div>
         ))}
      </section>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
        {/* Avatar Section */}
        <div className="md:col-span-4 flex flex-col items-center space-y-6">
           <div className="relative group">
              <div className="w-48 h-48 rounded-[3rem] bg-linear-to-tr from-blue-600 to-violet-600 p-1 shadow-2xl relative z-10 overflow-hidden" style={{ backgroundImage: `linear-gradient(to top right, ${branding.primaryColor}, ${branding.secondaryColor})` }}>
                 <div className="w-full h-full bg-white dark:bg-gray-900 rounded-[2.8rem] flex items-center justify-center text-6xl font-black text-gray-900 dark:text-white italic">
                    {name?.[0]?.toUpperCase() || "U"}
                 </div>
              </div>
              <button className="absolute -bottom-4 -right-4 w-14 h-14 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 flex items-center justify-center text-xl z-20 hover:scale-110 active:scale-95 transition-all">📷</button>
           </div>
           <div className="text-center space-y-1">
              <p className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">{name}</p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Plano SaaS Enterprise</p>
           </div>
        </div>

        {/* Form Section */}
        <div className="md:col-span-8">
           <form onSubmit={handleSave} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[2.5rem] p-10 shadow-2xl space-y-8">
              <div className="space-y-6">
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Nome de Exibição</label>
                    <Input 
                       value={name}
                       onChange={(e) => setName(e.target.value)}
                       className="h-16 rounded-2xl bg-gray-50 dark:bg-black border-transparent focus:border-primary transition-all font-bold px-6"
                       placeholder="Seu Nome"
                    />
                 </div>
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">E-mail (Login Principal)</label>
                    <Input 
                       value={user?.email || ""}
                       disabled
                       className="h-16 rounded-2xl bg-gray-100 dark:bg-gray-950 border-transparent opacity-50 font-bold px-6 cursor-not-allowed"
                    />
                 </div>
              </div>

              <div className="pt-6 border-t border-gray-50 dark:border-gray-800 flex justify-end">
                 <Button 
                   type="submit" 
                   disabled={isSaving}
                   className="px-12 h-16 rounded-2xl font-black uppercase tracking-widest text-white shadow-xl active:scale-95 transition-all"
                   style={{ backgroundColor: branding.primaryColor }}
                 >
                   {isSaving ? "⏳ Salvando..." : "ATUALIZAR PERFIL 💎"}
                 </Button>
              </div>
           </form>
        </div>
      </div>
    </div>
  );
}
