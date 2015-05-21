var util = require('util');
var RocketModule = require('../rocket-module');

function ParachuteModule(rocket, io) {
  RocketModule.call(this, "parachute", rocket, io);
  var module = this;

  var sAlt;

  this.onRocketReady = function() {
    module.log('[%s] Got rocket ready event', module.getName());
  };

  this.onRocketData = function(data) {
    //module.log('[%s] Got rocket data: %j', module.getName(), data);

    if(!sAlt) {
      sAlt = data.alt;
      module.log('Altitude set: %s', sAlt);
    } else {
      if((data.alt - sAlt) > 5) {
        module.log('Deploy parachute');
        rocket.deployParachute();
      }
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