"use client"

import { createContext, useContext, useState, ReactNode, useCallback, useRef, useEffect } from 'react'

// Define algorithm types
export type AlgorithmType = 'perlinNoise' | 'cellular' | 'flowField'

// Define the parameters for each algorithm
export interface AlgorithmParams {
  noiseScale: number
  speed: number
  complexity: number
  density: number
  autoAdjust: boolean
  randomizeOnLoad: boolean
  transparentBackground?: boolean
}

// Define the color options
export interface ColorOption {
  id: string
  background: string
  foreground: string
  foregroundColors?: string[]
  label: string
  isCustom?: boolean
}

// Define the context state
interface AlgorithmContextState {
  algorithm: AlgorithmType
  setAlgorithm: (type: AlgorithmType) => void
  params: AlgorithmParams
  updateParams: (updates: Partial<AlgorithmParams>) => void
  resetParams: () => void
  colorOptions: ColorOption[]
  selectedColorId: string
  setSelectedColorId: (id: string) => void
  isInverted: boolean
  setIsInverted: (inverted: boolean) => void
  addCustomColor: (color: Omit<ColorOption, 'id' | 'isCustom'>) => void
  updateCustomColor: (id: string, color: Omit<ColorOption, 'id' | 'isCustom'>) => void
  deleteCustomColor: (id: string) => void
  getCurrentColors: () => { background: string, foreground: string, foregroundColors?: string[] }
  needsRedraw: boolean
  hasContent: boolean
  isSaving: boolean
  saveCurrentState: () => void
  clearCanvas: () => void
  finishSaving: () => void
  triggerInitialization: () => void
}

// Create context with default values
const AlgorithmContext = createContext<AlgorithmContextState | undefined>(undefined)

// Default parameter values
const defaultParams: AlgorithmParams = {
  noiseScale: 50,
  speed: 30,
  complexity: 70,
  density: 60,
  autoAdjust: true,
  randomizeOnLoad: false,
  transparentBackground: false
}

// Default color options
const defaultColorOptions: ColorOption[] = [
  { id: "bw", background: "#000000", foreground: "#FFFFFF", label: "B&W" },
  { id: "wb", background: "#FFFFFF", foreground: "#000000", label: "W&B" },
  { id: "gray", background: "#222222", foreground: "#DDDDDD", label: "Gray" },
  { id: "blue", background: "#0F172A", foreground: "#E2E8F0", label: "Blue" },
  { id: "purple", background: "#2E1065", foreground: "#DDD6FE", label: "Purple" },
  { id: "red", background: "#4C0519", foreground: "#FED7E2", label: "Red" },
  { 
    id: "rainbow", 
    background: "#000000", 
    foreground: "#FF0000", 
    foregroundColors: ["#FF0000", "#FF8800", "#FFFF00", "#00FF00", "#0088FF"], 
    label: "Rainbow" 
  },
  { 
    id: "sunset", 
    background: "#1A0633", 
    foreground: "#FF5733", 
    foregroundColors: ["#581845", "#900C3F", "#C70039", "#FF5733", "#FFC30F"], 
    label: "Sunset" 
  }
]

