"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/auth-context";
import { getUserProjects, SavedProject } from "@/lib/firebase/projects";

export default function BibliotecaPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const userProjects = await getUserProjects(user.uid);
        setProjects(userProjects);
      } catch (error) {
        console.error("Erro ao carregar projetos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [user]);

  const formatDate = (timestamp: any) => {
    if (!timestamp || !timestamp.toDate) return "Data desconhecida";
    return timestamp.toDate().toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full shadow-[0_0_15px_rgba(37,99,235,0.5)]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight mb-2">Sua Biblioteca</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">Gerencie e exporte os projetos cinematográficos finalizados.</p>
        </div>
        <div className="flex gap-4">
          {projects.length > 0 && (
            <Button variant="outline" className="font-bold border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300">
               Exportar Lista
            </Button>
          )}
          <Link href="/buscar-cenas">
            <Button className="bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-600/30">
               + Novo Projeto
            </Button>
          </Link>
        </div>
      </header>

      {projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pt-4">
          {projects.map((project) => (
            <div key={project.id} className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl overflow-hidden hover:border-blue-500 dark:hover:border-gray-600 transition-all shadow-xl dark:shadow-none hover:shadow-2xl relative flex flex-col h-full">
              <div className="aspect-video relative overflow-hidden bg-gray-100 dark:bg-black flex items-center justify-center border-b border-gray-100 dark:border-gray-800">
                <img 
                  src={project.thumbnail} 
                  alt={project.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                />
                
                {/* Status Badge */}
                <div className="absolute top-4 right-4 bg-green-500/90 text-white px-3 py-1 rounded-full text-xs font-black backdrop-blur-md shadow-lg flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span> Salvo
                </div>
                
                {/* Play Overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40">
                   <div className="w-16 h-16 rounded-full bg-blue-600/90 backdrop-blur-sm flex items-center justify-center text-white text-2xl shadow-[0_0_30px_rgba(37,99,235,0.6)] transform scale-90 group-hover:scale-100 transition-transform">
                     ▶
                   </div>
                </div>
              </div>
              
              <div className="p-6 flex flex-col flex-1">
                <div className="flex-1">
                  <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                    {project.title}
                  </h3>
                  <div className="flex items-center gap-2 mb-4">
                     <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                       Edição de Vídeo
                     </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium flex items-center gap-1.5">
                    <span className="text-[10px]">📅</span> Salvo em {formatDate(project.updatedAt)}
                  </p>
                </div>

                <div className="border-t border-gray-100 dark:border-gray-800 pt-4 mt-4 grid grid-cols-2 gap-3">
                  <Button variant="outline" className="w-full h-11 text-xs border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 font-bold text-gray-600 dark:text-gray-400">
                     Duplicar
                  </Button>
                  <Button className="w-full h-11 bg-blue-50 hover:bg-blue-100 dark:bg-blue-600/10 dark:hover:bg-blue-600 border border-transparent dark:border-blue-600/30 text-blue-700 dark:text-blue-400 dark:hover:text-white font-black text-xs transition-all">
                     Abrir Editor
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 border-dashed rounded-3xl flex flex-col items-center justify-center py-24 text-center space-y-6 shadow-sm">
          <div className="w-28 h-28 rounded-full bg-blue-50 dark:bg-blue-600/10 flex items-center justify-center text-6xl shadow-inner border border-blue-100 dark:border-blue-500/20">
             📚
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white">Nenhum projeto encontrado</h2>
            <p className="text-gray-500 text-lg max-w-md mx-auto">Sua biblioteca está vazia. Comece buscando cenas para criar conteúdos épicos.</p>
          </div>
          <Link href="/buscar-cenas">
            <Button className="mt-4 bg-blue-600 hover:bg-blue-500 px-10 py-7 rounded-2xl font-black text-lg shadow-xl shadow-blue-600/20 transform hover:-translate-y-1 transition-all">
               Explorar Galeria de Cenas 🚀
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
