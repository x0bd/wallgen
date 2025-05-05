"use client"

import { Download, MonitorSmartphone, Smartphone, ArrowRight, Code, Image } from "lucide-react"
import { ToggleWidget } from "@/components/ui/toggle-widget"
import { ToggleSwitch } from "@/components/ui/toggle-switch"
import { useState } from "react"

type ExportSize = {
  id: string
  width: number
  height: number
  label: string
  icon?: React.ReactNode
}

export function ExportWidget() {
  const sizes: ExportSize[] = [
    { id: "hd", width: 1920, height: 1080, label: "HD (1920×1080)" },
    { id: "4k", width: 3840, height: 2160, label: "4K (3840×2160)" },
    { id: "phone", width: 1080, height: 1920, label: "Phone", icon: <Smartphone size={14} /> },
    { id: "desktop", width: 2560, height: 1440, label: "Desktop", icon: <MonitorSmartphone size={14} /> },
    { id: "twitter", width: 1500, height: 500, label: "Twitter Header" },
    { id: "custom", width: 1200, height: 630, label: "Custom" },
  ]
  
  const [selectedSizeId, setSelectedSizeId] = useState("hd")
  const [fileName, setFileName] = useState("wallgen_export")
  const [fileFormat, setFileFormat] = useState("png")
  const [isCustomSize, setIsCustomSize] = useState(false)
  const [customWidth, setCustomWidth] = useState("1200")
  const [customHeight, setCustomHeight] = useState("630")
  const [includeSourceCode, setIncludeSourceCode] = useState(false)
  
  const selectedSize = sizes.find(s => s.id === selectedSizeId) || sizes[0]
  const displayWidth = selectedSizeId === "custom" ? customWidth : selectedSize.width
  const displayHeight = selectedSizeId === "custom" ? customHeight : selectedSize.height
  
  const handleSizeSelect = (id: string) => {
    setSelectedSizeId(id)
    setIsCustomSize(id === "custom")
  }
  
  return (
    <ToggleWidget 
      title="Export"
      icon={<Download size={14} />}
      className="w-full"
    >
      <div className="space-y-5">
        {/* Preview */}
        <div className="rounded-lg overflow-hidden bg-gradient-to-br from-black/[0.03] to-black/[0.05] dark:from-white/[0.03] dark:to-white/[0.05] p-3 flex flex-col items-center justify-center border border-black/10 dark:border-white/10">
          <div className="relative w-32 h-20 bg-black/10 dark:bg-white/10 rounded-md overflow-hidden flex items-center justify-center mb-2">
            <Image size={16} className="text-black/30 dark:text-white/30" />
          </div>
          <p className="text-xs font-mono tracking-tight text-center">
            <span className="opacity-70">{displayWidth} × {displayHeight}</span> • {fileFormat.toUpperCase()}
          </p>
        </div>
        
        {/* Size Selection */}
        <div className="space-y-2.5">
          <label className="text-xs font-mono tracking-tight block">Resolution</label>
          <div className="grid grid-cols-2 gap-2">
            {sizes.map((size) => (
              <button
                key={size.id}
                onClick={() => handleSizeSelect(size.id)}
                className={`flex items-center justify-between py-1.5 px-2 rounded-lg border text-xs font-mono transition-all ${
                  selectedSizeId === size.id 
                  ? 'border-black dark:border-white bg-black/[0.03] dark:bg-white/[0.03]' 
                  : 'border-black/10 dark:border-white/10 opacity-70 hover:opacity-100'
                }`}
              >
                <div className="flex items-center gap-1">
                  {size.icon}
                  <span className="text-[10px]">{size.label}</span>
                </div>
                {selectedSizeId === size.id && <ArrowRight size={10} />}
              </button>
            ))}
          </div>
        </div>
        
        {/* Custom Size */}
        {isCustomSize && (
          <div className="space-y-3 pt-3 border-t border-black/5 dark:border-white/5">
            <label className="text-xs font-mono tracking-tight block">Custom Dimensions</label>
            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  type="number"
                  value={customWidth}
                  onChange={(e) => setCustomWidth(e.target.value)}
                  className="w-full h-8 rounded-md border border-black/20 dark:border-white/20 bg-transparent py-0 px-2 text-xs font-mono"
                  placeholder="Width"
                />
              </div>
              <div className="flex items-center">
                <span className="text-xs opacity-50">×</span>
              </div>
              <div className="flex-1">
                <input
                  type="number"
                  value={customHeight}
                  onChange={(e) => setCustomHeight(e.target.value)}
                  className="w-full h-8 rounded-md border border-black/20 dark:border-white/20 bg-transparent py-0 px-2 text-xs font-mono"
                  placeholder="Height"
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Filename */}
        <div className="space-y-2">
          <label className="text-xs font-mono tracking-tight block">Filename</label>
          <input
            type="text"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            className="w-full h-9 rounded-md border border-black/20 dark:border-white/20 bg-transparent py-0 px-3 text-xs font-mono"
          />
        </div>
        
        {/* Format */}
        <div className="space-y-2">
          <label className="text-xs font-mono tracking-tight block">Format</label>
          <div className="flex rounded-md overflow-hidden border border-black/10 dark:border-white/10">
            {["png", "jpg", "svg"].map((format) => (
              <button
                key={format}
                onClick={() => setFileFormat(format)}
                className={`flex-1 py-2 text-xs font-mono uppercase transition-colors ${
                  fileFormat === format 
                  ? 'bg-black text-white dark:bg-white dark:text-black' 
                  : 'bg-transparent hover:bg-black/[0.03] dark:hover:bg-white/[0.03]'
                }`}
              >
                {format}
              </button>
            ))}
          </div>
        </div>
        
        {/* Advanced Options */}
        <div className="space-y-2">
          <label className="text-xs font-mono tracking-tight flex items-center gap-1.5">
            <Code size={14} className="opacity-60" />
            <span>Advanced Options</span>
          </label>
          <div className="flex items-center justify-between text-xs p-2 rounded-md bg-black/[0.02] dark:bg-white/[0.02] border border-black/10 dark:border-white/10">
            <span className="font-mono opacity-70">Include Source Code</span>
            <ToggleSwitch 
              isOn={includeSourceCode} 
              onToggle={() => setIncludeSourceCode(!includeSourceCode)} 
            />
          </div>
        </div>
        
        {/* Download Button */}
        <button className="w-full neo-brutal py-2 text-xs font-mono text-center bg-black text-white dark:bg-white dark:text-black hover:-translate-y-[2px] transition-all flex items-center justify-center gap-1.5">
          <Download size={14} />
          <span>Download Wallpaper</span>
        </button>
      </div>
    </ToggleWidget>
  )
} 