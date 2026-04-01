"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { searchYouTubeVideos, YouTubeVideo } from "@/lib/youtube/search-videos";
import { useSelectedVideo } from "@/context/selected-video-context";
import { useBranding } from "@/context/branding-context";
import { useRouter } from "next/navigation";

export default function BuscarCenasPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { setSelectedVideo } = useSelectedVideo();
  const { branding } = useBranding();
  const router = useRouter();

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const videos = await searchYouTubeVideos(query);
      setResults(videos);
    } catch (err: any) {
      console.error(err);
      setError("Erro ao buscar vídeos. Verifique se sua chave da API está correta ou tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const setPresetSearch = (term: string) => {
    setQuery(term);
    setTimeout(() => {
      document.getElementById('search-btn')?.click();
    }, 100);
  };

  const handleSelectVideo = (video: YouTubeVideo) => {
    setSelectedVideo(video);
    router.push("/editor");
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* HEADER SECTION */}
      <div 
        className="rounded-[2.5rem] p-10 md:p-16 text-center shadow-2xl relative overflow-hidden"
        style={{ background: `linear-gradient(to bottom right, ${branding.primaryColor}, ${branding.secondaryColor})` }}
      >
         {/* Efeitos de Fundo */}
         <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
         <div className="absolute bottom-0 left-0 w-80 h-80 bg-black/20 rounded-full blur-[100px] translate-y-1/2 -track-x-1/2 opacity-50"></div>
         
         <div className="relative z-10 space-y-8 max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter drop-shadow-2xl">
               Sua ideia, <span className="opacity-70 italic">nossa cena.</span>
            </h1>
            <p className="text-white/80 text-xl md:text-2xl font-medium max-w-2xl mx-auto leading-relaxed">
               Acesse milhões de cenas cinematográficas instantaneamente para seus projetos em {branding.appName}.
            </p>
            
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 pt-6 max-w-3xl mx-auto">
              <div className="flex-1 relative group">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ex: Batman vs Joker 4k scene..."
                  className="w-full h-16 rounded-2xl text-xl px-8 bg-white border-none shadow-2xl text-gray-900 placeholder:text-gray-400 focus:ring-4 focus:ring-black/10 transition-all font-bold"
                />
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none opacity-0 group-focus-within:opacity-100 transition-opacity">
                   <span className="text-gray-300 transform scale-150">⏎</span>
                </div>
              </div>
              <Button 
                id="search-btn"
                type="submit" 
                disabled={loading || !query.trim()}
                className="h-16 px-10 rounded-2xl bg-black hover:bg-black/80 text-white font-black text-xl transition-all active:scale-95 disabled:opacity-50 shadow-xl"
              >
                {loading ? <span className="animate-spin text-2xl">⏳</span> : "BUSCAR"}
              </Button>
            </form>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
               <span className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em] mr-2">Tendências:</span>
               {["Cyberpunk 2077", "Interstellar Docking", "Fight Club Ending"].map(term => (
                 <button 
                  key={term} 
                  type="button" 
                  onClick={() => setPresetSearch(term)}
                  className="px-4 py-2 bg-black/20 hover:bg-black/40 rounded-xl text-xs font-black text-white transition-all backdrop-blur-md border border-white/10 hover:border-white/30"
                 >
                   {term}
                 </button>
               ))}
            </div>
         </div>
      </div>

      {error && (
        <div className="p-6 bg-red-500/10 text-red-500 rounded-3xl border border-red-500/20 text-center font-black text-sm animate-in zoom-in-95 uppercase tracking-widest">
           ⚠ {error}
        </div>
      )}

      {/* RESULTADOS DA BUSCA */}
      {results.length > 0 && (
        <div className="space-y-8">
          <div className="flex items-end justify-between border-b border-gray-200 dark:border-gray-800 pb-5">
             <div>
                <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Galeria de Resultados</h2>
                <p className="text-gray-500 font-medium text-sm mt-1 uppercase tracking-widest">Encontrados no Banco de Dados YouTube</p>
             </div>
             <span className="px-5 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl text-[10px] font-black border border-gray-200 dark:border-gray-700 tracking-[0.2em]">
               {results.length} CLIPS
             </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {results.map((video) => (
              <div 
                key={video.id} 
                className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl dark:shadow-none transition-all hover:border-primary dark:hover:border-gray-700 flex flex-col cursor-pointer transform hover:-translate-y-2 duration-500"
                onClick={() => handleSelectVideo(video)}
              >
                <div className="aspect-video bg-gray-100 dark:bg-black relative overflow-hidden border-b border-gray-100 dark:border-gray-800">
                  <img 
                    src={video.thumbnail} 
                    alt={video.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                  />
                  {/* Overlay Cinematográfico */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <span 
                      className="px-8 py-4 text-white font-black rounded-2xl transform scale-75 group-hover:scale-100 transition-all shadow-2xl tracking-tighter"
                      style={{ backgroundColor: branding.primaryColor }}
                    >
                       IMPORTAR CENA
                    </span>
                  </div>
                </div>
                
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <h3 className="text-md font-black text-gray-900 dark:text-white line-clamp-2 leading-tight transition-colors" style={{ groupHover: { color: branding.primaryColor } } as any}>
                      {video.title}
                    </h3>
                    <div className="flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: branding.secondaryColor }}></div>
                       <p className="text-[10px] text-gray-500 dark:text-gray-400 font-black uppercase tracking-widest truncate">
                         {video.channelTitle}
                       </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ESTADO VAZIO */}
      {!loading && results.length === 0 && !error && (
         <div className="py-32 text-center opacity-30 flex flex-col items-center select-none animate-in fade-in zoom-in-95">
            <div className="text-9xl mb-8 grayscale">{branding.logo}</div>
            <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight italic">Qual sua visão hoje?</h3>
            <p className="text-gray-500 font-medium text-lg max-w-sm mt-2">Digite o título ou o tema do filme que você deseja editar e deixe a mágica acontecer.</p>
         </div>
      )}
    </div>
  );
}
