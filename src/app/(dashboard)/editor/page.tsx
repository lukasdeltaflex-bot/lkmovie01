"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useSelectedVideo } from "@/context/selected-video-context";
import { useAuth } from "@/context/auth-context";
import { useBranding } from "@/context/branding-context";
import { createProject, updateProject, SavedProject } from "@/lib/firebase/projects";
import { saveEditorPreset, getUserPresets, EditorPreset, deleteEditorPreset } from "@/lib/firebase/presets";
import { createNotification } from "@/lib/firebase/notifications";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type AspectRatio = "16:9" | "9:16" | "1:1";

export default function EditorPage() {
  const { selectedVideo } = useSelectedVideo();
  const { user } = useAuth();
  const { branding } = useBranding();

  const [projectId, setProjectId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderStatus, setRenderStatus] = useState("");
  
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("16:9");
  const [isDragging, setIsDragging] = useState<"subtitle" | "watermark" | null>(null);
  
  const [subtitle, setSubtitle] = useState({
    text: "Clique e arraste para posicionar",
    language: "pt-BR",
    size: 24,
    color: "#ffffff",
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

  const [finalLogo, setFinalLogo] = useState({
    url: "",
    showPreview: false,
  });

  const [presets, setPresets] = useState<EditorPreset[]>([]);
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [presetName, setPresetName] = useState("");

  const videoContainerRef = useRef<HTMLDivElement>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (user) getUserPresets(user.uid).then(setPresets);
  }, [user]);

  useEffect(() => {
    if (branding.defaultWatermark && !watermark.url) setWatermark(prev => ({ ...prev, url: branding.defaultWatermark }));
    if (branding.defaultEndScreen && !finalLogo.url) setFinalLogo(prev => ({ ...prev, url: branding.defaultEndScreen }));
  }, [branding.defaultWatermark, branding.defaultEndScreen]);

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
    const safeX = Math.max(5, Math.min(95, x));
    const safeY = Math.max(5, Math.min(95, y));
    if (isDragging === "subtitle") setSubtitle(prev => ({ ...prev, x: safeX, y: safeY }));
    else setWatermark(prev => ({ ...prev, x: safeX, y: safeY }));
  };

  const handlePointerUp = () => setIsDragging(null);

  const currentProjectData = useCallback((status: "Draft" | "Rendering" | "Ready" = "Draft"): Omit<SavedProject, "createdAt" | "updatedAt"> | null => {
    if (!user || !selectedVideo) return null;
    return {
      userId: user.uid,
      videoId: selectedVideo.id,
      title: selectedVideo.title,
      thumbnail: selectedVideo.thumbnail,
      channel: selectedVideo.channelTitle,
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
      aspectRatio,
      endScreenUrl: finalLogo.url,
      status
    };
  }, [user, selectedVideo, subtitle, watermark, finalLogo.url, aspectRatio]);

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

  // MOTOR DE RENDERIZAÇÃO SIMULADO
  const handleGenerateVideo = async () => {
    if (!user || !selectedVideo) return;
    
    setIsRendering(true);
    setRenderProgress(0);
    
    const statuses = [
      "Sincronizando áudio Cloud...",
      "Renderizando marca d'água...",
      "Processando legendas dinâmicas...",
      "Otimizando 4K Bitrate...",
      "Finalizando exportação SaaS...",
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      setRenderProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          finishRender();
          return 100;
        }
        if (prev % 20 === 0) {
           setRenderStatus(statuses[currentStep] || "Pronto!");
           currentStep++;
        }
        return prev + 2;
      });
    }, 150);
  };

  const finishRender = async () => {
    if (!user || !selectedVideo) return;
    
    const data = currentProjectData("Ready");
    if (data && projectId) await updateProject(projectId, data);

    createNotification(user.uid, {
      title: "Exportação Concluída! 🎬",
      message: `O vídeo "${selectedVideo.title}" está pronto para o download.`,
      type: "success"
    });

    setTimeout(() => {
      setIsRendering(false);
      setRenderProgress(0);
      alert("Vídeo Gerado com Sucesso! (Simulação concluída e notificação enviada para o seu sino 🔔)");
    }, 1000);
  };

  useEffect(() => {
    if (!user || !selectedVideo) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => handleSaveProject(true), 5000);
    return () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current); };
  }, [subtitle, watermark, finalLogo.url, aspectRatio]);

  const handleSavePreset = async (type: "subtitle" | "watermark") => {
    if (!user || !presetName.trim()) return;
    const data = type === "subtitle" 
      ? { color: subtitle.color, size: subtitle.size, x: subtitle.x, y: subtitle.y, language: subtitle.language }
      : { opacity: watermark.opacity, size: watermark.size, x: watermark.x, y: watermark.y };
    await saveEditorPreset({ userId: user.uid, name: presetName, type, data });
    setPresetName(""); setShowPresetModal(false); getUserPresets(user.uid).then(setPresets);
  };

  const loadPreset = (preset: EditorPreset) => {
    if (preset.type === "subtitle") setSubtitle(prev => ({ ...prev, ...preset.data as any }));
    else setWatermark(prev => ({ ...prev, ...preset.data as any }));
  };

  if (!selectedVideo) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center space-y-6 min-h-[60vh] animate-in fade-in duration-500">
        <div className="w-24 h-24 rounded-full bg-gray-950 flex items-center justify-center text-5xl shadow-2xl border border-gray-800">🎬</div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Preparar Estúdio SaaS</h2>
          <p className="text-gray-500 max-w-sm font-bold">Inicie sua produção profissional selecionando uma cena.</p>
        </div>
        <Link href="/buscar-cenas">
          <Button className="font-black px-12 py-8 rounded-4xl shadow-2xl transform active:scale-95" style={{ backgroundColor: branding.primaryColor }}>
            ENTRAR NA GALERIA 🔍
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
      
      {/* RENDERING OVERLAY */}
      {isRendering && (
        <div className="fixed inset-0 z-100 flex flex-col items-center justify-center p-6 bg-black/90 backdrop-blur-3xl animate-in zoom-in duration-500">
            <div className="w-full max-w-xl space-y-10 text-center">
               <div className="w-32 h-32 bg-blue-600 rounded-4xl flex items-center justify-center mx-auto shadow-[0_0_80px_rgba(37,99,235,0.4)] animate-pulse">
                  <span className="text-6xl text-white">⚙️</span>
               </div>
               <div className="space-y-2">
                  <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">{renderStatus}</h2>
                  <p className="text-blue-400 font-bold text-sm tracking-[0.3em] uppercase">Cloud Rendering Alpha</p>
               </div>
               <div className="space-y-4">
                  <div className="w-full h-4 bg-gray-900 rounded-full overflow-hidden border border-white/5 shadow-inner">
                     <div 
                      className="h-full bg-blue-500 transition-all duration-300 shadow-[0_0_20px_rgba(37,99,235,0.8)]" 
                      style={{ width: `${renderProgress}%`, backgroundColor: branding.primaryColor }}
                     ></div>
                  </div>
                  <div className="flex justify-between text-[10px] font-black text-gray-500 uppercase tracking-widest">
                     <span>Progresso: {renderProgress}%</span>
                     <span>Hardware: NVIDIA Tesla T4 Cloud</span>
                  </div>
               </div>
            </div>
        </div>
      )}

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-gray-900/50 p-6 rounded-4xl border border-gray-100 dark:border-gray-800 shadow-sm backdrop-blur-xl">
        <div className="flex items-center gap-6">
          <div 
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-xl shadow-blue-500/10"
            style={{ backgroundColor: `${branding.primaryColor}1a`, color: branding.primaryColor }}
          >
            🕹️
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">Laboratório de Edição</h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-loose">
               {saveStatus === "saving" ? "🌩️ Sincronizando Cloud..." : `Salvo às ${lastSaved?.toLocaleTimeString() || '--:--'}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 dark:bg-black p-1.5 rounded-2xl mr-4">
             {(["16:9", "9:16", "1:1"] as AspectRatio[]).map(ratio => (
                <button 
                  key={ratio}
                  onClick={() => setAspectRatio(ratio)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${aspectRatio === ratio ? 'bg-white dark:bg-gray-800 text-blue-500 shadow-xl' : 'text-gray-400'}`}
                  style={aspectRatio === ratio ? { color: branding.primaryColor } : {}}
                >
                   {ratio}
                </button>
             ))}
          </div>
          <Button 
            onClick={() => handleSaveProject()}
            disabled={isSaving}
            className="px-8 py-6 rounded-4xl font-black shadow-2xl text-white active:scale-95 transition-all"
            style={{ backgroundColor: branding.primaryColor }}
          >
             {isSaving ? "..." : "SALVAR SaaS"}
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        <div className="lg:col-span-12 xl:col-span-8 flex justify-center items-start w-full">
           <div 
              ref={videoContainerRef}
              className={`relative bg-black rounded-3xl md:rounded-4xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border-4 md:border-8 border-white dark:border-gray-800 overflow-hidden transition-all duration-500 group select-none touch-none w-full`}
              style={{ aspectRatio: aspectRatio.replace(':', '/'), maxWidth: aspectRatio === '9:16' ? '400px' : '100%' }}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
           >
              <img src={selectedVideo.thumbnail} className={`w-full h-full object-cover select-none pointer-events-none transition-all duration-700 ${finalLogo.showPreview ? "blur-xl scale-110 opacity-30" : "opacity-80"}`} />
              {isDragging && (
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none animate-in fade-in duration-300">
                   {[...Array(8)].map((_, i) => ( <div key={i} className="border-[0.5px] border-white/20"></div> ))}
                </div>
              )}
              {!finalLogo.showPreview && (
                 <>
                    {watermark.url && (
                      <div 
                        onPointerDown={handlePointerDown("watermark")}
                        className={`absolute cursor-move active:scale-110 transition-transform ${isDragging === 'watermark' ? 'ring-2 ring-primary ring-offset-4' : ''}`}
                        style={{ left: `${watermark.x}%`, top: `${watermark.y}%`, transform: `translate(-50%, -50%)`, opacity: watermark.opacity / 100, width: `${watermark.size}px` }}
                      >
                         <img src={watermark.url} className="w-full h-full object-contain drop-shadow-2xl pointer-events-none" />
                      </div>
                    )}
                    <div 
                      onPointerDown={handlePointerDown("subtitle")}
                      className={`absolute cursor-move flex justify-center active:scale-105 transition-transform ${isDragging === 'subtitle' ? 'ring-2 ring-primary ring-offset-8 rounded-xl' : ''}`}
                      style={{ left: `${subtitle.x}%`, top: `${subtitle.y}%`, transform: `translate(-50%, -50%)`, width: 'max-content', maxWidth: '80%' }}
                    >
                       <span className="font-black text-center drop-shadow-[0_10px_10px_rgba(0,0,0,1)] bg-black/40 backdrop-blur-md px-6 py-2 rounded-2xl border border-white/10 uppercase tracking-tight pointer-events-none select-none" style={{ color: subtitle.color, fontSize: `${subtitle.size}px` }}> {subtitle.text} </span>
                    </div>
                 </>
              )}
              {finalLogo.showPreview && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-md animate-in zoom-in duration-500">
                   <img src={finalLogo.url || branding.logo} className="max-w-[60%] max-h-[60%] object-contain drop-shadow-[0_0_60px_rgba(255,255,255,0.2)]" />
                </div>
              )}
           </div>
        </div>

        <div className="lg:col-span-12 xl:col-span-4 space-y-8">
           <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-8 rounded-4xl shadow-2xl h-fit space-y-10">
              <div className="flex gap-2">
                 <button onClick={() => setShowPresetModal(true)} className="flex-1 py-4 bg-gray-950 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-black transition-all"> 💾 Salvar Estilo </button>
                 <div className="flex-1 flex gap-2 overflow-x-auto scrollbar-hide">
                    {presets.map(p => ( <button key={p.id} onClick={() => loadPreset(p)} className="px-4 py-4 bg-gray-100 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-2xl text-[10px] font-black uppercase text-gray-500 truncate min-w-[80px]"> {p.name} </button> ))}
                 </div>
              </div>

              <section className="space-y-6">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold" style={{ backgroundColor: `${branding.primaryColor}1a`, color: branding.primaryColor }}>T</div>
                    <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Texto & Estilo</h2>
                 </div>
                 <div className="space-y-5">
                    <Input value={subtitle.text} onChange={(e) => setSubtitle(s => ({ ...s, text: e.target.value }))} className="bg-gray-50 dark:bg-black/50 border-gray-200 dark:border-gray-800 h-16 rounded-2xl font-bold text-lg" />
                    <div className="space-y-8 p-6 bg-gray-50 dark:bg-black/30 rounded-3xl border border-gray-100 dark:border-gray-800">
                       <div className="space-y-4">
                          <div className="flex justify-between items-center px-1">
                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tamanho da Fonte</label>
                             <span className="text-xs font-black text-blue-500">{subtitle.size}px</span>
                          </div>
                          <input type="range" min="12" max="80" value={subtitle.size} onChange={(e) => setSubtitle(s => ({ ...s, size: Number(e.target.value) }))} className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none accent-primary" style={{ accentColor: branding.primaryColor }} />
                       </div>
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cor Principal</label>
                          <div className="flex gap-3">
                             {["#ffffff", "#facc15", "#3b82f6", "#ef4444"].map(c => ( <button key={c} onClick={() => setSubtitle(s => ({ ...s, color: c }))} className={`w-10 h-10 rounded-xl border-2 transition-all ${subtitle.color === c ? 'scale-110 border-blue-500 shadow-lg' : 'border-transparent'}`} style={{ backgroundColor: c }} /> ))}
                          </div>
                       </div>
                    </div>
                 </div>
              </section>

              <section className="space-y-6">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold" style={{ backgroundColor: `${branding.secondaryColor}1a`, color: branding.secondaryColor }}>W</div>
                    <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Marca d'água</h2>
                 </div>
                 <div className="space-y-8 p-6 bg-gray-50 dark:bg-black/30 rounded-3xl border border-gray-100 dark:border-gray-800">
                    <div className="space-y-4">
                       <div className="flex justify-between items-center px-1"> <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Escala</label> <span className="text-xs font-black text-blue-500">{watermark.size}px</span> </div>
                       <input type="range" min="30" max="300" value={watermark.size} onChange={(e) => setWatermark(w => ({ ...w, size: Number(e.target.value) }))} className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none accent-primary" style={{ accentColor: branding.primaryColor }} />
                    </div>
                    <div className="space-y-4">
                       <div className="flex justify-between items-center px-1"> <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Opacidade</label> <span className="text-xs font-black text-blue-500">{watermark.opacity}%</span> </div>
                       <input type="range" min="10" max="100" value={watermark.opacity} onChange={(e) => setWatermark(w => ({ ...w, opacity: Number(e.target.value) }))} className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none accent-primary" style={{ accentColor: branding.primaryColor }} />
                    </div>
                 </div>
              </section>

              <ToggleSwitch active={finalLogo.showPreview} onClick={() => setFinalLogo(f => ({ ...f, showPreview: !f.showPreview }))} label="Simular Tela Final" sub="Ver logo de encerramento" />

              <Button onClick={handleGenerateVideo} className="w-full h-24 rounded-4xl font-black text-2xl text-white shadow-2xl transition-all transform hover:-translate-y-2 active:translate-y-0 flex items-center justify-center gap-4 group" style={{ background: `linear-gradient(to right, ${branding.primaryColor}, ${branding.secondaryColor})` }}>
                 <span className="text-3xl group-hover:rotate-12 transition-transform">💎</span> 
                 <span className="tracking-tighter">GERAR VÍDEO SaaS</span>
              </Button>
           </div>
        </div>
      </div>

      {showPresetModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-3xl z-100 flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="bg-white dark:bg-gray-950 border border-gray-800 p-10 rounded-4xl w-full max-w-md space-y-6 shadow-[0_0_100px_rgba(0,0,0,0.5)]">
              <h2 className="text-3xl font-black text-white tracking-tighter italic uppercase">Novo Preset SaaS</h2>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest leading-loose">Salve seu estilo de elite para automação total.</p>
              <Input placeholder="Ex: Legenda Reels Dark" value={presetName} onChange={(e) => setPresetName(e.target.value)} className="h-16 text-xl rounded-4xl bg-gray-900 border-gray-800 text-white font-bold" />
              <div className="flex gap-3 pt-4">
                 <Button onClick={() => setShowPresetModal(false)} variant="outline" className="flex-1 h-16 rounded-3xl font-black uppercase">Cancelar</Button>
                 <Button onClick={() => handleSavePreset("subtitle")} className="flex-1 h-16 rounded-3xl font-black shadow-2xl text-white uppercase" style={{ backgroundColor: branding.primaryColor }}>Confirmar</Button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

function ToggleSwitch({ active, onClick, label, sub }: { active: boolean, onClick: () => void, label: string, sub: string }) {
  return (
    <div onClick={onClick} className={`p-6 rounded-4xl border cursor-pointer transition-all ${active ? 'bg-blue-600/10 border-blue-500/30' : 'bg-gray-100 dark:bg-black border-transparent'}`}>
       <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-black uppercase tracking-tight ${active ? 'text-blue-500' : 'text-gray-900 dark:text-white'}`}>{label}</p>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">{sub}</p>
          </div>
          <div className={`w-14 h-8 rounded-full transition-all relative p-1 ${active ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-800'}`}>
             <div className={`w-6 h-6 bg-white rounded-full transition-transform shadow-lg ${active ? 'translate-x-6' : 'translate-x-0'}`}></div>
          </div>
       </div>
    </div>
  );
}
