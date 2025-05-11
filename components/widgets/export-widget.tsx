"use client"

import { Download, MonitorSmartphone, Smartphone, ArrowRight, Code, Image } from "lucide-react"
import { ToggleWidget } from "@/components/ui/toggle-widget"
import { ToggleSwitch } from "@/components/ui/toggle-switch"
import { useState, useEffect } from "react"
import { useAlgorithm } from "@/context/algorithm-context"

type ExportSize = {
  id: string
  width: number
  height: number
  label: string
  icon?: React.ReactNode
}

export function ExportWidget() {
  const { isSaving, exportCanvas, algorithm, params } = useAlgorithm();
  
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
  const [addBorder, setAddBorder] = useState(false)
  const [highQuality, setHighQuality] = useState(true)
  const [originalImageWidth, setOriginalImageWidth] = useState(0)
  const [originalImageHeight, setOriginalImageHeight] = useState(0)
  
  const isFlowPlotter = algorithm === 'flowPlotter';
  
  // Get the image dimensions if we're in flow plotter mode
  useEffect(() => {
    if (isFlowPlotter && params.imageUrl) {
      const img = new globalThis.Image();
      img.onload = () => {
        setOriginalImageWidth(img.width);
        setOriginalImageHeight(img.height);
      };
      img.src = params.imageUrl as string;
    }
  }, [isFlowPlotter, params.imageUrl]);
  
  const selectedSize = sizes.find(s => s.id === selectedSizeId) || sizes[0]
  const displayWidth = isFlowPlotter ? originalImageWidth || 'Source image' : (selectedSizeId === "custom" ? customWidth : selectedSize.width)
  const displayHeight = isFlowPlotter ? originalImageHeight || 'dimensions' : (selectedSizeId === "custom" ? customHeight : selectedSize.height)
  
  const handleSizeSelect = (id: string) => {
    setSelectedSizeId(id)
    setIsCustomSize(id === "custom")
  }
  
  const handleExport = () => {
    // For Flow Plotter, use the original image dimensions
    const width = isFlowPlotter 
      ? originalImageWidth
      : parseInt(selectedSizeId === "custom" ? customWidth : selectedSize.width.toString(), 10);
      
    const height = isFlowPlotter 
      ? originalImageHeight
      : parseInt(selectedSizeId === "custom" ? customHeight : selectedSize.height.toString(), 10);
    
    // Validate dimensions
    if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
      alert("Please enter valid dimensions");
      return;
    }
    
    // Sanitize filename
    const sanitizedFilename = fileName.trim() || "wallgen_export";
    
    // Call the export function
    exportCanvas({
      width,
      height,
      format: fileFormat,
      filename: sanitizedFilename,
      includeSourceCode,
      addBorder,
      highQuality
    });
  };
  
  return (
    <ToggleWidget 
      title="Export"
      icon={<Download size={14} />}
      className="w-full"
    >
      <div className="space-y-5">
        {/* Size Selection - Hidden for Flow Plotter */}
        {!isFlowPlotter && (
          <div className="space-y-2.5">
            <label className="text-xs font-mono tracking-tight block">Resolution</label>
            <div className="grid grid-cols-2 gap-2">
              {sizes.map((size) => (
                <button
                  key={size.id}
                  onClick={() => handleSizeSelect(size.id)}
                  disabled={isSaving}
                  className={`flex items-center justify-between py-1.5 px-2 rounded-lg border text-xs font-mono transition-all ${
                    selectedSizeId === size.id 
                    ? 'border-black dark:border-white bg-black/[0.03] dark:bg-white/[0.03]' 
                    : 'border-black/10 dark:border-white/10 opacity-70 hover:opacity-100'
                  } ${isSaving ? 'pointer-events-none opacity-50' : ''}`}
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
        )}
        
        {/* Flow Plotter Info Message - Only shown for Flow Plotter */}
        {isFlowPlotter && (
          <div className="space-y-2.5">
            <label className="text-xs font-mono tracking-tight block">Resolution</label>
            <div className="rounded-lg border border-black/10 dark:border-white/10 p-3 bg-black/[0.02] dark:bg-white/[0.02]">
              <p className="text-xs font-mono opacity-70 text-center">
                Flow Plotter exports will match the original image dimensions
              </p>
              {originalImageWidth > 0 && originalImageHeight > 0 && (
                <p className="text-xs font-mono mt-1 text-center font-medium">
                  {originalImageWidth} × {originalImageHeight}
                </p>
              )}
            </div>
          </div>
        )}
        
        {/* Custom Size - Only shown when custom is selected and not Flow Plotter */}
        {isCustomSize && !isFlowPlotter && (
          <div className="space-y-3 pt-3 border-t border-black/5 dark:border-white/5">
            <label className="text-xs font-mono tracking-tight block">Custom Dimensions</label>
            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  type="number"
                  value={customWidth}
                  onChange={(e) => setCustomWidth(e.target.value)}
                  disabled={isSaving}
                  className={`w-full h-8 rounded-md border border-black/20 dark:border-white/20 bg-transparent py-0 px-2 text-xs font-mono ${isSaving ? 'opacity-50' : ''}`}
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
                  disabled={isSaving}
                  className={`w-full h-8 rounded-md border border-black/20 dark:border-white/20 bg-transparent py-0 px-2 text-xs font-mono ${isSaving ? 'opacity-50' : ''}`}
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
            disabled={isSaving}
            className={`w-full h-9 rounded-md border border-black/20 dark:border-white/20 bg-transparent py-0 px-3 text-xs font-mono ${isSaving ? 'opacity-50' : ''}`}
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
                disabled={isSaving}
                className={`flex-1 py-2 text-xs font-mono uppercase transition-colors ${
                  fileFormat === format 
                  ? 'bg-black text-white dark:bg-white dark:text-black' 
                  : 'bg-transparent hover:bg-black/[0.03] dark:hover:bg-white/[0.03]'
                } ${isSaving ? 'pointer-events-none opacity-50' : ''}`}
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
          
          <div className="flex flex-col space-y-2 p-2 rounded-md bg-black/[0.02] dark:bg-white/[0.02] border border-black/10 dark:border-white/10">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono opacity-70">Include Source Code</span>
              <ToggleSwitch 
                isOn={includeSourceCode} 
                onToggle={() => setIncludeSourceCode(!includeSourceCode)}
                disabled={isSaving}
              />
            </div>
            
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono opacity-70">Add Subtle Border</span>
              <ToggleSwitch 
                isOn={addBorder} 
                onToggle={() => setAddBorder(!addBorder)}
                disabled={isSaving}
              />
            </div>
            
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono opacity-70">High Quality Export</span>
              <ToggleSwitch 
                isOn={highQuality} 
                onToggle={() => setHighQuality(!highQuality)}
                disabled={isSaving}
              />
            </div>
          </div>
        </div>
        
        {/* Download Button */}
        <button 
          onClick={handleExport}
          disabled={isSaving || (isFlowPlotter && (originalImageWidth === 0 || originalImageHeight === 0))}
          className={`w-full neo-brutal py-2 text-xs font-mono text-center bg-black text-white dark:bg-white dark:text-black hover:-translate-y-[2px] transition-all flex items-center justify-center gap-1.5 ${isSaving || (isFlowPlotter && (originalImageWidth === 0 || originalImageHeight === 0)) ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <Download size={14} />
          <span>Download Wallpaper</span>
        </button>
      </div>
    </ToggleWidget>
  )
} 