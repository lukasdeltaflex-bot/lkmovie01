import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/auth-context";
import { useBranding } from "@/context/branding-context";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { storage } from "@/lib/firebase/config";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
 
import { PlanManager } from "@/components/profile/PlanManager";
 
export default function PerfilPage() {
  const { user } = useAuth();
  const { branding, setBranding, showToast } = useBranding();
  
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
 
  // Sincroniza estado local com dados reais do branding
  useEffect(() => {
    if (branding) {
      setName(branding.displayName || user?.email?.split('@')[0] || "");
      setAvatarPreview(branding.photoURL || null);
    }
  }, [branding, user]);
  
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };
 
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast("Imagem muito grande (máx 2MB)", "error");
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
 
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSaving(true);
    try {
      let photoURL = branding.photoURL;
 
      // Upload de imagem real se houver arquivo selecionado
      if (selectedFile && storage) {
        const fileRef = ref(storage, `profile_photos/${user.uid}`);
        await uploadBytes(fileRef, selectedFile);
        photoURL = await getDownloadURL(fileRef);
      }
 
      // Persistência real no Firestore através do context
      await setBranding({ 
        displayName: name, 
        photoURL 
      });
      
      showToast("Perfil atualizado com sucesso!", "success");
      setSelectedFile(null);
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);
      showToast("Erro ao atualizar perfil", "error");
    } finally {
      setIsSaving(false);
    }
  };
 
  return (
    <div className="max-w-6xl mx-auto space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 px-4">
      <header className="space-y-4">
        <div className="flex items-center gap-3 text-[10px] font-black text-muted-custom uppercase tracking-[0.3em]">
           <span className="w-2 h-2 rounded-full" style={{ backgroundColor: branding.primaryColor }}></span>
           Performance Metrics & Account
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-foreground tracking-tighter uppercase italic leading-none">Minha Conta</h1>
        <p className="text-muted-custom font-medium text-lg">Gerencie sua identidade digital e seu plano de produção.</p>
      </header>
 
      {/* PLAN MANAGEMENT SECTION */}
      <PlanManager />
 
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 pt-10 border-t border-gray-100 dark:border-gray-800">
        {/* Avatar Section */}
        <div className="lg:col-span-4 flex flex-col items-center space-y-8">
           <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleAvatarChange} 
                accept="image/*" 
                className="hidden" 
              />
              <div className="w-56 h-56 rounded-[3.5rem] bg-linear-to-tr from-blue-600 to-violet-600 p-1 shadow-2xl relative z-10 overflow-hidden" style={{ backgroundImage: `linear-gradient(to top right, ${branding.primaryColor}, ${branding.secondaryColor})` }}>
                 <div className="w-full h-full bg-surface rounded-[3.3rem] flex items-center justify-center text-7xl font-black text-foreground italic overflow-hidden">
                    {avatarPreview ? (
                       <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                       name?.[0]?.toUpperCase() || "U"
                    )}
                 </div>
              </div>
              <button className="absolute -bottom-2 -right-2 w-16 h-16 bg-background rounded-2xl shadow-2xl border border-border-custom flex items-center justify-center text-2xl z-20 group-hover:scale-110 active:scale-95 transition-all text-foreground">📸</button>
           </div>
           
           <div className="text-center space-y-4 w-full">
              <div className="space-y-1">
                 <p className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">{name}</p>
                 <p className="text-[10px] font-bold text-muted-custom uppercase tracking-widest">ID: {user?.uid.slice(0, 8)}</p>
              </div>
           </div>
        </div>
 
        {/* Form Section */}
        <div className="lg:col-span-8">
           <form onSubmit={handleSave} className="bg-surface border border-border-custom rounded-[3rem] p-12 shadow-2xl space-y-10">
              <div className="space-y-8">
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-muted-custom uppercase tracking-[0.2em] ml-1">Nome de Exibição</label>
                    <Input 
                       value={name}
                       onChange={(e) => setName(e.target.value)}
                       className="h-16 rounded-2xl bg-background border border-border-custom focus:border-primary transition-all font-bold px-6 text-lg text-foreground"
                       placeholder="Seu Nome"
                    />
                 </div>
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-muted-custom uppercase tracking-[0.2em] ml-1">E-mail (Login Principal)</label>
                    <Input 
                       value={user?.email || ""}
                       disabled
                       className="h-16 rounded-2xl bg-background border border-border-custom opacity-50 font-bold px-6 cursor-not-allowed text-foreground"
                    />
                 </div>
              </div>
 
              <div className="pt-8 border-t border-gray-50 dark:border-gray-800 flex justify-end">
                 <Button 
                    type="submit" 
                    disabled={isSaving}
                    className="px-16 h-16 rounded-2xl font-black uppercase tracking-widest text-white shadow-xl hover:scale-[1.02] active:scale-95 transition-all w-full md:w-auto"
                    style={{ backgroundColor: branding.primaryColor }}
                 >
                    {isSaving ? "⏳ Salvando..." : "SALVAR ALTERAÇÕES ⚡"}
                 </Button>
              </div>
           </form>
        </div>
      </div>
    </div>
  );
}
