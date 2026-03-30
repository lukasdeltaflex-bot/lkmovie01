"use client";

import React from "react";
import { Button } from "@/components/ui/Button";

const mockProjects = [
  {
    id: "1",
    title: "Cena de Ação Montanha",
    thumbnail: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=60",
    status: "Concluído",
    date: "2024-03-15",
    duration: "00:45",
  },
  {
    id: "2",
    title: "Diálogo Dramático Café",
    thumbnail: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&auto=format&fit=crop&q=60",
    status: "Processando",
    date: "2024-03-28",
    duration: "01:20",
  },
  {
    id: "3",
    title: "Perseguição Noturna",
    thumbnail: "https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800&auto=format&fit=crop&q=60",
    status: "Rascunho",
    date: "2024-03-29",
    duration: "00:55",
  },
];

export default function BibliotecaPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Sua Biblioteca</h1>
          <p className="text-gray-400">Gerencie todos os seus projetos cinematográficos.</p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" className="text-xs">Exportar Tudo</Button>
          <Button className="bg-blue-600 hover:bg-blue-500 text-xs">Novo Projeto</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {mockProjects.map((project) => (
          <div key={project.id} className="group bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden hover:border-gray-600 transition-all shadow-2xl relative">
            <div className="aspect-video relative overflow-hidden">
              <img 
                src={project.thumbnail} 
                alt={project.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md border ${
                project.status === "Concluído" ? "bg-green-500/20 border-green-500/50 text-green-400" : 
                project.status === "Processando" ? "bg-blue-500/20 border-blue-500/50 text-blue-400" :
                "bg-gray-500/20 border-gray-500/50 text-gray-400"
              }`}>
                {project.status}
              </div>
              <div className="absolute bottom-4 right-4 bg-black/60 px-2 py-1 rounded text-xs font-mono text-white">
                {project.duration}
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-xl font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">{project.title}</h3>
                <p className="text-xs text-gray-500 font-medium">Criado em {project.date}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button variant="outline" className="w-full h-11 text-xs border-gray-800 hover:bg-gray-800">
                  Duplicar
                </Button>
                <Button className="w-full h-11 bg-blue-600/10 hover:bg-blue-600 border border-blue-600/30 text-blue-400 hover:text-white text-xs transition-all">
                  Abrir
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {mockProjects.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
          <div className="w-24 h-24 rounded-full bg-gray-900 flex items-center justify-center text-5xl">🎬</div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Nenhum projeto encontrado</h2>
            <p className="text-gray-500 max-w-sm">Comece buscando cenas e criando seus primeiros vídeos personalizados.</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-500">Criar Primeiro Projeto</Button>
        </div>
      )}
    </div>
  );
}
