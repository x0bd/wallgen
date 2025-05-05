"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { motion } from "motion/react"
import { Sun, Moon } from "lucide-react"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const isDark = theme === "dark"

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-black/20 dark:border-white/20 overflow-hidden shadow-[0_4px_10px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_10px_rgba(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] hover:translate-y-[-2px] transition-all"
      aria-label="Toggle theme"
    >
      <motion.div
        initial={{ opacity: 1, y: isDark ? "100%" : 0 }}
        animate={{ opacity: 1, y: isDark ? "100%" : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="absolute inset-0 bg-white flex items-center justify-center"
      >
        <Sun size={18} className="text-black" />
      </motion.div>
      <motion.div
        initial={{ opacity: 1, y: isDark ? 0 : "-100%" }}
        animate={{ opacity: 1, y: isDark ? 0 : "-100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="absolute inset-0 bg-black flex items-center justify-center"
      >
        <Moon size={18} className="text-white" />
      </motion.div>
    </button>
  )
} 