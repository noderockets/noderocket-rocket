var EventEmitter = require('events').EventEmitter;
var Mpu6050 = require('./driver/mpu6050');
var Bmp180 = require('./driver/bmp180');
var Servo = require('./driver/servo');
var util = require('util');
var _ = require('underscore');

var defaults = {
  log: {
    data: console,
    event: console
  },
  data: {
    interval: 65
  },
  altimeter: {
    enabled: true,
    mode: 3,
    buffer: 10
  },
  motion: {
    enabled: true,
    accelerometer: { mode: 3 },
    gyroscope: { mode: 0 },
    warmups: 0,
    debug: false
  },
  servo: {
    initAngle:    170,
    releaseAngle: 5
  }
};

/**
 * NodeRocket
 * @param opts
 * @constructor
 */
var Rocket = function(opts) {
  const BAD_DATA_VALUE_THRESHOLD = 100;
  const BAD_DATA_CNT_THRESHOLD = 4;
  const BAD_DATA_BUFFER_LENGTH = 4;

  var rocket = this;
  var config = _.extend({}, defaults, opts);

  EventEmitter.call(this);
  var altBuffer = [];
  var cnt = 0;
  var badDataCnt = 0;

  var dlog = config.log.data;
  var elog = config.log.event;

  // --- PREPARE ALTIMETER -----------------------------------------------------
  var altimeter = new Bmp180(config.altimeter);
  altimeter.initialize(function(err, calibrationData) {
    if (err) rocket.emit('altimeter.error', err);
    rocket.emit('altimeter.ready');
  });

  // --- PREPARE MOTION SENSOR -------------------------------------------------
  var motion = new Mpu6050(config.motion);
  motion.initialize(function() {
    elog.debug('ROCKET: motion device initialized');
    motion.testAllDeviceFunctionality(function(err, something) {
      elog.debug('ROCKET: motion device tested... \n', something);
      motion.calibrate(function() {
        elog.debug('ROCKET: motion device calibrated.');
        rocket.emit('motion.ready');
      });
    });
  });

  // --- PREPARE SERVO ---------------------------------------------------------

  var servo = new Servo();
  function testServo(angle) {
    servo.setAngle(angle);
    if (angle === 180) servo.disable();
    else setTimeout(function() { testServo(angle + 10); }, 500);
  }
  testServo(0);

  // --- EVENT LISTENERS -------------------------------------------------------

  rocket.once('altimeter.ready', function() {
    elog.info('altimeter.ready');
    setReady('altimeter');
  });

  rocket.on('altimeter.error', function(err) {
    elog.error('altimeter.error');
    elog.error(err);
  });

  rocket.once('motion.ready', function() {
    elog.info('motion.ready');
    setReady('motion');
  });

  rocket.on('motion.error', function(err) {
    elog.error('motion.error');
    elog.error(err);
  });

  rocket.on('rocket.ready', function() {
    elog.warning('rocket.ready');
  });

  rocket.on('rocket.data', function(data) {
    dlog.info(data);
  });

  // --- ROCKET STATE ----------------------------------------------------------
  var state = {
    motion:    false,
    altimeter: false
  };


  // --- Private Utility Functions ---------------------------------------------
  function setReady(system) {
    state[system] = true;
    for (var sys in state) {
      if (!state[sys]) return;
    }
    rocket.emit('rocket.ready');
    state.motion = false;
    state.altimeter = false;
    readData();
  }

  function readData() {
    setInterval(function() {
      altimeter.readData(function(aerr, altitude) {
        motion.getMotion6(function(merr, motion) {
          if (aerr || merr) setError(aerr || merr);
          setData(adaptData(altitude, motion));
        });
      });
    }, config.data.interval);
  }

  function adaptData(altitude, motion) {
    return {
      ax: motion[0].toFixed(4),
      ay: motion[1].toFixed(4),
      az: motion[2].toFixed(4),
      mtmp: motion[3].toFixed(2),
      gx: motion[4].toFixed(4),
      gy: motion[5].toFixed(4),
      gz: motion[6].toFixed(4),
      atmp: altitude.tmp.toFixed(2),
      bp: altitude.bp.toFixed(2),
      alt: fixBadAltitudeReadings(altitude.alt).toFixed(2),
      dt: +new Date
    }
  }

  function fixBadAltitudeReadings(altitude) {
    var alt = altitude;
    if (altBuffer.length < BAD_DATA_BUFFER_LENGTH) altBuffer.push(altitude);
    else {
      if (Math.abs(altitude - altBuffer[(cnt - 1) % BAD_DATA_BUFFER_LENGTH]) > BAD_DATA_VALUE_THRESHOLD &&
          Math.abs(altitude - altBuffer[(cnt - 2) % BAD_DATA_BUFFER_LENGTH]) > BAD_DATA_VALUE_THRESHOLD &&
          Math.abs(altitude - altBuffer[(cnt - 3) % BAD_DATA_BUFFER_LENGTH]) > BAD_DATA_VALUE_THRESHOLD) {
        alt = altBuffer[(cnt - 1) % BAD_DATA_BUFFER_LENGTH];
        dlog.warning('Altitude data error: ' + altitude + ' replaced with ' + alt);
        if (badDataCnt++ > BAD_DATA_CNT_THRESHOLD) altBuffer = [];
      }
      else badDataCnt = 0;
      altBuffer[cnt++ % BAD_DATA_BUFFER_LENGTH] = alt;
    }
    return alt;
  }

  function setError(err) {
    rocket.emit('rocket.error', err);
  }

  function setData(data) {
    rocket.emit('rocket.data', data);
  }

  // --- PUBLIC FUNCTIONS ------------------------------------------------------

  this.armParachute = function() {
    elog.info("ARM PARACHUTE");
    servo.setAngle(0);
    setTimeout(function() { servo.disable }, 500);
  };

  this.deployParachute = function() {
    elog.info("DEPLOY PARACHUTE");
    servo.setAngle(180);
    setTimeout(function() { servo.disable }, 500);
  };
};

util.inherits(Rocket, EventEmitter);
module.exports = Rocket;