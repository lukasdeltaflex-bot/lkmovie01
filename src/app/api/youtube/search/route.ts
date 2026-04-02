import { NextResponse } from "next/server";
import { searchYouTubeVideos } from "@/lib/youtube/search-videos";

/**
 * API Route para busca segura de vídeos via YouTube Data API v3 com paginação.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const pageToken = searchParams.get("pageToken");
  const duration = searchParams.get("duration") as any;
  const quality = searchParams.get("quality") as any;
  const publishedAfter = searchParams.get("publishedAfter");
  const order = searchParams.get("order") as any;

  if (!q) {
    return NextResponse.json({ error: "O parâmetro de busca 'q' é obrigatório." }, { status: 400 });
  }

  try {
    const result = await searchYouTubeVideos(q, pageToken || undefined, 20, {
      duration,
      quality,
      publishedAfter: publishedAfter || undefined,
      order
    });
    
    // Retorna o objeto com items e nextPageToken
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("API Search Route Error:", error);
    
    const status = error.message.includes("YOUTUBE_API_KEY") ? 500 : 502;
    return NextResponse.json(
      { error: error.message || "Falha ao buscar vídeos no YouTube" }, 
      { status }
    );
  }
}
