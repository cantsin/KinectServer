var KinectData = {
  initialize: undefined,
  userViewer: undefined,
  silhouette: undefined,
  skeletonData: undefined,
  hand: undefined
};

var streamImageWidth = 640;
var streamImageHeight = 480;
var engagedUser = null;

$(document).ready(function () {

  var streamImageResolution = streamImageWidth.toString() + "x" + streamImageHeight.toString();
  var isSensorConnected = false;
  var sensor = null;

  // Update sensor state.
  function updateUserState(newIsSensorConnected, newEngagedUser, sensorToConfig) {
    var hasEngagedUser = engagedUser != null;
    var newHasEngagedUser = newEngagedUser != null;

    if ((isSensorConnected != newIsSensorConnected) || (engagedUser != newEngagedUser)) {
      if (newIsSensorConnected) {

        var immediateConfig = {};
        immediateConfig[Kinect.INTERACTION_STREAM_NAME] = { "enabled": true };
        immediateConfig[Kinect.SKELETON_STREAM_NAME] = { "enabled": true };
        immediateConfig[Kinect.USERVIEWER_STREAM_NAME] = { "resolution": streamImageResolution, "enabled": true };
        immediateConfig[Kinect.BACKGROUNDREMOVAL_STREAM_NAME] = { "resolution": streamImageResolution, "enabled": true };

        if (newHasEngagedUser) {
          immediateConfig[Kinect.BACKGROUNDREMOVAL_STREAM_NAME].trackingId = newEngagedUser;
        }

        // Perform immediate configuration
        sensorToConfig.postConfig(immediateConfig, function (statusText, errorData) {
          console.log((errorData != null) ? JSON.stringify(errorData) : statusText);
        });
      }
    }

    isSensorConnected = newIsSensorConnected;
    engagedUser = newEngagedUser;
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

  KinectData.initialize = function() {

    console.log("Initializing Kinect.");

    // Create sensor and UI adapter layers
    sensor = Kinect.sensor(Kinect.DEFAULT_SENSOR_NAME, function (sensorToConfig, isConnected) {
      if (isConnected) {
        // Determine what is the engagement state upon connection
        sensorToConfig.getConfig(function (data) {
          var engagedUserId = findEngagedUser(data[Kinect.INTERACTION_STREAM_NAME].userStates);
          updateUserState(true, engagedUserId, sensorToConfig);
        });
      } else {
        console.log("warning: could not connect to kinect sensor.")
        updateUserState(false, engagedUser, sensorToConfig);
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

  // globals
  var p = new Processing();
  KinectData.silhouette = new p.PImage(streamImageWidth, streamImageHeight, p.PConstants.RGBA);
  KinectData.userViewer = new p.PImage(streamImageWidth, streamImageHeight, p.PConstants.RGBA);

  // load our processing library (.pde)
  var req = new XMLHttpRequest();
  req.overrideMimeType("text/html");
  req.open("GET", "sample.pde");
  req.onload = function() {
    var canvas = document.getElementById("processingCanvas");
    var p = new Processing(canvas, this.response);
  };
  req.error = function() {};
  req.send();
});
