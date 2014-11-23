var Cylon = require('cylon');
var EventEmitter = require('events').EventEmitter;
var _ = require('underscore');
var util = require('util');

function Rocket(opts) {
  EventEmitter.call(this);

  var config = _.extend({
    dataInterval: 100,
    mode: 1,
    servoInitAngle: 150,
    servoReleaseAngle: 65,
    armAltDelta: 8,
    deployAltDelta: 2,
    autoResetDelay: 30000
  }, opts);

  var thiz = this;
  var altBuffer = [];

  var robot = Cylon.robot({
    connection: {name: 'raspi', adaptor: 'raspi'},
    devices: [
      { name: 'bmp180',   driver: 'bmp180' },
      { name: 'servo',    driver: 'servo',  pin: 12 },
      { name: 'statusLed', driver: 'led',    pin: 15 }
    ],

    work: function(my) {
      my.statusLed.turnOn();

      every(config.dataInterval, function() {
        my.bmp180.getAltitude(1, null, function(err, values) {
          if(err){ console.log(err) }
          else {
            thiz.emit('data', values);

            // Detect launch
            altBuffer.push(values.alt);
            if(altBuffer.length > 5) {
              altBuffer = altBuffer.slice(-5);
              if(altBuffer[4] - altBuffer[0] > 2) {
                thiz.emit('launch');
              }
            }
          }
        })
      });
    },

    armParachute: function() {
      robot.servo.angle(config.servoInitAngle);
    },
    deployParachute: function() {
      robot.servo.angle(config.servoReleaseAngle);
    }
  });

  robot.start();

  this.armParachute = robot.armParachute;
  this.deployParachute = robot.deployParachute;
}

util.inherits(Rocket, EventEmitter);

module.exports = Rocket;