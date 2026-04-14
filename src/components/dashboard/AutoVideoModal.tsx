"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/auth-context";
import { useBranding } from "@/context/branding-context";
import { generateAutoProject, Platform, ViralTemplate } from "@/lib/ai/auto-generator";
import { createProject } from "@/lib/firebase/projects";
import { canPerformAction } from "@/lib/utils/usage-limits";
import { incrementUserStat } from "@/lib/firebase/user-settings";

interface AutoVideoModalProps {
  onClose: () => void;
}

const PLATFORMS: {id: Platform, label: string, icon: string}[] = [
  { id: "tiktok", label: "TikTok (9:16)", icon: "📱" },
  { id: "reels", label: "Reels (9:16)", icon: "🎥" },
  { id: "shorts", label: "Shorts (9:16)", icon: "🎬" },
  { id: "youtube", label: "YouTube (16:9)", icon: "📺" }
];

const TEMPLATES: {id: ViralTemplate, label: string, icon: string, color: string}[] = [
  { id: "motivacional", label: "Motivação", icon: "🚀", color: "blue" },
  { id: "triste", label: "Emocional", icon: "💔", color: "indigo" },
  { id: "impacto", label: "Impacto", icon: "🌋", color: "amber" },
  { id: "reflexivo", label: "Reflexão", icon: "✨", color: "emerald" },
  { id: "cinematográfico", label: "Cine", icon: "💎", color: "violet" },
  { id: "curiosidade", label: "Curioso", icon: "🧐", color: "amber" }
];

