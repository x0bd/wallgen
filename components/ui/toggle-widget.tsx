"use client"

import { ReactNode, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { ChevronDown } from "lucide-react"

interface ToggleWidgetProps {
  title: string
  icon?: ReactNode
  children: ReactNode
  defaultOpen?: boolean
  className?: string
}

export function ToggleWidget({ 
  title, 
  icon, 
  children, 
  defaultOpen = false,
  className = ""
}: ToggleWidgetProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className={`overflow-hidden backdrop-blur-sm bg-white/50 dark:bg-black/50 rounded-xl border border-black/10 dark:border-white/10 shadow-sm ${className}`}>
      {/* Widget Header */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full px-4 py-3 flex items-center justify-between text-xs font-mono hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-colors group"
      >
        <div className="flex items-center gap-2.5">
          {icon && (
            <span className="opacity-80 group-hover:opacity-100 transition-opacity">
              {icon}
            </span>
          )}
          <span className="uppercase tracking-tight font-medium">{title}</span>
        </div>
        <motion.div
          initial={{ rotate: 0 }}
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="opacity-60 group-hover:opacity-100 transition-opacity"
        >
          <ChevronDown size={16} />
        </motion.div>
      </button>
      
      {/* Widget Content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ 
              height: "auto", 
              opacity: 1,
              transition: {
                height: { 
                  type: "spring", 
                  stiffness: 500, 
                  damping: 30,
                  duration: 0.3
                },
                opacity: { duration: 0.2 }
              }
            }}
            exit={{ 
              height: 0, 
              opacity: 0,
              transition: {
                height: { duration: 0.3 },
                opacity: { duration: 0.1 }
              }
            }}
            className="overflow-hidden"
          >
            <div className="px-4 py-4 border-t border-black/5 dark:border-white/5">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 