"use client";

import { useAuth } from "@/context/auth-context";
import { signOutUser } from "@/lib/firebase/auth";
import Link from "next/link";

export default function UserProfilePage() {
  const { user } = useAuth();
  
  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-right-10 duration-700 pb-10">
      <div className="flex justify-between items-center">
        <header className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-4xl font-bold text-white border-4 border-white dark:border-gray-800 shadow-xl ring-8 ring-blue-500/10">
            {user.email?.[0].toUpperCase()}
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{user.email?.split('@')[0]}</h1>
            <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
          </div>
        </header>
        <Link href="/dashboard">
          <button className="px-6 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl font-bold text-sm transition-all">
            Voltar ao Início
          </button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-8 rounded-3xl shadow-xl space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="text-blue-600">👤</span> Informações da Conta
          </h2>
          <div className="space-y-4">
            <div className="pb-4 border-b border-gray-50 dark:border-gray-800">
              <p className="text-xs text-gray-400 font-medium mb-1">E-mail verificado</p>
              <p className="font-bold flex items-center gap-2">
                {user.emailVerified ? "Sim ✅" : "Não ⚠️"}
              </p>
            </div>
            <div className="pb-4 border-b border-gray-50 dark:border-gray-800">
              <p className="text-xs text-gray-400 font-medium mb-1">Data da última entrada</p>
              <p className="font-bold">{user.metadata.lastSignInTime}</p>
            </div>
            <div className="pb-4">
              <p className="text-xs text-gray-400 font-medium mb-1">ID da Conta</p>
              <p className="font-mono text-xs opacity-50">{user.uid}</p>
            </div>
          </div>
        </section>

        <section className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-8 rounded-3xl shadow-xl space-y-6">
           <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="text-blue-600">🛠️</span> Ações Rápidas
          </h2>
          <div className="space-y-3">
             <button
               onClick={() => alert("Funcionalidade em desenvolvimento")}
               className="w-full text-left p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-2xl font-bold text-sm transition-all flex items-center justify-between group"
             >
               Trocar Senha
               <span className="group-hover:translate-x-1 transition-transform">→</span>
             </button>
             <button
               onClick={signOutUser}
               className="w-full text-left p-4 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 rounded-2xl font-bold text-sm transition-all flex items-center justify-between group"
             >
               Sair da Conta
               <span className="group-hover:translate-x-1 transition-transform">→</span>
             </button>
          </div>
        </section>
      </div>
    </div>
  );
}
