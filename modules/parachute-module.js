var util = require('util');
var RocketModule = require('../rocket-module');

function ParachuteModule(rocket, io) {
  RocketModule.call(this, "parachute", rocket, io);
  var module = this;

  var status_code = 0;
  var timer;

  var status_text = [
    'ready',
    'launched',
    'parachute deployed'
  ];

  this.ui = {
    status: {
      'parachute status':  'parachute.rocket-status'
    }
  };

  this.onRocketReady = function() {
    module.log('[%s] Got rocket ready event', module.getName());
  };

  this.onRocketData = function(data) {
    // Watch for launch
    if (status_code === 0 && data.ay < -2) {
      status_code = 1;
      module.log('[%s] LAUNCH', module.getName());
    }

    // LAUNCHED -- Deploy parachute after 1.8 seconds
    else if (status_code === 1) {
      if (timer) return;

      timer = setTimeout(function() {
        rocket.deployParachute();
        status_code = 2;
        module.log('[%s] DEPLOY PARACHUTE', module.getName());
        setTimeout(function() {
          timer = false;
          status_code = 0;
          rocket.armParachute();
        }, 30000);
      }, 1800);
    }

    io.sockets.emit('parachute.rocket-status', status_text[status_code]);
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