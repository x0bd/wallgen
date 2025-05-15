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

const P5CanvasImpl: React.FC<P5CanvasProps> = ({
	width = 400,
	height = 300,
	className,
}) => {
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
		isSaving,
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
	const [viewportPosition, setViewportPosition] = useState({
		x: MASTER_CANVAS_SIZE / 2,
		y: MASTER_CANVAS_SIZE / 2,
	}); // Center of canvas
	const [viewportSize, setViewportSize] = useState({
		width: VIEWPORT_WIDTH,
		height: VIEWPORT_HEIGHT,
	});

	// Refs to track image-based canvas dimensions when using an image-based algorithm
	const imageCanvasDimensions = useRef<{
		width: number;
		height: number;
	} | null>(null);
	const isImageBasedAlgorithm = useRef(false);
	const [canvasMode, setCanvasMode] = useState<"standard" | "image">(
		"standard"
	);

	// Helper function to check if the current algorithm is image-based
	const checkIfImageBasedAlgorithm = useCallback((algo: string) => {
		return ["flowPlotter"].includes(algo);
	}, []);

	// Update the image-based algorithm tracking whenever algorithm changes
	useEffect(() => {
		const isImageBased = checkIfImageBasedAlgorithm(algorithm);
		isImageBasedAlgorithm.current = isImageBased;
		setCanvasMode(isImageBased ? "image" : "standard");
	}, [algorithm, checkIfImageBasedAlgorithm]);

	// Load p5.js dynamically on the client side only
	useEffect(() => {
		let isMounted = true;

		const loadP5 = async () => {
			try {
				// Dynamic import of p5.js
				const p5Module = await import("p5");
				if (isMounted) {
					setP5(() => p5Module.default);
				}
			} catch (error) {
				console.error("Error loading p5.js:", error);
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
				height: VIEWPORT_HEIGHT,
			});

			// Calculate initial viewport center (centered on master canvas)
			setViewportPosition({
				x: MASTER_CANVAS_SIZE / 2,
				y: MASTER_CANVAS_SIZE / 2,
			});
		}
	}, [canvasRef.current]); // Only run when canvasRef changes

	// Define sketch as a callback that can be referenced later
	const createSketch = useCallback(
		(p: any) => {
			// Shared variables
			let time = 0;
			let particles: any[] = [];
			let quadtree: QuadTree<any> | null = null;
			const QUAD_CAP = 8; // Capacity of quadtree nodes

			// Mondriomaton specific state variables
			let mondriGrid: number[][] = [];
			let nextMondriGrid: number[][] = [];
			let currentGridSize: number = 32;
			let currentCellSize: number = 0;
			let currentRowPositions: number[] = [];
			let currentColPositions: number[] = [];
			let currentLineWidth: number = 2;
			const MONDRI_STATES = 5; // 0: background, 1-3: primary colors, 4: line color

			// Helper function: splitAxis (adapted from mondri.js) - defined here so it can be used in both initialization and resize
			const splitAxis = (
				start: number,
				end: number,
				depth: number,
				isRow: boolean,
				noiseScale: number,
				noiseSpeed: number
			): number[] => {
				if (depth <= 0) return [start];

				let midBase = (start + end) / 2;

				// Use noise for organic divisions
				const noiseVal = p.noise(
					(isRow ? start : end) * 0.001 * noiseScale,
					p.frameCount * 0.001 * noiseSpeed
				);

				// Map noise to create offset within reasonable bounds
				const noiseOffset =
					p.map(noiseVal, 0, 1, -0.15, 0.15) * (end - start);

				// Constrain mid to ensure we don't get zero-width cells
				let mid = p.constrain(
					midBase + noiseOffset,
					start + (end - start) * 0.1,
					end - (end - start) * 0.1
				);

				// Additional safeguards against bad splits
				if (mid <= start) mid = start + (end - start) * 0.5;
				if (mid >= end) mid = end - (end - start) * 0.5;

				// Recursively split left and right
				let left = splitAxis(
					start,
					mid,
					depth - 1,
					isRow,
					noiseScale,
					noiseSpeed
				);
				let right = splitAxis(
					mid,
					end,
					depth - 1,
					isRow,
					noiseScale,
					noiseSpeed
				);

				// Return concatenated arrays
				return left.concat(right);
			};

			// Performance optimization flags
			let lastParams: any = {
				...params,
				algorithm,
				selectedColorId,
			};
			let needsParticleReset = false;

			// Get normalized parameter values
			const getNormalizedParams = () => {
				return {
					noiseScale: (params.noiseScale / 100) * 0.01, // 0-0.01 range
					speed: (params.speed / 100) * 5, // 0-5 range
					complexity: Math.floor((params.complexity / 100) * 10) + 1, // 1-11 range
					density: Math.floor((params.density / 100) * 500) + 100, // 100-600 range for higher density
				};
			};

			// Get current colors
			const getColors = () => {
				const colors = getCurrentColors();
				return {
					background: p.color(colors.background),
					foreground: p.color(colors.foreground),
					foregroundColors: colors.foregroundColors?.map((color) =>
						p.color(color)
					),
				};
			};

			// Helper to extract r,g,b values from p5.Color
			const getRGB = (color: any): [number, number, number] => {
				return [p.red(color), p.green(color), p.blue(color)];
			};

			// Initialize or reset the quadtree
			const resetQuadtree = () => {
				// Create a boundary that covers the entire canvas
				const boundary = new Rectangle(
					p.width / 2,
					p.height / 2,
					p.width / 2,
					p.height / 2
				);
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
					this.size = 2; // Exact reference value (2) for authentic look
				}

				update(moveSpeed: number, moveScale: number) {
					// Get angle from Perlin noise, using formula from reference
					// Original comment from reference: "I never understood why end by multiplying by moveScale"
					const angle =
						p.noise(this.x / moveScale, this.y / moveScale) *
						p.TWO_PI *
						moveScale;

					// Update position based on angle, exactly like reference
					this.x += p.cos(angle) * moveSpeed;
					this.y += p.sin(angle) * moveSpeed;

					// Reset particle if it goes off screen or randomly (for variety)
					// Use exact same probability as reference (0.001)
					if (
						this.x > p.width ||
						this.x < 0 ||
						this.y > p.height ||
						this.y < 0 ||
						p.random(1) < 0.001
					) {
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

				constructor(
					width: number,
					height: number,
					cellSize: number,
					stateCount: number = 3
				) {
					this.width = width;
					this.height = height;
					this.cellSize = cellSize;
					this.stateCount = stateCount;

					// Create vectors for hex grid calculation (following reference)
					this.u = p.createVector(
						(cellSize * Math.sqrt(3)) / 2,
						cellSize / 2
					);
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
					const rowSize = Math.ceil(this.width / (this.u.x * 2));
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
					const nx1 = Math.floor(this.width / (this.u.x * 2));
					const nx2 = Math.floor(
						(this.width - this.u.x) / (this.u.x * 2)
					);
					const ny = Math.floor(this.height / (this.v.y * 3));

					// Generate coordinates exactly as in reference
					for (let j = 0; j < ny; j++) {
						for (let k = 0; k < nx1; k++) {
							yield [2 * k, 3 * j - k];
						}
						if ((3 * j + 3) * this.cellSize < this.height) {
							for (let k = 0; k < nx2; k++) {
								yield [2 * k + 1, 3 * j + 1 - k];
							}
						}
					}

					if (this.height % (this.v.y * 3) >= this.v.y * 2) {
						for (let k = 0; k < nx1; k++) {
							yield [2 * k, 3 * ny - k];
						}
					}
				}

				// Convert hex coordinates to screen coordinates
				cellCoords([i, j]: [number, number]): any {
					const result = this.o
						.copy()
						.add(this.u.copy().mult(i))
						.add(this.v.copy().mult(j));
					return result;
				}

				// Get the 6 vertices of a hex at the given coordinates
				*vertices([i, j]: [number, number]): Generator<
					[number, number]
				> {
					yield* [
						[i + 1, j],
						[i, j + 1],
						[i - 1, j + 1],
						[i - 1, j],
						[i, j - 1],
						[i + 1, j - 1],
					];
				}

				// Get the 6 neighboring cells of a hex
				*neighbors([i, j]: [number, number]): Generator<
					[number, number]
				> {
					yield* [
						[i + 2, j - 1],
						[i + 1, j + 1],
						[i - 1, j + 2],
						[i - 2, j + 1],
						[i - 1, j - 1],
						[i + 1, j - 2],
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
					const threshold = Math.max(
						1,
						Math.min(3, Math.floor(complexity / 40) + 1)
					);

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
								counts[neighValue] =
									(counts[neighValue] || 0) + 1;
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
							const { x, y } = this.cellCoords(vertex);
							p.vertex(x, y);
						}

						p.endShape(p.CLOSE);
					}
				}
			}

			// FlowImage Implementation
			class FlowImageParticle {
				x: number;
				y: number;
				r: number = 0;
				g: number = 0;
				b: number = 0;
				a: number = 255;
				strokeLength: number;
				angle: number = 0;
				strokeWeight: number;

				// Cache end points and colors for better performance
				endX: number = 0;
				endY: number = 0;
				color: string = "";
				highlightColor: string = "";

				constructor(
					x: number,
					y: number,
					r: number,
					g: number,
					b: number,
					a: number,
					strokeLength: number,
					strokeWeight: number
				) {
					this.x = x;
					this.y = y;
					this.r = r;
					this.g = g;
					this.b = b;
					this.a = a;
					this.strokeLength = strokeLength;
					this.strokeWeight = strokeWeight;

					// Pre-calculate colors for faster drawing
					this.color = `rgba(${r},${g},${b},${a})`;
					const hr = Math.min(r * 1.5, 255);
					const hg = Math.min(g * 1.5, 255);
					const hb = Math.min(b * 1.5, 255);
					this.highlightColor = `rgba(${hr},${hg},${hb},100)`;
				}

				update(noiseScale: number) {
					// Get the angle from the noise value at this position
					this.angle =
						p.noise(this.x * noiseScale, this.y * noiseScale) *
						p.TWO_PI;

					// Pre-calculate endpoint for faster drawing
					const lineLength = this.strokeLength;
					this.endX = this.x + Math.cos(this.angle) * lineLength;
					this.endY = this.y + Math.sin(this.angle) * lineLength;
				}

				display() {
					// Draw main line - use pre-calculated values
					p.stroke(this.r, this.g, this.b, this.a);
					p.strokeWeight(this.strokeWeight);
					p.line(this.x, this.y, this.endX, this.endY);

					// Only draw highlight if particle is large enough
					if (this.strokeWeight > 1.5) {
						p.stroke(
							Math.min(this.r * 3, 255),
							Math.min(this.g * 3, 255),
							Math.min(this.b * 3, 255),
							100
						);
						p.strokeWeight(this.strokeWeight * 0.7);
						p.line(this.x, this.y, this.endX, this.endY);
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
						if (
							algorithm === "perlinNoise" &&
							particles.length > 0
						) {
							for (const particle of particles) {
								quadtree.insert(particle);
							}
						}
					}
					// Trigger a redraw after resize if there's content
					if (hasContent) {
						p.redraw();
					}
				}
			};

			// Setup function
			p.setup = () => {
				const canvasMode = isImageBasedAlgorithm.current
					? "image"
					: "standard";
				console.log(
					`Setting up canvas in ${canvasMode} mode for algorithm: ${algorithm}`
				);

				// Create canvas with standard size initially using P2D for better performance
				const canvas = p.createCanvas(
					MASTER_CANVAS_SIZE,
					MASTER_CANVAS_SIZE,
					p.P2D
				);

				// Position the canvas within its container
				canvas.parent(canvasRef.current);

				// Apply CSS to show the appropriate viewport
				updateCanvasStyles();

				// Set background based on colors
				p.background(getCurrentColors().background);

				// Initialize particles for the algorithm
				initializeParticles();

				// Start the animation loop by default
				p.loop();
			};

			// Helper function to update canvas styles based on current algorithm
			const updateCanvasStyles = () => {
				const canvasElement =
					canvasRef.current?.querySelector("canvas");
				if (!canvasElement) return;

				if (
					isImageBasedAlgorithm.current &&
					imageCanvasDimensions.current
				) {
					// For image-based algorithms, use the actual image dimensions
					const imgWidth = imageCanvasDimensions.current.width;
					const imgHeight = imageCanvasDimensions.current.height;

					// Calculate scaling to fit the viewport
					const scaleX = VIEWPORT_WIDTH / imgWidth;
					const scaleY = VIEWPORT_HEIGHT / imgHeight;

					// Use "contain" scaling to ensure the entire image is visible
					const scale = Math.min(scaleX, scaleY);

					// Position the canvas in the center of the viewport
					canvasElement.style.position = "absolute";
					canvasElement.style.transformOrigin = "top left";
					canvasElement.style.transform = `scale(${scale})`;

					// Center the canvas in the viewport
					const scaledWidth = imgWidth * scale;
					const scaledHeight = imgHeight * scale;
					const leftOffset = (VIEWPORT_WIDTH - scaledWidth) / 2;
					const topOffset = (VIEWPORT_HEIGHT - scaledHeight) / 2;

					canvasElement.style.left = `${leftOffset}px`;
					canvasElement.style.top = `${topOffset}px`;

					// Update container styling
					if (canvasRef.current) {
						canvasRef.current.style.overflow = "hidden";
						canvasRef.current.style.position = "relative";
						canvasRef.current.style.width = `${VIEWPORT_WIDTH}px`;
						canvasRef.current.style.height = `${VIEWPORT_HEIGHT}px`;
						canvasRef.current.style.boxShadow =
							"0 0 20px rgba(0,0,0,0.2)";
						canvasRef.current.style.borderRadius = "4px";
						canvasRef.current.style.display = "flex";
						canvasRef.current.style.justifyContent = "center";
						canvasRef.current.style.alignItems = "center";
					}
				} else {
					// For standard algorithms, use the original simpler approach that had better performance
					canvasElement.style.position = "absolute";
					canvasElement.style.transformOrigin = "top left";
					canvasElement.style.transform = `scale(${
						VIEWPORT_WIDTH / MASTER_CANVAS_SIZE
					})`;
					canvasElement.style.left = "0";
					canvasElement.style.top = "0";

					// Make the container show only the visible portion
					if (canvasRef.current) {
						canvasRef.current.style.overflow = "hidden";
						canvasRef.current.style.position = "relative";
						canvasRef.current.style.width = `${VIEWPORT_WIDTH}px`;
						canvasRef.current.style.height = `${VIEWPORT_HEIGHT}px`;
						canvasRef.current.style.boxShadow =
							"0 0 20px rgba(0,0,0,0.2)";
						canvasRef.current.style.borderRadius = "4px";
					}
				}
			};

			// Initialize particles based on the current algorithm
			const initializeParticles = () => {
				const normalizedParams = getNormalizedParams();
				const appColors = getColors();
				const [bgR, bgG, bgB] = getRGB(appColors.background);

				p.background(bgR, bgG, bgB);

				// Check if we really need to recreate particles (for performance)
				// Only recreate particles if certain params have changed significantly
				const significantChange =
					algorithm !== lastParams.algorithm ||
					Math.abs(params.density - lastParams.density) > 5 ||
					Math.abs(params.complexity - lastParams.complexity) > 5 ||
					params.randomizeOnLoad !== lastParams.randomizeOnLoad ||
					selectedColorId !== lastParams.selectedColorId ||
					needsParticleReset;

				// Store current params for future comparison
				lastParams = {
					...params,
					algorithm,
					selectedColorId,
				};

				// If we don't need to recreate particles, just update existing ones
				if (
					!significantChange &&
					particles.length > 0 &&
					!needsParticleReset
				) {
					resetQuadtree();

					// Reinsert existing particles into quadtree
					if (algorithm === "perlinNoise") {
						for (const particle of particles) {
							quadtree!.insert(particle);
						}
					}

					time = 0;
					return;
				}

				needsParticleReset = false;
				particles = [];
				time = 0;
				resetQuadtree();

				if (algorithm === "perlinNoise") {
					// Use particle count exactly like reference
					const particleCount = 500; // Exact reference value (500)

					// Create color palette exactly like reference
					const particleColors = [];

					if (
						appColors.foregroundColors &&
						appColors.foregroundColors.length > 0
					) {
						// Use the provided foreground colors
						appColors.foregroundColors.forEach((color) => {
							particleColors.push(color);
						});
					} else if (
						selectedColorId === "bw" ||
						selectedColorId === "wb"
					) {
						// Use exact hex colors from reference
						particleColors.push(p.color("#581845")); // deep purple
						particleColors.push(p.color("#900C3F")); // burgundy
						particleColors.push(p.color("#C70039")); // crimson
						particleColors.push(p.color("#FF5733")); // orange-red
						particleColors.push(p.color("#FFC30F")); // yellow
					} else {
						// For custom colors, still use 5 variants for consistency
						const foreground = appColors.foreground;
						const [r, g, b] = getRGB(foreground);

						// Create 5 variations based on the foreground color
						particleColors.push(foreground);
						particleColors.push(p.color(r * 0.9, g * 0.9, b * 1.1));
						particleColors.push(p.color(r * 1.1, g * 0.8, b * 0.9));
						particleColors.push(
							p.color(r * 0.85, g * 1.15, b * 0.9)
						);
						particleColors.push(p.color(r * 1.2, g * 1.1, b * 0.7));
					}

					console.log(
						`Creating ${particleCount} particles for Perlin noise (reference: 500)`
					);

					// Create particles with the colors, similar to reference
					for (let i = 0; i < particleCount; i++) {
						const color =
							particleColors[
								Math.floor(p.random(particleColors.length))
							];
						const particle = new PerlinParticle(color);
						particles.push(particle);
					}

					// If randomize on load is enabled, slightly shift particle positions
					if (params.randomizeOnLoad) {
						// Set a random starting time offset
						time = p.random(0, 1000);
					}
				} else if (algorithm === "cellular") {
					// Calculate a good cell size based on complexity
					// Lower complexity = larger cells (easier to see the patterns)
					const baseSize = Math.max(
						20,
						Math.floor(50 - normalizedParams.complexity * 0.4)
					);

					// Get the number of available colors - including background color
					const colorsList = appColors.foregroundColors || [
						appColors.foreground,
					];
					const stateCount = Math.max(3, colorsList.length + 1); // +1 to include background color

					console.log(
						`Creating Hex Lattice with ${stateCount} states based on available colors (including background)`
					);

					// Create new hex lattice with full canvas dimensions
					const lattice = new HexLattice(
						p.width,
						p.height,
						baseSize,
						stateCount
					);

					// Initialize the lattice with balanced distribution
					lattice.randomize(normalizedParams.density);

					// Store the lattice as the only particle
					particles = [lattice];

					console.log(
						`Initialized hex lattice with cell size ${baseSize}px`
					);
				} else if (algorithm === "flowPlotter") {
					particles = []; // Clear any previous image data

					p.loadImage(
						params.imageUrl || "/images/wall.jpg",
						(loadedImg: any) => {
							console.log(
								`Loaded image for flowPlotter: ${loadedImg.width}x${loadedImg.height}`
							);

							// Store image dimensions for future reference
							imageCanvasDimensions.current = {
								width: loadedImg.width,
								height: loadedImg.height,
							};

							// Resize the canvas to match image dimensions
							p.resizeCanvas(loadedImg.width, loadedImg.height);

							// Update styles to display the image correctly
							updateCanvasStyles();

							// Ensure pixels of the original image are loaded if not done by p5 by default
							loadedImg.loadPixels();

							let imageToProcess = loadedImg;
							let isOptimized = false;
							const totalPixels =
								loadedImg.width * loadedImg.height;

							// Optimization: if image is very large, create a smaller version for pixel processing.
							// Using a threshold like 4 Megapixels (e.g., 2000x2000).
							// The optimization will run by default if the image is large enough.
							if (totalPixels > 4000000) {
								console.log(
									"Optimizing large image for flowPlotter processing"
								);
								const scaleFactor = Math.sqrt(
									4000000 / totalPixels
								);
								const newWidth = Math.floor(
									loadedImg.width * scaleFactor
								);
								const newHeight = Math.floor(
									loadedImg.height * scaleFactor
								);

								const smallImg = p.createImage(
									newWidth,
									newHeight
								);
								// Ensure the smallImg has pixel data array
								smallImg.loadPixels();
								smallImg.copy(
									loadedImg,
									0,
									0,
									loadedImg.width,
									loadedImg.height,
									0,
									0,
									newWidth,
									newHeight
								);
								// Pixels might need to be explicitly loaded again after copy on some p5 versions or contexts
								smallImg.loadPixels();
								imageToProcess = smallImg;
								isOptimized = true;
								console.log(
									`Image optimized to ${newWidth}x${newHeight}`
								);
							} else {
								// If not optimizing, ensure the imageToProcess (original) has its pixels loaded.
								if (
									!imageToProcess.pixels ||
									imageToProcess.pixels.length === 0
								) {
									imageToProcess.loadPixels();
								}
							}

							particles[0] = {
								img: loadedImg, // Original full-res image (e.g. for display overlays)
								processImg: imageToProcess, // Image to sample pixels from (original or scaled)
								originalWidth: loadedImg.width,
								originalHeight: loadedImg.height,
								isOptimized: isOptimized,
							};

							// Set a random noise seed for variation like in flow.js
							p.noiseSeed(p.random(100000));

							// Draw base image with medium opacity (can be adjusted or made optional)
							// flow.js starts with a plain white background. Let's match that.
							p.background(255); // Match flow.js initial background

							// Reset animation timer for flowPlotter
							time = 0;

							// High frame rate for smooth animation
							p.frameRate(30); // flow.js doesn't specify, 30 is a good default
							p.loop(); // Ensure loop is running
						},
						(err: any) => {
							console.error(
								"FlowPlotter: Error loading image:",
								err
							);
							const colors = getColors(); // Get fallback colors
							const [bgR, bgG, bgB] = getRGB(colors.background);
							p.background(bgR, bgG, bgB); // Fallback to theme background
						}
					);
				} else if (algorithm === "abstract") {
					// Mondriomaton (inspired by mondri.js)
					// Initialize grid size based on density but keep it reasonable

					// If we're in the process of saving/exporting, use a higher grid size
					if (isSavingRef.current) {
						console.log("Setting high-resolution grid for export");
						currentGridSize = 32; // Use higher grid size for export
					} else {
						currentGridSize = 16; // Standard size for normal display
					}
					currentCellSize =
						Math.max(p.width, p.height) / currentGridSize;

					// Set line width based on density with reasonable limits
					currentLineWidth = Math.max(
						1,
						Math.min(
							3,
							Math.ceil(normalizedParams.density * 0.3) + 1
						)
					);

					console.log(
						`Initializing Mondriomaton with grid size: ${currentGridSize}, line width: ${currentLineWidth}`
					);

					// Initialize grids
					mondriGrid = [];
					nextMondriGrid = [];

					for (let i = 0; i < currentGridSize; i++) {
						mondriGrid[i] = [];
						nextMondriGrid[i] = [];
						for (let j = 0; j < currentGridSize; j++) {
							// Use distribution closer to original mondri.js
							// Initially, create a more balanced distribution of colors with fewer black (4) cells
							// STATES 0: white background, 1-3: colors, 4: black
							mondriGrid[i][j] = Math.floor(
								p.random(MONDRI_STATES - 1)
							); // 0-3 (no black/4 initially)
							nextMondriGrid[i][j] = mondriGrid[i][j];
						}
					}

					// Set frame rate lower for better performance
					p.frameRate(10);

					// Generate grid positions using splitAxis with reasonable depth
					const nLog2 = Math.floor(Math.log2(currentGridSize));
					currentRowPositions = splitAxis(
						0,
						p.height,
						nLog2,
						true,
						normalizedParams.noiseScale,
						normalizedParams.speed
					);
					currentColPositions = splitAxis(
						0,
						p.width,
						nLog2,
						false,
						normalizedParams.noiseScale,
						normalizedParams.speed
					);
					currentRowPositions.push(p.height);
					currentColPositions.push(p.width);
				} else {
					// Default fallback: clear background and draw border
					p.background(bgR, bgG, bgB);
					drawBorder(appColors.foreground);
				}
			};

			// Draw function
			p.draw = () => {
				const normalizedParams = getNormalizedParams();
				const appColors = getColors();
				const [bgR, bgG, bgB] = getRGB(appColors.background);
				const currentIsSaving = isSavingRef.current;

				if (algorithm === "perlinNoise") {
					// Only set background once at the beginning, like in reference
					if (time === 0) {
						// In reference, a deep purple background is used "#1a0633"
						if (
							selectedColorId === "bw" ||
							selectedColorId === "wb"
						) {
							p.background("#1a0633"); // Use exact background from reference
						} else if (!params.transparentBackground) {
							p.background(bgR, bgG, bgB); // Use user-selected background
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

					// Use exact values from the reference implementation
					const moveSpeed = 0.4; // Exact reference value for authentic motion
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
					drawBorder(appColors.foreground);
				} else if (
					algorithm === "cellular" &&
					particles.length > 0 &&
					particles[0] instanceof HexLattice
				) {
					// Clear background for cellular automata
					p.background(bgR, bgG, bgB);

					// Get all available colors for the cellular states
					let cellColors: any[] = [];

					if (
						appColors.foregroundColors &&
						appColors.foregroundColors.length > 0
					) {
						// Include the background color as part of the palette
						cellColors = [
							appColors.background,
							...appColors.foregroundColors,
						];
					} else {
						// Create color variations from the foreground color and include background
						const [fr, fg, fb] = getRGB(appColors.foreground);

						// Create variations and include background color
						cellColors = [
							appColors.background, // Include background color as one of the states
							appColors.foreground,
							p.color(fr * 0.7, fg * 1.2, fb * 0.8), // Greenish variation
							p.color(fr * 1.2, fg * 0.8, fb * 0.7), // Reddish variation
							p.color(fr * 0.8, fg * 0.9, fb * 1.3), // Bluish variation
							p.color(fr * 1.1, fg * 1.1, fb * 0.7), // Yellowish variation
						];
					}

					// Run cellular automata simulation steps
					const simulationSteps = currentIsSaving ? 5 : 2;

					// Update the hex lattice simulation
					for (let step = 0; step < simulationSteps; step++) {
						// Only update every few frames based on speed for stability
						if (
							step %
								Math.max(
									1,
									Math.floor(10 / normalizedParams.speed)
								) ===
							0
						) {
							particles[0].update(normalizedParams.complexity);
						}
					}

					// Display hex lattice with the mapped colors
					particles[0].display(cellColors);

					// Draw border around the canvas - now disabled in this function
					drawBorder(appColors.foreground);
				} else if (
					algorithm === "flowPlotter" &&
					particles.length > 0 &&
					particles[0] &&
					particles[0].img
				) {
					const imgData = particles[0];
					if (
						!imgData ||
						!imgData.processImg ||
						!imgData.processImg.pixels ||
						imgData.processImg.pixels.length === 0
					) {
						// Image or pixel data not ready, skip drawing this frame
						return;
					}

					const processImg = imgData.processImg; // Image to sample pixels from (original or optimized)
					const originalWidth = imgData.originalWidth;
					const originalHeight = imgData.originalHeight;

					const drawLength = 250; // Animation duration, flow.js: 580. Shorter for faster ultra-dense buildup.
					const noiseScaleValue =
						(params.noiseScale / 100) * 0.002 + 0.0001; // Range: 0.0001 to 0.0021. flow.js uses 0.0001.
					const baseStrokeLength = 15; // From flow.js

					// time is managed by the main sketch loop, incremented by `time += 3` before this block in the original code.
					// Ensure time increment is suitable. Let's make it part of this logic for clarity.
					// If `time` is not reset to 0 on init, this needs adjustment.
					// Assuming `time` is effectively frame count for this algorithm here.

					if (time > drawLength && !currentIsSaving) {
						if (p.isLooping()) {
							p.noLoop();
						}
						return;
					}

					// Particle count mapping for ultra-density - INCREASED EVEN MORE
					const densityParamValue =
						typeof params.density === "number"
							? params.density
							: 50; // Default to 50 if undefined
					const densityFactor =
						densityParamValue === 0 ? 0.1 : densityParamValue / 100; // Min factor 0.1 for 0 density, else scale 0-100 to 0-1
					const baseUltraDensity = 2500 * densityFactor; // Max particles, e.g., 2500 for 100% density

					// Start with 60% of max density, ramp up to 100% for very quick coverage
					const count = Math.floor(
						p.map(
							time,
							0,
							drawLength,
							baseUltraDensity * 0.6,
							baseUltraDensity
						)
					);

					// Stroke weight mapping like flow.js
					const sw = p.map(time, 0, drawLength, 25, 2);

					for (let i = 0; i < count; i++) {
						// Pick a random point on the processing image
						const px = p.floor(p.random(processImg.width));
						const py = p.floor(p.random(processImg.height));

						const pIndex = (py * processImg.width + px) * 4;
						if (pIndex + 3 >= processImg.pixels.length) continue; // Boundary check

						const r = processImg.pixels[pIndex];
						const g = processImg.pixels[pIndex + 1];
						const b = processImg.pixels[pIndex + 2];
						const a = processImg.pixels[pIndex + 3];

						// Scale coordinates for display if an optimized (smaller) image was processed
						const displayX = imgData.isOptimized
							? (px / processImg.width) * originalWidth
							: px;
						const displayY = imgData.isOptimized
							? (py / processImg.height) * originalHeight
							: py;

						p.stroke(r, g, b, a);
						p.strokeWeight(sw);

						p.push();
						p.translate(displayX, displayY);

						const n = p.noise(
							px * noiseScaleValue,
							py * noiseScaleValue
						);
						p.rotate(p.radians(p.map(n, 0, 1, -180, 180)));

						// Randomized stroke length, current baseStrokeLength is the minimum
						const lengthVariation = p.random(1, 1.8); // Strokes will be 1x to 1.8x the base length
						const currentLineLength =
							baseStrokeLength * lengthVariation;
						p.line(0, 0, currentLineLength, 0);

						// Draw highlight
						p.stroke(
							Math.min(r * 3, 255),
							Math.min(g * 3, 255),
							Math.min(b * 3, 255),
							p.random(50, 150)
						); // Adjusted alpha for visibility
						p.strokeWeight(sw * 0.8);
						p.line(0, -sw * 0.1, currentLineLength, -sw * 0.1); // Slightly smaller offset for highlight based on thinner strokes
						p.pop();
					}

					// Increment time/frame counter for this algorithm's progression
					// This was `time += 3` in the previous version. Let's stick to a clear increment.
					time += 1.5; // Moderate speed for progression

					// Optional: subtle image overlay from previous implementation (flow.js doesn't have this)
					if (time < drawLength * 0.6 && time % 7 < 1.5) {
						// Check against time increment
						p.push();
						p.tint(255, 10);
						p.image(
							imgData.img,
							0,
							0,
							originalWidth,
							originalHeight
						);
						p.pop();
					}
				} else if (algorithm === "abstract") {
					// Clear background
					p.background(appColors.background);

					// Only proceed if grid is properly initialized
					if (
						mondriGrid.length === 0 ||
						currentRowPositions.length === 0
					) {
						return;
					}

					// Update based on frame count - less frequent updates for better performance
					if (p.frameCount % 6 === 0 || currentIsSaving) {
						// Copy current grid to next grid
						for (let i = 0; i < mondriGrid.length; i++) {
							for (let j = 0; j < mondriGrid[i].length; j++) {
								nextMondriGrid[i][j] = mondriGrid[i][j];
							}
						}

						// Apply simplified rules to each cell
						for (let i = 0; i < mondriGrid.length; i++) {
							for (let j = 0; j < mondriGrid[i].length; j++) {
								// Skip line cells
								if (mondriGrid[i][j] === 4) continue;

								// Count neighbors
								let neighbors = [0, 0, 0, 0, 0];
								for (let di = -1; di <= 1; di++) {
									for (let dj = -1; dj <= 1; dj++) {
										if (di === 0 && dj === 0) continue;
										const ni =
											(i + di + currentGridSize) %
											currentGridSize;
										const nj =
											(j + dj + currentGridSize) %
											currentGridSize;
										neighbors[mondriGrid[ni][nj]]++;
									}
								}

								// De Stijl rules (closer to original mondri.js)
								const currentState = mondriGrid[i][j];

								// Rock-Paper-Scissors relationship between colors
								const BEATS: Record<number, number> = {
									1: 3, // Blue beats Red
									2: 1, // Red beats Yellow
									3: 2, // Yellow beats Blue
								};

								// Constants for rules (from original mondri.js with some adjustments)
								const MIN_BEATEN = 3; // Original: 5
								const MAX_BEATEN = 5; // Original: 10
								const MIN_WHITE = 6; // Original: 14
								const MAX_SAME_COLOR = 6; // Original: 12

								// If white cell with enough white neighbors, spawn least common color
								if (
									currentState === 0 &&
									neighbors[0] > MIN_WHITE
								) {
									let minCount = Infinity;
									let minColor = 1;
									for (let c = 1; c <= 3; c++) {
										if (neighbors[c] < minCount) {
											minCount = neighbors[c];
											minColor = c;
										}
									}
									nextMondriGrid[i][j] = minColor;
								}
								// Check if white cell is surrounded by enough of a color
								else if (currentState === 0) {
									for (let c = 1; c <= 3; c++) {
										if (neighbors[c] > MAX_BEATEN) {
											nextMondriGrid[i][j] = c;
											break;
										}
									}
								}
								// For colored cells (1-3), check if beaten by another color
								else if (
									currentState >= 1 &&
									currentState <= 3
								) {
									// Find which color beats this one
									let beatenByCount = 0;
									let beatingColor = null;

									for (let c = 1; c <= 3; c++) {
										if (
											BEATS[c] === currentState &&
											neighbors[c] > beatenByCount
										) {
											beatenByCount = neighbors[c];
											beatingColor = c;
										}
									}

									// If too many beating neighbors, turn white
									if (beatenByCount > MAX_BEATEN) {
										nextMondriGrid[i][j] = 0;
									}
									// If enough beating neighbors, convert to that color
									else if (
										beatingColor !== null &&
										beatenByCount >= MIN_BEATEN
									) {
										nextMondriGrid[i][j] = beatingColor;
									}
									// If too many of same color nearby, turn black (sparingly) or white
									else if (
										neighbors[currentState] >=
										MAX_SAME_COLOR
									) {
										// 30% chance to become black, otherwise white
										nextMondriGrid[i][j] =
											p.random() < 0.3 ? 4 : 0;
									}
								}
								// Black cells can turn to a color that beats surrounding colors
								else if (currentState === 4) {
									for (let c = 1; c <= 3; c++) {
										if (neighbors[c] > 4) {
											const attacker = BEATS[c];
											if (attacker)
												nextMondriGrid[i][j] = attacker;
											break;
										}
									}
								}

								// Random mutations for more dynamic patterns (occasional)
								if (p.random() < 0.005) {
									// Low probability of random color change
									nextMondriGrid[i][j] = Math.floor(
										p.random(MONDRI_STATES)
									);
								}
							}
						}

						// Swap grids
						[mondriGrid, nextMondriGrid] = [
							nextMondriGrid,
							mondriGrid,
						];
					}

					// Setup colors for drawing
					const stateColors = [];

					// Background color (state 0)
					stateColors[0] =
						appColors.background || p.color(250, 250, 250);

					// Primary colors (states 1-3)
					if (
						appColors.foregroundColors &&
						appColors.foregroundColors.length > 0
					) {
						stateColors[1] = appColors.foregroundColors[0];
						stateColors[2] =
							appColors.foregroundColors.length > 1
								? appColors.foregroundColors[1]
								: appColors.foreground;
						stateColors[3] =
							appColors.foregroundColors.length > 2
								? appColors.foregroundColors[2]
								: appColors.foreground;
					} else {
						// Default Mondrian-style colors
						stateColors[1] = p.color(220, 50, 50); // Red
						stateColors[2] = p.color(50, 50, 220); // Blue
						stateColors[3] = p.color(220, 220, 50); // Yellow
					}

					// Line color (state 4)
					stateColors[4] = appColors.foreground || p.color(0);

					// Draw each cell
					for (let i = 0; i < mondriGrid.length; i++) {
						for (let j = 0; j < mondriGrid[i].length; j++) {
							const state = mondriGrid[i][j];
							const x1 = Math.floor(currentColPositions[i]);
							const y1 = Math.floor(currentRowPositions[j]);
							const x2 = Math.ceil(
								currentColPositions[i + 1] ||
									x1 + currentCellSize
							);
							const y2 = Math.ceil(
								currentRowPositions[j + 1] ||
									y1 + currentCellSize
							);

							p.fill(stateColors[state]);
							p.noStroke();
							p.rect(x1, y1, x2 - x1, y2 - y1);
						}
					}

					// Draw grid lines
					p.stroke(stateColors[4]); // Use black/line color

					// Use higher quality lines when exporting
					if (currentIsSaving) {
						p.strokeWeight(currentLineWidth * 1.5);
						p.strokeCap(p.SQUARE); // Sharper lines for export
					} else {
						p.strokeWeight(currentLineWidth);
						p.strokeCap(p.PROJECT); // Match mondri.js PROJECT cap style
					}

					// Draw boundary lines between different states (like in original mondri.js)
					// First draw vertical lines between cells with different states
					for (let i = 0; i < mondriGrid.length - 1; i++) {
						for (let j = 0; j < mondriGrid[i].length; j++) {
							// Only draw line if states are different
							if (mondriGrid[i][j] !== mondriGrid[i + 1][j]) {
								const x = currentColPositions[i + 1];
								const y1 = currentRowPositions[j];
								const y2 =
									currentRowPositions[j + 1] ||
									y1 + currentCellSize;
								p.line(x, y1, x, y2);
							}
						}
					}

					// Then draw horizontal lines between cells with different states
					for (let i = 0; i < mondriGrid.length; i++) {
						for (let j = 0; j < mondriGrid[i].length - 1; j++) {
							// Only draw line if states are different
							if (mondriGrid[i][j] !== mondriGrid[i][j + 1]) {
								const x1 = currentColPositions[i];
								const x2 =
									currentColPositions[i + 1] ||
									x1 + currentCellSize;
								const y = currentRowPositions[j + 1];
								p.line(x1, y, x2, y);
							}
						}
					}
				} else {
					p.background(bgR, bgG, bgB);
					drawBorder(appColors.foreground);
				}

				// Control animation loop - always animate in continuous mode
				// Use appropriate frame rate
				p.frameRate(currentIsSaving ? 60 : 30); // Higher framerate during saving for smooth capture
			};

			// Draw a border around the canvas - now disabled as per user request
			const drawBorder = (color: any) => {
				// Border drawing disabled
				return;
			};

			// Handle window resize
			p.windowResized = () => {
				if (canvasRef.current) {
					// Update styles based on current algorithm type
					updateCanvasStyles();

					// Update algorithm-specific variables that depend on canvas dimensions
					if (algorithm === "abstract") {
						// Get normalized parameters from current params
						const getNormalizedParams = () => {
							const {
								speed = 50,
								complexity = 50,
								density = 50,
								noiseScale = 50,
							} = params || {};
							return {
								speed: speed / 10,
								complexity: complexity / 10,
								density: density / 10,
								noiseScale: noiseScale / 10,
							};
						};
						const normalizedParams = getNormalizedParams();

						// Recalculate cell size for Mondriomaton
						currentCellSize =
							Math.max(p.width, p.height) / currentGridSize;

						// Regenerate grid positions using splitAxis
						const nLog2 = Math.log2(currentGridSize);
						currentRowPositions = splitAxis(
							0,
							p.height,
							nLog2,
							true,
							normalizedParams.noiseScale,
							normalizedParams.speed
						);
						currentColPositions = splitAxis(
							0,
							p.width,
							nLog2,
							false,
							normalizedParams.noiseScale,
							normalizedParams.speed
						);
						currentRowPositions.push(p.height);
						currentColPositions.push(p.width);
					}

					// Reinitialize particles if needed
					initializeParticles();
				}
			};

			// Expose methods to the sketch instance for external calls
			(p as any).triggerInit = () => {
				if (initFunctionRef.current) {
					initFunctionRef.current();
				}
			};
		},
		[
			algorithm,
			params,
			getCurrentColors,
			hasContent,
			selectedColorId,
			checkIfImageBasedAlgorithm,
		]
	);

	// Create the p5 instance when the p5 module is loaded
	useEffect(() => {
		if (!p5 || !canvasRef.current || sketchInstance.current) return;

		// Create a new p5 instance
		sketchInstance.current = new p5(createSketch, canvasRef.current);

		// Handler to capture the current canvas state
		const handleCaptureCanvas = (event: CustomEvent) => {
			if (sketchInstance.current) {
				const purpose = event.detail?.purpose || "save";
				console.log(`Capturing canvas state for ${purpose}`);

				// Only save to capturedCanvasRef for save operations, not exports
				if (purpose === "save") {
					// Save the canvas as a data URL
					capturedCanvasRef.current =
						sketchInstance.current.canvas.toDataURL("image/png");
				}
			}
		};

		// Add event listener for saving the canvas
		const handleSaveCanvas = (event: CustomEvent) => {
			if (sketchInstance.current) {
				const filename =
					event.detail?.filename || `wallgen-${Date.now()}`;
				console.log("Saving canvas as:", filename);

				if (capturedCanvasRef.current) {
					// Create a temporary link to download the captured canvas
					const link = document.createElement("a");
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
				highQuality = true,
			} = event.detail;

			if (sketchInstance.current && sketchInstance.current.canvas) {
				console.log(
					`Exporting canvas: ${width}x${height} as ${format}`
				);

				// Get the canvas size
				const canvasWidth = sketchInstance.current.width;
				const canvasHeight = sketchInstance.current.height;

				let exportDataURL;

				if (
					isImageBasedAlgorithm.current &&
					imageCanvasDimensions.current
				) {
					// For image-based algorithms, use the entire canvas (no cropping)
					exportDataURL = sketchInstance.current.canvas.toDataURL(
						`image/${format === "svg" ? "png" : format}`,
						format === "jpg"
							? highQuality
								? 0.95
								: 0.9
							: undefined
					);
				} else {
					// For standard algorithms, use the existing export logic with cropping
					// Calculate the visible portion of the canvas based on the scale
					const canvasScale = VIEWPORT_WIDTH / MASTER_CANVAS_SIZE;

					// Calculate the visible portion in the high-res canvas coordinates
					const visibleWidth = Math.min(
						VIEWPORT_WIDTH / canvasScale,
						MASTER_CANVAS_SIZE
					);
					const visibleHeight = Math.min(
						VIEWPORT_HEIGHT / canvasScale,
						MASTER_CANVAS_SIZE
					);

					// Central position for cropping is the center of the canvas
					const centerX = MASTER_CANVAS_SIZE / 2;
					const centerY = MASTER_CANVAS_SIZE / 2;

					// For the abstract (Mondriomaton) algorithm, adjust the crop dimensions to ensure high resolution
					let cropWidth, cropHeight;
					if (algorithm === "abstract") {
						// Use the full master canvas for abstract algorithm to ensure highest possible resolution
						cropWidth = MASTER_CANVAS_SIZE;
						cropHeight = MASTER_CANVAS_SIZE;
					} else {
						// Default behavior for other algorithms
						cropWidth = Math.min(width, visibleWidth);
						cropHeight = Math.min(height, visibleHeight);
					}

					// Calculate the crop position (centered)
					const cropX = Math.max(0, centerX - cropWidth / 2);
					const cropY = Math.max(0, centerY - cropHeight / 2);

					// Make sure we're not trying to crop outside the canvas
					const actualWidth = Math.min(
						cropWidth,
						MASTER_CANVAS_SIZE - cropX
					);
					const actualHeight = Math.min(
						cropHeight,
						MASTER_CANVAS_SIZE - cropY
					);

					console.log(
						`Cropping from high-res canvas at (${cropX}, ${cropY}) with size ${actualWidth}x${actualHeight}`
					);

					// For the abstract algorithm, regenerate the grid at higher resolution before export
					if (algorithm === "abstract" && width > 1000) {
						console.log(
							"Preparing high-resolution export for abstract algorithm"
						);
						// The abstract algorithm needs to be handled differently by accessing its state through the p5 instance

						// We'll use the existing croppedImage approach since we can't directly modify the sketch variables from this scope
						const croppedImage = sketchInstance.current.get(
							cropX,
							cropY,
							actualWidth,
							actualHeight
						);

						// Create a temporary canvas for the final export image
						const tempCanvas = document.createElement("canvas");
						tempCanvas.width = width;
						tempCanvas.height = height;
						const ctx = tempCanvas.getContext("2d");

						if (ctx && croppedImage) {
							// Set background color in case the crop is smaller than target dimensions
							const bgColor = getCurrentColors().background;
							ctx.fillStyle = bgColor;
							ctx.fillRect(0, 0, width, height);

							// Center the cropped image
							const offsetX = (width - actualWidth) / 2;
							const offsetY = (height - actualHeight) / 2;

							// For abstract algorithm, scale up with extra clarity
							if (algorithm === "abstract") {
								// Draw with enhanced scaling for abstract algorithm
								croppedImage.loadPixels();

								// First draw at original size with high quality
								ctx.drawImage(
									croppedImage.canvas,
									0,
									0,
									croppedImage.width,
									croppedImage.height,
									offsetX,
									offsetY,
									actualWidth,
									actualHeight
								);

								// Apply higher quality settings
								ctx.imageSmoothingEnabled = true;
								ctx.imageSmoothingQuality = "high";

								// Use a higher JPEG quality for abstract exports
								const qualityValue =
									format === "jpg" ? 0.98 : undefined;
								const finalImageFormat =
									format === "svg" ? "png" : format;
								exportDataURL = tempCanvas.toDataURL(
									`image/${finalImageFormat}`,
									qualityValue
								);
							} else {
								// Regular export for other algorithms
								croppedImage.loadPixels();
								ctx.drawImage(
									croppedImage.canvas,
									0,
									0,
									croppedImage.width,
									croppedImage.height,
									offsetX,
									offsetY,
									actualWidth,
									actualHeight
								);

								// Apply image smoothing if high quality is requested
								if (highQuality) {
									ctx.imageSmoothingEnabled = true;
									ctx.imageSmoothingQuality = "high";
								} else {
									ctx.imageSmoothingEnabled = false;
								}

								// Generate data URL from the temp canvas
								const qualityValue =
									format === "jpg"
										? highQuality
											? 0.95
											: 0.9
										: undefined;
								const finalImageFormat =
									format === "svg" ? "png" : format;
								exportDataURL = tempCanvas.toDataURL(
									`image/${finalImageFormat}`,
									qualityValue
								);
							}
						}
					} else {
						// Capture the cropped region directly from the p5 canvas
						const croppedImage = sketchInstance.current.get(
							cropX,
							cropY,
							actualWidth,
							actualHeight
						);

						// Create a temporary canvas for the final export image
						const tempCanvas = document.createElement("canvas");
						tempCanvas.width = width;
						tempCanvas.height = height;
						const ctx = tempCanvas.getContext("2d");

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
								0,
								0,
								croppedImage.width,
								croppedImage.height,
								offsetX,
								offsetY,
								actualWidth,
								actualHeight
							);

							// Apply image smoothing if high quality is requested
							if (highQuality) {
								ctx.imageSmoothingEnabled = true;
								ctx.imageSmoothingQuality = "high";
							} else {
								ctx.imageSmoothingEnabled = false;
							}

							// Generate data URL from the temp canvas
							const qualityValue =
								format === "jpg"
									? highQuality
										? 0.95
										: 0.9
									: undefined;
							const finalImageFormat =
								format === "svg" ? "png" : format;
							exportDataURL = tempCanvas.toDataURL(
								`image/${finalImageFormat}`,
								qualityValue
							);
						}
					}
				}

				if (exportDataURL) {
					// Handle metadata and download
					if (includeSourceCode) {
						// Add metadata if requested
						const metaCanvas = document.createElement("canvas");
						const finalWidth = isImageBasedAlgorithm.current
							? canvasWidth
							: width;
						const finalHeight = isImageBasedAlgorithm.current
							? canvasHeight
							: height;

						metaCanvas.width = finalWidth;
						metaCanvas.height = finalHeight;
						const metaCtx = metaCanvas.getContext("2d");

						if (metaCtx) {
							// Draw the exported image
							const metaImg = new Image();
							metaImg.onload = () => {
								metaCtx.drawImage(
									metaImg,
									0,
									0,
									finalWidth,
									finalHeight
								);

								// Add metadata
								const infoHeight = Math.max(
									24,
									Math.floor(finalHeight / 30)
								);
								const infoWidth = Math.max(
									200,
									Math.floor(finalWidth / 7)
								);
								const fontSize = Math.max(
									10,
									Math.floor(infoHeight * 0.5)
								);

								metaCtx.fillStyle = "rgba(0,0,0,0.6)";
								metaCtx.fillRect(
									5,
									finalHeight - infoHeight - 5,
									infoWidth,
									infoHeight
								);

								metaCtx.fillStyle = "white";
								metaCtx.font = `${fontSize}px monospace`;
								metaCtx.fillText(
									`Algorithm: ${algorithm} | WallGen`,
									10,
									finalHeight - infoHeight / 2
								);

								// Generate final data URL with metadata
								const finalDataURL = metaCanvas.toDataURL(
									`image/${
										format === "svg" ? "png" : format
									}`,
									format === "jpg"
										? highQuality
											? 0.95
											: 0.9
										: undefined
								);
								downloadImage(
									finalDataURL,
									`${filename}.${
										format === "svg" ? "png" : format
									}`
								);
							};
							metaImg.src = exportDataURL;
						} else {
							downloadImage(
								exportDataURL,
								`${filename}.${
									format === "svg" ? "png" : format
								}`
							);
						}
					} else {
						downloadImage(
							exportDataURL,
							`${filename}.${format === "svg" ? "png" : format}`
						);
					}
				}
			}
		};

		// Helper function to download an image
		const downloadImage = (dataURL: string, filename: string) => {
			const link = document.createElement("a");
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
		window.addEventListener(
			"wallgen-capture-canvas",
			handleCaptureCanvas as EventListener
		);
		window.addEventListener(
			"wallgen-save-canvas",
			handleSaveCanvas as EventListener
		);
		window.addEventListener(
			"wallgen-export-canvas",
			handleExportCanvas as EventListener
		);
		window.addEventListener(
			"wallgen-reset-canvas",
			handleResetCanvas as EventListener
		);

		return () => {
			// Cleanup
			window.removeEventListener(
				"wallgen-capture-canvas",
				handleCaptureCanvas as EventListener
			);
			window.removeEventListener(
				"wallgen-save-canvas",
				handleSaveCanvas as EventListener
			);
			window.removeEventListener(
				"wallgen-export-canvas",
				handleExportCanvas as EventListener
			);
			window.removeEventListener(
				"wallgen-reset-canvas",
				handleResetCanvas as EventListener
			);

			if (sketchInstance.current) {
				sketchInstance.current.remove();
				sketchInstance.current = null;
			}
		};
	}, [p5, createSketch, getCurrentColors, checkIfImageBasedAlgorithm]);

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
				margin: "0 auto", // Center the canvas
				position: "relative",
				overflow: "hidden",
				boxShadow: "0 0 20px rgba(0,0,0,0.2)",
				borderRadius: "4px",
			}}
		>
			{!p5 && (
				<div className="flex items-center justify-center h-full">
					Loading P5.js...
				</div>
			)}
		</div>
	);
};

export default P5CanvasImpl;
