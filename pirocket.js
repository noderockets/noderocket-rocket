var Cylon = require('cylon');
var EventEmitter = require('events').EventEmitter;
var _ = require('underscore');
var util = require('util');

function Rocket(opts) {
  EventEmitter.call(this);

  var config = _.extend({
    dataInterval: 100,
    mode: 1,
    servoInitAngle: 170,
    servoReleaseAngle: 5,
    launchThreshold: 3
  }, opts);

  var thiz = this;

  var data = {
    launched: false,
    deployed: false
  };

  var robot = Cylon.robot({
    connection: {name: 'raspi', adaptor: 'raspi'},
    devices: [
      { name: 'bmp180',   driver: 'bmp180' },
      { name: 'servo',    driver: 'servo',  pin: 12 }
    ],

    work: function(my) {
      // Read sensor data
      every(100, function() {
        my.bmp180.getAltitude(1, null, function(err, values) {
          if(err){ console.log(err) }
          else {
            data.temperature = values.temp;
            data.pressure = values.press;
            data.altitude = values.alt;
          }
        });
      });

      // Emit sensor data
      every(config.dataInterval, function() {
        thiz.emit('data', data);
      });

      // Listen for launch detection
      thiz.on('launched', function() { data.launched = true });
    },

    armParachute: function() {
      robot.servo.angle(config.servoInitAngle);
      data.launched = data.deployed = false;
      thiz.emit('parachute-armed');
    },

    deployParachute: function() {
      robot.servo.angle(config.servoReleaseAngle);
      data.deployed = true;
      thiz.emit('parachute-deployed');
    }
  });

  robot.start();

  this.armParachute = robot.armParachute;
  this.deployParachute = robot.deployParachute;
}

util.inherits(Rocket, EventEmitter);

module.exports = Rocket;