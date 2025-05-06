"use client"

import { Paintbrush, Plus, Check, Save, Trash2, Palette, Move } from "lucide-react"
import { ToggleWidget } from "@/components/ui/toggle-widget"
import { ToggleSwitch } from "@/components/ui/toggle-switch"
import { useState, useEffect } from "react"
import { useAlgorithm } from "@/context/algorithm-context"

export function ColorWidget() {
  const { 
    algorithm,
    params,
    updateParams,
    colorOptions, 
    selectedColorId, 
    setSelectedColorId,
    isInverted, 
    setIsInverted,
    addCustomColor,
    deleteCustomColor,
    getCurrentColors,
    isSaving,
    updateCustomColor
  } = useAlgorithm();
  
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [customBackground, setCustomBackground] = useState("#111111")
  const [customForeground, setCustomForeground] = useState("#f9f9f9")
  const [customForegroundColors, setCustomForegroundColors] = useState<string[]>([])
  const [currentForegroundIndex, setCurrentForegroundIndex] = useState(0)
  const [customLabel, setCustomLabel] = useState("")
  const [editingColorId, setEditingColorId] = useState<string | null>(null)
  
  // Update when editing an existing color
  useEffect(() => {
    if (editingColorId) {
      const colorToEdit = colorOptions.find(c => c.id === editingColorId);
      if (colorToEdit) {
        setCustomBackground(colorToEdit.background);
        setCustomForeground(colorToEdit.foreground);
        setCustomLabel(colorToEdit.label);
        
        // If the color has multiple foreground colors
        if (colorToEdit.foregroundColors && colorToEdit.foregroundColors.length > 0) {
          setCustomForegroundColors(colorToEdit.foregroundColors);
        } else {
          setCustomForegroundColors([colorToEdit.foreground]);
        }
      }
    } else {
      // Reset when not editing
      setCustomForegroundColors([customForeground]);
    }
  }, [editingColorId, colorOptions]);
  
  const handleAddForegroundColor = () => {
    if (customForegroundColors.length < 5) {
      setCustomForegroundColors([...customForegroundColors, "#ffffff"]);
      setCurrentForegroundIndex(customForegroundColors.length);
    }
  }
  
  const handleRemoveForegroundColor = (index: number) => {
    if (customForegroundColors.length > 1) {
      const newColors = [...customForegroundColors];
      newColors.splice(index, 1);
      setCustomForegroundColors(newColors);
      if (currentForegroundIndex >= newColors.length) {
        setCurrentForegroundIndex(newColors.length - 1);
      }
    }
  }
  
  const handleUpdateForegroundColor = (value: string, index: number) => {
    const newColors = [...customForegroundColors];
    newColors[index] = value;
    setCustomForegroundColors(newColors);
    if (index === 0) {
      setCustomForeground(value);
    }
  }
  
  const handleEditColor = (id: string) => {
    setEditingColorId(id);
    setShowColorPicker(true);
  }
  
  const handleAddCustomColor = () => {
    if (!customLabel.trim()) return;
    
    const colorData = {
      background: customBackground,
      foreground: customForeground,
      foregroundColors: customForegroundColors.length > 1 ? customForegroundColors : undefined,
      label: customLabel
    };
    
    if (editingColorId) {
      updateCustomColor(editingColorId, colorData);
    } else {
      addCustomColor(colorData);
    }
    
    setShowColorPicker(false);
    setEditingColorId(null);
    setCustomLabel("");
    setCustomForegroundColors([customForeground]);
    setCurrentForegroundIndex(0);
  }
  
  const handleCancelEdit = () => {
    setShowColorPicker(false);
    setEditingColorId(null);
    setCustomLabel("");
    setCustomBackground("#111111");
    setCustomForeground("#f9f9f9");
    setCustomForegroundColors(["#f9f9f9"]);
    setCurrentForegroundIndex(0);
  }

  // Toggle transparent background
  const handleToggleTransparentBackground = () => {
    updateParams({
      transparentBackground: !params.transparentBackground
    });
  }

  const currentColors = getCurrentColors();
  const showBgOptions = algorithm === 'perlinNoise'; // Only show bg options for perlin noise
  
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
            style={{ 
              backgroundColor: params.transparentBackground && algorithm === 'perlinNoise' 
                ? 'transparent' 
                : currentColors.background,
              backgroundImage: params.transparentBackground && algorithm === 'perlinNoise'
                ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)'
                : 'none',
              backgroundSize: '16px 16px',
              backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px'
            }}
          >
            <div className="flex gap-2">
              {currentColors.foregroundColors && currentColors.foregroundColors.length > 0 ? (
                currentColors.foregroundColors.map((color, index) => (
                  <div 
                    key={index}
                    className="w-6 h-6 rounded-full flex items-center justify-center" 
                    style={{ backgroundColor: color }}
                  >
                    {index === 0 && <Paintbrush size={12} style={{ color: currentColors.background }} className={isSaving ? "animate-pulse" : ""} />}
                  </div>
                ))
              ) : (
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center" 
                  style={{ backgroundColor: currentColors.foreground }}
                >
                  <Paintbrush size={14} style={{ color: currentColors.background }} className={isSaving ? "animate-pulse" : ""} />
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Color Palette Selection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono tracking-tight">COLOR PALETTES</label>
            <button 
              onClick={() => {
                setShowColorPicker(!showColorPicker);
                setEditingColorId(null);
                setCustomBackground("#111111");
                setCustomForeground("#f9f9f9");
                setCustomForegroundColors(["#f9f9f9"]);
                setCustomLabel("");
              }}
              disabled={isSaving}
              className={`text-xs font-mono flex items-center gap-1 py-1 px-2 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${isSaving ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <Plus size={12} />
              <span>Add</span>
            </button>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            {colorOptions.map((color) => (
              <div key={color.id} className="relative group">
                <button
                  onClick={() => setSelectedColorId(color.id)}
                  disabled={isSaving}
                  className={`flex flex-col items-center p-2 rounded-lg transition-all w-full ${
                    selectedColorId === color.id ? 'ring-1 ring-black dark:ring-white ring-offset-1 ring-offset-white dark:ring-offset-black' : 'opacity-70 hover:opacity-100'
                  } ${isSaving ? 'pointer-events-none' : ''}`}
                >
                  <div 
                    className="w-full aspect-video mb-1 rounded-md border border-black/10 dark:border-white/10 flex items-center justify-center overflow-hidden"
                    style={{ 
                      backgroundColor: params.transparentBackground && algorithm === 'perlinNoise' && selectedColorId === color.id
                        ? 'transparent' 
                        : color.background,
                      backgroundImage: params.transparentBackground && algorithm === 'perlinNoise' && selectedColorId === color.id
                        ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)'
                        : 'none',
                      backgroundSize: '8px 8px',
                      backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px'
                    }}
                  >
                    {color.foregroundColors && color.foregroundColors.length > 0 ? (
                      <div className="flex gap-1">
                        {color.foregroundColors.map((fgColor, idx) => (
                          <div key={idx} className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: fgColor }}></div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: color.foreground }}></div>
                    )}
                  </div>
                  <span className="text-[10px] font-mono uppercase truncate w-full text-center">{color.label}</span>
                </button>
                
                {color.isCustom && (
                  <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity right-1 top-1 flex gap-1">
                    <button 
                      onClick={() => handleEditColor(color.id)}
                      disabled={isSaving}
                      className="bg-black/70 dark:bg-white/70 text-white dark:text-black p-0.5 rounded-sm"
                    >
                      <Palette size={10} />
                    </button>
                    <button 
                      onClick={() => deleteCustomColor(color.id)}
                      disabled={isSaving}
                      className="bg-black/70 dark:bg-white/70 text-white dark:text-black p-0.5 rounded-sm"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Create Color UI */}
        {showColorPicker && (
          <div className="space-y-3 mt-3 pt-3 border-t border-black/10 dark:border-white/10">
            <p className="text-xs font-mono tracking-tight">{editingColorId ? 'EDIT COLOR PALETTE' : 'CREATE CUSTOM PALETTE'}</p>
            
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-mono opacity-70 block">Background</label>
                <div className="flex h-8">
                  <div className="w-8 h-8 rounded-l-md border border-r-0 border-black/20 dark:border-white/20 overflow-hidden">
                    <input
                      type="color"
                      value={customBackground}
                      onChange={(e) => setCustomBackground(e.target.value)}
                      disabled={isSaving}
                      className="w-10 h-10 -ml-1 -mt-1 cursor-pointer"
                    />
                  </div>
                  <input
                    type="text"
                    value={customBackground}
                    onChange={(e) => setCustomBackground(e.target.value)}
                    disabled={isSaving}
                    className={`flex-1 h-8 rounded-r-md border border-black/20 dark:border-white/20 bg-transparent py-0 px-2 text-xs font-mono ${isSaving ? 'opacity-50' : ''}`}
                  />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-mono opacity-70 block">Foreground Colors ({customForegroundColors.length}/5)</label>
                  <button
                    onClick={handleAddForegroundColor}
                    disabled={isSaving || customForegroundColors.length >= 5}
                    className={`text-xs font-mono flex items-center gap-1 p-0.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${(isSaving || customForegroundColors.length >= 5) ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    <Plus size={10} />
                  </button>
                </div>
                
                <div className="flex gap-1 mb-2">
                  {customForegroundColors.map((color, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentForegroundIndex(index)}
                      className={`w-6 h-6 rounded-full border ${currentForegroundIndex === index ? 'ring-1 ring-black dark:ring-white' : 'border-black/20 dark:border-white/20'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                
                <div className="flex h-8">
                  <div className="w-8 h-8 rounded-l-md border border-r-0 border-black/20 dark:border-white/20 overflow-hidden">
                    <input
                      type="color"
                      value={customForegroundColors[currentForegroundIndex]}
                      onChange={(e) => handleUpdateForegroundColor(e.target.value, currentForegroundIndex)}
                      disabled={isSaving}
                      className="w-10 h-10 -ml-1 -mt-1 cursor-pointer"
                    />
                  </div>
                  <input
                    type="text"
                    value={customForegroundColors[currentForegroundIndex]}
                    onChange={(e) => handleUpdateForegroundColor(e.target.value, currentForegroundIndex)}
                    disabled={isSaving}
                    className={`flex-1 h-8 rounded-none border border-black/20 dark:border-white/20 bg-transparent py-0 px-2 text-xs font-mono ${isSaving ? 'opacity-50' : ''}`}
                  />
                  {customForegroundColors.length > 1 && (
                    <button
                      onClick={() => handleRemoveForegroundColor(currentForegroundIndex)}
                      disabled={isSaving}
                      className="w-8 h-8 rounded-r-md border border-l-0 border-black/20 dark:border-white/20 flex items-center justify-center"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
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
                disabled={isSaving}
                className={`w-full h-8 rounded-md border border-black/20 dark:border-white/20 bg-transparent py-0 px-2 text-xs font-mono ${isSaving ? 'opacity-50' : ''}`}
              />
            </div>
            
            <div className="flex space-x-2">
              <button 
                onClick={handleAddCustomColor}
                disabled={!customLabel.trim() || isSaving}
                className="flex-1 neo-brutal py-2 text-xs font-mono text-center bg-black text-white dark:bg-white dark:text-black hover:-translate-y-[2px] transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:hover:translate-y-0"
              >
                <Save size={12} />
                {editingColorId ? 'Update' : 'Save'} Palette
              </button>
              <button 
                onClick={handleCancelEdit}
                disabled={isSaving}
                className={`w-10 neo-brutal py-2 text-xs font-mono text-center hover:-translate-y-[2px] transition-all ${isSaving ? 'opacity-50 pointer-events-none' : ''}`}
              >
                ✕
              </button>
            </div>
          </div>
        )}
        
        {/* Invert Toggle */}
        <div className="flex items-center justify-between">
          <label className="text-xs font-mono">Invert Colors</label>
          <ToggleSwitch 
            isOn={isInverted} 
            onToggle={() => setIsInverted(!isInverted)} 
            disabled={isSaving}
          />
        </div>
        
        {/* Background Mode Picker (Only for Perlin Noise) */}
        {showBgOptions && (
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono">Transparent Background</label>
            <ToggleSwitch 
              isOn={!!params.transparentBackground} 
              onToggle={handleToggleTransparentBackground} 
              disabled={isSaving}
            />
          </div>
        )}
        
        {/* Apply Button */}
        <button 
          disabled={isSaving}
          className={`w-full neo-brutal py-2 text-xs font-mono text-center hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black hover:-translate-y-[2px] transition-all flex items-center justify-center gap-1.5 ${isSaving ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <Check size={14} />
          Apply Colors
        </button>
      </div>
    </ToggleWidget>
  )
} 