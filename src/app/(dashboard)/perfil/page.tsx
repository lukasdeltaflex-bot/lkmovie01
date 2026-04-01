"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/Button";

export default function PerfilPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Exemplo de como poderia ser uma edição
  const handleDesativar = () => {
    alert("Função de desativar conta virá em breve!");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <header className="flex flex-col gap-2">
        <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Meu Perfil</h1>
        <p className="text-gray-500 dark:text-gray-400 font-medium">Gerencie suas informações pessoais e segurança da conta.</p>
      </header>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 shadow-2xl dark:shadow-none space-y-12">
        
        {/* Info Header */}
        <div className="flex flex-col md:flex-row items-center gap-6">
           <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-4xl shadow-xl shadow-blue-600/30">
              {user?.email?.[0].toUpperCase() || "U"}
           </div>
           <div className="text-center md:text-left">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {user?.email?.split('@')[0] || "Usuário"}
              </h2>
              <p className="text-gray-500 font-medium">{user?.email}</p>
              <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-bold rounded-full border border-green-500/20">
                 <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                 Conta Ativa
              </div>
           </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-800 pt-8">
           <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Segurança e Acesso</h3>
           
           <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700">
                 <div>
                    <p className="font-bold text-gray-900 dark:text-white text-sm">Senha</p>
                    <p className="text-xs text-gray-500 mt-1">Última alteração: Desconhecida</p>
                 </div>
                 <Button variant="outline" className="text-xs bg-white dark:bg-gray-900" onClick={() => alert("Envio de redefinição de senha em breve")}>Alterar Senha</Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700">
                 <div>
                    <p className="font-bold text-gray-900 dark:text-white text-sm">Autenticação em Dois Fatores (2FA)</p>
                    <p className="text-xs text-gray-500 mt-1">Adicione uma camada extra de segurança.</p>
                 </div>
                 <span className="text-xs font-bold text-gray-400 bg-gray-200 dark:bg-gray-700 px-3 py-1.5 rounded-lg">Em Breve</span>
              </div>
           </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-800 pt-8">
           <h3 className="text-lg font-bold text-red-500 mb-6">Zona de Perigo</h3>
           
           <div className="flex items-center justify-between p-4 bg-red-500/5 dark:bg-red-500/10 rounded-2xl border border-red-500/20">
              <div>
                 <p className="font-bold text-red-600 dark:text-red-400 text-sm">Desativar Conta</p>
                 <p className="text-xs text-red-500/70 mt-1">Isso apagará permanentemente todos os seus projetos.</p>
              </div>
              <Button onClick={handleDesativar} className="text-xs bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20">Desativar</Button>
           </div>
        </div>

      </div>
    </div>
  );
}
