export type RenderStatus = "pending" | "processing" | "completed" | "failed";

export interface RenderJobPayload {
  renderJobId: string;
  userId: string;
  projectId: string;
  videoUrl: string;
  subtitleText?: string;
  subtitleType?: "none" | "pt" | "en" | "both";
  subtitleColor?: string;
  subtitleSize?: number;
  subtitlePosition?: string;
  watermarkUrl?: string;
  watermarkOpacity?: number;
  watermarkPosition?: string;
  watermarkScale?: number;
  musicUrl?: string;
  volumeVideo?: number;
  volumeMusic?: number;
  muteOriginal?: boolean;
  outputAspectRatio?: string;
}

