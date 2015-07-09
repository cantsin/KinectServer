// this is the demo from http://processingjs.org/learning/

// Global variables
float radius = 50.0;
int X, Y;
int nX, nY;
int delay = 16;

// Setup the Processing Canvas
void setup(){
  KinectData.initialize()
  //size( 192, 240 );
  size( 640, 480 );
  strokeWeight( 10 );
  frameRate( 15 );
  X = width / 2;
  Y = height / 2;
  nX = X;
  nY = Y;
  println("Hello ErrorLog!");
}

// Main draw loop
// takes in two parameters: kinect background, kinect person
void draw(){

  radius = radius + sin( frameCount / 4 );

  // Track circle to new destination
  X+=(nX-X)/delay;
  Y+=(nY-Y)/delay;

  // Fill canvas grey
  background( 100 );
  image(KinectData.backgroundRemoval);

  // Set fill-color to blue
  fill( 0, 121, 184 );

  // Set stroke-color white
  stroke(255);

  // Draw circle
  ellipse( X, Y, radius, radius );
}

// Set circle's next destination
void mouseMoved(){
  nX = mouseX;
  nY = mouseY;
}
