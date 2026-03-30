"use client";

import { useSelectedVideo } from "@/context/selected-video-context";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function VideoPage() {
  const { selectedVideo } = useSelectedVideo();

  if (!selectedVideo) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
        <h2 className="text-2xl font-bold">Nenhuma cena selecionada</h2>
        <p className="text-gray-400">Por favor, escolha uma cena primeiro na aba de busca.</p>
        <Link href="/buscar-cenas">
          <Button variant="primary">Voltar para busca</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold mb-2">Detalhes da Cena</h1>
          <p className="text-gray-400">Informações coletadas via YouTube API</p>
        </div>
        <Link href="/buscar-cenas">
          <Button variant="outline">Alterar cena</Button>
        </Link>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
           <img src={selectedVideo.thumbnail} alt={selectedVideo.title} className="w-full h-full object-cover opacity-80" />
        </div>
        <div className="p-8 space-y-6">
          <div className="space-y-2">
             <h2 className="text-2xl font-bold text-white leading-tight" dangerouslySetInnerHTML={{ __html: selectedVideo.title }}></h2>
             <p className="text-lg text-blue-400 font-medium">{selectedVideo.channelTitle}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="bg-gray-800 p-4 rounded-lg">
                <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Video ID</span>
                <p className="text-white font-mono mt-1">{selectedVideo.id}</p>
             </div>
             <div className="bg-gray-800 p-4 rounded-lg">
                <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Provider</span>
                <p className="text-white mt-1">YouTube</p>
             </div>
          </div>

          <div className="pt-4 flex gap-4">
            <Link href="/editor" className="flex-1">
              <Button className="w-full py-6 text-lg font-bold shadow-xl shadow-blue-600/10 transition-all hover:scale-[1.02] active:scale-100">
                Continuar para Edição 🎬
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
