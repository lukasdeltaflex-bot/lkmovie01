"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useBranding, Branding } from "@/context/branding-context";
import { useTheme } from "@/context/theme-context";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function ConfiguracoesPage() {
  const { branding, setBranding } = useBranding();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("aparencia");

  const [localBranding, setLocalBranding] = useState<Branding>(branding);

  const handleSaveBranding = () => {
    setBranding(localBranding);
    alert("Configurações salvas com sucesso!");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: keyof Branding) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalBranding(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>, field: "primaryColor" | "secondaryColor") => {
    setLocalBranding(prev => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <header className="flex flex-col gap-2">
        <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Configurações</h1>
        <p className="text-gray-500 dark:text-gray-400 font-medium">Personalize sua experiência visual, sistema e conta.</p>
      </header>

      <div className="flex gap-8 flex-col lg:flex-row">
        {/* Menu Lateral das Configurações */}
        <div className="lg:w-64 space-y-2 shrink-0">
          <button 
            onClick={() => setActiveTab("aparencia")} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'aparencia' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            style={activeTab === 'aparencia' ? { backgroundColor: branding.primaryColor } : {}}
          >
            🎨 Aparência
          </button>
          <button 
            onClick={() => setActiveTab("branding")} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'branding' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            style={activeTab === 'branding' ? { backgroundColor: branding.primaryColor } : {}}
          >
            🏢 Branding
          </button>
          <button 
            onClick={() => setActiveTab("conta")} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'conta' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            style={activeTab === 'conta' ? { backgroundColor: branding.primaryColor } : {}}
          >
            👤 Conta
          </button>
        </div>

        {/* Área de Conteúdo */}
        <div className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 md:p-10 shadow-2xl dark:shadow-none min-h-[600px]">
          
          {/* Aba APARÊNCIA */}
          {activeTab === "aparencia" && (
            <div className="space-y-10 animate-in fade-in duration-500">
              <section>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Tema do Sistema</h2>
                <p className="text-gray-500 text-sm mb-6">Escolha o esquema de cores que melhor se adapta aos seus olhos.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { id: "light", label: "Claro", icon: "☀️", bg: "bg-gray-100" },
                    { id: "dark", label: "Escuro", icon: "🌙", bg: "bg-gray-900" },
                    { id: "system", label: "Sistema", icon: "💻", bg: "bg-linear-to-br from-gray-100 to-gray-900" }
                  ].map((t) => (
                    <div 
                      key={t.id}
                      onClick={() => setTheme(t.id as any)}
                      className={`cursor-pointer rounded-2xl border-2 p-1 transition-all ${theme === t.id ? 'border-primary' : 'border-gray-200 dark:border-gray-800 hover:border-gray-400'}`}
                      style={theme === t.id ? { borderColor: branding.primaryColor } : {}}
                    >
                       <div className={`${t.bg} h-32 rounded-xl flex items-center justify-center text-4xl shadow-inner`}>{t.icon}</div>
                       <p className="text-center font-bold text-gray-800 dark:text-white py-3">{t.label}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* Aba BRANDING */}
          {activeTab === "branding" && (
            <div className="space-y-10 animate-in fade-in duration-500">
              <section className="space-y-6">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Identidade do Sistema</h2>
                    <p className="text-gray-500 text-sm">Configure como o sistema se apresenta para você.</p>
                  </div>
                  <Button onClick={handleSaveBranding} className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-6 rounded-xl shadow-lg transition-all active:scale-95" style={{ backgroundColor: branding.primaryColor }}>
                    Salvar Alterações
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Nome do Projeto</label>
                    <Input 
                      value={localBranding.appName} 
                      onChange={(e) => setLocalBranding({...localBranding, appName: e.target.value})}
                      className="h-14 text-lg font-bold"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Símbolo (Emoji)</label>
                    <Input 
                      value={localBranding.logo} 
                      onChange={(e) => setLocalBranding({...localBranding, logo: e.target.value})}
                      className="h-14 text-center text-2xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Cor Primária</label>
                    <div className="flex gap-4 items-center">
                       <input 
                         type="color" 
                         value={localBranding.primaryColor}
                         onChange={(e) => handleColorChange(e, "primaryColor")}
                         className="w-16 h-16 rounded-xl cursor-pointer bg-transparent"
                       />
                       <Input value={localBranding.primaryColor} onChange={(e) => setLocalBranding({...localBranding, primaryColor: e.target.value})} className="font-mono" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Cor Secundária</label>
                    <div className="flex gap-4 items-center">
                       <input 
                         type="color" 
                         value={localBranding.secondaryColor}
                         onChange={(e) => handleColorChange(e, "secondaryColor")}
                         className="w-16 h-16 rounded-xl cursor-pointer bg-transparent"
                       />
                       <Input value={localBranding.secondaryColor} onChange={(e) => setLocalBranding({...localBranding, secondaryColor: e.target.value})} className="font-mono" />
                    </div>
                  </div>
                </div>

                <div className="pt-6 space-y-8">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">🎥</span> Assinaturas do Editor
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-3">
                       <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Marca d'água Default</label>
                       <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-200 dark:border-gray-800 hover:border-primary rounded-3xl cursor-pointer bg-gray-50/50 dark:bg-gray-800/30 transition-all group overflow-hidden">
                          {localBranding.defaultWatermark ? (
                             <img src={localBranding.defaultWatermark} className="h-32 object-contain group-hover:scale-110 transition-transform" />
                          ) : (
                             <div className="text-center p-4">
                               <p className="text-3xl mb-2 opacity-30 group-hover:opacity-100 transition-opacity">💧</p>
                               <p className="text-xs font-bold text-gray-400 group-hover:text-primary transition-colors">Importar Selo PNG</p>
                             </div>
                          )}
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, "defaultWatermark")} />
                       </label>
                     </div>

                     <div className="space-y-3">
                       <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Tela de Encerramento Default</label>
                       <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-200 dark:border-gray-800 hover:border-primary rounded-3xl cursor-pointer bg-gray-50/50 dark:bg-gray-800/30 transition-all group overflow-hidden">
                          {localBranding.defaultEndScreen ? (
                             <img src={localBranding.defaultEndScreen} className="h-32 object-contain group-hover:scale-110 transition-transform" />
                          ) : (
                             <div className="text-center p-4">
                               <p className="text-3xl mb-2 opacity-30 group-hover:opacity-100 transition-opacity">🏁</p>
                               <p className="text-xs font-bold text-gray-400 group-hover:text-primary transition-colors">Importar Logo Final</p>
                             </div>
                          )}
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, "defaultEndScreen")} />
                       </label>
                     </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* Aba CONTA */}
          {activeTab === "conta" && (
            <div className="space-y-8 animate-in fade-in duration-500 py-10 flex flex-col items-center justify-center text-center">
               <div className="w-28 h-28 rounded-full bg-linear-to-tr from-blue-600 to-purple-600 text-white flex items-center justify-center text-5xl mb-6 shadow-2xl" style={{ background: `linear-gradient(to top right, ${branding.primaryColor}, ${branding.secondaryColor})` }}>
                 👤
               </div>
               <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Gerenciamento de Conta</h2>
               <p className="text-gray-500 font-medium max-w-sm">Para alterar dados do seu perfil ou senha, utilize o painel de perfil dedicado.</p>
               <Link href="/perfil">
                 <Button className="mt-8 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold px-10 py-7 rounded-2xl text-lg transition-transform active:scale-95">
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
