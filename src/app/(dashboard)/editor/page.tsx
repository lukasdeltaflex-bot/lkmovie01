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

type AspectRatio = "16:9" | "9:16" | "1:1";
type EditorTab = "video" | "legendas" | "audio" | "watermark" | "exportar";

// Legendas dinâmicas baseadas na timeline
const getActiveSubtitle = (timeline: TimelineEvent[], time: number) => {
  return timeline.find(e => e.type === "subtitle" && time >= e.startTime && time <= e.startTime + e.duration);
};

const SUBTITLE_PRESETS = {
  tiktok: {
    font: 'Bebas Neue',
    color: '#ffffff',
    highlight: '#fbbf24',
    shadow: '0 0.05em 0 #000, 0 0.1em 0.2em rgba(0,0,0,0.8)',
    stroke: '1.5px #000',
    case: 'uppercase',
    weight: '900',
    bg: 'transparent'
  },
  mrbeast: {
    font: 'Montserrat',
    color: '#ffffff',
    highlight: '#22c55e',
    shadow: '0 0.1em 0 #ef4444, 0 0.2em 0.4em rgba(0,0,0,0.5)',
    stroke: '2px #000',
    case: 'uppercase',
    weight: '900',
    bg: 'transparent'
  },
  captionBox: {
    font: 'Poppins',
    color: '#ffffff',
    highlight: '#ffffff',
    shadow: 'none',
    stroke: 'none',
    case: 'none',
    weight: '700',
    bg: 'rgba(0,0,0,0.85)'
  },
  clean: {
    font: 'Montserrat',
    color: '#ffffff',
    highlight: '#3b82f6',
    shadow: '0 2px 4px rgba(0,0,0,0.5)',
    stroke: 'none',
    case: 'none',
    weight: '700',
    bg: 'rgba(0,0,0,0.4)'
  },
  minimal: {
    font: 'Inter',
    color: '#ffffff',
    highlight: '#ffffff',
    shadow: 'none',
    stroke: 'none',
    case: 'none',
    weight: '500',
    bg: 'transparent'
  },
  highContrast: {
    font: 'Poppins',
    color: '#ffffff',
    highlight: '#fbbf24',
    shadow: 'none',
    stroke: 'none',
    case: 'uppercase',
    weight: '900',
    bg: '#000000'
  }
};

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
  const ytPlayerRef = useRef<any>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
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
    size: 42,
    font: "Bebas Neue",
    y: 75,
    type: "pt" as "none" | "pt" | "en" | "both",
    preset: "tiktok" as keyof typeof SUBTITLE_PRESETS,
    showBg: false,
    useAnimation: true,
    animationType: "pop" as "pop" | "slide" | "glitch" | "fade",
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

  // Detecção refinada da fonte do vídeo
  const activeVideoData = useMemo(() => {
    const currentEvent = timeline.find(e => e.type === "video" && currentTime >= e.startTime && currentTime <= e.startTime + e.duration);
    const clip = clips[activeClipIndex];
    const rawSource = currentEvent?.content || clip?.id || clip?.url;

    if (!rawSource) return { type: "invalid" as const };

    // Regra Anti-Thumbnail: Se for imagem do YouTube, tenta buscar o ID do clip
    if (typeof rawSource === "string" && (rawSource.includes("ytimg.com") || rawSource.includes("img.youtube.com"))) {
      if (clip?.id) return { type: "youtube" as const, id: clip.id };
      return { type: "invalid" as const };
    }

    const ytIdMatch = typeof rawSource === "string" ? rawSource.match(/^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/) : null;
    const ytIdDirect = typeof rawSource === "string" ? rawSource.match(/^[a-zA-Z0-9_-]{11}$/) : null;

    if (ytIdMatch) return { type: "youtube" as const, id: ytIdMatch[1] };
    if (ytIdDirect) return { type: "youtube" as const, id: rawSource as string };

    if (typeof rawSource === "string" && (rawSource.match(/\.(mp4|webm|ogg)$/i) || rawSource.startsWith("blob:"))) {
      return { type: "file" as const, url: rawSource };
    }

    if (clip?.id && clip.id.length === 11) return { type: "youtube" as const, id: clip.id };

    return { type: "invalid" as const };
  }, [timeline, currentTime, clips, activeClipIndex]);

  // Carregar YouTube API
  useEffect(() => {
    if (typeof window !== "undefined" && !(window as any).YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }, []);

  // Sync YouTube Player
  useEffect(() => {
    if (activeVideoData.type === "youtube" && activeVideoData.id) {
       const initYT = () => {
          if (ytPlayerRef.current) {
             if (ytPlayerRef.current.loadVideoById) {
                ytPlayerRef.current.loadVideoById(activeVideoData.id);
             }
             return;
          }
          ytPlayerRef.current = new (window as any).YT.Player("youtube-player", {
             height: "100%",
             width: "100%",
             videoId: activeVideoData.id,
             playerVars: {
                autoplay: 0,
                controls: 0,
                disablekb: 1,
                fs: 0,
                modestbranding: 1,
                rel: 0,
                showinfo: 0,
                iv_load_policy: 3,
                enablejsapi: 1
             },
             events: {
                onReady: (event: any) => {
                   event.target.seekTo(currentTime, true);
                   if (isPlaying) event.target.playVideo();
                },
                onStateChange: (event: any) => {
                   if (event.data === (window as any).YT.PlayerState.PLAYING) setIsPlaying(true);
                   else if (event.data === (window as any).YT.PlayerState.PAUSED) setIsPlaying(false);
                }
             }
          });
       };

       if (!(window as any).YT || !(window as any).YT.Player) {
          const checkYT = setInterval(() => {
             if ((window as any).YT && (window as any).YT.Player) {
                clearInterval(checkYT);
                initYT();
             }
          }, 100);
          return () => clearInterval(checkYT);
       } else {
          initYT();
       }
    } else {
       ytPlayerRef.current = null;
    }
  }, [activeVideoData.type, activeVideoData.id]);

  // Polling para sincronização de tempo do YouTube
  useEffect(() => {
    let interval: any;
    if (isPlaying && activeVideoData.type === "youtube" && ytPlayerRef.current?.getCurrentTime) {
      interval = setInterval(() => {
        const time = ytPlayerRef.current.getCurrentTime();
        setCurrentTime(time);
        if (duration < time) setDuration(ytPlayerRef.current.getDuration());
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, activeVideoData.type]);

  // Player Sync HTML5
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
  }, [activeVideoData.type]);

  const togglePlay = () => {
    if (activeVideoData.type === "youtube" && ytPlayerRef.current) {
       if (isPlaying) ytPlayerRef.current.pauseVideo();
       else ytPlayerRef.current.playVideo();
       setIsPlaying(!isPlaying);
       if (audioRef.current && (audioMode === "mix" || audioMode === "music")) {
          if (isPlaying) audioRef.current.pause();
          else audioRef.current.play();
       }
    } else if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        if (audioRef.current) audioRef.current.pause();
      }
      else {
        videoRef.current.play();
        if (audioRef.current && (audioMode === "mix" || audioMode === "music")) audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (newTime: number) => {
    if (activeVideoData.type === "youtube" && ytPlayerRef.current) {
       ytPlayerRef.current.seekTo(newTime, true);
       setCurrentTime(newTime);
    } else if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  useEffect(() => {
    if (videoRef.current) videoRef.current.volume = volume / 100;
  }, [volume]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = musicVolume / 100;
  }, [musicVolume]);

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

  const filteredTracks = useMemo(() => {
    return MOCK_TRACKS.filter(t => 
      t.name.toLowerCase().includes(musicSearch.toLowerCase()) || 
      t.artist.toLowerCase().includes(musicSearch.toLowerCase()) ||
      t.style.toLowerCase().includes(musicSearch.toLowerCase())
    );
  }, [musicSearch]);

  // Subtitle Synchronization Logic
  const currentSubtitleObj = useMemo(() => {
    return timeline.find(s => s.type === "subtitle" && currentTime >= s.startTime && currentTime <= (s.startTime + s.duration));
  }, [timeline, currentTime]);

  const activeSubtitleText = currentSubtitleObj ? (currentSubtitleObj.content) : globalSubtitle.text;
  const activeSubtitleTextEn = currentSubtitleObj ? (currentSubtitleObj.metadata?.en || "") : globalSubtitle.textEn;

  // Professional Word Highlighting Logic
  const subtitleWords = useMemo(() => {
    if (!activeSubtitleText) return [];
    const text = globalSubtitle.preset === 'tiktok' || (SUBTITLE_PRESETS[globalSubtitle.preset as keyof typeof SUBTITLE_PRESETS]?.case === 'uppercase')
      ? activeSubtitleText.toUpperCase() 
      : activeSubtitleText;
    return text.split(' ');
  }, [activeSubtitleText, globalSubtitle.preset]);

  const activeWordIndex = useMemo(() => {
    if (!currentSubtitleObj || subtitleWords.length === 0) return -1;
    const progress = (currentTime - currentSubtitleObj.startTime) / currentSubtitleObj.duration;
    return Math.floor(progress * subtitleWords.length);
  }, [currentTime, currentSubtitleObj, subtitleWords]);

  const currentPreset = SUBTITLE_PRESETS[globalSubtitle.preset as keyof typeof SUBTITLE_PRESETS] || SUBTITLE_PRESETS.tiktok;

  return (
    <div className="h-[92vh] flex flex-col bg-[#0a0a0a] text-white overflow-hidden select-none">
      
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;700;900&family=Montserrat:wght@400;700;900&family=Poppins:wght@400;700;900&family=Roboto:wght@400;700;900&display=swap" rel="stylesheet" />
      {selectedMusic && <audio ref={audioRef} src={selectedMusic.url} loop />}
      
      {isRendering && (
         <div className="fixed inset-0 z-1000 bg-black/95 flex flex-col items-center justify-center animate-in fade-in duration-500">
            <div className="w-24 h-24 border-8 border-blue-600 border-t-transparent animate-spin rounded-full mb-10"></div>
            <h2 className="text-3xl font-black italic tracking-tighter uppercase">{renderStatus}</h2>
            <div className="w-80 h-2 bg-white/10 rounded-full mt-6 overflow-hidden">
               <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${renderProgress}%` }}></div>
            </div>
         </div>
      )}

      <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#111] z-50 shadow-md">
         <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-500 hover:text-white transition-colors">← Voltar</Link>
            <div className="h-4 w-px bg-white/10 mx-2"></div>
            <h1 className="text-sm font-bold uppercase tracking-widest">{clips[0]?.title || "Novo Projeto"}</h1>
            {lastSaved && <span className="text-sm text-gray-500">Salvo às {lastSaved.toLocaleTimeString()}</span>}
         </div>
         <div className="flex items-center gap-3">
            <Button variant="outline" className="h-9 px-4 border-white/10 text-sm font-bold" onClick={handleSaveProject} disabled={isSaving}>SALVAR RASCUNHO</Button>
            <Button className="h-9 px-6 bg-blue-600 text-sm font-black hover:bg-blue-700 shadow-lg shadow-blue-600/20" onClick={handleGenerateVideo}>EXPORTAR VÍDEO 🚀</Button>
         </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
         {/* Main Preview Area */}
         <div className="flex-1 flex flex-col bg-black relative overflow-hidden">
            {/* Video Preview Container with flex-1 to push controls down */}
            <div className="flex-1 flex items-center justify-center p-8 bg-[#050505] relative overflow-hidden">
              <div 
                ref={videoContainerRef}
                className="relative shadow-2xl transition-all duration-500 border border-white/5 bg-[#111] overflow-hidden group"
                style={{ 
                  aspectRatio: videoConfig.aspectRatio.replace(':', '/'),
                  maxHeight: '90%',
                  maxWidth: '90%',
                  height: videoConfig.aspectRatio === '9:16' ? '100%' : 'auto'
                }}
                onPointerMove={handlePointerMove}
                onPointerUp={() => setIsDragging(null)}
              >
                 {activeVideoData.type === "youtube" ? (
                    <div className="w-full h-full pointer-events-none" style={{ transform: `scale(${videoConfig.zoom / 100})` }}>
                       <div id="youtube-player"></div>
                    </div>
                 ) : activeVideoData.type === "file" ? (
                    <video 
                      ref={videoRef}
                      src={activeVideoData.url} 
                      className="w-full h-full object-cover"
                      style={{ transform: `scale(${videoConfig.zoom / 100})` }}
                      muted={audioMode === "none" || audioMode === "music"}
                    />
                 ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900/50 border-2 border-dashed border-white/5 p-10 text-center">
                       <span className="text-5xl mb-6">🎬</span>
                       <span className="text-lg font-black text-white uppercase tracking-widest italic">Fonte de Vídeo Indisponível</span>
                       <p className="text-xs text-gray-500 mt-4 max-w-xs uppercase font-bold leading-relaxed">
                          Selecione uma cena real na biblioteca <br/> para iniciar sua edição cinematográfica.
                       </p>
                    </div>
                 )}

                 {videoConfig.safeZones && videoConfig.aspectRatio === "9:16" && (
                   <div className="absolute inset-x-0 inset-y-0 pointer-events-none z-40 flex flex-col justify-between">
                     <div className="h-[15%] w-full bg-red-500/10 border-b border-red-500/30 flex items-center justify-center">
                       <span className="text-red-500/50 font-black text-[8px] uppercase tracking-tighter shadow-sm shadow-black">Safe Area Top</span>
                     </div>
                     <div className="h-[25%] w-full bg-red-500/10 border-t border-red-500/30 flex items-center justify-center">
                       <span className="text-red-500/50 font-black text-[8px] uppercase tracking-tighter shadow-sm shadow-black">Safe Area Bottom</span>
                     </div>
                   </div>
                 )}

                 {/* Subtitle Rendering - Professional TikTok/CapCut Level */}
                 {globalSubtitle.type !== "none" && (
                    <div 
                      key={`${activeSubtitleText}-${globalSubtitle.animationType}`} // Key to trigger entrance animation on text change
                      className={`absolute left-1/2 -translate-x-1/2 cursor-ns-resize select-none active:scale-105 transition-all w-[95%] flex flex-col items-center z-[60] ${globalSubtitle.useAnimation ? `animate-${globalSubtitle.animationType}` : ''}`}
                      onPointerDown={(e) => { e.preventDefault(); setIsDragging("subtitle"); }}
                      style={{ top: `${globalSubtitle.y}%` }}
                    >
                      <div className="flex flex-col items-center gap-4">
                        {(globalSubtitle.type === "pt" || globalSubtitle.type === "both") && activeSubtitleText && (
                          <div 
                            className={`px-8 py-4 rounded-2xl text-center flex flex-wrap justify-center gap-[0.2em] leading-[1.1] transform perspective-1000`}
                            style={{ 
                              backgroundColor: globalSubtitle.showBg ? currentPreset.bg : 'transparent',
                              backdropFilter: globalSubtitle.showBg && currentPreset.bg !== 'transparent' ? 'blur(10px)' : 'none',
                              color: globalSubtitle.color, 
                              fontSize: `${globalSubtitle.size}px`, 
                              fontFamily: `'${currentPreset.font}', sans-serif`,
                              fontWeight: currentPreset.weight,
                              fontStyle: 'italic',
                              textShadow: currentPreset.shadow,
                              WebkitTextStroke: currentPreset.stroke,
                              letterSpacing: '-0.02em',
                            }}
                          >
                            {subtitleWords.map((word, idx) => (
                              <span 
                                key={idx} 
                                className="inline-block transition-all duration-200 relative"
                                style={{
                                  transform: idx === activeWordIndex ? 'scale(1.18) translateY(-2px) rotate(-1deg)' : 'scale(1)',
                                  filter: idx === activeWordIndex ? `drop-shadow(0 0 12px ${currentPreset.highlight})` : 'none',
                                  backgroundColor: (globalSubtitle.preset === 'captionBox' && idx === activeWordIndex) ? '#ffffff' : 'transparent',
                                  color: (globalSubtitle.preset === 'captionBox' && idx === activeWordIndex) ? '#000000' : (idx === activeWordIndex ? currentPreset.highlight : 'inherit'),
                                  padding: globalSubtitle.preset === 'captionBox' ? '0 0.2em' : '0',
                                  borderRadius: '0.2em',
                                }}
                              >
                                {word}
                              </span>
                            ))}
                          </div>
                        )}
                        {(globalSubtitle.type === "en" || globalSubtitle.type === "both") && activeSubtitleTextEn && (
                          <div 
                            className="px-6 py-2.5 rounded-xl text-center font-black italic uppercase leading-none shadow-2xl transition-all border border-white/10"
                            style={{ 
                              backgroundColor: 'rgba(0, 0, 0, 0.6)',
                              backdropFilter: 'blur(8px)',
                              color: '#fbbf24',
                              fontSize: `${globalSubtitle.size * 0.55}px`, 
                              fontFamily: `'Montserrat', sans-serif`,
                              textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                              marginTop: '-0.3em',
                              letterSpacing: '0.05em',
                              opacity: 0.9
                            }}
                          >
                            {activeSubtitleTextEn}
                          </div>
                        )}
                      </div>
                   </div>
                 )}

                 {watermark.url && (
                   <div 
                     className="absolute cursor-move select-none active:scale-110 transition-transform z-20"
                     onPointerDown={(e) => { e.preventDefault(); setIsDragging("watermark"); }}
                     style={{ left: `${watermark.x}%`, top: `${watermark.y}%`, width: `${watermark.size}px`, transform: 'translate(-50%, -50%)', opacity: watermark.opacity/100 }}
                   >
                      <img src={watermark.url} className="w-full drop-shadow-2xl" alt="watermark" />
                   </div>
                 )}
              </div>
            </div>

            {/* Player Controls Area - Fixed positioning to avoid any hover overlap */}
            <div className="h-24 shrink-0 border-t border-white/5 bg-[#0d0d0d] flex flex-col items-center justify-center gap-2 px-10 z-[70] shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
               <div className="w-full max-w-2xl space-y-1">
                  {/* Progress Bar */}
                  <div className="w-full mb-1">
                    <div className="h-1.5 w-full bg-white/10 rounded-full relative cursor-pointer group hover:h-2 transition-all" onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      handleSeek((x / rect.width) * duration);
                    }}>
                       <div className="absolute top-0 left-0 h-full bg-blue-600 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.8)]" style={{ width: `${(currentTime/duration)*100}%` }}></div>
                       <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white border-2 border-blue-600 rounded-full shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity" style={{ left: `${(currentTime/duration)*100}%`, transform: 'translate(-50%, -50%)' }}></div>
                    </div>
                  </div>

                  {/* Playback Controls & Time */}
                  <div className="flex items-center justify-between w-full h-8">
                     <div className="w-20 text-[10px] font-black text-gray-500 tabular-nums">
                        {Math.floor(currentTime / 60)}:{(Math.floor(currentTime % 60)).toString().padStart(2, '0')}
                     </div>
                     
                     <div className="flex items-center gap-6">
                        <button className="text-gray-500 hover:text-white transition-colors" title="Início">⏮</button>
                        <button onClick={togglePlay} className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl">
                           <span className="text-xl ml-0.5">{isPlaying ? '⏸' : '▶'}</span>
                        </button>
                        <button className="text-gray-500 hover:text-white transition-colors" title="Fim">⏭</button>
                     </div>

                     <div className="w-20 text-[10px] font-black text-gray-400 text-right tabular-nums">
                        {Math.floor(duration / 60)}:{(Math.floor(duration % 60)).toString().padStart(2, '0')}
                     </div>
                  </div>
               </div>
            </div>
         </div>

         {/* Sidebar Editor Panel */}
         <div className="w-[420px] border-l border-white/10 bg-[#0d0d0d] flex flex-col shadow-2xl z-40">
            <div className="grid grid-cols-5 border-b border-white/5">
                {(["video", "legendas", "audio", "watermark", "exportar"] as EditorTab[]).map(tab => (
                  <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex flex-col items-center justify-center py-4 text-[10px] font-black uppercase tracking-widest transition-all gap-1.5 ${activeTab === tab ? 'text-blue-500 bg-white/5 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-300'}`}
                  >
                    <span className="text-lg">{tab === 'video' ? '📺' : tab === 'legendas' ? '💬' : tab === 'audio' ? '🎵' : tab === 'watermark' ? '🏷️' : '🚀'}</span>
                    {tab.slice(0, 4)}
                  </button>
                ))}
            </div>

            <div className="flex-1 p-6 space-y-8 overflow-y-auto custom-scrollbar bg-[#0f0f0f]">
               {activeTab === "video" && (
                 <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="space-y-4">
                       <label className="text-xs font-black text-gray-500 uppercase tracking-widest italic">Formato da Edição</label>
                       <div className="grid grid-cols-3 gap-3">
                          {(["16:9", "9:16", "1:1"] as AspectRatio[]).map(r => (
                             <button key={r} onClick={() => setVideoConfig(v => ({...v, aspectRatio: r}))} className={`py-5 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${videoConfig.aspectRatio === r ? 'border-blue-600 bg-blue-600/10 text-blue-500 shadow-xl' : 'border-white/5 bg-white/5 text-gray-600 hover:border-white/10'}`}>
                                 <div className={`border-2 ${r === '16:9' ? 'w-6 h-3.5' : r === '9:16' ? 'w-3.5 h-6' : 'w-5 h-5'} border-current rounded-sm`}></div>
                                 <span className="text-xs font-black uppercase tracking-tighter">{r === '9:16' ? 'TikTok' : r === '1:1' ? 'Post' : 'Cinema'}</span>
                             </button>
                          ))}
                       </div>
                    </div>
                    <div className="space-y-4">
                       <label className="text-xs font-black text-gray-500 uppercase flex justify-between">
                          <span>Zoom do Clip</span>
                          <span className="text-blue-500">{videoConfig.zoom}%</span>
                       </label>
                       <input type="range" min="100" max="250" value={videoConfig.zoom} onChange={(e) => setVideoConfig(v => ({...v, zoom: parseInt(e.target.value)}))} className="w-full bg-white/5 rounded-full accent-blue-600 h-2" />
                    </div>
                    <div className="p-5 bg-blue-600/5 rounded-2xl border border-blue-600/10 space-y-3">
                       <div className="flex items-center justify-between">
                          <label className="text-xs font-black uppercase text-gray-300 tracking-wider">Safe Zones UI</label>
                          <input type="checkbox" checked={videoConfig.safeZones} onChange={e => setVideoConfig(v => ({...v, safeZones: e.target.checked}))} className="w-5 h-5 rounded border-white/10 accent-blue-600" />
                       </div>
                       <p className="text-xs text-gray-500 leading-relaxed font-bold uppercase opacity-60">Visualize as áreas de corte das interfaces sociais.</p>
                    </div>
                 </div>
               )}

               {activeTab === "legendas" && (
                 <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                    <Button 
                      onClick={handleGenerateAISubtitles}
                      disabled={isGeneratingSubtitles}
                      className="w-full py-7 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:shadow-blue-600/20 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {isGeneratingSubtitles ? "ESTUDANDO VÍDEO..." : "Sugerir Legendas com IA ✨"}
                    </Button>

                    {subtitleSuggestions.length > 0 && (
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Sugestões Geradas</label>
                        {subtitleSuggestions.map((s, i) => (
                          <button key={i} onClick={() => setGlobalSubtitle(prev => ({ ...prev, text: s.pt, textEn: s.en }))} className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-left hover:bg-blue-600/10 hover:border-blue-500/30 transition-all group">
                            <div className="text-sm font-black group-hover:text-blue-400 leading-tight">{s.pt}</div>
                            <div className="text-[10px] text-gray-500 mt-1 uppercase italic tracking-tighter">{s.en}</div>
                          </button>
                        ))}
                      </div>
                    )}
                    
                    <div className="space-y-4">
                       <label className="text-xs font-black text-gray-500 uppercase tracking-widest italic">Presets Profissionais</label>
                       <div className="grid grid-cols-2 gap-3">
                          {(Object.keys(SUBTITLE_PRESETS) as Array<keyof typeof SUBTITLE_PRESETS>).map(p => (
                            <button 
                              key={p} 
                              onClick={() => setGlobalSubtitle(s => ({ ...s, preset: p }))}
                              className={`py-3 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${globalSubtitle.preset === p ? 'border-blue-500 bg-blue-500/10 text-blue-500' : 'border-white/5 bg-white/5 text-gray-500 hover:border-white/10'}`}
                            >
                              {p === 'tiktok' ? 'Viral TikTok' : p === 'mrbeast' ? 'MrBeast Pro' : p === 'captionBox' ? 'Caption Box' : p === 'clean' ? 'YouTube Clean' : p === 'highContrast' ? 'High Contrast' : 'Minimal'}
                            </button>
                          ))}
                       </div>
                    </div>

                    <div className="space-y-4">
                       <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Estilização Manual</label>
                       <div className="space-y-5 p-6 bg-white/5 rounded-3xl border border-white/5">
                          <div className="flex items-center justify-between mb-2">
                             <label className="text-[10px] text-gray-600 font-black uppercase">Fundo & Animação</label>
                             <div className="flex gap-4">
                               <button onClick={() => setGlobalSubtitle(s => ({...s, showBg: !s.showBg}))} className={`text-[9px] font-black uppercase px-3 py-1 rounded-full border transition-all ${globalSubtitle.showBg ? 'bg-blue-600 border-blue-600 text-white' : 'border-white/10 text-gray-600'}`}>BG</button>
                               <button onClick={() => setGlobalSubtitle(s => ({...s, useAnimation: !s.useAnimation}))} className={`text-[9px] font-black uppercase px-3 py-1 rounded-full border transition-all ${globalSubtitle.useAnimation ? 'bg-blue-600 border-blue-600 text-white' : 'border-white/10 text-gray-600'}`}>ANIM</button>
                             </div>
                          </div>
                          <div className="space-y-3">
                             <label className="text-[10px] text-gray-600 font-black uppercase tracking-widest">Tipo de Entrada</label>
                             <div className="grid grid-cols-4 gap-2">
                                {(["pop", "slide", "fade", "glitch"] as const).map(a => (
                                  <button 
                                    key={a} 
                                    onClick={() => setGlobalSubtitle(s => ({...s, animationType: a}))} 
                                    className={`py-2 rounded-lg border text-[8px] font-black uppercase transition-all ${globalSubtitle.animationType === a ? 'border-blue-500 bg-blue-500/10 text-blue-500' : 'border-white/5 bg-white/5 text-gray-500'}`}
                                  >
                                    {a}
                                  </button>
                                ))}
                             </div>
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] text-gray-600 font-black uppercase tracking-widest">Família da Fonte</label>
                             <select value={globalSubtitle.font} onChange={e => setGlobalSubtitle(s => ({...s, font: e.target.value}))} className="w-full bg-black border border-white/10 rounded-xl h-12 px-4 text-sm font-bold outline-none focus:border-blue-500 cursor-pointer">
                                {["Bebas Neue", "Montserrat", "Poppins", "Inter", "Arial", "Roboto"].map(f => <option key={f} value={f}>{f}</option>)}
                             </select>
                          </div>
                          <div className="space-y-3">
                             <label className="text-[10px] text-gray-600 font-black uppercase tracking-widest">Escala e Cor</label>
                             <div className="flex items-center gap-4 mb-2">
                               <input type="range" min="16" max="64" value={globalSubtitle.size} onChange={e => setGlobalSubtitle(s => ({...s, size: parseInt(e.target.value)}))} className="flex-1 bg-black/40 rounded-full accent-blue-600 h-1.5" />
                               <span className="text-xs font-black text-blue-500">{globalSubtitle.size}px</span>
                             </div>
                             <div className="flex flex-wrap gap-2 pt-2">
                                {["#ffffff", "#fbbf24", "#ef4444", "#3b82f6", "#10b981", "#ec4899", "#f97316"].map(c => (
                                  <button key={c} onClick={() => setGlobalSubtitle(s => ({...s, color: c}))} className={`w-8 h-8 rounded-full border-2 transition-all duration-300 ${globalSubtitle.color === c ? 'border-blue-500 scale-110 shadow-lg shadow-blue-500/20' : 'border-white/10 hover:border-white/30'}`} style={{ backgroundColor: c }} />
                                ))}
                                <div className="relative w-8 h-8">
                                   <input type="color" value={globalSubtitle.color} onChange={e => setGlobalSubtitle(s => ({...s, color: e.target.value}))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                   <div className="w-8 h-8 rounded-full border border-white/20 bg-gradient-to-br from-red-500 via-green-500 to-blue-500 flex items-center justify-center text-[10px]">🎨</div>
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="space-y-3">
                       <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Modo de Exibição</label>
                       <div className="grid grid-cols-2 gap-2">
                          {[
                            {id: "pt", label: "Português"},
                            {id: "en", label: "English"},
                            {id: "both", label: "PT + EN Master"},
                            {id: "none", label: "Sem Legenda"}
                          ].map(mode => (
                             <button key={mode.id} onClick={() => setGlobalSubtitle(s => ({...s, type: mode.id as any}))} className={`py-4 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${globalSubtitle.type === mode.id ? 'border-blue-500 bg-blue-500/10 text-blue-500 shadow-lg shadow-blue-500/10' : 'border-white/5 bg-white/5 text-gray-600 hover:border-white/10'}`}>{mode.label}</button>
                          ))}
                       </div>
                    </div>
                 </div>
               )}

               {activeTab === "audio" && (
                 <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="space-y-4">
                       <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Arquitetura de Áudio</label>
                       <div className="grid grid-cols-2 gap-3">
                          {[
                            {id: "keep", label: "Original", icon: "🎞️"},
                            {id: "music", label: "Somente Trilha", icon: "🎵"},
                            {id: "mix", label: "Mix Master", icon: "🎛️"},
                            {id: "none", label: "Mudo Total", icon: "🔇"}
                          ].map(mode => (
                             <button key={mode.id} onClick={() => setAudioMode(mode.id as any)} className={`p-5 rounded-3xl border-2 flex flex-col items-center gap-3 transition-all ${audioMode === mode.id ? 'border-blue-600 bg-blue-600/10 text-blue-500' : 'border-white/5 bg-white/5 text-gray-600 hover:border-white/10'}`}>
                                <span className="text-2xl">{mode.icon}</span>
                                <span className="text-[10px] font-black uppercase tracking-widest">{mode.label}</span>
                             </button>
                          ))}
                       </div>
                    </div>

                    {(audioMode === "keep" || audioMode === "mix") && (
                      <div className="space-y-4 p-6 bg-white/5 rounded-3xl border border-white/5">
                         <div className="flex justify-between items-center text-[10px] font-black text-gray-500 tracking-widest mb-1">
                            <span>GAIN VÍDEO</span>
                            <span className="text-blue-500">{volume}%</span>
                         </div>
                         <input type="range" min="0" max="150" value={volume} onChange={(e) => setVolume(parseInt(e.target.value))} className="w-full bg-black/40 rounded-full accent-blue-600 h-1.5" />
                      </div>
                    )}

                    <div className="space-y-4">
                       <div className="space-y-2">
                          <label className="text-xs font-black text-gray-500 uppercase italic tracking-widest">Library Studio</label>
                          <input 
                            type="text" 
                            placeholder="Buscar trilha viral..." 
                            value={musicSearch}
                            onChange={e => setMusicSearch(e.target.value)}
                            className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-5 text-sm font-bold focus:border-blue-500 outline-none transition-all"
                          />
                       </div>
                       
                       <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                          {filteredTracks.map(m => (
                            <div key={m.name} onClick={() => { setSelectedMusic(m); setAudioMode("mix"); showToast(`${m.name} aplicada!`, "info"); }} className={`p-5 rounded-3xl border flex items-center justify-between hover:translate-x-1 cursor-pointer transition-all ${selectedMusic?.url === m.url ? 'border-blue-500 bg-blue-500/10' : 'bg-white/5 border-white/10 hover:border-white/30'}`}>
                               <div className="flex items-center gap-4">
                                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${m.viral ? 'bg-pink-500/20 text-pink-500' : 'bg-white/10 text-gray-400'}`}>{m.viral ? '🔥' : '🎶'}</div>
                                  <div>
                                     <div className="text-sm font-black leading-none">{m.name}</div>
                                     <div className="text-[10px] text-gray-500 mt-2 uppercase font-black tracking-widest">{m.artist} • {m.style}</div>
                                  </div>
                               </div>
                               {selectedMusic?.url === m.url && <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-lg shadow-blue-500/50"></div>}
                            </div>
                          ))}
                       </div>
                    </div>

                    {selectedMusic && (
                      <div className="space-y-4 p-6 bg-blue-600/5 rounded-3xl border border-blue-600/20 animate-in slide-in-from-bottom-2">
                         <div className="flex justify-between items-center text-[10px] font-black text-blue-400 tracking-widest mb-1">
                            <span>GAIN TRILHA</span>
                            <span>{musicVolume}%</span>
                         </div>
                         <input type="range" min="0" max="100" value={musicVolume} onChange={(e) => setMusicVolume(parseInt(e.target.value))} className="w-full bg-black/40 rounded-full accent-blue-500 h-1.5" />
                         <Button variant="ghost" className="w-full h-10 text-[10px] font-black text-red-500/70 uppercase tracking-widest hover:text-red-500 transition-colors" onClick={() => { setSelectedMusic(null); setAudioMode("keep"); }}>Remover Trilha Ativa</Button>
                      </div>
                    )}
                 </div>
               )}

               {activeTab === "watermark" && (
                 <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="space-y-4">
                       <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Branding Visual</label>
                       <div className="grid grid-cols-1 gap-4">
                          <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-white/10 hover:border-blue-500/50 bg-white/5 rounded-3xl cursor-pointer transition-all group overflow-hidden shadow-inner">
                             {watermark.url ? (
                                <div className="relative w-full h-full p-6 flex items-center justify-center">
                                   <img src={watermark.url} className="max-w-full max-h-full object-contain drop-shadow-2xl" alt="watermark preview" />
                                   <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                      <span className="text-xs font-black uppercase tracking-[0.2em] bg-white text-black px-4 py-2 rounded-full">Trocar Imagem</span>
                                   </div>
                                </div>
                             ) : (
                                <>
                                   <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:bg-blue-600/20 transition-all">📂</div>
                                   <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Upload Transparent PNG</span>
                                </>
                             )}
                             <input type="file" className="hidden" accept="image/*" onChange={handleWatermarkUpload} />
                          </label>
                          {watermark.url && <Button variant="ghost" className="h-10 text-[10px] font-black text-red-500/70 uppercase tracking-widest hover:text-red-500" onClick={() => setWatermark(w => ({...w, url: ""}))}>Remover Marca d'Água</Button>}
                       </div>
                    </div>

                    {watermark.url && (
                       <div className="space-y-6 p-7 bg-[#111] rounded-[2rem] border border-white/5 shadow-xl">
                          <div className="space-y-4">
                             <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex justify-between">Tamanho do Logo <span>{watermark.size}px</span></label>
                             <input type="range" min="30" max="250" value={watermark.size} onChange={e => setWatermark(w => ({...w, size: parseInt(e.target.value)}))} className="w-full bg-black/60 rounded-full accent-white h-1.5" />
                          </div>
                          <div className="space-y-4">
                             <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex justify-between">Transparência <span>{watermark.opacity}%</span></label>
                             <input type="range" min="10" max="100" value={watermark.opacity} onChange={e => setWatermark(w => ({...w, opacity: parseInt(e.target.value)}))} className="w-full bg-black/60 rounded-full accent-white h-1.5" />
                          </div>
                          <div className="pt-6 border-t border-white/5">
                             <p className="text-[10px] text-gray-600 font-black uppercase text-center tracking-widest leading-relaxed">Arraste no preview para ancorar</p>
                          </div>
                       </div>
                    )}
                 </div>
               )}

               {activeTab === "exportar" && (
                 <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 text-center py-12">
                    <div className="w-24 h-24 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-blue-600/10">
                       <span className="text-4xl animate-pulse">🚀</span>
                    </div>
                    <div className="space-y-3">
                       <h3 className="text-2xl font-black uppercase italic tracking-tighter">Prepare seu Viral</h3>
                       <p className="text-xs text-gray-500 font-bold uppercase max-w-[260px] mx-auto leading-relaxed tracking-widest opacity-60">Renderizando em Alta Definição <br/> nos nossos servidores Pro.</p>
                    </div>
                    <Button onClick={handleGenerateVideo} className="w-full h-20 rounded-[2.5rem] bg-blue-600 font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-blue-600/50 hover:scale-[1.02] hover:bg-blue-500 active:scale-95 transition-all">RENDERIZAR VÍDEO 🎬</Button>
                    <div className="pt-8 flex flex-col gap-4">
                       <button className="text-xs font-black text-gray-600 uppercase tracking-widest hover:text-white transition-colors" onClick={handleSaveProject}>Salvar apenas rascunho</button>
                    </div>
                 </div>
               )}
            </div>
         </div>
      </div>

      {/* Footer Timeline Area */}
      <div className="h-[210px] border-t border-white/5 bg-[#0a0a0a] flex flex-col relative z-50">
         <div className="h-10 flex items-center border-b border-white/5 px-6 bg-[#0d0d0d] shadow-inner">
            <div className="flex-1 flex gap-8 text-[10px] font-black text-gray-500 uppercase tracking-widest overflow-x-auto no-scrollbar">
               <button className="hover:text-white flex items-center gap-2 transition-colors">✂️ Cortar</button>
               <button className="hover:text-white flex items-center gap-2 transition-colors">🗑 Deletar</button>
               <button className="hover:text-white flex items-center gap-2 transition-colors">↩️ Desfazer</button>
               <button className="hover:text-white flex items-center gap-2 transition-colors">📋 Duplicar</button>
            </div>
            <div className="flex items-center gap-4">
               <span className="text-[10px] font-black text-gray-600 tracking-widest">MAGI-ZOOM</span>
               <input type="range" min="5" max="40" value={zoomLevel} onChange={(e) => setZoomLevel(parseInt(e.target.value))} className="w-28 h-1 bg-white/5 rounded-full accent-white" />
            </div>
         </div>

         <div 
           ref={timelineRef}
           className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar relative px-6 py-6 bg-[#080808]"
           onMouseDown={handleTimelineClick}
         >
            <div className="h-6 flex items-end mb-4 sticky top-0 z-10 border-b border-white/5">
                {Array.from({ length: Math.ceil(duration) + 1 }).map((_, i) => (
                  <div key={i} className="flex-shrink-0 flex flex-col items-center justify-end h-full relative" style={{ width: `${zoomLevel}px` }}>
                     {i % 5 === 0 ? <span className="text-[8px] font-black text-gray-600 leading-none absolute -top-1">{i}s</span> : <div className="w-[1px] h-1.5 bg-white/10"></div>}
                  </div>
                ))}
            </div>

            <div className="space-y-[4px] relative w-fit">
               {/* Video Track */}
               <div className="flex items-center gap-6">
                  <div className="w-10 h-12 flex items-center justify-center text-[8px] font-black text-gray-700 bg-white/5 rounded-xl border border-white/5 shadow-md">V1</div>
                  <div className="h-12 bg-blue-600/10 border border-blue-600/20 rounded-2xl relative overflow-hidden flex items-center" style={{ width: `${duration * zoomLevel}px` }}>
                     {timeline.filter(e => e.type === "video").map(ev => (
                        <div key={ev.id} className="h-10 bg-blue-600 rounded-[0.5rem] border border-white/20 flex items-center px-4 text-xs font-black shadow-lg mx-1 transition-all" style={{ width: `${ev.duration * zoomLevel - 8}px` }}>
                           {ev.id.toUpperCase()}
                        </div>
                     ))}
                  </div>
               </div>

               {/* Audio Track */}
               <div className="flex items-center gap-6">
                  <div className="w-10 h-10 flex items-center justify-center text-[8px] font-black text-gray-700 bg-white/5 rounded-xl border border-white/5 shadow-md">A1</div>
                  <div className="h-10 bg-indigo-600/10 border border-indigo-600/20 rounded-xl relative overflow-hidden flex items-center" style={{ width: `${duration * zoomLevel}px` }}>
                     {selectedMusic && <div className="h-8 bg-indigo-600 rounded-[0.5rem] border border-white/10 flex items-center px-4 text-[9px] font-black shadow-lg" style={{ width: `${duration * zoomLevel}px` }}>{selectedMusic.name.toUpperCase()}</div>}
                  </div>
               </div>

               {/* Subtitle Track */}
               <div className="flex items-center gap-6">
                  <div className="w-10 h-8 flex items-center justify-center text-[8px] font-black text-gray-700 bg-white/5 rounded-xl border border-white/5 shadow-md">S1</div>
                  <div className="h-8 bg-amber-600/10 border border-amber-600/20 rounded-xl relative overflow-hidden flex items-center" style={{ width: `${duration * zoomLevel}px` }}>
                     {globalSubtitle.type !== "none" && <div className="h-6 bg-amber-600 rounded-[0.3rem] border border-white/10 flex items-center px-3 text-[8px] font-black opacity-60 shadow-md" style={{ width: `${duration * zoomLevel}px` }}>{activeSubtitleText.slice(0, 30)}...</div>}
                  </div>
               </div>
            </div>

            {/* Playhead */}
            <div 
              className="absolute top-0 bottom-0 w-[2px] bg-red-600 z-[20] pointer-events-none transition-all duration-75 shadow-[0_0_10px_rgba(220,38,38,0.5)]"
              style={{ left: `${(currentTime * zoomLevel) + 32}px` }}
            >
               <div className="w-4 h-4 bg-red-600 rounded-full absolute -top-1.5 -left-[7px] shadow-2xl border-2 border-white/20"></div>
            </div>
         </div>
      </div>
      
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;700;900&family=Montserrat:wght@400;700;900&family=Poppins:wght@400;700;900&family=Roboto:wght@400;700;900&display=swap');

        .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #222; border-radius: 10px; border: 1px solid #111; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #333; }
        .no-scrollbar::-webkit-scrollbar { display: none; }

        /* Legendas custom fonts application */
        .subtitle-text {
          font-family: inherit;
        }
        @keyframes subtitle-in {
          0% { opacity: 0; transform: scale(0.9) translateY(10px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-subtitle-in {
          animation: subtitle-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes pop {
          0% { opacity: 0; transform: scale(0.5) translate(-50%, 20px); }
          50% { transform: scale(1.1) translate(-50%, -5px); }
          100% { opacity: 1; transform: scale(1) translate(-50%, 0); }
        }
        .animate-pop {
          animation: pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          transform-origin: center;
        }

        @keyframes slide {
          0% { opacity: 0; transform: translate(-50%, 40px); }
          100% { opacity: 1; transform: translate(-50%, 0); }
        }
        .animate-slide {
          animation: slide 0.3s ease-out forwards;
        }

        @keyframes fade {
          0% { opacity: 0; filter: blur(10px); }
          100% { opacity: 1; filter: blur(0); }
        }
        .animate-fade {
          animation: fade 0.3s ease-in forwards;
        }

        @keyframes glitch {
          0% { clip-path: inset(80% 0 0 0); transform: translate(-50%, -10px); opacity: 0.5; }
          20% { clip-path: inset(20% 0 50% 0); transform: translate(-50%, 5px); }
          40% { clip-path: inset(50% 0 30% 0); transform: translate(-50%, -5px); }
          60% { clip-path: inset(10% 0 70% 0); transform: translate(-50%, 2px); }
          80% { clip-path: inset(40% 0 10% 0); transform: translate(-50%, -2px); }
          100% { clip-path: inset(0 0 0 0); transform: translate(-50%, 0); opacity: 1; }
        }
        .animate-glitch {
          animation: glitch 0.4s steps(2, end) forwards;
        }
      `}</style>
    </div>
  );
}

export default function EditorPage() {
  return (
    <Suspense fallback={
      <div className="h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-8">
        <div className="relative">
           <div className="w-20 h-20 border-4 border-blue-600/10 border-t-blue-600 animate-spin rounded-full shadow-2xl"></div>
           <div className="absolute inset-0 flex items-center justify-center text-xl">🚀</div>
        </div>
        <div className="flex flex-col items-center gap-2">
           <p className="text-sm font-black text-white uppercase tracking-[0.4em] animate-pulse">LKMOVIE STUDIO PRO</p>
           <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest opacity-60 italic">Iniciando motor de renderização v2...</p>
        </div>
      </div>
    }>
      <EditorContent />
    </Suspense>
  );
}
