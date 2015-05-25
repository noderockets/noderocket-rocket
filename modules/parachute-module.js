var util = require('util');
var RocketModule = require('../rocket-module');

function ParachuteModule(rocket, io) {
  RocketModule.call(this, "parachute", rocket, io);
  var module = this;

  var sAlt;
  var maxAlt;
  var dataCnt = 0;
  var dataBuffer = [];
  var launched = false;
  var timer;

  this.onRocketReady = function() {
    module.log('[%s] Got rocket ready event', module.getName());
  };

  //this.onRocketData = function(data) {
  //  //module.log('[%s] Got rocket data: %j', module.getName(), data);
  //
  //  if(!sAlt) {
  //    sAlt = data.alt;
  //    module.log('[%s] Altitude set: %s', sAlt);
  //  } else {
  //    if((data.alt - sAlt) > 5) {
  //      module.log('Deploy parachute');
  //      rocket.deployParachute();
  //    }
  //  }
  //};

  this.onRocketData = function(data) {
    if (dataCnt < 10) {           // Throw away the first ten readings
      dataCnt++;
    }
    else if (dataCnt < 20) {      // Collect 10 Altitude Readings
      dataBuffer.push(data.alt);
      dataCnt++;
    }
    else if (dataCnt === 20) {    // Average the 10 readings and set base alt
      var total = 0;
      for (var i = 0; i < dataBuffer.length; i++) {
        total += dataBuffer[i];
      }
      sAlt = total / dataBuffer.length;

      module.log('[%s] Altitude set: %s', module.getName(), sAlt);
      module.log('[%s] Waiting for accelerometer Y < 3', module.getName());
      dataCnt++;
    }
    else if (dataCnt > 20 && !launched) {
      maxAlt = Math.max(data.alt, maxAlt);
      if (data.ay < -3) {
        module.log('[%s] LAUNCH', module.getName());
        launched = true;
      }
    }
    else if (launched) {
      maxAlt = Math.max(data.alt, maxAlt);
      if (timer) return;

      timer = setTimeout(function() {
        module.log('[%s] DEPLOY PARACHUTE', module.getName());
        rocket.deployParachute();
      }, 1800);
    }
  };

  this.enable();
}

util.inherits(ParachuteModule, RocketModule);

ParachuteModule.prototype.doEnable = function() {
  if(!this.enabled) {
    this.rocket.on('rocket.ready', this.onRocketReady);
    this.rocket.on('rocket.data', this.onRocketData);
  }
};

ParachuteModule.prototype.doDisable = function() {
  if(this.enabled) {
    this.rocket.removeListener('rocket.ready', this.onRocketReady);
    this.rocket.removeListener('rocket.data', this.onRocketData);
  }
};

module.exports = ParachuteModule;