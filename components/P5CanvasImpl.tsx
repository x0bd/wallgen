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
  
  // Get algorithm context data
  const { 
    algorithm, 
    params, 
    getCurrentColors,
    needsRedraw,
    hasContent,
    triggerInitialization,
    selectedColorId,
    isGenerating
  } = useAlgorithm();

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
        foreground: p.color(colors.foreground)
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
      speed: number;
      prevX: number;
      prevY: number;
      
      constructor(particleColor: any, complexity: number) {
        this.x = p.random(p.width);
        this.y = p.random(p.height);
        this.prevX = this.x;
        this.prevY = this.y;
        this.color = particleColor;
        // Adjust size for better visualization, closer to reference
        this.size = p.random(2, 4 + (complexity / 15));
        this.speed = p.random(0.8, 2.0); // Higher speed for more dynamic movement
      }
      
      update(moveSpeed: number, moveScale: number) {
        // Save previous position for trail
        this.prevX = this.x;
        this.prevY = this.y;
        
        // Get angle from Perlin noise, using formula similar to reference
        const angle = p.noise(this.x / moveScale, this.y / moveScale, time * 0.1) * p.TWO_PI * moveScale;
        
        // Update position based on angle, similar to reference
        this.x += p.cos(angle) * moveSpeed * this.speed;
        this.y += p.sin(angle) * moveSpeed * this.speed;
        
        // Reset particle if it goes off screen or randomly (for variety)
        // Low random chance for reset to allow longer trails to form
        if (this.x > p.width || this.x < 0 || this.y > p.height || this.y < 0 || p.random(1) < 0.001) {
          this.x = p.random(p.width);
          this.y = p.random(p.height);
          this.prevX = this.x;
          this.prevY = this.y;
        }
      }
      
      display() {
        // Use line for trail effect, similar to reference
        const [r, g, b] = getRGB(this.color);
        
        // Draw line/trail between previous and current position
        p.stroke(r, g, b, 150); // Semi-transparent for trail effect
        p.strokeWeight(this.size);
        p.line(this.prevX, this.prevY, this.x, this.y);
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
      
      p.noLoop(); // Start in noLoop mode
    };

    // Initialize particles based on the current algorithm
    const initializeParticles = () => {
      const normalizedParams = getNormalizedParams();
      
      particles = [];
      
      // Reset quadtree
      resetQuadtree();
      
      if (algorithm === 'perlinNoise') {
        // Get the base colors for particles
        const colors = getColors();
        const foreground = colors.foreground;
        
        // Create custom color palette similar to reference example
        const particleColors = [];
        
        // Add reference-like color variations if using default colors
        // Create rich color variations inspired by the reference
        if (selectedColorId === "bw" || selectedColorId === "wb") {
          // Create a richer palette for default B&W themes
          particleColors.push(p.color(88, 24, 69));    // deep purple
          particleColors.push(p.color(144, 12, 63));   // burgundy
          particleColors.push(p.color(199, 0, 57));    // crimson
          particleColors.push(p.color(255, 87, 51));   // orange-red
          particleColors.push(p.color(255, 195, 15));  // yellow
        } else {
          // Create variations based on the selected color
          const [r, g, b] = getRGB(foreground);
          particleColors.push(foreground);
          particleColors.push(p.color(r * 0.9, g * 0.9, b * 1.1));
          particleColors.push(p.color(r * 1.1, g * 0.8, b * 0.9));
          particleColors.push(p.color(r * 0.85, g * 1.15, b * 0.9));
          particleColors.push(p.color(r * 1.2, g * 1.1, b * 0.7));
        }
        
        // Create particles, using exact 500 like the reference for best performance/appearance balance
        const particleCount = 500;
        
        console.log(`Creating ${particleCount} particles for Perlin noise effect`);
        
        // Create particles with the colors, similar to reference
        for (let i = 0; i < particleCount; i++) {
          const color = particleColors[Math.floor(p.random(particleColors.length))];
          const particle = new PerlinParticle(color, normalizedParams.complexity * 10);
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
      
      // Make sure time is reset here if needed for consistent simulation start
      time = 0;
    };

    // Draw function
    p.draw = () => {
      const normalizedParams = getNormalizedParams();
      const colors = getColors();
      
      // Get background color
      const [r, g, b] = getRGB(colors.background);
      
      // Begin logic for drawing
      if (hasContent || isGenerating) {
        // Special handling for Perlin noise algorithm
        if (algorithm === 'perlinNoise') {
          if (time === 0) {
            // First frame, clear the background
            p.background(r, g, b);
          } else {
            // For subsequent frames during generation, apply a transparent overlay
            // This creates the trail effect
            p.fill(r, g, b, isGenerating ? 10 : 20); // More transparent during generation
            p.noStroke();
            p.rect(0, 0, p.width, p.height);
          }
        } else {
          // For other algorithms, always clear the background
          p.background(r, g, b);
        }
        
        // --- Simulation Steps ---
        const simulationSteps = isGenerating ? 20 : 100; // Fewer steps during generation for smoother animation
        
        if (algorithm === 'perlinNoise') {
          resetQuadtree();
          
          // Run simulation
          for (let step = 0; step < simulationSteps; step++) {
            time += normalizedParams.speed * 0.01; // Advance time
            // Adjust parameters to match reference
            const moveSpeed = normalizedParams.speed * 0.4; // 0.4 in reference
            const moveScale = 800; // 800 in reference, or use parameterized value if needed
            for (const particle of particles) {
              particle.update(moveSpeed, moveScale);
            }
          }
          
          // Insert final positions into quadtree after simulation
          for (const particle of particles) {
            quadtree!.insert(particle);
          }
        } else if (algorithm === 'flowField') {
          // Run simulation internally
          for (let step = 0; step < simulationSteps; step++) {
            time += normalizedParams.speed * 0.01; // Advance time
            for (const particle of particles) {
              particle.update(normalizedParams.noiseScale, normalizedParams.speed);
              // Update prevPos only on the last step for correct line drawing
              if (step === simulationSteps - 1) {
                 particle.prevPos = particle.pos.copy(); // Capture final position as prev for display
              }
            }
          }
        } else if (algorithm === 'cellular' && particles.length > 0) {
          // Run simulation internally
          for (let step = 0; step < simulationSteps; step++) {
            // Only update cellular every few sim steps based on speed param for visual stability
            if (step % Math.max(1, Math.floor(10 / normalizedParams.speed)) === 0) {
               particles[0].update(normalizedParams.complexity);
            }
          }
        }
        
        // --- Drawing Steps ---
        if (algorithm === 'perlinNoise') {
          const visibleArea = new Rectangle(p.width/2, p.height/2, p.width/2, p.height/2);
          const visibleParticles = quadtree!.query(visibleArea);
          for (const particle of visibleParticles) {
            particle.display();
          }
          drawBorder(colors.foreground);
        } else if (algorithm === 'flowField') {
          for (const particle of particles) {
            // For static, draw lines thicker and less transparent
            const [fr, fg, fb] = getRGB(particle.color);
            p.stroke(fr, fg, fb, 180); // More opaque
            p.strokeWeight(particle.strokeWeight * 1.5); // Slightly thicker
            p.line(particle.prevPos.x, particle.prevPos.y, particle.pos.x, particle.pos.y);
          }
          drawBorder(colors.foreground);
        } else if (algorithm === 'cellular' && particles.length > 0) {
          particles[0].display(colors.foreground);
          drawBorder(colors.foreground);
        }
      } else {
        // Empty state - just clear the canvas
        p.background(r, g, b);
        drawBorder(colors.foreground);
      }
      
      // Only loop during generation, otherwise stop after a single draw
      if (isGenerating) {
        if (!p.isLooping()) p.loop();
      } else {
        if (p.isLooping()) p.noLoop();
      }
    };
    
    // Draw border frame
    const drawBorder = (color: any) => {
      p.noFill();
      const [r, g, b] = getRGB(color);
      p.stroke(r, g, b, 30);
      p.strokeWeight(1);
      p.rect(2, 2, p.width-4, p.height-4, 2);
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
  }, [algorithm, params, getCurrentColors, hasContent, selectedColorId, isGenerating]);

  // Create the p5 instance when the p5 module is loaded
  useEffect(() => {
    if (!p5 || !canvasRef.current || sketchInstance.current) return;
    
    // Create a new p5 instance
    sketchInstance.current = new p5(createSketch, canvasRef.current);
    
    return () => {
      // Cleanup
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

  // Handle initialization triggers
  useEffect(() => {
    if (!sketchInstance.current || !initFunctionRef.current) return;
    
    console.log("Initializing particles from trigger...");
    initFunctionRef.current();
    sketchInstance.current.redraw();
  }, [triggerInitialization]);

  return <div ref={canvasRef} className={`w-full h-full ${className}`} />;
};

export default P5CanvasImpl; 