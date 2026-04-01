"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { searchYouTubeVideos } from "@/lib/youtube-service";
import { useSelectedVideo } from "@/context/selected-video-context";
import { useRouter } from "next/navigation";
import { YouTubeVideo } from "@/types/video";

export default function BuscarCenasPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { setSelectedVideo } = useSelectedVideo();
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
    // Para UX rápida, agendamos o handleSearch para rodar logo após o state update
    setTimeout(() => {
      // Como o formEvent depende do botão, podemos forçar assim:
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
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 dark:from-gray-900 dark:to-gray-800 rounded-3xl p-8 md:p-12 text-center shadow-2xl relative overflow-hidden">
         {/* Efeitos de Fundo */}
         <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 dark:bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
         <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 dark:bg-purple-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
         
         <div className="relative z-10 space-y-6 max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight drop-shadow-sm">
               Encontre a cena perfeita
            </h1>
            <p className="text-blue-100 dark:text-gray-300 text-lg md:text-xl font-medium">
               Busque por momentos épicos, diálogos marcantes ou cenas de filmes famosos no YouTube.
            </p>
            
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 pt-4">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ex: Superman vs Batman fight scene 4k..."
                className="flex-1 h-14 rounded-2xl text-lg px-6 bg-white dark:bg-gray-900 border-none shadow-inner text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-4 focus:ring-blue-400/50 transition-all font-medium"
              />
              <Button 
                id="search-btn"
                type="submit" 
                disabled={loading || !query.trim()}
                className="h-14 px-8 rounded-2xl bg-gray-900 dark:bg-blue-600 hover:bg-black dark:hover:bg-blue-500 text-white font-black text-lg transition-transform active:scale-95 disabled:opacity-50"
              >
                {loading ? <span className="animate-spin">⏳</span> : "Pesquisar 🔍"}
              </Button>
            </form>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
               <span className="text-xs font-bold text-blue-200 dark:text-gray-400 uppercase tracking-widest mr-2">Sugestões:</span>
               {["Matrix bullet dodge", "Inception hallway fight", "Joker stairs dance"].map(term => (
                 <button 
                  key={term} 
                  type="button" 
                  onClick={() => setPresetSearch(term)}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 dark:bg-black/20 dark:hover:bg-gray-800 rounded-full text-xs font-medium text-white transition-colors backdrop-blur-sm border border-white/10"
                 >
                   {term}
                 </button>
               ))}
            </div>
         </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-900/50 text-center font-bold animate-in fade-in">
          {error}
        </div>
      )}

      {/* RESULTADOS DA BUSCA */}
      {results.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-800 pb-3">
             <h2 className="text-2xl font-black text-gray-900 dark:text-white">Resultados Encontrados</h2>
             <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg text-xs font-bold">{results.length} VÍDEOS</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {results.map((video) => (
              <div 
                key={video.id} 
                className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-md hover:shadow-2xl dark:shadow-none transition-all hover:border-blue-500 dark:hover:border-gray-600 flex flex-col cursor-pointer"
                onClick={() => handleSelectVideo(video)}
              >
                <div className="aspect-video bg-gray-100 dark:bg-black relative overflow-hidden">
                  <img 
                    src={video.thumbnail} 
                    alt={video.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Overlay Escuro com Botão no Hover */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <span className="px-6 py-3 bg-blue-600 text-white font-black rounded-xl transform scale-90 group-hover:scale-100 transition-transform shadow-2xl">
                       Selecionar Cena
                    </span>
                  </div>
                </div>
                
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {video.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-medium">
                      {video.channelTitle}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ESTADO VAZIO APÓS BUSCA OU INICIAL */}
      {!loading && results.length === 0 && !error && (
         <div className="py-20 text-center opacity-50 flex flex-col items-center select-none">
            <div className="text-8xl mb-6 filter grayscale">🍿</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">O que vamos editar hoje?</h3>
            <p className="text-gray-500 font-medium">Use a barra de pesquisa acima para encontrar um vídeo base.</p>
         </div>
      )}
    </div>
  );
}
