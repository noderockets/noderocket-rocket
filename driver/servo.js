/**
 * Created by validity on 5/18/15.
 */
var servoblaster = require('./servoblaster.js');
var _ = require('underscore');

/**
 *  Servo number    GPIO number   Pin in P1 header
 *       0               4             P1-7
 *       1              17             P1-11
 *       2              18             P1-12
 *       3             21/27           P1-13
 *       4              22             P1-15
 *       5              23             P1-16
 *       6              24             P1-18
 *       7              25             P1-22
 */
var defaults = {
  no:    1,
  range: 180,
  hardware: {
    low:  5,
    high: 100
  }
};

function Servo(opts) {
  _.extend(this, defaults, opts);
  this.hardware.range = this.hardware.high - this.hardware.low;
  this.hardware.unit = this.hardware.range / this.range;
}

Servo.prototype.setAngle = function(angle, callback) {
  var level = this.getLevelForAngle(angle) + '%';
  servoblaster.setPwm(this.no, level, callback);
};

Servo.prototype.disable = function(callback) {
  servoblaster.setPwm(this.no, 0, callback);
};

Servo.prototype.getLevelForAngle = function(angle) {
  return ((angle * this.hardware.unit) + this.hardware.low).toFixed(4);
};

module.exports = Servo;