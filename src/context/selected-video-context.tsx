"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { YouTubeVideo } from "@/lib/youtube/search-videos";

interface VideoClip extends YouTubeVideo {
  url?: string;
  startTime?: number;
  endTime?: number;
  zoom?: number;
  filters?: {
    brightness: number;
    contrast: number;
    saturation: number;
  };
}

export interface TimelineEvent {
  id: string;
  type: "video" | "audio" | "subtitle" | "overlay";
  startTime: number;
  duration: number;
  content: string;
  track: number;
  metadata?: any;
}

interface TimelineContextType {
  timeline: TimelineEvent[];
  clips: VideoClip[];
  activeClipIndex: number;
  addClip: (video: YouTubeVideo) => void;
  removeClip: (index: number) => void;
  setActiveClipIndex: (index: number) => void;
  setClips: (clips: VideoClip[]) => void;
  addTimelineEvent: (event: Omit<TimelineEvent, "id">) => void;
  removeTimelineEvent: (id: string) => void;
  clearTimeline: () => void;
  // Legacy support
  selectedVideo: YouTubeVideo | null;
  setSelectedVideo: (video: YouTubeVideo | null) => void;
}

const TimelineContext = createContext<TimelineContextType | undefined>(undefined);

export function SelectedVideoProvider({ children }: { children: ReactNode }) {
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [clips, setClips] = useState<VideoClip[]>([]);
  const [activeClipIndex, setActiveClipIndex] = useState(0);

  const addClip = (video: YouTubeVideo) => {
    const id = `v-${Date.now()}`;
    const newClip = { ...video, zoom: 100, startTime: 0, endTime: 15 };
    setClips(prev => [...prev, newClip]);
    
    // Add to timeline V1 automatically
    addTimelineEvent({
      type: "video",
      startTime: timeline.reduce((acc, ev) => Math.max(acc, ev.startTime + ev.duration), 0),
      duration: 15,
      content: video.id, // Armazena o ID (YouTube) ou URL, não o thumbnail
      track: 0,
      metadata: { videoId: video.id }
    });
  };

  const addTimelineEvent = (event: Omit<TimelineEvent, "id">) => {
    setTimeline(prev => [...prev, { ...event, id: `ev-${Date.now()}` }]);
  };

  const removeTimelineEvent = (id: string) => {
    setTimeline(prev => prev.filter(e => e.id !== id));
  };

  const removeClip = (index: number) => {
    setClips(prev => prev.filter((_, i) => i !== index));
    if (activeClipIndex >= clips.length - 1) setActiveClipIndex(Math.max(0, clips.length - 2));
  };

  const clearTimeline = () => {
    setClips([]);
    setTimeline([]);
    setActiveClipIndex(0);
  };

  // Helper for single selection
  const setSelectedVideo = (video: YouTubeVideo | null) => {
    if (video) {
      setClips([{ ...video, zoom: 100, startTime: 0, endTime: 15 }]);
      setActiveClipIndex(0);
    } else {
      clearTimeline();
    }
  };

  const selectedVideo = clips[activeClipIndex] || null;

  return (
    <TimelineContext.Provider value={{ 
      timeline,
      clips, 
      activeClipIndex, 
      addClip, 
      removeClip, 
      setActiveClipIndex, 
      setClips,
      addTimelineEvent,
      removeTimelineEvent,
      clearTimeline,
      selectedVideo,
      setSelectedVideo
    }}>
      {children}
    </TimelineContext.Provider>
  );
}

export function useSelectedVideo() {
  const context = useContext(TimelineContext);
  if (context === undefined) {
    throw new Error("useSelectedVideo must be used within a SelectedVideoProvider");
  }
  return context;
}
