"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { useBranding } from "@/context/branding-context";
import { getUserProjects } from "@/lib/firebase/projects";
import { Button } from "@/components/ui/Button";
import { auth } from "@/lib/firebase/config";
import { sendPasswordResetEmail } from "firebase/auth";

export default function PerfilPage() {
  const { user } = useAuth();
  const { branding } = useBranding();
  const [totalProjects, setTotalProjects] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (user) {
        try {
          const projects = await getUserProjects(user.uid);
          setTotalProjects(projects.length);
        } catch (error) {
          console.error("Erro ao buscar estatísticas:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchStats();
  }, [user]);

  const handleResetPassword = async () => {
    if (!user?.email || !auth) return;
    try {
      await sendPasswordResetEmail(auth, user.email);
      setMessage({ type: "success", text: "E-mail de redefinição enviado com sucesso!" });
    } catch (error) {
      setMessage({ type: "error", text: "Erro ao enviar e-mail. Tente novamente mais tarde." });
    }
  };

  const handleDesativar = () => {
    alert("Função de desativar conta virá em breve!");
  };

  const memberSince = user?.metadata.creationTime 
    ? new Date(user.metadata.creationTime).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    : "Recentemente";

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <header className="flex flex-col gap-4">
        <h1 className="text-5xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic">Central do Criador</h1>
        <p className="text-gray-500 dark:text-gray-400 font-bold text-lg">Gerencie sua identidade digital e performance no {branding.appName}.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Card Principal de Perfil */}
        <div className="lg:col-span-8 bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-4xl p-10 shadow-2xl dark:shadow-none space-y-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" style={{ backgroundColor: `${branding.primaryColor}1a` }}></div>
            
            <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
               <div 
                className="w-32 h-32 rounded-4xl flex items-center justify-center text-white font-black text-5xl shadow-2xl transition-transform hover:rotate-6 duration-500"
                style={{ background: `linear-gradient(to bottom right, ${branding.primaryColor}, ${branding.secondaryColor})` }}
               >
                  {user?.email?.[0].toUpperCase() || "U"}
               </div>
               <div className="text-center md:text-left space-y-2">
                  <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic leading-none">
                    {user?.email?.split('@')[0] || "Usuário"}
                  </h2>
                  <p className="text-gray-500 font-bold text-lg">{user?.email}</p>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
                     <span className="px-4 py-1.5 bg-green-500/10 text-green-600 dark:text-green-400 text-[10px] font-black rounded-full border border-green-500/10 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> SaaS Pro Ativo
                     </span>
                     <span className="px-4 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-[10px] font-black rounded-full border border-gray-200 dark:border-gray-700 uppercase tracking-widest">
                        Membro desde {memberSince}
                     </span>
                  </div>
               </div>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-800 pt-10">
               <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-8 italic">Configurações de Segurança</h3>
               
               <div className="space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between p-8 bg-gray-50 dark:bg-black/50 rounded-4xl border border-gray-100 dark:border-gray-800 gap-6">
                     <div className="space-y-1">
                        <p className="font-black text-gray-900 dark:text-white uppercase tracking-tight">Redefinir Senha SaaS</p>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Enviaremos um link de segurança para o seu e-mail.</p>
                     </div>
                     <Button variant="outline" className="h-14 px-8 rounded-2xl font-black shadow-xl bg-white dark:bg-gray-900" onClick={handleResetPassword}>Enviar E-mail</Button>
                  </div>

                  {message && (
                    <div className={`p-6 rounded-2xl border font-black text-[10px] uppercase tracking-[0.2em] animate-in zoom-in duration-300 text-center ${message.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                       {message.text}
                    </div>
                  )}

                  <div className="flex flex-col md:flex-row md:items-center justify-between p-8 bg-gray-50 dark:bg-black/50 rounded-4xl border border-gray-100 dark:border-gray-800 gap-6 opacity-50">
                     <div className="space-y-1">
                        <p className="font-black text-gray-900 dark:text-white uppercase tracking-tight">Autenticação 2FA</p>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Em breve: Proteja sua conta com um segundo fator.</p>
                     </div>
                     <span className="px-6 py-3 bg-gray-200 dark:bg-gray-800 rounded-xl text-[10px] font-black uppercase tracking-widest">Locked</span>
                  </div>
               </div>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-800 pt-10">
               <h3 className="text-xl font-black text-red-500 uppercase tracking-tighter mb-8 italic">Danger Zone</h3>
               <div className="p-8 bg-red-500/5 dark:bg-red-500/10 rounded-4xl border border-red-500/10 group transition-all hover:bg-red-500/10">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <p className="font-black text-red-600 dark:text-red-400 uppercase tracking-tight">Excluir Conta Permanentemente</p>
                        <p className="text-xs text-red-500/70 font-bold uppercase tracking-widest">Esta ação é irreversível e apagará todos os seus projetos do Firestore.</p>
                    </div>
                    <Button onClick={handleDesativar} className="h-14 px-10 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black shadow-xl shadow-red-600/20 active:scale-95 transition-all">DELETAR CONTA</Button>
                  </div>
               </div>
            </div>
        </div>

        {/* Sidebar Mini Stats */}
        <div className="lg:col-span-4 space-y-8">
           <div className="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-4xl p-10 shadow-2xl dark:shadow-none space-y-10">
              <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic leading-none">Activity Stats</h3>
              
              <div className="space-y-6">
                 <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-3xl bg-blue-500/10 flex items-center justify-center text-3xl shadow-inner text-blue-500">📂</div>
                    <div>
                       <p className="text-3xl font-black text-gray-900 dark:text-white leading-none">{loading ? "..." : totalProjects}</p>
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Projetos Ativos</p>
                    </div>
                 </div>

                 <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-3xl bg-yellow-500/10 flex items-center justify-center text-3xl shadow-inner text-yellow-500">⚡</div>
                    <div>
                       <p className="text-3xl font-black text-gray-900 dark:text-white leading-none">12</p>
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Exportações Realizadas</p>
                    </div>
                 </div>

                 <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-3xl bg-purple-500/10 flex items-center justify-center text-3xl shadow-inner text-purple-500">🔥</div>
                    <div>
                       <p className="text-3xl font-black text-gray-900 dark:text-white leading-none">Alpha</p>
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Status do Beta</p>
                    </div>
                 </div>
              </div>

              <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Branding Ativo</p>
                 <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-black/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                    <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: branding.primaryColor }}></div>
                    <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: branding.secondaryColor }}></div>
                    <span className="text-xs font-black uppercase text-gray-500 ml-auto">V2.1</span>
                 </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}
