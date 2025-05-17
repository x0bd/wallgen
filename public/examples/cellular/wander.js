OPC.toggle("paused", false);
OPC.toggle("cell_border", false);
OPC.slider("speed", 10, 1, 10, 1);
OPC.select("grid_size", {
	medium: 1 / 60,
	small: 1 / 40,
	large: 1 / 120,
	huge: 1 / 180,
});
let myPalettes = [
	["#E97F62", "#AAFC8F", "#8399E9"], // Original
	["#ea0f3b", "#0191a1", "#94E0ab"], // Original
	["#c3dfe0", "#bcd979", "#9dad6f"], // Original
	["#4464ad", "#a4b0f5", "#f58f29"], // Original
	["#F2C94C", "#6A8CAF", "#D5544F"], // Warm yellow with strong contrasts
	["#FFB385", "#8093F1", "#556B2F"], // Soft peach, vivid blue, earthy green
	["#D9CAB3", "#867666", "#92A8D1"], // Neutral tones with a soft blue accent
	["#DE6B35", "#FFE156", "#516F68"], // Earthy orange, bright yellow, muted teal
	["#A29F8E", "#C774E8", "#5B8B82"], // Subtle gray, lilac pop, calming green
	["#6D9DC5", "#FFE5D9", "#BC4B51"], // Serene blue, creamy peach, bold red
	["#C2B092", "#D97D54", "#734B5E"], // Neutral beige, burnt orange, plum
	["#E3D081", "#9D6A89", "#3C91E6"], // Warm gold, deep mauve, fresh blue
	["#F6D8A9", "#B66D0D", "#5E5A5C"], // Pastel gold, strong ochre, deep gray
	["#88B04B", "#6B4226", "#EAD2AC"], // Earthy green, chocolate brown, sandy beige
	["#E63946", "#F1FAEE", "#457B9D"], // Vivid red, soft cream, oceanic blue
	["#F4A261", "#264653", "#2A9D8F"], // Warm orange, deep teal, cool aqua
	["#CB997E", "#A5A58D", "#6B705C"], // Soft earthy tones for a vintage feel
	["#FFCAD4", "#B4F8C8", "#93C6E0"], // Gentle pink, mint, and baby blue
	["#D8B4E2", "#627264", "#FFD275"], // Lavender, mossy green, warm yellow
	// New Additions
	["#FAD4D8", "#85A6BB", "#475C7A"], // Soft pink, cool blue, deep navy
	["#9EBD6E", "#F7B05B", "#2E4057"], // Fresh green, warm orange, dark gray-blue
	["#F2E8C9", "#6C91BF", "#D2695E"], // Pale cream, dusty blue, warm red-brown
	["#E4A0F7", "#96E6A1", "#3D348B"], // Lavender, mint, deep indigo
	["#A45A52", "#EFE9AE", "#96B7C5"], // Earthy red, soft yellow, subtle blue
	["#F5D5CB", "#B7AFA3", "#6D7993"], // Peach, neutral taupe, smoky blue
	["#FDDC69", "#D2A5A5", "#849B6A"], // Bright gold, dusty rose, muted green
	["#A1CDA8", "#E6B89C", "#4F6D7A"], // Mint green, pale peach, slate blue
	["#E1D89F", "#94674F", "#648C90"], // Golden beige, warm brown, ocean teal
	["#C5DDE8", "#F49D6E", "#635D5D"], // Sky blue, soft orange, charcoal gray
	["#FFE0B5", "#A3BE8C", "#2F4B4B"], // Creamy yellow, moss green, forest green
	["#F6BD60", "#6A6A61", "#50808E"], // Soft gold, stone gray, sea blue
	["#F7F4EA", "#9A6195", "#D75A4A"], // Off-white, deep mauve, coral red
	["#8FBCBB", "#ECEFF4", "#BF616A"], // Arctic blue, light cream, crimson
	["#FFD4A3", "#7EA8BE", "#426A5A"], // Pale orange, cool blue, muted green
	["#D1D3E0", "#A9D6E5", "#BB4252"], // Soft gray, aqua, vibrant red
	["#FCC7B1", "#9CAFB7", "#4F7CAC"], // Warm blush, subtle gray, bold blue
	["#F4E9CD", "#A4828D", "#5C677D"], // Soft beige, mauve, steel blue
	["#EFE2BA", "#899878", "#6F4C5B"], // Warm cream, olive green, dusky rose
	["#FECEAB", "#9E768F", "#64594B"], // Pastel peach, muted purple, earthy brown
];

