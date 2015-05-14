var EventEmitter = require('events').EventEmitter;
var Mpu6050 = require('./driver/mpu6050');
var Bmp180 = require('./driver/bmp180');
var util = require('util');
var _ = require('underscore');

var defaults = {
  log: {
    data: console,
    event: console
  },
  data: {
    interval: 50
  },
  altimeter: {
    enabled: true,
    mode: 1,
    buffer: 10
  },
  motion: {
    enabled: true,
    accelerometer: { mode: 3 },
    gyroscope: { mode: 0 },
    debug: true
  },
  servo: {
    initAngle:    170,
    releaseAngle: 5
  },
  launchThreshold: 3
};

/**
 * NodeRocket
 * @param opts
 * @constructor
 */
var Rocket = function(opts) {
  const TEST_DURATION_IN_MS = 1000;
  var rocket = this;

  var config = _.extend({}, defaults, opts);


  var altimeter = new Bmp180(config.altimeter);
  var motion = new Mpu6050(config.motion);
  EventEmitter.call(this);

  var dlog = config.log.data;
  var elog = config.log.event;

  // --- PREPARE ALTIMETER -----------------------------------------------------
  altimeter.initialize(function(err) {
    console.log('Rocket: Altimeter Initialized');
    if (err) rocket.emit('altimeter.error', err);
    rocket.emit('altimeter.ready');
  });

  // --- PREPARE MOTION SENSOR -------------------------------------------------
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

  function setData(system, data) {
    console.log('ROCKET: setData(' + system + ', ' + data + ')');

    state[system] = data;
    for (var sys in state) {
      if (!state[sys]) return;
    }
    state.dt = +new Date;
    rocket.emit('rocket.data', state);
    state.motion = false;
    state.altimeter = false;
  }

  function readData() {
    setInterval(function() {

      altimeter.read(function(data) {
        setData('altimeter', data);
      });

      motion.getMotion6(function(err, data) {
        setData('motion', adaptData(data));
      });

    }, config.data.interval);
  }

  function adaptData(data) {
    return {
      ax: data[0],
      ay: data[1],
      az: data[2],
      temp: data[3],
      gx: data[4],
      gy: data[5],
      gz: data[6]
    }
  }
};

Rocket.prototype.armParachute = function() {
  console.log("ARM PARACHUTE");
};

Rocket.prototype.deployParachute = function() {
  console.log("DEPLOY PARACHUTE");
};

util.inherits(Rocket, EventEmitter);
module.exports = Rocket;