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
    launchThreshold: 4
  }, opts);

  var thiz = this;
  var altBuffer = [];

  var data = {
    launched: false,
    deployed: false
  };

  var robot = Cylon.robot({
    connection: {name: 'raspi', adaptor: 'raspi'},
    devices: [
      { name: 'bmp180',   driver: 'bmp180' },
      { name: 'servo',    driver: 'servo',  pin: 12 },
      { name: 'statusLed', driver: 'led',    pin: 15 },
      { name: 'statusLed2', driver: 'led',    pin: 18 },
      { name: 'btn1', driver: 'button',    pin: 11 },
      { name: 'btn2', driver: 'button',    pin: 16 }
    ],

    work: function(my) {
      my.statusLed.turnOn();

      my.btn1.on('push', function() {
        //console.log('BUTTON 1 PUSHED');
        thiz.emit('btn1-pushed');
        robot.armParachute();
      });

      my.btn2.on('push', function() {
        console.log('BUTTON 2 PUSHED');
        thiz.emit('btn2-pushed');
      });

      // Read sensor data
      every(100, function() {
        my.bmp180.getAltitude(1, null, function(err, values) {
          if(err){ console.log(err) }
          else {
            data.temperature = values.temp;
            data.pressure = values.press;
            data.altitude = values.alt;

            // Detect launch
            if(!data.launched) {
              altBuffer.push(values.alt);
              if (altBuffer.length > 10) {
                altBuffer = altBuffer.slice(-10);
                if (altBuffer[9] - altBuffer[0] > config.launchThreshold) {
                  data.launched = true;
                  thiz.emit('launch');
                }
              }
            }
          }
        });
      });

      // Emit sensor data
      every(config.dataInterval, function() {
        thiz.emit('data', data);
      });
    },

    armParachute: function() {
      robot.servo.angle(config.servoInitAngle);
      robot.statusLed2.turnOn();
      data.launched = data.deployed = false;
      thiz.emit('parachute-armed');
    },

    deployParachute: function() {
      robot.servo.angle(config.servoReleaseAngle);
      robot.statusLed2.turnOff();
      data.deployed = true;
      thiz.emit('parachute-deployed');
    }
  });

  robot.start();

  function shutdown() {
    robot.statusLed1.turnOff();
    robot.statusLed2.turnOff();
  }

  this.armParachute = robot.armParachute;
  this.deployParachute = robot.deployParachute;
  this.shutdown = shutdown;
}

util.inherits(Rocket, EventEmitter);

module.exports = Rocket;