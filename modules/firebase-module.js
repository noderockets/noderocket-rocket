var Firebase = require("firebase");

module.exports = function(rocket, io) {
  var myFirebaseRef = new Firebase("https://noderockets.firebaseio.com/testmodule");
  var data = { ready: false};
  var writeInterval;

  console.log('initializing firebase module');

  rocket.on('rocket.ready', function() {
    data.ready = true;
  });

  rocket.on('rocket.data', function(sensorData) {
    data.sensorData = sensorData;
  });

  function writeData() {
    writeInterval = setInterval(function() {
      myFirebaseRef.set(data);
    }, 500);
  }

  function enable() {
    console.log('Enabling firebase module');
    writeData();
  }

  function disable() {
    console.log('Disable firebase module');
    clearInterval(writeInterval);
  }

  return {
    /* Unique name of module */
    name: "firebase-module",

    /*  Enable this module */
    enable: enable,

    /* Disable this module */
    disable: disable
  }
};