"use client"

import { createContext, useContext, useState, ReactNode, useCallback, useRef, useEffect } from 'react'

// Define algorithm types
export type AlgorithmType = 'perlinNoise' | 'cellular' | 'gradients' | 'abstract' | 'flowPlotter' | 
                          'abstract1' | 'abstract2' | 'abstract3' | 'abstract5';

// Define the parameters for each algorithm
export interface AlgorithmParams {
  noiseScale: number
  speed: number
  complexity: number
  density: number
  autoAdjust: boolean
  randomizeOnLoad: boolean
  transparentBackground?: boolean
  strokeLength?: number
  strokeThickness?: number
  imageUrl?: string
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
  uploadImage: (file: File) => void
  resetImage: () => void
  exportCanvas: (options: { 
    width: number, 
    height: number, 
    format: string, 
    filename: string, 
    includeSourceCode?: boolean,
    addBorder?: boolean,
    highQuality?: boolean
  }) => void
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
  transparentBackground: false,
  strokeLength: 15,
  strokeThickness: 50,
  imageUrl: '/images/wall.jpg' // Default image
}

// Default color options
const defaultColorOptions: ColorOption[] = [
  { id: "bw", background: "#000000", foreground: "#FFFFFF", label: "Black" },
  { id: "wb", background: "#FFFFFF", foreground: "#000000", label: "White" },
  // AMOLED Black - True deep black for OLED displays with high contrast colors
  {
    id: "amoled",
    background: "#000000", // True black for OLED displays
    foreground: "#ffffff",
    foregroundColors: ["#00e5ff", "#00ffc8", "#00ff85", "#f200ff", "#ff0077"],
    label: "AMOLED"
  },
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
  },
  // Rose Pine
  {
    id: "rosepine",
    background: "#191724",
    foreground: "#e0def4",
    foregroundColors: ["#ebbcba", "#eb6f92", "#f6c177", "#9ccfd8", "#c4a7e7"],
    label: "Rose Pine"
  },
  // Catppuccin
  {
    id: "catppuccin",
    background: "#1e1e2e",
    foreground: "#cdd6f4",
    foregroundColors: ["#f5c2e7", "#cba6f7", "#f38ba8", "#fab387", "#a6e3a1"],
    label: "Catppuccin"
  },
  // Nord
  {
    id: "nord",
    background: "#2e3440",
    foreground: "#eceff4",
    foregroundColors: ["#88c0d0", "#81a1c1", "#5e81ac", "#bf616a", "#a3be8c"],
    label: "Nord"
  },
  // Vesper (I'll create a dark theme with purple accents)
  {
    id: "vesper",
    background: "#1d2021",
    foreground: "#d4be98",
    foregroundColors: ["#89b482", "#a9b665", "#d8a657", "#e78a4e", "#d3869b"],
    label: "Vesper"
  },
  // Mint
  {
    id: "mint",
    background: "#0b2027",
    foreground: "#f6f1d1",
    foregroundColors: ["#70e4b0", "#40c9a2", "#32b48c", "#429398", "#cdedf6"],
    label: "Mint"
  },
  // Dracula (renamed)
  {
    id: "darkness",
    background: "#282a36",
    foreground: "#f8f8f2",
    foregroundColors: ["#6272a4", "#bd93f9", "#ff79c6", "#ffb86c", "#8be9fd"],
    label: "Darkness"
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
    // First, capture the current canvas state 
    const captureEvent = new CustomEvent('wallgen-capture-canvas', {
      detail: { purpose: 'save' }
    });
    window.dispatchEvent(captureEvent);
    
    // Then start the saving animation
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
    }, 2000); // Wait 2 seconds before triggering the download to show animation
  }, [algorithm])
  
  // Function to mark saving as complete
  const finishSaving = useCallback(() => {
    setIsSaving(false);
  }, [])
  
  // Clear the canvas - reinitialize particles
  const clearCanvas = useCallback(() => {
    // Create a custom event to trigger a complete canvas reset
    const resetEvent = new CustomEvent('wallgen-reset-canvas', {});
    window.dispatchEvent(resetEvent);
    
    // Also trigger regular initialization (for backward compatibility)
    setInitSignal(s => s + 1);
    setNeedsRedraw(true);
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
  
  // Function to export canvas with custom settings
  const exportCanvas = useCallback((options: { 
    width: number, 
    height: number, 
    format: string, 
    filename: string,
    includeSourceCode?: boolean,
    addBorder?: boolean,
    highQuality?: boolean
  }) => {
    setIsSaving(true);
    
    // Calculate a delay for visual effect
    const delay = 1000;
    
    // Dispatch an event to capture the canvas
    window.dispatchEvent(new CustomEvent('wallgen-capture-canvas', {
      detail: { purpose: 'export' }
    }));
    
    // Dispatch an event to export the canvas after a delay
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('wallgen-export-canvas', {
        detail: {
          ...options,
          algorithm,
          params,
          selectedColorId,
          includeSourceCode: options.includeSourceCode,
          addBorder: options.addBorder,
          highQuality: options.highQuality
        }
      }));
      
      // Set saving to false after export is triggered
      setTimeout(() => {
        setIsSaving(false);
      }, 500);
    }, delay);
  }, [algorithm, params, selectedColorId]);

  // Upload image
  const uploadImage = useCallback((file: File) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      if (imageUrl) {
        // Update the imageUrl parameter
        setParams(prev => ({
          ...prev,
          imageUrl
        }));
        
        // Trigger initialization with the new image
        setInitSignal(s => s + 1);
        setNeedsRedraw(true);
      }
    };
    
    reader.readAsDataURL(file);
  }, []);

  // Reset image
  const resetImage = useCallback(() => {
    // Reset to default image
    setParams(prev => ({
      ...prev,
      imageUrl: '/images/wall.jpg'
    }));
    
    // Trigger initialization
    setInitSignal(s => s + 1);
    setNeedsRedraw(true);
  }, []);

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
        triggerInitialization,
        uploadImage,
        resetImage,
        exportCanvas
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