import { NextResponse } from "next/server";
import { searchYouTubeVideos } from "@/lib/youtube/search-videos";

/**
 * GET /api/youtube/search
 * API Route para busca segura de vídeos via YouTube Data API v3 com paginação e carregamento incremental.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const pageToken = searchParams.get("pageToken");
  const duration = searchParams.get("duration") as "any" | "short" | "medium" | "long" | null;
  const quality = searchParams.get("quality") as "any" | "high" | "standard" | null;
  const publishedAfter = searchParams.get("publishedAfter");
  const order = searchParams.get("order") as "relevance" | "date" | "viewCount" | "rating" | null;

  if (!q || !q.trim()) {
    return NextResponse.json({ error: "O termo de busca 'q' é obrigatório." }, { status: 400 });
  }

  try {
    const result = await searchYouTubeVideos(q.trim(), pageToken || undefined, 20, {
      duration: duration || "any",
      quality: quality || "any",
      publishedAfter: publishedAfter || undefined,
      order: order || "relevance"
    });
    
    // Retorna o objeto padronizado { items, nextPageToken, totalResults }
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("API Search Route Exception:", error.message);
    
    // Distinção de erros para o cliente
    const isApiKeyError = error.message.includes("Configuração ausente") || error.message.includes("keyInvalid");
    const status = isApiKeyError ? 500 : 502;
    
    return NextResponse.json(
      { error: error.message || "Falha ao consultar a API do YouTube no momento." }, 
      { status }
    );
  }
}
