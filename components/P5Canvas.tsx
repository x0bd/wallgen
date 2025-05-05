"use client";

import React, { useRef, useEffect, useCallback } from "react";
import p5 from "p5";
import { useAlgorithm } from "@/context/algorithm-context";

interface P5CanvasProps {
  width?: number;
  height?: number;
  className?: string;
}

export function P5Canvas({ width = 400, height = 300, className }: P5CanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const sketchInstance = useRef<p5 | null>(null);
  
  // Get algorithm context data
  const { 
    algorithm, 
    params, 
    getCurrentColors 
  } = useAlgorithm();

  // Define sketch as a callback that can be referenced later
  const createSketch = useCallback((p: p5) => {
    // Shared variables
    let time = 0;
    let particles: any[] = [];
    
    // Get normalized parameter values
    const getNormalizedParams = () => {
      return {
        noiseScale: params.noiseScale / 100 * 0.01, // 0-0.01 range
        speed: params.speed / 100 * 5,             // 0-5 range
        complexity: Math.floor(params.complexity / 100 * 10) + 1, // 1-11 range
        density: Math.floor((params.density / 100) * 300) + 50,  // 50-350 range
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
    const getRGB = (color: p5.Color): [number, number, number] => {
      return [p.red(color), p.green(color), p.blue(color)];
    };
    
    // Perlin Noise Implementation
    class PerlinParticle {
      pos: p5.Vector;
      vel: p5.Vector;
      size: number;
      opacity: number;
      shapeType: 'circle' | 'square';
      speed: number;
      
      constructor() {
        const normalizedParams = getNormalizedParams();
        this.pos = p5.Vector.random2D().mult(p.random(p.width * 0.3, p.width * 0.5)).add(p.width/2, p.height/2);
        this.vel = p5.Vector.random2D().mult(p.random(0.2, 1.0));
        this.size = p.random(3, 15);
        this.opacity = p.random(100, 200);
        this.shapeType = p.random() > 0.5 ? 'circle' : 'square';
        this.speed = p.random(0.2, 1.2) * normalizedParams.speed;
      }
      
      update(noiseScale: number) {
        // Use noise for more organic movement
        const angle = p.noise(
          this.pos.x * noiseScale, 
          this.pos.y * noiseScale, 
          time * 0.1
        ) * p.TWO_PI * 4;
        
        const dir = p5.Vector.fromAngle(angle);
        dir.mult(this.speed);
        this.vel.add(dir);
        this.vel.limit(2.5);
        this.pos.add(this.vel);
        
        // Wrap around edges
        if (this.pos.x < 0) this.pos.x = p.width;
        if (this.pos.x > p.width) this.pos.x = 0;
        if (this.pos.y < 0) this.pos.y = p.height;
        if (this.pos.y > p.height) this.pos.y = 0;
      }
      
      display(foregroundColor: p5.Color) {
        p.noStroke();
        const [r, g, b] = getRGB(foregroundColor);
        p.fill(r, g, b, this.opacity);
        
        if (this.shapeType === 'circle') {
          p.circle(this.pos.x, this.pos.y, this.size);
        } else {
          p.rectMode(p.CENTER);
          p.rect(this.pos.x, this.pos.y, this.size, this.size, 2);
        }
      }
    }
    
    // Flow Field Implementation
    class FlowFieldParticle {
      pos: p5.Vector;
      prevPos: p5.Vector;
      vel: p5.Vector;
      acc: p5.Vector;
      maxSpeed: number;
      color: p5.Color;
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
        
        const force = p5.Vector.fromAngle(angle);
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
      
      display(foregroundColor: p5.Color) {
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
      }
    };
    
    // Setup function
    p.setup = () => {
      const containerWidth = canvasRef.current?.clientWidth || width;
      const containerHeight = canvasRef.current?.clientHeight || height;
      
      p.createCanvas(containerWidth, containerHeight);
      
      initializeParticles();
    };
    
    // Initialize particles based on current algorithm
    const initializeParticles = () => {
      const normalizedParams = getNormalizedParams();
      
      particles = [];
      
      if (algorithm === 'perlinNoise') {
        for (let i = 0; i < normalizedParams.density; i++) {
          particles.push(new PerlinParticle());
        }
      } else if (algorithm === 'flowField') {
        for (let i = 0; i < normalizedParams.density * 0.75; i++) {
          particles.push(new FlowFieldParticle());
        }
      } else if (algorithm === 'cellular') {
        // For cellular automata, create a single manager object
        const cellSize = Math.floor(12 - (normalizedParams.complexity * 0.8));
        particles = [new CellularAutomata(cellSize)];
        
        // Initialize with random state based on density
        particles[0].randomize(normalizedParams.density);
      }
    };

    // Draw function
    p.draw = () => {
      const normalizedParams = getNormalizedParams();
      const colors = getColors();
      
      // Apply background with alpha for trails
      if (algorithm === 'flowField') {
        // For flow field, use more trail effect
        const [r, g, b] = getRGB(colors.background);
        p.background(r, g, b, 5);
      } else {
        p.background(colors.background);
      }
      
      // Update time based on speed
      time += normalizedParams.speed * 0.01;
      
      // Process current algorithm
      if (algorithm === 'perlinNoise') {
        // Draw subtle grid for Perlin noise
        drawGrid(colors.foreground, 10);
        
        // Update and display particles
        for (const particle of particles) {
          particle.update(normalizedParams.noiseScale);
          particle.display(colors.foreground);
        }
      } else if (algorithm === 'flowField') {
        // Process flow field particles
        for (const particle of particles) {
          particle.update(normalizedParams.noiseScale, normalizedParams.speed);
          particle.display();
        }
      } else if (algorithm === 'cellular' && particles.length > 0) {
        // Process cellular automata
        // Only update every few frames based on speed
        if (p.frameCount % Math.max(1, Math.floor(10 / normalizedParams.speed)) === 0) {
          particles[0].update(normalizedParams.complexity);
        }
        particles[0].display(colors.foreground);
      }
      
      // Draw border frame
      drawBorder(colors.foreground);
    };
    
    // Draw subtle grid
    const drawGrid = (color: p5.Color, opacity: number) => {
      const [r, g, b] = getRGB(color);
      p.stroke(r, g, b, opacity);
      p.strokeWeight(1);
      const gridSize = 80;
      
      for (let x = 0; x < p.width; x += gridSize) {
        p.line(x, 0, x, p.height);
      }
      
      for (let y = 0; y < p.height; y += gridSize) {
        p.line(0, y, p.width, y);
      }
    };
    
    // Draw border frame
    const drawBorder = (color: p5.Color) => {
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
  }, [algorithm, params, getCurrentColors]);

  useEffect(() => {
    // Create a new p5 instance
    if (canvasRef.current && !sketchInstance.current) {
      sketchInstance.current = new p5(createSketch, canvasRef.current);
    }
    
    return () => {
      // Cleanup
      if (sketchInstance.current) {
        sketchInstance.current.remove();
        sketchInstance.current = null;
      }
    };
  }, [createSketch]);

  // Reinitialize when algorithm changes
  useEffect(() => {
    if (sketchInstance.current) {
      // Remove and recreate the sketch to reinitialize with new algorithm
      sketchInstance.current.remove();
      sketchInstance.current = null;
      
      if (canvasRef.current) {
        sketchInstance.current = new p5(createSketch, canvasRef.current);
      }
    }
  }, [algorithm, createSketch]);

  return <div ref={canvasRef} className={`w-full h-full ${className}`} />;
} 