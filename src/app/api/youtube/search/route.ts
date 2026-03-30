import { NextResponse } from "next/server";
import { searchYouTubeVideos } from "@/lib/youtube/search-videos";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  if (!q) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  try {
    const videos = await searchYouTubeVideos(q);
    return NextResponse.json(videos);
  } catch (error) {
    return NextResponse.json({ error: "Failed to search videos" }, { status: 500 });
  }
}
