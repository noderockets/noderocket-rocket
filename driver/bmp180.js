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
  this.options = _.extend({}, defaults, opts);
  this.data = { calibration: {} };

  var cmd = registers.command;
  cmd.readPressure = [cmd.readPresBase.location + (this.options.mode << 6)];

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
  this.i2cdev = new I2cDev(this.options.address, {
    device: this.options.device,
    debug: this.options.debug
  });

  this.calibrate(callback);
};

/**
 * Recursively check calibration registers for values until all are set
 */
BMP180.prototype.calibrate = function(callback) {
  var device = this;
  var i2c = device.i2cdev;

  var toCalibrate = 0;
  _.each(registers.calibration, function(reg, name) {
    toCalibrate++;

    readRegister(i2c, reg, function(err, value) {
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
  var device = this;
  var time = process.hrtime();

  device.readTemperature(function(rawTemperature) {
    device.readPressure(function(rawPressure) {
      var tmp = device.calcTemperature(rawTemperature);
      var bp = device.calcPressure(rawPressure);
      var alt = device.calcAltitude(bp);
      callback(null, { tmp: tmp, bp: bp, alt: alt });
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

  i2c.writeBytes(dat.control.location, [cmd.readTemp.location], function(err) {
    if (err) throw err;

    setTimeout(function() {
      readRegister(i2c, dat.temperature, function(err, value) {
        callback(value);
      });
    }, READ_TEMPERATURE_DELAY_MS)
  });
};

/**
 * Pre-calculate these values.
 * Although these calculations are very fast, they are pre-calculated because
 * this driver may be running every 10ms.  So it is important to make it as
 * performant as possible
 * @type {number}
 */
const PRE_CALCULATED_2TO15POW = Math.pow(2, 15);
const PRE_CALCULATED_2TO11POW = Math.pow(2, 11);
const PRE_CALCULATED_2TO04POW = Math.pow(2, 4);
/**
 * Calculate the temperature in Centegrade.  The datasheet provides this
 * calculation, but expects the result to be an integer that represents 0.1
 * degree.  It is divided by 10 so that we have an actual temperature.
 * @param raw
 * @returns {number}
 */
BMP180.prototype.calcTemperature = function(raw) {
  var cData = this.data.calibration;

  var x1 = ((raw - cData.ac6) * cData.ac5) / PRE_CALCULATED_2TO15POW;
  var x2 = (cData.mc * PRE_CALCULATED_2TO11POW) / (x1 + cData.md);
  cData.b5 = x1 + x2;

  return (cData.b5 + 8) / PRE_CALCULATED_2TO04POW / 10;
};

/**
 * Read uncompensated pressure value
 * @param callback
 */
BMP180.prototype.readPressure = function(callback) {
  var i2c = this.i2cdev;
  var cmd = registers.command;
  var dat = registers.data;

  var device = this;

  i2c.writeBytes(dat.control.location, cmd.readPressure, function(err) {
    if (err) throw err;

    setTimeout(function() {
      i2c.readBytes(dat.pressure.location, 3, function(err, data) {
        var value = ((data[0] << 16) + (data[1] << 8) + data[2]) >> (8 - device.options.mode);
        callback(value);
      });
    }, READ_PRESSURE_DELAY_MS[device.options.mode]);
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
  //p = p / 100; // hPa

  return p;
};

/**
 *
 * @param pressure
 * @returns {number}
 */
BMP180.prototype.calcAltitude = function(pressure) {
  var posl = pressure / this.options.seaLevelPressure;
  var powr = Math.pow(posl, 0.19029495718363);
  var val = 44330 * (1 - powr);

  return val;
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