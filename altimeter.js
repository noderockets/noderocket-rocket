var Cylon = require('cylon');
var events = require('events');
var _ = require('underscore');

function Altimeter(opts) {
    this.config = _.extend({
        dataInterval: 100,
        mode: 1,
        servoInitAngle: 60,
        servoReleaseAngle: 150,
        armAltDelta: 8,
        deployAltDelta: 2,
        testArmAltDelta: 2,
        testDeployAltDelta: 0.5,
        autoResetDelay: 30000
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
  var isTestMode = false;

  Cylon.robot({
    connection: {name: 'raspi', adaptor: 'raspi'},
    devices: [
      { name: 'bmp180',   driver: 'bmp180' },
      { name: 'servo',    driver: 'servo',  pin: 12 },
      { name: 'greenLED', driver: 'led',    pin: 15 },
      { name: 'blueLED',  driver: 'led',    pin: 18 },
      { name: 'greenBtn', driver: 'button', pin: 11 },
      { name: 'blueBtn',  driver: 'button', pin: 16 }
    ],

    work: function (my) {
      Logger.debug('Setting angle to ' + thiz.config.servoInitAngle);

      my.servo.angle(thiz.config.servoInitAngle);

      my.greenLED.turnOn();

      my.blueBtn.on('push', function() {
        thiz.emit('activate');
      });

      var btnFn = toggleTestMode;

      my.greenBtn.on('push', function() {
        btnFn();
      });

      var flashy;
      var armAltDelta = thiz.config.armAltDelta;
      var deployAltDelta = thiz.config.deployAltDelta;

      function toggleTestMode() {
        isTestMode = !isTestMode;
        console.log(isTestMode);
        btnFn = function() {};

        if (isTestMode) thiz.emit('testModeEnabled');
        else thiz.emit('testModeDisabled');

        my.greenBtn.on('release', function() {
          btnFn = toggleTestMode;
        });
      }

      thiz.on('testModeEnabled', function() {
        armAltDelta = thiz.config.testArmAltDelta;
        deployAltDelta = thiz.config.testDeployAltDelta;
        flashy = setInterval(function() {
          my.greenLED.toggle();
        }, 150);
      });

      thiz.on('testModeDisabled', function() {
        armAltDelta = thiz.config.armAltDelta;
        deployAltDelta = thiz.config.deployAltDelta;
        clearInterval(flashy);
        my.greenLED.turnOn();
      });

      thiz.on('init', function () {
        Logger.debug('Setting angle to ' + thiz.config.servoInitAngle);
        my.servo.angle(thiz.config.servoInitAngle);
        activated = false;
        armed = false;
        deployed = false;
        initialAltitude = 0;
        maxAltitude = 0;

        my.blueLED.turnOff();
      });

      thiz.on('parachute', function () {
        Logger.debug('Setting angle to ' + thiz.config.servoReleaseAngle);
        my.blueLED.turnOff();
        my.servo.angle(thiz.config.servoReleaseAngle);

        setTimeout(function() {
          thiz.emit('init');
        }, thiz.config.autoResetDelay);
      });

      thiz.on('activate', function () {
        Logger.debug('Activated');
        my.blueLED.turnOn();
        activated = true;
      });

      // This doesn't really do anything except notify clients that this has been done;
      thiz.emit('init');

      every(thiz.config.dataInterval, function () {
        my.bmp180.getAltitude(thiz.config.mode, null, function (err, val) {

          if(!!err) {
            console.log(err);
          } else {
//            Logger.debug('Raw Alititude: ' + val.alt);

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

//              Logger.debug('High Altitude: ' + max);
//              Logger.debug('Low Altitude: ' + min);
//              Logger.debug('Averaged Altitude: ' + avg);

              thiz.emit('data', avg);

              if (activated) {

                if (armed === false && (avg - initialAltitude >= armAltDelta)) {
                  armed = true;
                  thiz.emit('armed');
                }
                else if (armed === true && deployed !== true) {
                  if (avg > maxAltitude) {
                    maxAltitude = avg;
                    thiz.emit('maxAltitude', {alt: maxAltitude});
                  }
                  else if (maxAltitude - avg >= deployAltDelta) {
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
  };

  this.setServoReleaseAngle = function (angle) {
    this.config.servoReleaseAngle = angle;
  };
}

Altimeter.prototype.__proto__ = events.EventEmitter.prototype;

module.exports = Altimeter;