// Debounce function helper
const debounce = (func: Function, wait: number) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: any[]) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Provider component
export function AlgorithmProvider({ children }: { children: ReactNode }) {
  // Algorithm state
  const [algorithm, setAlgorithm] = useState<AlgorithmType>('perlinNoise')
  
  // Parameters state
  const [params, setParams] = useState<AlgorithmParams>(defaultParams)
  
  // Color state
  const [colorOptions, setColorOptions] = useState<ColorOption[]>(defaultColorOptions)
  const [selectedColorId, setSelectedColorId] = useState("bw")
  const [isInverted, setIsInverted] = useState(false)
  
  // Generation/Drawing state
  const [needsRedraw, setNeedsRedraw] = useState(false)
  const [hasContent, setHasContent] = useState(true) // Always true in continuous mode
  const [isSaving, setIsSaving] = useState(false)
  const [initSignal, setInitSignal] = useState(0); // State to trigger initialization

  // Debounced initialization
  const debouncedInitRef = useRef<ReturnType<typeof debounce> | null>(null);
  
  // Create debounced initialization function
  useEffect(() => {
    debouncedInitRef.current = debounce(() => {
      setInitSignal(s => s + 1);
      setNeedsRedraw(true);
    }, 250); // 250ms debounce

    return () => {
      debouncedInitRef.current = null;
    };
  }, []);

  // Initialize on first load
  useEffect(() => {
    // Start with content and initialize immediately
    setNeedsRedraw(true);
    setInitSignal(s => s + 1);
  }, []);

  // Update parameters - use debounced initialization to avoid performance drops
  const updateParams = useCallback((updates: Partial<AlgorithmParams>) => {
    setParams(prev => ({ ...prev, ...updates }))
    
    // For immediate updates (like checkboxes)
    if (updates.transparentBackground !== undefined || 
        updates.randomizeOnLoad !== undefined || 
        updates.autoAdjust !== undefined) {
      setInitSignal(s => s + 1);
      setNeedsRedraw(true);
    } else {
      // For slider controls, use debounced update
      debouncedInitRef.current?.();
    }
  }, [])
  
  // Reset parameters - also trigger redraw
  const resetParams = useCallback(() => {
    setParams(defaultParams)
    setInitSignal(s => s + 1);
    setNeedsRedraw(true);
  }, [])
  
  // Save current state function - replaces generate
  const saveCurrentState = useCallback(() => {
    setIsSaving(true);
    
    // After showing the saving animation for a bit, trigger the actual download
    setTimeout(() => {
      // Create a custom event to trigger the download in P5CanvasImpl
      const event = new CustomEvent('wallgen-save-canvas', {
        detail: {
          filename: `wallgen-${algorithm}-${Date.now()}`
        }
      });
      window.dispatchEvent(event);
      
      setNeedsRedraw(true);
    }, 1000); // Wait 1 second before triggering the download to show animation
  }, [algorithm])
  
  // Function to mark saving as complete
  const finishSaving = useCallback(() => {
    setIsSaving(false);
  }, [])
  
  // Clear the canvas - reinitialize particles
  const clearCanvas = useCallback(() => {
    setInitSignal(s => s + 1);
    setNeedsRedraw(true); // Trigger reinitialization
  }, [])

  // Function to explicitly trigger initialization
  const triggerInitialization = useCallback(() => {
    setInitSignal(s => s + 1);
  }, []);
  
  // Add custom color
  const addCustomColor = useCallback((color: Omit<ColorOption, 'id' | 'isCustom'>) => {
    const newColor: ColorOption = {
      ...color,
      id: `custom_${Date.now()}`,
      isCustom: true
    }
    setColorOptions(prev => [...prev, newColor])
    setSelectedColorId(newColor.id)
    setInitSignal(s => s + 1);
    setNeedsRedraw(true);
  }, [])

  // Update an existing custom color
  const updateCustomColor = useCallback((id: string, color: Omit<ColorOption, 'id' | 'isCustom'>) => {
    setColorOptions(prev => prev.map(c => 
      c.id === id 
        ? { ...c, ...color, isCustom: true } 
        : c
    ));
    setInitSignal(s => s + 1);
    setNeedsRedraw(true);
  }, []);

  // Delete a custom color
  const deleteCustomColor = useCallback((id: string) => {
    setColorOptions(prev => prev.filter(c => c.id !== id));
    
    // If we're deleting the selected color, select the first one instead
    if (selectedColorId === id) {
      setSelectedColorId(defaultColorOptions[0].id);
    }
    
    setInitSignal(s => s + 1);
    setNeedsRedraw(true);
  }, [selectedColorId]);

  // Update selected color - trigger redraw
  const updateSelectedColorId = useCallback((id: string) => {
    setSelectedColorId(id);
    setInitSignal(s => s + 1);
    setNeedsRedraw(true);
  }, []);

  // Update inversion - trigger redraw
  const updateIsInverted = useCallback((inverted: boolean) => {
    setIsInverted(inverted);
    setInitSignal(s => s + 1);
    setNeedsRedraw(true);
  }, []);

  
  // Get current colors (memoized)
  const getCurrentColors = useCallback(() => {
    const selectedColor = colorOptions.find(c => c.id === selectedColorId) || colorOptions[0]
    return {
      background: isInverted ? selectedColor.foreground : selectedColor.background,
      foreground: isInverted ? selectedColor.background : selectedColor.foreground,
      foregroundColors: selectedColor.foregroundColors && isInverted
        ? [...selectedColor.foregroundColors].reverse()
        : selectedColor.foregroundColors
    }
  }, [colorOptions, selectedColorId, isInverted])
  
  return (
    <AlgorithmContext.Provider 
      value={{
        algorithm,
        setAlgorithm,
        params,
        updateParams,
        resetParams,
        colorOptions,
        selectedColorId,
        setSelectedColorId: updateSelectedColorId,
        isInverted,
        setIsInverted: updateIsInverted,
        addCustomColor,
        updateCustomColor,
        deleteCustomColor,
        getCurrentColors,
        needsRedraw,
        hasContent,
        isSaving,
        saveCurrentState,
        clearCanvas,
        finishSaving,
        triggerInitialization
      }}
    >
      {children}
    </AlgorithmContext.Provider>
  )
}

// Hook for easy context consumption
export function useAlgorithm() {
  const context = useContext(AlgorithmContext)
  if (context === undefined) {
    throw new Error('useAlgorithm must be used within an AlgorithmProvider')
  }
  return context
} 