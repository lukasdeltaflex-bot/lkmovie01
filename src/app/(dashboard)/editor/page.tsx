"use client";

import React, { useState, useEffect, useRef, Suspense, useMemo } from "react";
import Link from "next/link";
import { useSelectedVideo, TimelineEvent } from "@/context/selected-video-context";
import { useAuth } from "@/context/auth-context";
import { useBranding } from "@/context/branding-context";
import { useSearchParams, useRouter } from "next/navigation";
import { createProject, updateProject, getProjectById } from "@/lib/firebase/projects";
import { createRenderJob } from "@/lib/firebase/render-jobs";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import axios from "axios";
import { SavedProject } from "@/types/project.d";

type AspectRatio = "16:9" | "9:16" | "1:1";
type EditorSection = "propriedades" | "legendas" | "audio" | "estilo" | "exportar";

function EditorContent() {
  const { 
    timeline, 
    clips, 
    activeClipIndex, 
    setActiveClipIndex, 
    addTimelineEvent, 
    removeTimelineEvent 
  } = useSelectedVideo();
  
  const { user } = useAuth();
  const { branding, showToast } = useBranding();
  const searchParams = useSearchParams();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  
  const [activeSection, setActiveSection] = useState<EditorSection>("propriedades");
  const [projectId, setProjectId] = useState<string | null>(searchParams.get("id"));
  const [isSaving, setIsSaving] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderStatus, setRenderStatus] = useState("");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isGeneratingSubtitles, setIsGeneratingSubtitles] = useState(false);
  const [subtitleSuggestions, setSubtitleSuggestions] = useState<{ pt: string; en: string }[]>([]);
  const [selectedMusic, setSelectedMusic] = useState<{ name: string; url: string } | null>(null);

  // Player & Timeline State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(30); // Default 30s timeline

  const [zoomLevel, setZoomLevel] = useState(10); // Pixels per second
  const [volume, setVolume] = useState(100);
  const [musicVolume, setMusicVolume] = useState(50);

  // Editor Config
  const [videoConfig, setVideoConfig] = useState({
    aspectRatio: "9:16" as AspectRatio,
    zoom: 100,
    showGrid: false,
    safeZones: true,
  });

  const [globalSubtitle, setGlobalSubtitle] = useState({
    text: "EXEMPLO DE LEGENDA",
    textEn: "SUBTITLE EXAMPLE",
    color: "#ffffff",
    size: 24,
    font: "Inter",
    y: 80,
    type: "pt" as "none" | "pt" | "en" | "both",
  });

  const [watermark, setWatermark] = useState({
    url: branding.defaultWatermark || "",
    opacity: 80,
    x: 90,
    y: 10,
    size: 80,
  });

  const [isDragging, setIsDragging] = useState<string | null>(null);

  // Sync Video with Playhead
  useEffect(() => {
    if (videoRef.current && Math.abs(videoRef.current.currentTime - currentTime) > 0.5) {
      videoRef.current.currentTime = currentTime;
    }
  }, [currentTime]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + timelineRef.current.scrollLeft;
    const newTime = Math.max(0, x / zoomLevel);
    setCurrentTime(newTime);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !videoContainerRef.current) return;
    const rect = videoContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    if (isDragging === "subtitle") setGlobalSubtitle(prev => ({ ...prev, y: Math.max(5, Math.min(95, y)) }));
    if (isDragging === "watermark") setWatermark(prev => ({ ...prev, x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) }));
  };

  const handleSaveProject = async () => {
    if (!user || !clips[0]) return null;
    setIsSaving(true);
    try {
      const projectData: any = {
        userId: user.uid,
        videoId: clips[0].id,
        title: clips[0].title,
        thumbnail: clips[0].thumbnail,
        timeline: timeline,
        subtitleText: globalSubtitle.text,
        subtitleTextEn: globalSubtitle.textEn,
        subtitleColor: globalSubtitle.color,
        subtitleSize: globalSubtitle.size,
        subtitlePosition: globalSubtitle.y > 60 ? "bottom" : "center",
        subtitleType: globalSubtitle.type,
        watermarkUrl: watermark.url,
        watermarkOpacity: watermark.opacity,
        watermarkPosition: watermark.x > 50 ? "right" : "left",
        watermarkScale: watermark.size / 500,
        musicUrl: selectedMusic?.url || "",
        musicVolume: musicVolume / 100,
        isAutoSubtitle: false,
        channelTitle: clips[0].channel || "SaaS Creator",
        endScreenUrl: branding.defaultEndScreen || "",
        audioMode: "mix",
        volumeVideo: volume / 100,
      };

      let currentId = projectId;
      if (currentId) await updateProject(currentId, projectData);
      else {
        currentId = await createProject(projectData);
        setProjectId(currentId);
      }
      setLastSaved(new Date());
      showToast("Projeto salvo! 💾", "success");
      return currentId;
    } catch (e) {
      showToast("Erro ao salvar.", "error");
    } finally { setIsSaving(false); }
  };

  const handleGenerateAISubtitles = async () => {
    if (!clips[0]) return;
    setIsGeneratingSubtitles(true);
    try {
      const response = await axios.post("/api/ai/suggest-subtitles", {
        videoTitle: clips[0].title,
        context: "Vídeo viral para redes sociais"
      });
      setSubtitleSuggestions(response.data.suggestions);
      showToast("Legendas geradas! ✨", "success");
    } catch (e) {
      showToast("Erro ao conectar com a IA.", "error");
    } finally {
      setIsGeneratingSubtitles(false);
    }
  };

  const handleGenerateVideo = async () => {
    const id = await handleSaveProject();
    if (!id || !user) return;
    setIsRendering(true);
    setRenderStatus("INICIANDO RENDER PROFISSIONAL...");
    setRenderProgress(10);
    try {
      const jobId = await createRenderJob(user.uid, id);
      setRenderStatus("MIXANDO CAMADAS...");
      setRenderProgress(40);
      
      await axios.post("/api/render-video", {
        renderJobId: jobId,
        userId: user.uid,
        projectId: id,
        timeline: timeline,
        aspectRatio: videoConfig.aspectRatio,
        subtitleText: globalSubtitle.type === "both" ? `${globalSubtitle.text}\n${globalSubtitle.textEn}` : (globalSubtitle.type === "en" ? globalSubtitle.textEn : globalSubtitle.text),
        subtitleType: globalSubtitle.type,
        musicUrl: selectedMusic?.url || null,
        volumeVideo: volume / 100,
        volumeMusic: musicVolume / 100,
        branding: { watermark: watermark.url, opacity: watermark.opacity }
      });
      
      setRenderProgress(100);
      showToast("Geração enviada! 🚀", "success");
      setTimeout(() => router.push("/biblioteca"), 2000);
    } catch (e) {
      showToast("Erro no servidor de render.", "error");
      setIsRendering(false);
    }
  };

  const activeVideoContent = useMemo(() => {
    const currentEvent = timeline.find(e => e.type === "video" && currentTime >= e.startTime && currentTime <= e.startTime + e.duration);
    return currentEvent?.content || (clips[activeClipIndex]?.thumbnail);
  }, [timeline, currentTime, clips, activeClipIndex]);

  return (
    <div className="h-[92vh] flex flex-col bg-[#0a0a0a] text-white overflow-hidden select-none">
      {isRendering && (
         <div className="fixed inset-0 z-[1000] bg-black/95 flex flex-col items-center justify-center animate-in fade-in duration-500">
            <div className="w-24 h-24 border-8 border-blue-600 border-t-transparent animate-spin rounded-full mb-10"></div>
            <h2 className="text-3xl font-black italic tracking-tighter uppercase">{renderStatus}</h2>
            <div className="w-80 h-2 bg-white/10 rounded-full mt-6 overflow-hidden">
               <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${renderProgress}%` }}></div>
            </div>
         </div>
      )}

      {/* TOP HEADER */}
      <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#111]">
         <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-500 hover:text-white transition-colors">← Voltar</Link>
            <div className="h-4 w-px bg-white/10 mx-2"></div>
            <h1 className="text-sm font-bold uppercase tracking-widest">{clips[0]?.title || "Novo Projeto"}</h1>
            {lastSaved && <span className="text-[10px] text-gray-500">Salvo às {lastSaved.toLocaleTimeString()}</span>}
         </div>
         <div className="flex items-center gap-3">
            <Button variant="outline" className="h-9 px-4 border-white/10 text-[10px] font-bold" onClick={handleSaveProject} disabled={isSaving}>SALVAR RASCUNHO</Button>
            <Button className="h-9 px-6 bg-blue-600 text-[10px] font-black" onClick={handleGenerateVideo}>EXPORTAR VÍDEO 🚀</Button>
         </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
         {/* VIEWPORT (CENTER) */}
         <div className="flex-1 flex flex-col bg-black relative groups overflow-hidden">
            <div 
              ref={videoContainerRef}
              className="relative mx-auto mt-10 shadow-2xl transition-all duration-500 border border-white/5 bg-[#111]"
              style={{ 
                aspectRatio: videoConfig.aspectRatio.replace(':', '/'),
                height: '55%',
                maxWidth: '90%'
              }}
              onPointerMove={handlePointerMove}
              onPointerUp={() => setIsDragging(null)}
            >
               {/* PREVIEW VIDEO */}
               <video 
                 ref={videoRef}
                 src={activeVideoContent} // Mock or real stream
                 className="w-full h-full object-cover"
                 style={{ transform: `scale(${videoConfig.zoom / 100})` }}
               />

               {/* SAFE ZONES */}
               {videoConfig.safeZones && videoConfig.aspectRatio === "9:16" && (
                 <div className="absolute inset-0 pointer-events-none border border-white/5 mix-blend-overlay">
                    <div className="absolute inset-x-0 top-1/4 bottom-1/4 border-y border-white/10"></div>
                 </div>
               )}

               {/* DYNAMIC SUBTITLE LAYER */}
               {globalSubtitle.type !== "none" && (
                 <div 
                   className="absolute left-1/2 -translate-x-1/2 cursor-ns-resize select-none active:scale-105 transition-transform w-[80%] flex flex-col items-center gap-1"
                   onPointerDown={(e) => { e.preventDefault(); setIsDragging("subtitle"); }}
                   style={{ top: `${globalSubtitle.y}%` }}
                 >
                    {(globalSubtitle.type === "pt" || globalSubtitle.type === "both") && (
                      <div className="px-6 py-2 rounded-lg bg-black/40 backdrop-blur-md border border-white/5 text-center font-black italic uppercase shadow-2xl"
                           style={{ color: globalSubtitle.color, fontSize: `${globalSubtitle.size}px` }}>
                        {globalSubtitle.text}
                      </div>
                    )}
                    {(globalSubtitle.type === "en" || globalSubtitle.type === "both") && (
                      <div className="px-4 py-1.5 rounded-lg bg-yellow-500 text-black text-center font-black italic uppercase shadow-xl"
                           style={{ fontSize: `${globalSubtitle.size * 0.7}px` }}>
                        {globalSubtitle.textEn}
                      </div>
                    )}
                 </div>
               )}

               {/* WATERMARK LAYER */}
               {watermark.url && (
                 <div 
                   className="absolute cursor-move select-none active:scale-110 transition-transform"
                   onPointerDown={(e) => { e.preventDefault(); setIsDragging("watermark"); }}
                   style={{ left: `${watermark.x}%`, top: `${watermark.y}%`, width: `${watermark.size}px`, transform: 'translate(-50%, -50%)', opacity: watermark.opacity/100 }}
                 >
                    <img src={watermark.url} className="w-full drop-shadow-2xl" />
                 </div>
               )}
            </div>

            {/* PLAYER CONTROLS */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-full max-w-md flex flex-col items-center gap-6 px-10">
               <div className="flex items-center gap-10">
                  <button className="text-xl opacity-50 hover:opacity-100 transition-opacity">⏮</button>
                  <button onClick={togglePlay} className="w-14 h-14 bg-white text-black rounded-full text-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all">
                     {isPlaying ? '⏸' : '▶'}
                  </button>
                  <button className="text-xl opacity-50 hover:opacity-100 transition-opacity">⏭</button>
               </div>
               <div className="w-full flex items-center justify-between text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  <span>{Math.floor(currentTime)}s</span>
                  <div className="h-1 flex-1 mx-6 bg-white/5 rounded-full overflow-hidden">
                     <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${(currentTime/duration)*100}%` }}></div>
                  </div>
                  <span>{Math.floor(duration)}s</span>
               </div>
            </div>
         </div>

         {/* SIDEBAR (RIGHT) */}
         <div className="w-[320px] border-l border-white/5 bg-[#111] flex flex-col">
            <div className="flex border-b border-white/5">
                {(["propriedades", "legendas", "audio", "estilo"] as EditorSection[]).map(tab => (
                  <button 
                    key={tab}
                    onClick={() => setActiveSection(tab)}
                    className={`flex-1 py-4 text-[9px] font-black uppercase tracking-tighter transition-all ${activeSection === tab ? 'text-blue-500 bg-white/5' : 'text-gray-500 hover:text-gray-300'}`}
                  >
                    {tab.slice(0, 4)}
                  </button>
                ))}
            </div>

            <div className="p-6 space-y-10 overflow-y-auto custom-scrollbar">
               {activeSection === "propriedades" && (
                 <div className="space-y-8 animate-in slide-in-from-right-2 duration-300">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-gray-500 uppercase">Proporção do Projeto</label>
                       <div className="grid grid-cols-3 gap-2">
                          {(["16:9", "9:16", "1:1"] as AspectRatio[]).map(r => (
                             <button key={r} onClick={() => setVideoConfig(v => ({...v, aspectRatio: r}))} className={`py-4 rounded-xl border text-[9px] font-black transition-all ${videoConfig.aspectRatio === r ? 'border-blue-600 bg-blue-600/10 text-blue-500' : 'border-white/5 bg-white/5 text-gray-500'}`}>{r}</button>
                          ))}
                       </div>
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-gray-500 uppercase">Zoom Preview ({videoConfig.zoom}%)</label>
                       <input type="range" min="100" max="200" value={videoConfig.zoom} onChange={(e) => setVideoConfig(v => ({...v, zoom: parseInt(e.target.value)}))} className="w-full bg-white/5 rounded-full accent-blue-600 h-1.5" />
                    </div>
                 </div>
               )}

               {activeSection === "legendas" && (
                 <div className="space-y-8 animate-in slide-in-from-right-2 duration-300">
                    <button 
                      onClick={handleGenerateAISubtitles}
                      disabled={isGeneratingSubtitles}
                      className="w-full py-4 bg-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-600/20 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {isGeneratingSubtitles ? "Gerando..." : "Gerar Legendas AI ✨"}
                    </button>

                    {subtitleSuggestions.length > 0 && (
                      <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase">Sugestões de IA</label>
                        <div className="space-y-2">
                          {subtitleSuggestions.map((s, i) => (
                            <button 
                              key={i} 
                              onClick={() => setGlobalSubtitle(prev => ({ ...prev, text: s.pt, textEn: s.en }))}
                              className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-left hover:bg-white/10 transition-all group"
                            >
                              <div className="text-[11px] font-bold group-hover:text-blue-400">{s.pt}</div>
                              <div className="text-[9px] text-gray-500 mt-1 italic">{s.en}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-gray-500 uppercase">Idioma</label>
                       <div className="grid grid-cols-2 gap-2">
                          {["pt", "en", "both", "none"].map(type => (
                            <button key={type} onClick={() => setGlobalSubtitle(s => ({...s, type: type as any}))} className={`py-3 rounded-xl border text-[9px] font-black uppercase transition-all ${globalSubtitle.type === type ? 'border-blue-500 bg-blue-500/10 text-blue-500' : 'border-white/5 bg-white/5 text-gray-500'}`}>{type === 'both' ? 'Dual' : type}</button>
                          ))}
                       </div>
                    </div>
                 </div>
               )}

               {activeSection === "audio" && (
                 <div className="space-y-8 animate-in slide-in-from-right-2 duration-300">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-gray-500 uppercase">Volume Mestre</label>
                       <Input type="number" min="0" max="100" value={volume} onChange={(e) => setVolume(parseInt(e.target.value))} className="bg-white/5 border-white/5 h-12" />
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-gray-500 uppercase">Volume da Trilha ({musicVolume}%)</label>
                       <input type="range" min="0" max="100" value={musicVolume} onChange={(e) => setMusicVolume(parseInt(e.target.value))} className="w-full bg-white/5 rounded-full accent-blue-600 h-1.5" />
                    </div>
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-gray-500 uppercase italic">Trilha Sonora Recomendada</label>
                       {[
                         { name: "Motivacional", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
                         { name: "Cinematográfico", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
                         { name: "Trending", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" }
                       ].map(m => (
                         <div 
                           key={m.name} 
                           onClick={() => {
                             setSelectedMusic(m);
                             showToast(`${m.name} selecionada! 🎵`, "success");
                           }}
                           className={`p-4 rounded-xl border flex items-center justify-between hover:bg-white/10 cursor-pointer transition-all ${selectedMusic?.name === m.name ? 'border-blue-500 bg-blue-500/10' : 'bg-white/5 border-white/5'}`}
                         >
                            <span className="text-[11px] font-bold">{m.name}</span>
                            <span className={`text-[9px] font-bold uppercase ${selectedMusic?.name === m.name ? 'text-blue-500' : 'text-gray-500'}`}>
                              {selectedMusic?.name === m.name ? 'Ativa' : 'Usar'}
                            </span>
                         </div>
                       ))}
                    </div>
                 </div>
               )}

               {activeSection === "estilo" && (
                  <div className="space-y-8 animate-in slide-in-from-right-2 duration-300">
                     <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-500 uppercase">Cor da Marca</label>
                        <div className="flex gap-2">
                           {["#ffffff", "#fbbf24", "#3b82f6", "#ef4444", "#10b981", "#7c3aed"].map(c => (
                             <button key={c} onClick={() => setGlobalSubtitle(s => ({...s, color: c}))} className={`w-8 h-8 rounded-lg border-2 transition-all ${globalSubtitle.color === c ? 'border-blue-500 scale-110 shadow-lg' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                           ))}
                        </div>
                     </div>
                     <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-500 uppercase">Identidade Visual (Logo)</label>
                        <Input value={watermark.url} onChange={(e) => setWatermark(w => ({...w, url: e.target.value}))} placeholder="Link da sua Logo" className="bg-white/5 border-white/5 h-12 text-xs" />
                     </div>
                  </div>
               )}
            </div>
         </div>
      </div>

      {/* TIMELINE (BOTTOM) */}
      <div className="h-[240px] border-t border-white/10 bg-[#111] flex flex-col relative">
         {/* TIMELINE HEADER */}
         <div className="h-10 flex items-center border-b border-white/5 px-6">
            <div className="flex items-center gap-6 text-[10px] font-bold text-gray-500">
               <button className="hover:text-white">✂️ Cortar</button>
               <button className="hover:text-white">🗑 Deletar</button>
               <button className="hover:text-white">↩️ Desfazer</button>
            </div>
            <div className="h-4 w-px bg-white/10 mx-6"></div>
            <div className="flex items-center gap-4">
               <span className="text-xs">🔍</span>
               <input type="range" min="5" max="30" value={zoomLevel} onChange={(e) => setZoomLevel(parseInt(e.target.value))} className="w-32 h-1 bg-white/5 rounded-full accent-white" />
            </div>
         </div>

         {/* TRACKS AREA */}
         <div 
           ref={timelineRef}
           className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar relative px-6"
           onMouseDown={handleTimelineClick}
         >
            {/* TIME RULER */}
            <div className="h-6 flex items-end border-b border-white/5 mb-4 sticky top-0 bg-[#111]/80 backdrop-blur-md z-10">
               {Array.from({ length: Math.ceil(duration) + 1 }).map((_, i) => (
                 <div key={i} className="flex-shrink-0 flex flex-col items-center justify-end h-full" style={{ width: `${zoomLevel}px` }}>
                    {i % 5 === 0 ? (
                      <span className="text-[7px] font-bold text-gray-600 mb-1">{i}s</span>
                    ) : (
                      <div className="w-[1px] h-1.5 bg-white/10 mb-1"></div>
                    )}
                 </div>
               ))}
            </div>

            {/* TRACKS (V1, A1, S1, O1) */}
            <div className="space-y-[4px] relative">
               {/* TRACK V1 (VIDEO) */}
               <div className="flex items-center gap-3">
                  <div className="w-10 text-[8px] font-black text-gray-600 uppercase">V1</div>
                  <div className="flex-1 h-14 bg-blue-600/10 border border-blue-600/20 rounded-lg flex items-center px-4 overflow-hidden group">
                     {timeline.filter(e => e.type === "video").map(ev => (
                        <div key={ev.id} className="h-10 bg-blue-600 rounded-md border border-white/20 flex items-center px-3 text-[9px] font-black overflow-hidden truncate shadow-xl" style={{ width: `${ev.duration * zoomLevel}px` }}>
                           {ev.id.toUpperCase()}
                        </div>
                     ))}
                  </div>
               </div>

               {/* TRACK A1 (AUDIO) */}
               <div className="flex items-center gap-3">
                  <div className="w-10 text-[8px] font-black text-gray-600 uppercase">A1</div>
                  <div className="flex-1 h-10 bg-indigo-600/10 border border-indigo-600/20 rounded-lg flex items-center px-4 overflow-hidden">
                     {timeline.filter(e => e.type === "audio").map(ev => (
                        <div key={ev.id} className="h-6 bg-indigo-600 rounded-md border border-white/20 flex items-center px-3 text-[7px] font-bold" style={{ width: `${ev.duration * zoomLevel}px` }}>
                           TRILHA_SOUND.mp3
                        </div>
                     ))}
                  </div>
               </div>

               {/* TRACK S1 (SUBTITLES) */}
               <div className="flex items-center gap-3">
                  <div className="w-10 text-[8px] font-black text-gray-600 uppercase">S1</div>
                  <div className="flex-1 h-8 bg-amber-600/10 border border-amber-600/20 rounded-lg flex items-center px-4 overflow-hidden">
                     {timeline.filter(e => e.type === "subtitle").map(ev => (
                        <div key={ev.id} className="h-4 bg-amber-600 rounded-sm border border-white/20 flex items-center px-2 text-[6px] font-black" style={{ width: `${ev.duration * zoomLevel}px` }}>
                           {ev.content.slice(0, 10)}...
                        </div>
                     ))}
                  </div>
               </div>
            </div>

            {/* PLAYHEAD */}
            <div 
              className="absolute top-0 bottom-0 w-[2px] bg-red-600 z-[20] pointer-events-none after:content-[''] after:absolute after:top-0 after:left-1/2 after:-translate-x-1/2 after:w-0 after:h-0 after:border-l-[6px] after:border-l-transparent after:border-r-[6px] after:border-r-transparent after:border-t-[8px] after:border-red-600"
              style={{ left: `${(currentTime * zoomLevel) + 24}px` }}
            ></div>
         </div>
      </div>
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #444; }
      `}</style>
    </div>
  );
}

export default function EditorPage() {
  return (
    <Suspense fallback={
      <div className="h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-6">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent animate-spin rounded-full"></div>
        <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] animate-pulse">Iniciando Studio Engine...</p>
      </div>
    }>
      <EditorContent />
    </Suspense>
  );
}
