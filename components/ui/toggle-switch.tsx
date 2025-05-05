"use client"

import { motion } from "motion/react"

interface ToggleSwitchProps {
  isOn: boolean
  onToggle: () => void
  size?: "sm" | "md"
  disabled?: boolean
  className?: string
}

export function ToggleSwitch({
  isOn,
  onToggle,
  size = "md",
  disabled = false,
  className = ""
}: ToggleSwitchProps) {
  const sizes = {
    sm: {
      track: "h-4 w-7",
      knob: "h-3 w-3",
      translate: "translate-x-3",
    },
    md: {
      track: "h-5 w-9",
      knob: "h-4 w-4",
      translate: "translate-x-4",
    }
  }
  
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isOn}
      disabled={disabled}
      onClick={onToggle}
      className={`relative ${sizes[size].track} rounded-full transition-colors p-0.5
        ${isOn 
          ? "bg-black dark:bg-white" 
          : "bg-black/10 dark:bg-white/10"
        }
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        ${className}
      `}
    >
      <motion.div
        initial={false}
        animate={{
          x: isOn ? (size === "sm" ? 12 : 16) : 0,
          scale: isOn ? 1 : 0.9,
        }}
        transition={{ 
          type: "spring", 
          stiffness: 500, 
          damping: 30 
        }}
        className={`${sizes[size].knob} rounded-full bg-white dark:bg-black
          ${isOn ? "shadow-sm" : ""}
        `}
      />
    </button>
  )
} 