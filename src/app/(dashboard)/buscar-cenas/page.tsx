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
import { AutoVideoModal } from "@/components/dashboard/AutoVideoModal";
import { 
  saveSearchQuery, 
  getUserSearchHistory, 
  getNicheSuggestions, 
  SearchRecord 
} from "@/lib/firebase/search";
import { canPerformAction } from "@/lib/utils/usage-limits";
import { incrementUserStat } from "@/lib/firebase/user-settings";
import { addFavorite, getUserFavorites, FavoriteVideo } from "@/lib/firebase/favorites";

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
  const [showFilters, setShowFilters] = useState(false);
  const [showAutoModal, setShowAutoModal] = useState(false);
  
  const debouncedQuery = useDebounce(query, 600);
  
  const [filters, setFilters] = useState({
    duration: "any",
    quality: "any",
    date: "any",
    order: "relevance"
  });

  const { user } = useAuth();
  const { setSelectedVideo } = useSelectedVideo();
  const { branding } = useBranding();
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      getUserSearchHistory(user.uid).then(setHistory);
      getUserFavorites(user.uid).then(setFavorites);
    }
  }, [user]);

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
      if (activeToken) url.searchParams.append("pageToken", activeToken);

      const response = await fetch(url.toString());
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Erro na busca.");

      const freshItems = data.items || [];
      
      if (isLoadMore) {
        setResults(prev => {
           const existingIds = new Set(prev.map(v => v.id));
           const uniqueNewItems = freshItems.filter((v: YouTubeVideo) => !existingIds.has(v.id));
           return [...prev, ...uniqueNewItems];
        });
      } else {
        setResults(freshItems);
      }
      
      setNextPageToken(data.nextPageToken || null);
      setTotalResults(data.totalResults || 0);
      
      if (user && !isLoadMore) {
        await Promise.all([
          saveSearchQuery(user.uid, searchTerm),
          incrementUserStat(user.uid, "usage.searchesCount"),
          incrementUserStat(user.uid, "analytics.totalSearches")
        ]);
        getUserSearchHistory(user.uid).then(setHistory);
      }
    } catch (err: any) {
      setError(err.message || "Erro na API do YouTube.");
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

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 px-4">
      {showAutoModal && <AutoVideoModal onClose={() => setShowAutoModal(false)} />}
      
      {/* HEADER BUSCA */}
      <div 
        className="rounded-[3rem] p-8 md:p-16 text-center shadow-2xl relative overflow-hidden backdrop-blur-3xl border border-white/5"
        style={{ background: `linear-gradient(135deg, ${branding.primaryColor} 0%, ${branding.secondaryColor} 100%)` }}
      >
         <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
         
         <div className="relative z-10 space-y-10 max-w-4xl mx-auto">
            <div className="space-y-4">
               <h1 className="text-4xl md:text-7xl font-black text-white tracking-tighter drop-shadow-2xl leading-[0.9]">
                  BUSQUE OU <span className="text-black/20 italic">GERAR VIRAL AI</span>
               </h1>
               <p className="text-white/60 font-black text-xs uppercase tracking-[0.3em] italic">Acesse o maior banco de cenas cinematográficas do mundo</p>
            </div>
            
            <div className="flex flex-col gap-6 pt-4">
               {/* BARRA DE BUSCA PRINCIPAL */}
               <form onSubmit={(e) => handleSearch(e)} className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto w-full">
                  <div className="flex-1 relative">
                    <Input
                      ref={searchInputRef}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Busque cenas épicas..."
                      className="w-full h-20 rounded-3xl text-lg px-8 bg-white border-none shadow-2xl text-gray-900 placeholder:text-gray-400 focus:ring-4 focus:ring-white/30 transition-all font-bold"
                    />
                    {query && (
                      <button 
                        type="button"
                        onClick={handleClear}
                        className="absolute right-6 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-600 rounded-full transition-all"
                      >✕</button>
                    )}
                  </div>
                  <Button 
                    type="submit" 
                    disabled={loading || !query.trim()}
                    className="h-20 px-12 rounded-3xl bg-black hover:bg-gray-900 text-white font-black text-lg transition-all active:scale-95 disabled:opacity-50 shadow-2xl"
                  >
                    {loading ? "BUSCANDO..." : "BUSCAR 🔥"}
                  </Button>
               </form>

               {/* BOTÃƒO DE GERAÃ‡ÃƒO MÃGICA AI */}
               <div className="flex justify-center">
                  <button 
                     onClick={() => setShowAutoModal(true)}
                     className="group flex items-center gap-4 px-10 py-5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full transition-all hover:scale-105 active:scale-95"
                  >
                     <span className="text-2xl animate-pulse">🪄</span>
                     <div className="text-left">
                        <p className="text-[10px] font-black text-white uppercase tracking-widest leading-none">Modo Viral AI</p>
                        <p className="text-xs font-black text-white italic mt-1 uppercase">Transformar ideia em vídeo pronto ➔</p>
                     </div>
                  </button>
               </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              {["Cinematic Sky", "Hyperlapse City", "Drone Nature", "Abstract 4k", "Motivation Jordan Peterson"].map(term => (
                <button 
                  key={term}
                  onClick={() => { setQuery(term); handleSearch(undefined, term); }}
                  className="px-5 py-3 bg-white/5 hover:bg-white/20 rounded-2xl text-[10px] font-black text-white transition-all border border-white/10"
                >{term}</button>
              ))}
            </div>
         </div>
      </div>

      {error && (
        <div className="p-8 bg-red-600/10 border border-red-600/20 text-red-500 rounded-3xl text-center font-black uppercase tracking-widest text-xs mx-auto max-w-2xl italic">
           🚨 {error}
        </div>
      )}

      {/* RESULTADOS */}
      {(loading || results.length > 0) && (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-5 duration-700">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
             <div className="space-y-2">
                <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">Cenas Filtradas</h2>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{results.length} EXIBIDAS</span>
                  <div className="w-1 h-1 rounded-full bg-gray-800"></div>
                  <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">{totalResults.toLocaleString()} TOTAIS</span>
                </div>
             </div>
             <Button variant="ghost" className="h-12 px-8 text-[10px] font-black text-red-500 uppercase tracking-widest hover:bg-red-500/10" onClick={handleClear}>LIMPAR BUSCA</Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {loading && results.length === 0 ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="aspect-video rounded-3xl" />
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
                    className="group bg-[#0d0d0d] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl hover:border-blue-500/50 transition-all flex flex-col cursor-pointer transform hover:-translate-y-2 duration-500 relative"
                    onClick={() => handleSelectVideo(video)}
                  >
                    <div className="aspect-video relative overflow-hidden bg-black">
                      <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 opacity-60 group-hover:opacity-100" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-60"></div>
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                         <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-black text-2xl shadow-2xl scale-50 group-hover:scale-100 transition-all">▶</div>
                      </div>
                      <button 
                        onClick={(e) => handleToggleFavorite(e, video)}
                        className={`absolute top-6 right-6 w-12 h-12 rounded-2xl flex items-center justify-center backdrop-blur-3xl transition-all shadow-2xl z-20 ${isFav ? 'bg-red-500 text-white' : 'bg-black/40 text-white hover:bg-white hover:text-red-500'}`}
                      >
                         {isFav ? "❤️" : "🤍"}
                      </button>
                    </div>
                    <div className="p-8 space-y-4">
                      <h3 className="text-sm font-black text-white line-clamp-2 leading-[1.3] uppercase italic tracking-tighter">{video.title}</h3>
                      <div className="flex items-center justify-between border-t border-white/5 pt-4">
                         <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest truncate max-w-[120px]">{video.channel}</span>
                         <span className="px-2 py-1 bg-blue-500/10 text-blue-500 text-[8px] font-black rounded-lg uppercase">HQ / 4K</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {nextPageToken && !loading && (
            <div className="flex justify-center pt-12">
               <Button 
                variant="secondary"
                onClick={() => handleSearch(undefined, undefined, true)}
                disabled={loadingMore}
                className="px-12 h-20 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-[0_0_30px_rgba(255,255,255,0.05)] hover:scale-105 transition-all bg-white text-black"
               >
                 {loadingMore ? "CARREGANDO..." : "CARREGAR GALERIA ➔"}
               </Button>
            </div>
          )}
        </div>
      )}

      {!loading && results.length === 0 && !error && (
         <div className="py-40 text-center flex flex-col items-center select-none animate-in fade-in duration-1000">
            <div className="w-28 h-28 bg-white/5 rounded-[2.5rem] items-center justify-center flex text-4xl mb-8 border border-white/5 shadow-inner">🔍</div>
            <h3 className="text-4xl font-black text-white tracking-widest uppercase italic">Inicie sua busca</h3>
            <p className="text-gray-500 font-bold text-sm max-w-xs mt-6 uppercase tracking-widest leading-relaxed opacity-60">Encontre visuais que <br/> definem a próxima tendência viral.</p>
         </div>
      )}
    </div>
  );
}
