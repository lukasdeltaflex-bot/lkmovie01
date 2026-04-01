"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSelectedVideo } from "@/context/selected-video-context";
import { useAuth } from "@/context/auth-context";
import { saveProject } from "@/lib/firebase/projects";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function EditorPage() {
  const { selectedVideo } = useSelectedVideo();
  const { user } = useAuth();

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

  const [subtitle, setSubtitle] = useState({
    text: "Exemplo de legenda do LKMOVIE01",
    language: "pt-BR",
    size: "médio",
    color: "branco",
    position: "baixo",
  });

  const [watermark, setWatermark] = useState({
    url: "",
    position: "canto-direito-baixo",
    opacity: 100,
    size: 120,
  });

  const [finalLogo, setFinalLogo] = useState({
    url: "",
    showPreview: false,
  });

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<any>>,
    field: string
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      // Como o backend completo não está pronto, usaremos DataURL (Base64 Temporário) para persistir e renderizar
      const reader = new FileReader();
      reader.onloadend = () => {
        setter((prev: any) => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProject = async () => {
    if (!user) {
      alert("Você precisa estar logado para salvar o projeto.");
      return;
    }
    if (!selectedVideo) return;

    setIsSaving(true);
    setSaveStatus("idle");

    try {
      await saveProject({
        userId: user.uid,
        videoId: selectedVideo.id,
        title: selectedVideo.title,
        thumbnail: selectedVideo.thumbnail,
        channel: selectedVideo.channelTitle,
        subtitleText: subtitle.text,
        subtitleLanguage: subtitle.language,
        subtitleColor: subtitle.color,
        subtitleSize: subtitle.size,
        subtitlePosition: subtitle.position,
        watermarkUrl: watermark.url,
        watermarkOpacity: watermark.opacity,
        watermarkSize: watermark.size,
        watermarkPosition: watermark.position,
        endScreenUrl: finalLogo.url,
      });
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (error) {
      console.error(error);
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  if (!selectedVideo) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in duration-500 min-h-[60vh]">
        <div className="w-24 h-24 rounded-full bg-gray-900 flex items-center justify-center text-5xl opacity-40">🎬</div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">Nenhum vídeo selecionado</h2>
          <p className="text-gray-500 max-w-sm">Para editar um vídeo, você precisa primeiro selecioná-lo na ferramenta de busca.</p>
        </div>
        <Link href="/buscar-cenas">
          <Button className="bg-blue-600 hover:bg-blue-500 px-8 py-6 rounded-xl font-bold shadow-2xl shadow-blue-900/30">
            Ir para Buscar Cenas <span className="ml-2">🔍</span>
          </Button>
        </Link>
      </div>
    );
  }

  // Helpers for styling
  const getSubSizeClass = () => {
    switch (subtitle.size) {
      case "pequeno": return "text-sm md:text-xl";
      case "grande": return "text-3xl md:text-5xl border-2";
      default: return "text-xl md:text-3xl";
    }
  };

  const getSubColorClass = () => {
    switch (subtitle.color) {
      case "amarelo": return "text-yellow-400";
      case "azul": return "text-blue-500";
      default: return "text-white";
    }
  };

  const getSubPositionClass = () => {
    return subtitle.position === "meio"
      ? "bottom-1/2 translate-y-1/2"
      : "bottom-12";
  };

  const getWatermarkPosClass = () => {
    switch (watermark.position) {
      case "canto-esquerdo-topo": return "top-4 left-4";
      case "canto-direito-topo": return "top-4 right-4";
      case "canto-esquerdo-baixo": return "bottom-4 left-4";
      case "centro": return "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2";
      default: return "bottom-4 right-4"; 
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-blue-500 text-sm font-semibold uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          Simulador Visual
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Editor de Vídeo</h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-4">
          <div className="aspect-video bg-black rounded-3xl border border-gray-800 overflow-hidden shadow-2xl relative group select-none">
            <img 
              src={selectedVideo.thumbnail} 
              alt={selectedVideo.title} 
              className={`w-full h-full object-cover transition-all duration-300 ${finalLogo.showPreview ? "blur-md opacity-30 scale-105" : "opacity-90 object-contain bg-gray-900"}`}
            />

            {!finalLogo.showPreview && (
              <>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none"></div>

                {watermark.url && (
                  <img 
                    src={watermark.url} 
                    alt="Marca d'água" 
                    className={`absolute pointer-events-none transition-all duration-300 object-contain ${getWatermarkPosClass()}`}
                    style={{ 
                      opacity: watermark.opacity / 100,
                      width: `${watermark.size}px`,
                      maxWidth: '50%'
                    }}
                  />
                )}

                {subtitle.text && (
                  <div className={`absolute left-0 right-0 w-full flex justify-center px-8 transition-all duration-500 pointer-events-none ${getSubPositionClass()}`}>
                    <span 
                      className={`font-black tracking-wide text-center drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] px-4 py-1 rounded bg-black/40 ${getSubSizeClass()} ${getSubColorClass()}`} 
                      style={{ WebkitTextStroke: '1px black' }}
                    >
                      {subtitle.text}
                    </span>
                  </div>
                )}
              </>
            )}

            {finalLogo.showPreview && (
               <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-10 animate-in fade-in zoom-in duration-300">
                 {finalLogo.url ? (
                    <img 
                      src={finalLogo.url} 
                      alt="Logo Final" 
                      className="max-w-[60%] max-h-[60%] object-contain animate-in slide-in-from-bottom-4 shadow-2xl drop-shadow-[0_0_40px_rgba(255,255,255,0.15)]" 
                    />
                 ) : (
                    <div className="text-gray-500 flex flex-col items-center animate-pulse">
                      <div className="w-24 h-24 border-2 border-dashed border-gray-700 bg-gray-900/50 rounded-full flex items-center justify-center mb-4">
                        <span className="text-3xl opacity-50">🖼️</span>
                      </div>
                      <p className="font-medium">Nenhuma logo enviada</p>
                    </div>
                 )}
               </div>
            )}
          </div>

          <div className="flex justify-between items-center px-4 py-3 bg-gray-900 rounded-2xl border border-gray-800 shadow-lg">
             <div className="flex items-center gap-3 w-full pr-4">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                <div className="text-sm font-medium text-gray-300 truncate w-[70%]">
                    {selectedVideo.title}
                </div>
             </div>
             <div className="flex-shrink-0">
                <span className={`text-xs font-bold px-3 py-1.5 rounded-lg border uppercase tracking-wider ${finalLogo.showPreview ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20"}`}>
                  {finalLogo.showPreview ? "Tela Final" : "Timeline"}
                </span>
             </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-800 p-6 rounded-3xl shadow-2xl max-h-[75vh] overflow-y-auto custom-scrollbar relative">
            
            <div className="space-y-5 mb-10">
              <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">📝</div>
                  <h2 className="text-lg font-bold text-white">Configurar Legenda</h2>
                </div>
              </div>
              
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Texto de visualização</label>
                  <Input 
                    value={subtitle.text} 
                    onChange={(e) => setSubtitle({ ...subtitle, text: e.target.value })}
                    className="bg-black/50 border-gray-700 text-white h-11"
                    placeholder="Digite a legenda..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Idioma</label>
                     <select 
                       value={subtitle.language}
                       onChange={(e) => setSubtitle({ ...subtitle, language: e.target.value })}
                       className="flex h-11 w-full rounded-xl border border-gray-700 bg-black/50 text-sm px-3 py-2 text-white outline-none focus:border-blue-500 transition-colors"
                     >
                       <option value="pt-BR">Português (BR)</option>
                       <option value="en">Inglês (EN)</option>
                     </select>
                   </div>
                   <div className="space-y-2">
                     <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tamanho</label>
                     <select 
                       value={subtitle.size}
                       onChange={(e) => setSubtitle({ ...subtitle, size: e.target.value })}
                       className="flex h-11 w-full rounded-xl border border-gray-700 bg-black/50 text-sm px-3 py-2 text-white outline-none focus:border-blue-500 transition-colors"
                     >
                       <option value="pequeno">Pequeno</option>
                       <option value="médio">Médio</option>
                       <option value="grande">Grande</option>
                     </select>
                   </div>
                   <div className="space-y-2">
                     <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Cor da Fonte</label>
                     <select 
                       value={subtitle.color}
                       onChange={(e) => setSubtitle({ ...subtitle, color: e.target.value })}
                       className="flex h-11 w-full rounded-xl border border-gray-700 bg-black/50 text-sm px-3 py-2 text-white outline-none focus:border-blue-500 transition-colors"
                     >
                       <option value="branco">Branco</option>
                       <option value="amarelo">Amarelo Cativante</option>
                       <option value="azul">Azul Destaque</option>
                     </select>
                   </div>
                   <div className="space-y-2">
                     <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Posição</label>
                     <select 
                       value={subtitle.position}
                       onChange={(e) => setSubtitle({ ...subtitle, position: e.target.value })}
                       className="flex h-11 w-full rounded-xl border border-gray-700 bg-black/50 text-sm px-3 py-2 text-white outline-none focus:border-blue-500 transition-colors"
                     >
                       <option value="baixo">Rodapé</option>
                       <option value="meio">Centro da Tela</option>
                     </select>
                   </div>
                </div>
              </div>
            </div>

            <div className="space-y-5 mb-10">
              <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">💧</div>
                  <h2 className="text-lg font-bold text-white">Marca D'água</h2>
                </div>
              </div>
              
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Upload PNG (Fundo Transparente)</label>
                  <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-gray-700 hover:border-blue-500 rounded-xl cursor-pointer bg-black/30 hover:bg-black/50 transition-all group">
                     <span className="text-xl mb-1 opacity-50 group-hover:opacity-100 transition-opacity">📁</span>
                     <span className="text-xs font-medium text-gray-400 group-hover:text-blue-400">Clique para selecionar o selo</span>
                     <input 
                       type="file" 
                       accept="image/*" 
                       className="hidden" 
                       onChange={(e) => handleImageUpload(e, setWatermark, "url")} 
                     />
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-black/20 p-4 rounded-xl border border-gray-800/50">
                   <div className="space-y-2 md:col-span-2">
                     <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ancoragem Visual</label>
                     <select 
                       value={watermark.position}
                       onChange={(e) => setWatermark({ ...watermark, position: e.target.value })}
                       className="flex h-11 w-full rounded-xl border border-gray-700 bg-black/50 text-sm px-3 py-2 text-white outline-none focus:border-blue-500 transition-colors"
                     >
                       <option value="canto-direito-baixo">Inferior Direito</option>
                       <option value="canto-direito-topo">Superior Direito</option>
                       <option value="canto-esquerdo-baixo">Inferior Esquerdo</option>
                       <option value="canto-esquerdo-topo">Superior Esquerdo</option>
                       <option value="centro">Centralizado</option>
                     </select>
                   </div>
                   
                   <div className="space-y-3">
                     <div className="flex justify-between items-center">
                       <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Escala</label>
                       <span className="text-xs font-mono text-blue-400">{watermark.size}px</span>
                     </div>
                     <input 
                       type="range" 
                       min="30" max="300" 
                       value={watermark.size}
                       onChange={(e) => setWatermark({ ...watermark, size: Number(e.target.value) })}
                       className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                     />
                   </div>

                   <div className="space-y-3">
                     <div className="flex justify-between items-center">
                       <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Opacidade</label>
                       <span className="text-xs font-mono text-blue-400">{watermark.opacity}%</span>
                     </div>
                     <input 
                       type="range" 
                       min="10" max="100" 
                       value={watermark.opacity}
                       onChange={(e) => setWatermark({ ...watermark, opacity: Number(e.target.value) })}
                       className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                     />
                   </div>
                </div>
              </div>
            </div>

            <div className="space-y-5 mb-10">
              <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">🏁</div>
                  <h2 className="text-lg font-bold text-white">Tela Final (End Screen)</h2>
                </div>
              </div>
              
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Upload Chamada Final</label>
                  <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-gray-700 hover:border-blue-500 rounded-xl cursor-pointer bg-black/30 hover:bg-black/50 transition-all group">
                     <span className="text-xl mb-1 opacity-50 group-hover:opacity-100 transition-opacity">✨</span>
                     <span className="text-xs font-medium text-gray-400 group-hover:text-blue-400">Definir logo da tela de encerramento</span>
                     <input 
                       type="file" 
                       accept="image/*" 
                       className="hidden" 
                       onChange={(e) => handleImageUpload(e, setFinalLogo, "url")} 
                     />
                  </label>
                </div>

                {finalLogo.url && (
                  <div 
                    className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all duration-300 ${finalLogo.showPreview ? "bg-blue-600/10 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.15)]" : "bg-gray-800/50 border-gray-700 hover:border-gray-500"}`} 
                    onClick={() => setFinalLogo(p => ({ ...p, showPreview: !p.showPreview }))}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${finalLogo.showPreview ? "bg-blue-500 border-blue-500" : "bg-gray-900 border-gray-600"}`}>
                        {finalLogo.showPreview && <span className="text-white text-xs">✓</span>}
                      </div>
                      <span className={`text-sm font-medium select-none ${finalLogo.showPreview ? "text-blue-400" : "text-gray-300"}`}>
                        Ativar Preview da Tela Final
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-900/95 backdrop-blur-md pt-4 pb-2 border-t border-gray-800 mt-6 z-20">
               {saveStatus === "success" && (
                 <div className="mb-4 text-center text-sm text-green-400 font-medium bg-green-500/10 py-2 rounded-lg border border-green-500/20">
                    Projeto salvo com sucesso na biblioteca!
                 </div>
               )}
               {saveStatus === "error" && (
                 <div className="mb-4 text-center text-sm text-red-400 font-medium bg-red-500/10 py-2 rounded-lg border border-red-500/20">
                    Erro ao salvar o projeto.
                 </div>
               )}
               <Button 
                onClick={handleSaveProject}
                disabled={isSaving}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-7 rounded-2xl font-bold text-lg shadow-[0_0_40px_rgba(59,130,246,0.3)] transition-all transform hover:scale-[1.01] active:scale-100 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2 group"
               >
                  {isSaving ? (
                     <span className="animate-spin">⏳</span>
                  ) : (
                     <><span>💾</span> <span className="group-hover:tracking-wide transition-all">Salvar projeto</span></>
                  )}
               </Button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
