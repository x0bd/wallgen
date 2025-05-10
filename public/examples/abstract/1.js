// By Roni Kaufman
// https://ronikaufman.github.io

// Made for Genuary 2025
// Day 28: Infinite Scroll.

let margin = 50;
let n, s, u;
let dMin, dMax, dDiff;
let eps = 1e-4;

const N_FRAMES = 750;

function setup() {
  createCanvas(500, 500);
  n = 5; // number of tiles
  s = (width-2*margin)/n; // size of 1 tile
  u = s / 4; // how each tile is divided
  dMin = 3;
  dMax = 6;
  dDiff = dMax-dMin;
  strokeWeight(s/16);
  //strokeCap(SQUARE);
}

function draw() {
  background("#fffbe6");
  
  for (let i = 0; i < n; i++) {
    let x = i*s+margin;
    for (let j = 0; j < n; j++) {
			let t = ((frameCount + 25*j)%N_FRAMES)/N_FRAMES;
      let y = j*s+margin;
      let tij = (t+floor(noise(x, y)*dDiff)/dDiff)%1;
			let tCol = (constrain(fract(t*dDiff*2), 0, 1/2) + floor(t*dDiff*2)/2)/dDiff + 0*i/(10*n);
			stroke(5);
      makeTile(x, y, tij);
			fill(rainbow(tCol));
			noStroke();
			circle(x, y, u);
			if (i == n-1) circle(x+s, y, u);
			if (j == n-1) circle(x, y+s, u);
			if (i == n-1 && j == n-1) circle(x+s, y+s, u);
			noFill();
    }
  }
}

function makeTile(x, y, t) {
  let dt = d(t);
  
  let d1 = dMin + floor(dt); // amount of arcs on top-left and bottom-right corners
  let d2 = 7 - d1; // amount of arcs on top-right and bottom-left corners
  
  let f = easeInOutExpo(fract(dt));
  let f1 = constrain(f, eps, 1-eps), f2 = constrain(1-f, eps, 1-eps);
  
	// top-left and bottom-right corners
  let k = 0;
  for (let i = 2; i < d1; i++) {
    arc(x, y, i * u, i * u, 0, PI / 2);
    arc(x + s, y + s, i * u, i * u, PI, (3 * PI) / 2);
    k++;
  }
  arc(x, y, d1 * u, d1 * u, 0, f1*PI/2);
  arc(x + s, y + s, d1 * u, d1 * u, PI, PI + f1*PI/2);
  //k++;
  
	// top-right and bottom-left corners
  arc(x + s, y, (d2+1) * u, (d2+1) * u, PI/2, PI/2 + f2*PI/2);
  arc(x, y + s, (d2+1) * u, (d2+1) * u, 3*PI/2, 3*PI/2 + f2*PI/2);
  k++;
  for (let i = d2; i > 1; i--) {
    arc(x + s, y, i * u, i * u, PI / 2, PI);
    arc(x, y + s, i * u, i * u, (3 * PI) / 2, 2 * PI);
    k++;
  }
}

function d(x) {
  let dx = constrain(fract(x*dDiff*2), 0, 1/2) + floor(2*x*dDiff)/2;
  if (dx > dDiff/2) dx = dDiff-dx;
  return 2*dx;
}

function rainbow(t) {
  let palette = ["#f9d531", "#abcd5e", "#62b6de", "#f589a3", "#ef562f", "#fc8405"];
  let i = floor(palette.length*t);
  let amt = fract(palette.length*t);
  return lerpColor(color(palette[i%palette.length]), color(palette[(i+1)%palette.length]), amt);
}

// from easings.net
function easeInOutCubic(x) {
	return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function easeInOutQuart(x) {
	return x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2;
}

function easeInOutExpo(x) {
	return x === 0
		? 0
		: x === 1
		? 1
		: x < 0.5 ? Math.pow(2, 20 * x - 10) / 2
		: (2 - Math.pow(2, -20 * x + 10)) / 2;
}