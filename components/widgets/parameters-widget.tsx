"use client"

import { Settings, RotateCcw, Wand2, Zap, Sliders } from "lucide-react"
import { ToggleWidget } from "@/components/ui/toggle-widget"
import { ToggleSwitch } from "@/components/ui/toggle-switch"
import { Slider } from "@/components/ui/slider"
import { useAlgorithm } from "@/context/algorithm-context"

export function ParametersWidget() {
  const { 
    params, 
    updateParams, 
    resetParams 
  } = useAlgorithm();
  
  // Handle slider changes
  const handleParamChange = (param: keyof typeof params, value: number) => {
    updateParams({ [param]: value });
  };
  
  // Handle toggle changes
  const handleToggleChange = (param: keyof typeof params, value: boolean) => {
    updateParams({ [param]: value });
  };
  
  return (
    <ToggleWidget 
      title="Parameters"
      icon={<Sliders size={14} />}
      className="w-full"
      defaultOpen={true}
    >
      <div className="p-4 space-y-5">
        {/* Info message */}
        <p className="text-xs opacity-70 font-mono bg-black/5 dark:bg-white/5 p-2 rounded">
          Adjust the parameters to customize your wallpaper. Click the Generate button to create a static image based on your settings.
        </p>
        
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
            <span className="text-xs font-mono bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded-md min-w-[2.5rem] text-center">{params.noiseScale}%</span>
          </div>
          <Slider 
            value={[params.noiseScale]}
            onValueChange={(value) => handleParamChange('noiseScale', value[0])}
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
            <span className="text-xs font-mono bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded-md min-w-[2.5rem] text-center">{params.speed}%</span>
          </div>
          <Slider 
            value={[params.speed]}
            onValueChange={(value) => handleParamChange('speed', value[0])}
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
            <span className="text-xs font-mono bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded-md min-w-[2.5rem] text-center">{params.complexity}%</span>
          </div>
          <Slider 
            value={[params.complexity]}
            onValueChange={(value) => handleParamChange('complexity', value[0])}
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
            <span className="text-xs font-mono bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded-md min-w-[2.5rem] text-center">{params.density}%</span>
          </div>
          <Slider 
            value={[params.density]}
            onValueChange={(value) => handleParamChange('density', value[0])}
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
              <ToggleSwitch 
                isOn={params.autoAdjust} 
                onToggle={() => handleToggleChange('autoAdjust', !params.autoAdjust)} 
              />
            </div>
            
            <div className="flex items-center justify-between p-2 rounded-md bg-black/[0.02] dark:bg-white/[0.02] border border-black/10 dark:border-white/10">
              <div className="flex items-center gap-1.5">
                <Zap size={14} className="opacity-60" />
                <span className="text-xs font-mono">Randomize on load</span>
              </div>
              <ToggleSwitch 
                isOn={params.randomizeOnLoad} 
                onToggle={() => handleToggleChange('randomizeOnLoad', !params.randomizeOnLoad)} 
              />
            </div>
          </div>
        </div>
        
        {/* Reset Button */}
        <button 
          onClick={resetParams}
          className="w-full neo-brutal py-2 px-3 text-xs font-mono text-center bg-black text-white dark:bg-white dark:text-black hover:-translate-y-[2px] transition-all flex items-center justify-center gap-1.5"
        >
          <RotateCcw size={14} />
          <span>Reset Parameters</span>
        </button>
      </div>
    </ToggleWidget>
  )
} 