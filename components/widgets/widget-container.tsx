"use client"

import { ReactNode, useState } from "react"
import { Sparkles, Sliders, X } from "lucide-react"
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
    right: "fixed top-20 right-6 bottom-16",
    left: "fixed top-20 left-6 bottom-16",
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
                className="mt-3 bg-black dark:bg-white text-white dark:text-black rounded-xl neo-brutal px-4 py-2.5 w-full text-center text-xs font-mono hover:-translate-y-[2px] transition-all flex items-center justify-center gap-1.5"
              >
                <X size={14} />
                <span>Close Panel</span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed ${buttonPositionClasses[position]} bg-black dark:bg-white text-white dark:text-black rounded-xl shadow-md backdrop-blur-sm neo-brutal p-2 z-40 hover:-translate-y-[2px] transition-all flex items-center gap-1.5`}
        aria-label="Toggle widgets"
      >
        {isOpen ? (
          <X size={16} className="opacity-90" />
        ) : (
          <>
            <Sliders size={14} className="opacity-90" />
            <span className="text-xs font-mono tracking-tight pr-1">Settings</span>
          </>
        )}
      </button>
    </>
  )
} 