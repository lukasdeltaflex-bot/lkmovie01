"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useSelectedVideo } from "@/context/selected-video-context";
import { useAuth } from "@/context/auth-context";
import { useBranding } from "@/context/branding-context";
import { useSearchParams, useRouter } from "next/navigation";
import { createProject, updateProject, getProjectById } from "@/lib/firebase/projects";
import { createRenderJob } from "@/lib/firebase/render-jobs";
import { saveEditorPreset, getUserPresets, EditorPreset } from "@/lib/firebase/presets";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import axios from "axios";
import { SavedProject } from "@/types/project.d";

type AspectRatio = "16:9" | "9:16" | "1:1";
type EditorSection = "video" | "subtitle" | "audio" | "watermark" | "final";

export default function EditorPage() {
  const { selectedVideo, clips, activeClipIndex, setActiveClipIndex, setClips } = useSelectedVideo();
  const { user } = useAuth();
  const { branding, showToast } = useBranding();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [activeSection, setActiveSection] = useState<EditorSection>("video");
  const [projectId, setProjectId] = useState<string | null>(searchParams.get("id"));
  const [isSaving, setIsSaving] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderStatus, setRenderStatus] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const [isSuggesting, setIsSuggesting] = useState(false);
  const [presets, setPresets] = useState<EditorPreset[]>([]);

  const [videoConfig, setVideoConfig] = useState({
    aspectRatio: "16:9" as AspectRatio,
    zoom: 100,
    showGrid: false,
  });

  const [subtitle, setSubtitle] = useState({
    text: "NOVA LEGENDA AQUI",
    color: "#ffffff",
    size: 28,
    x: 50,
    y: 80,
  });

  const [watermark, setWatermark] = useState({
    url: "",
    opacity: 80,
    size: 100,
    x: 90,
    y: 10,
  });

  const [audioConfig, setAudioConfig] = useState({
    musicUrl: null as string | null,
    musicVolume: 50,
    videoVolume: 100,
    mixMode: "mix" as "keep" | "remove" | "mix"
  });

  const [innerProjectId, setInnerProjectId] = useState<string | null>(projectId);

  const [isDragging, setIsDragging] = useState<"subtitle" | "watermark" | null>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (innerProjectId && user) {
      getProjectById(innerProjectId).then(proj => {
        if (proj) {
          setSubtitle({
            text: proj.subtitleText,
            color: proj.subtitleColor,
            size: proj.subtitleSize,
            x: 50,
            y: proj.subtitlePosition === "bottom" ? 80 : proj.subtitlePosition === "top" ? 20 : 50
          });
          setWatermark({
            url: proj.watermarkUrl,
            opacity: proj.watermarkOpacity,
            size: proj.watermarkScale * 500,
            x: proj.watermarkPosition.includes("right") ? 90 : 10,
            y: proj.watermarkPosition.includes("bottom") ? 90 : 10,
          });
          setAudioConfig({
            musicUrl: null,
            musicVolume: proj.volumeMusic * 100,
            videoVolume: proj.volumeVideo * 100,
            mixMode: proj.audioMode
          });
        }
      });
    }
  }, [innerProjectId, user]);

  useEffect(() => {
    if (user) {
      getUserPresets(user.uid).then(setPresets);
    }
  }, [user]);

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !videoContainerRef.current) return;
    const rect = videoContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const safeX = Math.max(5, Math.min(95, x));
    const safeY = Math.max(5, Math.min(95, y));

    if (isDragging === "subtitle") setSubtitle(prev => ({ ...prev, x: safeX, y: safeY }));
    else setWatermark(prev => ({ ...prev, x: safeX, y: safeY }));
  };

  const handleSaveProject = async () => {
    if (!user || !selectedVideo) return null;
    setIsSaving(true);
    setSaveStatus("saving");
    try {
      const projectData: Omit<SavedProject, "id" | "createdAt" | "updatedAt" | "deletedAt" | "status"> = {
        userId: user.uid,
        videoId: selectedVideo.id,
        title: selectedVideo.title,
        thumbnail: selectedVideo.thumbnail,
        channelTitle: selectedVideo.channel || "Unknown",
        subtitleText: subtitle.text,
        subtitleColor: subtitle.color,
        subtitleSize: subtitle.size,
        subtitlePosition: subtitle.y > 60 ? "bottom" : subtitle.y < 40 ? "top" : "center",
        watermarkUrl: watermark.url || branding.defaultWatermark,
        watermarkOpacity: watermark.opacity,
        watermarkPosition: watermark.x > 50 ? (watermark.y > 50 ? "bottom-right" : "top-right") : (watermark.y > 50 ? "bottom-left" : "top-left"),
        watermarkScale: watermark.size / 500,
        endScreenUrl: branding.defaultEndScreen,
        audioMode: audioConfig.mixMode,
        volumeVideo: audioConfig.videoVolume / 100,
        volumeMusic: audioConfig.musicVolume / 100,
      };

      let currentId = innerProjectId;
      if (currentId) {
        await updateProject(currentId, projectData as any);
      } else {
        currentId = await createProject(projectData);
        setInnerProjectId(currentId);
      }
      
      setSaveStatus("success");
      setLastSaved(new Date());
      showToast("Projeto salvo!", "success");
      return currentId;
    } catch (error) {
       setSaveStatus("error");
       showToast("Erro ao salvar.", "error");
       return null;
    } finally {
       setIsSaving(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!selectedVideo || !user) return;
    
    // Garantir que o projeto está salvo antes de renderizar
    const currentProjectId = await handleSaveProject();
    if (!currentProjectId) return;
    
    setIsRendering(true);
    setRenderStatus("PREPARANDO GERAÇÃO...");
    setRenderProgress(10);
    
    try {
      // Criar o Job no Firestore
      await createRenderJob(user.uid, currentProjectId);
      
      setRenderProgress(100);
      setRenderStatus("SOLICITAÇÃO ENVIADA!");
      showToast("Geração iniciada! Acompanhe na biblioteca.", "success");
      
      setTimeout(() => {
        router.push("/biblioteca");
      }, 1500);
    } catch (error: any) {
      console.error(error);
      showToast("Erro ao iniciar geração.", "error");
      setIsRendering(false);
    }
  };

  if (!selectedVideo) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center space-y-10 min-h-[70vh] animate-in fade-in duration-1000">
        <div className="w-32 h-32 rounded-4xl bg-gray-100 dark:bg-gray-900 flex items-center justify-center text-6xl shadow-inner border border-gray-100 dark:border-gray-800">🎬</div>
        <div className="space-y-4 max-w-sm">
          <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-widest uppercase italic">Editor Vazio</h2>
          <p className="text-gray-400 font-bold">Escolha um vídeo na galeria para começar.</p>
        </div>
        <Link href="/buscar-cenas">
          <Button size="xl" className="shadow-2xl">BUSCAR CENAS 🔍</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-700 pb-20 select-none px-4 lg:px-0">
      
      {isRendering && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-8 bg-black/90 backdrop-blur-3xl">
           <div className="w-full max-w-md space-y-10 text-center">
              <div className="animate-spin w-20 h-20 border-4 border-t-transparent border-blue-500 rounded-full mx-auto"></div>
              <h2 className="text-4xl font-black text-white tracking-widest uppercase">{renderStatus}</h2>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                 <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${renderProgress}%` }}></div>
              </div>
              <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Você será redirecionado em breve...</p>
           </div>
        </div>
      )}

      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 rounded-4xl shadow-xl">
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center text-2xl font-black shadow-inner">V</div>
          <div>
            <h1 className="text-lg font-black text-gray-900 dark:text-white tracking-widest uppercase italic truncate max-w-[250px] md:max-w-md">
               {selectedVideo.title}
            </h1>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">
               {saveStatus === "saving" ? "Sincronizando..." : `Último salvamento: ${lastSaved?.toLocaleTimeString() || '--:--'}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleSaveProject} disabled={isSaving}>SALVAR PROJETO</Button>
          <Button onClick={handleGenerateVideo}>GERAR VÍDEO FINAL 💎</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-8 flex flex-col gap-6">
           <div 
              ref={videoContainerRef}
              className={`relative bg-black rounded-4xl shadow-2xl border-[8px] border-white dark:border-gray-900 overflow-hidden transition-all duration-500 w-full group self-center`}
              style={{ 
                aspectRatio: videoConfig.aspectRatio.replace(':', '/'), 
                maxWidth: videoConfig.aspectRatio === '9:16' ? '400px' : '100%' 
              }}
              onPointerMove={handlePointerMove}
              onPointerUp={() => setIsDragging(null)}
           >
              <img 
                src={selectedVideo.thumbnail} 
                className={`w-full h-full object-cover select-none pointer-events-none transition-all duration-300`} 
                style={{ transform: `scale(${videoConfig.zoom / 100})` }}
                alt="preview"
              />

              {watermark.url && (
                <div 
                  className="absolute cursor-move select-none"
                  onPointerDown={(e) => { e.preventDefault(); setIsDragging("watermark"); }}
                  style={{ left: `${watermark.x}%`, top: `${watermark.y}%`, transform: `translate(-50%, -50%)`, width: `${watermark.size}px`, opacity: watermark.opacity / 100 }}
                >
                   <img src={watermark.url} className="w-full drop-shadow-xl pointer-events-none" />
                </div>
              )}

              <div 
                className="absolute cursor-move select-none flex justify-center"
                onPointerDown={(e) => { e.preventDefault(); setIsDragging("subtitle"); }}
                style={{ left: `${subtitle.x}%`, top: `${subtitle.y}%`, transform: `translate(-50%, -50%)`, width: 'max-content', maxWidth: '90%' }}
              >
                 <div className="px-6 py-2 rounded-xl text-center shadow-2xl font-black italic uppercase tracking-tighter"
                   style={{ color: subtitle.color, fontSize: `${subtitle.size}px`, textShadow: '2px 2px 0px rgba(0,0,0,0.5)' }}
                 >
                   {subtitle.text}
                 </div>
              </div>
           </div>

           <div className="bg-white dark:bg-gray-900 p-6 rounded-4xl border border-gray-100 dark:border-gray-800 shadow-lg">
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
                 {clips.map((clip, idx) => (
                    <div 
                       key={idx}
                       onClick={() => setActiveClipIndex(idx)}
                       className={`relative flex-shrink-0 w-32 aspect-video rounded-xl overflow-hidden border-2 transition-all ${activeClipIndex === idx ? 'border-blue-500 shadow-lg scale-105' : 'border-transparent opacity-60'}`}
                    >
                       <img src={clip.thumbnail} className="w-full h-full object-cover" />
                    </div>
                 ))}
              </div>
           </div>
        </div>

        <div className="xl:col-span-4 space-y-6">
           <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-4xl shadow-xl p-8 space-y-8 min-h-[600px]">
              
              <div className="flex gap-1 bg-gray-50 dark:bg-black/50 p-1.5 rounded-2xl border border-gray-100 dark:border-gray-800">
                 {(["video", "subtitle", "audio", "watermark"] as const).map(sec => (
                   <button 
                    key={sec}
                    onClick={() => setActiveSection(sec)}
                    className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeSection === sec ? 'bg-white dark:bg-gray-800 text-blue-500 shadow-md' : 'text-gray-400'}`}
                   >{sec}</button>
                 ))}
              </div>

              <div className="space-y-8 animate-in slide-in-from-right-2 duration-300">
                  {activeSection === "video" && (
                    <div className="space-y-6">
                       <div className="space-y-4">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Formato</label>
                          <div className="grid grid-cols-3 gap-2">
                             {(["16:9", "9:16", "1:1"] as AspectRatio[]).map(r => (
                               <button 
                                key={r} onClick={() => setVideoConfig(v => ({...v, aspectRatio: r}))}
                                className={`py-3 rounded-xl border-2 text-[10px] font-black transition-all ${videoConfig.aspectRatio === r ? 'border-blue-500 bg-blue-500/10 text-blue-500' : 'border-gray-100 dark:border-gray-800 text-gray-400'}`}
                               >{r}</button>
                             ))}
                          </div>
                       </div>
                       <Button variant="outline" className="w-full" onClick={() => setVideoConfig(v => ({...v, showGrid: !v.showGrid}))}>GRADE {videoConfig.showGrid ? 'LIGADA' : 'DESLIGADA'}</Button>
                    </div>
                  )}

                  {activeSection === "subtitle" && (
                    <div className="space-y-6">
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Conteúdo</label>
                          <Input value={subtitle.text} onChange={(e) => setSubtitle(s => ({...s, text: e.target.value.toUpperCase()}))} className="h-14 font-black italic" />
                       </div>
                    </div>
                  )}

                  {activeSection === "watermark" && (
                     <div className="space-y-6">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">URL da Marca d'água</label>
                        <Input value={watermark.url} onChange={(e) => setWatermark(w => ({...w, url: e.target.value}))} placeholder="https://..." className="h-14" />
                     </div>
                  )}

                  {activeSection === "audio" && (
                     <div className="space-y-6">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Modo de Áudio</label>
                            <div className="grid grid-cols-3 gap-2">
                               {(["keep", "remove", "mix"] as const).map(m => (
                                 <button 
                                  key={m} onClick={() => setAudioConfig(a => ({...a, mixMode: m}))}
                                  className={`py-3 rounded-xl border-2 text-[10px] font-black uppercase transition-all ${audioConfig.mixMode === m ? 'border-blue-500 bg-blue-500/10 text-blue-500' : 'border-gray-100 dark:border-gray-800 text-gray-400'}`}
                                 >{m}</button>
                               ))}
                            </div>
                        </div>
                     </div>
                  )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
