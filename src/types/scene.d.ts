import { YouTubeVideo } from "./video";

export interface SceneResult {
  id: string;
  timestamp: string;
  description: string;
  score: number;
  thumbnail: string;
}

export interface SemanticInterpretation {
  action: string;
  object: string;
  context: string;
  mood: string;
}

export interface SceneSearch {
  query: string;
  interpretation: SemanticInterpretation;
  results: SceneResult[];
  status: "idle" | "searching" | "completed" | "error";
}

export interface SelectedVideo extends YouTubeVideo {
  startTime?: string;
  endTime?: string;
  duration?: number;
}
