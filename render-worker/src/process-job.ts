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

    const storagePath = `renders/${userId}/${outputName}`;
    await uploadRenderedFile(outputPath, storagePath);
    const downloadUrl = await createSignedReadUrl(storagePath);

    await db.collection("renderJobs").doc(renderJobId).update({
      status: "completed",
      outputUrl: downloadUrl,
      updatedAt: new Date(),
    });

  } catch (error: any) {
    console.error("Render Error:", error);
    await db.collection("renderJobs").doc(renderJobId).update({
      status: "failed",
      errorMessage: error.message,
      updatedAt: new Date(),
    });
  } finally {
    tempFiles.forEach(f => { if (fs.existsSync(f)) fs.unlinkSync(f); });
  }
}
