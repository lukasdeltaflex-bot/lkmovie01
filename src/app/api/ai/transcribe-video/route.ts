import { NextResponse } from "next/server";
import { transcribeVideo, translateTranscript } from "@/lib/ai/transcription";

export async function POST(req: Request) {
  try {
    const { videoTitle, duration } = await req.json();

    if (!videoTitle) {
      return NextResponse.json({ error: "Título do vídeo é obrigatório" }, { status: 400 });
    }

    // Gerar transcrição em PT-BR
    const ptSegments = await transcribeVideo(videoTitle, duration);
    
    // Gerar tradução em EN
    const enSegments = await translateTranscript(ptSegments);

    // Unificar segmentos (ou retornar separadamente se preferir)
    // Para renderização dupla, retornamos a lista combinada ou o objeto estruturado
    return NextResponse.json({ 
      segments: [...ptSegments, ...enSegments],
      ptSegments,
      enSegments
    });

  } catch (error: any) {
    console.error("Erro na transcrição:", error);
    return NextResponse.json({ error: "Falha ao processar transcrição" }, { status: 500 });
  }
}
