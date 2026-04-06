import * as ffmpeg from "fluent-ffmpeg";
import * as ffmpegStatic from "ffmpeg-static";
import { RenderJobPayload } from "./types";

if (process.env.NODE_ENV !== "production") {
  ffmpeg.setFfmpegPath(ffmpegStatic as string);
}

export function buildVideoFilter(payload: RenderJobPayload, hasWatermark: boolean): string[] {
  const filters: string[] = [];

  if (payload.subtitleText) {
    const text = payload.subtitleText.replace(/[:']/g, "\\$&");
    const color = payload.subtitleColor || "white";
    const size = payload.subtitleSize || 24;
    const pos = payload.subtitlePosition || "bottom";
    const y = pos === "top" ? "40" : pos === "middle" ? "(h-text_h)/2" : "h-text_h-40";
    filters.push(`drawtext=text='${text}':fontcolor=${color}:fontsize=${size}:x=(w-text_w)/2:y=${y}:box=1:boxcolor=black@0.5:boxborderw=5`);
  }

  return filters;
}

export function buildAudioFilter(payload: RenderJobPayload, hasMusic: boolean): string[] {
  const filters: string[] = [];
  const vV = payload.volumeVideo ?? 1;
  
  if (payload.muteOriginal) {
    filters.push("volume=0");
  } else {
    filters.push(`volume=${vV}`);
  }
  return filters;
}

export function renderVideoJob(
  videoPath: string,
  outputPath: string,
  payload: RenderJobPayload,
  watermarkPath?: string,
  musicPath?: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    let command = ffmpeg(videoPath);
    const videoFilters = buildVideoFilter(payload, !!watermarkPath);
    
    if (watermarkPath) {
      command = command.input(watermarkPath);
      const scale = payload.watermarkScale || 0.15;
      const opacity = payload.watermarkOpacity || 0.5;
      const pos = payload.watermarkPosition || "top-right";
      let overlay = "W-w-20:20";
      if (pos === "top-left") overlay = "20:20";
      if (pos === "bottom-right") overlay = "W-w-20:H-h-20";
      if (pos === "bottom-left") overlay = "20:H-h-20";

      let complexFilter = `[1:v]scale=iw*${scale}:-1,format=rgba,colorchannelmixer=aa=${opacity}[wm];`;
      if (videoFilters.length > 0) {
        complexFilter += `[0:v]${videoFilters.join(",")}[vid];[vid][wm]overlay=${overlay}`;
      } else {
        complexFilter += `[0:v][wm]overlay=${overlay}`;
      }
      command = command.complexFilter(complexFilter);
    } else if (videoFilters.length > 0) {
      command = command.videoFilters(videoFilters);
    }

    if (payload.outputAspectRatio) {
      command = command.aspect(payload.outputAspectRatio);
    }

    if (musicPath) {
      command = command.input(musicPath);
      const vM = payload.volumeMusic ?? 0.5;
      const vV = payload.volumeVideo ?? 1;
      command = command.complexFilter([
        `${payload.muteOriginal ? "" : "[0:a]volume=" + vV + "[a1];"}[${watermarkPath ? 2 : 1}:a]volume=${vM}[a2];${payload.muteOriginal ? "[a2]" : "[a1][a2]amix=inputs=2:duration=first"}`
      ]);
    } else if (payload.muteOriginal) {
      command = command.noAudio();
    }

    command
      .on("error", (err) => {
        console.error("FFMPEG ERROR:", err);
        reject(err);
      })
      .on("end", () => {
        console.log("FFMPEG FINISHED");
        resolve();
      })
      .save(outputPath);
  });
}
