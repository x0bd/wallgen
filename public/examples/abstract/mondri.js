/*
 * Mondriomaton
 * For the #WCCChallenge << De Stijl >> (join the discord! https://discord.gg/S8c7qcjw2b)
 *
 * A deterministic cellular automaton inspired by De Stijl art movement, using a Rock-Paper-Scissors color
 * system (Blue beats Red, Red beats Yellow, Yellow beats Blue) in a wrapping grid with the following rules:
 *
 * 1. Color Competition:
 *    - If a cell is beaten by MIN_BEATEN to MAX_BEATEN neighbors, it changes to the beating color
 *    - If beaten by more than MAX_BEATEN neighbors, it turns white
 *    - If surrounded by too many of the same color (MAX_SAME_COLOR), it turns white
 *    - If exactly MAX_SAME_COLOR neighbors of same color, it turns black
 *
 * 2. White Space Management:
 *    - White cells with MIN_WHITE white neighbors spawn the least common color
 *    - Black cells surrounded by MAX_SURROUND_BLACK cells of any color turn into the color that beats it
 *
 * Didn't play too much with the threshold values, some combinations may result in more interesting patterns.
 */

// Grid dimensions
let GRID_SIZE = 32;
let CELL_SIZE;
const STATES = 5;

// Grid size constraints
const MIN_GRID_POWER = 2;
const MAX_GRID_POWER = 5;

let grid = [];
let nextGrid = [];

const NOISE_SCALE = 0.2;
let rowPositions = [];
let colPositions = [];

// Line width as fraction of cell size
let lineWidth;
const MIN_LINE_RATIO = 1 / 15;
const MAX_LINE_RATIO = 1 / 8;

// Color palettes - multiple De Stijl inspired options
const palettes = [
	["#F0F0F0", "#00509d", "#d7263d", "#ffdb57", "#000000"],
	["#FFFFFF", "#0000FF", "#FF0000", "#FFFF00", "#000000"],
	["#FFFFFF", "#29ab05", "#802a3d", "#ffcb05", "#151515"],
	["#fdfdfd", "#63a1ff", "#ff5e7e", "#fff685", "#2c2c2c"],
	["#ffffff", "#005f73", "#d62828", "#ffcb77", "#000000"],
	["#fafafa", "#4062bb", "#ef476f", "#ffd166", "#1a1a1a"],
	["#f8f8f8", "#118ab2", "#ef476f", "#ffd166", "#222222"],
	["#fcfcfc", "#3a86ff", "#8338ec", "#ffbe0b", "#0f0f0f"],
	["#f9f9f9", "#5a189a", "#f72585", "#fee440", "#1e1e1e"],
	["#ffffff", "#29ab05", "#d7263d", "#ffcb05", "#151515"],
	["#fcfcfc", "#007f5f", "#d00000", "#ffdd00", "#1a1a1a"],
	["#ffffff", "#e00065", "#0066ff", "#ffdc00", "#101010"],
	["#fdfdfd", "#d81b60", "#0057a3", "#ffcc00", "#1b1b1b"],
	["#f5f5f5", "#2a9d8f", "#e9c46a", "#e76f51", "#264653"],
	["#ffecd1", "#15616d", "#ff7d00", "#78290f", "#001524"],
	["#ffffff", "#ff595e", "#8ac926", "#1982c4", "#6a4c93"],
	["#fdfdfd", "#97cc04", "#eeb902", "#f45d01", "#474647"],
	["#ffffff", "#04e762", "#00a1e4", "#dc0073", "#000000"],
];

let currentPalette = 0;
let colors = palettes[currentPalette];
let canvasSize;

function setup() {
	canvasSize = min(windowWidth, windowHeight) * 0.95;

	const targetCellSize = 40;
	const idealGridSize = canvasSize / targetCellSize;
	GRID_SIZE = pow(2, floor(log(idealGridSize) / log(2)));
	GRID_SIZE = constrain(
		GRID_SIZE,
		pow(2, MIN_GRID_POWER),
		pow(2, MAX_GRID_POWER)
	);

	CELL_SIZE = canvasSize / GRID_SIZE;
	if (CELL_SIZE < 30) {
		GRID_SIZE = GRID_SIZE / 2;
		CELL_SIZE = canvasSize / GRID_SIZE;
	}

	setRandomLineWidth();
	createCanvas(canvasSize, canvasSize);
	frameRate(1);
	strokeCap(PROJECT);

	initializeGrid();
	updateCellPositions();
}

