"use client"

import { Navbar } from "@/components/navbar"
import { motion, useScroll, useTransform } from "motion/react"
import { Github, Twitter, Instagram, Code, ChevronDown, X, Plus, Minus, Circle } from "lucide-react"
import Link from "next/link"
import { useRef } from "react"

export default function AboutPage() {
  const containerRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  })
  
  const textOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0.2])
  const textY = useTransform(scrollYProgress, [0, 0.2], [0, -50])
  
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

      {/* Main Content */}
      <main className="relative pt-28 px-6 pb-24 min-h-screen">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section with Parallax */}
          <motion.div
            style={{ opacity: textOpacity, y: textY }}
            className="mb-40 relative"
          >
            <div className="space-y-1">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="flex items-center gap-2 mb-4"
              >
                <span className="h-px w-12 bg-black/40 dark:bg-white/40"></span>
                <span className="text-xs font-mono uppercase tracking-widest text-black/40 dark:text-white/40">About</span>
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-[80px] md:text-[120px] font-mono tracking-tighter font-bold leading-none"
              >
                <span className="block">WallGen<span className="text-black/20 dark:text-white/20">.</span></span>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-lg md:text-xl font-mono max-w-lg text-black/60 dark:text-white/60"
              >
                Generative aesthetics for the modern web.
                <span className="bg-gradient-to-r from-black to-black/60 dark:from-white dark:to-white/60 bg-clip-text text-transparent ml-1">
                  Created by designers, for designers.
                </span>
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

          {/* Content Sections - With Design Elements */}
          <div className="space-y-32">
            {/* About Section */}
            <motion.section
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, margin: "-100px" }}
              className="relative"
            >
              <div className="absolute -left-10 top-0 text-[180px] font-mono font-bold opacity-5 select-none pointer-events-none">
                01
              </div>
              <div className="relative">
                <div className="grid grid-cols-12 gap-6">
                  <div className="col-span-12 md:col-span-5">
                    <h2 className="text-lg font-mono tracking-tight mb-4 font-bold">The Project</h2>
                  </div>
                  <div className="col-span-12 md:col-span-7">
                    <div className="space-y-6 text-black/80 dark:text-white/80">
                      <p className="text-base leading-relaxed">
                        WallGen is an experimental browser-based tool for creating 
                        generative wallpapers. It combines the power of <span className="font-medium">p5.js</span> and 
                        <span className="font-medium"> Next.js</span> with a minimal, type-focused design language.
                      </p>
                      <p className="text-sm leading-relaxed text-black/60 dark:text-white/60">
                        All rendering happens locally in your browser – no server-side processing or data collection.
                        Create, customize, and download stunning wallpapers in seconds.
                      </p>
                      
                      <div className="pt-4 grid grid-cols-2 gap-4 text-sm">
                        <motion.a 
                          href="https://github.com" 
                          target="_blank"
                          className="flex items-center justify-center gap-2 neo-brutal-sm py-3 hover:-translate-y-1 transition-transform"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Github size={14} />
                          <span className="font-mono">GitHub Repository</span>
                        </motion.a>
                        
                        <motion.a 
                          href="/"
                          className="flex items-center justify-center gap-2 neo-brutal-sm py-3 bg-black text-white dark:bg-white dark:text-black hover:-translate-y-1 transition-transform"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Code size={14} />
                          <span className="font-mono">View Codebase</span>
                        </motion.a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>
            
            {/* Technology Section */}
            <motion.section
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, margin: "-100px" }}
              className="relative"
            >
              <div className="absolute -left-10 top-0 text-[180px] font-mono font-bold opacity-5 select-none pointer-events-none">
                02
              </div>
              <div className="relative">
                <div className="grid grid-cols-12 gap-6">
                  <div className="col-span-12 md:col-span-5">
                    <h2 className="text-lg font-mono tracking-tight mb-4 font-bold">Technology</h2>
                  </div>
                  <div className="col-span-12 md:col-span-7">
                    <div className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[
                          { 
                            title: "p5.js", 
                            desc: "Creative coding library for the browser",
                            className: "bg-gradient-to-br from-black/[0.03] to-black/[0.08] dark:from-white/[0.03] dark:to-white/[0.08]"
                          },
                          { 
                            title: "Next.js", 
                            desc: "React framework for production",
                            className: "bg-gradient-to-br from-black/[0.05] to-black/[0.02] dark:from-white/[0.05] dark:to-white/[0.02]"
                          },
                          { 
                            title: "TypeScript", 
                            desc: "Static typing for JavaScript",
                            className: "bg-gradient-to-br from-black/[0.02] to-black/[0.06] dark:from-white/[0.02] dark:to-white/[0.06]"
                          },
                          { 
                            title: "motion", 
                            desc: "Animation library for React",
                            className: "bg-gradient-to-br from-black/[0.04] to-black/[0.01] dark:from-white/[0.04] dark:to-white/[0.01]"
                          }
                        ].map((tech, i) => (
                          <motion.div
                            key={tech.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1, duration: 0.5 }}
                            viewport={{ once: true }}
                            className={`neo-brutal p-4 ${tech.className} hover:-translate-y-1 transition-transform`}
                          >
                            <h3 className="text-base font-mono font-medium mb-1">{tech.title}</h3>
                            <p className="text-xs opacity-60">{tech.desc}</p>
                          </motion.div>
                        ))}
                      </div>
                      
                      <div className="neo-brutal overflow-hidden p-5">
                        <p className="font-mono text-sm opacity-70 leading-relaxed">
                          <span className="text-black dark:text-white opacity-50">// Modern stack for creative coding</span><br/>
                          <span className="text-indigo-500 dark:text-indigo-400">const</span> <span className="text-green-600 dark:text-green-400">wallGen</span> = &#123;<br/>
                          &nbsp;&nbsp;algorithms: [<span className="text-yellow-600 dark:text-yellow-400">"perlinNoise"</span>, <span className="text-yellow-600 dark:text-yellow-400">"cellular"</span>, <span className="text-yellow-600 dark:text-yellow-400">"flowField"</span>],<br/>
                          &nbsp;&nbsp;design: <span className="text-yellow-600 dark:text-yellow-400">"neo-brutalist"</span>,<br/>
                          &nbsp;&nbsp;performance: <span className="text-indigo-500 dark:text-indigo-400">true</span><br/>
                          &#125;;
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>
            
            {/* Algorithm Section */}
            <motion.section
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, margin: "-100px" }}
              className="relative"
            >
              <div className="absolute -left-10 top-0 text-[180px] font-mono font-bold opacity-5 select-none pointer-events-none">
                03
              </div>
              <div className="relative">
                <div className="grid grid-cols-12 gap-6">
                  <div className="col-span-12 md:col-span-5">
                    <h2 className="text-lg font-mono tracking-tight mb-4 font-bold">Algorithms</h2>
                  </div>
                  <div className="col-span-12 md:col-span-7">
                    <div className="space-y-6">
                      {[
                        { 
                          title: "Perlin Noise", 
                          desc: "Creates smooth, organic patterns that resemble natural phenomena.",
                          color: "bg-emerald-100 dark:bg-emerald-900/30"
                        },
                        { 
                          title: "Cellular Automata", 
                          desc: "Hexagonal Rock-Paper-Scissors rules creating emergent patterns.",
                          color: "bg-amber-100 dark:bg-amber-900/30"
                        },
                        { 
                          title: "Flow Field", 
                          desc: "Particles following vector fields derived from your images.",
                          color: "bg-sky-100 dark:bg-sky-900/30"
                        },
                        { 
                          title: "Abstract", 
                          desc: "Geometric abstractions using primitive shapes and color harmonies.",
                          color: "bg-rose-100 dark:bg-rose-900/30"
                        }
                      ].map((algo, i) => (
                        <motion.div
                          key={algo.title}
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1, duration: 0.5 }}
                          viewport={{ once: true }}
                          className="flex items-start gap-3"
                        >
                          <div className={`w-10 h-10 rounded-full ${algo.color} flex items-center justify-center shrink-0 mt-1`}>
                            <span className="font-mono text-sm font-bold">{i+1}</span>
                          </div>
                          <div>
                            <h3 className="text-base font-mono font-medium mb-1">{algo.title}</h3>
                            <p className="text-sm opacity-60">{algo.desc}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="fixed bottom-0 left-0 w-full border-t border-black/10 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur-sm px-6 py-3 z-10">
        <div className="flex justify-between items-center max-w-6xl mx-auto">
          <p className="font-mono text-xs opacity-60">
            ©2024 WallGen — Open Source
          </p>
          <div className="flex items-center gap-3">
            <motion.a 
              href="https://github.com" 
              target="_blank" 
              whileHover={{ y: -2 }}
              className="opacity-60 hover:opacity-100 transition-opacity"
            >
              <Github size={14} />
            </motion.a>
            <motion.a 
              href="https://twitter.com" 
              target="_blank" 
              whileHover={{ y: -2 }}
              className="opacity-60 hover:opacity-100 transition-opacity"
            >
              <Twitter size={14} />
            </motion.a>
            <motion.a 
              href="https://instagram.com" 
              target="_blank" 
              whileHover={{ y: -2 }}
              className="opacity-60 hover:opacity-100 transition-opacity"
            >
              <Instagram size={14} />
            </motion.a>
          </div>
        </div>
      </footer>
    </div>
  )
} 