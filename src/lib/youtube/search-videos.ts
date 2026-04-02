export interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  channel: string;
}

export interface SearchResponse {
  items: YouTubeVideo[];
  nextPageToken?: string;
  totalResults?: number;
}

/**
 * Realiza a busca de vídeos na YouTube Data API v3 com suporte a paginação.
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
    throw new Error("YOUTUBE_API_KEY is not defined in server environment");
  }

  try {
    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    url.searchParams.append("part", "snippet");
    url.searchParams.append("maxResults", maxResults.toString());
    url.searchParams.append("type", "video");
    url.searchParams.append("q", query);
    url.searchParams.append("key", apiKey);
    
    if (pageToken) url.searchParams.append("pageToken", pageToken);
    if (filters?.duration) url.searchParams.append("videoDuration", filters.duration);
    if (filters?.quality) url.searchParams.append("videoDefinition", filters.quality);
    if (filters?.publishedAfter) url.searchParams.append("publishedAfter", filters.publishedAfter);
    if (filters?.order) url.searchParams.append("order", filters.order);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "YouTube API error");
    }

    const items = (data.items || []).map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
      channel: item.snippet.channelTitle,
    }));

    return {
      items,
      nextPageToken: data.nextPageToken,
      totalResults: data.pageInfo?.totalResults
    };
  } catch (error: any) {
    console.error("Library search error:", error);
    throw error;
  }
}
