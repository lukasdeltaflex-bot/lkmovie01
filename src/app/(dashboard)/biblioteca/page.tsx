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
  softDeleteProject, 
  restoreProject, 
  duplicateProject, 
  hardDeleteProject,
} from "@/lib/firebase/projects";
import { getUserRenderJobs } from "@/lib/firebase/render-jobs";
import { SavedProject } from "@/types/project.d";
import { RenderJob } from "@/types/render";

export default function BibliotecaPage() {
  const { user } = useAuth();
  const { branding, showToast } = useBranding();
  const { setSelectedVideo } = useSelectedVideo();
  const router = useRouter();

  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [deletedProjects, setDeletedProjects] = useState<SavedProject[]>([]);
  const [renderJobs, setRenderJobs] = useState<RenderJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"active" | "trash">("active");

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (view === "active") {
        const [projectsData, jobsData] = await Promise.all([
          getUserProjects(user.uid),
          getUserRenderJobs(user.uid)
        ]);
        setProjects(projectsData);
        setRenderJobs(jobsData);
      } else {
        const data = await getDeletedProjects(user.uid);
        setDeletedProjects(data);
      }
    } catch (error) {
      console.error("Erro ao carregar galeria:", error);
      showToast("Erro ao carregar dados.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, view]);

  // Polling para atualizar status de renderização se houver jobs ativos
  useEffect(() => {
    if (!user || view !== "active") return;
    
    const activeJobs = renderJobs.filter(j => j.status === "pending" || j.status === "processing");
    if (activeJobs.length === 0) return;

    const interval = setInterval(async () => {
      const jobsData = await getUserRenderJobs(user.uid);
      setRenderJobs(jobsData);
    }, 5000);

    return () => clearInterval(interval);
  }, [user, view, renderJobs]);

  const handleOpenProject = (project: SavedProject) => {
    setSelectedVideo({
      id: project.videoId,
      title: project.title,
      thumbnail: project.thumbnail,
      channel: project.channelTitle,
    } as any);
    router.push(`/editor?id=${project.id}`);
  };

  const handleDuplicate = async (id: string) => {
    try {
      await duplicateProject(id);
      showToast("Projeto duplicado!", "success");
      fetchData();
    } catch (error) {
      showToast("Erro ao duplicar.", "error");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      if (view === "active") {
        await softDeleteProject(id);
        showToast("Movido para a lixeira.", "info");
      } else {
        await hardDeleteProject(id);
        showToast("Excluído permanentemente.", "warning");
      }
      fetchData();
    } catch (error) {
      showToast("Erro ao excluir.", "error");
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await restoreProject(id);
      showToast("Projeto restaurado!", "success");
      fetchData();
    } catch (error) {
      showToast("Erro ao restaurar.", "error");
    }
  };

  const getRenderStatus = (projectId: string) => {
    const job = renderJobs.find(j => j.projectId === projectId);
    if (!job) return null;

    const styles = {
      pending: "bg-gray-500",
      processing: "bg-blue-500 animate-pulse",
      completed: "bg-green-500",
      failed: "bg-red-500"
    };

    const labels = {
      pending: "🎬 AGUARDANDO",
      processing: `⚙️ GERANDO ${job.progress}%`,
      completed: "✅ CONCLUÍDO",
      failed: "❌ ERRO"
    };

    return (
      <div className={`mt-2 px-3 py-1 rounded-lg text-[8px] font-black uppercase text-white inline-block shadow-md ${styles[job.status]}`}>
        {labels[job.status]}
      </div>
    );
  };

  const getDownloadButton = (projectId: string) => {
    const job = renderJobs.find(j => j.projectId === projectId);
    if (job?.status === "completed" && job.outputUrl) {
      return (
        <a 
          href={job.outputUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex-shrink-0 bg-green-500 hover:bg-green-600 text-white p-3 rounded-xl shadow-lg transition-all"
          title="Baixar Vídeo Final"
        >
          📥
        </a>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 h-full items-center justify-center min-h-[60vh] animate-in fade-in duration-700">
        <div className="animate-spin w-16 h-16 border-4 border-t-transparent border-blue-500 rounded-full shadow-2xl"></div>
        <p className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] animate-pulse">Sincronizando Galeria...</p>
      </div>
    );
  }

  const currentList = view === "active" ? projects : deletedProjects;

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 px-4">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">
             <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Fila de Renderização Cloud
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tighter italic uppercase">Sua Galeria</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">Acompanhe e baixe suas produções cinematográficas.</p>
        </div>

        <div className="flex items-center gap-3 bg-gray-100 dark:bg-gray-900 p-2 rounded-2xl border border-gray-200 dark:border-gray-800">
           <button 
            onClick={() => setView("active")}
            className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'active' ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-xl' : 'text-gray-400'}`}
           >Ativos ({projects.length})</button>
           <button 
            onClick={() => setView("trash")}
            className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'trash' ? 'bg-white dark:bg-gray-800 text-red-500 shadow-xl' : 'text-gray-400'}`}
           >Lixeira ({deletedProjects.length})</button>
        </div>
      </header>

      {currentList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {currentList.map(project => (
             <div key={project.id} className="group bg-white dark:bg-gray-900 rounded-4xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-2xl transition-all hover:-translate-y-2 duration-500 relative flex flex-col h-full">
                <div className="aspect-video relative bg-black overflow-hidden group-hover:scale-105 transition-all duration-700">
                   <img src={project.thumbnail} alt={project.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                   <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all bg-black/40 backdrop-blur-sm cursor-pointer" onClick={() => view === 'active' && handleOpenProject(project)}>
                      <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl shadow-2xl">▶</div>
                   </div>
                </div>

                <div className="p-8 flex flex-col flex-1 space-y-4">
                   <div className="flex-1">
                      <div className="flex items-start justify-between gap-4">
                         <div className="overflow-hidden">
                           <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1 truncate">{project.channelTitle}</p>
                           <h3 className="text-xl font-black text-gray-900 dark:text-white leading-tight line-clamp-2">{project.title}</h3>
                         </div>
                         {view === "active" && getDownloadButton(project.id!)}
                      </div>
                      {view === "active" && getRenderStatus(project.id!)}
                   </div>

                   <div className="pt-6 border-t border-gray-50 dark:border-gray-800 flex items-center justify-between gap-2">
                      {view === "active" ? (
                        <>
                          <Button variant="ghost" onClick={() => handleDuplicate(project.id!)} className="flex-1 h-12 text-[9px] font-black uppercase text-gray-400 hover:text-blue-500 transition-colors">Copiar</Button>
                          <Button variant="ghost" onClick={() => handleDelete(project.id!)} className="flex-1 h-12 text-[9px] font-black uppercase text-gray-400 hover:text-red-500 transition-colors">Excluir</Button>
                          <Button onClick={() => handleOpenProject(project)} className="flex-1 h-12 text-[9px] font-black uppercase bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700">EDITAR</Button>
                        </>
                      ) : (
                        <>
                          <Button variant="ghost" onClick={() => handleRestore(project.id!)} className="flex-1 h-12 text-[9px] font-black uppercase text-green-500">Restaurar</Button>
                          <Button variant="ghost" onClick={() => handleDelete(project.id!)} className="flex-1 h-12 text-[9px] font-black uppercase text-red-500">Apagar</Button>
                        </>
                      )}
                   </div>
                </div>
             </div>
           ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-950 border-4 border-dashed border-gray-100 dark:border-gray-900 rounded-[3rem] py-40 flex flex-col items-center justify-center text-center space-y-10 animate-in fade-in duration-1000">
           <div className="w-32 h-32 rounded-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-6xl shadow-inner border border-gray-100 dark:border-gray-800">
              {view === "trash" ? "🗑️" : "🎬"}
           </div>
           <div className="space-y-2">
              <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">
                {view === "trash" ? "Lixeira Vazia" : "Nada Renderizado"}
              </h2>
              <p className="text-gray-500 font-bold max-w-xs mx-auto">
                Inicie um job de renderização no editor para ver seus vídeos aqui.
              </p>
           </div>
           {view === "active" && (
             <Link href="/buscar-cenas">
               <Button className="h-16 px-14 rounded-2xl bg-blue-600 text-white font-black text-lg shadow-2xl hover:scale-105 active:scale-95 transition-all uppercase italic">Novo Projeto 🚀</Button>
             </Link>
           )}
        </div>
      )}
    </div>
  );
}
