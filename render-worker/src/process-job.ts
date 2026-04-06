import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import { db } from "./firebase";
import { downloadRemoteFileToTemp, uploadRenderedFile, createSignedReadUrl } from "./storage";
import { renderVideoJob } from "./ffmpeg";
import { RenderJobPayload } from "./types";

export async function processRenderJob(payload: RenderJobPayload) {
  const { renderJobId, userId, videoUrl, musicUrl, watermarkUrl } = payload;
  const tempFiles: string[] = [];

  try {
    await db.collection("renderJobs").doc(renderJobId).update({
      status: "processing",
      updatedAt: new Date(),
    });

    const videoPath = await downloadRemoteFileToTemp(videoUrl, "vid");
    tempFiles.push(videoPath);

    let watermarkPath: string | undefined;
    if (watermarkUrl) {
      watermarkPath = await downloadRemoteFileToTemp(watermarkUrl, "wm");
      tempFiles.push(watermarkPath);
    }

    let musicPath: string | undefined;
    if (musicUrl) {
      musicPath = await downloadRemoteFileToTemp(musicUrl, "mus");
      tempFiles.push(musicPath);
    }

    const outputName = `render_${renderJobId}_${Date.now()}.mp4`;
    const outputPath = path.join(os.tmpdir(), outputName);
    tempFiles.push(outputPath);

    await renderVideoJob(videoPath, outputPath, payload, watermarkPath, musicPath);
    
    // Verificar se o arquivo foi realmente gerado (Blindagem)
    if (!fs.existsSync(outputPath)) {
      throw new Error("FFmpeg finalizou mas o arquivo de saída não foi gerado.");
    }
    
    await db.collection("renderJobs").doc(renderJobId).update({ progress: 80, updatedAt: new Date() });

    // 6. Upload Final Video
    console.log(`[Job ${renderJobId}] Subindo para o Storage...`);
    const storagePath = `renders/${userId}/${outputName}`;
    await uploadRenderedFile(outputPath, storagePath);

    // 7. Get Signed URL
    console.log(`[Job ${renderJobId}] Gerando URL assinada...`);
    const downloadUrl = await createSignedReadUrl(storagePath);

    // 8. Update Firestore to "completed"
    await db.collection("renderJobs").doc(renderJobId).update({
      status: "completed",
      progress: 100,
      outputUrl: downloadUrl,
      updatedAt: new Date(),
    });

    console.log(`[Job ${renderJobId}] Job finalizado com sucesso: ${storagePath}`);

  } catch (error: any) {
    const errorMsg = error?.message || "Erro desconhecido na renderização";
    console.error(`[Job ${renderJobId}] FALHA CRÍTICA:`, errorMsg);
    
    await db.collection("renderJobs").doc(renderJobId).update({
      status: "failed",
      errorMessage: errorMsg,
      updatedAt: new Date(),
    });
  } finally {
    tempFiles.forEach(f => { if (fs.existsSync(f)) fs.unlinkSync(f); });
  }
}
