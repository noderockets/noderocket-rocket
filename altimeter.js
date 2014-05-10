var Cylon = require('cylon');
var events = require('events');
var _ = require('underscore');

function Altimeter(opts) {
    this.config = _.extend({
        dataInterval: 100,
        mode: 1,
        servoInitAngle: 150,
        servoReleaseAngle: 60,
        armAltDelta: 3,
        deployAltDelta: 2
    }, opts);

  events.EventEmitter.call(this);
  var thiz = this;
  var activated = false;
  var armed = false;
  var deployed = false;
  var initialAltitude = null;
  var maxAltitude = null;
  var altitudeBuffer = [];
  var cnt = 0;

  Cylon.robot({
    connection: {name: 'raspi', adaptor: 'raspi'},
    devices: [
      { name: 'bmp180', driver: 'bmp180' },
      { name: 'servo', driver: 'servo', pin: 12 },
      { name: 'statusLed', driver: 'led', pin: 13 }
    ],

    work: function (my) {
      Logger.debug('Setting angle to ' + thiz.config.servoInitAngle);

      my.servo.angle(thiz.config.servoInitAngle);

      my.statusLed.turnOn();

      thiz.on('init', function () {
        Logger.debug('Setting angle to ' + thiz.config.servoInitAngle);
        my.servo.angle(thiz.config.servoInitAngle);
        activated = false;
        armed = false;
        deployed = false;
        initialAltitude = null;
        maxAltitude = null;
      });
      thiz.on('parachute', function () {
        Logger.debug('Setting angle to ' + thiz.config.servoReleaseAngle);
        my.servo.angle(thiz.config.servoReleaseAngle);
      });
      thiz.on('activate', function () {
        Logger.debug('Activated');
        activated = true;
      });
      every(thiz.config.dataInterval, function () {
        my.bmp180.getAltitude(thiz.config.mode, null, function (err, val) {

          if(!!err) {
            console.log(err);
          } else {
            Logger.debug('Raw Alititude: ' + val.alt);

            altitudeBuffer[cnt++ % 5] = val.alt;

            if (cnt > 4) {
              var min = 50000;
              var max = 0;

              for(var i = 0; i < altitudeBuffer.length; i++) {
                var value = altitudeBuffer[i];
                if(value < min) {
                  min = value;
                } else if(value > max) {
                  max = value;
                }
              }

              var total = altitudeBuffer[0] + altitudeBuffer[1] + altitudeBuffer[2] +
                altitudeBuffer[3] + altitudeBuffer[4] - min - max;

              var avg = total / 3;

              if (!initialAltitude) initialAltitude = avg;

              Logger.debug('High Altitude: ' + max);
              Logger.debug('Low Altitude: ' + min);
              Logger.debug('Averaged Altitude: ' + avg);

              thiz.emit('data', avg);

              if (activated) {

                if (armed === false && (avg - initialAltitude >= thiz.config.armAltDelta)) {
                  armed = true;
                  thiz.emit('armed');
                }
                else if (armed === true && deployed !== true) {
                  if (avg > maxAltitude) {
                    maxAltitude = avg;
                    thiz.emit('maxAltitude', {alt: maxAltitude});
                  }
                  else if (maxAltitude - avg >= thiz.config.deployAltDelta) {
                    thiz.emit('parachute', {alt: avg});
                    deployed = true;
                  }
                }
              }
            }
          }
        });
      });
    }
  }).start();

  this.setServoInitAngle = function (angle) {
    this.config.servoInitAngle = angle;
  }

  this.setServoReleaseAngle = function (angle) {
    this.config.servoReleaseAngle = angle;
  }
}

Altimeter.prototype.__proto__ = events.EventEmitter.prototype;

module.exports = Altimeter;
