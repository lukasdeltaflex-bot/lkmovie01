export interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  channel: string;
  channelTitle: string;
}

/**
 * Realiza a busca de vídeos DIRETAMENTE na YouTube Data API v3.
 * Esta função deve ser chamada apenas no LADO DO SERVIDOR (API Routes ou Server Actions)
 * para proteger a YOUTUBE_API_KEY.
 */
export async function searchYouTubeVideos(query: string): Promise<YouTubeVideo[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    console.error("ERRO: YOUTUBE_API_KEY não encontrada nas variáveis de ambiente.");
    throw new Error("Configuração do YouTube ausente. Verifique o arquivo .env");
  }

  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=20&q=${encodeURIComponent(
      query
    )}&type=video&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      console.error("YouTube API Error Details:", data);
      throw new Error(data.error?.message || "Erro na comunicação com a API do YouTube");
    }

    // Mapear os resultados para o formato da nossa interface
    return (data.items || []).map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
      channel: item.snippet.channelTitle,
      channelTitle: item.snippet.channelTitle,
    }));
  } catch (error: any) {
    console.error("Erro interno ao buscar vídeos:", error);
    throw error;
  }
}
