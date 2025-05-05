"use client"

import { createContext, useContext, useState, ReactNode, useCallback } from 'react'

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
}

// Define the color options
export interface ColorOption {
  id: string
  background: string
  foreground: string
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
  getCurrentColors: () => { background: string, foreground: string }
  needsRedraw: boolean
  hasContent: boolean
  isGenerating: boolean
  generate: () => void
  clearCanvas: () => void
  completeGeneration: () => void
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
  randomizeOnLoad: false
}

// Default color options
const defaultColorOptions: ColorOption[] = [
  { id: "bw", background: "#000000", foreground: "#FFFFFF", label: "B&W" },
  { id: "wb", background: "#FFFFFF", foreground: "#000000", label: "W&B" },
  { id: "gray", background: "#222222", foreground: "#DDDDDD", label: "Gray" },
  { id: "blue", background: "#0F172A", foreground: "#E2E8F0", label: "Blue" },
  { id: "purple", background: "#2E1065", foreground: "#DDD6FE", label: "Purple" },
  { id: "red", background: "#4C0519", foreground: "#FED7E2", label: "Red" },
]

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
  const [hasContent, setHasContent] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [initSignal, setInitSignal] = useState(0); // State to trigger initialization

  // Update parameters - also trigger redraw if content exists
  const updateParams = useCallback((updates: Partial<AlgorithmParams>) => {
    setParams(prev => ({ ...prev, ...updates }))
    if (hasContent) {
      setInitSignal(s => s + 1); // Trigger re-initialization
      setNeedsRedraw(true);
    }
  }, [hasContent])
  
  // Reset parameters - also trigger redraw if content exists
  const resetParams = useCallback(() => {
    setParams(defaultParams)
    if (hasContent) {
      setInitSignal(s => s + 1); // Trigger re-initialization
      setNeedsRedraw(true);
    }
  }, [hasContent])
  
  // Generate function - triggers initialization and redraw
  const generate = useCallback(() => {
    setIsGenerating(true);
    setNeedsRedraw(true);
    setInitSignal(s => s + 1); // Trigger re-initialization
  }, [])
  
  // Function to mark generation as complete
  const completeGeneration = useCallback(() => {
    setIsGenerating(false);
    setHasContent(true);
  }, [])
  
  // Clear the canvas
  const clearCanvas = useCallback(() => {
    setHasContent(false)
    setNeedsRedraw(true) // Redraw the empty state
  }, [])

  // Function to explicitly trigger initialization (used by parameter changes)
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
    if (hasContent) {
      setInitSignal(s => s + 1);
      setNeedsRedraw(true);
    }
  }, [hasContent])

  // Update selected color - trigger redraw
  const updateSelectedColorId = useCallback((id: string) => {
    setSelectedColorId(id);
     if (hasContent) {
      setInitSignal(s => s + 1);
      setNeedsRedraw(true);
    }
  }, [hasContent]);

  // Update inversion - trigger redraw
  const updateIsInverted = useCallback((inverted: boolean) => {
    setIsInverted(inverted);
     if (hasContent) {
      setInitSignal(s => s + 1);
      setNeedsRedraw(true);
    }
  }, [hasContent]);

  
  // Get current colors (memoized)
  const getCurrentColors = useCallback(() => {
    const selectedColor = colorOptions.find(c => c.id === selectedColorId) || colorOptions[0]
    return {
      background: isInverted ? selectedColor.foreground : selectedColor.background,
      foreground: isInverted ? selectedColor.background : selectedColor.foreground
    }
  }, [colorOptions, selectedColorId, isInverted])
  
  return (
    <AlgorithmContext.Provider 
      value={{
        algorithm,
        setAlgorithm, // Needs update to trigger re-init/redraw
        params,
        updateParams,
        resetParams,
        colorOptions,
        selectedColorId,
        setSelectedColorId: updateSelectedColorId, // Use wrapped version
        isInverted,
        setIsInverted: updateIsInverted, // Use wrapped version
        addCustomColor,
        getCurrentColors,
        needsRedraw,
        hasContent,
        isGenerating,
        generate,
        clearCanvas,
        completeGeneration,
        triggerInitialization // Pass down the trigger
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