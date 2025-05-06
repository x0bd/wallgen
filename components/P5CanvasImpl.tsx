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

  // Replace the dynamic viewport sizing with fixed dimensions
  const MASTER_CANVAS_SIZE = 4000; // High-resolution master canvas size
  const VIEWPORT_WIDTH = 1600;
  const VIEWPORT_HEIGHT = 900;
  const [viewportPosition, setViewportPosition] = useState({ x: MASTER_CANVAS_SIZE/2, y: MASTER_CANVAS_SIZE/2 }); // Center of canvas
  const [viewportSize, setViewportSize] = useState({ width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT });

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

  // Update the first useEffect to use fixed viewport size
  useEffect(() => {
    if (canvasRef.current) {
      // Set fixed viewport size instead of measuring container
      setViewportSize({
        width: VIEWPORT_WIDTH,
        height: VIEWPORT_HEIGHT
      });
      
      // Calculate initial viewport center (centered on master canvas)
      setViewportPosition({
        x: MASTER_CANVAS_SIZE / 2,
        y: MASTER_CANVAS_SIZE / 2
      });
    }
  }, [canvasRef.current]); // Only run when canvasRef changes

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
        this.size = 3; // Slightly larger than reference (2) for better visibility on large canvas
      }
      
      update(moveSpeed: number, moveScale: number) {
        // Get angle from Perlin noise, using formula from reference
        // Original comment from reference: "I never understood why end by multiplying by moveScale"
        const angle = p.noise(this.x / moveScale, this.y / moveScale) * p.TWO_PI * moveScale;
        
        // Update position based on angle, exactly like reference
        this.x += p.cos(angle) * moveSpeed;
        this.y += p.sin(angle) * moveSpeed;
        
        // Reset particle if it goes off screen or randomly (for variety)
        // Use exact same probability as reference (0.001)
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
        this.maxSpeed = p.random(2, 8); // Increased for larger canvas
        
        const colors = getColors();
        this.color = colors.foreground;
        this.alpha = p.random(20, 100);
        this.strokeWeight = p.random(2, 8); // Increased stroke weight for better visibility
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
      // Create a high-resolution master canvas
      const canvas = p.createCanvas(MASTER_CANVAS_SIZE, MASTER_CANVAS_SIZE);
      
      // Position the canvas within its container
      canvas.parent(canvasRef.current);
      
      // Apply CSS to only show the viewport portion
      const canvasElement = canvasRef.current?.querySelector('canvas');
      if (canvasElement) {
        // Simpler approach - scale and position the canvas relative to viewport
        canvasElement.style.position = 'absolute';
        canvasElement.style.transformOrigin = 'top left';
        canvasElement.style.transform = `scale(${VIEWPORT_WIDTH / MASTER_CANVAS_SIZE})`;
        canvasElement.style.left = '0';
        canvasElement.style.top = '0';
        
        // Make the container show only the visible portion
        if (canvasRef.current) {
          canvasRef.current.style.overflow = 'hidden';
          canvasRef.current.style.position = 'relative';
          canvasRef.current.style.width = `${VIEWPORT_WIDTH}px`;
          canvasRef.current.style.height = `${VIEWPORT_HEIGHT}px`;
          canvasRef.current.style.boxShadow = '0 0 20px rgba(0,0,0,0.2)'; // Add subtle shadow
          canvasRef.current.style.borderRadius = '4px'; // Slightly rounded corners
        }
      }
      
      // Set background based on colors
      p.background(getCurrentColors().background);
      
      // Initialize particles for the algorithm
      initializeParticles();
      
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
        // Use more particles than reference but not too many
        const particleCount = 800; // Compromise between reference (500) and density needs
        
        // Create color palette exactly like reference
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
        
        console.log(`Creating ${particleCount} particles for Perlin noise (reference: 500)`);
        
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
        // Increase particle count for flow field on larger canvas
        const particleCount = Math.min(1000, Math.floor(normalizedParams.density * 3));
        for (let i = 0; i < particleCount; i++) {
          const particle = new FlowFieldParticle();
          particles.push(particle);
        }
      } else if (algorithm === 'cellular') {
        // Adjust cell size for the larger canvas
        const cellSize = Math.floor(64 - (normalizedParams.complexity * 2)); // Larger cells for 4000x4000
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
          if (selectedColorId === "bw" || selectedColorId === "wb") {
            p.background("#1a0633"); // Use exact background from reference
          } else if (!params.transparentBackground) {
            p.background(r, g, b); // Use user-selected background
          } else {
            // For transparent background, use clear
            p.clear();
          }
        } else if (params.transparentBackground) {
          // For transparent mode, we need to clear with very low alpha
          // to create the trails effect while maintaining transparency
          p.background(0, 0, 0, 3); // Use reference-similar alpha
        }
        // No background refresh for regular mode during animation to allow trails to build up
        
        // Reset quadtree for efficiency
        resetQuadtree();
        
        // Use values closer to the reference with slight adjustment for larger canvas
        const moveSpeed = 0.5; // Just slightly faster than reference (0.4)
        const moveScale = 800; // Exact reference value
        
        // Update the time factor based on speed parameter for user control
        if (currentIsSaving) {
          // During saving, slightly speed up animation 
          time += normalizedParams.speed * 0.02;
        } else {
          // Normal continuous animation mode
          time += normalizedParams.speed * 0.01; // Original speed
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
    
    // Draw a border around the canvas - now disabled as per user request
    const drawBorder = (color: any) => {
      // Border drawing disabled
      return;
    };
    
    // Handle window resize
    p.windowResized = () => {
      // Keep the fixed canvas size - don't adjust dimensions on window resize
      
      // Still update container styles to maintain positioning
      if (canvasRef.current) {
        const canvasElement = canvasRef.current?.querySelector('canvas');
        if (canvasElement) {
          canvasElement.style.transformOrigin = 'top left';
          canvasElement.style.transform = `scale(${VIEWPORT_WIDTH / MASTER_CANVAS_SIZE})`;
        }
      }
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
    const handleCaptureCanvas = (event: CustomEvent) => {
      if (sketchInstance.current) {
        const purpose = event.detail?.purpose || 'save';
        console.log(`Capturing canvas state for ${purpose}`);
        
        // Only save to capturedCanvasRef for save operations, not exports
        if (purpose === 'save') {
          // Save the canvas as a data URL
          capturedCanvasRef.current = sketchInstance.current.canvas.toDataURL('image/png');
        }
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
    
    // Handler for exporting canvas with custom settings
    const handleExportCanvas = (event: CustomEvent) => {
      const { 
        width, 
        height, 
        format, 
        filename, 
        algorithm,
        includeSourceCode,
        highQuality = true 
      } = event.detail;
      
      if (sketchInstance.current && sketchInstance.current.canvas) {
        console.log(`Exporting from high-res canvas: ${width}x${height} as ${format}`);
        
        // Calculate the visible portion of the canvas based on the scale
        const canvasScale = VIEWPORT_WIDTH / MASTER_CANVAS_SIZE;
        
        // Calculate the visible portion in the high-res canvas coordinates
        const visibleWidth = Math.min(VIEWPORT_WIDTH / canvasScale, MASTER_CANVAS_SIZE);
        const visibleHeight = Math.min(VIEWPORT_HEIGHT / canvasScale, MASTER_CANVAS_SIZE);
        
        // Central position for cropping is the center of the canvas
        const centerX = MASTER_CANVAS_SIZE / 2;
        const centerY = MASTER_CANVAS_SIZE / 2;
        
        // Calculate crop dimensions to maintain aspect ratio of the target export
        const cropWidth = Math.min(width, visibleWidth);
        const cropHeight = Math.min(height, visibleHeight);
        
        // Calculate the crop position (centered)
        const cropX = Math.max(0, centerX - cropWidth / 2);
        const cropY = Math.max(0, centerY - cropHeight / 2);
        
        // Make sure we're not trying to crop outside the canvas
        const actualWidth = Math.min(cropWidth, MASTER_CANVAS_SIZE - cropX);
        const actualHeight = Math.min(cropHeight, MASTER_CANVAS_SIZE - cropY);
        
        console.log(`Cropping from high-res canvas at (${cropX}, ${cropY}) with size ${actualWidth}x${actualHeight}`);
        
        // Capture the cropped region directly from the p5 canvas
        const croppedImage = sketchInstance.current.get(cropX, cropY, actualWidth, actualHeight);
        
        // Create a temporary canvas for the final export image
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const ctx = tempCanvas.getContext('2d');
        
        if (ctx && croppedImage) {
          // Set background color in case the crop is smaller than target dimensions
          const bgColor = getCurrentColors().background;
          ctx.fillStyle = bgColor;
          ctx.fillRect(0, 0, width, height);
          
          // Center the cropped image
          const offsetX = (width - actualWidth) / 2;
          const offsetY = (height - actualHeight) / 2;
          
          // Draw the cropped image to the temporary canvas
          croppedImage.loadPixels();
          ctx.drawImage(
            croppedImage.canvas, 
            0, 0, croppedImage.width, croppedImage.height, 
            offsetX, offsetY, actualWidth, actualHeight
          );
          
          // Apply image smoothing if high quality is requested
          if (highQuality) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
          } else {
            ctx.imageSmoothingEnabled = false;
          }
          
          // Generate data URL from the temp canvas
          const qualityValue = format === 'jpg' ? (highQuality ? 0.95 : 0.9) : undefined;
          const finalImageFormat = format === 'svg' ? 'png' : format;
          const exportDataURL = tempCanvas.toDataURL(`image/${finalImageFormat}`, qualityValue);
          
          // Add metadata if requested
          if (includeSourceCode) {
            // Create another canvas to add metadata
            const metaCanvas = document.createElement('canvas');
            metaCanvas.width = width;
            metaCanvas.height = height;
            const metaCtx = metaCanvas.getContext('2d');
            
            if (metaCtx) {
              // Draw the exported image
              const metaImg = new Image();
              metaImg.onload = () => {
                metaCtx.drawImage(metaImg, 0, 0);
                
                // Add metadata
                const infoHeight = Math.max(24, Math.floor(height / 30));
                const infoWidth = Math.max(200, Math.floor(width / 7));
                const fontSize = Math.max(10, Math.floor(infoHeight * 0.5));
                
                metaCtx.fillStyle = 'rgba(0,0,0,0.6)';
                metaCtx.fillRect(5, height - infoHeight - 5, infoWidth, infoHeight);
                
                metaCtx.fillStyle = 'white';
                metaCtx.font = `${fontSize}px monospace`;
                metaCtx.fillText(`Algorithm: ${algorithm} | WallGen`, 10, height - infoHeight/2);
                
                // Generate final data URL with metadata
                const finalDataURL = metaCanvas.toDataURL(`image/${finalImageFormat}`, qualityValue);
                downloadImage(finalDataURL, `${filename}.${finalImageFormat}`);
              };
              metaImg.src = exportDataURL;
            } else {
              downloadImage(exportDataURL, `${filename}.${finalImageFormat}`);
            }
          } else {
            downloadImage(exportDataURL, `${filename}.${finalImageFormat}`);
          }
        } else {
          console.error('Failed to create export context or capture image from canvas');
        }
      } else {
        console.error('Cannot export: Main canvas sketchInstance or canvas not available');
      }
    };
    
    // Helper function to download an image
    const downloadImage = (dataURL: string, filename: string) => {
      const link = document.createElement('a');
      link.href = dataURL;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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
    window.addEventListener('wallgen-export-canvas', handleExportCanvas as EventListener);
    window.addEventListener('wallgen-reset-canvas', handleResetCanvas as EventListener);
    
    return () => {
      // Cleanup
      window.removeEventListener('wallgen-capture-canvas', handleCaptureCanvas as EventListener);
      window.removeEventListener('wallgen-save-canvas', handleSaveCanvas as EventListener);
      window.removeEventListener('wallgen-export-canvas', handleExportCanvas as EventListener);
      window.removeEventListener('wallgen-reset-canvas', handleResetCanvas as EventListener);
      
      if (sketchInstance.current) {
        sketchInstance.current.remove();
        sketchInstance.current = null;
      }
    };
  }, [p5, createSketch, getCurrentColors]);

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
    <div 
      ref={canvasRef} 
      className={className} 
      style={{ 
        width: `${VIEWPORT_WIDTH}px`, 
        height: `${VIEWPORT_HEIGHT}px`,
        margin: '0 auto' // Center the canvas in its parent container
      }}
    >
      {!p5 && <div className="flex items-center justify-center h-full">Loading P5.js...</div>}
    </div>
  );
};

export default P5CanvasImpl; 