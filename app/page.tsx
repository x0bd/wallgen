"use client"

import { P5Canvas } from "@/components/P5Canvas";
import { Navbar } from "@/components/navbar";
import { WidgetSidebar } from "@/components/widgets/widget-sidebar";
import { SaveProgress } from "@/components/GenerationProgress";
import { Waves, Hexagon, Wind, Image, CircleDashed, Palette } from "lucide-react";
import { useAlgorithm } from "@/context/algorithm-context";

export default function Home() {
  const { 
    algorithm, 
    setAlgorithm, 
    hasContent, 
    isSaving,
    finishSaving 
  } = useAlgorithm();
  
  return (
    <div className="relative w-full min-h-screen">
      {/* Navbar Component */}
      <Navbar />

      {/* Main Content - Canvas Center Stage */}
      <main className="pt-20 px-6 pb-16 flex flex-col items-center justify-center min-h-screen">
        <div className="w-full max-w-6xl mx-auto flex flex-col items-center gap-8">
          {/* Canvas as the Main Focus */}
          <div className="card-neo aspect-video w-full bg-black p-0 overflow-hidden relative">
            <P5Canvas 
              width={1200} 
              height={675} 
              className="w-full h-full"
            />
            
            {/* Saving Progress Overlay */}
            <SaveProgress 
              isSaving={isSaving} 
              onComplete={finishSaving}
              duration={3000} // 3 seconds for saving
            />
          </div>
          
          {/* Algorithm Selection */}
          <div className="w-full flex flex-wrap items-center justify-center gap-3">
            <button 
              onClick={() => setAlgorithm('perlinNoise')}
              disabled={isSaving}
              className={`neo-brutal group px-4 py-2.5 text-xs font-mono 
                ${algorithm === 'perlinNoise' 
                  ? 'bg-black text-white dark:bg-white dark:text-black' 
                  : 'hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black'} 
                hover:translate-y-[-4px] transition-all flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none`}
            >
              <Waves size={14} className={`${algorithm === 'perlinNoise' ? 'animate-pulse' : 'group-hover:animate-pulse'}`} />
              <span>PERLIN NOISE</span>
            </button>
            
            <button 
              onClick={() => setAlgorithm('cellular')}
              disabled={isSaving}
              className={`neo-brutal group px-4 py-2.5 text-xs font-mono 
                ${algorithm === 'cellular' 
                  ? 'bg-black text-white dark:bg-white dark:text-black' 
                  : 'hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black'} 
                hover:translate-y-[-4px] transition-all flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none`}
            >
              <Hexagon size={14} className={`${algorithm === 'cellular' ? 'animate-pulse' : 'group-hover:animate-pulse'}`} />
              <span>CELLULAR</span>
            </button>
            
            <button 
              onClick={() => setAlgorithm('flowPlotter')}
              disabled={isSaving}
              className={`neo-brutal group px-4 py-2.5 text-xs font-mono 
                ${algorithm === 'flowPlotter' 
                  ? 'bg-black text-white dark:bg-white dark:text-black' 
                  : 'hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black'} 
                hover:translate-y-[-4px] transition-all flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none`}
            >
              <Image size={14} className={`${algorithm === 'flowPlotter' ? 'animate-pulse' : 'group-hover:animate-pulse'}`} />
              <span>FLOW PLOTTER</span>
            </button>
            
            <button 
              onClick={() => setAlgorithm('abstract')}
              disabled={isSaving}
              className={`neo-brutal group px-4 py-2.5 text-xs font-mono 
                ${algorithm === 'abstract' 
                  ? 'bg-black text-white dark:bg-white dark:text-black' 
                  : 'hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black'} 
                hover:translate-y-[-4px] transition-all flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none`}
            >
              <CircleDashed size={14} className={`${algorithm === 'abstract' ? 'animate-pulse' : 'group-hover:animate-pulse'}`} />
              <span>ABSTRACT [WIP]</span>
            </button>
          </div>
        </div>
      </main>

      {/* Widget Sidebar */}
      <WidgetSidebar />

      {/* Minimal Footer */}
      <footer className="fixed bottom-0 left-0 w-full border-t border-black/10 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur-sm px-6 py-3">
        <div className="flex justify-between items-center max-w-6xl mx-auto">
          <p className="font-mono text-xs opacity-60">
            MADE WITH NEXT.JS & P5.JS
          </p>
          <p className="font-mono text-xs opacity-50">
            © 2024
          </p>
        </div>
      </footer>
    </div>
  );
}
