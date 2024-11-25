import paper from "paper";

const { Path, Color, Line, Point } = paper;

const canvas = document.querySelector(".paper-canvas");
const genBtn = document.querySelector(".gen-btn");
paper.setup(canvas);

const colors = ["#28298A", "#612A87", "#F5D609", "#F17144", "#EF445C"];

let width = canvas.clientWidth;
let height = canvas.clientHeight;
let distance = 30;

const getRandomIndex = (max) => {
	return Math.floor(Math.random() * max);
};

const handleGenBtnClicked = () => {
	main();
};

const handleResize = () => {
	main();
};

genBtn.addEventListener("click", handleGenBtnClicked);

window.onresize = handleResize;

const main = () => {
	paper.project.clear();
	let width = canvas.clientWidth;
	let height = canvas.clientHeight;
	// Multiple Colored Dots
	for (let x = 0; x < width; x += distance) {
		for (let y = 0; y < height; y += distance) {
			// dots(x, y, distance);
			// grid(x, y, distance);
			lines(x, y, distance);
		}
	}
};

const dots = (x, y, distance) => {
	let point = new Point(x, y);
	let circle = new Path.Circle(point, distance / 4);
	let color = colors[getRandomIndex(colors.length)];
	circle.fillColor = new Color(color);
};

const grid = (x, y, distance) => {
	let lineOne = new Path.Line(new Point(x, y), new Point(x + distance, y));
	let randomIndex = getRandomIndex(colors.length);
	lineOne.strokeColor = new Color(colors[randomIndex]);
	let lineTwo = new Path.Line(new Point(x, y), new Point(x, y + distance));
	lineTwo.strokeColor = new Color(colors[randomIndex]);
};

const lines = (x, y, distance) => {
	let r = Math.random();
	let randomIndex = getRandomIndex(colors.length);

	if (r < 0.5) {
		let line1 = new Path.Line(
			new Point(x, y),
			new Point(x + distance, y + distance)
		);
		line1.strokeColor = new Color(colors[randomIndex]);
		line1.strokeWidth = 1;
	} else {
		let line2 = new Path.Line(
			new Point(x, y + distance),
			new Point(x + distance, y)
		);
		line2.strokeColor = new Color(colors[randomIndex]);
		line2.strokeWidth = 2;
	}
};
