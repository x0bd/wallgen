let t = 0;
let palette;
let bg;

function setup() {
  createCanvas(800, 800);
  palette = shuffle(random(colorScheme).colors);
  bg = palette[0];
  palette.splice(0, 1);
}

function draw() {
  background(bg);
  blendMode(MULTIPLY);
  background(0, 0, 0, (33 / 100) * 255);
  blendMode(BLEND);
  randomSeed(0);
  let cells = 10;
  let offset = width / 10;
  let d = (width - offset * 2) / cells;
  strokeWeight(d / 5);
  drawingContext.shadowColor = color(0, 0, 0);
  drawingContext.shadowBlur = 10; //offset /5;
  let l = d * sqrt(2);
  for (let j = 0; j < cells; j++) {
    for (let i = 0; i < cells; i++) {
      let colors = shuffle(palette.concat());
      let x = offset + i * d + d / 2;
      let y = offset + j * d + d / 2;
      let v = (t + (x + y * width) / (width * height)) % 1;
      v = map(sin(v * TWO_PI), -1, 1, 0, 1);
      v = easeInOutCirc(v);
      push();
      translate(x, y);
      //  random() > 0.5 ? rotate((v * -PI) / 2) : rotate((v * PI) / 2);
      // scale(noise(i,x,frameCount/400) > 0.5 ? -1 : 1, noise(j,y,frameCount/400) > 0.5 ? -1 : 1);
      scale(random() > 0.5 ? -1 : 1, random() > 0.5 ? -1 : 1);
      drawingContext.setLineDash([l, l * 2]);
      drawingContext.lineDashOffset = v * l * 3;
      let g = drawingContext.createLinearGradient(-l / 2, 0, l / 2, 0);
      g.addColorStop(0, lerpColor(color(colors[0]), color(colors[1]), v));
      g.addColorStop(0, lerpColor(color(colors[2]), color(colors[3]), v));
      // g.addColorStop(1/2,lerpColor(color(colors[4]),color(colors[3]),1-v));
      drawingContext.strokeStyle = g;
      // strokeCap(PROJECT);
      line(-d / 2, -d / 2, d / 2, d / 2);

      pop();
    }
  }
  t = (t + 1 / 200) % 1;
}

function easeInOutCirc(x) {
  return x < 0.5
    ? (1 - Math.sqrt(1 - Math.pow(2 * x, 2))) / 2
    : (Math.sqrt(1 - Math.pow(-2 * x + 2, 2)) + 1) / 2;
}

function easeInOutElastic(x) {
  const c5 = (2 * Math.PI) / 4.5;
  return x === 0
    ? 0
    : x === 1
    ? 1
    : x < 0.5
    ? -(Math.pow(2, 20 * x - 10) * Math.sin((20 * x - 11.125) * c5)) / 2
    : (Math.pow(2, -20 * x + 10) * Math.sin((20 * x - 11.125) * c5)) / 2 + 1;
}

let colorScheme = [
  {
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
