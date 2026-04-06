import * as path from "path";
import * as os from "os";
import { firestore, admin } from "./firebase";
import { RenderJobPayload, RenderStatus } from "./types";
import { downloadFile, uploadFile, getSignedUrl, cleanupFiles } from "./storage";
import { renderVideoJob } from "./ffmpeg";

/**
 * Helper to create a user notification in Firestore.
 */
async function createUserNotification(userId: string, title: string, message: string, type: "success" | "error") {
  try {
    await firestore.collection("user_notifications").add({
      userId,
      title,
      message,
      type,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (e) {
    console.error("Error creating notification:", e);
  }
}

/**
 * Main orchestration function for processing a render job.
 */
export async function processRenderJob(payload: RenderJobPayload): Promise<void> {
  const { renderJobId, userId, projectId } = payload;
  const jobRef = firestore.collection("renderJobs").doc(renderJobId);
  const tempFiles: string[] = [];

  try {
    console.log(`Starting job ${renderJobId} for user ${userId}`);

    // 1. Mark job as processing
    await jobRef.update({
      status: "processing",
      progress: 0,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 2. Download files to temporary storage
    const inputVideo = await downloadFile(payload.videoUrl, "video");
    tempFiles.push(inputVideo);

    let inputWatermark: string | undefined;
    if (payload.watermarkUrl) {
      inputWatermark = await downloadFile(payload.watermarkUrl, "watermark");
      tempFiles.push(inputWatermark);
    }

    let inputMusic: string | undefined;
    if (payload.musicUrl) {
      inputMusic = await downloadFile(payload.musicUrl, "music");
      tempFiles.push(inputMusic);
    }

    const outputVideo = path.join(os.tmpdir(), `output-${renderJobId}.mp4`);
    tempFiles.push(outputVideo);

    // 3. Process with FFmpeg
    await renderVideoJob(
      inputVideo,
      outputVideo,
      payload,
      inputWatermark,
      inputMusic,
      async (progress) => {
        // Update progress in Firestore (throttle if needed)
        if (progress % 10 === 0) {
          await jobRef.update({ progress });
        }
      }
    );

    // 4. Upload result to Cloud Storage
    const storagePath = `renders/${userId}/${projectId}/${renderJobId}.mp4`;
    await uploadFile(outputVideo, storagePath);

    // 5. Generate signed URL
    const signedUrl = await getSignedUrl(storagePath);

    // 6. Update Firestore with completion
    await jobRef.update({
      status: "completed",
      progress: 100,
      outputUrl: signedUrl,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 7. Notify User
    await createUserNotification(
      userId, 
      "VÍDEO CONCLUÍDO! 🎉", 
      "Sua renderização foi finalizada com sucesso e já está pronta para baixar.", 
      "success"
    );

    console.log(`Job ${renderJobId} completed successfully.`);

  } catch (error: any) {
    console.error(`Job ${renderJobId} failed:`, error);

    // Update Firestore with error
    await jobRef.update({
      status: "failed",
      errorMessage: error.message || "Unknown error during rendering",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Notify User
    await createUserNotification(
      userId, 
      "ERRO NA RENDERIZAÇÃO! ❌", 
      `Não conseguimos processar seu vídeo: ${error.message || 'Erro desconhecido'}`, 
      "error"
    );

  } finally {
    // 8. Cleanup temporary files
    cleanupFiles(tempFiles);
  }
}
