"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/auth-context";
import { useBranding } from "@/context/branding-context";
import { getUserProjects, SavedProject } from "@/lib/firebase/projects";

export default function BibliotecaPage() {
  const { user } = useAuth();
  const { branding } = useBranding();
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
        <div 
          className="animate-spin w-12 h-12 border-4 border-t-transparent rounded-full shadow-lg" 
          style={{ borderColor: branding.primaryColor, borderTopColor: 'transparent' }}
        ></div>
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
            <Button variant="outline" className="font-bold border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl px-6">
               Exportar Lista
            </Button>
          )}
          <Link href="/buscar-cenas">
            <Button 
              className="text-white font-black shadow-lg rounded-xl px-8 py-6 transition-all active:scale-95" 
              style={{ backgroundColor: branding.primaryColor, boxShadow: `0 10px 20px -5px ${branding.primaryColor}4d` }}
            >
               + NOVO PROJETO
            </Button>
          </Link>
        </div>
      </header>

      {projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pt-4">
          {projects.map((project) => (
            <div key={project.id} className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl overflow-hidden transition-all shadow-xl dark:shadow-none hover:shadow-2xl relative flex flex-col h-full" style={{ '--hover-border': branding.primaryColor } as any}>
              <div className="aspect-video relative overflow-hidden bg-gray-100 dark:bg-black flex items-center justify-center border-b border-gray-100 dark:border-gray-800">
                <img 
                  src={project.thumbnail} 
                  alt={project.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                />
                
                {/* Status Badge */}
                <div className="absolute top-4 right-4 bg-green-500/90 text-white px-3 py-1 rounded-full text-[10px] font-black backdrop-blur-md shadow-lg flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span> SALVO
                </div>
                
                {/* Play Overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40">
                   <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl shadow-2xl transform scale-90 group-hover:scale-100 transition-transform"
                    style={{ backgroundColor: `${branding.primaryColor}e6` }}
                   >
                     ▶
                   </div>
                </div>
              </div>
              
              <div className="p-6 flex flex-col flex-1">
                <div className="flex-1">
                  <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2 leading-tight transition-colors line-clamp-2 group-hover:text-primary" style={{ color: branding.primaryColor }}>
                    {project.title}
                  </h3>
                  <div className="flex items-center gap-2 mb-4">
                     <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                       PROJETO CINEMATOGRÁFICO
                     </span>
                  </div>
                  <p className="text-[10px] text-gray-400 font-bold flex items-center gap-1.5 uppercase tracking-wider">
                    <span>📅</span> Atualizado em {formatDate(project.updatedAt)}
                  </p>
                </div>

                <div className="border-t border-gray-100 dark:border-gray-800 pt-5 mt-5 grid grid-cols-2 gap-3">
                  <Button variant="outline" className="w-full h-12 text-[10px] font-black uppercase border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 tracking-widest rounded-xl">
                     Duplicar
                  </Button>
                  <Button 
                    className="w-full h-12 text-[10px] font-black uppercase tracking-widest rounded-xl text-white transition-all shadow-md active:scale-95"
                    style={{ backgroundColor: branding.secondaryColor }}
                  >
                     Abrir Editor
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-[2.5rem] flex flex-col items-center justify-center py-28 text-center space-y-6 shadow-sm">
          <div 
            className="w-28 h-28 rounded-full flex items-center justify-center text-6xl shadow-inner border" 
            style={{ backgroundColor: `${branding.primaryColor}1a`, borderColor: `${branding.primaryColor}33` }}
          >
             {branding.logo}
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Sua biblioteca está vazia</h2>
            <p className="text-gray-500 font-medium text-lg max-w-md mx-auto">Comece buscando cenas épicas para criar seus primeiros conteúdos personalizados com {branding.appName}.</p>
          </div>
          <Link href="/buscar-cenas">
            <Button 
              className="mt-4 text-white font-black text-lg px-12 py-8 rounded-2xl shadow-2xl transition-all transform hover:-translate-y-1 active:translate-y-0"
              style={{ backgroundColor: branding.primaryColor, boxShadow: `0 15px 30px -5px ${branding.primaryColor}66` }}
            >
               EXPLORAR AGORA 🚀
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
