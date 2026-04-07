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
import { createRenderJob, RenderStatus } from "@/lib/firebase/render-jobs";
import { createNotification } from "@/lib/firebase/notifications";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import axios from "axios";

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
  { id: "cinematográfico", label: "Cine", icon: "💎", color: "violet" }
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
  const [jobId, setJobId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [renderStatus, setRenderStatus] = useState<RenderStatus>("pending");
  const [outputUrl, setOutputUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId || !db || !user) return;
    const docRef = doc(db, "renderJobs", jobId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProgress(data.progress || 0);
        setRenderStatus(data.status);
        if (data.status === "completed" && data.outputUrl) {
          setOutputUrl(data.outputUrl);
          setStatus("Vídeo Viral Pronto! 🚀");
          if (showToast) showToast("Renderização Concluída!", "success");
          
          // Phase 11: Notificação de sistema
          createNotification(user.uid, {
            title: "Renderização Concluída",
            message: "Seu vídeo viral já está pronto para download.",
            type: "success"
          });
        }
        if (data.status === "failed") {
          setError(data.errorMessage || "Falha técnica no motor viral.");
          setIsGenerating(false);
        }
      }
    });
    return () => unsubscribe();
  }, [jobId, user, showToast]);

  const handleShare = () => {
    if (!jobId) return;
    const url = `${window.location.origin}/video/${jobId}`;
    if (navigator.share) {
      navigator.share({ title: "Meu Vídeo Viral", url });
    } else {
      navigator.clipboard.writeText(url);
      if (showToast) showToast("Link de compartilhamento copiado! 🔗", "success");
    }
  };

  const handleGenerate = async () => {
    if (!user || !idea.trim()) return;
    const limitCheck = canPerformAction(branding as any, "project");
    if (!limitCheck.allowed) {
      setError(limitCheck.message || "Limite de conta atingido.");
      return;
    }
    setIsGenerating(true);
    setError(null);
    setStatus("IA Viral Hub inicializando...");

    try {
      const config = generateAutoProject(idea, platform, template);
      setStatus(`Buscando visual para ${template.toUpperCase()}...`);
      const searchRes = await fetch(`/api/search?q=${encodeURIComponent(config.query)}`);
      const videos = await searchRes.json();
      if (!videos || videos.length === 0) throw new Error("Cenas não encontradas.");
      const bestVideo = videos[0];
      
      const projectId = await createProject({
        userId: user.uid,
        title: `Viral: ${idea.slice(0, 20)}`,
        videoId: bestVideo.id,
        thumbnail: bestVideo.thumbnail,
        channelTitle: bestVideo.channelTitle,
        aspectRatio: platform === "youtube" ? "16:9" : "9:16",
        subtitleText: config.caption,
        subtitleColor: config.style.color,
        subtitleSize: config.style.size,
        subtitlePosition: config.style.position as any,
        subtitleType: "pt", // Padrão para auto-gerado
        subtitleFont: "Inter",
        isAutoSubtitle: true,
        watermarkUrl: branding.defaultWatermark || "",
        watermarkOpacity: 60,
        watermarkPosition: platform === "youtube" ? "bottom-right" : "bottom-left",
        watermarkScale: 0.15,
        endScreenUrl: branding.defaultEndScreen || "",
        audioMode: config.audio.mix,
        volumeVideo: 1,
        volumeMusic: config.audio.volumeMusic || 0.6,
      });



      const renderJobId = await createRenderJob(user.uid, projectId);
      setJobId(renderJobId);

      await axios.post("/api/render-video", {
        renderJobId, userId: user.uid, projectId, videoUrl: bestVideo.thumbnail,
        subtitleText: config.caption, subtitleColor: config.style.color,
        subtitleSize: config.style.size, subtitlePosition: config.style.position,
        volumeVideo: 1, volumeMusic: config.audio.volumeMusic || 0.6,
        muteOriginal: config.audio.mix === "remove", outputAspectRatio: platform === "youtube" ? "16:9" : "9:16",
        watermarkUrl: branding.defaultWatermark || "", watermarkOpacity: 0.6,
        watermarkPosition: platform === "youtube" ? "bottom-right" : "bottom-left", watermarkScale: 0.15,
      });
    } catch (err: any) {
      setError(err.message);
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-3xl z-100 flex items-center justify-center p-6 animate-in fade-in">
      <div className="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-[3.5rem] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col min-h-[600px]">
        <div className="p-10 border-b border-gray-100 dark:border-gray-800 flex justify-between bg-black/50">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500 text-white flex items-center justify-center text-2xl shadow-lg">⚡</div>
              <h2 className="text-2xl font-black text-white uppercase italic">Viral Hub</h2>
           </div>
           <button onClick={onClose} disabled={isGenerating} className="text-xl text-gray-400 hover:text-white">✕</button>
        </div>
        <div className="flex-1 p-10 overflow-y-auto space-y-10">
           {renderStatus === 'completed' ? (
              <div className="text-center space-y-8 flex flex-col items-center justify-center h-full">
                 <div className="text-6xl animate-bounce">🎬</div>
                 <h3 className="text-3xl font-black text-white">VÍDEO VIRAL PRONTO!</h3>
                 <div className="flex flex-col gap-4 w-full max-w-xs">
                    <a href={outputUrl!} target="_blank" download className="w-full">
                       <Button className="w-full h-20 rounded-3xl font-black bg-green-500 hover:scale-105 transition-transform">DOWNLOAD MP4 💎</Button>
                    </a>
                    <Button onClick={handleShare} variant="outline" className="h-16 rounded-3xl font-black uppercase tracking-widest border-gray-800 text-gray-400">COMPARTILHAR 🔗</Button>
                    <Button onClick={() => router.push("/biblioteca")} variant="ghost" className="text-xs font-black uppercase text-gray-500">Ver na Galeria ➔</Button>
                 </div>
              </div>
           ) : isGenerating ? (
              <div className="text-center space-y-8 py-20 flex flex-col items-center">
                 <div className="animate-spin w-20 h-20 border-8 border-t-white border-white/10 rounded-full"></div>
                 <p className="text-sm font-black uppercase tracking-widest text-blue-500 animate-pulse">{status}</p>
                 <div className="w-full h-2 bg-black rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 transition-all duration-700" style={{ width: `${progress}%` }}></div>
                 </div>
              </div>
           ) : (
              <div className="space-y-10">
                 <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Plataforma</label>
                       <div className="grid grid-cols-2 gap-2">
                          {PLATFORMS.map(p => (
                             <button key={p.id} onClick={() => setPlatform(p.id)} className={`p-4 rounded-xl border-2 text-[10px] uppercase font-black transition-all ${platform === p.id ? 'border-blue-500 bg-blue-500/5' : 'border-gray-800 opacity-60'}`}>{p.icon} {p.label}</button>
                          ))}
                       </div>
                    </div>
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Template</label>
                       <div className="grid grid-cols-1 gap-2">
                          {TEMPLATES.map(t => (
                             <button key={t.id} onClick={() => setTemplate(t.id)} className={`p-3 rounded-xl border-2 text-[10px] uppercase font-black text-left transition-all ${template === t.id ? 'border-indigo-500 bg-indigo-500/5' : 'border-gray-800 opacity-60'}`}>{t.icon} {t.label}</button>
                          ))}
                       </div>
                    </div>
                 </div>
                 <textarea 
                   placeholder="Sua ideia viral..."
                   className="w-full h-32 bg-black rounded-[2rem] p-8 border border-gray-800 text-white font-bold"
                   value={idea}
                   onChange={e => setIdea(e.target.value)}
                 />
              </div>
           )}
           {error && <div className="p-6 bg-red-500/10 text-red-500 rounded-2xl text-[10px] font-black uppercase text-center">{error}</div>}
        </div>
        {!isGenerating && renderStatus !== 'completed' && (
           <div className="p-10 border-t border-gray-800">
              <Button onClick={handleGenerate} disabled={!idea.trim()} className="w-full h-20 rounded-[2rem] font-black text-xl bg-blue-600 hover:scale-[1.02]">GERAR AGORA 🚀</Button>
           </div>
        )}
      </div>
    </div>
  );
}
