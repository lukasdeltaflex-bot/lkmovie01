import { NextRequest, NextResponse } from "next/server";
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
import fs from "fs";
import path from "path";
import os from "os";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

// Set ffmpeg path
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

export async function POST(req: NextRequest) {
  const jobID = uuidv4();
  const tmpDir = path.join(os.tmpdir(), `lkmovie-${jobID}`);
  
  try {
    const body = await req.json();
    const { 
      videoUrl, 
      subtitle, 
      watermark, 
      audioConfig,
      aspectRatio 
    } = body;

    if (!videoUrl) {
      return NextResponse.json({ error: "Missing video URL" }, { status: 400 });
    }

    // Ensure temp dir exists
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    const videoPath = path.join(tmpDir, "input_video.mp4");
    const musicPath = path.join(tmpDir, "input_music.mp3");
    const watermarkPath = path.join(tmpDir, "watermark.png");
    const outputPath = path.join(tmpDir, "output_render.mp4");

    // Download Assets
    console.log(`[FFMPEG] Downloading assets for job ${jobID}...`);
    
    // Download basic video
    await downloadFile(videoUrl, videoPath);
    
    // Watermark if exists
    if (watermark?.url) {
      await downloadFile(watermark.url, watermarkPath);
    }

    // Music if exists and reachable
    let hasMusic = false;
    if (audioConfig?.musicUrl && !audioConfig.musicUrl.startsWith('url-')) {
       try {
         await downloadFile(audioConfig.musicUrl, musicPath);
         hasMusic = true;
       } catch (e) {
         console.warn("[FFMPEG] Music download failed, skipping music", e);
       }
    }

    // Font Path Fallback (Windows/Linux)
    let fontPath = "C:/Windows/Fonts/arial.ttf";
    if (os.platform() !== 'win32') {
       fontPath = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf";
    }
    
    // If we don't find it, we use a generic name
    if (!fs.existsSync(fontPath)) {
        fontPath = "Arial"; 
    }

    // Subtitle Style params
    const fontSize = subtitle?.size || 24;
    const fontColor = subtitle?.color || "white";
    const boxColor = (subtitle?.backgroundColor === "transparent" || !subtitle?.backgroundColor) 
       ? "black@0" 
       : `${subtitle.backgroundColor.replace('#', '0x')}@0.6`;
    
    const subX = `(w-text_w)*${(subtitle?.x || 50) / 100}`;
    const subY = `(h-text_h)*${(subtitle?.y || 80) / 100}`;

    return new Promise<NextResponse>((resolve: (res: NextResponse) => void) => {
      let command = ffmpeg(videoPath);

      // Add music and watermark inputs if they exist
      if (hasMusic) command = command.input(musicPath);
      if (fs.existsSync(watermarkPath)) command = command.input(watermarkPath);

      // Complex Filter
      const complexFilter: any[] = [];
      
      // Step 1: Drawtext on video
      complexFilter.push({
        filter: 'drawtext',
        options: {
          text: subtitle?.text?.toUpperCase() || '',
          fontfile: fontPath,
          fontsize: fontSize * 2,
          fontcolor: fontColor,
          x: subX,
          y: subY,
          box: 1,
          boxcolor: boxColor,
          boxborderw: 10,
          shadowcolor: 'black@0.4',
          shadowx: 2,
          shadowy: 2
        },
        inputs: '0:v',
        outputs: 'v1'
      });

      // Step 2: Overlay watermark (if exists)
      if (fs.existsSync(watermarkPath)) {
        const watermarkInputIndex = hasMusic ? 2 : 1;
        complexFilter.push({
          filter: 'overlay',
          options: {
            x: `(W-w)*${(watermark?.x || 90) / 100}`,
            y: `(H-h)*${(watermark?.y || 10) / 100}`
          },
          inputs: ['v1', `${watermarkInputIndex}:v`],
          outputs: 'v2'
        });
      }

      const finalVideoOutput = fs.existsSync(watermarkPath) ? 'v2' : 'v1';

      command
        .complexFilter(complexFilter, finalVideoOutput)
        .audioFilters([
           // Mix video audio [0:a] and music audio [1:a]
           `amix=inputs=${hasMusic ? 2 : 1}:duration=first:dropout_transition=3`
        ])
        .outputOptions([
          '-c:v libx264',
          '-preset ultrafast',
          '-crf 23',
          '-pix_fmt yuv420p',
          '-c:a aac',
          '-b:a 192k'
        ])
        .on("start", (cmd: string) => console.log("[FFMPEG] Starting Render:", cmd))
        .on("error", (err: any) => {
          console.error("[FFMPEG] Render Error:", err);
          cleanup(tmpDir);
          resolve(NextResponse.json({ error: `FFmpeg failed: ${err.message}` }, { status: 500 }));
        })
        .on("end", () => {
          console.log("[FFMPEG] Render Finished:", jobID);
          try {
            const videoBuffer = fs.readFileSync(outputPath);
            cleanup(tmpDir);
            const response = new NextResponse(videoBuffer, {
              headers: {
                "Content-Type": "video/mp4",
                "Content-Disposition": `attachment; filename="lkmovie-${jobID}.mp4"`,
              }
            });
            resolve(response);
          } catch (e) {
            resolve(NextResponse.json({ error: "Failed to read output file" }, { status: 500 }));
          }
        })
        .save(outputPath);
    });

  } catch (err: any) {
    console.error("[API] Fatal Render Error:", err);
    cleanup(tmpDir);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

async function downloadFile(url: string, dest: string) {
  const response = await axios({
    url,
    method: "GET",
    responseType: "stream",
    timeout: 30000,
  });
  const writer = fs.createWriteStream(dest);
  response.data.pipe(writer);
  return new Promise<void>((resolve, reject) => {
    writer.on("finish", () => resolve());
    writer.on("error", reject);
    response.data.on("error", reject);
  });
}

function cleanup(dir: string) {
  try {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  } catch (e) {
    console.error("[API] Cleanup error:", e);
  }
}
