export type ProjectStatus = "draft" | "processing" | "completed" | "failed";

export interface ProjectWatermark {
  enabled: boolean;
  text: string;
  opacity: number;
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";
}

export interface ProjectSubtitle {
  enabled: boolean;
  language: string;
  style: string;
  fontSize: number;
  color: string;
}

export interface ProjectExport {
  format: "mp4" | "mov" | "avi";
  quality: "720p" | "1080p" | "4k";
  fps: number;
}

export interface Project {
  id: string;
  title: string;
  thumbnail: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  videoId: string;
  config: {
    watermark: ProjectWatermark;
    subtitle: ProjectSubtitle;
    export: ProjectExport;
  };
}
