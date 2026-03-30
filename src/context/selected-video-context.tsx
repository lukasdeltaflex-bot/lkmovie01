"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { YouTubeVideo } from "@/types/video";

interface SelectedVideoContextType {
  selectedVideo: YouTubeVideo | null;
  setSelectedVideo: (video: YouTubeVideo | null) => void;
}

const SelectedVideoContext = createContext<SelectedVideoContextType | undefined>(undefined);

export function SelectedVideoProvider({ children }: { children: ReactNode }) {
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);

  return (
    <SelectedVideoContext.Provider value={{ selectedVideo, setSelectedVideo }}>
      {children}
    </SelectedVideoContext.Provider>
  );
}

export function useSelectedVideo() {
  const context = useContext(SelectedVideoContext);
  if (context === undefined) {
    throw new Error("useSelectedVideo must be used within a SelectedVideoProvider");
  }
  return context;
}
