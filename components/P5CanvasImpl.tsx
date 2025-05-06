"use client";

import React, { useRef, useEffect, useCallback, useState } from "react";
import { useAlgorithm } from "@/context/algorithm-context";
import { QuadTree, Rectangle } from "@/components/quadtree";
// Dynamic import of p5 will happen inside the component

interface P5CanvasProps {
  width?: number;
  height?: number;
  className?: string;
}

const P5CanvasImpl: React.FC<P5CanvasProps> = ({ width = 400, height = 300, className }) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const sketchInstance = useRef<any>(null);
  const [p5, setP5] = useState<any>(null);
  
  // Initialize function reference (scoped outside sketch for access in useEffect)
  const initFunctionRef = useRef<(() => void) | null>(null);
  
  // Ref to store captured canvas data for saving
  const capturedCanvasRef = useRef<string | null>(null);
  
  // Get algorithm context data
  const { 
    algorithm, 
    params, 
    getCurrentColors,
    needsRedraw,
    hasContent,
    triggerInitialization,
    selectedColorId,
    isSaving
  } = useAlgorithm();

  // Ref to hold the latest isSaving value for the draw loop, to avoid re-creating the sketch
  const isSavingRef = useRef(isSaving);
  useEffect(() => {
    isSavingRef.current = isSaving;
  }, [isSaving]);

  // Load p5.js dynamically on the client side only
  useEffect(() => {
    let isMounted = true;

    const loadP5 = async () => {
      try {
        // Dynamic import of p5.js
        const p5Module = await import('p5');
        if (isMounted) {
          setP5(() => p5Module.default);
        }
      } catch (error) {
        console.error('Error loading p5.js:', error);
      }
    };

    loadP5();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Define sketch as a callback that can be referenced later
  const createSketch = useCallback((p: any) => {
    // Shared variables
    let time = 0;
    let particles: any[] = [];
    let quadtree: QuadTree<any> | null = null;
    const QUAD_CAP = 8; // Capacity of quadtree nodes
    
    // Performance optimization flags
    let lastParams: any = { 
      ...params,
      algorithm,
      selectedColorId
    };
    let needsParticleReset = false;
    
    // Get normalized parameter values
    const getNormalizedParams = () => {
      return {
        noiseScale: params.noiseScale / 100 * 0.01, // 0-0.01 range
        speed: params.speed / 100 * 5,             // 0-5 range
        complexity: Math.floor(params.complexity / 100 * 10) + 1, // 1-11 range
        density: Math.floor((params.density / 100) * 500) + 100,  // 100-600 range for higher density
      };
    };
    
    // Get current colors
    const getColors = () => {
      const colors = getCurrentColors();
      return {
        background: p.color(colors.background),
        foreground: p.color(colors.foreground),
        foregroundColors: colors.foregroundColors?.map(color => p.color(color))
      };
    };
    
    // Helper to extract r,g,b values from p5.Color
    const getRGB = (color: any): [number, number, number] => {
      return [p.red(color), p.green(color), p.blue(color)];
    };
    
    // Initialize or reset the quadtree
    const resetQuadtree = () => {
      // Create a boundary that covers the entire canvas
      const boundary = new Rectangle(p.width/2, p.height/2, p.width/2, p.height/2);
      quadtree = new QuadTree(boundary, QUAD_CAP);
    };
    
    // Update the Perlin Noise Implementation for better widget integration
    class PerlinParticle {
      x: number;
      y: number;
      color: any;
      size: number;
      
      constructor(particleColor: any) {
        this.x = p.random(p.width);
        this.y = p.random(p.height);
        this.color = particleColor;
        this.size = 2;  // In reference, size is fixed at 2
      }
      
      update(moveSpeed: number, moveScale: number) {
        // Get angle from Perlin noise, using formula from reference
        // Original comment from reference: "I never understood why end by multiplying by moveScale"
        const angle = p.noise(this.x / moveScale, this.y / moveScale) * p.TWO_PI * moveScale;
        
        // Update position based on angle, exactly like reference
        this.x += p.cos(angle) * moveSpeed;
        this.y += p.sin(angle) * moveSpeed;
        
        // Reset particle if it goes off screen or randomly (for variety)
        if (this.x > p.width || this.x < 0 || this.y > p.height || this.y < 0 || p.random(1) < 0.001) {
          this.x = p.random(p.width);
          this.y = p.random(p.height);
        }
      }
      
      display() {
        // Draw simple ellipse/point like in the reference
        p.fill(this.color);
        p.noStroke();
        p.ellipse(this.x, this.y, this.size, this.size);
      }
    }
    
    // Flow Field Implementation
    class FlowFieldParticle {
      pos: any;
      prevPos: any;
      vel: any;
      acc: any;
      maxSpeed: number;
      color: any;
      alpha: number;
      strokeWeight: number;
      
      constructor() {
        this.pos = p.createVector(p.random(p.width), p.random(p.height));
        this.prevPos = this.pos.copy();
        this.vel = p.createVector(0, 0);
        this.acc = p.createVector(0, 0);
        this.maxSpeed = p.random(2, 4);
        
        const colors = getColors();
        this.color = colors.foreground;
        this.alpha = p.random(20, 100);
        this.strokeWeight = p.random(0.1, 1.5);
      }
      
      update(noiseScale: number, speed: number) {
        this.prevPos = this.pos.copy();
        
        // Calculate direction from noise
        const angle = p.noise(
          this.pos.x * noiseScale,
          this.pos.y * noiseScale,
          time * 0.01
        ) * p.TWO_PI * 2;
        
        const force = p.Vector.fromAngle(angle);
        force.mult(speed * 0.5);
        
        this.acc = force;
        this.vel.add(this.acc);
        this.vel.limit(this.maxSpeed);
        this.pos.add(this.vel);
        
        // Reset acceleration
        this.acc.mult(0);
        
        // Edge handling
        if (this.pos.x < 0 || this.pos.x > p.width || this.pos.y < 0 || this.pos.y > p.height) {
          this.pos = p.createVector(p.random(p.width), p.random(p.height));
          this.prevPos = this.pos.copy();
        }
      }
      
      display() {
        const [r, g, b] = getRGB(this.color);
        p.stroke(r, g, b, this.alpha);
        p.strokeWeight(this.strokeWeight);
        p.line(this.prevPos.x, this.prevPos.y, this.pos.x, this.pos.y);
      }
    }
    
    // Cellular Automata Implementation
    class CellularAutomata {
      grid: number[][];
      nextGrid: number[][];
      cellSize: number;
      cols: number;
      rows: number;
      
      constructor(cellSize: number) {
        this.cellSize = cellSize;
        this.cols = Math.floor(p.width / this.cellSize);
        this.rows = Math.floor(p.height / this.cellSize);
        
        // Initialize grid with random cells
        this.grid = Array(this.cols).fill(0).map(() => 
          Array(this.rows).fill(0).map(() => p.random() > 0.5 ? 1 : 0)
        );
        
        this.nextGrid = Array(this.cols).fill(0).map(() => 
          Array(this.rows).fill(0)
        );
      }
      
      update(complexity: number) {
        // Copy current grid to next grid
        for (let i = 0; i < this.cols; i++) {
          for (let j = 0; j < this.rows; j++) {
            let neighbors = 0;
            
            // Count neighbors (8-way)
            for (let x = -1; x <= 1; x++) {
              for (let y = -1; y <= 1; y++) {
                if (x === 0 && y === 0) continue; // Skip self
                
                const col = (i + x + this.cols) % this.cols;
                const row = (j + y + this.rows) % this.rows;
                
                neighbors += this.grid[col][row];
              }
            }
            
            // Apply rules based on complexity
            // Higher complexity = more complex rules
            if (complexity <= 5) {
              // Simple Conway's Game of Life rules
              if (this.grid[i][j] === 1 && (neighbors < 2 || neighbors > 3)) {
                this.nextGrid[i][j] = 0; // Die: underpopulation or overpopulation
              } else if (this.grid[i][j] === 0 && neighbors === 3) {
                this.nextGrid[i][j] = 1; // Born: reproduction
              } else {
                this.nextGrid[i][j] = this.grid[i][j]; // Stay the same
              }
            } else {
              // More complex rules for higher complexity values
              if (this.grid[i][j] === 1 && (neighbors < 2 || neighbors > (3 + Math.floor(complexity / 3)))) {
                this.nextGrid[i][j] = 0;
              } else if (this.grid[i][j] === 0 && (neighbors === 3 || neighbors === Math.floor(complexity / 2))) {
                this.nextGrid[i][j] = 1;
              } else {
                this.nextGrid[i][j] = this.grid[i][j];
              }
            }
          }
        }
        
        // Swap grids
        [this.grid, this.nextGrid] = [this.nextGrid, this.grid];
      }
      
      display(foregroundColor: any) {
        p.noStroke();
        const [r, g, b] = getRGB(foregroundColor);
        p.fill(r, g, b, 200);
        
        for (let i = 0; i < this.cols; i++) {
          for (let j = 0; j < this.rows; j++) {
            if (this.grid[i][j] === 1) {
              p.rect(i * this.cellSize, j * this.cellSize, this.cellSize, this.cellSize);
            }
          }
        }
      }
      
      // Add randomization with preserved density
      randomize(density: number) {
        const normalizedDensity = density / 400; // 0.125 - 0.875 range
        
        for (let i = 0; i < this.cols; i++) {
          for (let j = 0; j < this.rows; j++) {
            this.grid[i][j] = p.random() < normalizedDensity ? 1 : 0;
          }
        }
      }
    }
    
    // Handle resize
    const handleResize = () => {
      if (canvasRef.current && p) {
        const containerWidth = canvasRef.current.clientWidth;
        const containerHeight = canvasRef.current.clientHeight;
        
        p.resizeCanvas(containerWidth, containerHeight);
        
        // Reset quadtree if it exists
        if (quadtree) {
          resetQuadtree();
          
          // Reinsert all particles into the new quadtree
          if (algorithm === 'perlinNoise' && particles.length > 0) {
            for (const particle of particles) {
              quadtree.insert(particle);
            }
          }
        }
        // Trigger a redraw after resize if there's content
        if(hasContent) {
          p.redraw();
        }
      }
    };
    
    // Setup function
    p.setup = () => {
      const containerWidth = canvasRef.current?.clientWidth || width;
      const containerHeight = canvasRef.current?.clientHeight || height;
      
      p.createCanvas(containerWidth, containerHeight);
      p.noStroke();
      
      // Initialize on setup
      initializeParticles();
      
      // Store reference to initialization function in the ref for access in useEffect
      initFunctionRef.current = initializeParticles;
      
      // Start the animation loop by default
      p.loop();
    };

    // Initialize particles based on the current algorithm
    const initializeParticles = () => {
      const normalizedParams = getNormalizedParams();
      const colors = getColors();
      const [r, g, b] = getRGB(colors.background);
      
      // Always set a clean background on initialization
      p.background(r, g, b);
      
      // Check if we really need to recreate particles (for performance)
      // Only recreate particles if certain params have changed significantly
      const significantChange = (
        algorithm !== lastParams.algorithm ||
        Math.abs(params.density - lastParams.density) > 5 ||
        Math.abs(params.complexity - lastParams.complexity) > 5 ||
        params.randomizeOnLoad !== lastParams.randomizeOnLoad ||
        selectedColorId !== lastParams.selectedColorId ||
        needsParticleReset
      );
      
      // Store current params for future comparison
      lastParams = { 
        ...params, 
        algorithm, 
        selectedColorId 
      };
      
      // If we don't need to recreate particles, just update existing ones
      if (!significantChange && particles.length > 0 && !needsParticleReset) {
        resetQuadtree();
        
        // Reinsert existing particles into quadtree
        if (algorithm === 'perlinNoise') {
          for (const particle of particles) {
            quadtree!.insert(particle);
          }
        }
        
        // Reset time but keep particles
        time = 0;
        return;
      }
      
      // If we get here, we need to recreate particles
      needsParticleReset = false;
      particles = [];
      time = 0; // Always reset time when recreating particles
      
      // Reset quadtree
      resetQuadtree();
      
      if (algorithm === 'perlinNoise') {
        // Reference uses 500 particles, match exactly
        const particleCount = 500;
        
        // Create custom color palette like in reference
        const particleColors = [];
        
        if (colors.foregroundColors && colors.foregroundColors.length > 0) {
          // Use the provided foreground colors
          colors.foregroundColors.forEach(color => {
            particleColors.push(color);
          });
        } else if (selectedColorId === "bw" || selectedColorId === "wb") {
          // Use exact hex colors from reference
          particleColors.push(p.color("#581845")); // deep purple
          particleColors.push(p.color("#900C3F")); // burgundy
          particleColors.push(p.color("#C70039")); // crimson
          particleColors.push(p.color("#FF5733")); // orange-red
          particleColors.push(p.color("#FFC30F")); // yellow
        } else {
          // For custom colors, still use 5 variants for consistency
          const foreground = colors.foreground;
          const [r, g, b] = getRGB(foreground);
          
          // Create 5 variations based on the foreground color
          particleColors.push(foreground);
          particleColors.push(p.color(r * 0.9, g * 0.9, b * 1.1));
          particleColors.push(p.color(r * 1.1, g * 0.8, b * 0.9));
          particleColors.push(p.color(r * 0.85, g * 1.15, b * 0.9));
          particleColors.push(p.color(r * 1.2, g * 1.1, b * 0.7));
        }
        
        console.log(`Creating ${particleCount} particles for Perlin noise effect`);
        
        // Create particles with the colors, similar to reference
        for (let i = 0; i < particleCount; i++) {
          const color = particleColors[Math.floor(p.random(particleColors.length))];
          const particle = new PerlinParticle(color);
          particles.push(particle);
        }
        
        // If randomize on load is enabled, slightly shift particle positions
        if (params.randomizeOnLoad) {
          // Set a random starting time offset
          time = p.random(0, 1000);
        }
      } else if (algorithm === 'flowField') {
        // Original flow field implementation without quadtree
        const particleCount = Math.min(100, Math.floor(normalizedParams.density * 0.3));
        for (let i = 0; i < particleCount; i++) {
          const particle = new FlowFieldParticle();
          particles.push(particle);
        }
      } else if (algorithm === 'cellular') {
        // Original cellular automata implementation
        const cellSize = Math.floor(16 - (normalizedParams.complexity * 0.5));
        particles = [new CellularAutomata(cellSize)];
        particles[0].randomize(normalizedParams.density);
      }
    };

    // Draw function
    p.draw = () => {
      const normalizedParams = getNormalizedParams();
      const colors = getColors();
      
      // Get background color
      const [r, g, b] = getRGB(colors.background);
      
      // Current saving state from ref
      const currentIsSaving = isSavingRef.current;

      // Begin logic for drawing
      if (algorithm === 'perlinNoise') {
        // Only set background once at the beginning, like in reference
        if (time === 0) {
          // In reference, a deep purple background is used "#1a0633"
          // But we'll use the user's background color for consistency
          if (!params.transparentBackground) {
            p.background(r, g, b);
          } else {
            // For transparent background, use clear with low alpha to create trails
            p.clear();
          }
        } else if (params.transparentBackground) {
          // For transparent mode, we need to clear with very low alpha
          // to create the trails effect while maintaining transparency
          p.background(0, 0, 0, 3); // Nearly transparent black for the fade effect
        }
        // No background refresh for regular mode during animation to allow trails to build up
        
        // Reset quadtree for efficiency
        resetQuadtree();
        
        // Reference moveSpeed is 0.4, moveScale is 800 - exact match
        const moveSpeed = 0.4; // Fixed value from reference
        const moveScale = 800; // Fixed value from reference
        
        // Update the time factor based on speed parameter for user control
        if (currentIsSaving) {
          // During saving, possibly speed up animation for better effect
          time += normalizedParams.speed * 0.02;
        } else {
          // Normal continuous animation mode
          time += normalizedParams.speed * 0.01;
        }
        
        // Update all particles - exactly like the reference implementation
        for (const particle of particles) {
          particle.update(moveSpeed, moveScale);
          particle.display();
          quadtree!.insert(particle);
        }
        
        // Draw border after particles
        drawBorder(colors.foreground);
      } else if (algorithm === 'flowField') {
        // For other algorithms, always clear the background
        p.background(r, g, b);
        
        // --- Simulation Steps ---
        // Use a fixed number of steps
        const simulationSteps = currentIsSaving ? 15 : 8;
        
        // Run simulation internally
        for (let step = 0; step < simulationSteps; step++) {
          time += normalizedParams.speed * 0.01; // Advance time
          for (const particle of particles) {
            particle.update(normalizedParams.noiseScale, normalizedParams.speed);
            // Update prevPos only on the last step for correct line drawing
            if (step === simulationSteps - 1) {
               particle.prevPos = particle.pos.copy();
            }
          }
        }
        
        // Draw flow field particles
        for (const particle of particles) {
          const [fr, fg, fb] = getRGB(particle.color);
          p.stroke(fr, fg, fb, 180);
          p.strokeWeight(particle.strokeWeight * 1.5);
          p.line(particle.prevPos.x, particle.prevPos.y, particle.pos.x, particle.pos.y);
        }
        drawBorder(colors.foreground);
      } else if (algorithm === 'cellular' && particles.length > 0) {
        // Clear background for cellular automata
        p.background(r, g, b);
        
        // Run cellular automata simulation steps
        const simulationSteps = currentIsSaving ? 15 : 8;
        for (let step = 0; step < simulationSteps; step++) {
          // Only update cellular every few sim steps based on speed param for visual stability
          if (step % Math.max(1, Math.floor(10 / normalizedParams.speed)) === 0) {
             particles[0].update(normalizedParams.complexity);
          }
        }
        
        // Display cellular automata
        particles[0].display(colors.foreground);
        drawBorder(colors.foreground);
      } else {
        // Empty state - just clear the canvas
        p.background(r, g, b);
        drawBorder(colors.foreground);
      }
      
      // Control animation loop - always animate in continuous mode
      // Use appropriate frame rate
      p.frameRate(currentIsSaving ? 60 : 24); // Higher framerate during saving for smooth capture
    };
    
    // Draw a border around the canvas
    const drawBorder = (color: any) => {
      const [r, g, b] = getRGB(color);
      p.stroke(r, g, b, 60);
      p.strokeWeight(1);
      p.noFill();
      p.rect(0, 0, p.width, p.height);
      p.noStroke();
    };
    
    // Handle window resize
    p.windowResized = () => {
      handleResize();
    };

    // Expose methods to the sketch instance for external calls
    (p as any).triggerInit = () => {
      if(initFunctionRef.current) {
        initFunctionRef.current();
      }
    };
  }, [algorithm, params, getCurrentColors, hasContent, selectedColorId]);

  // Create the p5 instance when the p5 module is loaded
  useEffect(() => {
    if (!p5 || !canvasRef.current || sketchInstance.current) return;
    
    // Create a new p5 instance
    sketchInstance.current = new p5(createSketch, canvasRef.current);
    
    // Handler to capture the current canvas state
    const handleCaptureCanvas = () => {
      if (sketchInstance.current) {
        console.log("Capturing canvas state");
        // Save the canvas as a data URL
        capturedCanvasRef.current = sketchInstance.current.canvas.toDataURL('image/png');
      }
    };
    
    // Add event listener for saving the canvas
    const handleSaveCanvas = (event: CustomEvent) => {
      if (sketchInstance.current) {
        const filename = event.detail?.filename || `wallgen-${Date.now()}`;
        console.log("Saving canvas as:", filename);
        
        if (capturedCanvasRef.current) {
          // Create a temporary link to download the captured canvas
          const link = document.createElement('a');
          link.href = capturedCanvasRef.current;
          link.download = `${filename}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Clear the captured canvas reference
          capturedCanvasRef.current = null;
        } else {
          // Fallback to p5's save method if no capture is available
          sketchInstance.current.save(filename);
        }
      }
    };
    
    // Handler for complete canvas reset
    const handleResetCanvas = () => {
      if (sketchInstance.current) {
        console.log("Resetting canvas completely");
        
        // Force resetting of particles and background
        if (initFunctionRef.current) {
          // Reset internal state directly
          sketchInstance.current.clear();
          
          // Reinitialize particles
          initFunctionRef.current();
          
          // Force redraw to show the reset state immediately
          sketchInstance.current.redraw();
        }
      }
    };
    
    // Add the event listeners
    window.addEventListener('wallgen-capture-canvas', handleCaptureCanvas as EventListener);
    window.addEventListener('wallgen-save-canvas', handleSaveCanvas as EventListener);
    window.addEventListener('wallgen-reset-canvas', handleResetCanvas as EventListener);
    
    return () => {
      // Cleanup
      window.removeEventListener('wallgen-capture-canvas', handleCaptureCanvas as EventListener);
      window.removeEventListener('wallgen-save-canvas', handleSaveCanvas as EventListener);
      window.removeEventListener('wallgen-reset-canvas', handleResetCanvas as EventListener);
      
      if (sketchInstance.current) {
        sketchInstance.current.remove();
        sketchInstance.current = null;
      }
    };
  }, [p5, createSketch]);

  // Handle redraw requests
  useEffect(() => {
    if (!canvasRef.current || !sketchInstance.current) return;
    
    if (needsRedraw) {
      console.log("Redrawing...");
      sketchInstance.current.redraw();
    }
  }, [needsRedraw]);

  // Handle initialization triggers with performance optimization
  useEffect(() => {
    if (!sketchInstance.current || !initFunctionRef.current) return;
    
    if (!isSaving) {
      console.log("Initializing particles from trigger...");
      initFunctionRef.current();
      sketchInstance.current.redraw();
    }
  }, [triggerInitialization, isSaving]);

  return (
    <div ref={canvasRef} className={className} style={{ width: '100%', height: '100%' }}>
      {!p5 && <div className="flex items-center justify-center h-full">Loading P5.js...</div>}
    </div>
  );
};

export default P5CanvasImpl; 