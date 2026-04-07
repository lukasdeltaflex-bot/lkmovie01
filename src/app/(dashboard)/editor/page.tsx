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
type EditorTab = "video" | "legendas" | "audio" | "watermark" | "exportar";

// Mock para Trilha Sonora
const MOCK_TRACKS = [
  { name: "Epic Cinematic", artist: "AudioHero", style: "Epic", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", viral: true },
  { name: "Lo-Fi Beats", artist: "ChillMaster", style: "Lo-Fi", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", viral: false },
  { name: "Rock Energy", artist: "GuitarGod", style: "Rock", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3", viral: true },
  { name: "Modern Pop", artist: "VocalStar", style: "Pop", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3", viral: true },
];

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
  
  const [activeTab, setActiveTab] = useState<EditorTab>("video");
  const [projectId, setProjectId] = useState<string | null>(searchParams.get("id"));
  const [isSaving, setIsSaving] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderStatus, setRenderStatus] = useState("");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isGeneratingSubtitles, setIsGeneratingSubtitles] = useState(false);
  const [subtitleSuggestions, setSubtitleSuggestions] = useState<{ pt: string; en: string }[]>([]);
  const [selectedMusic, setSelectedMusic] = useState<{ name: string; url: string; artist?: string } | null>(null);
  const [musicSearch, setMusicSearch] = useState("");

  // Player & Timeline State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(30); 

  const [zoomLevel, setZoomLevel] = useState(10); 
  const [volume, setVolume] = useState(100);
  const [musicVolume, setMusicVolume] = useState(50);
  const [audioMode, setAudioMode] = useState<"keep" | "remove" | "mix" | "none" | "music">("keep");

  const [videoConfig, setVideoConfig] = useState({
    aspectRatio: "9:16" as AspectRatio,
    zoom: 100,
    showGrid: false,
    safeZones: true,
  });

  const [globalSubtitle, setGlobalSubtitle] = useState({
    text: "DIGITE SUA LEGENDA",
    textEn: "TYPE YOUR SUBTITLE",
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

  // Carregar Projeto se houver ID
  useEffect(() => {
    const load = async () => {
      if (projectId) {
        const p = await getProjectById(projectId);
        if (p) {
          setVideoConfig(v => ({...v, aspectRatio: p.aspectRatio || "9:16"}));
          setGlobalSubtitle(s => ({
            ...s, 
            text: p.subtitleText, 
            color: p.subtitleColor, 
            size: p.subtitleSize, 
            font: p.subtitleFont || "Inter",
            type: p.subtitleType,
            y: p.subtitlePosition === "bottom" ? 80 : 50
          }));
          setWatermark(w => ({...w, url: p.watermarkUrl, opacity: p.watermarkOpacity, size: p.watermarkScale * 500}));
          if (p.musicUrl) setSelectedMusic({ name: "Música Carregada", url: p.musicUrl });
          setMusicVolume(p.volumeMusic * 100);
          setVolume(p.volumeVideo * 100);
        }
      }
    };
    load();
  }, [projectId]);

  // Player Sync
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);

    video.addEventListener("timeupdate", updateTime);
    video.addEventListener("loadedmetadata", updateDuration);
    
    return () => {
      video.removeEventListener("timeupdate", updateTime);
      video.removeEventListener("loadedmetadata", updateDuration);
    };
  }, []);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (newTime: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + timelineRef.current.scrollLeft;
    const newTime = Math.max(0, x / zoomLevel);
    handleSeek(newTime);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !videoContainerRef.current) return;
    const rect = videoContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    if (isDragging === "subtitle") setGlobalSubtitle(prev => ({ ...prev, y: Math.max(5, Math.min(95, y)) }));
    if (isDragging === "watermark") setWatermark(prev => ({ ...prev, x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) }));
  };

  const handleWatermarkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setWatermark(prev => ({ ...prev, url: ev.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
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
        subtitleFont: globalSubtitle.font,
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
        audioMode: audioMode,
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
      showToast("Legendas sugeradas! ✨", "success");
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
        volumeVideo: audioMode === "none" || audioMode === "remove" ? 0 : volume / 100,
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

  const filteredTracks = useMemo(() => {
    return MOCK_TRACKS.filter(t => 
      t.name.toLowerCase().includes(musicSearch.toLowerCase()) || 
      t.artist.toLowerCase().includes(musicSearch.toLowerCase()) ||
      t.style.toLowerCase().includes(musicSearch.toLowerCase())
    );
  }, [musicSearch]);

  return (
    <div className="h-[92vh] flex flex-col bg-[#0a0a0a] text-white overflow-hidden select-none">
      {isRendering && (
         <div className="fixed inset-0 z-1000 bg-black/95 flex flex-col items-center justify-center animate-in fade-in duration-500">
            <div className="w-24 h-24 border-8 border-blue-600 border-t-transparent animate-spin rounded-full mb-10"></div>
            <h2 className="text-3xl font-black italic tracking-tighter uppercase">{renderStatus}</h2>
            <div className="w-80 h-2 bg-white/10 rounded-full mt-6 overflow-hidden">
               <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${renderProgress}%` }}></div>
            </div>
         </div>
      )}

      <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#111] z-50">
         <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-500 hover:text-white transition-colors">← Voltar</Link>
            <div className="h-4 w-px bg-white/10 mx-2"></div>
            <h1 className="text-sm font-bold uppercase tracking-widest">{clips[0]?.title || "Novo Projeto"}</h1>
            {lastSaved && <span className="text-[10px] text-gray-500">Salvo às {lastSaved.toLocaleTimeString()}</span>}
         </div>
         <div className="flex items-center gap-3">
            <Button variant="outline" className="h-9 px-4 border-white/10 text-[10px] font-bold" onClick={handleSaveProject} disabled={isSaving}>SALVAR RASCUNHO</Button>
            <Button className="h-9 px-6 bg-blue-600 text-[10px] font-black hover:bg-blue-700 shadow-lg shadow-blue-600/20" onClick={handleGenerateVideo}>EXPORTAR VÍDEO 🚀</Button>
         </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
         <div className="flex-1 flex flex-col bg-black relative overflow-hidden">
            <div 
              ref={videoContainerRef}
              className="relative mx-auto mt-10 shadow-2xl transition-all duration-500 border border-white/5 bg-[#111]"
              style={{ 
                aspectRatio: videoConfig.aspectRatio.replace(':', '/'),
                height: '60%',
                maxWidth: '90%'
              }}
              onPointerMove={handlePointerMove}
              onPointerUp={() => setIsDragging(null)}
            >
               <video 
                 ref={videoRef}
                 src={activeVideoContent} 
                 className="w-full h-full object-cover"
                 style={{ transform: `scale(${videoConfig.zoom / 100})` }}
                 muted={audioMode === "none" || audioMode === "music"}
               />

               {videoConfig.safeZones && videoConfig.aspectRatio === "9:16" && (
                 <div className="absolute inset-0 pointer-events-none border border-white/5 mix-blend-overlay">
                    <div className="absolute inset-x-0 top-[15%] bottom-[15%] border-y border-white/10"></div>
                 </div>
               )}

               {globalSubtitle.type !== "none" && (
                 <div 
                   className="absolute left-1/2 -translate-x-1/2 cursor-ns-resize select-none active:scale-105 transition-transform w-[90%] flex flex-col items-center gap-2"
                   onPointerDown={(e) => { e.preventDefault(); setIsDragging("subtitle"); }}
                   style={{ top: `${globalSubtitle.y}%` }}
                 >
                    {(globalSubtitle.type === "pt" || globalSubtitle.type === "both") && (
                      <div className="px-6 py-2 rounded-lg bg-black/40 backdrop-blur-md border border-white/10 text-center font-black italic uppercase shadow-2xl"
                           style={{ color: globalSubtitle.color, fontSize: `${globalSubtitle.size}px`, fontFamily: globalSubtitle.font }}>
                        {globalSubtitle.text}
                      </div>
                    )}
                    {(globalSubtitle.type === "en" || globalSubtitle.type === "both") && (
                      <div className="px-4 py-1.5 rounded-lg bg-yellow-500 text-black text-center font-black italic uppercase shadow-xl"
                           style={{ fontSize: `${globalSubtitle.size * 0.75}px`, fontFamily: globalSubtitle.font }}>
                        {globalSubtitle.textEn}
                      </div>
                    )}
                 </div>
               )}

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

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-lg flex flex-col items-center gap-4 px-10">
               <div className="flex items-center gap-8 bg-white/5 backdrop-blur-3xl px-8 py-3 rounded-full border border-white/10 shadow-2xl">
                  <button className="text-lg opacity-40 hover:opacity-100 transition-all font-bold">⏮</button>
                  <button onClick={togglePlay} className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 active:scale-90 transition-all shadow-xl">
                     {isPlaying ? '⏸' : '▶'}
                  </button>
                  <button className="text-lg opacity-40 hover:opacity-100 transition-all font-bold">⏭</button>
               </div>
               <div className="w-full space-y-2">
                  <div className="h-1.5 w-full bg-white/5 rounded-full relative cursor-pointer" onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    handleSeek((x / rect.width) * duration);
                  }}>
                     <div className="absolute top-0 left-0 h-full bg-blue-600 rounded-full" style={{ width: `${(currentTime/duration)*100}%` }}></div>
                     <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg" style={{ left: `${(currentTime/duration)*100}%` }}></div>
                  </div>
                  <div className="flex justify-between text-[9px] font-black text-gray-500 uppercase tracking-widest">
                     <span>{Math.floor(currentTime / 60)}:{(Math.floor(currentTime % 60)).toString().padStart(2, '0')}</span>
                     <span className="text-gray-300">STUDIO PREVIEW MODE</span>
                     <span>{Math.floor(duration / 60)}:{(Math.floor(duration % 60)).toString().padStart(2, '0')}s</span>
                  </div>
               </div>
            </div>
         </div>

         <div className="w-[360px] border-l border-white/10 bg-[#0d0d0d] flex flex-col shadow-2xl z-40">
            <div className="grid grid-cols-5 border-b border-white/5">
                {(["video", "legendas", "audio", "watermark", "exportar"] as EditorTab[]).map(tab => (
                  <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex flex-col items-center justify-center py-4 text-[8px] font-black uppercase tracking-tighter transition-all gap-1 ${activeTab === tab ? 'text-blue-500 bg-white/5 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-300'}`}
                  >
                    <span className="text-sm">{tab === 'video' ? '📺' : tab === 'legendas' ? '💬' : tab === 'audio' ? '🎵' : tab === 'watermark' ? '🏷️' : '🚀'}</span>
                    {tab.slice(0, 4)}
                  </button>
                ))}
            </div>

            <div className="flex-1 p-6 space-y-8 overflow-y-auto custom-scrollbar">
               {activeTab === "video" && (
                 <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic">Formato do Clip</label>
                       <div className="grid grid-cols-3 gap-3">
                          {(["16:9", "9:16", "1:1"] as AspectRatio[]).map(r => (
                             <button key={r} onClick={() => setVideoConfig(v => ({...v, aspectRatio: r}))} className={`py-5 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${videoConfig.aspectRatio === r ? 'border-blue-600 bg-blue-600/10 text-blue-500 shadow-xl' : 'border-white/5 bg-white/5 text-gray-600 hover:border-white/10'}`}>
                                <div className={`border-2 ${r === '16:9' ? 'w-6 h-3.5' : r === '9:16' ? 'w-3.5 h-6' : 'w-5 h-5'} border-current rounded-sm`}></div>
                                <span className="text-[8px] font-black">{r}</span>
                             </button>
                          ))}
                       </div>
                    </div>
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-gray-500 uppercase flex justify-between">
                          <span>Zoom Preview</span>
                          <span className="text-blue-500">{videoConfig.zoom}%</span>
                       </label>
                       <input type="range" min="100" max="250" value={videoConfig.zoom} onChange={(e) => setVideoConfig(v => ({...v, zoom: parseInt(e.target.value)}))} className="w-full bg-white/5 rounded-full accent-blue-600 h-2" />
                    </div>
                    <div className="p-4 bg-blue-600/5 rounded-2xl border border-blue-600/10 space-y-3">
                       <div className="flex items-center justify-between">
                          <label className="text-[9px] font-black uppercase text-gray-300">Grade de Segurança</label>
                          <input type="checkbox" checked={videoConfig.safeZones} onChange={e => setVideoConfig(v => ({...v, safeZones: e.target.checked}))} className="w-4 h-4 rounded border-white/10 accent-blue-600" />
                       </div>
                       <p className="text-[8px] text-gray-500 leading-relaxed font-bold">Ative para garantir que suas legendas não sejam cobertas pela interface do TikTok/Instagram.</p>
                    </div>
                 </div>
               )}

               {activeTab === "legendas" && (
                 <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                    <Button 
                      onClick={handleGenerateAISubtitles}
                      disabled={isGeneratingSubtitles}
                      className="w-full py-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-50"
                    >
                      {isGeneratingSubtitles ? "ESTUDANDO VÍDEO..." : "Sugerir Legendas com IA ✨"}
                    </Button>

                    {subtitleSuggestions.length > 0 && (
                      <div className="space-y-3">
                        {subtitleSuggestions.map((s, i) => (
                          <button key={i} onClick={() => setGlobalSubtitle(prev => ({ ...prev, text: s.pt, textEn: s.en }))} className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-left hover:bg-blue-600/10 hover:border-blue-500/30 transition-all group">
                            <div className="text-[10px] font-black group-hover:text-blue-400 leading-tight">{s.pt}</div>
                            <div className="text-[8px] text-gray-500 mt-1 uppercase italic tracking-tighter">{s.en}</div>
                          </button>
                        ))}
                      </div>
                    )}
                    
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-gray-500 uppercase">Estilo de Texto</label>
                       <div className="space-y-4 p-5 bg-white/5 rounded-2xl border border-white/5">
                          <div className="space-y-2">
                             <label className="text-[8px] text-gray-600 font-black uppercase">Fonte</label>
                             <select value={globalSubtitle.font} onChange={e => setGlobalSubtitle(s => ({...s, font: e.target.value}))} className="w-full bg-black border border-white/10 rounded-xl h-10 px-3 text-[10px] font-bold outline-none focus:border-blue-500">
                                {["Inter", "Arial", "Montserrat", "Poppins", "Bebas Neue", "Roboto"].map(f => <option key={f} value={f}>{f}</option>)}
                             </select>
                          </div>
                          <div className="space-y-3">
                             <label className="text-[8px] text-gray-600 font-black uppercase">Paleta Profissional</label>
                             <div className="flex flex-wrap gap-2">
                                {["#ffffff", "#fbbf24", "#ef4444", "#3b82f6", "#10b981", "#ec4899", "#f97316"].map(c => (
                                  <button key={c} onClick={() => setGlobalSubtitle(s => ({...s, color: c}))} className={`w-7 h-7 rounded-full border-2 transition-all ${globalSubtitle.color === c ? 'border-blue-500 scale-125' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                                ))}
                                <div className="relative w-7 h-7">
                                   <input type="color" value={globalSubtitle.color} onChange={e => setGlobalSubtitle(s => ({...s, color: e.target.value}))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                   <div className="w-7 h-7 rounded-full border border-white/20 bg-gradient-to-br from-red-500 via-green-500 to-blue-500"></div>
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-gray-500 uppercase">Exibição Dual</label>
                       <div className="grid grid-cols-2 gap-2">
                          {["pt", "en", "both", "none"].map(type => (
                            <button key={type} onClick={() => setGlobalSubtitle(s => ({...s, type: type as any}))} className={`py-4 rounded-xl border text-[9px] font-black uppercase transition-all ${globalSubtitle.type === type ? 'border-blue-500 bg-blue-500/10 text-blue-500 shadow-lg shadow-blue-500/10' : 'border-white/5 bg-white/5 text-gray-600'}`}>{type === 'both' ? 'Dual (PT+EN)' : type === 'pt' ? 'BR' : type === 'en' ? 'EN' : 'SEM'}</button>
                          ))}
                       </div>
                    </div>
                 </div>
               )}

               {activeTab === "audio" && (
                 <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-gray-500 uppercase">Mixagem de Áudio</label>
                       <div className="grid grid-cols-2 gap-2">
                          {[
                            {id: "keep", label: "Som Original", icon: "🎞️"},
                            {id: "music", label: "Trilha Somente", icon: "🎵"},
                            {id: "mix", label: "Mix Master", icon: "🎛️"},
                            {id: "none", label: "Mudo Local", icon: "🔇"}
                          ].map(mode => (
                             <button key={mode.id} onClick={() => setAudioMode(mode.id as any)} className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${audioMode === mode.id ? 'border-blue-600 bg-blue-600/10 text-blue-500' : 'border-white/5 bg-white/5 text-gray-600'}`}>
                                <span className="text-lg">{mode.icon}</span>
                                <span className="text-[8px] font-black uppercase tracking-tighter">{mode.label}</span>
                             </button>
                          ))}
                       </div>
                    </div>

                    {(audioMode === "keep" || audioMode === "mix") && (
                      <div className="space-y-3 p-5 bg-white/5 rounded-2xl border border-white/5">
                         <div className="flex justify-between items-center text-[8px] font-black text-gray-500 mb-1">
                            <span>VOLUME VÍDEO</span>
                            <span>{volume}%</span>
                         </div>
                         <input type="range" min="0" max="150" value={volume} onChange={(e) => setVolume(parseInt(e.target.value))} className="w-full bg-black/40 rounded-full accent-white h-1.5" />
                         <Button variant="ghost" className="w-full h-8 text-[8px] font-black text-red-500 uppercase" onClick={() => setVolume(0)}>Mutar Original</Button>
                      </div>
                    )}

                    <div className="space-y-4">
                       <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-500 uppercase italic">Biblioteca de Trilhas</label>
                          <input 
                            type="text" 
                            placeholder="Buscar música, artista ou estilo..." 
                            value={musicSearch}
                            onChange={e => setMusicSearch(e.target.value)}
                            className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-bold focus:border-blue-500 outline-none"
                          />
                       </div>
                       
                       <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                          {filteredTracks.map(m => (
                            <div key={m.name} onClick={() => { setSelectedMusic(m); setAudioMode("mix"); showToast(`${m.name} aplicada!`, "info"); }} className={`p-4 rounded-2xl border flex items-center justify-between hover:scale-[1.02] cursor-pointer transition-all ${selectedMusic?.url === m.url ? 'border-blue-500 bg-blue-500/10' : 'bg-white/5 border-white/10'}`}>
                               <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${m.viral ? 'bg-pink-500/20 text-pink-500' : 'bg-white/10'}`}>{m.viral ? '🔥' : '🎶'}</div>
                                  <div>
                                     <div className="text-[10px] font-black leading-none">{m.name}</div>
                                     <div className="text-[8px] text-gray-600 mt-1 uppercase font-bold">{m.artist} • {m.style}</div>
                                  </div>
                               </div>
                               {selectedMusic?.url === m.url ? <span className="text-[8px] font-black text-blue-500 uppercase">ATIVA</span> : <span className="text-[8px] font-black text-gray-700 uppercase">USAR</span>}
                            </div>
                          ))}
                       </div>
                    </div>

                    {selectedMusic && (
                      <div className="space-y-3 p-5 bg-blue-600/5 rounded-2xl border border-blue-600/20">
                         <div className="flex justify-between items-center text-[8px] font-black text-blue-300 mb-1">
                            <span>VOLUME TRILHA</span>
                            <span>{musicVolume}%</span>
                         </div>
                         <input type="range" min="0" max="100" value={musicVolume} onChange={(e) => setMusicVolume(parseInt(e.target.value))} className="w-full bg-black/40 rounded-full accent-blue-500 h-1.5" />
                         <Button variant="ghost" className="w-full h-8 text-[8px] font-black text-gray-500 uppercase" onClick={() => { setSelectedMusic(null); setAudioMode("keep"); }}>Remover Trilha</Button>
                      </div>
                    )}
                 </div>
               )}

               {activeTab === "watermark" && (
                 <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-gray-500 uppercase">Marca d'Água / Logo</label>
                       <div className="grid grid-cols-1 gap-4">
                          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/10 hover:border-blue-500/50 bg-white/5 rounded-3xl cursor-pointer transition-all group overflow-hidden">
                             {watermark.url ? (
                                <div className="relative w-full h-full p-4 flex items-center justify-center">
                                   <img src={watermark.url} className="max-w-full max-h-full object-contain drop-shadow-xl" />
                                   <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                      <span className="text-[8px] font-black uppercase">Trocar Imagem</span>
                                   </div>
                                </div>
                             ) : (
                                <>
                                   <span className="text-2xl mb-2">📁</span>
                                   <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Clique para subir Logo</span>
                                </>
                             )}
                             <input type="file" className="hidden" accept="image/*" onChange={handleWatermarkUpload} />
                          </label>
                          {watermark.url && <Button variant="ghost" className="h-8 text-[8px] font-black text-red-500 uppercase" onClick={() => setWatermark(w => ({...w, url: ""}))}>Remover Marca</Button>}
                       </div>
                    </div>

                    {watermark.url && (
                       <div className="space-y-6 p-6 bg-white/5 rounded-3xl border border-white/5">
                          <div className="space-y-4">
                             <label className="text-[9px] font-black text-gray-500 uppercase flex justify-between">Escala <span>{watermark.size}px</span></label>
                             <input type="range" min="30" max="250" value={watermark.size} onChange={e => setWatermark(w => ({...w, size: parseInt(e.target.value)}))} className="w-full bg-black/40 rounded-full accent-white h-1.5" />
                          </div>
                          <div className="space-y-4">
                             <label className="text-[9px] font-black text-gray-500 uppercase flex justify-between">Opacidade <span>{watermark.opacity}%</span></label>
                             <input type="range" min="10" max="100" value={watermark.opacity} onChange={e => setWatermark(w => ({...w, opacity: parseInt(e.target.value)}))} className="w-full bg-black/40 rounded-full accent-white h-1.5" />
                          </div>
                          <div className="pt-4 border-t border-white/5">
                             <p className="text-[8px] text-gray-500 font-bold uppercase text-center italic">Arraste a logo no preview para posicionar</p>
                          </div>
                       </div>
                    )}
                 </div>
               )}

               {activeTab === "exportar" && (
                 <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 text-center py-10">
                    <div className="w-20 h-20 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">🚀</div>
                    <div className="space-y-2">
                       <h3 className="text-xl font-black uppercase italic tracking-tighter">Pronto para o Viral?</h3>
                       <p className="text-[10px] text-gray-500 font-bold uppercase max-w-[200px] mx-auto leading-relaxed">Sua edição será processada em 4K nos nossos servidores de alta performance.</p>
                    </div>
                    <Button onClick={handleGenerateVideo} className="w-full h-16 rounded-[2rem] bg-blue-600 font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-blue-600/40 hover:scale-[1.02] transition-all">RENDERIZAR VÍDEO 🎬</Button>
                    <div className="pt-10 flex flex-col gap-3">
                       <Button variant="outline" className="w-full h-12 border-white/10 text-[10px] font-black text-gray-500 uppercase" onClick={handleSaveProject}>Apenas Salvar Rascunho</Button>
                    </div>
                 </div>
               )}
            </div>
         </div>
      </div>

      <div className="h-[200px] border-t border-white/5 bg-[#0a0a0a] flex flex-col relative">
         <div className="h-8 flex items-center border-b border-white/5 px-6 bg-[#111]">
            <div className="flex-1 flex gap-6 text-[9px] font-black text-gray-500 uppercase overflow-x-auto no-scrollbar">
               <button className="hover:text-white flex items-center gap-1 transition-colors">✂️ Cortar</button>
               <button className="hover:text-white flex items-center gap-1 transition-colors">🗑 Deletar</button>
               <button className="hover:text-white flex items-center gap-1 transition-colors">↩️ Desfazer</button>
               <button className="hover:text-white flex items-center gap-1 transition-colors">📋 Duplicar</button>
            </div>
            <div className="flex items-center gap-3">
               <span className="text-[8px] font-black text-gray-600">ZOOM</span>
               <input type="range" min="5" max="40" value={zoomLevel} onChange={(e) => setZoomLevel(parseInt(e.target.value))} className="w-24 h-1 bg-white/5 rounded-full accent-white" />
            </div>
         </div>

         <div 
           ref={timelineRef}
           className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar relative px-6 py-4"
           onMouseDown={handleTimelineClick}
         >
            <div className="h-4 flex items-end mb-4 sticky top-0 z-10">
               {Array.from({ length: Math.ceil(duration) + 1 }).map((_, i) => (
                 <div key={i} className="flex-shrink-0 flex flex-col items-center justify-end h-full" style={{ width: `${zoomLevel}px` }}>
                    {i % 5 === 0 ? <span className="text-[6px] font-bold text-gray-600 leading-none">{i}s</span> : <div className="w-[1px] h-1 bg-white/10"></div>}
                 </div>
               ))}
            </div>

            <div className="space-y-[2px] relative w-fit">
               <div className="flex items-center gap-4">
                  <div className="w-8 h-10 flex items-center justify-center text-[7px] font-black text-gray-700 bg-white/5 rounded-md">V1</div>
                  <div className="h-10 bg-blue-600/20 border border-blue-600/30 rounded-xl relative overflow-hidden flex items-center" style={{ width: `${duration * zoomLevel}px` }}>
                     {timeline.filter(e => e.type === "video").map(ev => (
                        <div key={ev.id} className="h-8 bg-blue-600 rounded-lg border border-white/20 flex items-center px-3 text-[8px] font-black shadow-lg mx-1" style={{ width: `${ev.duration * zoomLevel - 8}px` }}>
                           {ev.id.toUpperCase()}
                        </div>
                     ))}
                  </div>
               </div>

               <div className="flex items-center gap-4">
                  <div className="w-8 h-8 flex items-center justify-center text-[7px] font-black text-gray-700 bg-white/5 rounded-md">A1</div>
                  <div className="h-8 bg-indigo-600/10 border border-indigo-600/20 rounded-lg relative overflow-hidden flex items-center" style={{ width: `${duration * zoomLevel}px` }}>
                     {selectedMusic && <div className="h-6 bg-indigo-600 rounded-md border border-white/10 flex items-center px-3 text-[7px] font-bold shadow-lg" style={{ width: `${duration * zoomLevel}px` }}>{selectedMusic.name.toUpperCase()}</div>}
                  </div>
               </div>

               <div className="flex items-center gap-4">
                  <div className="w-8 h-6 flex items-center justify-center text-[7px] font-black text-gray-700 bg-white/5 rounded-md">S1</div>
                  <div className="h-6 bg-amber-600/10 border border-amber-600/20 rounded-md relative overflow-hidden flex items-center" style={{ width: `${duration * zoomLevel}px` }}>
                     {globalSubtitle.type !== "none" && <div className="h-4 bg-amber-600 rounded-sm border border-white/10 flex items-center px-2 text-[6px] font-black opacity-60" style={{ width: `${duration * zoomLevel}px` }}>{globalSubtitle.text}</div>}
                  </div>
               </div>
            </div>

            <div 
              className="absolute top-0 bottom-0 w-[2px] bg-red-600 z-[20] pointer-events-none transition-all duration-75"
              style={{ left: `${(currentTime * zoomLevel) + 24}px` }}
            >
               <div className="w-3 h-3 bg-red-600 rounded-full absolute -top-1 -left-[5.5px] shadow-lg"></div>
            </div>
         </div>
      </div>
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; height: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #222; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #333; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}

export default function EditorPage() {
  return (
    <Suspense fallback={
      <div className="h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-6">
        <div className="relative">
           <div className="w-16 h-16 border-4 border-blue-600/20 border-t-blue-600 animate-spin rounded-full"></div>
           <div className="absolute inset-0 flex items-center justify-center text-xs">🚀</div>
        </div>
        <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] animate-pulse">Iniciando Studio Pro v2...</p>
      </div>
    }>
      <EditorContent />
    </Suspense>
  );
}
