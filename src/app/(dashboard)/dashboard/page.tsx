"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

const metrics = [
  { label: "Buscas Realizadas", value: "1,284", icon: "🔍", color: "text-blue-500", bg: "bg-blue-500/10" },
  { label: "Vídeos Selecionados", value: "452", icon: "🎥", color: "text-purple-500", bg: "bg-purple-500/10" },
  { label: "Exports Prontos", value: "89", icon: "🎉", color: "text-green-500", bg: "bg-green-500/10" },
];

const quickActions = [
  { label: "Buscar Cenas", href: "/buscar-cenas", icon: "🔎", description: "Encontre cenas específicas em vídeos." },
  { label: "Biblioteca", href: "/biblioteca", icon: "📚", description: "Acesse seus projetos e vídeos salvos." },
  { label: "Configurações", href: "/configuracoes", icon: "⚙️", description: "Personalize sua experiência e exportação." },
];

export default function DashboardPage() {
  return (
    <div className="space-y-10 max-w-7xl mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard Principal</h1>
        <p className="text-gray-400">Bem-vindo ao LKMOVIE01. Gerencie seus projetos cinematográficos aqui.</p>
      </header>

      {/* Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {metrics.map((metric) => (
          <div key={metric.label} className="bg-gray-900 border border-gray-800 p-6 rounded-2xl flex items-center gap-4 group hover:border-gray-700 transition-all shadow-xl">
            <div className={`w-14 h-14 rounded-xl ${metric.bg} flex items-center justify-center text-3xl group-hover:scale-110 transition-transform`}>
              {metric.icon}
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">{metric.label}</p>
              <p className="text-3xl font-bold text-white">{metric.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions Section */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-sm">⚡</span>
          Ações Rápidas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action) => (
            <Link key={action.label} href={action.href} className="group">
              <div className="h-full bg-gray-900/40 backdrop-blur-sm border border-gray-800 p-6 rounded-2xl hover:bg-gray-800/60 hover:-translate-y-1 transition-all duration-300">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform inline-block">
                  {action.icon}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{action.label}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{action.description}</p>
                <div className="mt-4 flex items-center text-blue-500 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity translate-x-1 group-hover:-translate-x-0">
                  Acessar <span className="ml-1">→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent Projects Placeholder */}
      <section className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-3xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] -z-10 animate-pulse"></div>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-lg">
            <h2 className="text-2xl font-bold text-white">Criar novo projeto</h2>
            <p className="text-gray-400">Comece buscando cenas específicas em vídeos do YouTube usando nossa IA de interpretação semântica.</p>
          </div>
          <Link href="/buscar-cenas">
            <Button className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-6 rounded-xl font-bold shadow-2xl shadow-blue-900/30">
              Nova Busca <span className="ml-2">🔍</span>
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