OPC.palette("palette", myPalettes);
OPC.button("new_seed", "new seed");

function parameterChanged(variableName, newValue) {
	if (variableName == "speed") frameRate((speed - 1) * 6 + 1);
	if (variableName == "grid_size") {
		createLattices();
		initLattice();
	}
}

function buttonPressed(variableName) {
	if (variableName == "new_seed") {
		initLattice();
	}
}

class HexLattice {
	constructor(width, height, cellSize) {
		Object.assign(this, { width, height, cellSize });
		this.u = createVector((cellSize * Math.sqrt(3)) / 2, cellSize / 2);
		this.v = createVector(0, cellSize);
		this.o = this.v.copy();
		this.o.x += this.u.x;
		const rowSize = ceil(this.width / (this.u.x * 2));
		this.key = ([i, j]) => i + rowSize * j;
		this.dict = new Map();
	}
	getValue([i, j]) {
		let k = this.key([i, j]);
		return this.dict.get(k);
	}
	setValue([i, j], val) {
		let k = this.key([i, j]);
		this.dict.set(k, val);
	}
	*cells() {
		let nx1 = floor(this.width / (this.u.x * 2));
		let nx2 = floor((this.width - this.u.x) / (this.u.x * 2));
		let ny = floor(height / (this.v.y * 3));
		for (let j = 0; j < ny; j++) {
			for (let k = 0; k < nx1; k++) {
				yield [2 * k, 3 * j - k];
			}
			if ((3 * j + 3) * this.cellSize < height)
				for (let k = 0; k < nx2; k++) {
					yield [2 * k + 1, 3 * j + 1 - k];
				}
		}
		if (height % (this.v.y * 3) >= this.v.y * 2) {
			for (let k = 0; k < nx1; k++) {
				yield [2 * k, 3 * ny - k];
			}
		}
	}
	cellCoords([i, j]) {
		return this.o
			.copy()
			.add(this.u.copy().mult(i))
			.add(this.v.copy().mult(j));
	}
	*vertices([i, j]) {
		yield* [
			[i + 1, j],
			[i, j + 1],
			[i - 1, j + 1],
			[i - 1, j],
			[i, j - 1],
			[i + 1, j - 1],
		];
	}
	*neighbors([i, j]) {
		yield* [
			[i + 2, j - 1],
			[i + 1, j + 1],
			[i - 1, j + 2],
			[i - 2, j + 1],
			[i - 1, j - 1],
			[i + 1, j - 2],
		];
	}
}

let lat, nextLat;
const losesTo = { R: "P", P: "S", S: "R" };
let cellSize;

function setup() {
	createCanvas(windowWidth, windowHeight);
	background(100);
	createLattices();
	initLattice();
}

function draw() {
	background(100);
	drawLattice();
	if (!paused) evolveLattice();
}

function mouseClicked() {
	evolveLattice();
}

function createLattices() {
	let cellRatio = grid_size;
	cellSize = min(width, height) * cellRatio;
	lat = new HexLattice(width, height, cellSize);
	nextLat = new HexLattice(width, height, cellSize);
}

function initLattice() {
	let candidates = shuffle(
		random([
			[0, 1, 2],
			[0, 0, 1, 2],
			[0, 0, 0, 1, 1, 2],
			[0, 0, 0, 0, 1, 1, 1, 2],
			[0, 0, 1, 1, 2],
		])
	).map((i) => "RPS"[i]);
	for (let cell of lat.cells()) lat.setValue(cell, random(candidates));
}

function evolveLattice() {
	for (let cell of lat.cells()) {
		let count = { R: 0, P: 0, S: 0 };
		let cellVal = lat.getValue(cell);
		count[cellVal] = 1;
		for (let neigh of lat.neighbors(cell)) {
			let neighVal = lat.getValue(neigh);
			if (neighVal) count[neighVal]++;
		}
		let antagonist = losesTo[cellVal];
		if (count[antagonist] >= 2) nextLat.setValue(cell, antagonist);
		else nextLat.setValue(cell, cellVal);
	}
	[lat, nextLat] = [nextLat, lat];
}

function drawLattice() {
	let colors = { R: palette[0], P: palette[1], S: palette[2] };
	for (let cell of lat.cells()) {
		beginShape();
		let c = colors[lat.getValue(cell)];
		fill(c);
		stroke(cell_border ? 0 : c);
		for (let vtx of lat.vertices(cell)) {
			let { x, y } = lat.cellCoords(vtx);
			vertex(x, y);
		}
		endShape(CLOSE);
	}
}
