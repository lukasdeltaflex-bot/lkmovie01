"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useSelectedVideo } from "@/context/selected-video-context";
import { YouTubeVideo as VideoType } from "@/types/video";

interface SearchResult {
  originalText: string;
  optimizedQuery: string;
}

export default function BuscarCenasPage() {
  const [searchText, setSearchText] = useState("");
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isSearchingVideos, setIsSearchingVideos] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [videos, setVideos] = useState<VideoType[]>([]);
  
  const { setSelectedVideo } = useSelectedVideo();
  const router = useRouter();

  const handleOptimize = async () => {
    if (!searchText.trim()) return;

    setIsOptimizing(true);
    setResult(null);
    setVideos([]);

    try {
      const response = await fetch("/api/ai/search-query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: searchText }),
      });

      if (!response.ok) throw new Error("Falha na otimização");

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error(error);
      alert("Erro ao realizar busca inteligente.");
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleSearchVideos = async () => {
    if (!result?.optimizedQuery) return;

    setIsSearchingVideos(true);

    try {
      const response = await fetch(`/api/youtube/search?q=${encodeURIComponent(result.optimizedQuery)}`);
      
      if (!response.ok) throw new Error("Falha ao buscar vídeos");

      const data = await response.json();
      setVideos(data);
    } catch (error) {
      console.error(error);
      alert("Erro ao buscar vídeos no YouTube.");
    } finally {
      setIsSearchingVideos(false);
    }
  };

  const onSelectVideo = (video: VideoType) => {
    setSelectedVideo(video);
    router.push("/video");
  };

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div>
        <h1 className="text-3xl font-bold mb-2">Buscar Cenas</h1>
        <p className="text-gray-400">Encontre a cena perfeita para o seu projeto através da nossa IA.</p>
      </div>
      
      <div className="flex gap-4">
        <Input 
          type="text" 
          placeholder="Ex: Coringa dançando na escada..." 
          className="flex-1" 
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleOptimize()}
        />
        <Button onClick={handleOptimize} disabled={isOptimizing}>
          {isOptimizing ? "Otimizando..." : "Gerar Query"}
        </Button>
      </div>

      <div className="flex-1 space-y-8 overflow-y-auto pr-2">
        {result && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-green-400 text-sm font-semibold uppercase mb-1">Query Otimizada</h3>
                <p className="text-2xl font-bold text-white">"{result.optimizedQuery}"</p>
              </div>
              <Button onClick={handleSearchVideos} disabled={isSearchingVideos}>
                {isSearchingVideos ? "Buscando..." : "Buscar Vídeos"}
              </Button>
            </div>
          </div>
        )}

        {videos.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
            {videos.map((video) => (
              <div key={video.id} className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden flex flex-col hover:border-blue-500/50 transition-colors">
                <img src={video.thumbnail} alt={video.title} className="w-full aspect-video object-cover" />
                <div className="p-4 flex-1 flex flex-col gap-3">
                  <h4 className="font-medium text-white line-clamp-2" dangerouslySetInnerHTML={{ __html: video.title }}></h4>
                  <p className="text-xs text-gray-500 mt-auto">{video.channelTitle}</p>
                  <Button variant="outline" className="w-full text-xs h-8" onClick={() => onSelectVideo(video)}>
                    Selecionar Cena
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!result && !isOptimizing && (
          <div className="h-64 border-2 border-dashed border-gray-800 rounded-lg flex items-center justify-center text-gray-500">
            Digite um termo para começar
          </div>
        )}

        {result && videos.length === 0 && !isSearchingVideos && (
          <div className="h-64 border-2 border-dashed border-gray-800 rounded-lg flex flex-col items-center justify-center text-gray-500 gap-2">
            <span className="text-3xl">🏜️</span>
            <p>Nenhum vídeo encontrado para "{result.optimizedQuery}"</p>
            <Button variant="outline" onClick={() => setResult(null)} className="mt-2">Tentar outro termo</Button>
          </div>
        )}
      </div>
    </div>
  );
}
