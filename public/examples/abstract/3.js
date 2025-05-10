// By Roni Kaufman
// https://ronikaufman.github.io

let M = 9, N = M;
let u = 60;

let randInt = (a, b) => (floor(random(a, b)));

function setup() {
  createCanvas(M*u, N*u);
	pixelDensity(2);
	noStroke();
	noLoop();
}

function draw() {
	let margin = 0;
	let iMin = margin, iMax = M-margin, jMin = margin, jMax = N-margin;
	let siMax = ~~(M/3-margin);
	let sjMax = ~~(N/3-margin);
	let rectangles = createComposition(iMin, iMax, jMin, jMax, siMax, sjMax, 1000);
	createConnections(rectangles);
	DSatur(rectangles, "type", ["00", "01", "10", "11", "20", "21", "30", "31"], true);
	
	background("#2b67af");
	let gap = u/8;
	
	translate(width/2, height/2);
	scale(1-gap/width);
	translate(-width/2, -height/2);
	
  for (let recta of rectangles) {
		drawRectangle(recta, u, gap, "#fffcf2", "#ef562f");
	}
}

// creating the composition

function createComposition(iMin, iMax, jMin, jMax, siMax, sjMax, nRects) {
	let rectangles = [];
	
	for (let i = 0; i < nRects; i++) {
    let newRecta = generateRectangle(rectangles, iMin, iMax, jMin, jMax, siMax, sjMax);
    if (((newRecta.si > 1 || newRecta.sj > 1) && random() < 1/2) || (newRecta.si > 1 && newRecta.sj > 1)) { // no 1x1 squares and avoid thin rectangles
      rectangles.push(newRecta);
    }
  }
  
  // fill the gaps with 1x1 rectangles
	for (let i = iMin; i < iMax; i++) {
		for (let j = jMin; j < jMax; j++) {
			let newRecta = {
				i: i,
				j: j,
				si: 1,
				sj: 1
			}
			let canAdd = true;
			for (let recta of rectangles) {
				if (rectanglesIntersect(newRecta, recta)) {
					canAdd = false;
					break;
				}
			}
			if (canAdd) {
				rectangles.push(newRecta);
			}
		}
	}
	
	return rectangles;
}

function rectanglesIntersect(recta1, recta2) {
	return ((recta1.i <= recta2.i && recta1.i+recta1.si > recta2.i) || (recta2.i <= recta1.i && recta2.i+recta2.si > recta1.i)) && ((recta1.j <= recta2.j && recta1.j+recta1.sj > recta2.j) || (recta2.j <= recta1.j && recta2.j+recta2.sj > recta1.j));
}

function generateRectangle(rectangles, iMin, iMax, jMin, jMax, siMax, sjMax) {
  let i = randInt(iMin, iMax);
  let j = randInt(jMin, jMax);
	
	// determine biggest possible size
	let si, sj;
	if (rectangles.length == 0) {
		si = min(siMax, iMax-i);
		sj = min(sjMax, jMax-j);
	} else {
		let si1 = biggestPossibleWidth(rectangles, iMax, siMax, i, j, 1, 1);
		let sj1 = biggestPossibleHeight(rectangles, jMax, sjMax, i, j, si1, 1);
		
		let sj2 = biggestPossibleHeight(rectangles, jMax, sjMax, i, j, 1, 1);
		let si2 = biggestPossibleWidth(rectangles, iMax, siMax, i, j, 1, sj2);
		
		if (si1*sj1 > si2*sj2) {
			si = si1;
			sj = sj1;
		} else {
			si = si2;
			sj = sj2;
		}
	}
	
	/*
	if (random() < 1/2) { // avoid squares
		if (si == sj && si > 1) {
			if (random() < 1/2) {
				si--;
			} else {
				sj--;
			}
		}
	}
	*/
	
  let recta = {
    i: i,
    j: j,
    si: si,
		sj: sj
  };
  return recta;
}

function biggestPossibleWidth(rectangles, iMax, siMax, i, j, si, sj) {
	let s = si;
	let intersects = false;
	while (!intersects) {
		s++;
		for (let recta of rectangles) {
			if (i+s > iMax || s > siMax || rectanglesIntersect({i: i, j: j, si: s, sj: sj}, recta)) {
				intersects = true;
				break;
			}
		}
	}
	return s-1;
}

