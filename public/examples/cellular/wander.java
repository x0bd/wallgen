/* ----------------------------------------------
 Squares
 
 by Marco Aielli
 
 this sketch draws cellular automata that wander around
 When they get to a cell they leave a coloured trace
 Once they have left a cell, that cell is not accessible 
 anymore by any automaton
 
 interaction:
 mouse click: restarts sketch.
 - num. of automata is mapped to mouse y
 - grid resolution is mapped to mouse x
 
 keys:
 - h: quantizes cell movement ( hides actual wandering)
 - w: toggles automaton display
---------------------------------------------- */

Square[][] squares;
int div = 10;
int wandsNum = 10;
Wand wand;

color bkgColor;
boolean hideSmallMovements = true;
boolean showWand = false;
Wand[] wands;

void mouseClicked() {
  wandsNum = (int)map(mouseY, height, 0, 0, 35);
  div = (int)map(mouseX, 0, width, 0, 50);
  generate();
}

void keyPressed() {
  if (key == 'h') {
    hideSmallMovements = !hideSmallMovements;
  } else if (key == 'w'){
    showWand = !showWand; 
  }
}

void drawGradient(float x, float y, color c) {
  int radius = 20/2;
  float h = c;
  for (int r = radius; r > 0; --r) {
    fill(h, h, h);
    ellipse(x, y, r, r);
    h = (h + 1) % 360;
  }
}

void setup() {
  //blendMode(LIGHTEST);
  strokeWeight(div/20);
  frameRate(200);
  bkgColor = color(0);//randCol();
  ellipseMode(CORNER);
  fill(bkgColor);

  size(400, 400);

  generate();
}

void generate() {

  squares = new Square[div][div];

  //println("div="+div);

  //generate squares
  for (int j = 0; j< div; j++) {
    for (int i = 0; i< div; i++) {
      Square q = new Square(j*width/div+(width/div/2), i*height/div+(height/div/2), width/div, height/div, j, i);
      squares[j][i] = q;
      //println("added square "+q.x+","+q.y+","+q.w+","+q.h);
    }
  }

  wands = new Wand[wandsNum];

  //generate one wand
  for (int i=0; i<wands.length; i++) {
    wand = new Wand(random(width), random(height)/*, 1*/);
    wands[i]= (wand);
  }
}

color getColorFromInt(int i) {
  int B_MASK = 255;
  int G_MASK = 255<<8;
  int R_MASK = 255<<16;
  int r = (i & R_MASK)>>16;
  int g = (i & G_MASK)>>8;
  int b = i & B_MASK;
  //println("r:"+r+" g:"+g+" b:"+b);

  return color(r, g, b);
}

void draw() {
  background(bkgColor);
  //PImage p = get();

  for (int j = 0; j< div; j++) {
    for (int i = 0; i< div; i++) {

      Square q = squares[j][i];

      if (q.engaged) {
        color c = (color)q.col;
        stroke(color(red(q.col)*0.8), green(q.col)*0.8, blue(q.col)*0.8);

        fill(q.col);
      } else {
        stroke(bkgColor);
        fill(bkgColor);
      }
      ellipseMode(RADIUS);
      ellipse(q.x, q.y, q.w/2, q.h/2);
      //rect(q.x, q.y, q.w, q.h);
      //drawGradient(q.x,q.y/*,width/div*/,q.col);
    }
  }

  for (int i=0; i<wands.length; i++) {
    wand = wands[i];
    wand.paint();
    wand.move();
  }
}

/**************************
 SQUARE
 **************************/
class Square {
  int x, y, w, h;
  boolean engaged;
  int engagedBy;
  int xc, yc;
  color col = color(255, 255, 255);

  Square(int x, int y, int w, int h, int xc, int yc) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.xc = xc;
    this.yc = yc;
  }
}

color randCol() {
  return color (
    random(205)+50, 
    random(50)+50, 
    random(50)+50
    );
}

/**************************
 WAND
 **************************/
class Wand {
  float x, y;
  float speed = 20;
  color col;

  Wand(float startX, float startY) {
    x = startX;
    y = startY;
    col = randCol();

    Square sq = getCurrentSquare(x, y);

    sq.engaged = true;
    sq.col = col;
  }

  Wand(float startX, float startY, float speed) {
    x = startX;
    y = startY;
    this.speed = speed;
    col = randCol();

    Square sq = getCurrentSquare(x, y);

    sq.engaged = true;
    sq.col = col;
  }

  void move() {
    PVector v = new PVector(random(-speed, speed), random(-speed, speed));

    Square sq = getCurrentSquare(x, y);
    sq.engaged = true;
    Square newSq = getCurrentSquare(x+v.x, y+v.y);
    if (
      (sq.xc == newSq.xc && sq.yc == newSq.yc ) 
      || 
      ((sq.xc != newSq.xc || sq.yc != newSq.yc ) && !newSq.engaged)
      ) {
      x += v.x;
      y += v.y;
      constrain(x, 0, width);
      constrain(y, 0, height);
      newSq.col = col;
    } else {
      //stay still
    }
  }

  void paint() {
    stroke(255, 0, 0);
    fill(255, 255, 0);
    ellipseMode(RADIUS);
    if (showWand) {
      if (!hideSmallMovements) {
        ellipse(x, y, 4, 4);
      } else {
        Square q = getCurrentSquare(x, y);
        ellipse(q.x, q.y, 4, 4);
      }
    }
    //println("wand - x="+x+" - y="+y);
  }

  Square getCurrentSquare(float x, float y) {
    //println("div ="+div);
    int xCoord = constrain(floor(map(x, 0, width, 0, div)), 0, div-1);
    int yCoord = constrain(floor(map(y, 0, height, 0, div)), 0, div-1);
    //println("current is ["+(xCoord)+"]["+(yCoord)+"]");
    return squares[xCoord][yCoord];
  }
}
