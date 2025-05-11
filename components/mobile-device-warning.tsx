"use client"

import { Smartphone, Monitor, ArrowUpRight, Cpu } from "lucide-react"
import { motion } from "motion/react"
import { useEffect, useState } from "react"
import Link from "next/link"

export function MobileDeviceWarning() {
  const [isMobile, setIsMobile] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Check if screen size is mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    // Check on initial load
    checkMobile()
    setIsLoaded(true)
    
    // Add resize listener
    window.addEventListener('resize', checkMobile)
    
    // Clean up
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  if (!isLoaded) return null
  
  if (!isMobile) return null
  
  return (
    <div className="fixed inset-0 bg-white dark:bg-black z-50 flex flex-col items-center justify-center px-6 py-10 overflow-auto">
      <div className="neo-brutal max-w-sm mx-auto flex flex-col items-center p-8 text-center space-y-8 bg-gradient-to-br from-black/[0.02] to-black/[0.05] dark:from-white/[0.02] dark:to-white/[0.05]">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="h-20 w-20 rounded-full bg-black dark:bg-white flex items-center justify-center"
        >
          <Smartphone className="h-10 w-10 text-white dark:text-black" />
        </motion.div>
        
        <div className="space-y-4">
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-mono font-bold tracking-tight"
          >
            Desktop Experience
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-sm font-mono opacity-80"
          >
            WallGen is designed for larger screens. The mobile version is not supported yet.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-center gap-2 pt-2 text-sm font-mono opacity-70"
          >
            <Monitor size={14} className="opacity-60" />
            <span>For optimal experience, please use a desktop device</span>
          </motion.div>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-3 w-full"
        >
          <Link href="/examples" 
            className="flex items-center justify-center gap-2 text-xs font-mono py-3 border border-black/20 dark:border-white/20 w-full"
          >
            <span>View Example Wallpapers</span>
            <ArrowUpRight size={12} />
          </Link>
          
          <Link href="/about" 
            className="flex items-center justify-center gap-2 text-xs font-mono py-3 border border-black/20 dark:border-white/20 w-full"
          >
            <span>Learn About WallGen</span>
            <ArrowUpRight size={12} />
          </Link>
          
          <button
            onClick={() => setIsMobile(false)}
            className="flex items-center justify-center gap-2 text-xs font-mono py-3 w-full bg-black text-white dark:bg-white dark:text-black"
          >
            <span>Continue Anyway</span>
            <ArrowUpRight size={12} />
          </button>
        </motion.div>
      </div>
      
      <div className="flex items-center justify-center gap-2 mt-6 text-xs font-mono text-center">
        <Cpu size={14} className="opacity-60" />
        <p className="opacity-50 max-w-sm">
          WallGen is a GPU-intensive generative art application that may not perform well on mobile devices.
        </p>
      </div>
    </div>
  )
} 