function initializeGrid() {
	grid = [];
	nextGrid = [];
	for (let i = 0; i < GRID_SIZE; i++) {
		grid[i] = [];
		nextGrid[i] = [];
		for (let j = 0; j < GRID_SIZE; j++) {
			grid[i][j] = floor(random(STATES));
			nextGrid[i][j] = 0;
		}
	}
}

function setRandomLineWidth() {
	lineWidth = random(MIN_LINE_RATIO, MAX_LINE_RATIO) * CELL_SIZE;
}

function updateCellPositions() {
	let n = Math.log2(GRID_SIZE);
	rowPositions = splitAxis(0, canvasSize, n, true);
	colPositions = splitAxis(0, canvasSize, n, false);
	rowPositions.push(canvasSize);
	colPositions.push(canvasSize);
}

function splitAxis(start, end, depth, isRow) {
	if (depth <= 0) return [start];

	let midBase = (start + end) / 2;
	let _seed = isRow ? start * 0.01 : end * 0.01;
	let noiseOffset =
		map(noise(_seed, frameCount * 0.01), 0, 1, -0.25, 0.25) * (end - start);
	let mid = constrain(midBase + noiseOffset, start + 2, end - 2);

	let left = splitAxis(start, mid, depth - 1, isRow);
	let right = splitAxis(mid, end, depth - 1, isRow);
	return left.concat(right);
}

function draw() {
	background(colors[0]);
	updateGrid();
	drawGrid();
	[grid, nextGrid] = [nextGrid, grid];
}

function updateGrid() {
	for (let i = 0; i < GRID_SIZE; i++) {
		for (let j = 0; j < GRID_SIZE; j++) {
			nextGrid[i][j] = applyRules(i, j);
		}
	}
}

function applyRules(x, y) {
	let stateCounts = [0, 0, 0, 0, 0];
	const NEIGHBORHOOD_SIZE = 24;

	for (let i = -2; i <= 2; i++) {
		for (let j = -2; j <= 2; j++) {
			if (i === 0 && j === 0) continue;
			let nx = (x + i + GRID_SIZE) % GRID_SIZE;
			let ny = (y + j + GRID_SIZE) % GRID_SIZE;
			stateCounts[grid[nx][ny]]++;
		}
	}

	return deStijlRules(grid[x][y], stateCounts, NEIGHBORHOOD_SIZE);
}

function deStijlRules(currentState, stateCounts, validNeighbors) {
	const MIN_BEATEN = 5;
	const MAX_BEATEN = 10;
	const MIN_WHITE = 14;
	const MAX_SAME_COLOR = 12;
	const TURN_TO_BLACK = 18;
	const MAX_SURROUND_BLACK = 10;

	const BEATS = {
		1: 3, // Blue beats Red
		2: 1, // Red beats Yellow
		3: 2, // Yellow beats Blue
	};

	if (stateCounts[0] > MIN_WHITE && currentState === 0) {
		let minCount = Infinity;
		let minColor = 1;
		for (let i = 1; i <= 3; i++) {
			if (stateCounts[i] < minCount) {
				minCount = stateCounts[i];
				minColor = i;
			}
		}
		return minColor;
	}

	if (currentState === 0) {
		for (let i = 1; i <= 3; i++) {
			if (stateCounts[i] > MAX_BEATEN) {
				return i;
			}
		}
		return 0;
	}

	if (currentState >= 1 && currentState <= 3) {
		let beatenByCount = 0;
		let beatingColor = null;

		for (let i = 1; i <= 3; i++) {
			if (BEATS[i] === currentState) {
				let count = stateCounts[i];
				if (count > beatenByCount) {
					beatenByCount = count;
					beatingColor = i;
				}
			}
		}

		if (beatenByCount > MAX_BEATEN) {
			return 0;
		} else if (beatenByCount > MIN_BEATEN && beatingColor !== null) {
			return beatingColor;
		}
	}

	if (stateCounts[currentState] >= MAX_SAME_COLOR) {
		if (stateCounts[currentState] === MAX_SAME_COLOR) {
			return 4;
		}
		return 0;
	}

	if (currentState === 4) {
		for (let i = 1; i <= 3; i++) {
			if (stateCounts[i] > MAX_SURROUND_BLACK) {
				return BEATS[i];
			}
		}
	}

	return currentState;
}

