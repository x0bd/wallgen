import { P5Canvas } from "@/components/P5Canvas";
import { Navbar } from "@/components/navbar";
import { Download, Settings, GridIcon, Waves, Hexagon, Wind } from "lucide-react";

export default function Home() {
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
          
          {/* Algorithm Controls */}
          <div className="w-full flex flex-wrap items-center justify-between gap-6">
            <div className="font-mono text-xs">
              <div className="flex items-center gap-2 mb-4">
                <GridIcon size={14} className="opacity-70" />
                <span className="opacity-70 uppercase tracking-wide">SELECT ALGORITHM</span>
              </div>
              <div className="flex flex-wrap gap-3">
                <button className="neo-brutal group px-3 py-2 text-xs font-mono bg-black text-white dark:bg-white dark:text-black hover:translate-y-[-4px] transition-all flex items-center gap-2">
                  <Waves size={14} className="group-hover:animate-pulse" />
                  <span>PERLIN NOISE</span>
                </button>
                <button className="neo-brutal group px-3 py-2 text-xs font-mono hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black hover:translate-y-[-4px] transition-all flex items-center gap-2">
                  <Hexagon size={14} className="group-hover:animate-pulse" />
                  <span>CELLULAR</span>
                </button>
                <button className="neo-brutal group px-3 py-2 text-xs font-mono hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black hover:translate-y-[-4px] transition-all flex items-center gap-2">
                  <Wind size={14} className="group-hover:animate-pulse" />
                  <span>FLOW FIELD</span>
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button className="neo-brutal flex items-center gap-2 bg-black text-white dark:bg-white dark:text-black py-2 px-4 font-mono text-xs uppercase hover:translate-y-[-4px] transition-all">
                <Settings size={14} className="animate-[spin_8s_linear_infinite]" />
                <span>Parameters</span>
              </button>
              
              <button className="neo-brutal flex items-center gap-2 py-2 px-4 font-mono text-xs uppercase hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black hover:translate-y-[-4px] transition-all">
                <Download size={14} />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>
      </main>

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
