"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { searchYouTubeVideos, YouTubeVideo } from "@/lib/youtube/search-videos";
import { useSelectedVideo } from "@/context/selected-video-context";
import { useBranding } from "@/context/branding-context";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { saveSearchQuery, getUserSearchHistory, getNicheSuggestions, SearchRecord } from "@/lib/firebase/search";

export default function BuscarCenasPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [history, setHistory] = useState<SearchRecord[]>([]);
  const [activeNiche, setActiveNiche] = useState("Cinematic");

  const { user } = useAuth();
  const { setSelectedVideo } = useSelectedVideo();
  const { branding } = useBranding();
  const router = useRouter();

  // Carregar Histórico
  useEffect(() => {
    if (user) {
      getUserSearchHistory(user.uid).then(setHistory);
    }
  }, [user]);

  const handleSearch = async (e?: React.FormEvent, customQuery?: string) => {
    e?.preventDefault();
    const searchTerm = customQuery || query;
    if (!searchTerm.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const videos = await searchYouTubeVideos(searchTerm);
      setResults(videos);
      
      // Salvar histórico no Firestore
      if (user) {
        await saveSearchQuery(user.uid, searchTerm);
        // Atualizar lista local
        getUserSearchHistory(user.uid).then(setHistory);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro desconhecido na busca. Tente novamente.");
    } finally {
      setLoading(false);
    }
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
      
      {/* HEADER SECTION - NOVO DESIGN SaaS */}
      <div 
        className="rounded-4xl p-12 md:p-20 text-center shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] relative overflow-hidden backdrop-blur-3xl border border-white/10"
        style={{ background: `linear-gradient(to bottom right, ${branding.primaryColor}, ${branding.secondaryColor})` }}
      >
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
         <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-black/20 rounded-full blur-[120px] translate-y-1/2 -track-x-1/2 opacity-60"></div>
         
         <div className="relative z-10 space-y-10 max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-3 px-6 py-2 bg-black/30 backdrop-blur-md rounded-full border border-white/10 text-[10px] font-black text-white uppercase tracking-[0.3em] animate-bounce">
               ✨ Novas Inteligência de Busca
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter drop-shadow-2xl leading-none">
               Imagine sua <br/><span className="text-black/30 italic">melhor cena.</span>
            </h1>
            
            <form onSubmit={(e) => handleSearch(e)} className="flex flex-col sm:flex-row gap-4 pt-6 max-w-3xl mx-auto">
              <div className="flex-1 relative group">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ex: Cyberpunk 2077 Night City 4k..."
                  className="w-full h-20 rounded-3xl text-2xl px-10 bg-white border-white shadow-2xl text-gray-900 placeholder:text-gray-400 focus:ring-8 focus:ring-white/20 transition-all font-black"
                />
                <div className="absolute inset-y-0 right-6 flex items-center pointer-events-none opacity-0 group-focus-within:opacity-100 transition-opacity">
                   <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-sm font-black border border-gray-200">ENT</div>
                </div>
              </div>
              <Button 
                type="submit" 
                disabled={loading || !query.trim()}
                className="h-20 px-14 rounded-3xl bg-black hover:bg-gray-900 text-white font-black text-2xl transition-all active:scale-95 disabled:opacity-50 shadow-2xl group"
              >
                {loading ? <span className="animate-spin text-3xl">🌩️</span> : <span className="group-hover:translate-x-1 transition-transform inline-block">BUSCAR 🚀</span>}
              </Button>
            </form>

            {/* Sugestões de Nicho */}
            <div className="space-y-6 pt-4">
               <div className="flex flex-wrap items-center justify-center gap-3">
                  <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.4em] mb-2 sm:mb-0">Explorer:</span>
                  {suggestions.map(niche => (
                    <button 
                      key={niche.label}
                      onClick={() => setActiveNiche(niche.label)}
                      className={`px-6 py-2 rounded-2xl text-[10px] font-black transition-all border ${activeNiche === niche.label ? 'bg-white text-gray-900 border-white' : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'}`}
                    >
                      {niche.label}
                    </button>
                  ))}
               </div>
               
               <div className="flex flex-wrap items-center justify-center gap-3 animate-in fade-in slide-in-from-top-2 duration-500">
                  {suggestions.find(n => n.label === activeNiche)?.terms.map(term => (
                    <button 
                      key={term} 
                      type="button" 
                      onClick={() => setPresetSearch(term)}
                      className="px-5 py-3 bg-black/40 hover:bg-black/60 rounded-2xl text-xs font-black text-white transition-all backdrop-blur-xl border border-white/5 hover:border-white/20 active:scale-95"
                    >
                      {term}
                    </button>
                  ))}
               </div>
            </div>
         </div>
      </div>

      {/* HISTÓRICO RECENTE */}
      {history.length > 0 && results.length === 0 && (
        <div className="space-y-6 animate-in slide-in-from-left-8 fade-in duration-700">
           <div className="flex items-center gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
              <span className="text-2xl">⏳</span>
              <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Histórico Cloud</h2>
           </div>
           <div className="flex flex-wrap gap-4">
              {history.map(item => (
                <button 
                  key={item.id} 
                  onClick={() => setPresetSearch(item.query)}
                  className="flex items-center gap-3 px-6 py-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl group hover:border-primary transition-all shadow-sm"
                  style={{ hover: { borderColor: branding.primaryColor } } as any}
                >
                  <span className="text-gray-400 font-bold text-sm">#</span>
                  <span className="text-sm font-black text-gray-700 dark:text-gray-300 group-hover:text-blue-500 transition-colors" style={{ groupHover: { color: branding.primaryColor } } as any}>
                    {item.query}
                  </span>
                </button>
              ))}
           </div>
        </div>
      )}

      {error && (
        <div className="p-8 bg-red-500/5 text-red-500 rounded-4xl border border-red-500/10 text-center font-black text-sm animate-bounce flex items-center justify-center gap-3">
           <span>🚨</span> {error}
        </div>
      )}

      {/* RESULTADOS DA BUSCA */}
      {results.length > 0 && (
        <div className="space-y-10 animate-in fade-in duration-500">
          <div className="flex items-end justify-between border-b border-gray-100 dark:border-gray-800 pb-8">
             <div>
                <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">Resultados Encontrados</h2>
                <p className="text-gray-500 font-bold text-xs mt-2 uppercase tracking-[0.2em] flex items-center gap-2">
                   <span className="w-2 h-2 rounded-full bg-green-500"></span> Conectado via YouTube API v3
                </p>
             </div>
             <div className="flex gap-2">
               <span className="px-4 py-2 bg-gray-50 dark:bg-gray-900 text-gray-400 rounded-xl text-[10px] font-black border border-gray-100 dark:border-gray-800 tracking-widest">
                 {results.length} CENAS
               </span>
               <Button variant="outline" className="rounded-xl px-4 py-2 text-[10px] h-auto font-black" onClick={() => setResults([])}>LIMPAR</Button>
             </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
            {results.map((video) => (
              <div 
                key={video.id} 
                className="group bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-4xl overflow-hidden shadow-2xl hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] transition-all flex flex-col cursor-pointer transform hover:-translate-y-3 duration-500 relative"
                onClick={() => handleSelectVideo(video)}
              >
                <div className="aspect-video bg-gray-100 dark:bg-black relative overflow-hidden">
                  <img 
                    src={video.thumbnail} 
                    alt={video.title} 
                    className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-1000 blur-none group-hover:blur-[2px]"
                  />
                  {/* Overlay SaaS Premium */}
                  <div className="absolute inset-0 bg-linear-to-t from-gray-900/90 via-gray-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-center p-8">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-gray-900 text-2xl shadow-2xl transform scale-0 group-hover:scale-100 transition-all duration-700 delay-100">
                        ▶
                    </div>
                    <p className="mt-6 text-white font-black text-sm uppercase tracking-[0.2em] animate-in slide-in-from-bottom-2 duration-500 delay-200">Personalizar Cena</p>
                  </div>
                </div>
                
                <div className="p-8 flex-1 flex flex-col justify-between space-y-6">
                  <h3 className="text-lg font-black text-gray-900 dark:text-white line-clamp-2 leading-snug transition-colors group-hover:text-primary" style={{ groupHover: { color: branding.primaryColor } } as any}>
                    {video.title}
                  </h3>
                  <div className="flex items-center justify-between border-t border-gray-50 dark:border-gray-800 pt-4">
                     <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest truncate max-w-[150px]">
                       {video.channelTitle}
                     </span>
                     <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-50 dark:bg-black border border-gray-100 dark:border-gray-800 text-[10px] font-bold group-hover:bg-primary group-hover:text-white transition-colors" style={{ groupHover: { backgroundColor: branding.primaryColor } } as any}>
                        HD
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
         <div className="py-40 text-center flex flex-col items-center opacity-40 select-none animate-in fade-in zoom-in-95 duration-1000">
            <div className="w-40 h-40 bg-gray-100 dark:bg-gray-900 rounded-[3rem] items-center justify-center flex text-8xl mb-8 shadow-inner grayscale animate-pulse">
               {branding.logo}
            </div>
            <h3 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic">Ready to create?</h3>
            <p className="text-gray-500 dark:text-gray-400 font-bold text-lg max-w-sm mt-4 leading-relaxed">Sua jornada cinematográfica começa com uma simples palavra. O que vamos buscar agora?</p>
         </div>
      )}
    </div>
  );
}