function biggestPossibleHeight(rectangles, jMax, sjMax, i, j, si, sj) {
	let s = sj;
	intersects = false;
	while (!intersects) {
		s++;
		for (let recta of rectangles) {
			if (j+s > jMax || s > sjMax || rectanglesIntersect({i: i, j: j, si: si, sj: s}, recta)) {
				intersects = true;
				break;
			}
		}
	}
	return s-1;
}

// creating the graph

function createConnections(rectangles) {
	let l = rectangles.length;
	for (let i = 0; i < l; i++) {
		let recta1 = rectangles[i];
		if (!recta1.neighbors) recta1.neighbors = [];
		for (let j = 0; j < l; j++) {
			let recta2 = rectangles[j];
			if (!recta2.neighbors) recta2.neighbors = [];
			if (i != j && rectanglesTouch(recta1, recta2)) {
				recta1.neighbors.push(recta2);
				//recta2.neighbors.push(recta1);
			}
		}
	}
}

function rectanglesTouch(recta1, recta2) {
	if (((recta1.i <= recta2.i && recta1.i+recta1.si == recta2.i) || (recta2.i <= recta1.i && recta2.i+recta2.si == recta1.i)) && ((recta1.j <= recta2.j && recta1.j+recta1.sj > recta2.j) || (recta2.j <= recta1.j && recta2.j+recta2.sj > recta1.j)))
		return true;
	if (((recta1.i <= recta2.i && recta1.i+recta1.si > recta2.i) || (recta2.i <= recta1.i && recta2.i+recta2.si > recta1.i)) && ((recta1.j <= recta2.j && recta1.j+recta1.sj == recta2.j) || (recta2.j <= recta1.j && recta2.j+recta2.sj == recta1.j)))
		return true;
	return false;
}

// coloring the graph

function DSatur(rectangles, el, elements, shuffleIt) {
	// from https://en.wikipedia.org/wiki/DSatur
	
	for (let i = 0; i < rectangles.length; i++) {
		// step 1
		let v, vSat = -1, vElementsUsed;
		for (let recta of rectangles) {
			if (!recta[el]) {
				let elementsUsed = elementsUsedByNeighbors(recta, el);
				let sat = elementsUsed.length;
				if (sat > vSat) {
					v = recta;
					vSat = sat;
					vElementsUsed = elementsUsed;
				} else if (sat == vSat) {
					if (largestDegreeInTheSubgraphInducedByTheUncoloredVertices(recta, el) > largestDegreeInTheSubgraphInducedByTheUncoloredVertices(v, el)) {
						v = recta;
						vSat = sat;
						vElementsUsed = elementsUsed;
					}
				}
			}
		}

		// step2
		shuffle(elements, shuffleIt);
		for (let element of elements) {
			if (vElementsUsed.indexOf(element) == -1) {
				v[el] = element;
				break;
			}
		}
	}
}

function elementsUsedByNeighbors(v, el) {
	let elementsUsed = [];
	for (let neigh of v.neighbors) {
		if (neigh[el]) elementsUsed.push(neigh[el]);
	}
	return [...new Set(elementsUsed)];
}

function largestDegreeInTheSubgraphInducedByTheUncoloredVertices(v, el) {
	let largestDegree = -1;
	for (let neigh of v.neighbors) {
		if (!neigh[el]) {
			let sat = elementsUsedByNeighbors(neigh, el);
			if (sat > largestDegree) largestDegree = sat;
		}
	}
	return largestDegree;
}

// drawing

