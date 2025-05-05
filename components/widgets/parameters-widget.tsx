"use client"

import { Settings, RotateCcw, Wand2, Zap } from "lucide-react"
import { ToggleWidget } from "@/components/ui/toggle-widget"
import { ToggleSwitch } from "@/components/ui/toggle-switch"
import { Slider } from "@/components/ui/slider"
import { useState } from "react"

export function ParametersWidget() {
  const [noiseScale, setNoiseScale] = useState(50)
  const [speed, setSpeed] = useState(30)
  const [complexity, setComplexity] = useState(70)
  const [density, setDensity] = useState(60)
  
  const [autoAdjust, setAutoAdjust] = useState(true)
  const [randomizeOnLoad, setRandomizeOnLoad] = useState(false)
  
  const handleReset = () => {
    setNoiseScale(50)
    setSpeed(30)
    setComplexity(70)
    setDensity(60)
  }
  
  return (
    <ToggleWidget 
      title="Parameters"
      icon={<Settings size={14} className="animate-[spin_10s_linear_infinite]" />}
      className="w-full"
      defaultOpen={true}
    >
      <div className="space-y-5">
        {/* Visualization */}
        <div className="rounded-lg overflow-hidden aspect-video bg-gradient-to-br from-black/[0.03] to-black/[0.05] dark:from-white/[0.03] dark:to-white/[0.05] flex items-center justify-center border border-black/10 dark:border-white/10">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-black/10 to-black/20 dark:from-white/10 dark:to-white/20 flex items-center justify-center">
            <Settings size={24} className="text-black/20 dark:text-white/20 animate-[spin_4s_linear_infinite]" />
          </div>
        </div>
        
        {/* Noise Scale */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono tracking-tight">Noise Scale</label>
            <span className="text-xs font-mono bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded-md min-w-[2.5rem] text-center">{noiseScale}%</span>
          </div>
          <Slider 
            value={[noiseScale]}
            onValueChange={(value) => setNoiseScale(value[0])}
            min={0}
            max={100}
            step={1}
            className="[&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_[role=slider]]:bg-black [&_[role=slider]]:dark:bg-white"
          />
        </div>
        
        {/* Speed */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono tracking-tight">Animation Speed</label>
            <span className="text-xs font-mono bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded-md min-w-[2.5rem] text-center">{speed}%</span>
          </div>
          <Slider 
            value={[speed]}
            onValueChange={(value) => setSpeed(value[0])}
            min={0}
            max={100}
            step={1}
            className="[&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_[role=slider]]:bg-black [&_[role=slider]]:dark:bg-white"
          />
        </div>
        
        {/* Complexity */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono tracking-tight">Complexity</label>
            <span className="text-xs font-mono bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded-md min-w-[2.5rem] text-center">{complexity}%</span>
          </div>
          <Slider 
            value={[complexity]}
            onValueChange={(value) => setComplexity(value[0])}
            min={0}
            max={100}
            step={1}
            className="[&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_[role=slider]]:bg-black [&_[role=slider]]:dark:bg-white"
          />
        </div>
        
        {/* Density */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono tracking-tight">Density</label>
            <span className="text-xs font-mono bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded-md min-w-[2.5rem] text-center">{density}%</span>
          </div>
          <Slider 
            value={[density]}
            onValueChange={(value) => setDensity(value[0])}
            min={0}
            max={100}
            step={1}
            className="[&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_[role=slider]]:bg-black [&_[role=slider]]:dark:bg-white"
          />
        </div>
        
        {/* Advanced Options */}
        <div className="space-y-3 pt-2 border-t border-black/5 dark:border-white/5">
          <p className="text-xs font-mono tracking-tight">ADVANCED OPTIONS</p>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 rounded-md bg-black/[0.02] dark:bg-white/[0.02] border border-black/10 dark:border-white/10">
              <div className="flex items-center gap-1.5">
                <Wand2 size={14} className="opacity-60" />
                <span className="text-xs font-mono">Auto-adjust</span>
              </div>
              <ToggleSwitch isOn={autoAdjust} onToggle={() => setAutoAdjust(!autoAdjust)} />
            </div>
            
            <div className="flex items-center justify-between p-2 rounded-md bg-black/[0.02] dark:bg-white/[0.02] border border-black/10 dark:border-white/10">
              <div className="flex items-center gap-1.5">
                <Zap size={14} className="opacity-60" />
                <span className="text-xs font-mono">Randomize on load</span>
              </div>
              <ToggleSwitch isOn={randomizeOnLoad} onToggle={() => setRandomizeOnLoad(!randomizeOnLoad)} />
            </div>
          </div>
        </div>
        
        {/* Reset Button */}
        <button 
          onClick={handleReset}
          className="w-full neo-brutal py-2 px-3 text-xs font-mono text-center bg-black text-white dark:bg-white dark:text-black hover:-translate-y-[2px] transition-all flex items-center justify-center gap-1.5"
        >
          <RotateCcw size={14} />
          <span>Reset Parameters</span>
        </button>
      </div>
    </ToggleWidget>
  )
} 