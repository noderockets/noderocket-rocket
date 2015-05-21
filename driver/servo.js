/**
 * Created by validity on 5/18/15.
 */
var piblaster = require('./pi-blaster.js');
var _ = require('underscore');

var defaults = {
  pin:   17,
  range: 180,
  hardware: {
    low:  .06,
    high: .25
  }
};

function Servo(opts) {
  _.extend(this, defaults, opts);
  this.hardware.range = this.hardware.high - this.hardware.low;
  this.hardware.unit = this.hardware.range / this.range;
}

Servo.prototype.setAngle = function(angle, callback) {
  var level = this.getLevelForAngle(angle);
  piblaster.setPwm(this.pin, level, callback);
};

Servo.prototype.disable = function(callback) {
  piblaster.setPwm(this.pin, 0, callback);
};

Servo.prototype.getLevelForAngle = function(angle) {
  return ((angle * this.hardware.unit) + this.hardware.low).toFixed(4);
};

module.exports = Servo;