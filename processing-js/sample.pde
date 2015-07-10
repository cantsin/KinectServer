// this is the demo from http://processingjs.org/learning/
// modified for kinect usage.

// Global variables
float radius = 10.0;
int X, Y;
int nX, nY;
int delay = 1;//was 16
int maxX, maxY = 0;
int minX, minY = 0;

// Setup the Processing Canvas
void setup(){
  KinectData.initialize()
  size( 192, 320 );
  strokeWeight( 2 );
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
  image(KinectData.silhouette);
  image(KinectData.userViewer);

  // Set fill-color to blue
  fill( 0, 121, 184 );

  // Set stroke-color white
  stroke(255);

  // Draw circle
  ellipse( X, Y, radius, radius );

  // follow the hand of user
  if(KinectData.hand && KinectData.hand.isActive) {
      nX = KinectData.hand.x;
      nY = KinectData.hand.y;
  }
}
