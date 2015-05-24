var util = require('util');

function RocketModule(name, rocket, io, app) {
  this.rocket = rocket;
  this.io = io;
  this.app = app;
  this.enabled = false;
  this.name = name;
}

RocketModule.prototype.enable = function () {
  this.log('[%s] enable', this.name);
  this.doEnable();
  this.enabled = true;
};

RocketModule.prototype.disable = function () {
  this.log('[%s] disable', this.name);
  this.doDisable();
  this.enabled = false;
};

RocketModule.prototype.getName = function() {
  return this.name;
};

RocketModule.prototype.isEnabled = function() {
  return this.enabled;
};

RocketModule.prototype.log = function() {
  console.log(util.format.apply(this, arguments));
};


module.exports = RocketModule;