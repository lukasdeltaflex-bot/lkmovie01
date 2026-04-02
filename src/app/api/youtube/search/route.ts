import { NextResponse } from "next/server";
import { searchYouTubeVideos } from "@/lib/youtube/search-videos";

/**
 * API Route para busca segura de vídeos (Server-side)
 * GET /api/youtube/search?q=termo-de-busca
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  if (!q || q.trim() === "") {
    return NextResponse.json(
      { error: "O parâmetro de busca 'q' é obrigatório." }, 
      { status: 400 }
    );
  }

  try {
    // Chama a função que agora faz o fetch real para o Google
    const videos = await searchYouTubeVideos(q);
    
    // Retorna os vídeos reais para o cliente
    return NextResponse.json(videos);
  } catch (error: any) {
    console.error("Erro na Rota de API YouTube:", error);
    return NextResponse.json(
      { error: error.message || "Falha ao processar a busca de vídeos" }, 
      { status: 500 }
    );
  }
}
