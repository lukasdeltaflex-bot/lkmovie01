"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useSelectedVideo } from "@/context/selected-video-context";
import { useAuth } from "@/context/auth-context";
import { useBranding } from "@/context/branding-context";
import { useSearchParams } from "next/navigation";
import { createProject, updateProject, SavedProject } from "@/lib/firebase/projects";
import { saveEditorPreset, getUserPresets, EditorPreset } from "@/lib/firebase/presets";
import { createNotification } from "@/lib/firebase/notifications";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type AspectRatio = "16:9" | "9:16" | "1:1";
type EditorSection = "video" | "subtitle" | "watermark" | "final";

export default function EditorPage() {
  const { selectedVideo, clips, activeClipIndex, setActiveClipIndex, setClips } = useSelectedVideo();
  const { user } = useAuth();
  const { branding, showToast } = useBranding();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");

  const [activeSection, setActiveSection] = useState<EditorSection>("video");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderStatus, setRenderStatus] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [activeStyle, setActiveStyle] = useState<"none" | "motivational" | "cinema" | "viral">("none");

  // VIDEO STATE (Local and synced with current clip)
  const [videoConfig, setVideoConfig] = useState({
    aspectRatio: "16:9" as AspectRatio,
    startTime: 0,
    endTime: 15,
    volume: 100,
    playbackRate: 1.0,
    zoom: 100,
    isMuted: false,
    showGrid: false,
    showSafeArea: true,
  });

  // SUBTITLE STATE
  const [subtitle, setSubtitle] = useState({
    text: "DIGITE SUA LEGENDA AQUI",
    language: "pt-BR",
    size: 28,
    color: "#ffffff",
    backgroundColor: "transparent",
    outlineColor: "#000000",
    outlineWidth: 2,
    shadowAlpha: 0.5,
    x: 50,
    y: 80,
    fontWeight: "900",
    fontFamily: "Inter, sans-serif",
    preset: "default",
  });

  // Sincronizar estado local com o clipe ativo ao trocar de clipe
  useEffect(() => {
    const currentClip = clips[activeClipIndex];
    if (currentClip) {
      setVideoConfig(prev => ({
        ...prev,
        zoom: (currentClip as any).zoom || 100,
        playbackRate: (currentClip as any).playbackRate || 1.0,
      }));
      // Se o clipe tiver filtros próprios salvos, aplicar aqui
      if ((currentClip as any).filters) setFilters((currentClip as any).filters);
    }
  }, [activeClipIndex, clips]);

  // Atualizar o array de clips no contexto quando o estado local mudar
  useEffect(() => {
    const updatedClips = [...clips];
    if (updatedClips[activeClipIndex]) {
      updatedClips[activeClipIndex] = {
        ...updatedClips[activeClipIndex],
        zoom: videoConfig.zoom,
      };
      // Usar a função setClips do contexto para manter sincronizado
      // setClips(updatedClips); // Cuidado com loop infinito se não for controlado
    }
  }, [videoConfig.zoom, activeClipIndex]);

  // WATERMARK STATE
  const [watermark, setWatermark] = useState({
    url: "",
    opacity: 80,
    size: 100,
    x: 90,
    y: 10,
  });

  // COLOR FILTERS
  const [filters, setFilters] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    sepia: 0,
    blur: 0,
  });

  // SUBTITLE ANIMATION
  const [subtitleAnimation, setSubtitleAnimation] = useState<"none" | "pop" | "fade" | "glow">("none");

  // FINAL SCREEN STATE
  const [finalScreen, setFinalScreen] = useState({
    url: "",
    duration: 3,
    showPreview: false,
  });

  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // UX STATE
  const [isDragging, setIsDragging] = useState<"subtitle" | "watermark" | null>(null);
  const [presets, setPresets] = useState<EditorPreset[]>([]);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (user) getUserPresets(user.uid).then(setPresets);
  }, [user]);

  useEffect(() => {
    if (branding.defaultWatermark && !watermark.url) setWatermark(prev => ({ ...prev, url: branding.defaultWatermark }));
    if (branding.defaultEndScreen && !finalScreen.url) setFinalScreen(prev => ({ ...prev, url: branding.defaultEndScreen }));
  }, [branding.defaultWatermark, branding.defaultEndScreen]);

  // DRAG AND DROP PREVIEW
  const handlePointerDown = (type: "subtitle" | "watermark") => (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(type);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !videoContainerRef.current) return;
    const rect = videoContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Bounds check
    const safeX = Math.max(5, Math.min(95, x));
    const safeY = Math.max(5, Math.min(95, y));

    if (isDragging === "subtitle") {
      setSubtitle(prev => ({ ...prev, x: safeX, y: safeY }));
    } else {
      setWatermark(prev => ({ ...prev, x: safeX, y: safeY }));
    }
  };

  const handlePointerUp = () => setIsDragging(null);

  const handleFileUpload = (type: "watermark" | "final-screen") => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (type === "watermark") setWatermark(prev => ({ ...prev, url }));
    else setFinalScreen(prev => ({ ...prev, url }));
  };

  const applyStylePreset = (style: "motivational" | "cinema" | "viral") => {
    setActiveStyle(style);
    showToast(`Estilo ${style.toUpperCase()} aplicado!`, "info");
    switch (style) {
      case "motivational":
        setSubtitle(prev => ({ ...prev, text: "Acredite no seu Potencial", size: 42, color: "#facc15", fontWeight: "900", preset: "destaque", y: 50 }));
        setSubtitleAnimation("pop");
        setFilters({ brightness: 110, contrast: 120, saturation: 90, sepia: 10, blur: 0 });
        setVideoConfig(v => ({ ...v, zoom: 110 }));
        break;
      case "cinema":
        setVideoConfig(v => ({ ...v, aspectRatio: "16:9", zoom: 100 }));
        setSubtitle(prev => ({ ...prev, text: "O GRANDE ENCONTRO", size: 22, color: "#ffffff", backgroundColor: "rgba(0,0,0,0.8)", y: 85, preset: "cinema" }));
        setFilters({ brightness: 90, contrast: 110, saturation: 60, sepia: 0, blur: 0 });
        break;
      case "viral":
        setSubtitle(prev => ({ ...prev, text: "VOCÊ NÃO VAI ACREDITAR! 👇", size: 38, color: "#000000", backgroundColor: "#ffffff", fontWeight: "900", y: 20, preset: "tiktok" }));
        setSubtitleAnimation("glow");
        setFilters({ brightness: 120, contrast: 130, saturation: 150, sepia: 0, blur: 0 });
        setVideoConfig(v => ({ ...v, zoom: 130 }));
        break;
    }
  };

  useEffect(() => {
    if (mode === "auto") {
      setTimeout(() => {
        applyStylePreset("motivational");
        showToast("Inteligência Artificial: Modo Automático Ativado 🤖", "success");
      }, 500);
    }
  }, [mode]);

  const applySubtitlePreset = (preset: string) => {
    switch (preset) {
      case "cinema":
        setSubtitle(prev => ({ ...prev, color: "#ffffff", backgroundColor: "rgba(0,0,0,0.6)", size: 24, outlineWidth: 0, preset: "cinema" }));
        break;
      case "tiktok":
        setSubtitle(prev => ({ ...prev, color: "#000000", backgroundColor: "#ffffff", size: 32, outlineWidth: 0, preset: "tiktok" }));
        break;
      case "minimalista":
        setSubtitle(prev => ({ ...prev, color: "#ffffff", backgroundColor: "transparent", shadowAlpha: 0, outlineWidth: 1, size: 20, preset: "minimalista" }));
        break;
      case "destaque":
        setSubtitle(prev => ({ ...prev, color: "#facc15", backgroundColor: "#000000", outlineWidth: 0, size: 36, preset: "destaque" }));
        break;
    }
  };

  const currentProjectData = useCallback((status: "Draft" | "Rendering" | "Ready" = "Draft"): Omit<SavedProject, "createdAt" | "updatedAt"> | null => {
    if (!user || !selectedVideo) return null;
    return {
      userId: user.uid,
      videoId: selectedVideo.id,
      title: selectedVideo.title,
      thumbnail: selectedVideo.thumbnail,
      channel: selectedVideo.channel,
      subtitleText: subtitle.text,
      subtitleLanguage: subtitle.language,
      subtitleColor: subtitle.color,
      subtitleSize: subtitle.size.toString(),
      subtitlePosition: "custom",
      watermarkUrl: watermark.url,
      watermarkOpacity: watermark.opacity,
      watermarkSize: watermark.size,
      watermarkPosition: "custom",
      watermarkX: watermark.x,
      watermarkY: watermark.y,
      aspectRatio: videoConfig.aspectRatio,
      endScreenUrl: finalScreen.url,
      status
    };
  }, [user, selectedVideo, subtitle, watermark, finalScreen.url, videoConfig.aspectRatio]);

  const handleSaveProject = async (isAutoSave = false) => {
    const data = currentProjectData();
    if (!data || !user) return;
    if (!isAutoSave) setIsSaving(true);
    setSaveStatus("saving");
    try {
      if (projectId) await updateProject(projectId, data);
      else {
        const newId = await createProject(data);
        setProjectId(newId);
      }
      setSaveStatus("success");
      setLastSaved(new Date());
      if (!isAutoSave) setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (error) {
       console.error(error);
       setSaveStatus("error");
    } finally {
       if (!isAutoSave) setIsSaving(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!user || !selectedVideo) return;
    setIsRendering(true);
    setRenderProgress(0);
    const statuses = [
      "Analisando Roteiro...", 
      `Processando ${clips.length} Cenas...`, 
      "Sincronizando Legendas Inteligentes...", 
      "Aplicando Estética Premium...",
      "Finalizando Exportação 4K..."
    ];
    let step = 0;
    const interval = setInterval(() => {
      setRenderProgress(p => {
        if (p >= 100) { clearInterval(interval); finishRender(); return 100; }
        if (p % 20 === 0) { setRenderStatus(statuses[step] || "Finalizando..."); step++; }
        return p + 1;
      });
    }, 100);
  };

  const finishRender = async () => {
    if (!user || !selectedVideo) return;
    const data = currentProjectData("Ready");
    if (data && projectId) await updateProject(projectId, data);
    createNotification(user.uid, { title: "Vídeo Gerado! 🚀", message: `Sua produção "${selectedVideo.title}" está pronta.`, type: "success" });
    setIsRendering(false);
    setRenderProgress(0);
    setShowSuccessModal(true);
  };

  useEffect(() => {
    if (!user || !selectedVideo) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => handleSaveProject(true), 5000);
    return () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current); };
  }, [subtitle, watermark, finalScreen, videoConfig]);

  if (!selectedVideo) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center space-y-8 min-h-[70vh] animate-in fade-in duration-1000">
        <div className="w-32 h-32 rounded-[2.5rem] bg-gray-900 border border-gray-800 flex items-center justify-center text-6xl shadow-2xl animate-bounce">🎬</div>
        <div className="space-y-4 max-w-sm">
          <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">Ready to Edit?</h2>
          <p className="text-gray-500 font-bold">Nenhuma cena selecionada para o laboratório. Escolha sua matéria-prima na galeria.</p>
        </div>
        <Link href="/buscar-cenas">
          <Button className="px-14 py-8 rounded-4xl font-black text-xl shadow-2xl transform active:scale-95 transition-all text-white" style={{ backgroundColor: branding.primaryColor }}>
            ABRIR GALERIA 🔍
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000 pb-20 select-none">
      
      {/* RENDER OVERLAY */}
      {isRendering && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-8 bg-black/95 backdrop-blur-3xl animate-in zoom-in duration-500">
           <div className="w-full max-w-2xl space-y-12 text-center">
              <div className="relative w-48 h-48 mx-auto">
                 <div className="absolute inset-0 rounded-full border-8 border-white/5 animate-ping"></div>
                 <div className="absolute inset-0 rounded-full border-t-8 border-blue-500 animate-spin" style={{ borderTopColor: branding.primaryColor }}></div>
                 <div className="absolute inset-0 flex items-center justify-center text-5xl font-black text-white">{renderProgress}%</div>
              </div>
              <div className="space-y-4">
                 <h2 className="text-5xl font-black text-white tracking-tighter uppercase italic">{renderStatus}</h2>
                 <p className="text-gray-400 font-bold tracking-[0.4em] uppercase text-xs">SaaS Professional Render Engine</p>
              </div>
           </div>
        </div>
      )}

      {/* HEADER Barra Superior */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white dark:bg-gray-900/50 p-6 rounded-4xl border border-gray-100 dark:border-gray-800 shadow-2xl backdrop-blur-2xl">
        <div className="flex items-center gap-6">
          <div 
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-xl animate-pulse"
            style={{ backgroundColor: `${branding.primaryColor}1a`, color: branding.primaryColor }}
          >🕹️</div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic truncate max-w-[300px]">
               {clips.length > 1 ? `PROJETO: ${clips.length} CENAS` : selectedVideo.title}
            </h1>
            <div className="flex items-center gap-3 mt-1">
               <span className={`w-2 h-2 rounded-full animate-pulse ${saveStatus === 'success' ? 'bg-green-500' : 'bg-blue-500'}`}></span>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-loose">
                  {saveStatus === "saving" ? "🌩️ Sincronizando..." : `ID: ${selectedVideo.id.substring(0, 8)} | SALVO ÀS ${lastSaved?.toLocaleTimeString() || '--:--'}`}
               </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => handleSaveProject()}
            disabled={isSaving}
            className="px-8 h-16 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:bg-gray-50 active:scale-95 border-2 border-gray-100"
          >
             {isSaving ? "⏳" : "SALVAR RASCUNHO"}
          </Button>
          <Button 
            onClick={handleGenerateVideo}
            className="px-10 h-16 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-blue-500/20 text-white active:scale-95 transition-all"
            style={{ backgroundColor: branding.primaryColor }}
          >
             FINALIZAR & EXPORTAR 💎
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        
        {/* PREVIEW AREA (Left) */}
        <div className="xl:col-span-8 space-y-6">
           <div 
              ref={videoContainerRef}
              className={`relative bg-[#050505] rounded-[3rem] shadow-[0_60px_120px_-30px_rgba(0,0,0,0.6)] border-[10px] border-white dark:border-gray-900 overflow-hidden transition-all duration-700 select-none touch-none w-full group`}
              style={{ aspectRatio: videoConfig.aspectRatio.replace(':', '/'), maxWidth: videoConfig.aspectRatio === '9:16' ? '450px' : '100%', margin: videoConfig.aspectRatio === '9:16' ? '0 auto' : '0' }}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
           >
              {/* VIDEO BG */}
              <img 
                src={selectedVideo.thumbnail} 
                className={`w-full h-full object-cover select-none pointer-events-none transition-all duration-1000 ${finalScreen.showPreview ? "blur-2xl scale-125 opacity-30" : "opacity-80"}`} 
                style={{
                  filter: `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%) sepia(${filters.sepia}%) blur(${filters.blur}px)`,
                  transform: `scale(${videoConfig.zoom / 100})`
                }}
              />

              {/* OVERLAYS: GRID & SAFE AREA */}
              {!finalScreen.showPreview && videoConfig.showGrid && (
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none animate-in fade-in duration-500">
                   {[...Array(8)].map((_, i) => ( <div key={i} className="border-[0.5px] border-white/10"></div> ))}
                </div>
              )}
              {!finalScreen.showPreview && videoConfig.showSafeArea && (
                <div className="absolute inset-[10%] border-2 border-dashed border-white/5 rounded-3xl pointer-events-none">
                   <span className="absolute top-4 left-4 text-[8px] font-black text-white/20 uppercase tracking-[0.4em]">Safe Area 10%</span>
                </div>
              )}

              {/* CONTENT OVERLAYS */}
              {!finalScreen.showPreview && (
                 <>
                    {/* Watermark */}
                    {watermark.url && (
                      <div 
                        onPointerDown={handlePointerDown("watermark")}
                        className={`absolute cursor-move active:scale-110 transition-all ${isDragging === 'watermark' ? 'ring-4 ring-blue-500/50 ring-offset-8 ring-offset-black rounded-lg scale-110 z-50' : 'z-20'}`}
                        style={{ left: `${watermark.x}%`, top: `${watermark.y}%`, transform: `translate(-50%, -50%)`, opacity: watermark.opacity / 100, width: `${watermark.size}px` }}
                      >
                         <img src={watermark.url} className="w-full h-auto drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] pointer-events-none" />
                      </div>
                    )}
                    {/* Subtitle */}
                    <div 
                      onPointerDown={handlePointerDown("subtitle")}
                      className={`absolute cursor-move flex justify-center transition-all ${isDragging === 'subtitle' ? 'z-50 scale-105' : 'z-30'}`}
                      style={{ left: `${subtitle.x}%`, top: `${subtitle.y}%`, transform: `translate(-50%, -50%)`, width: 'max-content', maxWidth: '85%' }}
                    >
                       <div 
                        className={`px-8 py-3 rounded-2xl shadow-2xl select-none  ${
                          subtitleAnimation === 'pop' ? 'animate-bounce' : 
                          subtitleAnimation === 'fade' ? 'animate-pulse' : 
                          subtitleAnimation === 'glow' ? 'shadow-[0_0_30px_white]' : ''
                        }`}
                        style={{ 
                          color: subtitle.color, 
                          fontSize: `${subtitle.size}px`, 
                          backgroundColor: subtitle.backgroundColor,
                          WebkitTextStroke: `${subtitle.outlineWidth}px ${subtitle.outlineColor}`,
                          fontWeight: subtitle.fontWeight,
                          fontFamily: subtitle.fontFamily,
                          textShadow: `0 8px 16px rgba(0,0,0,${subtitle.shadowAlpha})`,
                          border: subtitle.backgroundColor !== 'transparent' ? '1px solid rgba(255,255,255,0.1)' : 'none'
                        }}
                       >
                         {subtitle.text || "DIGITE ALGO"}
                       </div>
                    </div>
                 </>
              )}

              {/* FINAL SCREEN PREVIEW */}
              {finalScreen.showPreview && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 backdrop-blur-3xl animate-in zoom-in duration-700">
                   <div className="relative group">
                      <div className="absolute -inset-10 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
                      <img src={finalScreen.url || branding.logo} className="relative w-48 h-48 object-contain drop-shadow-[0_0_80px_rgba(255,255,255,0.1)]" />
                   </div>
                   <p className="mt-12 text-white font-black text-xs uppercase tracking-[1em] animate-pulse">Final Screen Preview</p>
                </div>
              )}

              {/* VIDEO CONTROLS OVERLAY */}
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-3xl border border-white/10 px-8 py-4 rounded-full flex items-center gap-6 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                  <button className="text-white text-xl hover:scale-125 transition-transform">⏪</button>
                  <button className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-black text-xl pl-1 shadow-2xl hover:scale-110 active:scale-95 transition-all">▶</button>
                  <button className="text-white text-xl hover:scale-125 transition-transform">⏩</button>
                  <div className="w-[0.5px] h-6 bg-white/20 mx-2"></div>
                  <span className="text-[10px] font-black text-white/50 tracking-widest uppercase">00:0{videoConfig.startTime} / 00:{videoConfig.endTime}</span>
                  <button className="text-white text-xl hover:scale-110" onClick={() => setVideoConfig(v => ({...v, isMuted: !v.isMuted}))}>{videoConfig.isMuted ? '🔇' : '🔊'}</button>
              </div>
           </div>

           {/* Video Timeline Professional */}
           <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 rounded-[2rem] shadow-xl space-y-6">
              <div className="flex items-center justify-between px-2">
                 <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span> 
                    Multi-Scene Timeline
                 </h4>
                 <div className="flex gap-4">
                    <span className="text-[10px] font-black text-gray-400 uppercase">{clips.length} Cenas Total</span>
                 </div>
              </div>
              
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                 {clips.map((clip, idx) => (
                    <div 
                      key={`${clip.id}-${idx}`}
                      onClick={() => setActiveClipIndex(idx)}
                      className={`relative flex-shrink-0 w-40 aspect-video rounded-2xl overflow-hidden border-4 cursor-pointer transition-all ${activeClipIndex === idx ? 'border-blue-500 scale-105 shadow-2xl' : 'border-transparent opacity-60 hover:opacity-100'}`}
                      style={activeClipIndex === idx ? { borderColor: branding.primaryColor } : {}}
                    >
                       <img src={clip.thumbnail} className="w-full h-full object-cover" />
                       <div className="absolute inset-x-0 bottom-0 bg-black/60 p-2 text-center">
                          <span className="text-[8px] font-black text-white uppercase italic">Cena {idx + 1}</span>
                       </div>
                    </div>
                 ))}
                 <Link href="/buscar-cenas" className="flex-shrink-0 w-40 aspect-video rounded-2xl bg-gray-100 dark:bg-black border-2 border-dashed border-gray-300 dark:border-gray-800 flex flex-col items-center justify-center gap-2 hover:bg-gray-200 transition-all">
                    <span className="text-2xl">➕</span>
                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Add Cena</span>
                 </Link>
              </div>

              <div className="relative h-12 bg-gray-100 dark:bg-black p-1 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 flex items-center gap-1 overflow-hidden group/timeline">
                  {[...Array(60)].map((_, i) => (
                    <div 
                      key={i} 
                      className="flex-1 bg-gray-300 dark:bg-gray-800 rounded-full transition-all duration-500 group-hover/timeline:bg-blue-500/40" 
                      style={{ 
                        height: `${Math.sin(i * 0.5) * 30 + 50}%`,
                        opacity: i % 3 === 0 ? 0.3 : 1
                      }} 
                    ></div>
                  ))}
                  <div className="absolute top-0 left-[35%] bottom-0 w-0.5 bg-red-500 shadow-[0_0_10px_red] z-10 animate-pulse">
                     <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-500 rounded-full"></div>
                  </div>
               </div>
           </div>
        </div>

        {/* CONTROLS SIDEBAR (Right) */}
        <div className="xl:col-span-4 space-y-8 h-full">
           <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[2.5rem] shadow-2xl flex flex-col h-full overflow-hidden">
              
              {/* TABS HEADER */}
              <div className="flex border-b border-gray-50 dark:border-gray-800 p-2">
                 {([
                   { id: "video", icon: "🎬", label: "Video" },
                   { id: "subtitle", icon: "💬", label: "Texto" },
                   { id: "watermark", icon: "🏷️", label: "Logo" },
                   { id: "final", icon: "✨", label: "Final" }
                 ] as const).map(tab => (
                   <button 
                    key={tab.id}
                    onClick={() => setActiveSection(tab.id as EditorSection)}
                    className={`flex-1 py-4 px-2 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all ${activeSection === tab.id ? 'bg-gray-100 dark:bg-black text-blue-500 shadow-inner' : 'text-gray-400 hover:text-gray-600'}`}
                    style={activeSection === tab.id ? { color: branding.primaryColor } : {}}
                   >
                      <span className="text-xl">{tab.icon}</span>
                      <span className="text-[8px] font-black uppercase tracking-widest">{tab.label}</span>
                   </button>
                 ))}
              </div>

              {/* TAB CONTENT SCROLLABLE AREA */}
              <div className="p-8 space-y-10 overflow-y-auto scrollbar-hide max-h-[650px] flex-1">
                 
                 {/* SECTION: VIDEO */}
                 {activeSection === "video" && (
                   <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                      <SectionTitle title="Configurações de Video" icon="⚙️" />
                      
                      <div className="space-y-4">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Estilos de Vídeo Inteligente</label>
                          <div className="grid grid-cols-3 gap-2">
                             {(["motivational", "cinema", "viral"] as const).map(s => (
                               <button 
                                 key={s}
                                 onClick={() => applyStylePreset(s)}
                                 className={`py-6 rounded-2xl text-[8px] font-black transition-all uppercase tracking-widest border-2 ${activeStyle === s ? '' : 'border-gray-100 dark:border-gray-800 text-gray-400 hover:border-gray-300'}`}
                                 onMouseEnter={(e) => {
                                   if (activeStyle !== s) e.currentTarget.style.borderColor = branding.primaryColor;
                                 }}
                                 onMouseLeave={(e) => {
                                   if (activeStyle !== s) e.currentTarget.style.borderColor = '';
                                 }}
                                 style={activeStyle === s ? { borderColor: branding.primaryColor, color: branding.primaryColor, backgroundColor: `${branding.primaryColor}1a` } : {}}
                               >
                                 {s === "motivational" ? "🚀 Motiv" : s === "cinema" ? "🎬 Cine" : "🔥 Viral"}
                               </button>
                             ))}
                          </div>
                       </div>

                       <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Formato / Aspect Ratio</label>
                          <div className="grid grid-cols-3 gap-3 p-2 bg-gray-100 dark:bg-black rounded-3xl">
                             {(["16:9", "9:16", "1:1"] as AspectRatio[]).map(r => (
                               <button 
                                 key={r}
                                 onClick={() => setVideoConfig(v => ({...v, aspectRatio: r}))}
                                 className={`py-4 rounded-2xl text-[10px] font-black transition-all ${videoConfig.aspectRatio === r ? 'bg-white dark:bg-gray-800 text-blue-500 shadow-xl' : 'text-gray-400'}`}
                                 style={videoConfig.aspectRatio === r ? { color: branding.primaryColor } : {}}
                               > {r} </button>
                             ))}
                          </div>
                       </div>

                      <div className="space-y-6 bg-gray-50 dark:bg-black/40 p-6 rounded-3xl border border-gray-100 dark:border-gray-800">
                          <div className="flex items-center justify-between">
                             <span className="text-[10px] font-black text-gray-500 uppercase">Zoom Digital (Scale)</span>
                             <span className="text-xs font-black text-blue-500">{videoConfig.zoom}%</span>
                          </div>
                          <input 
                           type="range" min="100" max="250" step="1" 
                           value={videoConfig.zoom}
                           onChange={(e) => setVideoConfig(v => ({...v, zoom: parseInt(e.target.value)}))}
                           className="w-full h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full appearance-none accent-primary"
                           style={{ accentColor: branding.primaryColor }}
                          />
                          <div className="flex items-center justify-between">
                             <span className="text-[10px] font-black text-gray-500 uppercase">Playback Speed</span>
                             <span className="text-xs font-black text-blue-500">{videoConfig.playbackRate}x</span>
                          </div>
                          <input 
                           type="range" min="0.5" max="2" step="0.1" 
                           value={videoConfig.playbackRate}
                           onChange={(e) => setVideoConfig(v => ({...v, playbackRate: parseFloat(e.target.value)}))}
                           className="w-full h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full appearance-none accent-primary"
                           style={{ accentColor: branding.primaryColor }}
                          />
                         <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-gray-500 uppercase">Volume</span>
                            <span className="text-xs font-black text-blue-500">{videoConfig.volume}%</span>
                         </div>
                         <input 
                          type="range" min="0" max="100" 
                          value={videoConfig.volume}
                          onChange={(e) => setVideoConfig(v => ({...v, volume: parseInt(e.target.value)}))}
                          className="w-full h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full appearance-none accent-primary"
                          style={{ accentColor: branding.primaryColor }}
                         />
                      </div>

                      <div className="space-y-4">
                         <ToggleItem active={videoConfig.showGrid} onClick={() => setVideoConfig(v => ({...v, showGrid: !v.showGrid}))} label="Grade de Alinhamento" />
                         <ToggleItem active={videoConfig.showSafeArea} onClick={() => setVideoConfig(v => ({...v, showSafeArea: !v.showSafeArea}))} label="Margem de Segurança" />
                      </div>

                      <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-6">
                            <SectionTitle title="Ajustes de Cor" icon="🎨" />
                            <div className="space-y-6 bg-gray-50 dark:bg-black/40 p-6 rounded-3xl">
                                {[
                                    { label: "Brightness", key: "brightness", min: 50, max: 200 },
                                    { label: "Contrast", key: "contrast", min: 50, max: 200 },
                                    { label: "Saturation", key: "saturation", min: 0, max: 200 },
                                ] .map(f => (
                                    <div key={f.key} className="space-y-3">
                                        <div className="flex justify-between items-center text-[8px] font-black uppercase text-gray-500">
                                            <span>{f.label}</span>
                                            <span style={{ color: branding.primaryColor }}>{(filters as any)[f.key]}%</span>
                                        </div>
                                        <input 
                                            type="range" min={f.min} max={f.max} 
                                            value={(filters as any)[f.key]}
                                            onChange={(e) => setFilters(prev => ({...prev, [f.key]: parseInt(e.target.value)}))}
                                            className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none accent-primary"
                                            style={{ accentColor: branding.primaryColor }}
                                        />
                                    </div>
                                ))}
                            </div>
                       </div>
                   </div>
                 )}

                 {/* SECTION: SUBTITLE */}
                 {activeSection === "subtitle" && (
                   <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                      <SectionTitle title="Legendas Avançadas" icon="📝" />
                      <div className="space-y-4">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Texto da Cena</label>
                         <Input 
                          value={subtitle.text} 
                          onChange={(e) => setSubtitle(s => ({ ...s, text: e.target.value.toUpperCase() }))} 
                          className="h-16 text-lg rounded-2xl bg-gray-50 dark:bg-black/50 border-gray-100 dark:border-gray-800 font-bold px-6"
                         />
                      </div>

                      <div className="space-y-4">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Estilos Rápidos</label>
                         <div className="grid grid-cols-2 gap-3">
                            {["cinema", "tiktok", "minimalista", "destaque"].map(p => (
                              <button 
                                key={p}
                                onClick={() => applySubtitlePreset(p)}
                                className={`py-4 rounded-2xl text-[10px] font-black border-2 transition-all uppercase tracking-widest ${subtitle.preset === p ? 'border-blue-500 bg-blue-500/10 text-blue-500' : 'border-gray-100 dark:border-gray-800 text-gray-400 hover:border-gray-300'}`}
                                style={subtitle.preset === p ? { borderColor: branding.primaryColor, color: branding.primaryColor, backgroundColor: `${branding.primaryColor}1a` } : {}}
                              > {p} </button>
                            ))}
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6 bg-gray-50 dark:bg-black/40 p-6 rounded-3xl border border-gray-100 dark:border-gray-800">
                         <div className="space-y-3">
                            <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Cor</label>
                            <input type="color" value={subtitle.color} onChange={(e) => setSubtitle(s => ({...s, color: e.target.value}))} className="w-full h-10 rounded-lg cursor-pointer bg-white dark:bg-gray-800 border-none" />
                         </div>
                         <div className="space-y-3">
                            <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Fundo</label>
                            <input type="color" value={subtitle.backgroundColor === 'transparent' ? '#000000' : subtitle.backgroundColor} onChange={(e) => setSubtitle(s => ({...s, backgroundColor: e.target.value}))} className="w-full h-10 rounded-lg cursor-pointer bg-white dark:bg-gray-800 border-none" />
                         </div>
                         <div className="col-span-2 space-y-4 pt-2">
                           <div className="flex justify-between items-center">
                              <span className="text-[10px] font-black text-gray-500 uppercase">Tamanho</span>
                              <span className="text-xs font-black text-blue-500">{subtitle.size}px</span>
                           </div>
                           <input 
                            type="range" min="12" max="100" 
                            value={subtitle.size}
                            onChange={(e) => setSubtitle(s => ({...s, size: parseInt(e.target.value)}))}
                            className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none accent-primary"
                            style={{ accentColor: branding.primaryColor }}
                           />
                         </div>
                      </div>

                      <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                          <SectionTitle title="Animação SaaS" icon="🎭" />
                          <div className="grid grid-cols-2 gap-3">
                             {(["none", "pop", "fade", "glow"] as const).map(a => (
                               <button 
                                 key={a}
                                 onClick={() => setSubtitleAnimation(a)}
                                 className={`py-4 rounded-2xl text-[10px] font-black transition-all uppercase tracking-widest border-2 ${subtitleAnimation === a ? 'border-blue-500 bg-blue-500/10 text-blue-500' : 'border-gray-100 dark:border-gray-800 text-gray-400 hover:border-gray-300'}`}
                                 style={subtitleAnimation === a ? { borderColor: branding.primaryColor, color: branding.primaryColor, backgroundColor: `${branding.primaryColor}1a` } : {}}
                               > {a} </button>
                             ))}
                          </div>
                      </div>
                   </div>
                 )}

                 {/* SECTION: WATERMARK */}
                 {activeSection === "watermark" && (
                   <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                      <SectionTitle title="Marca d'água Profissional" icon="🛡️" />
                      
                      <div className="space-y-6">
                        <label className="group relative block w-full aspect-square md:aspect-[4/3] bg-gray-100 dark:bg-black rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center p-8 text-center gap-4 cursor-pointer hover:border-blue-500/50 transition-all overflow-hidden">
                           <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload("watermark")} />
                           {watermark.url ? (
                               <img src={watermark.url} className="w-full h-full object-contain p-4 transition-transform group-hover:scale-105" />
                           ) : (
                               <>
                                   <span className="text-4xl group-hover:scale-125 transition-transform">📁</span>
                                   <div className="space-y-1">
                                      <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Upload Custom Logo</p>
                                      <p className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">PNG, SVG (Max 2MB)</p>
                                   </div>
                               </>
                           )}
                        </label>
                        
                        <div className="space-y-8 bg-gray-50 dark:bg-black/40 p-6 rounded-3xl border border-gray-100 dark:border-gray-800">
                           <div className="space-y-4">
                              <div className="flex justify-between items-center">
                                 <span className="text-[10px] font-black text-gray-500 uppercase">Opacity</span>
                                 <span className="text-xs font-black text-blue-500">{watermark.opacity}%</span>
                              </div>
                              <input 
                                type="range" min="10" max="100" 
                                value={watermark.opacity}
                                onChange={(e) => setWatermark(w => ({...w, opacity: parseInt(e.target.value)}))}
                                className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none accent-primary"
                                style={{ accentColor: branding.primaryColor }}
                              />
                           </div>
                           <div className="space-y-4">
                              <div className="flex justify-between items-center">
                                 <span className="text-[10px] font-black text-gray-500 uppercase">Logo Size</span>
                                 <span className="text-xs font-black text-blue-500">{watermark.size}px</span>
                              </div>
                              <input 
                                type="range" min="30" max="300" 
                                value={watermark.size}
                                onChange={(e) => setWatermark(w => ({...w, size: parseInt(e.target.value)}))}
                                className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none accent-primary"
                                style={{ accentColor: branding.primaryColor }}
                              />
                           </div>
                        </div>
                      </div>
                   </div>
                 )}

                 {/* SECTION: FINAL SCREEN */}
                 {activeSection === "final" && (
                   <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                      <SectionTitle title="Encerramento & Logo" icon="🏁" />
                      
                      <label className="relative group w-full h-40 bg-gray-100 dark:bg-black rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center gap-4 hover:border-blue-500/50 transition-all cursor-pointer overflow-hidden">
                         <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload("final-screen")} />
                         {finalScreen.url ? (
                            <img src={finalScreen.url} className="w-full h-full object-contain p-4 transition-transform group-hover:scale-105" />
                         ) : (
                            <>
                                <span className="text-3xl">📤</span>
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Logo Final Screen</span>
                            </>
                         )}
                       </label>

                      <div className="space-y-6 bg-gray-50 dark:bg-black/40 p-6 rounded-3xl border border-gray-100 dark:border-gray-800">
                        <div className="space-y-4">
                           <div className="flex justify-between items-center">
                              <span className="text-[10px] font-black text-gray-500 uppercase">Duração (S)</span>
                              <span className="text-xs font-black text-blue-500">{finalScreen.duration}s</span>
                           </div>
                           <input 
                            type="range" min="1" max="10" 
                            value={finalScreen.duration}
                            onChange={(e) => setFinalScreen(f => ({...f, duration: parseInt(e.target.value)}))}
                            className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none accent-primary"
                            style={{ accentColor: branding.primaryColor }}
                           />
                        </div>
                      </div>

                      <div className="pt-4">
                        <button 
                          onClick={() => setFinalScreen(f => ({...f, showPreview: !f.showPreview}))}
                          className={`w-full py-6 rounded-3xl font-black text-xs uppercase tracking-[0.2em] transition-all border-2 ${finalScreen.showPreview ? 'bg-blue-600 border-blue-600 text-white shadow-[0_20px_40px_rgba(37,99,235,0.4)]' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-400 hover:border-gray-300'}`}
                          style={finalScreen.showPreview ? { backgroundColor: branding.primaryColor, borderColor: branding.primaryColor } : {}}
                        >
                          {finalScreen.showPreview ? "FECHAR PREVIEW FINAL" : "SIMULAR TELA FINAL"}
                        </button>
                      </div>
                   </div>
                  )}
               </div>
            </div>
         </div>
      </div>

      {/* SUCCESS MODAL */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-500">
          <div className="bg-white dark:bg-gray-900 w-full max-w-xl rounded-[3rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] border border-gray-100 dark:border-gray-800 overflow-hidden animate-in zoom-in-95 duration-500">
             <div className="relative h-48 bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center overflow-hidden" style={{ backgroundImage: `linear-gradient(135deg, ${branding.primaryColor}, ${branding.secondaryColor})` }}>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                <div className="relative z-10 w-24 h-24 bg-white rounded-full flex items-center justify-center text-5xl shadow-2xl animate-bounce">🎬</div>
                <button onClick={() => setShowSuccessModal(false)} className="absolute top-6 right-6 w-10 h-10 bg-black/20 hover:bg-black/40 text-white rounded-full flex items-center justify-center transition-all">✕</button>
             </div>
             <div className="p-10 space-y-8 text-center">
                <div className="space-y-2">
                   <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic">Cena Finalizada!</h2>
                   <p className="text-gray-500 font-bold">Sua produção SaaS de alta performance está pronta para o mundo.</p>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                   {[
                      { icon: "📱", label: "TikTok" },
                      { icon: "📸", label: "Reels" },
                      { icon: "📺", label: "Shorts" }
                   ].map(soc => (
                     <div key={soc.label} className="bg-gray-50 dark:bg-black p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                        <span className="text-2xl">{soc.icon}</span>
                        <p className="text-[8px] font-black uppercase text-gray-400 mt-1">{soc.label} OK</p>
                     </div>
                   ))}
                </div>

                <div className="flex flex-col gap-3">
                   <Button className="w-full h-16 rounded-2xl font-black uppercase tracking-widest text-white shadow-xl" style={{ backgroundColor: branding.primaryColor }}>
                      DOWNLOAD DIRECT (4K) 💎
                   </Button>
                   <Link href="/biblioteca" className="w-full">
                      <Button variant="outline" className="w-full h-16 rounded-2xl font-black uppercase tracking-widest border-2 border-gray-100">
                         IR PARA MINHA GALERIA
                      </Button>
                   </Link>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}

// COMPONENTES AUXILIARES
function SectionTitle({ title, icon }: { title: string, icon: string }) {
  return (
    <div className="flex items-center gap-4 pb-2 border-b border-gray-50 dark:border-gray-800">
       <span className="text-2xl">{icon}</span>
       <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic">{title}</h2>
    </div>
  );
}

function ToggleItem({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) {
  return (
    <div 
     onClick={onClick}
     className={`p-5 rounded-3xl border-2 cursor-pointer transition-all flex items-center justify-between ${active ? 'bg-blue-500/10 border-blue-500/30' : 'bg-gray-50 dark:bg-black/40 border-transparent hover:bg-gray-100'}`}
    >
       <span className={`text-[10px] font-black uppercase tracking-tight ${active ? 'text-blue-500' : 'text-gray-500'}`}>{label}</span>
       <div className={`w-10 h-6 rounded-full relative transition-all ${active ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'}`}>
          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${active ? 'left-5' : 'left-1'}`}></div>
       </div>
    </div>
  );
}
