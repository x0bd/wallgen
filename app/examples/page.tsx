"use client"

import { Navbar } from "@/components/navbar"
import { motion, useScroll, useTransform } from "motion/react"
import { ChevronDown, Download, ExternalLink } from "lucide-react"
import Link from "next/link"
import { useRef } from "react"
import Image from "next/image"

// Example wallpaper data structure with placeholder Unsplash images
const exampleWallpapers = [
  {
    id: "perlin-1",
    title: "Perlin Wave",
    algorithm: "Perlin Noise",
    description: "Smooth gradients with layered noise functions",
    imageUrl: "https://images.unsplash.com/photo-1550859492-d5da9d8e45f3?q=80&w=2070",
    creator: "wallgen",
    settings: {
      complexity: "High",
      palette: "Ocean Blues"
    }
  },
  {
    id: "cellular-1",
    title: "Cellular Emergence",
    algorithm: "Cellular Automata",
    description: "Emergent patterns from hexagonal grid rules",
    imageUrl: "https://images.unsplash.com/photo-1604871000636-074fa5117945?q=80&w=1974",
    creator: "wallgen",
    settings: {
      complexity: "Medium",
      palette: "Amber Glow"
    }
  },
  {
    id: "flow-1",
    title: "Abstract Flow",
    algorithm: "Flow Plotter",
    description: "Particle flows derived from vector fields",
    imageUrl: "https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=2070",
    creator: "wallgen",
    settings: {
      complexity: "Medium",
      palette: "Neon Dreams"
    }
  },
  {
    id: "abstract-1",
    title: "Geometric Harmony",
    algorithm: "Abstract",
    description: "Generative compositions with geometric primitives",
    imageUrl: "https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?q=80&w=1974",
    creator: "wallgen",
    settings: {
      complexity: "Low",
      palette: "Monochrome"
    }
  },
  {
    id: "perlin-2",
    title: "Terrain Map",
    algorithm: "Perlin Noise",
    description: "Topographic terrain-like visualizations",
    imageUrl: "https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?q=80&w=1980",
    creator: "wallgen",
    settings: {
      complexity: "High",
      palette: "Earth Tones"
    }
  },
  {
    id: "flow-2",
    title: "Particle Dance",
    algorithm: "Flow Plotter",
    description: "Dynamic particle movements following flow fields",
    imageUrl: "https://images.unsplash.com/photo-1506259091721-347e791bab0f?q=80&w=2070",
    creator: "wallgen",
    settings: {
      complexity: "High",
      palette: "Purple Haze"
    }
  }
];

// Filter examples by algorithm type
const getExamplesByAlgorithm = (algorithm: string) => {
  return exampleWallpapers.filter(example => example.algorithm === algorithm);
};