function drawGrid() {
	for (let i = 0; i < GRID_SIZE; i++) {
		for (let j = 0; j < GRID_SIZE; j++) {
			let state = grid[i][j];
			let x1 = floor(colPositions[i]);
			let y1 = floor(rowPositions[j]);
			let x2 = ceil(colPositions[i + 1]);
			let y2 = ceil(rowPositions[j + 1]);

			fill(colors[state]);
			noStroke();
			rect(x1, y1, x2 - x1, y2 - y1);
		}
	}

	stroke(colors[4]);
	strokeWeight(lineWidth);
	strokeCap(PROJECT);

	for (let i = 0; i < GRID_SIZE - 1; i++) {
		for (let j = 0; j < GRID_SIZE; j++) {
			if (grid[i][j] !== grid[i + 1][j]) {
				let x = colPositions[i + 1];
				let y1 = rowPositions[j];
				let y2 = rowPositions[j + 1];
				line(x, y1, x, y2);
			}
		}
	}

	for (let i = 0; i < GRID_SIZE; i++) {
		for (let j = 0; j < GRID_SIZE - 1; j++) {
			if (grid[i][j] !== grid[i][j + 1]) {
				let x1 = colPositions[i];
				let x2 = colPositions[i + 1];
				let y = rowPositions[j + 1];
				line(x1, y, x2, y);
			}
		}
	}
}

function mousePressed() {
	for (let i = 0; i < GRID_SIZE; i++) {
		for (let j = 0; j < GRID_SIZE; j++) {
			let rand = random();
			if (rand < 0.1) {
				grid[i][j] = 4;
			} else {
				grid[i][j] = floor(random(4));
			}
		}
	}
}

function changeGridSize(increase) {
	let currentPower = log(GRID_SIZE) / log(2);
	currentPower = constrain(
		increase ? currentPower - 1 : currentPower + 1,
		MIN_GRID_POWER,
		MAX_GRID_POWER
	);
	let newGridSize = pow(2, currentPower);

	if (newGridSize !== GRID_SIZE) {
		GRID_SIZE = newGridSize;
		CELL_SIZE = canvasSize / GRID_SIZE;
		setRandomLineWidth();
		initializeGrid();
		updateCellPositions();
	}
}

function keyPressed() {
	if (key === "c" || key === "C") {
		currentPalette =
			(currentPalette + (key === "C" ? -1 : 1)) % palettes.length;
		colors = palettes[currentPalette];
	}

	if (key === "r" || key === "R") {
		currentPalette = floor(random(palettes.length));
		colors = palettes[currentPalette];
		const randomPower = floor(random(MIN_GRID_POWER, MAX_GRID_POWER + 1));
		GRID_SIZE = pow(2, randomPower);
		CELL_SIZE = canvasSize / GRID_SIZE;
		setRandomLineWidth();
		initializeGrid();
		updateCellPositions();
	}

	if (key === "+" || key === "=") changeGridSize(true);
	if (key === "-" || key === "_") changeGridSize(false);
}

function windowResized() {
	canvasSize = min(windowWidth, windowHeight) * 0.95;
	const targetCellSize = 50;
	const idealGridSize = canvasSize / targetCellSize;
	GRID_SIZE = pow(2, floor(log(idealGridSize) / log(2)));
	GRID_SIZE = constrain(
		GRID_SIZE,
		pow(2, MIN_GRID_POWER),
		pow(2, MAX_GRID_POWER)
	);

	CELL_SIZE = canvasSize / GRID_SIZE;
	if (CELL_SIZE < 30) {
		GRID_SIZE = GRID_SIZE / 2;
		CELL_SIZE = canvasSize / GRID_SIZE;
	}

	setRandomLineWidth();
	resizeCanvas(canvasSize, canvasSize);
	initializeGrid();
	updateCellPositions();
}
