export type RenderStatus = "pending" | "processing" | "completed" | "failed";

export interface RenderJob {
  id?: string;
  userId: string;
  projectId: string;
  status: RenderStatus;
  progress: number;
  outputUrl?: string | null;
  errorMessage?: string | null;
  createdAt: any;
  updatedAt: any;
}

export interface RenderJobCounts {
  total: number;
  pending: number;
  completed: number;
  failed: number;
}
