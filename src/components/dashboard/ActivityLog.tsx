"use client";

import React from "react";

interface ActivityItem {
  id: string;
  type: "search" | "project" | "render";
  title: string;
  time: string;
  status: "success" | "pending" | "error";
}

interface ActivityLogProps {
  activities?: ActivityItem[];
}

export function ActivityLog({ 
  activities = [] 
}: ActivityLogProps) {
  
  const getIcon = (type: string) => {
    switch (type) {
      case "search": return "🔍";
      case "project": return "📁";
      case "render": return "🎬";
      default: return "⚡";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success": return "bg-green-500";
      case "pending": return "bg-blue-500 animate-pulse";
      case "error": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-4xl border border-gray-100 dark:border-gray-800 p-10 shadow-2xl space-y-8">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic">Atividade Recente</h3>
        <span className="text-[10px] font-black text-blue-500 uppercase cursor-pointer hover:tracking-widest transition-all">Ver Histórico ➔</span>
      </div>

      <div className="space-y-6">
        {activities.length > 0 ? (
          activities.map((activity) => (
            <div key={activity.id} className="flex items-center gap-6 group">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl shadow-inner bg-gray-50 dark:bg-black group-hover:scale-110 transition-transform border border-gray-100 dark:border-gray-800`}>
                {getIcon(activity.type)}
              </div>
              <div className="flex-1 space-y-1">
                 <div className="flex justify-between items-start">
                    <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter group-hover:text-blue-500 transition-colors">{activity.title}</p>
                    <span className={`w-2 h-2 rounded-full mt-1.5 ${getStatusColor(activity.status)}`}></span>
                 </div>
                 <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <span>{activity.type.toUpperCase()}</span>
                    <span>{activity.time}</span>
                 </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-10 text-center space-y-3">
             <div className="text-4xl opacity-20">📂</div>
             <p className="text-[10px] font-black text-muted-custom uppercase tracking-widest">Nenhuma atividade registrada ainda</p>
          </div>
        )}
      </div>

      <div className="pt-6 border-t border-gray-50 dark:border-gray-800">
         <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">Monitoramento em Tempo Real Ativo</p>
      </div>
    </div>
  );
}
