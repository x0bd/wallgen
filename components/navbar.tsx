"use client"

import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { Download, Github, Menu, Code, ExternalLink } from "lucide-react"
import { useState } from "react"
import { motion } from "motion/react"

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  
  return (
    <header className="fixed top-0 left-0 w-full border-b border-black/10 dark:border-white/10 bg-white/90 dark:bg-black/90 backdrop-blur-md z-50 px-6 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="h-8 w-8 rounded-lg bg-black dark:bg-white flex items-center justify-center group-hover:scale-110 transition-transform">
            <span className="text-white dark:text-black font-mono text-xs font-bold">W</span>
          </div>
          <span className="text-lg font-mono tracking-tighter hidden sm:block group-hover:translate-x-1 transition-transform">WALLGEN</span>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/about" className="text-sm font-mono opacity-70 hover:opacity-100 transition-opacity hover:-translate-y-[2px] flex items-center gap-1 group">
            <span>About</span>
            <motion.span 
              initial={{ width: 0 }}
              whileHover={{ width: '100%' }}
              className="absolute bottom-0 left-0 h-[1px] bg-current"
            />
          </Link>
          <Link href="#" className="text-sm font-mono opacity-70 hover:opacity-100 transition-opacity hover:-translate-y-[2px] flex items-center gap-1 group">
            <span>Algorithms</span>
            <motion.span 
              initial={{ width: 0 }}
              whileHover={{ width: '100%' }}
              className="absolute bottom-0 left-0 h-[1px] bg-current"
            />
          </Link>
          <Link href="#" className="text-sm font-mono opacity-70 hover:opacity-100 transition-opacity hover:-translate-y-[2px] flex items-center gap-1 group">
            <span>Examples</span>
            <motion.span 
              initial={{ width: 0 }}
              whileHover={{ width: '100%' }}
              className="absolute bottom-0 left-0 h-[1px] bg-current"
            />
          </Link>
          <Link href="https://github.com" target="_blank" className="text-sm font-mono opacity-70 hover:opacity-100 transition-opacity hover:-translate-y-[2px] flex items-center gap-1 relative">
            <Github size={15} />
            <span>Github</span>
            <ExternalLink size={12} className="absolute -right-4 top-0" />
          </Link>
        </nav>
        
        {/* Actions */}
        <div className="flex items-center gap-3">
          <button className="neo-brutal hidden sm:flex items-center gap-1 text-xs font-mono py-2 px-3 bg-black text-white dark:bg-white dark:text-black hover:-translate-y-[3px] hover:shadow-lg transition-all">
            <Code size={14} />
            <span>API</span>
          </button>
          <ThemeToggle />
          <button 
            onClick={() => setMenuOpen(!menuOpen)} 
            className="md:hidden flex items-center justify-center h-10 w-10 rounded-xl border border-black/20 dark:border-white/20 hover:-translate-y-[2px] transition-all"
          >
            <Menu size={20} />
          </button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {menuOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="md:hidden absolute top-full left-0 w-full bg-white/95 dark:bg-black/95 backdrop-blur-lg border-b border-black/10 dark:border-white/10 py-4 px-6"
        >
          <nav className="flex flex-col gap-4">
            <Link href="/about" className="text-sm font-mono py-2 hover:opacity-70 transition-opacity flex items-center justify-between">
              <span>About</span>
              <span className="text-xs opacity-50">01</span>
            </Link>
            <Link href="#" className="text-sm font-mono py-2 hover:opacity-70 transition-opacity flex items-center justify-between">
              <span>Algorithms</span>
              <span className="text-xs opacity-50">02</span>
            </Link>
            <Link href="#" className="text-sm font-mono py-2 hover:opacity-70 transition-opacity flex items-center justify-between">
              <span>Examples</span>
              <span className="text-xs opacity-50">03</span>
            </Link>
            <Link href="https://github.com" target="_blank" className="text-sm font-mono py-2 hover:opacity-70 transition-opacity flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Github size={16} />
                <span>Github</span>
              </div>
              <span className="text-xs opacity-50">04</span>
            </Link>
            <div className="flex gap-2 pt-4 mt-2 border-t border-black/10 dark:border-white/10">
              <button className="neo-brutal flex-1 flex items-center justify-center gap-2 text-xs font-mono py-3 px-3 bg-black text-white dark:bg-white dark:text-black">
                <Code size={14} />
                <span>API</span>
              </button>
              <button className="neo-brutal flex-1 flex items-center justify-center gap-2 text-xs font-mono py-3 px-3">
                <Download size={14} />
                <span>Export</span>
              </button>
            </div>
          </nav>
        </motion.div>
      )}
    </header>
  )
} 