function drawRectangle(recta, u, gap, col1, col2) {
	let x0 = recta.i*u + gap/2, y0 = recta.j*u + gap/2;
	let w = recta.si*u - gap, h = recta.sj*u - gap;
	
	noStroke();
	fill(col1);
	rect(x0, y0, w, h, gap);
	
	let m = round(w/gap);
	let n = round(h/gap);
	
	let grid = new Array(m).fill(0).map(() => new Array(n).fill(0));
	let i0, j0, directions;
	let corner = recta.type[0];
	let dir = recta.type[1];
	if (corner == "0") {
		i0 = 1;
		j0 = 1;
		directions = dir == "0" ? ["east", "south", "west", "north"] : ["south", "east", "north", "west"];
	} else if (corner == "1") {
		i0 = m-2;
		j0 = 1;
		directions = dir == "0" ? ["south", "west", "north", "east"] : ["west", "south", "east", "north"];
	} else if (corner == "2") {
		i0 = m-2;
		j0 = n-2;
		directions = dir == "0" ? ["west", "north", "east", "south"] : ["north", "west", "south", "east"];
	} else {
		i0 = 1;
		j0 = n-2;
		directions = dir == "0" ? ["north", "east", "south", "west"] : ["east", "north", "west", "south"];
	}
	
	let path = [[i0, j0]];
	let k = 0;
	while (true) {
		let [i1, j1] = walk(i0, j0, m, n, grid, directions[(k++)%directions.length]);
		if (i0 == i1 && j0 == j1) break;
		[i0, j0] = [i1, j1];
		path.push([i0, j0]);
	}
	
	stroke(col2);
	strokeWeight(gap);
	strokeJoin(ROUND);
	strokeCap(ROUND);
	if (path.length == 1) {
		let x = x0 + (path[0][0]+1/2)*gap;
		let y = y0 + (path[0][1]+1/2)*gap;
		point(x, y);
	} else {
		beginShape();
		for (let p of path) {
			let x = x0 + (p[0]+1/2)*gap;
			let y = y0 + (p[1]+1/2)*gap;
			vertex(x, y);
		}
		endShape();
	}
}

function walk(i0, j0, m, n, grid, direction) {
	switch (direction) {
		case "east":
			while (i0 < m-1) {
				if (grid[i0+1][j0] != 0) break;
				grid[i0][j0] = 1;
				i0++;
			}
			return [i0-1, j0];
		case "south":
			while (j0 < n-1) {
				if (grid[i0][j0+1] != 0) break;
				grid[i0][j0] = 1;
				j0++;
			}
			return [i0, j0-1];
		case "west":
			while (i0 > 0) {
				if (grid[i0-1][j0] != 0) break;
				grid[i0][j0] = 1;
				i0--;
			}
			return [i0+1, j0];
		case "north":
			while (j0 > 0) {
				if (grid[i0][j0-1] != 0) break;
				grid[i0][j0] = 1;
				j0--;
			}
			return [i0, j0+1];
	}
}let palette;
let freq = 500;
let R, s;
let hexagons;

function setup() {
	createCanvas(windowWidth, windowHeight);
	colorMode(HSB, 360, 100, 100, 100);
	angleMode(DEGREES);

	palette = random(colorScheme).colors;
	R = min(width, height) / 8;
	s = sqrt((3 * sq(R)) / 4);
	hexagons = [];

	for (let y = -s; y < height + s; y += 2 * s) {
		for (let x = -s; x < width + R; x += 3 * R) {
			hexagons.push(new Hexagon(x, y, R, shuffle(palette.concat())));
			hexagons.push(new Hexagon(x + 1.5 * R, y + s, R, shuffle(palette.concat())));
		}
	}
}


function draw() {
	background(0);
	randomSeed(231029 + frameCount / freq);

	if (frameCount / freq % 1 == 0) {
		randomSeed(231029 + frameCount / freq*999);
		palette = random(colorScheme).colors;
		R = min(width, height) / int(random(4,12));
		s = sqrt((3 * sq(R)) / 4);
		hexagons = [];

		for (let y = -s; y < height + s; y += 2 * s) {
			for (let x = -s; x < width + R; x += 3 * R) {
				hexagons.push(new Hexagon(x, y, R, shuffle(palette.concat())));
				hexagons.push(new Hexagon(x + 1.5 * R, y + s, R, shuffle(palette.concat())));
			}
		}
	}

	let nearestHexagon;

	let offset = width / 10;

	for (let h of hexagons) {
		h.render();
	}
	// noLoop();
}

class Hexagon {
	constructor(x, y, r, colors) {
		this.x = x;
		this.y = y;
		this.r = r;
		this.t;
		this.ratio = 0.25;
		this.colors = colors;
		this.step = 10;
		int(random(2, 10));
	}

