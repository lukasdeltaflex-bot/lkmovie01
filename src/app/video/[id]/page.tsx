"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/auth-context";
import { duplicateProject } from "@/lib/firebase/projects";

export default function PublicVideoPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [renderJob, setRenderJob] = useState<any>(null);
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!db || !id) return;
      try {
        const jobSnap = await getDoc(doc(db, "renderJobs", id as string));
        if (jobSnap.exists()) {
          const jobData = jobSnap.data();
          setRenderJob(jobData);
          
          if (jobData.projectId) {
            const projSnap = await getDoc(doc(db, "projects", jobData.projectId));
            if (projSnap.exists()) setProject(projSnap.data());
          }
        }
      } catch (err) {
        console.error("Erro ao carregar vídeo público:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleCreateSimilar = async () => {
    if (!user) {
      router.push(`/login?redirect=/video/${id}`);
      return;
    }
    if (!renderJob?.projectId) return;

    setCopying(true);
    try {
      const newProjectId = await duplicateProject(renderJob.projectId, user.uid);
      router.push(`/editor?id=${newProjectId}`);
    } catch (err) {
      console.error("Erro ao duplicar projeto:", err);
    } finally {
      setCopying(false);
    }
  };

  if (loading) {
     return <div className="h-screen bg-black flex items-center justify-center"><div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!renderJob || renderJob.status !== "completed") {
    return <div className="h-screen bg-black flex flex-col items-center justify-center text-white space-y-4">
      <h1 className="text-4xl font-black italic">VÍDEO NÃO ENCONTRADO</h1>
      <Button onClick={() => router.push("/")}>VOLTAR PARA HOME</Button>
    </div>;
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 flex flex-col items-center animate-in fade-in duration-700">
      
      {/* BRANDING HEADER */}
      <header className="w-full max-w-4xl flex justify-between items-center mb-12">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black">LK</div>
            <span className="font-black italic text-xl tracking-tighter">LKMOVIE</span>
         </div>
         <Button onClick={() => router.push("/")} variant="ghost" className="text-[10px] uppercase font-black tracking-widest opacity-50">Explorar ➔</Button>
      </header>

      {/* PLAYER CONTAINER */}
      <div className="w-full max-w-4xl space-y-10">
         <div className={`relative aspect-video bg-gray-900 rounded-[2rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border-4 border-white/5`}>
            <video 
              src={renderJob.outputUrl} 
              controls 
              autoPlay 
              className="w-full h-full object-contain"
            />
         </div>

         {/* INFO & ACTIONS */}
         <div className="flex flex-col md:flex-row justify-between items-start gap-10 bg-white/5 p-10 rounded-[2.5rem] border border-white/10">
            <div className="space-y-4 flex-1">
               <h1 className="text-3xl font-black uppercase italic tracking-tighter leading-none">
                  {project?.title || "VÍDEO SEM TÍTULO"}
               </h1>
               <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em]">Criado em LKMOVIE PRO</p>
               <div className="pt-4 flex gap-4">
                  <div className="px-5 py-2 bg-white/10 rounded-xl text-[9px] font-black uppercase">Social Format</div>
                  <div className="px-5 py-2 bg-blue-500/20 text-blue-400 rounded-xl text-[9px] font-black uppercase animate-pulse">TRENDING ⚡</div>
               </div>
            </div>

            <div className="flex flex-col gap-4 w-full md:w-auto">
               <Button 
                onClick={handleCreateSimilar} 
                className="h-20 px-12 rounded-3xl bg-blue-600 font-black text-xl tracking-widest hover:scale-[1.02] shadow-2xl transition-all"
                disabled={copying}
               >
                  {copying ? "CRIANDO..." : "CRIAR IGUAL 🚀"}
               </Button>
               <p className="text-[9px] font-bold text-gray-500 uppercase text-center">Clique para editar este vídeo instantaneamente</p>
            </div>
         </div>
      </div>

      <footer className="mt-20 opacity-20 text-[10px] font-black uppercase tracking-widest pb-10">
        POWERED BY LKMOVIE01 ENGINE
      </footer>
    </div>
  );
}
