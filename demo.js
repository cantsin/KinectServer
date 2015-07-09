
var KinectData = (function() {

  var width = 640;
  var height = 480;
  var resolution = width.toString() + "x" + height.toString();
  var isSensorConnected = false;
  var sensor = null;

  // Update sensor state.
  function updateUserState(newIsSensorConnected, newEngagedUser, sensorToConfig) {
    var hasEngagedUser = KinectData.userid != null;
    var newHasEngagedUser = newEngagedUser != null;

    if ((isSensorConnected != newIsSensorConnected) || (KinectData.userid != newEngagedUser)) {
      if (newIsSensorConnected) {

        var config = {};
        config[Kinect.INTERACTION_STREAM_NAME] = { "enabled": true };
        config[Kinect.SKELETON_STREAM_NAME] = { "enabled": true };
        config[Kinect.USERVIEWER_STREAM_NAME] = { "resolution": resolution, "enabled": true };
        config[Kinect.BACKGROUNDREMOVAL_STREAM_NAME] = { "resolution": resolution, "enabled": true };

        if (newHasEngagedUser) {
          config[Kinect.BACKGROUNDREMOVAL_STREAM_NAME].trackingId = newEngagedUser;
        }

        // Perform immediate configuration
        sensorToConfig.postConfig(config, function (statusText, errorData) {
          console.log((errorData != null) ? JSON.stringify(errorData) : statusText);
        });
      }
    }

    isSensorConnected = newIsSensorConnected;
    KinectData.userid = newEngagedUser;
  }

  // Get the id of the engaged user, if present, or null if there is no engaged user
  function findEngagedUser(userStates) {
    var engagedUserId = null;

    for (var i = 0; i < userStates.length; ++i) {
      var entry = userStates[i];
      if (entry.userState == "engaged") {
        engagedUserId = entry.id;
        break;
      }
    }

    return engagedUserId;
  }

  // Respond to user state change event
  function onUserStatesChanged(newUserStates) {
    var newEngagedUser = findEngagedUser(newUserStates);

    updateUserState(isSensorConnected, newEngagedUser, sensor);
  }

  function initialize() {

    // Create sensor and UI adapter layers
    sensor = Kinect.sensor(Kinect.DEFAULT_SENSOR_NAME, function (sensorToConfig, isConnected) {
      if (isConnected) {
        // Determine what is the engagement state upon connection
        sensorToConfig.getConfig(function (data) {
          var engagedUserId = findEngagedUser(data[Kinect.INTERACTION_STREAM_NAME].userStates);
          updateUserState(true, engagedUserId, sensorToConfig);
        });
        console.log("Initializing Kinect.");
      } else {
        updateUserState(false, KinectData.userid, sensorToConfig);
        console.log("Warning: Could not connect to Kinect sensor.");
      }
    });

    var uiAdapter = KinectUI.createAdapter(sensor);

    uiAdapter.bindStreamToCanvas(Kinect.USERVIEWER_STREAM_NAME, KinectData.silhouette);
    uiAdapter.bindStreamToCanvas(Kinect.BACKGROUNDREMOVAL_STREAM_NAME, KinectData.userViewer);

    sensor.addEventHandler(function (event) {
      switch (event.category) {
      case Kinect.USERSTATE_EVENT_CATEGORY:
        switch (event.eventType) {
        case Kinect.USERSTATESCHANGED_EVENT_TYPE:
          onUserStatesChanged(event.userStates);
          break;
        }
        break;
      }
    });
  }

  // Kinect data, updated 60 times per second. Because this variable
  // will be global, it can be accessed by processing.js scripts.
  return {
    width: width,
    height: height,
    initialize: initialize,
    userid: null,            // the primary user id (as detected by the Kinect)
    userViewer: undefined,   // the primary user itself (minus the background)
    silhouette: undefined,   // the silhouette of the primary user (useful for background or shape detection)
    skeletonData: undefined, // the primary user's skeleton data
    hand: undefined,         // the left or right hand of the user
    fps: 0,
  };
})();

// rudimentary FPS counter.
var checkFps = function() {
  setTimeout(function() {
    KinectData.fps = 0;
    checkFps();
  }, 1000);
}

checkFps();

// when we're ready, load our processing library (.pde)
$(document).ready(function () {
  // create canvas buffers (PImages) for incoming Kinect data. this
  // must be done before KinectData.initialize is called, so we set up
  // the PImages as early as possible.
  var p = new Processing();
  KinectData.silhouette = new p.PImage(KinectData.width, KinectData.height, p.PConstants.RGBA);
  KinectData.userViewer = new p.PImage(KinectData.width, KinectData.height, p.PConstants.RGBA);
  var req = new XMLHttpRequest();
  req.overrideMimeType("text/plain");
  req.open("GET", "sample.pde");
  req.onload = function() {
    var canvas = document.getElementById("processingCanvas");
    var main = new Processing(canvas, this.response);
  };
  req.error = function() {};
  req.send();
});
