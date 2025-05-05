/******************
Code by Vamoss
Original code link:
https://www.openprocessing.org/sketch/738638

Author links:
http://vamoss.com.br
http://twitter.com/vamoss
http://github.com/vamoss
******************/

let pos, colors;
const moveSpeed = 0.4;
const moveScale = 800;

function setup() {
	createCanvas(windowWidth, windowHeight);
	background("#1a0633");
	noStroke();
	
	colors = [color("#581845"), color("#900C3F"), color("#C70039"), color("#FF5733"), color("#FFC30F")];
	pos = [];
	for(let i = 0; i < 500; i++){
		pos.push({
			x:random(width),
			y:random(height),
			c:colors[floor(random(colors.length))]
		});
	}
}

function draw() {
	for(let i = 0; i < pos.length; i++){
		with(pos[i]){
			let angle = noise(x / moveScale, y / moveScale) * TWO_PI * moveScale;//I never understood why end by multiplying by moveScale
			x += cos(angle) * moveSpeed;
			y += sin(angle) * moveSpeed;
			fill(c);
			ellipse(x, y, 2, 2);
			if(x > width || x < 0 || y > height || y < 0 || random(1) < 0.001 ){
				x = random(width);
				y = random(height);
			}
		}
	}
}