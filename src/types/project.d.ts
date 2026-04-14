import { Timestamp } from "firebase/firestore";

export type ProjectStatus = "active" | "deleted";

export interface TimelineEvent {
  id: string;
  type: "video" | "audio" | "subtitle" | "overlay";
  startTime: number; // In seconds
  duration: number;
  content: string; // URL or Text
  track: number; // Layer (0, 1, 2...)
  metadata?: any;
}

export interface SavedProject {
  id?: string;
  userId: string;
  videoId: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  aspectRatio: "16:9" | "9:16" | "1:1";
  
  // Timeline (CapCut Engine)
  timeline?: TimelineEvent[];
  
  // Global / Legacy Subtitles (Backward Compatibility)
  subtitleText: string;
  subtitleTextEn?: string;
  subtitleColor: string;
  subtitleSize: number;
  subtitlePosition: string;
  subtitleType: "none" | "pt" | "en" | "both";
  subtitleFont: string;
  subtitlePreset?: string;
  isAutoSubtitle: boolean;
  
  // Watermark
  watermarkUrl: string;
  watermarkOpacity: number;
  watermarkPosition: string;
  watermarkScale: number;
  
  // Final Screen
  endScreenUrl: string;
  
  // Audio
  audioMode: "keep" | "remove" | "mix" | "music" | "none";
  volumeVideo: number;
  volumeMusic: number;
  musicUrl?: string;
  musicCategory?: string;
  
  // Metadata
  createdAt: Timestamp | any;
  updatedAt: Timestamp | any;
  deletedAt?: Timestamp | any | null;
  status: ProjectStatus;
}

export interface UserBranding {
  systemName: string;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  defaultWatermark: string;
  defaultEndScreen: string;
  appearanceMode: "light" | "dark" | "system";
}

export interface UserUsage {
  searchesCount: number;
  projectsCount: number;
  rendersCount: number;
  referralsCount?: number;
  lastResetAt: Timestamp | any;
}

export interface UserAnalytics {
  totalSearches: number;
  totalProjects: number;
  totalRenders: number;
  lastLoginAt: Timestamp | any;
  lastProjectAt: Timestamp | any;
}

export interface UserSettings extends UserBranding {
  userId: string;
  plan: "free" | "pro";
  hasSeenOnboarding: boolean;
  usage: UserUsage;
  analytics: UserAnalytics;
  updatedAt: Timestamp | any;
}
