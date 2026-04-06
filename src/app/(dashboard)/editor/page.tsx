"use client";

import React, { useState, useEffect, useCallback, useRef, Suspense } from "react";
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
type EditorSection = "video" | "subtitle" | "audio" | "watermark" | "platform";

function EditorContent() {
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

  // Phase 10: Social Preview
  const [showSocialOverlay, setShowSocialOverlay] = useState(false);
  const [targetPlatform, setTargetPlatform] = useState<"tiktok" | "instagram" | "youtube">("tiktok");

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
          // Auto aspect ratio if is viral
          if (proj.subtitlePosition === "center") {
             setVideoConfig(v => ({...v, aspectRatio: "9:16"}));
          }
        }
      });
    }
  }, [innerProjectId, user]);

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

  const applyPlatformPreset = (platform: "social" | "classic") => {
    if (platform === "social") {
       setVideoConfig(v => ({...v, aspectRatio: "9:16"}));
       setSubtitle(s => ({...s, y: 70, size: 36}));
       setWatermark(w => ({...w, x: 10, y: 90, size: 80}));
       setShowSocialOverlay(true);
    } else {
       setVideoConfig(v => ({...v, aspectRatio: "16:9"}));
       setSubtitle(s => ({...s, y: 85, size: 28}));
       setWatermark(w => ({...w, x: 90, y: 10, size: 100}));
       setShowSocialOverlay(false);
    }
    showToast(`Preset ${platform === 'social' ? 'Viral' : 'Classic'} aplicado!`, "success");
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
      showToast("Projeto sincronizado ⚡", "success");
      return currentId;
    } catch (error) {
       setSaveStatus("error");
       showToast("Erro ao sincronizar.", "error");
       return null;
    } finally {
       setIsSaving(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!selectedVideo || !user) return;
    const currentProjectId = await handleSaveProject();
    if (!currentProjectId) return;
    
    setIsRendering(true);
    setRenderStatus("INICIANDO ENGINE VIRAL...");
    setRenderProgress(10);
    
    try {
      const renderJobId = await createRenderJob(user.uid, currentProjectId);
      setRenderStatus("OTIMIZANDO LAYOUT...");
      setRenderProgress(30);

      const filename = `LK_${selectedVideo.title.replace(/\s+/g, '_')}_${videoConfig.aspectRatio.replace(':', 'x')}`;

      await axios.post("/api/render-video", {
        renderJobId,
        userId: user.uid,
        projectId: currentProjectId,
        videoUrl: selectedVideo.thumbnail,
        subtitleText: subtitle.text,
        subtitleColor: subtitle.color,
        subtitleSize: subtitle.size,
        subtitlePosition: subtitle.y > 60 ? "bottom" : subtitle.y < 40 ? "top" : "center",
        watermarkUrl: watermark.url || branding.defaultWatermark,
        watermarkOpacity: watermark.opacity / 100,
        watermarkPosition: watermark.x > 50 ? (watermark.y > 50 ? "bottom-right" : "top-right") : (watermark.y > 50 ? "bottom-left" : "top-left"),
        watermarkScale: watermark.size / 500,
        musicUrl: audioConfig.musicUrl,
        volumeVideo: audioConfig.videoVolume / 100,
        volumeMusic: audioConfig.musicVolume / 100,
        muteOriginal: audioConfig.mixMode === "remove",
        outputAspectRatio: videoConfig.aspectRatio,
        fileName: filename
      });

      setRenderProgress(100);
      setRenderStatus("EXPORTAÇÃO LANÇADA!");
      showToast("Geração enviada para nuvem! 🚀", "success");
      setTimeout(() => router.push("/biblioteca"), 1500);
    } catch (error: any) {
      showToast("Falha no render-worker.", "error");
      setIsRendering(false);
    }
  };

  if (!selectedVideo) return null;

  return (
    <div className="max-w-[1500px] mx-auto space-y-8 animate-in fade-in duration-700 pb-20 select-none px-4">
      {isRendering && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center p-8 bg-black/95 backdrop-blur-3xl">
           <div className="w-full max-w-md space-y-10 text-center">
              <div className="animate-spin w-24 h-24 border-8 border-t-transparent border-blue-500 rounded-full mx-auto shadow-2xl shadow-blue-500/20"></div>
              <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">{renderStatus}</h2>
              <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/10">
                 <div className="h-full bg-linear-to-r from-blue-600 to-indigo-600 transition-all duration-500" style={{ width: `${renderProgress}%` }}></div>
              </div>
           </div>
        </div>
      )}

      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-8 rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-16 h-16 rounded-3xl bg-linear-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-3xl font-black shadow-xl group-hover:scale-110 transition-transform">V</div>
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic truncate max-w-sm md:max-w-xl">
               {selectedVideo.title}
            </h1>
            <div className="flex items-center gap-2">
               <span className={`w-2 h-2 rounded-full ${saveStatus === 'saving' ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`}></span>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  {saveStatus === "saving" ? "CLOUD SYNCING..." : `SYNCED AT ${lastSaved?.toLocaleTimeString() || '--:--'}`}
               </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 relative z-10">
          <Button variant="outline" className="h-16 px-10 rounded-2xl border-gray-100 dark:border-gray-800" onClick={handleSaveProject} disabled={isSaving}>SALVAR 💾</Button>
          <Button className="h-16 px-12 rounded-2xl bg-blue-600 text-white shadow-xl hover:scale-105 active:scale-95 transition-all" onClick={handleGenerateVideo}>GERAR VIRAL 🚀</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        {/* PREVIEW CONTAINER */}
        <div className="xl:col-span-8 flex flex-col gap-6">
           <div 
              ref={videoContainerRef}
              className={`relative bg-black rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border-[10px] border-white dark:border-gray-900 overflow-hidden transition-all duration-700 w-full group self-center`}
              style={{ 
                aspectRatio: videoConfig.aspectRatio.replace(':', '/'), 
                maxWidth: videoConfig.aspectRatio === '9:16' ? '420px' : '100%',
                maxHeight: '75vh'
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

              {/* SOCIAL OVERLAY MOCKUP */}
              {showSocialOverlay && videoConfig.aspectRatio === "9:16" && (
                <div className="absolute inset-0 pointer-events-none animate-in fade-in duration-500">
                   <div className="absolute right-4 bottom-1/3 flex flex-col gap-6 items-center translate-y-20">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-xl">❤️</div>
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-xl">💬</div>
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-xl">🔗</div>
                   </div>
                   <div className="absolute bottom-6 left-6 max-w-[70%] space-y-3">
                      <div className="w-24 h-4 bg-white/20 backdrop-blur-md rounded-lg"></div>
                      <div className="w-48 h-3 bg-white/10 backdrop-blur-md rounded-lg"></div>
                   </div>
                </div>
              )}

              {/* WATERMARK DRAGGABLE */}
              {watermark.url && (
                <div 
                  className="absolute cursor-move select-none active:scale-110 transition-transform"
                  onPointerDown={(e) => { e.preventDefault(); setIsDragging("watermark"); }}
                  style={{ left: `${watermark.x}%`, top: `${watermark.y}%`, transform: `translate(-50%, -50%)`, width: `${watermark.size}px`, opacity: watermark.opacity / 100 }}
                >
                   <img src={watermark.url} className="w-full drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] pointer-events-none" />
                </div>
              )}

              {/* SUBTITLE DRAGGABLE */}
              <div 
                className="absolute cursor-move select-none flex justify-center active:scale-105 transition-transform"
                onPointerDown={(e) => { e.preventDefault(); setIsDragging("subtitle"); }}
                style={{ left: `${subtitle.x}%`, top: `${subtitle.y}%`, transform: `translate(-50%, -50%)`, width: 'max-content', maxWidth: '85%' }}
              >
                 <div className="px-8 py-3 rounded-2xl text-center shadow-2xl font-black italic uppercase tracking-tighter"
                   style={{ color: subtitle.color, fontSize: `${subtitle.size}px`, textShadow: '4px 4px 0px rgba(0,0,0,0.5)', background: 'rgba(0,0,0,0.1)', backdropFilter: 'blur(4px)' }}
                 >
                   {subtitle.text}
                 </div>
              </div>

              {/* GRID GUIDE */}
              {videoConfig.showGrid && (
                <div className="absolute inset-0 pointer-events-none border-2 border-blue-500/20 mix-blend-overlay">
                   <div className="absolute left-1/2 top-0 bottom-0 w-px bg-blue-500/30"></div>
                   <div className="absolute top-1/2 left-0 right-0 h-px bg-blue-500/30"></div>
                </div>
              )}
           </div>

           <div className="bg-white dark:bg-gray-900 p-8 rounded-4xl border border-gray-100 dark:border-gray-800 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Storyline Viewer</h3>
                 <span className="text-[10px] font-bold text-blue-500 uppercase">{clips.length} Clips Ativos</span>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-800">
                 {clips.map((clip, idx) => (
                    <div 
                       key={idx}
                       onClick={() => setActiveClipIndex(idx)}
                       className={`relative flex-shrink-0 w-44 aspect-video rounded-2xl overflow-hidden border-4 transition-all hover:scale-105 cursor-pointer ${activeClipIndex === idx ? 'border-blue-500 shadow-2xl' : 'border-transparent opacity-40 hover:opacity-100'}`}
                    >
                       <img src={clip.thumbnail} className="w-full h-full object-cover" />
                    </div>
                 ))}
              </div>
           </div>
        </div>

        {/* SIDEBAR CONTROLS */}
        <div className="xl:col-span-4 space-y-6">
           <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[3rem] shadow-2xl p-8 space-y-10 min-h-[700px]">
              
              <div className="flex gap-1 bg-gray-50/50 dark:bg-black/50 p-2 rounded-[1.5rem] border border-gray-100 dark:border-gray-800">
                 {(["video", "subtitle", "audio", "watermark", "platform"] as const).map(sec => (
                   <button 
                    key={sec}
                    onClick={() => setActiveSection(sec)}
                    className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSection === sec ? 'bg-white dark:bg-gray-800 text-blue-500 shadow-xl scale-105' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
                   >{sec}</button>
                 ))}
              </div>

              <div className="space-y-10 animate-in slide-in-from-right-4 duration-500">
                  {activeSection === "platform" && (
                    <div className="space-y-8">
                       <div className="space-y-4">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Viral Presets</label>
                          <div className="grid grid-cols-1 gap-3">
                             <Button onClick={() => applyPlatformPreset("social")} className="h-16 bg-linear-to-r from-blue-600 to-indigo-600 rounded-2xl font-black italic">OTIMIZAÇÃO TIKTOK/REELS 📱</Button>
                             <Button onClick={() => applyPlatformPreset("classic")} variant="outline" className="h-16 border-gray-100 dark:border-gray-800 rounded-2xl font-black italic">FORMATO YOUTUBE 📺</Button>
                          </div>
                       </div>
                       <div className="p-6 bg-blue-50/50 dark:bg-blue-500/5 rounded-[2rem] border border-blue-500/10 space-y-4">
                          <div className="flex justify-between items-center">
                             <span className="text-[10px] font-black uppercase tracking-widest">Safe Zone Preview</span>
                             <button 
                              onClick={() => setShowSocialOverlay(!showSocialOverlay)}
                              className={`w-12 h-6 rounded-full p-1 transition-colors ${showSocialOverlay ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-800'}`}
                             >
                                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${showSocialOverlay ? 'translate-x-6' : 'translate-x-0'}`}></div>
                             </button>
                          </div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase leading-relaxed">Mostra as áreas invisíveis do TikTok e Instagram para garantir que sua legenda seja lida.</p>
                       </div>
                    </div>
                  )}

                  {activeSection === "video" && (
                    <div className="space-y-8">
                       <div className="space-y-4">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Proporção (Aspect Ratio)</label>
                          <div className="grid grid-cols-3 gap-3">
                             {(["16:9", "9:16", "1:1"] as AspectRatio[]).map(r => (
                               <button 
                                key={r} onClick={() => setVideoConfig(v => ({...v, aspectRatio: r}))}
                                className={`py-5 rounded-2xl border-2 text-[10px] font-black transition-all ${videoConfig.aspectRatio === r ? 'border-blue-500 bg-blue-500/5 text-blue-500 shadow-inner' : 'border-gray-50 dark:border-gray-800 text-gray-400 opacity-60'}`}
                               >{r}</button>
                             ))}
                          </div>
                       </div>
                       <div className="space-y-4">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Ajustes Finos</label>
                          <Button variant="outline" className="w-full h-14 rounded-xl" onClick={() => setVideoConfig(v => ({ ...v, showGrid: !v.showGrid }))}>
                            {videoConfig.showGrid ? 'OCULTAR GRID' : 'MOSTRAR GRID'}
                          </Button>
                       </div>
                    </div>
                  )}

                  {activeSection === "subtitle" && (
                    <div className="space-y-8">
                       <div className="space-y-4">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Legenda Dinâmica</label>
                          <textarea 
                            value={subtitle.text} 
                            onChange={(e) => setSubtitle(s => ({...s, text: e.target.value.toUpperCase()}))} 
                            className="w-full h-32 bg-gray-50 dark:bg-black p-6 rounded-2xl border border-gray-100 dark:border-gray-800 focus:border-blue-500 transition-all font-black italic uppercase outline-none shadow-inner"
                          />
                       </div>
                       <div className="space-y-4">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Cor do Impacto</label>
                          <div className="flex gap-3">
                             {["#ffffff", "#fbbf24", "#3b82f6", "#ef4444"].map(c => (
                               <button 
                                key={c} onClick={() => setSubtitle(s => ({...s, color: c}))}
                                className={`w-10 h-10 rounded-full border-4 transition-all ${subtitle.color === c ? 'border-blue-500 scale-125 shadow-lg' : 'border-transparent opacity-60'}`}
                                style={{ backgroundColor: c }}
                               />
                             ))}
                          </div>
                       </div>
                    </div>
                  )}

                  {activeSection === "watermark" && (
                     <div className="space-y-6">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Identidade Visual (Alpha)</label>
                        <Input value={watermark.url} onChange={(e) => setWatermark(w => ({...w, url: e.target.value}))} placeholder="URL da Logo / Marca d'água" className="h-16 rounded-2xl shadow-inner" />
                        <p className="text-[10px] font-bold text-gray-400 uppercase italic">Arraste a marca no preview para posicionar.</p>
                     </div>
                  )}

                  {activeSection === "audio" && (
                     <div className="space-y-8">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Engine de Som</label>
                            <div className="grid grid-cols-1 gap-3">
                               {(["keep", "remove", "mix"] as const).map(m => (
                                 <button 
                                  key={m} onClick={() => setAudioConfig(a => ({...a, mixMode: m}))}
                                  className={`py-5 rounded-2xl border-2 text-[10px] font-black uppercase transition-all ${audioConfig.mixMode === m ? 'border-indigo-500 bg-indigo-500/5 text-indigo-500 shadow-inner' : 'border-gray-50 dark:border-gray-800 text-gray-400 opacity-60'}`}
                                 >
                                    {m === 'keep' ? 'Áudio Original' : m === 'remove' ? 'Apenas Trilha' : 'Remix (Original + Trilha)'}
                                 </button>
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

export default function EditorPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col gap-6 h-full items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-16 h-16 border-4 border-t-transparent border-blue-500 rounded-full"></div>
        <p className="text-xs font-black text-gray-400 uppercase tracking-[0.3em]">Carregando Editor...</p>
      </div>
    }>
      <EditorContent />
    </Suspense>
  );
}
