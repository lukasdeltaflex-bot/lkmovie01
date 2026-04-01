"use client";

import React, { useState } from "react";
import { useBranding } from "@/context/branding-context";
import { useTheme } from "@/context/theme-context";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function ConfiguracoesPage() {
  const { branding, setBranding } = useBranding();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("aparencia");

  const [localBranding, setLocalBranding] = useState(branding);

  const handleSaveBranding = () => {
    setBranding(localBranding);
    alert("Configurações salvas com sucesso!");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalBranding(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <header className="flex flex-col gap-2">
        <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Configurações</h1>
        <p className="text-gray-500 dark:text-gray-400 font-medium">Personalize sua experiência visual, sistema e conta.</p>
      </header>

      <div className="flex gap-8 flex-col lg:flex-row">
        {/* Menu Lateral das Configurações */}
        <div className="lg:w-64 space-y-2 flex-shrink-0">
          <button 
            onClick={() => setActiveTab("aparencia")} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'aparencia' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
          >
            🎨 Aparência
          </button>
          <button 
            onClick={() => setActiveTab("branding")} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'branding' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
          >
            🏢 Branding (Selo)
          </button>
          <button 
            onClick={() => setActiveTab("conta")} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'conta' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
          >
            👤 Conta
          </button>
        </div>

        {/* Área de Conteúdo */}
        <div className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 shadow-2xl dark:shadow-none min-h-[500px]">
          
          {/* Aba APARÊNCIA */}
          {activeTab === "aparencia" && (
            <div className="space-y-8 animate-in fade-in">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Tema do Sistema</h2>
                <p className="text-gray-500 text-sm mb-6">Escolha o esquema de cores que melhor se adapta aos seus olhos.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div 
                    onClick={() => setTheme("light")}
                    className={`cursor-pointer rounded-2xl border-2 p-1 transition-all ${theme === 'light' ? 'border-blue-600 shadow-blue-600/20 shadow-lg' : 'border-gray-200 dark:border-gray-800 hover:border-gray-400'}`}
                  >
                     <div className="bg-gray-100 h-32 rounded-xl flex items-center justify-center text-4xl">☀️</div>
                     <p className="text-center font-bold text-gray-800 dark:text-white py-3">Claro</p>
                  </div>
                  <div 
                    onClick={() => setTheme("dark")}
                    className={`cursor-pointer rounded-2xl border-2 p-1 transition-all ${theme === 'dark' ? 'border-blue-600 shadow-blue-600/20 shadow-lg' : 'border-gray-200 dark:border-gray-800 hover:border-gray-400'}`}
                  >
                     <div className="bg-gray-900 h-32 rounded-xl flex items-center justify-center text-4xl">🌙</div>
                     <p className="text-center font-bold text-gray-800 dark:text-white py-3">Escuro</p>
                  </div>
                  <div 
                    onClick={() => setTheme("system")}
                    className={`cursor-pointer rounded-2xl border-2 p-1 transition-all ${theme === 'system' ? 'border-blue-600 shadow-blue-600/20 shadow-lg' : 'border-gray-200 dark:border-gray-800 hover:border-gray-400'}`}
                  >
                     <div className="bg-gradient-to-br from-gray-100 to-gray-900 h-32 rounded-xl flex items-center justify-center text-4xl">💻</div>
                     <p className="text-center font-bold text-gray-800 dark:text-white py-3">Sistema</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Aba BRANDING */}
          {activeTab === "branding" && (
            <div className="space-y-8 animate-in fade-in">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Identidade Visual</h2>
                <p className="text-gray-500 text-sm mb-6">Configure o nome e logo padrão da sua infraestrutura.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Nome do Aplicativo</label>
                    <Input 
                      value={localBranding.appName} 
                      onChange={(e) => setLocalBranding({...localBranding, appName: e.target.value})}
                      className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 h-12 text-lg text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Emoji/Ícone</label>
                    <Input 
                      value={localBranding.logo} 
                      onChange={(e) => setLocalBranding({...localBranding, logo: e.target.value})}
                      className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 h-12 text-lg text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="mt-8 space-y-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2">Assinaturas Padrão do Editor</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-3">
                       <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Marca d'água Global (PNG)</label>
                       <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-blue-500 rounded-2xl cursor-pointer bg-gray-50 dark:bg-gray-800/50 transition-colors">
                          {localBranding.defaultWatermark ? (
                             <img src={localBranding.defaultWatermark} className="h-20 object-contain" />
                          ) : (
                             <>
                               <span className="text-2xl mb-2 opacity-50">💧</span>
                               <span className="text-sm font-medium text-gray-500">Selecionar Selo</span>
                             </>
                          )}
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, "defaultWatermark")} />
                       </label>
                     </div>

                     <div className="space-y-3">
                       <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Tela Final Padrão</label>
                       <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-blue-500 rounded-2xl cursor-pointer bg-gray-50 dark:bg-gray-800/50 transition-colors">
                          {localBranding.defaultEndScreen ? (
                             <img src={localBranding.defaultEndScreen} className="h-20 object-contain" />
                          ) : (
                             <>
                               <span className="text-2xl mb-2 opacity-50">🏁</span>
                               <span className="text-sm font-medium text-gray-500">Selecionar Tela Final</span>
                             </>
                          )}
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, "defaultEndScreen")} />
                       </label>
                     </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <Button onClick={handleSaveBranding} className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-6 rounded-xl text-lg shadow-lg shadow-blue-600/30 transition-transform active:scale-95">
                    Salvar Branding
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Aba CONTA */}
          {activeTab === "conta" && (
            <div className="space-y-8 animate-in fade-in flex flex-col items-center justify-center text-center py-10">
               <div className="w-24 h-24 rounded-full bg-blue-600/10 text-blue-600 flex items-center justify-center text-5xl mb-4 border-4 border-blue-600/20">
                 👤
               </div>
               <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Gerenciamento de Conta</h2>
               <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">Para alterar sua senha ou informações de e-mail, por favor acesse a página de perfil completa.</p>
               <Link href="/perfil">
                 <Button className="mt-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold px-8 py-6 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100">
                   Ir para Meu Perfil
                 </Button>
               </Link>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
