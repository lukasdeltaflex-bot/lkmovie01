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
        timeout: 10000 // Aumentado para 10s para evitar timeouts espúrios
      });

      return NextResponse.json({ 
        success: true, 
        message: "Renderização iniciada na nuvem.",
        jobId: renderJobId
      });

    } catch (workerError: any) {
      const isTimeout = workerError.code === 'ECONNABORTED';
      const statusCode = workerError.response?.status || 502;
      const errorDetail = workerError.response?.data?.message || workerError.message;

      console.error(`[API] Erro ao chamar worker (Job ${renderJobId}):`, errorDetail);
      
      await updateRenderJobStatus(renderJobId, {
        status: "failed",
        errorMessage: isTimeout ? "Timeout ao tentar iniciar renderização." : `Erro no motor: ${errorDetail}`
      });

      return NextResponse.json({ 
        error: isTimeout ? "O motor de renderização demorou demais para responder." : "Erro na comunicação com o worker.",
        details: errorDetail
      }, { status: statusCode });
    }

  } catch (err: any) {
    console.error("[API] Fatal Render Proxy Error:", err);
    return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 });
  }
}
