"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useBranding } from "@/context/branding-context";

interface OnboardingModalProps {
  onComplete: () => void;
}

export function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState(1);
  const { branding } = useBranding();

  const steps = [
    {
      title: "Boas-vindas ao Estúdio SaaS",
      content: "Transforme cenas épicas em vídeos virais com a identidade da sua marca em segundos.",
      icon: "🎬",
      color: branding.primaryColor
    },
    {
      title: "Sua Marca em Todo Lugar",
      content: "Configure sua marca d'água e logo final nas configurações para automação total.",
      icon: "💎",
      color: branding.secondaryColor
    },
    {
      title: "Edição Interativa Cloud",
      content: "Arraste legendas, escolha proporções (Reels, Shorts) e salve seus próprios presets.",
      icon: "🚀",
      color: "#3b82f6"
    }
  ];

  const currentStep = steps[step - 1];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-3xl z-100 flex items-center justify-center p-6 animate-in fade-in duration-500">
      <div className="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-4xl w-full max-w-2xl overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] flex flex-col md:flex-row">
         
         {/* Lado Esquerdo: Visual */}
         <div 
          className="w-full md:w-1/2 p-12 flex flex-col items-center justify-center text-center space-y-6"
          style={{ background: `linear-gradient(to bottom right, ${currentStep.color}1a, ${currentStep.color}33)` }}
         >
            <div 
              className="w-32 h-32 bg-white dark:bg-gray-900 rounded-[3rem] shadow-2xl flex items-center justify-center text-6xl animate-bounce"
              style={{ color: currentStep.color }}
            >
               {currentStep.icon}
            </div>
            <div className="flex gap-2">
               {steps.map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-1.5 rounded-full transition-all ${step === i + 1 ? 'w-8' : 'w-2 bg-gray-300 dark:bg-gray-800'}`}
                    style={step === i + 1 ? { backgroundColor: currentStep.color } : {}}
                  ></div>
               ))}
            </div>
         </div>

         {/* Lado Direito: Conteúdo */}
         <div className="w-full md:w-1/2 p-12 flex flex-col justify-between space-y-10">
            <div className="space-y-4">
               <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter leading-none uppercase italic">{currentStep.title}</h3>
               <p className="text-gray-500 dark:text-gray-400 font-bold text-lg leading-relaxed">{currentStep.content}</p>
            </div>

            <div className="flex gap-3">
               {step < steps.length ? (
                  <Button 
                    onClick={() => setStep(step + 1)}
                    className="flex-1 h-16 rounded-2xl font-black shadow-2xl text-white"
                    style={{ backgroundColor: branding.primaryColor }}
                  >
                    PRÓXIMO ➔
                  </Button>
               ) : (
                  <Button 
                    onClick={onComplete}
                    className="flex-1 h-16 rounded-2xl font-black shadow-2xl text-white animate-pulse"
                    style={{ backgroundColor: branding.primaryColor }}
                  >
                    COMEÇAR AGORA 🚀
                  </Button>
               )}
            </div>
         </div>
      </div>
    </div>
  );
}
