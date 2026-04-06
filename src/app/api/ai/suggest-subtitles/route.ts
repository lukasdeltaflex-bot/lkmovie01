import { NextResponse } from "next/server";
import { suggestSubtitles } from "@/lib/ai/suggest-subtitles";

export async function POST(request: Request) {
  try {
    const { videoTitle, context } = await request.json();

    if (!videoTitle) {
      return NextResponse.json({ error: "Título do vídeo é necessário." }, { status: 400 });
    }

    const suggestions = await suggestSubtitles(videoTitle, context);

    return NextResponse.json({ suggestions });

  } catch (error) {
    console.error("Erro na API de sugestão:", error);
    return NextResponse.json(
      { error: "Erro interno ao processar as sugestões" },
      { status: 500 }
    );
  }
}
