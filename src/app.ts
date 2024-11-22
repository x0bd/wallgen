import paper from "paper";

const canvas = document.querySelector(".paper-canvas");
paper.setup(canvas);

let width = canvas?.clientWidth;
let height = canvas?.clientHeight;
let distance = 20;

for (let x = 0; x < width; x += distance) {
	for (let y = 0; y < height; y += distance) {
		let point = new paper.Point(x, y);
	}
}