export default function ExamplesPage() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });
  
  const textOpacity = useTransform(scrollYProgress, [0, 0.1], [1, 0.2]);
  const textY = useTransform(scrollYProgress, [0, 0.1], [0, -50]);
  
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
      </div>

      {/* Main Content */}
      <main className="relative pt-28 px-6 pb-24 min-h-screen">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section with Parallax */}
          <motion.div
            style={{ opacity: textOpacity, y: textY }}
            className="mb-20 relative"
          >
            <div className="space-y-1">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="flex items-center gap-2 mb-4"
              >
                <span className="h-px w-12 bg-black/40 dark:bg-white/40"></span>
                <span className="text-xs font-mono uppercase tracking-widest text-black/40 dark:text-white/40">Gallery</span>
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-4xl md:text-5xl font-mono tracking-tighter font-bold leading-none"
              >
                <span className="block">Example Wallpapers<span className="text-black/20 dark:text-white/20">.</span></span>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-base md:text-lg font-mono max-w-lg text-black/60 dark:text-white/60"
              >
                A collection of generative art created with WallGen's algorithms.
              </motion.p>
            </div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-20 text-black/30 dark:text-white/30"
            >
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              >
                <ChevronDown size={24} />
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Examples Grid */}
          <div className="space-y-16">
            {/* Perlin Noise Examples */}
            <motion.section
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="h-px w-8 bg-black/40 dark:bg-white/40"></span>
                  <span className="text-xs font-mono uppercase tracking-widest text-black/40 dark:text-white/40">01</span>
                </div>
                <h2 className="text-2xl font-mono tracking-tighter font-bold">Perlin Noise</h2>
                <p className="text-sm text-black/60 dark:text-white/60 max-w-2xl mt-1">
                  Smooth, organic patterns that create natural-looking textures and gradients.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {getExamplesByAlgorithm("Perlin Noise").map((example, i) => (
                  <ExampleCard key={example.id} example={example} index={i} />
                ))}
              </div>
            </motion.section>
            
            {/* Cellular Automata Examples */}
            <motion.section
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="h-px w-8 bg-black/40 dark:bg-white/40"></span>
                  <span className="text-xs font-mono uppercase tracking-widest text-black/40 dark:text-white/40">02</span>
                </div>
                <h2 className="text-2xl font-mono tracking-tighter font-bold">Cellular Automata</h2>
                <p className="text-sm text-black/60 dark:text-white/60 max-w-2xl mt-1">
                  Emergent patterns from simple rules applied to a grid of cells.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {getExamplesByAlgorithm("Cellular Automata").map((example, i) => (
                  <ExampleCard key={example.id} example={example} index={i} />
                ))}
              </div>
            </motion.section>
            
            {/* Flow Plotter Examples */}
            <motion.section
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="h-px w-8 bg-black/40 dark:bg-white/40"></span>
                  <span className="text-xs font-mono uppercase tracking-widest text-black/40 dark:text-white/40">03</span>
                </div>
                <h2 className="text-2xl font-mono tracking-tighter font-bold">Flow Plotter</h2>
                <p className="text-sm text-black/60 dark:text-white/60 max-w-2xl mt-1">
                  Particles following vector fields derived from uploaded images.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {getExamplesByAlgorithm("Flow Plotter").map((example, i) => (
                  <ExampleCard key={example.id} example={example} index={i} />
                ))}
              </div>
            </motion.section>
            
            {/* Abstract Examples */}
            <motion.section
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="h-px w-8 bg-black/40 dark:bg-white/40"></span>
                  <span className="text-xs font-mono uppercase tracking-widest text-black/40 dark:text-white/40">04</span>
                </div>
                <h2 className="text-2xl font-mono tracking-tighter font-bold">Abstract</h2>
                <p className="text-sm text-black/60 dark:text-white/60 max-w-2xl mt-1">
                  Geometric compositions using primitive shapes and color harmonies.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {getExamplesByAlgorithm("Abstract").map((example, i) => (
                  <ExampleCard key={example.id} example={example} index={i} />
                ))}
              </div>
            </motion.section>
            
            {/* Create Your Own CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="neo-brutal p-8 bg-gradient-to-br from-black/[0.02] to-black/[0.05] dark:from-white/[0.02] dark:to-white/[0.05] text-center space-y-6"
            >
              <h2 className="text-2xl font-mono tracking-tighter font-bold">Create Your Own</h2>
              <p className="text-black/60 dark:text-white/60 max-w-xl mx-auto">
                These are just examples. The real magic happens when you create your own unique wallpapers with WallGen.
              </p>
              <motion.div
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link href="/"
                  className="inline-block neo-brutal px-6 py-3 text-sm font-mono 
                    bg-black text-white dark:bg-white dark:text-black
                    transition-all"
                >
                  START CREATING
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </main>

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

// Example Card Component
function ExampleCard({ example, index }: { example: any; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      viewport={{ once: true }}
      className="group"
    >
      <div className="neo-brutal overflow-hidden aspect-video relative">
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            <p className="text-sm font-mono">{example.description}</p>
            <div className="flex gap-6 mt-3">
              <div className="text-white/80 text-xs">
                <span className="block opacity-70">Complexity</span>
                <span className="font-medium">{example.settings.complexity}</span>
              </div>
              <div className="text-white/80 text-xs">
                <span className="block opacity-70">Palette</span>
                <span className="font-medium">{example.settings.palette}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="absolute top-0 right-0 z-20 p-2 space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="h-8 w-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
          >
            <Download size={14} className="text-white" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="h-8 w-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
          >
            <ExternalLink size={14} className="text-white" />
          </motion.button>
        </div>
        
        <Image 
          src={example.imageUrl} 
          alt={example.title}
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          width={800}
          height={450}
        />
      </div>
      <div className="mt-3 space-y-1">
        <h3 className="font-mono text-base font-medium">{example.title}</h3>
        <div className="flex justify-between items-center">
          <span className="text-xs font-mono text-black/60 dark:text-white/60">{example.algorithm}</span>
          <span className="text-xs font-mono text-black/40 dark:text-white/40">by {example.creator}</span>
        </div>
      </div>
    </motion.div>
  );
} 