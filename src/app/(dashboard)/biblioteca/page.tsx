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
        <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Sua Biblioteca</h1>
          <p className="text-gray-400">Gerencie todos os seus projetos cinematográficos.</p>
        </div>
        <div className="flex gap-4">
          {projects.length > 0 && (
            <Button variant="outline" className="text-xs">Exportar Tudo</Button>
          )}
          <Link href="/buscar-cenas">
            <Button className="bg-blue-600 hover:bg-blue-500 text-xs shadow-[0_0_20px_rgba(59,130,246,0.2)]">Novo Projeto</Button>
          </Link>
        </div>
      </header>

      {projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project) => (
            <div key={project.id} className="group bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden hover:border-gray-600 transition-all shadow-2xl relative">
              <div className="aspect-video relative overflow-hidden bg-black flex items-center justify-center">
                <img 
                  src={project.thumbnail} 
                  alt={project.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                />
                <div className="absolute top-4 right-4 bg-green-500/20 border border-green-500/50 text-green-400 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md">
                  Salvo
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1 group-hover:text-blue-400 transition-colors truncate">{project.title}</h3>
                  <p className="text-xs text-gray-500 font-medium">Atualizado em {formatDate(project.updatedAt)}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Button variant="outline" className="w-full h-11 text-xs border-gray-800 hover:bg-gray-800 text-gray-400">
                     Duplicar
                  </Button>
                  <Button className="w-full h-11 bg-blue-600/10 hover:bg-blue-600 border border-blue-600/30 text-blue-400 hover:text-white text-xs transition-all tracking-wide">
                     Visualizar
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
          <div className="w-24 h-24 rounded-full bg-gray-900 flex items-center justify-center text-5xl">🎬</div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Nenhum projeto encontrado</h2>
            <p className="text-gray-500 max-w-sm">Crie seu primeiro projeto navegando pelas Cenas e importando um vídeo para o Editor.</p>
          </div>
          <Link href="/buscar-cenas">
            <Button className="bg-blue-600 hover:bg-blue-500 px-8 py-6 rounded-xl font-bold">
               Explorar Agora 🚀
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
