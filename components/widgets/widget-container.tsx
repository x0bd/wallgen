"use client"

import { ReactNode, useState } from "react"
import { Sliders, X, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"

interface WidgetContainerProps {
  children: ReactNode
  position?: "right" | "left" | "bottom"
  className?: string
}

export function WidgetContainer({ 
  children, 
  position = "right",
  className = "" 
}: WidgetContainerProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  const positionClasses = {
    right: "fixed top-28 right-6 bottom-16",
    left: "fixed top-28 left-6 bottom-16",
    bottom: "fixed bottom-16 left-6 right-6"
  }
  
  const containerOpenClasses = {
    right: "translate-x-0",
    left: "translate-x-0",
    bottom: "translate-y-0"
  }
  
  const containerClosedClasses = {
    right: "translate-x-[calc(100%+24px)]",
    left: "translate-x-[calc(-100%-24px)]",
    bottom: "translate-y-[calc(100%+24px)]"
  }
  
  const buttonPositionClasses = {
    right: "left-0 -translate-x-full",
    left: "right-0 translate-x-full",
    bottom: "top-0 -translate-y-full left-1/2 -translate-x-1/2"
  }

  const buttonIcon = {
    right: <ChevronLeft size={16} className="opacity-90" />,
    left: <ChevronRight size={16} className="opacity-90" />,
    bottom: <ChevronUp size={16} className="opacity-90" />
  }
  
  return (
    <>
      <motion.div 
        className={`${positionClasses[position]} max-w-[320px] w-full space-y-3 pointer-events-none z-30 ${className}`}
        initial={containerClosedClasses[position]}
        animate={isOpen ? containerOpenClasses[position] : containerClosedClasses[position]}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 25, 
          mass: 0.8 
        }}
      >
        <div className="pointer-events-auto max-h-full overflow-y-auto hide-scrollbar pr-1">
          <div className="space-y-3">
            {/* Widget Title */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="neo-brutal bg-gradient-to-br from-black/[0.02] to-black/[0.05] dark:from-white/[0.02] dark:to-white/[0.05] p-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="h-px w-8 bg-black/40 dark:bg-white/40"></span>
                  <span className="text-xs font-mono uppercase tracking-widest text-black/40 dark:text-white/40">Controls</span>
                </div>
                <h3 className="text-lg font-mono tracking-tighter font-bold">
                  Settings<span className="text-black/20 dark:text-white/20">.</span>
                </h3>
              </div>
            </motion.div>
            
            {children}
          </div>
          
          {/* Close Button - Only shown when open */}
          <AnimatePresence>
            {isOpen && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ delay: 0.2 }}
                onClick={() => setIsOpen(false)}
                className="mt-3 bg-black dark:bg-white text-white dark:text-black neo-brutal px-4 py-2.5 w-full text-center text-xs font-mono transition-all flex items-center justify-center gap-1.5 hover:scale-[0.98]"
              >
                <X size={14} />
                <span>Close Panel</span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
      
      {/* Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ y: -4, scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={isOpen ? { opacity: 1 } : { opacity: 0.9 }}
        animate={isOpen ? { opacity: 1 } : { opacity: 0.9 }}
        transition={{ duration: 0.2 }}
        className={`fixed ${buttonPositionClasses[position]} bg-black dark:bg-white text-white dark:text-black rounded-xl shadow-lg backdrop-blur-sm neo-brutal p-2 z-40 transition-all flex items-center gap-1.5`}
        aria-label="Toggle widgets"
      >
        {isOpen ? (
          position === "right" ? <ChevronRight size={16} className="opacity-90" /> : 
          position === "left" ? <ChevronLeft size={16} className="opacity-90" /> : 
          <ChevronUp size={16} className="opacity-90" />
        ) : (
          <>
            <Sliders size={14} className="opacity-90" />
            <span className="text-xs font-mono tracking-tight pr-1">Settings</span>
          </>
        )}
      </motion.button>
    </>
  )
} 