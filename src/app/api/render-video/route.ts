import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { updateRenderJobStatus } from "@/lib/firebase/render-jobs";

/**
 * API Route: /api/render-video
 * Atua como proxy para o Cloud Run Worker, encaminhando todos os parâmetros de edição.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      renderJobId,
      userId,
      projectId,
      videoUrl, 
      musicUrl,
      watermarkUrl,
      // Novos parâmetros expandidos
      subtitleText,
      subtitleColor,
      subtitleSize,
      subtitlePosition,
      watermarkOpacity,
      watermarkPosition,
      watermarkScale,
      volumeVideo,
      volumeMusic,
      muteOriginal,
      outputAspectRatio
    } = body;

    if (!renderJobId || !videoUrl || !userId) {
      return NextResponse.json({ error: "Campos obrigatórios ausentes." }, { status: 400 });
    }

    const workerUrl = process.env.RENDER_WORKER_URL;

    if (!workerUrl) {
      console.warn("[API] RENDER_WORKER_URL não configurada.");
      return NextResponse.json({ 
        message: "Job registrado, mas motor de renderização offline.",
        jobId: renderJobId 
      });
    }

    console.log(`[API] Encaminhando job ${renderJobId} para o Worker.`);
    
    try {
      const response = await axios.post(`${workerUrl}/render`, {
        renderJobId,
        userId,
        projectId,
        videoUrl,
        musicUrl: musicUrl || null,
        watermarkUrl: watermarkUrl || null,
        subtitleText,
        subtitleColor,
        subtitleSize: Number(subtitleSize),
        subtitlePosition,
        watermarkOpacity: Number(watermarkOpacity),
        watermarkPosition,
        watermarkScale: Number(watermarkScale),
        volumeVideo: Number(volumeVideo),
        volumeMusic: Number(volumeMusic),
        muteOriginal: Boolean(muteOriginal),
        outputAspectRatio
      }, {
        timeout: 8000 
      });

      return NextResponse.json({ 
        success: true, 
        message: "Renderização iniciada na nuvem.",
        jobId: renderJobId
      });

    } catch (workerError: any) {
      console.error("[API] Erro no Worker:", workerError.message);
      
      await updateRenderJobStatus(renderJobId, {
        status: "error",
        errorMessage: "Motor de renderização indisponível."
      });

      return NextResponse.json({ 
        error: "Erro na comunicação com o worker.",
        details: workerError.message 
      }, { status: 502 });
    }

  } catch (err: any) {
    console.error("[API] Fatal Render Proxy Error:", err);
    return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 });
  }
}
