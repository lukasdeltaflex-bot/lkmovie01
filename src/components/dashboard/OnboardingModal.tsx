"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useBranding } from "@/context/branding-context";

interface OnboardingModalProps {
  onComplete: (preferences: { goal: string; style: string }) => void;
}

export function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState(1);
  const [selections, setSelections] = useState({
    goal: "",
    style: ""
  });
  const { branding } = useBranding();

  const steps = [
    {
      title: "Busque Cenas Inteligentes",
      content: "Acesse uma biblioteca infinita de cenas cinematográficas com nossa busca premium de clipes 4K.",
      icon: "🔍",
      color: "#3b82f6"
    },
    {
      title: "Edição Profissional",
      content: "Legendas automáticas, watermarks e mixagem de áudio com um clique.",
      icon: "🎬",
      color: branding.primaryColor
    },
    {
      title: "Qual o seu objetivo?",
      content: "Selecione o tipo de conteúdo que você mais produz para personalizarmos sua experiência.",
      icon: "🎯",
      color: "#8b5cf6",
      type: "goal",
      options: [
        { id: "tiktok", label: "Tiktok / Reels", icon: "📱" },
        { id: "youtube", label: "YouTube Longo", icon: "📺" },
        { id: "ads", label: "Anúncios / Vendas", icon: "💰" },
        { id: "corp", label: "Corporativo", icon: "🏢" }
      ]
    },
    {
      title: "Seu Estilo Visual",
      content: "Escolha a estética que melhor define sua marca.",
      icon: "✨",
      color: "#10b981",
      type: "style",
      options: [
        { id: "cinematic", label: "Cinematográfico", icon: "🎥" },
        { id: "modern", label: "Moderno / Minimal", icon: "⚪" },
        { id: "dynamic", label: "Dinâmico / Rápido", icon: "⚡" }
      ]
    },
    {
      title: "Tudo Pronto!",
      content: "Sua central de inteligência cinematográfica está configurada e pronta para o primeiro projeto.",
      icon: "🚀",
      color: branding.primaryColor
    }
  ];

  const currentStep = steps[step - 1];

  const handleNext = () => {
    if (step < steps.length) {
      setStep(step + 1);
    } else {
      onComplete(selections);
    }
  };

  const isNextDisabled = (currentStep.type === "goal" && !selections.goal) || (currentStep.type === "style" && !selections.style);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-3xl z-100 flex items-center justify-center p-6 animate-in fade-in duration-500">
      <div className="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-[3rem] w-full max-w-4xl overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] flex flex-col md:flex-row min-h-[500px]">
         
         {/* Lado Esquerdo: Visual */}
         <div 
          className="w-full md:w-5/12 p-12 flex flex-col items-center justify-center text-center space-y-8 transition-all duration-700"
          style={{ background: `linear-gradient(to bottom right, ${currentStep.color}1a, ${currentStep.color}33)` }}
         >
            <div 
              className="w-40 h-40 bg-white dark:bg-gray-900 rounded-[3.5rem] shadow-2xl flex items-center justify-center text-7xl animate-bounce"
              style={{ color: currentStep.color }}
            >
               {currentStep.icon}
            </div>
            <div className="flex gap-2">
               {steps.map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-1.5 rounded-full transition-all duration-500 ${step === i + 1 ? 'w-12' : 'w-2 bg-gray-300 dark:bg-gray-800'}`}
                    style={step === i + 1 ? { backgroundColor: currentStep.color } : {}}
                  ></div>
               ))}
            </div>
         </div>

         {/* Lado Direito: Conteúdo */}
         <div className="w-full md:w-7/12 p-12 flex flex-col justify-between space-y-10">
            <div className="space-y-6">
               <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Passo {step} de {steps.length}</span>
                  <h3 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter leading-none uppercase italic">{currentStep.title}</h3>
               </div>
               <p className="text-gray-500 dark:text-gray-400 font-bold text-lg leading-relaxed">{currentStep.content}</p>

               {/* Opções Interativas */}
               {currentStep.options && (
                 <div className="grid grid-cols-2 gap-4 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {currentStep.options.map(opt => {
                      const isSelected = (currentStep.type === "goal" && selections.goal === opt.id) || (currentStep.type === "style" && selections.style === opt.id);
                      return (
                        <button
                          key={opt.id}
                          onClick={() => setSelections({ ...selections, [currentStep.type!]: opt.id })}
                          className={`flex flex-col items-center justify-center p-6 rounded-3xl border-2 transition-all gap-3 group ${isSelected ? 'border-blue-500 bg-blue-500/5' : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'}`}
                        >
                           <span className={`text-3xl transition-transform group-hover:scale-110 ${isSelected ? 'scale-110' : ''}`}>{opt.icon}</span>
                           <span className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? 'text-blue-500' : 'text-gray-500'}`}>{opt.label}</span>
                        </button>
                      );
                    })}
                 </div>
               )}
            </div>

            <div className="flex gap-4">
               {step > 1 && (
                 <Button 
                   onClick={() => setStep(step - 1)}
                   className="h-16 px-8 rounded-2xl font-black text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                 >
                   VOLTAR
                 </Button>
               )}
               <Button 
                 onClick={handleNext}
                 disabled={isNextDisabled}
                 className={`flex-1 h-16 rounded-2xl font-black shadow-2xl text-white transition-all ${isNextDisabled ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:scale-[1.02] active:scale-95'}`}
                 style={{ backgroundColor: isNextDisabled ? '#ccc' : branding.primaryColor }}
               >
                 {step === steps.length ? "COMEÇAR AGORA 🚀" : "PRÓXIMO ➔"}
               </Button>
            </div>
         </div>
      </div>
    </div>
  );
}
