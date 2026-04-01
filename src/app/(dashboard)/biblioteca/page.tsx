"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/auth-context";
import { useBranding } from "@/context/branding-context";
import { useSelectedVideo } from "@/context/selected-video-context";
import { useRouter } from "next/navigation";
import { 
  getUserProjects, 
  getDeletedProjects, 
  deleteProject, 
  restoreProject, 
  duplicateProject, 
  hardDeleteProject,
  SavedProject 
} from "@/lib/firebase/projects";

export default function BibliotecaPage() {
  const { user } = useAuth();
  const { branding } = useBranding();
  const { setSelectedVideo } = useSelectedVideo();
  const router = useRouter();

  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [deletedProjects, setDeletedProjects] = useState<SavedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"active" | "trash">("active");

  const fetchProjects = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      if (view === "active") {
        const data = await getUserProjects(user.uid);
        setProjects(data);
      } else {
        const data = await getDeletedProjects(user.uid);
        setDeletedProjects(data);
      }
    } catch (error) {
      console.error("Erro ao carregar biblioteca:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [user, view]);

  const handleOpenProject = (project: SavedProject) => {
    // Simular selecao de video para abrir no editor
    setSelectedVideo({
      id: project.videoId,
      title: project.title,
      thumbnail: project.thumbnail,
      channelTitle: project.channel,
      description: "",
      publishedAt: ""
    } as any);
    router.push("/editor");
  };

  const handleDuplicate = async (id: string) => {
    try {
      await duplicateProject(id);
      fetchProjects();
    } catch (error) {
      alert("Erro ao duplicar projeto");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      if (view === "active") {
        await deleteProject(id);
      } else {
        if (confirm("Deseja excluir permanentemente este projeto?")) {
           await hardDeleteProject(id);
        } else {
           return;
        }
      }
      fetchProjects();
    } catch (error) {
      alert("Erro ao excluir projeto");
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await restoreProject(id);
      fetchProjects();
    } catch (error) {
      alert("Erro ao restaurar projeto");
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp || !timestamp.toDate) return "---";
    return timestamp.toDate().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 h-full items-center justify-center min-h-[60vh] animate-in fade-in duration-700">
        <div 
          className="animate-spin w-16 h-16 border-4 border-t-transparent rounded-full shadow-2xl" 
          style={{ borderColor: branding.primaryColor, borderTopColor: 'transparent' }}
        ></div>
        <p className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] animate-pulse">Sincronizando Nuvem...</p>
      </div>
    );
  }

  const currentList = view === "active" ? projects : deletedProjects;

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">
             <span className="w-2 h-2 rounded-full" style={{ backgroundColor: branding.primaryColor }}></span>
             SaaS Cloud Storage
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tighter">Sua Galeria SaaS</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">Gerencie seus projetos cinematográficos salvos no Firestore.</p>
        </div>

        <div className="flex items-center gap-3 bg-gray-100 dark:bg-gray-900 p-2 rounded-2xl w-full lg:w-auto">
           <button 
            onClick={() => setView("active")}
            className={`flex-1 lg:flex-none px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${view === 'active' ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-xl' : 'text-gray-500 hover:text-gray-700'}`}
            style={view === 'active' ? { color: branding.primaryColor } : {}}
           >
              Ativos ({projects.length})
           </button>
           <button 
            onClick={() => setView("trash")}
            className={`flex-1 lg:flex-none px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${view === 'trash' ? 'bg-white dark:bg-gray-800 text-red-500 shadow-xl' : 'text-gray-500 hover:text-gray-700'}`}
           >
              Lixeira ({deletedProjects.length})
           </button>
        </div>
      </header>

      {currentList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10 pt-4">
          {currentList.map((project) => (
            <div key={project.id} className="group bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-4xl overflow-hidden transition-all shadow-2xl hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] relative flex flex-col h-full transform hover:-translate-y-2 duration-500">
              <div className="aspect-video relative overflow-hidden bg-gray-100 dark:bg-black flex items-center justify-center border-b border-gray-50 dark:border-gray-800">
                <img 
                  src={project.thumbnail} 
                  alt={project.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 opacity-90 group-hover:opacity-100"
                />
                
                {/* Status Badge */}
                <div className="absolute top-6 right-6 bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-2xl text-[10px] font-black shadow-2xl flex items-center gap-2 border border-white/10">
                  <span className={`w-2 h-2 rounded-full ${view === 'active' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span> 
                  {view === 'active' ? 'SINCRONIZADO' : 'DELETADO'}
                </div>
                
                {/* Play/Open Overlay (Only for Active) */}
                {view === 'active' && (
                  <div 
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 bg-black/40 cursor-pointer backdrop-blur-[2px]"
                    onClick={() => handleOpenProject(project)}
                  >
                     <div 
                      className="w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl shadow-[0_0_50px_rgba(var(--primary-rgb),0.5)] transform scale-75 group-hover:scale-100 transition-all duration-500 border border-white/20"
                      style={{ backgroundColor: `${branding.primaryColor}cc` }}
                     >
                       ▶
                     </div>
                  </div>
                )}
              </div>
              
              <div className="p-8 flex flex-col flex-1">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <h3 
                      className="text-xl font-black text-gray-900 dark:text-white leading-tight transition-colors line-clamp-1 cursor-pointer hover:underline"
                      onClick={() => view === 'active' && handleOpenProject(project)}
                    >
                      {project.title}
                    </h3>
                    <span 
                      className="text-[10px] font-black px-2 py-1 bg-gray-100 dark:bg-black border border-gray-200 dark:border-gray-800 text-gray-400 rounded-lg group-hover:text-blue-500 transition-colors"
                      style={{ groupHover: { color: branding.primaryColor } } as any}
                    >
                      PRO
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                     <div className="flex-1 bg-gray-50 dark:bg-black/40 p-3 rounded-2xl border border-gray-100 dark:border-gray-800">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Última Edição</p>
                        <p className="text-xs font-bold text-gray-700 dark:text-gray-300">{formatDate(project.updatedAt)}</p>
                     </div>
                     <div className="flex-1 bg-gray-50 dark:bg-black/40 p-3 rounded-2xl border border-gray-100 dark:border-gray-800">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Duração Ref.</p>
                        <p className="text-xs font-bold text-gray-700 dark:text-gray-300">N/A</p>
                     </div>
                  </div>
                </div>

                <div className="border-t border-gray-50 dark:border-gray-800 pt-6 mt-8 flex items-center justify-between gap-3">
                  {view === "active" ? (
                    <>
                      <Button 
                        variant="ghost" 
                        onClick={() => handleDuplicate(project.id!)}
                        className="flex-1 h-12 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-blue-600 transition-colors"
                      >
                         Duplicar
                      </Button>
                      <Button 
                        variant="ghost" 
                        onClick={() => handleDelete(project.id!)}
                        className="flex-1 h-12 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-red-500 transition-colors"
                      >
                         Excluir
                      </Button>
                      <Button 
                        onClick={() => handleOpenProject(project)}
                        className="flex-1 h-12 text-[10px] font-black uppercase tracking-widest rounded-xl text-white shadow-lg active:scale-95"
                        style={{ backgroundColor: branding.primaryColor }}
                      >
                         ABRIR
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button 
                        variant="ghost" 
                        onClick={() => handleRestore(project.id!)}
                        className="flex-1 h-12 text-[10px] font-black uppercase tracking-widest text-green-600 hover:text-green-500"
                      >
                         Restaurar
                      </Button>
                      <Button 
                        variant="ghost" 
                        onClick={() => handleDelete(project.id!)}
                        className="flex-1 h-12 text-[10px] font-black uppercase tracking-widest text-red-600 hover:text-red-500"
                      >
                         Permanente
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 border-4 border-dashed border-gray-100 dark:border-gray-800 rounded-4xl flex flex-col items-center justify-center py-32 text-center space-y-8 shadow-inner animate-pulse">
          <div 
            className="w-32 h-32 rounded-full flex items-center justify-center text-7xl shadow-2xl border-4" 
            style={{ backgroundColor: `${branding.primaryColor}1a`, borderColor: `${branding.primaryColor}33`, color: branding.primaryColor }}
          >
             {view === 'active' ? branding.logo : '🗑️'}
          </div>
          <div className="space-y-3">
            <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">
                {view === 'active' ? 'Sua galeria está limpa' : 'Lixeira Vazia'}
            </h2>
            <p className="text-gray-500 font-medium text-lg max-w-sm mx-auto">
                {view === 'active' ? 'Nada por aqui ainda. Comece a criar projetos épicos que ficarão salvos para sempre na nuvem.' : 'Nada na lixeira. Tudo em ordem por aqui.'}
            </p>
          </div>
          {view === 'active' && (
            <Link href="/buscar-cenas">
              <Button 
                className="mt-4 text-white font-black text-lg px-14 py-8 rounded-2xl shadow-2xl transition-all transform hover:-translate-y-1 active:translate-y-0"
                style={{ backgroundColor: branding.primaryColor, boxShadow: `0 20px 40px -10px ${branding.primaryColor}66` }}
              >
                 NOVO PROJETO 🎬
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
