var util = require('util');
var RocketModule = require('../rocket-module');

function ExampleModule(rocket, io) {
  RocketModule.call(this, "example", rocket, io);
  var module = this;

  this.onRocketReady = function() {
    module.log('[%s] Got rocket ready event', module.getName());
  };

  this.onRocketData = function(data) {
    module.log('[%s] Got rocket data: %j', module.getName(), data);
    io.sockets.emit('my-custom-event', "test");
  };

  this.enable();
}

util.inherits(ExampleModule, RocketModule);

ExampleModule.prototype.doEnable = function() {
  if(!this.enabled) {
    this.rocket.on('rocket.ready', this.onRocketReady);
    this.rocket.on('rocket.data', this.onRocketData);
  }
};

ExampleModule.prototype.doDisable = function() {
  if(this.enabled) {
    this.rocket.removeListener('rocket.ready', this.onRocketReady);
    this.rocket.removeListener('rocket.data', this.onRocketData);
  }
};

module.exports = ExampleModule;