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

  this.ui = {
    status: {
      launched:  'parachute.rocket-launched',
      parachute: 'parachute.rocket-parachute-deployed'
    }
  };

  this.onRocketReady = function() {
    module.log('[%s] Got rocket ready event', module.getName());
  };

  this.onRocketData = function(data) {
    // Throw away the first ten readings
    if (dataCnt < 10) {
      dataCnt++;
    }

    // Collect 10 Altitude Readings
    else if (dataCnt < 20) {
      dataBuffer.push(data.alt);
      dataCnt++;
    }

    // Average the 10 readings and set base alt
    else if (dataCnt === 20) {
      var total = 0;
      for (var i = 0; i < dataBuffer.length; i++) {
        total += dataBuffer[i];
      }
      sAlt = total / dataBuffer.length;

      module.log('[%s] Altitude set: %s', module.getName(), sAlt);
      module.log('[%s] Waiting for accelerometer Y < 3', module.getName());
      dataCnt++;
    }

    // Watch for launch
    else if (dataCnt > 20 && !launched) {
      maxAlt = Math.max(data.alt, maxAlt);
      if (data.ay < -.03) {
        launched = true;
        io.sockets.emit('parachute.rocket-launched', launched);
        module.log('[%s] LAUNCH', module.getName());
      }
    }

    // LAUNCHED -- Deploy parachute after 1.8 seconds
    else if (launched) {
      maxAlt = Math.max(data.alt, maxAlt);
      if (timer) return;

      timer = setTimeout(function() {
        rocket.deployParachute();
        io.sockets.emit('parachute.rocket-parachute-deployed', true);
        module.log('[%s] DEPLOY PARACHUTE', module.getName());
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