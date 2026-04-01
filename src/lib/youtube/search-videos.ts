export interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
}

export async function searchYouTubeVideos(query: string): Promise<YouTubeVideo[]> {
  try {
    // Chamada à nossa API Interna segura no SERVIDOR (Next.js API Route)
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Erro na busca interna");
    }

    // Se for sucesso, data já vem no formato YouTubeVideo[] do nosso backend
    return data as YouTubeVideo[];
  } catch (error) {
    console.error("Error searching via local API:", error);
    return [];
  }
}
