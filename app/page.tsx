"use client"

import { P5Canvas } from "@/components/P5Canvas";
import { Navbar } from "@/components/navbar";
import { WidgetSidebar } from "@/components/widgets/widget-sidebar";
import { Waves, Hexagon, Wind, Play, Trash2 } from "lucide-react";
import { useAlgorithm } from "@/context/algorithm-context";

export default function Home() {
  const { algorithm, setAlgorithm, isGenerating, toggleGenerating, hasContent, clearCanvas } = useAlgorithm();
  
  return (
    <div className="relative w-full min-h-screen">
      {/* Navbar Component */}
      <Navbar />

      {/* Main Content - Canvas Center Stage */}
      <main className="pt-20 px-6 pb-16 flex flex-col items-center justify-center min-h-screen">
        <div className="w-full max-w-6xl mx-auto flex flex-col items-center gap-8">
          {/* Canvas as the Main Focus */}
          <div className="card-neo aspect-video w-full bg-black p-0 overflow-hidden">
            <P5Canvas 
              width={1200} 
              height={675} 
              className="w-full h-full"
            />
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={toggleGenerating}
              disabled={isGenerating}
              className="card-neo px-8 py-4 flex items-center justify-center gap-3 text-sm font-mono uppercase tracking-tight bg-black text-white hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              <Play size={16} />
              {isGenerating ? "Generating..." : "Generate Wallpaper"}
            </button>
            
            {hasContent && (
              <button
                onClick={clearCanvas}
                className="card-neo px-8 py-4 flex items-center justify-center gap-3 text-sm font-mono uppercase tracking-tight bg-white text-black border border-black/10 hover:-translate-y-0.5 transition-all"
              >
                <Trash2 size={16} />
                Clear Canvas
              </button>
            )}
          </div>
          
          {/* Algorithm Selection */}
          <div className="w-full flex flex-wrap items-center justify-center gap-3">
            <button 
              onClick={() => setAlgorithm('perlinNoise')}
              className={`neo-brutal group px-4 py-2.5 text-xs font-mono 
                ${algorithm === 'perlinNoise' 
                  ? 'bg-black text-white dark:bg-white dark:text-black' 
                  : 'hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black'} 
                hover:translate-y-[-4px] transition-all flex items-center gap-2`}
            >
              <Waves size={14} className={`${algorithm === 'perlinNoise' ? 'animate-pulse' : 'group-hover:animate-pulse'}`} />
              <span>PERLIN NOISE</span>
            </button>
            
            <button 
              onClick={() => setAlgorithm('cellular')}
              className={`neo-brutal group px-4 py-2.5 text-xs font-mono 
                ${algorithm === 'cellular' 
                  ? 'bg-black text-white dark:bg-white dark:text-black' 
                  : 'hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black'} 
                hover:translate-y-[-4px] transition-all flex items-center gap-2`}
            >
              <Hexagon size={14} className={`${algorithm === 'cellular' ? 'animate-pulse' : 'group-hover:animate-pulse'}`} />
              <span>CELLULAR</span>
            </button>
            
            <button 
              onClick={() => setAlgorithm('flowField')}
              className={`neo-brutal group px-4 py-2.5 text-xs font-mono 
                ${algorithm === 'flowField' 
                  ? 'bg-black text-white dark:bg-white dark:text-black' 
                  : 'hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black'} 
                hover:translate-y-[-4px] transition-all flex items-center gap-2`}
            >
              <Wind size={14} className={`${algorithm === 'flowField' ? 'animate-pulse' : 'group-hover:animate-pulse'}`} />
              <span>FLOW FIELD</span>
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
