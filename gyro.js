/**
 * Created by validity on 3/20/14.
 */
var Cylon = require('cylon');
var events = require('events');
var _ = require('underscore');

function Gyro(opts) {
  this.config = _.extend({
    dataInterval: 100,
    mode: 1
  }, opts);

  events.EventEmitter.call(this);
  var thiz = this;

  Cylon.robot({
    connection:{name:'raspi', adaptor:'raspi'},
    devices:[
      {name:'gyro', driver:'l3g4200d'}
    ],

    work: function(my) {
      setTimeout(function() {
        console.log('Stopping...');
        my.gyro.stopGyroValues();
      }, 2000);

      my.gyro.pollGyroValues(function(gyro) {
        if (Math.abs(gyro[0]) > 1.5 || Math.abs(gyro[1]) > 1.5 || Math.abs(gyro[2]) > 1.5) {
          gyro[0] = gyro[0].toPrecision(4);
          gyro[1] = gyro[1].toPrecision(4);
          gyro[2] = gyro[2].toPrecision(4);
          console.dir(gyro);
        }
      });
    }
  }).start();
}

Gyro.prototype.__proto__ = events.EventEmitter.prototype;

module.exports = Gyro;

// For testing
var gyro = new Gyro();
