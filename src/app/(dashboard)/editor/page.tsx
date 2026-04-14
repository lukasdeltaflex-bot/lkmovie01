"use client";

import React, { useState, useEffect, useRef, Suspense, useMemo, useCallback } from "react";
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
    removeTimelineEvent,
    setClips,
    setTimeline,
    transcriptSegments,
    setTranscriptSegments
  } = useSelectedVideo();
  
  const { user } = useAuth();
  const { branding, showToast } = useBranding();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const ytPlayerRef = useRef<any>(null);
  const ytPlayerContainerRef = useRef<HTMLDivElement>(null);
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

  const [transcriptMode, setTranscriptMode] = useState<"pt" | "en" | "both" | "none">("both");

  const [watermark, setWatermark] = useState({
    url: branding.defaultWatermark || "",
    opacity: 80,
    x: 90,
    y: 10,
    size: 80,
  });

  const [isDragging, setIsDragging] = useState<string | null>(null);

  // ── Carregar Projeto ──────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      if (projectId) {
        const p = await getProjectById(projectId);
        if (p) {
          if (p.timeline && p.timeline.length > 0) {
            setTimeline(p.timeline);
            setClips([{ 
              id: p.videoId, 
              title: p.title, 
              thumbnail: p.thumbnail, 
              channel: p.channelTitle,
              zoom: 100 
            }]);
          } else {
            setClips([{ 
              id: p.videoId, 
              title: p.title, 
              thumbnail: p.thumbnail, 
              channel: p.channelTitle,
              zoom: 100 
            }]);
            setTimeline([{
              id: `ev-auto-${Date.now()}`,
              type: "video",
              startTime: 0,
              duration: 30,
              content: p.videoId,
              track: 0
            }]);
          }

          setVideoConfig(v => ({...v, aspectRatio: p.aspectRatio || "9:16"}));
          setGlobalSubtitle(s => ({
            ...s, 
            text: p.subtitleText, 
            textEn: p.subtitleTextEn || s.textEn,
            color: p.subtitleColor, 
            size: p.subtitleSize, 
            font: p.subtitleFont || "Inter",
            type: p.subtitleType,
            preset: (p as any).subtitlePreset || s.preset,
            y: p.subtitlePosition === "bottom" ? 80 : 50
          }));
          setWatermark(w => ({...w, url: p.watermarkUrl, opacity: p.watermarkOpacity, size: (p.watermarkScale || 0.15) * 500}));
          if (p.musicUrl) setSelectedMusic({ name: "Música Carregada", url: p.musicUrl });
          setMusicVolume((p.volumeMusic || 0.5) * 100);
          setVolume((p.volumeVideo || 1) * 100);
          if (p.transcriptSegments) setTranscriptSegments(p.transcriptSegments);
          if (p.transcriptMode) setTranscriptMode(p.transcriptMode);
        }
      }
    };
    load();
  }, [projectId, setClips, setTimeline, setTranscriptSegments]);

  // ── Detecção da fonte do vídeo ────────────────────────────────────────────
  const activeVideoData = useMemo(() => {
    const clip = clips[activeClipIndex];
    // Primeiro tenta extrair do clip diretamente (caso mais comum: vídeo selecionado da busca)
    const rawSource = clip?.id || clip?.url || 
      timeline.find(e => e.type === "video")?.content;

    if (!rawSource) return { type: "invalid" as const };

    // Regra Anti-Thumbnail
    if (typeof rawSource === "string" && (rawSource.includes("ytimg.com") || rawSource.includes("img.youtube.com"))) {
      return { type: "invalid" as const };
    }

    const ytIdMatch = typeof rawSource === "string" 
      ? rawSource.match(/^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/) 
      : null;
    const ytIdDirect = typeof rawSource === "string" ? rawSource.match(/^[a-zA-Z0-9_-]{11}$/) : null;

    if (ytIdMatch) return { type: "youtube" as const, id: ytIdMatch[1] };
    if (ytIdDirect) return { type: "youtube" as const, id: rawSource as string };

    if (typeof rawSource === "string" && (rawSource.match(/\.(mp4|webm|ogg)$/i) || rawSource.startsWith("blob:"))) {
      return { type: "file" as const, url: rawSource };
    }

    return { type: "invalid" as const };
  }, [clips, activeClipIndex, timeline]);

  // ── Carregar YouTube API ──────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ((window as any).YT && (window as any).YT.Player) return;
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  }, []);

  // ── Inicializar / Trocar vídeo YouTube ───────────────────────────────────
  useEffect(() => {
    if (activeVideoData.type !== "youtube" || !activeVideoData.id) {
      // Limpar player anterior
      if (ytPlayerRef.current && ytPlayerRef.current.destroy) {
        ytPlayerRef.current.destroy();
        ytPlayerRef.current = null;
      }
      return;
    }

    const videoId = activeVideoData.id;

    const initPlayer = () => {
      // Se já existe player com o mesmo vídeo, não recriar
      if (ytPlayerRef.current && ytPlayerRef.current.getVideoData) {
        try {
          const currentId = ytPlayerRef.current.getVideoData()?.video_id;
          if (currentId === videoId) return;
          ytPlayerRef.current.loadVideoById(videoId);
          ytPlayerRef.current.pauseVideo();
          return;
        } catch (_) {
          // player corrompido, recriar
          ytPlayerRef.current = null;
        }
      }

      // Destruir player antigo se existir
      if (ytPlayerRef.current && ytPlayerRef.current.destroy) {
        ytPlayerRef.current.destroy();
        ytPlayerRef.current = null;
      }

      // Garantir que o container existe
      if (!ytPlayerContainerRef.current) return;

      // Criar div interna limpa para o iframe
      ytPlayerContainerRef.current.innerHTML = '<div id="yt-iframe-target"></div>';

      ytPlayerRef.current = new (window as any).YT.Player("yt-iframe-target", {
        height: "100%",
        width: "100%",
        videoId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3,
          enablejsapi: 1,
          origin: typeof window !== "undefined" ? window.location.origin : "",
        },
        events: {
          onReady: (event: any) => {
            const dur = event.target.getDuration();
            if (dur > 0) setDuration(dur);
            event.target.seekTo(0, true);
            event.target.pauseVideo();
          },
          onStateChange: (event: any) => {
            const YT = (window as any).YT;
            if (event.data === YT.PlayerState.PLAYING) setIsPlaying(true);
            else if (
              event.data === YT.PlayerState.PAUSED ||
              event.data === YT.PlayerState.ENDED
            ) {
              setIsPlaying(false);
            }
          },
        },
      });
    };

    const tryInit = () => {
      if ((window as any).YT && (window as any).YT.Player) {
        initPlayer();
      } else {
        const prev = (window as any).onYouTubeIframeAPIReady;
        (window as any).onYouTubeIframeAPIReady = () => {
          if (prev) prev();
          initPlayer();
        };
      }
    };

    tryInit();

    return () => {
      // Não destruir aqui para evitar piscar durante re-renders
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeVideoData.type === "youtube" ? activeVideoData.id : null]);

  // ── Polling de tempo YouTube ──────────────────────────────────────────────
  useEffect(() => {
    if (!isPlaying || activeVideoData.type !== "youtube") return;
    const interval = setInterval(() => {
      try {
        if (!ytPlayerRef.current?.getCurrentTime) return;
        const t = ytPlayerRef.current.getCurrentTime();
        const d = ytPlayerRef.current.getDuration();
        setCurrentTime(t);
        if (d > 0) setDuration(d);
      } catch (_) {}
    }, 100);
    return () => clearInterval(interval);
  }, [isPlaying, activeVideoData.type]);

  // ── HTML5 Video sync ──────────────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => { if (video.duration > 0) setDuration(video.duration); };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onError = () => setIsPlaying(false);

    video.addEventListener("timeupdate", updateTime);
    video.addEventListener("loadedmetadata", updateDuration);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("error", onError);
    
    return () => {
      video.removeEventListener("timeupdate", updateTime);
      video.removeEventListener("loadedmetadata", updateDuration);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("error", onError);
    };
  }, [activeVideoData.type]);

  const togglePlay = useCallback(() => {
    if (activeVideoData.type === "youtube" && ytPlayerRef.current) {
      try {
        if (isPlaying) {
          ytPlayerRef.current.pauseVideo();
          if (audioRef.current) audioRef.current.pause();
        } else {
          ytPlayerRef.current.playVideo();
          if (audioRef.current && (audioMode === "mix" || audioMode === "music")) audioRef.current.play();
        }
        // Estado atualizado via onStateChange do player
      } catch (_) {}
    } else if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        if (audioRef.current) audioRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
        if (audioRef.current && (audioMode === "mix" || audioMode === "music")) audioRef.current.play().catch(() => {});
      }
    }
  }, [isPlaying, activeVideoData.type, audioMode]);

  const handleSeek = useCallback((newTime: number) => {
    const t = Math.max(0, Math.min(newTime, duration));
    if (activeVideoData.type === "youtube" && ytPlayerRef.current) {
      try { ytPlayerRef.current.seekTo(t, true); } catch (_) {}
    } else if (videoRef.current) {
      videoRef.current.currentTime = t;
    }
    if (audioRef.current) audioRef.current.currentTime = t;
    setCurrentTime(t);
  }, [activeVideoData.type, duration]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.volume = Math.min(volume / 100, 1);
  }, [volume]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = Math.min(musicVolume / 100, 1);
  }, [musicVolume]);

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + timelineRef.current.scrollLeft;
    const newTime = Math.max(0, x / zoomLevel);
    handleSeek(newTime);
  };

  // ── Drag global (legenda e watermark) ────────────────────────────────────
  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e: PointerEvent) => {
      if (!videoContainerRef.current) return;
      const rect = videoContainerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      if (isDragging === "subtitle") {
        setGlobalSubtitle(prev => ({ ...prev, y: Math.max(5, Math.min(95, y)) }));
      }
      if (isDragging === "watermark") {
        setWatermark(prev => ({ ...prev, x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) }));
      }
    };

    const handleUp = () => setIsDragging(null);

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [isDragging]);

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
        transcriptSegments: transcriptSegments,
        transcriptMode: transcriptMode,
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
      const response = await axios.post("/api/ai/transcribe-video", {
        videoTitle: clips[0].title,
        duration: duration
      });
      if (response.data.segments) {
        setTranscriptSegments(response.data.segments);
        setTranscriptMode("both");
        showToast("Transcrição temporal concluída! 🎙️", "success");
      }
    } catch (e) {
      showToast("Erro ao processar transcrição.", "error");
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

  // ── Legenda temporal ──────────────────────────────────────────────────────
  const currentPreset = SUBTITLE_PRESETS[globalSubtitle.preset as keyof typeof SUBTITLE_PRESETS] || SUBTITLE_PRESETS.tiktok;

  // Legenda baseada em segmentos de transcrição (temporal)
  const activeTranscriptPT = useMemo(() => {
    return transcriptSegments.find(s => s.language === "pt-BR" && currentTime >= s.start && currentTime <= s.end)?.text || "";
  }, [transcriptSegments, currentTime]);

  const activeTranscriptEN = useMemo(() => {
    return transcriptSegments.find(s => s.language === "en" && currentTime >= s.start && currentTime <= s.end)?.text || "";
  }, [transcriptSegments, currentTime]);

  // Legenda baseada em eventos da timeline
  const currentSubtitleObj = useMemo(() => {
    return timeline.find(s => s.type === "subtitle" && currentTime >= s.startTime && currentTime <= (s.startTime + s.duration));
  }, [timeline, currentTime]);

  // Texto final PT com fallback: transcript > timeline event > global
  const finalSubtitlePT = activeTranscriptPT 
    || (currentSubtitleObj?.content ?? "") 
    || (transcriptSegments.length === 0 ? globalSubtitle.text : "");

  // Texto final EN com fallback
  const finalSubtitleEN = activeTranscriptEN 
    || (currentSubtitleObj?.metadata?.en ?? "") 
    || (transcriptSegments.length === 0 ? globalSubtitle.textEn : "");

  const applyCase = (text: string) => {
    const shouldUppercase = currentPreset.case === "uppercase";
    return shouldUppercase ? text.toUpperCase() : text;
  };

  const finalSubtitleWords = useMemo(() => {
    if (!finalSubtitlePT) return [];
    return applyCase(finalSubtitlePT).split(" ");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalSubtitlePT, globalSubtitle.preset]);

  // Palavra ativa para highlight (somente quando há timeline event)
  const activeWordIndex = useMemo(() => {
    if (!currentSubtitleObj || finalSubtitleWords.length === 0) return -1;
    const progress = (currentTime - currentSubtitleObj.startTime) / currentSubtitleObj.duration;
    return Math.floor(progress * finalSubtitleWords.length);
  }, [currentTime, currentSubtitleObj, finalSubtitleWords]);

  // ── Formato de tempo ──────────────────────────────────────────────────────
  const fmtTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className="flex flex-col bg-[#0a0a0a] text-white overflow-hidden select-none font-sans"
      style={{ height: "100dvh" }}
    >
      {selectedMusic && <audio ref={audioRef} src={selectedMusic.url} loop />}
      
      {isRendering && (
        <div className="fixed inset-0 z-[1000] bg-black/95 flex flex-col items-center justify-center animate-in fade-in duration-500">
          <div className="w-20 h-20 border-[6px] border-blue-600 border-t-transparent animate-spin rounded-full mb-10 shadow-[0_0_40px_rgba(37,99,235,0.3)]"></div>
          <h2 className="text-3xl font-display font-black italic tracking-tighter uppercase">{renderStatus}</h2>
          <div className="w-80 h-1.5 bg-white/5 rounded-full mt-8 overflow-hidden">
            <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${renderProgress}%` }}></div>
          </div>
        </div>
      )}

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="h-14 shrink-0 border-b border-white/5 flex items-center justify-between px-8 bg-[#111] z-50 shadow-2xl">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-gray-500 hover:text-white transition-all flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest group">
            <span className="group-hover:-translate-x-1 transition-transform">←</span> Voltar
          </Link>
          <div className="h-4 w-px bg-white/5"></div>
          <div className="flex flex-col">
            <h1 className="text-[11px] font-display font-black text-white/90 uppercase tracking-[0.2em] leading-tight">
              {clips[0]?.title || "Novo Projeto"}
            </h1>
            {lastSaved && <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mt-0.5">Automático: {lastSaved.toLocaleTimeString()}</span>}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 mr-4">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Conectado</span>
          </div>
          <Button variant="ghost" className="h-9 px-4 text-[10px] font-bold" onClick={handleSaveProject} disabled={isSaving}>Salvar Cópia</Button>
          <Button size="sm" className="h-9 px-6 bg-blue-600 hover:bg-blue-500 font-display font-black" onClick={handleGenerateVideo}>GERAR VÍDEO 🚀</Button>
        </div>
      </header>

      {/* ── Área central (preview + sidebar) ───────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Preview Area */}
        <div className="flex-1 flex flex-col bg-[#0a0a0a] overflow-hidden min-w-0">
          {/* Video Preview */}
          <div className="flex-1 flex items-center justify-center p-6 bg-[#050505] relative overflow-hidden min-h-0">
            <div 
              ref={videoContainerRef}
              className="relative shadow-[0_40px_100px_rgba(0,0,0,0.6)] transition-all duration-500 border border-white/10 bg-[#111] overflow-hidden rounded-sm"
              style={{ 
                aspectRatio: videoConfig.aspectRatio.replace(":", "/"),
                maxHeight: "100%",
                maxWidth: "100%",
                height: videoConfig.aspectRatio === "9:16" ? "100%" : "auto",
              }}
            >
              {/* ── YouTube Player ─────────────────────────────────────────── */}
              {activeVideoData.type === "youtube" && (
                <div
                  ref={ytPlayerContainerRef}
                  className="absolute inset-0 w-full h-full"
                  style={{ transform: `scale(${videoConfig.zoom / 100})`, transformOrigin: "center" }}
                />
              )}

              {/* ── HTML5 File Player ──────────────────────────────────────── */}
              {activeVideoData.type === "file" && (
                <video 
                  ref={videoRef}
                  src={activeVideoData.url} 
                  className="w-full h-full object-cover"
                  style={{ transform: `scale(${videoConfig.zoom / 100})` }}
                  muted={audioMode === "none" || audioMode === "music"}
                  playsInline
                />
              )}

              {/* ── Sem fonte válida ───────────────────────────────────────── */}
              {activeVideoData.type === "invalid" && (
                <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900/50 border-2 border-dashed border-white/5 p-10 text-center">
                  <span className="text-5xl mb-6">🎬</span>
                  <span className="text-lg font-black text-white uppercase tracking-widest italic">Nenhum vídeo selecionado</span>
                  <p className="text-xs text-gray-500 mt-4 max-w-xs uppercase font-bold leading-relaxed">
                    Selecione uma cena na busca <br/> para iniciar sua edição.
                  </p>
                </div>
              )}

              {/* ── Safe Zones ─────────────────────────────────────────────── */}
              {videoConfig.safeZones && videoConfig.aspectRatio === "9:16" && (
                <div className="absolute inset-x-0 inset-y-0 pointer-events-none z-40 flex flex-col justify-between">
                  <div className="h-[15%] w-full bg-red-500/10 border-b border-red-500/30 flex items-center justify-center">
                    <span className="text-red-500/50 font-black text-[8px] uppercase tracking-tighter">Safe Area Top</span>
                  </div>
                  <div className="h-[25%] w-full bg-red-500/10 border-t border-red-500/30 flex items-center justify-center">
                    <span className="text-red-500/50 font-black text-[8px] uppercase tracking-tighter">Safe Area Bottom</span>
                  </div>
                </div>
              )}

              {/* ── Legenda ────────────────────────────────────────────────── */}
              {transcriptMode !== "none" && (
                <div
                  className="absolute left-0 right-0 flex flex-col items-center z-[60] cursor-ns-resize select-none"
                  style={{ top: `${globalSubtitle.y}%`, transform: "translateY(-50%)" }}
                  onPointerDown={(e) => { e.preventDefault(); setIsDragging("subtitle"); }}
                >
                  <div className="flex flex-col items-center gap-2 w-full px-4">
                    {/* PT-BR */}
                    {(transcriptMode === "pt" || transcriptMode === "both") && finalSubtitlePT && (
                      <div
                        className="subtitle-entry text-center flex flex-wrap justify-center gap-x-[0.25em] gap-y-1 leading-[1.1] w-full"
                        style={{ 
                          backgroundColor: globalSubtitle.showBg ? currentPreset.bg : "transparent",
                          backdropFilter: (globalSubtitle.showBg && currentPreset.bg !== "transparent") ? "blur(10px)" : "none",
                          color: globalSubtitle.color, 
                          fontSize: `${globalSubtitle.size}px`, 
                          fontFamily: `'${currentPreset.font}', sans-serif`,
                          fontWeight: currentPreset.weight,
                          fontStyle: "italic",
                          textShadow: currentPreset.shadow,
                          WebkitTextStroke: currentPreset.stroke,
                          letterSpacing: "-0.02em",
                          padding: "0.3em 0.6em",
                        }}
                      >
                        {finalSubtitleWords.map((word, idx) => (
                          <span 
                            key={idx} 
                            className="inline-block transition-all duration-200"
                            style={{
                              transform: idx === activeWordIndex ? "scale(1.18) translateY(-2px)" : "scale(1)",
                              filter: idx === activeWordIndex ? `drop-shadow(0 0 12px ${currentPreset.highlight})` : "none",
                              backgroundColor: (globalSubtitle.preset === "captionBox" && idx === activeWordIndex) ? "#ffffff" : "transparent",
                              color: (globalSubtitle.preset === "captionBox" && idx === activeWordIndex) 
                                ? "#000000" 
                                : (idx === activeWordIndex ? currentPreset.highlight : "inherit"),
                              padding: globalSubtitle.preset === "captionBox" ? "0 0.2em" : "0",
                              borderRadius: "0.2em",
                            }}
                          >
                            {word}
                          </span>
                        ))}
                      </div>
                    )}
                    {/* EN */}
                    {(transcriptMode === "en" || transcriptMode === "both") && finalSubtitleEN && (
                      <div 
                        className="px-4 py-1.5 rounded-xl text-center font-black italic uppercase leading-none shadow-2xl border border-white/10"
                        style={{ 
                          backgroundColor: "rgba(0,0,0,0.6)",
                          backdropFilter: "blur(8px)",
                          color: "#fbbf24",
                          fontSize: `${globalSubtitle.size * 0.55}px`, 
                          fontFamily: "'Montserrat', sans-serif",
                          textShadow: "0 2px 4px rgba(0,0,0,0.8)",
                          letterSpacing: "0.05em",
                        }}
                      >
                        {finalSubtitleEN}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Watermark ──────────────────────────────────────────────── */}
              {watermark.url && (
                <div 
                  className="absolute cursor-move select-none z-20"
                  onPointerDown={(e) => { e.preventDefault(); setIsDragging("watermark"); }}
                  style={{ left: `${watermark.x}%`, top: `${watermark.y}%`, width: `${watermark.size}px`, transform: "translate(-50%, -50%)", opacity: watermark.opacity / 100 }}
                >
                  <img src={watermark.url} className="w-full drop-shadow-2xl" alt="watermark" />
                </div>
              )}
            </div>
          </div>

          {/* ── Player Controls ────────────────────────────────────────────── */}
          <div className="h-24 shrink-0 border-t border-white/5 bg-[#0d0d0d] flex flex-col items-center justify-center gap-2 px-10 z-[70] shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
            <div className="w-full max-w-2xl space-y-1">
              <div className="w-full mb-1">
                <div className="h-1.5 w-full bg-white/10 rounded-full relative cursor-pointer group hover:h-2 transition-all" onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  handleSeek((x / rect.width) * duration);
                }}>
                  <div className="absolute top-0 left-0 h-full bg-blue-600 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.8)]" style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}></div>
                  <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white border-2 border-blue-600 rounded-full shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity" style={{ left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`, transform: "translate(-50%, -50%)" }}></div>
                </div>
              </div>
              <div className="flex items-center justify-between w-full h-8">
                <div className="w-20 text-[10px] font-black text-gray-500 tabular-nums">
                  {fmtTime(currentTime)}
                </div>
                <div className="flex items-center gap-6">
                  <button className="text-gray-500 hover:text-white transition-colors" onClick={() => handleSeek(0)} title="Início">⏮</button>
                  <button onClick={togglePlay} className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl">
                    <span className="text-xl ml-0.5">{isPlaying ? "⏸" : "▶"}</span>
                  </button>
                  <button className="text-gray-500 hover:text-white transition-colors" onClick={() => handleSeek(duration)} title="Fim">⏭</button>
                </div>
                <div className="w-20 text-[10px] font-black text-gray-400 text-right tabular-nums">
                  {fmtTime(duration)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Sidebar ───────────────────────────────────────────────────────── */}
        <div className="w-[400px] shrink-0 border-l border-white/5 bg-[#111] flex flex-col shadow-2xl z-40 overflow-hidden">
          {/* Pill Tabs */}
          <div className="p-4 shrink-0 border-b border-white/5 bg-black/20">
            <div className="flex p-1 bg-[#1a1a1a] rounded-xl border border-white/5">
              {(["video", "legendas", "audio", "watermark", "exportar"] as EditorTab[]).map(tab => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 flex items-center justify-center py-2.5 rounded-lg text-[9px] font-display font-black uppercase tracking-widest transition-all ${activeTab === tab ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20 scale-[1.02]" : "text-gray-500 hover:text-white hover:bg-white/5"}`}
                  title={tab}
                >
                  <span className="text-base">{tab === "video" ? "📺" : tab === "legendas" ? "💬" : tab === "audio" ? "🎵" : tab === "watermark" ? "🏷️" : "🚀"}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 p-8 space-y-10 overflow-y-auto custom-scrollbar bg-[#111] min-h-0">
            {activeTab === "video" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="space-y-4">
                  <label className="text-[10px] font-display font-black text-gray-500 uppercase tracking-widest italic">Formato da Edição</label>
                  <div className="grid grid-cols-3 gap-3">
                    {(["16:9", "9:16", "1:1"] as AspectRatio[]).map(r => (
                      <button key={r} onClick={() => setVideoConfig(v => ({...v, aspectRatio: r}))} className={`py-5 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${videoConfig.aspectRatio === r ? "border-blue-600 bg-blue-600/10 text-blue-500 shadow-xl" : "border-white/5 bg-white/5 text-gray-600 hover:border-white/10"}`}>
                        <div className={`border-2 ${r === "16:9" ? "w-6 h-3.5" : r === "9:16" ? "w-3.5 h-6" : "w-5 h-5"} border-current rounded-sm`}></div>
                        <span className="text-[9px] font-bold uppercase tracking-tighter">{r === "9:16" ? "TikTok" : r === "1:1" ? "Post" : "Cinema"}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-gray-500 uppercase flex justify-between tracking-widest leading-none">
                    <span>Magnificação Zoom</span>
                    <span className="text-blue-500">{videoConfig.zoom}%</span>
                  </label>
                  <input type="range" min="100" max="250" value={videoConfig.zoom} onChange={(e) => setVideoConfig(v => ({...v, zoom: parseInt(e.target.value)}))} className="w-full bg-[#1a1a1a] rounded-full accent-blue-600 h-1" />
                </div>
                <div className="p-6 bg-[#0a0a0a] rounded-2xl border border-white/5 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase text-gray-500 tracking-widest">Safe Zones UI</label>
                    <input type="checkbox" checked={videoConfig.safeZones} onChange={e => setVideoConfig(v => ({...v, safeZones: e.target.checked}))} className="w-4 h-4 rounded border-white/10 accent-blue-600 bg-[#1a1a1a]" />
                  </div>
                  <p className="text-[9px] text-gray-700 leading-relaxed font-bold uppercase opacity-60">Visualize as áreas de corte das interfaces sociais.</p>
                </div>
              </div>
            )}

            {activeTab === "legendas" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <Button 
                  onClick={handleGenerateAISubtitles}
                  disabled={isGeneratingSubtitles}
                  className="w-full py-7 bg-blue-600 rounded-2xl font-display font-black text-[11px] uppercase tracking-[0.3em] shadow-[0_20px_40px_rgba(37,99,235,0.2)] hover:bg-blue-500 transition-all disabled:opacity-50"
                >
                  {isGeneratingSubtitles ? "ESTUDANDO VÍDEO..." : "Transcrição Viral AI ✨"}
                </Button>

                {subtitleSuggestions.length > 0 && (
                  <div className="space-y-4">
                    <label className="text-[10px] font-display font-black text-gray-500 uppercase tracking-widest italic">Sugestões Estratégicas</label>
                    <div className="space-y-3">
                      {subtitleSuggestions.map((s, i) => (
                        <button key={i} onClick={() => setGlobalSubtitle(prev => ({ ...prev, text: s.pt, textEn: s.en }))} className="w-full p-5 bg-[#1a1a1a] border border-white/5 rounded-2xl text-left hover:bg-blue-600/5 hover:border-blue-600/30 transition-all group">
                          <div className="text-[13px] font-bold text-white group-hover:text-blue-400 leading-snug">{s.pt}</div>
                          <div className="text-[10px] text-gray-600 mt-2 uppercase font-black tracking-widest">{s.en}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="space-y-4">
                  <label className="text-[10px] font-display font-black text-gray-500 uppercase tracking-widest italic">Presets Profissionais</label>
                  <div className="grid grid-cols-2 gap-3">
                    {(Object.keys(SUBTITLE_PRESETS) as Array<keyof typeof SUBTITLE_PRESETS>).map(p => (
                      <button 
                        key={p} 
                        onClick={() => setGlobalSubtitle(s => ({ ...s, preset: p }))}
                        className={`py-3.5 rounded-xl border-2 text-[10px] font-bold uppercase tracking-wider transition-all font-display ${globalSubtitle.preset === p ? "border-blue-600 bg-blue-600/10 text-white shadow-xl shadow-blue-600/20" : "border-white/5 bg-[#1a1a1a] text-gray-500 hover:text-white hover:border-white/10"}`}
                      >
                        {p === "tiktok" ? "Viral TikTok" : p === "mrbeast" ? "MrBeast Pro" : p === "captionBox" ? "Caption Box" : p === "clean" ? "YouTube Clean" : p === "highContrast" ? "High Contrast" : "Minimal"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-display font-black text-gray-500 uppercase tracking-widest italic">Estilização Manual</label>
                  <div className="space-y-6 p-7 bg-[#0a0a0a] rounded-2xl border border-white/5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Atalhos</label>
                      <div className="flex gap-2">
                        <button onClick={() => setGlobalSubtitle(s => ({...s, showBg: !s.showBg}))} className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-lg border transition-all ${globalSubtitle.showBg ? "bg-blue-600 border-blue-600 text-white" : "border-white/10 text-gray-600 hover:text-white"}`}>BG</button>
                        <button onClick={() => setGlobalSubtitle(s => ({...s, useAnimation: !s.useAnimation}))} className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-lg border transition-all ${globalSubtitle.useAnimation ? "bg-blue-600 border-blue-600 text-white" : "border-white/10 text-gray-600 hover:text-white"}`}>ANIM</button>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Família da Fonte</label>
                      <select value={globalSubtitle.font} onChange={e => setGlobalSubtitle(s => ({...s, font: e.target.value}))} className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl h-11 px-4 text-xs font-bold outline-none focus:border-blue-600 text-white cursor-pointer">
                        {["Bebas Neue", "Montserrat", "Poppins", "Inter", "Arial", "Roboto"].map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                        <span>Tamanho do Texto</span>
                        <span className="text-blue-500">{globalSubtitle.size}px</span>
                      </div>
                      <input type="range" min="16" max="100" value={globalSubtitle.size} onChange={e => setGlobalSubtitle(s => ({...s, size: parseInt(e.target.value)}))} className="w-full bg-[#1a1a1a] rounded-full accent-blue-600 h-1" />
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {["#ffffff", "#fbbf24", "#ef4444", "#3b82f6", "#10b981", "#ec4899", "#f97316"].map(c => (
                        <button key={c} onClick={() => setGlobalSubtitle(s => ({...s, color: c}))} className={`w-8 h-8 rounded-full border-2 transition-all ${globalSubtitle.color === c ? "border-blue-600 scale-110 shadow-lg" : "border-white/10 hover:border-white/30"}`} style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-display font-black text-gray-500 uppercase tracking-widest italic">Modo de Exibição / Dual Language</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      {id: "pt", label: "PT-BR Principal"},
                      {id: "en", label: "English Only"},
                      {id: "both", label: "Dual PT + EN"},
                      {id: "none", label: "Ocultar Texto"}
                    ].map(mode => (
                      <button key={mode.id} onClick={() => setTranscriptMode(mode.id as any)} className={`py-4 rounded-xl border text-[9px] font-bold uppercase tracking-wider transition-all font-display ${transcriptMode === mode.id ? "border-blue-600 bg-blue-600/10 text-white shadow-xl" : "border-white/5 bg-[#1a1a1a] text-gray-600 hover:text-white"}`}>{mode.label}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "audio" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="space-y-4">
                  <label className="text-[10px] font-display font-black text-gray-500 uppercase tracking-widest italic">Engenharia de Som</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      {id: "keep", label: "Original", icon: "🎞️"},
                      {id: "music", label: "Soundtrack", icon: "🎵"},
                      {id: "mix", label: "Mix Studio", icon: "🎛️"},
                      {id: "none", label: "Mute", icon: "🔇"}
                    ].map(mode => (
                      <button key={mode.id} onClick={() => setAudioMode(mode.id as any)} className={`p-6 rounded-2xl border flex flex-col items-center gap-3 transition-all ${audioMode === mode.id ? "border-blue-600 bg-blue-600/10 text-white shadow-xl shadow-blue-600/10" : "border-white/5 bg-[#1a1a1a] text-gray-600 hover:text-white"}`}>
                        <span className="text-3xl">{mode.icon}</span>
                        <span className="text-[9px] font-bold uppercase tracking-widest font-display">{mode.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 p-7 bg-[#0a0a0a] rounded-2xl border border-white/5">
                  <div className="flex justify-between items-center text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1">
                    <span>Volume Principal</span>
                    <span className="text-blue-500">{volume}%</span>
                  </div>
                  <input type="range" min="0" max="150" value={volume} onChange={(e) => setVolume(parseInt(e.target.value))} className="w-full bg-[#1a1a1a] rounded-full accent-blue-600 h-1" />
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-display font-black text-gray-500 uppercase italic tracking-widest">Library Studio</label>
                    <input type="text" placeholder="Buscar trilha viral..." value={musicSearch} onChange={e => setMusicSearch(e.target.value)} className="w-full h-11 bg-[#1a1a1a] border border-white/5 rounded-xl px-5 text-sm font-bold focus:border-blue-600 outline-none transition-all text-white" />
                  </div>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                    {filteredTracks.map(m => (
                      <div key={m.name} onClick={() => { setSelectedMusic(m); setAudioMode("mix"); showToast(`${m.name} aplicada!`, "info"); }} className={`p-5 rounded-2xl border flex items-center justify-between hover:translate-x-1 cursor-pointer transition-all ${selectedMusic?.url === m.url ? "border-blue-600 bg-blue-600/5" : "bg-[#1a1a1a] border-white/5 hover:border-white/10"}`}>
                        <div className="flex items-center gap-4">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg ${m.viral ? "bg-pink-600/10 text-pink-500" : "bg-white/5 text-gray-600"}`}>{m.viral ? "🔥" : "🎶"}</div>
                          <div>
                            <div className="text-[13px] font-bold leading-none">{m.name}</div>
                            <div className="text-[10px] text-gray-700 mt-2 uppercase font-black tracking-widest">{m.artist} • {m.style}</div>
                          </div>
                        </div>
                        {selectedMusic?.url === m.url && <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse shadow-lg"></div>}
                      </div>
                    ))}
                  </div>
                </div>

                {selectedMusic && (
                  <div className="space-y-4 p-7 bg-blue-600/5 rounded-2xl border border-blue-600/10">
                    <div className="flex justify-between items-center text-[10px] font-bold text-blue-400 tracking-widest mb-1 uppercase">
                      <span>Mix de Trilha</span>
                      <span>{musicVolume}%</span>
                    </div>
                    <input type="range" min="0" max="100" value={musicVolume} onChange={(e) => setMusicVolume(parseInt(e.target.value))} className="w-full bg-black/40 rounded-full accent-blue-500 h-1" />
                    <Button variant="ghost" className="w-full h-10 text-[9px] font-bold text-red-500/60 uppercase tracking-widest hover:text-red-500" onClick={() => { setSelectedMusic(null); setAudioMode("keep"); }}>Remover Trilha</Button>
                  </div>
                )}
              </div>
            )}

            {activeTab === "watermark" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="space-y-4">
                  <label className="text-[10px] font-display font-black text-gray-500 uppercase tracking-widest italic text-center block">Upload de Identidade Visual</label>
                  <div className="grid grid-cols-1 gap-4">
                    <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-white/10 hover:border-blue-600/50 bg-[#0a0a0a] rounded-2xl cursor-pointer transition-all group overflow-hidden">
                      {watermark.url ? (
                        <div className="relative w-full h-full p-8 flex items-center justify-center">
                          <img src={watermark.url} className="max-w-full max-h-full object-contain drop-shadow-2xl" alt="watermark preview" />
                          <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                            <span className="text-[9px] font-black uppercase tracking-widest bg-white text-black px-4 py-2 rounded-lg">Trocar Imagem</span>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:bg-blue-600/10 transition-all font-display text-xl">📁</div>
                          <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">PNG Transparent Required</span>
                        </>
                      )}
                      <input type="file" className="hidden" accept="image/*" onChange={handleWatermarkUpload} />
                    </label>
                    {watermark.url && <Button variant="ghost" className="h-10 text-[9px] font-bold text-red-500/60 uppercase tracking-widest hover:text-red-500" onClick={() => setWatermark(w => ({...w, url: ""}))}>Reset Watermark</Button>}
                  </div>
                </div>

                {watermark.url && (
                  <div className="space-y-6 p-8 bg-[#0a0a0a] rounded-2xl border border-white/5 shadow-2xl">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        <span>Escala Visual</span>
                        <span className="text-white bg-white/5 px-2 py-0.5 rounded-md">{watermark.size}px</span>
                      </div>
                      <input type="range" min="30" max="250" value={watermark.size} onChange={e => setWatermark(w => ({...w, size: parseInt(e.target.value)}))} className="w-full bg-[#1a1a1a] rounded-full accent-white h-1" />
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        <span>Opacidade</span>
                        <span className="text-white bg-white/5 px-2 py-0.5 rounded-md">{watermark.opacity}%</span>
                      </div>
                      <input type="range" min="10" max="100" value={watermark.opacity} onChange={e => setWatermark(w => ({...w, opacity: parseInt(e.target.value)}))} className="w-full bg-[#1a1a1a] rounded-full accent-white h-1" />
                    </div>
                    <div className="pt-6 border-t border-white/5 text-center">
                      <p className="text-[9px] text-gray-700 font-bold uppercase tracking-[0.2em] italic">Interação: Arraste no preview para ancorar</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "exportar" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 text-center py-20 px-4">
                <div className="w-20 h-20 bg-blue-600/5 border border-blue-600/20 rounded-3xl flex items-center justify-center mx-auto mb-10 shadow-[0_0_60px_rgba(37,99,235,0.1)]">
                  <span className="text-4xl animate-bounce">🚀</span>
                </div>
                <div className="space-y-4">
                  <h3 className="text-2xl font-display font-black uppercase italic tracking-tighter">Exportando Viral AI</h3>
                  <p className="text-[10px] text-gray-700 font-bold uppercase max-w-[240px] mx-auto leading-relaxed tracking-widest opacity-80">Finalizando sua produção <br/> em nossos servidores Cloud Pro.</p>
                </div>
                <div className="pt-4 px-2">
                  <Button onClick={handleGenerateVideo} className="w-full h-20 rounded-2xl bg-blue-600 font-display font-black text-[12px] uppercase tracking-[0.4em] shadow-[0_20px_50px_rgba(37,99,235,0.3)] hover:scale-[1.02] hover:bg-blue-500 active:scale-95 transition-all">
                    GERAR ARQUIVO FINAL 🎬
                  </Button>
                </div>
                <div className="pt-8">
                  <button className="text-[9px] font-bold text-gray-700 uppercase tracking-[0.3em] hover:text-white transition-colors" onClick={handleSaveProject}>Salvar progresso em nuvem</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Timeline Footer ───────────────────────────────────────────────── */}
      <div className="h-[200px] shrink-0 border-t border-white/5 bg-[#0a0a0a] flex flex-col relative z-50">
        {/* Toolbar */}
        <div className="h-10 shrink-0 flex items-center border-b border-white/5 px-8 bg-[#111] shadow-inner">
          <div className="flex-1 flex gap-10 text-[9px] font-bold text-gray-600 uppercase tracking-[0.2em] overflow-x-auto no-scrollbar">
            <button className="hover:text-blue-500 flex items-center gap-2 transition-colors">✂️ Split</button>
            <button className="hover:text-red-500 flex items-center gap-2 transition-colors">🗑 Delete</button>
            <button className="hover:text-white flex items-center gap-2 transition-colors">📄 Duplicate</button>
            <button className="hover:text-white flex items-center gap-2 transition-colors">↩ Undo</button>
            <button className="hover:text-white flex items-center gap-2 transition-colors">↪ Redo</button>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-gray-700 font-black">ZOOM</span>
            <input type="range" min="5" max="40" value={zoomLevel} onChange={(e) => setZoomLevel(parseInt(e.target.value))} className="w-24 h-1 accent-white bg-white/5 rounded-full" />
          </div>
        </div>

        {/* Tracks */}
        <div 
          ref={timelineRef}
          className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar relative px-10 py-4 bg-[#080808] min-h-0"
          onMouseDown={handleTimelineClick}
        >
          {/* Ruler */}
          <div className="h-5 flex items-end mb-3 sticky top-0 z-10 border-b border-white/5">
            {Array.from({ length: Math.ceil(duration) + 1 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 flex flex-col items-center justify-end h-full relative" style={{ width: `${zoomLevel}px` }}>
                {i % 5 === 0 ? <span className="text-[8px] font-black text-gray-700 leading-none absolute -top-0.5">{i}s</span> : <div className="w-[1px] h-1.5 bg-white/5"></div>}
              </div>
            ))}
          </div>

          <div className="space-y-2 relative w-fit">
            {/* Video Track */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 shrink-0 flex items-center justify-center text-[8px] font-black text-gray-800 bg-white/5 rounded-lg border border-white/5 uppercase">V</div>
              <div className="h-10 bg-blue-600/5 border border-white/5 rounded-xl relative overflow-hidden flex items-center" style={{ width: `${duration * zoomLevel}px` }}>
                {timeline.filter(e => e.type === "video").map(ev => (
                  <div key={ev.id} className="h-8 bg-blue-600 rounded-lg border border-white/10 flex items-center px-3 text-[9px] font-black shadow-lg ml-1 transition-all shrink-0" style={{ width: `${Math.max(ev.duration * zoomLevel - 8, 10)}px` }}>
                    <span className="truncate">{ev.id.slice(0, 8).toUpperCase()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Audio Track */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-8 shrink-0 flex items-center justify-center text-[8px] font-black text-gray-800 bg-white/5 rounded-lg border border-white/5 uppercase">A</div>
              <div className="h-8 bg-indigo-600/5 border border-white/5 rounded-lg relative overflow-hidden flex items-center" style={{ width: `${duration * zoomLevel}px` }}>
                {selectedMusic && <div className="h-6 bg-indigo-600 rounded-md border border-white/10 flex items-center px-3 text-[9px] font-black shadow-md truncate" style={{ width: `${duration * zoomLevel}px` }}>{selectedMusic.name.toUpperCase()}</div>}
              </div>
            </div>

            {/* Subtitle Track */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-7 shrink-0 flex items-center justify-center text-[8px] font-black text-gray-800 bg-white/5 rounded-lg border border-white/5 uppercase">T</div>
              <div className="h-7 bg-amber-600/5 border border-white/5 rounded-lg relative overflow-hidden flex items-center" style={{ width: `${duration * zoomLevel}px` }}>
                {transcriptMode !== "none" && <div className="h-5 bg-amber-600/60 rounded-md border border-white/10 flex items-center px-3 text-[8px] font-black opacity-60 truncate" style={{ width: `${duration * zoomLevel}px` }}>{finalSubtitlePT.slice(0, 40)}</div>}
              </div>
            </div>
          </div>

          {/* Playhead */}
          <div 
            className="absolute top-0 bottom-0 w-[2px] bg-red-600 z-[20] pointer-events-none"
            style={{ left: `${(currentTime * zoomLevel) + 48}px` }}
          >
            <div className="w-3.5 h-3.5 bg-red-600 rounded-full absolute -top-1 -left-[6px] shadow-[0_0_12px_rgba(220,38,38,0.5)] border-2 border-white/20"></div>
          </div>
        </div>
      </div>
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #2563eb; }
        .no-scrollbar::-webkit-scrollbar { display: none; }

        .subtitle-entry {
          animation: subtitle-pop 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        @keyframes subtitle-pop {
          0%   { opacity: 0; transform: scale(0.92) translateY(6px); }
          100% { opacity: 1; transform: scale(1)    translateY(0);    }
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
          <p className="text-sm font-display font-black text-white uppercase tracking-[0.4em] animate-pulse">LKMOVIE STUDIO PRO</p>
          <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest opacity-60 italic">Iniciando motor de renderização v2...</p>
        </div>
      </div>
    }>
      <EditorContent />
    </Suspense>
  );
}
