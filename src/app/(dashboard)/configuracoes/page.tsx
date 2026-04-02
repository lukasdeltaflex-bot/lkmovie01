"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useBranding, Branding } from "@/context/branding-context";
import { useTheme } from "@/context/theme-context";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function ConfiguracoesPage() {
  const { branding, setBranding, loading: brandingLoading, showToast } = useBranding();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("aparencia");
  const [isSaving, setIsSaving] = useState(false);

  const [localBranding, setLocalBranding] = useState<Branding>(branding);

  // Sincronizar com o contexto quando carregar do Firebase
  useEffect(() => {
    setLocalBranding(branding);
  }, [branding]);

  const handleSaveBranding = async () => {
    setIsSaving(true);
    try {
      await setBranding(localBranding);
      showToast("Configurações salvas com sucesso!", "success");
    } catch (error) {
      console.error(error);
      showToast("Erro ao salvar configurações no Cloud.", "error");
    } finally {
      setIsSaving(false);
    }
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

  if (brandingLoading) {
    return (
      <div className="flex h-full items-center justify-center min-h-[60vh] animate-in fade-in duration-500 font-black text-xs uppercase tracking-widest text-gray-500">
        Carregando suas definições SaaS...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <header className="flex flex-col gap-2">
        <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest" style={{ color: branding.primaryColor }}>Painel de Controle SaaS</div>
        <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">Personalização do Sistema</h1>
        <p className="text-gray-500 dark:text-gray-400 font-medium">As alterações feitas aqui refletem em tempo real para todos os seus projetos.</p>
      </header>

      <div className="flex gap-8 flex-col lg:flex-row">
        {/* Menu Lateral das Configurações */}
        <div className="lg:w-72 space-y-3 shrink-0">
          {[
            { id: "aparencia", label: "🎨 Visual & Temas" },
            { id: "branding", label: "🏢 Branding SaaS" },
            { id: "conta", label: "👤 Gerenciar Conta" }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)} 
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === tab.id ? 'text-white shadow-2xl scale-105' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800'}`}
              style={activeTab === tab.id ? { backgroundColor: branding.primaryColor, boxShadow: `0 10px 30px -5px ${branding.primaryColor}66` } : {}}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Área de Conteúdo */}
        <div className="flex-1 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-4xl p-8 md:p-12 shadow-2xl dark:shadow-none min-h-[650px] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" style={{ backgroundColor: `${branding.primaryColor}1a` }}></div>

          {/* Aba APARÊNCIA */}
          {activeTab === "aparencia" && (
            <div className="space-y-10 animate-in fade-in duration-500 relative z-10">
              <section className="space-y-6">
                <div>
                  <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Esquema de Cores</h2>
                  <p className="text-gray-500 font-medium text-sm mt-1">Defina como o sistema se adapta à iluminação ambiente.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[
                    { id: "light", label: "Claro", icon: "☀️", bg: "bg-gray-50" },
                    { id: "dark", label: "Escuro", icon: "🌙", bg: "bg-gray-950" },
                    { id: "system", label: "Sistema", icon: "💻", bg: "bg-linear-to-br from-gray-50 to-gray-900" }
                  ].map((t) => (
                    <div 
                      key={t.id}
                      onClick={() => setTheme(t.id as any)}
                      className={`cursor-pointer rounded-4xl border-4 p-2 transition-all group ${theme === t.id ? 'scale-105 shadow-2xl' : 'border-transparent hover:bg-gray-50 dark:hover:bg-black/40'}`}
                      style={theme === t.id ? { borderColor: branding.primaryColor } : {}}
                    >
                       <div className={`${t.bg} h-40 rounded-3xl flex items-center justify-center text-5xl shadow-inner group-hover:rotate-3 transition-transform`}>{t.icon}</div>
                       <p className={`text-center font-black uppercase text-[10px] tracking-widest py-4 ${theme === t.id ? 'text-gray-950 dark:text-white' : 'text-gray-400'}`}>{t.label}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* Aba BRANDING */}
          {activeTab === "branding" && (
            <div className="space-y-10 animate-in fade-in duration-500 relative z-10">
              <section className="space-y-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-8">
                  <div className="space-y-1">
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Identidade Corporativa</h2>
                    <p className="text-gray-500 font-medium text-sm">Essas configurações definem a cara do seu SaaS para exportação.</p>
                  </div>
                  <Button 
                    onClick={handleSaveBranding} 
                    disabled={isSaving}
                    className="text-white font-black px-10 py-7 rounded-2xl shadow-2xl transition-all active:scale-95 disabled:opacity-50" 
                    style={{ backgroundColor: branding.primaryColor, boxShadow: `0 15px 30px -5px ${branding.primaryColor}66` }}
                  >
                    {isSaving ? "SALVANDO..." : "SALVAR NO CLOUD"}
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-2">Título Global do App</label>
                    <Input 
                      value={localBranding.appName} 
                      onChange={(e) => setLocalBranding({...localBranding, appName: e.target.value})}
                      className="h-16 text-xl font-black rounded-2xl bg-gray-50 dark:bg-black/50 border-gray-100 dark:border-gray-800"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-2">Logotipo (Emoji ou Imagem)</label>
                    <div className="flex gap-4">
                       <Input 
                        value={localBranding.logo} 
                        onChange={(e) => setLocalBranding({...localBranding, logo: e.target.value})}
                        placeholder="Emoji (ex: 🎥)"
                        className="h-16 w-32 text-center text-3xl rounded-2xl bg-gray-50 dark:bg-black/50 border-gray-100 dark:border-gray-800"
                       />
                       <label className="flex-1 h-16 border-4 border-dashed border-gray-100 dark:border-gray-800 rounded-2xl flex items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-black/40 transition-all font-black text-[10px] uppercase tracking-widest text-gray-400">
                          {localBranding.logo.length > 2 ? "Substituir Imagem" : "Carregar PNG/JPG"}
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, "logo")} />
                       </label>
                    </div>
                  </div>
                </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 p-8 bg-gray-50 dark:bg-black/40 rounded-4xl border border-gray-100 dark:border-gray-800">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Cor Primária (Principal)</label>
                    <div className="flex gap-4 items-center">
                       <input 
                         type="color" 
                         value={localBranding.primaryColor}
                         onChange={(e) => handleColorChange(e, "primaryColor")}
                         className="w-20 h-20 rounded-2xl cursor-pointer bg-transparent border-4 border-white dark:border-gray-800 shadow-xl"
                       />
                       <Input value={localBranding.primaryColor} onChange={(e) => setLocalBranding({...localBranding, primaryColor: e.target.value})} className="font-mono font-black tracking-widest text-lg h-16 rounded-2xl" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Cor Secundária (Destaques)</label>
                    <div className="flex gap-4 items-center">
                       <input 
                         type="color" 
                         value={localBranding.secondaryColor}
                         onChange={(e) => handleColorChange(e, "secondaryColor")}
                         className="w-20 h-20 rounded-2xl cursor-pointer bg-transparent border-4 border-white dark:border-gray-800 shadow-xl"
                       />
                       <Input value={localBranding.secondaryColor} onChange={(e) => setLocalBranding({...localBranding, secondaryColor: e.target.value})} className="font-mono font-black tracking-widest text-lg h-16 rounded-2xl" />
                    </div>
                  </div>
                </div>

                <div className="pt-10 space-y-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-500/10 dark:bg-blue-600/10 rounded-2xl flex items-center justify-center text-xl shadow-inner" style={{ color: branding.primaryColor }}>🎥</div>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Ativos Padrão do Editor</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                     <div className="space-y-4">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Selo d'água (PNG Recomendado)</label>
                       <label className="flex flex-col items-center justify-center w-full h-48 border-4 border-dashed border-gray-100 dark:border-gray-800 hover:border-primary rounded-[2.5rem] cursor-pointer bg-gray-50/50 dark:bg-black/30 transition-all group relative overflow-hidden" style={{ hover: { borderColor: branding.primaryColor } } as any}>
                          {localBranding.defaultWatermark ? (
                             <img src={localBranding.defaultWatermark} className="h-40 object-contain group-hover:scale-105 transition-transform duration-500 drop-shadow-2xl" />
                          ) : (
                             <div className="text-center p-6 space-y-2">
                               <p className="text-5xl opacity-20 group-hover:opacity-100 transition-opacity">💧</p>
                               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Carregar Selo Oficial</p>
                             </div>
                          )}
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, "defaultWatermark")} />
                       </label>
                     </div>

                     <div className="space-y-4">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Encerramento (Logo Final)</label>
                       <label className="flex flex-col items-center justify-center w-full h-48 border-4 border-dashed border-gray-100 dark:border-gray-800 hover:border-primary rounded-[2.5rem] cursor-pointer bg-gray-50/50 dark:bg-black/30 transition-all group relative overflow-hidden" style={{ hover: { borderColor: branding.primaryColor } } as any}>
                          {localBranding.defaultEndScreen ? (
                             <img src={localBranding.defaultEndScreen} className="h-40 object-contain group-hover:scale-105 transition-transform duration-500 drop-shadow-2xl" />
                          ) : (
                             <div className="text-center p-6 space-y-2">
                               <p className="text-5xl opacity-20 group-hover:opacity-100 transition-opacity">🏁</p>
                               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Carregar Logo Final</p>
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
            <div className="space-y-10 animate-in fade-in duration-500 py-10 flex flex-col items-center justify-center text-center relative z-10">
               <div className="w-32 h-32 rounded-[2.5rem] flex items-center justify-center text-6xl mb-8 shadow-2xl animate-bounce" style={{ background: `linear-gradient(to top right, ${branding.primaryColor}, ${branding.secondaryColor})`, boxShadow: `0 20px 40px -10px ${branding.primaryColor}80` }}>
                 👤
               </div>
               <div className="space-y-3">
                  <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">Central de Identidade</h2>
                  <p className="text-gray-500 font-medium max-w-sm text-lg">Suas informações de autenticação e privacidade são gerenciadas no painel de perfil oficial.</p>
               </div>
               <Link href="/perfil">
                 <Button className="mt-6 text-white font-black px-12 py-8 rounded-2xl text-lg transition-all transform hover:-translate-y-2 active:scale-95 shadow-2xl" style={{ backgroundColor: branding.primaryColor, boxShadow: `0 10px 25px -5px ${branding.primaryColor}66` }}>
                   Acessar Perfil Completo 🚀
                 </Button>
               </Link>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
