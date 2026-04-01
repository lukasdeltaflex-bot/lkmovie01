"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { useBranding } from "@/context/branding-context";
import { subscribeToNotifications, markAsRead, UserNotification, deleteNotification } from "@/lib/firebase/notifications";
import { Button } from "@/components/ui/Button";

export function NotificationBell() {
  const { user } = useAuth();
  const { branding } = useBranding();
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (user) {
      const unsubscribe = subscribeToNotifications(user.uid, setNotifications);
      return () => unsubscribe();
    }
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteNotification(id);
  };

  return (
    <div className="relative z-50">
      {/* Bell Icon */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 flex items-center justify-center text-2xl shadow-xl hover:scale-110 active:scale-95 transition-all relative group"
      >
        <span className="group-hover:rotate-12 transition-transform">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-4 border-white dark:border-gray-950 animate-bounce">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-[-1]" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 mt-4 w-80 md:w-96 bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-4xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
               <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tighter uppercase italic">Alertas Cloud</h3>
               <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{notifications.length} Mensagens</span>
            </div>

            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
               {notifications.length > 0 ? (
                 notifications.map(n => (
                   <div 
                    key={n.id} 
                    onClick={() => !n.read && handleMarkAsRead(n.id!)}
                    className={`p-6 border-b border-gray-50 dark:border-gray-900 last:border-0 transition-all cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 relative group ${!n.read ? 'bg-blue-50/30 dark:bg-blue-500/5' : ''}`}
                   >
                      <div className="flex gap-4">
                         <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${n.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'}`}>
                            {n.type === 'success' ? '✅' : 'ℹ️'}
                         </div>
                         <div className="flex-1 space-y-1">
                            <div className="flex justify-between items-start">
                               <p className={`text-sm font-black text-gray-900 dark:text-white leading-tight ${!n.read ? 'pr-4' : ''}`}>{n.title}</p>
                               {!n.read && <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse mt-1.5 shrink-0" style={{ backgroundColor: branding.primaryColor }}></div>}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed">{n.message}</p>
                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest pt-2">
                               {n.createdAt ? new Date(n.createdAt.toDate()).toLocaleTimeString() : 'Agora'}
                            </p>
                         </div>
                      </div>
                      
                      <button 
                        onClick={(e) => handleDelete(e, n.id!)}
                        className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-all text-xs"
                      >
                         ✕
                      </button>
                   </div>
                 ))
               ) : (
                 <div className="p-20 text-center space-y-4">
                    <span className="text-5xl block animate-pulse grayscale opacity-30">📭</span>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Sem notificações por enquanto</p>
                 </div>
               )}
            </div>

            {notifications.length > 0 && (
              <div className="p-4 bg-gray-50 dark:bg-black/50 border-t border-gray-100 dark:border-gray-800">
                 <button 
                  className="w-full py-3 text-[10px] font-black text-gray-400 hover:text-gray-900 dark:hover:text-white uppercase tracking-widest transition-all"
                  onClick={() => setIsOpen(false)}
                 >
                   Fechar Painel ➔
                 </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
