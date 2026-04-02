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

export default function BuscarCenasPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState<number>(0);
  
  const [history, setHistory] = useState<SearchRecord[]>([]);
  const [activeNiche, setActiveNiche] = useState("Cinematic");
  const [showFilters, setShowFilters] = useState(false);
  
  // FILTERS STATE
  const [filters, setFilters] = useState({
    duration: "any",
    quality: "any",
    date: "any",
    order: "relevance"
  });

  const [isAutomatedMode, setIsAutomatedMode] = useState(false);
  
  const { user } = useAuth();
  const { setClips, setActiveClipIndex, setSelectedVideo } = useSelectedVideo();
  const { branding } = useBranding();
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Carregar Histórico
  useEffect(() => {
    if (user) {
      getUserSearchHistory(user.uid).then(setHistory);
    }
  }, [user]);

  const handleSearch = async (e?: React.FormEvent, customQuery?: string, isLoadMore = false) => {
    e?.preventDefault();
    const baseTerm = customQuery || query;
    if (!baseTerm.trim()) return;

    // Multi-query automática para maximizar relevância e volume
    const enhancedQuery = `(${baseTerm}) | (${baseTerm} 4k) | (${baseTerm} cinematic) | (${baseTerm} no text)`;

    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setResults([]);
      setNextPageToken(null);
    }
    setError(null);

    try {
      // 1. Verificar Cache
      const cached = getCachedSearch(enhancedQuery, filters);
      let data;
      
      if (cached && !isLoadMore) {
        data = cached;
      } else {
        const url = new URL("/api/youtube/search", window.location.origin);
        url.searchParams.append("q", enhancedQuery);
        
        // Filtros
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

        if (isLoadMore && nextPageToken) {
          url.searchParams.append("pageToken", nextPageToken);
        }

        const response = await fetch(url.toString());
        data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Erro ao buscar vídeos reais no YouTube.");
        }
        
        // 2. Salvar em Cache
        if (!isLoadMore) saveSearchToCache(enhancedQuery, filters, data);
      }

      const items = data.items;
      if (isLoadMore) {
        setResults(prev => [...prev, ...items]);
      } else {
        setResults(items);
        
        // 3. MODO AUTOMÁTICO: Selecionar 5 cenas e ir para o editor
        if (isAutomatedMode && items.length > 0) {
           const topClips = items.slice(0, 5).map((v: any) => ({ ...v, zoom: 100 }));
           setClips(topClips);
           router.push("/editor?mode=auto");
           return;
        }
      }
      
      setNextPageToken(data.nextPageToken || null);
      setTotalResults(data.totalResults || 0);
      
      if (user && !isLoadMore) {
        await saveSearchQuery(user.uid, baseTerm);
        getUserSearchHistory(user.uid).then(setHistory);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro inesperado na busca. Verifique sua conexão e chave de API.");
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

  const suggestions = getNicheSuggestions();

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* HEADER SECTION - ULTRA PREMIUM SaaS */}
      <div 
        className="rounded-4xl p-10 md:p-16 text-center shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] relative overflow-hidden backdrop-blur-3xl border border-white/10"
        style={{ background: `linear-gradient(135deg, ${branding.primaryColor} 0%, ${branding.secondaryColor} 100%)` }}
      >
         <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/10 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/2"></div>
         <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-black/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2"></div>
         
         <div className="relative z-10 space-y-10 max-w-5xl mx-auto">
            <div className="inline-flex items-center gap-3 px-6 py-2 bg-black/30 backdrop-blur-md rounded-full border border-white/10 text-[10px] font-black text-white uppercase tracking-[0.4em] animate-bounce">
               ✨ AI-Powered Scene Discovery
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter drop-shadow-2xl leading-none">
               Imagine sua <br/><span className="text-black/40 italic">melhor cena.</span>
            </h1>
            
            <form onSubmit={(e) => handleSearch(e)} className="flex flex-col sm:flex-row gap-4 pt-6 max-w-3xl mx-auto">
              <div className="flex-1 relative group">
                <Input
                  ref={searchInputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ex: Cyberpunk 2077 Night City 4k..."
                  className="w-full h-20 rounded-3xl text-xl px-10 bg-white/95 border-none shadow-2xl text-gray-900 placeholder:text-gray-400 focus:ring-8 focus:ring-white/20 transition-all font-bold"
                />
                {query && (
                  <button 
                    type="button"
                    onClick={handleClear}
                    className="absolute right-6 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-full transition-all"
                  >
                    ✕
                  </button>
                )}
              </div>
                <Button 
                type="submit" 
                disabled={loading || !query.trim()}
                className="h-20 px-12 rounded-3xl bg-black hover:bg-gray-900 text-white font-black text-xl transition-all active:scale-95 disabled:opacity-50 shadow-2xl group flex items-center gap-3"
              >
                {loading ? <span className="animate-spin text-2xl">⏳</span> : <span>BUSCAR 🚀</span>}
              </Button>
            </form>

            {/* MODO AUTOMÁTICO TOGGLE */}
            <div className="flex items-center justify-center gap-4 pt-2">
               <span className={`text-[10px] font-black uppercase tracking-widest ${!isAutomatedMode ? 'text-white' : 'text-white/40'}`}>Manual</span>
               <button 
                onClick={() => setIsAutomatedMode(!isAutomatedMode)}
                className={`w-14 h-8 rounded-full relative transition-all ${isAutomatedMode ? 'bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.5)]' : 'bg-white/20'}`}
               >
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-xl ${isAutomatedMode ? 'left-7' : 'left-1'}`}></div>
               </button>
               <span className={`text-[10px] font-black uppercase tracking-widest ${isAutomatedMode ? 'text-green-400' : 'text-white/40'}`}>Modo IA Automático 🤖</span>
            </div>

            {/* Sugestões de Nicho */}
            <div className="space-y-6 pt-4">
               <div className="flex flex-wrap items-center justify-center gap-3">
                  <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.4em]">Explorer:</span>
                  {suggestions.map(niche => (
                    <button 
                      key={niche.label}
                      onClick={() => setActiveNiche(niche.label)}
                      className={`px-6 py-2 rounded-2xl text-[10px] font-black transition-all border ${activeNiche === niche.label ? 'bg-white text-gray-900 border-white shadow-lg' : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'}`}
                    >
                      {niche.label}
                    </button>
                  ))}
               </div>
               
               <div className="flex flex-wrap items-center justify-center gap-3 min-h-[50px]">
                  {suggestions.find(n => n.label === activeNiche)?.terms.map(term => (
                    <button 
                      key={term} 
                      type="button"
                      onClick={() => setPresetSearch(term)}
                      className="px-5 py-3 bg-black/20 hover:bg-black/40 rounded-2xl text-xs font-black text-white transition-all backdrop-blur-xl border border-white/5 shadow-xl active:scale-95"
                    >
                      {term}
                    </button>
                  ))}
               </div>
            </div>

            {/* BARRA DE FILTROS AVANÇADOS */}
            <div className="pt-6">
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 mx-auto px-6 py-3 bg-white/10 hover:bg-white/20 rounded-2xl text-[10px] font-black text-white uppercase tracking-[0.3em] transition-all border border-white/10"
                >
                  <span>{showFilters ? '▲ Ocultar Filtros' : '▼ Busca Avançada'}</span>
                  {Object.values(filters).some(v => v !== 'any' && v !== 'relevance') && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>}
                </button>

                {showFilters && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 p-6 bg-black/40 backdrop-blur-3xl rounded-[2rem] border border-white/5 animate-in slide-in-from-top-4 duration-500">
                      <FilterGroup label="Duração" value={filters.duration} onChange={(v) => setFilters(f => ({...f, duration: v}))} options={[
                        { label: 'Qualquer', value: 'any' },
                        { label: 'Curto (<4m)', value: 'short' },
                        { label: 'Médio (4-20m)', value: 'medium' },
                        { label: 'Longo (>20m)', value: 'long' },
                      ]} />
                      <FilterGroup label="Qualidade" value={filters.quality} onChange={(v) => setFilters(f => ({...f, quality: v}))} options={[
                        { label: 'Qualquer', value: 'any' },
                        { label: 'Somente HD', value: 'high' },
                      ]} />
                      <FilterGroup label="Data" value={filters.date} onChange={(v) => setFilters(f => ({...f, date: v}))} options={[
                        { label: 'Sempre', value: 'any' },
                        { label: 'Última Semana', value: 'week' },
                        { label: 'Último Mês', value: 'month' },
                        { label: 'Último Ano', value: 'year' },
                      ]} />
                      <FilterGroup label="Ordem" value={filters.order} onChange={(v) => setFilters(f => ({...f, order: v}))} options={[
                        { label: 'Relevância', value: 'relevance' },
                        { label: 'Data', value: 'date' },
                        { label: 'Vistas', value: 'viewCount' },
                        { label: 'Rating', value: 'rating' },
                      ]} />
                  </div>
                )}
            </div>
         </div>
      </div>

      {error && (
        <div className="p-8 bg-red-500/10 text-red-500 rounded-4xl border border-red-500/20 text-center font-black text-sm flex items-center justify-center gap-3 animate-shake">
           <span>🚨</span> {error}
        </div>
      )}

      {/* RESULTADOS DA BUSCA */}
      {(loading || results.length > 0) && (
        <div className="space-y-10 animate-in fade-in duration-700">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-100 dark:border-gray-800 pb-8">
             <div className="space-y-2">
                <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic">Resultados</h2>
                <div className="flex items-center gap-3">
                   <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 rounded-full border border-green-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                      <span className="text-[10px] font-black text-green-600 dark:text-green-400 uppercase tracking-widest">Connect: API v3</span>
                   </div>
                   <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Visualizando {results.length} {results.length === 1 ? 'cena' : 'cenas'} {totalResults > 0 && `de ~${totalResults.toLocaleString()}`}
                   </span>
                </div>
             </div>
             <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="rounded-2xl px-6 py-3 text-[10px] h-auto font-black shadow-sm" 
                  onClick={handleClear}
                >
                  LIMPAR TUDO
                </Button>
             </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {loading && results.length === 0 ? (
              // SKELETON LOADING
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="aspect-video rounded-3xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-full rounded-lg" />
                    <Skeleton className="h-4 w-1/2 rounded-lg" />
                  </div>
                </div>
              ))
            ) : (
              results.map((video, idx) => (
                <div 
                  key={`${video.id}-${idx}`} 
                  className="group bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-4xl overflow-hidden shadow-2xl hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] transition-all flex flex-col cursor-pointer transform hover:-translate-y-3 duration-500 relative"
                  onClick={() => handleSelectVideo(video)}
                >
                  <div className="aspect-video bg-gray-100 dark:bg-black relative overflow-hidden">
                    <img 
                      src={video.thumbnail} 
                      alt={video.title} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 opacity-90 group-hover:opacity-100" 
                      loading="lazy"
                    />
                    <div className="absolute top-4 right-4 z-10">
                       <span className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-[8px] font-black text-white uppercase tracking-widest border border-white/10">Ultra HD</span>
                    </div>
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-center gap-4 backdrop-blur-[2px]">
                      <div 
                        className="w-14 h-14 rounded-full flex items-center justify-center text-white text-2xl shadow-2xl border border-white/20 transform scale-50 group-hover:scale-100 transition-all duration-500"
                        style={{ backgroundColor: branding.primaryColor }}
                      >
                        ▶
                      </div>
                      <span className="text-[10px] font-black text-white uppercase tracking-[0.3em] animate-in slide-in-from-bottom-2 duration-500">Selecionar Cena</span>
                    </div>
                  </div>
                  
                  <div className="p-7 flex-1 flex flex-col justify-between space-y-6">
                    <h3 
                      className="text-lg font-black text-gray-900 dark:text-white line-clamp-2 leading-tight transition-colors"
                      onMouseEnter={(e) => e.currentTarget.style.color = branding.primaryColor}
                      onMouseLeave={(e) => e.currentTarget.style.color = ''}
                    >
                      {video.title}
                    </h3>
                    <div className="flex items-center justify-between border-t border-gray-50 dark:border-gray-800 pt-4">
                       <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest truncate max-w-[140px]">
                         {video.channel}
                       </span>
                       <div className="flex items-center gap-2">
                          <span className="text-[8px] font-black text-blue-500 uppercase">Live Index</span>
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-50 dark:bg-black border border-gray-100 dark:border-gray-800 text-[10px] font-bold transition-all"
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = branding.primaryColor;
                              e.currentTarget.style.color = 'white';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '';
                              e.currentTarget.style.color = '';
                            }}
                          >
                             4K
                          </div>
                       </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* LOAD MORE */}
          {nextPageToken && (
            <div className="flex justify-center pt-10">
               <Button 
                variant="secondary"
                onClick={() => handleSearch(undefined, undefined, true)}
                disabled={loadingMore}
                className="px-14 h-20 rounded-3xl font-black text-xl shadow-2xl transition-all flex items-center gap-4"
               >
                 {loadingMore ? (
                   <>
                    <span className="animate-spin text-2xl">⏳</span>
                    <span>CARREGANDO...</span>
                   </>
                 ) : (
                   <>
                    <span>CARREGAR MAIS CENAS</span>
                    <span className="text-2xl">🔥</span>
                   </>
                 )}
               </Button>
            </div>
          )}
        </div>
      )}

      {/* ESTADO VAZIO */}
      {!loading && results.length === 0 && !error && (
         <div className="py-40 text-center flex flex-col items-center opacity-40 select-none animate-in fade-in zoom-in-95 duration-1000">
            <div 
              className="w-40 h-40 bg-gray-100 dark:bg-gray-900 rounded-[3rem] items-center justify-center flex text-8xl mb-8 shadow-inner grayscale animate-pulse border-4 border-transparent"
              style={{ borderColor: `${branding.primaryColor}10` }}
            >
               {branding.logo || '🔍'}
            </div>
            <h3 className="text-5xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic">Ready to create?</h3>
            <p className="text-gray-500 dark:text-gray-400 font-bold text-xl max-w-sm mt-6 leading-relaxed">
               Sua jornada cinematográfica começa com uma simples palavra. O que vamos buscar agora?
            </p>
            <div className="mt-12 flex gap-4">
               <div className="w-2 h-2 rounded-full bg-gray-300"></div>
               <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce delay-100"></div>
               <div className="w-2 h-2 rounded-full bg-gray-300"></div>
            </div>
         </div>
      )}
    </div>
  );
}

// HELPER COMPONENTS
function FilterGroup({ label, value, options, onChange }: { label: string, value: string, options: {label: string, value: string}[], onChange: (v: string) => void }) {
  return (
    <div className="space-y-3">
       <label className="text-[8px] font-black text-white/40 uppercase tracking-widest pl-1">{label}</label>
       <div className="flex flex-col gap-1.5">
          {options.map(opt => (
            <button 
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`text-left px-4 py-2 rounded-xl text-[10px] font-black transition-all ${value === opt.value ? 'bg-white text-gray-900 shadow-lg' : 'text-white/60 hover:bg-white/5'}`}
            >
              {opt.label}
            </button>
          ))}
       </div>
    </div>
  );
}
