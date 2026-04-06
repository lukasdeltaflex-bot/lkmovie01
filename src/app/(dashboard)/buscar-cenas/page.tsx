"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { YouTubeVideo } from "@/lib/youtube/search-videos";
import { useSelectedVideo } from "@/context/selected-video-context";
import { useBranding } from "@/context/branding-context";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { 
  saveSearchQuery, 
  getUserSearchHistory, 
  getNicheSuggestions, 
  SearchRecord 
} from "@/lib/firebase/search";
import { getCachedSearch, saveSearchToCache } from "@/lib/cache/search-cache";
import { canPerformAction } from "@/lib/utils/usage-limits";
import { incrementUserStat } from "@/lib/firebase/user-settings";
import { addFavorite, getUserFavorites, FavoriteVideo } from "@/lib/firebase/favorites";

/**
 * Hook de Debounce customizado para performance de busca
 */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function BuscarCenasPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState<number>(0);
  
  const [history, setHistory] = useState<SearchRecord[]>([]);
  const [favorites, setFavorites] = useState<FavoriteVideo[]>([]);
  const [activeNiche, setActiveNiche] = useState("Cinematic");
  const [showFilters, setShowFilters] = useState(false);
  
  const debouncedQuery = useDebounce(query, 600);
  
  const [filters, setFilters] = useState({
    duration: "any",
    quality: "any",
    date: "any",
    order: "relevance"
  });

  const [isAutomatedMode, setIsAutomatedMode] = useState(false);
  
  const { user } = useAuth();
  const { setClips, setSelectedVideo } = useSelectedVideo();
  const { branding } = useBranding();
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Carregar Histórico e Favoritos
  useEffect(() => {
    if (user) {
      getUserSearchHistory(user.uid).then(setHistory);
      getUserFavorites(user.uid).then(setFavorites);
    }
  }, [user]);

  // Busca Automática com Debounce (Premium Performance)
  useEffect(() => {
    if (debouncedQuery.trim().length > 2 && results.length === 0) {
      handleSearch(undefined, debouncedQuery);
    }
  }, [debouncedQuery]);

  const handleSearch = async (e?: React.FormEvent, customQuery?: string, isLoadMore = false) => {
    e?.preventDefault();
    const baseTerm = customQuery || query;
    if (!baseTerm.trim()) return;

    const searchTerm = baseTerm.trim();

    // Verificação de Limites (SaaS Protection)
    if (branding && user) {
      const { allowed, message } = canPerformAction(branding as any, "search");
      if (!allowed) {
        setError(message || "Limite de busca atingido.");
        return;
      }
    }

    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setResults([]);
      setNextPageToken(null);
      setError(null);
    }

    try {
      const url = new URL("/api/youtube/search", window.location.origin);
      url.searchParams.append("q", searchTerm);
      
      if (filters.duration !== "any") url.searchParams.append("duration", filters.duration);
      if (filters.quality !== "any") url.searchParams.append("quality", filters.quality);
      if (filters.order !== "relevance") url.searchParams.append("order", filters.order);
      
      if (filters.date !== "any") {
        const now = new Date();
        if (filters.date === "week") now.setDate(now.getDate() - 7);
        else if (filters.date === "month") now.setMonth(now.getMonth() - 1);
        else if (filters.date === "year") now.setFullYear(now.getFullYear() - 1);
        url.searchParams.append("publishedAfter", now.toISOString());
      }

      const activeToken = isLoadMore ? nextPageToken : null;
      if (activeToken) {
        url.searchParams.append("pageToken", activeToken);
      }

      const response = await fetch(url.toString());
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro na busca do YouTube.");
      }

      const freshItems = data.items || [];
      
      if (isLoadMore) {
        setResults(prev => {
           // Evita duplicados comparando IDs
           const existingIds = new Set(prev.map(v => v.id));
           const uniqueNewItems = freshItems.filter((v: YouTubeVideo) => !existingIds.has(v.id));
           return [...prev, ...uniqueNewItems];
        });
      } else {
        setResults(freshItems);
        // Modo automÃ¡tico se ativado
        if (isAutomatedMode && freshItems.length > 0) {
           const topClips = freshItems.slice(0, 5).map((v: any) => ({ ...v, zoom: 100 }));
           setClips(topClips);
           router.push("/editor?mode=auto");
           return;
        }
      }
      
      setNextPageToken(data.nextPageToken || null);
      setTotalResults(data.totalResults || 0);
      
      if (user && !isLoadMore) {
        // Atualizar Uso e Analytics (SaaS Metrics)
        await Promise.all([
          saveSearchQuery(user.uid, searchTerm),
          incrementUserStat(user.uid, "usage.searchesCount"),
          incrementUserStat(user.uid, "analytics.totalSearches")
        ]);
        getUserSearchHistory(user.uid).then(setHistory);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro na API do YouTube. Verifique sua chave ou limite de quota.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setError(null);
    setLoading(false);
    setLoadingMore(false);
    setNextPageToken(null);
    setTotalResults(0);
    if (searchInputRef.current) searchInputRef.current.focus();
  };

  const setPresetSearch = (term: string) => {
    setQuery(term);
    handleSearch(undefined, term);
  };

  const handleSelectVideo = (video: YouTubeVideo) => {
    setSelectedVideo(video);
    router.push("/editor");
  };

  const handleToggleFavorite = async (e: React.MouseEvent, video: YouTubeVideo) => {
    e.stopPropagation();
    if (!user) return;
    try {
      await addFavorite(user.uid, video);
      const favs = await getUserFavorites(user.uid);
      setFavorites(favs);
    } catch (error) {
      console.error("Erro ao favoritar:", error);
    }
  };

  const suggestions = getNicheSuggestions();

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 px-4 md:px-0">
      
      {/* HEADER BUSCA */}
      <div 
        className="rounded-4xl p-8 md:p-16 text-center shadow-2xl relative overflow-hidden backdrop-blur-3xl border border-white/10"
        style={{ background: `linear-gradient(135deg, ${branding.primaryColor} 0%, ${branding.secondaryColor} 100%)` }}
      >
         <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
         
         <div className="relative z-10 space-y-8 max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter drop-shadow-xl leading-tight">
               Descubra as Melhores <br/><span className="text-black/30">Cenas para seu Vídeo</span>
            </h1>
            
            <form onSubmit={(e) => handleSearch(e)} className="flex flex-col sm:flex-row gap-3 pt-4 max-w-2xl mx-auto">
              <div className="flex-1 relative">
                <Input
                  ref={searchInputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="O que você quer criar hoje?..."
                  className="w-full h-16 rounded-2xl text-lg px-8 bg-white border-none shadow-xl text-gray-900 placeholder:text-gray-400 focus:ring-4 focus:ring-white/30 transition-all font-bold"
                />
                {query && (
                  <button 
                    type="button"
                    onClick={handleClear}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-600 rounded-full transition-all"
                  >✕</button>
                )}
              </div>
              <Button 
                type="submit" 
                disabled={loading || !query.trim()}
                className="h-16 px-10 rounded-2xl bg-black hover:bg-gray-900 text-white font-black text-lg transition-all active:scale-95 disabled:opacity-50 shadow-xl"
              >
                {loading ? "BUSCANDO..." : "BUSCAR 🚀"}
              </Button>
            </form>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
              <span className="text-[10px] font-black text-white/50 uppercase tracking-widest mr-2">Sugestões:</span>
              {["Cinematic Sky", "Hyperlapse City", "Drone Nature", "Abstract 4k"].map(term => (
                <button 
                  key={term}
                  onClick={() => setPresetSearch(term)}
                  className="px-4 py-2 bg-black/10 hover:bg-black/20 rounded-xl text-[10px] font-black text-white transition-all border border-white/5"
                >{term}</button>
              ))}
            </div>
         </div>
      </div>

      {error && (
        <div className="p-6 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-2xl border border-red-100 dark:border-red-500/20 text-center font-bold text-sm mx-auto max-w-2xl">
           🚨 {error}
        </div>
      )}

      {/* RESULTADOS */}
      {(loading || results.length > 0) && (
        <div className="space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-6">
             <div className="space-y-1">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-widest uppercase italic">Cenas Encontradas</h2>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                   {results.length} resultados exibidos de {totalResults.toLocaleString()} totais
                </span>
             </div>
             <Button 
              variant="outline" 
              className="px-6 h-10 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all" 
              onClick={handleClear}
            >LIMPAR TUDO</Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {loading && results.length === 0 ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-video rounded-2xl" />
                  <Skeleton className="h-4 w-3/4 rounded-md" />
                  <Skeleton className="h-3 w-1/2 rounded-md" />
                </div>
              ))
            ) : (
              results.map((video) => {
                const isFav = favorites.some(f => f.videoId === video.id);
                return (
                  <div 
                    key={video.id} 
                    className="group bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition-all flex flex-col cursor-pointer transform hover:-translate-y-2 duration-300 relative"
                    onClick={() => handleSelectVideo(video)}
                  >
                    <div className="aspect-video relative overflow-hidden bg-gray-100 dark:bg-black">
                      <img 
                        src={video.thumbnail} 
                        alt={video.title} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                         <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-black text-xl shadow-2xl scale-50 group-hover:scale-100 transition-transform duration-300">▶</div>
                      </div>
                      
                      <button 
                        onClick={(e) => handleToggleFavorite(e, video)}
                        className={`absolute top-4 right-4 w-10 h-10 rounded-xl flex items-center justify-center backdrop-blur-md transition-all shadow-xl z-20 ${isFav ? 'bg-red-500 text-white' : 'bg-black/20 text-white hover:bg-white hover:text-red-500'}`}
                      >
                         {isFav ? "❤️" : "🤍"}
                      </button>
                    </div>
                    
                    <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                      <h3 className="text-sm font-black text-gray-900 dark:text-white line-clamp-2 leading-tight">{video.title}</h3>
                      <div className="flex items-center justify-between opacity-60">
                         <span className="text-[9px] font-black uppercase tracking-widest truncate max-w-[120px]">{video.channel}</span>
                         <span className="text-[9px] font-black text-blue-500 uppercase">4K / UHD</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            
            {loadingMore && Array.from({ length: 4 }).map((_, i) => (
              <div key={`more-${i}`} className="space-y-3">
                <Skeleton className="aspect-video rounded-2xl" />
                <Skeleton className="h-4 w-3/4 rounded-md" />
              </div>
            ))}
          </div>

          {nextPageToken && !loading && (
            <div className="flex justify-center pt-8">
               <Button 
                variant="secondary"
                onClick={() => handleSearch(undefined, undefined, true)}
                disabled={loadingMore}
                className="px-10 h-16 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-105 transition-all"
               >
                 {loadingMore ? "CARREGANDO..." : "CARREGAR MAIS CENAS 🔥"}
               </Button>
            </div>
          )}
        </div>
      )}

      {/* ESTADO VAZIO */}
      {!loading && results.length === 0 && !error && (
         <div className="py-32 text-center flex flex-col items-center select-none animate-in fade-in duration-1000">
            <div className="w-24 h-24 bg-gray-50 dark:bg-gray-900 rounded-3xl items-center justify-center flex text-4xl mb-6 shadow-inner border border-gray-100 dark:border-gray-800">🔍</div>
            <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-widest uppercase italic">Busca Ativa</h3>
            <p className="text-gray-400 font-bold text-sm max-w-xs mt-4">Navegue por nossa biblioteca global e encontre a cena perfeita para sua produção cinematográfica.</p>
         </div>
      )}
    </div>
  );
}