export function AutoVideoModal({ onClose }: AutoVideoModalProps) {
  const { user } = useAuth();
  const { branding, showToast } = useBranding();
  const router = useRouter();

  const [platform, setPlatform] = useState<Platform>("tiktok");
  const [template, setTemplate] = useState<ViralTemplate>("motivacional");
  const [idea, setIdea] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string|null>(null);

  const handleGenerate = async () => {
    if (!user || !idea.trim()) return;
    
    // SaaS Protection
    const limitCheck = canPerformAction(branding as any, "project");
    if (!limitCheck.allowed) {
      setError(limitCheck.message || "Limite de conta atingido.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setStatus("Estudando sua ideia com IA...");

    try {
      // 1. Geração Inteligente de Parâmetros
      const config = generateAutoProject(idea, platform, template);
      
      // 2. Busca Automática do Melhor Clip
      setStatus("Buscando cenas cinematográficas...");
      const searchRes = await fetch(`/api/search?q=${encodeURIComponent(config.query)}`);
      const videos = await searchRes.json();
      
      if (!videos || videos.length === 0) {
         throw new Error("Não encontramos cenas ideais para este tema. Tente outra ideia!");
      }

      const bestVideo = videos[0];
      setStatus("Sintonizando estética viral...");
      await new Promise(r => setTimeout(r, 1200)); // Simulando inteligência

      setStatus("Configurando legendas dinâmicas...");
      await new Promise(r => setTimeout(r, 800));

      // 3. Criação do Projeto no Firestore
      setStatus("Finalizando sua obra-prima...");
      const projectId = await createProject({
        userId: user.uid,
        title: `AI Viral: ${idea.slice(0, 30)}...`,
        videoId: bestVideo.id,
        thumbnail: bestVideo.thumbnail,
        channelTitle: bestVideo.channelTitle,
        aspectRatio: platform === "youtube" ? "16:9" : "9:16",
        subtitleText: config.caption,
        subtitleTextEn: config.captionEn,
        subtitleColor: config.style.color,
        subtitleSize: config.style.size,
        subtitlePosition: config.style.position as any,
        subtitleType: "both", // Padrão Pro: Dual Language
        subtitleFont: "Montserrat",
        subtitlePreset: config.editorPreset,
        isAutoSubtitle: true,
        watermarkUrl: branding.defaultWatermark || "",
        watermarkOpacity: 60,
        watermarkPosition: "bottom-right",
        watermarkScale: 0.15,
        endScreenUrl: branding.defaultEndScreen || "",
        audioMode: config.audio.mix,
        volumeVideo: 1,
        volumeMusic: config.audio.volumeMusic || 0.6,
      });

      setStatus("Projeto pronto! Redirecionando...");
      if (showToast) showToast("Vídeo Viral Gerado com Sucesso! ✨", "success");
      
      // 4. Analytics
      await incrementUserStat(user.uid, "usage.aiGenerations");

      // 5. Redirecionamento
      router.push(`/editor?id=${projectId}`);
      onClose();

    } catch (err: any) {
      setError(err.message || "Erro fatal no Motor Viral. Tente novamente.");
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-2xl z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300 overflow-y-auto">
      <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl w-full max-w-2xl shadow-[0_0_100px_rgba(37,99,235,0.2)] flex flex-col my-auto">
        
        {/* MODAL HEADER */}
        <div className="p-10 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-blue-600/10 to-transparent">
           <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(37,99,235,0.5)] animate-pulse">🪄</div>
              <div>
                <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">Gerador Viral AI</h2>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Transforme ideias em produções de elite</p>
              </div>
           </div>
           {!isGenerating && <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors text-gray-500 hover:text-white">✕</button>}
        </div>

        {/* MODAL CONTENT */}
        <div className="flex-1 p-6 sm:p-10 space-y-8 overflow-y-auto">
           {isGenerating ? (
              <div className="text-center space-y-12 py-20 flex flex-col items-center justify-center h-full">
                 <div className="relative">
                    <div className="w-24 h-24 border-8 border-blue-600/10 border-t-blue-600 animate-spin rounded-full shadow-2xl"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-3xl">🚀</div>
                 </div>
                 <div className="space-y-4">
                    <p className="text-sm font-black uppercase tracking-[0.4em] text-blue-500 animate-pulse">{status}</p>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest max-w-xs mx-auto leading-relaxed opacity-60 italic">Nossos satélites estão localizando os melhores visuais para sua ideia...</p>
                 </div>
              </div>
           ) : (
              <div className="space-y-10 animate-in slide-in-from-bottom-5">
                 <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] italic">Destino Final</label>
                       <div className="grid grid-cols-2 gap-2">
                          {PLATFORMS.map(p => (
                             <button 
                                key={p.id} 
                                onClick={() => setPlatform(p.id)} 
                                className={`h-14 rounded-2xl border-2 text-[10px] uppercase font-black transition-all flex items-center justify-center gap-2 ${platform === p.id ? 'border-blue-500 bg-blue-500/10 text-blue-400 shadow-lg shadow-blue-500/10' : 'border-white/5 bg-white/5 text-gray-600 hover:border-white/10'}`}
                             >
                                <span className="text-lg">{p.icon}</span> {p.label.split(' ')[0]}
                             </button>
                          ))}
                       </div>
                    </div>
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] italic">Estética Viral</label>
                       <div className="flex flex-wrap gap-2">
                          {TEMPLATES.map(t => (
                             <button 
                                key={t.id} 
                                onClick={() => setTemplate(t.id as any)} 
                                className={`px-4 h-11 rounded-xl border-2 text-[9px] uppercase font-black transition-all flex items-center gap-2 ${template === t.id ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'border-white/5 bg-white/5 text-gray-600 hover:border-white/10'}`}
                             >
                                <span>{t.icon}</span> {t.label}
                             </button>
                          ))}
                       </div>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] italic">Qual o conceito da cena?</label>
                    <textarea 
                      placeholder="Ex: Frase motivacional sobre resiliência na academia..."
                      className="w-full h-40 bg-white/5 rounded-[2rem] p-8 border border-white/5 text-white font-bold placeholder:text-gray-700 outline-none focus:border-blue-500/50 transition-all resize-none shadow-inner"
                      value={idea}
                      onChange={e => setIdea(e.target.value)}
                    />
                 </div>
              </div>
           )}

           {error && (
              <div className="p-6 bg-red-600/10 border border-red-600/20 text-red-500 rounded-2xl text-[10px] font-black uppercase text-center tracking-widest italic animate-in shake duration-500">
                 🚨 {error}
              </div>
           )}
        </div>

        {/* MODAL FOOTER */}
        {!isGenerating && (
           <div className="p-10 border-t border-white/5 bg-black/50">
              <Button 
                onClick={handleGenerate} 
                disabled={!idea.trim()} 
                className="w-full h-16 sm:h-20 rounded-2xl sm:rounded-[2.5rem] font-black text-xs uppercase tracking-[0.4em] bg-blue-600 hover:bg-blue-500 shadow-2xl shadow-blue-600/30 hover:scale-[1.02] active:scale-95 transition-all"
              >
                MONTAR VÍDEO VIRAL AGORA 🚀
              </Button>
              <p className="text-center text-[9px] font-black text-gray-600 uppercase tracking-widest mt-6 opacity-40 italic">
                 A IA selecionará a cena, criará as legendas e aplicará o estilo perfeito.
              </p>
           </div>
        )}
      </div>
    </div>
  );
}
