import { Timestamp } from "firebase/firestore";

export type ProjectStatus = "active" | "deleted";

export interface SavedProject {
  id?: string;
  userId: string;
  videoId: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  
  // Subtitles
  subtitleText: string;
  subtitleColor: string;
  subtitleSize: number;
  subtitlePosition: string;
  
  // Watermark
  watermarkUrl: string;
  watermarkOpacity: number;
  watermarkPosition: string;
  watermarkScale: number;
  
  // Final Screen
  endScreenUrl: string;
  
  // Audio
  audioMode: "keep" | "remove" | "mix";
  volumeVideo: number;
  volumeMusic: number;
  
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
