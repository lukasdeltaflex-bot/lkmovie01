"use client";

import React from "react";
import { Button } from "@/components/ui/Button";
import { useBranding } from "@/context/branding-context";
import { PLAN_LIMITS } from "@/lib/utils/usage-limits";

export function PlanManager() {
  const { branding, setBranding } = useBranding();
  const plan = branding.plan || "free";
  const usage = branding.usage || { searchesCount: 0, projectsCount: 0, rendersCount: 0 };
  const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS];

  const features = {
    free: [
      "Até 10 buscas diárias",
      "5 projetos ativos",
      "3 renderizações mensais",
      "Marca d'água padrão",
      "Qualidade HD (720p)"
    ],
    pro: [
      "Buscas ilimitadas",
      "Projetos ilimitados",
      "Renderizações ilimitadas",
      "Remover marca d'água",
      "Qualidade 4K / Ultra HD",
      "Geração Mágica IA",
      "Suporte Prioritário 24/7"
    ]
  };

  const handleUpgrade = async () => {
    // Simulação de upgrade para Pro
    await setBranding({ plan: "pro" });
    alert("Parabéns! Você agora é um membro PRO LKMOVIE01. 🚀");
  };

  return (
    <div className="space-y-10">
      <header className="flex justify-between items-end">
         <div className="space-y-2">
            <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic">Gerenciamento de Assinatura</h2>
            <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.2em]">Onde a potência se encontra com o controle.</p>
         </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
         {/* PLAN COMPARISON */}
         <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 p-10 shadow-2xl relative overflow-hidden group">
            <div className="relative z-10 space-y-8">
               <div className="flex justify-between items-start">
                  <div className="space-y-1">
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Plano Atual</p>
                     <h3 className="text-5xl font-black text-gray-900 dark:text-white tracking-tighter italic uppercase">{plan}</h3>
                  </div>
                  <div className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center text-3xl">
                     {plan === "pro" ? "💎" : "🌱"}
                  </div>
               </div>

               <ul className="space-y-4">
                  {features[plan as keyof typeof features].map((f, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm font-bold text-gray-600 dark:text-gray-400">
                       <span className="text-blue-500">✓</span> {f}
                    </li>
                  ))}
               </ul>

               {plan === "free" ? (
                 <Button 
                   onClick={handleUpgrade}
                   className="w-full h-16 rounded-2xl bg-linear-to-r from-blue-600 to-indigo-600 text-white font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
                 >
                    MUDAR PARA PRO 🚀
                 </Button>
               ) : (
                 <Button className="w-full h-16 rounded-2xl bg-gray-50 dark:bg-black text-gray-400 border border-gray-100 dark:border-gray-800 font-black text-xs uppercase tracking-widest cursor-not-allowed">
                    PLANO PROFISSIONAL ATIVO
                 </Button>
               )}
            </div>

            {/* Background design */}
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform">
               <span className="text-9xl">💎</span>
            </div>
         </div>

         {/* NEXT LEVEL / PRO BENEFITS */}
         {plan === "free" ? (
           <div className="bg-linear-to-br from-indigo-900 to-black rounded-[2.5rem] p-10 shadow-2xl flex flex-col justify-between group overflow-hidden relative border border-white/5">
              <div className="space-y-6 relative z-10">
                 <h3 className="text-3xl font-black text-white tracking-tighter leading-tight italic uppercase">Desbloqueie o Poder Total do LKMOVIE01</h3>
                 <p className="text-white/60 font-medium">Sua criatividade não merece limites. Com o Plano PRO, você tem acesso a ferramentas de inteligência artificial generativa e exportação em Ultra HD.</p>
                 
                 <div className="grid grid-cols-2 gap-4">
                    {features.pro.slice(-4).map((f, i) => (
                      <div key={i} className="flex flex-col gap-2 p-4 bg-white/5 rounded-2xl border border-white/5">
                         <span className="text-blue-400 font-black text-[10px] uppercase">BENEFÍCIO</span>
                         <span className="text-white text-xs font-bold leading-tight">{f}</span>
                      </div>
                    ))}
                 </div>
              </div>

              <div className="absolute -bottom-10 -right-10 text-[10rem] opacity-10 blur-xl pointer-events-none group-hover:rotate-12 transition-transform">💎</div>
           </div>
         ) : (
           <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 p-10 shadow-2xl space-y-8">
              <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic">Histórico de Cobrança</h3>
              <div className="space-y-4">
                 {[
                   { date: "01 Mar, 2026", amount: "R$ 49.90", status: "Pago", icon: "🧾" },
                   { date: "01 Fev, 2026", amount: "R$ 49.90", status: "Pago", icon: "🧾" },
                   { date: "01 Jan, 2026", amount: "R$ 49.90", status: "Pago", icon: "🧾" }
                 ].map((bill, i) => (
                   <div key={i} className="flex items-center justify-between p-6 bg-gray-50 dark:bg-black rounded-3xl border border-gray-100 dark:border-gray-800 group hover:border-blue-500/30 transition-all cursor-pointer">
                      <div className="flex items-center gap-4">
                         <span className="text-2xl">{bill.icon}</span>
                         <div className="space-y-0.5">
                            <p className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tighter">{bill.date}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Assinatura Mensal</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-sm font-black text-gray-900 dark:text-white">{bill.amount}</p>
                         <p className="text-[10px] font-black text-green-500 uppercase">{bill.status}</p>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
         )}
      </div>
    </div>
  );
}
