"use client";

import React, { useRef, useEffect, useState } from "react";
import p5 from "p5";

interface P5CanvasProps {
  width?: number;
  height?: number;
  className?: string;
}

export function P5Canvas({ width = 400, height = 300, className }: P5CanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const sketchInstance = useRef<p5 | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width, height });

  useEffect(() => {
    // Handle resize
    const handleResize = () => {
      if (canvasRef.current) {
        const containerWidth = canvasRef.current.clientWidth;
        const containerHeight = canvasRef.current.clientHeight;
        
        if (containerWidth !== canvasSize.width || containerHeight !== canvasSize.height) {
          setCanvasSize({
            width: containerWidth,
            height: containerHeight
          });
          
          // Resize the canvas if the sketch is already initialized
          if (sketchInstance.current) {
            sketchInstance.current.resizeCanvas(containerWidth, containerHeight);
          }
        }
      }
    };

    // Define the sketch
    const sketch = (p: p5) => {
      const particles: Particle[] = [];
      const numParticles = 150;
      let noiseScale = 0.003;
      let time = 0;
      
      class Particle {
        pos: p5.Vector;
        vel: p5.Vector;
        size: number;
        opacity: number;
        color: string;
        speed: number;
        
        constructor() {
          this.pos = p5.Vector.random2D().mult(p.random(p.width * 0.3, p.width * 0.5)).add(p.width/2, p.height/2);
          this.vel = p5.Vector.random2D().mult(p.random(0.2, 1.0));
          this.size = p.random(3, 15);
          this.opacity = p.random(100, 200);
          this.color = p.random() > 0.5 ? 'white' : '#f5f5f5';
          this.speed = p.random(0.2, 1.2);
        }
        
        update() {
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
        
        display() {
          p.noStroke();
          p.fill(255, this.opacity);
          
          // Occasionally draw rectangles instead of circles
          if (this.color === 'white') {
            p.circle(this.pos.x, this.pos.y, this.size);
          } else {
            p.rectMode(p.CENTER);
            p.rect(this.pos.x, this.pos.y, this.size, this.size, 2);
          }
        }
      }

      p.setup = () => {
        const containerWidth = canvasRef.current?.clientWidth || width;
        const containerHeight = canvasRef.current?.clientHeight || height;
        
        p.createCanvas(containerWidth, containerHeight);
        
        // Create particles
        for (let i = 0; i < numParticles; i++) {
          particles.push(new Particle());
        }
      };

      p.draw = () => {
        p.background(0, 15); // Semi-transparent background for trails
        time += 0.01;
        
        // Draw subtle grid
        drawGrid();
        
        // Update and display particles
        particles.forEach(particle => {
          particle.update();
          particle.display();
        });
        
        // Draw border
        drawBorder();
      };
      
      // Draw subtle grid
      const drawGrid = () => {
        p.stroke(255, 5);
        p.strokeWeight(1);
        const gridSize = 80;
        
        for (let x = 0; x < p.width; x += gridSize) {
          p.line(x, 0, x, p.height);
        }
        
        for (let y = 0; y < p.height; y += gridSize) {
          p.line(0, y, p.width, y);
        }
        
        // Draw accent lines
        p.stroke(255, 15);
        p.line(0, p.height/2, p.width, p.height/2);
        p.line(p.width/2, 0, p.width/2, p.height);
      };
      
      // Draw border frame
      const drawBorder = () => {
        p.noFill();
        p.stroke(255, 30);
        p.strokeWeight(1);
        p.rect(2, 2, p.width-4, p.height-4, 2);
      };
      
      // Handle window resize
      p.windowResized = () => {
        handleResize();
      };
    };

    // Create a new p5 instance
    if (canvasRef.current && !sketchInstance.current) {
      sketchInstance.current = new p5(sketch, canvasRef.current);
      handleResize(); // Initial size check
    }
    
    // Add resize listener
    window.addEventListener('resize', handleResize);

    return () => {
      // Cleanup
      window.removeEventListener('resize', handleResize);
      if (sketchInstance.current) {
        sketchInstance.current.remove();
        sketchInstance.current = null;
      }
    };
  }, []);

  return <div ref={canvasRef} className={`w-full h-full ${className}`} />;
} 