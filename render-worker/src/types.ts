export interface RenderJobPayload {
  renderJobId: string;
  userId: string;
  projectId: string;
  videoUrl: string;
  subtitleText?: string;
  subtitleColor?: string;
  subtitleSize?: number;
  subtitlePosition?: string;
  watermarkUrl?: string;
  watermarkOpacity?: number;
  watermarkPosition?: string;
  watermarkScale?: number;
  musicUrl?: string | null;
  volumeVideo?: number;
  volumeMusic?: number;
  muteOriginal?: boolean;
  outputAspectRatio?: "16:9" | "9:16" | "1:1";
}

export type RenderStatus = "pending" | "processing" | "completed" | "failed";

export interface RenderJob {
  userId: string;
  projectId: string;
  status: RenderStatus;
  progress: number;
  outputUrl?: string;
  errorMessage?: string;
  videoUrl: string;
  musicUrl?: string | null;
  watermarkUrl?: string | null;
  createdAt: any;
  updatedAt: any;
}
