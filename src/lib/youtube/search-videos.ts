export interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  channel: string;
}

export interface SearchResponse {
  items: YouTubeVideo[];
  nextPageToken?: string | null;
  totalResults?: number;
}

/**
 * Realiza a busca de vídeos na YouTube Data API v3 com suporte a paginação e tratamento de erros robusto.
 */
export async function searchYouTubeVideos(
  query: string, 
  pageToken?: string, 
  maxResults: number = 20,
  filters?: {
    duration?: "any" | "short" | "medium" | "long";
    quality?: "any" | "high" | "standard";
    publishedAfter?: string;
    order?: "relevance" | "date" | "viewCount" | "rating";
  }
): Promise<SearchResponse> {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    throw new Error("Configuração ausente: YOUTUBE_API_KEY não definida no ambiente.");
  }

  try {
    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    url.searchParams.append("part", "snippet");
    url.searchParams.append("maxResults", maxResults.toString());
    url.searchParams.append("type", "video");
    url.searchParams.append("q", query);
    url.searchParams.append("key", apiKey);
    url.searchParams.append("safeSearch", "strict");
    
    if (pageToken) url.searchParams.append("pageToken", pageToken);
    if (filters?.duration && filters.duration !== "any") url.searchParams.append("videoDuration", filters.duration);
    if (filters?.quality && filters.quality !== "any") url.searchParams.append("videoDefinition", filters.quality);
    if (filters?.publishedAfter) url.searchParams.append("publishedAfter", filters.publishedAfter);
    if (filters?.order) url.searchParams.append("order", filters.order);

    const response = await fetch(url.toString(), {
       next: { revalidate: 3600 } // Cache opcional de 1 hora
    });
    
    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.error?.message || "Erro desconhecido na API do YouTube";
      console.error("YouTube API error details:", data.error);
      throw new Error(errorMsg);
    }

    // Mapeamento padronizado garantindo que campos existam
    const items = (data.items || [])
      .filter((item: any) => item.id?.videoId) // Garante que é um vídeo
      .map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title || "Sem título",
        thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || "",
        channel: item.snippet.channelTitle || "Canal desconhecido",
      }));

    return {
      items,
      nextPageToken: data.nextPageToken || null,
      totalResults: data.pageInfo?.totalResults || 0
    };
  } catch (error: any) {
    console.error("searchYouTubeVideos error:", error.message);
    throw error;
  }
}
