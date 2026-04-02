"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { YouTubeVideo } from "@/lib/youtube/search-videos";

interface VideoClip extends YouTubeVideo {
  startTime?: number;
  endTime?: number;
  zoom?: number;
  filters?: {
    brightness: number;
    contrast: number;
    saturation: number;
  };
}

interface TimelineContextType {
  clips: VideoClip[];
  activeClipIndex: number;
  addClip: (video: YouTubeVideo) => void;
  removeClip: (index: number) => void;
  setActiveClipIndex: (index: number) => void;
  setClips: (clips: VideoClip[]) => void;
  clearTimeline: () => void;
  // Legacy support for single-video components
  selectedVideo: YouTubeVideo | null;
  setSelectedVideo: (video: YouTubeVideo | null) => void;
}

const TimelineContext = createContext<TimelineContextType | undefined>(undefined);

export function SelectedVideoProvider({ children }: { children: ReactNode }) {
  const [clips, setClips] = useState<VideoClip[]>([]);
  const [activeClipIndex, setActiveClipIndex] = useState(0);

  const addClip = (video: YouTubeVideo) => {
    setClips(prev => [...prev, { ...video, zoom: 100, startTime: 0, endTime: 15 }]);
  };

  const removeClip = (index: number) => {
    setClips(prev => prev.filter((_, i) => i !== index));
    if (activeClipIndex >= clips.length - 1) setActiveClipIndex(Math.max(0, clips.length - 2));
  };

  const clearTimeline = () => {
    setClips([]);
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
      clips, 
      activeClipIndex, 
      addClip, 
      removeClip, 
      setActiveClipIndex, 
      setClips,
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
