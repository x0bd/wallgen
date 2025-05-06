"use client";

import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface GenerationProgressProps {
  isGenerating: boolean;
  onComplete: () => void;
  duration?: number;
}

export function GenerationProgress({
  isGenerating,
  onComplete,
  duration = 10000,
}: GenerationProgressProps) {
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  
  useEffect(() => {
    if (!isGenerating) {
      setProgress(0);
      setFadeOut(false);
      return;
    }
    
    let startTime = Date.now();
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(newProgress);
      
      if (elapsed >= duration) {
        // Start fade out animation before completing
        setFadeOut(true);
        clearInterval(interval);
        
        // Give the fade animation time to play before completing
        setTimeout(() => {
          onComplete();
        }, 500);
      }
    }, 50);
    
    return () => clearInterval(interval);
  }, [isGenerating, duration, onComplete]);
  
  if (!isGenerating && !fadeOut) return null;
  
  return (
    <div className={`absolute inset-0 z-10 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
      <div className="flex flex-col items-center gap-4 p-8 bg-black border border-white/20 rounded-md">
        <Loader2 className={`w-8 h-8 text-white animate-spin ${progress >= 100 ? 'animate-ping' : 'animate-spin'}`} />
        
        <div className="w-48 h-2 bg-white/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-white transition-all duration-300 ease-linear" 
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <p className="text-white font-mono text-sm">
          {progress < 100 ? `Generating wallpaper... ${Math.round(progress)}%` : "Almost ready..."}
        </p>
      </div>
    </div>
  );
} 