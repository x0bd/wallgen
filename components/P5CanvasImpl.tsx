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
  const VIEWPORT_WIDTH = 1920;
  const VIEWPORT_HEIGHT = 1080;
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
    
    // Cellular Automata Implementation (Hexagonal Rock-Paper-Scissors)
    class HexLattice {
      width: number = 0;
      height: number = 0;
      cellSize: number = 0;
      u: any; // Vector for hex grid
      v: any; // Vector for hex grid
      o: any; // Origin offset
      dict: Map<number, number> = new Map();
      stateCount: number = 3; // Default to 3 states, will be updated based on colors
      losesTo: Record<number, number> = {}; // Will be dynamically generated
      
      constructor(width: number, height: number, cellSize: number, stateCount: number = 3) {
        this.width = width;
        this.height = height;
        this.cellSize = cellSize;
        this.stateCount = stateCount;
        
        // Create vectors for hex grid calculation (following reference)
        this.u = p.createVector(cellSize * Math.sqrt(3)/2, cellSize/2);
        this.v = p.createVector(0, cellSize);
        this.o = this.v.copy();
        this.o.add(p.createVector(this.u.x, 0));
        
        // Create the game rules - each state loses to the next one
        this.createRules(stateCount);
      }
      
      // Create the cyclic game rules
      createRules(stateCount: number): void {
        this.stateCount = stateCount;
        this.losesTo = {};
        
        // Each state loses to the next state in the circle
        for (let i = 0; i < stateCount; i++) {
          this.losesTo[i] = (i + 1) % stateCount;
        }
      }
      
      // Key function to map 2D coordinates to 1D for dictionary lookup
      key([i, j]: [number, number]): number {
        const rowSize = Math.ceil(this.width/(this.u.x*2));
        return i + rowSize * j;
      }
      
      // Get value at hex coordinate
      getValue(coords: [number, number]): number | undefined {
        const k = this.key(coords);
        return this.dict.get(k);
      }
      
      // Set value at hex coordinate
      setValue(coords: [number, number], val: number): void {
        const k = this.key(coords);
        this.dict.set(k, val);
      }
      
      // Generate all valid hex cell coordinates within the bounds
      *cells(): Generator<[number, number]> {
        const nx1 = Math.floor(this.width/(this.u.x*2));
        const nx2 = Math.floor((this.width-this.u.x)/(this.u.x*2));
        const ny = Math.floor(this.height/(this.v.y*3));
        
        // Generate coordinates exactly as in reference
        for (let j = 0; j < ny; j++) {
          for (let k = 0; k < nx1; k++) {
            yield [2*k, 3*j-k];
          }
          if ((3*j+3)*this.cellSize < this.height) {
            for (let k = 0; k < nx2; k++) {
              yield [2*k+1, 3*j+1-k];
            }
          }
        }
        
        if (this.height % (this.v.y*3) >= this.v.y*2) {
          for (let k = 0; k < nx1; k++) {
            yield [2*k, 3*ny-k];
          }
        }
      }
      
      // Convert hex coordinates to screen coordinates
      cellCoords([i, j]: [number, number]): any {
        const result = this.o.copy().add(this.u.copy().mult(i)).add(this.v.copy().mult(j));
        return result;
      }
      
      // Get the 6 vertices of a hex at the given coordinates
      *vertices([i, j]: [number, number]): Generator<[number, number]> {
        yield* [
          [i+1, j], [i, j+1], [i-1, j+1], 
          [i-1, j], [i, j-1], [i+1, j-1]
        ];
      }
      
      // Get the 6 neighboring cells of a hex
      *neighbors([i, j]: [number, number]): Generator<[number, number]> {
        yield* [
          [i+2, j-1], [i+1, j+1], [i-1, j+2],
          [i-2, j+1], [i-1, j-1], [i+1, j-2]
        ];
      }
      
      // Initialize the lattice with random cell states
      randomize(density: number): void {
        // Clear the dictionary
        this.dict.clear();
        
        // Density parameter influences bias towards specific states
        const densityBias = Math.min(0.5, density / 200); // 0 - 0.5
        
        // Iterate through all cell positions
        for (const cell of this.cells()) {
          // Randomly select a state value, with slight bias based on density
          let stateValue: number;
          
          if (p.random() < densityBias) {
            // Bias towards first two states if high density
            stateValue = Math.floor(p.random(2));
          } else {
            // Otherwise equal distribution
            stateValue = Math.floor(p.random(this.stateCount));
          }
          
          this.setValue(cell, stateValue);
        }
      }
      
      // Update the lattice based on rock-paper-scissors rules
      update(complexity: number): void {
        // Create a new dictionary for the next state
        const nextDict = new Map();
        
        // The threshold is how many antagonists it takes to defeat a cell
        // Higher complexity means more resistance to change (higher threshold)
        const threshold = Math.max(1, Math.min(3, Math.floor(complexity / 40) + 1));
        
        // Update each cell based on neighbors
        for (const cell of this.cells()) {
          // Initialize counts for all possible states
          const counts: Record<number, number> = {};
          for (let i = 0; i < this.stateCount; i++) {
            counts[i] = 0;
          }
          
          // Get current cell value
          const cellValue = this.getValue(cell) || 0;
          counts[cellValue] += 1;
          
          // Count values of neighbors
          for (const neighbor of this.neighbors(cell)) {
            const neighValue = this.getValue(neighbor);
            if (neighValue !== undefined) {
              counts[neighValue] = (counts[neighValue] || 0) + 1;
            }
          }
          
          // Determine next state using cyclic dominance rules
          const antagonist = this.losesTo[cellValue];
          
          // Check if there are enough antagonists to defeat this cell
          if (counts[antagonist] >= threshold) {
            // Cell is defeated and changes to antagonist state
            nextDict.set(this.key(cell), antagonist);
          } else {
            // Cell remains unchanged
            nextDict.set(this.key(cell), cellValue);
          }
        }
        
        // Swap dictionaries
        this.dict = nextDict;
      }
      
      // Draw the current state of the lattice
      display(colors: any[]): void {
        // Cell border visibility - using similar approach to reference
        const showBorder = false;
        
        // Draw each cell
        for (const cell of this.cells()) {
          const value = this.getValue(cell);
          if (value === undefined) continue;
          
          // Get color for this cell type
          const colorIndex = value % colors.length;
          const fillColor = colors[colorIndex];
          
          // Draw the hexagon
          p.beginShape();
          
          // Set fill based on cell value
          p.fill(fillColor);
          
          // Use the border style from reference
          if (showBorder) {
            p.stroke(0);
            p.strokeWeight(1);
          } else {
            p.stroke(fillColor);
            p.strokeWeight(1);
          }
          
          // Draw all vertices of the hexagon
          for (const vertex of this.vertices(cell)) {
            const {x, y} = this.cellCoords(vertex);
            p.vertex(x, y);
          }
          
          p.endShape(p.CLOSE);
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
      // Create a high-resolution master canvas with P2D renderer explicitly specified
      const canvas = p.createCanvas(MASTER_CANVAS_SIZE, MASTER_CANVAS_SIZE, p.P2D);
      
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
        // Calculate a good cell size based on complexity
        // Lower complexity = larger cells (easier to see the patterns)
        const baseSize = Math.max(20, Math.floor(50 - normalizedParams.complexity * 0.4));
        
        // Get the number of available colors - use at least 3
        const colorsList = colors.foregroundColors || [colors.foreground];
        const stateCount = Math.max(3, colorsList.length);
        
        console.log(`Creating Hex Lattice with ${stateCount} states based on available colors`);
        
        // Create new hex lattice with full canvas dimensions
        const lattice = new HexLattice(p.width, p.height, baseSize, stateCount);
        
        // Initialize the lattice with balanced distribution
        lattice.randomize(normalizedParams.density);
        
        // Store the lattice as the only particle
        particles = [lattice];
        
        console.log(`Initialized hex lattice with cell size ${baseSize}px`);
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
        
        // Get all available colors for the cellular states
        let cellColors: any[] = [];
        
        if (colors.foregroundColors && colors.foregroundColors.length > 0) {
          // Use all available colors from the theme
          cellColors = colors.foregroundColors;
        } else {
          // Create color variations from the foreground color
          const [fr, fg, fb] = getRGB(colors.foreground);
          
          // Create at least 3 color variations
          cellColors = [
            colors.foreground,
            p.color(fr * 0.7, fg * 1.2, fb * 0.8), // Greenish variation
            p.color(fr * 1.2, fg * 0.8, fb * 0.7), // Reddish variation
            p.color(fr * 0.8, fg * 0.9, fb * 1.3), // Bluish variation
            p.color(fr * 1.1, fg * 1.1, fb * 0.7), // Yellowish variation
            p.color(fr * 1.0, fg * 0.7, fb * 1.2)  // Purplish variation
          ];
        }
        
        // Run cellular automata simulation steps
        const simulationSteps = currentIsSaving ? 5 : 2;
        
        // Update the hex lattice simulation
        for (let step = 0; step < simulationSteps; step++) {
          // Only update every few frames based on speed for stability
          if (step % Math.max(1, Math.floor(10 / normalizedParams.speed)) === 0) {
             particles[0].update(normalizedParams.complexity);
          }
        }
        
        // Display hex lattice with the mapped colors
        particles[0].display(cellColors);
        
        // Draw border around the canvas - now disabled in this function
        drawBorder(colors.foreground);
      } else if (algorithm === 'dither') {
        // Placeholder for Dither algorithm
        p.background(r, g, b);
        
        // Get foreground color for drawing
        const [fr, fg, fb] = getRGB(colors.foreground);
        p.fill(fr, fg, fb);
        p.noStroke();
        
        // Basic dithering pattern placeholder
        const gridSize = Math.max(5, Math.floor(20 - (normalizedParams.complexity / 10)));
        for (let x = 0; x < p.width; x += gridSize * 2) {
          for (let y = 0; y < p.height; y += gridSize * 2) {
            p.rect(x, y, gridSize, gridSize);
            p.rect(x + gridSize, y + gridSize, gridSize, gridSize);
          }
        }
        
        drawBorder(colors.foreground);
      } else if (algorithm === 'gradients') {
        // Placeholder for Gradients algorithm
        p.background(r, g, b);
        
        // Create a gradient using foreground colors
        const gradientColors = colors.foregroundColors || [colors.foreground];
        p.noStroke();
        
        // Draw gradient bands
        const numBands = Math.max(5, Math.floor(normalizedParams.complexity / 10));
        const bandHeight = p.height / numBands;
        
        for (let i = 0; i < numBands; i++) {
          const colorIndex = i % gradientColors.length;
          const [cr, cg, cb] = getRGB(gradientColors[colorIndex]);
          p.fill(cr, cg, cb, 200);
          p.rect(0, i * bandHeight, p.width, bandHeight);
        }
        
        // Add some animated waves for visual interest
        time += normalizedParams.speed * 0.01;
        p.stroke(255, 255, 255, 40);
        p.strokeWeight(2);
        p.noFill();
        
        for (let i = 0; i < 5; i++) {
          p.beginShape();
          for (let x = 0; x < p.width; x += 20) {
            const y = p.height / 2 + 
                     Math.sin(x * 0.01 + time + i) * (50 + i * 20) + 
                     Math.cos(x * 0.02 + time * 0.7) * (30 + i * 15);
            p.vertex(x, y);
          }
          p.endShape();
        }
        
        drawBorder(colors.foreground);
      } else if (algorithm === 'ascii') {
        // Placeholder for ASCII art algorithm
        p.background(r, g, b);
        
        // Get foreground color for text
        const [fr, fg, fb] = getRGB(colors.foreground);
        p.fill(fr, fg, fb);
        
        // ASCII characters from dense to sparse
        const asciiChars = "@%#*+=-:. ";
        const charIndex = Math.floor(time * 5) % asciiChars.length;
        const char = asciiChars[charIndex];
        
        // Set text properties
        const textSize = Math.max(10, Math.floor(normalizedParams.complexity / 5));
        p.textSize(textSize);
        p.textAlign(p.CENTER, p.CENTER);
        
        // Create ASCII grid
        const cellSize = textSize * 1.2;
        for (let y = cellSize; y < p.height; y += cellSize) {
          for (let x = cellSize; x < p.width; x += cellSize) {
            // Use noise to select different characters
            const noiseVal = p.noise(x * 0.01, y * 0.01, time * 0.1);
            const charToUse = asciiChars.charAt(Math.floor(noiseVal * asciiChars.length));
            p.text(charToUse, x, y);
          }
        }
        
        // Animate time
        time += normalizedParams.speed * 0.01;
        
        drawBorder(colors.foreground);
      } else if (algorithm === 'abstract') {
        // Abstract algorithm implementation
        p.background(r, g, b);
        
        // Use multiple foreground colors if available
        const fgColors = colors.foregroundColors || [colors.foreground];
        
        // Update time for animation
        time += normalizedParams.speed * 0.01;
        
        // Create abstract shapes based on complexity
        const numShapes = Math.floor(10 + normalizedParams.complexity / 2);
        const maxSize = Math.floor(p.width / 4);
        
        // Use perlin noise for organic movement
        for (let i = 0; i < numShapes; i++) {
          const colorIndex = i % fgColors.length;
          const [fr, fg, fb] = getRGB(fgColors[colorIndex]);
          
          // Vary opacity based on position
          const alpha = p.map(i, 0, numShapes, 100, 255);
          
          // Get noise-based positions
          const noiseScale = normalizedParams.noiseScale * 0.001;
          const noiseTime = time * 0.2;
          
          const nx = p.noise(i * 0.3, noiseTime) * p.width;
          const ny = p.noise(i * 0.3 + 100, noiseTime) * p.height;
          
          // Choose shape type based on noise
          const shapeType = Math.floor(p.noise(i * 0.5, time * 0.1) * 4);
          
          p.push();
          p.translate(nx, ny);
          p.rotate(time * (i % 5) * 0.02);
          
          // Size varies with noise
          const size = p.noise(i * 0.2, time * 0.05) * maxSize;
          
          // Draw different abstract shapes
          p.fill(fr, fg, fb, alpha);
          p.noStroke();
          
          if (shapeType === 0) {
            // Circles with cutouts
            p.ellipse(0, 0, size, size);
            p.fill(r, g, b);
            p.ellipse(0, 0, size * 0.6, size * 0.6);
          } 
          else if (shapeType === 1) {
            // Random polygon
            p.beginShape();
            const vertices = Math.floor(3 + p.noise(i, time * 0.1) * 5);
            for (let v = 0; v < vertices; v++) {
              const angle = p.map(v, 0, vertices, 0, p.TWO_PI);
              const rad = size * 0.5 * (0.5 + p.noise(i, v, time * 0.05) * 0.5);
              const vx = p.cos(angle) * rad;
              const vy = p.sin(angle) * rad;
              p.vertex(vx, vy);
            }
            p.endShape(p.CLOSE);
          }
          else if (shapeType === 2) {
            // Curved lines
            p.noFill();
            p.stroke(fr, fg, fb, alpha);
            p.strokeWeight(3 + p.noise(i, time) * 8);
            
            p.beginShape();
            for (let v = 0; v < 10; v++) {
              const angle = p.map(v, 0, 10, 0, p.TWO_PI);
              const rad = size * 0.5 * p.noise(i, v * 0.2, time * 0.1);
              const vx = p.cos(angle) * rad;
              const vy = p.sin(angle) * rad;
              p.curveVertex(vx, vy);
            }
            p.endShape();
          }
          else {
            // Abstract blobs
            p.beginShape();
            const steps = 15;
            for (let v = 0; v <= steps; v++) {
              const angle = p.map(v, 0, steps, 0, p.TWO_PI);
              // Use perlin noise to create blob-like shapes
              const radius = size * 0.5 * p.map(p.noise(i * 0.5, time * 0.1 + v * 0.1), 0, 1, 0.5, 1.2);
              const vx = p.cos(angle) * radius;
              const vy = p.sin(angle) * radius;
              p.curveVertex(vx, vy);
            }
            p.endShape(p.CLOSE);
          }
          
          p.pop();
        }
        
        // Add some connecting lines between shapes for composition
        if (normalizedParams.complexity > 50) {
          p.stroke(255, 255, 255, 30);
          p.strokeWeight(1);
          const lineCount = Math.floor(normalizedParams.complexity / 10);
          
          for (let i = 0; i < lineCount; i++) {
            const x1 = p.noise(i * 0.5, time * 0.1) * p.width;
            const y1 = p.noise(i * 0.5 + 100, time * 0.1) * p.height;
            const x2 = p.noise(i * 0.5 + 200, time * 0.1) * p.width;
            const y2 = p.noise(i * 0.5 + 300, time * 0.1) * p.height;
            
            p.line(x1, y1, x2, y2);
          }
        }
        
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