var I2cDev = require('./i2cDev');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var _ = require('underscore');

var defaults = {
  debug: false,
  address: 0x77,
  device: '/dev/i2c-1',
  mode: 1,
  seaLevelPressure: 101325
};

var modes = {
  ULTRA_LOW_POWER: 0,
  STANDARD:        1,
  HIGHRES:         2,
  ULTRA_HIGHRES:   3
};

var registers = {
  calibration: {
    ac1:          { location: 0xAA,   read: 'readInt16BE' },
    ac2:          { location: 0xAC,   read: 'readInt16BE' },
    ac3:          { location: 0xAE,   read: 'readInt16BE' },
    ac4:          { location: 0xB0,   read: 'readUInt16BE' },
    ac5:          { location: 0xB2,   read: 'readUInt16BE' },
    ac6:          { location: 0xB4,   read: 'readUInt16BE' },
    b1:           { location: 0xB6,   read: 'readInt16BE' },
    b2:           { location: 0xB8,   read: 'readInt16BE' },
    mb:           { location: 0xBA,   read: 'readInt16BE' },
    mc:           { location: 0xBC,   read: 'readInt16BE' },
    md:           { location: 0xBE,   read: 'readInt16BE' }
  },
  data: {
    control:      { location: 0xF4,   read: 'readInt16BE' },
    temperature:  { location: 0xF6,   read: 'readUInt16BE' },
    pressure:     { location: 0xF6,   read: 'readInt16BE' }
  },
  command: {
    readTemp:     { location: 0x2E,   read: 'readInt16BE' },
    readPresBase: { location: 0x34,   read: 'readInt16BE' }
  }
};

const READ_TEMPERATURE_DELAY_MS = 5;
// Max conversion times 4.5, 7.5, 13.5, 25.5
const READ_PRESSURE_DELAY_MS = [5, 8, 14, 26];

/**
 *
 * @param opts
 * @constructor
 */
function BMP180(opts) {
  console.log('BMP180: Constructor');

  this.options = _.extend({}, defaults, opts);
  this.data = { calibration: {} };

  var cmd = registers.command;
  cmd.readPressure = cmd.readPresBase + (this.mode << 6);

  EventEmitter.call(this);
}

/**
 *
 */
util.inherits(BMP180, EventEmitter);

/**
 * Readies the i2c driver, tests the i2c connection, and calibrates the device
 */
BMP180.prototype.initialize = function(callback) {
  console.log('BMP180: Initialize');

  this.i2cdev = new I2cDev(this.options.address, {
    device: this.options.device,
    debug: this.options.debug
  });

  this.calibrate(callback);

  this.lastTime = process.hrtime();
};

/**
 * Recursively check calibration registers for values until all are set
 */
BMP180.prototype.calibrate = function(callback) {
  console.log('BMP180: Calibrate');

  var device = this;
  var i2c = device.i2cdev;

  var toCalibrate = 0;
  _.each(registers.calibration, function(reg, name) {
    toCalibrate++;

    readRegister(i2c, reg, function(err, value) {
      console.log('BMP180: waitForCalibration ' + name + ': ' + value);
      if (value === 'undefined') {
        setTimeout(device.calibrate(), 5);
      }
      else {
        device.data.calibration[name] = value;
        if (--toCalibrate === 0) callback(false, device.data.calibration);
      }
    });

  });
};

/**
 *
 * @param callback
 */
BMP180.prototype.readData = function(callback) {
  console.log('BMP180: readData');
  var device = this;

  device.readTemperature(function(rawTemperature) {
    device.readPressure(function(rawPressure) {
      callback({
        tmp: device.calcTemperature(rawTemperature),
        bp: device.calcPressure(rawPressure),
        alt: device.calcAltitude(rawPressure)
      });
    });
  });
};

/**
 * Read Uncompensated Temperature Value
 * @param callback
 */
