var util = require('util');
var RocketModule = require('../rocket-module');
var Firebase = require("firebase");

function FirebaseModule(rocket, io) {
  RocketModule.call(this, "firebase", rocket, io);
  this.firebaseDb = new Firebase("https://noderockets.firebaseio.com/mynoderocket");
  this.data = {};

  this.onRocketReady = function() {
    this.data.ready = true;
  }.bind(this);

  this.onRocketData = function(data) {
    this.data.sensorData = data;
  }.bind(this);

  this.enable();
}

util.inherits(FirebaseModule, RocketModule);

FirebaseModule.prototype.doEnable = function() {
  if(!this.enabled) {
    this.rocket.on('rocket.ready', this.onRocketReady);
    this.rocket.on('rocket.data', this.onRocketData);

    this.writeInterval = setInterval(function() {
      this.firebaseDb.set(this.data)
    }.bind(this), 500);
  }
};

FirebaseModule.prototype.doDisable = function() {
  if(this.enabled) {
    this.rocket.removeListener('rocket.ready', this.onRocketReady);
    this.rocket.removeListener('rocket.data', this.onRocketData);

    clearInterval(this.writeInterval);
  }
};

module.exports = FirebaseModule;