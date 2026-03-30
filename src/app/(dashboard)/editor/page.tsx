"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSelectedVideo } from "@/context/selected-video-context";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function EditorPage() {
  const { selectedVideo } = useSelectedVideo();
  const [editingConfig, setEditingConfig] = useState({
    start: "00:00:00",
    end: "00:00:30",
    format: "mp4",
    subtitleLanguage: "pt-BR",
  });

  const handleChange = (field: string, value: string) => {
    setEditingConfig((prev) => ({ ...prev, [field]: value }));
  };

  if (!selectedVideo) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in duration-500">
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

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-blue-500 text-sm font-semibold uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          Modo Edição Profissional
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Editor de Projeto</h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Preview Section */}
        <div className="space-y-4">
          <div className="aspect-video bg-black rounded-3xl border border-gray-800 overflow-hidden shadow-2xl relative group">
            <img 
              src={selectedVideo.thumbnail} 
              alt={selectedVideo.title} 
              className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
            />
            <div className="absolute inset-0 flex items-center justify-center">
               <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-3xl shadow-2xl cursor-pointer hover:scale-110 transition-transform">
                 ▶️
               </div>
            </div>
            <div className="absolute bottom-6 left-6 right-6 p-4 bg-black/60 backdrop-blur-md rounded-2xl border border-white/10">
               <h3 className="text-sm font-bold text-white truncate">{selectedVideo.title}</h3>
               <p className="text-xs text-blue-400 font-medium">{selectedVideo.channelTitle}</p>
            </div>
          </div>
          <div className="flex justify-between items-center px-2">
             <div className="text-xs font-mono text-gray-500">Video ID: {selectedVideo.id}</div>
             <div className="flex gap-2">
                <Button variant="outline" className="h-8 text-xs border-gray-800">Trocar Vídeo</Button>
             </div>
          </div>
        </div>

        {/* Controls Section */}
        <div className="bg-gray-900/40 backdrop-blur-md border border-gray-800 p-8 rounded-3xl space-y-8 shadow-2xl">
          <div className="space-y-4">
             <h2 className="text-lg font-bold text-white border-b border-gray-800 pb-2">Timeline & Corte</h2>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Início</label>
                  <Input 
                    value={editingConfig.start} 
                    onChange={(e) => handleChange("start", e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Fim</label>
                  <Input 
                    value={editingConfig.end} 
                    onChange={(e) => handleChange("end", e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white font-mono"
                  />
                </div>
             </div>
          </div>

          <div className="space-y-4">
             <h2 className="text-lg font-bold text-white border-b border-gray-800 pb-2">Preferências</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Idioma da Legenda</label>
                  <select className="flex h-10 w-full rounded-md border border-gray-700 bg-gray-800 text-sm px-3 py-2 text-white outline-none focus:border-blue-500 transition-colors">
                    <option>Português (Brasil)</option>
                    <option>English (US)</option>
                    <option>Español</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Formato</label>
                  <select className="flex h-10 w-full rounded-md border border-gray-700 bg-gray-800 text-sm px-3 py-2 text-white outline-none focus:border-blue-500 transition-colors">
                    <option>MP4 (Recomendado)</option>
                    <option>MOV (Apple)</option>
                    <option>AVI</option>
                  </select>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 gap-3 pt-4">
             <Button className="w-full bg-gray-800 hover:bg-gray-700 text-white py-6 rounded-2xl border border-gray-700 font-bold transition-all">
                Gerar Prévia ⚡
             </Button>
             <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white py-6 rounded-2xl font-bold shadow-xl shadow-blue-900/20 transition-all transform hover:scale-[1.01] active:scale-100">
                Finalizar e Exportar 🎥
             </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
