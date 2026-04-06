import * as ffmpeg from "fluent-ffmpeg";
import { RenderJobPayload } from "./types";

/**
 * Builds the video filter string for FFmpeg.
 */
export function buildVideoFilter(payload: RenderJobPayload): string {
  const filters: string[] = [];

  // Aspect Ratio Handling
  if (payload.outputAspectRatio === "9:16") {
    filters.push("scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920");
  } else if (payload.outputAspectRatio === "1:1") {
    filters.push("scale=1080:1080:force_original_aspect_ratio=increase,crop=1080:1080");
  } else {
    filters.push("scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080");
  }

  // Watermark
  if (payload.watermarkUrl) {
    const scale = payload.watermarkScale || 0.15;
    const opacity = payload.watermarkOpacity || 0.8;
    const pos = payload.watermarkPosition || "top-right";
    let overlayPos = "W-w-10:10"; // Default: top-right

    switch (pos) {
      case "top-left": overlayPos = "10:10"; break;
      case "bottom-left": overlayPos = "10:H-h-10"; break;
      case "bottom-right": overlayPos = "W-w-10:H-h-10"; break;
    }

    // This part requires mapping with complex filters if multiple inputs are used, 
    // but we can pass it as a simplified version here for a single overlay.
    // For production, complex filters are better.
  }

  // Drawtext (Subtitle)
  if (payload.subtitleText) {
    const color = payload.subtitleColor || "white";
    const size = payload.subtitleSize || 48;
    const pos = payload.subtitlePosition || "bottom";
    let yPos = "h-120"; // Default: bottom

    switch (pos) {
      case "center": yPos = "h/2-text_h/2"; break;
      case "top": yPos = "80"; break;
    }

    // Simplified drawtext filter
    filters.push(`drawtext=text='${payload.subtitleText}':fontcolor=${color}:fontsize=${size}:x=(w-text_w)/2:y=${yPos}:box=1:boxcolor=black@0.5:boxborderw=20`);
  }

  return filters.join(",");
}

/**
 * Executes a rendering job using FFmpeg.
 */
export async function renderVideoJob(
  inputVideo: string,
  outputVideo: string,
  payload: RenderJobPayload,
  inputWatermark?: string,
  inputMusic?: string,
  onProgress?: (progress: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    let command = ffmpeg(inputVideo);

    // If watermark exists, add as second input
    if (inputWatermark) {
      command = command.input(inputWatermark);
    }

    // If music exists, add as third input
    if (inputMusic) {
      command = command.input(inputMusic);
    }

    // Complex filter for video + watermark
    let filterComplex = "";
    if (inputWatermark) {
      const scale = payload.watermarkScale || 0.2;
      const opacity = payload.watermarkOpacity || 0.8;
      const pos = payload.watermarkPosition || "top-right";
      let overlayPos = "main_w-overlay_w-20:20"; 

      switch (pos) {
        case "top-left": overlayPos = "20:20"; break;
        case "bottom-left": overlayPos = "20:main_h-overlay_h-20"; break;
        case "bottom-right": overlayPos = "main_w-overlay_w-20:main_h-overlay_h-20"; break;
      }

      filterComplex += `[1:v]scale=w=iw*${scale}:h=-1,format=rgba,colorchannelmixer=aa=${opacity}[wm];[0:v][wm]overlay=${overlayPos}`;
    } else {
      filterComplex += "[0:v]null";
    }

    // Subtitle filter
    if (payload.subtitleText) {
      const color = payload.subtitleColor || "white";
      const size = payload.subtitleSize || 64;
      const yPos = payload.subtitlePosition === "top" ? "100" : payload.subtitlePosition === "center" ? "(h-text_h)/2" : "h-150";
      filterComplex += `,drawtext=text='${payload.subtitleText.replace(/'/g, "\\'")}':fontcolor=${color}:fontsize=${size}:x=(w-text_w)/2:y=${yPos}:box=1:boxcolor=black@0.4:boxborderw=15`;
    }
    
    filterComplex += "[outv]";

    // Audio Mix logic
    let filterAudio = "";
    const videoVolume = payload.muteOriginal ? 0 : (payload.volumeVideo || 1.0);
    const musicVolume = payload.volumeMusic || 0.5;

    if (inputMusic) {
      filterAudio = `[0:a]volume=${videoVolume}[v_a];[2:a]volume=${musicVolume}[m_a];[v_a][m_a]amix=inputs=2:duration=first[outa]`;
    } else {
      filterAudio = `[0:a]volume=${videoVolume}[outa]`;
    }

    command
      .complexFilter([filterComplex])
      .outputOptions([
        "-map [outv]",
        "-map [outa]",
        "-c:v libx264",
        "-crf 23",
        "-preset fast",
        "-c:a aac",
        "-b:a 192k",
        "-pix_fmt yuv420p",
        "-movflags +faststart" // Optimized for web streaming
      ])
      .on("start", (cmd) => console.log("FFmpeg started:", cmd))
      .on("progress", (progress) => {
        if (onProgress && progress.percent) {
          onProgress(Math.floor(progress.percent));
        }
      })
      .on("error", (err, stdout, stderr) => {
        console.error("FFmpeg error:", err);
        console.error("FFmpeg stderr:", stderr);
        reject(err);
      })
      .on("end", () => {
        console.log("FFmpeg finished successfully");
        resolve();
      })
      .save(outputVideo);
  });
}
