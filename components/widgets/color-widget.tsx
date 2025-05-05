"use client"

import { Paintbrush, Plus, Check, Save } from "lucide-react"
import { ToggleWidget } from "@/components/ui/toggle-widget"
import { ToggleSwitch } from "@/components/ui/toggle-switch"
import { useState } from "react"
import { useAlgorithm } from "@/context/algorithm-context"

export function ColorWidget() {
  const { 
    colorOptions, 
    selectedColorId, 
    setSelectedColorId,
    isInverted, 
    setIsInverted,
    addCustomColor,
    getCurrentColors
  } = useAlgorithm();
  
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [customBackground, setCustomBackground] = useState("#111111")
  const [customForeground, setCustomForeground] = useState("#f9f9f9")
  const [customLabel, setCustomLabel] = useState("")
  
  const handleAddCustomColor = () => {
    if (!customLabel.trim()) return
    
    addCustomColor({
      background: customBackground,
      foreground: customForeground,
      label: customLabel
    });
    
    setShowColorPicker(false)
    setCustomLabel("")
  }

  const currentColors = getCurrentColors();
  
  return (
    <ToggleWidget 
      title="Colors"
      icon={<Paintbrush size={14} />}
      className="w-full"
    >
      <div className="space-y-5">
        {/* Color Preview */}
        <div className="h-16 rounded-lg overflow-hidden shadow-sm border border-black/10 dark:border-white/10 bg-neutral-100 dark:bg-neutral-900">
          <div 
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: currentColors.background }}
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center" 
              style={{ backgroundColor: currentColors.foreground }}
            >
              <Paintbrush size={14} style={{ color: currentColors.background }} />
            </div>
          </div>
        </div>
        
        {/* Color Palette Selection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono tracking-tight">COLOR PALETTES</label>
            <button 
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="text-xs font-mono flex items-center gap-1 py-1 px-2 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <Plus size={12} />
              <span>Add</span>
            </button>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            {colorOptions.map((color) => (
              <button
                key={color.id}
                onClick={() => setSelectedColorId(color.id)}
                className={`flex flex-col items-center p-2 rounded-lg transition-all ${
                  selectedColorId === color.id ? 'ring-1 ring-black dark:ring-white ring-offset-1 ring-offset-white dark:ring-offset-black' : 'opacity-70 hover:opacity-100'
                }`}
              >
                <div 
                  className="w-full aspect-video mb-1 rounded-md border border-black/10 dark:border-white/10 flex items-center justify-center overflow-hidden"
                  style={{ backgroundColor: color.background }}
                >
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: color.foreground }}></div>
                </div>
                <span className="text-[10px] font-mono uppercase truncate w-full text-center">{color.label}</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Create Color UI */}
        {showColorPicker && (
          <div className="space-y-3 mt-3 pt-3 border-t border-black/10 dark:border-white/10">
            <p className="text-xs font-mono tracking-tight">CREATE CUSTOM PALETTE</p>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-mono opacity-70 block">Background</label>
                <div className="flex h-8">
                  <div className="w-8 h-8 rounded-l-md border border-r-0 border-black/20 dark:border-white/20 overflow-hidden">
                    <div className="w-full h-full" style={{ backgroundColor: customBackground }}></div>
                  </div>
                  <input
                    type="text"
                    value={customBackground}
                    onChange={(e) => setCustomBackground(e.target.value)}
                    className="flex-1 h-8 rounded-r-md border border-black/20 dark:border-white/20 bg-transparent py-0 px-2 text-xs font-mono"
                  />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-mono opacity-70 block">Foreground</label>
                <div className="flex h-8">
                  <div className="w-8 h-8 rounded-l-md border border-r-0 border-black/20 dark:border-white/20 overflow-hidden">
                    <div className="w-full h-full" style={{ backgroundColor: customForeground }}></div>
                  </div>
                  <input
                    type="text"
                    value={customForeground}
                    onChange={(e) => setCustomForeground(e.target.value)}
                    className="flex-1 h-8 rounded-r-md border border-black/20 dark:border-white/20 bg-transparent py-0 px-2 text-xs font-mono"
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-mono opacity-70 block">Name</label>
              <input
                type="text"
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                placeholder="Enter palette name"
                className="w-full h-8 rounded-md border border-black/20 dark:border-white/20 bg-transparent py-0 px-2 text-xs font-mono"
              />
            </div>
            
            <div className="flex space-x-2">
              <button 
                onClick={handleAddCustomColor}
                disabled={!customLabel.trim()}
                className="flex-1 neo-brutal py-2 text-xs font-mono text-center bg-black text-white dark:bg-white dark:text-black hover:-translate-y-[2px] transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:hover:translate-y-0"
              >
                <Save size={12} />
                Save Palette
              </button>
              <button 
                onClick={() => setShowColorPicker(false)}
                className="w-10 neo-brutal py-2 text-xs font-mono text-center hover:-translate-y-[2px] transition-all"
              >
                ✕
              </button>
            </div>
          </div>
        )}
        
        {/* Invert Toggle */}
        <div className="flex items-center justify-between">
          <label className="text-xs font-mono">Invert Colors</label>
          <ToggleSwitch isOn={isInverted} onToggle={() => setIsInverted(!isInverted)} />
        </div>
        
        {/* Apply Button */}
        <button className="w-full neo-brutal py-2 text-xs font-mono text-center hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black hover:-translate-y-[2px] transition-all flex items-center justify-center gap-1.5">
          <Check size={14} />
          Apply Colors
        </button>
      </div>
    </ToggleWidget>
  )
} 