	draw(x, y, r) {
		push();
		translate(x, y);
		scale(easeInOutElastic(sq(this.t)));
		rotate((int(random(6)) * 360) / 6 + this.t * 60);
		noStroke();
		fill(0, 0, 100, 0);
		beginShape();
		for (let angle = 0; angle < 360; angle += 360 / 6) {
			let nx = cos(angle) * r;
			let ny = sin(angle) * r;
			vertex(nx, ny);
		}
		endShape(CLOSE);
		drawingContext.clip();
		noFill();
		strokeWeight(this.t * 3);
		// stroke(random(palette));
		let n = 0;
		for (
			let m = this.ratio + 1 / 10 / 2; m <= 1 - this.ratio; m += (1 - this.ratio * 2) / 10
		) {
			stroke(this.colors[n++ % this.colors.length]);
			circle(cos(0) * r, sin(0) * r, r * 2 * m);
			stroke(this.colors[n++ % this.colors.length]);
			circle(cos(120) * r, sin(120) * r, r * 2 * m);
			stroke(this.colors[n++ % this.colors.length]);
			circle(cos(240) * r, sin(240) * r, r * 2 * m);
		}
		pop();
	}
	render() {
		this.t =
			dist(this.x, this.y, width / 2, height / 2) /
			sqrt(sq(width) + sq(height)) /
			2;
		this.t += (1 / freq) * (frameCount % freq) * 3;
		this.t = this.t % 3;
		this.t = constrain(abs(this.t - 2), 0, 1);
		this.t = sq(this.t);
		this.t = easeInOutCirc(1 - this.t);
		noFill();
		stroke(0);
		this.draw(this.x, this.y, this.r);
	}

	get distanceToMouse() {
		return dist(mouseX, mouseY, this.x, this.y);
	}
}

function easeInOutCirc(x) {
	return x < 0.5 ?
		(1 - Math.sqrt(1 - Math.pow(2 * x, 2))) / 2 :
		(Math.sqrt(1 - Math.pow(-2 * x + 2, 2)) + 1) / 2;
}

function easeInOutElastic(x) {
	const c5 = (2 * Math.PI) / 4.5;

	return x === 0 ?
		0 :
		x === 1 ?
		1 :
		x < 0.5 ?
		-(Math.pow(2, 20 * x - 10) * Math.sin((20 * x - 11.125) * c5)) / 2 :
		(Math.pow(2, -20 * x + 10) * Math.sin((20 * x - 11.125) * c5)) / 2 + 1;
}


let colorScheme = [{
		name: "Benedictus",
		colors: ["#F27EA9", "#366CD9", "#5EADF2", "#636E73", "#F2E6D8"],
	},
	{
		name: "Cross",
		colors: ["#D962AF", "#58A6A6", "#8AA66F", "#F29F05", "#F26D6D"],
	},
	{
		name: "Demuth",
		colors: ["#222940", "#D98E04", "#F2A950", "#BF3E21", "#F2F2F2"],
	},
	{
		name: "Hiroshige",
		colors: ["#1B618C", "#55CCD9", "#F2BC57", "#F2DAAC", "#F24949"],
	},
	{
		name: "Hokusai",
		colors: ["#074A59", "#F2C166", "#F28241", "#F26B5E", "#F2F2F2"],
	},
	{
		name: "Hokusai Blue",
		colors: ["#023059", "#459DBF", "#87BF60", "#D9D16A", "#F2F2F2"],
	},
	{
		name: "Java",
		colors: ["#632973", "#02734A", "#F25C05", "#F29188", "#F2E0DF"],
	},
	{
		name: "Kandinsky",
		colors: ["#8D95A6", "#0A7360", "#F28705", "#D98825", "#F2F2F2"],
	},
	{
		name: "Monet",
		colors: ["#4146A6", "#063573", "#5EC8F2", "#8C4E03", "#D98A29"],
	},
	{
		name: "Nizami",
		colors: ["#034AA6", "#72B6F2", "#73BFB1", "#F2A30F", "#F26F63"],
	},
	{
		name: "Renoir",
		colors: ["#303E8C", "#F2AE2E", "#F28705", "#D91414", "#F2F2F2"],
	},
	{
		name: "VanGogh",
		colors: ["#424D8C", "#84A9BF", "#C1D9CE", "#F2B705", "#F25C05"],
	},
	{
		name: "Mono",
		colors: ["#D9D7D8", "#3B5159", "#5D848C", "#7CA2A6", "#262321"],
	},
	{
		name: "RiverSide",
		colors: ["#906FA6", "#025951", "#252625", "#D99191", "#F2F2F2"],
	},
];