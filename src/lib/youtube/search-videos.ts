export interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
}

export async function searchYouTubeVideos(query: string): Promise<YouTubeVideo[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  
  if (!apiKey) {
    console.error("YOUTUBE_API_KEY is not defined");
    return [];
  }

  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.append("part", "snippet");
  url.searchParams.append("maxResults", "10");
  url.searchParams.append("type", "video");
  url.searchParams.append("q", query);
  url.searchParams.append("key", apiKey);

  try {
    const response = await fetch(url.toString());
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "YouTube API error");
    }

    return data.items.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.medium.url,
      channelTitle: item.snippet.channelTitle,
    }));
  } catch (error) {
    console.error("Error searching YouTube:", error);
    return [];
  }
}
