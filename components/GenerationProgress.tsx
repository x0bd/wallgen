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
  
  useEffect(() => {
    if (!isGenerating) {
      setProgress(0);
      return;
    }
    
    let startTime = Date.now();
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(newProgress);
      
      if (elapsed >= duration) {
        clearInterval(interval);
        onComplete();
      }
    }, 50);
    
    return () => clearInterval(interval);
  }, [isGenerating, duration, onComplete]);
  
  if (!isGenerating) return null;
  
  return (
    <div className="absolute inset-0 z-10 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-4 p-8 bg-black border border-white/20 rounded-md">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
        
        <div className="w-48 h-2 bg-white/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-white transition-all duration-300 ease-linear" 
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <p className="text-white font-mono text-sm">
          Generating wallpaper... {Math.round(progress)}%
        </p>
      </div>
    </div>
  );
} 