BMP180.prototype.readTemperature = function(callback) {
  var i2c = this.i2cdev;
  var cmd = registers.command;
  var dat = registers.data;
  var time = process.hrtime();

  var tmpcmd = new Buffer([cmd.readTemp]);
  i2c.writeBytes(dat.control.location, tmpcmd, function(err) {
    if (err) throw err;

    setTimeout(function() {
      readRegister(i2c, dat.temperature, function(err, value) {
        callback(value);
      });
      console.log('Read temp delay: ' + process.hrtime(time) + ' (should be 4.5ms)');
    }, READ_TEMPERATURE_DELAY_MS)
  });
};

/**
 *
 * @param raw
 * @returns {number}
 */
BMP180.prototype.calcTemperature = function(raw) {
  var cData = this.data.calibration;

  var x1 = ((raw - cData.ac6) * cData.ac5) >> 15;
  var x2 = (cData.mc << 11) / (x1 + cData.md);
  cData.b5 = x1 + x2;

  return ((cData.b5 + 8) >> 4) / 10.0;
};

/**
 *
 * @param callback
 */
BMP180.prototype.readPressure = function(callback) {
  var i2c = this.i2cdev;
  var cmd = registers.command;
  var dat = registers.data;

  var device = this;
  var time = process.hrtime();

  var tmpcmd = new Buffer([cmd.readPressure]);
  i2c.writeBytes(dat.control.location, tmpcmd, function(err) {
    if (err) throw err;

    setTimeout(function() {
      i2c.readBytes(dat.pressure.location, 3, function(err, bytes) {

        var msb = bytes.readUInt8(0);
        var lsb = bytes.readUInt8(1);
        var xlsb = bytes.readUInt8(2);
        var value = ((msb << 16) + (lsb << 8) + xlsb) >> (8 - device.mode);

        console.log('Read pressure delay: ' + process.hrtime(time) + ' (should be 7.5ms)');
        console.log('Since last time: ' + process.hrtime(time));
        console.log(value);
        device.lastTime = process.hrtime();

        callback(value);
      });
    }, READ_PRESSURE_DELAY_MS[this.mode]);
  });
};

/**
 *
 * @param raw
 * @returns {number}
 */
BMP180.prototype.calcPressure = function(raw) {
  var cData = this.data.calibration;

  var b6 = cData.b5 - 4000;
  var x1 = (cData.b2 * (b6 * b6) >> 12) >> 11;
  var x2 = (cData.ac2 * b6) >> 11;
  var x3 = x1 + x2;
  var b3 = (((cData.ac1 * 4 + x3) << this.options.mode) + 2) / 4;

  x1 = (cData.ac3 * b6) >> 13;
  x2 = (cData.b1 * ((b6 * b6) >> 12)) >> 16;
  x3 = ((x1 + x2) + 2) >> 2;
  var b4 = (cData.ac4 * (x3 + 32768)) >> 15;
  var b7 = (raw - b3) * (50000 >> this.options.mode);
  var p;

  if (b7 < 0x80000000) {
    p = (b7 * 2) / b4;
  } else {
    p = (b7 / b4) * 2;
  }

  x1 = (p >> 8) * (p >> 8);
  x1 = (x1 * 3038) >> 16;
  x2 = (-7375 * p) >> 16;

  p = p + ((x1 + x2 + 3791) >> 4);
  p = p / 100; // hPa

  return p;
};

/**
 *
 * @param pressure
 * @returns {number}
 */
BMP180.prototype.calcAltitude = function(pressure) {
  return 44330 * (1.0 - Math.pow(pressure / this.sealevelPressure, 0.19029495718363));
};

/**
 *
 * @param callback
 */
BMP180.prototype.readAltitude = function(callback) {
  var self = this;
  this.readPressure(function(pressure) {
    callback(self.calcAltitude(pressure));
  });
};


// --- PRIVATE UTILITY FUNCTIONS -----------------------------------------------

/**
 *
 * @param i2c
 * @param register
 * @param callback
 */
function readRegister(i2c, register, callback) {
  i2c.readBytes(register.location, 2, function(err, buffer) {
    callback(err, buffer[register.read](0));
  });
}

module.exports = BMP180;
console.log('BMP180: Loaded driver');
