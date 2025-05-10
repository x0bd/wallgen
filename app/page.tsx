"use client"

import { P5Canvas } from "@/components/P5Canvas";
import { Navbar } from "@/components/navbar";
import { WidgetSidebar } from "@/components/widgets/widget-sidebar";
import { SaveProgress } from "@/components/GenerationProgress";
import { Waves, Hexagon, Wind, Image, CircleDashed, Palette, ChevronDown, X, Plus, Circle, Minus } from "lucide-react";
import { useAlgorithm } from "@/context/algorithm-context";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

export default function Home() {
  const { 
    algorithm, 
    setAlgorithm, 
    hasContent, 
    isSaving,
    finishSaving 
  } = useAlgorithm();

  const containerRef = useRef(null);
  
  return (
    <div ref={containerRef} className="relative w-full min-h-screen overflow-hidden">
      {/* Navbar Component */}
      <Navbar />

      {/* Floating Elements - Design Accents */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {Array.from({ length: 3 }).map((_, i) => (
          <motion.div
            key={`large-circle-${i}`}
            className="absolute rounded-full border border-black/5 dark:border-white/5"
            style={{
              width: `${300 + i * 200}px`,
              height: `${300 + i * 200}px`,
              left: `${(i * 30) - 150}px`,
              top: `${(i * 20) - 100}px`,
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: [0.3, 0.1, 0.3], 
              scale: [1, 1.1, 1],
              x: [0, 20, 0],
              y: [0, -30, 0]
            }}
            transition={{
              duration: 20 + i * 5,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
              delay: i * 2
            }}
          />
        ))}
        
        {/* Design accent elements */}
        {[
          { icon: X, top: "20%", left: "10%", size: 24, rotate: 12 },
          { icon: Plus, top: "40%", right: "8%", size: 28, rotate: -5 },
          { icon: Circle, bottom: "30%", left: "15%", size: 16, rotate: 0 },
          { icon: Minus, bottom: "20%", right: "15%", size: 32, rotate: 45 }
        ].map((item, i) => (
          <motion.div
            key={`accent-${i}`}
            className="absolute text-black/10 dark:text-white/10"
            style={{
              top: item.top,
              left: item.left,
              right: item.right,
              bottom: item.bottom,
            }}
            initial={{ opacity: 0, rotate: 0 }}
            animate={{ 
              opacity: 0.5,
              rotate: item.rotate,
              x: [0, 10, 0],
              y: [0, -10, 0]
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
              delay: i * 1.5
            }}
          >
            <item.icon size={item.size} />
          </motion.div>
        ))}
      </div>

      {/* Main Content - Canvas Center Stage */}
      <main className="pt-28 px-6 pb-24 min-h-screen">
        <div className="max-w-5xl mx-auto space-y-12">
          {/* Canvas Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-2"
          >
            <div className="flex items-center gap-2">
              <span className="h-px w-12 bg-black/40 dark:bg-white/40"></span>
              <span className="text-xs font-mono uppercase tracking-widest text-black/40 dark:text-white/40">
                {algorithm === 'perlinNoise' ? 'Perlin Noise' :
                 algorithm === 'cellular' ? 'Cellular Automata' :
                 algorithm === 'flowPlotter' ? 'Flow Plotter' : 'Abstract'}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-mono tracking-tighter font-bold">
              Create your wallpaper<span className="text-black/20 dark:text-white/20">.</span>
            </h1>
          </motion.div>

          {/* Canvas as the Main Focus */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="neo-brutal aspect-video w-full bg-black p-0 overflow-hidden relative"
          >
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
          </motion.div>
          
          {/* Algorithm Selection */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="space-y-5"
          >
            <div className="flex items-center gap-2">
              <span className="h-px w-12 bg-black/40 dark:bg-white/40"></span>
              <span className="text-xs font-mono uppercase tracking-widest text-black/40 dark:text-white/40">Algorithms</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <motion.button 
                onClick={() => setAlgorithm('perlinNoise')}
                disabled={isSaving}
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                className={`neo-brutal group px-4 py-3 text-xs font-mono relative overflow-hidden
                  ${algorithm === 'perlinNoise' 
                    ? 'bg-black text-white dark:bg-white dark:text-black' 
                    : 'hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black'} 
                  transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none`}
              >
                <Waves size={14} className={`${algorithm === 'perlinNoise' ? 'animate-pulse' : 'group-hover:animate-pulse'}`} />
                <span>PERLIN NOISE</span>
                {algorithm === 'perlinNoise' && (
                  <motion.div 
                    className="absolute bottom-0 left-0 h-[2px] bg-white dark:bg-black"
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </motion.button>
              
              <motion.button 
                onClick={() => setAlgorithm('cellular')}
                disabled={isSaving}
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                className={`neo-brutal group px-4 py-3 text-xs font-mono relative overflow-hidden
                  ${algorithm === 'cellular' 
                    ? 'bg-black text-white dark:bg-white dark:text-black' 
                    : 'hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black'} 
                  transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none`}
              >
                <Hexagon size={14} className={`${algorithm === 'cellular' ? 'animate-pulse' : 'group-hover:animate-pulse'}`} />
                <span>CELLULAR</span>
                {algorithm === 'cellular' && (
                  <motion.div 
                    className="absolute bottom-0 left-0 h-[2px] bg-white dark:bg-black"
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </motion.button>
              
              <motion.button 
                onClick={() => setAlgorithm('flowPlotter')}
                disabled={isSaving}
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                className={`neo-brutal group px-4 py-3 text-xs font-mono relative overflow-hidden
                  ${algorithm === 'flowPlotter' 
                    ? 'bg-black text-white dark:bg-white dark:text-black' 
                    : 'hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black'} 
                  transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none`}
              >
                <Image size={14} className={`${algorithm === 'flowPlotter' ? 'animate-pulse' : 'group-hover:animate-pulse'}`} />
                <span>FLOW PLOTTER</span>
                {algorithm === 'flowPlotter' && (
                  <motion.div 
                    className="absolute bottom-0 left-0 h-[2px] bg-white dark:bg-black"
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </motion.button>
              
              <motion.button 
                onClick={() => setAlgorithm('abstract')}
                disabled={isSaving}
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                className={`neo-brutal group px-4 py-3 text-xs font-mono relative overflow-hidden
                  ${algorithm === 'abstract' 
                    ? 'bg-black text-white dark:bg-white dark:text-black' 
                    : 'hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black'} 
                  transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none`}
              >
                <CircleDashed size={14} className={`${algorithm === 'abstract' ? 'animate-pulse' : 'group-hover:animate-pulse'}`} />
                <span>ABSTRACT</span>
                {algorithm === 'abstract' && (
                  <motion.div 
                    className="absolute bottom-0 left-0 h-[2px] bg-white dark:bg-black"
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </motion.button>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Widget Sidebar */}
      <WidgetSidebar />

      {/* Minimal Footer */}
      <footer className="fixed bottom-0 left-0 w-full border-t border-black/10 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur-sm px-6 py-3 z-10">
        <div className="flex justify-between items-center max-w-6xl mx-auto">
          <p className="font-mono text-xs opacity-60">
            ©2024 WallGen — Experimental Generative Art
          </p>
          <p className="font-mono text-xs opacity-50">
            <span className="hidden sm:inline">MADE WITH</span> NEXT.JS & P5.JS
          </p>
        </div>
      </footer>
    </div>
  );
}
