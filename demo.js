var KinectData = {
  initialize: undefined,
  backgroundRemoval: undefined,
  userViewer: undefined,
  skeletonData: undefined,
  handLocation: undefined
};

$(document).ready(function () {
  var streamImageWidth = 640;
  var streamImageHeight = 480;
  var streamImageResolution = streamImageWidth.toString() + "x" + streamImageHeight.toString();

  var isSensorConnected = false;
  var engagedUser = null;
  var cursor = null;
  var sensor = null;

  // Log errors encountered during sensor configuration
  function configError(statusText, errorData) {
    console.log((errorData != null) ? JSON.stringify(errorData) : statusText);
  }

  // Determine if the specified object has any properties or not
  function isEmptyObject(obj) {
    if (obj == null) {
      return true;
    }

    var numProperties = 0;

    for (var prop in obj) {
      if (obj.hasOwnProperty(prop)) {
        ++numProperties;
      }
    }

    return numProperties <= 0;
  }

  // Show or hide the cursor
  function setCursorVisibility(isVisible) {
    if (cursor == null) {
      return;
    }

    if (isVisible) {
      cursor.show();
    } else {
      cursor.hide();
    }
  }


  // Update sensor state and perform UI transitions (showing/hiding appropriate UI elements)
  // related to sensor status or engagement state changes
  var delayedConfigTimeoutId = null;
  function updateUserState(newIsSensorConnected, newEngagedUser, sensorToConfig) {
    var hasEngagedUser = engagedUser != null;
    var newHasEngagedUser = newEngagedUser != null;

    // If there's a pending configuration change when state changes again, cancel previous timeout
    if (delayedConfigTimeoutId != null) {
      clearTimeout(delayedConfigTimeoutId);
      delayedConfigTimeoutId = null;
    }

    if ((isSensorConnected != newIsSensorConnected) || (engagedUser != newEngagedUser)) {
      if (newIsSensorConnected) {

        var immediateConfig = {};
        var delayedConfig = {};
        immediateConfig[Kinect.INTERACTION_STREAM_NAME] = { "enabled": true };
        immediateConfig[Kinect.SKELETON_STREAM_NAME] = { "enabled": true };
        immediateConfig[Kinect.USERVIEWER_STREAM_NAME] = { "resolution": streamImageResolution };
        immediateConfig[Kinect.BACKGROUNDREMOVAL_STREAM_NAME] = { "resolution": streamImageResolution };

        setCursorVisibility(newHasEngagedUser);

        if (newHasEngagedUser) {
          immediateConfig[Kinect.BACKGROUNDREMOVAL_STREAM_NAME].enabled = true;
          immediateConfig[Kinect.BACKGROUNDREMOVAL_STREAM_NAME].trackingId = newEngagedUser;

          delayedConfig[Kinect.USERVIEWER_STREAM_NAME] = { "enabled": false };
        } else {
          immediateConfig[Kinect.USERVIEWER_STREAM_NAME].enabled = true;

          if (hasEngagedUser) {
            delayedConfig[Kinect.BACKGROUNDREMOVAL_STREAM_NAME] = { "enabled": false };
          }
        }

        // Perform immediate configuration
        sensorToConfig.postConfig(immediateConfig, configError);

        // schedule delayed configuration for 2 seconds later
        if (!isEmptyObject(delayedConfig)) {
          delayedConfigTimeoutId = setTimeout(function () {
            sensorToConfig.postConfig(delayedConfig, configError);
            delayedConfigTimeoutId = null;
          }, 2000);
        }
      } else {
        setCursorVisibility(false);
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
    cursor = uiAdapter.createDefaultCursor();

    uiAdapter.bindStreamToCanvas(Kinect.USERVIEWER_STREAM_NAME, KinectData.userViewer);
    uiAdapter.bindStreamToCanvas(Kinect.BACKGROUNDREMOVAL_STREAM_NAME, KinectData.backgroundRemoval);

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
  KinectData.backgroundRemoval = new p.PImage(streamImageWidth, streamImageHeight, p.PConstants.RGBA);
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
